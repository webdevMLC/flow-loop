# Flow

One development loop for Claude Code. Four gates, hard loop guards, and a TDD rule that is
actually enforced by a hook instead of politely suggested.

Flow replaces the common practice of stacking separate memory, planning, context, TDD and
review frameworks on top of each other. That stacking is expensive twice over: every plugin's
skill listing loads into every session, and every extra phase command is another round trip
in a conversation that re-sends itself each turn.

```
FRAME  ->  BUILD  ->  CHECK  ->  SHIP
  ^                     |
  +--- only on a CHECK failure that changes the goal
```

## Triage - not every task deserves four gates

The first thing Flow does is size the work. This is where most of the speed comes from.

| Size | Looks like | Path |
|------|-----------|------|
| **Direct** | a question, a typo, a rename, a one-line fix | just do it - no gates, no state file |
| **Quick** | one file, clear requirement, no new interface | BUILD then SHIP; still test-first if it is logic |
| **Full** | several files, a new interface, money/auth/data | all four gates |

Running the full loop on a typo is the most expensive mistake available, and the easiest to
make. Frameworks that offer only one path make it constantly.

## Install

```
/plugin marketplace add webdevMLC/flow-loop
/plugin install flow@flow-loop
```

Restart the session so the hook loads. The skill is then `flow:loop`.

## Requirements

| Needs | For | Without it |
|---|---|---|
| Claude Code | everything | - |
| **Node 16+** | the TDD gate hook | **the gate fails open** - see below |
| git | the SHIP gate, and resume's state-vs-repo check | those steps do not apply |

Nothing else. The hook uses only Node built-ins - no npm packages, no `node_modules`.

**If Node is missing, the TDD gate silently stops enforcing.** A hook whose command cannot
run fails open: writes succeed and nothing announces that the gate is inactive. That is the
safe failure mode - a broken install never bricks your editing - but it means you should
confirm `node --version` reports 16 or higher rather than assuming you are protected.

## What you get

| Gate | Produces | Model tier | Budget |
|------|----------|-----------|--------|
| FRAME | goal + task list in `.flow/STATE.md` | cheap / inline | 1 recall + 1 survey + 1 question batch |
| BUILD | working code + tests | frontier | no research; assumptions already fixed |
| CHECK | one verdict report | cheap subagents, parallel | 1 pass + 1 targeted re-verify |
| SHIP | commit / PR + memory write | inline | 1 pass |

**Protocols load only when you reach them.** One entry in the skill listing, ~110 resident
lines. The gate protocols, the debugging cycle, and the resume procedure sit in reference
files that are read only when the situation calls for them - a debugging protocol costs
nothing until there is a bug.

| Situation | Loads |
|-----------|-------|
| FRAME / BUILD / SHIP | `references/gates.md` |
| CHECK | `references/review.md` |
| the goal is not clear yet | `references/brainstorm.md` |
| a bug or test failure | `references/debug.md` |
| resuming, or about to compact | `references/resume.md` |
| running tasks concurrently | `references/parallel.md` |
| running unattended | `references/autonomous.md` |
| state format, milestones | `references/state.md` |

**Parallel by default, in two tiers.** Independent operations are batched into one message -
free, no agents, and most of the wall-clock win in a normal phase. Beyond that, tasks with
disjoint file sets can run as concurrent background agents, which buys wall-clock and costs
tokens, so it is opt-in and gated: three or more ready tasks, delegation that is
context-positive (self-contained against a frozen contract, and it moves reading off your
plate rather than duplicating what you already hold), no shared files, and any shared
contract - schema, types, barrels - committed first as its own wave. Agents never
commit - the orchestrator does, one commit per task, so history stays serial while work is
parallel. Two tasks that would need to renegotiate mid-flight are one task.

**Does not assume you know what you are building.** When the goal cannot be stated in one
checkable sentence, Flow brainstorms before it frames: problem before solution, two or three
genuinely different approaches, explicit exclusions, converging in at most three rounds. A
request that sounds specific - "add a dashboard", "make onboarding better" - is not a goal,
and framing it anyway produces a confident plan for the wrong problem.

**Match before you write.** FRAME names the closest existing analog for every new file, so
new code looks like the code around it and is not rewritten later.

**Autonomous when you say so.** Opt in with a phrase or a `.flow/autonomous` file and Flow
runs task after task without stopping to ask, reporting once at the end. Questions become
assumptions recorded in the state file - the report leads with them, since that is where you
find out it guessed wrong.

Autonomy covers *building*. It never covers pushing, opening a PR, deploying, publishing,
force-pushing, deleting data, touching secrets, spending money, or a scope that turned out
much larger than framed - those still stop and ask. It also refuses to start from an unclear
goal: running unattended from a vague brief does not save time, it builds the wrong thing
faster and with more commits to unwind.

**One state file.** `.flow/STATE.md` per project holds the goal, acceptance criteria, task
list, assumptions and decisions. It replaces `.planning/` trees, phase directories, and
separate plan documents. It is small on purpose - it is read at the start of every session.

**Eight loop guards.** The expensive failure mode is not model choice, it is repeated work:
re-verifying what already passed, researching the same fact twice, a third silent debug
attempt, spawning a subagent whose prompt costs more than reading three files yourself.
The guards cut each of those off explicitly, with a red-flags table for the rationalisations
that precede them.

## The TDD gate

`hooks/flow-tdd-gate.mjs` runs on `PreToolUse` for `Write|Edit`. It denies writes to a
guarded source file when no test covering it exists.

Guarded: `ts tsx js jsx mjs cjs py go rb php java cs`.

Exempt: test files themselves, `*.config.*`, `*.d.ts`, `*.stories.*`, generated code, and
`index` / `types` / `constants` / `setup` / `main` / `app` / `layout` / `page` entry points,
plus `node_modules`, `dist`, `build`, `.next`, `out`, `coverage`, `vendor`, `migrations`,
`scripts`, `public`, `docker` and generated trees. That approximates the skill's own scope:
TDD is mandatory for rules, money, auth, transforms, state machines and API contracts, and
not required for config, glue, scaffolding or markup.

A test counts as covering a source file by either of two passes:

1. **Name** (no file reads). The test filename starts with the source name, or shares a token
   with it. Tokens are split on `-`, `_` and camelCase, singularised, and generic ones
   (`index`, `types`, `utils`, `data`, `config`...) are ignored. So
   `booking-events-idempotency.test.ts` covers `booking-events.ts`, and
   `lead-claim-rejection.test.ts` covers `claims.ts` via the token `claim`. For framework
   files whose basename carries no meaning - Next.js `route.ts`, `middleware.ts` - the tokens
   come from the route segment instead.
2. **Symbol** (bounded reads, only if pass 1 finds nothing). A test file that mentions one of
   the source file's exported identifiers. Catches tests that import through a barrel, or
   integration tests that share no filename token.

A new logic file in a project with no related test is denied. That is the point.

### When the gate is wrong

It matches on names and symbols, so it can be. In order of preference:

- The file is genuinely outside TDD scope: add its directory to `EXEMPT_DIR` in the hook.
- The whole project needs it off: create `.flow/tdd-off` in the project root.
- One-off: `FLOW_TDD_OFF=1`.

The gate is deliberately looser than exact-name matching. A gate that blocks legitimate work
gets switched off entirely, which enforces nothing.

## Using it

Say what you are building and the skill triggers on its own, or invoke it directly:

```
/flow:loop add refund handling to the ledger
```

With no `.flow/STATE.md` the project is unframed, so it starts at FRAME.

## If you are coming from a framework stack

Flow is meant to replace them, not sit alongside them. Running Flow's gates *and* a separate
planning framework's phase commands duplicates the work Flow exists to remove. Disable the
ones it supersedes in `~/.claude/settings.json`.

Keep anything that genuinely saves context rather than spending it - a sandboxed
execution/search layer is complementary, and Flow's token rules assume one may be present
while working correctly without it.

## What this is, and what it is not

Flow is a distillation, not a bundle. It contains no code from any other plugin, and
installing it installs nothing else. What it carries is the *practice* those tools encoded,
rewritten as one protocol:

| Idea from | What Flow keeps | What it drops |
|---|---|---|
| phase-based planning frameworks | the loop, compressed to 4 gates and one state file | dozens of commands, agent fleets, `.planning/` trees |
| TDD skill libraries | test-first scoped to logic, plus the enforcing hook | the surrounding skill catalogue |
| multi-agent review tools | the three review lenses as one CHECK pass | the orchestration layer |
| session-memory plugins | two touchpoints: recall at FRAME, write at SHIP | the persistence engine itself |
| context-saving MCP servers | the token rules, as ambient guidance | the sandbox and the search index |

The last two rows matter: a skill file cannot replace a running MCP server. If you want
sandboxed execution or durable cross-session memory, install those separately - Flow detects
and uses them when present, and works without them.

## Honest limits

- **This is a skill plus one hook, not a framework.** The gates and guards are instructions
  Claude follows. Only the TDD rule is mechanically enforced; the rest is discipline.
- **The gate is heuristic.** See the escape hatches above.
- **No benchmark.** The structural savings - fewer round trips, a smaller resident skill
  listing, progressive disclosure - are real and mechanical. Whether your work lands faster
  is not something this README can honestly claim for you.

## License

MIT

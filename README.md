# Flow

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FwebdevMLC%2Fflow-loop%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&color=blue)](https://github.com/webdevMLC/flow-loop/blob/main/.claude-plugin/plugin.json)

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

## Two speeds

Flow runs **sequentially by default** — one agent, one task at a time. That is the cheapest
option per unit of work, and on a dependency chain it is also the fastest, because four
agents on four tasks that must happen in order finish no sooner.

**Fleet mode** is the other option: many agents at once, in isolated git worktrees, for when
finishing sooner is worth more to you than the tokens it costs.

| | Sequential (default) | Fleet mode (opt-in) |
|---|---|---|
| Agents | one | many, sized to your budget |
| Token cost | lowest | modestly higher, if briefed properly |
| Wall-clock | one task at a time | many at once, where the work allows |
| Worth it when | most of the time | independent work, and your time is worth more than the spend |
| Needs a budget | no | **yes — it refuses below ~1.6M** |

Fleet mode is **not cheaper** than sequential — it buys elapsed time, and only on work that
is genuinely parallel. But how much more it costs is mostly a design choice, not a law.

The waste in a naive fleet is not the parallelism, it is **duplicated context loading**: five
agents each reading the same schema, conventions and analog file pay five times for one act
of reading, and that dwarfs the code they write. So the orchestrator reads once and inlines
it — actual contract signatures, actual analog file contents, the cached conventions from
`.flow/PROJECT.md` — into every brief, and tells each agent it already has everything.
Paths make an agent go read; content means it does not.

With that, plus capped structured returns, tier routing by task class, and one CHECK per
wave rather than per task, fleet mode costs modestly more than sequential and finishes
substantially sooner. Briefed carelessly it costs several times more for the same work. The
difference is almost entirely in the brief.

Pointed at a dependency chain it helps regardless of briefing — it checks the file sets
first and declines rather than pretending.

Details, including the merge protocol and where it declines: [Fleet mode](#fleet-mode--many-agents-at-once).

## Install

### Claude Code

```
/plugin marketplace add https://github.com/webdevMLC/flow-loop.git
/plugin install flow@flow-loop
```

Use the full URL with the `.git` suffix. The `owner/repo` shorthand is not reliably accepted
and reports "Unable to load plugin".

If the marketplace is already registered and you want to re-add it, remove it first —
adding an existing one fails rather than doing nothing.

Restart the session so the hooks load. The skill is then `flow:loop`.

### Codex

Install the repository as a plugin - `.codex-plugin/plugin.json` declares the skills and
both hooks, using `${PLUGIN_ROOT}` and Codex tool names (`apply_patch`, `local_shell`).

### Cursor, Zed, Aider, Gemini CLI, or anything else that reads AGENTS.md

Copy `AGENTS.md` into your project root (or append it to the one you have) and copy
`skills/loop/references/` alongside it. That is the whole protocol; the reference files are
loaded on demand exactly as they are under Claude Code.

### What ports, and what does not

| | Protocol | TDD gate | Commit gate |
|---|---|---|---|
| Claude Code | yes | enforced | enforced |
| Codex | yes | manifest provided, unverified against a live install |  same |
| Everything reading AGENTS.md | yes | discipline | discipline |

The hooks are plain Node with no dependencies. They read a `{tool_name, tool_input}`
envelope on stdin and print JSON only when denying, so any host that can run a command
before a file write can use them. Field naming differs by platform and both hooks accept
the known spellings (`file_path`, `path`, `filePath`, `target_file`, `file`; string or
argv-array commands), failing open on anything unrecognised rather than guessing.

## Adopting it in a project that already exists

Installing the plugin changes nothing on its own. **Both gates stay dormant until the project
has a `.flow/` directory**, so a repository that has not opted in behaves exactly as it did
before — no denied writes, no commit checks. Adoption is a deliberate act, not a side effect
of installing.

To adopt an existing codebase, point Flow at it and say what you want built next:

```
/flow:loop frame the next piece of work in this repo
```

FRAME writes two files. On a codebase that already builds, its survey is about what is
*already true* rather than what to design:

| File | Holds | Why it matters later |
|---|---|---|
| `.flow/STATE.md` | goal, acceptance criteria, task list, decisions, assumptions | every later session and every `/loop` wake restores from this one read |
| `.flow/PROJECT.md` | `test_fast`, typecheck and lint commands, conventions, analog files | without it the commit gate runs no tests, and every wake re-derives the commands |

You can also write both by hand — they are plain markdown, and the format is in
`skills/loop/references/state.md`.

### Legacy code that will never have tests

This is the part that bites on an inherited codebase. Once `.flow/` exists the TDD gate is
live, and it will deny an edit to any source file with no covering test — including code that
predates you by years.

List those paths in `.flow/tdd-exempt`, one fragment per line:

```
# inherited, tested manually against staging
legacy/
src/vendored-parser
```

It lives in the repository, so it survives plugin updates and shows up in review — unlike the
older advice to edit `EXEMPT_DIR` inside the plugin, which was silently discarded on every
upgrade. `.flow/tdd-off` still suspends the gate entirely, and `FLOW_TDD_OFF=1` suspends it
for one command; prefer the exempt list, because it says *which* code is exempt and why.

The honest way to adopt a large untested codebase is to exempt the old code and let the gate
hold the line on everything new. Retrofitting tests to all of it first is a project, not a
setup step.

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

### Platform support

| | Skill | TDD gate hook |
|---|---|---|
| **Windows** | tested | tested (with Git Bash present) |
| **macOS** | expected | expected - untested |
| **Linux** | expected | expected - untested |

Being straight about that table: this was built and exercised on Windows. Nothing in it is
platform-specific, but "expected" means reasoned, not run.

- The skill is plain markdown. It has no platform surface at all.
- The hook uses only `node:fs` and `node:path`. It normalises Windows backslashes to forward
  slashes before any comparison and lowercases every name it matches, so it behaves the same
  on case-insensitive (Windows, default macOS) and case-sensitive (Linux) filesystems -
  though on Linux that makes it marginally more lenient than the filesystem itself.
- On Windows **without** Git Bash, Claude Code runs hook commands through PowerShell. The
  invocation is `node "<absolute path>"`, which is valid there, but that path is untested.

Suspending the gate for a single command differs by shell:

| Shell | Command |
|---|---|
| bash / zsh | `FLOW_TDD_OFF=1 <command>` |
| PowerShell | `$env:FLOW_TDD_OFF = "1"` |

The other two escape hatches - a `.flow/tdd-off` file and the `.flow/tdd-exempt` list - are
identical on every platform.


## What you get

| Gate | Produces | Model tier | Budget |
|------|----------|-----------|--------|
| FRAME | goal + task list in `.flow/STATE.md` | cheap / inline | 1 recall + 1 survey + 1 question batch |
| BUILD | working code + tests | frontier | no research; assumptions already fixed |
| CHECK | one verdict report | cheap subagents, parallel | 1 pass + 1 targeted re-verify |
| SHIP | commit / PR + memory write | inline | 1 pass |

**Protocols load only when you reach them.** One entry in the skill listing, ~295 resident
lines. The gate protocols, the debugging cycle, and the resume procedure sit in reference
files that are read only when the situation calls for them - a debugging protocol costs
nothing until there is a bug.

| Situation | Loads |
|-----------|-------|
| FRAME / BUILD / SHIP | `references/gates.md` |
| money, auth, PII, or outside input | `references/threat.md` |
| CHECK | `references/review.md` |
| the goal is not clear yet | `references/brainstorm.md` |
| a contract or spec already decided it | `references/authority.md` |
| a bug or test failure | `references/debug.md` |
| resuming, or about to compact | `references/resume.md` |
| running tasks concurrently | `references/parallel.md` |
| running unattended | `references/autonomous.md` |
| running under `/loop`, or waking from one | `references/continuous.md` |
| the roadmap has no next phase | `references/exhausted.md` |
| told to keep building past the roadmap | `references/nonstop.md` |
| many agents at once | `references/fleet.md` |
| state format, project profile | `references/state.md` |

**Authority reconciliation.** When a contract, specification or playbook already decided
the rates, thresholds and formulas, FRAME extracts them with citations into a constants
register and reconciles each against the code before BUILD. A contradiction is a blocker.
This exists because of a real 3.125x payout error: a wrong commission rate entered a
research document on day one, the roadmap inherited it, the phase plan inherited it from
the roadmap, fifteen fixtures encoded it, and five phases shipped against it while every
gate passed. Planning documents manufacture confidence as they propagate; only the source
decides.

**Threat modelling where it is warranted.** Phases touching money, identity, other
people's data, or input from outside the trust boundary get a threat register before BUILD -
trust boundaries drawn, STRIDE applied rather than recited, every mitigation turned into a
task rather than a wishlist item. CHECK then closes each row against real code and a test
that fails without the mitigation; a row with neither is a blocker. A threat model nobody
verifies is theatre, and the verification is the point.

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
`index` / `types` / `constants` / `setup` / `main` / `app` entry points — **`page` and
`layout` are not exempt**; a screen is gated through the route it serves,
plus `node_modules`, `dist`, `build`, `.next`, `out`, `coverage`, `vendor`, `migrations`,
`scripts`, `public`, `docker` and generated trees. That approximates the skill's own scope:
TDD is mandatory for rules, money, auth, transforms, state machines and API contracts, and
not required for config, glue, scaffolding or markup.

A test counts as covering a source file by either of two passes:

1. **Name or location** (no file reads). A file counts as a test if its name says so
   (`.test.`, `.spec.`, `test_`) **or if it lives in a `test/`, `tests/`, `__tests__/` or
   `spec/` directory** - Node's own runner, tape and ava all use `test/<name>.mjs` with no
   marker in the filename. From there the test filename must start with the source name, or share a token
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

- The file is genuinely outside TDD scope: add a fragment to `.flow/tdd-exempt`.
- The whole project needs it off: create `.flow/tdd-off` in the project root.
- One-off: `FLOW_TDD_OFF=1`.

The gate is deliberately looser than exact-name matching. A gate that blocks legitimate work
gets switched off entirely, which enforces nothing.

## The commit gate

A second hook runs before `git commit` and enforces two things.

**The state file must keep up.** A commit that changes source is refused when
`.flow/STATE.md` has not been touched in that commit or either of the last two. This exists
because it was observed failing in the wild: an unattended run shipped three commits of real
work without checking off a single task, so the next session would have read an untouched
list and redone it. The check is free and applies even to projects with no `PROJECT.md`.

**The tests must pass.** If `.flow/PROJECT.md` declares a `test_fast` command, that command
must pass before a commit containing source changes goes through.

It is built to stay out of your way, because a gate people disable enforces nothing:

- **Opt-in by configuration.** No `test_fast` in the profile means no gate.
- **Docs-only commits are not gated.** It only fires when staged files include guarded
  source extensions.
- **Fails open** on anything ambiguous - no profile, unreadable profile, no staged files.
- **Honours `--no-verify`**, `FLOW_SKIP_VERIFY=1`, and a `.flow/verify-off` file.
- **90 second ceiling.** `test_fast` is meant to be the unit suite - no containers, no
  network. If it times out the gate says so rather than blocking silently.

When it does block, it shows the last 25 lines of the failure, so the reason is in front of
you rather than a re-run away.

## Developing on it

The hooks have a test suite. No dependencies - Node built-ins and the built-in runner:

```
npm test
```

78 tests across both gates: what they guard and what they exempt, every way a covering
test can be recognised (sibling name, shared token, suffixed name, `test/` directory,
exported symbol), the stub rejection, the false-positive guard for helper-based suites,
every escape hatch, malformed stdin, and Windows backslash paths.

That suite exists because three real bugs shipped before it did - exact-name matching,
Next.js `route.ts`, and tests living in `test/` with no marker in the filename. All three
were found by pointing the gate at a real repository by hand. Each is now a test.

Requires Node 18+ for the test runner; the hooks themselves still only need 16+.

### Releasing

```
npm run release 1.15.0 "fix(fleet): size from measurement"
```

Tests, bumps the version in all three manifests, commits, pushes, **and pulls the local
marketplace clone**. That last step is why the script exists: `/plugin` installs read from
the clone under `~/.claude/plugins/marketplaces/flow-loop`, not from GitHub. A push without
it leaves every install on the previous version, and looks from the outside exactly like a
broken updater. It was forgotten four times before this was automated.

`autoUpdate: true` on the marketplace entry does not appear to close this gap on its own -
after a day and several restarts the clone was still on the version it was cloned at. Treat
the pull as required, not as a backstop.

## Using it

Say what you are building and the skill triggers on its own, or invoke it directly:

```
/flow:loop add refund handling to the ledger
```

With no `.flow/STATE.md` the project is unframed, so it starts at FRAME.

## Running unattended, and running overnight

Two different things, and conflating them is the most common misunderstanding.

**Autonomous mode** stops asking you questions during a run. Turn it on with a phrase
("autonomous", "keep going, don't ask") or a `.flow/autonomous` file in the project.
Questions become assumptions recorded in the state file, and the report leads with them.

**It is not a daemon.** An agent runs inside a session; when the session ends, the run ends.
No skill can change that. Continuing past that boundary is a host feature — on Claude Code,
`/loop`:

```
/loop /flow:loop continue from .flow/STATE.md
```

**Omit the interval.** That is self-paced mode: the run decides when to wake and, crucially,
can stop itself. A fixed `/loop 20m` fires on the clock whether or not there is anything to
do, and waking every 20 minutes on a task that takes an hour is three wasted context loads.

**Say the pacing out loud in the prompt.** Both `/loop` and the `ScheduleWakeup` tool
suggest a 1200-1800s delay, because they are written for a watcher polling an external event.
A Flow run with an open task list is not waiting for anything, and this skill overrides that
default — but only in the version you actually have loaded. Putting it in the prompt costs a
line and works on every version:

```
/loop /flow:loop continue from .flow/STATE.md — budget: until the roadmap is exhausted.
When you call ScheduleWakeup and tasks remain with nothing external pending, use
delaySeconds 60, never 1200-1800.
```

Without it, a run can commit a task and then sleep 25 minutes with the next one ready — four
hours of nothing across a phase, and indistinguishable from a crash to anyone watching. This
happened on two real projects before the rule was moved into resident context.

**A resumed session keeps the plugin version it started with.** Updating the plugin does not
change a conversation that is already running: it reloads at session start only. If a long
run is behaving like an older version, start a new session in the project rather than
restarting the app — restarting updates what is *installed*, resuming keeps what is *loaded*.

Each wake reads `.flow/STATE.md` and nothing else, reconciles it against `git log` before
trusting it, continues from `Next action`, and reports only what changed.

### Building past the roadmap

An empty roadmap means the list someone wrote is complete, not that the project is finished.
Before reporting the good ending, the loop sweeps five places where work is usually already
recorded — the state file's own deferred findings, tasks ticked as built but never proven,
drift between planning documents, `TODO`s that name a referent, and the blocked list read to
classify rather than schedule. It reports unblocked candidates with the command that starts
each, and blocked ones with what they need and from whom.

If you want it to keep going rather than report and stop, turn on **non-stop mode** — say
"keep building" in the loop prompt, or drop a `.flow/nonstop` file in the project:

```
/loop /flow:loop continue from .flow/STATE.md — keep building past the roadmap
```

It then works a ladder, never skipping a tier to reach a more interesting one: work already
recorded, then evidence gaps in code that already shipped (a module with no test, a command
that has never run, a mutation gate reporting survivors, two documents describing one control
differently), then requirements the project's own specification states and no code implements.
With no specification, that third tier does not exist.

It ends when **every remaining candidate needs a person** — a licence, a partner, a
production credential, a decision. That is a real terminal condition, unlike an empty roadmap:
it means the project is blocked rather than merely unplanned.

**Something that only needs local setup is not that.** A suite that has never run because no
test database exists is *work*, and starting a throwaway Postgres is its first step — not a
reason to declare the project blocked. The loop proposes that with the exact command, and
will do it itself if you put `allow local services` in `.flow/nonstop`. Production
credentials are never in this category, however easy they would be to set.

**What it will not do:** invent a feature nobody wrote down, reclassify blocked work as
buildable to stay busy, or soften a hard stop. Every self-selected phase is written into the
roadmap *before* it is built, one at a time, and flagged as self-selected in the report — so
you can tell at a glance which work you asked for and which the loop chose.

**It is the most expensive setting here.** Unlike fleet mode it does not finish sooner, it
simply does not stop, so name a ceiling unless you genuinely mean "until it is blocked".

### It stops itself

A loop with no stop condition is not autonomy, it is a leak. The run ends, and says which
fired:

- the roadmap is exhausted **and the sweep above found nothing startable** — the good
  ending, and the reason to keep a roadmap. In non-stop mode this one does not end the run;
  only "everything left is blocked on a human" does
- a hard stop needs you, and then it stops waking rather than paying full context every
  cycle to rediscover the same blocker
- two consecutive wakes with no commit — spinning is worse than stopping, because it is
  invisible
- two failed debug cycles on one defect, or CHECK failing twice on one finding
- the budget you named

**It never pushes, opens a PR, or deploys.** Committing locally is the boundary; a human
decides what leaves the machine.

### Naming a budget

The last stop condition is the one you set, and it is the only one the loop cannot work out
for itself. Put it in the prompt in plain words — there is no special syntax:

```
/loop /flow:loop continue from .flow/STATE.md — budget: finish phase 6, then stop
/loop /flow:loop continue from .flow/STATE.md — budget: stop after 6 hours
/loop /flow:loop continue from .flow/STATE.md — budget: until the roadmap is exhausted
/loop /flow:loop continue from .flow/STATE.md — fleet mode, budget 400k
```

| Form | Good for |
|---|---|
| **a stopping point** — "finish phase 6, then stop" | the default, and the one to reach for. A phase boundary is a natural checkpoint, and it is where a mistake stops propagating |
| **a wall-clock** — "stop after 6 hours" | overnight, when you care more about the morning than about exactly where it lands |
| **a token ceiling** — "budget 400k" | required by fleet mode, which sizes the fleet from it |
| **the roadmap** — "until the roadmap is exhausted" | long unattended runs. Weigh it honestly: a mistake in an early phase propagates through every later one before you look at any of them |

**Pacing.** When the task list is not empty and nothing external is being waited on, the
loop wakes in about a minute - there is nothing to sleep for. Long delays are a fallback
heartbeat for waiting on CI, a deploy or a person, not a work cadence. Thirteen tasks at a
twenty-minute delay is four hours of sleeping on top of the work, and to anyone watching it
is indistinguishable from a loop that has stopped.

Two practical notes. **Run it from a session whose working directory is the project**, or
name the path — `.flow/STATE.md` is relative and a loop started elsewhere finds nothing.
And **you run it once.** A self-paced loop re-arms itself each cycle; you do not re-issue it.

### Fleet mode — many agents at once

The default loop is one agent working sequentially. Fleet mode trades tokens for wall-clock:

```
/loop /flow:loop continue from .flow/STATE.md — fleet mode, budget 400k
```

or durably, a `.flow/fleet` file in the project root.

**What relaxes:** the context-positive test (paying twice for the same reading is accepted —
you are buying time, not efficiency), the size floor that normally keeps small work inline,
and the look-ahead, which scans the whole task list rather than the current wave.

**What does not, ever:** wave 0 still runs alone and first; two agents never write the same
file in the same working tree; agents never commit, push or merge; TDD still applies.

**The actual unlock is worktree isolation.** Each agent gets its own checkout, so tasks that
share a file can run at once and be reconciled after — an overwrite becomes a merge. Merges
run one at a time with `test_fast` between them, never concurrently. And a conflict *inside
one function* is a design signal, not a merge problem: those two agents were one task split
wrongly, so discard both and run it once.

**It needs a budget or it will not start, and it declines small ones.** A real 69-agent fleet
run measured **~547k input-equivalent tokens per agent** — 94% of it cache reads, each agent
loading context the orchestrator already had. So: budget ÷ 550k concurrent agents, a third
held back for CHECK and the merge passes, and **below about 1.6M it refuses** — that is two
agents plus the reserve, and one agent is not a fleet, it is the sequential loop carrying
worktree and briefing overhead for no concurrency. A phase that runs out of budget before
review is worse than one that built less. Mechanical work against a frozen contract drops to
a cheaper tier; money, auth and invariants never do.

That 547k is a *carelessly briefed* agent, not a floor on the technology — the fleet that
produced it did not use a context pack. Brief properly and the number falls, and the minimum
budget with it. But move it on a measurement you took, not on the hope that this run will be
tidier.

**Where it does not help:** a dependency chain. Four agents on four tasks that must happen in
order finish no sooner and cost four times as much. Check the file sets first — if they
overlap and you cannot isolate, the work is serial and fleet mode will say so.

Full protocol: `references/fleet.md`.

### Before you start a long one

- `.flow/STATE.md` has a goal, acceptance criteria and a task list
- `.flow/PROJECT.md` exists, so no wake re-derives the commands
- a roadmap exists, if the run is meant to cross phases
- the working tree is clean — a loop starting dirty cannot tell its own work from someone
  else's
- **you have named a budget.** "Until it is done" is not a budget on a roadmap with eleven
  phases. An unattended loop runs frontier reasoning for as long as you let it, and the
  state file being current is what keeps that affordable — every wake with a stale state
  file re-derives context that was already paid for.

Full protocol: `references/continuous.md`.

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
| multi-agent review tools | the four review lenses as one CHECK pass | the orchestration layer |
| session-memory plugins | two touchpoints: recall at FRAME, write at SHIP | the persistence engine itself |
| context-saving MCP servers | the token rules, as ambient guidance | the sandbox and the search index |

The last two rows matter: a skill file cannot replace a running MCP server. If you want
sandboxed execution or durable cross-session memory, install those separately - Flow detects
and uses them when present, and works without them.

## Honest limits

- **This is a skill plus one hook, not a framework.** The gates and guards are instructions
  Claude follows. Only the TDD and commit gates are mechanically enforced; the rest is discipline.
- **The gate is heuristic.** See the escape hatches above.
- **No benchmark.** The structural savings - fewer round trips, a smaller resident skill
  listing, progressive disclosure - are real and mechanical. Whether your work lands faster
  is not something this README can honestly claim for you.

## License

MIT

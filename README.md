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

## Install

```
/plugin marketplace add OWNER/claude-flow
/plugin install flow@claude-flow
```

Restart the session so the hook loads.

## What you get

| Gate | Produces | Model tier | Budget |
|------|----------|-----------|--------|
| FRAME | goal + task list in `.flow/STATE.md` | cheap / inline | 1 recall + 1 survey + 1 question batch |
| BUILD | working code + tests | frontier | no research; assumptions already fixed |
| CHECK | one verdict report | cheap subagents, parallel | 1 pass + 1 targeted re-verify |
| SHIP | commit / PR + memory write | inline | 1 pass |

**One state file.** `.flow/STATE.md` per project holds the goal, acceptance criteria, task
list, assumptions and decisions. It replaces `.planning/` trees, phase directories, and
separate plan documents. It is small on purpose - it is read at the start of every session.

**Seven loop guards.** The expensive failure mode is not model choice, it is repeated work:
re-verifying what already passed, researching the same fact twice, a third silent debug
attempt, spawning a subagent whose prompt costs more than reading three files yourself.
The guards cut each of those off explicitly, with a red-flags table for the rationalisations
that precede them.

**Progressive disclosure.** `SKILL.md` is ~100 lines and loads on trigger. The gate protocols
load only at the gate that needs them.

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
/flow add refund handling to the ledger
```

With no `.flow/STATE.md` the project is unframed, so it starts at FRAME.

## If you are coming from a framework stack

Flow is meant to replace them, not sit alongside them. Running Flow's gates *and* a separate
planning framework's phase commands duplicates the work Flow exists to remove. Disable the
ones it supersedes in `~/.claude/settings.json`.

Keep anything that genuinely saves context rather than spending it - a sandboxed
execution/search layer is complementary, and Flow's token rules assume one may be present
while working correctly without it.

## Honest limits

- **This is a skill plus one hook, not a framework.** The gates and guards are instructions
  Claude follows. Only the TDD rule is mechanically enforced; the rest is discipline.
- **The gate is heuristic.** See the escape hatches above.
- **No benchmark.** The structural savings - fewer round trips, a smaller resident skill
  listing, progressive disclosure - are real and mechanical. Whether your work lands faster
  is not something this README can honestly claim for you.

## License

MIT

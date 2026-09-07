# Fleet mode

Opt-in. Trades tokens for wall-clock by running many agents at once. The default loop is
one agent working sequentially; fleet mode is for when finishing sooner is worth paying
more, and you have said so.

Read `references/parallel.md` first — this file only says what fleet mode changes.

## Enabling

Only the user turns it on:

- **This run** — a `/loop` prompt that says fleet mode, or the user saying "fleet", "spawn
  agents", "parallelise it".
- **Durably** — a `.flow/fleet` file in the project root.

Never infer it from a large task list. A long phase is not evidence that it parallelises.

## What relaxes, and what does not

**Relaxed:**

- **The context-positive test.** Normally an agent must save more reading than its brief and
  report cost. In fleet mode, paying twice for the same reading is accepted — you are buying
  time, not efficiency.
- **The size floor.** Guard 5 keeps small work inline because spawning costs more than doing
  it. Fleet mode spawns anyway when a task is genuinely independent.
- **Look-ahead.** The default loop only parallelises within the current wave. Fleet mode
  scans the whole task list, and the next phase's frame, for anything unblocked.

**Not relaxed, ever:**

- **Wave 0 still runs alone and first.** Schemas, shared types, barrel exports, migrations.
  Agents cannot negotiate, so anything more than one task depends on must already be settled.
  This is the rule fleet mode is most tempted to break and least able to survive breaking.
- **Two agents never write the same file in the same working tree.** Not "carefully", not
  "different functions". See worktrees below for the legitimate way.
- **Agents never commit, push, merge, or deploy.** The orchestrator owns history.
- **TDD still applies.** Unattended parallel code is more dependent on tests, not less.

## Worktrees — the actual unlock

Without isolation, fleet mode can only run tasks whose file sets are already disjoint, and
most phases have few of those. With `isolation: 'worktree'` each agent gets its own checkout,
so tasks that touch the same file can run at once and be reconciled afterwards.

That converts an overwrite into a merge, which is a real gain and a real cost:

- **Setup is not free** — a few hundred milliseconds and disk per agent. Worth it for a task
  measured in minutes, wasteful for one measured in seconds.
- **Merge serially, never concurrently.** The orchestrator merges one worktree at a time and
  runs `test_fast` after each merge, not once at the end. A merge that breaks the suite is
  attributable only if you know which one it was.
- **A conflict inside one function is a design signal, not a merge problem.** If two agents
  edited the same function, they were one task split wrongly. Discard both, merge them into
  a single task, and run it once. Do not hand-reconcile two half-designs — that produces code
  neither agent would have written.

## Sizing the fleet

Scale to the budget, not to the task list:

- No budget named → **do not start**. Ask for one. Fleet mode without a ceiling is the most
  expensive thing in this skill.
- Rough rule: one concurrent agent per 100k tokens of budget, capped at what the host allows
  concurrently. Ten ready tasks and a 300k budget means three agents and a queue, not ten.
- Reserve at least a third of the budget for CHECK and the merge passes. Fleet mode
  front-loads spend into BUILD, and a phase that runs out of budget before review is worse
  than one that built less.

**Below roughly 300k, refuse and run sequentially instead.** After the reserve, a smaller
budget funds one agent — which is the sequential loop carrying worktree setup, briefing and
report overhead for no concurrency at all. Say so rather than starting: "fleet mode needs
about 300k to run two agents; at this budget the sequential loop is strictly faster and
cheaper." Two agents is the minimum at which any of this is parallel.

These numbers are a starting heuristic, not a measurement. Once a real fleet run has
happened, size from what it actually cost and correct this file.

## Model tiering

Fleet mode is where tiering earns its keep, because the volume is high:

- **Mechanical, well-specified tasks** — a route against a frozen contract, a fixture, a
  migration from a stated schema — run on a cheaper tier at lower effort.
- **Money, auth, invariants, anything in `references/threat.md` scope** — full tier. Never
  cheapen these to buy parallelism; a wrong number produced quickly is the worst outcome
  available.
- **Merge and CHECK** — full tier. This is where parallel work either converges or silently
  diverges.

## Briefing a fleet agent

Same as `references/parallel.md`, plus:

- **The exact files it owns**, and that it must touch nothing else, even in its own worktree.
- **That it must not commit.** It reports; the orchestrator commits.
- **The test command for its own slice**, so it can verify before reporting.
- **No knowledge of siblings.** It cannot act on them, and knowing invites it to guess.

## When a wave finishes

1. Merge worktrees one at a time, running `test_fast` after each.
2. Run the full suite once for the wave, not once per task.
3. Update `.flow/STATE.md` with every task's status **before** starting the next wave. A
   fleet that dies mid-wave with an unrecorded state file loses more work than a sequential
   run ever could, because more was in flight.
4. Report the wave: tasks completed, merges that conflicted, and what the wave cost.

## Stop conditions — additional to the loop's own

Fleet mode ends and reports when:

- **Two merges conflict inside the same function.** The wave was decomposed wrongly; stop
  and re-frame rather than trying a third arrangement.
- **The budget's reserve is reached** — the third held back for CHECK and merges.
- **More than half a wave's agents return nothing usable.** The brief was wrong, and
  spawning more will produce more of the same.
- Everything in `references/continuous.md` still applies.

## Never

- **Never use fleet mode to go faster on a dependency chain.** Four agents on four tasks that
  must happen in order finish no sooner and cost four times as much. Check the file sets
  before spawning; if they overlap and you cannot isolate, the work is serial.
- **Never let a fleet run without a budget.**
- **Never merge concurrently**, and never merge without testing between merges.
- **Never cheapen the tier on money code** to afford more agents.
- **Never report wall-clock as though it were throughput.** Say what it cost.

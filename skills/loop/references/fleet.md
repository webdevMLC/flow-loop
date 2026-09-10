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
- Rough rule: **budget ÷ 550k = concurrent agents**, capped at what the host allows
  concurrently. Ten ready tasks and a 3M budget means about four agents and a queue, not ten.
- Reserve at least a third of the budget for CHECK and the merge passes. Fleet mode
  front-loads spend into BUILD, and a phase that runs out of budget before review is worse
  than one that built less.

### Where 550k comes from

Measured on 2026-09-06, from a 69-agent verification fleet on a real repository:

| | |
|---|---|
| Raw tokens | 221.6M |
| of which cache reads | 208.0M |
| Output | 179k |
| Input-equivalent | ~37.7M |
| **Per agent** | **~547k** |

Two things to take from it. First, the old figure in this file — one agent per 100k — was
wrong by more than five times, and it was wrong in the expensive direction: it would have
authorised a fleet five times larger than the budget could pay for.

Second, look at the composition. **94% of those tokens were cache reads**, which is each
agent independently loading context the orchestrator already had. That fleet did not follow
the context-pack discipline below. So 547k is what a *carelessly briefed* agent costs, not a
law of nature — a well-packed agent should land far lower, and the gap between the two is the
entire argument for the section on cost discipline.

Size on 547k until you have your own measurement. Then correct this file with it, and say
which of the two regimes your fleet was in.

### The floor

**The floor is two agents plus the reserve** — at 547k, about **1.6M**. Below it, say so and
run sequentially: "fleet mode needs about 1.6M to run two agents; at this budget the
sequential loop is strictly faster and cheaper." One agent is not a fleet, it is the
sequential loop carrying worktree setup, briefing and report overhead for no concurrency at
all. Two is the minimum at which any of this is parallel.

If a run is well-packed enough to beat 547k, the floor moves down with it — but lower it on a
measurement you took, never on the hope that this one will brief better.

## Model tiering

Fleet mode is where tiering earns its keep, because the volume is high:

- **Mechanical, well-specified tasks** — a route against a frozen contract, a fixture, a
  migration from a stated schema — run on a cheaper tier at lower effort.
- **Money, auth, invariants, anything in `references/threat.md` scope** — full tier. Never
  cheapen these to buy parallelism; a wrong number produced quickly is the worst outcome
  available.
- **Merge and CHECK** — full tier. This is where parallel work either converges or silently
  diverges.

## Cost discipline — where the waste actually is

Parallelism is not what makes fleet mode expensive. **Duplicated context loading is.** Five
agents each independently reading the schema, the conventions and the analog file pay five
times for one act of reading, and that dwarfs the cost of the code they write.

So the orchestrator reads once and hands it over. Do all of this, or do not spawn:

**1. Build one context pack, before spawning.** Assemble it once and paste it into every
brief:

- the frozen contract — actual type signatures and schema, not a path to them
- the conventions and analog entries from `.flow/PROJECT.md`, already cached there
- the **contents** of the closest analog file, inlined
- the test command for the slice, and the acceptance criteria

Paths make an agent go read. Content means it does not. That single change is the difference
between an N-times multiplier and something close to 1.

**2. Tell every agent it has everything it needs.** State plainly: do not re-read the schema,
do not survey the codebase, do not look for conventions — they are in this brief. An agent
that re-derives what it was handed is the waste this section exists to remove.

**3. Cap the return.** Structured output only: files changed, tests run, the output proving
they passed, assumptions made. No narration, no restating the brief, no summary of the
codebase. A long report is paid for twice — once to write, once to read.

**4. Tier by task class, not by convenience.** Mechanical work against a frozen contract runs
on a cheaper tier at low effort. Money, auth and invariants never do. Getting this wrong in
either direction is expensive: a cheap tier on money code produces a wrong number, and a full
tier on a fixture pays a premium for nothing.

**5. Watch the spread, not just the total.** The budget rule above sizes the *fleet*; nothing in
it stops one agent from wandering. A measured run had a median agent at **1.4M tokens and its
dearest at 15.7M — eleven times the median** — for the same class of task. That one agent cost
more than eight of its siblings.

An agent that far above the median has stopped doing its task and started exploring the
codebase, and the brief is what failed: it named a question without naming where the answer
lives. So check the spread when a wave lands, and treat **anything past ~3x the median as a
briefing defect to fix before the next wave**, not as a task that happened to be hard. It is
also the cheapest thing to catch, because the fix is one paragraph in a prompt.

**5. Decompose before spawning, not after.** Compare file sets first. Two tasks that overlap
are either different waves or one task. Discovering it at merge time means paying for two
drafts and keeping neither — the most expensive failure available here.

**6. One CHECK per wave, never per task.** Review the merged result once. Per-task review
multiplies the most model-heavy gate by the fleet size for no additional signal.

**7. Report the multiplier.** At the end of a wave, say what it cost against what a
sequential run of the same tasks would have. That number is the only way the sizing
heuristics in this file get corrected, and right now they are estimates.

Done properly, fleet mode should cost modestly more than sequential and finish substantially
sooner. Done carelessly — paths instead of content, uncapped reports, full tier everywhere —
it costs several times more for the same work. The difference is entirely in the brief.

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

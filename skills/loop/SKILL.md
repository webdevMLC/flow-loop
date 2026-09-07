---
name: loop
description: The single development loop — brainstorm when the goal is unclear, then FRAME, BUILD, CHECK, SHIP — replacing separate memory, planning, context, TDD, debugging and review frameworks with one protocol. Use for any real feature, fix, refactor, migration, debugging session, or milestone in a project codebase, and equally when the request is still vague and needs shaping before anything gets built. It sizes the task first, fixes the phase order, routes each kind of work to the cheapest model tier that can do it, enforces hard loop guards against repeated research and re-verification, and keeps one state file per project. Can run autonomously without asking when the user explicitly opts in. Not needed for one-off questions or throwaway scratch scripts.
---

# Flow

One loop. Four gates. No framework stacking.

This skill replaces the separate memory / milestone / context / TDD / debugging / review
layers. Do not also run another framework's phase commands or a separate review pass on
top of it — that duplication is the cost problem it solves.

## Before anything else

**If `.flow/STATE.md` exists, read it first.** That one read is the whole context
restoration step — goal, task list, decisions, assumptions, what was deliberately excluded.
It applies to a new request as much as to an obvious resume; a request that feels like fresh
work is exactly when the prior decisions get re-derived at full cost.

**If there is no `.flow/` directory, the project has not adopted Flow.** Nothing is enforced
until it does — both gates stay dormant. On a Full task, FRAME creates it. Adopting a codebase
that already builds is not designing from scratch: FRAME's survey is about what is *already
true* — the test command, the conventions, the closest analog file, which directories hold
legacy code nobody will retrofit tests for. Record those in `.flow/PROJECT.md` (and legacy
paths in `.flow/tdd-exempt`) so no later wake re-derives them.

## Triage first — this is where the speed comes from

Not every task deserves four gates. Size the work before starting:

| Size | Looks like | Path |
|------|-----------|------|
| **Direct** | a question, a typo, a rename, a one-line fix, reading code | Just do it. No gates, no state file, no ceremony. |
| **Quick** | one file, requirement already clear, no new interface | BUILD → SHIP. Skip FRAME (the goal is obvious) and CHECK (the diff fits on a screen). Still test-first if it is logic. |
| **Full** | several files, a new interface, money/auth/data, or more than you can hold in your head | All four gates. |

Running the Full loop on Direct work is the most expensive mistake available here, and the
easiest to make. When torn between two sizes, pick the smaller and escalate if it turns out
you were wrong — escalating costs one gate, over-ceremony costs the whole loop.

Size is not clarity. If you cannot state what "done" looks like in one checkable
sentence, the goal is not ready to build against **at any size** — read
`references/brainstorm.md` before FRAME, however small the task looks.

**The TDD and commit gates fire on every task, including Direct and Quick ones.** They are
harness hooks, not gate ceremony — "no gates" above means no FRAME/CHECK/SHIP, not that a
denied write can be worked around.

## The loop

```
FRAME  ->  BUILD  ->  CHECK  ->  SHIP
  ^                     |
  +--- only on a CHECK failure that changes the goal
```

A failed check that does **not** change the goal is fixed inside CHECK, not by re-framing.

| Gate | Produces | Model tier | Hard budget |
|------|----------|-----------|-------------|
| FRAME | goal + task list in `.flow/STATE.md` | cheap / inline | 1 recall + 1 survey + 1 question batch |
| BUILD | working code + tests | **frontier** (the only such spend) | no research; assumptions already fixed |
| CHECK | one verdict report | cheap subagents, parallel | 1 pass + 1 targeted re-verify |
| SHIP | commit / PR + memory write | inline, cheapest | 1 pass |

Every task commit carries its own `.flow/STATE.md` update. A task shipped but not checked
off is a task the next session will do again.

**No code is written outside BUILD.** No research is done inside BUILD.

## Loop guards (non-negotiable)

Repeated work, not model choice, is what actually burns the budget.

1. **Size before you start.** See Triage. An unsized task defaults to over-ceremony.
2. **One research pass per gate.** If an answer isn't found, record the assumption in
   STATE.md and proceed. Never search twice for the same fact.
3. **A passing check is final.** Never re-run a check that passed unless the code it covered
   changed since. No "let me just confirm."
4. **Two debug cycles, then stop.** After two failed fixes on one defect, report findings and
   hypotheses to the user. There is no silent third attempt. See `references/debug.md`.
5. **No subagent below the spawn cost.** Work touching ≤3 files or ≤200 lines is done inline.
   A subagent must save more context than its prompt and report consume.
6. **Never re-read what is already in context.** Read a file only when about to edit it.
7. **One question batch per gate.** Collect every open question, ask once. The one
   exception is brainstorming, where the dialogue *is* the work and the user is present
   for it — see `references/brainstorm.md`. The exception ends when FRAME begins.
8. **No unrequested extras.** No docs, changelogs, formatting passes, coverage reports, or
   refactors the task did not ask for.

### Red flags — these thoughts mean you are about to burn tokens for nothing

| Thought | Reality |
|---------|---------|
| "Let me double-check that passed test" | Guard 3. It passed. |
| "Let me re-read the file to be sure" | Guard 6. It is in context. |
| "One more search for context" | Guard 2. State the assumption. |
| "I'll spawn an agent to read these two files" | Guard 5. Read them. |
| "Let me also tidy up while I'm here" | Guard 8. Not asked. |
| "Third try will fix it" | Guard 4. Surface it. |
| "This needs a proper plan" (for a typo) | Guard 1. It needs a keystroke. |

## Token discipline (ambient, all gates)

- **Analyze in the sandbox, not in context.** To filter/count/parse/aggregate any output, run
  it through `ctx_execute_file` / `ctx_batch_execute` (context-mode) and print only the
  derived answer. Without those tools, pipe through the shell and echo only the conclusion.
  Raw bytes must not enter the conversation.
- **Read is for editing.** Use `Read` only when the exact bytes are needed to edit.
- **Batch independent calls** into one message — always.
- **Artifacts go to files.** Return a path plus one line, never a pasted document.
- **Compact at gate boundaries only**, never mid-gate.

## Protocols — load only when you reach them

| Situation | Read |
|-----------|------|
| The goal is not clear enough to state | `references/brainstorm.md` |
| Entering FRAME / BUILD / SHIP | `references/gates.md` |
| The phase implements something a contract or spec already decided | `references/authority.md` |
| The phase touches money, auth, PII, or outside input | `references/threat.md` |
| Entering CHECK | `references/review.md` |
| A bug, test failure, or unexpected behavior | `references/debug.md` |
| Resuming, or context about to compact | `references/resume.md` |
| Running phase tasks concurrently | `references/parallel.md` |
| The user wants many agents at once, and accepts the cost | `references/fleet.md` |
| The user has asked you to run unattended | `references/autonomous.md` |
| Running under `/loop`, or waking from one | `references/continuous.md` |
| The roadmap has no next phase | `references/exhausted.md` |
| The user said to keep building past the roadmap | `references/nonstop.md` |
| State file format, project profile, milestones | `references/state.md` |

## Autonomous mode

Off by default. **Only the user turns it on** — "autonomous", "keep going, don’t ask", or a
`.flow/autonomous` file in the project. Never infer it from impatience.

It needs a framed goal first: brainstorming is a dialogue and cannot be done alone, so
brainstorm and FRAME **with** the user, then run BUILD → CHECK → SHIP unattended. Questions
become recorded assumptions, every guard still applies, and anything that leaves the machine
or cannot be undone still stops and asks. See `references/autonomous.md`.

### Pacing a `/loop` run — before every `ScheduleWakeup`

`/loop` and the `ScheduleWakeup` tool both suggest **1200–1800s**. Those numbers describe an
idle watcher polling for an external event. A Flow loop with an open task list is not idle,
so **this rule overrides that default**:

| Situation | `delaySeconds` |
|---|---|
| Tasks remain, nothing external pending | **60** — there is nothing to wait for |
| Genuinely waiting on CI, a deploy, a queue, a person | match the wait |
| Task list empty, or a stop condition fired | do not sleep — `stop: true` and report |

Twenty-five minutes of sleep between two ready tasks is four hours of nothing across a phase,
and to the person watching it is indistinguishable from a crash. Never give "fallback
heartbeat" as the reason when nothing is being awaited — that phrase belongs to case two only.

### Stop conditions — check these at the top of a wake, before any work

End the loop with `stop: true` and say which one fired:

1. **The roadmap is exhausted.** Before ending, run the sweep in
   `references/exhausted.md` — one bounded pass over work already recorded but not on the
   roadmap (deferred findings, claims never proven, planning drift). An empty roadmap means
   the list someone wrote is complete, not that nothing is left. Report what it finds; then
   stop, unless the budget was broader than the roadmap.
   **If the user turned on non-stop mode** — `.flow/nonstop`, or "keep building" in the
   prompt — do not stop here at all: work the ladder in `references/nonstop.md` and end only
   when every remaining candidate is blocked on a human. Record each self-selected phase in
   the roadmap *before* building it, and say in the report that the loop chose it.
2. **A hard stop needs a human** — pushing, deploying, secrets, money, deleting data, a scope
   change, a concurrent writer. Report it; do not wake again to rediscover it.
3. **Two consecutive wakes with no commit.** Track it in STATE.md's `Wakes since commit`.
   Spinning is worse than stopping, because it is invisible.
4. **Guard 4** — two failed debug cycles on one defect.
5. **CHECK fails twice on the same finding.**
6. **The budget the user set**, in their own words in the loop prompt.

Report only what changed since the last wake, never a re-summary of the project.

**A wake that finishes a phase archives it and reports before touching the next.** It may
then continue, but only if the user's budget covers more than this phase: "until the roadmap
is exhausted" does, "finish phase 6, then stop" does not. Silence is not permission — with no
budget reaching past this phase, stop at the boundary. The roadmap decides *which* phase is
next; the budget decides *whether* there is one.

## Memory

At FRAME start, recall once: `claude-mem-cowork:mem-search` if installed, else
`ctx_search(sort: "timeline")`, else `.flow/MEMORY.md`. One query, batched.
At SHIP, append decisions and surprises worth keeping. Nothing else writes memory.
Honor `<private>` — never persist anything inside those tags.

## Scope

Use Flow for real project work. Skip it for a question, a scratch script, or an explanation —
running a four-gate loop on a one-liner is the waste this skill exists to prevent.

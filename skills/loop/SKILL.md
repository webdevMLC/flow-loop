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

**If `.flow/UAT.md` has open entries and you are talking to a person, run that session
first** — `references/uat.md`. It is a batch of specific questions with the artefact attached,
usually ten minutes, and it is the only thing that closes a `by person` criterion. A queue
that only grows is the failure that file exists to prevent.

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

**FRAME ends with a gap pass**, not with a task list: what does this plan need that does not
exist, who changes the rules it creates, what in the source documents did nothing consume, and
what did the last phase leave open. Each answer becomes a task, a recorded assumption, or a
blocker — never silence. It reads what the survey already returned; it does not search again.

**CHECK is five stages and each gates the next** — machine (build, full suite, every project
gate), contract (the authority, re-read, not just the criteria), composition (is the new code
reachable, called, read; does last phase's green still hold), adversarial (the lenses, plus one
that tries to falsify the SHIP report's own claims), verdict. Nothing model-heavy runs until
the machine stage is green. A phase ships only when all five pass — that, not the absence of a
watcher, is what makes an unattended run trustworthy. See `references/review.md`.

**A frame that turns out wrong mid-BUILD stops the work, it does not get built around.** A
missing fact becomes an assumption and the build continues; a *false* one does not. Adapt a
detail and record it in Deviations, re-frame a wrong task in STATE.md before writing its code,
and stop the phase outright when a criterion or the goal rests on the false premise. Two
re-frames in one phase means the frame was wrong, not the tasks — stop.

**FRAME ends by reviewing its own plan** on Full work — one reader asking whether this is the
right work, whether the criteria are checkable, and whether the tasks actually produce them.
Three gates check the work; this is the only one that checks the plan, and the plan is where
the expensive failures start.

**A phase that touched a screen gets the screen audited** — automatically, inside CHECK, not
by a skill someone remembers. It opens the route, captures it at desktop and 375px, checks the
five states and the project's own design standard, and the capture is what closes an
`by artifact` criterion. **A `by person` criterion gets a prepared question in
`.flow/UAT.md`** — route, one specific question, what yes and no mean — which the loop never
answers itself.

**SHIP hands the work over, it does not just stop.** If the phase produced a migration, an
environment variable, a schema change or a job, append its entry to `.flow/RELEASE.md` —
what changed, which migrations and whether each reverses, the order and its reason, and what
to watch. Committing locally is still the boundary; a phase nobody can safely release is half
finished. See `references/release.md`.

**Every acceptance criterion says how it will be proven** — `by test` (a command exits 0),
`by artifact` (something produced that a person opens and judges), or `by person`
(judgement no artifact settles). Unmarked means `by test`, and that default is how a system
passes four gates while being unusable: a claim no command can settle gets closed by the
nearest command that can. `by person` criteria are reported awaiting review, never closed by
the loop. Every CHECK and SHIP report ends with the count. See `references/evidence.md`.

**If a phase claims a person will see something, one acceptance criterion must name the
screen** — and SHIP confirms it renders. Criteria written purely as system behaviour get built
purely as system behaviour, and the TDD gate compounds it by making modules cheaper to test
than pages. A run left alone will drift backend-ward until nothing is visible.

**Quick work that touches a screen still gets the capture** — `references/uiaudit.md` — even
though Quick skips CHECK. A one-file UI tweak is the commonest Quick task and the likeliest to
touch an interface; skipping the audit there is how the gate becomes optional in practice.

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
| CHECK | one verdict report | machine first, then cheap subagents | 5 gating stages, 1 targeted re-verify |
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
| Writing acceptance criteria, or closing one | `references/evidence.md` |
| SHIP, when the phase produced a migration or config | `references/release.md` |
| Leaving FRAME on a Full phase | `references/planreview.md` |
| A TDD or commit hook denied a write or a commit | `references/gates.md` |
| CHECK, when the phase touched a screen | `references/uiaudit.md` |
| Undoing a shipped phase | `references/reverse.md` |
| A milestone or roadmap boundary | `references/milestone.md` |
| `.flow/UAT.md` has open entries and the user is back | `references/uat.md` |
| The roadmap has no next phase, or FRAME asks what the last phase left open | `references/exhausted.md` |
| The user said to keep building past the roadmap | `references/nonstop.md` |
| State file format and project profile | `references/state.md` |

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

**"Idle tick" is the tool's phrase, not your situation.** A wake with a phase to frame, a task
to start, or a finding to act on is *queued work*, however quiet the machine is. One run armed
1800s with the reason "nothing pending in the background; idle tick to frame Phase 72" — it
named the queued work inside the sentence explaining why it was idle. **Nothing pending in the
background is not the same as nothing to do.** If the task list or the roadmap has anything at
all, this is not an idle tick.

| Situation | `delaySeconds` |
|---|---|
| Tasks remain, nothing external pending | **60** — there is nothing to wait for |
| Genuinely waiting on CI, a deploy, a queue, a person | match the wait |
| A phase just shipped and another is queued or selectable | **60** — an empty task list between phases is not an ending |
| Task list empty, **no next phase, and non-stop is off** | do not sleep — `stop: true` and report |
| A genuine stop condition fired | `stop: true` and say which |

**The row above it is the one that has actually gone wrong.** A phase ships, the task list is
empty for a moment, and "task list empty → stop" reads as true — so a run that had eleven more
phases available ended itself and wrote a report saying everything passed. Two runs did this on
one night, one of them saying "green, and stopping anyway". **Empty between phases is not
empty.** Before stopping on an empty list, check the roadmap and, in non-stop mode, the ladder.

Twenty-five minutes of sleep between two ready tasks is four hours of nothing across a phase,
and to the person watching it is indistinguishable from a crash. Never give "fallback
heartbeat" as the reason when nothing is being awaited — that phrase belongs to case two only.

**A green checkpoint is not an ending.** Writing `CHECKPOINT-<n>.md` feels like one — it is a
document, it is thorough, and the turn wants to stop there. If every gate passed and the
reviewer raised nothing above MINOR, **arm the next wake in the same turn** and take the next
phase. A green checkpoint that does not call `ScheduleWakeup` has ended the run exactly as
surely as `stop: true` would, and left a report saying everything passed.

### Stop conditions — check these at the top of a wake, before any work

End the loop with `stop: true` and say which one fired:

1. **The roadmap is exhausted.** Before ending, run the sweep in
   `references/exhausted.md` — one bounded pass over work already recorded but not on the
   roadmap (deferred findings, claims never proven, planning drift), and run
   `references/milestone.md` — which asks which original requirements were quietly dropped. An empty roadmap means
   the list someone wrote is complete, not that nothing is left. Report what it finds; then
   stop, unless the budget was broader than the roadmap.
   **If the user turned on non-stop mode** — `.flow/nonstop`, or "keep building" in the
   prompt — do not stop here at all: work the ladder in `references/nonstop.md` and end only
   when every remaining candidate is blocked on a human. Record each self-selected phase in
   the roadmap *before* building it, and say in the report that the loop chose it.
   **Run a checkpoint audit every 3 self-selected phases** (`Phases since review` in
   STATE.md), and immediately for money, auth or data destruction: full suite, the build,
   every project gate, the cumulative evidence ledger, and one independent reviewer with no
   memory of building it. **Continue automatically if it passes.** A MAJOR is not automatically a
   stop: if the fix is making the code do what the spec already says, frame it as the next
   phase and continue; if it requires deciding what the behaviour *should* be, stop and state
   the decision. Stop also for a red build, a BLOCKER, drift from the project, or judgement
   piling up unjudged.
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

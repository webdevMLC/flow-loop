---
name: loop
description: The single development loop — brainstorm when the goal is unclear, then FRAME, BUILD, CHECK, SHIP — replacing separate memory, planning, context, TDD, debugging and review frameworks with one protocol. Use for any real feature, fix, refactor, migration, debugging session, or milestone in a project codebase, and equally when the request is still vague and needs shaping before anything gets built. It sizes the task first, fixes the phase order, routes each kind of work to the cheapest model tier that can do it, enforces hard loop guards against repeated research and re-verification, and keeps one state file per project. Can run autonomously without asking when the user explicitly opts in. Not needed for one-off questions or throwaway scratch scripts.
---

# Flow

One loop. Four gates. No framework stacking.

This skill replaces the separate memory / milestone / context / TDD / debugging / review
layers. Do not also run another framework's phase commands or a separate review pass on
top of it — that duplication is the cost problem it solves.

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
| The phase touches money, auth, PII, or outside input | `references/threat.md` |
| Entering CHECK | `references/review.md` |
| A bug, test failure, or unexpected behavior | `references/debug.md` |
| Resuming, or context about to compact | `references/resume.md` |
| Running phase tasks concurrently | `references/parallel.md` |
| The user has asked you to run unattended | `references/autonomous.md` |
| State file format, milestones | `references/state.md` |

## Autonomous mode

Off by default. **Only the user turns it on** — "autonomous", "keep going, don’t ask", or a
`.flow/autonomous` file in the project. Never infer it from impatience.

It needs a framed goal first: brainstorming is a dialogue and cannot be done alone, so
brainstorm and FRAME **with** the user, then run BUILD → CHECK → SHIP unattended. Questions
become recorded assumptions, every guard still applies, and anything that leaves the machine
or cannot be undone still stops and asks. See `references/autonomous.md`.

## Memory

At FRAME start, recall once: `claude-mem-cowork:mem-search` if installed, else
`ctx_search(sort: "timeline")`, else `.flow/MEMORY.md`. One query, batched.
At SHIP, append decisions and surprises worth keeping. Nothing else writes memory.
Honor `<private>` — never persist anything inside those tags.

## Scope

Use Flow for real project work. Skip it for a question, a scratch script, or an explanation —
running a four-gate loop on a one-liner is the waste this skill exists to prevent.

---
name: flow
description: The single development loop — FRAME then BUILD then CHECK then SHIP — replacing separate memory, planning, context, TDD, and review frameworks with one protocol. Use for any real feature, fix, refactor, migration, or milestone in a project codebase. It fixes the phase order, routes each kind of work to the cheapest model tier that can do it, enforces hard loop guards against repeated research and re-verification, and keeps one state file per project. Not needed for one-off questions, throwaway scratch scripts, or pure explanation.
---

# Flow

One loop. Four gates. No framework stacking.

This skill replaces the separate memory / milestone / context / TDD / review layers.
Do not also run GSD phase commands, Superpowers process skills, or a separate
review pass on top of this — that duplication is the cost problem it solves.

## The loop

```
FRAME  ->  BUILD  ->  CHECK  ->  SHIP
  ^                     |
  +--- only on a CHECK failure that changes the goal
```

Never skip backwards for anything else. A failed check that does **not** change the
goal is fixed inside CHECK, not by re-entering FRAME.

| Gate | Produces | Model tier | Hard budget |
|------|----------|-----------|-------------|
| FRAME | goal + task list in `.flow/STATE.md` | Sonnet / inline low-effort | 1 recall + 1 survey + 1 question batch |
| BUILD | working code + tests | **Opus** (the only frontier spend) | no research; assumptions already fixed |
| CHECK | one verdict report | Sonnet/Haiku subagents, parallel | 1 pass + 1 targeted re-verify |
| SHIP | commit / PR + memory write | inline, cheapest | 1 pass |

**No code is written outside BUILD.** No research is done inside BUILD.

## Loop guards (non-negotiable)

These exist because repeated work, not model choice, is what actually burns the budget.

1. **One research pass per gate.** If an answer isn't found, write the assumption
   into STATE.md and proceed. Do not search again for the same fact.
2. **A passing check is final.** Never re-run a check that passed unless the code it
   covered has changed since. No "let me just confirm."
3. **Two debug cycles, then stop.** After two failed fix attempts on the same defect,
   report the findings and hypotheses to the user. There is no silent third attempt.
4. **No subagent below the spawn cost.** Work touching <=3 files or <=200 lines is done
   inline. A subagent must save more context than its prompt and report consume.
5. **Never re-read what is already in context.** Read a file only when about to Edit it.
6. **One question batch per gate.** Collect every open question and ask once via
   AskUserQuestion. Never drip-feed questions across turns.
7. **No unrequested extras.** No docs, changelogs, formatting passes, coverage reports,
   or refactors the task did not ask for.

### Red flags — these thoughts mean you are about to burn tokens for nothing

| Thought | Reality |
|---------|---------|
| "Let me double-check that passed test" | Guard 2. It passed. Move on. |
| "Let me re-read the file to be sure" | Guard 5. It is in context. |
| "One more search for context" | Guard 1. State the assumption instead. |
| "I'll spawn an agent to read these two files" | Guard 4. Read them. |
| "Let me also tidy up / add docs while here" | Guard 7. Not asked. |
| "Third try will fix it" | Guard 3. Surface it to the user. |
| "I'll run the full suite again after ship" | It ran in CHECK. Done. |

## Token discipline (ambient, all gates)

- **Analyze in the sandbox, not in context.** To filter/count/parse/aggregate any output,
  run it through `ctx_execute_file` / `ctx_batch_execute` (context-mode) and print only
  the derived answer. If those tools are unavailable, pipe through Bash and echo only the
  conclusion. Raw bytes must not enter the conversation.
- **Read is for editing.** Use `Read` only when the exact bytes are needed to `Edit`.
- **Batch independent calls** into one message — always.
- **Artifacts go to files.** Return a path plus one line, never a pasted document.
- **Compact at gate boundaries only.** Never mid-gate; it destroys working state.

## Gate protocol

Read the matching reference **when entering that gate** — not before.

- FRAME → `references/gates.md#frame`
- BUILD → `references/gates.md#build` (TDD scope rule lives here)
- CHECK → `references/review.md`
- SHIP  → `references/gates.md#ship`

State file format and hygiene: `references/state.md`.

## Memory

At FRAME start, recall once: use `claude-mem-cowork:mem-search` if installed, else
`ctx_search(sort: "timeline")`, else read `.flow/MEMORY.md`. One query, batched.
At SHIP, append the decisions and surprises worth keeping. Nothing else writes memory.
Honor `<private>` — never persist anything inside those tags.

## Scope

Use Flow for real project work. Skip it entirely for a question, a scratch script, or an
explanation — running a four-gate loop on a one-liner is the waste this skill prevents.

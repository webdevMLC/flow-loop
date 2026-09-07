# Flow

One development loop. Four gates, hard loop guards, and a TDD rule.

This file is the portable form of the protocol, for any tool that reads `AGENTS.md` —
Codex, Cursor, Zed, Aider, Gemini CLI and others. Claude Code users get the same thing as
a skill (`skills/loop/SKILL.md`); the content is the same protocol either way.

**To use Flow in your own project:** copy this file to your project root as `AGENTS.md`
(or append it to the one you have), and copy `skills/loop/references/` alongside it. The
gate protocols are loaded from there on demand.

---

## Triage first — this is where the speed comes from

Not every task deserves four gates. Size the work before starting:

| Size | Looks like | Path |
|------|-----------|------|
| **Direct** | a question, a typo, a rename, a one-line fix | just do it — no gates, no state file |
| **Quick** | one file, requirement already clear, no new interface | BUILD → SHIP; still test-first if it is logic |
| **Full** | several files, a new interface, money/auth/data | all four gates |

Running the Full loop on Direct work is the most expensive mistake available here. When
torn between two sizes, take the smaller and escalate if you were wrong.

Size is not clarity. If you cannot state what "done" looks like in one checkable sentence,
the goal is not ready to build against **at any size** — read `references/brainstorm.md`.

## The loop

```
FRAME  ->  BUILD  ->  CHECK  ->  SHIP
  ^                     |
  +--- only on a CHECK failure that changes the goal
```

| Gate | Produces | Budget |
|------|----------|--------|
| FRAME | goal + task list in `.flow/STATE.md` | 1 recall + 1 survey + 1 question batch |
| BUILD | working code + tests | no research; assumptions already fixed |
| CHECK | one verdict report | 1 pass + 1 targeted re-verify |
| SHIP | commit / PR + memory write | 1 pass |

**No code is written outside BUILD.** No research is done inside BUILD. A failed check that
does not change the goal is fixed inside CHECK, not by re-framing.

## Loop guards (non-negotiable)

Repeated work, not model choice, is what burns the budget.

1. **Size before you start.** An unsized task defaults to over-ceremony.
2. **One research pass per gate.** If an answer is not found, record the assumption in
   `.flow/STATE.md` and proceed. Never search twice for the same fact.
3. **A passing check is final.** Never re-run a check that passed unless the code it
   covered changed since.
4. **Two debug cycles, then stop.** After two failed fixes on one defect, report findings
   and hypotheses. There is no silent third attempt. See `references/debug.md`.
5. **No subagent below the spawn cost.** Work touching ≤3 files or ≤200 lines is done
   inline.
6. **Never re-read what is already in context.** Read a file only when about to edit it.
7. **One question batch per gate.** The one exception is brainstorming, where the dialogue
   *is* the work — see `references/brainstorm.md`.
8. **No unrequested extras.** No docs, changelogs, formatting passes, or refactors the task
   did not ask for.

### Red flags — these thoughts mean you are about to burn tokens for nothing

| Thought | Reality |
|---------|---------|
| "Let me double-check that passed test" | Guard 3. It passed. |
| "Let me re-read the file to be sure" | Guard 6. It is in context. |
| "One more search for context" | Guard 2. State the assumption. |
| "Let me also tidy up while I'm here" | Guard 8. Not asked. |
| "Third try will fix it" | Guard 4. Surface it. |
| "This needs a proper plan" (for a typo) | Guard 1. It needs a keystroke. |

## Token discipline

- **Analyze without loading.** To filter, count, parse or aggregate any output, run it
  through a script and print only the derived answer. Raw bytes must not enter context.
- **Read is for editing.** Open a file only when you need its exact bytes to change it.
- **Batch independent operations** into one step — always.
- **Artifacts go to files.** Return a path plus one line, never a pasted document.

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
| The user has asked you to run unattended | `references/autonomous.md` |
| The run must continue past the end of a session | `references/continuous.md` |
| State file format, project profile, milestones | `references/state.md` |

## Test-driven development

Test-first is **mandatory** where a test can meaningfully fail: business rules,
calculations, money, auth, permissions, tenancy, data transforms, parsers, state machines,
API contracts. RED (a failing test that fails for the right reason) → GREEN (the minimum
code that passes) → REFACTOR.

Not required for config, scaffolding, wiring and glue, markup and styling, copy changes,
generated code, or migrations. Verify those by running them.

On Claude Code a hook enforces this mechanically. **On other platforms it is discipline**
— see "Enforcement" below.

## State

One file per project: `.flow/STATE.md` — goal, acceptance criteria, task list, assumptions,
decisions. It replaces planning trees and separate plan documents, and it is the whole
restoration step when context ends. `.flow/PROJECT.md` caches the stack, commands,
conventions and analogs so FRAME stops re-deriving them. Format: `references/state.md`.

## Enforcement

Flow ships two hooks that make the TDD rule and a green-tests-before-commit rule
mechanical rather than advisory. Hook support is platform-specific:

- **Claude Code** — both hooks are wired by the plugin and enforce automatically.
- **Codex** — a `.codex-plugin/` manifest is provided; the hooks accept Codex's payload
  shapes, but this path has not been verified against a live Codex install.
- **Everywhere else** — no hook layer. The protocol above still applies in full; the TDD
  rule is then discipline, exactly as it was before any of this was enforceable.

The hooks are plain Node with no dependencies (`hooks/flow-tdd-gate.mjs`,
`hooks/flow-commit-gate.mjs`) and read a `{tool_name, tool_input}` envelope on stdin,
printing JSON only when denying. Any host that can run a command before a file write can
use them.

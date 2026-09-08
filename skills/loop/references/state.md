# State file

One file per project: `.flow/STATE.md`. It replaces `.planning/`, phase directories,
plan documents, and every other multi-file planning store.

Small on purpose — it is read at the start of every session. Keep it under ~100 lines
by archiving finished work to `.flow/ARCHIVE.md`.

## Format

```markdown
# <project> — Flow state
Updated: <YYYY-MM-DD>

## Now
**Goal:** <one sentence — what done looks like>
**Gate:** FRAME | BUILD | CHECK | SHIP
**Mode:** normal | autonomous
**Wakes since commit:** <0 — only under `/loop`; at 2 the loop stops>
**Phases since review:** <0 — only in non-stop; at 3 the run pauses to be read>

### Acceptance criteria
- [ ] <statement> — `by test`
- [ ] <statement> — `by artifact`: <what is produced, and where it is saved>
- [ ] <statement> — `by person`: <the question a reader answers>

### Not building
- <explicit exclusion agreed during brainstorming>

### Tasks
- [x] <task> — <commit sha>
- [ ] <task>

### Analogs
- <new file> mirrors <existing file> — <what is being matched>

### Assumptions
- <fact assumed, because research was capped at one pass>

### Constants register
| Value | Means | Stated at | Lives in code | Verified |
|---|---|---|---|---|
| <value> | <what it governs> | <authority file:line> | <symbol or path> | [ ] |

### Threat register
- **T1 — <what an attacker does>** — impact / mitigation / lives in / proven by
- **Accepted:** <risk not mitigated, and why>

### Debugging
- **Symptom:** <what fails, and the exact command that reproduces it>
- **Ruled out:** <hypothesis — how it was falsified>
- **Next:** <the candidate being tested now>

### Deviations
- <what changed from plan, and why>

## Next
- <the following goal, one line>

## Decisions
- <YYYY-MM-DD> <decision> — <why, in one clause>
```

## Rules

- **One writer.** STATE.md is updated in the same commit as the work it describes — the
  commit gate refuses a source commit that leaves it untouched. Not continuously, and not
  batched up at the end of a gate.
- **Absolute dates.** Never "last week" or "yesterday."
- **No narration.** Facts and decisions, not a session log.
- **Archive on SHIP.** Move the finished `## Now` block to ARCHIVE.md, then compact.
- **Do not duplicate the repo.** Nothing that git history, the code, or CLAUDE.md
  already records belongs here.

## Session start

Read `.flow/STATE.md` if it exists — that read is the whole context restoration step.
If it does not exist, the project has not been framed; start at FRAME.

## Project profile — `.flow/PROJECT.md`

Written once, on the first FRAME. Read by every FRAME after that **instead of surveying
again**. This is the difference between deriving the same facts once and deriving them every
phase forever.

Update it only when something in it turns out to be wrong. It is a cache, not a document.

```markdown
# <project> — profile
Updated: <YYYY-MM-DD>

## Stack
<language, framework, database, package manager, test runner>

## Commands
- test:      <the full suite>
- test_fast: <unit tests only — no containers, no network. Used by the commit gate.>
- test_one:  <run a single file, e.g. pnpm vitest run <file>>
- typecheck: <e.g. tsc --noEmit>
- lint:      <e.g. eslint .>
- run:       <start the app>

## Conventions
- <error handling, naming, module layout, how results are returned — one line each>

## Analogs
- new API endpoint -> <closest existing one>
- new db module    -> <closest existing one>
- new test         -> <closest existing one>

## Landmarks
- <where the things you keep looking for actually live>
```

**Commands are the load-bearing part.** The CHECK machine pass, the commit gate, and
affected-test selection all read them. Without `test_fast` the commit gate cannot run, and
without `typecheck` the cheapest accuracy check in the loop is skipped.

**Analogs are the speed part.** FRAME's "find the closest existing file" becomes a lookup
rather than a search, and new code keeps matching the code around it.

If the profile is missing, FRAME writes it as its first act. If a command in it fails, fix
the profile — do not work around it silently, or the next phase pays the same cost again.

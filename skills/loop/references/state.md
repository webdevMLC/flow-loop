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
**Next action:** <the literal next thing to do — resume.md and continuous.md both continue from this>
**Authority:** <the document that decides values here, if any — references/authority.md writes it>
**Mode:** normal | autonomous | non-stop
**Wakes since commit:** <0 — only under `/loop`; at 2 the loop stops>
**Phases since review:** <0 — only in non-stop; at 3 the run audits itself and, if green, continues>

### Acceptance criteria
- [ ] <statement> — `by test`
- [ ] <statement> — `by artifact`: <what is produced, and where it is saved>
- [ ] <statement> — `by person`: <the question a reader answers>

### Not building
- <explicit exclusion agreed during brainstorming>

### Tasks
- [x] <task> — <commit sha>
- [ ] <task>

### Findings — not acted on, deliberately
- <what was noticed, why it was left, and what deciding it would need>

### Analogs
- <new file> mirrors <existing file> — <what is being matched>

### Assumptions
- <fact assumed, because research was capped at one pass>

### Constants register
| Value | Means | Stated at | Lives in code | Verified |
|---|---|---|---|---|
| <value> | <what it governs> | <authority file:line> | <symbol or path> | [ ] |

### Threat register
- **T1 — <what an attacker does>** — likelihood / impact / mitigation / lives in / proven by
  (`references/threat.md` owns the full block and ranks the register by likelihood)
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
  commit gate refuses a source commit that leaves it untouched in this commit or either of
  the last two. Not continuously, and not
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

## Design standard
Only if the project has a user interface. `references/uiaudit.md` verifies screens against
this section and treats it as the authority that matters more than any generic rubric — when
it is absent, that check silently degrades to generic pillars. Record the styling layer, the
component library, the palette and type, and any rule a screen could break while still looking
fine ("no user appears in rank order against another", "no widget shows location or a ranking
mechanic").

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

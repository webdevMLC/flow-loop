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

### Acceptance criteria
- [ ] <testable statement>
- [ ] <testable statement>

### Tasks
- [x] <task> — <commit sha>
- [ ] <task>

### Analogs
- <new file> mirrors <existing file> — <what is being matched>

### Assumptions
- <fact assumed, because research was capped at one pass>

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

- **One writer.** STATE.md is updated at gate transitions only, not continuously.
- **Absolute dates.** Never "last week" or "yesterday."
- **No narration.** Facts and decisions, not a session log.
- **Archive on SHIP.** Move the finished `## Now` block to ARCHIVE.md, then compact.
- **Do not duplicate the repo.** Nothing that git history, the code, or CLAUDE.md
  already records belongs here.

## Session start

Read `.flow/STATE.md` if it exists — that read is the whole context restoration step.
If it does not exist, the project has not been framed; start at FRAME.

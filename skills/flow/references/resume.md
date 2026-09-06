# Resuming and handoff

Context ends — compaction, a new session, a different machine, another person. What survives
is `.flow/STATE.md`. Everything else is gone and re-deriving it is the single largest
avoidable token cost in a long project.

## Before you lose context

Write the handoff **before** compacting or stopping, not after. Compact at a gate boundary
(SKILL.md token discipline), and immediately before it update STATE.md with:

- **Gate** — which one you are in, and how far through it
- **Done** — tasks checked off, with commit shas
- **Next action** — the literal next thing, specific enough to act on cold.
  "Wire the refund path" is not it. "Add `refundBooking` to `packages/db/src/ledger.ts`,
  mirroring `chargeBooking` at line 112; test already written at `test/refund.test.ts`" is.
- **Assumptions** — anything you decided rather than verified
- **Dead ends** — what you tried that did not work, so it is not tried again
- **Open debugging** — the `### Debugging` block from `references/debug.md`, if any

If a task is half-done in the working tree, say so explicitly and name the files. An
uncommitted half-edit that nobody knows about is worse than no work at all.

## On resume

**Read `.flow/STATE.md`. That is the whole restoration step.** One file.

Then continue from `Next action`. Do not:

- re-explore the codebase to "get oriented" — STATE.md is the orientation
- re-read files you are not about to edit (guard 6)
- re-run checks that already passed (guard 3)
- re-research a fact already recorded under Assumptions (guard 2)
- re-ask a question already answered under Decisions

Only if STATE.md is missing or plainly stale do you rebuild context — and then you FRAME,
you do not wander.

## Verify the world matches the file

STATE.md records what was *intended*. Before continuing, one cheap reality check:

```
git log --oneline -5
git status --porcelain
```

If they disagree with STATE.md — commits it doesn't mention, uncommitted files it doesn't
list — trust the repository and correct the file. Someone else, or another session, may have
moved the work. Reconcile before building on it.

## Concurrent sessions

If commits appear that this session did not make, another agent or person is working the same
branch. Stop writing. Read `git log --format='%h %an %s'` to see who and what, and reconcile
before continuing. Two agents editing one file is how work gets silently overwritten.

## Milestones

For work spanning many phases, keep the roadmap in STATE.md's `## Next` as one line per
phase — not a separate document, not a directory tree. A phase becomes the `## Now` block
when it starts, and moves to `.flow/ARCHIVE.md` when it ships.

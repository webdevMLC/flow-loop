# Undoing a phase

A run that ships twenty phases unattended must be able to take one back. Flow could not:
nothing recorded which commits belonged to a phase, so undoing one meant reading history and
guessing.

## SHIP writes the manifest

Append to `.flow/MANIFEST.md` as each phase ships:

```markdown
## Phase 14 — From Empty To Running
Commits: 4e8a1c2..a1b2c3d (9 commits)
Migrations: 0027, 0028
Depends on: Phase 12 (the console shell it adds screens to)
Self-selected: no
```

Written at SHIP, from facts in hand. Reconstructed later it is guesswork, and a reversal built
on guesswork is worse than none.

## Reversing

**The loop never reverses anything on its own.** Rewriting history is destructive and belongs
to the person who owns the repository — the hard stops in `references/autonomous.md` apply.
What the loop produces is the procedure:

1. **Check what depends on it.** Any later phase whose manifest names this one. Reverting a
   phase with dependents breaks them; say which, and stop.
2. **Revert the commits in reverse order**, oldest last. The manifest gives the range.
3. **Migrations do not revert with the code.** `git revert` restores files, not tables. The
   phase entry in `.flow/RELEASE.md` says whether each migration reverses, how, and which
   destroyed data that no revert brings back.
4. **Re-run the full suite.** A revert can break a later phase that quietly came to depend on
   what it removed.
5. **Correct `.flow/STATE.md` and the roadmap.** A reverted phase is not "not started" — it is
   reverted, with a date and a reason, or the next run rebuilds it.

## The honest limits

**A revert is not an undo.** It is a new commit inverting an old one. Data written while the
code was live stays written; a migration that dropped a column already destroyed it.

**Twenty phases deep, reverting phase 14 may not be feasible** — and the manifest tells you
that in a minute rather than after an hour of trying. If half the later phases name it, the
honest answer is to fix forward. Say so rather than attempting it.

**A phase with no manifest entry cannot be safely reverted at all.** Every phase shipped before
this file existed is in that category; the entry is one line to add whenever it next matters.

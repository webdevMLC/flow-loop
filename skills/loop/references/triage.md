# Triage — what a finding is allowed to become

A finding being real does not make it a phase. This file decides which findings become work
now, which are batched, and which are recorded and left — and it exists because of a measured
failure mode: **the review stage feeding the build stage until nothing else gets built.**

Measured on a real payroll project: 217 commits over 48 days, **25 of them adding capability**
and 65 citing a checkpoint. The last ten commits in a row were repairs tagged `C31`, `C32`,
`C33`, `R4-A`, `R4-B`, `R4-C` — one finding fanning into three commits, each fix reviewed by
the next checkpoint, which produced more findings. On a second project, **133 of 138 roadmap
entries originated in a checkpoint.** Neither loop was malfunctioning. Agents asked to find
defects find defects, and nothing decided which ones were worth stopping for.

## The floor

| Severity | What it becomes | When |
|---|---|---|
| **BLOCKER** | its own phase | immediately — it gates the ship |
| **MAJOR** | its own phase, or batched with others touching the same module | this milestone |
| **MINOR** | **recorded in `.flow/MINORS.md`; never its own phase** | swept as one batch at the milestone |
| **NOTE** | recorded only | read at the milestone, actioned only if it became something |

**A phase whose findings are all MINOR or NOTE is refused by the commit gate.** Batch them.

This is not "ignore the small things". Every MINOR is recorded with the same evidence a phase
would carry — where it is, what is wrong, what a person experiences — and the sweep is
mandatory, not optional. What changes is that fixing a label and fixing a money defect stop
costing the same: a phase, a CHECK, and a place in the next review's surface.

## Nothing is dropped, and that is enforceable

`.flow/MINORS.md`, one entry per finding, appended as they are found:

```markdown
### M14 · the empty state says "No data" · UIUX-2026-09-20 · MINOR · open
`/timesheets` with no rows. Says "No data"; every other empty state on the product says what
to do next. **Sweep:** copy, one line. **Found again:** C31 (as C31-D).
```

Three rules keep the register honest:

- **The sweep is a phase, at every milestone.** It takes the whole register, fixes what is
  still true, and closes each entry with its evidence. `/flow:ready` check 3 reads this file:
  **a milestone cannot be declared with an open MINOR that has survived two sweeps.**
- **A finding found twice is not MINOR any more.** Record the second sighting on the same
  entry; the second recurrence escalates it to MAJOR automatically. Something that keeps
  coming back is a cause, not a blemish.
- **An entry that outlives two milestones escalates or is closed as "won't fix" with a
  reason** the owner can overturn. A register nobody empties is the failure this replaces.

## What can never be MINOR

Severity is the thing a floor invites you to game, so four classes are fixed regardless of how
small the diff looks:

- **Anything touching money** — a rate, a total, a rounding, a ledger row, a tax figure.
- **Anything touching auth, permission or tenancy** — who can reach what.
- **Anything where data is wrong in the database**, as opposed to displayed oddly. A wrong row
  outlives every screen that shows it.
- **Anything a person could be harmed by being told** — a wrong balance, a wrong entitlement,
  a wrong medical or legal figure.

A finding in these classes is MAJOR at minimum. "It is only one field" is the sentence that
precedes most of them.

## Stop re-reviewing repairs

The second half of the loop, and the cheaper fix. **A review pass examines new ground, not the
repairs the last pass produced.**

- A fix for `C32` is in scope for the *next* review only if it touched code outside the finding
  it closed. Say so in the commit and the next pass skips it.
- **The re-verify of a repair is the repair's own criterion**, not a new review. It was closed
  by a test or an artifact; that is the check, and doing it twice is the duplication CHECK's
  own guard exists to prevent.
- If a repair *does* need the wider look — it changed a shared module, a schema, a permission —
  that is a BLOCKER-or-MAJOR-shaped change, and it gets one, not a whole checkpoint.

## And run reviews less often

31 checkpoints in 48 days is one every other day on a codebase that is mostly settled. A
review pass earns its cost at a boundary, not on a clock:

| Run one | Not |
|---|---|
| at a milestone | every N phases regardless of what they were |
| when a phase touched money, auth, PII or outside input | after every phase because the last one found something |
| when the previous pass found a BLOCKER — the neighbourhood is suspect | to confirm a repair landed |
| when the owner asks | to fill a wake that had nothing queued |

**Two consecutive passes that find nothing new is the signal to stop passing**, not to look
harder. On the payroll project, checkpoints 36–41 found zero findings each and the loop kept
going, because nothing said it could stop.

## The one thing this must not become

A way to ship a known defect. The register is read at every milestone and by `/flow:ready`;
an open MINOR is visible in the verdict, with its age. If the honest answer is "we are
shipping with fourteen known blemishes", that is a sentence the owner gets to read and accept —
which is the whole difference between a backlog and a secret.

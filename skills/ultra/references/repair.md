# Stage 4 — repair

The inspection is over. This stage fixes what it found, and it is on by default: running
`/flow:ultra` and getting a document is not a result, it is homework.

## Seal the report first

**Write the report to disk, complete, before changing one line of source.** It is the record of
the system *as inspected*, and repair invalidates it the moment it starts. If it cannot be
written, do not start repairing.

The file is `.flow/ULTRA-<date>.md`; if one already exists for today, add `-2`, `-3`. Readers
glob `.flow/ULTRA-*.md` and take every open finding across all of them, so an old report never
becomes invisible by being superseded.

**Every finding needs a stable id** — `BLOCKER 3`, `MAJOR 7` — assigned when the report is
written. The status line, the phase that fixes it and the roadmap sweep all address findings by
that id, and a report without ids cannot be tracked.

## How stage 4 runs the loop

**Autonomously, over the sealed findings and nothing else.** Set `Mode: autonomous` in STATE.md
for the pass; questions become assumptions recorded under `### Assumptions`, per
`references/autonomous.md` **in the loop skill**.

That file's precondition is already met: **the finding is the frame.** It carries a goal and an
acceptance criterion before the pass starts, which is exactly what autonomous mode requires and
usually lacks.

**Invoking `/flow:ultra` without saying "report only" is the opt-in.** This is the one place
autonomy is not inferred — the user asked for a repair pass, not a conversation. It is scoped
to this report's findings, it does not carry into the next phase or the next session, and every
hard stop in `references/autonomous.md` **in the loop skill** fires unchanged.

Without that, the two readings give opposite runs: twelve question batches that stall the
moment the user walks away, or an agent granting itself standing consent the loop says only the
user can give.

## Re-confirm before framing

The report may be minutes old or weeks old, and the code has moved. **Reproduce the finding's
concrete failure before framing a phase for it.** It is one drive of the flow, and it is far
cheaper than building a fix for something already fixed.

If it no longer reproduces, mark it `stale` with the date and move on. Do not delete it — a
finding that stopped reproducing without anyone fixing it is worth someone knowing about.

## Each finding becomes a phase

Worked by `/flow:loop` with every gate: FRAME, BUILD, CHECK, SHIP, the TDD gate, the commit
gate. Nothing here is a special repair mode.

**The acceptance criterion is the finding, inverted.** Ultra requires every finding to carry a
concrete failure — inputs or state → wrong outcome — and that sentence is already a criterion
with the outcome flipped:

> **Finding:** booking 1041 with a ₱46,000 value writes `commissions.rate = 0.0625`; the
> partner agreement §4 states 2%. 41 rows are already written at the wrong rate.
>
> **Criterion:** a ₱46,000 booking writes `rate = 0.02` and `amount = 920.00`, proven by a test
> that fails against the current code. **The 41 existing rows are a separate recorded
> correction, with its query — not part of this criterion.**

Because the criterion is that specific, CHECK verifies most fixes directly. **Two kinds need
more**, and CHECK already has the machinery:

- A **stage 1** finding (it does not start, the instructions are wrong) is only closed by
  starting it again the documented way from clean. A green suite says nothing about it.
- A **stage 2** finding (the data is wrong) is closed by `references/dataflow.md` **in the loop
  skill** — CHECK's own pass drives the write through the product and reads the row back. Name
  the table in the criterion so that pass knows to cover it.

## Order, and batching

**BLOCKERs first, then MAJORs, then MINORs.** Do not jump to an interesting MINOR because a
BLOCKER looks hard.

**Findings are not phases one-for-one.** Forty findings is not forty phases. Batch when they
share a root cause or a file: six missing empty states is one phase; four endpoints missing the
same authorization check is one phase whose criterion names all four. **A mixed-severity batch
takes the position of its highest severity** — and if batching would pull a MINOR ahead of an
unrelated BLOCKER, do not batch it.

Split when a finding is really several. "The commission module is wrong" is not a finding, and
a report containing one has a defect in the report.

Say the batching out loud in the plan, so the report's finding count and the phase count
reconcile.

## What repairs itself, and what stops

The loop's hard stops apply unchanged — pushing, opening a PR, deploying, secrets, money
movement, deleting data, a scope change. On top of those, **these are framed but not built**:

- **It needs a decision, not an implementation.** "Two paths to `earned` leave different data" —
  which one is right is a product question.
- **It requires a schema migration.** Ultra never creates one, and neither does its repair pass.
- **It needs a credential, a licence, a provider account, or money.**
- **The fix is larger than the finding.** Repairing it means restructuring a module: that is a
  roadmap item, not a repair phase.
- **It requires correcting data already written.** Fixing the code is a repair phase; rewriting
  rows that already exist is not. **A backfill is not a schema migration, so the rule above does
  not catch it — and it is neither a delete nor a spend, so no hard stop in
  `references/autonomous.md` fires either. This line is the only thing that stops it.** Write
  the correction as a script with its query, its row count and its evidence, and stop for the
  user to run it. **Stage 4 writes source, never rows.** A row count in a finding is the size of
  the damage, not repairable state.

**"Stops" means this finding is marked `blocked` and the pass moves to the next one.** It does
not end the run. A pass that halts on its first product question leaves eleven BLOCKERs unfixed
because one of them needed a sentence from a human.

Everything else is built. **Commits stay local — repair never pushes, opens a PR or deploys.**
That boundary is what makes leaving the pass running safe.

## Status lives in the report, and the loop writes it

The sealed report gains a status line per finding. **Only that line is ever edited** — nothing
else changes, because the rest is the record of what was true at inspection time.

**Write it at SHIP of the phase that resolved the finding**, in the same commit as the code. A
status written later is a status that gets forgotten, and the whole defence against re-proposing
a fixed finding rests on it.

```markdown
Findings: 43 · open 12 · fixed 26 · blocked 3 · wont-fix 1 · stale 1

## BLOCKER 3 — commission rate is 3.125x the contracted value
**Status:** fixed · phase 34 · 2026-09-15

## MAJOR 7 — two paths to `earned` write different rows
**Status:** blocked · needs a decision: which path is correct?

## MAJOR 9 — 41 commission rows hold the wrong rate
**Status:** blocked · correction script written, needs the user to run it

## MINOR 12 — duplicate bookings are possible
**Status:** open
```

Five values, and no others:

| | Means | Written by |
|---|---|---|
| `open` | not yet worked | the inspection |
| `fixed · phase N · date` | repaired and shipped | the repair phase's SHIP |
| `blocked · <what it needs, from whom>` | cannot be built here — **not settled** | the repair pass |
| `stale · no longer reproduces · date` | re-confirm failed | the repair pass |
| `wont-fix · <reason> · <who decided>` | a deliberate decision | **only ever a person** |

**The pass never writes `wont-fix` on its own judgement.** It is the one value that closes a
finding without fixing it, and an unattended run deciding a BLOCKER is not worth fixing is the
failure this whole stage exists to prevent. If the pass believes one is not worth fixing, it
says so in the closing report and leaves it `open`.

`open` and `blocked` are both picked up again by the roadmap sweep — `blocked` becomes workable
the moment its blocker clears, and nothing else will notice that it has.

## Bound the pass

With no budget named, the default scope is **every BLOCKER**, then report and stop. That is the
honest unit: BLOCKERs are the findings that mean the system ships broken.

But scope is not a ceiling. The loop's own stop conditions still apply and they are what stop a
runaway: two consecutive phases with no commit, two failed debug cycles on one defect, CHECK
failing twice on one finding. On top of them, **stop and report if a third of the findings
attempted end `blocked`** — that is a report that needed a conversation, not a repair pass.

A named budget replaces the default scope: a severity, a count, a wall-clock, a token ceiling.

## Turning it off

Repair is on by default. It is skipped only on an explicit instruction not to change anything —
**"report only"**, `--report-only`, **"don't fix"**, **"just tell me what's wrong"**, **"don't
change anything"** — and automatically when the inspection found nothing above MINOR.

**Asking for an inspection is not asking not to be fixed.** Every phrasing this command
advertises is inspection-shaped — "is this actually working", "check before the pilot" — and
treating those as an opt-out restores exactly the behaviour this stage removed. The user must
have said *don't change it*.

Say which happened. "Inspection complete, 43 findings, repair skipped because you asked for a
report" is a result; silently not repairing is the thing this stage exists to remove.

## The closing report

Extend the ULTRA report rather than starting a document — the status lines are already there;
this is the summary over them:

- What was fixed, with the phase number for each.
- What is blocked, on precisely what, and from whom. **Correction scripts written and not run
  belong here, with their row counts.**
- What went stale.
- **What is still open and why** — the number the user actually wants.
- The re-verification note: each fix was proven by its own phase's CHECK. Say plainly that the
  system as a whole was not re-inspected, and recommend a fresh `/flow:ultra` if a large share
  of the findings were in one module — one wrong rate is rarely alone.

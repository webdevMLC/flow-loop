---
name: datatest
description: Exhaustive data testing of a system as built — QA testers who each own one dimension of the matrix (boundary, adversarial input, duplicate and replay, concurrency, state transitions, cross-module, money) drive every flow through the UI and the API against a disposable database, read the rows, and report defects with reproduction steps. Every confirmed defect becomes a failing test committed to the suite, then the loop repairs it. Use before a pilot, after a long unattended run, when data looks wrong and nobody can say why, or when the suite is green and the product is not. Never runs against production.
---

# Data test

`/flow:ultra` drives the critical flows and reports. CHECK's data pass drives one phase's
writes. This drives **everything**, from every angle a tester would, and **leaves the tests
behind** — so a defect found today cannot come back silently next month.

It exists because of a specific failure: 230 assertions against a real MySQL, mutation gates
green, a five-stage CHECK — and the first tap in the field produced a board that said "no leads
yet" over a claim that had succeeded. The tests called the writer. Nobody drove the product.

| Stage | Asks | Cost |
|---|---|---|
| **1 Map** | what can be written, by whom, and what should be true afterwards? | cheap |
| **2 Test** | seven testers, each driving one dimension of the matrix | the bulk |
| **3 Falsify** | is each defect real, reproduced by someone who did not find it? | moderate |
| **4 Persist** | every confirmed defect becomes a failing test in the suite | small |
| **5 Repair** | the loop fixes them, one phase per root cause | the rest |

## Before anything else

**"Test the data" does not mean write tests that call the writer.** A test that calls
`createBooking()` and asserts on the return value has verified the function. It has not
verified that a person pressing **Submit booking** produces a row a manager can see. Every
flow here is driven **through the product** — the UI where one exists, the endpoint where it
does not — and the proof is the row, read back with a query.

**"Simulate" does not mean mock.** A mocked API client hands the screen a board the real
system cannot produce, and that is how 209 green mobile tests missed an empty board. Nothing
here is mocked except the external services the project already stubs, and those are named
in the report.

**"Catch errors" does not mean assert on success.** A `200` and a toast are claims. The test
reads the table, counts the rows, checks the values against what the authority says they
should be, and checks what *else* changed. A success response with the wrong number in the
row is the defect this command exists to find.

**A tester who finds nothing is reporting coverage, not health.** Say what was driven, what
was read, and what could not be reached. "All passed" on a real system with no named gaps
is the least believable sentence a tester can write.

**A disposable database, always.** Never production, never shared staging. Every tester
seeds what it needs and the environment is thrown away. If the only reachable database is
production, stop and say so.

## Stage 1 — Map

Read `references/matrix.md`. From the project skill's flows and entities if one exists, else
from the code: every write path, who may perform it, what the rows should hold afterwards,
and what else should change. Then build the matrix — one row per flow per dimension. The
map is what the testers divide; a tester without a map wanders.

## Stage 2 — Test


### Tier by the kind of work, not by the dimension

The first cut of this rule split the testers — four harness, three frontier. That was still the
wrong axis. **Every dimension does the same three things, and only two of them need a model:**

| Step | What it is | Tier |
|---|---|---|
| **1. Build the oracle** | decide what *should* be true: the expected row after this flow, the invariant that must hold elsewhere, the money formula re-derived from the authority | **frontier**, once per flow |
| **2. Drive and compare** | run the cases, read the rows, diff against the oracle | **a script.** No model in the loop at all |
| **3. Judge a failure** | what does this difference mean, is it a defect, how severe | **frontier**, and only on the rows that failed |

Deciding a payroll total should be ₱15,432.10 is the hard part. Running the query that returns
₱15,001.00 and noticing they differ is `!==`.

**Measured on a real run, before this rule:** sixteen frontier subagents made **1,106 shell
calls, 171 of which touched the database**. The busiest made 168 tool calls over 49 minutes -
about 17 seconds a turn, all of it the model composing a 286-character script to run a query
whose expected answer it had already worked out. The database answered in milliseconds. The
testing was not slow; the turn-taking was.

So the shape is:

1. **One frontier pass builds the oracle** for the whole matrix - every flow, every dimension,
   written to `scratchpad/datatest/oracle.json`: the case, the drive, the expected rows.
2. **One script drives it**, written once, run over the whole matrix, appending every
   difference to the dimension files. It does not get bored at case 200 and it does not
   misread a row.
3. **A frontier pass reads only the differences** and decides which are defects.

Three model turns per dimension where there were a hundred and fifty. **If a tester is making
one shell call per test case, it is doing step 2 by hand and the run is paying frontier rates
to type SQL.**

**The exception that stays interactive:** a case whose *next* step depends on what the last one
returned - walking a state machine into a corner, or following a concurrency race. Those are
genuinely turn-by-turn. They are a minority of any matrix, and naming them as the exception is
how you notice when everything has quietly become one.

**Build the harness once, keep it.** Stage 4 commits a failing test per defect anyway; the
drivers those tests use are the same drivers. A second run of `/flow:datatest` on the same
project should be mostly re-execution, and cost a fraction of the first.

Read `references/testers.md`. **Each tester opens its own `scratchpad/datatest/<dimension>.md`
before driving anything and appends every defect as it confirms it** - never one report at the
end, so an interrupted run keeps what it found. Spawn the testers **in a single message** so they run
concurrently, each owning one dimension and driving every flow through it. They return
defects with reproduction steps and the query that shows the wrong row — never opinions,
never "consider". The boundary tester and the concurrency tester will find different things
in the same flow; that is why there are seven and not one.

## Resuming a run that died

Long runs die — a context limit, a restart, an owner interrupting. **Check for the work before
redoing it**, because stage 1 is the expensive half and it is already on disk:

| Present | Then |
|---|---|
| `scratchpad/write-paths.json`, `table-index.md`, `datatest-matrix.md` | **stage 1 is done.** Re-read them; do not re-map. Say in the report they came from the earlier run and on what date |
| `scratchpad/datatest/<dimension>.md` with entries | that dimension is **partly driven.** Read its running note, continue from the flows it has not covered, keep appending to the same file |
| a dimension file that exists but is empty | it started and died before confirming anything — drive it from the top |
| no file for a dimension | it never started |

A measured case: seven testers drove a 44-flow matrix for most of a day against a live
disposable database, the run was interrupted, and **zero reports existed afterwards** — the
map survived because it was written to disk, and hours of driving did not because it was not.
The fix is in `references/testers.md` (append as you confirm); this is the other half, so the
next run does not pay for the same ground twice.

**Re-check the environment before continuing**, not after: the disposable database and the app
must still be up, on the ports the brief named, with the baseline the testers were forbidden to
change still intact. If any of that is gone, the partial findings stay valid as *findings* but
their reproduction steps need re-running — say so rather than trusting them.

## Stage 3 — Falsify

Every defect gets one refutation attempt, **by a tester who did not find it**, told to
reproduce it from the steps alone and default to refuted if it will not reproduce. What
survives is reported; what does not is dropped with the reason. The finder never verifies
their own finding — that is the substitution CHECK's own rules exist to prevent.

## Stage 4 — Persist

Read `references/persist.md`. **Every confirmed defect becomes a failing test, committed.**
Not a note, not a ticket: a test in the project's own suite, named for the defect, red
against the current code, driving the flow the way the tester did. That is the difference
between this command and an inspection — the finding cannot be forgotten, because the suite
is red until it is fixed.

The TDD gate allows this: a new test file is always writable.

## Stage 5 — Repair

The report is `.flow/DATATEST-<date>.md`, sealed before anything is fixed, findings most
severe first in CHECK's severities, each with a stable id and a status line. Then the same
repair protocol as `/flow:ultra` — `references/repair.md` **in the ultra skill** — each
finding to the loop as a phase, BLOCKERs first, batched by root cause. The persisted tests
are the acceptance criteria: a phase is done when its test is green.

Repair is on by default; **"report only"** stops after stage 4, with the red tests committed.

## Never

- **Never run against production or shared staging.**
- **Never mock the thing under test.** Only what the project already stubs, named.
- **Never let a tester verify their own finding.**
- **Never report a defect without the query that shows the wrong row.**
- **Never fix during stages 1–4.** The report describes the system as tested.
- **Never write a passing test for a defect.** The test is red until the loop fixes it.

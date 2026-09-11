---
name: datatest
description: Exhaustive data testing of a system as built — QA testers who each own one dimension of the matrix (boundary, adversarial input, concurrency, state transitions, cross-module, money, permissions) drive every flow through the UI and the API against a disposable database, read the rows, and report defects with reproduction steps. Every confirmed defect becomes a failing test committed to the suite, then the loop repairs it. Use before a pilot, after a long unattended run, when data looks wrong and nobody can say why, or when the suite is green and the product is not. Never runs against production.
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

Read `references/testers.md`. Spawn the testers **in a single message** so they run
concurrently, each owning one dimension and driving every flow through it. They return
defects with reproduction steps and the query that shows the wrong row — never opinions,
never "consider". The boundary tester and the concurrency tester will find different things
in the same flow; that is why there are seven and not one.

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

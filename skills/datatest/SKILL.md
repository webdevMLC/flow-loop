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


### The tier is per tester, and most of this is a harness, not an agent

"Seven testers on the frontier model" is the expensive, wrong answer. Look at what they do:
five of the seven **drive** — every input to its edge, every write twice, two actors at once,
every lifecycle edge, a write here and a read there. That is execution and comparison, and
the case list is **generated from the schema and the lifecycle**, not reasoned out. A frontier
agent clicking through a matrix a script could drive is the most expensive way to run a loop.

| Tester | Tier | Why |
|---|---|---|
| **Boundary** | **harness** | the edges come from the column types and constraints; generate the cases, drive them, diff the rows |
| **Duplicate and replay** | **harness** | send it twice, compare — there is no judgement in it |
| **Concurrency** | **harness** | two writers on one row, genuinely at once; the hard part is the setup, not the thinking |
| **State machine** | **harness** | the edges are enumerable from the lifecycle the project skill names |
| **Adversarial input** | **frontier** | *valid to the form and wrong for the domain* cannot be generated — it needs to know what the domain means |
| **Cross-module** | **frontier** | deciding what *should* have changed elsewhere is the invariant nobody wrote down |
| **Money** | **frontier** | re-deriving every number by hand from the authority is the hardest judgement here, and the one that costs most when wrong |

So **four harness, three frontier** — not seven frontier. And the harness half gets *better*:
a generated matrix does not get bored at case 200, and a script diffing rows does not
misread one.

**Stage 3 falsification is cheap.** The claim, the steps and the query are all in the prompt.

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

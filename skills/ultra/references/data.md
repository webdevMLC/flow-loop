# Stage 2 — what happens to the data

The bulk of the inspection, and the part no gate in the loop performs.

The rule the whole stage rests on: **a response is not a record.** A `200`, a success message,
a redirect, an integration test asserting on a response body — none of them is evidence that
anything was written, written once, written correctly, or still correct after the next request.
Read the rows.

## Pick the flows that matter

Not every endpoint. The flows where being wrong is expensive:

- **Money.** Anything that creates, moves, reverses or reports an amount.
- **Permissions and ownership.** Who may see or act on a record, and what happens across tenants.
- **Anything irreversible.** Deletions, state that cannot go backwards, external calls.
- **Anything with a lifecycle.** Statuses that transition, things that expire, things that
  reconcile.
- **The flows the product is for.** If a system exists to let an associate claim a lead, that
  flow is inspected however boring its code looks.

## Build the matrix for each

For every flow, exercise every row that applies. This is the list, and the value is in the
boring rows:

| Row | What it asks |
|---|---|
| **Positive** | the intended path, end to end, and the rows it leaves behind |
| **Negative** | rejected input — and that nothing was written on the way to the rejection |
| **Boundary** | zero, one, empty, maximum, the day the window opens and the day it closes |
| **Duplicate** | the same request twice. Idempotency, or two rows where one belongs |
| **Concurrent** | two callers at once. The race the code says cannot happen |
| **Status transition** | every legal move, and every illegal one refused |
| **Cross-module** | the flow that spans two subsystems, where each is correct alone |
| **Financial** | the amount, the rate, the rounding, the reversal, and the sum afterwards |
| **API** | the contract as published, including the errors it promises |

## Verify in the database

After each case, query the tables. Specifically:

- **Row count.** One row where one belongs, none where none does.
- **The values themselves** — the amount, the rate, the foreign keys, the timestamps.
- **What else moved.** An audit row, a ledger entry, a status column somewhere else. A flow that
  wrote its own table and forgot the audit trail passes every response assertion.
- **What did not move.** A rejected request that left a partial write is the defect this row
  exists to find.

## Never change the schema

**Do not create migrations. Do not alter tables. Do not add an index to make a case pass.** If
the data model cannot express something, or a constraint is missing that would have prevented a
defect, **record it as a recommendation with the evidence** and leave it. Changing the schema
mid-inspection means the thing you tested is not the thing that shipped, and a migration written
by an inspector has been through none of the project's gates.

The same applies to seeds and fixtures: create what you need in a disposable database, and say
in the report what you created.

## Use a disposable database, always

Never production. Never a shared staging one. Bring up a container, migrate from empty, seed
what the matrix needs, and destroy it afterwards — this stage deliberately writes bad data, and
concurrency cases deliberately race.

## Report each finding as a reproduction

Not "duplicate submissions may create two rows". Instead: the request, sent twice, with these
values, produced two rows in this table with these ids, and the ledger shows the amount counted
twice. A finding a reader can reproduce in one paste is a finding that gets fixed.

## What "clean" means here

If the matrix runs green, say precisely what was covered: which flows, which rows, how many
cases, against what database version. **A clean stage 2 that does not list its coverage is
indistinguishable from a stage 2 that ran three cases** — and the difference matters enormously
to whoever reads it next.

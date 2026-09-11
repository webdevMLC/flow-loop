# The matrix — every flow, every dimension

The map is the list of everything that writes. The matrix is that list crossed with every
way a write goes wrong. Testers divide the matrix; nothing is tested that is not on it, and
nothing on it goes untested without being named as a gap.

## Build the map first

**From the project skill if one exists** — its `## The process flows` and `## Entities and
lifecycles` sections are the authority on what should be true. Without one, from the code:
every route or handler that writes, every form that submits, every job that runs on a
schedule, every webhook that lands.

For each write, record before any tester runs:

| | |
|---|---|
| **Who** | which role may perform it — and which may not |
| **Through** | the screen, the endpoint, the job |
| **Writes** | which tables, which columns |
| **Should hold** | the values, against the authority document, not against the code |
| **Also changes** | the audit row, the counter, the parent's status, the denormalised total |
| **Reverses by** | cancel, refund, unapprove — or "never", stated |

The last three rows are where defects live. The write itself usually works.

## The dimensions

One tester owns each. Every flow on the map is driven through every dimension that applies.

**Positive** — the flow as designed, with valid input, by the right role. Establishes that the
happy path lands the row with the right values. Cheap and necessary; not sufficient.

**Boundary** — the edges of every input. Zero, negative, the maximum the schema allows and one
past it, empty string, whitespace, the longest name in the real data, a date at midnight on a
month boundary, a timezone the server is not in, Unicode the column was not declared for,
`0.01` and `999999.99` in a money field. A boundary that is accepted and stored wrong is a
defect; one that is rejected with a message a person cannot act on is a MINOR.

**Adversarial input** — input that is valid to the form and wrong for the business. A booking
date before the partner was signed. A commission rate of 25 where the field means 0.25. A name
that matches an existing record with different casing. Two fields that are individually valid
and jointly impossible.

**Duplicate** — the same request twice. Once by pressing the button twice, once by replaying
the request, once by two tabs. Two rows where there should be one is the defect; so is a
second submission silently overwriting the first.

**Concurrent** — two actors on the same record at once. Two managers approving the same
booking, an associate editing while a close runs, a reversal landing during a statement
generation. Drive them genuinely concurrently, not in sequence, and read what the rows hold
afterwards. Lost updates and double-counted totals live here.

**State transition** — every entity's lifecycle, every edge, in every order the UI allows and
several it does not. Forward, back, skip a state, transition a terminal state, transition
twice. A `paid` statement that can be edited is a defect. A `reversed` claim that can be
reversed again is a defect. A state reachable only by a migration is a defect.

**Cross-module** — a write in one module and its consequence in another. A booking reversed
after the commission was earned: does the ledger correct, does the statement, does the
associate's balance? A partner suspended: do their open bookings still pay? This is where
"every module correct, the system wrong" is caught, and it needs a tester who reads across
boundaries.

**Money** — anything with an amount. Re-derive every number by hand from the authority
document, then compare to the row. Sum every ledger and check it against every total shown
on a screen. Round-trip every currency through storage. One project stored `0.0800` where the
contract said `0.2500`; every test was green because the tests were written from the code.

**Permission** — every write, attempted by every role that should not be able to. And by no
role at all. The check is not "was it refused" but "was nothing written" — a refusal that
still inserted the row is the worse defect.

## What a matrix row looks like

```
flow: submit booking · dimension: duplicate
  drive: POST /api/bookings twice, same body, 40ms apart, as associate A
  expect: 1 row in bookings; 1 in lead_claims; ledger unchanged until approval
  read:  SELECT count(*) FROM bookings WHERE partner_id=? AND booking_date=? AND amount=?
```

Every row names the drive, the expectation and the query. A tester who cannot write the
query for a row has not understood the flow yet.

## Coverage is a number

The report says how many matrix rows exist, how many were driven, and names every one that
was not — with why. A matrix of 140 rows with 90 driven and 50 named is an honest test. A
report that says "tested thoroughly" is not.

# The testers

Seven, spawned in one message, each owning one dimension of the matrix and driving every
flow through it. They are told to find what is wrong, not to confirm what is right. A tester
returns defects; a tester with none returns the list of what was driven and what was not.

## What every tester gets

- the map and their slice of the matrix
- the disposable environment's connection details and how to reseed it
- the authority documents, so expected values come from the contract, not the code
- **how to drive the product**: the running app's URL and a browser tool (Playwright, the
  host's browser) for UI flows; the API base and a client for endpoint flows. Never a direct
  call to a repository function.
- the instruction that a `200` is a claim, and the row is the evidence

## What every tester returns

Defects only, each one:

```markdown
### D7 — a second submission creates a second booking · BLOCKER

**Flow:** submit booking · **Dimension:** duplicate
**Drive:** signed in as associate A; POST /api/bookings {partner: 12, date: 2026-09-14,
amount: 46000}; repeat identical request 40ms later
**Expected:** 1 row  **Got:** 2 rows, ids 1041 and 1042, both status pending
**Query:** SELECT id, status FROM bookings WHERE partner_id=12 AND booking_date='2026-09-14'
**Also changed:** lead_claims unchanged (correct); ledger unchanged (correct)
**Why it matters:** both will be approved, both will pay commission, the associate is paid twice
```

Reproduction steps precise enough that a tester who has never seen the system reproduces it
in stage 3. A defect without a query is not a defect yet.

## The seven

**The boundary tester** drives every input to its edges and one past. Owns: what the schema
accepts versus what the business means; every money field at `0`, `0.01`, negative, and the
column's maximum; every date at a boundary; every string at empty, whitespace and the
longest value in real data.

**The adversarial-input tester** drives input that is valid to the form and wrong for the
business. Owns: dates before the entity existed, rates in the wrong unit, names that collide
under normalisation, pairs of fields that are individually fine and jointly impossible. Reads
the authority document first, because that is where "wrong for the business" is defined.

**The duplicate-and-replay tester** drives every write twice. Owns: the double-click, the
replayed request, the two-tab submit, the retried webhook. Reads for a second row, a
silently overwritten first row, or a counter incremented twice.

**The concurrency tester** drives two actors on one record at once — genuinely at once, with
a harness that fires both within the same tens of milliseconds. Owns: lost updates, double-
counted totals, a reversal landing mid-generation. The hardest dimension to drive and the one
most often skipped, which is why it has its own tester.

**The state-machine tester** walks every entity lifecycle: every edge forward, every edge
back, every skipped state, every attempt to leave a terminal state, every transition twice.
Owns: the `paid` row that can still be edited, the `reversed` claim reversed again, the state
only a migration can reach.

**The cross-module tester** drives a write in one module and reads the rows in every other
module that should have noticed. Owns: the reversal that corrects the booking but not the
ledger, the suspension that stops new bookings but not open ones. Reads the map's "also
changes" column and checks each one.

**The money tester** re-derives every number by hand from the authority document and
compares it to the row, sums every ledger against every displayed total, round-trips every
amount through storage. Owns: the rate stored in the wrong unit, the rounding that loses a
centavo per line and a peso per statement, the total on the screen that the rows do not add
up to.

**Permission** is not a separate tester: every tester drives their flows as the wrong role as
well as the right one, and reports a refusal that still wrote as worse than an acceptance.

## Add a tester when the domain needs one

A mobile-offline tester where the field app queues writes. A webhook tester where a partner
system delivers events. A migration tester where data already exists in production shape.
Say which were added and why; never leave a dimension the domain obviously has uncovered.

## They do not fix

A tester that fixes what it finds is testing something other than what it was asked to. Every
defect goes to the report and to stage 4. The environment is reseeded between testers where
one tester's writes would confuse another's reads.

# Authority reconciliation

Runs in FRAME, before BUILD, on any phase that implements something an external document
already decided — a contract, a specification, a regulation, a pricing agreement, a design
doc, a playbook.

Its output is a constants register in `.flow/STATE.md`, and its job is to catch the class of
error that no test, review or type system can: **being provably right about a wrong number.**

## Why this exists

This is not hypothetical. In a commission ledger, the rate `0.0800` entered the repository
in a research document, 20 minutes into the project. The roadmap inherited it. The phase
plan inherited it from the roadmap. Fifteen test fixtures encoded it. Five phases shipped
against it.

The sources stated 25% — twenty-five times, with no variation, including the operative
contract clause. Nobody read them again after that first day.

The engine would have produced a perfectly re-derivable, fully immutable, exhaustively
tested figure that was **wrong by a factor of 3.125**. Every gate passed. It was caught 34
hours later, by accident, when someone framing a later phase happened to open the playbook.

The lesson is not "read the docs". It is that **planning documents manufacture confidence
as they propagate.** Each restatement looks more settled than the last, and none of them is
the source.

## The rule

**A constant enters the codebase only with a citation to the authority, and never by being
copied from another planning document.**

A roadmap is not a source. A phase plan is not a source. A research summary is not a source.
A previous `STATE.md` is not a source. They are all downstream, and any of them can be
carrying an error that was never checked.

## Step 1 — name the authority

In `.flow/STATE.md`, one line naming the documents that actually decide things:

```markdown
**Authority:** `.planning/inputs/contract.pdf.txt`, `.planning/inputs/playbook.txt`
```

If nobody can say which document is authoritative, that is the finding — stop and ask.
Building against an unnamed source is how the wrong number survives.

## Step 2 — extract what the authority states

Read the authority documents for this phase's scope and pull out every:

- **rate, percentage, multiplier** — commission, tax, interest, discount, margin
- **money amount, threshold, limit, cap, floor**
- **duration, window, deadline, retention period, expiry**
- **enumerated set** — statuses, categories, tiers, allowed transitions
- **formula** — anything stated as an equation or a definition of a base
- **hard rule** — "must", "never", "only", "at least", "no later than"

For each, record the value **and where it is stated**. A constant with no citation is not
extracted, it is remembered — and remembering is what failed above.

## Step 3 — the register

In `.flow/STATE.md`:

```markdown
### Constants register
| Value | Means | Stated at | Lives in code | Verified |
|---|---|---|---|---|
| 0.2500 | commission rate on collected platform fee | playbook:142, playbook:548 | `COMMISSION_RATE_VALUE` | [ ] |
| 12 months | earning period from partner activation | playbook:158 | `earning-window.ts` | [ ] |
```

Two citations beat one. When a document states the same thing in a formula *and* in an
operative clause, cite both — disagreement between them is itself a finding.

## Step 4 — reconcile against the code

For every row, actually look. Two searches, not one:

1. **Search for the authority's value.** Does it appear where it should?
2. **Search for the variable that should hold it.** What value does it actually have?

The second search is the one that matters. Searching only for the correct value returns
nothing and looks like "not implemented yet"; searching for the variable returns `0.0800`
and shows you the contradiction.

Widen it: grep for the constant's *name* across config, environment examples, seeds,
migrations, fixtures and tests. A wrong value baked into fixtures is worse than one in
source, because the tests then defend it.

## Step 5 — a mismatch is a BLOCKER

Not a note, not a deviation, not an assumption. A contradiction between the authority and
the code stops the phase until it is resolved by the person who owns the decision — the
value may be a deliberate exception, but that is theirs to say, not yours to infer.

Record the resolution in the register with its citation, and check the row.

If the correction touches fixtures, count them before starting. A rate wrong in fifteen
fixtures is a real piece of work, not a one-character change.

## CHECK closes the register

Every row must be checked, with the file and line where the value now lives. An unchecked
row at CHECK is a BLOCKER, exactly like an unverified threat in `references/threat.md`.

## Never

- **Never take a constant from a planning document.** Cite the authority or do not write it.
- **Never restate a value in a second place.** Import it, read it from config, or cite it.
  Two copies drift, and the copy is never the one that gets corrected.
- **Never let a fixture become the source of truth.** If the only thing asserting a value is
  a test that asserts the code matches itself, nothing is being verified.
- **Never assume silence means agreement.** A value absent from the requirements document
  has not been approved; it has not been read.

# Process and data flow — the scoped pass inside CHECK

Stage 2's other checks are static: is this module imported, does a page call this endpoint, is
this table read. They prove the parts are **wired**. They cannot see that a wired, reachable,
fully tested flow writes the wrong number.

This pass closes that. **For everything this phase writes, drive the flow once and read the row
back.**

It is bounded to the phase. The full matrix — negative, boundary, duplicate, concurrent,
cross-module, financial — belongs to `/flow:ultra`, which is expensive and occasional. This is
one round trip per thing the phase writes, and it runs every phase that writes anything.

**Skip it entirely if the phase writes nothing persistent.** A copy change, a styling phase, a
refactor with no schema or write-path change: nothing to do, say so in one line.

## Part 1 — the process flow

Before the data, draw the sequence this phase participates in. Not the code path: **the
handoffs.** Who or what starts it, what states the record passes through, who acts at each one,
where it ends, and who sees the result.

Three lines of plain text is enough:

```
associate submits booking  -> status: pending
team lead approves (Approvals screen, in-app badge)  -> status: earned
month-end job runs -> status: paid, appears on statement
```

Then look for the seven gaps. Each is a finding, and each is the kind that ships green:

**A state with no exit.** A record can reach `under_review` and nothing in the product moves it
out. Ask, for every state: what moves it forward, and what moves it back?

**A step with no actor.** The plan says "then it is approved" — by whom, on which screen? If
the answer is "an engineer runs an update", the step does not exist yet.

**A handoff with no notification.** Someone must act, and nothing tells them. The record sits
in a queue nobody opens.

**A terminal state that is not terminal.** `paid` can still be edited, `reversed` can be
reversed again. Say what is supposed to be frozen and check that it is.

**A state only reachable by a seed or a migration.** If the product cannot produce it, the
flow is a demo. This is the value-side twin of the seeded-data check above it in `review.md`.

**Two paths to the same state that leave different data.** The commonest source of
inconsistency: approving from the list sets three fields, approving from the detail page sets
two. Both "work".

**No way back.** An action the business will need to undo, with no undo. Name it now, while it
is a task, rather than after someone has done it wrong in production.

## Part 2 — the data flow

For each table, collection or store this phase writes: **drive the flow the way it is really
driven, then read the row.**

Drive it through the product — the endpoint or the UI — not by calling the repository function
directly. A test that calls the writer has verified the writer, which is the substitution this
pass exists to catch.

Use the disposable database the tests use. **Never production.**

Then read the row back with a query, and check six things:

**1. It exists.** The write happened, in the table you expected, with the key you expected.

**2. The values are right.** Not "a row appeared" — the actual numbers, against the acceptance
criteria and against the constants register if the phase has one. This is the whole point of
the pass. A wired, tested flow writing `0.0625` where the contract says `0.02` passes every
other gate in the loop.

**3. The types and precision are right.** Money as integer minor units, not a float. Timestamps
with a timezone. Enums matching the vocabulary the app actually uses, not a near-synonym. A
`numeric(10,2)` that silently rounds a rate.

**4. What else changed.** The side effects are where the gaps live: the audit row, the counter,
the denormalised total, the parent's status. List what *should* have changed and confirm each.
Then check that nothing else did.

**5. Run it twice.** The same request, the same inputs. Two rows where there should be one is a
duplicate defect, and it is invisible to a suite that only ever runs a flow once.

**6. Drive the reverse, if there is one.** Cancel, reverse, refund, unapprove. Read the rows
again: is the original marked rather than deleted, is the total corrected, does the audit trail
show both?

## Money, status and anything irreversible

These get the pass whether or not the phase looks risky, and they get one thing more: **check
the arithmetic against the authority, not against the code.** Re-derive the expected number by
hand from the contract or specification, then compare it to the row. A formula transcribed
wrongly produces a consistent, well-tested, wrong system, and the only place that shows up is
here and in `references/authority.md`'s register.

## Setup is allowed; fixing is not

Starting a container, seeding a fixture, writing a throwaway script to drive a flow: allowed,
recorded in the report as setup, and reverted afterwards.

**Repairing what you find is not.** Findings go back to the task list. A pass that fixes as it
goes re-tests something other than what it was checking, and the report then describes a system
that never existed.

## If it cannot run

No database, no way to drive the flow, an external dependency that is not available: **report
the criterion open** with what it needs, per `references/evidence.md`. Never mark it closed
because the unit tests pass — that is the exact substitution this pass exists to prevent, and
a phase that could not verify its own writes should say so out loud.

## Findings

CHECK's severities, and every finding names the row:

> **BLOCKER** — `commissions.rate` is written as `0.0625`; the partner agreement §4 states
> 2%. Booking 1041 wrote ₱46,000 where ₱14,720 was due. Every commission since phase 12 is
> affected.

> **MAJOR** — approving from the Approvals list sets `approved_by` and `approved_at`;
> approving from the booking detail sets neither. Two paths to `earned`, two different rows.

> **MAJOR** — `bookings` has no exit from `under_review`. Nothing in the product moves a
> record out of it; the only route is a manual update.

> **MINOR** — submitting the same booking twice creates two rows. There is no uniqueness
> constraint and no idempotency key.

## When to escalate

If this pass finds a **value** defect — a wrong number, not a wrong wiring — treat it as a
signal about the module rather than the phase. One wrong rate is rarely alone. Recommend
`/flow:ultra` on that module in the report, and say why.

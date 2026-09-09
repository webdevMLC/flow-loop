---
name: ultra
description: A deep, on-demand inspection of a system as built — not of a diff. Runs the thing a user runs, tests what happens to data through real flows against a real database, and reviews the code adversarially through independent lenses. Use when a project is about to be trusted with something that matters: before a pilot, before a release, after a long unattended run, when someone asks "is this actually working", or when the suite is green and you are not convinced. Reports and never fixes. Expensive by design and not part of the FRAME/BUILD/CHECK/SHIP loop.
---

# Ultra

CHECK looks at a diff. This looks at a system.

It exists because of a specific, repeated failure: a project passed every gate it owned — 156
test files, mutation gates green, a five-stage CHECK — and the application could not start.
Fifteen phases shipped that way. Nothing was lying; the tests imported the modules directly and
got their environment from the runner, and **nobody ever ran the thing a user runs.**

So this command asks three questions a diff review cannot:

| Stage | Asks | Cost |
|---|---|---|
| **1 Reality** | does it start, from a clean checkout, the documented way? | cheap |
| **2 Data** | does data survive real flows, in the database, not in a success message? | the bulk |
| **3 Adversary** | what is wrong with the code, judged by independent readers? | model-heavy |

**Each stage gates the next.** A system that does not start has nothing to say about its data.

## It reports. It does not fix.

Every finding becomes a phase for the loop, or a line in the user's list. **Nothing is repaired
during the inspection.** An inspection that fixes as it goes starts agreeing with itself: the
thing it re-tested is no longer the thing it was inspecting, and the report describes a system
that never existed.

The one exception is a change needed to *observe* — starting a container, seeding a fixture,
setting a variable in your own shell. Those are recorded in the report as setup, and reverted.

## Say what it cost

This is expensive and it is meant to be. It is not part of the loop and does not run per phase.
End the report with what it consumed and what it examined, so the next person can decide whether
to run it again or trust the last one.

## Stage 1 — Reality

Read `references/reality.md`. In short: **from a clean checkout, following only the written
instructions**, does the system install, migrate, build and start — and does a request reach it?

The test is not "does the build command exit 0" in a shell that has been warmed up by an hour
of other work. It is: a person clones this, reads the README, and follows it. Every deviation
you have to make is a finding, because it is a deviation they will have to make too.

## Stage 2 — Data

Read `references/data.md`. This is the bulk of the work and the part no other gate does.

Trace each critical flow end to end, build the matrix — positive, negative, boundary, duplicate,
concurrent, status-transition, cross-module — drive it against a **real database**, and then
**read the rows**. A success response is not evidence that anything was written, and a green
integration test that asserts on the response body has verified the response body.

Money, permissions and anything irreversible get the matrix whether or not they look risky.

## Stage 3 — Adversary

Read `references/adversary.md`. Independent readers, one lens each, no shared context with the
build, and every finding falsified before it is reported.

## The report

One document, `.flow/ULTRA-<date>.md`, findings most severe first, using CHECK's severities so
they mean the same thing everywhere:

**BLOCKER** — ships something broken. **MAJOR** — wrong under real conditions.
**MINOR** — works, will bite.

Every finding carries a concrete failure: inputs or state → wrong outcome. A finding that
cannot be written that way is not a finding.

End with the ledger — what was proven by running it, what by reading it, and what could not be
established and why. `references/evidence.md` in the loop skill governs those words; a
criterion nobody could check is reported open, never quietly closed.

## When to run it

Before a pilot. Before anything real depends on it. After a long unattended run — especially a
non-stop one, where many phases shipped that nobody read. When someone asks whether it actually
works. And when the suite is green and you are not convinced, which is the case this exists for.

## Never

- **Never fix during the inspection.** Findings go to the loop.
- **Never accept a passing test as evidence that a flow works.** Stage 2 exists because that
  substitution is the commonest way a system looks finished and is not.
- **Never run it against production data.** A disposable database, always.
- **Never report a clean bill without saying what you could not reach.** An inspection that
  concludes everything is fine has usually run out of access, not out of defects.

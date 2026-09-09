---
name: ultra
description: A deep, on-demand inspection of a system as built — not of a diff. Runs the thing a user runs, tests what happens to data through real flows against a real database, and reviews the code adversarially through independent lenses. Use when a project is about to be trusted with something that matters: before a pilot, before a release, after a long unattended run, when someone asks "is this actually working", or when the suite is green and you are not convinced. Seals its report, then repairs what it found by handing each finding to the loop as a phase — on by default; say "report only" to stop at the report. Expensive by design and not part of the per-phase FRAME/BUILD/CHECK/SHIP loop.
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
| **4 Repair** | fix what was found, through the loop | the rest |

**Stages 1–3 gate each other**: a system that does not start has nothing to say about its data.
Stage 4 is different — it gates on the *report* rather than on a clean result, and it runs
precisely because the earlier stages found something.

## It does not fix *during* the inspection — then it fixes

**Nothing is repaired while stages 1–3 run.** An inspection that fixes as it goes starts
agreeing with itself: the thing it re-tested is no longer the thing it was inspecting, and the
report describes a system that never existed.

That rule ends where the report does. Once `.flow/ULTRA-<date>.md` is sealed on disk, **stage 4
repairs what it found** — each finding handed to the loop as a phase, with every gate the loop
normally runs. Repair is **on by default**: handing back a document and calling it a result is
homework, not an inspection. Say **"report only"** to stop after stage 3.

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

## Stage 4 — Repair

Read `references/repair.md`. **Seal the report to disk first** — that is the whole of the
never-fix rule, and once it is written, fixing is the point rather than contamination.

Then each finding becomes a phase for the loop. **The acceptance criterion is the finding,
inverted**: ultra requires every finding to carry a concrete failure — inputs or state → wrong
outcome — and that sentence is already a criterion with the outcome flipped. Because it is that
specific, CHECK proves each fix by construction, so the inspection is never re-run per finding.

BLOCKERs first, then MAJORs, then MINORs. Findings are batched by root cause, not worked
one-for-one — forty findings is not forty phases.

**These stop for the user instead of being built**, on top of the loop's own hard stops: a
finding that needs a decision rather than an implementation, one requiring a schema migration
(ultra never writes one), one needing a credential or money, and one whose fix is larger than
the finding. **Commits stay local; repair never pushes.**

With no budget named, the default scope is **every BLOCKER**, then report and stop.

## The report

One document, `.flow/ULTRA-<date>.md`, findings most severe first, using CHECK's severities so
they mean the same thing everywhere:

**BLOCKER** — ships something broken. **MAJOR** — wrong under real conditions.
**MINOR** — works, will bite.

Every finding carries a concrete failure: inputs or state → wrong outcome. A finding that
cannot be written that way is not a finding — and it is also what stage 4 turns straight into an
acceptance criterion, so a vague finding costs twice.

**Every finding carries a stable id** — `BLOCKER 3`, `MAJOR 7` — assigned when the report is
written. The status line, the phase that fixes it and the roadmap sweep all address findings by
that id.

**Every finding also carries a status line**, the only part of the sealed report ever edited
afterwards, written at the SHIP of the phase that resolved it. Five values: `open`, `fixed ·
phase N · date`, `blocked · <what it needs, from whom>`, `stale · no longer reproduces · date`,
and `wont-fix · <reason> · <who decided>` — which **only a person ever writes**. Keep a count in
the header. `open` and `blocked` are picked up again by the roadmap sweep; the other three are
settled, which is what stops a repaired finding being re-proposed forever.

End with the ledger — what was proven by running it, what by reading it, and what could not be
established and why. `references/evidence.md` in the loop skill governs those words; a
criterion nobody could check is reported open, never quietly closed.

## When to run it

Before a pilot. Before anything real depends on it. After a long unattended run — especially a
non-stop one, where many phases shipped that nobody read. When someone asks whether it actually
works. And when the suite is green and you are not convinced, which is the case this exists for.

## Never

- **Never fix during stages 1–3, and never before the report is sealed on disk.** That file is
  the record of the system as inspected, and repair invalidates it the moment it starts.
- **Never let repair push, open a PR or deploy.** Local commits are the boundary, and that
  boundary is what makes leaving it running safe.
- **Never accept a passing test as evidence that a flow works.** Stage 2 exists because that
  substitution is the commonest way a system looks finished and is not.
- **Never run it against production data.** A disposable database, always.
- **Never report a clean bill without saying what you could not reach.** An inspection that
  concludes everything is fine has usually run out of access, not out of defects.

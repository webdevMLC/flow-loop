# Did we build what we set out to build?

Phases archive one at a time, each judged against its own criteria. Nothing ever asks whether
the set of them adds up to what was originally asked for — and a project can pass every phase
gate while drifting a long way from its point.

Run this at a milestone boundary: the roadmap exhausted, a version cut, or a run of
self-selected phases ending. It is a reading task, not a survey. Read only the original
statement of intent (a project brief, a roadmap overview, a requirements file),
`.flow/ARCHIVE.md`, `.flow/MANIFEST.md`, and the evidence ledgers.

## Four questions

**1. Which original requirements are met, and by what evidence?** Name the phase and the
evidence class. A requirement "met" only by a passing test, where the requirement described a
person doing something, is not met — `references/evidence.md`.

**2. Which were quietly dropped?** Not blocked — blocked is recorded and honest. Dropped means
it was in the original intent, nothing in the archive addresses it, and no phase ever said why.
**This is the question the audit exists for**, because nothing else asks it: every phase gate
examines one phase, and a requirement can fall between all of them without any single gate
being wrong.

**3. What shipped that nobody asked for?** Self-selected phases especially. Each may be good
work; the question is whether the set still serves the project. Twenty-two self-selected phases
can be individually defensible and collectively a different project.

**4. What is still open?** Unclosed `by person` criteria across every phase, durable paths
never asserted, findings recorded and never acted on. These decay silently — no single phase
report is wrong, and the total is invisible until someone adds it up.

## Write it down

`.flow/MILESTONE-<n>.md`: a table of original requirement → phase → evidence → status, then the
dropped, the unasked-for, and the open. It is what someone reads to decide whether this is
shippable, and the only place the whole is ever considered.

## Say the uncomfortable thing plainly

If the honest answer is "eight of eleven requirements are met, two were dropped without anyone
deciding to, and the interface for the third does not exist" — write that.

A milestone audit concluding everything is fine has not been performed, it has been narrated.
The failure here is not missing a defect; it is producing a document that lets everyone feel
finished.

## A milestone audit is not an ending

It is long, conclusive, and ends on an uncomfortable sentence — everything about writing it
says the work is over. It is a document, not a decision. File it, say where it is, then arm
the next wake or fire `stop: true` per the pacing table. Same rule as a green checkpoint, and
for the same reason: a thorough file is the easiest place in this skill to end a run by
accident.

# Reviewing the plan, before any of it is built

Flow has five stages and three of them check the work. PLAN decides the product and FRAME audits that; this review checks the phase plan — and the plan
is where the expensive failures start.

Every serious defect on the projects that shaped this skill originated in FRAME, then was
executed faithfully and verified correctly: a commission rate that entered a document wrong and
reached five shipped phases; criteria saying "a manager sees the scorecard" decomposed into
tasks that built no screen; configuration seeded with nobody able to change it; a pilot with
field staff and no way to give them accounts. **Not one was a coding error.** BUILD did what it
was told, and CHECK confirmed it had.

So one reviewer reads the frame before BUILD starts. It reads `.flow/STATE.md`, the authority
if there is one, and `.flow/PROJECT.md`. **It does not read the codebase** — this is a review
of the plan, and it must cost a fraction of the work it protects.

## Only for Full work

Direct and Quick tasks skip this (guard 5). A plan review on a two-file change costs more than
the change. It runs on a phase.

## The five questions

1. **Is this the right work?** Against the roadmap, the authority, and what the project is for.
   A phase can be executed perfectly and be the wrong phase.
2. **Are the criteria checkable, and by what?** Every one carries an evidence class
   (`references/evidence.md`). A criterion that cannot be marked, or whose artifact nothing
   here can produce, is not ready.
3. **Do the tasks actually produce the criteria?** Trace each criterion to the tasks that
   satisfy it. A criterion with no task behind it will not happen; a task serving no criterion
   is scope nobody asked for. **This is the check that catches "a manager sees X" decomposed
   into database modules** — the tasks never mention a screen, and it is visible here for the
   price of reading a list.
4. **What does this assume that is not true?** The gap pass asks this from the inside. A reader
   with no stake in the plan asks it better.
5. **What would someone be surprised this does not include?** Onboarding, how a rule gets
   changed later, the empty state, who operates it. Gaps noticed after release are almost
   always this shape.

## Concerns close, or the phase does not start

Each concern resolves one of three ways, and the frame is edited to say so:

| Resolution | What it means |
|---|---|
| **Accepted** | the frame changes — a criterion, a task, or the goal |
| **Recorded** | proceeding knowingly, written into `### Assumptions` with what breaks if wrong |
| **Rejected** | with a reason, in one sentence, in the frame |

**Two revision rounds, then stop and ask.** Replanning until every concern is resolved is a
loop without a cap, and a plan being argued a third time is one whose owner should be in the
room. Surface the disagreement and both positions; do not settle it alone.

## Never

- **Never let the reviewer write the plan.** It raises concerns; FRAME resolves them. A
  reviewer that rewrites is a second planner, and the independence that made it useful is gone.
- **Never skip it because the phase looks obvious.** The phases that shipped with no UI all
  looked obvious.
- **Never let it read the codebase.** That is the survey's job, it already happened, and
  repeating it doubles FRAME's cost for no new signal.

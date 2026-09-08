# Auditing a screen

Runs inside CHECK, automatically, on any phase that touched a user surface. Not a skill
someone remembers to invoke — a gate that fires because the diff contains a screen.

That distinction is the whole point. A framework with an excellent UI review that nobody runs
ships eleven phases with no interface, and the review is not what failed.

## It produces the artifact, not just a score

Open the route. Capture it — at desktop width and at 375px — and save under
`.flow/evidence/<phase>/`. Use whatever the project and host provide: a browser tool,
Playwright, a dev server plus a screenshot, the host's own preview.

**That capture is what closes the criterion.** A criterion marked `by artifact` in
`references/evidence.md` is satisfied by this file existing and showing the thing, not by a
passing test and not by a score out of four. If nothing here can produce a capture, say so and
mark the criterion `by person` — do not downgrade it to a test.

A score with no artifact is an opinion. An artifact with no score is still evidence.

## What to check, in this order

**1. Does it render, and is it reachable?** A route nobody can navigate to has failed before
anything else matters. Follow the path a real user takes — sign in, click through — not a
typed URL.

**2. The five states.** Loading, empty, error, partial, unauthorized. The empty state is the
one that decides whether a new system looks broken or looks ready: it must say what to do
next, not render blank. Most screens are first seen empty.

**3. Redundant text.** Active navigation and a page title already say where the user is. A
third banner under them is the extra header to remove. Every label, title and paragraph must
tell the reader something the context has not already told them.

**4. Hierarchy without headings.** Can a reader tell what to look at first, what the primary
action is, and what happens next — from typography, spacing, alignment and contrast alone?
Reaching for another heading is the signal that the hierarchy is not doing its job.

**5. Density for the actual task.** A console someone uses all day wants scannability and
speed. A marketing page wants air. Judge against the job, not against a screenshot.

**6. Designed at 375px, not shrunk.** Tables restructure rather than scroll sideways; the
primary action is in reach of a thumb.

## Then check it against the project's own standard, which matters more

If `.flow/PROJECT.md` carries a design standard, **verify against that** — it is the authority,
and a generic rubric cannot see what it forbids. Real examples from real profiles:

- "No associate appears in rank order against another." A leaderboard component scores well on
  every generic pillar and violates the one rule that project has.
- "Tailwind is the styling layer; do not introduce a second." A screen can look right and be
  wrong.
- "No widget displays time tracking, location, a check-in or a ranking mechanic." A compliance
  prohibition, invisible to taste.

A screen that scores well on the six checks above and breaks the project's own standard has
failed. Say which rule, and quote it.

## Report findings, not grades

Grades are comfortable and change nothing. Emit findings in CHECK's own format, with the same
severities — BLOCKER if a person cannot complete the task, MAJOR if they will do it wrong or
give up, MINOR if it is friction. Each names the screen, what is wrong, and what a person
would do about it.

If a score helps you think, keep it in your head. What goes in the report is what someone can
act on.

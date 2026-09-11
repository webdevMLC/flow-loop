# The critique — six lenses, each with failing conditions

A lens with no failing condition produces prose. Each lens below is a list of things that,
when true of a capture, are findings — with a severity rule and the person's experience
named. Every specialist judges every capture; the architect synthesises.

Severities are CHECK's: **BLOCKER** — a person cannot complete the job. **MAJOR** — they will
do it wrong, or give up. **MINOR** — friction.

## Information architecture — can a person find what they need without being told?

- **The navigation mirrors the database, not the job.** Menu items named for tables or
  modules ("Commission", "Pipeline") rather than for what a person does. MAJOR when a job
  spans three menu items.
- **The three commonest jobs take more steps than a person would tolerate.** Count them from
  the captures. A daily job past four screens is MAJOR.
- **Two screens show the same thing differently**, or the same word means two things. MAJOR.
- **A created thing has no obvious place to be found afterwards.** The organiser creates a
  tournament; where is it? BLOCKER if there is no list, MAJOR if the list is not where the
  create was.
- **Depth without breadth** — everything nested under one entry — or breadth without depth —
  forty top-level items. Either is MAJOR at scale.

## Interaction design — does the screen behave the way the person expects?

- **The primary action is not the most prominent element**, or two actions compete. MAJOR.
- **A destructive action sits beside a routine one** with the same weight, or has no confirm.
  MAJOR; BLOCKER for money or deletion.
- **A form asks for something the system already knows** or could default. MINOR each,
  MAJOR when a daily form has three.
- **A required field is not marked, or a validation error appears somewhere other than the
  field.** MAJOR.
- **An action produces no visible result** where it should — the toast that does not appear,
  the list that does not update. BLOCKER if the person cannot tell it worked.
- **A wait with no indication.** Anything past two seconds with nothing on screen. MAJOR.

## Visual hierarchy — does the eye land where it should?

- **Everything is the same weight.** One type size, one colour, so hierarchy comes only from
  position. MAJOR across a product; that is the "flat and dated" look.
- **The most important number on the screen is not the largest.** MAJOR on a console.
- **Cards for everything**, so nothing is grouped and nothing is separated. MAJOR.
- **Density wrong for the job** — a console that wants scannability set airy, a form that
  wants calm set dense. Judge against the job named in the project skill. MAJOR.
- **Colour carrying meaning it has not earned** — a red that means nothing, a green that is
  brand rather than status. MAJOR when it collides with the status vocabulary.
- **Redundant text**: a page title, a breadcrumb and a heading all saying where the person
  is. MINOR each; the third one is the one to remove.

## States and feedback — does the screen work when there is nothing, or something wrong?

- **No empty state**, or an empty state that says only "No data". MAJOR; BLOCKER on the first
  screen a new user sees, because it decides whether the product looks broken or ready.
- **No loading state**, or a spinner where a skeleton would keep the layout. MINOR.
- **An error state that shows the raw message** — a stack trace, `error.message` from a
  library, "something went wrong". MAJOR; the person cannot act on it.
- **A partial state unhandled** — some rows loaded, one failed, and the screen says nothing.
  MAJOR.
- **An unauthorised state that looks like a bug.** MAJOR.
- **Success with no confirmation** the person can see without scrolling. MAJOR.

## Accessibility — can everyone use it, and does it survive a bright field?

- **Contrast below 4.5:1 on any text**, measured from the capture. MAJOR; BLOCKER on a field
  app used outdoors.
- **Touch targets under 44px** on a mobile surface. MAJOR.
- **Focus not visible**, or removed with `outline: none` and not replaced. MAJOR.
- **Meaning carried by colour alone** — a status pill with no word, an error with no icon.
  MAJOR; it fails colour-blind users and every greyscale print.
- **A form that cannot be completed with a keyboard**, or a modal with no focus trap. MAJOR.
- **Images without alt text, controls without labels.** MINOR each.
- **A table that scrolls sideways on a phone** instead of restructuring. MAJOR.

## Content and copy — do the words help?

- **Labels in the system's vocabulary, not the person's.** "Reconciliation run" where the
  person thinks "close the month". MAJOR when it is the primary action.
- **A button that names the mechanism, not the outcome.** "Submit" where "Send invoice"
  would say what happens. MINOR each.
- **Copy that reassures instead of informs.** "Our powerful dashboard makes it easy." MINOR;
  remove it.
- **Error text with no next step.** MAJOR.
- **Inconsistent terms** for one thing across screens. MAJOR.

## The architect's verdict

Read all six sets. **Find the three to five causes** — most findings are symptoms of a few
structural decisions: a navigation built from the schema, no design system so every screen
reinvented its patterns, states never designed because screens were only ever seen full of
seed data. Name each cause, list the findings it explains, and say which screen group fixes
it first.

Then, honestly: **what is already good.** A critique that finds nothing to keep is not
credible, and the redesign should preserve it.

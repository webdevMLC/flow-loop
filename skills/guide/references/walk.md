# Walking the system before writing about it

Stage 1 seeds data, breaks things on purpose, and captures a system that then moves on. It is
not cheaply repeatable, so **settle everything in §0 before you touch anything.**

The stage writes exactly two things: the captures, and the record at `.flow/guide-walk.md`.

## §0 — settle these first

**The environment is disposable.** Never seed, never break, never capture on production or
shared staging. If the only reachable system is production, stop and say so.

**Confirm you can capture, before walking.** Use whatever the project and host provide — a
browser tool, Playwright, a dev server plus a screenshot, the host's own preview. Take one
capture of the sign-in screen now and confirm the file exists on disk **and that its pixel width
is twice the CSS width you asked for.** If it is not, fix the capture setting before walking,
not after.

**If nothing can produce a capture, stop.** Say so, and let the user decide between a
text-only guide and getting a capture tool available. Do not walk the whole system and
discover this at drafting time, and never write an image link for a file that does not exist.

**Capture at the widths the readers use**, from the Devices answer — desktop and 375px if
both. A mobile reader cannot follow a guide shot at 1440px; the screen they are holding does
not look like that.

**Capture at device-pixel-ratio 2, and in PNG.** The file must be twice the CSS width you asked
for — a 1440px screen produces a 2880px file — because stage 4 prints each capture at a fixed
physical width and needs ~192 DPI there. A 1× capture in a PDF is roughly 96 DPI and looks soft
beside 10.5pt text. JPEG damages text and thin lines; never use it for an interface. Set it
before the first shot: Playwright `deviceScaleFactor: 2`, Chrome `--force-device-scale-factor=2`,
or the host tool's 2× equivalent.

**One frame per class, fixed now.** Choose two capture frames and hold them for every shot: a
**full-screen** frame and a **detail** frame — say 1440 and 480 CSS px, giving 2880px and 960px
files. What is *inside* the frame varies; the frame does not. Cropping each shot to its content
produces forty different widths, and stage 4 prints by class, so mixed widths are visible on
every facing page.

**None of this can be revised at stage 4.** `references/layout.md` needs 2× files at two fixed
frames and cannot manufacture them — it has no pixels this walk did not take, and this
environment will be gone.

**Capture density comes from the reading level**, and it changes what you must photograph:

| Level | Capture | Also record |
|---|---|---|
| **Simple** | almost every step | where the control sits and what colour it is — "the blue **Submit booking** button at the bottom" |
| **Plain** | wherever the screen changes | the label |
| **Working** | key screens, and anything unusual | the label |

**Walk in the locale the guide describes.** If the interface is localised and the guide is for
readers of that locale, switch the interface to it and capture *there* — the labels you record
must be the ones that reader sees. Check per label, not per product: half-translated
interfaces are common.

**Have the credentials for every role** before starting. There is no later question slot.

## §1 — seed demo data

Create an account and populate it with invented but plausible records: real-looking names,
sensible amounts, dates that make sense together. Every screenshot comes from this account.

Empty screens make a bad guide — the reader cannot match what they see against a blank page.

## §2 — find the roles

From the auth model, not a guess: the roles table, the permission checks, the middleware, the
conditionally rendered navigation. List everyone who signs in, then apply the Audience answer
from §0 — an associate's guide should never mention a settings screen they cannot open.

## §3 — find the jobs

This is the part that decides the guide. A job is something a person is trying to get done,
stated the way they would say it at work. **The navigation menu is the wrong source** — it is
organised the way the system was built.

Five places the real jobs are visible:

**What happens either side of the app.** What was the person doing before they opened it, and
what do they do after they close it? A booking is entered *because* a customer called, and the
next thing that happens is someone gets paid.

**What the system notifies about.** Emails, SMS, push, in-app alerts — every one marks a moment
the system itself thinks matters.

**State machines.** A record moving `pending → earned → reversed` is three jobs, with three
different people caring, and usually three guide pages.

**Whatever support gets asked repeatedly.** A support inbox or the one person everybody
messages is the table of contents, already written.

**What the requester knows.** They usually know where people struggle. That was part of the §0
batch; use the answer rather than asking again.

Write the jobs as sentences a user would say: *"Submit a booking for a partner"*, *"Find out
why my commission was reversed"*. If a title does not sound like something said out loud at
work, it is a feature name in disguise.

## §4 — walk each job end to end

As the role who does it, from where they really start — the sign-in screen, not a deep link.
For every step record:

- **The exact label**, character for character. `Save changes`, not "the save button".
- **The exact screen name** as it appears.
- **What changes** afterwards: what appears, what moves, what the record now says.
- **How long it takes** if it is not instant. A silent 30-second wait reads as broken.
- **What it requires** that the reader might not have — a permission, a prior step, a field
  filled elsewhere.
- At **Simple** level, where the control is and what it looks like.

Capture wherever the screen meaningfully changes, at every width from §0. Crop to what matters.

## §5 — break it on purpose

On the disposable environment only. These are real writes and real failures in whatever
database you are pointed at.

The most-read page in a real guide is the error page, and you cannot write it from source — the
message a user sees is often not the string in the code.

Trigger every failure a normal user can reach: submit the form empty, put a number where a date
goes, use a duplicate, exceed a limit, do the steps out of order, let a session expire,
disconnect mid-save. **Record the message verbatim** and what actually recovers it.

**An error you could not trigger does not get an entry** — you would be inventing the wording,
and wording is the whole value of that page. That is not the same as §6.

## §6 — record what you could not reach

A role with no credentials, a flow needing a live payment provider, a step requiring a device
you do not have.

These are **not `by person` criteria** — nobody's judgement is missing, the access is. Per
`references/evidence.md` **in the loop skill**, a criterion nobody could check is *reported
open* with what it needs and from whom, never quietly closed and never reclassified into a
question for a reader.

In the guide itself they become a named gap: "Paying out a statement is not covered yet — it
needs the live payment provider." A named gap beats an invented step, and readers trust a guide
that admits its edges.

## §7 — write the record

Stages 2 and 3 read `.flow/guide-walk.md`, not your memory of the walk. Without it the labels
get paraphrased at drafting time, which is the failure this whole stage exists to prevent.

```markdown
# Guide walk — 2026-09-14

Environment   local dev, disposable, seeded account "demo-associate"
Locale walked en (interface is English only)
Widths        1440 and 375
Level         Plain · Audience: associate + team lead (separate books)

## Roles
associate (guide) · team lead (guide) · admin (out of scope this phase)

## Jobs — associate
1. Submit a booking for a partner
2. Check what I earned this month
3. Find out why a commission was reversed

## Labels, verbatim
"Submit booking" · "Save draft" · "Statement" · "Pending" · "Earned" · "Reversed"
Menu: "Bookings" · "Statements" · "Partners"

## Waits
statement generation ~20s, spinner with no text

## Errors, verbatim
"Amount must be greater than zero"  -> amount blank or 0
"This booking already exists"       -> same partner + date + amount
"Partner not approved"              -> partner still in review

## Captures
41 files in docs/guide/images/, demo account only

## Not reached
payout confirmation — needs the live payment provider -> criterion reported open
```

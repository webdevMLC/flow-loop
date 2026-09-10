# Writing it so someone can actually use it

Everything here is written **from `.flow/guide-walk.md`**, not from memory of the walk and never
from the source. If a label, a wait or an error message is not in that file, it was not
observed, and it does not go in the guide.

## The three reading levels

Chosen at §0. They change sentence length and how much is assumed — not how truthful or how
complete the guide is. (Capture density per level is set in `references/walk.md` §0, because it
had to be known before the walk.)

| | Reader | Sentences | Assumes |
|---|---|---|---|
| **Simple** | may be new to computers or smartphones | under 12 words, one idea each | nothing — "tap", "type", "the box at the top" |
| **Plain** *(default)* | anyone; the general reader | under 20 words | ordinary app use — scrolling, tabs, sign-in |
| **Working** | knows the job well, not this software | normal prose | the domain — commissions, bookings, triage |

At **Simple**, describe position and colour as well as label — "the blue **Submit booking**
button at the bottom of the screen" — because a reader who cannot yet skim is looking for it by
shape. The walk recorded those; use them.

## The rules that do the work

**Second person, present tense, active.** "You enter the partner's name and press **Save**."
Not "the partner's name is entered", not "the user should enter".

**One action per numbered step.** A step containing "and" is usually two. The reader is looking
between the screen and the page, and loses their place inside long steps.

**Say what happens after.** Every action ends with its result. "Press **Submit booking**. The
booking appears in your list marked **Pending**." Without the second sentence the reader cannot
tell whether it worked, and that is when they press it again.

**Exact labels, in bold, character for character**, copied from the walk record. If the button
says **Statement**, the guide never calls it a report.

**Name the wait.** "Generating the statement takes about 20 seconds." A silent wait is the
commonest reason someone believes a system is broken.

**Front-load.** Outcome first, steps after. People read the first line and decide whether they
are in the right place.

## What to leave out entirely

Not "explain more simply" — leave out:

- How it works internally: databases, queues, caching, "the system validates". *(Not
  everything technical-sounding is internal — if the reader can see it and must act on it, it
  belongs. Offline sync that makes their edit appear later is user-visible behaviour, not
  plumbing.)*
- Anything the reader cannot act on. If knowing it changes nothing they do, cut it.
- Features their role cannot reach.
- Reassurance and marketing. "Our powerful dashboard makes it easy" costs a line and gives
  nothing. If it were easy the guide would be shorter.
- Warnings about things that cannot happen.

The plain-language test is not "are the words short". It is: **cut every sentence that does not
change what the reader does, then see what is left.**

## The files

```
docs/guide/
  README.md                     the front door AND the contents list — every page, in the
                                order someone new should read them, one line each on what
                                it covers. This is the only index; nothing else lists pages.
  01-getting-started.md         first sign-in, and the one thing to do first
  02-<a real job>.md            one page per job, named the way a user would say it
  when-something-goes-wrong.md  every message, what it means, what to do
  glossary.md                   only the words that survived
  images/
```

## The shape of a job page

```markdown
# Submit a booking

When a partner confirms a booking, you record it here so it counts toward your commission.
This takes about two minutes.

**Before you start:** the partner must already be in your list. If they are not, see
[Add a partner](03-add-a-partner.md).

## Steps

1. From the menu, choose **Bookings**.
   <img class="shot-full" src="images/bookings-list.png" alt="The Bookings screen">

2. Press **New booking** at the top right.

3. Choose the partner from the **Partner** list.
   If the partner is not listed, they have not been approved yet.

4. Enter the **Amount** and the **Booking date**.
   The date cannot be in the future.

5. Press **Submit booking**.
   The booking appears at the top of your list marked **Pending**.
   <img class="shot-detail" src="images/booking-pending.png" alt="A booking marked Pending">

## What happens next

Your team lead reviews it, usually the same day. When it is approved the status changes to
**Earned** and the amount is added to your next statement. You are not notified — check the
**Bookings** list.

## If it does not work

| You see | It means | Do this |
|---|---|---|
| **Amount must be greater than zero** | the amount is blank or 0 | enter the booking value in pesos |
| **This booking already exists** | the same partner, date and amount is already recorded | check your list before entering it again |
| **Partner not approved** | the partner is still being reviewed | wait, or ask your team lead |
```

**"Before you start", "What happens next" and "If it does not work" are the three sections
people actually need**, and the three most often missing. The steps are the easy part.

## The error page

One page, every message a user can hit, in those same three columns. Sorted **alphabetically by
the message text**, because the reader is looking at the message, not thinking about which
module produced it.

Every message is the verbatim string from the walk record. If the guide says something the
screen does not, the reader assumes the guide is for a different version and stops trusting all
of it.

## The glossary

A word earns an entry only if **it appears on screen** and **a reader cannot work it out from
context**. Everything else is explained where it is used and never appears in a list.

A long glossary is a finding about the product, not about the guide. Say so.

## Screenshots

From the demo account, at the two frames fixed in `references/walk.md` §0.

**Every screenshot carries its class**, because stage 4 prints by class and a bare markdown
image cannot say which it is. Use the HTML tag — every converter passes it through:

```html
<img class="shot-full" src="images/bookings-list.png" alt="The Bookings screen">
<img class="shot-detail" src="images/submit-button.png" alt="The Submit booking button">
```

`shot-full` prints at the full 134mm measure, `shot-detail` at 80mm. Those are the only two.

**Never write an image link for a file that was not captured** — check the file exists on disk
before the page ships.

Annotate only when the target is genuinely hard to find; an arrow is an admission that the
screen is unclear, and worth raising with whoever owns it.

Every image gets alt text saying what the picture shows, not "screenshot". Some readers get the
guide as text, and some are reading it aloud to someone else.

## The reader test — a `by person` criterion, not a checklist item

**Someone who has not used the system does one job from the guide while you watch.** Every
place they hesitate is a defect in the guide, not in them.

No test closes this and no screenshot settles it, so it goes to `.flow/UAT.md` in the format
`references/uat.md` **in the loop skill** specifies, and the loop prepares it but never answers
it:

```markdown
### G1 — a new associate can submit a booking from the guide alone · Phase 31 · open

**Look at:** `docs/guide/02-submit-a-booking.md`

**Question:** can someone who has never used this system complete a booking using only this
page, without asking anyone?

**Yes means:** the criterion closes.
**No means:** a MAJOR finding — note the step where they stopped; that step is the defect.

**Answer:**
```

## Before you call it done

- Check the contents in `README.md` against the navigation menu. **If they match, ask why.**
  Some products genuinely are task-shaped and the match is honest; far more often it means the
  menu was copied. If you cannot name the job each page serves, it was copied.
- Check every bold label against the walk record.
- Check every image link resolves to a file.
- Read the first line of each page alone. Does it say who it is for and what it gets done?

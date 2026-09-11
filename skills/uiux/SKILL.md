---
name: uiux
description: A design audit and redesign of a product as built, by a design architect — not a theme. It captures every screen, critiques the information architecture, hierarchy, interaction patterns, states, density and accessibility against current professional practice, wireframes what each screen should become, shows the owner before touching anything, then applies the redesign through the loop and hands the visual layer to /flow:theme. Use when screens look dated or amateur, when the product works but nobody enjoys using it, when the UI was built ad hoc across many phases, or when the owner says "make it modern". Never applies a redesign the owner has not seen.
---

# UI/UX

`/flow:theme` decides how the product *looks* — tokens, components, the law that holds
them. This decides what the screens *should be*: what is on them, in what order, how a
person moves between them, what happens in every state. A dated product is rarely dated
because of its colours; it is dated because its screens were built one phase at a time by
something that never stepped back to look at all of them together.

| Stage | Asks | Writes |
|---|---|---|
| **1 Capture** | what does every screen actually look like, in every state? | captures only |
| **2 Critique** | six specialists — what is wrong, against what standard, and why does it matter to the person using it? | nothing |
| **3 Redesign** | what should each screen become — wireframed, as an artifact the owner reviews | the artifact |
| **4 Apply** | through the loop, one phase per screen group; the visual layer to `/flow:theme` | code |

## Before anything else

**"Make it modern" does not mean gradients, rounded corners, a hero and more whitespace.**
Those are the current tells of a design that was generated rather than made. Modern means the
person finds what they need without being told where to look, the primary action is
unmistakable, nothing on the screen is there because it was easy to add, and the empty state
tells them what to do next. A screen can be flat, dense and grey and be entirely modern.

**"Best practices" is not a checklist from a blog.** Every finding names the *job the screen
serves* and judges against that. A console someone reads all day and a sign-up page want
opposite things, and a critique that does not know which it is looking at produces generic
advice for a generic screen.

**Never redesign a screen you have not captured.** The critique is of the product as built,
in every state — loading, empty, error, partial, unauthorised — at desktop and 375px. A
critique from the source code is a critique of what the developer intended, not what a person
sees.

**Never apply a redesign the owner has not seen.** Stage 3 produces wireframes as an artifact,
and stage 4 does not start until the owner has looked at them. A redesign is the most
expensive change to reverse in a product, and the owner is the only person who can say "that
is not how we work."

**"Act as the best design architect" is the persona; the substance is the checks.** The
critique lenses in `references/critique.md` are concrete and each has a failing condition. A
persona with no failing conditions produces confident prose and the same screens.

## Stage 1 — Capture

Every screen, every state, both widths, from a seeded demo account — the same discipline as
`references/walk.md` **in the guide skill** §0 and §1: disposable environment, 2× capture,
PNG, never production data. Record the navigation as a tree and the count of steps for the
three commonest jobs. This is the evidence the critique cites.

## Stage 2 — Critique

Read `references/critique.md`. Spawn the six specialists **in one message** — information
architecture, interaction design, visual hierarchy, states and feedback, accessibility,
content and copy — each judging every capture against their lens's failing conditions and
returning findings in CHECK's severities: BLOCKER if a person cannot complete the job, MAJOR
if they will do it wrong or give up, MINOR if it is friction. Each finding names the screen,
the capture, what is wrong, and what a person experiences because of it.

Then the design architect reads all six and writes the **verdict**: the three to five
structural problems that generate most of the findings. A product with forty findings usually
has four causes.

## Stage 3 — Redesign

Read `references/redesign.md`. For each screen group: the wireframe of what it should
become — grey, unstyled, real labels, every state — with a one-paragraph rationale naming the
findings it resolves. Published as an artifact the way `/flow:plan` does, with before-and-
after side by side, and **the owner reviews it before anything is applied.**

The shape-changing decisions — a navigation restructured, a screen merged or split, a job
moved to a different role — go to the owner as one question batch, and stop even under
autonomous mode.

## Stage 4 — Apply

Through the loop, one phase per screen group, each framed against the redesign artifact and
the project skill. The visual layer — tokens, components, the design standard — is
`/flow:theme`'s job: if the project has no confirmed theme, run it first; if it has one, the
redesign is applied within it. Captures at both widths close every criterion `by artifact`.
The report is `.flow/UIUX-<date>.md` with a status line per finding.

## Never

- **Never capture production data.** Demo account, always.
- **Never redesign from source.** From captures, in every state.
- **Never apply before the owner has seen the wireframes.**
- **Never add a component or pattern the job does not need** to look current. That is the
  generated-design tell this command exists to remove.
- **Never let the critique be taste.** Every finding has a failing condition from the lens
  and names the person's experience.

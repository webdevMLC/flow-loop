---
name: uiux
description: A design audit and redesign of a product as built, by a design architect — not a theme. It captures every screen, critiques the information architecture, hierarchy, interaction patterns, states, density and accessibility against current professional practice, designs what each screen should become and captures it as an image, shows the owner before touching anything — and the gate holds until they have looked, then applies the redesign through the loop and hands the visual layer to /flow:theme. Use when screens look dated or amateur, when the product works but nobody enjoys using it, when the UI was built ad hoc across many phases, or when the owner says "make it modern". Never applies a redesign the owner has not seen.
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
| **1.5 Machine** | contrast, target sizes, focus, alt, labels, overflow — computed, not judged | numbers |
| **2 Critique** | six specialists — what is wrong, against what standard, and why does it matter to the person using it? | nothing |
| **3 Redesign** | what should each screen become — designed, captured as images, before/after, as an artifact the owner reviews | the artifact, and `.flow/uiux/pending` |
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

**Never apply a redesign the owner has not seen.** Stage 3 produces designed screens, captured
as images, before and after — and writes `.flow/uiux/pending`, which makes the plan gate deny
every source write until the owner confirms the captures. Stage 4 cannot start early. A redesign is the most
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

## Stage 1.5 — The machine pass

Before a single specialist is spawned: compute what is computable. Contrast ratios for every
text-on-background pairing, rendered target sizes on the mobile capture, `outline: none`
without a replacement, images with no alt, controls with no label, tables that overflow at
375px. These are facts, they are cheap, and they are the findings most often asserted wrongly
in both directions.

Everything this pass settles is removed from the critique's scope, with the numbers attached.
The specialists then spend their budget on what a machine cannot read.

## Stage 2 — Critique


### Critiquing is checking; designing is making

**The model you make something with is not the model you check it with.** A critique is checking — it judges screens that already exist against conditions that
are already written down. A redesign is making — it is the thing the owner will approve and
the loop will build.

| Work | Tier |
|---|---|
| **Stage 1 Capture** | **cheap**, and the capture is a script |
| **Stage 1.5 Machine** | **no model** — contrast ratios, 44px targets, `outline: none`, missing alt, overflow. Measured, never judged |
| **Stage 2 Critique**, all six lenses | **cheap** — each lens has written failing conditions, and checking against a list is not frontier work |
| **The architect's verdict** | **cheap** — grouping forty findings into four causes reads what the lenses already wrote |
| **Stage 3 Redesign** | **frontier** — the screens you are asked to approve are the deliverable |
| **Stage 4 Apply** | **frontier**, because it is the loop's BUILD |

"Six specialists on the frontier model" was the first answer and it was wrong twice over: half
of what they check is arithmetic, and the other half is a list. **A model reading a PNG to
estimate a contrast ratio is not merely costly — it is less reliable than four lines of code**,
which this project has already proved once, when a script had to settle contrast claims the
readers got wrong in both directions.

**If a lens cannot judge cheaply, that is a finding.** A screen nobody can critique without the
best model available is a screen whose job nobody has written down — say so, rather than buying
a bigger reader.

## Stage 3 — Redesign

Read `references/redesign.md`. For each screen group: **the screen as it will ship** — the
theme applied, real components, real data, every state — **rendered and captured as a PNG at
desktop and 375px**, beside the stage-1 capture of what is there now, with a one-paragraph
rationale naming the findings it resolves. Published as an artifact the way `/flow:plan`
does, with the confirm command at the bottom. **The owner sees the pictures before anything
is applied, and the gate makes sure of it.**

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
- **Never apply before the owner has confirmed the captures.** `.flow/uiux/pending` holds the
  gate closed until `.flow/uiux-confirmed` carries their hash.
- **Never add a component or pattern the job does not need** to look current. That is the
  generated-design tell this command exists to remove.
- **Never let the critique be taste.** Every finding has a failing condition from the lens
  and names the person's experience.

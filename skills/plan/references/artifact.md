# The plan artifact — pictures the owner reviews before anything is built

One page. Every flow drawn, **every screen designed and captured as an image**, every
lifecycle as a state diagram. This
is the review surface; the project skill is the record. The owner looks at *this*, and the
confirm command is at the bottom of it.

## Where it goes

**Publish it as an artifact** where the Artifact tool exists — a private page with a link the
owner opens. Artifacts render Mermaid natively (`<pre class="mermaid">` blocks), so every
diagram below is Mermaid and nothing needs a library.

**Otherwise write `.flow/plan/index.html`** and tell the owner to open it. Load Mermaid from
`https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js` with a `<script>` tag and call
`mermaid.initialize({ startOnLoad: true })`. Either way the page is self-contained.

## What it contains, in order

**1. In the owner's words.** The intent record's quote, as a blockquote, first. Everything
below it is the plan's reading of that quote, and the owner should see the two side by side.

**2. The process flows — one diagram each.** A Mermaid flowchart, left to right, one node per
state, with the actor on the edge and **the screen where the person sees the result as the
terminal node.** A flow that ends in a database table and not a screen is a flow with a gap,
and the diagram makes that visible in a way three lines of text does not:

```mermaid
flowchart LR
  A[organiser: New tournament form] -->|Create| B[(tournament: draft)]
  B --> C[organiser: My tournaments list]
  C -->|Publish| D[(tournament: open)]
  D --> E[player: Find tournaments]
  E -->|Join| F[(entry: pending)]
  F --> G[organiser: Entries tab]
  F --> H[player: My status]
```

Every write node is a cylinder; every screen node is a rectangle with the role in it. **If a
cylinder has no rectangle after it, say so under the diagram** rather than fixing it silently
— it is a finding for the owner.

**3. The screens — designed, and captured as images.**

This is the part of the plan the owner actually judges, so it is not a wireframe. **Design each
screen as it is meant to ship** — the chosen theme applied, real components, real content — and
**capture it to a PNG**, so what they review is a picture of the product, not a description of
one.

Every screen a job lands on, and every screen the job passes through. The one after the action
matters most: it is the screen that was missing when a tournament could be created and then
appear nowhere.

Each screen shows:

- **the real navigation**, with the real labels, so the owner can say "we would never call it that"
- **the real fields** on any form, so a missing one is visible before it is built
- **realistic content** — actual names, amounts, dates from the domain. Never lorem, never
  `Item 1`: a table of placeholder rows hides every column that is wrong
- **the empty state**, as its own capture, because most screens are first seen empty
- **the list or detail the created thing lands in**

### Pick the theme first

The screens cannot be designed without one. Either the project already has a design standard
in `.flow/PROJECT.md` — use it — or choose from the seven in `references/themes.md` **in the
theme skill** and say which, in one line, as a decision the owner can overturn. Getting this
wrong is cheap here and expensive after forty screens are built.

### Then capture them

Write each screen as a standalone HTML file under `.flow/plan/screens/`, styled with the
theme's tokens, then **render it and capture a PNG**:

- **Desktop and 375px**, both, for any screen a person reaches on a phone
- Into `.flow/plan/screens/` as `<slug>.png` and `<slug>-mobile.png`
- Use whatever the host provides — the browser tool, Playwright, headless Chrome. Same
  discipline as `references/walk.md` **in the guide skill** §1

**The plan gate requires at least one image there.** A plan with no picture of the product is
the plan that shipped a board saying "no leads yet", and the owner confirmed it having seen
nothing. The page embeds the captures; the captures are what the confirmation covers.

**It is a design, and it is disposable.** It will be wrong in places — that is the point of
showing it before forty screens exist. The owner says "not that" once, here, instead of after
BUILD.

**4. Entities and lifecycles — a state diagram each.**

```mermaid
stateDiagram-v2
  [*] --> draft: organiser creates
  draft --> open: organiser publishes
  open --> closed: entries full, or organiser closes
  closed --> running: organiser starts
  running --> complete: final result entered
  draft --> [*]: organiser deletes
```

A state with no outgoing edge that is not terminal is a state with no exit. A transition with
no actor on it is a step with no actor. Both are visible here and invisible in prose.

**5. The boundaries** — one diagram, modules and the arrows between them, nothing inside them.

**6. What it is not.** The exclusions, as a plain list. The owner should be able to say "wait,
I did want that."

**7. The decisions.** Each one the owner was asked, the options, and what they chose — so the
record of the choice sits next to the flows the choice shaped.

**8. The confirm command.** Last, and set apart:

> If this is the product you want, run:
> `echo <hash> > .flow/plan-confirmed`
>
> If it is not, say what is wrong — the skill changes, the hash changes, and you confirm the
> corrected version.

The hash is `sha256` of `.claude/skills/<project>/SKILL.md`, first twelve hex characters —
the same value the plan gate prints when it denies. Compute it after the skill is final.

## Keep it honest

- **Every screen in the artifact appears in the skill's jobs, and every job has a screen.** A
  mismatch is a gap the artifact just found; fix the skill, not the picture.
- **No screen that the plan does not deliver.** A design of something in "what it is not"
  is a promise the owner will remember.
- **Say what the experts disagreed on**, in the decisions section, rather than showing one
  clean answer. The owner chose; the artifact shows what they chose between.
- **Do not style it.** Grey, system font, one column. It is a drawing, not a design.

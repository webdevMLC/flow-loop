# Applying a theme without breaking the project

Only after the user has seen the conflict report and answered. This is loop work — it touches
screens, so CHECK fires `references/uiaudit.md` **in the loop skill** and the criteria close
`by artifact`.

**The before-captures were taken at the end of stage 1. If they are not on disk, stop.** Step 1
below destroys the only thing they could have recorded.

## Size it first

The survey's hard-coded count decides the shape of the work, and the user agreed to that shape
in stage 2:

- **Under ~30 occurrences** — one phase.
- **30 to ~150** — one phase for the token layer and shared components, then one per screen
  group. Each phase ships green.
- **Above that** — the token layer and a **single pilot screen** first, then stop and show the
  capture. A 300-value migration agreed to on the strength of a description gets agreed to
  twice, and the second time is worse.

## 0. Clear the TDD gate before touching a component

This migration edits `.tsx`/`.ts` component and route files for a colour-only change, and the
hook denies nearly every one: `components/ui/button.tsx` has no `button.test.tsx`, and
`app/<route>/page.tsx` is denied unless a test names that route.

A colour swap is markup and styling, which is outside TDD scope. Use the first escape hatch in
`references/gates.md` **in the loop skill**: append the component and route path fragments this
migration touches to `.flow/tdd-exempt`, one per line, **list those lines verbatim in the
report** so the user sees exactly what was exempted, and remove them at SHIP.

- **Never create `.flow/tdd-off`.** It is project-wide and permanent, and it disarms the
  plugin's main enforcement long after the theme ships.
- **Never write a test whose only job is to unblock a colour change.**
- **Never override colours from a global stylesheet to route around a denial** — that is the
  first refusal in `SKILL.md` arriving through the back door.

Any edit in this migration that changes behaviour rather than appearance leaves the exemption
and is written test-first like anything else.

## Order

**1. The token layer.** Define every token from `references/themes.md` in whatever form the
survey found. Do not add a second styling layer to do it — if the project is Tailwind, the
tokens go in the Tailwind theme.

Where the survey found *info* or *disabled* in use, resolve the gap here as agreed in stage 2 —
usually info derived from the accent and disabled from `--dim` — and record the derivation, so
the next person does not re-invent it.

**2. Nothing else in this step.** Load the app and look. If the shell changed, the tokens are
reaching the screen. If nothing changed, the resolution order from the survey is wrong, and
everything after this would be built on a false premise.

**3. Shared components before screens.** Buttons, inputs, cards, tables, badges, nav. Most
screens change on their own once these do, and each one fixed here is a screen not touched.

**4. The component library through its own contract.** If the kit has a theming contract, go
through it. Overriding a kit from outside gives a UI that half-changes — the parts you
remembered.

Where the kit has fewer slots than the theme needs — one `primary` where Basalt has two
registers, or where Relief needs a raised and a recessed pair — add the extra variables
alongside the kit's own rather than overloading its slot. Overloading `primary` is what makes a
theme unremovable later.

**5. Hard-coded values, grouped by value, not by file.** Migrate all 40 occurrences of one
colour together; you verify one decision instead of forty. Grouping by file means deciding the
same thing repeatedly and eventually deciding it differently.

**6. What CSS cannot reach.** Chart colour arrays, canvas, PDF and email templates, anything
emitting inline styles server-side, SVG with baked fills, favicons and OG images. These are
missed by default and they are what makes a migration look 90% done for a week. List them in
the survey, fix them here, report any that cannot be reached.

## The three that go wrong

**A colour that carried meaning is now the brand.** From the survey's status vocabulary. If the
project's success green became the accent, every success message now reads as a link. Check the
mapping after the token layer lands — not by looking at a screen, by comparing the survey's
status list against the theme's semantic tokens, name by name.

**Contrast that held in the old palette and does not hold in the new one.** Every value in
`references/themes.md` clears AA against the grounds *that theme* declares. The moment you put
a token on a surface the theme did not declare — a tinted card the project already had, a
coloured table row — that guarantee no longer covers it, and it has to be measured. Dim text on
a raised surface is the usual casualty, and it is usually the table header.

**The law applied to the shell and not the components.** Ember with an amber pending pill
somewhere, Relief with a floating panel nobody can click, Basalt with a paper panel using
field-register semantics. The law decays first because it is the part that is not a value.

## Captures close it

Per `references/evidence.md` **in the loop skill**, a `by artifact` criterion is closed by the
file existing and showing the thing. Capture at desktop width and at 375px into
`.flow/evidence/<phase>/`, and pair each one against the before-capture stage 1 saved under
`.flow/evidence/<phase>/before/` — a theme change is judged by comparison, and nobody remembers
the old screen accurately.

Capture the states, not only the happy path: empty, error, and a table with enough rows to
scroll. A theme only ever photographed full of tidy data has not been checked.

If a screen cannot be captured, the criterion is `by person` and goes to `.flow/UAT.md`. Never
downgrade it to a passing test.

## Write the law into PROJECT.md

Same phase, before SHIP. `references/state.md` **in the loop skill** specifies what
`.flow/PROJECT.md` § Design standard holds — the styling layer, the component library, the
palette and type, and any rule a screen could break while still looking fine. The theme
supplies all of it, and **the law is the part being added**:

```markdown
## Design standard
Theme: Ember. Styling layer: Tailwind (do not introduce a second).
Palette: tokens in tailwind.config.ts — never a literal hex in a component.
Type: Red Hat Display for headings and figures, Red Hat Text for body.
- Gold #d9a441 means "actionable" and appears on nothing else — not a status, not a chart,
  not a heading.
- Pending has no colour; it is a hollow outline. There is no warning hue in this theme.
- Cards have no borders. Separation is by surface level: bg / surf / surf2, hairline on line.
- Info derives from the accent at 12% on surf; disabled is --dim at 40%.
- Figures use tabular-nums.
```

Point at the token location rather than restating hexes — the values live in code, and a
standard that duplicates them will disagree with code the first time one changes. The rules and
prohibitions are what the section adds, and what `references/uiaudit.md` **in the loop skill**
enforces on every screen anyone adds afterwards.

If the section did not exist, create it, and say so in the report.

## Report

- Screens changed, and screens deliberately not changed.
- **Hard-coded values remaining, counted.** Report the number even when zero, and especially
  when it is not. A migration reported as done with 60 values left behind is how the old
  palette comes back.
- **The `.flow/tdd-exempt` lines added, verbatim, and confirmation they were removed at SHIP.**
- What could not be reached — the PDF templates, the chart library, the third-party widget.
- Captures, before and after.
- The law, and where it now lives.

# The component layer

Tokens decide what colour things are. They do not decide what things *are*. A bare `<table>`
with a new palette is still a bare `<table>`, and a project that stops after stage 3 gets its
old interface in better colours — the commonest complaint about a finished theme, and the
reason this stage exists.

**Read `references/themes.md` alongside this file.** The chosen theme's law and its tokens
decide every appearance question here; this file decides what gets built and to what standard.

## First: disarm nothing, re-arm the gate

Stage 3 wrote component path fragments into `.flow/tdd-exempt` so a colour swap could proceed.
**Delete every one of those lines now, before the first component edit.**

The gate matches by substring and exits silently — `hooks/flow-tdd-gate.mjs` does
`lower.includes(frag)` then `process.exit(0)`. One leftover `components/ui` line exempts every
file this stage must write test-first, and you will never see a denial. **A write that is not
denied is not proof that RED happened — it may be proof the exemption is still there.** After
deleting, write one component file and confirm the gate denies it.

## Why a re-themed UI still looks obsolete

Not vague. These are the tells, and every one has a work item later in this file:

**Native controls left alone.** `<select>`, `<input type="checkbox">`, `radio`, `file`, `date`.
They render in OS chrome and date everything around them. **A styled page with a default grey
dropdown in it is the loudest tell there is.**

**Missing states.** A button with no hover, active, disabled or loading. An input with no focus
ring, no error state, no hint line. A row with no hover. It works and feels unfinished, because
nothing responds.

**No empty and no loading state.** A table that renders blank then pops; a list with no rows
and no message. Most screens are seen empty first, and an empty screen with no words reads as
broken rather than new.

**Table indiscipline.** Numbers not right-aligned and not `tabular-nums`, so columns wobble. No
sticky header. Inconsistent row heights. No sort affordance. Bare Previous/Next pagination.

**Forms as one long column.** Label, input, hint and error not one unit, so the error appears
somewhere unrelated. Required unmarked. No grouping.

**No spacing scale.** Arbitrary margins, so nothing aligns across two cards.

**No type scale.** One size and one weight, so hierarchy comes only from position.

**Focus removed and not replaced.** `outline: none` with nothing after it — cheap-looking and
an accessibility failure in the same line.

**Mixed or missing icons** — three sources, three stroke weights, three sizes.

## Grade what is there

The survey grades every component. The grade decides the work, so the boundary that matters is
1 versus 2 — get it wrong and the stage evaporates:

| Grade | Test | Work |
|---|---|---|
| **0 native** | it is a bare browser element | build it |
| **1 painted** | **any** of: no hover, no visible focus, no disabled, no loading, no empty state, no error state, or fewer variants than the screens need | rebuild it |
| **2 built** | every state above exists, keyboard reaches it, ARIA is right | retoken only |
| **3 systematic** | grade 2 *and* composed from tokens, identical on every screen | nothing |

**Grade 1 is the trap.** It looks handled — someone clearly styled it — and it is exactly what
makes a console feel dry. Grade against the list, not by impression: **"it has our colours on
it" is grade 1.** If you cannot name where each state is implemented, it is not grade 2.

## Never run a component generator

In a Next.js + Tailwind project the move that comes to mind is `npx shadcn@latest init` and
`npx shadcn add button select table dialog`. **Refuse it here.**

`init` rewrites `globals.css` and `tailwind.config.ts` with its own `--primary` /
`--background` / `--ring` / `--radius` block, and `add` overwrites `components/ui/*.tsx`. Run
after stage 3, that destroys the entire token layer you just migrated and every component you
hand-styled, and the after-captures show a default zinc interface rather than the theme.

Adopting shadcn — or any generator — is a **stage-2 BLOCKER conflict decided before stage 3
starts**, so its tokens are the thing stage 3 migrates *into*. It is never a stage-4 command.

## Build, or adopt

**If a component kit is already in the project**, extend it through its own theming contract.
Overriding from outside produces a UI that half-changes.

**If there is none**, adopt a headless primitive library and style it with the theme tokens —
React: Radix or React Aria. Vue: Radix Vue or Headless UI. Svelte: Melt or Bits UI. Plain
templates or a server-rendered stack: there is usually no good primitive library, so keep the
native elements and style them (see the fallback below) rather than hand-building a listbox.

Focus traps, ARIA wiring, keyboard menus, typeahead and dismiss behaviour are genuinely hard.
Take the behaviour, supply the appearance.

**Hand-roll only these**: badge, card, KPI tile, skeleton, the label/hint/error unit, and the
button — with the caveat that a *loading* button must stay focused and announce its state, and
a button that is really a link must render an `<a>`. Everything else — anything with a popover,
a focus trap, a roving tabindex, or a listbox — comes from the library. **Tabs and accordions
are not simple**; they need roving focus and correct ARIA, and they belong in the library list.

## The submitted value is frozen; the call site is not

This is the rule that keeps the stage safe without gutting it.

**Same values in `FormData`, same validation outcomes, same defaults.** The props and events a
call site passes *may* change — migrating those call sites and their tests is a listed task in
this phase, not a reason to skip the work. A Radix Select is `value`/`onValueChange` over a
Root/Trigger/Content/Item tree; that is a legitimate change, and pretending otherwise is how
step 2 below gets quietly deferred.

**A replaced native control loses what the element gave you for free.** Before and after:

- The same `name` appears in `FormData` with the same value — render a hidden input if the
  primitive does not.
- Native `required` is re-expressed as validation that still blocks submit.
- `defaultValue`, controlled-ness, `disabled` and form reset behave the same.
- Assert **the submitted payload**, not the rendered role.

**You may not weaken an existing test to keep it green.** Rewriting `getByRole('combobox')` to
match new markup, and calling that a passing migration, is how a sign-up ships posting no
country at all.

**Where a replacement would change the form contract and you cannot re-express it, keep the
native element under a styled wrapper.** `appearance: none` plus a custom indicator is enough
for select, checkbox and radio, and it keeps every native guarantee. That is a correct outcome,
not a compromise.

## Every component ships its states

This is most of the perceived quality, and the list matches the five states
`references/uiaudit.md` **in the loop skill** already checks during CHECK:

| Kind | States |
|---|---|
| Button | default · hover · active · focus-visible · disabled · loading |
| Input & select | default · hover · focus · filled · disabled · read-only · error · with hint |
| Table & any list | populated · **loading** (skeleton, not a spinner) · **empty** · **error** · **partial** · **unauthorized** |
| Row | default · hover · selected · disabled |
| Modal | open · closing · loading action · destructive variant |

**The empty state decides whether a new system looks ready or broken.** It says what the screen
is for and what to do next. Never blank, never just "No data".

## The inventory

Grade each, build in the order below. Roughly 45 items — that is the point, and it is why the
survey's grade counts drive the phase plan.

**Foundations** — the type scale (sizes and weights, applied everywhere) · the spacing scale
(nothing off-scale) · **one icon set** at one stroke weight and one size ramp · the focus-ring
treatment used by every interactive element.

**Shell** — sidebar or top nav with an active state · breadcrumbs · user menu · notifications ·
search · page header with title, description and actions.

**Data** — table (sortable, sticky header, row hover, selection, right-aligned tabular numbers,
all six states) · pagination · filter bar · KPI tile · chart wrapper with its own empty and
loading states.

**Forms** — text input · textarea · **select** · **multi-select** · **checkbox** · **radio** ·
switch · **date picker** · **file upload** · search input · the label/hint/error unit wrapping
all of them · form section grouping · submit row with a loading button.

The bolded ones are the native controls: the highest-value work in this stage.

**Feedback** — toast · inline alert · modal · confirm dialog · drawer · skeletons · empty state
· error state · full-page loading.

**Display** — button (variants × states) · icon button · badge and status pill · avatar · tabs
· card · tooltip · dropdown menu · accordion.

**Auth pages** — sign in, forgotten password, reset, two-factor. The first thing every user
sees and the last thing anyone styles.

## Responsive and touch are part of the definition

`references/uiaudit.md` **in the loop skill** captures every screen at 375px, so a
desktop-only component fails the same phase that built it.

- **Tables restructure below ~640px** — stacked label/value cards, or a chosen subset of
  columns. Horizontal scrolling a data table on a phone is a finding, not a layout.
- **Touch targets are at least 44px**, and hover-only affordances have a tap equivalent. A row
  action that only appears on hover does not exist on a phone.
- **Sticky headers and modals respect the on-screen keyboard** and safe-area insets.
- **Dropdown, date and select primitives** get checked on a narrow viewport — this is where
  library defaults most often overflow.

## Order

Highest visible return first; each step ships green:

1. **Foundations** — type scale, spacing scale, icon set, focus ring. Everything composes on
   them, and doing them later means redoing the work above them.
2. **The label/hint/error unit and the button.**
3. **The native controls** — select, checkbox, radio, date, file. Biggest single jump in how
   the product reads.
4. **The table** with its six states, right-aligned tabular figures, row hover, and its
   sub-640px form.
5. **Empty, loading and error states everywhere they are missing.** Cheap, and the largest
   perceived-quality gain per hour after the controls.
6. **Feedback** — toast, modal, confirm dialog.
7. **The shell** — nav active states, page header, user menu.
8. **Auth pages.**
9. **The rest**, by how often the screen is opened.

**Stop and show after step 4.** Steps 1–4 are enough to tell whether the direction is right,
and that is a far cheaper moment to change course than after step 9. **A standing autonomous
mode does not cover this stop** — it is the same rule as stage 2's: a rebuild of every control
in the product is hard to undo, so it stops and asks even mid-run.

## Let the theme's law decide the treatment

Appearance is not a fresh decision per component — `references/themes.md` settled it, and the
law is what keeps forty components looking like one system:

- **Relief** — raised means you can press it. The button and the active tab are raised; the
  table and the KPI band sit in wells. A floating panel nobody can click is a bug.
- **Ember** — gold means actionable. The primary button is gold; a pending badge is a hollow
  outline with no colour at all.
- **Basalt** — each register's action is the other register's surface. On the field the primary
  button is a paper plane; inside a paper panel it is field-coloured.
- **Signal** — fully rounded. Buttons, badges and nav items are pills; the radius is identity.
- **Nordic** — blue is never a status. The sort arrow and the link are blue; a status pill
  never is.
- **Aurora** — depth from surface levels. A dropdown is a higher surface token, never a shadow.
- **Meridian** — weight carries hierarchy. Figures extrabold and tight; the accent out of data.

If a component needs a decision the law does not cover, that is a gap in the law: add the rule
in the same phase.

## Write the component rules into PROJECT.md

The law alone governs colour. Without a bar for components, CHECK cannot fail the next screen
someone builds with a native select in it. Add to `.flow/PROJECT.md` § Design standard:

```markdown
Components: from components/ui/ only — never a bare <select>, <input type="checkbox">
or <table> in a screen. Every interactive element has hover, focus-visible, disabled.
Every list has loading, empty and error states. Tables restructure below 640px.
Icons: lucide, 20px, 1.5 stroke. Spacing on the 4px scale; type on the declared ramp.
```

`references/uiaudit.md` **in the loop skill** reads that section every CHECK, which is what
stops the drift back.

## Report

Counted, the way the colour migration is:

- **Components by grade, before and after** — "12 at grade 0/1 before, 2 after" — and which two
  remain, and why.
- **Native controls remaining**, counted. Zero, or named.
- **Lists with no empty state remaining**, counted.
- **Call sites migrated**, and any test whose assertion changed — with confirmation it asserts
  the payload, not the markup.
- **The `.flow/tdd-exempt` lines deleted before this stage began.**
- Captures, before and after, at both widths.

A stage-4 report with no counts is the same failure as a colour migration that says "done" with
sixty hard-coded values left.

# Surveying an interface that already exists

The output is a map, not a file list. Nothing is written during this stage except the
before-captures, which are the last thing you do here.

**If `.flow/` does not exist, stop.** This is not a Flow project yet, and the skill depends on
that directory for the design standard, the evidence directory and the exemption file. Adopt
Flow first — `references/state.md` **in the loop skill** — then come back. If `.flow/` exists
but `PROJECT.md` does not, note it and continue: stage 3 creates the file.

## 1. The styling layer, and whether there is more than one

Find how styles actually reach the screen: Tailwind, CSS modules, styled-components, plain
stylesheets, a UI kit's own theming, inline styles. **Projects usually have two and admit to
one.** Both matter — a theme applied to the layer the project documents rather than the layer
it uses changes nothing on screen.

Record the resolution order too. A Tailwind config token that a component overrides with an
inline style is not a token, and the theme will not reach it.

## 2. Tokens, or the absence of them

Look for a token layer: CSS custom properties, a Tailwind theme extension, a `theme.ts`,
design tokens in any form. Then answer the question that decides the cost of everything after.

**Two numbers are needed — total occurrences and distinct values** — so count the matches
themselves, not the lines that contain them. A line reading `border: 1px solid #e5e7eb; color:
#111` is two colours, and a line-based count reports one.

```sh
# every literal colour, one per line, tallied by value
grep -rIoEh --exclude-dir={node_modules,dist,build,.next,coverage} \
  '#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)|hsla?\([^)]*\)' <source dirs> \
  | sort | uniq -c | sort -rn
```

The line count of that output is the **distinct** number; the sum of the counts is the
**total**. Report both. 300 occurrences of six colours is a migration; 300 occurrences of
ninety is an excavation, and the user needs to know which they are buying.

Then count what is *nearly* a token — a Tailwind palette class is hard-coded as far as a theme
is concerned, and these get forgotten because they do not look like hex:

```sh
grep -rIoEh --exclude-dir={node_modules,dist,build,.next} \
  '\b(bg|text|border|ring|fill|stroke|from|via|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b' \
  <source dirs> | sort | uniq -c | sort -rn
```

(`rg` takes the same flags and is faster where it exists.)

## 3. Type

The families actually loaded — not the ones in the config — where they load from, the weights
requested, and whether figures are set `tabular-nums` anywhere they line up in columns.

If the project loads five families, that is a finding on its own. Say so before the theme adds
a sixth.

## 4. The real palette

Build it from the code, not from a design file and not from the token names. Token names lie:
`--primary` is frequently not the colour of the primary button.

For each distinct colour record where it appears and **what it means there**. That mapping is
the input to the semantic conflict check and it cannot be recovered later.

## 5. Status vocabulary — the one that silently corrupts a UI

List every colour the project uses to mean something: success, warning, error, **info**,
**disabled**, plus any domain state (pending, reversed, settled, overdue, flagged).

Info and disabled are on that list deliberately. **No theme in `references/themes.md` ships
either**, so wherever the project uses them you have found a gap that stage 2 must report and
the user must resolve — usually by deriving info from the accent and disabled from `--dim`.
Finding it now is cheap; finding it when a screen renders an uncoloured info banner is not.

**This is where themes break projects.** If the project's success green is the incoming theme's
brand accent, then after the migration every success message reads as a link and every link
reads as a success. Nothing errors, no test fails, and the interface stops making sense.

Write each meaning-carrying colour down and check it against the theme's accent explicitly. Do
not eyeball it. Ember is the standing example: its accent is amber-gold, which is the
near-universal warning colour.

## 6. Components

Inventory what exists, and separate two groups, because they cost very differently:

- **Library components** — a kit with its own theming contract. The theme has to go through
  that contract; overriding it from outside produces a UI that half-changes.
- **One-off components** — hand-built, usually hard-coded, usually the majority of the work.

Record the kit's actual token slots, not just its name. A kit with one `primary` slot cannot
express Basalt's two registers or Relief's raised/recessed pair without additional variables,
and that is a structural conflict to report rather than discover in stage 3.

Note anything else that will resist: fixed-height rows, absolute positioning that assumes a
radius, a chart library with its own colour array, PDF or email templates that cannot use CSS
variables at all.

### Grade every component — this sizes stage 4

Tokens cannot fix a component that was never built. Walk the inventory in
`references/components.md` and grade each one, because the grades decide the work:

| Grade | Test | Work |
|---|---|---|
| **0 native** | it is a bare browser element | build it |
| **1 painted** | **any** of: no hover, no visible focus, no disabled, no loading, no empty state, no error state, or fewer variants than the screens need | rebuild it |
| **2 built** | every state above exists, keyboard reaches it, ARIA is right | retoken only |
| **3 systematic** | grade 2 *and* composed from tokens, identical on every screen | nothing |

**Grade 1 is the trap**, and the 1-versus-2 boundary is where this whole stage is won or lost:
grade generously and stage 4 evaporates. It looks handled — someone clearly styled it — and it
is precisely what makes a console feel dated after a theme lands. Grade against the list, not
by impression. **"It has our colours on it" is grade 1**, and if you cannot name the file and
line where each state is implemented, it is not grade 2.

Three specific things to count, because they carry most of the perceived quality:

- **Native controls left alone.** `grep` for `<select`, `type="checkbox"`, `type="radio"`,
  `type="file"`, `type="date"` and count the ones with no styled wrapper. A styled page with a
  default grey dropdown in it is the loudest tell there is.
- **Missing states.** For the button, the input and the table row: is there a hover, a focus
  ring, a disabled and a loading state at all?
- **Missing empty and loading states.** Every list and table: what renders with no rows, and
  what renders while fetching? Most screens are seen empty first.

## 7. Dark mode

Whether it exists, how it is switched (class, `data-` attribute, media query, a state library),
and whether it is complete or only covers the shell.

**Six of the seven themes are single-mode.** A project with a working dark mode therefore has a
structural conflict with all but Aurora — see the end of `references/themes.md` for the three
honest resolutions. Record which screens the existing dark mode actually covers; "it has dark
mode" and "nine screens are unstyled in the dark" are different findings.

## 8. Density and the job

Measure it: row heights, control heights, the base font size, section padding. Then ask what
the screens are *for*. A console someone reads all day and a marketing surface want opposite
things, and a theme chosen against the wrong one is resented daily without anyone being able to
say why.

## 9. `.flow/PROJECT.md` § Design standard

Read it last and let it override everything above. It is the authority
`references/uiaudit.md` **in the loop skill** already checks screens against during CHECK.

Quote each rule verbatim into the survey. Rules of this kind are invisible to taste and no
generic rubric catches them:

- "Tailwind is the styling layer; do not introduce a second." — rules out any theme applied as
  raw CSS custom properties, however good it looks.
- "No user appears in rank order against another." — a leaderboard passes every visual check
  and breaks the one rule that project has.
- "No widget displays time tracking, location, a check-in or a ranking mechanic."

If the section does not exist, say so and note that stage 3 creates it. A project with no
recorded standard is exactly the project where a theme decays fastest.

## 10. Before-captures — the last act of stage 1

Capture every screen the migration will touch, at desktop width and at 375px, plus its empty
and error states, into `.flow/evidence/<phase>/before/`.

**This is the only moment they can be taken.** Stage 3 step 1 repaints the shell, and a "before"
captured after that is a fabrication. If nothing available can produce a capture, say so now —
the criterion becomes `by person` and goes to `.flow/UAT.md`, per `references/evidence.md` **in
the loop skill**.

## The survey output

Short, and organised so the conflict stage can be mechanical:

```
Styling layer   Tailwind 3.4 + 3 files of raw CSS (two layers)
Tokens          none — palette lives in tailwind.config.ts
Hard-coded      214 occurrences / 31 distinct + 47 palette classes / 9 distinct
Type            Inter (Google) 400,500,600 + system fallback
Palette         #6366f1 primary buttons+links · #10b981 success only · #ef4444 destructive+error
Status          success #10b981 · warning #f59e0b · error #ef4444 · info #3b82f6 · pending grey
Components      shadcn/ui (one `primary` slot) + 23 one-off
Maturity        0 native: select, checkbox, radio, date (4 screens each)
                1 painted: button (no disabled/loading), table (no hover/empty), card
                2 built: modal, toast · 3 systematic: none
                no empty state on 6 of 8 lists; no loading state anywhere
Dark mode       class strategy, shell only — 9 screens unstyled
Density         44px rows, 15px base — console, read all day
Standard        present — "Tailwind is the styling layer; do not introduce a second"
Before-captures 14 screens x 2 widths + 6 states -> .flow/evidence/p31/before/
```

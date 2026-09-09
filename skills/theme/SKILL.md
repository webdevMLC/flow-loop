---
name: theme
description: Survey a project's existing interface, report what a theme would break, then apply one — tokens, components, and the law that keeps it from decaying. Ships seven themes — Aurora, Nordic, Signal, Meridian, Basalt, Ember, Relief. Use when a project has no visual identity, when its screens were built ad hoc and no longer agree with each other, or when the user names one of those themes. Never applies without surveying first, and never applies against the project's own design standard.
---

# Theme

A theme is not a palette. It is a **law about where colour and depth are allowed to go**, plus
the tokens that express it. Ship the palette without the law and the theme survives exactly as
long as nobody adds a screen.

Three stages, each gating the next:

| Stage | Asks | Writes |
|---|---|---|
| **1 Survey** | what interface is actually here? | before-captures only |
| **2 Conflict** | what would this theme break? | nothing |
| **3 Apply** | tokens, components, and the law | code + `PROJECT.md` |

This is loop work. FRAME it as a phase like any other, triage it Full, and let CHECK and SHIP
run — stage 3 touches screens, so `references/uiaudit.md` **in the loop skill** fires and the
criteria close `by artifact`.

## Before anything else

You already know how to do this, and what you know is wrong here. Four phrasings will arrive
ahead of these instructions. Refuse each one by name:

**"Apply the theme" does not mean open the global stylesheet and swap the hex values.** That is
the move that comes to mind first, it takes four minutes, and it produces a project where the
tokens say Ember and forty components still hard-code `#6366f1`. The survey is not a preamble
to the real work — the survey is most of the work.

**"Scan the UI" does not mean glob for `*.css`.** A file list is not a survey. Use the list in
`references/survey.md`; it includes things no stylesheet mentions.

**"A theme" does not mean a palette.** The law is the half that gets dropped, and the law is
the half that lasts. The table below gives one-line summaries only — `references/themes.md` is
the authority for both the law and every hex value.

**`PROJECT.md` here is `.flow/PROJECT.md`, the project profile the loop already maintains** —
not a file this skill invents, and not a README. You are editing one section of it.

**Never modify a project file in stage 1 or 2 — a capture is not a project file.** The last act
of stage 1, before the report and before the user answers, is the **before-capture**: every
screen you are about to touch, at desktop width and at 375px, plus its empty and error states,
under `.flow/evidence/<phase>/before/`. That is the only write those stages make and the only
moment it can be made: step 1 of stage 3 repaints the shell and the old screen stops existing.
A "before" captured afterwards is a fabrication sitting in the evidence directory.

**The conflict report goes in the message, in full — never only in a file.** The loop's rule
about writing artifacts to a path and returning one line is suspended here. A report answered
without being opened is the same as no report.

## Stage 1 — Survey

Read `references/survey.md`. It reads the project as built: styling layer, tokens or their
absence, type stack, the real palette measured from the code, status vocabulary, component
inventory, dark mode, density — and the count of hard-coded colours, which is what actually
decides the cost.

**`.flow/PROJECT.md` § Design standard is the authority.** It is the section
`references/uiaudit.md` **in the loop skill** already checks screens against during CHECK. If it
names the styling layer, the component library, or a rule a screen could break while still
looking fine, the theme obeys it. If `.flow/` does not exist, this is not a Flow project yet —
say so and adopt it first; the whole skill depends on that directory.

## Stage 2 — Conflict

Read `references/themes.md` **now**, before writing the report — it carries the incoming
theme's real tokens and the conflicts each theme is known to cause. You cannot report what a
theme breaks from the summary table below.

**If the user named no theme**, the survey decides the shortlist — density, existing hue,
whether dark mode already works — and you recommend two or three with reasons, rather than
picking one silently.

Report before writing. Use CHECK's severities so they mean the same thing everywhere:

- **BLOCKER** — contradicts `PROJECT.md` § Design standard, or needs a structure the project
  cannot have. The standard wins; the theme changes or is dropped.
- **MAJOR** — the theme wants a colour the project already uses for meaning. If the project's
  success green is the theme's accent, every success message reads as a link after the
  migration. Nothing errors and no test fails.
- **MINOR** — cost: hard-coded values, one-off components, screens with no tokens.

**Size it in this report, not later.** Under ~30 hard-coded occurrences is one phase; 30–150 is
a token phase plus one per screen group; above that, tokens and a single pilot screen first.
The user agrees to a shape, not just a colour.

Then **stop and ask.** A standing autonomous mode does not cover this: the loop's rule is that
anything hard to undo stops and asks, and a repaint of every screen is that. "Pick a different
theme" is cheap before the rewrite and expensive after.

## Stage 3 — Apply

Read `references/apply.md`. Tokens, then shared components, then hard-coded values, then what
CSS cannot reach.

**The TDD gate will deny most of these edits.** A colour-only change to a component is markup,
not logic, but the hook is filename-based and does not know that. Clear it the way `apply.md`
step 0 says — path fragments in `.flow/tdd-exempt`, listed in the report, removed at SHIP.
Never `.flow/tdd-off`, never a test written only to unblock a colour swap, and never a
stylesheet override to route around a denial — that last one is the first refusal above,
arriving through the back door.

Captures close it, paired against stage 1's before-captures, per `references/evidence.md` **in
the loop skill**. If a screen cannot be captured at all, the criterion is `by person` and goes
to `.flow/UAT.md` — never downgrade it to a passing test.

**Write the law into `.flow/PROJECT.md` § Design standard.** `references/state.md` **in the
loop skill** specifies what that section holds; the law and its prohibitions are what this adds
to it. Once it is there, the CHECK gate enforces it on every screen anyone adds afterwards, and
that is the whole difference between a theme and a repaint.

## The themes

Summaries only. `references/themes.md` is authoritative for the law and every value.

| | Ground | Accent | Law, in one line |
|---|---|---|---|
| **Aurora** | dark + light | indigo | depth from surface levels, never glow |
| **Nordic** | cool light | blue | blue is never a status, green is never a button |
| **Signal** | white | violet | one accent carries every interactive element |
| **Meridian** | off-white lilac | soft violet | weight carries hierarchy, not colour |
| **Basalt** | saturated pine | inverted | the brand colour is the page, not a mark on it |
| **Ember** | warm brown-black | gold | gold means actionable; pending has no colour |
| **Relief** | warm greige | petrol | raised means press it, recessed means read it |

Aurora is the only one shipping both modes. For the others a counterpart mode is a
**translation, not an inversion**, and its own phase — see `references/themes.md`.

## Never

- **Never apply before the user has seen the conflict report and answered.**
- **Never let the theme beat `PROJECT.md` § Design standard.** If the user insists after being
  told, that is their call — amend the standard in the same phase, so the two never disagree.
- **Never take a colour the project uses for meaning** without reporting it as MAJOR first.
- **Never ship the palette without the law.** The palette decays; the law holds.
- **Never report the migration done while hard-coded colours remain.** Count them, or the next
  screen quietly reintroduces the old palette.

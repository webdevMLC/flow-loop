# The seven themes

Tokens are given as CSS custom properties because that is the lowest common form. Translate
them into whatever the survey found — a Tailwind theme extension, a `theme.ts`, the component
kit's own contract. **Translate; do not add a second styling layer.**

Every value here clears WCAG AA (4.5:1) against every ground the same theme declares for it.
That is a property of the *set*, so a substituted hex has to be re-measured, not eyeballed.

Every typeface is on Google Fonts. Four are a company's own brand face — Inter, Schibsted
Grotesk, Red Hat, Source Sans. **Plus Jakarta Sans, Poppins and Manrope have no corporate
owner**; they are here because they are among the most widely used faces in current product
work. Do not claim otherwise to a user.

Each theme has a **law** — the part that goes into `.flow/PROJECT.md` § Design standard, and
the part that keeps the theme alive after the next five screens. A palette with no law decays
into the project's old palette within a month.

**Every theme ships positive / warning / negative and nothing else.** Projects routinely also
use *info* and *disabled*. Neither is invented here, because guessing two more hues per theme
does more damage than the gap does. Instead: the survey lists them, stage 2 reports them as a
gap, and they are resolved with the user — usually by deriving info from the accent and
disabled from `--dim`, recorded in the law.

---

## Aurora — the only one with both modes

**Type** Inter (Figma, Mozilla) · 400 500 600 700 800
**Law** Depth comes from surface levels, never from glow. Every elevation is one of the four
surface tokens; no component invents a shadow.
**Radius** card 12 · button 9 · tag 7
**Best for** a product surface that has to look considered in a screenshot.

```css
:root {                 /* light — a translation, not an inversion */
  --bg:#f7f8fc; --surf:#ffffff; --surf2:#f1f3f9; --surf3:#e8ebf5; --line:#e3e6f0;
  --ink:#12131a; --dim:#5f6478;
  --acc:#4f5bd5; --acc-ink:#ffffff; --acc-soft:#eceefb;
  --pos:#0c7853; --warn:#8a5f00; --neg:#c0374a;
}
:root[data-theme="dark"] {
  --bg:#0a0b10; --surf:#12141c; --surf2:#1a1e2a; --surf3:#282d3d; --line:#232735;
  --ink:#e8eaf2; --dim:#8f94a9;
  --acc:#7c8cff; --acc-ink:#0a0b10; --acc-soft:rgba(124,140,255,.13); --acc2:#4de0c0;
  --pos:#3ecf8e; --warn:#ffc35c; --neg:#ff6b81;
}
```

The four surfaces are the page, the card, a hover or recessed tint, and the strongest tint
(selected segment, active nav). Use the project's own dark-mode mechanism rather than this
selector — a class, a `data-` attribute, a media query — whatever the survey found.

The indigo **darkens** for light mode; the same value would not hold contrast on white. The
mint `--acc2` is **dropped entirely** in light mode — it goes sickly on a light ground. That is
what "translation, not inversion" means concretely, and it is the work most dark-first products
skip.

**Conflict to expect:** a project with a half-finished dark mode. Aurora is the only theme that
needs both modes complete, so partial coverage becomes work, not a footnote.

---

## Nordic

**Type** Plus Jakarta Sans · 400 500 600 700 800
**Law** Blue is never a status and green is never a button. Semantic colour and brand colour
never trade places.
**Radius** card 12 · button 9 · tag 6
**Best for** dense tables that fill with real data. The most legible of the seven at volume.

```css
--bg:#f2f5f8; --surf:#ffffff; --surf2:#eef3f7; --line:#dde5ed;
--ink:#111c26; --dim:#5d6f80;
--acc:#1d66d8; --acc-ink:#ffffff; --acc-soft:#e8f1fe;
--pos:#0f7b52; --warn:#8a5a00; --neg:#b23c2e;
```

The accent is `#1d66d8` and not the brighter `#1f6feb` because the brighter value only clears
AA on pure white — it fails on Nordic's own page ground, row tint and soft fill, which is
exactly where link text sits.

---

## Signal

**Type** Poppins · 400 500 600 700
**Law** One accent carries every interactive element; nothing else is violet. Fully rounded —
the radius is the identity, not decoration.
**Radius** card 18 · button 999 · tag 999 · nav 999
**Best for** a surface people choose to use. Fits roughly 20% fewer rows than Nordic — do not
pick it for an all-day console.

```css
--bg:#ffffff; --surf:#ffffff; --surf2:#f4f4f8; --line:#ececf1;
--ink:#0d0d14; --dim:#6a6a7c;
--acc:#5b2be0; --acc-ink:#ffffff; --acc-soft:#f0eafe;
--pos:#007a51; --warn:#946000; --neg:#ca2949;
```

**Conflict to expect:** page and card are the same white, so Signal has no card-on-page
contrast to inherit. A project that separates cards by background alone rather than by border
or radius will go flat.

---

## Meridian

**Type** Manrope · 400 500 600 700 800
**Law** Weight carries hierarchy, not colour. Figures are extrabold with tight tracking; the
accent stays out of the data.
**Radius** card 14 · button 11 · tag 8
**Best for** a redesign nobody asked for. Modern without committing to a personality, which is
what makes it survive a room of stakeholders.

```css
--bg:#f8f7fb; --surf:#ffffff; --surf2:#efecf7; --line:#e6e3f0;
--ink:#17141f; --dim:#6b6580;
--acc:#6a48f9; --acc-ink:#ffffff; --acc-soft:#f0ecff;
--pos:#117a58; --warn:#8a6100; --neg:#bf3a51;
```

Set figures at 800 with `letter-spacing:-0.045em` and `tabular-nums`. That treatment *is* the
theme; applied at 600 it becomes a generic light dashboard.

---

## Basalt — the brand colour is the page

**Type** Schibsted Grotesk (the Nordic media group) · 400 500 600 700 800
**Law** The saturated field is the ground, not a rail or a band. **Each register's action is the
other register's surface** — on the field the primary action is a paper plane, on paper it is a
field-coloured fill. Nothing else is coloured.
**Radius** panel 10 · button 8 · tag 6
**Best for** making a product look like itself at a glance. The biggest swing of the seven.

```css
/* field — the page itself */
--field:#0d2e2b; --field-ink:#eaf2ef; --field-dim:#8faea8; --field-line:#1c4640;
--field-pos:#6fd6ae; --field-warn:#f0c47a; --field-neg:#ff9b8f;

/* paper — content planes sitting on the field */
--paper:#f5f3ee; --ink:#14201e; --dim:#5f6f6c; --line:#e3dfd7;
--paper-acc:#0d2e2b; --paper-acc-ink:#f5f3ee;   /* the action colour ON paper */
--pos:#0e7357; --warn:#8a5a00; --neg:#b0392c;
```

Two reading registers on one screen: figures sit unboxed **on the field**, tables sit **on
paper**. Both registers carry a full semantic set, because a green that works on paper
disappears on the field — **never reuse one set for both.**

`--paper-acc` exists because "white is the strongest mark" is only true on the field. Inside a
paper panel a white button is invisible, so the action there is the field colour, which keeps
the law intact instead of importing an unrelated accent.

**Conflict to expect:** most component libraries assume a white page, and Basalt's shell is not
white. Check this in stage 2 before promising it — it is the likeliest BLOCKER of the seven.

---

## Ember — the warm dark

**Type** Red Hat Display (headings, figures) + Red Hat Text (body) · Display 500 700, Text 400 500 700
**Law** Gold means "you can act on this" and nothing else. **Pending has no colour** — it is a
hollow outline. There is no warning hue in this theme, by design.
**Radius** card 10 · button 8 · tag 7
**Best for** the counterpart to Aurora, on a project that has no amber warning to give up.

```css
--bg:#14100d; --surf:#201a15; --surf2:#2b221a; --line:#3a3128;
--ink:#f3ebe1; --dim:#aca093;
--acc:#d9a441; --acc-ink:#19120a;
--pos:#4fc08d; --neg:#f0655c;
/* no --warn by design: pending is an outline, not a colour */
```

Three surface levels plus a hairline do all the separating; **the cards have no borders.** The
ground is warm brown-black, not Aurora's cool navy-black — nudge the hue and keep everything
else and you have built tinted Aurora, not Ember.

**Conflict to expect, and it is the common one:** amber-gold is the near-universal warning
colour. Any project whose warning is amber has a direct MAJOR collision — after the migration
its warnings read as buttons and its buttons read as warnings. Report it in stage 2 explicitly.
Resolving it means the project's warning takes a form instead of a hue (an outline, an icon, a
weight), or Ember is the wrong theme here. **Do not quietly add amber back**; that deletes the
only law Ember has.

---

## Relief — depth means something

**Type** Source Sans 3 (Adobe) · 400 600 700
**Law** **Raised means you can press it; recessed means read it.** No borders anywhere. Only
the primary button, the active nav item, the selected segment and the hovered row are lifted.
**Radius** panel 10 · button 9 · tag 6
**Best for** a soft, tactile surface where affordance should be obvious without a border.

```css
--bg:#eeebe6; --well:#e3dfd8; --rise:#ffffff;
--ink:#1b1a17; --dim:#67625a;
--acc:#0e5f73; --acc-ink:#ffffff;
--pos:#1c703f; --warn:#875800; --neg:#b0392c;

--shadow-well: inset 0 1px 3px rgba(27,26,23,.11), inset 0 0 0 1px rgba(27,26,23,.03);
--shadow-rise: 0 1px 2px rgba(27,26,23,.12), 0 3px 8px -4px rgba(27,26,23,.2);
```

Every foreground is measured against `--well`, not against `--bg` — Relief's law puts the
*reading* content on the recessed surface, so that is the ground that governs, and it is the
darkest of the three.

The accent is petrol so that **green is free to mean positive** — state that inversion
explicitly in the law.

The law is falsifiable, which is the point: **if a panel you cannot click is floating, the
theme is being applied wrong.** Check that during the UI audit, not by taste. Applied
carelessly it degrades into an ordinary soft-shadow dashboard and loses everything that made it
worth picking.

---

## Adding a counterpart mode

Only Aurora ships both. Adding the other mode to any of the rest is **its own phase**, framed
and shipped separately, and it is a translation:

1. Re-pick the accent for the new ground — an accent tuned for a dark ground almost never holds
   contrast on white, and vice versa.
2. Drop any secondary accent that goes sickly. Aurora drops its mint. Not every colour has a
   counterpart, and forcing one is how bad light modes happen.
3. Invert the surface *levels*, keeping the hierarchy between them identical.
4. Re-measure every semantic colour against the new ground, including the ones that looked fine.
5. Re-capture every screen.

Never generate the second mode by inverting lightness. That is what produces the bad light mode
every dark-first product ships.

**If the project already has a working dark mode and you are applying a single-mode theme**,
that is a BLOCKER-level structural conflict, and there are only three honest answers: extend
the theme to both modes as a second phase (say what it costs), keep the project's existing dark
palette and apply the theme to light only (say that the two will not match), or pick Aurora.
Deciding it silently is what leaves half the screens unstyled in the dark.

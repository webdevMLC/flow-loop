# Writing it in the reader's language

## The rule that decides whether a translated guide works

**UI labels are never translated.** The screen still says `Submit booking`. A guide telling the
reader to press *Isumite ang booking* describes a product that does not exist, and the reader —
who was already unsure — now cannot find the button.

Keep the label verbatim; put the meaning in parentheses the first time it appears on a page:

```markdown
✅  Pindota ang **Submit booking** (ipadala ang booking).
✅  Ang status mahimong **Pending** (naghulat pa ug approval).

❌  Pindota ang **Isumite ang Booking**.
❌  Ang status mahimong **Naghulat**.
```

The same applies to **error messages**, which are quoted evidence — the reader is matching them
character for character. Translate the explanation, never the quote:

```markdown
| Makita nimo | Kahulugan | Buhata |
|---|---|---|
| **Amount must be greater than zero** | walay gi-enter nga amount | isulat ang value sa booking |
```

**If the interface is localised**, this reverses: the verbatim label is the one that locale
renders, and `references/walk.md` §0 required the walk to happen in that locale so those are
the labels you hold. Check per label, not per product — a half-translated interface is common,
and each label follows whatever is actually on screen.

## Never translate

Labels · error messages · screen and menu names · file names · URLs · field names the user
types into · anything appearing inside a screenshot.

## Register — write it the way people speak it

The formal written register of a language is often *harder* than the spoken one, because it
reaches for coined or academic vocabulary nobody uses at work. A guide in stiff textbook prose
can be less usable than one in the ordinary mixed speech of the workplace, even though it
scores better on paper. Mixed registers — English technical nouns inside a local-language
sentence — are how most people actually talk about software, and writing that way is easier,
not lazier.

**Confirm with a speaker rather than deciding by taste.** Ask which reads better to the actual
audience:

```
A.  Pindota ang **Submit booking**, dayon maghulat ka ug mga 20 segundos.
B.  Iduot ang **Submit booking**, ug maghulat sa gibanabana nga 20 ka segundo.
```

## Numbers, dates, money

Match **what the screen shows**, not what the language would normally do. If the app prints
`08/31/2026` the guide writes `08/31/2026` — the guide exists so the reader can match it. Where
a number appears only in prose and never on screen, use the reader's convention.

## Bilingual layout

Chosen in the §0 batch, because it decides the shape of every file stage 2 writes. Two workable
shapes — pick one and hold it for the whole guide:

**Parallel files** *(default)* — `docs/guide/` and `docs/guide/ceb/`, **same filenames**, same
page order, same images. Two mechanics that are easy to get wrong:

- **Images live once, in `docs/guide/images/`, and translated pages reach up to them:**
  `![Ang Bookings screen](../images/bookings-list.png)`. A copied `images/` under `ceb/`
  duplicates every binary and drifts the moment one is re-captured.
- **Headings are translated, so they are not identical — filenames are.** Cross-page links use
  the plain filename (`[Idugang ang partner](03-add-a-partner.md)`), which resolves to the
  sibling in the same language directory. Keep the *order* and the *count* of sections
  matching, so a reader switching between them lands in the same place.

**Stacked per step** — both languages interleaved in one file. Fine for a short procedural
guide, poor beyond a few pages, and it doubles the length of every page:

```markdown
3. Choose the partner from the **Partner** list.
   *Pilia ang partner gikan sa **Partner** nga lista.*
```

## Keeping translations honest

The source-language guide is the original. Every translated page carries the version it came
from:

```markdown
<!-- translated from docs/guide/02-submit-a-booking.md @ 2026-09-14 -->
```

When the source changes, that line makes the stale translation visible instead of merely wrong.
A translation nobody can tell is out of date is worse than a missing one — the reader trusts it.

## A translation is a `by person` criterion

It cannot be closed by a test, and a screenshot proves nothing about whether a sentence reads
naturally. Someone who speaks the language reads it before it ships — per
`references/evidence.md` **in the loop skill** — recorded in `.flow/UAT.md` in the format
`references/uat.md` **in the loop skill** specifies:

```markdown
### G3 — the Cebuano guide reads naturally · Phase 31 · open

**Look at:** `docs/guide/ceb/` — start with `02-submit-a-booking.md`

**Question:** does this read like something a person would actually say, and could an
associate who does not read English well follow it without help?

**Yes means:** the criterion closes and the guide can ship in Cebuano.
**No means:** a MAJOR finding — an unnatural guide in the reader's own language is trusted
less than an English one, because it reads as machine output.

**Answer:**
```

**One entry per language, not one per page.** Past five open entries in `.flow/UAT.md` an
unattended run stops and reports (`references/uat.md` **in the loop skill**), and a guide would
otherwise produce dozens. Name the pages to start with inside the single entry.

**If no speaker is available**, ship the source-language guide and hold the translation
unreleased with the criterion open. Do not ship an unreviewed translation as though it were
verified: careful and correct are different claims, and only a reader settles the second. The
loop prepares that question and never answers it.

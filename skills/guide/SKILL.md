---
name: guide
description: Write a user guide for the people who will actually use the system — organised by what they are trying to get done, in plain language, in the language they read, with real screenshots of the running product. Offers a reading level and a target language, including bilingual output, and produces a properly laid-out PDF at normal type sizes rather than renderer defaults. Use when a system is going to real users, when support keeps answering the same question, or when the user asks for documentation, a manual, a handbook, or a walkthrough. Walks the running system; never writes a guide from the source code.
---

# Guide

A user guide is a claim about how the system behaves, written for someone who does not know how
it was built and does not want to. It is not the code documented, and it is not the feature
list in shorter words.

| Stage | Asks | Writes |
|---|---|---|
| **1 Walk** | who uses this, and what are they trying to get done? | `.flow/guide-walk.md` + captures |
| **2 Draft** | the guide, job by job, at the agreed level | `docs/guide/` |
| **3 Translate** | the same guide in the reader's language | `docs/guide/<lang>/` |
| **4 Produce** | how it looks on a page | a PDF per language directory |

**Stage 1 is destructive and not cheaply repeatable** — it seeds data, breaks things on
purpose, and captures a system that then moves on. So it has to know everything that will be
asked of it *before* it starts. That is what `references/walk.md` §0 is for; read it first.

## At FRAME, name the evidence classes

This is loop work: FRAME it as a phase, triage it Full, let CHECK and SHIP run. But the classes
are decided when the criteria are *written*, not when you try to close them:

- The pages, the captures they cite, and **rendered images of the PDF pages**, close
  **`by artifact`**.
- Whether a reader can do the job from it, and whether a translation reads naturally, close
  **`by person`** — prepared as a `.flow/UAT.md` entry per `references/uat.md` **in the loop
  skill**. One entry per language, not one per page.
- **Never `by test`.** `references/evidence.md` **in the loop skill** puts documentation and
  copy outside that class entirely: a link checker is not a reader.

A guide phase's diff is `.md`, `.png`, a print stylesheet and a generated PDF, so **CHECK's
machine stage goes green for free** — that green is about code this phase never touched. No
screen is modified either, so `references/uiaudit.md` **in the loop skill** does not fire; the
pages are the artifact instead. If stage 4 needs a render script, **put it in `scripts/`**,
which the TDD gate exempts — a `.mjs` build script anywhere else is a guarded file and the gate
will deny it.

## Before anything else

Six phrasings will arrive ahead of these instructions. Refuse each by name:

**"Write a user guide" does not mean describe the features.** A menu is arranged the way the
system was built; a guide is arranged the way a person's day runs — "Get paid for a booking",
not "Commission Module". If the contents read like the navigation menu, check whether that is
because the app is genuinely task-shaped or because you copied it. Usually the second.

**"In layman's terms" does not mean simpler words for the same ideas.** It means *removing*
ideas the reader does not need. "The system uses optimistic locking, so your edit may be
rejected" does not improve by simplifying its vocabulary; it improves by becoming "if someone
else saved first, you will be asked to try again."

**"Detailed" does not mean more words.** It means more concrete: the actual label, the actual
wait, the actual number that appears, what happens next.

**"Add a screenshot" does not mean writing `![...](images/x.png)`.** That is the failing move,
and it is easy because the markdown costs nothing and the file is never checked. **Never write
an image link for a file you did not capture.** If nothing here can produce captures, say so in
stage 1 and stop — a guide of broken-image icons is worse than a guide with none.

**"Translate it" does not mean translating the buttons.** The screen still says `Submit
booking`. UI labels stay verbatim in whatever language the interface actually renders, with the
meaning in parentheses. Fully covered in `references/language.md`.

**"Make it a PDF" does not mean `pandoc guide.md -o guide.pdf`, or the browser's Print.** Both
succeed and both produce the wrong document, in different ways: Print gives a **24pt H1** (`2em`
of a 16px body is 32px) on US Letter; pandoc's LaTeX path gives a nearly-right heading on Letter
with 1-inch margins and images placed at pixel size. Either way steps tear from their pictures.
**The defaults are the failure and repeating them does not help — only a print stylesheet does.**
And the renderer defaults are a second trap: `page.pdf()` in Puppeteer and Playwright ignores
`@page` entirely unless you pass `preferCSSPageSize: true`. `references/layout.md` carries both.

**Never write a step you did not walk.** A guide assembled from source documents what the
developer built, including the screens that do not work.

## A disposable environment, always

Stage 1 does three things that write or break: it **seeds** demo records, it **triggers
failures on purpose**, and it **captures screens**. All three need a throwaway environment.

**Never seed, never break, and never capture on production or any shared staging.** If the only
reachable system is production, stop and say so — the walk needs a disposable environment, the
way `/flow:ultra` does. Redaction is not a way round it: you cannot redact before a capture
without editing the data itself, and a crop still leaves the tab title, the tooltip, the row id
and the next page. Guide images are committed and ship to users; a screenshot that leaked a
customer list cannot be un-shipped.

## Ask before starting — one batch

Loop guard 7 allows one question batch per gate, and stage 1 cannot be cheaply re-run, so ask
all of it now. **A standing autonomous mode does not cover these**: they are not assumptions
that can be recorded and corrected later, because a guide written for the wrong reader in the
wrong language is not repairable by editing.

| | Options | Default |
|---|---|---|
| **Audience** | one guide per role, or one covering all | ask — an admin guide and a field-staff guide are different books |
| **Language** | interface language · reader's language with labels kept · bilingual side by side · separate book per language | ask |
| **Reading level** | Simple (may be new to computers) · Plain (anyone) · Working (knows the job, not the software) | Plain |
| **Devices** | desktop · mobile · both | ask — it sets the capture width **and density, both fixed at `walk.md` §0 and not changeable later** |
| **Access** | credentials for every role, and the disposable environment to use | ask — there is no later slot |

## The four stages

**1. Walk** — `references/walk.md`. Sign in as each role, do the real jobs end to end, break
things on purpose, capture as you go, and write the record to `.flow/guide-walk.md`. Stages 2
and 3 read that file, not your memory of the walk.

If the system **cannot be started at all**, stop before drafting — that is `/flow:ultra`'s job,
not this one. If a single role or flow cannot be reached, that is different: record it, scope
the guide to what you walked, and name the gap in the guide itself.

**2. Draft** — `references/writing.md`. Output goes in `docs/guide/` — it is a deliverable for
users and belongs where they can get it, not in `.flow/`.

**3. Translate** — `references/language.md`. Read it whenever any language decision was made,
which includes writing in the interface's own language when that interface is localised. Skip
it only for a single-language guide matching an interface you already walked in that language.

**4. Produce** — `references/layout.md`. The markdown is the source of truth; **the PDF is
generated from it and never hand-maintained.** It runs **once per language directory** —
`docs/guide/` and every `docs/guide/<lang>/`. Body **10.5pt**, page title **18pt**, nothing on
the page more than about twice the body size. One left edge for text, headings, screenshots and
tables. A step never splits from its screenshot, and the error table's header repeats on every
page. Screenshots captured at 2× and placed at half size, cropped, hairline-bordered, and every
capture of the same kind at the same width.

Then **open the rendered PDF and page through it.** That is the step that catches all of the
above and the one that gets skipped because the build succeeded.

## Size it, and say so

One page per job, times roles that each get a book, times a translated copy of every page. That
multiplies fast, so size it before drafting and say which shape you are doing:

- **Under ~10 job pages** — one phase.
- **10 to ~30** — walk once, then one phase per role or per section.
- **Above that, or more than two languages** — walk, then draft **one job page and show it**
  before writing the rest. A structure agreed from a description gets agreed twice.

## Updating a guide that exists

If `docs/guide/` is already there, this is not a rewrite. Read it first, walk only the jobs
whose screens or labels changed, and touch only those pages — then check every translated copy
for the source version line described in `references/language.md`. A guide silently regenerated
loses the corrections real readers caused, which are the most valuable lines in it.

## Register it so it stays true

Add to `.flow/PROJECT.md`, so later phases know it exists and that changing a label is now also
a documentation change:

```markdown
## User guide
docs/guide/ — associate and team-lead roles, Plain level, English + Cebuano (docs/guide/ceb/).
Changing a UI label, an error message, or a step order means updating the matching job page.
```

Without that line nothing ever maintains it, and a stale guide is trusted until it is caught.

## Never

- **Never seed, break, or capture on production or shared staging.**
- **Never write an image link for a capture you did not take.**
- **Never write a step you did not walk.** If it could not be reached, say so in the guide.
- **Never translate a UI label or an error message.** Verbatim, meaning in parentheses.
- **Never ship a guide with no error page.** The happy path is the half nobody needs help with.
- **Never close the reader test yourself.** It is `by person`; the loop prepares it and a
  person answers it.
- **Never hand over a PDF you did not open.** A PDF that renders is not a PDF that works — the
  same class of mistake as an image link for a capture nobody took.
- **Never edit the PDF.** It is generated; edit the markdown and regenerate, or the two
  disagree and the reader has the wrong one.
- **Never fix a layout problem by shrinking the type.** A table that will not fit at 9.5pt has
  too many columns for a page.
- **Never explain the architecture.** Nobody reading this chose to care how it works.

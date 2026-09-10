# Producing the document

The markdown in `docs/guide/` is the source of truth. **The PDF is generated from it and never
hand-maintained** — the moment someone edits the PDF, the two disagree and the reader has the
wrong one.

**One PDF per language directory**: `docs/guide/` and every `docs/guide/<lang>/`. A translated
guide with no PDF leaves the reader stage 3 exists for holding the untranslated one.

## The defaults are the failure

Neither obvious route produces a usable document:

**The browser's own Print** gives an H1 of 32px — 24pt, more than twice the body — screenshots
scaled to whatever `max-width: 100%` resolves to, and steps torn from their pictures.

**`pandoc in.md -o out.pdf`** takes a LaTeX path with no 16px body at all: an `article` H1 lands
near 17pt, which is nearly right, but the page is US Letter with 1-inch margins, images are
placed at their pixel size with no fitting, and `longtable` splits a step's screenshot from its
step without repeating anything useful.

Different failures, same cause: **no print stylesheet.** Trying either again does not help.

## Typography

Body **10.5pt**. Nothing on the page exceeds about twice it.

| | Size | Notes |
|---|---|---|
| Page title (H1) | **18pt** | once per page, semibold |
| Section (H2) | **13pt** | |
| Sub-section (H3) | **11.5pt** | |
| Body and step text | **10.5pt** | line-height 1.5 |
| Table | **9.5pt** | |
| Code, literal strings | **9.5pt** | monospace — backticked text only |
| UI labels | **10.5pt** | **bold, body face** — `writing.md` sets them; never restyle here |
| Figure caption | **9pt** | only where the converter emits `<figcaption>` |

At **Simple** reading level, body **11.5pt** and table **10.5pt** — and nothing else. Larger
type for a first-time reader is legitimate; larger headings are not.

## The page, and the measure

**A4, margins 22mm top and bottom, 38mm left and right.** That is what a 65–75 character
measure costs at 10.5pt: a **134mm** text column, about 72 characters. A full-width line inside
20mm margins is 170mm and about 95 characters — past where the eye reliably finds the next line.

Do not set `max-width` on `body` to hold the measure. The margin does it, and a `max-width`
inside a full-width page box leaves the column hugging the left edge with dead paper on the
right.

## Alignment

**Everything shares one left edge** — text, headings, screenshots, tables. A screenshot
narrower than the measure sits flush left, never centred.

**Screenshots inside a numbered step align to the step's text**, not to the number.

**Same class, same width — by rule, not by eye.** Two classes only, sized here and framed at
`references/walk.md` §0:

| Class | Printed width | Needs at least |
|---|---|---|
| `.shot-full` | **134mm** (the measure) | 1020px |
| `.shot-detail` | **80mm** | 610px |

Those pixel minimums are 192 DPI at the printed width, which is why §0 captures at 2×. A 2880px
full-screen file and a 960px detail file clear both comfortably.

## Page discipline

| Rule | Why |
|---|---|
| A step and its screenshot never split | the reader loses the thread exactly where they needed it |
| A heading never sits alone at the foot of a page | keep two lines with it |
| The error table's header repeats on every page | else page 2 is three unlabelled columns |
| Each job page starts on a new page | a guide is read by jumping to a task |

## The PDF stays text

**Never assemble a PDF from page images to force a layout.** The text must stay selectable and
searchable, and the alt text `references/writing.md` requires has to survive. Emit a tagged PDF
where the tool allows — Puppeteer/Playwright `tagged: true`, weasyprint `--pdf-ua`.

## Producing it

**First, markdown to HTML — and the HTML goes inside the guide directory.**

Every image link is relative: `writing.md` emits `images/x.png`, and `language.md` emits
`../images/x.png` from a translated page. Those resolve **only** from `docs/guide/` and
`docs/guide/<lang>/`. Write the combined HTML to `docs/guide/_print.html` (and
`docs/guide/<lang>/_print.html`), never to a scratchpad or the repo root — put it anywhere else
and every screenshot renders as a blank gap while the renderer exits 0.

Concatenate the pages in the order `README.md` lists them, with the stylesheet inline. Any
markdown converter the project already has will do; none needs adding.

**Then render.** The renderer defaults are the trap:

- **`weasyprint docs/guide/_print.html docs/guide/guide.pdf`** — honours `@page` as written,
  no flags needed. **Prefer it.**
- **Puppeteer / Playwright**: `await page.pdf({ path, preferCSSPageSize: true, printBackground: true })`.
  **Without `preferCSSPageSize: true` you get US Letter with zero margins** — `page.pdf()`
  defaults to Letter and `margin: 0` and ignores `@page` entirely, so the stylesheet below does
  nothing about the page. Load the file with `page.goto('file://…/_print.html')` and
  `waitUntil: 'networkidle'` so the images are in.
- **Chrome CLI**: `chrome --headless --print-to-pdf=out.pdf --no-pdf-header-footer` — without
  the second flag every page carries the `file://` URL and the date.

Check what the project already has before choosing; do not add a dependency for a document. **If
nothing can render, ship the markdown and the HTML, and say what would install it** — never
hand over a PDF nobody looked at.

If a render script is needed it goes in **`scripts/`**, which the TDD gate exempts. A `.mjs`
build script anywhere else is a guarded file and the gate will deny it.

```css
@page { size: A4; margin: 22mm 38mm; }
body { font-size: 10.5pt; /* Simple level: 11.5pt */ line-height: 1.5; }
h1 { font-size: 18pt; font-weight: 600; break-before: page; break-after: avoid; }
h1:first-of-type { break-before: auto; }          /* no blank leading page */
h2 { font-size: 13pt; break-after: avoid; }
h3 { font-size: 11.5pt; break-after: avoid; }
table { font-size: 9.5pt; /* Simple: 10.5pt */ table-layout: fixed; width: 100%; }
thead { display: table-header-group; }
td { overflow-wrap: anywhere; }                    /* URLs and field names overflow the cell */
code { font-size: 9.5pt; }
li, figure { break-inside: avoid; }
li img { margin-left: 0; }                         /* aligns to the step text, not the number */
img { border: 1px solid #dcdcdc; }
img.shot-full   { width: 134mm; }
img.shot-detail { width: 80mm; }
```

`break-inside: avoid` on `li` keeps a step with its picture. It does not fight a long job page,
because the page breaks *between* list items.

## Look at it — visually

**You cannot check a PDF by extracting its text.** Every check here is visual: heading size,
margin, image width, whether a step split. Render the PDF's pages to images and look at them —
`pdftoppm -png -r 80 guide.pdf page`, or the same headless browser at the file URL. That is
also what makes this criterion closable: those page images are the artifact.

Check, in this order:

- **the page really is A4 and the margins really are 22/38mm** — measure one, because "no
  screenshot crosses a margin" passes trivially when there is no margin
- no heading is more than about twice the body
- the body size matches the reading level from §0
- **every screenshot is present** — a missing image is a blank gap, not an error
- every capture of the same class is the same width
- no step is separated from its picture
- the error table's header repeats
- the page count is plausible for the content

Then record the tool and the command that produced it, so the next person regenerates rather
than edits.

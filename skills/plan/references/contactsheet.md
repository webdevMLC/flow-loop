# The contact sheet — the whole product on one image

Every screen, in device frames, on a single numbered board. It is the image the owner actually
looks at first, and it answers a question no individual capture can: **do these screens belong
to the same product?**

Twenty screens reviewed one at a time all look fine. Seen together, the four different empty
states, the three header treatments and the two navigation patterns are obvious in a second.
Seeing them as a set is the point; the per-screen captures are for reading detail afterwards.

## What it is

One image, `overview.png`, beside the individual captures in the same directory. Also written
as `overview.html`, which is what gets rendered — keep it, so a screen can be re-rendered
without rebuilding the board.

```
.flow/plan/screens/overview.png          ← the board
.flow/plan/screens/overview.html         ← what rendered it
.flow/plan/screens/today.png             ← the individual captures
.flow/plan/screens/today-mobile.png
```

`/flow:uiux` writes the same pair under `.flow/uiux/<date>/screens/`, and its board is
**two-up** — the current screen beside its redesign, in the same cell — so the change is the
thing you see.

## The composition

**A header**: the product name, a one-line description of what it is, and the three or four
words for what this board shows ("Plan · Collaborate · Track · Deliver"). Small. It orients;
it is not a title slide.

**The grid**: five phones per row on desktop width, each in a plain device frame with a status
bar. Mobile screens are the case this exists for — a phone is small enough that twenty fit on
one board legibly, which is exactly why reviewing them one at a time hides so much.

**Every cell is numbered and captioned.** The number is how the owner refers to it — *"number
7 is wrong"* is a usable sentence, "the task detail screen" is ambiguous when there are three.
The caption is the screen's name and one line on what it is for:

```
6. Tasks (List View)
   Manage and track project tasks
```

**Order by journey, not by menu.** Splash, sign-in, home, then the main objects, then the
secondary surfaces, then create/settings. Someone reading the board top-left to bottom-right
should be walking through the product the way a new user meets it.

**A closing cell**, where the grid has a gap: one sentence on what the product is for. It
fills the hole and gives the board an ending rather than a ragged edge.

## The rules that keep it honest

**Every cell is a real render.** The board is assembled from the same captures that sit beside
it — never redrawn, never idealised, never a screen that does not exist. A contact sheet
showing a screen the plan does not deliver is the most convincing lie this command could tell.

**Real content in every frame.** The same realistic names, amounts and dates as the individual
screens. A board of placeholder rows looks tidy and proves nothing.

**Include the empty states.** They are most of what a new user sees, and on a board they are
the cells that expose an inconsistent voice fastest.

**Legible at the size it will be read.** The owner opens this on a laptop or a phone. If a
caption cannot be read at 1000px wide, the board is too dense — split it into two.

**Never crop a screen to make it fit.** If a screen is too tall, show it at the top and say so
in the caption. A cropped cell hides exactly the part nobody reviewed.

## Rendering it

The HTML is a plain CSS grid of frames, each `<img src="<slug>.png">` with its caption. Render
it at a wide viewport and capture the full page — the same browser tool that took the screen
captures, with `deviceScaleFactor: 2` so the text stays sharp.

Keep the paths **relative** inside `overview.html`, so the directory can be moved or zipped
and still open.

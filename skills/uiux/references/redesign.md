# The redesign — wireframed, shown, then applied

The critique says what is wrong. This says what each screen becomes, in a form the owner can
review in ten minutes and correct in one sentence. Nothing is applied until they have.

## Group the screens by cause, not by menu

The architect's verdict named three to five causes. Each cause is a screen group: every
screen the fix touches, redesigned together so they agree. "The navigation" is one group.
"Every list's empty state" is one group even though it spans twelve screens. A screen can be
in two groups; a group is never one screen unless the cause is.

Order the groups by how many findings each resolves per screen touched. The first group is
the one the owner will notice most.

## One wireframe per screen, in every state

The same discipline as `references/artifact.md` **in the plan skill**: grey boxes, real
labels, a single system font, no colour except where colour *is* the finding. Each screen:

- **After**, at desktop and 375px
- **Before** beside it — the actual capture from stage 1, so the change is visible
- **The states**: at minimum the empty state and the error state, because those are the ones
  the critique most often failed
- **The rationale** — one paragraph, naming the finding ids this wireframe resolves and the
  person's experience that changes. Not "cleaner" or "more modern": *"the organiser now sees
  the tournament they created without leaving the form (resolves IA-3, ST-1)"*

Keep them grey on purpose. The moment a wireframe carries a palette, the owner reviews the
look instead of the structure, and the look is `/flow:theme`'s job.

## What the wireframe may not do

- **Add a pattern the job does not need.** A dashboard of KPI tiles on a screen whose job is
  one form. A hero. A carousel. If the critique did not find it missing, the redesign does
  not add it.
- **Remove something the owner uses** without a decision. Every removal is either a finding
  the owner has seen or a question in the batch.
- **Change the vocabulary silently.** Renaming "Reconciliation" to "Close the month" is a
  content finding with a decision attached, not a wireframe detail.
- **Design for data that does not exist.** Wireframes carry the real demo data the captures
  showed, at the real volumes — a list wireframed with three tidy rows lies about a list that
  holds four hundred.

## The artifact

One page, published the way `/flow:plan` publishes — or `.flow/uiux/index.html` where no
artifact tool exists. In order:

1. **The verdict** — the causes, one paragraph each
2. **What is kept** — named, so the owner knows the redesign is not a rewrite
3. **The groups**, each with its wireframes before/after and rationale
4. **The decisions** — every shape change as a choice with its consequence
5. **What this does not touch** — screens the critique cleared, and why

Then, in the message: the link, and the question batch. **The decisions stop and ask even
under autonomous mode.** A restructured navigation is not an assumption.

## Apply, through the loop

Each screen group is a phase. FRAME it against the redesign artifact and the project skill —
every criterion cites the wireframe it implements and the finding it resolves. BUILD under
the TDD gate, with the theme's components if a theme is confirmed. CHECK's screen audit
captures the result at both widths and compares it against the wireframe; the capture closes
the criterion `by artifact`.

**If the project has no confirmed theme, `/flow:theme` runs before the first apply phase.**
Applying a redesign in the old visual layer means doing the component work twice.

## The report

`.flow/UIUX-<date>.md`, sealed before the first apply phase: the verdict, every finding with
its severity and a status line (`open` / `fixed · phase N` / `wont-fix · <who decided>`), the
groups and their phases, and what was kept. The roadmap sweep reads it; a group left
unapplied stays visible.

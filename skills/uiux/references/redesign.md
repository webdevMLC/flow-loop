# The redesign — designed, captured, shown, then applied

The critique says what is wrong. This says what each screen becomes, in a form the owner can
review in ten minutes and correct in one sentence. Nothing is applied until they have.

## Group the screens by cause, not by menu

The architect's verdict named three to five causes. Each cause is a screen group: every
screen the fix touches, redesigned together so they agree. "The navigation" is one group.
"Every list's empty state" is one group even though it spans twelve screens. A screen can be
in two groups; a group is never one screen unless the cause is.

Order the groups by how many findings each resolves per screen touched. The first group is
the one the owner will notice most.

## Every screen designed and captured as an image, in every state

The same discipline as `references/artifact.md` **in the plan skill**: the screen **as it
will ship** — the project's confirmed theme applied, or one chosen from the seven in
`references/themes.md` **in the theme skill** and named as a decision; real components; the
real demo data the stage-1 captures showed. Not a wireframe. The owner is deciding whether to
rebuild forty screens, and grey boxes cannot carry that decision — "does this look obsolete"
is the question that started the audit, and only a designed screen can answer it.

Write each redesigned screen as a standalone page under `.flow/uiux/<date>/screens/`, render
it, and **capture a PNG**. Each screen:

- **After**, captured at desktop and 375px — `<slug>.png`, `<slug>-mobile.png`
- **Before** beside it — the actual capture from stage 1, so the change is visible
- **The states**: at minimum the empty state and the error state, each its own capture,
  because those are the ones the critique most often failed
- **The rationale** — one paragraph, naming the finding ids this screen resolves and the
  person's experience that changes. Not "cleaner" or "more modern": *"the organiser now sees
  the tournament they created without leaving the form (resolves IA-3, ST-1)"*

**Then write `.flow/uiux/pending`** containing the `<date>` directory name. From that moment
the plan gate denies every source write until the owner has looked at the captures and
confirmed them — the confirm command is printed at the bottom of the artifact, the same way
PLAN's is. That is what "show the owner first" means: a mechanism, not a promise.

## What the redesign may not do

- **Add a pattern the job does not need.** A dashboard of KPI tiles on a screen whose job is
  one form. A hero. A carousel. If the critique did not find it missing, the redesign does
  not add it.
- **Remove something the owner uses** without a decision. Every removal is either a finding
  the owner has seen or a question in the batch.
- **Change the vocabulary silently.** Renaming "Reconciliation" to "Close the month" is a
  content finding with a decision attached, not a design detail.
- **Design for data that does not exist.** The screens carry the real demo data the captures
  showed, at the real volumes — a list designed with three tidy rows lies about a list that
  holds four hundred.
- **Invent a visual identity.** Apply the theme; do not iterate on one. The moment the
  redesign is about a palette, it has stopped being about the findings.

## The artifact

One page, published the way `/flow:plan` publishes — or `.flow/uiux/index.html` where no
artifact tool exists. In order:

1. **The verdict** — the causes, one paragraph each
2. **What is kept** — named, so the owner knows the redesign is not a rewrite
3. **The groups**, each with its captures before/after and rationale
4. **The decisions** — every shape change as a choice with its consequence
5. **What this does not touch** — screens the critique cleared, and why
6. **The confirm command**, with the hash of the captures, at the bottom

Then, in the message: the link, and the question batch. **The decisions stop and ask even
under autonomous mode.** A restructured navigation is not an assumption.

## Apply, through the loop

Each screen group is a phase. FRAME it against the redesign artifact and the project skill —
every criterion cites the capture it implements — by path, `by artifact` — and the finding
it resolves. BUILD under the TDD gate, with the theme's components if a theme is confirmed.
CHECK's screen audit captures the result at both widths and compares it against the redesign
capture; the new capture closes the criterion `by artifact`, and the evidence gate refuses
the commit if it is not there. **Remove `.flow/uiux/pending` only after the owner has
confirmed** — it is what holds the gate closed.

**If the project has no confirmed theme, `/flow:theme` runs before the first apply phase.**
Applying a redesign in the old visual layer means doing the component work twice.

## The report

`.flow/UIUX-<date>.md`, sealed before the first apply phase: the verdict, every finding with
its severity and a status line (`open` / `fixed · phase N` / `wont-fix · <who decided>`), the
groups and their phases, and what was kept. The roadmap sweep reads it; a group left
unapplied stays visible.

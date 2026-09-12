# The seven checks

Each one has a mechanical part — something on disk, checkable without judgement — and, for
some, a part that has to be run. Do the mechanical part first: it is seconds, and it usually
settles the verdict before anything expensive starts.

## 1 — The plan is confirmed, and the product still matches it

Mechanically: `.flow/plan-confirmed` exists and resolves against the project skill and the
plan captures. A stale confirmation means the plan changed after the owner approved it, and
nobody re-approved.

Then the part that matters: **every process flow the project skill names, driven end to end.**
Not the tests — the product, through its own surfaces, on a disposable copy. A flow the skill
names that cannot be driven is the single most important thing this command can find, because
it means the thing the owner asked for is not there. That is how a project reaches twenty
green phases with a board that says "no leads yet".

## 2 — The roadmap is empty

Run the six-place sweep in `references/exhausted.md` **in the loop skill**. It looks in the
roadmap, the state file's deviations, the UAT queue, the findings nobody acted on, the
milestone list, and the assessment reports.

"Nothing left" means **nothing unblocked**. Candidates blocked on the owner are reported, not
counted as done — a project waiting on three decisions is not finished, it is waiting.

## 3 — Every criterion is closed by the evidence its class demands

Across the current phase and `.flow/ARCHIVE.md`:

- **No unticked criterion** anywhere — `- [ ]` in a criteria section is an open criterion no
  matter how old the phase is.
- **Every `by artifact` criterion's file is on disk.** The commit gate enforces this per
  commit; here it is checked across the whole project, because a capture deleted later leaves
  a criterion closed against nothing.
- **Every `by test` criterion's test still exists and passes.** Run the full suite here — this
  is the one place the whole suite belongs, and it is why CHECK no longer runs it per phase.

A criterion whose evidence has gone missing counts as open, not as closed-in-the-past.

## 4 — Nothing is waiting on the owner

No entry in `.flow/UAT.md` that is `open` and classed `owner` — `references/uat.md` **in the
loop skill** has the classes. A `judgement` entry the loop answered is closed and does not
count; an unclassified entry reads as `owner` and does.

Report the count and the headings. Four open questions is an afternoon; the owner just needs
to know they are the last thing standing.

## 5 — The product's flows work end to end

The SHIP data pass, over the whole product rather than one phase: drive each core job the
project skill names, through the UI or the endpoint, against a disposable database seeded with
invented data, and **read the rows back**. Values against the authority, not just row counts.

Never against production. Never by calling the writer directly — the point is that a person
pressing the button produces the row.

If there is no way to drive a flow, that is UNKNOWN for this check and it is reported as such.
An undriveable flow is not a passing flow.

## 6 — The assessments have run, and nothing is open

| Report | From | What it proves |
|---|---|---|
| `.flow/ULTRA-*.md` | `/flow:ultra` | the system as built, inspected and repaired |
| `.flow/DATATEST-*.md` | `/flow:datatest` | the data survives boundary, duplicate, concurrency, money |
| `.flow/SECURITY-*.md` | `/flow:security` | the holes were found by someone trying, and closed |
| `.flow/UIUX-*.md` | `/flow:uiux` | the screens were judged against practice, not taste |
| `.flow/OPS-*.md` | `/flow:ops` | it can be run, watched, rolled back and restored |

For each: **present, and no finding with an open status.** A report older than the last
milestone is stale — say so, and name what changed since.

**A missing report is UNKNOWN.** Not a pass, not a fail. `/flow:uiux` may be genuinely
unnecessary for a service with no screens — say that, with the reason, rather than ticking it.

## 7 — Someone other than the author can run it

From `.flow/OPS-*.md`, four specific things, each of which was done rather than written:

- **the runbook was followed** from a clean shell, and the number of corrections that produced
- **a rollback was performed** and the system verified working afterwards — not the command
  exiting 0, a request succeeding and a row reading correctly
- **a backup was restored** and the rows read, with the restore time and the data-loss window
- **the load limit is known** — the first thing that breaks, and at what point

These are the checks a project most often fails while believing itself finished, because
nothing in the build loop ever asks them. A system nobody can restart at 2am is not ready for
users, however green its suite.

---
name: ready
description: Answer the one question the loop never answers on its own — is this finished, and can it be deployed? Computes a readiness verdict from evidence on disk rather than from an impression: the plan confirmed, the roadmap empty, every acceptance criterion closed by the evidence its class demands, no judgement questions left for the owner, and the four assessments (ultra, datatest, security, ops) each run with nothing open. Writes .flow/READY.md and says READY, NOT READY with the exact list of what is open, or UNKNOWN with what was never checked. Use when the roadmap looks empty, before a pilot or a handover, or any time the owner asks "is it done". Never deploys, and never says READY without the evidence.
---

# Ready

The loop tells you a phase shipped. It never tells you **the project is finished**, and an
owner watching twenty green phases go by has no way to tell the difference between "there is
more to do" and "nobody queued the next thing".

This answers that, and it answers it from files rather than from a feeling. Every line of the
verdict points at something on disk. **A readiness claim with no evidence behind it is the
failure this whole plugin exists to remove** — the same failure as 209 green tests over an
empty board, one level up.

| | |
|---|---|
| **READY** | every check below passes, and each one names its evidence |
| **NOT READY** | at least one is open — listed exactly, most blocking first |
| **UNKNOWN** | something was never checked, and an unchecked thing is never "fine" |

**UNKNOWN is not a softer NOT READY.** It means a question has no answer yet, and saying
"probably fine" is how a project reaches a pilot with a backup nobody has restored.

## Before anything else

**Never say READY to be encouraging.** The word is the whole product of this command. If it is
spent on a project with an unproven restore or an open BLOCKER, it is worth nothing afterwards,
and the owner learns to check manually — which is where they started.

**Ready to deploy is not deployed.** Flow never deploys, and this command does not either. It
ends with what the owner would run, and the owner runs it.

**Ready for what?** A pilot with ten users and a public launch are different bars. Ask once if
the owner has not said; default to **a pilot with real users and real data**, which is the bar
most of these checks are set at, and say which bar was used in the verdict.

## The checks

Read `references/checks.md`. Each one is computed, not judged, and each carries its evidence:

| # | Check | Evidence |
|---|---|---|
| 1 | **The plan is confirmed, and the product still matches it** | `.flow/plan-confirmed` resolves; every flow in the project skill drives end to end |
| 2 | **The roadmap is empty** | the six-place sweep in `references/exhausted.md` **in the loop skill** finds nothing unblocked |
| 3 | **Every criterion is closed by the evidence its class demands** | no `- [ ]` in any phase's criteria; every `by artifact` file on disk |
| 4 | **Nothing is waiting on the owner** | no open `owner` entry in `.flow/UAT.md` |
| 5 | **The product's flows work end to end** | a data pass over the project skill's core jobs, rows read |
| 6 | **The assessments have run, and nothing is open** | `.flow/ULTRA-*`, `DATATEST-*`, `SECURITY-*`, `UIUX-*`, `OPS-*` — each present, each with no open BLOCKER |
| 7 | **Someone other than the author can run it** | the runbook was followed, a rollback was performed, a backup was restored and the rows read, the load limit is known |

Checks 6 and 7 are where most projects are not ready and do not know it. A project can have
every criterion closed and still have no runbook, no tested restore, and no idea what breaks
first under load — that is not finished, it is un-deployable.

## What it writes

`.flow/READY.md`, and the final message. Read `references/verdict.md` for the format.

The verdict opens with the word — READY, NOT READY, UNKNOWN — then the checks as a table with
evidence paths, then either **what to do to deploy** or **what is open, in order**.

**The plan gate reads this file.** A `.flow/READY.md` that says READY while check 3 has open
criteria, check 4 has open `owner` questions, or check 6 has a missing assessment is refused —
the same way a `by artifact` criterion cannot close without its artifact. The word has to be
earned before it can be written.

## When it runs by itself

The loop reaches this at the end of `references/exhausted.md` **in the loop skill**: when the
sweep finds nothing unblocked and the budget says stop, **the last thing the run does is
produce this verdict** rather than reporting "the roadmap is exhausted" and going quiet. Those
two sentences sound alike and mean completely different things, and only one of them answers
what the owner wants to know.

It can also be invoked at any time — `/flow:ready` — to ask where the project stands. Nothing
about it is destructive; it reads, drives the flows on a disposable copy, and writes one file.

## Never

- **Never say READY with an open BLOCKER**, in any report, of any age.
- **Never treat a missing assessment as a pass.** Never-run is UNKNOWN, not clear.
- **Never count a `by person` question as closed because it is old.**
- **Never deploy, push, or open a PR.** The verdict ends at the owner's hands.
- **Never soften the list.** A NOT READY with four items is more useful than a READY with
  four footnotes, and the owner can act on it in an afternoon.

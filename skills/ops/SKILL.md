---
name: ops
description: Make a system runnable by someone other than its author — the runbook, health checks, monitoring and alerting that fire on the things that actually break, structured logs, a deploy and a rollback both proven by doing them, a backup restored to a working system, and a load test that finds the limit before a user does. Use before a pilot, before real users, before a system starts holding money or data someone would miss, or when nobody can answer "who runs this at 2am". Produces artifacts a person can follow, not a plan.
---

# Ops

Every other command asks whether the system is correct. This asks whether anyone can **run**
it — and it is the dimension Flow has been weakest at, by design and by omission: the loop
never deploys, so everything after the commit was outside it.

It exists because of a measurable pattern: a project reached twenty-plus phases, a clean
security pass and 230 assertions against a real database, and nobody could have operated it.
No health check, no alert, no runbook, no tested restore, and the one question the systems
engineer lens asks — *what do you do at 2am* — had no answer anywhere in the repository.

| Stage | Asks | Produces |
|---|---|---|
| **1 Inventory** | what exists to be run, and what would page someone? | the map |
| **2 Runbook** | can a person who did not build it start, stop and fix it? | `docs/ops/runbook.md` |
| **3 Observe** | would anyone know it broke, before a user tells them? | health checks, logs, alerts |
| **4 Recover** | can it be rolled back and restored — proven, not claimed? | a performed rollback and restore |
| **5 Load** | where does it stop working, and is that far enough? | a load test and the limit |

## Before anything else

**"Add monitoring" does not mean adding a dashboard.** A dashboard is a thing nobody looks at
at 3am. An alert is something that wakes a person, and it is only worth building if it fires on
a condition that (a) actually happens, (b) a person can act on, and (c) would otherwise be
found by a customer. Everything else is a graph, and graphs are stage 3's smallest output.

**"Write a runbook" does not mean documenting the architecture.** The runbook is a set of
procedures, each starting from a symptom a person has — *the app is down*, *a statement did not
generate*, *the queue is backing up* — and ending in a resolved state. Architecture belongs in
the project skill.

**Nothing here is proven by writing it.** A rollback procedure that has never been performed is
a paragraph. A backup that has never been restored is a file of unknown contents. Stages 4 and
5 **do the thing** against a disposable copy, and the evidence is what closes the criterion —
the evidence gate will refuse the commit otherwise.

**Never touch production.** Every rehearsal is on a disposable copy. The one thing an
operability pass must not do is cause the outage it was preparing for.

## Stage 1 — Inventory

Read `references/inventory.md`. What runs: processes, jobs, workers, schedulers, external
dependencies, the database, the queue. For each: how it starts, what it needs, what happens
when it is not there, and **who notices**. Plus the question that ranks everything else — what
would a person be paged for, and what can wait until morning?

## Stage 2 — The runbook

Read `references/runbook.md`. Written **from symptoms, for a stranger.** Every procedure is a
numbered sequence with the actual commands, the expected output, and what to do when the output
is different. It is verified by following it — literally, from a clean shell, on the disposable
copy — and every step you have to improvise is a defect in the runbook, not in the follower.

## Stage 3 — Observability

Read `references/observe.md`. A health endpoint that checks the things that actually break
(the database round-trip, the queue depth, the external dependency) rather than returning
`200 OK` unconditionally. Structured logs with a request id that survives across services.
And **three to six alerts**, each with a named owner, a runbook procedure, and a stated
expectation of how often it should fire. An alert nobody can act on gets deleted, not tuned.

## Stage 4 — Deploy, rollback, restore

Read `references/recover.md`. Deploy to the disposable copy the documented way. **Then roll it
back, and prove the rollback worked.** Then take a backup, destroy the data, restore it, and
**check the rows** — a restore that completes is not a restore that worked.

This is the stage most often skipped and the one that costs most when it is. A migration that
cannot be reversed, discovered during an incident, is the difference between twenty minutes and
a weekend.

## Stage 5 — Load

Read `references/load.md`. Drive the system at the volume the project skill's users imply, then
at ten times it, and find where it stops working. The number that matters is not requests per
second — it is **the first thing that breaks and at what point**, because that is what you fix
or what you document as the limit.

For most systems this is a short stage with an honest answer: "it holds at 50 concurrent users,
the statement run is the bottleneck at 200, and nothing here will see 200 this year."

## The report and the repair

`.flow/OPS-<date>.md`, sealed, findings in CHECK's severities with a status line each.
**BLOCKER here means the system cannot be operated** — no rollback, no restore, no way to know
it is down. Then the repair protocol — `references/repair.md` **in the ultra skill** — each
finding a phase.

Record the operability facts in `.flow/PROJECT.md` so later phases inherit them: the run
command, the health endpoint, where logs go, who is paged.

## Never

- **Never rehearse against production.** A disposable copy, always.
- **Never write a procedure you have not followed.**
- **Never claim a backup works without restoring it and reading the rows.**
- **Never add an alert without an owner and a procedure.**
- **Never report a load limit you did not reach.** "It should handle it" is not a finding.

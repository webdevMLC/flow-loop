# The runbook — procedures, for a stranger

`docs/ops/runbook.md`, in the repository, committed. Not `.flow/` — this is a deliverable for
whoever operates the system, and they may never open a Flow file.

## It is organised by symptom, not by component

A person reaching for a runbook has a symptom, not a diagnosis. So the index is the list of
things that go wrong, in the words of the person noticing them:

```
The app will not start
Sign-in fails for everyone
A statement did not generate
The queue is growing and not draining
A partner's bookings stopped arriving
The month-end close produced the wrong total
Someone needs to be locked out right now
```

Each is a procedure. Architecture, module layout and the data model belong in the project
skill; putting them here is how a runbook becomes something nobody reads under pressure.

## Every procedure has the same shape

```markdown
## A statement did not generate

**You will see:** the associate's statement list is empty for a period that has closed, or
the reconciliation run shows `status: failed`.

**First, confirm it:**
1. `docker compose exec db mysql -e "SELECT id, period, status, failure_reason
   FROM reconciliation_runs ORDER BY id DESC LIMIT 5"`
   Expect the latest row for the period, with a status. A missing row means the job never
   ran — go to "The scheduler is not running". A failed row means read `failure_reason`.

**If failure_reason is `unbound_partner`:**
2. <the actual commands>
   Expect: <the actual output>
   If instead you see: <the other case> then <what to do>

**When it is fixed, verify:** <command> returns the row with `status: complete`, and the
associate's list shows the statement.

**If none of this works:** capture the run id, the `failure_reason`, and the last 50 lines
of the worker log before asking for help.
```

Four things make it usable at 3am, and each is often missing:

- **The actual command**, copy-pasteable, not "check the logs".
- **What the output should be**, so a person can tell success from a hang.
- **What to do when it is different** — the branch, not only the happy path.
- **How to verify the fix**, so nobody declares victory on a restart that changed nothing.

## Also in it, once

**Start and stop** — from nothing, the documented way, including what must be running first.
**Where things are** — logs, config, the database, the queue, each with the command to reach it.
**Who to tell** — for each tier from the inventory.
**What not to do** — the destructive operations, and why. `TRUNCATE` on an append-only ledger,
re-running a close for a closed period, restoring over a live database.

## It is verified by following it

**From a clean shell, on the disposable copy, doing exactly what it says and nothing else.**
Every step you have to improvise — a missing flag, a service that had to be started first, a
wrong path — is a defect in the runbook, not in the follower. Fix it and follow it again.

A runbook nobody has followed is a draft. Record in the report that it was followed and how
many corrections that produced: the number is the honest measure of how far from usable it
started.

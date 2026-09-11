# Recover — deploy, roll back, restore, and prove all three

The only stage whose findings are all discovered by doing. Everything here is performed against
a disposable copy, and what it produces is the evidence that closes the criteria.

## Deploy, the documented way

From the instructions as written, on a clean target. Every step you have to invent is a finding
— a new person will invent it too, and probably differently. Record how long it took, whether
it needed downtime, and what had to be true first: migrations, environment variables, a built
asset, a service already running.

**Migrations are the part to watch.** For each one in this release: does it reverse? A migration
that drops a column, rewrites a generated column, or backfills without keeping the old value is
a one-way door — and the deploy that includes it **cannot be rolled back by rolling back the
code.** Name each one in the release entry (`references/release.md` **in the loop skill**).

## Roll back, and prove it

**Then undo it.** Deploy the previous version by the documented rollback path, and verify the
system works — not that the command exited 0, but that a request succeeds and a row reads
correctly.

Three findings live here, and all three are common:

- **There is no rollback path.** The deploy is a script and the reverse does not exist.
- **The code rolls back and the schema does not.** The old code meets the new schema and breaks
  in a way that is worse than the bug being rolled back from.
- **It works, but takes long enough that nobody would use it** under pressure. Record the time.

## Back up, destroy, restore, read the rows

The whole point, and the step almost always skipped:

1. Take a backup the documented way.
2. **Destroy the data** on the disposable copy — drop the schema, not a gentle truncate.
3. Restore from the backup.
4. **Read the rows.** Counts per table against what was there, and spot-check the values that
   matter: a money total, the newest record, a foreign key that should still resolve.

A restore that completes is not a restore that worked. A backup nobody has restored is a file
of unknown contents, and the moment you find out is the moment you most need it to be right.

Record two numbers almost no project has stated: **how long a restore takes**, and **how much
data is lost** between the last backup and the failure point. Those are the recovery objectives,
and the owner should agree they are acceptable before a pilot, not during an incident.

## Then write down what you learned

Into the runbook as procedures — "Roll back a release", "Restore from backup" — and into
`.flow/PROJECT.md` as facts later phases inherit: the deploy command, the rollback command,
where backups go, how long a restore takes.

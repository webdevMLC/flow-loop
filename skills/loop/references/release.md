# Handing work over to be released

Flow commits locally and stops. That boundary does not move — a human decides what leaves the
machine. But stopping at the commit is not the same as handing over, and a phase that ships
correct code while leaving nobody able to release it safely has finished only half the job.

So SHIP records what a person needs in order to put this into production, and what they need
to get back out. It writes facts it already has; it does not deploy, and it does not plan a
deployment it cannot see.

## Append to `.flow/RELEASE.md` at every SHIP

One entry per phase, newest first. Written as the phase ships, while the facts are in hand —
reconstructing this later means reading migrations and guessing, which is how a reversal plan
becomes fiction.

```markdown
## Phase 14 — From Empty To Running (2026-09-08, a1b2c3d)

**What changed, for someone who did not build it.** A manager can now create an associate
who sets their own password from an activation link. The base URL redirects instead of 404ing.

**Migrations** — apply in this order:
| # | File | Reversible? |
|---|---|---|
| 0027 | `associate_activation.sql` | yes — `DROP TABLE associate_activation` |
| 0028 | `drop_legacy_invite_col.sql` | **NO — data is destroyed** |

**Order of operations.** Migrate first, then deploy: 0027 adds a table the new code reads and
the old code ignores. If a migration removes something the running code still uses, deploy
first — say which, because getting this backwards is downtime.

**New configuration.** `ACTIVATION_LINK_TTL_HOURS` (default 48). Without it activation links
never expire, which is a security regression, not a missing feature.

**How to reverse.** Redeploy the previous commit; 0027 can stay — the old code ignores the
table. **0028 cannot be reversed.** Restore from backup or accept the loss.

**What to watch for the first hour.** `account.create` audit rows appearing for new
associates; a spike in failed sign-ins means the activation flow is rejecting valid links.

**Not covered by this phase.** A2 and A6 are `by person` and still open — see the evidence
ledger.
```

## The rules that make it worth writing

**An irreversible migration is stated, never softened.** Dropping a column is not undone by
adding it back — the data is gone. Write **NO — data is destroyed**, and say what the actual
recovery is (a backup, or accepting the loss). A reversal plan that quietly assumes data
survives is worse than admitting there is none, because it will be believed at the worst
moment.

**Say which order, and why.** Migrate-then-deploy and deploy-then-migrate are both correct in
different cases, and the reason is always whether the old code can survive the new schema and
the new code can survive the old one. State the reason, not just the order — the person doing
it at 2am needs to know whether the rule still holds when half the fleet is on each version.

**Name the configuration that breaks things by its absence.** A missing environment variable
that silently disables a security control is the worst kind, and this is the only document
that will mention it. If the default is unsafe, say so.

**"What to watch" is one or two real signals**, not a monitoring plan. The thing that would
first show this went wrong.

**Carry the open `by person` criteria forward.** A release note that claims a phase is
complete, when two criteria were never judged by anyone, is the same substitution
`references/evidence.md` exists to prevent.

## What this is not

Not a deployment. Not a CI pipeline. Not a promise the release will work. Flow does not push,
deploy, or open a PR — `references/autonomous.md` — and nothing here changes that. This is the
handover document a competent person needs to do it themselves, written by the only party that
still remembers why the migration is ordered the way it is.

If the project has no deployment at all — a library, a spec, a local tool — say so once in
`.flow/RELEASE.md` and stop writing entries. An accurate "this does not deploy" beats a
ceremonial note per phase.

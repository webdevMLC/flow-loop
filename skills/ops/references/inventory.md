# Inventory — what runs, and who notices when it stops

Nothing is made operable that is not on this list, and everything on it gets an answer to
one question: **when this is broken, how does a person find out?** If the answer is "a user
tells them", that is the finding.

## What runs

From the project skill's boundaries if one exists, else from the code and the compose file:

| | Record |
|---|---|
| **Processes** | the web app, the API, each worker — how each starts, what port, what it needs present |
| **Jobs** | every scheduled or triggered job: when it runs, how long it takes, what it writes, what happens if it runs twice or not at all |
| **Datastores** | database, cache, queue, object storage — where, how big, how it is backed up |
| **External dependencies** | every service the system calls, and what the system does when it is down |
| **Config** | every environment variable and secret: what it does, what happens if it is wrong, where the real value lives |

For each, the line that matters: **what does a person see when this is not working?** A blank
page, a hung request, a silently skipped job, a number that is quietly stale. The invisible
failures are the expensive ones — a job that stops running produces no error, and the first
symptom is a month-end number nobody can explain.

## What would page someone

Rank everything above into three tiers. This is what stages 3 and 5 are built against.

**Page now** — money is wrong or stops moving, data is being lost, nobody can sign in, the
system is down. Small list. If more than five things are on it, the list is wrong.

**Fix in the morning** — degraded but working, a queue growing but not full, a dependency
flapping with retries succeeding, a job late but not missed.

**Notice eventually** — a slow query, a disk at 60%, a rising error rate that is still small.

**A system where everything is tier one has no alerting, it has noise.** A system where
nothing is tier one has not been thought about.

## Who

Name the person or role for each tier. On a one-person project the honest answer is *you*, and
that changes what stage 3 builds: a pager rotation is pointless, an email and a health page
someone checks each morning is not.

If nobody is named for a tier, say so in the report. An unowned alert fires into a void, and
after the third time it is muted forever.

## The environments

What exists — local, staging, production — and honestly: **which are real.** A "staging" that
is one developer's laptop is not staging, and every rehearsal in stages 4 and 5 needs a
disposable copy that resembles production closely enough for the result to mean anything.

If no such environment exists, that is the first finding, and it blocks stages 4 and 5 rather
than being worked around.

## What comes out

```
Processes      web (3100) · worker (queue) · scheduler (cron, 5 jobs)
Datastores     mysql 8.4 (12 tables, 40MB) · redis (sessions) · no object store
External       BookingDyno API (retries 3x, then?) · no mail sender configured
Page now       the ledger stops writing · sign-in fails · the close job misses month-end
Morning        the queue past 500 · a partner webhook failing repeatedly
Eventually     p95 past 2s · disk past 70%
Owner          all three tiers: the owner. No rotation, no pager.
Environments   local (docker compose) · NO staging · production not yet deployed
```

The last line is a finding, not a footnote.

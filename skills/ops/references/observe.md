# Observe — would anyone know before a user told them?

Three artifacts, in order of how much they are worth: a health check that checks something,
logs that can be followed across a request, and a small number of alerts that fire on things
that happen and can be acted on.

## The health check must check something

The commonest health endpoint returns `200 OK` from a handler that touches nothing. It proves
the process is running, which is the one failure people notice anyway.

A useful one round-trips every dependency the system cannot work without:

```
GET /health  ->  { status, checks: { db, queue, bookingdyno }, version, uptime }
```

- **The database**: a real query. `SELECT 1` at minimum; better a count from a table the app
  actually uses, so a broken migration or a lost permission shows up.
- **The queue or cache**: a round-trip, plus the depth — a queue that is up and 50,000 deep is
  a different problem from one that is down.
- **Each external dependency**: the cheapest authenticated call it offers. Report it separately
  and **do not fail the whole check on it** — a dependency being down should be visible without
  taking your own service out of the load balancer.
- **The version**, so a person can tell what is actually deployed.

Two endpoints if the platform wants them: *liveness* (am I running — restart me if not) and
*readiness* (can I serve — take me out of rotation if not). **Do not make liveness check the
database**, or one database blip restarts every process you have.

## Logs a person can follow

**Structured**, one event per line, machine-readable — level, timestamp, message, and a
**request id that survives every hop**, generated at the edge and passed through every service
and job. Without it, "what happened to booking 1041" is unanswerable and every incident opens
with an hour of correlation.

Log what an incident needs: the request id, the actor, the entity id, the outcome, the duration.
**Never log a secret, a token, a password, or a full PII record** — logs get shipped, searched,
and kept longer than anything else in the system.

Say where they go and how long they are kept. "The container's stdout, gone on restart" is an
honest answer and a finding.

## Three to six alerts, no more

Each needs all four, or it does not get built:

| | |
|---|---|
| **A condition that happens** | from the inventory's "page now" tier, not imagined |
| **An owner** | a named person or role |
| **A procedure** | the runbook section it points to |
| **An expected rate** | "this should fire less than once a month" |

Then the honest test: **if this fires at 3am, what does the person do?** If the answer is "look
at it and go back to sleep", it is not an alert — it is a morning report.

Prefer alerting on **symptoms** over causes. *"No ledger row written in 30 minutes during
business hours"* catches every cause of the ledger stopping, including the ones nobody
predicted. *"CPU above 80%"* catches a condition that is usually fine.

An alert firing more than its expected rate gets fixed or deleted within a week. Alert fatigue
is not a discipline problem, it is a design failure — and the muted alert is the one that would
have caught the real outage.

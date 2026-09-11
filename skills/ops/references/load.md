# Load — where does it stop working?

The shortest stage, and the one most often replaced with a guess. It has one deliverable:
**the first thing that breaks, and the point at which it breaks.**

## Size it from the project skill, not from ambition

The skill names who uses the system and what they do. Turn that into a number: how many people,
how often, doing what, at what hour. For a field sales tool that is perhaps forty associates, a
handful of submissions each per day, with everything bunching at month end. That shape matters
— it means the interesting test is not steady traffic, it is **the month-end close with every
associate looking at once.**

Test three points, in order:

1. **Expected** — the number above. If it does not hold here, nothing else matters.
2. **Ten times expected** — the headroom question. Most small systems pass, and the answer is
   worth having in writing.
3. **Until something breaks** — ramp until it does, and note what broke first.

## Drive it the way people use it

Through the product, in whole flows — sign in, list, submit, read back — not by hammering one
endpoint. A load test of `GET /health` at 5,000 rps tells you about your load generator.

Include the expensive path deliberately: the report, the month-end run, the export. That is
usually where the limit is, and usually not in the test, because it is slow.

## What to record

- **The first thing that broke**, and at what concurrency: a connection pool exhausted, a query
  going quadratic, a queue growing faster than it drains, memory climbing and not returning.
- **p50 and p95 at expected load**, and what a person perceives at p95.
- **What did not break**, so the next person does not re-test it.
- **The limit as a sentence a non-engineer can act on**: *"it holds at 50 concurrent associates;
  the statement run is the bottleneck and degrades past 200; nothing here will see 200 this
  year."*

## Two rules

**Never load-test production**, and never against a shared database. The disposable copy, with
production-shaped data volumes, or the result means nothing.

**Never report a limit you did not reach.** "It should handle it" is not a finding. If the
environment cannot generate enough load to break the system, report *that* — an untested ceiling
presented as a safe one is worse than no number at all.

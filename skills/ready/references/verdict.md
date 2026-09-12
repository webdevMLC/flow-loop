# The verdict — `.flow/READY.md`, and the last message

## The file

```markdown
# Ready? — BookingDyno BizDev · 2026-09-12

## NOT READY — 3 open

Bar: a pilot with real users and real data.

| # | Check | | Evidence |
|---|-------|---|----------|
| 1 | The plan is confirmed, and the product matches it | pass | `.flow/plan-confirmed`, 6/6 flows driven |
| 2 | The roadmap is empty | pass | sweep found 0 unblocked |
| 3 | Every criterion closed by its evidence | **open** | A14, A15 unticked (phase 6) |
| 4 | Nothing waiting on the owner | pass | 0 open `owner` entries |
| 5 | The product's flows work end to end | pass | 6 jobs driven, rows read · `.flow/evidence/ready/` |
| 6 | The assessments have run, nothing open | **open** | OPS never run |
| 7 | Someone else can run it | **unknown** | depends on 6 |

## What is open, in order

1. **No operability pass has ever run.** Nothing produces a runbook, a health check, an
   alert, a proven rollback or a tested restore. Nobody could operate this at 2am, and
   nobody has tried. → `/flow:ops` · about an hour
2. **A14 and A15 are unticked** (phase 6, the statement export). Both `by artifact`; neither
   capture is on disk. → the loop, one phase
3. **The security report is from 2026-08-30**, four milestones ago. Auth and the payment rail
   both changed since. → `/flow:security`

Nothing here is large. The order is the order they block each other in.
```

Then, when it passes:

```markdown
## READY

Bar: a pilot with real users and real data. Every check passes, and each names its evidence.

**To deploy** — these are yours to run, not the loop's:

1. `docs/ops/runbook.md` § Deploy — the path that was rehearsed on the disposable copy
2. The migrations in `.flow/RELEASE.md`: 3 this milestone, 1 of them irreversible (`0007`
   drops `legacy_rate`) — take the backup first
3. Point the health check at whatever watches it: `GET /health`
4. The three alerts in `docs/ops/runbook.md` § Alerts need their owner set

**What you are deploying:** 6 core jobs, 28 screens, 14 phases across 3 milestones.

**What it has not been through:** no load beyond 10× expected, no third-party penetration
test, no accessibility audit beyond the six lenses. None of those blocks a pilot; all three
are worth doing before a public launch.
```

The last block is not modesty — **a READY that does not say what it did not check is the
claim that gets believed too far.**

## The message

Short, and the word first. The owner reads this on a phone.

> **READY.** Every check passes — plan confirmed and all 6 flows driven, roadmap empty, 47
> criteria closed with evidence, nothing waiting on you, all five assessments clean, rollback
> and restore both proven. `.flow/READY.md` has the deploy steps; they are yours to run, Flow
> does not deploy. It has not been load-tested past 10× expected.

or

> **NOT READY — 3 open.** No operability pass has ever run (no runbook, no tested restore),
> A14/A15 are unticked in phase 6, and the security report predates the payment rail. About a
> day of work; `.flow/READY.md` has them in order.

**Never bury the word.** Not "here is a summary of where things stand" — READY or NOT READY,
first, then the detail. The whole point is that the owner can stop reading after one line.

## The rule the gate enforces

`.flow/READY.md` may say READY only when the mechanically checkable parts hold: no unticked
criterion, no open `owner` UAT entry, no assessment report missing, no `by artifact` file
absent. Write READY without them and the plan gate refuses the write, naming which check does
not hold.

The parts that cannot be mechanised — did the flows really work, was the restore really read —
stay the loop's judgement, and the verdict names the evidence for each so the owner can check
one in a minute if they want to.

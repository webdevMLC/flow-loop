# Coverage — proving a run did not get weaker

Cost came down across every assessment: cheap tiers, generated matrices, scripts instead of
turns. **The thing that must not come down with it is what the run actually covered**, and
"we found nothing" reads identically whether the system is clean or the run was lazy.

Three protections already exist. This file is the fourth, and it is the one that catches a
tier change going wrong.

## What already holds

**Every confirmed defect became a committed failing test.** `/flow:datatest` stage 4 and
`/flow:security` stage 4 both persist one test per defect, red until repaired and green
forever after. So a defect found once cannot silently return, whatever tier found it. Coverage
accumulates permanently and independently of who is looking.

**A run that finds nothing still reports what it drove.** *"A tester who finds nothing is
reporting coverage, not health."* Silence and thoroughness are distinguishable because the
report names the flows driven, the screens examined, and what could not be reached.

**Anything that could not be done cheaply is named.** A defect class nobody can state, a screen
nobody can critique, an attack nobody can devise — reported as **unexamined**, by name, rather
than absorbed into a clean result.

## What this adds — compare the run to the last one

At the top of every assessment report, before the findings:

```markdown
## Against the previous run — DATATEST-2026-08-14

| | Then | Now |
|---|---|---|
| Flows in the matrix | 38 | **44** |
| Dimensions that reported | 7 of 7 | 7 of 7 |
| Persisted tests still in the suite | 26 | **26, all green** |
| Findings | 19 (3 BLOCKER, 7 MAJOR, 9 MINOR) | 6 (0 BLOCKER, 2 MAJOR, 4 MINOR) |
| Unexamined surfaces | 1 | 0 |

**Fewer findings, and here is why:** 11 of the 19 became committed tests that are still green,
so those defect classes are closed rather than unlooked-for. The money dimension found 4 then
and 0 now; its 4 tests still pass, and the matrix grew from 6 money flows to 9.
```

**Three things that must be accounted for, every time:**

- **Every previously persisted test still exists and passes.** If a run cannot find them, the
  suite lost coverage — that is a BLOCKER about the project, not a note about the run.
- **Every dimension that reported last time reports this time.** A dimension that went silent
  is either finished or broken, and the report says which.
- **The matrix did not shrink.** Fewer flows covered than last time is a finding unless the
  product itself got smaller, and then it says so.

**Fewer findings is a claim that needs its reason.** "The code improved" is the good reason and
it is provable — the old tests are green. "We looked less hard" is the bad one and it looks
exactly the same from the outside. **A run that cannot say which it was has not finished.**

## The tier insurance — one expensive pass at a milestone

Routine assessments run cheap. **At a milestone, before a pilot, or when this comparison shows
a drop nobody can explain, run one pass at the frontier tier and diff it against the cheap
one.** What the expensive pass finds that the cheap one missed is the real measure of what the
tier costs you — and it is measured rather than argued.

If the expensive pass finds nothing new, that is the strongest evidence available that cheap is
enough for this codebase, and it is worth the money once a milestone to know it. If it finds a
class the cheap pass never imagined, **that class becomes a named dimension in the matrix**, so
the cheap tier can find it from then on. Either way the knowledge stays.

This is the honest shape of the trade: **cheap by default, expensive occasionally, and a
comparison that makes a weakening run visible in between.**

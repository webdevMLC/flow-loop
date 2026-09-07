# CHECK gate

One pass. Three checkers in parallel. One report. Then done.

## Machine pass first

Before spending a single model token on the lenses below, run the checks a machine does
better and cheaper. Commands come from `.flow/PROJECT.md`.

1. **Typecheck** — `tsc --noEmit` or the language equivalent.
2. **Lint** — the project's configured linter.
3. **The affected tests** — full suite if the change is broad.
4. **Seeded tables with no reader** — grep the tables named in seed files and migrations
   against the client tree. One command, and it finds the class of defect where the data
   ships and the screen never does. See below.

Fix everything they report **before** dispatching reviewers. A type error found by `tsc` in
two seconds is the same defect a review agent would spend a thousand tokens describing, and
the compiler is never wrong about it in the way a reviewer can be.

If the machine pass is red, the review has nothing useful to say yet. Do not run it.

## Dispatch

Spawn these **in a single message** so they run concurrently. Use Sonnet, or Haiku
for a small diff — never Opus. Each gets the diff scope and the acceptance criteria
from STATE.md, and returns findings only.

| Checker | Looks for |
|---------|-----------|
| **Logic** | Does the code meet the acceptance criteria? Wrong results, off-by-one, unhandled null/empty/error paths, broken invariants, state transitions that can't happen or can't be undone. |
| **Security** | Injection, missing authz on new endpoints, tenancy leaks, secrets in code or logs, unvalidated input crossing a trust boundary, unsafe defaults. **And: if `.flow/STATE.md` holds a threat register, verify every row** — see below. |
| **Performance** | N+1 queries, unbounded loops or fetches, missing indexes on new query paths, work repeated per-request that could be hoisted, blocking calls on hot paths. |

Skip a checker whose domain the diff does not touch. A CSS change needs no
performance oracle; a pure-frontend diff needs no tenancy audit.

If the diff is <=3 files or <=200 lines, **do not spawn** (guard 5) — run all three
lenses inline yourself.

## Verifying the constants register

If FRAME produced one (`references/authority.md`), every row must be closed: the file and
line where the value now lives, matching the cited authority. An unchecked row is a
BLOCKER. Check fixtures and seeds as well as source - a wrong value defended by a test is
the hardest kind to see.

## Verifying a threat register

If FRAME produced one (`references/threat.md`), the security lens closes each row or fails
it. For every threat:

- Name the **code** implementing the mitigation — file and line, not a claim that it exists.
- Name the **test that fails without it**. If deleting the mitigation leaves the suite green,
  the mitigation is unproven and the row stays open.
- A row with no code and no test is a **BLOCKER**, not a note.

A threat model nobody verifies is theatre, and the verification is the whole reason to write
one.

## Verify only when reading will not do

Adversarial verification — spawning skeptics to refute each finding — is the most expensive
thing CHECK can do, and most of the time it is not worth doing. **The default is to report
the findings and let the person who owns the code judge them.**

A finding that names a file, a line, and a concrete failure is judged in seconds by someone
who knows the codebase. Paying several agents to argue about it costs far more than the
reading it replaces.

Verification earns its cost in exactly two situations:

1. **The count exceeds what the owner would read.** A sweep returning two hundred findings
   needs triage before a human sees it. Thirty does not.
2. **The reviewer cannot judge** — unfamiliar domain, no owner available, or a claim that
   turns on behaviour nobody present can confirm.

Neither is about how important the code is. Money code deserves *careful review*; it does
not automatically deserve a skeptic panel, because the person who owns a ledger can read a
ledger finding faster than three agents can debate it.

### When you do verify, tier it

Never spend the same on every finding — that costs as much to check a typo as a money defect.

| Severity | Skeptics | Why |
|---|---|---|
| **BLOCKER** | up to 3 | A false blocker stops a ship and burns an investigation |
| **MAJOR** | 1 | Worth a second opinion, not a panel |
| **MINOR** | 0 — report it | If it is wrong the reader loses five seconds |

Uniform verification is the failure mode to avoid. Thirty-two findings at two skeptics each
is sixty-four agents, of which the twenty spent on minor findings could not have paid off
under any outcome — a minor gates nothing, so being wrong about one costs nothing.

**Deduplicate before verifying, not after.** Two findings on the same defect at nearby lines
are one finding; verifying both pays twice for one answer. Match on the claim, not on
`file:line` — the same bug is often reported a few lines apart.

## A criterion about a person is not closed by a test

**If an acceptance criterion says a person sees, opens, reviews, drills into or is warned by
something, a passing unit test does not close it.** The test proves the function behind the
screen. The criterion claimed the screen.

This is the single most expensive mistake this gate can make, because it is invisible: the
suite is green, the report is honest about the suite, and the criterion is marked met. Nobody
discovers otherwise until someone opens the product.

It has happened at scale. A phase whose criteria read "a manager **sees** each associate's
weighted KPI scorecard" and "a stage change **appears on the manager's board** within seconds,
with **no page reload**" was closed on tests of the scorecard computation. It shipped
twenty-four database modules and no page. Across that project, nine phases declared a user
surface and three page files were written in total — every phase green, every report accurate
about what it had actually run.

To close a criterion of this kind, name **the route or component a person opens**, and say how
you know it renders — you opened it, a browser-driven test drives it, or a screenshot exists.
If none of those is true, the criterion is **not met**. Report it as: *"the computation is
proven; no surface reaches it"* — which is useful, honest, and lets someone decide.

Verbs that mean a human surface: sees, views, opens, reviews, drills into, filters, sorts,
submits, is warned, is shown, at a glance, without a page reload. Verbs that do not: returns,
computes, records, produces, rejects, enforces.

**"Surface" is not a synonym for "endpoint".** On the same project, a CHECK finding worded
"give the compliance rules a surface" was closed with four `route.ts` files and no page —
the finding was right, and the word let a backend-shaped run satisfy it backend-side. When
writing a finding of this kind, say **page**, **screen** or **the route a person opens in a
browser**, never "surface" or "expose". When reading one, resolve the ambiguity toward the
person: an HTTP endpoint nobody can navigate to has not closed a criterion about someone
seeing something.

## Seeded data with no reader

A build that keeps seeding rows and never renders them produces a system that works and that
nobody can operate. It is easy to miss because every test passes: the data is there, the
functions that read it are correct, and no criterion was violated — there was simply never a
screen.

**Check it directly.** List the tables populated by a seed script, a fixture or a
`*_seed.sql` migration. For each, ask whether anything a person opens reads it — a page, or
an endpoint that a page calls. A table with no reader anywhere in the client is a finding.

**Configuration seeded as SQL is the important case.** Rates, weights, thresholds, approval
matrices, policy tables. If changing a value means writing a migration, then the people who
own that rule — finance, a manager, whoever the authority actually belongs to — cannot change
it, and every change needs an engineer and a deploy. Report it, and say who is locked out:

> MAJOR — `authority_matrix` is seeded by `0023_authority_matrix_seed.sql` and read by no
> page or endpoint. Changing who may approve a pricing exception requires a migration, so the
> authority §27 assigns to a manager is only exercisable by a developer.

**Not every seeded table needs a screen**, and saying so is part of the check. Reference data
that never changes, an enum-shaped lookup, a bootstrap admin row, a test fixture — these are
correctly invisible. The question is not "is it rendered" but **"who needs to change this, and
can they?"** A table nobody will ever edit is fine. A table the business owns and only
engineers can reach is a defect, however green the suite.

Two related shapes worth the same question:

- **An entity that can only be created by a seed.** If the product cannot create one, the
  feature is a demo.
- **An endpoint no page calls.** Either the screen is missing, or the endpoint is dead. Both
  are findings, and they are distinguished by asking who was supposed to call it.

## Falsification

Every finding must carry a concrete failure scenario: inputs or state → wrong output
or crash. A finding that cannot be stated that way is not a finding; drop it.
Do not report style preferences, hypotheticals, or "consider maybe."

## Report

One aggregated markdown block, most severe first:

```
### <severity> — <file>:<line>
<one sentence: what is wrong>
Fails when: <concrete scenario>
Fix: <the change>
```

Severity: BLOCKER (ship breaks something) / MAJOR (wrong under real conditions) /
MINOR (works, but will bite).

## Resolution — this is where loops die

1. Fix every BLOCKER and MAJOR **in one batch**.
2. Re-verify **only the code that changed**. Not the whole suite, not the passed checks.
3. Do not re-run the checkers. They ran.
4. MINOR findings: state them in the SHIP report. Fix only if the user asks.

If a fix fails twice, guard 4 applies — surface it, do not attempt a third time.

## Verification honesty

Claim "passing" only after seeing the command output that says so. If tests fail,
say so and paste the failure. If a step was skipped, say it was skipped. Evidence
before assertions — always.

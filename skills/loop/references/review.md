# CHECK gate

One pass. Three checkers in parallel. One report. Then done.

## Machine pass first

Before spending a single model token on the lenses below, run the checks a machine does
better and cheaper. Commands come from `.flow/PROJECT.md`.

1. **Typecheck** — `tsc --noEmit` or the language equivalent.
2. **Lint** — the project's configured linter.
3. **The affected tests** — full suite if the change is broad.

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

If the diff is <=3 files or <=200 lines, **do not spawn** (guard 4) — run all three
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

If a fix fails twice, guard 3 applies — surface it, do not attempt a third time.

## Verification honesty

Claim "passing" only after seeing the command output that says so. If tests fail,
say so and paste the failure. If a step was skipped, say it was skipped. Evidence
before assertions — always.

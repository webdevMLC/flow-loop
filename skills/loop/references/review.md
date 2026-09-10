# CHECK gate

One pass. Four checkers in parallel. One report. Then done.

CHECK is five stages, and **each one gates the next**. The order is by cost: nothing
model-heavy runs until everything a machine can settle is green, because a reviewer arguing
about code that does not compile is pure waste.

A phase ships only when all five pass. That is what makes an unattended run trustworthy —
not that nobody is watching, but that nothing reaches SHIP without clearing every stage.

| Stage | Asks | Cost |
|---|---|---|
| **0 Machine** | does it build, typecheck, lint, and pass everything? | free |
| **1 Contract** | does it still match the authority it was framed against? | cheap |
| **2 Composition** | is it connected to the system, or an island? | cheap |
| **3 Adversarial** | what is wrong with it? | model-heavy |
| **4 Verdict** | what is proven, what is open, what ships? | inline |

---

## Stage 0 — the machine pass

Run all of it. Do not sample, and do not skip a step because the change "looks small" — the
cheapest stage is the one you never earn the right to skip.

1. **Typecheck** — `tsc --noEmit` or the language equivalent.
2. **Lint** — the project's configured linter.
3. **The full suite.** Not `test_fast`, not the affected subset. `test_fast` is what BUILD
   runs between tasks; CHECK runs everything, because the defect a fast suite misses is
   exactly the one that reaches a user.
4. **The build.** `next build`, `cargo build --release`, whatever produces the artifact.
   **Unit tests never catch a server/client boundary violation, a bad import, or a route
   config error.** One project ran two days of green commits on a build that had not been
   attempted since before any of them.
5. **Every gate the project has** — its own consistency checkers, mutation gates, schema
   validators. A repository that built its own gates expects them run.
6. **Seeded data with no reader** — see below.

Red at stage 0 means CHECK is over. Fix and start again; the later stages have nothing useful
to say about code that does not compile.

### Exit code 0 is not the same as clean output

**Read what these commands print, not only what they return.** A build that exits 0 while
printing a warning has told you something and been ignored, and the tools that warn are usually
the ones with the widest view of the system — the package manager sees the dependency graph, the
bundler sees every import, the migration runner sees the schema.

A real example, found by a user and not by this gate: a build printed

    WARNING  Circular package dependency detected: @bizdev/shared, @bizdev/db

on **every single build for fifteen phases.** The exit code was 0 each time, stage 0 ran the
build each time, and nobody read the line. It is a genuine architectural defect and no test
could ever have failed for it.

**A warning that appears on every run is a standing signal, and it gets one of two answers:**

| Answer | What it means |
|---|---|
| **Fix it** | it is a defect, and the tool found it for free |
| **Record it** | write one line in `.flow/PROJECT.md` saying which warning is accepted and why |

There is no third answer. "Known noise" that nobody wrote down is indistinguishable from a
defect nobody noticed — which is exactly how the one above survived fifteen phases.

**Watch particularly for:** circular or unresolvable dependencies, peer-dependency conflicts,
deprecations that name a removal version, "N packages may need updating", implicit-any and
unchecked-cast notices below the error threshold, migrations reporting a skipped or out-of-order
step, and any warning whose text contains a file path in this repository.

**On the first inspection of a project, list every recurring warning** and settle each one. That
list is short, it is written once, and after that a *new* warning is visible against a quiet
background rather than lost in a wall of familiar ones.

## Stage 1 — the contract

Correctness against the criteria is not correctness. **CHECK verifies the code against the
frame; this stage verifies the frame.**

- **The constants register** — every row closed against the authority document, not against
  the roadmap or the phase plan. Details below.
- **The threat register** — every row closed by named code and a test that fails without it.
- **The premise.** Re-read the authority for the values this phase depends on, and confirm the
  frame still states them correctly. This exists because of a specific failure: a rate entered
  a research document wrong, propagated through the roadmap into a phase plan, into fifteen
  fixtures, and into five shipped phases — **every gate green the whole way**, because each
  one verified the code against criteria nobody had re-checked. A phase that implements its
  criteria perfectly and its authority wrongly has failed, and this is the only stage that can
  see it.

## Stage 2 — composition

Every gate before this one examines a part. This one asks whether the parts connect — the
failure mode where every component is correct and the system does not work.

- **Every new module is imported by something reachable.** A module nothing calls is either
  dead or unfinished; both are findings, distinguished by asking who was supposed to call it.
- **Every new endpoint is called by a page a person opens — name the page — or is explicitly
  declared a published API with its consumer named.** "Called by a surface" is not an answer;
  another route calling it is not a person reaching it. An endpoint
  with neither is a screen that was never built.
- **Every new table is read.** See the seeded-data section below.
- **If the phase writes anything persistent, trace the flow and read the rows** —
  `references/dataflow.md`. Everything above this line proves the parts are *wired*; none of it
  can see a wired, reachable, fully tested flow writing the wrong number. Draw the handoff
  chain and find the seven process gaps (a state with no exit, a step with no actor, two paths
  to one state leaving different data...), then drive each write through the product and read
  the row back — values against the authority, types, side effects, run it twice, drive the
  reverse. One round trip per thing the phase writes, not `/flow:ultra`'s full matrix. Skip it
  in one line if the phase writes nothing.
- **Every criterion is closed by the evidence its class demands** — `by test`, `by artifact`,
  `by person`. Details below.
- **If the phase touched a user surface, audit the screen** — `references/uiaudit.md`. It
  opens the route, captures it at desktop and 375px into `.flow/evidence/<phase>/`, checks
  the five states and the project's own design standard, and returns findings. The capture is
  what closes an `by artifact` criterion; a score without one is an opinion.
- **Regression: what passed at the last phase still passes.** Compare against the previous
  phase's recorded results. A suite that silently stopped running is indistinguishable from one
  that passes, and the difference only shows up here.

## Stage 3 — the adversarial pass

Only now, and only on green. Spawn these **in a single message** so they run concurrently. Use
Sonnet, or Haiku for a small diff — never Opus. Each gets the diff scope and the acceptance
criteria from STATE.md, and returns findings only.

| Checker | Looks for |
|---------|-----------|
| **Logic** | Does the code meet the acceptance criteria? Wrong results, off-by-one, unhandled null/empty/error paths, broken invariants, state transitions that can't happen or can't be undone. |
| **Security** | Injection, missing authz on new endpoints, tenancy leaks, secrets in code or logs, unvalidated input crossing a trust boundary, unsafe defaults. |
| **Performance** | N+1 queries, unbounded loops or fetches, missing indexes on new query paths, work repeated per-request that could be hoisted, blocking calls on hot paths. |
| **Claims** | Read the SHIP report as drafted and try to falsify each sentence. "Mutation-proven" — was it? "All criteria met" — by what evidence? This one reviews the *account of the work*, which is what a person will read and believe. |

Skip a checker whose domain the diff does not touch. A CSS change needs no performance oracle.
If the diff is <=3 files or <=200 lines, **do not spawn** (guard 5) — run the lenses inline.

## Stage 4 — the verdict

Report, resolve, and state the evidence ledger. Details in the sections below. A phase ships
when stages 0-2 are green, every BLOCKER and MAJOR from stage 3 is fixed and re-verified, and
the ledger says what remains open and to whom.

---

## Prepare the UAT entries — do not answer them

Every criterion still marked `by person` gets an entry appended to `.flow/UAT.md`:
the exact route or artifact, one specific question, and what yes and no each mean.
`references/uat.md` gives the shape.

**Prepare, never answer.** The loop may capture the artifact and predict the severity; it may
not decide. A loop that closes its own judgement criteria has reinvented the substitution this
gate exists to prevent, under a heading claiming a person did it.

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

### First: is this a fact, or an inference?

Before tiering anything, split the findings in two. **A claim about what a file contains is
settled by reading the file.** "`NEXTAUTH_SECRET` is committed in plaintext", "this page
declares itself cacheable", "this export has no caller" — one grep answers each, and it answers
definitively rather than probably. Spawning a skeptic to debate a fact is the single most
wasteful thing in this section.

Only a claim about **behaviour** — this input produces that wrong outcome, this state is
reachable, this guard does not hold — is worth an agent, because that is what reading alone
cannot settle.

Do the greps first. Findings they confirm go straight to the report; findings they refute are
dropped without a verifier ever running.

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

**"Up to 3" means sequential, stopping on the first refutation — not three at once.** Run the
lenses cheapest-discriminator-first, and stop the moment one of them kills the finding:

1. **Does the code say what the finding claims?** Misreading is the commonest false positive
   and this is the cheapest lens.
2. **Does something else already prevent it?** A guard upstream, a caller that never passes
   that input, a type that excludes it, a documented decision.
3. **Can you construct the failing input?** Most expensive, most conclusive — and most
   findings never reach it.

Short-circuiting on a *refutation* is safe in a way that short-circuiting on confidence is not.
A refutation is a positive claim with evidence you can check; "the verifier felt sure" is the
least reliable signal available, and a confidently-wrong skeptic reports certainty. Never gate
the next lens on how sure the last one sounded.

This is also stricter than running three in parallel and taking the majority: a finding
survives only if **no** lens refutes it, rather than surviving one dissent. The cost is that a
single wrong refutation kills a real finding silently — which is why a BLOCKER, where a miss is
expensive, may still be worth three independent runs in parallel. Say which you did.

**Deduplicate before verifying, not after.** Two findings on the same defect at nearby lines
are one finding; verifying both pays twice for one answer. Match on the claim, not on
`file:line` — the same bug is often reported a few lines apart.

## Close each criterion with the evidence its class demands

`references/evidence.md` gives every criterion a class. CHECK honours it:

- **`by test`** — the command output. Paste it.
- **`by artifact`** — produce the artifact now and save it under `.flow/evidence/<phase>/`.
  A promise to produce one does not close anything, and a passing unit test never substitutes.
- **`by person`** — do not close it. Report it awaiting review, with the artifact if one
  exists and the specific question a reader should answer.

End the report with the ledger: how many closed by test, by artifact, and how many are open
awaiting a person. A phase claiming every criterion met, on a goal about people, with nothing
but `by test` behind it, is the defect this whole section exists to catch.

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

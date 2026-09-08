# Gate protocols

## FRAME

Goal: know what "done" means and what the tasks are. **No code.**

**0. Is the goal even clear?** Before step 1, check: can you state in one sentence what
done looks like, in a form someone else could verify? If not, stop and read
`references/brainstorm.md`. A request that *sounds* specific — "add a dashboard", "make
onboarding better" — is not a goal, and framing it anyway produces a confident plan for the
wrong problem.

1. **Recall once.** One memory query (see SKILL.md → Memory). Do not query twice.
2. **Read the profile, or write it.** `.flow/PROJECT.md` holds the stack, the commands
   (test, test_fast, test_one, typecheck, lint, run), the conventions, and the analog map.
   If it exists, read it and skip most of the survey below — that is the point of it. If it
   does not, this is the phase that writes it. See `references/state.md`.
   **If the project has a user interface, fill the Design standard section.**
   `references/uiaudit.md` treats it as the authority that matters more than any generic
   rubric, and silently degrades to generic pillars when it is absent — so a rule like "no user
   appears in rank order against another" goes unchecked forever because nobody wrote it down.

3. **Survey what the profile does not cover.** One batched pass for the rest:
   existing patterns, the files in play, the test command, the run command.
   Route this through the sandbox — index or grep, print only what matters.
   Delegate to a Haiku/Sonnet subagent **only** if the survey spans many files
   (guard 5); otherwise do it inline.

   **Find the analog.** For every new file you expect to write, name the closest existing
   file that already does something similar, and note what it does — its layout, its error
   handling, its test shape, its naming. New code that matches the surrounding code is
   reviewed faster, breaks less, and is not rewritten later. Record the analogs in STATE.md
   as one line each. If there is no analog, say so — you are setting a precedent, and that
   is worth one sentence of deliberate choice rather than an accident.
4. **Write STATE.md.** Goal, acceptance criteria, task list, and every assumption
   you are proceeding on. This file is the plan. There is no separate plan document.
5. **Ask once.** If different readings of the request lead to materially different
   work, batch every open question into a single AskUserQuestion. Otherwise decide
   like a careful colleague, record the call as an assumption, and continue.

6. **Reconcile against the authority, if an external document decided any of this.**
   A contract, specification, regulation, pricing agreement or playbook that states rates,
   thresholds, windows or formulas is the source; a roadmap or a phase plan is not. Read
   `references/authority.md` and build the constants register before BUILD. A value that
   contradicts the authority is a BLOCKER, not an assumption.

7. **Threat model, if the phase warrants it.** If it touches money, identity, other
   people’s data, or input from outside the trust boundary, read `references/threat.md` and
   write the threat register before BUILD. Every mitigation becomes a task in the list, not
   a wishlist item.

### 8. The gap pass — what does this plan assume exists that does not?

Steps 3, 6 and 7 ask *how do I build this*, *is any value wrong*, and *what could attack
this*. None asks what the plan is quietly taking for granted. That question is where the
expensive failures live, and every one of them was answerable from documents already read.

**This is a pass over what the survey returned, not a second survey.** If it sends you
searching for something new, it has failed — record the unknown as an assumption and move on
(guard 2). Five questions:

1. **What does this need that does not exist yet?** A screen, a service, a credential, a
   table, a seeded value, a command that has never successfully run. Name each one.
2. **Who operates this after it ships?** If the phase creates a rate, a threshold, a policy or
   an authority rule, name the person who will change it later and how. "By writing a
   migration" means the people who own that rule cannot change it.
3. **What in the source documents did nobody consume?** A field in the plan format, a
   requirements row, a blocked-list entry, a `UI hint`. A signal nothing reads is a signal
   that will be missed — one project carried `UI hint: yes` on nine phases and shipped three
   page files.
4. **Which criteria have no evidence path?** Cross-check the classes from step "mark every
   criterion". A criterion you cannot mark `by test`, `by artifact` or `by person` is not
   specific enough yet.
5. **What did the last phase leave open?** Findings not acted on, deviations, claims ticked as
   built but never proven. `references/exhausted.md` names where these hide; read them at the
   start of a phase rather than only at the end of a roadmap.

**Every gap resolves into exactly one of three things, and silence is not among them:**

| Resolution | Goes to |
|---|---|
| We build it this phase | the task list |
| We proceed without it, knowingly | `### Assumptions`, with what breaks if wrong |
| We cannot proceed without it | a blocker — reported, and the phase does not start |

A gap recorded as an assumption is fine. A gap nobody wrote down is how a phase ships a
computation with no screen, a rate no one can change, and a durable path nothing ever asserted.

### 9. Review the plan before building it — Full work only

One reviewer reads the frame, not the codebase: is this the right work, are the criteria
checkable, do the tasks actually produce them, what does it assume that is not true, what would
someone be surprised is missing. Concerns are accepted, recorded as assumptions, or rejected
with a reason — and the frame is edited to say which. Two revision rounds, then surface the
disagreement rather than settling it alone. `references/planreview.md`.

Three gates check the work. This is the only one that checks the plan, and the plan is where
the expensive failures start.

Exit FRAME when acceptance criteria are written and testable. If you cannot state
how the work will be verified, the frame is not finished.

Do **not** produce: a research report, a separate PRD, a roadmap, or a design doc,
unless the user asked for that artifact by name.

### Before leaving FRAME: mark every criterion with how it will be proven

`by test`, `by artifact`, or `by person` — `references/evidence.md`. Do it while writing
the criterion, because the class is a property of the claim, not of the verification. A
criterion whose class is awkward to choose is a criterion that is not yet specific enough.

Unmarked defaults to `by test`, and that default is how a build satisfies every gate and
produces something nobody can use.

### Before leaving FRAME: does a person ever see this?

If the goal describes something a **person** does — sees, reviews, submits, is warned by —
then at least one acceptance criterion must name **the page or screen — the route a person opens
in a browser** — never an endpoint, a module, or an "API surface". The word *surface* has
already lost once here: a finding worded "give the compliance rules a surface" was closed
with four route files and no page. Do not use it in a criterion.

Do not assume well-written criteria are enough. On the project that motivated this rule the
criteria were fine — "a manager sees each associate's weighted KPI scorecard", "appears on the
board with no page reload" — and the phase still shipped no page, because CHECK closed those
criteria on tests of the computation behind them. Wording it correctly at FRAME is necessary
and not sufficient; `references/review.md` carries the half that catches it.

If the roadmap carries a field like `UI hint: yes`, read it here and turn it into a
criterion — a field nothing consumes changes nothing.

If the phase genuinely is infrastructure with no human surface, say so in the frame. The
failure is not building backend phases; it is believing a screen was delivered when the
criteria never asked for one.

## BUILD

Goal: working code. **This is the only gate that spends frontier reasoning.**

No research here. If a fact is missing, use the assumption recorded in FRAME.
If no assumption covers it, that is a FRAME defect — record it, pick the option
most consistent with the surrounding code, and keep building.

### When the frame turns out to be wrong

The rule above covers a fact the frame **did not have**: proceed on an assumption. This covers
a fact the frame **got wrong** — and the two need opposite responses. Continuing past a false
premise builds something the frame no longer describes, and the state file keeps claiming the
old plan until someone reads the code.

You have hit one when, mid-task:

- the analog named in the frame does not exist, or does something materially different
- a contract, type or schema has a different shape than the frame assumed
- **the test cannot be written as specified** — the behaviour the criterion describes is not
  reachable from here. This is the loudest signal available and the easiest to explain away
- a dependency the frame assumed — a service, a table, a function, an endpoint — is not there
- finishing the task as written would violate an invariant, an authority value, or another
  criterion in the same phase
- the task is already done, or cannot be done at all

**Three responses, and the choice is about blast radius, not effort:**

| What is wrong | Do this |
|---|---|
| A detail inside one task | Adapt. Record it in `### Deviations` with what you found and what you did. Continue. |
| The task itself | Re-frame **that task** in STATE.md — the new task, and one line on why the old one was wrong. Then build the new one. |
| A criterion, or the goal | **Stop the phase.** Report what was assumed, what is true, and which criterion no longer stands. Do not redesign the phase mid-BUILD. |

**The divergence reaches STATE.md before the code does.** Not after the task, not at SHIP. A
state file describing a plan that stopped being true two tasks ago is worse than no plan — the
next wake resumes from it, a reader trusts it, and both are working from fiction.

**Two re-frames in one phase and the phase stops.** If the tasks keep turning out wrong, the
frame is wrong, not the tasks, and rewriting a third is how a phase quietly becomes a different
phase. Same shape as guard 4: two attempts, then surface it.

**An authority contradiction is never a deviation.** If the thing you found disagrees with a
specification, contract or regulation, `references/authority.md` governs — that is a BLOCKER
and it stops the phase, however small it looks from inside the task.

### TDD scope rule

Test-first is **mandatory** where a test can actually fail meaningfully:

- business rules and calculations
- money, pricing, tax, balances, ledgers
- auth, permissions, tenancy, access checks
- data transforms, parsers, serializers
- state machines and status transitions
- API contracts and validation

For these: RED (a failing test that fails for the right reason) → GREEN (the
minimum code that passes) → REFACTOR. Production code written before its test is
invalid; delete it and restart the cycle.

Test-first is **not** required for: config, scaffolding, wiring and glue, markup and
styling, copy changes, generated code, or migrations. Verify those by running them.

Nothing in between: if unsure which side a file falls on, ask whether a test could
fail for a reason a reviewer would care about. If yes, test it first.

### RED must be observed, not assumed

The hook stops you writing implementation that has no test, and rejects a file named like a
test that contains no assertions. It cannot tell whether the test actually failed first, and
it deliberately does not run your suite - running tests inside a write hook would spawn
containers and network calls on every edit.

So the two halves split like this:

- **Mechanical:** a covering test must exist and must contain assertions. An empty
  `pricing.test.ts` is rejected by name, with a message saying so.
- **Yours:** run that test and watch it fail, for the reason you expect, before writing the
  implementation. A test that passes before the code exists is testing nothing. A test that
  fails for the wrong reason - an import error, a typo - has not established RED either.

If you cannot make it fail, you do not yet understand what you are building.

### This rule is enforced, not advisory

A PreToolUse hook (`hooks/flow-tdd-gate.mjs`, shipped with this plugin) denies Write/Edit on a guarded
source file when no test anchored on its name exists anywhere in the project. Guarded
extensions: ts tsx js jsx mjs cjs py go rb php java cs. Test files, config, generated code,
migrations, scripts, markup entry points (index) — **`page` and `layout` are gated**, anchored on their route and vendored trees are exempt.

When the hook denies a write, it is telling you the RED step has not happened. Write the
test. Do not route around it.

The gate is filename-based, so it can be wrong. Two escape hatches, in order of preference:

- The file is genuinely outside TDD scope -> add a fragment to `.flow/tdd-exempt`.
- The whole project needs the gate off -> create `.flow/tdd-off` in the project root.
- One-off -> `FLOW_TDD_OFF=1`.

A test counts as covering a source file by either of two passes:

1. **Name** (no file reads) - the test filename starts with the source name, or shares a
   token with it. Tokens are split on `-`, `_` and camelCase, singularised, and generic
   ones (index, types, utils, data, config...) are ignored. So `lead-claim-rejection.test.ts`
   covers `claims.ts` via the token `claim`, and `booking-events-idempotency.test.ts`
   covers `booking-events.ts`. For Next.js `route.ts` the tokens come from the route
   segment instead of the meaningless filename.
2. **Symbol** (bounded reads, only if pass 1 finds nothing) - a test file that mentions one
   of the source file's exported identifiers. Catches tests that import through a barrel
   and share no filename token.

A brand-new logic file in a project with no related test at all is still denied, which is
the point.

### Parallelism

Tasks that touch disjoint files and share no ordering constraint run **together**, not in
sequence. Group them into waves: everything in a wave is independent, and a wave starts only
when the previous one is done.

- Establish the wave order in FRAME, from the dependency between tasks, not their numbering.
- Within a wave, issue the independent tool calls in one message.
- Only delegate a wave to subagents when it clears guard 5 — otherwise waves are just an
  ordering device for your own work, which is still most of their value.
- A task that everything else depends on (a schema, a shared type, a migration) is its own
  wave, first. Getting this wrong serialises the whole phase.

To actually run tasks concurrently — when spawning agents is worth it, how to brief them,
why their file sets must be disjoint and why commits stay serial — read
`references/parallel.md` before spawning anything.

### Commits

One commit per completed task, message describing the behavior change, **and the STATE.md
update for that task in the same commit**. Checking a task off later is how a run that ends
unexpectedly leaves work that looks unfinished and gets redone. The commit gate enforces
this.

A second hook gates the commit itself: if `.flow/PROJECT.md` declares `test_fast`, that
command must pass before a commit containing source changes is allowed. It skips docs-only
commits, skips the test run for projects with no `test_fast` declared; the STATE.md check still applies. **The bypasses are for a human at a keyboard —
a loop never passes `--no-verify`:** a red `test_fast` is a defect to fix or a stop condition
to report, never a flag to add. And honours `--no-verify`,
`FLOW_SKIP_VERIFY=1` and `.flow/verify-off`. Never a
single dump commit at the end — it defeats CHECK and undo.

### Deviation

If a task turns out to be wrong or blocked: finish every other task in full, note
the deviation in STATE.md, and report it explicitly at SHIP. Do not silently
rescope — that is the user's call.

## SHIP

1. Confirm CHECK passed. If it did not, you are not at SHIP.
2. **Commit. One commit per completed task, unasked** — that is the loop's contract, and the
   general "only commit when the user asks" default does not apply inside Flow. A run that
   honours it literally commits nothing and then stops itself at wake two for having made no
   commits. If on the default branch, branch first.
   **Never push and never open a PR** — those are hard stops (`references/autonomous.md`).
3. Append to memory: decisions made, assumptions that held or broke, surprises.
   Facts only — no narration of the session.
4. Update STATE.md: mark tasks done, archive the section.
5. Report plainly: what was built, what was verified and how, what was skipped and why.

### Record the machine-stage results

Write CHECK stage 0's numbers into the archived phase block: suite counts, whether the build
succeeded, and each gate's result. `references/review.md` stage 2 compares the next phase
against them, and without a baseline that comparison silently no-ops — on the one check
designed to notice a suite that stopped running.

### Append the manifest entry

`.flow/MANIFEST.md` gets the phase's commit range, its migrations, which phases it depends
on, and whether it was self-selected. Written now, from facts in hand — reconstructed later it
is guesswork, and a phase with no manifest entry cannot be safely reverted at all.
`references/reverse.md`.

### At a milestone boundary, audit against the original intent

Roadmap exhausted, a version cut, or a run of self-selected phases ending: read what was
originally asked for against what actually shipped. Which requirements are met and by what
evidence, which were **quietly dropped**, what shipped that nobody asked for, what is still
open. Every phase gate examines one phase; a requirement can fall between all of them without
any gate being wrong. `references/milestone.md`.

### Append the release entry — before the report

If the phase produced anything that has to reach an environment — a migration, a new
environment variable, a schema change, a route, a background job — append its entry to
`.flow/RELEASE.md` now, while the facts are still in hand. `references/release.md` gives the
shape. Reconstructing a reversal plan later means reading migrations and guessing, which is
how a rollback plan becomes fiction.

An irreversible migration is stated as irreversible. The order of migrate-and-deploy is stated
with its reason. Configuration whose absence breaks something is named. If the project does
not deploy at all, say so once in that file and stop writing entries.

### The evidence ledger — end every report with it

```
Evidence: 6 by test (pass), 3 by artifact (.flow/evidence/12/), 2 by person (open).
```

Open `by person` criteria do not block a ship; **silently closing them does**. A run left
alone overnight that reports two criteria awaiting review has done its job.

### The reachability check — before any of the above

**If the phase claimed user-facing value, name the route or screen a person reaches it
through, and confirm it renders.** Not the module. Not the endpoint. The thing a human opens.

A phase whose entire output is modules, endpoints and tests has shipped **capability**, not
user value, and must say so in the report rather than claiming the goal. Write it plainly:
"the computation ships and is proven; no screen reaches it yet."

This exists because it has failed at scale. One project declared a user surface on nine
consecutive phases and shipped three page files across all of them — including a phase named
"Live Dashboards" that added twenty-four database modules and no dashboard. Every gate passed
honestly, because every acceptance criterion was a system behaviour a test could satisfy.

Two forces make this the default rather than an accident, and both need naming:

- **Acceptance criteria written as system behaviours are satisfied without a UI.** "A paid
  booking produces exactly one immutable entry" is a database module and a test.
- **The TDD gate makes backend work cheaper.** A domain module is trivially unit-testable; a
  page is not. Under a test-first rule the path of least resistance is always another module,
  so an unattended run will drift backend-ward for as long as you let it.

Neither is a reason to skip UI. They are reasons it needs a check of its own.

Then stop **re-checking** — no re-verify, no re-read, no re-summarise.

**"Stop" here means stop re-checking, not stop the run.** Under `/loop`, SHIP is not the end
of the wake: arm the next wake, or fire `stop: true` and say which condition. This is the
most-travelled path in an unattended run and the word at the end of it is the one that ends
runs by accident.

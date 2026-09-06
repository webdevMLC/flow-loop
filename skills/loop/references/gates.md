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

3. **Survey what the profile does not cover.** One batched pass for the rest:
   existing patterns, the files in play, the test command, the run command.
   Route this through the sandbox — index or grep, print only what matters.
   Delegate to a Haiku/Sonnet subagent **only** if the survey spans many files
   (guard 4); otherwise do it inline.

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

6. **Threat model, if the phase warrants it.** If it touches money, identity, other
   people’s data, or input from outside the trust boundary, read `references/threat.md` and
   write the threat register before BUILD. Every mitigation becomes a task in the list, not
   a wishlist item.

Exit FRAME when acceptance criteria are written and testable. If you cannot state
how the work will be verified, the frame is not finished.

Do **not** produce: a research report, a separate PRD, a roadmap, or a design doc,
unless the user asked for that artifact by name.

## BUILD

Goal: working code. **This is the only gate that spends frontier reasoning.**

No research here. If a fact is missing, use the assumption recorded in FRAME.
If no assumption covers it, that is a FRAME defect — record it, pick the option
most consistent with the surrounding code, and keep building.

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

### This rule is enforced, not advisory

A PreToolUse hook (`hooks/flow-tdd-gate.mjs`, shipped with this plugin) denies Write/Edit on a guarded
source file when no test anchored on its name exists anywhere in the project. Guarded
extensions: ts tsx js jsx mjs cjs py go rb php java cs. Test files, config, generated code,
migrations, scripts, markup entry points (page/layout/index) and vendored trees are exempt.

When the hook denies a write, it is telling you the RED step has not happened. Write the
test. Do not route around it.

The gate is filename-based, so it can be wrong. Two escape hatches, in order of preference:

- The file is genuinely outside TDD scope -> add its directory to `EXEMPT_DIR` in the hook.
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

One commit per completed task, message describing the behavior change. Never a
single dump commit at the end — it defeats CHECK and undo.

### Deviation

If a task turns out to be wrong or blocked: finish every other task in full, note
the deviation in STATE.md, and report it explicitly at SHIP. Do not silently
rescope — that is the user's call.

## SHIP

1. Confirm CHECK passed. If it did not, you are not at SHIP.
2. Commit or open the PR. Do this only when the user asked for it; if on the
   default branch, branch first.
3. Append to memory: decisions made, assumptions that held or broke, surprises.
   Facts only — no narration of the session.
4. Update STATE.md: mark tasks done, archive the section.
5. Report plainly: what was built, what was verified and how, what was skipped and why.

Then stop. Do not re-verify, re-read, or re-summarize.

# Non-stop mode

Opt-in. The loop keeps building after the roadmap empties, selecting its own next phase
instead of stopping. Off by default, because a run that picks its own work is a run that can
widen its own goal — this file exists to make that safe enough to be worth it.

Read `references/exhausted.md` first. This file only says what happens when its sweep runs
dry and the user has said to keep going anyway.

## Enabling

Only the user turns it on:

- **This run** — "non-stop", "keep building", "don't stop when the roadmap is done".
- **Durably** — a `.flow/nonstop` file in the project root.

Never infer it from an exhausted roadmap. Stopping is still the default ending.

## The ladder

When the roadmap is empty, work down these tiers. **Never skip a tier to reach a more
interesting one** — the order is by how little judgement each requires, and that is the
point.

### Tier 1 — work already recorded

`references/exhausted.md`'s sweep. Deferred findings, claims ticked as built but never
proven, drift between planning documents. Someone already decided this matters; you are
only scheduling it.

### Tier 2 — evidence gaps in code that already shipped

Mechanically discoverable, and none of it is new scope — it is finishing work already agreed:

- a shipped module with no test file, or a public function no test calls
- a command in `.flow/PROJECT.md` that has never successfully run
- a mutation gate the repository already has, reporting survivors
- two documents that describe the same control differently
- a dependency imported nowhere, or a file nothing imports

Prefer the gaps that sit on money, auth, or persistence. An untested helper matters less than
an unasserted ledger path, and this tier is where that judgement belongs.

**A command that needs a disposable local service is a tier 2 task, not a blocker.** If
`test:pg` has never run because no database is set, the work is *"start a throwaway Postgres,
run the suite, act on what it reports"* — propose it with the command, or run it if the user
pre-authorised local services. Falling through to tier 3 because a container was not running
is how a run reaches for new code while twenty existing suites have never executed once.
Setting up the service is the first step of the task, not a reason to abandon it.

### Tier 3 — work the authority document already specifies

**Only when the project has an authority** — a specification, a contract, a requirements
file. `references/authority.md` governs every value.

Find requirements the authority states, that no code implements, and that the blocked list
does not cover. That is not invention: the requirement was written down by a person, and you
are implementing it rather than choosing it.

With no authority document, **this tier does not exist**. Skip to the stop.

### Stop — and this one is real

End the loop when **every remaining candidate needs a person**: a licence, a partner, a
production credential, a decision, a rulebook. Not when something merely needs local setup —
check that bucket is empty first, and if it is not, either do that work or say which command
would unblock it. Say what each is waiting on and who it
needs. A budget cannot authorise work that cannot start, and non-stop does not mean
inventing work to avoid an idle report.

This is a genuine terminal condition, unlike an empty roadmap. Reaching it means the project
is blocked, not merely unplanned.

## The checkpoint — an audit that runs itself

Self-selected work accumulates without anyone seeing it. On one project it reached
**twenty-two phases and five thousand lines before a person looked**, which is not a run that
went wrong — it is this mode working as designed, and that is the defect.

The answer is not to stop and wait. A run that needs a human every third phase is not
unattended. **Every 3 self-selected phases, run a checkpoint audit automatically, and
continue if it passes.** Track the count in STATE.md as `Phases since review`. A phase
touching money, auth or data destruction triggers one immediately regardless of count.

### What the audit runs — machine first, all of it

Per-task work runs `test_fast`. The checkpoint runs what a fast loop skips, because that is
exactly where drift hides:

1. **The full suite**, not the fast one.
2. **The build.** `next build`, `tsc --noEmit`, whatever produces the artifact. Unit tests
   never catch a server/client boundary violation or a bad import, and on one project the
   build had not been run in two days of green commits.
3. **Every gate the project has** — its own consistency checkers, mutation gates, linters.
4. **The seeded-data check** from `references/review.md`: tables written and read by nothing.
5. **The evidence ledger, cumulative.** How many `by person` criteria are now open across all
   phases since the last checkpoint? They decay silently — nobody is reading them.

### Then one independent reviewer, and this is the part worth paying for

Spawn a **single agent with no memory of building any of it**, and give it the accumulated
diff, the project's stated purpose, and nothing else. Ask it three questions:

- **Is this still the project?** Self-selected phases drift. Three tiers down the ladder a run
  can be building tooling for tooling, and from inside that it looks like progress.
- **What here is most likely to be wrong?** Not largest — most likely wrong, or most expensive
  if it is.
- **What would a person be upset to discover was decided without them?**

This is the one place in the whole skill where spawning genuinely earns its cost. A builder
reviewing its own work inherits its own rationalisations; a fresh context does not. It is also
the only mechanism here capable of noticing that the loop has gone somewhere strange, which no
gate can do from the inside.

### What happens with the result

Write it to `.flow/CHECKPOINT-<n>.md` — always, pass or fail. That file is what a person
reads in the morning instead of a five-thousand-line diff.

**Continue automatically when:** the suite passes, the build succeeds, every gate is green, and
the reviewer raises nothing above MINOR. Say in the next report that a checkpoint passed and
where the file is. Reset the count.

**"Continue" means arm the next wake, in the same turn.** Writing `CHECKPOINT-<n>.md` feels
like an ending — it is a document, it is thorough, and the turn wants to stop there. It is not
an ending. A green checkpoint that does not call `ScheduleWakeup` has ended the run exactly as
surely as `stop: true` would, and left a report saying everything passed.

This has happened. Two runs on the same night wrote a fully green Checkpoint 3 and stopped —
one of them saying, in as many words, *"green, and stopping anyway"*. **A green checkpoint is
the least eventful thing that can happen. Note it, reset the count, take the next phase.**

**Stop and ask when any of these is true** — these are the things automation cannot settle:

| Trigger | Why a person |
|---|---|
| The build or a gate is red | continuing builds on a broken base |
| The reviewer raises a **BLOCKER** | it breaks a ship by definition |
| A **MAJOR that needs a decision** — see below | only the owner can choose |
| The reviewer says the work has drifted from the project | only the owner defines the project |
| Open `by person` criteria exceed 5 | judgement is piling up unjudged |
| Two checkpoints in a row raise the same finding | the loop cannot see it; stopping is the only signal left |

### A MAJOR is not automatically a stop

Stopping a night's run for a finding the loop could fix is the opposite of what this mode is
for, and the checkpoint has already said what to do with findings: *each becomes its own framed
phase*. So the question is not the severity — it is **whether the fix requires choosing
something a person owns**.

| The fix is… | Do this |
|---|---|
| making the code do what the spec, contract or existing design already says | **frame it as the next phase and continue.** Record it as arising from checkpoint N |
| deciding what the behaviour *should* be | **stop**, and state the decision in one sentence |

Two real findings from one checkpoint, to show the line:

- *"the reachability gate short-circuits on a bare route prefix, so everything after a dynamic
  segment is unchecked"* — the gate is meant to check reachability and does not. Nothing to
  decide. **Frame it and continue.**
- *"the UI never sends `highStakes`, so four controls can never engage"* — sending the field
  is trivial, but whether a teacher marks a paper high-stakes *from that screen* is a product
  decision nobody has made. **Stop and ask.**

When in doubt, stop. A wrongly-continued MAJOR compounds through every phase after it, and a
wrongly-stopped one costs a message.

**Never frame more than one checkpoint finding at a time**, and re-run the checkpoint after it
ships. A run that turns four findings into four phases without re-auditing has replaced a
review with a queue.

The distinction is honest: **the audit is automatic, escalation is not.** Everything a machine
can settle, the machine settles. What is left needs someone, and the run says so plainly
rather than deciding on their behalf.

## What must be true of every self-selected phase

The loop is choosing scope with nobody watching, so the trail has to be better than usual,
not worse:

1. **Write the phase into the roadmap before building it** — goal, why it was selected, which
   tier it came from. Before, not after. An unrecorded self-selected phase is indistinguishable
   from drift when it is read back in the morning.
2. **One phase at a time.** Archive and report each before selecting the next, so every
   morning has reviewable boundaries rather than one enormous diff.
3. **Say it was self-selected** in the report. The user must be able to tell at a glance which
   work they asked for and which the loop chose.
4. **Every existing gate still applies.** TDD, CHECK, the threat register on money and auth,
   `references/authority.md` on any specified value. Non-stop buys more phases, not looser ones.

## Never

- **Never invent capability.** A feature nobody wrote down is a product decision. Tier 3 is
  bounded by the authority document precisely so that "what should this do next" is never
  answered by the loop.
- **Never reclassify blocked work as buildable** to keep the run alive. Building ahead of a
  licence or a contract produces code nobody can certify — worse than an idle loop, because
  it looks like progress.
- **Never let a hard stop through.** Pushing, deploying, secrets, moving money, deleting data,
  a concurrent writer — all still stop the run immediately, and non-stop mode does not soften
  any of them.
- **Never cheapen the tier on money code** to get through more phases.
- **Never re-select a phase the user already declined.** Record declines under `## Decisions`
  and read them before selecting.

## The cost, stated plainly

Non-stop mode has no natural ending short of "everything is blocked". On a project with a
large specification that can be many phases and many hours of frontier reasoning. Name a
ceiling — a token budget, a wall-clock limit, or a phase count — unless you genuinely mean
"until it is blocked". This is the most expensive setting in the skill, and unlike fleet mode
it does not finish sooner; it simply does not stop.

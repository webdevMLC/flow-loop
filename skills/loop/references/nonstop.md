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

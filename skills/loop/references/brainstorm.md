# Brainstorming

Runs **before** FRAME, when the goal is not yet clear. Its output is a goal clear enough to
frame. No code, no file edits, no plan — a shared understanding of what is worth building.

## The trigger test

Ask one question of yourself before anything else:

> Can I state, in one sentence, what "done" looks like — and could someone else check it?

If yes, skip this file and go to FRAME. If no, you are here, **even if the request sounded
specific**. "Add a dashboard", "make onboarding better", "we need reporting" all sound like
instructions and are none of them a goal.

The failure this prevents is expensive and quiet: building the first plausible thing, well,
and discovering later it solved the wrong problem. No amount of TDD or review catches that.

## The rule

**Problem before solution.** When someone opens with a solution — "add a Redis cache",
"build an admin panel" — that is a hypothesis, not a requirement. Find the problem underneath
it before you evaluate it. Often the stated solution is right; you cannot know until you know
what it is for, and if it is wrong this is the only cheap moment to find out.

## Rounds — bounded, and each one narrows

**Round 1 — the problem.** Not what to build. What happens today, who it happens to, and why
it is bad enough to fix.

- What does someone do right now instead? What does that cost them?
- Who specifically hits this — how often, and what triggers it?
- What happens if this is never built? ("Nothing much" is a real and useful answer.)
- What does the request assume is true that might not be?

**Round 2 — the space.** Two or three *genuinely different* approaches, each with an honest
cost and a real reason someone would pick it. Include the cheapest thing that could work,
even when it is unsatisfying — and say plainly what each one gives up.

**Round 3 — converge.** Name the choice, the reason, and explicitly what is *not* being
built. Then state acceptance criteria someone else could verify.

Three rounds is the budget. If it is still unclear after three, the problem is not understood
well enough to build against — say so and name the specific unknown that is blocking, rather
than looping a fourth time.

## Interaction

Ask **two or three questions at a time**, not one, and not twelve. Each round's answers
reshape the next round's questions — that is why this is dialogue and not a single batch.

**This is the one exception to guard 7** (one question batch per gate). The guard exists to
stop drip-feeding questions while doing work. Here the dialogue *is* the work and the user is
present for it. The exception ends when FRAME begins.

Only ask what changes the outcome. If an answer would not alter what gets built, do not
spend the user's attention on it.

## Techniques that earn their keep

- **Ask for the last time it happened.** Concrete beats abstract. "Walk me through the last
  time this bit you" surfaces more than "what are your requirements".
- **Propose something wrong on purpose, and say so.** A concrete strawman someone can push
  against beats an open question — reactions are more honest than specifications.
- **Find the smallest thing that would prove it.** Often a fraction of the ask settles the
  real question, and the rest can wait for evidence.
- **Say what you would not build.** Scope is defined by exclusion more than inclusion.
- **Disagree when the solution does not fit the problem.** Say it once, plainly, with the
  reason. If the user reaffirms, that is their call — build it and note the concern in
  STATE.md under Assumptions.

## Output

Brainstorming is finished when you can write, and the user recognises:

- **Goal** — one sentence, checkable
- **Acceptance criteria** — testable statements
- **Not building** — explicit exclusions
- **Open questions** — with the assumption being made for each

Write those into `.flow/STATE.md` and enter FRAME. A brainstorm that ends in agreement but
produces no written goal has to be redone the moment context resets.

## Never

- **Never start building during a brainstorm.** Not a scaffold, not a "quick prototype to
  show the idea". Once code exists it anchors the discussion to itself.
- **Never offer fake options** — one real proposal padded with two obviously worse ones. If
  you have a recommendation, give it and say why, then argue the other side honestly.
- **Never agree just to be agreeable.** Unearned enthusiasm costs the user the one thing this
  gate is for.
- **Never let it run long.** Three rounds. Exploration that never converges is its own waste,
  and it is the failure mode this file is most at risk of.

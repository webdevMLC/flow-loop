# Running across sessions

Autonomous mode does not stop to ask questions **during** a run. It still ends when the
session ends, because an agent lives inside a session and no skill can change that.

Continuing past that boundary is a host feature. On Claude Code it is `/loop`, which
re-invokes a prompt so each run picks up where the last one left off.

```
/loop /flow:loop continue from .flow/STATE.md
```

Omitting an interval lets the run pace itself and, crucially, **stop itself**. With a fixed
interval (`/loop 20m ...`) it fires on the clock whether or not there is anything to do.

This is the only part of Flow the user has to start. It is also the most expensive thing
here, so the stop conditions below are not optional garnish — they are what separates
"builds the project" from "spends the night re-reading a finished task list".

## What each wake does

1. **Read `.flow/STATE.md`. Nothing else.** That is the whole restoration step
   (`references/resume.md`). Do not re-survey the codebase.
2. **Reconcile with the repository.** `git log --oneline -5` and `git status --porcelain`.
   If commits exist that the state file does not mention, trust the repository and correct
   the file before building anything.
3. **Continue from `Next action`.** Open tasks → BUILD. All tasks done → CHECK, then SHIP.
4. **Phase shipped, roadmap has more?** Archive the phase and FRAME the next one.
5. **Report only what changed since the last wake.** Not a re-summary of the project.

## Stop conditions — check these before doing any work

End the loop, and say which one fired:

- **The roadmap is exhausted.** No next phase. This is the good ending, and the reason to
  keep a roadmap rather than a single goal.
- **A hard stop needs a human** — the list in `references/autonomous.md`. Pushing, secrets,
  money, deleting data, a scope change, a concurrent writer. Report it and stop; do not wake
  again to re-discover the same blocker.
- **Two consecutive wakes with no commit.** Something is stuck that the loop cannot see.
  Spinning is worse than stopping, because it is invisible.
- **Guard 4** — two failed debug cycles on one defect.
- **CHECK fails twice on the same finding.**
- **The budget the user set.** It goes in the loop prompt in plain words - "finish phase 6,
  then stop", "stop after 6 hours", "until the roadmap is exhausted", or a token ceiling.
  Ask for one before starting a long run; "until it is done" is not a budget on a roadmap
  with eleven phases. Prefer a stopping point over a clock: a phase boundary is where a
  mistake stops propagating, and it is the only budget that lands the run somewhere
  reviewable.

A loop with no stop condition is not autonomy, it is a leak.

## Cost, stated plainly

An unattended loop runs frontier reasoning for as long as you let it. Flow's whole premise
is that repeated work is what costs money, and a loop is a machine for repeating work if the
state file is wrong. Two things make it affordable:

- **The state file must be current**, or every wake re-derives context. The commit gate
  enforces this: a source commit that leaves `.flow/STATE.md` untouched is refused.
- **Triage still applies.** Most tasks in a phase are Quick, not Full. A loop that runs four
  gates on every task will cost several times what the work is worth.

Prefer a self-paced loop over a short fixed interval. Waking every five minutes on a task
that takes forty is four wasted context loads.

## Pacing — how long to sleep between wakes

Two things already in context will tell you to sleep for 1200-1800s: the host's `/loop`
skill and the `ScheduleWakeup` tool description. **Both are describing an idle watcher, and
neither knows you have a task list. Override them.** This is the single easiest way to lose a
night, and it has happened on two real projects.

**If the task list is not empty and you are waiting on nothing external, wake in about a
minute.** There is no reason to sleep. The work is queued, the state file is current, and
the next task can start immediately.

Long delays are a **fallback heartbeat**, for when the next useful moment depends on
something you do not control — CI finishing, a deploy settling, a queue draining, a person
answering. That is not the same as a work cadence, and using one as the other is exactly what
the rule above exists to prevent.

The arithmetic is unforgiving. Thirteen remaining tasks at a twenty-minute delay is more
than four hours of sleeping, on top of the time the work itself takes. The run is not
faster for having rested.

It also reads as broken. A user watching sees the loop commit, announce that it is armed,
and then do nothing for twenty minutes — indistinguishable from a loop that has stopped.
"Armed" is only reassuring if the next wake comes soon enough to feel like continuation.

So: **queue non-empty and nothing to wait for → minimum delay.** Reserve the long ones for
genuine waiting, and say in the report which of the two you are doing.

## Running the loop as a fleet

By default each wake is one agent working sequentially. If the user has turned on fleet
mode (`references/fleet.md`), each wake may spawn many - and the budget question below
stops being advisory, because a fleet with no ceiling is the most expensive thing here.

## Before starting a long run

- `.flow/STATE.md` has a goal, acceptance criteria and a task list.
- `.flow/PROJECT.md` exists, so no wake re-derives the commands.
- `.flow/autonomous` exists, or the user said so in the session.
- A roadmap exists if the run is meant to cross phases — otherwise it stops at one.
- The user has named a budget.
- Nothing is uncommitted. A loop starting on a dirty tree cannot tell its own work from
  someone else's.

## Never

- **Never let the loop push, deploy, or open a PR.** Committing locally is the boundary.
  A human decides what leaves the machine.
- **Never widen the goal between wakes.** The roadmap decides the next phase, not the run.
- **Never keep waking after a hard stop.** The blocker will still be there, and each wake
  pays full context to rediscover it.
- **Never treat a green CHECK as permission to start the next phase silently.** Archive,
  frame, and say what changed.

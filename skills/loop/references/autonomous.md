# Autonomous mode

Opt-in. Runs the loop task after task without stopping to ask, and reports once at the end.

## Enabling

Only the user turns this on. Two ways:

- **This session** — the user says so: "autonomous", "keep going", "don't ask me", "run it
  through". A single such instruction covers the current goal, not every future one.
- **Durably** — a `.flow/autonomous` file in the project root. Its presence is standing
  consent for that project until it is deleted.

Never infer it. Impatience is not consent, and neither is a user who answered three questions
quickly. If it is not on, run the normal loop.

## The precondition — non-negotiable

**Autonomous mode requires a framed goal.** `.flow/STATE.md` must already hold a goal,
acceptance criteria, and a task list before it starts.

Brainstorming is a dialogue and cannot be done alone; FRAME's one question batch is where
ambiguity gets resolved. Running autonomously from an unclear goal does not save time, it
builds the wrong thing faster and with more commits to unwind.

So: if the goal is unclear, brainstorm and FRAME **with the user**, then go autonomous for
BUILD → CHECK → SHIP. If the user asks for autonomy before there is a goal, say that FRAME
comes first, do it, and carry straight on.

## What changes

- **Questions become assumptions.** Anything you would have asked, decide the way the
  surrounding code implies, write it under `### Assumptions` in STATE.md, and continue.
- **No checkpoints between gates.** BUILD flows into CHECK flows into SHIP.
- **Tasks run to completion**, in wave order, until the task list is done.

## What does not change

Every guard still applies. In particular:

- **Guard 4 — two debug cycles, then stop.** Autonomy does not buy a third attempt. A defect
  that survives two cycles halts the run.
- **The TDD rule.** Test-first on logic, always. Unattended code is *more* dependent on tests,
  not less — nobody is watching the output.
- **Guard 8 — no unrequested extras.** No inventing work. If it is not in the task list, it
  is not in scope; note it under Deviations and move on.
- **One commit per task.** The trail is the only thing a reviewer will have.

## Hard stops — always ask, autonomous or not

Autonomy covers *building*. It does not cover actions that leave the workspace or cannot be
undone. Stop and ask before any of:

- **Pushing, opening a PR, deploying, publishing, posting, or sending anything.** Committing
  locally is fine and expected. Anything that leaves the machine is not.
- **Force-pushing or rewriting history.** Never, under any mode.
- **Deleting data** — files not created by this run, branches, tables, migrations that drop.
- **Credentials, secrets, or keys** — reading, writing, rotating, or committing them.
- **Money** — anything that spends it.
- **Installing or upgrading dependencies** that change a lockfile the team shares.
- **Scope explosion.** If the work turns out substantially larger than framed, that is a
  changed goal, and a changed goal needs its author.
- **A concurrent writer.** Commits appearing that this run did not make means someone else is
  working. Stop and reconcile — see `references/resume.md`.

A user who says "don't ask me anything" is asking for uninterrupted *building*. Read it that
way. If they want an unattended push too, they will say so explicitly, and that is a separate
sentence from this one.

## Budget and stop conditions

The run ends — and you report — on the first of:

1. **The task list is done** and acceptance criteria are met. The good ending.
2. **A hard stop** from the list above.
3. **Two failed debug cycles** on one defect (guard 4).
4. **CHECK fails twice** on the same finding. A fix that will not take needs a human.
5. **Ten tasks completed** without a report. Long runs drift; surface, then continue if the
   user says so.

Never end a run silently, and never end one mid-task with an uncommitted working tree.

## It is not a daemon

Autonomous mode means **you do not stop to ask questions during a run**. It does not mean
the work continues after the session ends, because nothing here can make that happen: an
agent runs inside a session, and when that session ends, so does the run. Continuing needs
the host to start another one - a scheduled task, a loop command, or a person.

Continuing past that boundary is a host feature, not a skill one - on Claude Code, `/loop`.
See `references/continuous.md` for how to run across sessions, and for the stop conditions
that keep a long run from becoming a leak.

So the end of a run is a certainty to design for, not an accident. The next session begins
by reading `.flow/STATE.md` and nothing else. If that file does not say what was finished
and what is next, the next run re-derives it, and often redoes work that is already
committed.

## Keeping the trail

Nobody is reading over your shoulder, so STATE.md is the record. **Update it in the same
commit as the work**, not at the end of the run - a run that dies at task 7 must leave task
6 legible.

This is enforced. The commit gate refuses a commit that changes source when STATE.md has
not been touched in that commit or either of the last two. It applies even to projects with
no `PROJECT.md`, because state drift is not conditional on having a test command.

Per task: check it off with its commit sha. Per decision made instead of asked: one line
under Assumptions. Per surprise: one line under Deviations.

## The report

One message at the end. No preamble, no narration of the journey:

- **Done** — tasks completed, with commit shas
- **Assumptions** — every question you answered on the user's behalf, and how. This is the
  most important section; it is where they discover you guessed wrong.
- **Deviations** — what differed from the plan, and why
- **Not done** — anything skipped, and what blocked it
- **Verification** — what you ran, and the output that says it passed. Guard 3 honesty
  applies harder here: no unattended run gets to claim green without showing it.
- **Waiting on you** — the hard stop that ended the run, if one did

## Never

- **Never widen your own mandate.** Autonomy over the framed task is not autonomy over the
  project.
- **Never suppress a failure to keep going.** A skipped test, a `catch` that swallows, a
  weakened assertion — these turn an unattended run into invisible damage.
- **Never claim a pass you did not read.**
- **Never keep going after a hard stop** because the answer seems obvious. Obvious answers
  are exactly the ones that are wrong in someone else's codebase.

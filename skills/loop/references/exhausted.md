# When the roadmap runs out

An empty roadmap is not the same as a finished project. It means *the list someone wrote is
complete*, and that list was usually scoped narrowly on purpose — a set of known gaps, not
every piece of work the project will ever need.

So before the loop reports the good ending, it does one bounded sweep for work that is
**already recorded somewhere and simply not on the roadmap**. This is harvesting, not
inventing. The difference is the whole of this file.

## The sweep — one pass, five places

Read only these. Do not survey the codebase, do not re-read source you already know, and do
not open anything not named here. The whole sweep should cost less than a single task.

1. **`.flow/STATE.md`'s own deferrals.** `## Findings — not acted on`, open `Deviations`,
   and any `Assumptions` written as "decide later". The run recorded these itself, which is
   the strongest possible evidence they are real and in scope.
2. **Claims that were never proven.** A task ticked as built but marked unverified. A command
   in `.flow/PROJECT.md` that has never run because it needs an environment variable, a
   database, or a service. A suite whose skipped half reports as passing. This is the richest
   seam and the easiest to miss, because the state file often *says* "unverified" in plain
   words next to a ticked box.
3. **Drift between the planning documents.** A requirements file with unticked rows the
   phases already delivered; a progress table that contradicts its own phase list; a
   `CLAUDE.md` describing a control that no longer works that way. Cheap to fix, and it is
   what makes the next session trust the wrong document.
4. **`TODO`/`FIXME` that name a section, a ticket or a person.** One grep, source only. A
   bare `// TODO` with no referent is noise; ignore it.
5. **The blocked list, read to classify — never to schedule.** Its purpose here is to let you
   say "this one is not engineering" with a reason, so the user is not offered work no agent
   can do.

## Classify every candidate

Two buckets, and the boundary is: **could this start right now, on this machine, with what is
already here?**

| | Means | Report as |
|---|---|---|
| **Unblocked** | Everything needed is present | a task, with the command that starts it |
| **Blocked** | Needs a credential, a licence, a partner, a database, a decision | a request, naming exactly what is needed and from whom |

A blocked item is never a task. Saying "add SMS delivery" when nobody can obtain a telco
contract wastes a wake and reads as though the project is closer than it is.

## Then report — and usually stop

Report the sweep as a short menu: the unblocked candidates in value order, then the blocked
ones with what each needs. One line each. This turns "nothing to do" into a decision the user
can make in ten seconds.

**Whether you continue is the budget's call, not the sweep's:**

- Budget was **"until the roadmap is exhausted"** → the roadmap is exhausted. Report and
  stop. The sweep changes what the final report says, not whether it is final.
- Budget was **broader** — "until there is nothing left to do", "keep going until it is
  finished", "work through the backlog" → take the highest-value **unblocked** candidate,
  frame it as a phase, record it in the roadmap so the next wake can see it, and continue.
- **No unblocked candidates** → stop regardless of budget, and say what everything is waiting
  on. A budget cannot authorise work that cannot start.
- **Non-stop mode is on** (`.flow/nonstop`, or the user said "keep building") → do not stop
  when this sweep runs dry. `references/nonstop.md` continues down two further tiers and
  ends only when everything left is blocked on a human.

## Never

- **Never invent a feature.** New capability that nobody wrote down is a product decision. If
  the sweep finds nothing recorded, the answer is "nothing is left that I can start", not a
  suggestion of what the project could become.
- **Never start blocked work to look busy.** Building ahead of a licence or a contract
  produces code nobody can certify, and it is worse than an idle loop because it looks like
  progress.
- **Never re-sweep on the next wake.** Once is a diagnosis; twice is spinning. Record the
  result under `## Now` so the next session reads it instead of re-deriving it.
- **Never let the sweep grow into a survey.** Five places, one pass. If it starts costing what
  a task costs, it has become the thing it was meant to replace.

## Why this exists

A real run shipped four phases, archived the last one, and stopped with "the roadmap is
exhausted" — while its own state file said, in plain words, that every durable code path in
the repository was written and never asserted because one environment variable was unset,
and that this was "the largest single gap in the repository's evidence… one command from
closing". Twenty test files had never run. The loop was correct that the roadmap was empty
and wrong that there was nothing to do, and the user restarted it five times trying to find
out which.

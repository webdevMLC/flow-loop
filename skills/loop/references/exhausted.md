# When the roadmap runs out

An empty roadmap is not the same as a finished project. It means *the list someone wrote is
complete*, and that list was usually scoped narrowly on purpose — a set of known gaps, not
every piece of work the project will ever need.

So before the loop reports the good ending, it does one bounded sweep for work that is
**already recorded somewhere and simply not on the roadmap**. This is harvesting, not
inventing. The difference is the whole of this file.

## The sweep — one pass, six places

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
6. **Any sealed inspection report — every finding marked `open` or `blocked`, across all of
   them.** `.flow/ULTRA-*.md` (`/flow:ultra`), `.flow/DATATEST-*.md` (`/flow:datatest`),
   `.flow/SECURITY-*.md` (`/flow:security`), `.flow/UIUX-*.md` (`/flow:uiux`). An inspection
   ran and wrote down what is wrong with concrete failures — and for datatest and security a
   failing test is already committed, so the suite is red until it closes. Those are the
   best-specified candidates that will ever reach this sweep, each one an acceptance criterion
   with the outcome flipped. **Read only the status lines.**
   `fixed`, `wont-fix` and `stale` are settled and never re-proposed. **`blocked` is not
   settled** — it is the value repair reserves for findings that needed a decision, a
   credential, a migration or a correction script someone had to run, so re-offer it here with
   what it is waiting on and let the classification below decide whether that is still true.
   If a report exists and every finding is `open`, the repair pass never ran: say so, because
   reporting "the roadmap is exhausted" over an unread inspection is the worst ending this file
   can produce.

## Re-test every blocker before you classify it

**A recorded blocker is a claim about the world at a past moment, not a fact.** Phases keep
shipping after it was written, and the commonest way this sweep reports a false ending is by
reading a stale label and believing it.

So for each blocked item, spend one cheap check on the specific thing it is waiting for: does
that route exist now, is that function reachable, did a later phase build the screen it needed?
One grep or one file read each — this is not a re-survey, and guard 2 does not forbid it,
because you are not researching the same question twice: you are asking whether an old answer
still holds.

A real instance, from a project that reported itself blocked on a person: a phase halted
because no manager could resolve a wrongly-merged claim. Four phases later the release function
shipped **with a route and a form**. Nothing re-checked, the label stayed, and the run reported
everything remaining as needing a human while the work was sitting there unblocked.

**If the blocker has cleared, it is a task — say which phase cleared it.** If it has not, then
classify it below.

## Classify every candidate

Three buckets. The distinction that matters is not "is something missing" but **who can
supply it** — and a disposable service on localhost is not the same kind of missing as a
banking licence.

| | Means | Report as |
|---|---|---|
| **Unblocked** | Everything needed is present | a task, with the command that starts it |
| **Needs local setup** | A throwaway service, fixture or env var the loop could create itself — a test Postgres, a Redis, a seeded schema | **not terminal.** Propose it with the exact command; act only if pre-authorised |
| **Needs a person** | A licence, a partner, a contract, a production credential, a decision only a human can make | a request, naming what is needed and from whom |

**Do not collapse the middle bucket into the last one.** That mistake makes a project look
finished when it is one `docker run` from twenty test files. If the only thing standing
between you and a candidate is a disposable local service, the candidate is *work*, and the
setup is the first step of it.

**The line inside the middle bucket:** disposable and local is fine — a container on
localhost, a scratch schema, an env var pointing at either. A **production** credential never
is. `TWILIO_MODE=live` or a real `DATABASE_URL` for a deployed system belongs in the last
bucket no matter how easy it would be to set.

**Pre-authorising it.** Starting a service touches the machine, so the default is to propose
and wait. The user can lift that for a run by saying so, or with a line in `.flow/nonstop`:

```
allow local services
```

With that present, the loop may start disposable local services itself, and must say in the
report exactly what it started and how to remove it.

A last-bucket item is never a task. Saying "add SMS delivery" when nobody can obtain a telco
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
- **Never let the sweep grow into a survey.** Six places, one pass. If it starts costing what
  a task costs, it has become the thing it was meant to replace.

## Why this exists

A real run shipped four phases, archived the last one, and stopped with "the roadmap is
exhausted" — while its own state file said, in plain words, that every durable code path in
the repository was written and never asserted because one environment variable was unset,
and that this was "the largest single gap in the repository's evidence… one command from
closing". Twenty test files had never run. The loop was correct that the roadmap was empty
and wrong that there was nothing to do, and the user restarted it five times trying to find
out which.

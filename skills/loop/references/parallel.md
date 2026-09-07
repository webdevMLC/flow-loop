# Parallel work inside a phase

Tasks that do not depend on each other should not wait for each other. This is how to run
them at the same time without the two failure modes that make it worse than serial: agents
overwriting each other, and agents building against a contract that is still moving.

## Two tiers

**Tier 1 — batching. Free, on by default.** Independent operations go in one message:
reads, greps, test runs, edits to different files. No extra context, no agents, no
coordination. Most of the wall-clock win in a normal phase is here, and it costs nothing.

**Tier 2 — concurrent agents. Opt-in, and the cost depends on what you delegate.** One
background agent per task, running at the same time, each carrying its own context, prompt
and report. Delegate work whose context you are already holding and you pay for the same
reading twice, plus the brief and the report. Delegate self-contained work against a frozen
contract and the agent absorbs reading you never have to do at all. It buys wall-clock
either way. Use it when the wait is real and the reading genuinely moves off your plate —
see the test below.

Do not reach for tier 2 to avoid a wait that tier 1 already removes.

**Tier 3 - fleet mode.** When the user explicitly accepts the cost to finish sooner, the
gates below relax and worktree isolation lets tasks that share files run at once. That is
an opt-in mode with its own rules: `references/fleet.md`. It does not change what is
serial - it changes what you are willing to pay to parallelise what is not.

## When to spawn

All four must be true. Any one false → do it inline.

1. **Three or more tasks** are ready at once.
2. **Delegating is context-positive.** Two questions, both must be yes:

   - **Can the task be briefed in a short paragraph**, against a contract that is already
     committed? If explaining it means walking the agent through half the module, the brief
     is expensive *and* the agent still has to read everything itself.
   - **Would doing it inline force you to load context you do not already hold, and will not
     reuse?** If yes, delegating moves that reading out of your window for good — the agent
     absorbs it and returns a summary you can act on.

   The common mistake is the inverse: delegating work whose context you are **already
   holding**. The agent re-reads what you have, you pay for the same bytes twice, and you
   pay for the brief and the report on top.

   Line and file counts are a bad proxy for this. A self-contained 150-line task against a
   frozen interface is worth delegating; a 400-line task that needs an understanding of how
   the rest of the module fits together is not — that understanding is the expensive part,
   and it does not transfer in a brief.

   Guard 5 still applies as a floor: never spawn for work you could do in a couple of edits,
   however self-contained it looks.
3. **File sets are disjoint.** No two concurrent tasks may write the same file. Check this
   against the plans, not from memory.
4. **The contract is frozen.** See below.

## Wave 0 — the contract comes first

Anything more than one task depends on is its own wave, alone, first:

- schemas, migrations, DDL
- shared types and interfaces
- barrel files and public exports
- config that other tasks read

Only when wave 0 is committed do parallel tasks spawn. This is the rule that makes the rest
work: agents cannot negotiate with each other, so anything they would have needed to agree on
must already be settled.

**If two tasks would need to renegotiate mid-flight, they are one task.** Merge them and run
them serially. The urge to "just coordinate as we go" is the signal that the contract was not
actually frozen.

## Computing the waves

From the task list in `.flow/STATE.md`, for each task note the files it will modify. Then:

- Tasks whose file sets overlap **must** be in different waves, ordered by dependency.
- Tasks with disjoint file sets and no dependency go in the same wave.
- A wave finishes entirely before the next begins.

Worked example — a ledger phase whose tasks touch:

```
T1  ledger.ts, pg-ledger.ts, ddl.sql
T2  statements.ts
T3  ledger.ts, pg-ledger.ts, statements.ts
T4  statement-issuer.ts, customer-store.ts, ddl.sql
T5  tools/hooks/pre-commit
```

T1∩T3 on `ledger.ts`. T2∩T3 on `statements.ts`. T1∩T4 on `ddl.sql`. Only T5 is disjoint from
everything. So this phase is **almost entirely serial** — T5 can run alongside any of them,
and nothing else can pair. Discovering that up front is worth more than discovering it
through a merge conflict.

Most phases look like this. Expect less parallelism than you hoped for.

## Briefing an agent

Each agent gets, explicitly:

- its **task** and acceptance criteria
- the **exact files it owns** — and that it must touch nothing else
- the **frozen contract** it builds against (types, schema, signatures already committed)
- the **test command**
- test-first is mandatory for logic, same as always

And it returns: what it changed, what it ran, the output proving it passed, and any
assumption it made. It does **not** get told about sibling tasks — it cannot act on them, and
knowing invites it to guess.

## Commits are serialized

**Agents do not commit.** Concurrent `git commit` races on the index lock, and a half-written
commit from a crashed agent is worse than no commit.

Agents do the work; the orchestrator commits each completed task in order, one commit per
task, after that agent reports. Parallel work, serial history.

For long-running tracks that would otherwise hold the tree hostage, give the agent its own
worktree and merge on completion — but the same rule applies: one merge at a time.

## When a wave finishes

- Run the test suite **once**, for the whole wave, not once per task.
- If it fails, the failure belongs to the wave. Find which task caused it before fixing —
  `references/debug.md` applies, and guard 4 still caps you at two cycles.
- Update STATE.md with every task's status before starting the next wave. A wave boundary is
  a safe stopping point; mid-wave is not.

## Never

- **Never let two concurrent tasks write the same file.** Not "carefully", not "different
  functions in the same file". Different files or different waves.
- **Never spawn against an unfrozen contract.** You will get two plausible, incompatible
  implementations and pay to reconcile them.
- **Never spawn to look busy.** Three agents on three trivial tasks is slower than doing them
  inline, and costs three times as much.
- **Never let an agent commit, push, or merge.** The orchestrator owns history.
- **Never assume a sibling succeeded.** Wait for the report.

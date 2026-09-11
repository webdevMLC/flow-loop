---
name: loop
description: The single development loop — PLAN once per project, then FRAME, BUILD, CHECK, SHIP per phase — replacing separate memory, planning, context, TDD, debugging and review frameworks with one protocol, and enforcing the rules that matter with hooks rather than instructions. Use for any real feature, fix, refactor, migration, debugging session, or milestone in a project codebase, and equally when the request is still vague and needs shaping before anything gets built. It sizes the task first, fixes the phase order, routes each kind of work to the cheapest model tier that can do it, enforces hard loop guards against repeated research and re-verification, and keeps one state file per project. Can run autonomously without asking when the user explicitly opts in. Not needed for one-off questions or throwaway scratch scripts.
---

# Flow

One loop. Five stages. The rules that matter are hooks, not sentences.

This skill replaces the separate memory / milestone / context / TDD / debugging / review
layers. Do not also run another framework's phase commands or a separate review pass on top
of it — that duplication is the cost problem it solves.

## What is enforced, and what is only written down

An instruction an agent may not read at the right moment is not a rule. These are hooks —
they deny the action, and no prose can talk past them:

| Enforced by a hook | How |
|---|---|
| **No code until PLAN has produced a project skill** | Write/Edit to source is denied while `.flow/STATE.md` exists and no `.claude/skills/*/SKILL.md` carries `flow-project-skill: true` |
| **No code until the owner confirmed the plan** | denied until `.flow/plan-confirmed` holds the skill's hash. **The loop is denied from writing that file.** The owner does, after reading the flows |
| **PLAN drew what you confirmed** | source writes are denied until `.flow/plan/index.html` exists, and `.flow/plan-confirmed` certifies **both** the skill and the drawing — redraw a screen and the confirmation goes stale |
| **A redesign is applied only after the owner saw it** | while `.flow/uiux/pending` names a capture set the owner has not confirmed in `.flow/uiux-confirmed`, source writes are denied and the marker cannot be deleted — `/flow:uiux` shows the designed screens as images, before and after, and waits |
| **Every acceptance criterion cites the plan** | `git commit` is denied if any criterion in the current phase lacks `from:` |
| **Test-first on logic** | Write/Edit to a guarded source file with no covering test is denied |
| **The state file keeps up** | `git commit` is denied if source changed and `STATE.md` did not, three commits running |
| **Never push** | `git push` is denied unless `.flow/allow-push` exists — another file the loop cannot create |
| **Judgement does not pile up** | source writes are denied past 5 open `by person` entries in `.flow/UAT.md` |
| **A closed `by artifact` criterion has its artifact** | `git commit` is denied when a criterion ticked done and classed `by artifact` names a file that is not on disk — this is what makes SHIP’s data pass and the screen audit mechanical |
| **Verification is tiered, not uniform** | a `Workflow` script that spawns a literal number of verifiers per finding is denied — BLOCKER up to 3 sequential, MAJOR 1, MINOR 0. Three measured runs spent 48, 61 and 155 agents ignoring the prose version of this rule |
| **The record cannot be deleted** | `rm -rf .flow`, `rm .flow/STATE.md`, `git clean -fdx` and their PowerShell and `git rm` spellings are denied — deleting the record does not suspend the rules, it makes four of them fall silent |

Everything else in this file and its references is **discipline** — followed because it is
read, and it is written to be read at the moment it applies. Where a rule below is discipline,
it says so. The twelve above are not.

**They constrain actions, not judgement.** A hook can stop a file being written. It cannot stop
the *wrong* file being written: the citation gate checks that `from:` resolves to a real
heading, never that the criterion actually serves it. That is why PLAN ends with the owner
looking at pictures of the screens rather than a hook checking the plan.

## Before anything else

**If `.flow/STATE.md` exists, read it first.** That one read is the whole context restoration
step — goal, task list, decisions, assumptions, what was deliberately excluded. It applies to a
new request as much as to an obvious resume.

**If a project skill exists — `.claude/skills/<project>/SKILL.md` — it is the authority on
what this product is**, in the owner's own words, confirmed by them. Read it before framing
anything. If none exists and the work is Full, **run `/flow:plan` first**; the plan gate
will deny source writes until it has run and the owner has confirmed its output.

**If there is no `.flow/` directory, the project has not adopted Flow.** Nothing is enforced
until it does. On a Full task, PLAN creates it, in existing mode: its survey is about what is
*already true* — the test command, the conventions, the analog files, which directories hold
legacy code nobody will retrofit tests for — recorded in `.flow/PROJECT.md` and
`.flow/tdd-exempt` so no later wake re-derives them.

**If `.flow/UAT.md` has open entries and you are talking to a person, run that session
first** — `references/uat.md`. Ten minutes of specific questions with the artefact attached;
the only thing that closes a `by person` criterion. Past five open entries the plan gate
stops source writes, so the queue cannot grow unread the way it did on two real projects.

## Triage first — this is where the speed comes from

| Size | Looks like | Path |
|------|-----------|------|
| **Direct** | a question, a typo, a rename, a one-line fix, reading code | Just do it. No stages, no state file. |
| **Quick** | one file, requirement already clear, no new interface | BUILD → SHIP. Still test-first if it is logic. |
| **Full** | several files, a new interface, money/auth/data, or more than you can hold in your head | FRAME → BUILD → CHECK → SHIP, against a project skill. |

Running the Full loop on Direct work is the most expensive mistake available here. When torn,
pick the smaller and escalate.

Size is not clarity. If you cannot state what "done" looks like in one checkable sentence, the
goal is not ready to build against **at any size** — `references/brainstorm.md`, with the
owner, before anything else.

**The TDD, plan and commit gates fire on every task, including Direct and Quick.** "No stages"
means no FRAME/CHECK/SHIP ceremony, not that a denied write can be worked around.

## The loop

```
PLAN  ───────────────────────────────────────────────┐   once per project,
                                                     │   and at every milestone
   FRAME  ->  BUILD  ->  CHECK  ->  SHIP  ───────────┘   per phase
     ^                     │          │
     └─────────────────────┴──────────┘
       a failure that changes the goal re-frames; one that reveals the plan was wrong re-plans
```

| Stage | Produces | Model tier | Hard budget |
|-------|----------|-----------|-------------|
| **PLAN** | the project skill, confirmed by the owner | frontier, concurrent experts | once per project or milestone — **never per phase** |
| **FRAME** | goal + cited criteria + task list in `.flow/STATE.md` | cheap / inline | 1 recall + 1 survey + 1 question batch |
| **BUILD** | working code + tests | **frontier** | no research; assumptions already fixed |
| **CHECK** | one verdict report | machine first, then cheap subagents | 3 gating stages; the adversarial pass only when the phase earns it |
| **SHIP** | commit + data pass + memory write | inline, then one disposable-DB run | 1 pass |

Every task commit carries its own `.flow/STATE.md` update — the commit gate enforces it.
**No code is written outside BUILD. No research is done inside BUILD.**

### PLAN — once per project

Five experts on the *intent*, concurrently — researcher, system architect, systems engineer,
dataflow and process specialist, UI/UX — the same shape as CHECK's adversarial pass, pointed at
what the owner asked for rather than at a diff. Every other stage proves code matches its
criteria; **this is the only one that can see the criteria were for the wrong product.**

It starts with the owner's words, quoted verbatim, before any research. It draws the process
flow — who does what, in what order, and where they see the result — and **shows it to the
owner before anything is built.** It puts the three-to-seven shape-changing decisions to them,
and those stop and ask **even under a standing autonomous mode.** Then it writes the project
skill, and the owner confirms it. The plan gate holds every source write until they have.

It draws every flow, **designs every screen a job lands on and captures it as an image** —
in the project theme, with real content, not grey boxes — publishes them as an artifact,
and the owner confirms from *that* — the picture that would have shown a tournament with
nowhere to appear. Runs at a new project, an adoption, a milestone or module boundary — a
feature large enough to get its own research document is one — or when the owner says the
result is not what they wanted. **Invoke it: `/flow:plan`.**

### FRAME — audit the plan, then frame the phase

FRAME no longer decides what the product is; PLAN did. FRAME's first job is to **audit the
project skill for this phase's slice**: a job with no read surface after its create, a
"mirrors X" claim never enumerated job by job, a state with no exit, a value the business owns
that only a migration can change. Gaps go back into the skill — shape-changing ones to the
owner, the rest as corrections with the date — and *then* the phase is framed against it.

Every criterion cites the skill section or intent line it serves — `from:` — and the commit
gate refuses a phase whose criteria cite nothing. That is what stops a correct phase being the
wrong phase. Then the survey, the analogs, the authority register, the threat model, the gap
pass and the plan review, per `references/gates.md`.

### BUILD

Against the frame, test-first for logic, matching the analog FRAME named. The standard is
not "act as the best engineer" — it is a set of checks: the analog's error handling and naming
are followed, every branch a criterion names has a test that fails without it, no value the
authority decides is typed by hand, nothing the frame did not ask for. `references/gates.md`.

**A frame that turns out wrong mid-BUILD stops the work.** A missing fact becomes an
assumption; a *false* one does not. Re-frame a wrong task before writing its code, and stop the
phase outright when a criterion rests on a false premise. Two re-frames in one phase means the
frame was wrong — stop.

### CHECK — three stages on most phases, five when it matters

Machine (build, **the affected tests plus `test_fast` — not the whole suite**, every project
gate, and **read what it prints**: exit code 0 is not clean output), contract (the authority
re-read, not just the criteria), composition (is the new code reachable, called, read; **do the
rows it writes hold the right values**; the screen audited if a criterion names one), verdict.

**The adversarial pass and the full suite are not per-phase work.** They run when the phase
touches money, auth, PII or outside input, at a milestone, or when stage 2 found something —
and otherwise they belong to `/flow:ultra`, which inspects the system as built and repairs
what it finds. A per-phase adversarial pass re-proves the same code every phase and is the
largest recurring cost in the loop. `references/review.md`.

**Every acceptance criterion says how it will be proven** — `by test`, `by artifact`, or
`by person`. Unmarked means `by test`, and that default is how a system passes every gate
while being unusable. `by person` criteria get a prepared question in `.flow/UAT.md` the loop
never answers itself. **If a phase claims a person will see something, one criterion names the
screen**, and the capture at desktop and 375px is what closes it. `references/evidence.md`.

### SHIP — the data pass, then hand it over

Before the commit that closes **a milestone** — not every phase: **drive the project skill's
core flows end to end against a disposable database and read the rows.** Not this phase's
writes; CHECK reads those every time. The *product's* flows, as the skill names them, to prove
the milestone did not break the thing the owner is going to test. A failure sends the phase
back to BUILD. On an ordinary phase this is one line: what this phase wrote, read back.
`references/gates.md`.

Then commit, the manifest entry, the release note if the phase produced a migration or config,
the status line if the phase resolved an inspection finding, and memory. Committing locally is
the boundary — the push gate makes that mechanical.

## Loop guards (non-negotiable)

Repeated work, not model choice, is what burns the budget.

1. **Size before you start.** An unsized task defaults to over-ceremony.
2. **One research pass per gate.** Not found → record the assumption and proceed. Never search
   twice for the same fact — but re-testing whether an *old answer still holds* is not
   searching twice (`references/exhausted.md`).
3. **A passing check is final.** Never re-run a check that passed unless the code changed.
4. **Two debug cycles, then stop.** No silent third attempt. `references/debug.md`.
5. **No subagent below the spawn cost.** ≤3 files or ≤200 lines is done inline.
6. **Never re-read what is already in context.** Read a file only when about to edit it.
7. **One question batch per gate.** The exceptions: brainstorming, and PLAN's decisions —
   both are dialogues, and both end when FRAME begins.
8. **No unrequested extras.** No docs, changelogs, formatting passes, or refactors not asked for.

| Thought | Reality |
|---------|---------|
| "Let me double-check that passed test" | Guard 3. It passed. |
| "Let me re-read the file to be sure" | Guard 6. It is in context. |
| "One more search for context" | Guard 2. State the assumption. |
| "I'll spawn an agent to read these two files" | Guard 5. Read them. |
| "Let me also tidy up while I'm here" | Guard 8. Not asked. |
| "Third try will fix it" | Guard 4. Surface it. |
| "This needs a proper plan" (for a typo) | Guard 1. It needs a keystroke. |
| "This sounds clear enough to skip PLAN" | It sounded clear on two projects that shipped the wrong product. The gate decides, not the feeling. |

## Token discipline (ambient, all stages)

- **Analyze in the sandbox, not in context.** Filter, count and parse through
  `ctx_execute_file` / `ctx_batch_execute` where present, else the shell; print only the
  conclusion. Raw bytes must not enter the conversation.
- **Read is for editing.** Use `Read` only when the exact bytes are needed to edit.
- **Batch independent calls** into one message — always.
- **Artifacts go to files.** Return a path plus one line — except PLAN's process flow and the
  conflict reports of `/flow:theme`, which go in the message in full, because a report answered
  without being opened is no report.
- **Compact at stage boundaries only**, never mid-stage.

## Protocols — load only when you reach them

| Situation | Read |
|-----------|------|
| The goal is not clear enough to state | `references/brainstorm.md` |
| No project skill exists; an adoption; a milestone; or the result was not what the owner wanted | **`/flow:plan`** — `references/plan.md` says how |
| Entering FRAME / BUILD / SHIP | `references/gates.md` |
| The phase implements something a contract or spec already decided | `references/authority.md` |
| The phase touches money, auth, PII, or outside input | `references/threat.md` |
| Entering CHECK | `references/review.md` |
| A bug, test failure, or unexpected behavior | `references/debug.md` |
| Resuming, or context about to compact | `references/resume.md` |
| Running phase tasks concurrently | `references/parallel.md` |
| The user wants many agents at once, and accepts the cost | `references/fleet.md` |
| The user has asked you to run unattended | `references/autonomous.md` |
| Running under `/loop`, or waking from one | `references/continuous.md` |
| Writing acceptance criteria, or closing one | `references/evidence.md` |
| SHIP, when the phase produced a migration or config | `references/release.md` |
| Leaving FRAME on a Full phase | `references/planreview.md` |
| A hook denied a write, a commit or a push | `references/gates.md` |
| CHECK, when the phase touched a screen | `references/uiaudit.md` |
| CHECK, when the phase writes anything persistent | `references/dataflow.md` |
| Undoing a shipped phase | `references/reverse.md` |
| A milestone or roadmap boundary | `references/milestone.md` |
| Before a pilot, or nobody can say who runs this at 2am | **`/flow:ops`** |
| `.flow/UAT.md` has open entries and the user is back | `references/uat.md` |
| The roadmap has no next phase, or FRAME asks what the last phase left open | `references/exhausted.md` |
| The user said to keep building past the roadmap | `references/nonstop.md` |
| State file, project profile and project skill formats | `references/state.md` |

## Autonomous mode

Off by default. **Only the user turns it on** — "autonomous", "keep going, don't ask", or a
`.flow/autonomous` file. Never infer it from impatience.

It needs a confirmed plan first: PLAN and brainstorming are dialogues and cannot be done
alone. Then BUILD → CHECK → SHIP runs unattended; questions become recorded assumptions, every
guard applies, and anything that leaves the machine or cannot be undone still stops — the
push gate and the owner-only files make the two that matter most mechanical.
`references/autonomous.md`.

### Pacing a `/loop` run — before every `ScheduleWakeup`

`/loop` and `ScheduleWakeup` both suggest **1200–1800s**. Those describe an idle watcher
polling an external event. A Flow loop with an open task list is not idle, so **this rule
overrides that default.**

**An open `by person` criterion is not something you are waiting on** — it is prepared and
left open. A hard stop is `stop: true`, not a sleep. This loop never deploys, so "waiting on a
deploy" is almost never true.

**"Idle tick" is the tool's phrase, not your situation.** A wake with a phase to frame or a
task to start is queued work. One run armed 1800s with the reason "nothing pending in the
background; idle tick to frame Phase 72" — naming the queued work inside the sentence
explaining why it was idle. If the task list or the roadmap has anything at all, this is not an
idle tick.

| Situation | `delaySeconds` |
|---|---|
| Tasks remain, nothing external pending | **60** |
| Genuinely waiting on CI, a queue, or a person you cannot proceed without | match the wait |
| A phase just shipped and another is queued or selectable | **60** — an empty list between phases is not an ending |
| Task list empty, **no next phase, and non-stop is off** | do not sleep — `stop: true` and report |
| A genuine stop condition fired | `stop: true` and say which |

**Empty between phases is not empty.** Two runs on one night ended themselves with eleven
phases available, one saying "green, and stopping anyway". Before stopping on an empty list,
check the roadmap and, in non-stop mode, the ladder.

**A green checkpoint is not an ending.** If every gate passed and the reviewer raised nothing
above MINOR, **arm the next wake in the same turn.** A green checkpoint that does not call
`ScheduleWakeup` has ended the run as surely as `stop: true`.

### Stop conditions — check at the top of a wake, before any work

End with `stop: true` and say which fired:

1. **The roadmap is exhausted.** First run `references/exhausted.md` — re-test every recorded
   blocker (a blocker is a claim about a past moment), then one bounded sweep over six places
   work is already recorded — and `references/milestone.md`. Report; then stop, unless the
   budget was broader than the roadmap.
   **If non-stop is on** — `.flow/nonstop`, or "keep building" — work the ladder in
   `references/nonstop.md` and end only when every remaining candidate is blocked on a human.
   Record each self-selected phase in the roadmap *before* building it. **Every 3 self-selected
   phases run the checkpoint audit** and continue if it passes; a MAJOR that means "make the
   code do what the spec says" is the next phase, one that means "decide what it should do"
   stops.
2. **A hard stop needs a human** — pushing, deploying, secrets, money, deleting data, a scope
   change, a concurrent writer, a PLAN decision. Report it; do not wake again to rediscover it.
3. **Two consecutive wakes with no commit.** Spinning is invisible; stopping is not.
4. **Guard 4** — two failed debug cycles on one defect.
5. **CHECK fails twice on the same finding.**
6. **The budget the user set**, in their own words.

Report only what changed since the last wake. **A wake that finishes a phase archives it and
reports before touching the next** — and continues only if the budget reaches past this phase.
The roadmap decides *which* phase is next; the budget decides *whether* there is one.

## Memory

At FRAME start, recall once: `claude-mem-cowork:mem-search` if installed, else
`ctx_search(sort: "timeline")`, else `.flow/MEMORY.md`. At SHIP, append decisions and
surprises. Honor `<private>` — never persist anything inside those tags.

## When the loop is not enough

**`/flow:ultra`** inspects the system **as built** — runs it from a clean checkout, drives real
flows against a real database and reads the rows, reviews the code through independent lenses
— then, once its report is sealed, **repairs what it found**, each finding handed back here as
a phase. On by default; "report only" stops at the report. Reach for it before a pilot, after
a long unattended run, or when the suite is green and nobody is convinced.

**`/flow:theme`** surveys the interface a project has, reports what a theme would break before
touching a file, then applies one — tokens, components, and the law that keeps it from
decaying — writing that law into `.flow/PROJECT.md` § Design standard, which CHECK enforces on
every screen afterwards.

**`/flow:guide`** writes the user guide from the running system, in the reader's language,
laid out for print. Whatever it could not reach becomes a `by person` entry in `.flow/UAT.md`.

**`/flow:datatest`** drives every flow through the UI and the API against a disposable
database with seven QA testers — boundary, adversarial input, duplicate, concurrency, state,
cross-module, money — reads the rows, and **leaves a failing test per confirmed defect** so
it cannot come back silently. Then the loop repairs them.

**`/flow:uiux`** is a design-architect audit: six specialists critique the screens as built
against concrete failing conditions, then **design what each should become, capture it as an
image beside what is there now, and wait for you to confirm** — the gate holds source closed
until you have. It decides what the screens *are*; `/flow:theme` decides how they look.

**`/flow:security`** attacks the running system with six specialists — auth, access control,
injection, secrets, business logic, supply chain — **proves each hole with a working exploit**
against a disposable copy, locks it with a regression test, then the loop fixes it. Never
production, never exfiltrates.

**`/flow:ops`** makes the system runnable by someone other than its author: the runbook written
from symptoms and **verified by following it**, a health check that checks something, three to
six alerts that each have an owner and a procedure, a deploy **and a rollback both performed**,
a backup **restored and the rows read**, and a load test that finds the limit. The loop never
deploys, so everything after the commit used to be outside it — this is that half.

All five — `ultra`, `datatest`, `uiux`, `security`, `ops` — seal a report first and repair
through the loop afterwards, on by default; "report only" stops at the report. All run against
a disposable environment, never production, and none of them deploys.

## Scope

Use Flow for real project work. Skip it for a question, a scratch script, or an explanation.

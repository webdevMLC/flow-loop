# Flow

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FwebdevMLC%2Fflow-loop%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&color=blue)](https://github.com/webdevMLC/flow-loop/blob/main/.claude-plugin/plugin.json)

One development loop for Claude Code. PLAN once per project, four stages per phase, hard loop
guards — and **the rules that matter enforced by hooks**, not politely suggested.

It replaces the practice of stacking separate memory, planning, context, TDD and review
plugins on top of each other — expensive twice over: every plugin's skill listing loads into
every session, and every extra command is another round trip in a conversation that re-sends
itself each turn.

```
PLAN  ────────────────────────────────────────────┐   once per project, and at milestones
   FRAME  ->  BUILD  ->  CHECK  ->  SHIP  ────────┘   per phase
     ^                     │          │
     └─────────────────────┴──────────┘
       a failure that changes the goal re-frames; one that shows the plan was wrong re-plans
```

## Install

```
/plugin marketplace add https://github.com/webdevMLC/flow-loop.git
/plugin install flow@flow-loop
```

Use the full URL with `.git` — the `owner/repo` shorthand reports "Unable to load plugin".
Restart the session so the hooks load, then say what you are building:

```
/flow:loop add refund handling to the ledger
```

**Installing changes nothing on its own.** All three hooks stay dormant until a project has a
`.flow/` directory, so untouched repositories behave exactly as before. They are wired on
Write, Edit, Bash and PowerShell.

---

# Everything you can run

## Commands

| | Does | Reach for it |
|---|---|---|
| **`/flow:plan`** | five experts on the intent, the flows drawn, **every screen designed and captured as an image**, the project skill written — **you confirm from the pictures** | a new project, an adoption, a milestone, or "this is not what I wanted" · [detail](#flowloop) |
| **`/flow:loop`** | the loop — FRAME, BUILD, CHECK, SHIP, against the plan | all normal work · [detail](#flowloop) |
| **`/flow:ultra`** | inspects the running system, then repairs what it finds — **and owns the full suite, the adversarial lenses and the whole-product data pass that CHECK no longer runs every phase** | before a pilot; at a milestone; when the suite is green and you are not convinced · [detail](#flowultra) |
| **`/flow:theme`** | applies a theme **and rebuilds the components** | screens that look dated, or were built ad hoc · [detail](#flowtheme) |
| **`/flow:guide`** | writes the user guide from the running system | it is going to real users · [detail](#flowguide) |
| **`/flow:datatest`** | seven QA testers drive every flow, leave a failing test per defect | data looks wrong; before a pilot; the suite is green and the product is not |
| **`/flow:uiux`** | a design architect redesigns the screens — **designed and captured as images, before and after, and you confirm before anything is applied** | screens look dated or amateur; "make it modern" |
| **`/flow:security`** | six specialists attack the running system and prove each hole | before exposing it to real users or the internet |
| **`/flow:ops`** | runbook, health checks, alerts, a proven rollback and restore, a load limit | before a pilot; when nobody can answer "who runs this at 2am" |

## Running it unattended

| Mode | Turn it on | What it does |
|---|---|---|
| **Autonomous** | say "autonomous" / "keep going, don't ask", or `.flow/autonomous` | stops asking during a run; questions become recorded assumptions. Covers *building* only |
| **Trust judgement** | `.flow/uat-trust`, or autonomous, which implies it | the loop answers the `judgement` questions in `.flow/UAT.md` itself — wording, defaults, empty states — against a named standard, and records the reasoning. `owner` questions still wait for you |
| **Overnight** | `/loop /flow:loop continue from .flow/STATE.md — budget: …` | survives past one session. **Omit the interval** — self-paced can stop itself |
| **Non-stop build** | say "keep building", or `.flow/nonstop` | **keeps going after the roadmap is empty.** [detail](#non-stop-build) |
| **Local services** | `allow local services` inside `.flow/nonstop` | may start a throwaway Postgres etc. rather than declaring itself blocked |
| **Fleet** | "fleet mode, budget 400k", or `.flow/fleet` | many agents at once in isolated worktrees. Needs ≥1.6M · [detail](#fleet-mode) |

```
/loop /flow:loop continue from .flow/STATE.md — keep building past the roadmap
/loop /flow:loop continue from .flow/STATE.md — fleet mode, budget 400k
/loop /flow:loop continue from .flow/STATE.md — budget: finish phase 6, then stop
```

**It never pushes, opens a PR, or deploys.** Committing locally is the boundary, in every mode.

## Control files

Everything Flow reads or writes lives in `.flow/`. Create the switches yourself; the rest are
written for you.

| File | | |
|---|---|---|
| `STATE.md` | written | goal, criteria, task list, decisions — read at the start of every session |
| `PROJECT.md` | written | commands, conventions, analogs, **design standard**, user guide location |
| `autonomous` | **switch** | stop asking during a run |
| `nonstop` | **switch** | keep building past the roadmap |
| `fleet` | **switch** | many agents at once |
| `tdd-exempt` | **switch** | one path fragment per line — code genuinely outside TDD |
| `plan-confirmed` | **owner only** | the hash of the project skill you read and approved — the loop is denied from writing it |
| `allow-push` | **owner only** | opens the push gate for a session — the loop is denied from writing it |
| `plan-off` · `cite-off` · `tdd-off` · `verify-off` · `evidence-off` · `fanout-off` · `uiux-confirmed` · `blockers-off` · `uat-trust` · `uat-ceiling` | **owner only** | every escape hatch — the loop is denied from creating any of them, by any tool |
| `UAT.md` | written | `by person` questions waiting for you |
| `ULTRA-<date>.md` · `DATATEST-` · `SECURITY-` · `UIUX-` · `OPS-` | written | a sealed inspection, its findings and their status — the roadmap sweep picks up any still open |
| `MANIFEST.md` · `ARCHIVE.md` | written | what each phase shipped; how to revert it |
| `evidence/<phase>/` | written | screen captures that close a criterion |

Per-command escape hatches: `FLOW_TDD_OFF=1`, `FLOW_PLAN_OFF=1`, `FLOW_CITE_OFF=1` (one command;
PowerShell `$env:FLOW_TDD_OFF="1"`), `--no-verify` or `FLOW_SKIP_VERIFY=1` for the commit gate.
Nothing suspends the push gate or the owner-only files.

---

# The loop

## Triage — not every task deserves the full loop

The first thing Flow does is size the work. This is where most of the speed comes from.

| Size | Looks like | Path |
|------|-----------|------|
| **Direct** | a question, a typo, a rename, a one-line fix | just do it — no stages, no state file |
| **Quick** | one file, clear requirement, no new interface | BUILD then SHIP; still test-first if it is logic |
| **Full** | several files, a new interface, money/auth/data | FRAME → BUILD → CHECK → SHIP, against the project skill PLAN wrote |

Running the full loop on a typo is the most expensive mistake available.

## `/flow:loop`

### What is enforced, and what is only written down

An instruction an agent may not read at the right moment is not a rule. These are hooks — they
deny the action, and no prose can talk past them:

| Enforced | How |
|---|---|
| **No code until PLAN has produced a project skill** | a write to source is denied while the project has `.flow/` and no `.claude/skills/*/SKILL.md` carries `flow-project-skill: true` — including writes via a heredoc, `sed -i`, `tee`, `cp` or `Set-Content` |
| **No code until you confirmed the plan** | denied until `.flow/plan-confirmed` holds the skill's hash. **The loop is denied from writing that file.** You do, after reading the flows — the gate prints the exact command |
| **PLAN drew what you confirmed** | a write to source is denied until `.flow/plan/index.html` exists — the flows, and every screen a job lands on designed and captured as a PNG. The confirmation hashes the page **and every capture**, so what you approved is the pictures you actually looked at |
| **A redesign is applied only after you saw it** | `/flow:uiux` designs every screen as it will ship, captures it as an image beside the current one, and writes `.flow/uiux/pending`. From then on source writes are denied — and the marker cannot be deleted — until `.flow/uiux-confirmed` carries the hash of the captures you looked at |
| **Known blockers are cleared before BUILD** | PLAN sweeps every expert for what would stop BUILD, classes each `decide` / `obtain` / `prove`, and clears it. Source writes are denied while any is unclassified, open without a reason, or — for a `prove` — marked resolved without a spike file on disk. *"It mirrors OpenPlay"* is a `prove` blocker, and confidence does not clear one |
| **Every acceptance criterion cites the plan** | `git commit` is denied if any criterion in the current phase lacks `from:` |
| **Test-first on logic** | a guarded source file with no covering test is denied |
| **The state file keeps up** | `git commit` is denied if source changed and `STATE.md` did not, three commits running — `-a`, a pathspec and `--amend` included |
| **Never push** | `git push` is denied unless `.flow/allow-push` exists — another file the loop cannot create. Catches `bash -c`, `git.exe`, `git -C`, `gh pr create`, and a dry-run chained to a real one |
| **Judgement does not pile up** | source writes are denied past 5 open `by person` questions in `.flow/UAT.md` |
| **The loop never answers your questions** | a `by person` entry it answered itself must be classed `` `judgement` `` — wording, a default, an empty state, where a professional standard settles it. An `owner` entry (a rate, a threshold, who may do what) or one with no class denies the write. Unclassified fails closed on purpose |
| **A closed `by artifact` criterion has its artifact** | `git commit` is denied when a criterion ticked done and classed `by artifact` names a file that is not on disk. This is what makes SHIP’s data pass and the screen audit mechanical rather than hoped-for |
| **Verification is tiered, not uniform** | a `Workflow` script that spawns a fixed number of skeptics per finding is refused, with the tiering table in the denial. The count has to be a function of the finding’s severity. This is the single largest recurring cost in CHECK, and prose did not hold it |
| **The record cannot be deleted** | `rm -rf .flow`, `rm .flow/STATE.md`, a `git clean -fdx` that would take it, and the same in PowerShell or `git rm`, are all denied — and so is deleting the project skill. Removing the record used to disarm four rules at once, silently. Nothing suspends this one |

Everything else is discipline — written to be read at the moment it applies, and honest about
being discipline.

### The five stages

**PLAN — once per project, and at milestones.** Five experts on the *intent* — researcher,
system architect, systems engineer, dataflow and process specialist, UI/UX — concurrently, the
same shape as CHECK's adversarial pass but pointed at what you asked for rather than at a diff.
It starts with your words, quoted verbatim, before any research. It draws the process flow —
who does what, in what order, and where they see the result — and **shows it to you before
anything is built.** It puts the three-to-seven shape-changing decisions to you, and those stop
and ask even under autonomous mode. Then it writes **the project skill** —
`.claude/skills/<project>/SKILL.md`, a real skill every later session auto-loads — **and
publishes an artifact: every flow as a diagram, **every screen a job lands on designed in the
project theme with real content and captured as a PNG** at desktop and 375px, every entity as a
state diagram, the confirm command at the bottom.** You confirm from the pictures — and the
gate refuses to accept a confirmation until the images are there, so "you confirm from the
pictures" is a mechanism now, not a sentence. Invoke it directly with `/flow:plan`. Every other stage proves code matches its criteria; **this is the only one that can
see the criteria were for the wrong product.** It exists because two projects shipped
twenty-plus green phases each with not one recorded sentence of what the owner asked for.

**FRAME — audit the plan, then frame the phase.** FRAME no longer decides what the product is.
It audits the project skill for this phase's slice — a create with no read surface, a
"mirrors X" never enumerated job by job, a state with no exit, a value only a migration can
change — then frames against it. Every criterion cites the skill section it serves, and the
commit gate refuses a phase whose criteria cite nothing. Plus the authority register (a real
3.125× payout error propagated from a research doc through fifteen fixtures while every gate
passed), the threat model, the analogs, the gap pass and the plan review.

**BUILD.** Against the frame, test-first for logic. The standard is a list the agent can fail,
not a persona: it matches the analog, every branch a criterion names has a test observed red
first, no value the authority decides is typed by hand, every write has a read, errors reach a
person in words they can act on, nothing the frame did not ask for.

**CHECK — five gated stages.** Machine (and read what it prints; exit 0 is not clean output),
contract, composition — including **process and data flow per phase**: the handoff chain, then
every write driven through the product and the row read back — adversarial, verdict. The
screen audit fires on any phase that touched a UI.

**SHIP — the data pass, then hand over.** Before the closing commit: **drive the project skill's
core flows end to end against a disposable database and read the rows.** Not this phase's
writes — CHECK did that. The *product's* flows, to prove this phase did not break the thing you
are about to test. A failure sends it back to BUILD. Then commit, manifest, release note,
memory. Committing locally is the boundary, and the push gate makes that mechanical.

## `/flow:ultra`

```
/flow:ultra                 # inspect, then repair what it finds
/flow:ultra report only     # stop at the report
```

CHECK looks at a diff. This looks at the whole system.

**1. Does it run?** From a clean checkout, following only the written instructions. Every step
you have to invent is a finding — a new person will invent it too.

**2. What happens to the data?** Trace the flows where being wrong is expensive, build the
matrix, drive it against a disposable database, then **read the rows.** A response is not a
record.

**3. What is wrong with the code?** Independent readers, one lens each, findings deduplicated
then given one attempt to be refuted.

**4. Then it fixes it.** Stages 1–3 change nothing — an inspection that repairs as it goes
starts agreeing with itself. But that rule ends where the report does: once the report is
sealed, **each finding goes to the loop as a phase.** The handoff is cheap because every
finding already carries a concrete failure — *inputs → wrong outcome* — which **is an
acceptance criterion with the outcome flipped.** BLOCKERs first, batched by root cause.
Findings needing a decision, a migration, a credential, money, or **a correction to data
already written** stop for you instead: stage 4 writes source, never rows.

Each finding carries a status (`open` / `fixed · phase N` / `blocked` / `stale` / `wont-fix`)
that the roadmap sweep reads — so an unrepaired BLOCKER cannot sit unread while the loop
reports the roadmap exhausted, and a repaired one is never re-proposed.

It exists because a project here passed every gate it owned — 156 test files, mutation gates
green, a five-stage CHECK — and the application could not start. Nobody had ever run the thing
a user runs.

## `/flow:theme`

```
/flow:theme              # surveys, then recommends two or three
/flow:theme ember
```

A theme is not a palette. It is a **law about where colour and depth are allowed to go**. Ship
the palette without the law and it lasts until someone adds a screen.

| | Ground | Typeface | The law |
|---|---|---|---|
| **Aurora** | dark **and** light | Inter | depth from surface levels, never glow |
| **Nordic** | cool light | Plus Jakarta Sans | blue is never a status, green is never a button |
| **Signal** | white | Poppins | one accent carries every interactive element |
| **Meridian** | off-white lilac | Manrope | weight carries hierarchy, not colour |
| **Basalt** | saturated pine | Schibsted Grotesk | the brand colour is the page, not a mark on it |
| **Ember** | warm brown-black | Red Hat | gold means actionable; pending has no colour |
| **Relief** | warm greige | Source Sans 3 | raised means press it, recessed means read it |

Every value clears WCAG AA against every ground its own theme declares — 183 pairings,
measured. Density, most rows to fewest: Nordic, Basalt, Meridian, Ember, Relief, Aurora,
Signal. Tokens and per-theme conflicts: `skills/theme/references/themes.md`.

**Four stages, and the first two change nothing.** *Survey* the interface as built — including
a maturity grade per component, which decides whether stage 4 is an afternoon or a fortnight.
*Conflict*: what this theme would break, reported **before a file is touched**, then it stops
and asks. *Tokens*. Then *Components* — and that is the stage that decides whether the result
looks finished.

**Tokens change what colour things are; they do not change what things *are*.** A bare
`<table>` in a new palette is still a bare `<table>`, and **a styled page with a default grey
dropdown in it is the loudest tell there is.** So stage 4 rebuilds the native controls, the
table and its states, the label/hint/error unit, modals, the empty states most screens never
got, and the auth pages nobody styles.

The quiet killer to watch for in stage 2: if the project's success green is the theme's accent,
every success message reads as a link afterwards. Nothing errors, no test fails.

Finally it writes the law into `.flow/PROJECT.md` § Design standard — the section the UI audit
already enforces every CHECK. **That is the difference between a theme and a repaint.**

## `/flow:guide`

```
/flow:guide
/flow:guide cebuano, for field associates
```

**It walks the running system** — signs in as each role, does the real jobs, breaks things on
purpose, records every label and message verbatim. A guide assembled from source documents what
the developer built, including the screens that do not work.

**Organised by job, not by feature**, and the check is mechanical: *if the contents match the
navigation menu, it is a feature list.*

| | Options |
|---|---|
| **Language** | interface language · reader's language with labels kept · bilingual · a book per language |
| **Level** | Simple (new to computers) · **Plain** (default) · Working (knows the job, not the software) |
| **Audience** | one guide per role, or one covering all |

**UI labels are never translated.** The screen still says `Submit booking`, so telling a Cebuano
reader to press *Isumite* describes a product that does not exist. Labels stay verbatim with the
meaning in parentheses.

**It is laid out, not just written.** The markdown is the source of truth and the PDF is
generated from it, never hand-edited — because the obvious commands produce the wrong document:
the browser's Print gives a 24pt H1 on US Letter, and `page.pdf()` in Puppeteer or Playwright
**ignores `@page` entirely** unless you pass `preferCSSPageSize: true`. So the sizes are fixed
and normal: **body 10.5pt, page title 18pt**, nothing more than about twice the body. One left
edge for text, headings, screenshots and tables. A step never splits from its screenshot.
Captures at 2× printed at a fixed width per class (~192 DPI), so labels stay readable.

Then it renders the PDF's pages to images and looks at them — you cannot check a PDF by
extracting its text, and a PDF that renders is not a PDF that works.

---

# Running long

## Autonomous is not a daemon

**Autonomous mode** stops asking questions. It covers *building* only: pushing, PRs, deploys,
secrets, money and deleting data still stop and ask — and so do the panel's shape-changing
decisions.

**An agent runs inside a session; when the session ends, the run ends.** Continuing past that is
a host feature — on Claude Code, `/loop`. Three things matter:

**Omit the interval.** Self-paced mode can stop itself. A fixed `/loop 20m` fires on the clock
whether or not there is anything to do.

**Say the pacing out loud.** Both `/loop` and `ScheduleWakeup` suggest 1200–1800s, written for a
watcher polling an external event. A run with an open task list is not waiting for anything. The
skill overrides that — but only in the version you have loaded, so put it in the prompt:

```
When you call ScheduleWakeup and tasks remain with nothing external pending,
use delaySeconds 60, never 1200-1800.
```

Without it a run can commit a task then sleep 25 minutes with the next ready — four hours of
nothing across a phase, indistinguishable from a crash. This happened on two real projects.

**A resumed session keeps the plugin version it started with.** If a long run behaves like an
older version, start a **new** session — restarting the app updates what is *installed*,
resuming keeps what is *loaded*.

## Naming a budget

The only stop condition the loop cannot work out for itself. Plain words, no syntax:

| Form | Good for |
|---|---|
| **a stopping point** — "finish phase 6, then stop" | the default; a phase boundary is where a mistake stops propagating |
| **a wall-clock** — "stop after 6 hours" | overnight |
| **a token ceiling** — "budget 400k" | required by fleet mode, which sizes itself from it |
| **the roadmap** — "until the roadmap is exhausted" | long runs — an early mistake propagates through every later phase |

## It stops itself

The run ends and says which fired: the roadmap is exhausted *and* the sweep found nothing
startable; a hard stop needs you; two consecutive wakes with no commit; two failed debug cycles
on one defect, or CHECK failing twice on one finding; or the budget you named.

## Non-stop build

```
/loop /flow:loop continue from .flow/STATE.md — keep building past the roadmap
```

or durably, a `.flow/nonstop` file.

**An empty roadmap means the list someone wrote is complete, not that the project is finished.**
Before reporting that good ending the loop sweeps six places where work is usually already
recorded: deferred findings, tasks ticked but never proven, drift between planning documents,
`TODO`s naming a referent, the blocked list, and **open findings in a `.flow/ULTRA-*.md`**.

In non-stop mode it keeps going instead, working a ladder without skipping tiers — recorded
work, then evidence gaps in shipped code, then requirements the project's own specification
states and no code implements. It ends when **every remaining candidate needs a person.**

Something needing only local setup is not that. A suite that never ran because no test database
exists is *work* — put `allow local services` in `.flow/nonstop` and it will start a throwaway
Postgres itself. Production credentials are never in this category.

It will not invent a feature nobody wrote down, reclassify blocked work to stay busy, or soften
a hard stop. Every self-selected phase is written into the roadmap before it is built and
flagged as self-selected. **It is the most expensive setting here** — unlike fleet mode it does
not finish sooner, it simply does not stop.

## Fleet mode

```
/loop /flow:loop continue from .flow/STATE.md — fleet mode, budget 400k
```

or durably, a `.flow/fleet` file. The default loop is one agent, which is cheapest per unit of
work and on a dependency chain also fastest. Fleet trades tokens for wall-clock.

**The unlock is worktree isolation** — each agent gets its own checkout, so tasks sharing a file
can run at once and be reconciled after. Merges run one at a time with `test_fast` between them.
A conflict *inside one function* is a design signal: those two agents were one task split wrongly.

**What never relaxes:** wave 0 runs alone and first; two agents never write the same file in one
tree; agents never commit, push or merge; TDD still applies.

**It needs a budget and declines small ones.** A real 69-agent run measured **~547k
input-equivalent tokens per agent** — 94% cache reads, each agent loading context the
orchestrator already had. Budget ÷ 550k concurrent, a third held for CHECK and merges, and
**below ~1.6M it refuses.** That 547k is a *carelessly briefed* agent, not a floor: the waste is
duplicated context loading, so the orchestrator inlines contract signatures and analog file
contents into every brief. Paths make an agent go read; content means it does not.

**Where it does not help:** a dependency chain. It checks the file sets first and declines
rather than pretending. Full protocol: `skills/loop/references/fleet.md`.

## Before you start a long one

- `.flow/STATE.md` has a goal, acceptance criteria and a task list
- `.flow/PROJECT.md` exists, so no wake re-derives the commands
- a roadmap exists, if the run crosses phases
- the working tree is clean — a loop starting dirty cannot tell its own work from yours
- **you have named a budget.** "Until it is done" is not a budget on eleven phases

---

# Adopting a project that already exists

```
/flow:loop frame the next piece of work in this repo
```

FRAME writes `.flow/STATE.md` and `.flow/PROJECT.md` — plain markdown, format in
`skills/loop/references/state.md`. On a codebase that already builds, its survey is about what
is *already true* rather than what to design. This is also a panel moment: five experts on the
gap between what was intended and what exists.

**Legacy code that will never have tests.** Once `.flow/` exists the TDD gate is live and will
deny edits to any source file with no covering test, including code that predates you. List
those paths in `.flow/tdd-exempt`, one fragment per line:

```
# inherited, tested manually against staging
legacy/
src/vendored-parser
```

It lives in the repository, so it survives plugin updates and shows up in review. The honest way
to adopt a large untested codebase is to exempt the old code and let the gate hold the line on
everything new.

# The gates

## TDD gate

`hooks/flow-tdd-gate.mjs` runs on `PreToolUse` for `Write|Edit` and denies writes to a guarded
source file when no covering test exists.

**Guarded:** `ts tsx js jsx mjs cjs py go rb php java cs`.
**Exempt:** test files, `*.config.*`, `*.d.ts`, `*.stories.*`, generated code, `index` /
`types` / `constants` / `setup` / `main` / `app` entry points, and `node_modules`, `dist`,
`build`, `.next`, `coverage`, `vendor`, `migrations`, `scripts`, `public`. **`page` and
`layout` are not exempt** — a screen is gated through the route it serves.

A test covers a source file by either pass:

1. **Name or location.** A file counts as a test by name (`.test.`, `.spec.`, `test_`) *or* by
   living in `test/`, `tests/`, `__tests__/`, `spec/`. Its name must start with the source name
   or share a token — split on `-`, `_` and camelCase, singularised, generic tokens ignored. So
   `booking-events-idempotency.test.ts` covers `booking-events.ts`. For files whose basename
   carries no meaning (`route.ts`, `page.tsx`) the tokens come from the route.
2. **Symbol** (only if pass 1 finds nothing). A test mentioning one of the file's exports.

The gate is deliberately loose — one that blocks legitimate work gets switched off entirely,
which enforces nothing.

## Commit gate

Runs before `git commit` and enforces two things: **`.flow/STATE.md` must keep up** (a source
commit is refused if the state file has not been touched in that commit or the last two), and
**`test_fast` must pass** if `.flow/PROJECT.md` declares one.

Built to stay out of the way: opt-in by configuration, docs-only commits ungated, fails open on
anything ambiguous, honours the escape hatches above, and a 90-second ceiling. When it blocks it
shows the last 25 lines of the failure.

# Requirements

| Needs | For | Without it |
|---|---|---|
| Claude Code | everything | — |
| **Node 16+** | the hooks | **the gate fails open** — see below |
| git | the SHIP gate, and resume's state-vs-repo check | those steps do not apply |

No npm packages, no `node_modules` — Node built-ins only. Node 18+ only for the test runner.

**If Node is missing the TDD gate silently stops enforcing.** A hook whose command cannot run
fails open: writes succeed and nothing announces the gate is inactive. That is the safe failure
mode, but confirm `node --version` rather than assuming you are protected.

| | Protocol | TDD gate | Commit gate |
|---|---|---|---|
| **Claude Code** | yes | enforced *(tested on Windows)* | enforced |
| **Codex** | yes | manifest provided, unverified against a live install | same |
| **Anything reading AGENTS.md** | yes | discipline | discipline |

For Codex, install the repo as a plugin — `.codex-plugin/plugin.json` declares the skills and
both hooks. For Cursor, Zed, Aider, Gemini CLI and anything else: copy `AGENTS.md` into your
project root and `skills/loop/references/` alongside it. That is the whole protocol.

The hooks are plain Node reading a `{tool_name, tool_input}` envelope on stdin, printing JSON
only when denying, and accepting the known field spellings — failing open on anything
unrecognised. Built and exercised on Windows; macOS and Linux are reasoned, not run.

# What is inside

**Protocols load only when you reach them** — one entry in the skill listing, ~330 resident
lines, and 23 reference files read only when the situation calls for them. A debugging protocol
costs nothing until there is a bug.

| Gate | Produces | Model tier |
|------|----------|-----------|
| FRAME | goal + task list in `.flow/STATE.md` | cheap / inline |
| BUILD | working code + tests | frontier |
| CHECK | one verdict report | cheap subagents, parallel |
| SHIP | commit + memory write | inline |

Flow is a distillation, not a bundle: it contains no code from any other plugin. It keeps the
loop from phase-based planning frameworks (dropping the command sprawl and `.planning/` trees),
test-first scoped to logic plus the enforcing hook, the review lenses as one CHECK pass, and two
memory touchpoints. It cannot replace a running MCP server — if you want sandboxed execution or
durable cross-session memory, install those separately; Flow detects and uses them when present.

Running Flow's gates *and* a separate planning framework's phase commands duplicates the work
Flow exists to remove. Disable the ones it supersedes.

# Developing on it

```
npm test                                        # 78 tests, no dependencies
npm run release 1.48.0 "fix(gate): ..."         # test, bump, commit, push, refresh clone
```

That last step is why the release script exists: `/plugin` installs read from the clone under
`~/.claude/plugins/marketplaces/flow-loop`, not from GitHub. A push without it leaves every
install on the previous version and looks exactly like a broken updater. It was forgotten four
times before this was automated, and `autoUpdate: true` does not close the gap on its own.

# Honest limits

- **Fourteen rules are hooks. Everything else is an instruction Claude follows.** The fourteen are
  listed above, and each one has tests in `test/` that a release will not ship without. Everything else in this README — the panel's
  decisions stopping under autonomous mode, re-testing a stale blocker, reading a build's
  warnings, enumerating a "mirrors X", the adversarial pass — is discipline. Some of it could
  become a hook later; none of it is one today.
- **The hooks constrain actions, not judgement.** They can stop a file being written. They
  cannot stop the *wrong* file being written. The citation gate checks that `from:` resolves to
  a real heading in the plan — never that the criterion actually serves it. The evidence gate
  checks that a capture exists — never that it shows a working screen. Every gate proves a step
  happened; none proves it was right. That is why PLAN ends with you looking at the screens.
- **Every enforced rule has an owner-controlled escape**, and the loop is denied from creating
  any of them: `.flow/plan-off`, `cite-off`, `tdd-off`, `verify-off`, `allow-push`,
  `uat-ceiling`. That is deliberate — a gate with no escape gets the whole plugin uninstalled
  — but it means the enforcement is exactly as strong as your willingness not to create those
  files on the loop's behalf.
- **The hooks see the tools they are wired to.** Write, Edit, Bash and PowerShell today, plus
  Codex's shell spellings. A host that writes files through a tool none of those names would
  not be gated; if you adopt one, say so and the matchers need widening.
- **The gates are heuristic.** The TDD gate matches on names and symbols; the plan gate
  identifies shell write-targets by parsing the command. Both are deliberately loose — one
  that blocks legitimate work gets switched off entirely, which enforces nothing.
- **No benchmark.** The structural savings — fewer round trips, a smaller resident listing,
  progressive disclosure — are real and mechanical. Whether *your* work lands faster is not
  something this README can honestly claim.

# License

MIT

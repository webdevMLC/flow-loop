# Flow

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FwebdevMLC%2Fflow-loop%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&color=blue)](https://github.com/webdevMLC/flow-loop/blob/main/.claude-plugin/plugin.json)

One development loop for Claude Code. Four gates, hard loop guards, and a TDD rule enforced by
a hook instead of politely suggested.

It replaces the practice of stacking separate memory, planning, context, TDD and review
plugins on top of each other — which is expensive twice over: every plugin's skill listing
loads into every session, and every extra command is another round trip in a conversation that
re-sends itself each turn.

```
FRAME  ->  BUILD  ->  CHECK  ->  SHIP
  ^                     |
  +--- only on a CHECK failure that changes the goal
```

## Quick start

```
/plugin marketplace add https://github.com/webdevMLC/flow-loop.git
/plugin install flow@flow-loop
```

Use the full URL with `.git` — the `owner/repo` shorthand reports "Unable to load plugin".
Restart the session so the hooks load, then just say what you are building:

```
/flow:loop add refund handling to the ledger
```

**Installing changes nothing on its own.** Both gates stay dormant until a project has a
`.flow/` directory, so untouched repositories behave exactly as before. Adoption is deliberate.

## The commands

| | Does | Reach for it |
|---|---|---|
| **`/flow:loop`** | the loop — FRAME, BUILD, CHECK, SHIP | all normal work |
| **`/flow:ultra`** | inspects the running system, not the diff | before a pilot, or when the suite is green and you are not convinced |
| **`/flow:theme`** | surveys a project's interface, then applies a theme **and rebuilds the components** | screens that look dated or unfinished, or were built ad hoc and no longer agree |
| **`/flow:guide`** | writes the user guide from the running system | it is going to real users, or support keeps answering the same question |

## Triage — not every task deserves four gates

The first thing Flow does is size the work. This is where most of the speed comes from.

| Size | Looks like | Path |
|------|-----------|------|
| **Direct** | a question, a typo, a rename, a one-line fix | just do it — no gates, no state file |
| **Quick** | one file, clear requirement, no new interface | BUILD then SHIP; still test-first if it is logic |
| **Full** | several files, a new interface, money/auth/data | all four gates |

Running the full loop on a typo is the most expensive mistake available. Frameworks offering
only one path make it constantly.

## `/flow:theme` — survey the interface, then apply one

```
/flow:theme              # surveys, then recommends two or three
/flow:theme ember        # surveys against a theme you have already picked
```

A theme is not a palette. It is a **law about where colour and depth are allowed to go**, plus
the tokens that express it. Ship the palette without the law and the theme lasts exactly as
long as nobody adds a screen.

### The seven themes

| | Ground | Typeface | Accent | The law |
|---|---|---|---|---|
| **Aurora** | dark **and** light | Inter *(Figma, Mozilla)* | indigo | depth from surface levels, never glow |
| **Nordic** | cool light | Plus Jakarta Sans | blue | blue is never a status, green is never a button |
| **Signal** | white | Poppins | violet | one accent carries every interactive element |
| **Meridian** | off-white lilac | Manrope | soft violet | weight carries hierarchy, not colour |
| **Basalt** | saturated pine | Schibsted Grotesk *(Schibsted)* | inverted — white is the action | the brand colour is the page, not a mark on it |
| **Ember** | warm brown-black | Red Hat Display + Text *(Red Hat)* | gold | gold means actionable; pending has no colour |
| **Relief** | warm greige | Source Sans 3 *(Adobe)* | petrol | raised means press it, recessed means read it |

Aurora is the only one shipping both modes; for the rest a counterpart mode is a
**translation, not an inversion**, and its own phase. Every value clears WCAG AA against every
ground its own theme declares — 183 pairings, measured, not eyeballed. Full tokens and the
per-theme conflicts: `skills/theme/references/themes.md`.

Rough density order, most rows to fewest: Nordic, Basalt, Meridian, Ember, Relief, Aurora,
Signal. Signal fits about 20% fewer rows than Nordic — do not pick it for an all-day console.

### How it runs

Four stages, each gating the next, and **the first two change nothing**:

**1. Survey** — the interface as built, not as documented. The styling layer (projects usually
have two and admit to one), the real palette measured from code, the status vocabulary, dark
mode, density, the count of hard-coded colours — and **a maturity grade for every component**,
which is what decides whether stage 4 is an afternoon or a fortnight. It ends by capturing
every screen it is about to touch — the only moment a "before" can exist.

**2. Conflict** — what this theme would break, reported **before a file is touched**, because
"then pick a different theme" is cheap now and expensive after the rewrite. In CHECK's own
severities: BLOCKER if it contradicts the project's design standard or needs a structure the
project cannot have, MAJOR if it wants a colour the project already uses for meaning, MINOR
for cost. Then it stops and asks.

That MAJOR is the quiet killer. If the project's success green is the theme's brand accent,
then after the migration every success message reads as a link. Nothing errors, no test fails.

**3. Tokens** — the token layer, then hard-coded values grouped by value rather than by file,
then what CSS cannot reach: chart arrays, PDF and email templates, baked SVG fills.

**4. Components** — and this is the stage that decides whether the result looks finished.
Tokens change what colour things are; they do not change what things *are*. A bare `<table>`
with a new palette is still a bare `<table>`, and a native `<select>` still renders in OS
chrome — **a styled page with a default grey dropdown in it is the loudest tell there is.**

So stage 4 rebuilds: the native controls (select, checkbox, radio, date, file), the table with
its four states and right-aligned tabular figures, the label/hint/error unit, buttons with
their disabled and loading states, modals, toasts, the empty and loading states most screens
never got, and the auth pages nobody styles. It adopts a headless primitive library rather than
hand-rolling focus traps and ARIA — that adoption is reported as a BLOCKER-level conflict in
stage 2, because it is a dependency the project lives with.

**The submitted value is frozen; the call site is not.** Same values in `FormData`, same
validation outcomes, same defaults — but a Radix Select is not `<select>`, so the props a call
site passes may change, and migrating those call sites is a task in the phase rather than a
reason to skip the work. A replaced native control keeps its `name` in the payload and
re-expresses `required`; where it cannot, the native element stays under a styled wrapper.
Tests assert the payload, never the markup, and **an existing test is never weakened to keep it
green.**

Unlike stage 3, this stage is **not TDD-exempt** — a disabled state, a loading state and a
focus trap are behaviour and they break silently. Stage 3's `.flow/tdd-exempt` lines are
deleted at the stage boundary, because the gate is a substring match that exits silently: one
leftover `components/ui` line would disarm it for exactly the files this stage must write
test-first. And **no component generator runs here** — `npx shadcn init` rewrites the Tailwind
config and `globals.css` with its own tokens, which after stage 3 destroys the token layer just
migrated. Adopting one is a stage-2 decision, made before stage 3.

It stops and shows after the foundations, the button, the controls and the table.

Captures at desktop and 375px close the criteria `by artifact`.

### What it writes, and why that is the point

The last step writes the theme's law into `.flow/PROJECT.md` § Design standard:

```markdown
## Design standard
Theme: Ember. Styling layer: Tailwind (do not introduce a second).
Palette: tokens in tailwind.config.ts — never a literal hex in a component.
- Gold #d9a441 means "actionable" and appears on nothing else.
- Pending has no colour; it is a hollow outline. No warning hue in this theme.
- Cards have no borders. Separation is by surface level.
```

That is the section the UI audit already treats as the authority during every CHECK, so from
then on the gate enforces the law on every screen anyone adds. **That is the difference
between a theme and a repaint.**

Two things worth knowing before you run it: a colour-only edit to a component is still an edit
to a guarded file, so the migration adds path fragments to `.flow/tdd-exempt`, lists them in
its report, and removes them at SHIP — it never uses `.flow/tdd-off`. And a project with a
working dark mode conflicts with all six single-mode themes; the survey says so rather than
leaving half the screens unstyled.

## `/flow:ultra` — inspecting the system, not the diff

```
/flow:ultra
```

CHECK looks at a diff every phase. This looks at the whole system and asks three things a diff
review cannot.

**1. Does it actually run?** From a clean checkout, following only the written instructions.
Every step you have to invent is a finding, because a new person will have to invent it too.

**2. What happens to the data?** The stage no gate in the loop performs. Trace the flows where
being wrong is expensive, build the matrix (positive, negative, boundary, duplicate,
concurrent, status transition, cross-module), drive it against a disposable database, then
**read the rows.** A response is not a record.

**3. What is wrong with the code?** Independent readers, one lens each, no shared context with
the build. Findings are deduplicated, then given one attempt to be refuted before reporting.

**It reports and never fixes** — findings return to the loop as phases. An inspection that
repairs as it goes starts agreeing with itself.

It exists because a project here passed every gate it owned — 156 test files, mutation gates
green, a five-stage CHECK — and the application could not start. Fifteen phases shipped that
way. The tests imported modules directly and took their environment from the runner; nobody
ever ran the thing a user runs.

## `/flow:guide` — the user guide, in the reader's language

```
/flow:guide
/flow:guide cebuano, for field associates
```

A user guide is a claim about how the system behaves, written for someone who does not know
how it was built and does not want to. It is not the code documented, and it is not the
feature list in shorter words.

**It walks the running system.** Signs in as each role, does the real jobs end to end, captures
the screens, and records every label and error message verbatim. A guide assembled from source
documents what the developer built, including the screens that do not work.

**It is organised by job, not by feature**, and the check is mechanical: *if the guide's table
of contents matches the app's navigation menu, it is a feature list.* A menu is arranged the
way the system was built; a guide is arranged the way a person's day runs — "Get paid for a
booking", not "Commission Module".

**It breaks things on purpose.** The most-read page in any real guide is the error page, and
you cannot write it from the source — the message a user sees is often not the string in the
code. So it submits the form empty, enters a duplicate, does the steps out of order, and
records what actually appears.

### Language and level

Both are asked before anything is written:

| | Options |
|---|---|
| **Language** | the interface language · the reader's language with labels kept · bilingual side by side · a separate book per language |
| **Reading level** | **Simple** (may be new to computers) · **Plain** (anyone — the default) · **Working** (knows the job, not the software) |
| **Audience** | one guide per role, or one covering all — an admin guide and a field-staff guide are different books |

**UI labels are never translated.** The screen still says `Submit booking`, so a guide telling a
Cebuano reader to press *Isumite ang booking* describes a product that does not exist. Labels
stay verbatim with the meaning in parentheses — `Pindota ang **Submit booking** (ipadala ang
booking)` — and error messages stay verbatim too, because the reader is matching them character
for character.

A translation is a **`by person`** criterion: no test closes it and a screenshot proves
nothing, so it goes to `.flow/UAT.md` for a speaker to read before it ships.

### What it produces

```
docs/guide/
  README.md                     what this is, who it is for
  01-getting-started.md
  02-<a real job>.md            one page per job, named the way a user would say it
  when-something-goes-wrong.md  every message, what it means, what to do
  glossary.md                   only the words that survived
  images/
  ceb/                          same filenames, same headings
```

Every job page carries **Before you start**, **What happens next** and **If it does not
work** — the three sections people actually need, and the three most often missing. The steps
are the easy part.

Screenshots come from a seeded demo account, never production: guide images are committed and
ship to users, and a screenshot that leaked a customer list cannot be un-shipped.

## Adopting a project that already exists

```
/flow:loop frame the next piece of work in this repo
```

FRAME writes two files. On a codebase that already builds, its survey is about what is
*already true* rather than what to design.

| File | Holds | Why it matters |
|---|---|---|
| `.flow/STATE.md` | goal, criteria, task list, decisions, assumptions | every session and every `/loop` wake restores from this one read |
| `.flow/PROJECT.md` | `test_fast`, typecheck and lint commands, conventions, analogs, design standard | without it the commit gate runs no tests |

Both are plain markdown — format in `skills/loop/references/state.md`.

**Legacy code that will never have tests.** Once `.flow/` exists the TDD gate is live and will
deny edits to any source file with no covering test, including code that predates you. List
those paths in `.flow/tdd-exempt`, one fragment per line:

```
# inherited, tested manually against staging
legacy/
src/vendored-parser
```

It lives in the repository, so it survives plugin updates and shows up in review. The honest
way to adopt a large untested codebase is to exempt the old code and let the gate hold the
line on everything new.

## The gates

### TDD gate

`hooks/flow-tdd-gate.mjs` runs on `PreToolUse` for `Write|Edit` and denies writes to a guarded
source file when no covering test exists.

**Guarded:** `ts tsx js jsx mjs cjs py go rb php java cs`.
**Exempt:** test files, `*.config.*`, `*.d.ts`, `*.stories.*`, generated code, `index` /
`types` / `constants` / `setup` / `main` / `app` entry points, and `node_modules`, `dist`,
`build`, `.next`, `coverage`, `vendor`, `migrations`, `scripts`, `public`. **`page` and
`layout` are not exempt** — a screen is gated through the route it serves.

A test covers a source file by either pass:

1. **Name or location.** A file counts as a test by name (`.test.`, `.spec.`, `test_`) *or* by
   living in `test/`, `tests/`, `__tests__/`, `spec/`. Its name must start with the source
   name or share a token — split on `-`, `_` and camelCase, singularised, generic tokens
   ignored. So `booking-events-idempotency.test.ts` covers `booking-events.ts`. For files
   whose basename carries no meaning (`route.ts`, `page.tsx`) the tokens come from the route.
2. **Symbol** (only if pass 1 finds nothing). A test mentioning one of the file's exports.

**When it is wrong,** in order of preference: `.flow/tdd-exempt` (a path fragment) →
`.flow/tdd-off` (whole project) → `FLOW_TDD_OFF=1` (one command; on PowerShell,
`$env:FLOW_TDD_OFF = "1"`). The gate is deliberately loose — one that blocks legitimate work
gets switched off entirely, which enforces nothing.

### Commit gate

Runs before `git commit` and enforces two things: **`.flow/STATE.md` must keep up** (a source
commit is refused if the state file has not been touched in that commit or the last two), and
**`test_fast` must pass** if `.flow/PROJECT.md` declares one.

Built to stay out of the way: opt-in by configuration, docs-only commits ungated, fails open
on anything ambiguous, honours `--no-verify` / `FLOW_SKIP_VERIFY=1` / `.flow/verify-off`, and
a 90-second ceiling. When it blocks it shows the last 25 lines of the failure.

## Running unattended, and running overnight

Two different things, and conflating them is the common misunderstanding.

**Autonomous mode** stops asking questions during a run — turn it on with a phrase
("autonomous", "keep going, don't ask") or a `.flow/autonomous` file. Questions become
assumptions recorded in the state file, and the report leads with them. It covers *building*
only: pushing, PRs, deploys, secrets, money and deleting data still stop and ask.

**It is not a daemon.** An agent runs inside a session; when the session ends, the run ends.
Continuing past that is a host feature — on Claude Code, `/loop`:

```
/loop /flow:loop continue from .flow/STATE.md — budget: finish phase 6, then stop
```

Three things that matter:

**Omit the interval.** That is self-paced mode, and it can stop itself. A fixed `/loop 20m`
fires on the clock whether or not there is anything to do.

**Say the pacing out loud.** Both `/loop` and `ScheduleWakeup` suggest 1200–1800s, written for
a watcher polling an external event. A run with an open task list is not waiting for anything.
The skill overrides that — but only in the version you have loaded, so put it in the prompt:

```
When you call ScheduleWakeup and tasks remain with nothing external pending,
use delaySeconds 60, never 1200-1800.
```

Without it a run can commit a task then sleep 25 minutes with the next one ready — four hours
of nothing across a phase, indistinguishable from a crash. This happened on two real projects.

**A resumed session keeps the plugin version it started with.** Updating does not change a
running conversation. If a long run behaves like an older version, start a **new** session —
restarting the app updates what is *installed*, resuming keeps what is *loaded*.

### Naming a budget

The only stop condition the loop cannot work out for itself. Plain words, no syntax:

| Form | Good for |
|---|---|
| **a stopping point** — "finish phase 6, then stop" | the default. A phase boundary is where a mistake stops propagating |
| **a wall-clock** — "stop after 6 hours" | overnight |
| **a token ceiling** — "budget 400k" | required by fleet mode, which sizes itself from it |
| **the roadmap** — "until the roadmap is exhausted" | long runs — weigh honestly: an early mistake propagates through every later phase |

### It stops itself

The run ends and says which fired: the roadmap is exhausted *and* the sweep found nothing
startable; a hard stop needs you; two consecutive wakes with no commit; two failed debug cycles
on one defect, or CHECK failing twice on one finding; or the budget you named.

**It never pushes, opens a PR, or deploys.** Committing locally is the boundary.

### Building past the roadmap

An empty roadmap means the list someone wrote is complete, not that the project is finished.
Before reporting the good ending the loop sweeps five places where work is usually already
recorded — deferred findings, tasks ticked but never proven, drift between planning documents,
`TODO`s naming a referent, and the blocked list.

To keep going rather than report and stop, say "keep building" in the prompt or drop a
`.flow/nonstop` file. It then works a ladder without skipping tiers: recorded work, then
evidence gaps in shipped code, then requirements the project's own specification states and no
code implements. It ends when **every remaining candidate needs a person**.

Something needing only local setup is not that — a suite that never ran because no test
database exists is *work*. Put `allow local services` in `.flow/nonstop` and it will start a
throwaway Postgres itself. Production credentials are never in this category.

It will not invent a feature nobody wrote down, reclassify blocked work to stay busy, or
soften a hard stop. Every self-selected phase is written into the roadmap before it is built
and flagged as self-selected. **It is the most expensive setting here** — unlike fleet mode it
does not finish sooner, it simply does not stop.

### Fleet mode — many agents at once

The default loop is one agent working sequentially, which is cheapest per unit of work and on
a dependency chain also fastest. Fleet mode trades tokens for wall-clock:

```
/loop /flow:loop continue from .flow/STATE.md — fleet mode, budget 400k
```

or durably, a `.flow/fleet` file.

**The unlock is worktree isolation** — each agent gets its own checkout, so tasks sharing a
file can run at once and be reconciled after. Merges run one at a time with `test_fast`
between them. A conflict *inside one function* is a design signal: those two agents were one
task split wrongly.

**What never relaxes:** wave 0 runs alone and first; two agents never write the same file in
one tree; agents never commit, push or merge; TDD still applies.

**It needs a budget and declines small ones.** A real 69-agent run measured **~547k
input-equivalent tokens per agent** — 94% cache reads, each agent loading context the
orchestrator already had. Budget ÷ 550k concurrent, a third held back for CHECK and merges,
and **below ~1.6M it refuses.** That 547k is a *carelessly briefed* agent, not a floor: the
waste is duplicated context loading, so the orchestrator inlines actual contract signatures
and analog file contents into every brief. Paths make an agent go read; content means it does
not. Brief properly and the number falls — but move it on a measurement you took.

**Where it does not help:** a dependency chain. It checks the file sets first and declines
rather than pretending. Full protocol: `skills/loop/references/fleet.md`.

### Before you start a long one

- `.flow/STATE.md` has a goal, acceptance criteria and a task list
- `.flow/PROJECT.md` exists, so no wake re-derives the commands
- a roadmap exists, if the run crosses phases
- the working tree is clean — a loop starting dirty cannot tell its own work from yours
- **you have named a budget.** "Until it is done" is not a budget on eleven phases

## Requirements

| Needs | For | Without it |
|---|---|---|
| Claude Code | everything | — |
| **Node 16+** | the hooks | **the gate fails open** — see below |
| git | the SHIP gate, and resume's state-vs-repo check | those steps do not apply |

No npm packages, no `node_modules` — Node built-ins only. Node 18+ only for the test runner.

**If Node is missing the TDD gate silently stops enforcing.** A hook whose command cannot run
fails open: writes succeed and nothing announces the gate is inactive. That is the safe
failure mode, but confirm `node --version` rather than assuming you are protected.

### Platform and portability

| | Protocol | TDD gate | Commit gate |
|---|---|---|---|
| **Claude Code** | yes | enforced *(tested on Windows)* | enforced |
| **Codex** | yes | manifest provided, unverified against a live install | same |
| **Anything reading AGENTS.md** | yes | discipline | discipline |

For Codex, install the repo as a plugin — `.codex-plugin/plugin.json` declares the skills and
both hooks. For Cursor, Zed, Aider, Gemini CLI and anything else: copy `AGENTS.md` into your
project root and `skills/loop/references/` alongside it. That is the whole protocol.

The hooks are plain Node reading a `{tool_name, tool_input}` envelope on stdin, printing JSON
only when denying, and accepting the known field spellings (`file_path`, `path`, `filePath`,
`target_file`, `file`) — failing open on anything unrecognised rather than guessing. Built and
exercised on Windows; macOS and Linux are reasoned, not run.

## What is inside

**Protocols load only when you reach them** — one entry in the skill listing, ~320 resident
lines, and 22 reference files read only when the situation calls for them. A debugging
protocol costs nothing until there is a bug.

| Gate | Produces | Model tier |
|------|----------|-----------|
| FRAME | goal + task list in `.flow/STATE.md` | cheap / inline |
| BUILD | working code + tests | frontier |
| CHECK | one verdict report | cheap subagents, parallel |
| SHIP | commit + memory write | inline |

Beyond the loop itself:

| | What it does |
|---|---|
| **Authority reconciliation** | when a contract already decided the rates and formulas, FRAME extracts them with citations and reconciles against the code before BUILD. Exists because of a real 3.125× payout error that propagated from a research document through the roadmap into fifteen fixtures while every gate passed |
| **Threat modelling** | phases touching money, identity, other people's data or outside input get a threat register before BUILD; CHECK closes each row against real code and a test that fails without the mitigation |
| **Process and data flow, per phase** | every other composition check proves the parts are *wired*; none can see a wired, reachable, fully tested flow writing the wrong number. So any phase that writes persistently draws its handoff chain (a state with no exit, a step with no actor, two paths to one state leaving different data) and then drives each write **through the product** and reads the row back — values against the authority, side effects, run it twice, drive the reverse. One round trip per write; `/flow:ultra` still owns the full matrix |
| **Brainstorm first** | when the goal cannot be stated in one checkable sentence. "Add a dashboard" is not a goal, and framing it anyway produces a confident plan for the wrong problem |
| **Match before you write** | FRAME names the closest existing analog for every new file |
| **Eight loop guards** | the expensive failure is repeated work — re-verifying what passed, researching a fact twice, a third silent debug attempt |

Flow is a distillation, not a bundle: it contains no code from any other plugin. It keeps the
loop from phase-based planning frameworks (dropping the command sprawl and `.planning/`
trees), test-first scoped to logic plus the enforcing hook, the review lenses as one CHECK
pass, and two memory touchpoints. It cannot replace a running MCP server — if you want
sandboxed execution or durable cross-session memory, install those separately; Flow detects
and uses them when present.

Running Flow's gates *and* a separate planning framework's phase commands duplicates the work
Flow exists to remove. Disable the ones it supersedes.

## Developing on it

```
npm test                                        # 78 tests, no dependencies
npm run release 1.43.0 "fix(gate): ..."         # test, bump, commit, push, refresh clone
```

That last step is why the release script exists: `/plugin` installs read from the clone under
`~/.claude/plugins/marketplaces/flow-loop`, not from GitHub. A push without it leaves every
install on the previous version and looks exactly like a broken updater. It was forgotten four
times before this was automated, and `autoUpdate: true` does not close the gap on its own.

## Honest limits

- **This is a skill plus two hooks, not a framework.** The gates and guards are instructions
  Claude follows; only the TDD and commit gates are mechanically enforced. The rest is discipline.
- **The gate is heuristic.** See the escape hatches above.
- **No benchmark.** The structural savings — fewer round trips, a smaller resident listing,
  progressive disclosure — are real and mechanical. Whether *your* work lands faster is not
  something this README can honestly claim.

## License

MIT

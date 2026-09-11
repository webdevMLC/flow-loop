# State file

One file per project: `.flow/STATE.md`. It replaces `.planning/`, phase directories,
plan documents, and every other multi-file planning store.

Small on purpose — it is read at the start of every session. Keep it under ~100 lines
by archiving finished work to `.flow/ARCHIVE.md`.

## Format

```markdown
# <project> — Flow state
Updated: <YYYY-MM-DD>

**Project skill:** .claude/skills/<project>/SKILL.md  <PLAN wrote it; the owner confirmed it; every criterion below cites it>

## Now
**Goal:** <one sentence — what done looks like for THIS phase, derivable from the project skill>
**Gate:** FRAME | BUILD | CHECK | SHIP
**Next action:** <the literal next thing to do — resume.md and continuous.md both continue from this>
**Authority:** <the document that decides values here, if any — references/authority.md writes it>
**Mode:** normal | autonomous | non-stop
**Wakes since commit:** <0 — only under `/loop`; at 2 the loop stops>
**Phases since review:** <0 — only in non-stop; at 3 the run audits itself and, if green, continues>

### Acceptance criteria
- [ ] **A1** <statement> · `by test` · from: <skill section, e.g. jobs / flows / entities>
- [ ] **A2** <statement> · `by artifact`: <what is produced, where saved> · from: <skill section>
- [ ] **A3** <statement> · `by person`: <the question a reader answers> · from: intent

<!-- `from:` is required on every criterion. The commit gate refuses a phase whose criteria
     cite nothing once a project skill exists. Cite the skill section the criterion serves, or
     `intent` for something the owner said directly. A criterion with nothing to cite was
     invented — it goes to plan review as a question, not into the build. -->

### Not building
- <explicit exclusion agreed during brainstorming>

### Tasks
- [x] <task> — <commit sha>
- [ ] <task>

### Findings — not acted on, deliberately
- <what was noticed, why it was left, and what deciding it would need>

### Analogs
- <new file> mirrors <existing file> — <what is being matched>

### Assumptions
- <fact assumed, because research was capped at one pass>

### Constants register
| Value | Means | Stated at | Lives in code | Verified |
|---|---|---|---|---|
| <value> | <what it governs> | <authority file:line> | <symbol or path> | [ ] |

### Threat register
- **T1 — <what an attacker does>** — likelihood / impact / mitigation / lives in / proven by
  (`references/threat.md` owns the full block and ranks the register by likelihood)
- **Accepted:** <risk not mitigated, and why>

### Debugging
- **Symptom:** <what fails, and the exact command that reproduces it>
- **Ruled out:** <hypothesis — how it was falsified>
- **Next:** <the candidate being tested now>

### Deviations
- <what changed from plan, and why>

## Next
- <the following goal, one line>

## Decisions
- <YYYY-MM-DD> <decision> — <why, in one clause>
```

## Rules

- **One writer.** STATE.md is updated in the same commit as the work it describes — the
  commit gate refuses a source commit that leaves it untouched in this commit or either of
  the last two. Not continuously, and not
  batched up at the end of a gate.
- **Absolute dates.** Never "last week" or "yesterday."
- **No narration.** Facts and decisions, not a session log.
- **Archive on SHIP.** Move the finished `## Now` block to ARCHIVE.md, then compact.
- **Do not duplicate the repo.** Nothing that git history, the code, or CLAUDE.md
  already records belongs here.

## Session start

Read `.flow/STATE.md` if it exists — that read is the whole context restoration step.
If it does not exist, the project has not been framed. If no project skill exists either,
start at PLAN; the plan gate will not let code through until it does.

## Project profile — `.flow/PROJECT.md`

Written once, on the first FRAME. Read by every FRAME after that **instead of surveying
again**. This is the difference between deriving the same facts once and deriving them every
phase forever.

Update it only when something in it turns out to be wrong. It is a cache, not a document.

```markdown
# <project> — profile
Updated: <YYYY-MM-DD>

## Stack
<language, framework, database, package manager, test runner>

## Commands
- test:      <the full suite>
- test_fast: <unit tests only — no containers, no network. Used by the commit gate.>
- test_one:  <run a single file, e.g. pnpm vitest run <file>>
- typecheck: <e.g. tsc --noEmit>
- lint:      <e.g. eslint .>
- run:       <start the app>

## Conventions
- <error handling, naming, module layout, how results are returned — one line each>

## Design standard
Only if the project has a user interface. `references/uiaudit.md` verifies screens against
this section and treats it as the authority that matters more than any generic rubric — when
it is absent, that check silently degrades to generic pillars. Record the styling layer, the
component library, the palette and type, and any rule a screen could break while still looking
fine ("no user appears in rank order against another", "no widget shows location or a ranking
mechanic").

## Analogs
- new API endpoint -> <closest existing one>
- new db module    -> <closest existing one>
- new test         -> <closest existing one>

## Landmarks
- <where the things you keep looking for actually live>
```

**Commands are the load-bearing part.** The CHECK machine pass, the commit gate, and
affected-test selection all read them. Without `test_fast` the commit gate cannot run, and
without `typecheck` the cheapest accuracy check in the loop is skipped.

**Analogs are the speed part.** FRAME's "find the closest existing file" becomes a lookup
rather than a search, and new code keeps matching the code around it.

If the profile is missing, FRAME writes it as its first act. If a command in it fails, fix
the profile — do not work around it silently, or the next phase pays the same cost again.

## The project skill — `.claude/skills/<project>/SKILL.md`

Written by PLAN, confirmed by the owner, read by every FRAME and every session. **This is the
authority on what the product is.** It is a real skill — auto-loaded in that repository,
invokable by name — the same shape as a specification skill someone would write by hand.

The plan gate looks for the frontmatter line `flow-project-skill: true`; without it, no skill
is found and source writes are denied. The confirmation is `.flow/plan-confirmed` holding the
skill's hash — the gate prints the exact command — and the loop is denied from writing it.

```markdown
---
name: <project-kebab>
description: Specification for <Project> — <one line, what it is> (<its parts>). Use when designing, scoping, building, reviewing, estimating, or auditing any part of the system, or when answering questions about its features, workflows, data, architecture, or delivery plan.
flow-project-skill: true
---

# <Project>

## What this is — in the owner's words
> <the request, quoted verbatim — every message that shaped it, not a paraphrase>

## Who uses it
- **<role>** — <what they are trying to get done, in one line>

## The jobs
One line each, as a person would say it at work. "Get paid for a booking", not "Commission Module".
- <job>

## The process flows
Three lines each: who starts it, what states it passes through, who acts, where it ends, who
sees the result. **SHIP drives every flow listed here against a disposable database.**
```
<actor> <does> -> <state>; <who sees it, where>
```

## What it is not
- <exclusion the owner has seen and agreed>

## Entities and lifecycles
- **<entity>** — states: <a> → <b> → <c>. Forward by <who/what>. Back by <who/what>, or never.

## Boundaries
- <module or service> owns <what>; must never <what>

## Authorities
- <value or rule> is decided by <document, section> — never by the code

## Design standard
See `.flow/PROJECT.md` § Design standard, or state it here if PLAN wrote it first.

## Milestones
- **M1 — <name>**: <the jobs a person can do when it ships>
- **M2 — …**

## Decisions
- <YYYY-MM-DD> <decision> — decided by <owner | agent, as an assumption>

## Open questions
- <question> — never an assumption; a phase that needs the answer stops and asks

## Confirmed
<the owner may note the date here; the LOOP NEVER WRITES TO THIS FILE after the owner
 has confirmed it. The confirmation lives in .flow/plan-confirmed, and editing the skill —
 even to record that it was confirmed — changes its hash and revokes the confirmation.>
```

**Every acceptance criterion in STATE.md cites a section of this file** (`from: jobs`,
`from: flows`, `from: entities`) or `from: intent` for something the owner said directly.
A criterion with nothing here to cite was invented.

**Change it deliberately.** Corrections during FRAME's audit are written with the date and
change the hash, so the owner re-confirms. That friction is the point — the skill is theirs,
and a skill an agent edits freely is the research document this stage replaced.

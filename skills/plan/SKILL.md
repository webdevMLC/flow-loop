---
name: plan
description: The first stage of Flow, once per project and at milestones — five experts on the intent (researcher, system architect, systems engineer, dataflow and process specialist, UI/UX), the process flows drawn and every screen designed and captured as an image the owner reviews before anything is built, the shape-changing decisions put to them, and the project skill written and confirmed. Use at a new project, when adopting an existing codebase, at a module or milestone boundary, when a feature is big enough to need its own research, or when the owner says the result is not what they wanted. The plan gate denies source writes until this has run and the owner has confirmed its output.
---

# PLAN

Every other stage checks work against criteria. PLAN is the only stage that decides whether
the criteria are for the right product — and it produces the artifact every later stage, and
every later session, is checked against: **the project skill.**

It exists because of a specific failure, shipped twice this month: twenty-plus phases, every
gate green, and the wrong product. On one project an 18KB structural analysis "written before
FRAME" declared the goal settled on the agent's authority, and the owner found out when they
created a tournament and had nowhere to see it. No stage had asked what they wanted; no
artifact recorded it; nothing later could be checked against it; **and nobody had drawn the
screen they would land on.**

## When it runs

- **A new project's first Full task**, before any phase is framed.
- **Adopting an existing codebase** — in existing mode, where the central question is the
  gap between what was meant and what exists.
- **A milestone or module boundary.** A feature large enough to get its own research
  document is a module boundary. So is anything described as "mirrors <existing feature>".
- **When the owner says the result is not what they wanted.**
- **When the owner runs `/flow:plan`.**

**Never per phase.** Once the project skill exists, FRAME audits it and frames against it;
PLAN runs again only to *change* it.

**The plan gate enforces this.** Source writes are denied while `.flow/STATE.md` exists and
no project skill does, and again until the owner has confirmed the skill. Nothing in this file
needs to persuade an agent to run PLAN; the hook does.

## Step 1 — the intent record, before anything else

Before research, before experts, before a survey: write down what was asked for, **in their
words.** This is the only part of the plan that is not yours, and it is what every criterion
will trace back to.

```markdown
## What this is — in the owner's words
> [the request, quoted verbatim — every message that shaped it, not paraphrased, not improved]

**What they want to be able to do:** <one line per job, as they would say it at work>
**What they said it must not be or do:** <or "nothing stated">
**Not said, therefore a question:** <each one — never an assumption>
```

**Research does not settle the goal.** If the domain needs understanding first, the output of
that research is *questions for the owner and candidate jobs to confirm* — never a data
model, a module layout or a roadmap. Those come after the owner has confirmed the intent.

**"Sounds clear enough" is the judgement that fails.** "Add tournament mode" and "mirror
OpenPlay" sound specific. They are not: the agent fills every gap fluently, and nothing marks
where the request ended and the invention began. If the goal cannot be stated in one sentence
someone else could verify, read `references/brainstorm.md` **in the loop skill** and do that
first — with the owner.

## Step 2 — the experts

Spawn them **in a single message** so they run concurrently, the same shape as CHECK's
adversarial pass but pointed at the intent rather than a diff. Each gets the intent record,
the owner's inputs, any authority documents, and — in existing mode — the code. **Each returns
gaps and decisions, never a report to admire.**

**Researcher — what is this for, and what does the domain require that nobody wrote down?**
Reconstruct the intent from the owner's words, not from any roadmap. Who are the real users
and what is their job? What do comparable systems do that this plan does not mention? What
does the domain oblige — a regulation, a tax rule, a convention, a document someone must
produce? Name what the plan silently assumes about the world.

**System architect — what shape should this be, and where do the boundaries go?** Module and
service boundaries, what belongs together and what must never, the domain model and its
language, the contracts between parts. Then: **what is most likely to change, and does this
structure let it?** A boundary drawn around today's org chart rather than the domain is the
commonest architectural mistake and among the most expensive to undo. In existing mode: where
has the structure already drifted, and which drifts are load-bearing now.

**Systems engineer — will it hold up, and who operates it?** Integration points, failure
modes, what happens when a dependency is down, what scale it assumes, what deployment and
rollback look like. Then the question usually skipped: **who runs this once it is live**, how
do they see it is working, what do they do at 2am. A system with no operator is a demo.

**Dataflow and process specialist — what happens to the data, and can the business change
it?** The entities, their lifecycles, the state machines, the integrity rules. Every state:
what moves it forward, what moves it back, who may. And **which values does the business own,
and can they change them without an engineer?** A rate that only a migration can alter is a
defect however green the suite.

**UI/UX expert — what job does a person actually perform?** Not the screens; the sequence.
Walk the commonest task end to end and count the steps. Where must the person know something
the system could have told them? Where do they wait, and does anything say so? **Every job
that creates something: where does the person see it afterwards?** Then judge the whole: *is
this a job someone can do all day, or a set of correct modules that do not compose into work?*

**Extend the set when the domain demands it** — a security lens for anything holding
credentials or money, a compliance lens where a regulator is involved, a mobile lens where
the field is the primary surface. Say which were added and why.

The architect and the engineer will disagree. So will the engineer and the UX expert. **The
owner should see the tension, not a merged compromise nobody chose.**

## Step 3 — the process flows, in text, now

The first output: the handoff chain for each kind of user. Who starts it, what states it
passes through, who acts at each one, where it ends, who sees the result. Three lines per
flow, **in the message**, before anything is drawn:

```
organiser creates a tournament   -> it appears in their list, status: draft
organiser publishes it           -> players can find it and join
player joins                     -> organiser sees the entry; player sees their status
```

A person who cannot review an architecture can tell you in ten seconds that their organisers
would never do it in that order — and that the third line is missing.

## Step 4 — the decisions, put to the owner

Not every question — the three to seven that change the shape of the product. Each stated as
a choice with its consequence, batched into one `AskUserQuestion`.

**These stop and ask even under a standing autonomous mode.** Everywhere else in Flow an
unanswered question becomes a recorded assumption. Here it does not: these are the
assumptions that shape the product, and recording one silently is exactly how a project
reaches twenty green phases of the wrong thing. If the owner is unavailable, PLAN stops with
the questions ready.

## Step 5 — write the project skill

The durable artifact. It lives at **`.claude/skills/<project>/SKILL.md`** with
`flow-project-skill: true` in its frontmatter — a real skill, auto-loaded by every session in
that repository, invokable by name. FRAME audits it; BUILD is checked against it; SHIP's data
pass drives the flows it names; a session six weeks from now loads it before touching anything.

`references/state.md` **in the loop skill** carries the format: the intent in the owner's words
· who uses it · the jobs · the process flows · what it is *not* · entities and lifecycles ·
boundaries · which document decides which values · the milestones as jobs delivered ·
decisions taken, with who took them · open questions, never assumptions.

## Step 6 — draw it, and publish the plan as an artifact

**The owner reviews pictures, not prose.** Read `references/artifact.md` and publish one
artifact — or write `.flow/plan/index.html` where no artifact tool exists — that shows:

- **every process flow as a diagram**, the same flows as step 3, drawn
- **a designed picture of every screen a job lands on** — the theme applied, real components,
  real content, **captured as a PNG into `.flow/plan/screens/`** at desktop and 375px. Not a
  wireframe — the owner judges the product from these, and grey boxes are not a product. This
  is the picture that would have shown a tournament with nowhere to appear after it was
  created, and the obsolete-looking screens nobody saw until after they were built
- **every entity's lifecycle as a state diagram**
- **the boundaries** as one diagram
- **what it is not**, and **the decisions** with what was chosen
- **the confirm command**, with the skill's hash, at the bottom

Compute the hash after the skill is written — `sha256` of the file, first twelve hex
characters — because that is what the plan gate checks. Then put the artifact link in the
message with one sentence: *open this, look at the flows and the screens, and if that is the
product you want, run the command at the bottom.*

## Step 7 — the owner confirms

**That is the gate.** PLAN is not done when the skill is written; it is done when the owner
has looked at the flows and the screens and said yes — by creating `.flow/plan-confirmed` with
the hash. The loop is denied from writing that file, so the confirmation is theirs and only
theirs. If they correct the skill instead, the hash changes and they confirm again.

**Never write the confirmation back into the skill.** Writing into the file whose hash the
confirmation certifies invalidates it immediately — the next source write is denied as "changed
after the owner confirmed it", and the owner cannot tell that from tampering. The confirmation
lives in `.flow/plan-confirmed` and nowhere else; the skill's `## Confirmed` line is a
placeholder the owner may fill, not something the loop updates.

The same applies to FRAME's audit corrections: they are *meant* to change the hash, and the
owner re-confirms. That friction is the design. An unintended edit — a date, a tidy-up, a
reformat — produces the same lockout for no reason, so do not make one.

## What it must not become

**Not a survey.** `references/gates.md` **in the loop skill** step 3 surveys the codebase; guard
2 forbids researching twice. PLAN reads the intent, the inputs and — in existing mode — the
code. It does not go looking beyond them.

**Not a design document.** Its outputs are flows, designed screens as images, a question batch
and a skill. A forty-page analysis is a way of avoiding the question.

**It is a design, and it is meant to be judged.** The screens are drawn as they are meant to
ship, in the theme, with real content, and captured as images. They will be wrong in places —
that is why they are shown before anything is built. What PLAN does not do is *build* them.

**Not a brand exercise.** Choose one of the seven themes, apply it, move on. PLAN shows the
product in a credible skin so the owner can judge it; it does not design a visual identity, and
it does not iterate on one. `/flow:theme` owns the look, `/flow:uiux` owns the screens as built.

**Not a substitute for the owner.** Five experts agreeing with each other is not
confirmation. Self-consistency is what the failed projects had in abundance.

## It costs, and it saves more

Five or more concurrent subagents and one artifact, once per project or milestone. Against a
phase that ships, expensive. Against twenty-two phases of correct work on the wrong workflow,
the cheapest thing in this framework. Say what it cost in the report.

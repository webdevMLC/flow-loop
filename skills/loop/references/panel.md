# The panel — five experts on the intent, before anything is built

CHECK stage 3 puts four independent readers on the diff. This puts five on **the thing itself**,
before there is a diff to read.

It exists for one failure, and it is the most expensive one this framework can produce: **every
gate green, twenty-two phases shipped, and the wrong product.** Conformance gates prove code
matches criteria. Nothing in them asks whether the criteria were the right criteria, so a
project can be built impeccably and still not be the thing anyone wanted. That failure is
invisible until someone opens the finished system, which is far too late.

The panel is the only gate in Flow that examines **intent** rather than work.

## When it fires

Rarely and deliberately. This is not a per-phase pass.

- **A new project, at the first FRAME**, before the roadmap is written.
- **Adopting an existing codebase**, before the first phase is framed.
- **At a milestone or module boundary** — a new subsystem, a new kind of user, a new
  money or identity flow.
- **When the user asks**, or says the result is not what they wanted.

**Never per phase.** A phase is too small a unit to have an intent worth five experts, and
running this every phase would make FRAME the most expensive gate in the loop rather than the
cheapest.

## Two modes

**Greenfield.** There is no code. The panel reads the brief, the inputs the user actually
supplied, and any authority documents — and examines what is *proposed*. Its job is to find
what the plan has not thought about yet.

**Existing or half-built.** There is code. The panel reads the intent **and** the system, and
its central question is the gap between them: what was meant, what exists, and where those two
stopped matching. Most projects that need this panel are in this state, and the divergence is
usually older than anyone thinks.

Say which mode you are in before starting. They ask different questions and produce different
output.

## The five lenses

Spawn them **in a single message** so they run concurrently, the same way CHECK stage 3 does.
Each gets the brief, the inputs, and — in existing mode — the code. Each returns gaps and
decisions, never a report to admire.

**Researcher — what is this actually for, and what does the domain require that nobody wrote
down?** Reconstruct the intent from the user's own words, not from the roadmap, which is already
an interpretation. Who are the real users and what is their job? What do comparable systems in
this domain do that this plan does not mention? What does the domain oblige — a regulation, a
tax rule, an industry convention, a document someone must be able to produce? Name what the
plan has silently assumed about the world.

**System architect — what shape should this be, and where do the boundaries go?** The module
and service boundaries, what belongs together and what must never, the domain model and the
language it uses, the contracts between the parts. Then the question that decides whether the
project survives its second year: **what is most likely to change, and does this structure let
it?** A boundary drawn around today's org chart rather than around the domain is the commonest
architectural mistake and among the most expensive to undo. In existing mode: where has the
structure already drifted from the model, and which of those drifts are load-bearing now.

**Systems engineer — will this hold up, and who operates it?** Integration points, failure
modes, what happens when a dependency is down, what scale it assumes, what the deployment and
rollback actually look like. Then the question that is usually skipped: **who runs this once it
is live**, how do they see that it is working, and what do they do at 2am. A system with no
operator is a demo with a deployment.

The architect designs the shape; the engineer decides whether that shape survives contact with
reality. They will disagree, and that disagreement is worth more than either answer alone.

**Dataflow expert — what happens to the data, and can the business change it?** The model, the
lifecycles, the state machines, the integrity rules. Every state: what moves it forward, what
moves it back, who is allowed to. And the ownership question: **which values does the business
own, and can they change them without an engineer?** A rate, a threshold or an approval matrix
that only a migration can alter is a defect however green the suite. See
`references/dataflow.md`, which checks the same property per phase once code exists.

**UI/UX expert — what job does a person actually perform?** Not the screens; the sequence. Walk
the commonest task end to end and count the steps and the screens. Where does the person have to
know something the system could have told them? Where must they wait, and does anything say so?
Which handoffs have no notification? Then judge the whole: **is this a job someone can do all
day, or a set of correct modules that do not compose into work?**

That last question is the one that catches the failure this panel exists for.

## What it produces

Three things, and the first is the point.

**1. The process flow, drawn, before it is built.** The handoff chain for each kind of user —
who starts it, what states it passes through, who acts at each one, where it ends, who sees the
result. Three lines of plain text per flow is enough:

```
associate claims a prospect       -> status: claimed, 30-day hold
associate submits a booking       -> status: pending
team lead approves (Approvals screen, in-app badge) -> status: earned
month-end run                     -> status: paid, on the statement
```

**Show this to the user and get it corrected.** It is cheap to read, it is the thing they have
an opinion about, and it is the artefact whose absence causes the failure. A person who cannot
tell you whether your architecture is right can tell you in ten seconds that their associates
would never do it in that order.

**2. The decisions only the user can make.** Not every question — the three to seven that
change the shape of the product. Each stated as a choice with its consequence, batched into one
`AskUserQuestion`, per guard 7.

**3. The gaps.** What the plan assumes exists and does not; what the domain requires and the
plan omits; in existing mode, where the built system and the intent diverged. These become
roadmap items with their evidence, not a document.

## The decisions go to the user — autonomous mode does not cover them

This is the rule the whole panel rests on, and the one most likely to be lost.

Everywhere else in Flow, an unanswered question becomes a recorded assumption and the run
continues. **Here it does not.** These are the assumptions that shape the product, and
recording one silently is exactly how a project arrives at twenty-two green phases of the wrong
thing — the failure this file exists to prevent.

So: **the panel's decisions stop and ask, even under a standing autonomous mode**, the same way
pushing and spending money do. If the user is unavailable, the run stops with the questions
ready rather than guessing and proceeding. A night spent waiting costs less than a week spent
building the wrong workflow.

Everything the panel finds that is *not* a shape-changing decision follows the normal rule:
assume, record, continue.

## What it must not become

**Not a survey.** `references/gates.md` step 3 already surveys the codebase and guard 2 forbids
researching the same thing twice. The panel reads the intent, the inputs, and — in existing
mode — the code that already exists. It does not go looking for new information beyond that.

**Not a design document.** The output is a flow diagram, a question batch and a gap list. A
forty-page analysis is a way of avoiding the question.

**Not five agents agreeing.** Each lens is answerable for its own domain and is expected to
contradict the others: the systems engineer wanting a queue and the UX expert wanting an
immediate result is a real tension, and so is the architect wanting a boundary the engineer
thinks is one deployment too many. The user should see the tension, not a merged compromise
nobody chose.

**Not a substitute for brainstorming.** `references/brainstorm.md` runs first when the goal
itself is unclear — the panel examines a goal that exists. Brainstorming with five experts and
no user is how you get a confident plan for a problem nobody has.

## It costs, and it saves more

Five concurrent subagents on the intent, once per project or milestone. Against a phase that
ships, it is expensive. Against twenty-two phases of correct work on the wrong workflow, it is
the cheapest thing in this framework.

Say what it cost in the report, the way `/flow:ultra` does.

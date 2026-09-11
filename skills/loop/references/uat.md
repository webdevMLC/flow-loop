# Closing a `by person` criterion

`references/evidence.md` creates three classes and can only settle two of them. A `by person`
criterion — does this message help, is this readable, would someone know what to do next — is
reported open and never closed by the loop. That was deliberate and it is only half a
mechanism: criteria that can never close accumulate until nobody reads them.

This is the other half. It is a short, structured session where a person answers exactly the
questions that are open, and the answers are recorded so they are never asked twice.

## It never blocks an unattended run

The run does not stop and wait for a person. **It prepares the session and continues.**

Write `.flow/UAT.md` — one entry per open criterion, appended as phases ship. When the user
comes back, that file is the whole agenda. A night of work produces a queue someone clears in
ten minutes, not a run that halted at 2am waiting to be asked a question.

## Two classes, and only one of them has to wait for you

Not every `by person` question needs the owner. Treating them alike is what makes the queue
feel like a tax: a question about the wording of an error message stops the build with the
same force as a question about the commission rate, and only one of those is worth stopping
for.

**Every entry carries a class, in its heading.**

| Class | What it is | Who answers |
|---|---|---|
| **`judgement`** | a competent practitioner's answer is defensible, and being wrong costs a revision: wording, an empty state, a default, a layout, a convention, an error message | **the loop may answer it** under autonomous or `.flow/uat-trust` |
| **`owner`** | only the owner knows, and being wrong costs money, breaks a policy, or produces the wrong product: a rate, a threshold, who may do what, a domain rule, anything about how their business actually works | **only the owner, always** |

**An unclassified entry is treated as `owner`.** Failing closed is the point: a question
nobody classed is not a question the loop gets to answer.

The test for which class: *if the owner saw the answer a month later, would they be surprised
it had been decided without them?* Surprise means `owner`. "That seems reasonable" means
`judgement`.

Two real ones, side by side:

- *"Would an associate in the field know what to do next from each of these four refusal
  messages?"* → **`judgement`.** There is a professional standard for this — say what went
  wrong, say what to do next, no jargon, no blame — and the answer is checkable against it.
- *"Is the recruiter's override 5% or 7%?"* → **`owner`.** No amount of best practice
  produces that number, and getting it wrong puts the wrong figure on every statement.

## When the loop answers a `judgement` entry

Under autonomous, or when the owner has written `.flow/uat-trust`, the loop answers the
`judgement` entries rather than queueing them. Three rules:

**Answer against a named standard, not a preference.** "These meet the error-message standard:
each says what went wrong and what to do next, none blames the user, none uses jargon" is an
answer. "Looks fine to me" is not, and it is the failure mode this whole file exists to stop.

**Record it as a decision, with the reasoning**, so the owner can overturn it in one sentence
six weeks later:

```markdown
### A11 — the refusal and guidance messages · Phase 1 · `judgement` · closed

**Look at:** `.flow/evidence/1/sign-in-wrong-password-desktop.png`

**Question:** would an associate know what to do next from each of these four messages?

**Answered:** agent · 2026-09-11 · **yes**
Against the standard: each names what went wrong, each says what to do next, none blames the
user, none leaks whether the email exists. The suspended message routes to a real person
("ask your manager or the programme admin"), which is the part most systems get wrong.
**Overturn this** by editing the answer — the wording is four strings in `messages.ts`.
```

**Never answer an `owner` entry**, however obvious it looks, however long it has waited, and
however clearly autonomous mode is on. The plan gate refuses a commit where an `owner` entry
is marked answered by the agent — the same way PLAN's shape-changing decisions stop even
under a standing autonomous directive.

## One entry per open criterion

```markdown
### A6 — the empty pipeline state · Phase 12 · `judgement` · open

**Look at:** http://localhost:3100/pipeline with no leads, or
`.flow/evidence/12/pipeline-empty.png`

**Question:** does this tell a new associate what to do next, without them having read the
playbook?

**Yes means:** the criterion closes.
**No means:** a MAJOR finding — the empty state is the first thing every new user sees.

**Answer:**
```

The parts that matter: **one specific question**, the **class**, the **artifact or the exact
route**, and what each answer implies. A question like "does the UI look good?" cannot be
answered and should never be written — if that is the best question available, the criterion
was too vague at FRAME and the fix belongs there.

## Running the session

Batch every open criterion into one pass — guard 7, one question batch per gate. Ask them in
order, take the answers, and:

- **Yes** → mark the criterion closed in STATE.md, with the date and that a person judged it.
- **No** → it becomes a finding at the severity the entry predicted, and enters the task list.
- **Unsure** → it stays open, and the question is rewritten. An unanswerable question is a
  defect in the question.

Never re-ask a closed criterion. That is what the recorded answer is for, and re-asking is the
same waste as re-researching a settled fact.

## What must never happen

**The loop must not answer its own `by person` question.** It may prepare it, capture the
artifact and predict the severity. It may not decide. A loop that closes its own judgement
criteria has reinvented the substitution that `references/evidence.md` exists to prevent — the
only difference is it now happens under a heading that says a person did it.

**A UAT queue that only grows is a signal, not an inbox.** Past five open entries in
`.flow/UAT.md`, an unattended run stops and reports rather than selecting more work — the
non-stop checkpoint counts them (`references/nonstop.md`, audit item 5). Judgement piling up
unjudged is the same failure as tests nobody runs.

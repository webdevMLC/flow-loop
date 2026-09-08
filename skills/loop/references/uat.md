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

## One entry per open criterion

```markdown
### A6 — the empty pipeline state · Phase 12 · open

**Look at:** http://localhost:3100/pipeline with no leads, or
`.flow/evidence/12/pipeline-empty.png`

**Question:** does this tell a new associate what to do next, without them having read the
playbook?

**Yes means:** the criterion closes.
**No means:** a MAJOR finding — the empty state is the first thing every new user sees.

**Answer:**
```

The parts that matter: **one specific question**, the **artifact or the exact route**, and
what each answer implies. A question like "does the UI look good?" cannot be answered and
should never be written — if that is the best question available, the criterion was too vague
at FRAME and the fix belongs there.

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

**A UAT queue that only grows is a signal, not an inbox.** If `.flow/UAT.md` passes five open
entries, the checkpoint in `references/nonstop.md` stops the run. Judgement piling up unjudged
is the same failure as tests nobody runs.

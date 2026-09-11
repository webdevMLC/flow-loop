# Blockers — found before BUILD, and cleared before the plan is confirmed

A blocker is anything that would stop BUILD once it starts. The point of finding them here is
that a blocker costs minutes at PLAN and a day mid-phase, when the context is loaded, the
branch is half-written, and the answer has to come from someone who is asleep.

**Every expert returns blockers alongside their gaps.** The architect knows which boundary
cannot be drawn until someone decides who owns the ledger. The engineer knows there is no
sandbox account. The dataflow specialist knows nobody has said which document sets the rate.
Ask for them explicitly, in the same message that asks for gaps — an expert who is not asked
for blockers returns findings and leaves the blockers implied.

## The three classes, and why the third is the one that matters

| Class | What it is | Cleared by |
|---|---|---|
| **`decide`** | a question only the owner can answer | the decision batch — it joins step 4 |
| **`obtain`** | something that must exist: a credential, a sandbox, a spec, a fixture, a dataset, an account | a person producing it; PLAN cannot clear it alone |
| **`prove`** | an assumption the plan rests on that nobody has tested | **a spike — running something** |

`decide` and `obtain` are bookkeeping. **`prove` is the class that ships broken products**,
because it does not feel like a blocker. It feels like confidence.

> *"FRAME said it will mirror OpenPlay, so I was confident. Then after creating a tournament
> I did not know where to see it. And when I asked, it said it is a real gap."*

That was a `prove` blocker that nobody wrote down, because everyone believed it. The rule that
catches it:

**An assumption load-bearing enough that the plan would change if it were false is a blocker,
however confident everyone is.** Confidence is not evidence. The two phrases that should
always produce one: *"it mirrors X"* and *"it works the same way as Y."*

## A spike is the smallest thing that answers yes or no

Not a prototype, not a phase, not production code. A throwaway that settles the question and
is then deleted or kept as a note:

- **"It mirrors X"** — open X. Enumerate what it actually does, every path, and list what the
  new thing must therefore do. The failure is never the mirror; it is the three behaviours
  nobody listed.
- **"The API returns the field we need"** — call it once against the sandbox and read the
  response. One curl settles a week of design built on a field that is not there.
- **"The library supports this"** — twenty lines that do the thing. Read the error.
- **"The schema can hold this"** — write the migration against a disposable database and
  insert one row of the awkward shape.
- **"The existing code can be extended here"** — read the call sites and say how many. "It is
  extensible" is an opinion; "nine call sites, four of them in the mobile app" is a finding.

Write what happened to `.flow/plan/spikes/<id>-<slug>.md`: what was asked, what was run, what
came back, and **what changes in the plan because of it.** A spike that changed nothing is
still worth its file — it is the record that the assumption was tested rather than believed.

**Never spike in the project's source tree.** A disposable copy, a scratch file, a sandbox
account. A spike that leaves code behind has become an unplanned phase.

## The register

`.flow/plan/blockers.md`, one line each, in this format — the gate reads it:

```markdown
## Blockers

- [x] **B1** Xendit sandbox credentials for the tournament rail · `obtain` ·
      resolved: owner supplied 2026-09-11, in .env.local, one call verified
- [x] **B2** "It mirrors OpenPlay's reconciliation rail" · `prove` ·
      resolved: .flow/plan/spikes/b2-openplay-rail.md — it does not cover superseded-paid
      or amount mismatch; both added to the plan as D4 and D5
- [x] **B3** Which document decides the entry-fee split? · `decide` ·
      resolved: the organiser's tournament settings, owner 2026-09-11
- [ ] **B4** Production Xendit account for go-live · `obtain` · open — not needed before BUILD
```

Rules the gate enforces:

- **Every blocker names a class.** An unclassified blocker is one nobody decided how to clear.
- **A ticked blocker carries `resolved:` and says what settled it.** "Resolved" alone is the
  same claim as a green test nobody ran.
- **A ticked `prove` blocker names a spike file that is on disk.** This is the one that
  catches confidence — the file has to exist, because the assumption had to be run.
- **An open blocker stops the confirmation**, unless its line says why it does not block BUILD
  (`open — not needed before BUILD`, with the reason). Deferring is allowed; deferring silently
  is not.

## What this does not promise

**It does not mean BUILD will never stop.** Some blockers are only discoverable by building —
the contradiction between two requirements that only shows up when you implement the second,
the library behaviour that only appears at the third call site. Those are found in BUILD
because they cannot be found anywhere else, and a plan claiming otherwise is lying.

**And some stops are not blockers.** BUILD stopping to push, to spend money, to touch secrets
or to delete data is a safety boundary working correctly. Never clear one of those at PLAN.

What this guarantees is narrower and worth more: **no blocker that was knowable reaches BUILD
unresolved, and no assumption the plan rests on goes untested.** The tournament's blocker was
knowable. Nobody looked.

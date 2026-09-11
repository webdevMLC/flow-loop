# What counts as proof

Every gate in this skill was built to accept one kind of evidence: a command that exited 0.
That is why a system can pass every gate and still be unusable — when a claim cannot be
settled by a command, the loop reaches for the nearest command that can, and closes the claim
with it. "A manager sees the scorecard" becomes a passing test of `computeScorecard`, and
nothing anywhere is a lie.

The fix is not more rules about screens. It is to make the *kind* of proof explicit, so a
claim that no command can settle is visible instead of quietly converted.

## Three classes, named at FRAME

Every acceptance criterion carries how it will be proven. Decide it when you write the
criterion, not when you try to close it.

| Class | Settled by | Example |
|---|---|---|
| **`by test`** | a command exiting 0 | a refund produces a reversal, never an edit |
| **`by artifact`** | something produced that a person can open and judge | `/scorecard` renders one associate per screen |
| **`by person`** | judgement no artifact settles | the refusal message tells the user what to fix |

Write it into the criterion:

```markdown
- **A3 The scorecard is on screen.** `by artifact` — /scorecard/[id] renders §42's seven
  benchmarks with no metric beside any name in a list.
- **A6 The empty state helps.** `by person` — it says what to do next, in words that make
  sense to someone who has not read the spec.
```

**A criterion with no class is `by test` by default, and that default is the bug.** If writing
the class feels awkward because the criterion is vague, the criterion is vague — fix it there.

## Producing artifact evidence

`by artifact` is the class this skill was missing, and it is mechanical. The artifact must be
**produced during CHECK and saved**, not described:

- a screenshot of the route, at desktop and at 375px
- the rendered HTML of a page, fetched and saved
- a browser-driven test's trace or video
- the actual output file a generator produced
- a recording of the CLI session for a terminal tool

Save under `.flow/evidence/<phase>/` and name each one for the criterion it settles. Use
whatever the project and host actually provide — a browser tool, Playwright, `curl` piped to a
file, the host's own preview. **If nothing can produce it, the criterion is `by person`, not
`by test`.** Silently downgrading to a unit test is the failure this file exists to prevent.

An artifact proves the thing exists and renders. It does not prove the thing is good — that is
the next class, and the two are not interchangeable.

## `by person` — the class that must stay open

A criterion no artifact settles is **never closed by the loop.** It is reported as awaiting
review, with the artifact if one exists and a specific question:

```
AWAITING REVIEW — A6, the empty pipeline state
  Evidence: .flow/evidence/12/pipeline-empty.png
  Question: does "No opportunities yet — claim a prospect to start one" tell a new
  associate what to do, without knowing the playbook?
```

A phase may ship with open `by person` criteria. **It may not ship with them silently closed.**
An unattended run that reports three criteria awaiting review has done its job; one that closes
them because the tests were green has not.

## The evidence ledger

Every CHECK report and every SHIP report ends with the count. One line, and it is the fastest
way for a reader to see what kind of confidence they actually have:

```
Evidence: 6 by test (pass), 3 by artifact (saved to .flow/evidence/12/), 2 by person (open).
```

A phase reporting "all criteria met" with nothing but `by test` on a goal about people is the
signature of the defect. On a run left alone overnight, this line is the only thing standing
between a green report and a system nobody can use.

## Why this generalises past screens

The blind spot is not about user interfaces. It is about anything a command cannot settle, and
the same substitution happens everywhere:

- **Error messages.** A test asserts a 400 is returned. Whether the message tells anyone what
  went wrong is `by person`.
- **Generated output.** A test asserts a PDF is produced. Whether it is readable is `by
  artifact`, and whether it is correct for its audience is `by person`.
- **API ergonomics.** A test asserts the endpoint works. Whether a caller can use it without
  reading the source is `by person`.
- **Documentation and copy.** Never `by test`. A link checker is not a reader.
- **Performance under real conditions.** A benchmark is `by test`; whether it feels fast on the
  device the work happens on is `by artifact` at best.

Any of these can be built, tested, shipped and green while being useless, and each will be,
unless the criterion says what would actually prove it.

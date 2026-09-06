# Debugging

For any bug, test failure, or unexpected behavior. Read this **before** proposing a fix.

The expensive failure mode is guessing: changing something plausible, re-running, and
changing something else. That is a loop with no exit. This protocol has an exit.

## The rule

**No fix before a reproduction and a falsifiable hypothesis.** If you cannot state what you
expect to see and what would prove you wrong, you are guessing.

## Cycle

Record the bug in `.flow/STATE.md` under `### Debugging` before you start. It survives a
context reset; your working memory does not.

**1. Reproduce.** Get a deterministic command that fails. If it is flaky, that flakiness is
the bug — find what makes it vary (ordering, clock, concurrency, leftover state) before
anything else. A bug you cannot reproduce cannot be verified as fixed.

**2. Read the actual error.** The whole stack trace, the whole assertion diff, the real line
number. Not the summary. Most bugs are solved here and skipped past by pattern-matching on a
familiar-looking message.

**3. Narrow.** Cut the search space in half, then again:
- Where does correct data become incorrect? Log or assert at the midpoint.
- Did this ever work? `git log -S'<symbol>'` / `git bisect`.
- Does it fail in isolation, or only in a suite? That distinguishes logic from shared state.

**4. One hypothesis, stated out loud.** "X is null at line N because Y runs before Z."
Then the prediction: "if so, logging at N shows null and reordering fixes it."

**5. Test the hypothesis, not the symptom.** Change exactly one thing. If the prediction
fails, the hypothesis was wrong — say so and form another. Do not keep the change.

**6. Fix the cause.** Then add the regression test that would have caught it, and confirm it
fails without the fix. A fix without that test is a fix that comes back.

## Two cycles, then stop

After two completed cycles that did not fix it (guard 4), stop and report:

- what reproduces it, exactly
- both hypotheses and how each was falsified
- what you have ruled out, with evidence
- the two or three candidates left, and what would distinguish them

That is a useful handoff. A third silent attempt is not.

## Never

- **Never add defensive code you don't understand.** A `try/catch`, `?.`, or `if (x)` wrapped
  around a symptom converts a loud bug into a silent one. If you cannot say why the value is
  bad, you have not found the bug.
- **Never change several things at once.** You lose the ability to attribute the result.
- **Never "fix" a failing test by changing the assertion**, unless you can state why the
  original expectation was wrong. That is deleting the evidence.
- **Never trust a passing run you did not read.** Guard 3 applies to the fix too: read the
  output that says it passed.

## When the bug is in someone else's code

Read the actual source in `node_modules`, the vendored copy, or the installed package before
concluding it is a library bug. It usually isn't, and the reading is cheaper than the
workaround you would otherwise invent.

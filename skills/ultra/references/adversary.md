# Stage 3 — independent readers

Runs last, and only if stages 1 and 2 are green enough to be worth it. The most expensive part
of the most expensive command in this plugin.

## Lenses, not reviewers

Spawn several readers in one message so they run concurrently, each with **one lens and no
knowledge of the others**. The value is not parallelism — it is that a reader without the
builder's context does not inherit the builder's rationalisations.

| Lens | Reads for |
|---|---|
| **Correctness** | wrong results, off-by-one, unhandled null and empty, invariants that can be broken, states that cannot be left |
| **Security** | authz on every entry point, tenancy, injection, secrets in code or logs, unsafe defaults, anything trusting input |
| **Money** | only where amounts exist — rounding, currency, reversal, the sum after a sequence, and every rate read from anywhere but the authority |
| **Concurrency** | two callers, retries, partial failure, what a crash between two writes leaves behind |
| **Reachability** | code nothing calls, endpoints no screen reaches, tables nothing reads, configuration nobody can change without a migration |
| **Claims** | the project's own documents against the code — README counts, a CLAUDE.md describing a control, a comment asserting a guarantee |

Skip a lens the system does not have. A project with no money needs no money lens; say you
skipped it and why.

## Falsify before reporting

Every finding gets one attempt to kill it, by a reader told to refute it and to default to
refuted when uncertain. What survives is reported; what does not is dropped silently.

**Deduplicate before falsifying, not after.** Two readers describing the same defect at nearby
lines are one finding — match on the claim, not on `file:line`, because the same bug is
routinely reported a few lines apart.

**Settle the facts by reading first.** A claim about what a file contains — a secret committed
in plaintext, a page declaring itself cacheable, an export with no caller — is answered by one
grep, definitively. Only claims about *behaviour* are worth an agent. Do the greps before
tiering anything; they remove findings from the tier entirely.

**Tier the effort, and short-circuit.** A BLOCKER is worth up to three refutation attempts; a
MAJOR one; a MINOR none — if a minor is wrong the reader loses five seconds, and paying three agents to argue about
it is the waste this note exists to prevent.

"Up to three" is sequential, stopping on the first refutation — does the code say what the
finding claims, is it already prevented elsewhere, can the failing input be built. Stop on a
*refutation*, never on how confident a verifier sounded: a confidently-wrong skeptic reports
certainty, so its confidence is the one signal not worth gating on.  in
the loop skill carries the full ordering.

## The reachability lens earns its place

It is the one most likely to find something no gate can, because every other check examines a
part while this one asks whether the parts connect. Real findings from real projects, all in
systems whose suites were green:

- an authority check that nothing calls
- four controls that could never engage, because the interface never sent the flag they read
- three configuration tables seeded by migration and read by no page and no endpoint, so the
  rules the business owns could only be changed by a developer
- seven exported functions no caller reaches

None of those is a failing test. All of them are defects.

## Report as findings, never as grades

A score is comfortable and changes nothing. Each finding names the file and line, the concrete
failure, and what a person would do about it — in CHECK's severities, so they mean the same
thing as everywhere else in Flow.

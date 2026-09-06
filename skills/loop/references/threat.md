# Threat modelling

Runs at the end of FRAME, **before** BUILD, on phases that handle anything worth attacking.
Its output is a threat register in `.flow/STATE.md` that CHECK later verifies against real
code.

## When it runs

Not every phase. Run it when the phase touches any of:

- **money** — prices, totals, tax, balances, ledgers, refunds, payouts, commission
- **identity or access** — auth, roles, permissions, sessions, API keys
- **other people's data** — PII, tenancy boundaries, anything a regulator would name
- **input from outside the trust boundary** — webhooks, uploads, public endpoints, imports
- **anything irreversible** — payments, deletions, external sends

A phase that adds a settings toggle or restyles a page does not need this. Running it there
is ceremony, and ceremony is what Flow exists to remove.

## Step 1 — draw the boundary before listing threats

You cannot enumerate threats without knowing where trust changes hands. Write down, in one
or two lines each:

- **Entry points** this phase adds — routes, handlers, jobs, webhook receivers, CLI commands
- **Who can reach each one** — anonymous, authenticated, a specific role, another service
- **What crosses the boundary** — the data coming in, and who controls it
- **What is trusted downstream** — what later code assumes has already been validated

Most real vulnerabilities are a mismatch in that last pair: something downstream assumes a
check that no upstream code actually performs.

## Step 2 — STRIDE, applied rather than recited

For each entry point, ask the six. Skip the ones that plainly do not apply; do not pad.

| | Question that actually finds things |
|---|---|
| **Spoofing** | Can a caller claim to be someone else? Is the identity proven, or just asserted in a field? |
| **Tampering** | Can a value be changed in transit or at rest? Is the amount taken from the request or recomputed server-side? |
| **Repudiation** | If this is disputed in six months, what proves what happened? Is the trail immutable? |
| **Information disclosure** | What reaches logs, error messages, the API contract, an analytics event? |
| **Denial of service** | Can one caller consume the resource for everyone — unbounded query, unthrottled endpoint, unbounded upload? |
| **Elevation of privilege** | Can a role do something it should not? Is authorisation checked at the endpoint, or only hidden in the UI? |

### The questions that earn their keep in this kind of system

Money:
- Can an amount be negative, or exceed what it refunds?
- Is the total recomputed server-side, or trusted from the client?
- Does a retry create a second charge? What makes it idempotent — and is that a database
  constraint, or a check-then-insert that races?
- Can a transaction partially apply and leave the ledger unbalanced?
- Where does rounding happen, and can it drift when repeated per line item?

Access and tenancy:
- Is authorisation enforced on every entry point, or only on the ones the UI links to?
- Can tenant A read or write tenant B's rows? What enforces that — a WHERE clause someone
  must remember, or something structural?
- Can a role escalate by editing its own record?

External input:
- Are webhooks signed, and verified over the **raw bytes** before parsing?
- Is a replayed request rejected? Is the staleness bound taken from a field inside the
  signed payload, or from an unsigned header an attacker controls?
- Is every field validated, or only the ones the happy path reads?

Data:
- What PII exists in this phase, and does it appear in logs, errors, or the published
  contract? The cheapest answer is that it is never collected in the first place.

## Step 3 — the register

In `.flow/STATE.md`, one row per threat that survived. Drop anything you cannot state
concretely — a threat with no scenario is decoration.

```markdown
### Threat register
- **T1 — <one line: what an attacker does>**
  - Impact: <what breaks, in business terms>
  - Likelihood: high | medium | low, and why
  - Mitigation: <the specific mechanism>
  - Lives in: <file, or "to build in task N">
  - Proven by: <test that fails without the mitigation>
- **T2 — ...**
- **Accepted:** <threat deliberately not mitigated, and the reason>
```

Rank by impact first, likelihood second. A low-likelihood threat that loses money or leaks
personal data outranks a probable annoyance.

**Write down what you are accepting.** An unlisted risk looks like an oversight later; an
accepted one with a reason is a decision.

## Step 4 — mitigations become tasks

Every mitigation is either already in the code or it is a **task in the FRAME task list**.
It does not go on a wishlist. If it is not in the task list, it is not going to exist.

Prefer structural mitigations over remembered ones. A unique constraint beats a
check-before-insert. A type that cannot represent a negative amount beats a validation call
someone must remember at every site.

## Step 5 — CHECK verifies it, and this is the part that matters

A threat model nobody verifies is theatre. At CHECK, for every row in the register:

- Point at the **actual code** implementing the mitigation — file and line, not a claim.
- Point at the **test that fails without it**. If removing the mitigation keeps the suite
  green, the mitigation is unproven and the row is not closed.
- A row with no code and no test is a **BLOCKER**, not a note.

The security lens in `references/review.md` runs this pass.

## Never

- **Never list threats you cannot state as a scenario.** "SQL injection" is a category;
  "the report filter interpolates `req.query.sort` into the ORDER BY clause" is a finding.
- **Never accept a risk silently.** Write the row and the reason.
- **Never let a mitigation live only in the UI.** The endpoint is the boundary.
- **Never mark a row closed because the code looks right.** Closed means a test proves it.
- **Never run this on a phase that does not need it.** Ceremony has a cost too.

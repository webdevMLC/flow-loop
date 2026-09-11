---
name: security
description: An offensive security assessment of a system as built — specialists who attack the running product the way an adversary would (auth and session, access control, injection, secrets and config, the money and business logic, the dependency and supply chain), prove each hole with a working exploit against a disposable instance, then the loop fixes them and a regression test locks each one closed. Use before exposing a system to real users or the internet, before a pilot, after a breach scare, or when nobody has ever tried to break in. Attacks a disposable copy, never production, and never exfiltrates real data.
---

# Security

`references/threat.md` **in the loop skill** models what could go wrong before code exists.
This attacks the code that does exist. A threat model is a hypothesis; an exploit is a fact. This command spends its
budget turning hypotheses into facts, and facts into regression tests.

| Stage | Asks | Cost |
|---|---|---|
| **1 Recon** | what is the attack surface, and what is it protecting? | cheap |
| **2 Attack** | six specialists, each breaking in through their own door | the bulk |
| **3 Prove** | every hole reproduced with a working exploit, or dropped | moderate |
| **4 Lock** | each proven hole becomes a failing security test | small |
| **5 Fix** | the loop closes them, most severe first | the rest |

## The rules of engagement — read first, they are not optional

**A disposable instance, always.** A copy of the system, its own database, seeded with
invented data. **Never production, never shared staging, never a system real users are on.**
The one thing an offensive assessment must never do is become the breach it was looking for.

**Never exfiltrate real data.** If the only reachable instance holds real records, stop.
Attacking a system with real people's data in it, even to prove a hole, is the harm this
exists to prevent.

**Prove, do not damage.** An exploit reads enough to prove access — one row that should be
denied, one field that should be secret — and stops. It does not drop tables, exhaust the
service, or plant anything. The proof is "I reached X"; it is never "X is now gone".

**Everything stays local.** No scanning of hosts you do not own, no traffic to third parties,
no credential-testing against any account not seeded for the test. The assessment is of this
system, on this machine.

**Report to the owner, fix through the loop, never disclose outward.** Findings go in a file
and into repair phases. They do not go to an issue tracker a stranger can read, a public repo,
or anywhere off the machine until the owner decides.

## Before anything else

**"Find security holes" does not mean run a scanner and paste the output.** A scanner reports
patterns; a specialist reports *reachable* holes, proven. A dependency flagged critical that no
code path can trigger is a MINOR to note, not the finding. The value is the working exploit and
the reachability, not the CVE list.

**"Attack it" does not mean describe attacks.** Every finding is reproduced — a request that
succeeds where it should fail, a token that forges, a query that returns another tenant's row.
A finding that cannot be demonstrated against the running instance is a hypothesis, and goes in
a separate section labelled as one, never mixed with the proven holes.

**The best real bugs are in the business logic, not the framework.** Modern frameworks handle
the OWASP top ten reasonably; the money moves through code someone wrote. Spend the budget
where the system is unique — the commission that can be earned twice, the approval that checks
the partner's status but not the associate's, the refund that does not reverse the ledger.

## Stage 1 — Recon

Read `references/surface.md`. Map every entry point — routes, forms, webhooks, jobs, file
uploads, the auth flow — and what each one protects. Identify the trust boundaries: where does
unvalidated input cross into trusted code, where does one tenant's data sit next to another's,
where does money move. The map is what the specialists divide.

## Stage 2 — Attack

Read `references/attackers.md`. Spawn the specialists **in one message**, each owning one
class and attacking the running instance. They return proven holes with the exact request or
input that demonstrates each. The access-control specialist and the business-logic specialist
will both find things in the money flow; that overlap is deliberate.

## Stage 3 — Prove

Every hole is reproduced **by a specialist who did not find it**, from the exploit steps alone,
against a freshly reseeded instance. What reproduces is proven; what does not is dropped with
the reason. An unproven hole never ships in the proven section — the cost of a false security
finding is a team that stops trusting the report.

## Stage 4 — Lock

Read `references/lock.md`. **Every proven hole becomes a failing security test** — a test that
performs the attack and asserts it is now refused, red against the current code. It goes in the
suite, so the hole cannot silently reopen when someone refactors the auth check next year.

## Stage 5 — Fix

The report is `.flow/SECURITY-<date>.md`, sealed, findings most severe first using CHECK's
severities, each with a stable id and a status line. Then the repair protocol —
`references/repair.md` **in the ultra skill** — each hole a phase, most severe first, the
locking test as its acceptance criterion. A security fix that touches auth or money gets the
threat register and the full CHECK, not a shortcut.

Repair is on by default; **"report only"** stops after stage 4 with the failing tests committed
and the report handed to the owner.

## Never

- **Never attack production or any system with real users or real data.**
- **Never exfiltrate, damage, or persist anything on the target.**
- **Never scan or touch hosts, accounts or services you were not given for the test.**
- **Never report an unproven hole as proven.**
- **Never disclose a finding outside the machine before the owner decides.**
- **Never fix during stages 1–4.** The report describes the system as attacked.

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

### Build the attack set, then drive it

An attack surface is a product, not a list of hunches: **every endpoint × every role × every
tenant × every id** for access control; a payload set × every crossing for injection; every
token state × every route for session. That is generated from stage 1's map, not typed one
request at a time.

1. **Write the attack set** from the recon map into `scratchpad/security/attacks-<class>.json`:
   the request, who sends it, and **what a correct system does** — the refusal, the status, the
   row that must not come back.
2. **Drive it with a script** that sends every one and records what actually happened. No model
   in the loop. A thousand requests cost the same as ten.
3. **Read only what got through.** A response that differs from the expected refusal is a
   candidate hole; everything else is coverage, and coverage is what the report can claim.

**The harness gate enforces this**: past thirty hand-sent requests with no driver script in
`scratchpad/security/`, the shell call is refused. An IDOR sweep typed by hand is the most
expensive way to find nothing.

**What stays interactive** is the follow-up: a response that looks wrong, chased by hand until
it is understood. That is the work. Sending the thousand is not.

### The specialists

Read `references/attackers.md`. Spawn them **in one message**, each owning one class and
driving its own attack set against the running instance. They return proven holes with the
exact request that demonstrates each. The access-control specialist and the business-logic
specialist will both find things in the money flow; that overlap is deliberate.



### Attacking is testing, and testing is cheap

This skill already says a scanner's output is not a finding. That is about **reachability** —
a flagged dependency no code path can trigger is a MINOR, not the headline. It is not a reason
to have the best model available do a scanner's job.

**Stages 1 to 4 are cheap.** Recon, attack, prove, lock. The frontier model appears once, in
stage 5, and stage 5 is the loop's BUILD, which is frontier already.

| Specialist | How it runs |
|---|---|
| **Secrets and configuration** | **tools** — `git log -S`, grep the built bundle, diff the shipped env. Facts |
| **Supply chain** | **tools**, then a cheap read of whether a path reaches the vulnerable call |
| **Injection** | **a harness** — a payload set at every crossing is a script, not a thousand turns |
| **Auth and session** | **cheap** — forging, replaying and expiring against a stated scheme |
| **Access control** | **cheap**, and mostly a harness: every endpoint × every tenant × every id is generated, not typed |
| **Business logic and money** | **cheap**, and it is the one worth saying something about |

**The one that deserves a note.** Designing an attack on the business logic — the commission
earned twice, the refund that does not reverse the ledger — is the most open-ended work in
this command, and the cost of missing one is a breach rather than a rework. Running it cheap
is the owner's standing decision and it holds here. **What compensates for it is mechanical,
not a bigger model:** the attack set is generated from the money flows the project skill
names, so coverage comes from enumeration rather than inspiration, and anything the cheap pass
cannot state an attack for is reported as an unexamined surface rather than a clean one.

**An unexamined surface is a finding.** If a specialist cannot devise an attack on something
the recon named, that goes in the report by name. Silence and safety look identical afterwards,
and the owner is the one who gets to tell them apart.

## Resuming a run that died

A run against a live instance dies the way any long run does. **Check for the work before
redoing it** — recon is the expensive half and it is on disk:

| Present | Then |
|---|---|
| `scratchpad/security/surface.md` or the recon map | **stage 1 is done.** Re-read it; do not re-map. Say in the report when it was taken |
| `attacks-<class>.json` | the attack set is built — drive it, do not rebuild it |
| `scratchpad/security/<class>.md` with entries | that class is **partly attacked.** Continue from its running note into the same file |
| an empty class file | it started and died before proving anything — attack it from the top |

**Re-check the instance first, not after.** The disposable copy must still be up, still seeded
with the invented data, still the same build. If any of that changed, findings already proven
stay valid but their reproduction steps need re-running before they go in the report — and the
report says which ones were re-run.

**Never resume against a different instance than the one a finding was proven on** without
saying so. A hole proven on yesterday's build and reported against today's is a claim, not a
finding.

## Stage 3 — Prove

Every hole is reproduced **by a specialist who did not find it**, from the exploit steps alone,
against a freshly reseeded instance. What reproduces is proven; what does not is dropped with
the reason. An unproven hole never ships in the proven section — the cost of a false security
finding is a team that stops trusting the report.

## Stage 4 — Lock

Read `references/lock.md`. **Every proven hole becomes a failing security test** — a test that
performs the attack and asserts it is now refused, red against the current code. It goes in the
suite, so the hole cannot silently reopen when someone refactors the auth check next year.


**Before the findings, compare this run to the last one.** every locking test still present and green, every class reporting, and an
attack set that did not shrink — `references/coverage.md` **in the loop skill** has the table and the three things that must
be accounted for. Fewer findings than last time is a claim that needs its reason: "the code
improved" is provable because the old tests are still green; "we looked less hard" looks
identical from the outside, and a run that cannot say which it was has not finished.

## Stage 5 — Fix, then attack it again


The report is `.flow/SECURITY-<date>.md`, sealed, findings most severe first using CHECK's
severities, each with a stable id and a status line. Then the repair protocol —
`references/repair.md` **in the ultra skill** — each hole a phase, most severe first, the
locking test as its acceptance criterion. A security fix that touches auth or money gets the
threat register and the full CHECK, not a shortcut.

Repair is on by default; **"report only"** stops after stage 4 with the failing tests committed
and the report handed to the owner.

### The locking test is not the proof that it is closed

`references/lock.md` builds one test per hole, and the test *is* the attack — the exact
request that proved it, red first, green after the repair. That permanence is worth having and
it is not the same as the hole being shut.

**A fix can turn that test green and leave the class open.** The test asserts
`GET /api/partners/pii?id=99` is refused. It says nothing about `?id=99&id=1`, about the
trailing space, about the same object reached through a different route, about the id arriving
in a header or a JSON body instead of the query. A repair that special-cases the proven request
passes every gate in this plugin.

So **after the repair phase closes, the specialist who proved the hole attacks it again** — not
the recorded steps, which the test already runs, but **three variations on the same class**:

- **the same object by another door** — a different route, verb, or content type that reaches
  the same handler
- **the same trick one step sideways** — a second parameter, an array instead of a scalar, a
  different encoding, the next id along
- **the neighbours** — if one endpoint leaked a tenant's row, the endpoint beside it usually
  does too, and it was never in the report

Each variation that gets through is a **new finding at the original severity**, not a note on
the old one. A class of hole closed in one place and open in two is worse than one nobody
fixed, because the report now says it is handled.

If all three are refused, say so in the report with what was tried. **"Re-attacked with three
variations, all refused" is evidence. "Fixed" is a claim.**

## Never

- **Never attack production or any system with real users or real data.**
- **Never exfiltrate, damage, or persist anything on the target.**
- **Never scan or touch hosts, accounts or services you were not given for the test.**
- **Never report an unproven hole as proven.**
- **Never disclose a finding outside the machine before the owner decides.**
- **Never fix during stages 1–4.** The report describes the system as attacked.

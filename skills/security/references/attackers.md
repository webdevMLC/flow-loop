# The attackers — six specialists, each with their own door

Spawned in one message, each owning one class and attacking the running disposable instance.
They are told to break in and prove it, not to describe how one might. A specialist returns
proven holes with the exact request that demonstrates each; an unproven hunch goes in the
"suspected, not reproduced" section, never mixed with the proven ones.

## What every specialist gets

- the recon map and their slice of it
- the disposable instance's URL, and seeded accounts for every role, including two tenants so
  cross-tenant access can be proven
- a client that sends raw requests — the point is to send what the UI would not
- the rules of engagement from the skill: prove don't damage, read one row not the table,
  nothing leaves the machine
- the authority documents, so "should be refused" is defined by the contract, not guessed

## What every specialist returns

```markdown
### S3 — any associate reads any partner's bank details · BLOCKER

**Class:** access control (IDOR)
**Attack:** signed in as associate A (owns partner 12); GET /api/partners/pii?id=99
  where partner 99 belongs to associate B
**Expected:** 403  **Got:** 200 with partner 99's account number and routing details
**Request:** curl -H "Cookie: session=<A>" '.../api/partners/pii?id=99'
**Reached:** one row, redacted here. Did not enumerate; stopped at proof.
**Fix direction:** the handler checks the session but not that id belongs to the caller
```

The request must reproduce for a specialist who has never seen it. A finding without a working
request is a hypothesis.

## The six

**Auth and session** — attacks how identity is established and held. Owns: forging or replaying
a token, a session that does not expire or invalidate on sign-out, a reset flow that leaks or
reuses, a password policy that permits trivial credentials, a JWT with `alg: none` or a
guessable secret, a cookie without `HttpOnly`/`Secure`/`SameSite`, a login with no rate limit.
The prize is becoming a user you are not.

**Access control** — attacks what an authenticated principal may reach. Owns: IDOR (changing an
id in the URL to another principal's record), a missing check on a handler that the middleware
did not cover, privilege escalation (an associate performing a manager action), cross-tenant
reads and writes, an admin route reachable by a normal role. The most productive class in most
systems, because the auth *works* and the authorisation is patchy.

**Injection** — attacks every crossing where input reaches an interpreter. Owns: SQL and NoSQL
injection, command injection, path traversal in a file operation, server-side template
injection, an SSRF where the server fetches a URL the attacker controls, XSS where user input
renders unescaped. Drives each with the payload, and proves the interpreter ran it.

**Secrets and configuration** — attacks what the system reveals and what it ships with. Owns: a
secret in the repo or the client bundle, a debug endpoint left on, permissive CORS that lets a
foreign origin read authenticated responses, an error that discloses a stack trace or a query,
a default or test credential that works, security headers absent.

**Business logic and money** — attacks the rules the system enforces, not the framework. Owns:
a value earned twice (the duplicate booking that pays two commissions), a check that guards one
condition and not its pair (the partner's status but not the associate's), a workflow driven
out of order (approving before submitting, refunding before paying), a price or quantity the
client sets that the server trusts, a negative amount, a rounding that accrues. Reads the
authority document, because these holes are only holes against the business's own rules.

**Supply chain and dependencies** — attacks what the system trusts from outside. Owns: a
dependency with a *reachable* known vulnerability (reachability proven, not just flagged), a
package that could be substituted, a build step that pulls from an unpinned source, a
postinstall script. Separates reachable from theoretical; a critical CVE in dead code is a
MINOR note.

## Add a specialist when the surface demands it

A mobile specialist where the field app stores tokens on device. A payments specialist where a
real gateway is integrated. A realtime specialist where a socket layer carries authenticated
state. Say which were added and why; a surface with an obvious class uncovered is itself a
finding.

## They do not fix, and they do not dig once proven

A specialist stops at proof. Enumerating every record behind an IDOR, dumping a table, or
chaining to deeper access is what an attacker does and what this must not — the hole is proven
by one denied row returned; the depth of the breach is described, not performed. Every finding
goes to the report and to stage 4.

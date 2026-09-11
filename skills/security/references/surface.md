# Recon — the attack surface, and what it protects

Nothing is attacked that is not on this map, and nothing on it is left unattacked without
being named. The map is also what tells a false finding from a real one: a hole in code no
request can reach is not a hole.

## Every entry point

Where untrusted input enters the system:

- **Routes and endpoints** — every one, by method, and whether it authenticates and how.
  The unauthenticated ones are the front line; list them first.
- **Forms** — everything a person submits, and what validation runs where. Client validation
  is not validation.
- **Webhooks and callbacks** — anything an outside system POSTs. How is the sender verified —
  a signature, a shared secret, nothing?
- **File uploads** — type, size, where stored, whether the path is user-influenced.
- **Jobs and schedules** — what runs unattended, with what privileges, on whose data.
- **The auth flow itself** — sign in, sign out, reset, the session token, how it is minted,
  stored and checked.
- **Anything that reads a URL, a header or a cookie into a query, a path, or a command.**

## Every trust boundary

Where input crosses from untrusted to trusted, or one principal's data sits by another's:

- **Input → query.** Every place a value reaches SQL, a NoSQL filter, a shell, a template,
  an eval, a file path. Injection lives at exactly these crossings.
- **Tenant → tenant.** Every table with an owner column. Every query that should filter by
  the current principal and might not.
- **Role → privilege.** Every action gated by a role. Where is the check — a middleware, the
  handler, or nowhere?
- **Money movements.** Every write that changes a balance, a rate, a payout. These get the
  business-logic specialist regardless of what else is found.
- **The client → the server.** Every value the client sends that the server trusts — a price
  in the request body, an id that selects a record, a flag that grants access.

## What each thing protects

For every entry point and boundary, one line: what an attacker gets by breaking it. "The
booking endpoint → creates a commission-bearing record as any associate." "The pii route →
returns a partner's bank details." This is what ranks the findings: a hole into the payout
table outranks a reflected string in an error page, however clever the second.

## Secrets and configuration

- Where are secrets — env vars, a vault, or committed to the repo? `git log -S` the obvious
  ones.
- What is different between the dev config and what production would use — debug modes, permissive
  CORS, a default admin, a test bypass that ships.
- What does an error page reveal — a stack trace, a query, a path, a version.

## The dependency surface

- The lockfile, run against the advisory database. But only reachable advisories are findings;
  the rest are noted.
- Anything pulled at build or run time from a source that could be substituted.

## The output

A map the specialists divide: entry points grouped by whether they authenticate, boundaries
grouped by what they protect, ranked by what an attacker gains. Plus the list of what is *not*
reachable and therefore out of scope — because a report that attacked dead code has spent the
budget in the wrong place.

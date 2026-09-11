# Lock — every proven hole becomes a failing test

A security report gets read once and filed. A failing test in the suite is red until the hole
is closed, and stays green forever after, so the hole cannot silently reopen when someone
rewrites the auth check two years from now. That permanence is the point of this stage.

## One test per proven hole

The test performs the attack and asserts it is now refused — red against the current code, for
the reason the finding describes:

```ts
// test/security/S3-partner-pii-idor.test.ts
test('S3: an associate cannot read another owner\'s partner PII', async () => {
  const res = await api.get('/api/partners/pii?id=99', { as: associateA });  // A does not own 99
  expect(res.status).toBe(403);        // RED today: 200
  expect(res.body).not.toHaveProperty('accountNumber');
});
```

**It is red when committed**, and it was observed red first. A security test written to pass
has proven nothing; it has to fail against the code as it stands, demonstrating the hole, and
then the repair phase turns it green.

## The attack is the test — but the proof stays clean

The test reproduces the attack that proved the hole, with the seeded accounts, against the
disposable database the tests use. It reads exactly what the finding read — one denied row —
and no more. A locking test that dumps a table to prove the point is the exfiltration the rules
of engagement forbid, committed to the repo forever.

**Never put a real secret, token or credential in a test.** The seeded test values only. If
the finding was a committed secret, the test asserts the secret is *absent* from the built
bundle or the repo — it does not embed the secret to check for it.

## Where it goes, and the red suite

`test/security/<id>-<slug>.test.<ext>`, outside `test_fast`'s scope so the failing tests do not
block the commit that adds them — the commit gate runs `test_fast`. Say in the report that the
suite now has N red security tests and why.

**If the project's fast suite globs them anyway**, the gate will refuse the commit — correctly,
the suite is red. Commit once with `FLOW_SKIP_VERIFY=1` and say in the commit body that the red
tests are deliberate. **Never `.flow/verify-off`** — it suspends the gate for the project, and
an unchecked suite is a worse outcome than the holes you just found. And never weaken a test to
make it pass.

If the project has no harness that can drive an authenticated request against a running
instance, that is the first finding, and the tests are written against the harness the
specialists used with a note that it must join the suite.

## The commit

One commit: the red tests, the sealed report, the STATE.md entry listing them. Message:
`test(security): N failing tests for N proven holes — see .flow/SECURITY-<date>.md`. **Never
name the vulnerability in a way that reads as a disclosure** if the repo could ever be public —
"S3 access-control regression test", not "how to read anyone's bank details". The report,
which is local and owner-only, carries the detail.

## Then repair, with care

The repair phases turn each red test green, most severe first, one root cause per phase.
Because the fixes touch auth, access control and money, each repair phase runs the **full**
CHECK and, where the fix changes an auth or money path, the threat register — not the shortcut
a low-risk phase might take. A security fix verified only by its own locking test is
half-verified; the locking test proves the specific hole is closed, CHECK proves the fix did
not open another.

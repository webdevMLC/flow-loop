# Persist — every confirmed defect becomes a failing test

This is what separates a data test from an inspection. An inspection's findings live in a
report that can be ignored. A failing test lives in the suite, and the suite is red until
somebody fixes it. **Nothing found here can be forgotten.**

## One test per confirmed defect

Named for the defect, in the project's own test layout, driving the flow the way the tester
did — through the product, reading the row:

```ts
// test/datatest/D7-duplicate-booking.test.ts
test('D7: a second identical submission does not create a second booking', async () => {
  await api.post('/api/bookings', body, asAssociateA);
  await api.post('/api/bookings', body, asAssociateA);
  const rows = await db.query('SELECT id FROM bookings WHERE partner_id=? AND booking_date=?', [12, '2026-09-14']);
  expect(rows).toHaveLength(1);   // RED today: 2
});
```

**It is red when committed.** That is the point. A test written to pass has verified nothing
about the defect; it has to fail against the code as it stands, for the reason the defect
describes, and be observed failing before it is committed.

## Where it goes

`test/datatest/<id>-<slug>.test.<ext>`, or wherever the project's `references/state.md`
profile says integration tests live. Under the project's real test runner, against the
disposable database the tests already use. **Never a mocked API client** — the whole finding
is that the mock hid it.

If the project has no integration harness that reaches a database, that is a finding on its
own, reported as the first item, and the tests are written against the harness the testers
used, with a note that it needs to become part of the suite.

## The suite goes red, and that is correct

Committing red tests will fail CI and fail `test_fast` if they are in its scope. Two rules:

- **Put them outside `test_fast`'s scope** if the project has one — a `datatest/` directory
  the fast suite does not glob. The commit gate runs `test_fast`; red integration tests
  should not block the commit that adds them.
- **Say in the report that the full suite is now red, by how many, and why.** A red suite
  with named causes is a to-do list. A red suite nobody explained is a broken build.

The loop's repair phases turn them green one root cause at a time, and each green test is
the phase's acceptance criterion — no separate criterion needs writing.

## The commit

One commit, all the red tests, the report, and the STATE.md entry that lists them. Message:
`test(datatest): N failing tests for N confirmed defects — see .flow/DATATEST-<date>.md`.

The commit gate's `STATE.md` rule applies — the state file is in the same commit. The
citation gate does not, because these are tests, not acceptance criteria; the criteria are
written when the repair phases are framed, and each cites the defect id.

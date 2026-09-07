import { test, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fixture, tddVerdict, runHook, cleanup, TDD_GATE, REAL_TEST } from './helpers.mjs';

after(cleanup);

const SRC = 'export function f(a) { return a + 1; }\n';

describe('what the gate does not guard', () => {
  test('a non-code extension passes through', () => {
    const d = fixture({ 'notes.md': '# hi', 'src/thing.ts': SRC });
    assert.equal(tddVerdict(d, 'notes.md').allowed, true);
  });

  test('a test file itself is always writable, or RED is impossible', () => {
    const d = fixture({});
    assert.equal(tddVerdict(d, 'src/pricing.test.ts').allowed, true);
    assert.equal(tddVerdict(d, 'test/pricing.mjs').allowed, true);
    assert.equal(tddVerdict(d, '__tests__/pricing.ts').allowed, true);
    assert.equal(tddVerdict(d, 'src/test_pricing.py').allowed, true);
    assert.equal(tddVerdict(d, 'src/pricing_test.go').allowed, true);
  });

  test('exempt directories are outside the TDD scope', () => {
    const d = fixture({});
    for (const p of [
      'node_modules/pkg/index.ts', 'dist/bundle.js', 'migrations/001-init.ts',
      'scripts/seed.ts', 'public/app.js', 'docker/entry.mjs', '.next/build.js',
    ]) {
      assert.equal(tddVerdict(d, p).allowed, true, `${p} should be exempt`);
    }
  });

  test('config, generated and entry-point filenames are exempt', () => {
    const d = fixture({});
    for (const p of [
      'vite.config.ts', 'src/types.d.ts', 'src/Button.stories.tsx', 'src/api.gen.ts',
      'src/index.ts', 'src/types.ts', 'src/constants.ts', 'app/page.tsx', 'app/layout.tsx',
    ]) {
      assert.equal(tddVerdict(d, p).allowed, true, `${p} should be exempt`);
    }
  });
});

describe('finding a covering test', () => {
  test('exact sibling name', () => {
    const d = fixture({ 'src/pricing.ts': SRC, 'src/pricing.test.ts': REAL_TEST });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, true);
  });

  test('a test named for the behaviour, sharing only a token', () => {
    // lead-claim-rejection.test.ts covers claims.ts via the token "claim"
    const d = fixture({ 'src/claims.ts': SRC, 'test/lead-claim-rejection.test.ts': REAL_TEST });
    assert.equal(tddVerdict(d, 'src/claims.ts').allowed, true);
  });

  test('a suffixed test name still covers its source', () => {
    const d = fixture({
      'src/booking-events.ts': SRC,
      'test/booking-events-idempotency.test.ts': REAL_TEST,
    });
    assert.equal(tddVerdict(d, 'src/booking-events.ts').allowed, true);
  });

  test('a test directory with no marker in the filename', () => {
    // Node's own runner, tape and ava: test/<name>.mjs. This is the NaspinPay layout.
    const d = fixture({ 'impl/src/activity.mjs': SRC, 'impl/test/activity.mjs': REAL_TEST });
    assert.equal(tddVerdict(d, 'impl/src/activity.mjs').allowed, true);
  });

  test('a generic framework filename anchors on its route segment', () => {
    const d = fixture({
      'app/api/leads/route.ts': SRC,
      'test/lead-claim-rejection.test.ts': REAL_TEST,
    });
    assert.equal(tddVerdict(d, 'app/api/leads/route.ts').allowed, true);
  });

  test('an unrelated filename still counts if it exercises an exported symbol', () => {
    const d = fixture({
      'src/ledger.ts': 'export function postJournalEntry(x) { return x; }\n',
      'test/zzz-unrelated.test.ts':
        'import { postJournalEntry } from "../src/ledger";\nassert(postJournalEntry(1));\n',
    });
    assert.equal(tddVerdict(d, 'src/ledger.ts').allowed, true);
  });
});

describe('what it refuses', () => {
  test('no test anywhere', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    const v = tddVerdict(d, 'src/pricing.ts');
    assert.equal(v.allowed, false);
    assert.match(v.reason, /no test file found/);
  });

  test('a stub named like a test is not a test', () => {
    const d = fixture({ 'src/pricing.ts': SRC, 'src/pricing.test.ts': '' });
    const v = tddVerdict(d, 'src/pricing.ts');
    assert.equal(v.allowed, false);
    assert.match(v.reason, /has no\s*\n?assertions/);
    assert.match(v.reason, /pricing\.test\.ts/);
  });

  test('a token match alone does not rescue a stub', () => {
    const d = fixture({ 'src/claims.ts': SRC, 'test/lead-claim-rejection.test.ts': '\n\n' });
    assert.equal(tddVerdict(d, 'src/claims.ts').allowed, false);
  });
});

describe('false-positive guards', () => {
  test('a substantial test using a project helper is accepted without a literal assert', () => {
    const body = 'import { scenario } from "./harness";\n'
      + Array.from({ length: 25 }, (_, i) => `scenario("case ${i}", () => run(${i}));`).join('\n');
    const d = fixture({ 'src/pricing.ts': SRC, 'src/pricing.test.ts': body });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, true);
  });
});

describe('escape hatches and malformed input', () => {
  test('.flow/tdd-off suspends the gate for the project', () => {
    const d = fixture({ 'src/pricing.ts': SRC, '.flow/tdd-off': 'reason' });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, true);
  });

  test('FLOW_TDD_OFF=1 suspends it for one invocation', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, false);
    assert.equal(tddVerdict(d, 'src/pricing.ts', { FLOW_TDD_OFF: '1' }).allowed, true);
  });

  test('a payload with no file_path is allowed, not crashed on', () => {
    assert.equal(runHook(TDD_GATE, { tool_name: 'Edit', tool_input: {} }).allowed, true);
  });

  test('malformed stdin fails open', () => {
    assert.equal(runHook(TDD_GATE, 'not json at all').allowed, true);
  });

  test('a Windows-style backslash path is normalised', () => {
    const d = fixture({ 'src/pricing.ts': SRC, 'src/pricing.test.ts': REAL_TEST });
    const v = runHook(TDD_GATE, {
      tool_name: 'Edit',
      tool_input: { file_path: `${d}\\src\\pricing.ts` },
    });
    assert.equal(v.allowed, true);
  });
});

describe('cross-platform payload shapes', () => {
  test('Codex-style field names are understood', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    for (const key of ['file_path', 'path', 'filePath', 'target_file', 'file']) {
      const v = runHook(TDD_GATE, {
        tool_name: 'apply_patch',
        tool_input: { [key]: `${d}/src/pricing.ts` },
      });
      assert.equal(v.allowed, false, `${key} should be recognised and denied`);
    }
  });

  test('an unrecognised payload fails open rather than guessing', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    const v = runHook(TDD_GATE, {
      tool_name: 'apply_patch',
      tool_input: { diff: `--- a/src/pricing.ts\n+++ b/src/pricing.ts` },
    });
    assert.equal(v.allowed, true);
  });

  test('a non-string path is not treated as a path', () => {
    const v = runHook(TDD_GATE, { tool_name: 'Edit', tool_input: { file_path: { a: 1 } } });
    assert.equal(v.allowed, true);
  });
});

describe('outside a project, there is nothing to gate', () => {
  test('a file with no .flow above it is not gated', () => {
    // mkdtemp gives a bare temp dir with no project marker anywhere up to the drive root.
    // Gating there produced advice like "create C://.flow/tdd-off", which is nonsense.
    const d = fixture({});
    rmSync(join(d, '.flow'), { recursive: true, force: true });
    mkdirSync(join(d, 'src'), { recursive: true });
    writeFileSync(join(d, 'src', 'scratch.ts'), SRC);
    assert.equal(tddVerdict(d, 'src/scratch.ts').allowed, true);
  });

  test('a project marked only by .flow is still gated', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, false);
  });
});

describe('adoption — a project opts in by having .flow/', () => {
  // The plugin installs globally, so before this the gate fired in every git
  // repository on the machine, adopted or not. Verified against a real untested
  // Next.js repo: every edit denied from the moment the plugin was installed.
  test('a git repo that has not adopted Flow is not gated', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    rmSync(join(d, '.flow'), { recursive: true, force: true });
    mkdirSync(join(d, '.git'), { recursive: true });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, true);
  });

  test('adding .flow/ turns the gate on', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    mkdirSync(join(d, '.git'), { recursive: true });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, false);
  });
});

describe('.flow/tdd-exempt — carving out legacy code without editing the plugin', () => {
  // The deny message used to say "add its directory to EXEMPT_DIR in
  // flow-tdd-gate.mjs". That file lives in the versioned plugin cache and is
  // replaced on every update, so the advice produced a change that vanished.
  test('a listed directory is exempt', () => {
    const d = fixture({ '.flow/tdd-exempt': 'legacy/\n', 'legacy/old.ts': SRC });
    assert.equal(tddVerdict(d, 'legacy/old.ts').allowed, true);
  });

  test('a directory not listed is still gated', () => {
    const d = fixture({ '.flow/tdd-exempt': 'legacy/\n', 'src/pricing.ts': SRC });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, false);
  });

  test('blank lines and # comments are ignored', () => {
    const d = fixture({
      '.flow/tdd-exempt': '# legacy code, tested manually\n\n  legacy/  \n',
      'legacy/old.ts': SRC,
      'src/pricing.ts': SRC,
    });
    assert.equal(tddVerdict(d, 'legacy/old.ts').allowed, true);
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, false);
  });

  test('a bare filename fragment works too', () => {
    const d = fixture({ '.flow/tdd-exempt': 'vendored-parser\n', 'src/vendored-parser.ts': SRC });
    assert.equal(tddVerdict(d, 'src/vendored-parser.ts').allowed, true);
  });

  test('an empty or unreadable list gates nothing extra', () => {
    const d = fixture({ '.flow/tdd-exempt': '\n\n', 'src/pricing.ts': SRC });
    assert.equal(tddVerdict(d, 'src/pricing.ts').allowed, false);
  });

  test('the deny message points at .flow/tdd-exempt, not the plugin source', () => {
    const d = fixture({ 'src/pricing.ts': SRC });
    const v = tddVerdict(d, 'src/pricing.ts');
    assert.equal(v.allowed, false);
    assert.match(v.reason, /\.flow\/tdd-exempt/);
    assert.doesNotMatch(v.reason, /EXEMPT_DIR in flow-tdd-gate\.mjs/);
  });
});

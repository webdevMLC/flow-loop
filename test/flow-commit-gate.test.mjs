import { test, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFixture, gitAdd, commitVerdict, runHook, cleanup, COMMIT_GATE } from './helpers.mjs';

after(cleanup);

const SRC = 'export const x = 1;\n';
const PASSING = '# p\n\n## Commands\n- test_fast: node -e "process.exit(0)"\n';
const FAILING = '# p\n\n## Commands\n- test_fast: node -e "console.log(\'boom\'); process.exit(1)"\n';

/** A repo with a staged source file and the given profile. */
function repo(profile, staged = { 'src/thing.ts': SRC }) {
  const files = { ...staged };
  if (profile) files['.flow/PROJECT.md'] = profile;
  const d = gitFixture(files);
  gitAdd(d, ...Object.keys(staged));
  return d;
}

describe('when the gate stays out of the way', () => {
  test('a command that is not a commit is ignored', () => {
    const d = repo(FAILING);
    assert.equal(commitVerdict(d, 'ls -la').allowed, true);
    assert.equal(commitVerdict(d, 'git status').allowed, true);
    assert.equal(commitVerdict(d, 'git add .').allowed, true);
  });

  test('an explicit --no-verify is honoured', () => {
    const d = repo(FAILING);
    assert.equal(commitVerdict(d, 'git commit --no-verify -m x').allowed, true);
  });

  test('no profile means no gate', () => {
    const d = repo(null);
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, true);
  });

  test('a profile without test_fast means no gate', () => {
    const d = repo('# p\n\n## Commands\n- test: npm test\n');
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, true);
  });

  test('an unfilled placeholder is not treated as a command', () => {
    const d = repo('# p\n\n## Commands\n- test_fast: <unit tests only>\n');
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, true);
  });

  test('a docs-only commit is not gated even when tests fail', () => {
    const d = repo(FAILING, { 'README.md': '# hi\n' });
    assert.equal(commitVerdict(d, 'git commit -m docs').allowed, true);
  });

  test('nothing staged means nothing to check', () => {
    const d = gitFixture({ '.flow/PROJECT.md': FAILING });
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, true);
  });

  test('.flow/verify-off suspends it for the project', () => {
    const d = repo(FAILING);
    writeFileSync(join(d, '.flow', 'verify-off'), '');
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, true);
  });

  test('FLOW_SKIP_VERIFY=1 suspends it for one commit', () => {
    const d = repo(FAILING);
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, false);
    assert.equal(commitVerdict(d, 'git commit -m x', { FLOW_SKIP_VERIFY: '1' }).allowed, true);
  });

  test('outside a git repository it does nothing', () => {
    const v = runHook(COMMIT_GATE, {
      tool_name: 'Bash', cwd: process.cwd(), tool_input: { command: 'git commit -m x' },
    });
    assert.equal(typeof v.allowed, 'boolean');
  });
});

describe('when it blocks', () => {
  test('staged source that fails test_fast is refused', () => {
    const d = repo(FAILING);
    const v = commitVerdict(d, 'git commit -m x');
    assert.equal(v.allowed, false);
    assert.match(v.reason, /does not pass/);
  });

  test('the failure output is shown, not just asserted', () => {
    const d = repo(FAILING);
    assert.match(commitVerdict(d, 'git commit -m x').reason, /boom/);
  });

  test('the escape hatches are named in the refusal', () => {
    const d = repo(FAILING);
    const r = commitVerdict(d, 'git commit -m x').reason;
    assert.match(r, /FLOW_SKIP_VERIFY=1/);
    assert.match(r, /verify-off/);
  });

  test('staged source that passes test_fast goes through', () => {
    const d = repo(PASSING);
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, true);
  });
});

describe('malformed input', () => {
  test('malformed stdin fails open', () => {
    assert.equal(runHook(COMMIT_GATE, 'not json').allowed, true);
  });

  test('a payload with no command is allowed', () => {
    assert.equal(runHook(COMMIT_GATE, { tool_name: 'Bash', tool_input: {} }).allowed, true);
  });
});

describe('cross-platform payload shapes', () => {
  test('argv-array shell commands are normalised', () => {
    const d = repo(FAILING);
    const v = runHook(COMMIT_GATE, {
      tool_name: 'shell', cwd: d, tool_input: { command: ['git', 'commit', '-m', 'x'] },
    });
    assert.equal(v.allowed, false);
  });

  test('alternate command field names are understood', () => {
    const d = repo(FAILING);
    for (const key of ['command', 'cmd', 'script']) {
      const v = runHook(COMMIT_GATE, {
        tool_name: 'exec_command', cwd: d, tool_input: { [key]: 'git commit -m x' },
      });
      assert.equal(v.allowed, false, `${key} should be recognised`);
    }
  });

  test('--no-verify still honoured through an argv array', () => {
    const d = repo(FAILING);
    const v = runHook(COMMIT_GATE, {
      tool_name: 'shell', cwd: d, tool_input: { command: ['git', 'commit', '--no-verify', '-m', 'x'] },
    });
    assert.equal(v.allowed, true);
  });
});

import { test, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
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

describe('the state file must keep up with the commits', () => {
  const STATE = '# s\n\n## Now\n**Gate:** BUILD\n\n### Tasks\n- [ ] T1 do the thing\n';

  /** A repo with a profile, a state file, and staged source. */
  function stateRepo(extra = {}) {
    const d = gitFixture({
      '.flow/PROJECT.md': PASSING,
      '.flow/STATE.md': STATE,
      'src/thing.ts': SRC,
      ...extra,
    });
    execSync('git add -A && git commit -q -m "initial"', { cwd: d, stdio: 'ignore' });
    writeFileSync(join(d, 'src', 'thing.ts'), SRC + 'export const y = 2;\n');
    gitAdd(d, 'src/thing.ts');
    return d;
  }

  test('source staged while the state file goes untouched is refused', () => {
    const d = stateRepo();
    // three commits of source with no state update - the BizDev failure mode
    execSync('git commit -q -m "feat: one"', { cwd: d, stdio: 'ignore' });
    writeFileSync(join(d, 'src', 'thing.ts'), SRC + 'export const z = 3;\n');
    gitAdd(d, 'src/thing.ts');
    execSync('git commit -q -m "feat: two"', { cwd: d, stdio: 'ignore' });
    writeFileSync(join(d, 'src', 'thing.ts'), SRC + 'export const w = 4;\n');
    gitAdd(d, 'src/thing.ts');
    const v = commitVerdict(d, 'git commit -m "feat: three"');
    assert.equal(v.allowed, false);
    assert.match(v.reason, /STATE\.md/);
  });

  test('staging the state file alongside the source is accepted', () => {
    const d = stateRepo();
    writeFileSync(join(d, '.flow', 'STATE.md'), STATE.replace('- [ ] T1', '- [x] T1'));
    gitAdd(d, '.flow/STATE.md');
    assert.equal(commitVerdict(d, 'git commit -m "feat: one"').allowed, true);
  });

  test('a state update in the previous commit still counts', () => {
    const d = stateRepo();
    writeFileSync(join(d, '.flow', 'STATE.md'), STATE.replace('- [ ] T1', '- [x] T1'));
    gitAdd(d, '.flow/STATE.md');
    execSync('git commit -q -m "feat: test half"', { cwd: d, stdio: 'ignore' });
    writeFileSync(join(d, 'src', 'thing.ts'), SRC + 'export const z = 3;\n');
    gitAdd(d, 'src/thing.ts');
    assert.equal(commitVerdict(d, 'git commit -m "feat: impl half"').allowed, true);
  });

  test('a project with no state file is not subject to the check', () => {
    const d = repo(PASSING);
    assert.equal(commitVerdict(d, 'git commit -m x').allowed, true);
  });

  test('a docs-only commit is never state-checked', () => {
    const d = stateRepo();
    execSync('git commit -q -m "feat: one"', { cwd: d, stdio: 'ignore' });
    writeFileSync(join(d, 'README.md'), '# hi\n');
    gitAdd(d, 'README.md');
    assert.equal(commitVerdict(d, 'git commit -m docs').allowed, true);
  });
});

describe('test_fast that is prose, not a command', () => {
  // The line is captured to end-of-line and handed to execSync. A profile written by hand
  // saying "test_fast: none" would run `none` in a shell, fail, and deny every commit -
  // the gate reporting a red suite for a project that has no suite at all.
  const SRC = 'export const rate = 0.25;\n';

  for (const absent of ['none', 'None', 'n/a', 'N/A', '-', 'TODO', 'none yet', 'tbd']) {
    test(`"${absent}" is read as absent, not run`, () => {
      const d = gitFixture({
        '.flow/PROJECT.md': `# p\n- test_fast: ${absent}\n`,
        'src/pricing.ts': SRC,
      });
      gitAdd(d, 'src/pricing.ts');
      const v = commitVerdict(d, 'git commit -m "x"');
      assert.equal(v.allowed, true, `expected allow, got: ${v.reason}`);
    });
  }

  test('a real command is still run and can still deny', () => {
    const d = gitFixture({
      '.flow/PROJECT.md': '# p\n- test_fast: node -e "process.exit(1)"\n',
      'src/pricing.ts': SRC,
    });
    gitAdd(d, 'src/pricing.ts');
    assert.equal(commitVerdict(d, 'git commit -m "x"').allowed, false);
  });
});

describe('test_fast written the way the rest of the profile is written', () => {
  // Every other command line in a profile is backticked, so test_fast gets backticked too.
  // The whole rest of the line is handed to a shell, so it tried to execute a word starting
  // with a backtick and denied every commit with "'`node' is not recognized" - a gate that
  // cannot run its own command refuses everything, which reads exactly like a red suite.
  const PASSES = 'node -e "process.exit(0)"';
  const FAILS = 'node -e "process.exit(1)"';
  const SRC = 'export const rate = 0.25;\n';

  const profile = (line) => ({ '.flow/PROJECT.md': `# p\n- test_fast: ${line}\n`, 'src/pricing.ts': SRC });

  test('a backticked command is unwrapped and run', () => {
    const d = gitFixture(profile('`' + FAILS + '`'));
    gitAdd(d, 'src/pricing.ts');
    const v = commitVerdict(d, 'git commit -m "x"');
    assert.equal(v.allowed, false, 'a red suite must still deny');
    assert.doesNotMatch(v.reason, /not recognized|not found/i);
  });

  test('a backticked command that passes allows the commit', () => {
    const d = gitFixture(profile('`' + PASSES + '`'));
    gitAdd(d, 'src/pricing.ts');
    assert.equal(commitVerdict(d, 'git commit -m "x"').allowed, true);
  });

  test('trailing prose after an em dash is not part of the command', () => {
    const d = gitFixture(profile('`' + PASSES + '` — 113ms, no database, no network'));
    gitAdd(d, 'src/pricing.ts');
    assert.equal(commitVerdict(d, 'git commit -m "x"').allowed, true);
  });

  test('trailing prose after a hyphen separator is not part of the command', () => {
    const d = gitFixture(profile('`' + PASSES + '` - the fast unit suite'));
    gitAdd(d, 'src/pricing.ts');
    assert.equal(commitVerdict(d, 'git commit -m "x"').allowed, true);
  });

  test('a bare command with no backticks is untouched', () => {
    const d = gitFixture(profile(PASSES));
    gitAdd(d, 'src/pricing.ts');
    assert.equal(commitVerdict(d, 'git commit -m "x"').allowed, true);
  });

  test('a hyphen inside a bare command is not treated as a separator', () => {
    const d = gitFixture(profile('node --test-reporter=dot -e "process.exit(1)"'));
    gitAdd(d, 'src/pricing.ts');
    const v = commitVerdict(d, 'git commit -m "x"');
    assert.equal(v.allowed, false);
    assert.doesNotMatch(v.reason, /not recognized|not found/i);
  });
});

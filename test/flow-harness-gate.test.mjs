// The harness gate: driving is not turn-taking work.
//
// Measured on the run this exists for: 1,106 shell calls, 171 of which touched the database.
// The busiest tester made 168 tool calls over 49 minutes - about 17 seconds a turn, composing
// a 286-character script each time to run a query whose expected answer it had already worked
// out. The tier rule that would have prevented it shipped as advice, and advice was measured
// losing in exactly this area.
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fixture, runHook, cleanup } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, '..', 'hooks', 'flow-harness-gate.mjs');

after(cleanup);

const sh = (dir, command, env = {}) =>
  runHook(GATE, { tool_name: 'Bash', tool_input: { command, cwd: dir } }, env);

const QUERY = 'mysql -e "SELECT id, total FROM payslips WHERE employee_id = 7"';

/** A project with a datatest run in progress. */
const running = (extra = {}) => {
  const dir = fixture({ '.flow/STATE.md': '# s\n', ...extra });
  mkdirSync(join(dir, 'scratchpad', 'datatest'), { recursive: true });
  return dir;
};

/** Send n driving commands and return the last verdict. */
const drive = (dir, n, cmd = QUERY) => {
  let r;
  for (let i = 0; i < n; i++) r = sh(dir, cmd);
  return r;
};

describe('it only speaks during a data run', () => {
  test('no scratchpad, no opinion', () => {
    const dir = fixture({ '.flow/STATE.md': '# s\n' });
    assert.equal(drive(dir, 60).allowed, true);
  });

  test('outside a Flow project it says nothing', () => {
    const dir = fixture();
    const r = runHook(GATE, { tool_name: 'Bash', tool_input: { command: QUERY, cwd: join(dir, '..') } });
    assert.equal(r.allowed, true);
  });

  test('a command that is not driving anything never counts', () => {
    const dir = running();
    for (let i = 0; i < 60; i++) sh(dir, 'cat src/payroll.ts');
    assert.equal(sh(dir, 'ls scratchpad/datatest').allowed, true);
  });
});

describe('hand-driving is capped', () => {
  test('the first thirty are allowed - exploring is not the problem', () => {
    const dir = running();
    assert.equal(drive(dir, 30).allowed, true);
  });

  test('past thirty, with no driver on disk, it is refused', () => {
    const dir = running();
    const r = drive(dir, 31);
    assert.equal(r.allowed, false);
    assert.match(r.reason, /driven by hand/);
    assert.match(r.reason, /oracle-<dimension>\.json/);
  });

  test('the denial carries the three steps and the measurement', () => {
    const r = drive(running(), 31);
    assert.match(r.reason, /1,106 shell calls/);
    assert.match(r.reason, /no model at all/);
  });

  test('HTTP and browser driving count the same as SQL', () => {
    const dir = running();
    assert.equal(drive(dir, 31, 'curl -X POST http://127.0.0.1:3210/api/payslips').allowed, false);
    const dir2 = running();
    assert.equal(drive(dir2, 31, 'node -e "await page.click(sel)"').allowed, false);
  });
});

describe('a driver stands the gate down', () => {
  test('a script in the run directory allows any number', () => {
    const dir = running();
    drive(dir, 25);                                        // near the cap
    writeFileSync(join(dir, 'scratchpad/datatest/drive.mjs'), '// the harness\n');
    assert.equal(drive(dir, 40).allowed, true);
  });

  test('running a script file is never counted, whatever it queries', () => {
    const dir = running();
    for (let i = 0; i < 60; i++) {
      assert.equal(sh(dir, 'node scratchpad/datatest/drive.mjs --dimension money').allowed, true);
    }
  });

  test('an oracle alone is enough - json counts as the artifact of step 1', () => {
    const dir = running();
    writeFileSync(join(dir, 'scratchpad/datatest/oracle-money.json'), '{}');
    // json is not in the driver extensions, so the count still applies until a script exists
    const r = drive(dir, 31);
    assert.equal(r.allowed, false, 'an oracle without a driver is still hand-driving');
  });
});

describe('the escapes', () => {
  test('FLOW_HARNESS_OFF=1 for one command', () => {
    const dir = running();
    drive(dir, 31);
    assert.equal(sh(dir, QUERY, { FLOW_HARNESS_OFF: '1' }).allowed, true);
  });

  test('.flow/harness-off for the project', () => {
    const dir = running({ '.flow/harness-off': '' });
    assert.equal(drive(dir, 60).allowed, true);
  });
});

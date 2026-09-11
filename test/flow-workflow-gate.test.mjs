// The workflow gate: uniform verification stopped being a suggestion.
//
// Three measured runs on real projects escalated CHECK's adversarial pass into a Workflow
// and spawned a fixed number of skeptics per finding: 48 agents / 66M tokens, then 61 / 4.9M,
// then 155. `references/review.md` carries the tiering AND a paragraph written to be read at
// exactly that moment. In the last of those sessions that file was never opened at all.
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixture, runHook, cleanup } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, '..', 'hooks', 'flow-workflow-gate.mjs');

after(cleanup);

const wf = (dir, script, env = {}) =>
  runHook(GATE, { tool_name: 'Workflow', tool_input: { script, cwd: dir } }, env);

// A verification stage, so the gate is looking. The fan-out is what varies.
const VERIFY = 'adversarially refute this finding';

describe('uniform verification is denied', () => {
  test('a literal array of skeptics per finding', () => {
    const r = wf(fixture(), `await parallel([0, 1, 2].map(i => () => agent("${VERIFY}", {})))`);
    assert.equal(r.allowed, false);
    assert.match(r.reason, /3 verifiers for every finding/);
    assert.match(r.reason, /BLOCKER/);
    assert.match(r.reason, /MINOR/);
  });

  test('Array.from({length: N})', () => {
    const r = wf(fixture(), `parallel(Array.from({length: 4}, () => () => agent("${VERIFY}", {})))`);
    assert.equal(r.allowed, false);
    assert.match(r.reason, /4 verifiers/);
  });

  test('new Array(N)', () => {
    const r = wf(fixture(), `new Array(3).fill(0).map(() => agent("skeptic: ${VERIFY}", {}))`);
    assert.equal(r.allowed, false);
  });

  test('the denial says "sequential", because three at once is the other half of the bug', () => {
    const r = wf(fixture(), `parallel([0,1,2].map(i => () => agent("${VERIFY}", {})))`);
    assert.match(r.reason, /SEQUENTIAL/);
  });

  test('it names the missing dedupe only when there is none', () => {
    const bare = wf(fixture(), `parallel([0,1,2].map(i => () => agent("${VERIFY}", {})))`);
    assert.match(bare.reason, /Deduplicate BEFORE falsifying/);

    const deduped = wf(fixture(),
      `const seen = new Set(); const fresh = f.filter(x => !seen.has(k(x)));\n` +
      `parallel([0,1,2].map(i => () => agent("${VERIFY}", {})))`);
    assert.equal(deduped.allowed, false, 'still denied - dedupe does not excuse uniform fan-out');
    assert.doesNotMatch(deduped.reason, /Deduplicate BEFORE falsifying/);
  });
});

describe('what it must not touch', () => {
  test('a count computed from the finding is the fix, and passes', () => {
    const r = wf(fixture(),
      `const rounds = f.severity === "BLOCKER" ? 3 : f.severity === "MAJOR" ? 1 : 0;\n` +
      `for (let i = 0; i < rounds; i++) { const v = await agent("${VERIFY}", {}); if (v.refuted) break }`);
    assert.equal(r.allowed, true);
  });

  test('one verifier per finding', () => {
    const r = wf(fixture(), `parallel(findings.map(f => () => agent("${VERIFY}: " + f.title, {})))`);
    assert.equal(r.allowed, true);
  });

  test('a fan-out that is the work itself, not a second opinion', () => {
    const r = wf(fixture(), `parallel([0,1,2].map(i => () => agent("map subsystem " + i, {})))`);
    assert.equal(r.allowed, true);
  });

  test('a workflow invoked by name has no script to read', () => {
    const r = runHook(GATE, { tool_name: 'Workflow', tool_input: { name: 'saved-thing', cwd: fixture() } });
    assert.equal(r.allowed, true);
  });

  test('another tool is not this gate\'s business', () => {
    const r = runHook(GATE, { tool_name: 'Agent', tool_input: { prompt: `parallel([0,1,2]) ${VERIFY}`, cwd: fixture() } });
    assert.equal(r.allowed, true);
  });

  test('outside a Flow project it says nothing', () => {
    const r = runHook(GATE, {
      tool_name: 'Workflow',
      tool_input: { script: `parallel([0,1,2].map(i => () => agent("${VERIFY}", {})))`, cwd: join(HERE, '..', '..') },
    });
    assert.equal(r.allowed, true);
  });
});

describe('the escapes are the owner\'s', () => {
  test('FLOW_FANOUT_OFF=1 for one run', () => {
    const script = `parallel([0,1,2].map(i => () => agent("${VERIFY}", {})))`;
    const dir = fixture();
    assert.equal(wf(dir, script).allowed, false);
    assert.equal(wf(dir, script, { FLOW_FANOUT_OFF: '1' }).allowed, true);
  });

  test('.flow/fanout-off for the project', () => {
    const script = `parallel([0,1,2].map(i => () => agent("${VERIFY}", {})))`;
    assert.equal(wf(fixture({ '.flow/fanout-off': '' }), script).allowed, true);
  });
});

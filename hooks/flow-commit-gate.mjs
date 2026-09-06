#!/usr/bin/env node
// Flow commit gate - PreToolUse on Bash, filtered to `git commit`.
// Blocks a commit whose staged source changes do not pass the fast test command.
// Silence = allow. Fails open at every ambiguity: an unconfigured project, an
// unreadable profile, or a missing command all let the commit through.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const BACKSLASH = String.fromCharCode(92);
const ok = () => process.exit(0);

const deny = (reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
};

let raw = '';
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw || '{}'); } catch { ok(); }

const cmd = input?.tool_input?.command || '';
// Defensive: the hook `if` filter should already have narrowed this.
if (!/\bgit\s+(-[^\s]+\s+)*commit\b/.test(cmd)) ok();
// Never fight an explicit bypass the user typed themselves.
if (/--no-verify|-n\b/.test(cmd)) ok();

// ---------- repo root ----------
let root = (input?.cwd || process.cwd()).split(BACKSLASH).join('/');
for (let i = 0; i < 40; i++) {
  if (existsSync(join(root, '.git'))) break;
  const up = dirname(root);
  if (up === root) ok();
  root = up;
}
if (!existsSync(join(root, '.git'))) ok();

// ---------- escape hatches ----------
if (process.env.FLOW_SKIP_VERIFY === '1') ok();
if (existsSync(join(root, '.flow', 'verify-off'))) ok();

// ---------- the command comes from the project profile ----------
const profile = join(root, '.flow', 'PROJECT.md');
if (!existsSync(profile)) ok();
let testCmd = '';
try {
  const m = readFileSync(profile, 'utf8').match(/^[ \t]*-?[ \t]*test_fast:[ \t]*(.+)$/m);
  testCmd = m ? m[1].trim() : '';
} catch { ok(); }
if (!testCmd || /^<.*>$/.test(testCmd)) ok();

// ---------- only gate commits that actually stage code ----------
const GUARDED = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|php|java|cs)$/i;
let staged = [];
try {
  staged = execSync('git diff --cached --name-only', { cwd: root, encoding: 'utf8' })
    .split('\n').map((s) => s.trim()).filter(Boolean);
} catch { ok(); }
if (!staged.length) ok();
if (!staged.some((f) => GUARDED.test(f))) ok();

// ---------- run it ----------
try {
  execSync(testCmd, { cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: 90_000 });
  ok();
} catch (err) {
  if (err && err.code === 'ETIMEDOUT') {
    deny(
      'Flow commit gate: `' + testCmd + '` did not finish within 90s.\n' +
      'test_fast in .flow/PROJECT.md should be the fast unit suite - no containers, no\n' +
      'network. Point it at that, or bypass once with FLOW_SKIP_VERIFY=1.'
    );
  }
  const out = ((err && (err.stdout || '')) + (err && (err.stderr || ''))).trim();
  const tail = out.split('\n').slice(-25).join('\n');
  deny(
    'Flow commit gate: the staged change does not pass `' + testCmd + '`.\n\n' +
    (tail || '(the command produced no output)') + '\n\n' +
    'Fix the failure before committing. Guard 3 applies to your own commit too:\n' +
    'evidence before assertions.\n' +
    'Bypass once: FLOW_SKIP_VERIFY=1   Suspend for the project: .flow/verify-off'
  );
}

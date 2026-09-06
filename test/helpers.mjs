// Test helpers: build throwaway project fixtures and run a hook against them.
// No dependencies - Node built-ins only, same constraint as the hooks themselves.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TDD_GATE = join(HERE, '..', 'hooks', 'flow-tdd-gate.mjs');
export const COMMIT_GATE = join(HERE, '..', 'hooks', 'flow-commit-gate.mjs');

const made = [];

/**
 * Create a project fixture. Keys are relative paths, values are file contents.
 * A `.flow/.keep` marker is always added so the hooks stop walking up at the
 * fixture root rather than escaping into the real filesystem.
 */
export function fixture(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'flow-test-'));
  made.push(dir);
  const all = { '.flow/.keep': '', ...files };
  for (const [rel, content] of Object.entries(all)) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

/** A fixture that is also a git repository, for the commit gate. */
export function gitFixture(files = {}) {
  const dir = fixture(files);
  const opts = { cwd: dir, stdio: 'ignore' };
  execSync('git init -q -b main', opts);
  execSync('git config user.email test@example.invalid', opts);
  execSync('git config user.name Test', opts);
  return dir;
}

export function gitAdd(dir, ...paths) {
  execSync(`git add ${paths.map((p) => JSON.stringify(p)).join(' ')}`, { cwd: dir, stdio: 'ignore' });
}

export function cleanup() {
  for (const d of made.splice(0)) {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

/**
 * Run a hook with a payload on stdin. Returns { allowed, reason }.
 * Silence from a hook means allow - that is the contract these hooks implement.
 */
export function runHook(hookPath, payload, env = {}) {
  const res = spawnSync(process.execPath, [hookPath], {
    input: typeof payload === 'string' ? payload : JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  if (res.error) throw res.error;
  const out = (res.stdout || '').trim();
  if (!out) return { allowed: true, reason: '', stderr: res.stderr };
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch {
    throw new Error(`hook emitted non-JSON: ${out.slice(0, 200)}`);
  }
  const o = parsed.hookSpecificOutput || {};
  return {
    allowed: o.permissionDecision !== 'deny',
    reason: o.permissionDecisionReason || '',
    stderr: res.stderr,
  };
}

/** Convenience: ask the TDD gate about writing `file` inside `dir`. */
export function tddVerdict(dir, relFile, env = {}) {
  return runHook(TDD_GATE, {
    tool_name: 'Edit',
    tool_input: { file_path: join(dir, relFile) },
  }, env);
}

/** Convenience: ask the commit gate about a command run in `dir`. */
export function commitVerdict(dir, command, env = {}) {
  return runHook(COMMIT_GATE, {
    tool_name: 'Bash',
    cwd: dir,
    tool_input: { command },
  }, env);
}

export const REAL_TEST = 'import { test } from "node:test";\nimport assert from "node:assert";\ntest("works", () => { assert.equal(1, 1); });\n';

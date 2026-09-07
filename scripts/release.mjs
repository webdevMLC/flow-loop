#!/usr/bin/env node
// Release the plugin: test, bump, commit, push, and refresh the local marketplace clone.
//
// That last step is the one this script exists for. `/plugin` installs read from the clone
// under ~/.claude/plugins/marketplaces/, not from GitHub, so a push alone changes nothing a
// user can install. Forgetting it looks exactly like a broken update, and it was forgotten
// four times before this file existed.
//
//   node scripts/release.mjs 1.15.0 "fix(fleet): size from measurement"

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const [version, message] = process.argv.slice(2);
const die = (m) => { console.error(`\n  ${m}\n`); process.exit(1); };

if (!/^\d+\.\d+\.\d+$/.test(version || '')) die('usage: release.mjs <x.y.z> "<commit message>"');
if (!message) die('a commit message is required');

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', stdio: 'pipe', ...opts }).trim();

const step = (n, what) => console.log(`\n[${n}/5] ${what}`);

// 1. Tests. A release that ships a red suite is worse than no release.
step(1, 'tests');
try {
  // Run the suite with this Node rather than via npm: the npm shim is a .cmd on Windows,
  // which cannot be spawned without a shell, and spawning through one does not escape args.
  const script = JSON.parse(readFileSync('package.json', 'utf8')).scripts.test;
  const argv = script.split(' ').filter(Boolean);
  if (argv.shift() !== 'node') die('the test script no longer starts with "node" — update release.mjs');
  run(process.execPath, argv);
  console.log('      pass');
} catch (e) {
  console.error(e.stdout || e.message);
  die('tests failed — nothing released');
}

// 2. Version, in all three manifests. They drift silently if bumped by hand.
step(2, `version -> ${version}`);
const MANIFESTS = ['package.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json'];
for (const f of MANIFESTS) {
  if (!existsSync(f)) die(`missing manifest: ${f}`);
  const src = readFileSync(f, 'utf8');
  const next = src.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
  if (next === src) die(`no version field replaced in ${f}`);
  writeFileSync(f, next);
  console.log(`      ${f}`);
}

// 3 & 4. Commit and push.
step(3, 'commit');
run('git', ['add', '-A']);
run('git', ['commit', '-m', message]);
console.log(`      ${run('git', ['log', '--oneline', '-1'])}`);

step(4, 'push');
run('git', ['push', 'origin', 'HEAD:main']);
console.log('      origin/main updated');

// 5. The clone. Installs read from here.
step(5, 'marketplace clone');
const known = join(homedir(), '.claude', 'plugins', 'known_marketplaces.json');
if (!existsSync(known)) {
  console.log('      no local marketplace registered — skipped');
} else {
  const entry = JSON.parse(readFileSync(known, 'utf8'))['flow-loop'];
  const clone = entry?.installLocation;
  if (!clone || !existsSync(clone)) {
    console.log('      flow-loop not installed locally — skipped');
  } else {
    run('git', ['-C', clone, 'fetch', 'origin']);
    run('git', ['-C', clone, 'merge', '--ff-only', 'origin/main']);
    const at = JSON.parse(readFileSync(join(clone, '.claude-plugin', 'plugin.json'), 'utf8')).version;
    console.log(`      ${clone} -> v${at}`);
    if (at !== version) die(`clone is at v${at}, expected v${version} — installs will be stale`);
  }
}

console.log(`\n  v${version} released. Restart Claude Code to install it.\n`);

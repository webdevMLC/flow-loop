#!/usr/bin/env node
// Flow TDD gate - PreToolUse on Write|Edit.
// Blocks edits to logic source files that have no corresponding test file.
// Silence = allow. Only ever prints JSON when denying.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, basename, extname, join } from 'node:path';

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

// ---------- read stdin ----------
let raw = '';
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw || '{}'); } catch { ok(); }

// The envelope (tool_name / tool_input) is shared across platforms, but the field
// naming inside it is not: Claude Code sends Write/Edit with file_path, Codex sends
// apply_patch and friends with its own spelling. Accept the known ones and fail open
// on anything unrecognised rather than guessing at a path.
const ti = input?.tool_input ?? {};
const filePath = ti.file_path ?? ti.path ?? ti.filePath ?? ti.target_file ?? ti.file ?? null;
if (!filePath || typeof filePath !== 'string') ok();

const p = filePath.split(BACKSLASH).join('/');
const lower = p.toLowerCase();
const base = basename(p);
const ext = extname(p).toLowerCase();

// ---------- only guard real code ----------
const GUARDED = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.rb', '.php', '.java', '.cs']);
if (!GUARDED.has(ext)) ok();

// a test file itself must always be writable, or RED is impossible
const IS_TEST = /(\.|_)(test|spec)\.[^/]+$/i.test(base)
  || /(^|\/)(test|tests|__tests__|spec)\//i.test(lower)
  || /^test_.*\.(py|rb)$/i.test(base)
  || /_test\.(go|py|rb)$/i.test(base);
if (IS_TEST) ok();

// glue, config, generated, vendored - the skill's own TDD exemptions
const EXEMPT_DIR = ['/node_modules/', '/dist/', '/build/', '/.next/', '/out/', '/coverage/',
  '/vendor/', '/.git/', '/migrations/', '/scripts/', '/public/', '/.claude/', '/.flow/',
  '/generated/', '/__generated__/', '/.turbo/', '/docker/'];
if (EXEMPT_DIR.some((d) => lower.includes(d))) ok();

if (/(\.config\.[^.]+|\.d\.ts|\.stories\.[^.]+|\.gen\.[^.]+)$/i.test(base)) ok();
if (/^(index|types|constants|setup|main|app)\.[^.]+$/i.test(base)) ok();

// ---------- find project root ----------
// If nothing above the file marks a project, the file is not part of one - a scratch
// script in a temp directory, say. Gating there is noise, and the advice it produces
// ("create C://.flow/tdd-off") is nonsense.
let root = dirname(p);
let inProject = false;
for (let i = 0; i < 40; i++) {
  if (existsSync(join(root, '.flow'))) { inProject = true; break; }
  const up = dirname(root);
  if (up === root) break;
  root = up;
}
if (!inProject) ok();

// ---------- escape hatches ----------
if (process.env.FLOW_TDD_OFF === '1') ok();
if (existsSync(join(root, '.flow', 'tdd-off'))) ok();

// Project-local exemptions: one path fragment per line, # for comments. Lives in the
// repository so it survives plugin updates and is reviewable in the diff.
const exemptList = join(root, '.flow', 'tdd-exempt');
if (existsSync(exemptList)) {
  let patterns = [];
  try {
    patterns = readFileSync(exemptList, 'utf8')
      .split(String.fromCharCode(10))
      .map((line) => line.split('#')[0].trim().toLowerCase())
      .filter(Boolean);
  } catch { /* unreadable list exempts nothing */ }
  if (patterns.some((frag) => lower.includes(frag))) ok();
}

// ---------- look for a matching test ----------
const stemRaw = base.slice(0, base.length - ext.length);
const stem = stemRaw.toLowerCase();

// Tokens too generic to prove anything.
const STOP = new Set(['index', 'type', 'types', 'util', 'utils', 'common', 'base', 'core',
  'main', 'data', 'helper', 'helpers', 'shared', 'constant', 'constants', 'config',
  'value', 'values', 'item', 'items', 'file', 'files']);

// claims -> [claims, claim]; bookingEvents -> [booking, events, event]
const tokenize = (s) => s
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .flatMap((t) => (t.length > 4 && t.endsWith('s') ? [t, t.slice(0, -1)] : [t]))
  .filter((t) => t.length >= 4 && !STOP.has(t));

// Framework files whose basename carries no meaning (Next.js route.ts, etc).
// Their tests are named for the behavior, so anchor on the route segment instead.
const GENERIC = /^(route|middleware|handler|controller|service|resolver|page|layout|loading|error|template|default|not-found)$/;
const tokens = tokenize(GENERIC.test(stem) ? basename(dirname(p)) : stemRaw);

// A file is a test if its NAME says so, or if it LIVES in a test directory. The second
// clause is not optional: plenty of projects (Node's own runner, tape, ava) use
// test/<name>.mjs with no marker in the filename at all.
const TEST_DIR = /(^|\/)(test|tests|__tests__|spec|specs)\//i;
const isTestFile = (full) => {
  const n = basename(full).toLowerCase();
  if (/(\.|_)(test|spec)\./.test(n) || /^test_/.test(n)) return true;
  return TEST_DIR.test(full.split(BACKSLASH).join('/').toLowerCase());
};

// Pass 1 (free): the test's NAME is anchored on this file's name or one of its tokens.
// Covers booking-events-idempotency.test.ts -> booking-events.ts,
// lead-claim-rejection.test.ts -> claims.ts (shared token "claim"),
// and test/activity.mjs -> src/activity.mjs (marker in the path, not the name).
const nameCovers = (raw) => {
  const n = raw.toLowerCase();
  if (n.startsWith(stem) || n.startsWith('test_' + stem)) return true;
  return tokens.some((t) => n.includes(t));
};

// A stub named like a test is not a test. Require a recognisable assertion, or enough
// substance that the assertions are plausibly behind a project-specific helper.
const ASSERTS = /\bexpect\s*\(|\bassert\b|\bshould\b|\bt\.(is|deepEqual|throws|true|false|Error|Fatal)/i;
const isRealTest = (full) => {
  try {
    if (statSync(full).size > 512 * 1024) return true;
    const txt = readFileSync(full, 'utf8');
    if (ASSERTS.test(txt)) return true;
    return txt.split('\n').filter((l) => l.trim()).length >= 20;
  } catch { return false; }
};

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out',
  'coverage', 'vendor', '.turbo', '.cache', 'target', '.venv', 'venv']);

let budget = 4000;
let matched = false;
const tests = [];
const stubs = [];
const walk = (dir, depth) => {
  if (matched || depth > 8 || budget-- <= 0) return;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (matched) return;
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(join(dir, e.name), depth + 1);
    } else {
      const full = join(dir, e.name);
      if (!isTestFile(full)) continue;
      if (nameCovers(e.name)) {
        if (isRealTest(full)) { matched = true; return; }
        if (stubs.length < 10 && !stubs.includes(e.name)) stubs.push(e.name);
      } else if (tests.length < 400) {
        tests.push(full);
      }
    }
  }
};
walk(root, 0);
if (matched) ok();

// Pass 1b: the route this file serves. app/(console)/scorecard/page.tsx -> /scorecard.
// A spec that drives that path is the honest covering test for a screen; demanding a unit
// test named for a file called "page" is what taught this gate to prefer modules to
// interfaces.
let route = '';
{
  const parts = p.split('/');
  const i = parts.lastIndexOf('app');
  if (i >= 0) {
    const segs = parts.slice(i + 1, -1).filter((x) => x && !(x.startsWith('(') && x.endsWith(')')));
    if (segs.length) route = '/' + segs.join('/');
  }
}

// Pass 2 (bounded reads): a test that exercises one of this module's exports even
// though its filename shares nothing with it -- e.g. imported via a barrel.
let source = '';
try { source = readFileSync(p, 'utf8'); } catch { source = input?.tool_input?.content || ''; }
const symbols = [...source.matchAll(
  /export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
)].map((m) => m[1]).filter((s) => s.length >= 4);

if (symbols.length || (route && route.length > 1)) {
  let reads = 0;
  for (const t of tests) {
    if (reads++ > 80) break;
    try {
      if (statSync(t).size > 512 * 1024) continue;
      const txt = readFileSync(t, 'utf8');
      if (symbols.some((s) => txt.includes(s))) ok();
        if (route && route.length > 1 && txt.includes(route)) ok();
    } catch { /* unreadable, skip */ }
  }
}

deny(
  (stubs.length
    ? 'Flow TDD gate: ' + stubs.join(', ') + ' matches "' + base + '" by name but has no\n' +
      'assertions - a file named like a test is not a test.\n'
    : 'Flow TDD gate: no test file found for "' + base + '".\n') +
  'RED comes first - write a failing test before this implementation, and watch it fail\n' +
  'for the right reason.\n' +
  (route
    ? 'Expected a render or end-to-end test driving ' + route + ', or a component test'
    : 'Expected ' + stem + '.test' + ext + ' / ' + stem + '.spec' + ext + ' / test_' + stem + ext) +
  (route ? '' :
  ' somewhere under ' + root) + '\n\n' +
  (route
    ? 'This is a screen. Its honest test is that the route RENDERS with its states - '
      + 'loading, empty, error, unauthorized - not a unit test named after a file called '
      + '"page". A render or end-to-end test driving ' + route + ' satisfies this gate.'
      + '\n\n'
      + 'DO NOT move this work into a module to make it easier to test. That is the failure '
      + 'this gate actually caused: modules are trivially unit-testable and screens are not, '
      + 'so a project under a naive test-first rule drifts backend-ward until nothing is '
      + 'visible. One real project shipped eleven phases that way.'
      + '\n\n'
    : '') +
  'This denial is the RED step reporting that it has not happened yet. Do not route ' +
  'around it to keep moving - the escape hatches below are for files genuinely outside ' +
  'TDD scope, not for code you would rather not test yet.\n\n' +
  'If this file is config, glue, scaffolding, or markup it is outside the TDD scope: ' +
  'add a line to ' + root + '/.flow/tdd-exempt (one path fragment per line)\n' +
  'Suspend for this project: create ' + root + '/.flow/tdd-off\n' +
  'Suspend for one command: FLOW_TDD_OFF=1'
);

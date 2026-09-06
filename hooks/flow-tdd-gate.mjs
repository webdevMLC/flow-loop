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

const filePath = input?.tool_input?.file_path;
if (!filePath) ok();

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
if (/^(index|types|constants|setup|main|app|layout|page)\.[^.]+$/i.test(base)) ok();

// ---------- find project root ----------
let root = dirname(p);
for (let i = 0; i < 40; i++) {
  if (existsSync(join(root, '.git')) || existsSync(join(root, '.flow'))) break;
  const up = dirname(root);
  if (up === root) break;
  root = up;
}

// ---------- escape hatches ----------
if (process.env.FLOW_TDD_OFF === '1') ok();
if (existsSync(join(root, '.flow', 'tdd-off'))) ok();

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
const GENERIC = /^(route|middleware|handler|controller|service|resolver)$/;
const tokens = tokenize(GENERIC.test(stem) ? basename(dirname(p)) : stemRaw);

const isTestName = (n) => /(\.|_)(test|spec)\./.test(n) || /^test_/.test(n);

// Pass 1 (free): the test's NAME is anchored on this file's name or one of its tokens.
// Covers booking-events-idempotency.test.ts -> booking-events.ts
// and lead-claim-rejection.test.ts -> claims.ts (shared token "claim").
const nameCovers = (raw) => {
  const n = raw.toLowerCase();
  if (!isTestName(n)) return false;
  if (n.startsWith(stem) || n.startsWith('test_' + stem)) return true;
  return tokens.some((t) => n.includes(t));
};

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out',
  'coverage', 'vendor', '.turbo', '.cache', 'target', '.venv', 'venv']);

let budget = 4000;
let matched = false;
const tests = [];
const walk = (dir, depth) => {
  if (matched || depth > 8 || budget-- <= 0) return;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (matched) return;
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(join(dir, e.name), depth + 1);
    } else if (isTestName(e.name.toLowerCase())) {
      if (nameCovers(e.name)) { matched = true; return; }
      if (tests.length < 400) tests.push(join(dir, e.name));
    }
  }
};
walk(root, 0);
if (matched) ok();

// Pass 2 (bounded reads): a test that exercises one of this module's exports even
// though its filename shares nothing with it -- e.g. imported via a barrel.
let source = '';
try { source = readFileSync(p, 'utf8'); } catch { source = input?.tool_input?.content || ''; }
const symbols = [...source.matchAll(
  /export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
)].map((m) => m[1]).filter((s) => s.length >= 4);

if (symbols.length) {
  let reads = 0;
  for (const t of tests) {
    if (reads++ > 80) break;
    try {
      if (statSync(t).size > 512 * 1024) continue;
      const txt = readFileSync(t, 'utf8');
      if (symbols.some((s) => txt.includes(s))) ok();
    } catch { /* unreadable, skip */ }
  }
}

deny(
  'Flow TDD gate: no test file found for "' + base + '".\n' +
  'RED comes first - write a failing test before this implementation.\n' +
  'Expected ' + stem + '.test' + ext + ' / ' + stem + '.spec' + ext + ' / test_' + stem + ext +
  ' somewhere under ' + root + '\n\n' +
  'If this file is config, glue, scaffolding, or markup it is outside the TDD scope: ' +
  'add its directory to EXEMPT_DIR in the flow plugin hooks/flow-tdd-gate.mjs\n' +
  'Suspend for this project: create ' + root + '/.flow/tdd-off\n' +
  'Suspend for one command: FLOW_TDD_OFF=1'
);

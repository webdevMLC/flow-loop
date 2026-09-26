#!/usr/bin/env node
// Flow harness gate - PreToolUse on Bash and PowerShell, active only during a datatest or
// ultra data run.
//
// It enforces one sentence from the skill: "If a tester is making one shell call per test
// case, it is doing step 2 by hand." Silence = allow. Inactive unless the run's own scratchpad
// directory exists, so it says nothing to ordinary work.
//
// Why a hook. The tier rule shipped as advice and was measured losing: a session holding the
// rule in context still ran its refuters on the frontier model. The run this gate exists for
// made 1,106 shell calls, 171 of which touched the database - the busiest tester 168 tool
// calls over 49 minutes, about 17 seconds a turn, composing a 286-character script each time
// to run a query whose expected answer it had already worked out.
//
// The rule it protects: build the oracle once (frontier), drive it with a script (no model),
// judge only what differed (frontier). Driving is not turn-taking work.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, parse } from 'node:path';

const NL = String.fromCharCode(10);
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
try { raw = readFileSync(0, 'utf8'); } catch { ok(); }
let input;
try { input = JSON.parse(raw || '{}'); } catch { ok(); }

const SHELL = new Set(['Bash', 'PowerShell', 'local_shell', 'shell', 'shell_command',
  'exec_command', 'run_command', 'terminal']);
if (!SHELL.has(String(input?.tool_name ?? input?.toolName ?? ''))) ok();
if (process.env.FLOW_HARNESS_OFF === '1') ok();

const ti = input?.tool_input ?? {};
let cmd = ti.command ?? ti.cmd ?? ti.script ?? '';
if (Array.isArray(cmd)) cmd = cmd.join(' ');
if (typeof cmd !== 'string' || !cmd) ok();

// ---------- scope: only inside a run that has a scratchpad ----------
const BACKSLASH = String.fromCharCode(92);
const norm = (s) => String(s).split(BACKSLASH).join('/');
const findRoot = (from) => {
  let dir = norm(from);
  const { root } = parse(dir);
  for (let i = 0; i < 40 && dir && dir !== root; i++) {
    if (existsSync(join(dir, '.flow'))) return dir;
    dir = dirname(dir);
  }
  return null;
};
const root = findRoot(typeof ti.cwd === 'string' ? ti.cwd : (input?.cwd || process.cwd()));
if (!root) ok();
if (existsSync(join(root, '.flow', 'harness-off'))) ok();

const RUNS = [join(root, 'scratchpad', 'datatest'), join(root, 'scratchpad', 'ultra-data')];
const run = RUNS.find((d) => existsSync(d));
if (!run) ok();                                   // no data run in progress: not our business

// ---------- is this command driving a case? ----------
// A write or a read against the system under test, as opposed to reading files or running the
// project's own tooling.
const DRIVES = /\b(select|insert\s+into|update\s+\w+\s+set|delete\s+from)\b|\$queryRaw|\$executeRaw|prisma\s+db|mysql\s|psql\s|curl\s+-|fetch\(|page\.(goto|click|fill)/i;
if (!DRIVES.test(cmd)) ok();

// A command that runs a file is the harness, not hand-driving - never counted, never denied.
const RUNS_A_FILE = /\b(node|npx tsx|tsx|ts-node|python|pwsh|bash)\s+[^\s|;&]+\.(m?[jt]s|cjs|py|ps1|sh)\b/i;
if (RUNS_A_FILE.test(cmd)) ok();

// ---------- has a driver been written? ----------
const driver = (() => {
  try {
    return readdirSync(run).some((f) => /\.(m?[jt]s|cjs|py|sh|ps1|sql)$/i.test(f));
  } catch { return false; }
})();
if (driver) ok();                                 // a harness exists: this is fine

// ---------- count, and cap ----------
// The count lives with the run, not in .flow/: it is scratch, and it dies with the scratchpad.
const LIMIT = 30;
const counter = join(run, '.hand-driven-count');
let n = 0;
try { n = parseInt(readFileSync(counter, 'utf8').trim(), 10) || 0; } catch { n = 0; }
n += 1;
try { mkdirSync(run, { recursive: true }); writeFileSync(counter, String(n)); } catch { /* best effort */ }
if (n <= LIMIT) ok();

deny(
  'Flow harness gate: ' + n + ' cases driven by hand, and no driver script in ' + NL +
  norm(run).replace(norm(root) + '/', '') + '/.' + NL + NL +
  'Build the oracle once, drive it with a script, judge only what differed:' + NL + NL +
  '  1. what SHOULD be true for every case  -> oracle-<dimension>.json   (frontier, once)' + NL +
  '  2. run them all and diff               -> drive.mjs                 (no model at all)' + NL +
  '  3. read only the differences           -> your findings             (frontier)' + NL + NL +
  'Deciding a total should be 15,432.10 is the hard part. Running the query that returns' + NL +
  '15,001.00 and noticing they differ is !==.' + NL + NL +
  'Measured on the run this gate exists for: 1,106 shell calls, 171 of which touched the' + NL +
  'database; the busiest tester 168 tool calls over 49 minutes, about 17 seconds a turn,' + NL +
  'composing a 286-character script each time. The database answered in milliseconds.' + NL + NL +
  'Write the driver into that directory and this gate stands down - it only ever counts' + NL +
  'commands sent when no script is there. A case whose next step genuinely depends on the' + NL +
  'last - a state machine walked into a corner, a concurrency race - is the named exception:' + NL +
  'put those in the script too, or bypass once.' + NL + NL +
  'references/testers.md in the datatest skill.' + NL +
  'Bypass once: FLOW_HARNESS_OFF=1   Suspend for the project: .flow/harness-off'
);

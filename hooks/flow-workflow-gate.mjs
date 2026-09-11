#!/usr/bin/env node
// Flow workflow gate - PreToolUse on Workflow.
//
// Denies a workflow script that verifies findings with a HARD-CODED number of agents each.
// Silence = allow. Fails open at every ambiguity: a saved workflow invoked by name, a script
// it cannot read, a project with no `.flow/`.
//
// Why this is a hook and not a sentence. `references/review.md` already carries the tiering,
// and carries a paragraph written specifically to be read at this moment:
//
//     "If you escalate this stage into a Workflow script, that tiering still governs it.
//      This is where it goes wrong, because the skill you read to *write* a workflow
//      documents the opposite shape ... Refuse it here."
//
// That paragraph was measured against a real run and lost. In the session that produced it,
// `review.md` was never opened at all - the Protocols table named it, the agent did not
// follow the row, and `workflow-authoring` (which prescribes the opposite shape, and loads
// automatically at the moment a script is written) was the only instruction present. Three
// measured runs: 48 agents/66M tokens, 61 agents/4.9M, then 155 agents - the last spending
// 72 of them re-refuting defects five other lenses had already reported.
//
// The rule has to arrive when the script is written. A denial is the only delivery mechanism
// that does.
//
// The check is deliberately narrow: a fan-out whose SIZE IS A LITERAL is uniform by
// construction - nothing about the finding can change it. A script that tiers
// (`f.severity === 'BLOCKER' ? 3 : 1`) has no such literal and passes untouched.

import { readFileSync, existsSync } from 'node:fs';
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

const toolName = input?.tool_name ?? input?.toolName ?? '';
if (toolName !== 'Workflow') ok();
const ti = input?.tool_input ?? input?.toolInput ?? {};

if (process.env.FLOW_FANOUT_OFF === '1') ok();

// ---------- scope: a Flow project, the same as every other gate ----------
const BACKSLASH = String.fromCharCode(92);
const norm = (s) => String(s).split(BACKSLASH).join('/');
const findRoot = (from) => {
  let dir = dirname(norm(from));
  const { root } = parse(dir);
  for (let i = 0; i < 40 && dir && dir !== root; i++) {
    if (existsSync(join(dir, '.flow'))) return dir;
    dir = dirname(dir);
  }
  return existsSync(join(root, '.flow')) ? root : null;
};
const cwd = norm(typeof ti.cwd === 'string' ? ti.cwd : (input?.cwd || process.cwd()));
const root = findRoot(join(cwd, 'x'));
if (!root) ok();
if (existsSync(join(root, '.flow', 'fanout-off'))) ok();

// ---------- the script ----------
let script = typeof ti.script === 'string' ? ti.script : '';
if (!script && typeof ti.scriptPath === 'string') {
  try { script = readFileSync(ti.scriptPath, 'utf8'); } catch { ok(); }
}
if (!script) ok();                                   // invoked by name: nothing to read

// ---------- is this a verification stage at all? ----------
// Only refutation-shaped work is tiered. A fan-out over files, modules or dimensions is the
// work itself, not a second opinion on it, and this gate says nothing about it.
if (!/\brefut|\bskeptic|\bfalsif|\bdisprove|\bverif/i.test(script)) ok();

// ---------- a fan-out whose size is a literal ----------
const literalFanout = () => {
  let n = 0;
  const bump = (c) => { if (c >= 2) n = Math.max(n, c); };
  // parallel([0, 1, 2].map(...))  /  [0,1,2].map(i => agent(...))
  for (const m of script.matchAll(/\[\s*(?:\d+\s*,\s*){1,}\d+\s*\]\s*\.map/g)) {
    bump((m[0].match(/\d+/g) || []).length);
  }
  // Array.from({length: 3}, ...)
  for (const m of script.matchAll(/Array\.from\(\s*\{\s*length:\s*(\d+)/g)) bump(Number(m[1]));
  // new Array(3).fill(...)
  for (const m of script.matchAll(/new Array\(\s*(\d+)\s*\)/g)) bump(Number(m[1]));
  return n;
};

const n = literalFanout();
if (!n) ok();                                        // computed, or one verifier: fine

// ---------- and does it dedupe before spending that? ----------
const dedupes = /\bdedup|\bdedupe|new Set\(|\bseen\b|\bunique\b/i.test(script);

const TABLE =
  '    BLOCKER    up to 3        a false blocker stops a ship' + NL +
  '    MAJOR      1              a second opinion, not a panel' + NL +
  '    MINOR      0 - report it  if it is wrong the reader loses five seconds' + NL;

deny(
  'Flow workflow gate: this script spawns ' + n + ' verifiers for every finding - the same ' + n + NL +
  'for a typo as for a money defect. The count is a literal, so nothing about the finding' + NL +
  'can change it. That is uniform verification, and it is the largest avoidable cost in' + NL +
  'CHECK.' + NL + NL +
  'Tier it (references/review.md, "When you do verify, tier it"):' + NL + NL +
  TABLE + NL +
  '"Up to 3" is SEQUENTIAL, stopping on the first refutation - not ' + n + ' at once. Cheapest' + NL +
  'discriminator first: does the code say what the finding claims; does something else' + NL +
  'already prevent it; can you construct the failing input. Most findings never reach the' + NL +
  'third.' + NL + NL +
  (dedupes ? '' :
    'It also never deduplicates. Independent lenses over the same files report the same' + NL +
    'defect: a measured run had one defect found by six of eight dimensions and paid for' + NL +
    '36 verifiers on it. Deduplicate BEFORE falsifying - collect the findings at a barrier,' + NL +
    'merge by file and line, then verify what is left.' + NL + NL) +
  'Write the count as a function of the finding:' + NL + NL +
  '    const rounds = f.severity === "BLOCKER" ? 3 : f.severity === "MAJOR" ? 1 : 0' + NL + NL +
  'Bypass once: FLOW_FANOUT_OFF=1   Suspend for the project: .flow/fanout-off'
);

#!/usr/bin/env node
// Flow commit gate - PreToolUse on Bash, filtered to `git commit`.
// Blocks a commit whose staged source changes do not pass the fast test command.
// Silence = allow. Fails open at every ambiguity: an unconfigured project, an
// unreadable profile, or a missing command all let the commit through.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const BACKSLASH = String.fromCharCode(92);
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
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw || '{}'); } catch { ok(); }

// Shell tools differ by platform: Claude Code's Bash sends a command string, Codex's
// shell/exec_command may send argv as an array. Normalise both, ignore anything else.
const ti = input?.tool_input ?? {};
const rawCmd = ti.command ?? ti.cmd ?? ti.script ?? '';
const cmd = Array.isArray(rawCmd) ? rawCmd.join(' ') : String(rawCmd || '');

// Defensive: the hook `if` filter should already have narrowed this.
if (!/\bgit\s+(-[^\s]+\s+)*commit\b/.test(cmd)) ok();
// Never fight an explicit bypass the user typed themselves - but read it off the command
// grammar, not the prose. `git commit -m "add -n flag parsing"` is not a bypass, and the
// first version of this line let that message through every check below.
const cmdNoMsg = cmd
  .replace(/-m\s+(["'])(?:(?!\1)[\s\S])*\1/g, ' -m MSG ')
  .replace(/--message(=|\s+)(["'])(?:(?!\2)[\s\S])*\2/g, ' --message MSG ');
const explicitBypass = /(^|\s)(--no-verify|-n)(\s|$)/.test(cmdNoMsg);

// ---------- repo root ----------
let root = (input?.cwd || process.cwd()).split(BACKSLASH).join('/');
for (let i = 0; i < 40; i++) {
  if (existsSync(join(root, '.git'))) break;
  const up = dirname(root);
  if (up === root) ok();
  root = up;
}
if (!existsSync(join(root, '.git'))) ok();


// ---------- only gate commits that actually stage code ----------
const GUARDED = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|php|java|cs)$/i;
let staged = [];
const collect = (c) => {
  try {
    return execSync(c, { cwd: root, encoding: 'utf8' })
      .split('\n').map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
};
staged = collect('git diff --cached --name-only');
// `git commit -a` stages at commit time, so the index is empty right now: union the
// unstaged tracked changes it is about to sweep in. Same for a pathspec commit.
if (/(^|\s)(-a|--all|-am|-[a-zA-Z]*a[a-zA-Z]*)(\s|$)/.test(cmdNoMsg)) {
  staged = [...new Set([...staged, ...collect('git diff --name-only')])];
}
// `--amend` re-commits the previous commit's files even with an empty index.
if (/(^|\s)--amend(\s|$)/.test(cmdNoMsg)) {
  staged = [...new Set([...staged, ...collect('git show --name-only --pretty=format: HEAD')])];
}
if (!staged.length) ok();
if (!staged.some((f) => GUARDED.test(f))) ok();

// ---------- the state file must keep up with the commits ----------
// Checked before the tests because it is free, and because it applies even to projects
// with no PROJECT.md — which is exactly where the drift was found.
const IS_STATE = /(^|\/)\.flow\/STATE\.md$/i;
if (existsSync(join(root, '.flow', 'STATE.md'))) {
  const stagedState = staged.some((f) => IS_STATE.test(f.split(BACKSLASH).join('/')));
  let recent = '';
  if (!stagedState) {
    try {
      recent = execSync('git log -2 --name-only --pretty=format:', { cwd: root, encoding: 'utf8' });
    } catch { /* shallow or empty history */ }
  }
  if (!stagedState && !/\.flow\/STATE\.md/i.test(recent.split(BACKSLASH).join('/'))) {
    deny(
      'Flow state gate: this commit changes source, but .flow/STATE.md has not been\n' +
      'updated in this commit or either of the last two.\n\n' +
      'The state file is the only thing that survives the end of a session. When tasks ship\n' +
      'without being checked off, the next run reads an untouched task list and redoes work\n' +
      'that is already committed.\n\n' +
      'Check off what this commit finished, with its sha, and set the gate. Then commit.\n' +
      'Bypass once: FLOW_SKIP_VERIFY=1   Suspend for the project: .flow/verify-off'
    );
  }
}

// ---------- every acceptance criterion cites where it came from ----------
// Only once a project skill exists (PLAN has run); before that the plan gate holds the line.
// A criterion that cites nothing was invented by the agent, and two real projects shipped
// twenty-plus phases of exactly those.
const projectSkill = (() => {
  const dir = join(root, '.claude', 'skills');
  if (!existsSync(dir)) return null;
  try {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = join(dir, e.name, 'SKILL.md');
      if (!existsSync(p)) continue;
      try {
        const text = readFileSync(p, 'utf8');
        if (/flow-project-skill\s*:\s*true/i.test(text.split(NL).slice(0, 20).join(NL))) return text;
      } catch { /* unreadable is not a skill */ }
    }
  } catch { /* unreadable directory */ }
  return null;
})();

if (projectSkill && existsSync(join(root, '.flow', 'STATE.md'))
    && process.env.FLOW_CITE_OFF !== '1' && !existsSync(join(root, '.flow', 'cite-off'))) {
  let state = '';
  try { state = readFileSync(join(root, '.flow', 'STATE.md'), 'utf8'); } catch { state = ''; }
  const lines = state.split(NL);

  // The current phase's criteria. Accept any heading level and the common spellings, so a
  // phase written as "## Acceptance criteria" or "### Criteria" is not silently unchecked.
  const isCritHeading = (l) => /^#{2,4}\s+(acceptance\s+)?criteria\b/i.test(l.trim());
  const start = lines.findIndex(isCritHeading);

  if (start < 0) {
    // Fail CLOSED: a phase with a project skill and no criteria section is a phase whose
    // criteria nobody wrote, which is the failure this gate exists to catch.
    deny(
      'Flow citation gate: .flow/STATE.md has no acceptance-criteria section.' + NL +
      'A Full phase is framed with criteria that each cite the project skill. If this is' + NL +
      'Quick or Direct work it should not be writing STATE.md at all.' + NL +
      'Heading expected: "### Acceptance criteria".' + NL +
      'Bypass once: FLOW_CITE_OFF=1   Suspend for the project: .flow/cite-off'
    );
  }

  // Section headings the skill actually has, so `from:` resolves to something real.
  const skillHeads = [...projectSkill.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)]
    .map((m) => m[1].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim())
    .filter(Boolean);

  const uncited = [];
  const unresolved = [];
  let bullet = null;
  const flush = () => {
    if (!bullet) return;
    const text = bullet.replace(/\s+/g, ' ').trim();
    const m = text.match(/\bfrom:\s*(.+?)\s*$/i);
    if (!m) { uncited.push(text.slice(0, 110)); bullet = null; return; }
    const cite = m[1].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    // Resolve against the skill's own headings only when it has some. A young skill with
    // no sections still gets the vagueness check below; it does not get a false denial.
    const known = cite === 'intent' || skillHeads.length === 0
      || skillHeads.some((h) => h.includes(cite) || cite.includes(h));
    const vague = /^(tbd|todo|n ?a|none|nowhere|somewhere|unknown|\?+)\b/.test(cite) || cite.length < 3;
    if (vague || !known) unresolved.push(text.slice(0, 110) + '   [cites: ' + m[1].trim() + ']');
    bullet = null;
  };

  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,4}\s/.test(l)) break;
    if (/^\s*[-*]\s/.test(l)) { flush(); bullet = l; continue; }
    // A wrapped continuation line belongs to the bullet above it: joining them is what
    // stops a correctly cited but long criterion being reported as uncited.
    if (bullet && /^\s+\S/.test(l)) { bullet += ' ' + l; continue; }
    flush();
  }
  flush();

  if (uncited.length || unresolved.length) {
    const parts = [];
    if (uncited.length) {
      parts.push(uncited.length + ' criteria cite nothing:' + NL + uncited.map((u) => '  ' + u).join(NL));
    }
    if (unresolved.length) {
      parts.push(unresolved.length + ' cite something the project skill does not contain:' + NL
        + unresolved.map((u) => '  ' + u).join(NL));
    }
    deny(
      'Flow citation gate: acceptance criteria must name where they came from.' + NL + NL +
      parts.join(NL + NL) + NL + NL +
      'End each criterion with `from: <section of the project skill>` or `from: intent`.' + NL +
      'Sections available: ' + (skillHeads.slice(0, 12).join(', ') || '(none found)') + NL +
      'A criterion with nothing to cite was invented - that is how a project passes every' + NL +
      'gate and is still the wrong product. Remove it, or take it to the owner as a question.' + NL +
      'Bypass once: FLOW_CITE_OFF=1   Suspend for the project: .flow/cite-off'
    );
  }
}

// ---------- escape hatches, for the test run only ----------
// These suspend running the suite. They deliberately do NOT suspend the state-file or
// citation checks above: those are the loop's own bookkeeping, and an agent that can turn
// them off by typing a flag is back to an instruction.
if (explicitBypass) ok();
if (process.env.FLOW_SKIP_VERIFY === '1') ok();
if (existsSync(join(root, '.flow', 'verify-off'))) ok();

// ---------- the test command comes from the project profile ----------
const profile = join(root, '.flow', 'PROJECT.md');
if (!existsSync(profile)) ok();
let testCmd = '';
try {
  const m = readFileSync(profile, 'utf8').match(/^[ \t]*-?[ \t]*test_fast:[ \t]*(.+)$/m);
  testCmd = m ? m[1].trim() : '';
} catch { ok(); }

// Profiles backtick their command lines, so test_fast arrives wrapped and trailed by prose.
// The whole rest of the line went to the shell, so it executed a word starting with a
// backtick and denied every commit with "not recognized". A gate that cannot run its own
// command refuses everything, which is indistinguishable from a red suite.
const BT = String.fromCharCode(96);
if (testCmd.startsWith(BT)) {
  const close = testCmd.indexOf(BT, 1);
  if (close > 1) testCmd = testCmd.slice(1, close).trim();
}

// The line is captured to end-of-line and handed to a shell, so a profile that answers
// "test_fast: none" in English would run `none`, fail, and deny every commit - the gate
// reporting a red suite for a project that has no suite. Treat those answers as absent.
const ABSENT = ['none', 'n/a', 'na', '-', 'tbd', 'todo', 'pending', 'not set', 'unset', 'nothing'];
const lowerCmd = testCmd.toLowerCase();
const saysAbsent = ABSENT.some((w) => lowerCmd === w || lowerCmd.startsWith(w + ' '));
const isPlaceholder = testCmd.startsWith('<') && testCmd.endsWith('>');
if (!testCmd || saysAbsent || isPlaceholder) ok();

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

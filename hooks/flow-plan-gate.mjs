#!/usr/bin/env node
// Flow plan gate - PreToolUse on file writes and on every shell tool.
//
// The rules an agent most reliably fails to follow when they are only written down, made
// into denials instead. Silence = allow. Only ever prints JSON when denying.
//
//   A write to a source file is denied when:
//     - the project has .flow/ but no project skill (PLAN has not run)
//     - a project skill exists but the OWNER has not confirmed it
//     - .flow/UAT.md holds more open `by person` entries than the ceiling (default 5)
//   A write to any owner-only switch is always denied, by any tool.
//   `git push` is denied unless .flow/allow-push exists.
//
// A "write" is a Write/Edit tool call OR a shell command whose target this can identify -
// a redirect, a heredoc, tee, sed -i, cp/mv, Set-Content, Out-File, New-Item, touch. The
// shell path matters: hosts routinely tell agents to prefer heredocs and sed over the
// dedicated file tools, which walked straight through the first version of this gate.
//
// Escape hatches are OWNER files, not agent files: .flow/plan-off suspends the plan and
// confirmation gates, FLOW_PLAN_OFF=1 suspends them for one command. The loop is denied
// from creating either. Nothing suspends the push gate.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, basename, extname, join } from 'node:path';
import { createHash } from 'node:crypto';

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

const toolName = String(input?.tool_name ?? '');
const ti = input?.tool_input ?? {};

const SHELL_TOOLS = new Set(['Bash', 'PowerShell', 'local_shell', 'shell', 'shell_command',
  'exec_command', 'run_command', 'terminal']);

// Every file whose existence is a statement by the owner. The loop never writes any of them.
const OWNER_ONLY = ['.flow/plan-confirmed', '.flow/allow-push', '.flow/plan-off',
  '.flow/cite-off', '.flow/tdd-off', '.flow/verify-off', '.flow/evidence-off',
  '.flow/fanout-off', '.flow/uat-ceiling'];

const norm = (s) => String(s).split(BACKSLASH).join('/');

// ---------- project root ----------
const findRoot = (fromPath) => {
  let root = dirname(norm(fromPath));
  for (let i = 0; i < 40; i++) {
    if (existsSync(join(root, '.flow'))) return root;
    const up = dirname(root);
    if (up === root) break;
    root = up;
  }
  return null;
};

// ---------- what counts as source ----------
// A denylist, not an allowlist: the first version guarded twelve extensions and let .rs,
// .kt, .swift, .vue and .sql through. Anything that is not obviously prose, config or an
// asset is treated as product code.
const NOT_SOURCE = new Set(['.md', '.markdown', '.txt', '.rst', '.json', '.jsonc', '.yml',
  '.yaml', '.toml', '.ini', '.cfg', '.conf', '.lock', '.env', '.example', '.sample',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.avif', '.pdf',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.webm', '.mp3', '.wav',
  '.csv', '.tsv', '.log', '.gitignore', '.gitattributes', '.editorconfig', '.snap', '']);

const EXEMPT_DIR = ['/node_modules/', '/dist/', '/build/', '/.next/', '/out/', '/coverage/',
  '/vendor/', '/.git/', '/.claude/', '/.flow/', '/generated/', '/__generated__/', '/.turbo/',
  '/.venv/', '/venv/', '/target/', '/bin/', '/obj/'];

const isTestPath = (p) => {
  const b = basename(p);
  return /(\.|_)(test|spec)\.[^/]+$/i.test(b)
    || /(^|\/)(test|tests|__tests__|spec|e2e)\//i.test(p.toLowerCase())
    || /^test_.*\.(py|rb)$/i.test(b)
    || /_test\.(go|py|rb|rs)$/i.test(b);
};

const isSource = (pathRaw) => {
  const p = norm(pathRaw);
  const lower = p.toLowerCase();
  if (EXEMPT_DIR.some((d) => lower.includes(d))) return false;
  if (NOT_SOURCE.has(extname(p).toLowerCase())) return false;
  if (isTestPath(p)) return false;                 // RED must always be possible
  return true;
};

const cwdOf = (ti, input) =>
  norm(typeof ti?.cwd === 'string' ? ti.cwd : (input?.cwd || process.cwd()));

const isOwnerOnly = (pathRaw) => {
  const lower = norm(pathRaw).toLowerCase();
  return OWNER_ONLY.some((f) => lower.endsWith(f));
};

// ---------- the project skill ----------
const findProjectSkill = (root) => {
  const dir = join(root, '.claude', 'skills');
  if (!existsSync(dir)) return null;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return null; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const f = join(dir, e.name, 'SKILL.md');
    if (!existsSync(f)) continue;
    try {
      if (/flow-project-skill\s*:\s*true/i.test(readFileSync(f, 'utf8').split(NL).slice(0, 20).join(NL))) {
        return { path: f, rel: '.claude/skills/' + e.name + '/SKILL.md' };
      }
    } catch { /* unreadable is not a skill */ }
  }
  return null;
};

// Hash over content with line endings normalised. A CRLF checkout must not invalidate a
// confirmation the owner made on an LF one - core.autocrlf rewrites the working tree.
const skillHash = (path) => {
  try {
    const text = readFileSync(path, 'utf8').split(String.fromCharCode(13, 10)).join(NL).trimEnd();
    return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);
  } catch { return null; }
};

const confirmedHash = (root) => {
  const f = join(root, '.flow', 'plan-confirmed');
  if (!existsSync(f)) return null;
  try {
    const buf = readFileSync(f);
    const utf8 = buf.toString('utf8').replace(/[^0-9a-fA-F]/g, '').toLowerCase();
    if (utf8.length >= 12) return utf8;
    return buf.toString('utf16le').replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  } catch { return null; }
};

const openUat = (root) => {
  const f = join(root, '.flow', 'UAT.md');
  if (!existsSync(f)) return 0;
  try {
    return readFileSync(f, 'utf8').split(NL)
      .filter((l) => /^###\s/.test(l) && /\bopen\s*$/i.test(l)).length;
  } catch { return 0; }
};

const uatCeiling = (root) => {
  const f = join(root, '.flow', 'uat-ceiling');
  if (!existsSync(f)) return 5;
  try {
    const n = parseInt(readFileSync(f, 'utf8').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : 5;
  } catch { return 5; }
};

// =====================================================================================
// The three checks, applied to any identified write target
// =====================================================================================
const checkWrite = (targetPath, via) => {
  if (isOwnerOnly(targetPath)) {
    deny(
      'Flow plan gate: ' + norm(targetPath) + ' is created by the owner, never by the loop.' + NL +
      'These files are how a person says "I approved this" or "I am opening this door":' + NL +
      '  ' + OWNER_ONLY.join('  ') + NL +
      'Ask them to create it. Telling them the command is fine; running it is not.' +
      (via ? NL + '(seen in a shell command: ' + via + ')' : '')
    );
  }
  if (!isSource(targetPath)) return;

  const root = findRoot(targetPath);
  if (!root) return;                                     // not inside a Flow project
  if (process.env.FLOW_PLAN_OFF === '1') return;
  if (existsSync(join(root, '.flow', 'plan-off'))) return;

  const skill = findProjectSkill(root);
  if (!skill) {
    deny(
      'Flow plan gate: no project skill exists, so PLAN has not run.' + NL + NL +
      'Full work is framed against a project skill - the intent in the owner\'s words, the' + NL +
      'jobs, the process flows, what the product is not. Nothing here has one.' + NL + NL +
      'Run /flow:plan. It writes .claude/skills/<project>/SKILL.md with' + NL +
      '`flow-project-skill: true` in its frontmatter, publishes the flows and screens for the' + NL +
      'owner to review, and they confirm it.' + NL + NL +
      'Only the owner can suspend this (.flow/plan-off). Do not create that file, and do not' + NL +
      'route around this with a shell redirect - the same check runs there.' +
      (via ? NL + '(target: ' + norm(targetPath) + ', via ' + via + ')' : '')
    );
  }

  // ---- PLAN must have drawn something, and the confirmation certifies the drawing ----
  // Step 6 of the plan skill publishes the flows and every screen as an artifact. It was
  // prose, and the confirmation certified a sha256 of a MARKDOWN FILE - so a run that wrote
  // a good skill and skipped the drawing passed every gate, and the owner confirmed a plan
  // having seen no picture of it. That is the failure this whole stage exists to prevent:
  // nobody had drawn the screen the job lands on.
  const planArt = join(root, '.flow', 'plan', 'index.html');
  if (!existsSync(planArt)) {
    deny(
      'Flow plan gate: PLAN wrote a project skill but drew nothing - step 6 was skipped.' + NL + NL +
      'The owner reviews pictures, not prose. PLAN publishes one artifact showing every' + NL +
      'process flow as a diagram, a grey wireframe of every screen a job lands on, each' + NL +
      'entity lifecycle, and the decisions - and writes that same page to:' + NL + NL +
      '    .flow/plan/index.html' + NL + NL +
      'Write it there, publish it, and give the owner the link. A skill nobody could see' + NL +
      'the shape of is the plan that shipped a tournament with nowhere to appear.' + NL + NL +
      'Only the owner can suspend this (.flow/plan-off).' +
      (via ? NL + '(target: ' + norm(targetPath) + ', via ' + via + ')' : '')
    );
  }

  // The pictures, not just the page. "It produced an artifact" was satisfiable by a page with
  // nothing on it; what the owner asked for is a picture of the product. The screens are
  // rendered designs captured to PNG, and the confirmation covers them - redraw one and it
  // goes stale, because what was approved was the image.
  const SCREENS = join(root, '.flow', 'plan', 'screens');
  const shots = (() => {
    try {
      return readdirSync(SCREENS).filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f)).sort();
    } catch { return []; }
  })();
  if (!shots.length) {
    deny(
      'Flow plan gate: the plan has no picture of the product - no image in .flow/plan/screens/.' + NL + NL +
      'PLAN designs every screen a job lands on, in the project theme, with real content, and' + NL +
      'captures each one:' + NL + NL +
      '    .flow/plan/screens/<screen>.png          desktop' + NL +
      '    .flow/plan/screens/<screen>-mobile.png   375px' + NL + NL +
      'A page of prose and grey boxes is not something an owner can judge. The screens they' + NL +
      'will actually get, before the code exists, is the whole point of the stage - and the' + NL +
      'reason the last two projects shipped screens nobody had seen.' + NL + NL +
      'Only the owner can suspend this (.flow/plan-off).' +
      (via ? NL + '(target: ' + norm(targetPath) + ', via ' + via + ')' : '')
    );
  }

  const want = skillHash(skill.path);
  // The drawing is the page plus every capture on it: name and byte length of each, so a
  // redrawn screen invalidates an approval given for the old one.
  const shotList = shots.map((f) => {
    let size = 0;
    try { size = statSync(join(SCREENS, f)).size; } catch { /* counted as 0 */ }
    return f + ":" + size;
  }).join("|");
  const drawn = createHash("sha256")
    .update(skillHash(planArt) + "|" + shotList, "utf8").digest("hex").slice(0, 12);
  const have = confirmedHash(root);
  if (want && (!have || !have.includes(want) || (drawn && !have.includes(drawn)))) {
    deny(
      'Flow plan gate: ' + (have
        ? (have.includes(want)
            ? 'the plan artifact changed after the owner confirmed it, so the confirmation is stale.'
            : 'the project skill changed after the owner confirmed it, so the confirmation is stale.')
        : 'the project skill has not been confirmed by the owner.') + NL + NL +
      'Ask them to open .flow/plan/index.html - the flows and the screens they will get -' + NL +
      'and, if that is the product they want, run:' + NL + NL +
      '    echo ' + want + '-' + drawn + ' > .flow/plan-confirmed' + NL + NL +
      'The loop never writes that file. The confirmation covers both the skill and the' + NL +
      'drawing, so correcting either one changes it and they confirm again.' +
      (have ? NL + NL + 'If nothing was meant to change, check what edited the skill: writing into it' + NL +
        '(a confirmation date, a correction) invalidates the confirmation by design.' : '')
    );
  }

  const open = openUat(root);
  const ceiling = uatCeiling(root);
  if (open > ceiling) {
    deny(
      'Flow plan gate: ' + open + ' `by person` questions are open in .flow/UAT.md (ceiling ' + ceiling + ').' + NL + NL +
      'Judgement piling up unjudged is the same failure as tests nobody runs - every phase' + NL +
      'after this is built on questions nobody answered. Ask the owner to answer them; it is' + NL +
      'usually ten minutes. Only they raise the ceiling (.flow/uat-ceiling).'
    );
  }
};

// =====================================================================================
// Shell: push gate, owner-only reads/writes, and writes to source
// =====================================================================================
let rawCmd = ti.command ?? ti.cmd ?? ti.script ?? '';
if (Array.isArray(rawCmd)) rawCmd = rawCmd.join(' ');
rawCmd = typeof rawCmd === 'string' ? rawCmd : '';

const filePath = ti.file_path ?? ti.path ?? ti.filePath ?? ti.target_file ?? ti.file ?? ti.notebook_path ?? null;

if (SHELL_TOOLS.has(toolName) || (rawCmd && !filePath)) {
  if (!rawCmd) ok();
  const c = norm(rawCmd);

  // ---- git push, in any spelling, unless the owner opened the door ----
  // Matched on the command grammar, not the word: a commit message mentioning "push" is
  // not a push, and `git push --dry-run && git push` is.
  // Intermediate options may take a value (`git -C sub push`), and the whole command may sit
  // inside quotes (`bash -c "git push"`), so both the prefix and the option grammar matter.
  const PUSH = /(^|[\s;&|(`'"])git(\.exe)?\s+(?:(?:-[A-Za-z-]+|--[A-Za-z-]+)(?:[=\s]+[^\s;&|'"]+)?\s+)*push(\s|$|['"])/;
  const GH_PUSH = /(^|[\s;&|(`'"])gh\s+(pr\s+(create|merge)|release\s+create)/;
  const stripMsgs = c.replace(/-m\s+(["'])(?:(?!\1)[\s\S])*\1/g, ' -m MSG ')
                     .replace(/-m\s+\S+/g, ' -m MSG ');
  if (PUSH.test(stripMsgs) || GH_PUSH.test(stripMsgs)) {
    const onlyDryRun = /--dry-run/.test(stripMsgs)
      && stripMsgs.split(/&&|\|\||;/).filter((seg) => PUSH.test(seg)).every((seg) => /--dry-run/.test(seg));
    if (!onlyDryRun) {
      const cwd = typeof ti.cwd === 'string' ? ti.cwd : (input?.cwd || process.cwd());
      const root = findRoot(join(norm(cwd), 'x'));
      if (root && !existsSync(join(root, '.flow', 'allow-push'))) {
        deny(
          'Flow plan gate: pushing is the owner\'s action, not the loop\'s.' + NL + NL +
          'Committing locally is the boundary. If the owner wants this pushed, they run:' + NL +
          '    touch .flow/allow-push' + NL +
          'and delete it afterwards. The loop never creates that file, and nothing suspends' + NL +
          'this gate.'
        );
      }
    }
  }

  // ---- the loop's own record cannot be deleted ----
  // Every rule below the push check reads a file. The citation gate and the evidence gate
  // both open `.flow/STATE.md` and both fall silent when it is not there; the plan gate
  // itself keys on `.flow/` existing. So `rm -rf .flow` disarmed four rules at once, in one
  // command, with no denial - the exact shape of "a rule the agent can decide not to follow"
  // that this plugin exists to remove. Deleting the record is the owner's action.
  const DELETES = /(^|[\s;&|(])(rm|rmdir|unlink|del|erase|rd|Remove-Item|ri)\b|\bgit\s+(rm|clean)\b|\B-delete\b|(^|[\s;&|(])(mv|move|Move-Item|Rename-Item|ren)\b/i;
  if (DELETES.test(c)) {
    const droot = findRoot(join(cwdOf(ti, input), 'x'));
    const dskill = droot ? findProjectSkill(droot) : null;
    const PROTECTED = new Set(['.flow', '.flow/state.md', '.flow/project.md', '.flow/uat.md',
      '.flow/archive.md', '.flow/memory.md']);
    if (dskill) PROTECTED.add(dskill.rel.toLowerCase());
    // Tokens, with quotes, a leading `./` and a trailing slash removed.
    const tokens = c.split(/[\s;&|()<>]+/)
      .map((t) => t.replace(/^['"]+|['"]+$/g, '').replace(/^\.\//, '').replace(/\/+$/, '').toLowerCase())
      .filter(Boolean);
    // A path named as an exclusion is being protected, not deleted: `git clean -fdx -e .flow`.
    const hit = tokens.find((t, i) => PROTECTED.has(t) && !/^(-e|--exclude)$/i.test(tokens[i - 1] || ''));
    if (hit) {
      deny(
        'Flow plan gate: ' + hit + ' is the loop\'s record, and deleting it is the owner\'s' + NL +
        'action, not the loop\'s.' + NL + NL +
        'Four rules read that file. Removing it does not suspend them honestly - it makes' + NL +
        'them fall silent, which looks identical to passing. If the phase is wrong, rewrite' + NL +
        'the entries. If the project is being abandoned, the owner deletes it.' + NL + NL +
        'Nothing suspends this gate.'
      );
    }
    // `git clean` carries no path token and would still take an untracked .flow with it.
    if (/\bgit\s+clean\b/i.test(c) && /\s-{1,2}[A-Za-z]*[dxX]/.test(c)
        && !/(-e|--exclude)(=|\s+)['"]?\.?\/?\.flow/i.test(c)) {
      deny(
        'Flow plan gate: git clean with -d or -x removes an untracked .flow/, and .flow/ is' + NL +
        'the loop\'s record - four rules read it.' + NL + NL +
        'Exclude it explicitly:' + NL +
        '    git clean -fdx -e .flow' + NL + NL +
        'Nothing suspends this gate.'
      );
    }
  }

  // ---- writes, by any spelling this can identify ----
  const targets = [];
  const add = (t) => { if (t) targets.push(t.replace(/^['"]|['"]$/g, '')); };

  // redirects: `> f`, `>> f`, and heredoc `cat > f <<EOF` - but not `2>&1` or `2>/dev/null`
  for (const m of c.matchAll(/(?<![0-9&])>>?\s*([^\s;&|)<]+)/g)) add(m[1]);
  // tee, touch, sed -i, and the PowerShell writers
  for (const m of c.matchAll(/\btee\s+(?:-a\s+)?([^\s;&|)]+)/g)) add(m[1]);
  for (const m of c.matchAll(/\btouch\s+([^\s;&|)]+)/g)) add(m[1]);
  for (const m of c.matchAll(/\bsed\s+[^|;&]*-i[^\s]*\s+[^|;&]*?([^\s;&|)]+)\s*$/gm)) add(m[1]);
  for (const m of c.matchAll(/\b(?:Set-Content|Out-File|New-Item|Add-Content)\b[^;|]*?(?:-Path\s+)?([^\s;&|)]+)/gi)) add(m[1]);
  // cp/mv/copy/move destination is the last argument
  for (const m of c.matchAll(/\b(?:cp|mv|copy|move|Copy-Item|Move-Item)\s+(?:-\S+\s+)*\S+\s+([^\s;&|)]+)/gi)) add(m[1]);

  const cwd = typeof ti.cwd === 'string' ? norm(ti.cwd) : norm(input?.cwd || process.cwd());
  for (const t of targets) {
    const abs = /^([A-Za-z]:)?\//.test(t) ? t : join(cwd, t);
    checkWrite(abs, rawCmd.slice(0, 60).replace(/\s+/g, ' '));
  }
  ok();
}

// =====================================================================================
// Write / Edit / notebook edits
// =====================================================================================
if (!filePath || typeof filePath !== 'string') ok();
checkWrite(filePath, null);
ok();

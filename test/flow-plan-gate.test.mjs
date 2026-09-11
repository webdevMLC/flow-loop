// The plan gate: the rules that stopped being instructions.
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fixture, runHook, cleanup } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN_GATE = join(HERE, '..', 'hooks', 'flow-plan-gate.mjs');

after(cleanup);

const write = (dir, rel) => runHook(PLAN_GATE, { tool_name: 'Write', tool_input: { file_path: join(dir, rel) } });
const bash = (dir, command) => runHook(PLAN_GATE, { tool_name: 'Bash', tool_input: { command, cwd: dir } });
const CRLF = String.fromCharCode(13, 10);
const LF = String.fromCharCode(10);
// Must match the gate's normalisation exactly, or a CRLF checkout invalidates every
// confirmation on a machine with core.autocrlf on.
const hashOf = (dir, rel) => createHash('sha256')
  .update(readFileSync(join(dir, rel), 'utf8').split(CRLF).join(LF).trimEnd(), 'utf8')
  .digest('hex').slice(0, 12);

const REG = '.flow/plan/blockers.md';
const CLEAR = '## Blockers\n\n- [x] **B1** Sandbox credentials · `obtain` · resolved: owner supplied\n';
const SHOT = '.flow/plan/screens/create-tournament.png';
const SHOT2 = '.flow/plan/screens/create-tournament-mobile.png';
// Not a real PNG; the gate reads the name and the byte length, never the pixels.
const PIXELS = 'PNG-bytes-standing-in-for-a-designed-screen';
const drawnHash = (dir) => {
  const names = readdirSync(join(dir, '.flow/plan/screens'))
    .filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f)).sort()
    .map((f) => f + ':' + statSync(join(dir, '.flow/plan/screens', f)).size).join('|');
  return createHash('sha256').update(hashOf(dir, ART) + '|' + names, 'utf8')
    .digest('hex').slice(0, 12);
};
const PLAN = '<h1>Acme plan</h1><p>the flows, and every screen designed</p>';
const ART = '.flow/plan/index.html';
// The confirmation certifies both the skill and the drawing the owner actually looked at.
const confirm = (dir) => hashOf(dir, '.claude/skills/acme/SKILL.md') + '-' + drawnHash(dir);
const SKILL = '---\nname: acme\ndescription: Specification for Acme\nflow-project-skill: true\n---\n# Acme\n';
const STATE = '# Acme - Flow state\n## Now\n**Goal:** ship\n**Gate:** BUILD\n**Triage:** Full\n';

describe('scope - the gate only holds where it should', () => {
  test('a file outside any .flow project is ignored', () => {
    const dir = fixture();
    // helpers always add .flow/.keep, so go one directory up to escape the project
    const r = runHook(PLAN_GATE, { tool_name: 'Write', tool_input: { file_path: join(dir, '..', 'stray.ts') } });
    assert.equal(r.allowed, true);
  });

  test('a non-source file is never gated, even with no plan', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    assert.equal(write(dir, 'docs/notes.md').allowed, true);
  });

  test('a test file is always writable - RED must be possible', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    assert.equal(write(dir, 'src/ledger.test.ts').allowed, true);
    assert.equal(write(dir, 'test/ledger.mjs').allowed, true);
  });

  test('deleting STATE.md is not an escape - the gate keys on .flow/', () => {
    const dir = fixture();
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /PLAN has not run/);
  });
});

describe('the plan gate - no code until PLAN has run', () => {
  test('STATE.md with no project skill denies a source write and names PLAN', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /PLAN has not run/);
    assert.match(r.reason, /flow-project-skill: true/);
  });

  test('a skill without the frontmatter marker does not count', () => {
    const dir = fixture({
      '.flow/STATE.md': STATE,
      '.claude/skills/acme/SKILL.md': '---\nname: acme\n---\n# Acme\n',
    });
    assert.equal(write(dir, 'src/ledger.ts').allowed, false);
  });

  test('.flow/plan-off suspends it for the project', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.flow/plan-off': '' });
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('FLOW_PLAN_OFF=1 suspends it for one command', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    const r = runHook(PLAN_GATE, { tool_name: 'Write', tool_input: { file_path: join(dir, 'src/ledger.ts') } }, { FLOW_PLAN_OFF: '1' });
    assert.equal(r.allowed, true);
  });
});

describe('the confirmation gate - no code until the owner said yes', () => {
  test('a skill with no confirmation is denied, and the message carries the exact command', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /not been confirmed by the owner/);
    assert.match(r.reason, new RegExp('echo ' + confirm(dir) + ' > .flow/plan-confirmed'));
  });

  test('the right hash allows the write', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir) + '\n');
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('a confirmation written by PowerShell (UTF-16 with BOM) still counts', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    const h = confirm(dir);
    writeFileSync(join(dir, '.flow/plan-confirmed'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(h + '\r\n', 'utf16le')]));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('changing the skill after confirmation makes the confirmation stale', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    writeFileSync(join(dir, '.claude/skills/acme/SKILL.md'), SKILL + '\n## A new section the owner has not seen\n');
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /changed after the owner confirmed it/);
  });

  test('the loop is denied from writing the confirmation file itself', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    const r = write(dir, '.flow/plan-confirmed');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /created by the owner, never by the loop/);
  });

  test('a Windows path is handled', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    const winPath = join(dir, 'src', 'ledger.ts').split('/').join(String.fromCharCode(92));
    const r = runHook(PLAN_GATE, { tool_name: 'Edit', tool_input: { file_path: winPath } });
    assert.equal(r.allowed, true);
  });
});

describe('the UAT ceiling - judgement does not pile up unjudged', () => {
  const uat = (n, extraClosed = 1) => {
    let s = '# UAT\n';
    for (let i = 0; i < n; i++) s += `### A${i} - a question - Phase 3 - open\n\n**Answer:**\n\n`;
    for (let i = 0; i < extraClosed; i++) s += `### C${i} - settled - Phase 2 - closed\n\n`;
    return s;
  };
  const planned = (extra) => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR, ...extra });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    return dir;
  };

  test('five open entries is allowed', () => {
    assert.equal(write(planned({ '.flow/UAT.md': uat(5) }), 'src/ledger.ts').allowed, true);
  });

  test('six open entries is denied, with the count', () => {
    const r = write(planned({ '.flow/UAT.md': uat(6) }), 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /6 `by person` questions are open/);
  });

  test('closed entries are not counted', () => {
    assert.equal(write(planned({ '.flow/UAT.md': uat(2, 20) }), 'src/ledger.ts').allowed, true);
  });

  test('.flow/uat-ceiling raises the limit', () => {
    assert.equal(write(planned({ '.flow/UAT.md': uat(8), '.flow/uat-ceiling': '10\n' }), 'src/ledger.ts').allowed, true);
  });

  test('the UAT file itself stays writable so entries can be answered', () => {
    assert.equal(write(planned({ '.flow/UAT.md': uat(9) }), '.flow/UAT.md').allowed, true);
  });
});

describe('the push gate - committing locally is the boundary', () => {
  test('git push is denied without .flow/allow-push', () => {
    const dir = fixture();
    const r = bash(dir, 'git push origin main');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /pushing is the owner's action/);
    assert.match(r.reason, /touch .flow\/allow-push/);
  });

  test('git push with intermediate flags is still caught', () => {
    const dir = fixture();
    assert.equal(bash(dir, 'git -C sub push --force-with-lease').allowed, false);
    assert.equal(bash(dir, 'cd app && git push').allowed, false);
  });

  test('.flow/allow-push opens the door', () => {
    const dir = fixture({ '.flow/allow-push': '' });
    assert.equal(bash(dir, 'git push origin main').allowed, true);
  });

  test('a dry run is not a push', () => {
    const dir = fixture();
    assert.equal(bash(dir, 'git push --dry-run').allowed, true);
  });

  test('other git commands are untouched', () => {
    const dir = fixture();
    assert.equal(bash(dir, 'git status').allowed, true);
    assert.equal(bash(dir, 'git commit -m "x"').allowed, true);
    assert.equal(bash(dir, 'git log --oneline').allowed, true);
  });

  test('the loop cannot write the owner-only files from the shell either', () => {
    const dir = fixture();
    assert.equal(bash(dir, 'touch .flow/allow-push').allowed, false);
    assert.equal(bash(dir, 'echo abc > .flow/plan-confirmed').allowed, false);
    assert.equal(bash(dir, 'Set-Content .flow/plan-confirmed abc').allowed, false);
    // but reading them is fine
    assert.equal(bash(dir, 'cat .flow/plan-confirmed').allowed, true);
  });
});

describe('robustness', () => {
  test('malformed stdin allows', () => {
    const r = runHook(PLAN_GATE, 'not json');
    assert.equal(r.allowed, true);
  });

  test('a Write with no path allows', () => {
    const r = runHook(PLAN_GATE, { tool_name: 'Write', tool_input: {} });
    assert.equal(r.allowed, true);
  });
});

describe('bypasses found by the v2 audit - each verified, each now closed', () => {
  const planned = (extra = {}) => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR, ...extra });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    return dir;
  };
  const shell = (dir, tool, command) => runHook(PLAN_GATE, { tool_name: tool, tool_input: { command, cwd: dir } });

  test('the PowerShell tool is gated, not just Bash', () => {
    const dir = fixture();
    for (const tool of ['PowerShell', 'local_shell', 'shell', 'shell_command', 'exec_command']) {
      const r = shell(dir, tool, 'git push origin main');
      assert.equal(r.allowed, false, tool + ' should be denied');
    }
  });

  test('a heredoc cannot write source past the plan gate', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    const r = shell(dir, 'Bash', "cat > src/ledger.ts <<'EOF'\nexport const x = 1;\nEOF");
    assert.equal(r.allowed, false);
    assert.match(r.reason, /PLAN has not run/);
  });

  test('sed -i, tee, cp and Set-Content cannot write source past the plan gate', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    for (const cmd of ['sed -i "s/a/b/" src/ledger.ts', 'tee src/ledger.ts', 'cp /tmp/x src/ledger.ts',
                       'Set-Content src/ledger.ts "x"', 'touch src/ledger.ts']) {
      assert.equal(shell(dir, 'Bash', cmd).allowed, false, cmd + ' should be denied');
    }
  });

  test('a shell redirect cannot create any owner-only switch', () => {
    const dir = fixture();
    for (const f of ['plan-confirmed', 'allow-push', 'plan-off', 'cite-off', 'tdd-off', 'verify-off',
                      'evidence-off', 'uat-ceiling']) {
      assert.equal(shell(dir, 'Bash', 'echo x > .flow/' + f).allowed, false, f);
      assert.equal(write(dir, '.flow/' + f).allowed, false, f + ' via Write');
    }
  });

  test('deleting STATE.md does not disarm the gate', () => {
    const dir = fixture();                       // .flow/ exists, no STATE.md
    assert.equal(write(dir, 'src/ledger.ts').allowed, false);
  });

  test('unguarded-looking extensions are still source', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    for (const rel of ['src/main.rs', 'lib/x.kt', 'app/y.swift', 'ui/z.vue', 'db/q.sql', 'a/b.dart']) {
      assert.equal(write(dir, rel).allowed, false, rel + ' should be gated');
    }
  });

  test('prose, config and assets are still never gated', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    for (const rel of ['README.md', 'package.json', 'tsconfig.json', 'a.yml', 'logo.svg', '.env.example']) {
      assert.equal(write(dir, rel).allowed, true, rel + ' should be allowed');
    }
  });

  test('git push cannot be smuggled through a wrapper or a dry run', () => {
    const dir = fixture();
    for (const cmd of ['bash -c "git push origin main"', 'git.exe push', 'git -C sub push --force-with-lease',
                       'git push --dry-run && git push origin main', 'gh pr create --fill']) {
      assert.equal(shell(dir, 'Bash', cmd).allowed, false, cmd + ' should be denied');
    }
  });

  test('a commit message that mentions push is not a push', () => {
    const dir = fixture();
    assert.equal(shell(dir, 'Bash', 'git commit -m "feat: push notifications for responders"').allowed, true);
  });

  test('reading an owner-only file is allowed', () => {
    const dir = fixture();
    assert.equal(shell(dir, 'Bash', 'cat .flow/plan-confirmed').allowed, true);
    assert.equal(shell(dir, 'Bash', 'test -f .flow/allow-push').allowed, true);
  });

  test('a CRLF checkout does not invalidate the confirmation', () => {
    const dir = planned();
    const p = join(dir, '.claude/skills/acme/SKILL.md');
    writeFileSync(p, readFileSync(p, 'utf8').split(LF).join(CRLF));   // simulate autocrlf
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });
});

describe('NotebookEdit - found while explaining the limits', () => {
  test('a notebook is a write, and is gated like any other source', () => {
    const dir = fixture({ '.flow/STATE.md': STATE });
    const r = runHook(PLAN_GATE, { tool_name: 'NotebookEdit', tool_input: { notebook_path: join(dir, 'model.ipynb') } });
    assert.equal(r.allowed, false);
    assert.match(r.reason, /PLAN has not run/);
  });
});

describe('the record cannot be deleted - rm -rf .flow disarmed four rules', () => {
  const F = () => fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });

  test('the state file and the record directory are protected, in every spelling', () => {
    const dir = F();
    for (const c of ['rm .flow/STATE.md', 'rm -rf .flow', 'rm -rf .flow/', 'rm ./.flow/STATE.md',
                     'rm -f .flow/PROJECT.md', 'del .flow/STATE.md', 'Remove-Item -Recurse -Force .flow',
                     'git rm .flow/STATE.md', 'mv .flow/STATE.md /tmp/x',
                     'rm .flow/UAT.md', 'rm .flow/ARCHIVE.md']) {
      assert.equal(bash(dir, c).allowed, false, c);
    }
  });

  test('the project skill is protected too - deleting it disarms the plan gate', () => {
    const dir = F();
    assert.equal(bash(dir, 'rm .claude/skills/acme/SKILL.md').allowed, false);
  });

  test('git clean would take an untracked .flow with it', () => {
    const dir = F();
    assert.equal(bash(dir, 'git clean -fdx').allowed, false);
    assert.equal(bash(dir, 'git clean -fd').allowed, false);
    // An explicit exclusion is the documented way through, and must not be read as a target.
    assert.equal(bash(dir, 'git clean -fdx -e .flow').allowed, true);
    assert.equal(bash(dir, 'git clean -fdx --exclude=.flow').allowed, true);
    // Without -d or -x it cannot reach a directory of untracked files.
    assert.equal(bash(dir, 'git clean -f').allowed, true);
  });

  test('the denial names the file and offers no escape', () => {
    const r = bash(F(), 'rm -rf .flow');
    assert.match(r.reason, /\.flow/);
    assert.match(r.reason, /Nothing suspends this gate/);
  });

  test('it does not fire on ordinary deletions', () => {
    const dir = F();
    for (const c of ['rm -rf node_modules', 'rm dist/bundle.js', 'npm run build',
                     'rm .flow/evidence/12/stale.png', 'ls .flow', 'cat .flow/STATE.md',
                     'git commit -m "remove the rm flag"']) {
      assert.equal(bash(dir, c).allowed, true, c);
    }
  });
});


describe('PLAN drew nothing - the owner confirmed a hash of prose', () => {
  test('a project skill with no drawing is denied, and the message says where it goes', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL });
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /drew nothing/);
    assert.match(r.reason, /step 7 was skipped/);
    assert.match(r.reason, new RegExp('\\.flow/plan/index\\.html'));
  });

  test('the drawing alone is not enough - it still needs confirming', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    assert.equal(write(dir, 'src/ledger.ts').allowed, false);
  });

  test('the confirmation certifies the drawing too, so changing it goes stale', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);

    // Redraw a screen after the owner said yes: what they approved is no longer what is there.
    writeFileSync(join(dir, ART), PLAN + '<p>a screen nobody has seen</p>');
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /plan artifact changed/);
  });

  test('a confirmation naming only the skill is refused', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    writeFileSync(join(dir, '.flow/plan-confirmed'), hashOf(dir, '.claude/skills/acme/SKILL.md'));
    assert.equal(write(dir, 'src/ledger.ts').allowed, false);
  });

  test('the loop cannot draw its own approval - the artifact is not owner-only, the confirmation is', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL });
    // PLAN writes the drawing itself; that must stay possible.
    assert.equal(write(dir, '.flow/plan/index.html').allowed, true);
    // The confirmation never is.
    assert.equal(write(dir, '.flow/plan-confirmed').allowed, false);
  });

  test('.flow/fanout-off is the owner\'s too', () => {
    const dir = fixture();
    assert.equal(write(dir, '.flow/fanout-off').allowed, false);
    assert.equal(bash(dir, 'echo x > .flow/fanout-off').allowed, false);
  });
});


describe('the plan has to show the product, not describe it', () => {
  const base = { '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [REG]: CLEAR };

  test('a page with no captured screen is denied', () => {
    const r = write(fixture(base), 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /no picture of the product/);
    assert.match(r.reason, new RegExp('\\.flow/plan/screens'));
  });

  test('one capture satisfies it; the message names desktop and 375px', () => {
    const dir = fixture({ ...base, [SHOT]: PIXELS });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('a non-image in the screens directory does not count', () => {
    const dir = fixture({ ...base, '.flow/plan/screens/notes.md': 'I will draw it later' });
    assert.equal(write(dir, 'src/ledger.ts').allowed, false);
  });

  test('redrawing a screen after approval makes the confirmation stale', () => {
    const dir = fixture({ ...base, [SHOT]: PIXELS });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);

    writeFileSync(join(dir, SHOT), PIXELS + ' - redesigned after they said yes');
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false, 'a redrawn screen is not the one they approved');
    assert.match(r.reason, /plan artifact changed/);
  });

  test('adding a screen after approval makes it stale too', () => {
    const dir = fixture({ ...base, [SHOT]: PIXELS });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    writeFileSync(join(dir, SHOT2), PIXELS);
    assert.equal(write(dir, 'src/ledger.ts').allowed, false);
  });

  test('PLAN can still write its own captures - only the confirmation is owner-only', () => {
    const dir = fixture(base);
    assert.equal(write(dir, SHOT).allowed, true);
    assert.equal(write(dir, '.flow/plan/screens/entrant-list.png').allowed, true);
  });
});


describe('a redesign is waiting for the owner - /flow:uiux cannot apply what nobody has seen', () => {
  // A confirmed plan, so only the redesign stands between the loop and source.
  const planned = () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    return dir;
  };
  const pend = (dir) => {
    mkdirSync(join(dir, '.flow/uiux/2026-09-11/screens'), { recursive: true });
    writeFileSync(join(dir, '.flow/uiux/pending'), '2026-09-11\n');
  };
  const AFTER = '.flow/uiux/2026-09-11/screens/leads-board.png';
  const AFTER_M = '.flow/uiux/2026-09-11/screens/leads-board-mobile.png';
  const uiuxHash = (dir) => {
    const screens = join(dir, '.flow/uiux/2026-09-11/screens');
    const list = readdirSync(screens).filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f)).sort()
      .map((f) => f + ':' + statSync(join(screens, f)).size).join('|');
    return createHash('sha256').update('2026-09-11|' + list, 'utf8').digest('hex').slice(0, 12);
  };

  test('with no redesign pending, nothing changes', () => {
    assert.equal(write(planned(), 'src/ledger.ts').allowed, true);
  });

  test('pending with captures: source is closed, and the message carries the confirm command', () => {
    const dir = planned();
    pend(dir);
    writeFileSync(join(dir, AFTER), PIXELS);
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /a redesign is waiting for the owner/);
    assert.match(r.reason, new RegExp('echo ' + uiuxHash(dir) + ' > .flow/uiux-confirmed'));
  });

  test('pending with NO captures is denied differently - produce the pictures first', () => {
    const dir = planned();
    pend(dir);                                        // the directory exists; nothing is in it
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /has no captures/);
  });

  test('the owner confirms the captures and the loop may apply', () => {
    const dir = planned();
    pend(dir);
    writeFileSync(join(dir, AFTER), PIXELS);
    writeFileSync(join(dir, '.flow/uiux-confirmed'), uiuxHash(dir) + '\n');
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('a screen redrawn after confirmation reopens the gate', () => {
    const dir = planned();
    pend(dir);
    writeFileSync(join(dir, AFTER), PIXELS);
    writeFileSync(join(dir, '.flow/uiux-confirmed'), uiuxHash(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
    writeFileSync(join(dir, AFTER_M), PIXELS);         // one more screen nobody approved
    assert.equal(write(dir, 'src/ledger.ts').allowed, false);
  });

  test('the loop cannot write the confirmation, and cannot delete the marker to get past it', () => {
    const dir = planned();
    pend(dir);
    writeFileSync(join(dir, AFTER), PIXELS);
    assert.equal(write(dir, '.flow/uiux-confirmed').allowed, false);
    assert.equal(bash(dir, 'rm .flow/uiux/pending').allowed, false);
    assert.equal(bash(dir, 'rm -rf .flow/uiux').allowed, false);
    assert.equal(bash(dir, 'rm -rf .flow/uiux/2026-09-11').allowed, false);
    // Once confirmed, the marker may be cleaned up.
    writeFileSync(join(dir, '.flow/uiux-confirmed'), uiuxHash(dir));
    assert.equal(bash(dir, 'rm .flow/uiux/pending').allowed, true);
  });

  test('stage 3 can still write its own captures and the marker', () => {
    const dir = planned();
    assert.equal(write(dir, AFTER).allowed, true);
    assert.equal(write(dir, '.flow/uiux/pending').allowed, true);
  });
});


describe('blockers are cleared before BUILD, not discovered during it', () => {
  const withReg = (body) => ({
    '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL,
    [ART]: PLAN, [SHOT]: PIXELS, [REG]: body,
  });

  test('no register at all is denied - the sweep has to have happened', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, [ART]: PLAN, [SHOT]: PIXELS });
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /no blocker register/);
  });

  test('an empty register passes - no blockers found is an answer', () => {
    const dir = fixture(withReg('## Blockers\n\nNone found.\n'));
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('a blocker with no class is denied', () => {
    const dir = fixture(withReg('## Blockers\n\n- [x] **B1** Something · resolved: somehow\n'));
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /names no class/);
  });

  test('an open blocker stops the plan unless it says why it does not block BUILD', () => {
    const open = fixture(withReg('## Blockers\n\n- [ ] **B1** Which document sets the rate? · `decide`\n'));
    const r = write(open, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /does not say why it is not a BUILD blocker/);

    const deferred = fixture(withReg(
      '## Blockers\n\n- [ ] **B1** Production account · `obtain` · open - not needed before BUILD\n'));
    writeFileSync(join(deferred, '.flow/plan-confirmed'), confirm(deferred));
    assert.equal(write(deferred, 'src/ledger.ts').allowed, true);
  });

  test('a ticked blocker that does not say what resolved it is denied', () => {
    const dir = fixture(withReg('## Blockers\n\n- [x] **B1** Sandbox account · `obtain`\n'));
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /does not say what resolved it/);
  });

  // The one that matters: confidence is not evidence.
  test('a resolved `prove` with no spike file is denied', () => {
    const dir = fixture(withReg(
      '## Blockers\n\n- [x] **B2** "It mirrors OpenPlay" · `prove` · resolved: it does, I checked\n'));
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /must name its spike file/);
    assert.match(r.reason, /Confidence is not evidence/);
  });

  test('a resolved `prove` naming a spike that is not on disk is denied', () => {
    const dir = fixture(withReg(
      '## Blockers\n\n- [x] **B2** "It mirrors OpenPlay" · `prove` ·\n' +
      '      resolved: .flow/plan/spikes/b2-openplay.md - it does not cover superseded-paid\n'));
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /is not on disk/);
    assert.match(r.reason, /asserted, not run/);
  });

  test('a resolved `prove` whose spike exists passes', () => {
    const dir = fixture({
      ...withReg('## Blockers\n\n- [x] **B2** "It mirrors OpenPlay" · `prove` ·\n' +
        '      resolved: .flow/plan/spikes/b2-openplay.md - it does not cover superseded-paid\n'),
      '.flow/plan/spikes/b2-openplay.md': '# B2\nRan it. Two paths missing. D4 and D5 added.\n',
    });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('`decide` and `obtain` need no spike - only `prove` does', () => {
    const dir = fixture(withReg('## Blockers\n\n' +
      '- [x] **B1** Who owns the ledger? · `decide` · resolved: the organiser, owner 2026-09-11\n' +
      '- [x] **B3** Sandbox account · `obtain` · resolved: supplied, one call verified\n'));
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('the escapes are the owner\'s', () => {
    const body = withReg('## Blockers\n\n- [ ] **B1** unresolved · `decide`\n');
    assert.equal(write(fixture(body), 'src/ledger.ts').allowed, false);
    assert.equal(runHook(PLAN_GATE, {
      tool_name: 'Write', tool_input: { file_path: join(fixture(body), 'src/ledger.ts') },
    }, { FLOW_BLOCKERS_OFF: '1' }).allowed, false, 'the plan is still unconfirmed - but not for blockers');

    const dir = fixture({ ...body, '.flow/blockers-off': '' });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
    // and the loop cannot create that file
    assert.equal(write(fixture(body), '.flow/blockers-off').allowed, false);
  });
});


describe('judgement is the loop\'s to answer; the owner\'s questions are not', () => {
  const entry = (id, cls, state, body) =>
    '### ' + id + ' - a question - Phase 1 - ' + (cls ? cls + ' - ' : '') + state + '\n\n' + (body || '') + '\n';
  const planned = (uat, extra) => {
    const dir = fixture({
      '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL,
      [ART]: PLAN, [SHOT]: PIXELS, [REG]: CLEAR, '.flow/UAT.md': '# UAT\n' + uat, ...extra,
    });
    writeFileSync(join(dir, '.flow/plan-confirmed'), confirm(dir));
    return dir;
  };

  test('the loop may not answer an owner question', () => {
    const dir = planned(entry('A1', 'owner', 'closed', '**Answered:** agent - it is 5%'));
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /not the loop's to answer/);
    assert.match(r.reason, /A1/);
  });

  test('an unclassified question is read as the owner\'s - failing closed', () => {
    const dir = planned(entry('A2', '', 'closed', '**Answered:** agent - looked fine'));
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /no class reads as/);
  });

  test('the loop may answer a judgement question', () => {
    const dir = planned(entry('A3', '`judgement`', 'closed',
      '**Answered:** agent - against the error-message standard: each says what to do next'));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('a person answering an owner question is always fine', () => {
    const dir = planned(entry('A4', 'owner', 'closed', '**Answer:** 7%, confirmed by the owner'));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  describe('the ceiling counts what a person still has to answer', () => {
    const six = (cls) => Array.from({ length: 6 }, (_, i) => entry('A' + i, cls, 'open')).join('');

    test('six open owner questions still stop the build', () => {
      const r = write(planned(six('owner')), 'src/ledger.ts');
      assert.equal(r.allowed, false);
      assert.match(r.reason, /by person. questions are open/);
    });

    test('six open judgement questions stop it too, until the owner delegates', () => {
      assert.equal(write(planned(six('`judgement`')), 'src/ledger.ts').allowed, false);
    });

    test('.flow/uat-trust takes judgement entries off the count', () => {
      const dir = planned(six('`judgement`'), { '.flow/uat-trust': '' });
      assert.equal(write(dir, 'src/ledger.ts').allowed, true);
    });

    test('delegating judgement does not relax the owner ones', () => {
      const dir = planned(six('owner'), { '.flow/uat-trust': '' });
      assert.equal(write(dir, 'src/ledger.ts').allowed, false);
    });

    test('the ceiling message points at the delegation', () => {
      const r = write(planned(six('owner')), 'src/ledger.ts');
      assert.match(r.reason, /uat-trust/);
    });

    test('the loop cannot grant itself the delegation', () => {
      assert.equal(write(planned(''), '.flow/uat-trust').allowed, false);
      assert.equal(bash(planned(''), 'echo x > .flow/uat-trust').allowed, false);
    });
  });
});

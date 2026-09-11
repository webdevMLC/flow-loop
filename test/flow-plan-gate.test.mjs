// The plan gate: the rules that stopped being instructions.
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
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
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL });
    const r = write(dir, 'src/ledger.ts');
    assert.equal(r.allowed, false);
    assert.match(r.reason, /not been confirmed by the owner/);
    assert.match(r.reason, new RegExp('echo ' + hashOf(dir, '.claude/skills/acme/SKILL.md') + ' > .flow/plan-confirmed'));
  });

  test('the right hash allows the write', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL });
    writeFileSync(join(dir, '.flow/plan-confirmed'), hashOf(dir, '.claude/skills/acme/SKILL.md') + '\n');
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('a confirmation written by PowerShell (UTF-16 with BOM) still counts', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL });
    const h = hashOf(dir, '.claude/skills/acme/SKILL.md');
    writeFileSync(join(dir, '.flow/plan-confirmed'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(h + '\r\n', 'utf16le')]));
    assert.equal(write(dir, 'src/ledger.ts').allowed, true);
  });

  test('changing the skill after confirmation makes the confirmation stale', () => {
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL });
    writeFileSync(join(dir, '.flow/plan-confirmed'), hashOf(dir, '.claude/skills/acme/SKILL.md'));
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
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL });
    writeFileSync(join(dir, '.flow/plan-confirmed'), hashOf(dir, '.claude/skills/acme/SKILL.md'));
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
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, ...extra });
    writeFileSync(join(dir, '.flow/plan-confirmed'), hashOf(dir, '.claude/skills/acme/SKILL.md'));
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
    const dir = fixture({ '.flow/STATE.md': STATE, '.claude/skills/acme/SKILL.md': SKILL, ...extra });
    writeFileSync(join(dir, '.flow/plan-confirmed'), hashOf(dir, '.claude/skills/acme/SKILL.md'));
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
    for (const f of ['plan-confirmed', 'allow-push', 'plan-off', 'cite-off', 'tdd-off', 'verify-off']) {
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

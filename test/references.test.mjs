// Every `references/x.md` a skill names must exist, and be reachable from where it is named.
//
// This is defect class B made mechanical. Twice in this repo a rule was written into a file
// that the agent never opened at the moment the rule had to fire — once because the file did
// not exist under that name, once because it lived in another skill and the sentence did not
// say so. A reader who is told to open `references/repair.md` while inside `/flow:datatest`
// looks in `skills/datatest/references/`, finds nothing, and carries on without the rule.
//
// So the convention is: a reference to another skill's file must name that skill in the same
// sentence. This test enforces the convention rather than trusting it.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const posix = (p) => relative(ROOT, p).split(sep).join('/');

const markdown = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) markdown(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
};

const FILES = markdown(SKILLS).map(posix);
const HAVE = new Set(FILES);

// `references/name.md`, plus the 80 characters after it — long enough to carry a qualifier
// that wrapped onto the next line, short enough not to reach the following sentence's.
const REF = /`references\/([a-z0-9-]+\.md)`([\s\S]{0,80})/g;
const QUALIFIER = /\bin the \*{0,2}([a-z]+)\*{0,2} skill\b/;

const resolve = (file) => {
  const own = file.split('/')[1];
  const found = [];
  for (const m of readFileSync(join(ROOT, file), 'utf8').matchAll(REF)) {
    const q = QUALIFIER.exec(m[2].replace(/\s+/g, ' '));
    const owner = q ? q[1] : own;
    found.push({ name: m[1], owner, qualified: Boolean(q), target: `skills/${owner}/references/${m[1]}` });
  }
  return found;
};

describe('skill cross-references', () => {
  test('every referenced file exists where the sentence says it does', () => {
    const broken = [];
    for (const f of FILES) {
      for (const r of resolve(f)) {
        if (HAVE.has(r.target)) continue;
        broken.push(`${f} -> references/${r.name}` +
          (r.qualified ? ` (says "in the ${r.owner} skill"; no such file)`
                       : ` (unqualified, so read as ${r.target}; if it belongs to another` +
                         ` skill, say "in the <name> skill" in the same sentence)`));
      }
    }
    assert.deepEqual(broken, []);
  });

  test('a reference to another skill says which skill, in the same sentence', () => {
    const silent = [];
    for (const f of FILES) {
      const own = f.split('/')[1];
      for (const r of resolve(f)) {
        // Unqualified and absent from its own skill: the reader will not find it.
        if (!r.qualified && !HAVE.has(`skills/${own}/references/${r.name}`)) {
          silent.push(`${f} -> references/${r.name}`);
        }
      }
    }
    assert.deepEqual(silent, []);
  });

  test('no reference file is orphaned — something routes to each', () => {
    const routed = new Set();
    for (const f of FILES) for (const r of resolve(f)) routed.add(r.target);
    const orphans = FILES.filter((f) => f.includes('/references/') && !routed.has(f));
    assert.deepEqual(orphans, []);
  });

  test('every skill directory holds a SKILL.md with a name and a description', () => {
    const bad = [];
    for (const d of readdirSync(SKILLS, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const skill = `skills/${d.name}/SKILL.md`;
      if (!HAVE.has(skill)) { bad.push(`${skill} is missing`); continue; }
      const text = readFileSync(join(ROOT, skill), 'utf8');
      const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
      if (!front) { bad.push(`${skill} has no frontmatter`); continue; }
      if (!/^name:\s*\S/m.test(front[1])) bad.push(`${skill} has no name:`);
      if (!/^description:\s*\S/m.test(front[1])) bad.push(`${skill} has no description:`);
    }
    assert.deepEqual(bad, []);
  });
});

// Stale counts are their own defect class in this repo: "the seven above" outlived seven
// rules twice. The number now comes from the table.
describe('the enforced-rule count is not a claim', () => {
  const read = (f) => readFileSync(join(ROOT, f), 'utf8');
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen', 'twenty'];

  // The enforcement table is the one whose rows all start with a bold rule name and whose
  // header names the enforcement. Count its body rows.
  const rules = (text) => {
    const lines = text.split(/\r?\n/);
    const head = lines.findIndex((l) => /^\|\s*(Rule|What is enforced|Enforced)/i.test(l));
    assert.notEqual(head, -1, 'no enforcement table found');
    let n = 0;
    for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++) n++;
    return n;
  };

  test('both tables list the same rules', () => {
    assert.equal(rules(read('skills/loop/SKILL.md')), rules(read('README.md')));
  });

  test('the prose count matches the table', () => {
    const n = rules(read('skills/loop/SKILL.md'));
    const skill = read('skills/loop/SKILL.md');
    const m = /\bThe (\w+) above are not\b/.exec(skill);
    assert.ok(m, 'skills/loop/SKILL.md no longer says "The N above are not"');
    assert.ok(WORDS[n], `WORDS has no word for ${n} - extend it`);
    assert.equal(m[1].toLowerCase(), WORDS[n], `the table has ${n} rules`);

    const readme = read('README.md');
    const r = /\*\*(\w+) rules are hooks\b/.exec(readme);
    assert.ok(r, 'README no longer says "N rules are hooks"');
    assert.equal(r[1].toLowerCase(), WORDS[n], `the table has ${n} rules`);
  });

  test('every rule in the table is named in a hook file', () => {
    // A row promising something no hook implements is defect class C - a rule promised in
    // one file and implemented in none. The weak but real check: each row must name a
    // control file, a tool or a command the hooks actually mention.
    // Every hook, read from disk - naming them here is how this check goes stale the
    // first time a tenth rule ships.
    const hooks = readdirSync(join(ROOT, 'hooks'))
      .filter((f) => f.slice(-4) === '.mjs')
      .map((f) => readFileSync(join(ROOT, 'hooks', f), 'utf8')).join('\n');
    const table = read('skills/loop/SKILL.md').split(/\r?\n/)
      .filter((l) => /^\|\s*\*\*/.test(l));
    const orphan = table.filter((row) => {
      const tokens = [...row.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      return tokens.length > 0 && !tokens.some((t) => hooks.includes(t.replace(/^\.\//, '')));
    });
    assert.deepEqual(orphan.map((r) => r.slice(0, 60)), []);
  });
});

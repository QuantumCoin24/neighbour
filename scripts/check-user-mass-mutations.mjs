import fs from 'node:fs';
import path from 'node:path';

const ROOTS = [
  'services/api/src',
  'apps',
  'packages',
];

const EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
]);

const forbidden = [
  {
    name: 'Prisma user.deleteMany',
    regex: /\b(?:prisma|database|db|tx|this\.database)\s*\.\s*user\s*\.\s*deleteMany\s*\(/g,
  },
  {
    name: 'Prisma user.updateMany',
    regex: /\b(?:prisma|database|db|tx|this\.database)\s*\.\s*user\s*\.\s*updateMany\s*\(/g,
  },
  {
    name: 'generic user.deleteMany',
    regex: /\buser\s*\.\s*deleteMany\s*\(/g,
  },
  {
    name: 'generic user.updateMany',
    regex: /\buser\s*\.\s*updateMany\s*\(/g,
  },
  {
    name: 'raw DELETE FROM users',
    regex: /\bDELETE\s+FROM\s+(?:"?public"?\.)?"?users"?\b/gi,
  },
  {
    name: 'raw UPDATE users',
    regex: /\bUPDATE\s+(?:"?public"?\.)?"?users"?\b/gi,
  },
];

const ignored = new Set([
  'node_modules',
  '.git',
  'dist',
  '.next',
  'generated',
  'coverage',
]);

const violations = [];

function scan(target) {
  if (!fs.existsSync(target)) return;

  const stat = fs.statSync(target);

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      if (ignored.has(entry)) continue;
      scan(path.join(target, entry));
    }
    return;
  }

  if (!EXTENSIONS.has(path.extname(target))) return;

  const source = fs.readFileSync(target, 'utf8');

  for (const rule of forbidden) {
    rule.regex.lastIndex = 0;

    for (const match of source.matchAll(rule.regex)) {
      const before = source.slice(0, match.index);
      const line = before.split('\n').length;

      violations.push({
        file: target,
        line,
        rule: rule.name,
        text: match[0].replace(/\s+/g, ' '),
      });
    }
  }
}

for (const root of ROOTS) {
  scan(root);
}

console.log('');
console.log('NEIGHBOUR — MASS USER MUTATION SAFETY CHECK');
console.log('--------------------------------------------');

if (violations.length) {
  console.error('');
  console.error('FAIL: forbidden mass User mutation capability detected.');
  console.error('');

  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} — ${violation.rule} — ${violation.text}`,
    );
  }

  console.error('');
  console.error(
    'Neighbour production application code must never bulk UPDATE or DELETE User records.',
  );

  process.exit(1);
}

console.log('PASS: no mass User mutation capability exists in application source.');

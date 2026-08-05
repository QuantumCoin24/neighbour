import { access, readFile } from 'node:fs/promises';
import process from 'node:process';

const requiredFiles = [
  'services/api/prisma/schema.prisma',
  'services/api/src/main.ts',
  'services/api/src/config/environment.validation.ts',
  'services/api/src/operations/readiness/readiness.controller.ts',
  'apps/mobile/app.json',
  'apps/mobile/eas.json',
  '.github/workflows/ci.yml',
];

const checks = [];

for (const file of requiredFiles) {
  try {
    await access(file);

    checks.push({
      check: `file:${file}`,
      passed: true,
    });
  } catch {
    checks.push({
      check: `file:${file}`,
      passed: false,
    });
  }
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

checks.push({
  check: 'node-version',
  passed: Number(process.versions.node.split('.')[0]) >= 24,
});

checks.push({
  check: 'package-manager',
  passed: String(packageJson.packageManager ?? '').startsWith('pnpm@'),
});

checks.push({
  check: 'release-script',
  passed: typeof packageJson.scripts?.check === 'string',
});

const failed = checks.filter((check) => !check.passed);

console.log(
  JSON.stringify(
    {
      status: failed.length === 0 ? 'READY' : 'NOT_READY',
      checks,
      checkedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}

import { access, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const EXPECTED_VERSION = '1.0.0-rc.1';

const jsonFiles = [
  'package.json',
  'services/api/package.json',
  'apps/web/package.json',
  'apps/mobile/package.json',
  'apps/mobile/app.json',
  'release/RELEASE_MANIFEST.json',
  'release/rollback/ROLLBACK_MANIFEST.json',
];

const requiredFiles = [
  ...jsonFiles,
  'release/RELEASE_NOTES.md',
  'release/audit/PRODUCTION_RELEASE_AUDIT.md',
  'release/checks/RELEASE_CHECKLIST.md',
  'docs/operations/PRODUCTION_RUNBOOK.md',
  '.github/workflows/ci.yml',
];

const checks = [];

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

for (const file of requiredFiles) {
  checks.push({
    check: `file:${file}`,
    passed: await fileExists(file),
  });
}

for (const file of jsonFiles) {
  if (!(await fileExists(file))) {
    continue;
  }

  try {
    JSON.parse(await readFile(file, 'utf8'));

    checks.push({
      check: `json:${file}`,
      passed: true,
    });
  } catch {
    checks.push({
      check: `json:${file}`,
      passed: false,
    });
  }
}

const versionSources = [
  ['package.json', JSON.parse(await readFile('package.json', 'utf8')).version],
  [
    'services/api/package.json',
    JSON.parse(await readFile('services/api/package.json', 'utf8')).version,
  ],
  ['apps/web/package.json', JSON.parse(await readFile('apps/web/package.json', 'utf8')).version],
  [
    'apps/mobile/package.json',
    JSON.parse(await readFile('apps/mobile/package.json', 'utf8')).version,
  ],
  ['apps/mobile/app.json', JSON.parse(await readFile('apps/mobile/app.json', 'utf8')).expo.version],
];

for (const [source, version] of versionSources) {
  checks.push({
    check: `version:${source}`,
    passed: version === EXPECTED_VERSION,
    value: version,
  });
}

const envExample = await readFile('.env.example', 'utf8');

checks.push({
  check: 'version:.env.example',
  passed: envExample.includes(`APP_VERSION=${EXPECTED_VERSION}`),
});

const releaseManifest = JSON.parse(await readFile('release/RELEASE_MANIFEST.json', 'utf8'));

checks.push({
  check: 'release-manifest-version',
  passed: releaseManifest.release === EXPECTED_VERSION,
});

checks.push({
  check: 'release-platforms',
  passed:
    Array.isArray(releaseManifest.platforms) &&
    releaseManifest.platforms.includes('iPhone') &&
    releaseManifest.platforms.includes('Web'),
});

let branch = 'unknown';

try {
  branch = execFileSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
  }).trim();
} catch {
  branch = 'unknown';
}

checks.push({
  check: 'git-branch-main',
  passed: branch === 'main',
  value: branch,
});

const failed = checks.filter((check) => !check.passed);

const result = {
  release: EXPECTED_VERSION,
  status: failed.length === 0 ? 'READY_FOR_RC_GATE' : 'NOT_READY',
  checks,
  failedChecks: failed,
  checkedAt: new Date().toISOString(),
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}

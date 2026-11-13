import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const testsDir = path.join(process.cwd(), 'tests');
const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.mjs'))
  .map((f) => path.join('tests', f));

const result = spawnSync(
  process.execPath,
  ['--test', '--experimental-test-coverage', ...testFiles],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  }
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
const allFilesLine = combinedOutput
  .split('\n')
  .find((line) => line.toLowerCase().includes('all files'));

if (!allFilesLine) {
  process.exit(result.status ?? 1);
}

const percentages = allFilesLine
  .split('|')
  .slice(1, 4)
  .map((segment) => Number.parseFloat(segment.trim()))
  .filter((value) => Number.isFinite(value));

const minimum = percentages.length ? Math.min(...percentages) : 0;
if (minimum < 70) {
  console.error(`Coverage threshold not met. Minimum coverage was ${minimum}%, expected at least 70%.`);
  process.exit(1);
}

process.exit(result.status ?? 0);


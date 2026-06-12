#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const fileArgs = args.filter((arg) => !arg.startsWith('-'));

function isFrontendFile(file) {
  const normalized = path.resolve(root, file).replaceAll('\\', '/');
  const frontendRoot = path.join(root, 'frontend').replaceAll('\\', '/');

  return normalized.startsWith(`${frontendRoot}/`);
}

function runNodeScript(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  process.exit(result.status ?? 1);
}

if (fileArgs.length > 0 && fileArgs.every(isFrontendFile)) {
  runNodeScript(path.join(root, 'frontend', 'node_modules', 'typescript', 'bin', 'tsc'), [
    '--noEmit',
    '--project',
    path.join(root, 'frontend', 'tsconfig.json'),
  ]);
}

runNodeScript(path.join(root, 'node_modules', 'typescript', 'bin', 'tsc'), args);

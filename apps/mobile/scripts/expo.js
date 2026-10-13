import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const expoCli = require.resolve('expo/bin/cli');
const localNodeModules = path.resolve('node_modules');
const existingNodePath = process.env.NODE_PATH ? [process.env.NODE_PATH] : [];
const nodePath = [localNodeModules, ...existingNodePath].join(path.delimiter);

const result = spawnSync(process.execPath, [expoCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, NODE_PATH: nodePath },
});

if (result.error) {
  console.error('Could not start the Expo CLI:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

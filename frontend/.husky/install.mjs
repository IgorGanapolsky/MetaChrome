import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const huskyDir = resolve(__dirname, '.husky');

if (!existsSync(huskyDir)) {
  mkdirSync(huskyDir, { recursive: true });
}

const preCommitPath = resolve(huskyDir, 'pre-commit');
const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`;

if (!existsSync(preCommitPath)) {
  writeFileSync(preCommitPath, preCommitContent);
  chmodSync(preCommitPath, 0o755);
}

console.log('Husky installed successfully');

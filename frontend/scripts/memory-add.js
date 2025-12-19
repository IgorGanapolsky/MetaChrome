#!/usr/bin/env node
/**
 * Add explicit memory entries (key/value + tags) and optionally sync docs to RAG.
 * Usage:
 *   node scripts/memory-add.js dev_prefs "Prefer Expo run on physical device" --tag devices --sync
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/memory-add.js <key> "<value>" [--tag tag] [--sync]');
  process.exit(1);
}

const key = args[0];
let value = args[1];
const sync = args.includes('--sync');

const tags = [];
for (let i = 2; i < args.length; i++) {
  if (args[i] === '--tag' && args[i + 1]) {
    tags.push(args[i + 1]);
    i++;
  }
}

const repoRoot = path.join(__dirname, '..', '..');
const filePath = path.join(repoRoot, 'docs', 'memory', 'explicit.json');

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, '[]');
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const entry = {
  timestamp: new Date().toISOString(),
  key,
  value,
  tags,
};

data.push(entry);
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(`Added explicit memory "${key}" -> "${value}"`);

if (sync) {
  try {
    execSync(`node ${path.join(root, 'scripts', 'docs-sync.js')}`, { stdio: 'ignore' });
  } catch (_) {
    // already handled inside docs-sync
  }
}

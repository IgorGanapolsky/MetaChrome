#!/usr/bin/env node
/**
 * Forget explicit memories by key substring and prune reflections by substring.
 * Usage:
 *   node scripts/memory-forget.js key-substring --sync
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/memory-forget.js <substring> [--sync]');
  process.exit(1);
}
const needle = args[0].toLowerCase();
const sync = args.includes('--sync');

const repoRoot = path.join(__dirname, '..', '..');
const explicitPath = path.join(repoRoot, 'docs', 'memory', 'explicit.json');
const reflectionsPath = path.join(repoRoot, 'docs', 'memory', 'reflections.jsonl');

let removed = 0;
if (fs.existsSync(explicitPath)) {
  const data = JSON.parse(fs.readFileSync(explicitPath, 'utf8'));
  const kept = data.filter(
    (e) => !e.key.toLowerCase().includes(needle) && !(e.value || '').toLowerCase().includes(needle)
  );
  removed += data.length - kept.length;
  fs.writeFileSync(explicitPath, JSON.stringify(kept, null, 2));
}

if (fs.existsSync(reflectionsPath)) {
  const lines = fs.readFileSync(reflectionsPath, 'utf8').trim().split('\n').filter(Boolean);
  const kept = lines.filter((l) => !l.toLowerCase().includes(needle));
  removed += lines.length - kept.length;
  fs.writeFileSync(reflectionsPath, kept.join('\n') + (kept.length ? '\n' : ''));
}

console.log(`Removed ${removed} entries containing "${needle}".`);

if (sync) {
  try {
    execSync(`node ${path.join(root, 'scripts', 'docs-sync.js')}`, { stdio: 'ignore' });
  } catch (_) {
    // already handled inside docs-sync
  }
}

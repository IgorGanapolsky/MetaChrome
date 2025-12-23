#!/usr/bin/env node
/**
 * Append an implicit reflection entry to docs/memory/reflections.jsonl.
 * Usage:
 *   node scripts/memory-reflect.js "thumbs up" "fixed android auto" --sync
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/memory-reflect.js <sentiment> "<text>" [--sync]');
  process.exit(1);
}

const sentimentRaw = args[0].toLowerCase();
const textParts = args.slice(1).filter((a) => a !== '--sync');
const text = textParts.join(' ').trim();
const sync = args.includes('--sync');

const sentiment = sentimentRaw.includes('up')
  ? 'positive'
  : sentimentRaw.includes('down')
    ? 'negative'
    : 'neutral';

const repoRoot = path.join(__dirname, '..', '..');
const filePath = path.join(repoRoot, 'docs', 'memory', 'reflections.jsonl');

const line =
  JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'implicit',
    sentiment,
    source: 'lesson',
    text,
  }) + '\n';

fs.appendFileSync(filePath, line);
console.log('Appended reflection:', text);

if (sync) {
  try {
    execSync(`node ${path.join(root, 'scripts', 'docs-sync.js')}`, { stdio: 'ignore' });
  } catch (_) {
    // already handled inside docs-sync
  }
}

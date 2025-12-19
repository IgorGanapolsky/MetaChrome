#!/usr/bin/env node
/**
 * List explicit memories and recent reflections.
 * Usage: node scripts/memory-list.js
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const explicitPath = path.join(repoRoot, 'docs', 'memory', 'explicit.json');
const reflectionsPath = path.join(repoRoot, 'docs', 'memory', 'reflections.jsonl');

const explicit = fs.existsSync(explicitPath)
  ? JSON.parse(fs.readFileSync(explicitPath, 'utf8'))
  : [];

const reflections = fs.existsSync(reflectionsPath)
  ? fs
      .readFileSync(reflectionsPath, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  : [];

console.log('--- Explicit memories ---');
explicit.forEach((e) => console.log(`[${e.timestamp}] ${e.key}: ${e.value} ${e.tags?.length ? '(' + e.tags.join(',') + ')' : ''}`));
if (!explicit.length) console.log('(none)');

console.log('\n--- Recent reflections (last 10) ---');
reflections
  .slice(-10)
  .forEach((r) => console.log(`[${r.timestamp}] ${r.sentiment}: ${r.text}`));
if (!reflections.length) console.log('(none)');

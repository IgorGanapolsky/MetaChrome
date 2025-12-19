#!/usr/bin/env node
/**
 * Append a lesson line to docs/frontend/LESSONS.md and (optionally) push to the RAG bucket.
 * Usage:
 *   node scripts/add-lesson.js "thumbs up: good grounding on release checklist"
 *   node scripts/add-lesson.js "thumbs down: missed linking UAT doc" --sync
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const root = path.join(__dirname, '..');
const repoRoot = path.join(root, '..');
const lessonsPath = path.join(repoRoot, 'docs', 'frontend', 'LESSONS.md');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide a lesson string.');
  process.exit(1);
}

const sync = args.includes('--sync');
const message = args.filter((a) => a !== '--sync').join(' ');
const timestamp = new Date().toISOString();

const line = `- ${timestamp} – ${message}\n`;
fs.appendFileSync(lessonsPath, line);
console.log(`Appended lesson to ${lessonsPath}`);

// Also add an implicit reflection entry so memory is kept in RAG
const reflectScript = path.join(root, 'scripts', 'memory-reflect.js');
const reflectCmd = `node ${reflectScript} "${message}" "${message}"${sync ? ' --sync' : ''}`;
try {
  execSync(reflectCmd, { stdio: 'ignore' });
} catch (_) {
  // best-effort; continue
}

// If caller asked for sync, also sync docs directly (so RAG is up-to-date)
if (sync) {
  try {
    execSync(`node ${path.join(root, 'scripts', 'docs-sync.js')}`, { stdio: 'ignore' });
  } catch (_) {
    // already echoed failures inside docs-sync
  }
}

if (sync) {
  const bucket = process.env.VERTEX_RAG_BUCKET;
  if (!bucket) {
    console.error('VERTEX_RAG_BUCKET is not set; skipping sync.');
    process.exit(0);
  }
  const cmd = `gsutil -m rsync -r ${path.join(repoRoot, 'docs')} gs://${bucket}/docs`;
  console.log(`Syncing docs to ${bucket} ...`);
  execSync(cmd, { stdio: 'inherit' });
}

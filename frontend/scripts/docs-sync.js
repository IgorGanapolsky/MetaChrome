#!/usr/bin/env node
/**
 * Sync docs/ to the configured RAG bucket.
 * Usage: node scripts/docs-sync.js
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bucket = process.env.VERTEX_RAG_BUCKET;
if (!bucket) {
  console.error('VERTEX_RAG_BUCKET is not set; aborting sync.');
  process.exit(1);
}

const repoRoot = path.join(__dirname, '..', '..');
const docsPath = path.join(repoRoot, 'docs');

if (!fs.existsSync(docsPath)) {
  console.error(`Docs path missing: ${docsPath}`);
  process.exit(1);
}

const cmd = `gsutil -m rsync -r ${docsPath} gs://${bucket}/docs`;
console.log('Syncing docs to bucket:', bucket);
execSync(cmd, { stdio: 'inherit' });
console.log('Docs sync complete.');

#!/usr/bin/env node
/**
 * Publish RAG chunks to Vertex AI Agent Builder data store.
 *
 * Steps:
 * 1) Runs rag:build (decay + chunking).
 * 2) Uploads chunks.jsonl to GCS bucket.
 * 3) Triggers Agent Builder import on the target data store.
 *
 * Requires:
 * - env VERTEX_API_KEY
 * - env GCP_PROJECT_ID
 * - gsutil configured (application default creds)
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.join(__dirname, '..');
const CHUNKS_FILE = path.join(PROJECT_ROOT, '..', 'docs', 'chunks', 'chunks.jsonl');
// Target MetaChrome project + bucket + datastore
const BUCKET_URI = 'gs://metachrome-rag-2025/chunks/chunks.jsonl';
// us-central1 data store
const DATA_STORE_RESOURCE =
  'projects/metachrome-2025/locations/global/collections/default_collection/dataStores/metachrome-lessons/branches/default_branch/documents';
const HOST = 'https://discoveryengine.googleapis.com';

function run(cmd) {
  return execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, shell: '/bin/bash' });
}

function main() {
  const apiKey = process.env.VERTEX_API_KEY;
  const projectId = process.env.GCP_PROJECT_ID;
  if (!apiKey || !projectId) {
    console.error('Missing VERTEX_API_KEY or GCP_PROJECT_ID in env');
    process.exit(1);
  }
  if (!fs.existsSync(CHUNKS_FILE)) {
    console.error(`Chunks file not found at ${CHUNKS_FILE}. Run rag:build first.`);
    process.exit(1);
  }

  console.log('🧠 Building chunks...');
  run('yarn rag:build');

  console.log(`☁️ Uploading chunks to ${BUCKET_URI} ...`);
  run(`gsutil cp ${CHUNKS_FILE} ${BUCKET_URI}`);

  console.log('🚀 Triggering Vertex import...');
  const url = `${HOST}/v1/${DATA_STORE_RESOURCE}:import`;
  const body = {
    gcsSource: { inputUris: [BUCKET_URI] },
    reconciliationMode: 'INCREMENTAL',
  };
  const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  run(
    `curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${JSON.stringify(
      body
    )}' "${url}"`
  );

  console.log('✅ RAG publish requested. Check Vertex console for import status.');
}

main();

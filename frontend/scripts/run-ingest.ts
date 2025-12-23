import path from 'path';
import { Pipeline } from './dataflow/core';
import { FileSource } from './dataflow/sources';
import { SentenceSplitterTransform, ChunkingTransform } from './dataflow/transforms';
import { JsonLineSink, VertexAISink } from './dataflow/sinks';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const debug = args.includes('--debug');

  console.log(`[RAG Ingest] Starting (Dry Run: ${dryRun}, Debug: ${debug})`);

  // Configuration
  const PROJECT_ROOT = path.resolve(__dirname, '..');
  const DOCS_ROOT = path.join(PROJECT_ROOT, '..', 'docs'); // Assuming script is in frontend/scripts
  const README = path.join(PROJECT_ROOT, '..', 'README.md');

  // Inputs
  const inputs = [
    README,
    DOCS_ROOT,
    path.join(PROJECT_ROOT, '..', '.github', 'LESSONS_LEARNED.md'),
  ];

  // Source
  const source = new FileSource(inputs);

  // Transforms
  const transforms = [new SentenceSplitterTransform(), new ChunkingTransform(250, 0.15)];

  // Sink
  let sink;
  if (dryRun) {
    const outDir = path.join(DOCS_ROOT, 'chunks');
    if (!require('fs').existsSync(outDir)) {
      require('fs').mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, 'chunks_dryrun.jsonl');
    sink = new JsonLineSink(outFile);
    console.log(`[RAG Ingest] Using local sink: ${outFile}`);
  } else {
    // Production Configuration
    // Note: These should Ideally come from a config object or env vars validation step
    const bucket = 'gs://metachrome-ai-2025-rag/chunks/chunks.jsonl';
    const dataStore =
      'projects/metachrome-2025/locations/us/collections/default_collection/dataStores/rag-documents_1766504544296/branches/default_branch/documents';
    sink = new VertexAISink(bucket, dataStore);
    console.log(`[RAG Ingest] Using Vertex AI sink: ${bucket}`);
  }

  // Run
  const pipeline = new Pipeline(source, transforms, sink);
  try {
    await pipeline.run(debug);
    console.log('[RAG Ingest] Pipeline completed successfully.');
  } catch (e) {
    console.error('[RAG Ingest] Pipeline failed:', e);
    process.exit(1);
  }
}

main();

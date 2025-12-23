#!/usr/bin/env node
/**
 * Contextual + boundary-aware chunker for MetaChrome RAG.
 *
 * - Splits markdown/txt files on paragraphs, then sentences.
 * - Builds ~250-word chunks with ~15% sentence overlap.
 * - Adds a cheap "summary_hint" from the first 2 sentences to preserve context.
 * - Outputs JSONL to docs/chunks/chunks.jsonl for ingestion.
 *
 * No external deps; token estimate uses word count.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const INPUTS = [path.join(PROJECT_ROOT, 'README.md'), path.join(PROJECT_ROOT, 'docs')];
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs', 'chunks');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'chunks.jsonl');
const REFLECTIONS_FILE = path.join(PROJECT_ROOT, 'docs', 'memory', 'reflections.jsonl');

const TARGET_WORDS = 250;
const OVERLAP_RATIO = 0.15;

function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];
  return fs
    .readdirSync(root)
    .flatMap((f) => listFiles(path.join(root, f)))
    .filter((f) => /\.(md|mdx|txt)$/i.test(f));
}

function readFile(file) {
  return fs.readFileSync(file, 'utf8');
}

function splitSentences(text) {
  // Naive but deterministic sentence split.
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function chunkSentences(sentences) {
  const chunks = [];
  let i = 0;
  while (i < sentences.length) {
    let words = 0;
    let start = i;
    while (i < sentences.length && words < TARGET_WORDS) {
      words += sentences[i].split(/\s+/).filter(Boolean).length;
      i += 1;
    }
    const end = i;
    const slice = sentences.slice(start, end);
    if (slice.length === 0) break;
    const overlapCount = Math.max(1, Math.round(slice.length * OVERLAP_RATIO));
    i = Math.max(start + 1, end - overlapCount);
    chunks.push(slice);
  }
  return chunks;
}

function processFile(file) {
  const text = readFile(file);
  // Split on blank lines to keep paragraph boundaries, then into sentences.
  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sentences = paragraphs.flatMap((p) => splitSentences(p));
  return chunkSentences(sentences).map((sentArr, idx) => ({
    id: `${path.relative(PROJECT_ROOT, file)}::${idx}`,
    source: path.relative(PROJECT_ROOT, file),
    summary_hint: sentArr.slice(0, 2).join(' ').slice(0, 320),
    text: sentArr.join(' '),
  }));
}

function loadReflections() {
  if (!fs.existsSync(REFLECTIONS_FILE)) return [];
  const lines = fs.readFileSync(REFLECTIONS_FILE, 'utf8').split('\n').filter(Boolean);
  return lines.map((line, idx) => {
    const obj = JSON.parse(line);
    const text = obj.summary || obj.text || '';
    const hint = obj.takeaway || obj.summary || text.slice(0, 320);
    return {
      id: `reflections.jsonl::${idx}`,
      source: 'docs/memory/reflections.jsonl',
      summary_hint: hint,
      text,
    };
  });
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = INPUTS.flatMap(listFiles);
  const docChunks = files.flatMap(processFile);
  const memoryChunks = loadReflections();
  const allChunks = [...docChunks, ...memoryChunks];
  fs.writeFileSync(OUTPUT_FILE, allChunks.map((c) => JSON.stringify(c)).join('\n'), 'utf8');
  console.log(`Wrote ${allChunks.length} chunks to ${OUTPUT_FILE}`);
}

main();

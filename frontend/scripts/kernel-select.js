#!/usr/bin/env node
/**
 * Select best-performing kernel from artifacts/kernel_bench/results.jsonl
 * and append a reflection entry to docs/memory/reflections.jsonl
 * when it beats baseline (>1.0 speedup).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RESULTS = path.join(ROOT, 'artifacts', 'kernel_bench', 'results.jsonl');
const REFLECTIONS = path.join(ROOT, '..', 'docs', 'memory', 'reflections.jsonl');

function main() {
  if (!fs.existsSync(RESULTS)) {
    console.error('No benchmark results found; run yarn kernel:bench first.');
    return;
  }
  const lines = fs.readFileSync(RESULTS, 'utf8').trim().split('\n').filter(Boolean);
  const entries = lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter((e) => e && e.status === 'ok' && e.speedup && e.speedup > 0);

  if (entries.length === 0) {
    console.log('No valid benchmark entries to record.');
    return;
  }

  const best = entries.reduce((a, b) => (b.speedup > a.speedup ? b : a));
  if (best.speedup <= 1.0) {
    console.log('No speedup over baseline; not recording a reflection.');
    return;
  }

  const reflection = {
    date: new Date().toISOString(),
    summary: `Kernel ${best.candidate} achieved ${best.speedup.toFixed(
      2
    )}x speedup vs baseline on ${best.device} (${best.dtype}, size ${best.size.join('x')}).`,
    takeaway:
      'Prefer fused relu+norm implementations for similar shapes; consider porting to GPU/Metal for further gains.',
    tags: ['kernel-bench', 'performance', best.candidate],
  };

  const line = JSON.stringify(reflection);
  fs.appendFileSync(REFLECTIONS, line + '\n', 'utf8');
  console.log(`Recorded reflection: ${line}`);
}

main();

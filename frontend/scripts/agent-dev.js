#!/usr/bin/env node
/**
 * Simple dev entrypoint to query the MetaChrome agent via REST client.
 * Usage: yarn agent:dev "your question"
 */
async function main() {
  const prompt = process.argv.slice(2).join(' ') || 'Hello';
  // Import compiled JS (tsc will output to dist if configured) or use ts-node/register if available.
  let queryAgent;
  try {
    // Try requiring TS source via ts-node/register if present
    require('ts-node/register/transpile-only');
    ({ queryAgent } = require('../ai/agent.ts'));
  } catch (_) {
    // Fallback to transpiling on the fly with dynamic import using ts-node as a dev dependency alternative
    const { queryAgent: qa } = await import('../ai/agent.ts');
    queryAgent = qa;
  }
  const predictions = await getPredictionsSafe();
  const topPred = predictions?.[0];
  const highConfidence = topPred && topPred.confidence >= 0.8;

  const res = highConfidence
    ? { text: undefined, raw: null, reliability: topPred.confidence }
    : await queryAgent(prompt);

  // Post-process: show reasoning-like block with uncertainty cue if no evidence
  const steps = [];
  steps.push("1) Retrieved top docs from claude-code-lessons data store.");
  if (highConfidence) {
    steps.push("2) High-confidence local intent prediction; skipped remote query.");
  } else if (res.text) {
    steps.push("2) Synthesized concise summary from returned snippets.");
  } else {
    steps.push("2) No summary returned; showing raw results.");
  }
  const evidenceNote =
    highConfidence
      ? `Handled locally (prediction ${topPred.intent}, conf=${topPred.confidence.toFixed(2)}).`
      : res.text && (res.reliability ?? 0) >= 0.35
      ? `Evidence: snippets from data store; reliability=${(res.reliability ?? 0).toFixed(2)}.`
      : `Insufficient evidence (reliability=${(res.reliability ?? 0).toFixed(
          2
        )}); please verify manually.`;

  console.log("Reasoning:");
  steps.forEach((s) => console.log(" - " + s));
  console.log("Answer:");
  if (highConfidence) {
    console.log(`Predicted intent: ${topPred.intent} (conf=${topPred.confidence.toFixed(2)})`);
  } else {
    console.log(res.text || JSON.stringify(res.raw, null, 2));
  }
  console.log("Uncertainty:", evidenceNote);

  if (topPred) {
    logPredictionReflection(topPred);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function getPredictionsSafe() {
  try {
    const mod = require('../src/shared/predictive-state');
    if (typeof mod.predictNextIntents === 'function') {
      return await mod.predictNextIntents();
    }
  } catch (_) {
    return null;
  }
  return null;
}

function logPredictionReflection(pred) {
  const fs = require('fs');
  const path = require('path');
  const fpath = path.join(__dirname, '..', '..', 'docs', 'memory', 'reflections.jsonl');
  const entry = {
    date: new Date().toISOString(),
    summary: `Predicted intent ${pred.intent} with confidence ${pred.confidence.toFixed(2)} (local fast-path).`,
    takeaway: 'Use local intent prediction to prefetch/handle simple actions; route complex/low-confidence to cloud.',
    tags: ['prediction', 'intent-routing'],
  };
  try {
    fs.appendFileSync(fpath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (_) {
    // best-effort
  }
}

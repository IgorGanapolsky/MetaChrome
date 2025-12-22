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
  const res = await queryAgent(prompt);

  // Post-process: show reasoning-like block with uncertainty cue if no evidence
  const steps = [];
  steps.push("1) Retrieved top docs from claude-code-lessons data store.");
  if (res.text) {
    steps.push("2) Synthesized concise summary from returned snippets.");
  } else {
    steps.push("2) No summary returned; showing raw results.");
  }
  const evidenceNote =
    res.text && (res.reliability ?? 0) >= 0.35
      ? `Evidence: snippets from data store; reliability=${(res.reliability ?? 0).toFixed(2)}.`
      : `Insufficient evidence (reliability=${(res.reliability ?? 0).toFixed(
          2
        )}); please verify manually.`;

  console.log("Reasoning:");
  steps.forEach((s) => console.log(" - " + s));
  console.log("Answer:");
  console.log(res.text || JSON.stringify(res.raw, null, 2));
  console.log("Uncertainty:", evidenceNote);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

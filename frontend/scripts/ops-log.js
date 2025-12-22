#!/usr/bin/env node
/**
 * Append a structured ops log entry.
 * Usage: node scripts/ops-log.js --action "<what>" --result "<ok|error>" --details "<text>"
 * Logs to frontend/artifacts/ops_log.jsonl
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "artifacts");
const OUT_FILE = path.join(OUT_DIR, "ops_log.jsonl");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--action") out.action = args[++i];
    else if (a === "--result") out.result = args[++i];
    else if (a === "--details") out.details = args[++i];
  }
  return out;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const { action, result, details } = parseArgs();
  if (!action || !result) {
    console.error("Usage: ops-log --action \"...\" --result \"ok|error\" --details \"...\"");
    process.exit(1);
  }
  const entry = {
    ts: new Date().toISOString(),
    action,
    result,
    details,
  };
  fs.appendFileSync(OUT_FILE, JSON.stringify(entry) + "\n", "utf8");
  console.log(`Logged: ${JSON.stringify(entry)}`);
}

main();

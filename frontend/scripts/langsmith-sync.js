#!/usr/bin/env node
/**
 * Fetch recent LangSmith runs and cache them locally for analysis/RAG.
 * Uses LANGSMITH_API_KEY and LANGSMITH_PROJECT from env.
 * Output: frontend/artifacts/langsmith/latest.json
 */
const fs = require("fs");
const path = require("path");

const API = "https://api.smith.langchain.com/api/v1/runs";
const KEY = process.env.LANGSMITH_API_KEY;
const PROJECT = process.env.LANGSMITH_PROJECT || "MetaChrome";
const OUT_DIR = path.join(__dirname, "..", "artifacts", "langsmith");
const OUT_FILE = path.join(OUT_DIR, "latest.json");

async function main() {
  if (!KEY) {
    console.error("Missing LANGSMITH_API_KEY");
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const url = `${API}?project=${encodeURIComponent(PROJECT)}&limit=50&order_by=-start_time`;
  const resp = await fetch(url, {
    headers: { "x-api-key": KEY },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    console.error(`LangSmith fetch failed: ${resp.status} ${txt}`);
    return;
  }
  const data = await resp.json();
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Saved ${data?.runs?.length ?? 0} runs to ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

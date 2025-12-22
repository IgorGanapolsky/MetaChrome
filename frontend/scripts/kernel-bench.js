#!/usr/bin/env node
/**
 * JS orchestrator that scans frontend/kernels for .py candidates,
 * runs the Python harness for each, and writes results to artifacts/kernel_bench/results.jsonl.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const KERNEL_DIR = path.join(ROOT, "kernels");
const HARNESS = path.join(__dirname, "kernel-bench.py");
const OUT_DIR = path.join(ROOT, "artifacts", "kernel_bench");
const OUT_FILE = path.join(OUT_DIR, "results.jsonl");

function main() {
  if (!fs.existsSync(KERNEL_DIR)) {
    console.error(`No kernels directory at ${KERNEL_DIR}`);
    process.exit(0);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(KERNEL_DIR)
    .filter((f) => f.endsWith(".py") && f !== "baseline.py");

  const results = [];
  for (const f of files) {
    const full = path.join(KERNEL_DIR, f);
    try {
      const out = execSync(
        `python3 ${HARNESS} --candidate ${full}`,
        { encoding: "utf8", cwd: ROOT }
      ).trim();
      if (out) {
        results.push(out);
        console.log(out);
      }
    } catch (err) {
      const msg = JSON.stringify({ status: "error", candidate: f, error: err.message });
      results.push(msg);
      console.error(msg);
    }
  }

  fs.writeFileSync(OUT_FILE, results.join("\n") + "\n", "utf8");
  console.log(`Saved results to ${OUT_FILE}`);
}

main();

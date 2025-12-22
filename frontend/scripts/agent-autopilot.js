#!/usr/bin/env node
/**
 * Autonomous loop:
 * 1) Generate kernels
 * 2) Bench & select (logs reflection on win)
 * 3) Rebuild RAG chunks
 * 4) Publish to Vertex data store
 */
const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function run(label, cmd) {
  console.log(`\n=== ${label} ===`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT, shell: "/bin/bash" });
}

function main() {
  try {
    run("Generate kernels", "yarn kernel:gen");
    run("Bench kernels", "yarn kernel:bench");
    run("Select best kernel + log reflection", "yarn kernel:select");
    run("Rebuild RAG chunks", "yarn rag:build");
    run("Publish to Vertex", "VERTEX_API_KEY=skip GCP_PROJECT_ID=claude-code-learning yarn rag:publish");
    run("Monitorability eval (optional)", "yarn eval:monitorability || true");
    console.log("\nReliability guard: low-quality answers will be withheld in agent-dev; reflections only on verified wins.");
    console.log("\n✅ Agent autopilot complete.");
  } catch (err) {
    console.error("\n❌ Agent autopilot failed:", err.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node
/**
 * Compute decay scores for reflections to prioritize fresh, recurring lessons.
 * - Input: docs/memory/reflections.jsonl (one JSON per line, fields: summary, date?, tags?)
 * - Output: updates each line adding decay_score (0-100) and writes back in place.
 *
 * Heuristics:
 * - Start at 100
 * - Subtract 0.5 per day since recorded
 * - Add 30 if seen in git log in last 30 days (pattern match on summary)
 * - Clamp 0-100
 */
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const FILE = path.join(__dirname, '..', '..', 'docs', 'memory', 'reflections.jsonl');

function daysBetween(dateIso) {
  if (!dateIso) return 0;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function recentInGit(pattern) {
  try {
    const out = execSync(
      `cd ${path.join(__dirname, '..', '..')} && git log --since="30 days ago" --all --oneline | grep -i "${pattern.replace(/"/g, '')}" | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    return parseInt(out, 10) > 0;
  } catch {
    return false;
  }
}

function score(entry) {
  let s = 100;
  s -= daysBetween(entry.date) * 0.5;
  if (recentInGit(entry.summary || '')) s += 30;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`No reflections file found at ${FILE}`);
    process.exit(1);
  }
  const lines = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean);
  const updated = lines.map((line) => {
    const obj = JSON.parse(line);
    obj.decay_score = score(obj);
    return JSON.stringify(obj);
  });
  fs.writeFileSync(FILE, updated.join('\n') + '\n', 'utf8');
  console.log(`Updated decay_score for ${updated.length} reflections.`);
}

main();

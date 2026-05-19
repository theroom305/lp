#!/usr/bin/env node
import {readFileSync} from "node:fs";

const baselinePath =
  process.argv[2] ?? "_curation/lighthouse-v7-1-preview/summary.json";
const candidatePath =
  process.argv[3] ?? "_curation/lighthouse-v7-2-1-preview/summary.json";

function readSummary(path) {
  const rows = JSON.parse(readFileSync(path, "utf8"));

  if (!Array.isArray(rows)) {
    throw new Error(`Lighthouse summary must be an array: ${path}`);
  }

  for (const row of rows) {
    if (typeof row.previewUrl === "string" && /^local-/.test(row.previewUrl)) {
      throw new Error(`Refusing local Lighthouse summary in strict compare: ${path}`);
    }
  }

  return rows;
}

function byKey(rows) {
  return new Map(rows.map((row) => [row.key, row]));
}

function numberField(row, field) {
  const value = row[field];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid Lighthouse field ${field} for ${row.key}`);
  }

  return value;
}

const baselineRows = readSummary(baselinePath);
const candidateRows = readSummary(candidatePath);
const baselineByKey = byKey(baselineRows);
const failures = [];
const table = [
  "| Key | Baseline LCP | Candidate LCP | Allowed LCP | Perf | CLS | Result |",
  "|---|---:|---:|---:|---:|---:|---|",
];

for (const candidate of candidateRows) {
  const baseline = baselineByKey.get(candidate.key);

  if (!baseline) {
    failures.push(`${candidate.key}: missing baseline row`);
    table.push(`| ${candidate.key} | n/a | ${candidate.lcpMsMedian} | n/a | ${candidate.performanceMedian} | ${candidate.clsMedian} | FAIL |`);
    continue;
  }

  const baselineLcp = numberField(baseline, "lcpMsMedian");
  const candidateLcp = numberField(candidate, "lcpMsMedian");
  const performance = numberField(candidate, "performanceMedian");
  const cls = numberField(candidate, "clsMedian");
  const allowedLcp = Math.round(Math.max(baselineLcp * 1.05, 2500));
  const absolutePass = performance >= 95 && candidateLcp <= 2500 && cls <= 0.1;
  const strictPass = candidateLcp <= allowedLcp;
  const pass = absolutePass && strictPass;

  if (!pass) {
    failures.push(
      `${candidate.key}: LCP ${candidateLcp}ms, allowed ${allowedLcp}ms, perf ${performance}, CLS ${cls}`,
    );
  }

  table.push(
    `| ${candidate.key} | ${baselineLcp} | ${candidateLcp} | ${allowedLcp} | ${performance} | ${cls} | ${pass ? "PASS" : "FAIL"} |`,
  );
}

console.log(table.join("\n"));

if (failures.length > 0) {
  console.error(`\nStrict Lighthouse comparison failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("\nCLEAN strict Lighthouse comparison.");

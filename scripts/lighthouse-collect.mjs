#!/usr/bin/env node
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {spawnSync} from "node:child_process";

const routes = [
  {key: "home", path: "/"},
  {key: "buy", path: "/buy"},
  {key: "sell", path: "/sell"},
  {key: "own", path: "/own"},
  {key: "buildings", path: "/buildings"},
  {key: "beachwalk-resort", path: "/buildings/beachwalk-resort"},
];

const profiles = ["desktop", "mobile"];
const runs = Number(process.env.LH_RUNS ?? "3");
const previewUrl = process.argv[2];
const outputDir = resolve(process.argv[3] ?? "_curation/lighthouse-v7-2-1-preview");
const summarizeOnly = process.env.LH_SUMMARIZE_ONLY === "1";

function assertPreviewUrl(value) {
  if (!value) {
    throw new Error("Usage: pnpm lighthouse:collect <preview-url> [output-dir]");
  }

  // Strict baseline must be Vercel-to-Vercel. See
  // handoffs/claude-code/2026-05-19-codex-execute-prompt-v7.2.1-trust-and-perf.md.
  if (/^local-/.test(value)) {
    throw new Error(`Refusing to write Lighthouse summary for local previewUrl: ${value}`);
  }

  new URL(value);
}

function routeUrl(base, path) {
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

function rawPath(routeKey, profile, runNumber) {
  return join(outputDir, `${routeKey}-${profile}-${runNumber}.json`);
}

function runLighthouse(url, outputPath, profile) {
  const args = [
    "dlx",
    "lighthouse@latest",
    url,
    "--quiet",
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outputPath}`,
    "--chrome-flags=--headless=new --no-sandbox",
  ];

  if (profile === "desktop") {
    args.push("--preset=desktop");
  }

  const result = spawnSync("pnpm", args, {stdio: "inherit"});

  if (result.status !== 0) {
    throw new Error(`Lighthouse failed for ${url} (${profile})`);
  }
}

function numberAudit(report, auditId) {
  const value = report.audits?.[auditId]?.numericValue;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function staticBytes(report) {
  const items = report.audits?.["network-requests"]?.details?.items;

  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce((total, item) => {
    const url = typeof item.url === "string" ? item.url : "";
    const transferSize =
      typeof item.transferSize === "number" && Number.isFinite(item.transferSize)
        ? item.transferSize
        : 0;

    return url.includes("/_next/static/") ? total + transferSize : total;
  }, 0);
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function readReport(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function summarize() {
  const summary = [];

  for (const route of routes) {
    for (const profile of profiles) {
      const reports = [];

      for (let run = 1; run <= runs; run += 1) {
        const path = rawPath(route.key, profile, run);

        if (!existsSync(path)) {
          throw new Error(`Missing Lighthouse raw result: ${path}`);
        }

        reports.push(readReport(path));
      }

      const performance = reports.map((report) =>
        Math.round((report.categories?.performance?.score ?? 0) * 100),
      );
      const lcp = reports.map((report) =>
        Math.round(numberAudit(report, "largest-contentful-paint")),
      );
      const cls = reports.map((report) => numberAudit(report, "cumulative-layout-shift"));
      const tbt = reports.map((report) =>
        Math.round(numberAudit(report, "total-blocking-time")),
      );
      const nextStaticBytes = reports.map(staticBytes);
      const performanceMedian = median(performance);
      const lcpMsMedian = Math.round(median(lcp));
      const clsMedian = Number(median(cls).toFixed(4));

      summary.push({
        previewUrl,
        key: `${route.key}:${profile}`,
        runs: reports.length,
        performanceMedian,
        lcpMsMedian,
        clsMedian,
        tbtMsMedian: Math.round(median(tbt)),
        nextStaticBytesMedian: Math.round(median(nextStaticBytes)),
        thresholdPass:
          performanceMedian >= 95 && lcpMsMedian <= 2500 && clsMedian <= 0.1,
      });
    }
  }

  writeFileSync(join(outputDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
}

assertPreviewUrl(previewUrl);

if (!Number.isInteger(runs) || runs < 1) {
  throw new Error(`LH_RUNS must be a positive integer; received ${process.env.LH_RUNS}`);
}

mkdirSync(outputDir, {recursive: true});

if (!summarizeOnly) {
  for (const route of routes) {
    for (const profile of profiles) {
      for (let run = 1; run <= runs; run += 1) {
        runLighthouse(routeUrl(previewUrl, route.path), rawPath(route.key, profile, run), profile);
      }
    }
  }
}

summarize();
console.log(`Wrote Lighthouse summary: ${join(outputDir, "summary.json")}`);

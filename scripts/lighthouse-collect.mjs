#!/usr/bin/env node
import {existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {spawn} from "node:child_process";

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
const concurrency = Number(process.env.LH_CONCURRENCY ?? "1");
const retries = Number(process.env.LH_RETRIES ?? "2");
const skipExisting = process.env.LH_SKIP_EXISTING === "1";
const previewUrl = process.argv[2];
const outputArg = process.argv[3];
const outputDir = outputArg ? resolve(outputArg) : "";
const summarizeOnly = process.env.LH_SUMMARIZE_ONLY === "1";

function assertPreviewUrl(value) {
  if (!value || !outputArg) {
    throw new Error("Usage: pnpm lighthouse:collect <preview-url> <output-dir>");
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
    "exec",
    "lighthouse",
    url,
    "--quiet",
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outputPath}`,
    "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage",
  ];

  if (profile === "desktop") {
    args.push("--preset=desktop");
  }

  return new Promise((resolveRun, rejectRun) => {
    const child = spawn("pnpm", args, {stdio: "inherit"});
    child.on("error", rejectRun);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        rejectRun(new Error(`Lighthouse failed for ${url} (${profile}): exit ${code}`));
      }
    });
  });
}

async function runLighthouseWithRetries(url, outputPath, profile) {
  if (skipExisting && existsSync(outputPath)) {
    console.log(`Skipping existing Lighthouse raw result: ${outputPath}`);
    return;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      await runLighthouse(url, outputPath, profile);
      return;
    } catch (error) {
      if (existsSync(outputPath)) {
        unlinkSync(outputPath);
      }

      if (attempt > retries) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Retrying Lighthouse ${url} (${profile}) after attempt ${attempt}/${retries + 1}: ${message}`,
      );
    }
  }
}

async function runRouteProfile(route, profile) {
  // Runs within a single route×profile stay sequential. Lighthouse requires a
  // quiet network channel per run; parallelism here would invalidate medians.
  for (let run = 1; run <= runs; run += 1) {
    await runLighthouseWithRetries(
      routeUrl(previewUrl, route.path),
      rawPath(route.key, profile, run),
      profile,
    );
  }
}

async function runAll(taskFns, parallelism) {
  if (parallelism <= 1) {
    for (const task of taskFns) {
      await task();
    }
    return;
  }

  const queue = [...taskFns];
  const workers = Array.from({length: Math.min(parallelism, queue.length)}, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (next) {
        await next();
      }
    }
  });
  await Promise.all(workers);
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
      const performance = [];
      const lcp = [];
      const cls = [];
      const tbt = [];
      const nextStaticBytes = [];

      for (let run = 1; run <= runs; run += 1) {
        const path = rawPath(route.key, profile, run);

        if (!existsSync(path)) {
          throw new Error(`Missing Lighthouse raw result: ${path}`);
        }

        const report = readReport(path);
        performance.push(
          Math.round((report.categories?.performance?.score ?? 0) * 100),
        );
        lcp.push(Math.round(numberAudit(report, "largest-contentful-paint")));
        cls.push(numberAudit(report, "cumulative-layout-shift"));
        tbt.push(Math.round(numberAudit(report, "total-blocking-time")));
        nextStaticBytes.push(staticBytes(report));
      }

      const performanceMedian = median(performance);
      const lcpMsMedian = Math.round(median(lcp));
      const clsMedian = Number(median(cls).toFixed(4));

      summary.push({
        previewUrl,
        key: `${route.key}:${profile}`,
        runs: performance.length,
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

if (!Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error(
    `LH_CONCURRENCY must be a positive integer; received ${process.env.LH_CONCURRENCY}`,
  );
}

if (!Number.isInteger(retries) || retries < 0) {
  throw new Error(`LH_RETRIES must be a non-negative integer; received ${process.env.LH_RETRIES}`);
}

mkdirSync(outputDir, {recursive: true});

if (!summarizeOnly) {
  const tasks = [];
  for (const route of routes) {
    for (const profile of profiles) {
      tasks.push(() => runRouteProfile(route, profile));
    }
  }

  await runAll(tasks, concurrency);
}

summarize();
console.log(`Wrote Lighthouse summary: ${join(outputDir, "summary.json")}`);

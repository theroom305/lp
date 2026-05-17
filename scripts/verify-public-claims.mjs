import {readdir, readFile} from "node:fs/promises";

import {findDisallowedClaimViolations} from "../src/server/claims/rules.mjs";

const scannedRoots = [
  {
    directory: "messages",
    extensions: [".json"],
    scopes: ["public_ui"],
  },
  {
    directory: "src/app",
    extensions: [".ts", ".tsx"],
    scopes: [
      "public_ui",
      "public_metadata",
      "public_api_endpoints",
      "sitemap",
      "llms_txt",
    ],
  },
  {
    directory: "src/components",
    extensions: [".ts", ".tsx"],
    scopes: ["public_ui"],
  },
  {
    directory: "src/content",
    extensions: [".ts", ".tsx", ".md", ".mdx"],
    scopes: ["public_ui", "llms_txt"],
  },
  {
    directory: "src/lib",
    extensions: [".ts", ".tsx"],
    scopes: ["public_metadata", "sitemap", "llms_txt"],
  },
];

const violations = [];

async function collectFiles(directory, extensions) {
  const entries = await readdir(directory, {withFileTypes: true}).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path, extensions)));
    } else if (extensions.some((extension) => path.endsWith(extension))) {
      files.push(path);
    }
  }

  return files;
}

for (const root of scannedRoots) {
  for (const path of await collectFiles(root.directory, root.extensions)) {
    const text = await readFile(path, "utf8");

    for (const scope of root.scopes) {
      for (const violation of findDisallowedClaimViolations(text, scope)) {
        violations.push(`${path}: ${scope}: ${violation.ruleId}`);
      }
    }
  }
}

const staticLlmsPath = "public/llms.txt";
const staticLlms = await readFile(staticLlmsPath, "utf8").catch(() => null);

if (staticLlms) {
  for (const violation of findDisallowedClaimViolations(staticLlms, "llms_txt")) {
    violations.push(`${staticLlmsPath}: llms_txt: ${violation.ruleId}`);
  }
}

if (violations.length > 0) {
  console.error("Public claim policy violations detected:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Public claim policy check passed.");

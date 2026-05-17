import {readdir, readFile} from "node:fs/promises";

const disallowedRules = [
  {
    id: "guaranteed_income",
    pattern: /\b(guaranteed|risk[- ]?free|assured)\b.{0,60}\b(income|return|roi|yield)\b/i,
  },
  {
    id: "brokerage_authority",
    pattern: /\b(licensed|authorized|official)\b.{0,60}\b(brokerage|broker|real estate agent)\b/i,
  },
  {
    id: "str_approval_absolute",
    pattern: /\b(str|short[- ]term rental|airbnb)\b.{0,60}\b(approved|legal|allowed|permitted)\b/i,
  },
  {
    id: "legal_tax_advice",
    pattern: /\b(legal|tax|firpta|visa)\b.{0,60}\b(advice|guarantee|safe|solved)\b/i,
  },
  {
    id: "real_estate_agent_schema",
    pattern: /\bRealEstateAgent\b/,
  },
  {
    id: "public_secret_env",
    pattern: /\bNEXT_PUBLIC_[A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|DATABASE|POSTGRES|RESEND|GUESTY|AUTH)\b/,
  },
  {
    id: "raw_guesty_export",
    pattern: /\b(raw\s+Guesty|Guesty\s+export|reservation\s+export|payout\s+export)\b/i,
  },
];

const scannedRoots = [
  {
    directory: "messages",
    extensions: [".json"],
  },
  {
    directory: "src/app",
    extensions: [".ts", ".tsx"],
  },
  {
    directory: "src/components",
    extensions: [".ts", ".tsx"],
  },
  {
    directory: "src/content",
    extensions: [".ts", ".tsx", ".md", ".mdx"],
  },
  {
    directory: "src/lib",
    extensions: [".ts", ".tsx"],
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

    for (const rule of disallowedRules) {
      if (rule.pattern.test(text)) {
        violations.push(`${path}: ${rule.id}`);
      }
    }
  }
}

const staticLlmsPath = "public/llms.txt";
const staticLlms = await readFile(staticLlmsPath, "utf8").catch(() => null);

if (staticLlms) {
  for (const rule of disallowedRules) {
    if (rule.pattern.test(staticLlms)) {
      violations.push(`${staticLlmsPath}: ${rule.id}`);
    }
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

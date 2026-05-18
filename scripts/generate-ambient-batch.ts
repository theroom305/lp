import {mkdirSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const outputPath = resolve(
  process.cwd(),
  "_curation/generate-ambient-batch-notice.md",
);

mkdirSync(resolve(process.cwd(), "_curation"), {recursive: true});

writeFileSync(
  outputPath,
  `# Ambient Batch Generation Notice

Generated: ${new Date().toISOString()}

The current v6.2 strategy is real-photo-first. This repository script does not
call Codex's built-in image generation tool because that tool is exposed only to
the Codex session, not to project TypeScript. The 12 generated calibration
images already produced in-session are retained under Codex's generated-images
directory and copied into _curation when needed for audit.

Use _curation/selected-assets.json plus scripts/promote-ambient-picks.ts for the
shipping path.
`,
);

process.stdout.write(`Wrote ${outputPath}\n`);

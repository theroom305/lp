import {existsSync, mkdirSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const outputPath = resolve(process.cwd(), "_curation/capability-probe-script.json");

mkdirSync(resolve(process.cwd(), "_curation"), {recursive: true});

writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      imageGenTool: {
        exposedToRepoScripts: false,
        sessionOnly: true,
        seedControl: false,
        referenceConditioning: false,
      },
      localFiles: {
        capabilityProbeMarkdown: existsSync(
          resolve(process.cwd(), "_curation/capability-probe.md"),
        ),
        selectedAssets: existsSync(
          resolve(process.cwd(), "_curation/selected-assets.json"),
        ),
      },
    },
    null,
    2,
  )}\n`,
);

process.stdout.write(`Wrote ${outputPath}\n`);

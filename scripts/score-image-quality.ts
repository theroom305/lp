import {readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

type QualityScores = Readonly<{
  light: number;
  composition: number;
  material: number;
  palette: number;
  mood: number;
  composite: number;
}>;

type Pick = Readonly<{
  id: string;
  placement: string;
  source: string;
  qualityScores: QualityScores;
}>;

type SelectedAssets = Readonly<{
  picks: readonly Pick[];
}>;

const selectedPath = resolve(process.cwd(), "_curation/selected-assets.json");
const outputPath = resolve(process.cwd(), "_curation/quality-score-summary.json");
const selectedAssets = JSON.parse(
  readFileSync(selectedPath, "utf8"),
) as SelectedAssets;

const scored = selectedAssets.picks.map((pick) => ({
  id: pick.id,
  placement: pick.placement,
  source: pick.source,
  composite: pick.qualityScores.composite,
  passes: pick.qualityScores.composite >= 4.5,
}));

const failing = scored.filter((pick) => !pick.passes);

writeFileSync(
  outputPath,
  `${JSON.stringify({scoredAt: new Date().toISOString(), scored}, null, 2)}\n`,
);

if (failing.length > 0) {
  throw new Error(
    `Ambient quality floor failed for: ${failing
      .map((pick) => pick.id)
      .join(", ")}`,
  );
}

process.stdout.write(`Wrote ${outputPath}\n`);

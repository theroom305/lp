import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";

type Pick = Readonly<{
  id: string;
  intent: string;
  placement: string;
  source: string;
  inputPath: string;
  alt: string;
  qualityScores: Readonly<{composite: number}>;
}>;

type SelectedAssets = Readonly<{
  picks: readonly Pick[];
}>;

const calibrationPath = resolve(process.cwd(), "_curation/calibration");
const selectedPath = resolve(process.cwd(), "_curation/selected-assets.json");
const generatedPath = join(calibrationPath, "generated");
const outputPath = join(calibrationPath, "index.html");

mkdirSync(calibrationPath, {recursive: true});

const selectedAssets = JSON.parse(
  readFileSync(selectedPath, "utf8"),
) as SelectedAssets;
const generatedImages = existsSync(generatedPath)
  ? readdirSync(generatedPath)
      .filter((file) => file.endsWith(".png"))
      .map((file) => `generated/${file}`)
  : [];

const realCards = selectedAssets.picks
  .map(
    (pick) => `<article>
      <img src="../../${pick.inputPath}" alt="${pick.alt}" loading="lazy">
      <h2>${pick.id}</h2>
      <p>${pick.source} · ${pick.intent} · ${pick.placement}</p>
      <p>Composite ${pick.qualityScores.composite.toFixed(2)}</p>
    </article>`,
  )
  .join("\n");

const generatedCards = generatedImages
  .map(
    (src) => `<article>
      <img src="${src}" alt="Generated atmospheric calibration candidate" loading="lazy">
      <h2>${src}</h2>
      <p>generated-atmospheric · backup candidate</p>
    </article>`,
  )
  .join("\n");

writeFileSync(
  outputPath,
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Room 305 v6.2 Calibration Gallery</title>
  <style>
    body { background: #f6f2eb; color: #14110f; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    main { display: grid; gap: 24px; }
    section { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    article { border: 1px solid #d7cfbf; border-radius: 8px; overflow: hidden; background: #fbf8f1; }
    img { aspect-ratio: 16 / 10; display: block; object-fit: cover; width: 100%; }
    h1, h2, p { margin: 16px; }
  </style>
</head>
<body>
  <main>
    <h1>Room 305 v6.2 Mixed Calibration Gallery</h1>
    <p>Zero-touch run: real-photo candidates are primary; generated candidates are retained as backup audit material.</p>
    <h2>Selected real-photo candidates</h2>
    <section>${realCards}</section>
    <h2>Generated backup candidates</h2>
    <section>${generatedCards}</section>
  </main>
</body>
</html>
`,
);

process.stdout.write(`Wrote ${outputPath}\n`);

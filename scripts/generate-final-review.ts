import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

type Pick = Readonly<{
  id: string;
  placement: string;
  source: string;
  srcAvif: string;
  srcWebp: string;
  alt: string;
  attribution: null | Readonly<{
    photographer: string;
    sourceUrl: string;
    licenseUrl: string;
  }>;
  qualityScores: Readonly<{
    light: number;
    composition: number;
    material: number;
    palette: number;
    mood: number;
    composite: number;
  }>;
}>;

type PicksFinal = Readonly<{
  picks: readonly Pick[];
}>;

const reviewDir = resolve(process.cwd(), "_curation/final-review");
const picksPath = resolve(process.cwd(), "_curation/picks-final.json");
const outputPath = resolve(reviewDir, "index.html");
const picksFinal = JSON.parse(readFileSync(picksPath, "utf8")) as PicksFinal;

mkdirSync(reviewDir, {recursive: true});

const cards = picksFinal.picks
  .map(
    (pick) => `<article>
      <picture>
        <source srcset="../../public${pick.srcAvif}" type="image/avif">
        <img src="../../public${pick.srcWebp}" alt="${pick.alt}" loading="lazy">
      </picture>
      <h2>${pick.placement}</h2>
      <p>${pick.source} · ${pick.id}</p>
      <dl>
        <div><dt>Composite</dt><dd>${pick.qualityScores.composite.toFixed(2)}</dd></div>
        <div><dt>Light</dt><dd>${pick.qualityScores.light}</dd></div>
        <div><dt>Composition</dt><dd>${pick.qualityScores.composition}</dd></div>
        <div><dt>Material</dt><dd>${pick.qualityScores.material}</dd></div>
        <div><dt>Palette</dt><dd>${pick.qualityScores.palette}</dd></div>
        <div><dt>Mood</dt><dd>${pick.qualityScores.mood}</dd></div>
      </dl>
      ${
        pick.attribution
          ? `<p>Photo by ${pick.attribution.photographer}. <a href="${pick.attribution.sourceUrl}">Source</a> · <a href="${pick.attribution.licenseUrl}">License</a></p>`
          : "<p>Generated atmospheric backup.</p>"
      }
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
  <title>Room 305 v6.2 Final Review</title>
  <style>
    body { background: #f6f2eb; color: #14110f; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    main { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    article { background: #fbf8f1; border: 1px solid #d7cfbf; border-radius: 8px; overflow: hidden; }
    img { aspect-ratio: 16 / 10; display: block; object-fit: cover; width: 100%; }
    h1 { grid-column: 1 / -1; }
    h2, p, dl { margin: 16px; }
    dl { display: grid; gap: 8px; }
    div { display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <main>
    <h1>Room 305 v6.2 Final Review</h1>
    ${cards}
  </main>
</body>
</html>
`,
);

process.stdout.write(`Wrote ${outputPath}\n`);

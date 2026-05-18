import type {CorridorBuilding} from "@/content/building-registry";

type BuildingTonalPlateProps = Readonly<{
  building: Pick<CorridorBuilding, "name" | "city" | "tone">;
  variant?: "card" | "large";
}>;

const toneTokens: Record<
  CorridorBuilding["tone"],
  {base: string; field: string; accent: string; text: string}
> = {
  "sand-dusk": {
    base: "#dfc7a4",
    field: "#4c4338",
    accent: "#b8956a",
    text: "#f9f2e8",
  },
  "brass-forest": {
    base: "#b8956a",
    field: "#2e3a2c",
    accent: "#efe2ca",
    text: "#f7f0e5",
  },
  "olive-pearl": {
    base: "#c9d0b5",
    field: "#526144",
    accent: "#f3eee4",
    text: "#1b2118",
  },
  "pearl-champagne": {
    base: "#eee7da",
    field: "#a68a55",
    accent: "#d8caa7",
    text: "#1f1a14",
  },
  "coral-sand": {
    base: "#d8aa91",
    field: "#f0dfc8",
    accent: "#9e6657",
    text: "#231915",
  },
};

function monogramFor(name: string): string {
  const words = name
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9]/.test(word));

  const significantWords = words.filter(
    (word) =>
      !["the", "and", "of", "at", "formerly", "resort", "residences"].includes(
        word.toLowerCase(),
      ),
  );
  const sourceWords = significantWords.length > 0 ? significantWords : words;

  return sourceWords
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function BuildingTonalPlate({
  building,
  variant = "card",
}: BuildingTonalPlateProps) {
  const tone = toneTokens[building.tone];
  const monogram = monogramFor(building.name);

  return (
    <div
      className="building-tonal-plate"
      data-tone={building.tone}
      data-variant={variant}
      aria-hidden="true"
    >
      <svg viewBox="0 0 640 420" role="img" focusable="false">
        <rect width="640" height="420" fill={tone.base} />
        <path
          d="M0 272 C96 220 182 238 272 196 C394 140 484 176 640 112 L640 420 L0 420 Z"
          fill={tone.field}
          opacity="0.92"
        />
        <path
          d="M54 86 H586 M54 126 H468 M54 166 H532"
          stroke={tone.accent}
          strokeLinecap="round"
          strokeWidth="10"
          opacity="0.54"
        />
        <circle cx="500" cy="116" r="72" fill={tone.accent} opacity="0.32" />
        <text
          x="50%"
          y="56%"
          dominantBaseline="middle"
          fill={tone.text}
          fontFamily="Georgia, serif"
          fontSize="98"
          fontWeight="650"
          textAnchor="middle"
        >
          {monogram}
        </text>
      </svg>
      <div className="building-tonal-caption">
        <span>{building.name}</span>
        <small>{building.city}</small>
      </div>
    </div>
  );
}

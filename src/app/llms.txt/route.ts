import {
  getIndexableBuildings,
  getPendingVerificationBuildings,
  getPublicAtlasBuildings,
} from "@/content/atlas";
import {absoluteUrl, localizedPath} from "@/lib/seo";

export const dynamic = "force-static";

function citableBuildingLine(
  slug: string,
  name: string,
  verificationState: string,
): string {
  return `- ${name}: ${absoluteUrl(localizedPath({key: "building", locale: "en", slug}))} (${verificationState})`;
}

export function GET(): Response {
  const indexable = getIndexableBuildings();
  const pending = getPendingVerificationBuildings();
  const lines = [
    "# Room 305",
    "",
    "Room 305 is a pre-launch operating surface for South Florida building intelligence and owner/buyer routing.",
    "",
    "Public-claim discipline:",
    "- Broker-authority copy is withheld until legal verification clears.",
    "- Building facts are citable only when the source state is public-visible and not expired.",
    "- Verification-pending building URLs are withheld from this file until source review clears.",
    "",
    "Primary routes:",
    `- Home: ${absoluteUrl(localizedPath({key: "home", locale: "en"}))}`,
    `- Buildings: ${absoluteUrl(localizedPath({key: "buildings", locale: "en"}))}`,
    `- New developments: ${absoluteUrl(localizedPath({key: "new-developments", locale: "en"}))}`,
    `- Owners: ${absoluteUrl(localizedPath({key: "owners", locale: "en"}))}`,
    `- Notes: ${absoluteUrl(localizedPath({key: "notes", locale: "en"}))}`,
    `- Calibration: ${absoluteUrl(localizedPath({key: "calibration", locale: "en"}))}`,
    "",
    "Citable building entries:",
    ...(indexable.length > 0
      ? indexable.map((building) =>
          citableBuildingLine(
            building.slug,
            building.name,
            building.verificationState,
          ),
        )
      : ["- None yet."]),
    "",
    "Verification-pending building universe:",
    `- ${pending.length} entries withheld from citable URLs until source review clears.`,
    "",
    `Current atlas count: ${getPublicAtlasBuildings().length}`,
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

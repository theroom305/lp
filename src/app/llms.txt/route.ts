import {absoluteUrl, localizedPath} from "@/lib/seo";

export const dynamic = "force-static";

export function GET(): Response {
  const lines = [
    "# Room 305",
    "",
    "Room 305 helps buyers and sellers of South Florida condos choose buildings with corridor-deep context; primary contact via /contact.",
    "",
    "Current public surface:",
    `- Home: ${absoluteUrl(localizedPath({key: "home", locale: "en"}))}`,
    `- Buy: ${absoluteUrl(localizedPath({key: "buy", locale: "en"}))}`,
    `- Own: ${absoluteUrl(localizedPath({key: "own", locale: "en"}))}`,
    `- Sell: ${absoluteUrl(localizedPath({key: "sell", locale: "en"}))}`,
    `- Buildings we follow: ${absoluteUrl(
      localizedPath({key: "buildings", locale: "en"}),
    )} - buildings we follow, presented as a working scaffold.`,
    `- Contact: ${absoluteUrl(localizedPath({key: "contact", locale: "en"}))}`,
    "",
    "Atmospheric imagery on this site uses licensed editorial photography or generative mood studies; it depicts light, material, and time-of-day, not specific properties or building portraits.",
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

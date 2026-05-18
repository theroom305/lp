import {absoluteUrl, localizedPath} from "@/lib/seo";

export const dynamic = "force-static";

export function GET(): Response {
  const lines = [
    "# Room 305",
    "",
    "Room 305 helps buyers and sellers of South Florida condos with operator-level building judgment; primary contact via /contact.",
    "",
    "Current public surface:",
    `- Home: ${absoluteUrl(localizedPath({key: "home", locale: "en"}))}`,
    `- Buy: ${absoluteUrl(localizedPath({key: "buy", locale: "en"}))}`,
    `- Sell: ${absoluteUrl(localizedPath({key: "sell", locale: "en"}))}`,
    `- Contact: ${absoluteUrl(localizedPath({key: "contact", locale: "en"}))}`,
  ];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

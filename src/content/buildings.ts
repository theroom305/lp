export type Building = Readonly<{
  slug: string;
  name: string;
  neighborhood: string;
  status: string;
  tone: "coast" | "city" | "garden";
}>;

export const buildings: readonly Building[] = [
  {
    slug: "seven-park-hallandale",
    name: "Seven Park",
    neighborhood: "Hallandale Beach",
    status: "Shell",
    tone: "coast",
  },
  {
    slug: "diplomat-tower",
    name: "Diplomat Tower",
    neighborhood: "Hollywood",
    status: "Shell",
    tone: "coast",
  },
  {
    slug: "lofty-brickell",
    name: "Lofty Brickell",
    neighborhood: "Brickell",
    status: "Shell",
    tone: "city",
  },
  {
    slug: "edge-house",
    name: "Edge House",
    neighborhood: "Edgewater",
    status: "Shell",
    tone: "city",
  },
  {
    slug: "beachwalk",
    name: "Beachwalk",
    neighborhood: "Hallandale Beach",
    status: "Proof",
    tone: "garden",
  },
  {
    slug: "aria-reserve",
    name: "Aria Reserve",
    neighborhood: "Edgewater",
    status: "Shell",
    tone: "garden",
  },
];

import {expect, test} from "@playwright/test";

import {ambientAssets} from "../src/content/ambient-assets";
import {corridorBuildings} from "../src/content/building-registry";
import {featuredBuildingSlugs} from "../src/content/featured-buildings";
import {
  buildingsForSubmarket,
  submarketFilterIds,
  uncoveredBuildingSlugs,
} from "../src/lib/submarket-mapping";
import {shouldRenderOperatorMemo} from "../src/lib/operator-memo";
import {getPublicClaims, getSourcePacket} from "../src/lib/source-packets";
import {generateLeadPacket} from "../src/server/lead/packet";
import {classifyLead} from "../src/server/lead/scoring";
import type {V7LeadRequest} from "../src/server/lead/schema";

const publicPaths = ["/", "/buy", "/own", "/sell", "/buildings", "/contact"] as const;
const allowedAssetIntents = new Set([
  "ambient",
  "material",
  "arrival",
  "lifestyle-context",
]);

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const viewport = page.viewportSize();
  const metrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }));

  const availableWidth = viewport?.width ?? metrics.window;
  expect(Math.max(metrics.body, metrics.document)).toBeLessThanOrEqual(
    availableWidth + 1,
  );
}

test.describe("public funnel surface", () => {
  for (const path of publicPaths) {
    test(`${path} loads without horizontal overflow`, async ({page}) => {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe("lead microform", () => {
  test.beforeEach(async ({page}) => {
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          status: "accepted",
          lead: {
            id: "e2e-lead",
            tier: "high",
            stage: "qualified",
            duplicate: false,
          },
          nextAction: {kind: "calendar", url: "https://calendar.example"},
          preCallBrief: {generated: true, notification: "dry-run"},
        }),
      });
    });
  });

  test("buyer can submit context", async ({page}) => {
    await page.goto("/buy");
    await page.getByLabel("Building or area in South Florida").fill("Beachwalk");
    await page
      .getByLabel("Where are you based? (optional, helps us match time zones)")
      .fill("Colombia");
    await page.getByLabel("Mixed: personal + rental income").check();
    await page.getByLabel("2 to 5 years").check();
    await page.getByLabel("3 to 12 months").check();
    await page.getByLabel("$500K – $1M").check();
    await page
      .getByLabel("Anything specific on your mind?")
      .fill("I want to know which buildings are realistic.");
    await page.getByLabel("Your name").fill("E2E Buyer");
    await page.getByLabel("Email").fill("buyer@example.com");
    await page.getByRole("button", {name: "Send for review"}).click();

    await expect(page.getByRole("heading", {name: "Got it."})).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("owner can submit context from /own", async ({page}) => {
    await page.goto("/own");
    await page.getByLabel("Building or area in South Florida").fill("Beachwalk");
    await page
      .getByLabel("Where are you based? (optional, helps us match time zones)")
      .fill("Mexico");
    await page.getByLabel("Mostly rental income").check();
    await page.getByLabel("Opportunistic exit").check();
    await page.getByLabel("Within 3 months").check();
    await page.getByLabel("$1M – $2M").check();
    await page
      .getByLabel("Anything specific on your mind?")
      .fill("Current setup is taking too much time.");
    await page.getByLabel("Your name").fill("E2E Owner");
    await page.getByLabel("Email").fill("owner@example.com");
    await page.getByRole("button", {name: "Send for review"}).click();

    await expect(page.getByRole("heading", {name: "Got it."})).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("seller can submit context", async ({page}) => {
    await page.goto("/sell");
    await page.getByLabel("Building or area in South Florida").fill("Beachwalk 305");
    await page
      .getByLabel("Where are you based? (optional, helps us match time zones)")
      .fill("Mexico");
    await page.getByLabel("Mixed: personal + rental income").check();
    await page.getByLabel("Under 2 years").check();
    await page.getByLabel("Within 3 months").check();
    await page.getByLabel("$1M – $2M").check();
    await page
      .getByLabel("Anything specific on your mind?")
      .fill("I want to understand timing.");
    await page.getByLabel("Your name").fill("E2E Seller");
    await page.getByLabel("Email").fill("seller@example.com");
    await page.getByRole("button", {name: "Send for review"}).click();

    await expect(page.getByRole("heading", {name: "Got it."})).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("building context deep link prefills buyer intake", async ({page}) => {
    await page.goto("/buy?building=beachwalk-resort&intent=buy");

    await expect(page.getByLabel("Building or area in South Florida")).toHaveValue(
      "Beachwalk Resort",
    );
    await expectNoHorizontalOverflow(page);
  });

  test("home path selector routes building context to owner lane", async ({page}) => {
    await page.goto("/");
    await page.locator('[data-test-id="home-building-input"]').fill("Beachwalk");
    await page.locator('[data-test-id="hero-own"]').click();

    await expect(page).toHaveURL(/\/own\?buildingName=Beachwalk/);
    await expect(page.getByLabel("Building or area in South Florida")).toHaveValue(
      "Beachwalk",
    );
  });

  test("Spanish buyer lane submits with locked v7 labels", async ({page}) => {
    await page.goto("/es/comprar");
    await page.getByLabel("Edificio o zona en el sur de Florida").fill("Beachwalk");
    await page
      .getByLabel("¿Dónde está usted basado? (opcional, ayuda a coordinar zonas horarias)")
      .fill("Colombia");
    await page.getByLabel("Mixto: personal + ingresos por alquiler").check();
    await page.getByLabel("2 a 5 años").check();
    await page.getByLabel("3 a 12 meses").check();
    await page.getByLabel("$500K – $1M").check();
    await page
      .getByLabel("¿Algo específico en mente?")
      .fill("Quiero entender las reglas del edificio.");
    await page.getByLabel("Su nombre", {exact: true}).fill("Comprador E2E");
    await page.getByLabel("Correo electrónico").fill("comprador@example.com");
    await page.getByRole("button", {name: "Enviar para revisión"}).click();

    await expect(page.getByRole("heading", {name: "Recibido."})).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("buyer can submit without country", async ({page}) => {
    let submittedCountry: unknown = "not-captured";

    await page.route("**/api/lead", async (route) => {
      const payload = route.request().postDataJSON() as {
        countryOfResidence?: unknown;
      };
      submittedCountry = payload.countryOfResidence;

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          status: "accepted",
          lead: {
            id: "e2e-lead-no-country",
            tier: "qualified",
            stage: "qualified",
            duplicate: false,
          },
          nextAction: {kind: "calendar", url: "https://calendar.example"},
          preCallBrief: {generated: true, notification: "dry-run"},
        }),
      });
    });

    await page.goto("/buy");
    await page.getByLabel("Building or area in South Florida").fill("Seven Park");
    await page.getByLabel("Mixed: personal + rental income").check();
    await page.getByLabel("2 to 5 years").check();
    await page.getByLabel("3 to 12 months").check();
    await page.getByLabel("$500K – $1M").check();
    await page.getByLabel("Your name").fill("No Country Buyer");
    await page.getByLabel("Email").fill("nocountry@example.com");
    await page.getByRole("button", {name: "Send for review"}).click();

    await expect(page.getByRole("heading", {name: "Got it."})).toBeVisible();
    expect(submittedCountry).toBeNull();
  });

  for (const path of ["/buy", "/sell", "/own"] as const) {
    test(`${path} shows post-form expectation line`, async ({page}) => {
      await page.goto(path);

      await expect(page.locator('[data-test-id="post-form-expectation"]')).toHaveText(
        "We review new notes each business day. If there's a fit, Isaac sends a direct note with the building already in view.",
      );
    });
  }

  for (const path of ["/es/comprar", "/es/vender", "/es/ya-tengo-propiedad"] as const) {
    test(`${path} shows Spanish post-form expectation line`, async ({page}) => {
      await page.goto(path);

      await expect(page.locator('[data-test-id="post-form-expectation"]')).toHaveText(
        "Revisamos las notas nuevas cada día hábil. Si hay encaje, Isaac envía una nota directa con el contexto del edificio ya en vista.",
      );
    });
  }
});

test.describe("v7 deterministic classification", () => {
  function request(overrides: Partial<V7LeadRequest> = {}): V7LeadRequest {
    return {
      idempotencyKey: `e2e-${crypto.randomUUID()}`,
      customerState: "buying",
      buildingOrArea: "Beachwalk Resort",
      countryOfResidence: "co",
      useMix: "mixed",
      holdHorizon: "2-5y",
      timeline: "3-12mo",
      budgetBand: "500k-1m",
      advisorInvolved: false,
      advisorName: null,
      mainConcern: "Need building context.",
      contact: {
        name: "Classification Fixture",
        email: "fixture@example.com",
      },
      context: {
        locale: "en",
        sourceUrl: "https://theroom305.com/buy",
      },
      consent: {
        marketing: false,
      },
      ...overrides,
    };
  }

  test("classifies owner in operator-known building as high", () => {
    expect(
      classifyLead(
        request({
          customerState: "i-own",
          useMix: "rental-led",
          timeline: "lt-3mo",
          budgetBand: null,
        }),
      ).tier,
    ).toBe("high");
  });

  test("classifies rental-led near-term with advisor as high", () => {
    expect(
      classifyLead(
        request({
          buildingOrArea: "Brickell",
          advisorInvolved: true,
          budgetBand: null,
        }),
      ).tier,
    ).toBe("high");
  });

  test("classifies personal exploring lead as soft", () => {
    expect(
      classifyLead(
        request({
          useMix: "personal-led",
          holdHorizon: null,
          timeline: "exploring",
          budgetBand: null,
        }),
      ).tier,
    ).toBe("soft");
  });

  test("deflects obvious out-of-corridor stated buildings", () => {
    expect(
      classifyLead(
        request({
          buildingOrArea: "Manhattan condo",
          budgetBand: "2m-plus",
        }),
      ).tier,
    ).toBe("deflect");
  });

  test("handles null country from locale only", () => {
    expect(
      classifyLead(
        request({
          countryOfResidence: null,
          context: {
            locale: "en",
            sourceUrl: "https://theroom305.com/buy",
          },
        }),
      ).servicedLanguage,
    ).toBe("en");

    expect(
      classifyLead(
        request({
          countryOfResidence: null,
          context: {
            locale: "es",
            sourceUrl: "https://theroom305.com/es/comprar",
          },
        }),
      ).servicedLanguage,
    ).toBe("es-LatAm");
  });

  test("lead packet renders without country", () => {
    const payload = request({countryOfResidence: null});
    const classification = classifyLead(payload);
    const packet = generateLeadPacket({
      id: "packet-no-country",
      payload,
      classification,
    });

    expect(packet).toContain("Classification Fixture (-, en)");
    expect(packet).toContain("LEAD #packet-no-country");
  });
});

test.describe("building atlas", () => {
  test("home renders v7.2 problem-frame section with locked copy", async ({
    page,
  }) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto("/");

    await expect(page.locator('[data-test-id="problem-frame-section"]')).toContainText(
      "Most foreign buyers find out what the building really allows after they've signed.",
    );
    await expect(page.locator('[data-test-id="problem-frame-section"]')).toContainText(
      "49% sold to international buyers",
    );
    await expect(page.locator('[data-test-id="old-way-our-way"]')).toContainText(
      "Browse listings. Tour units. Sign.",
    );
    await expect(page.locator('[data-test-id="old-way-our-way"]')).toContainText(
      "Read the declaration. Verify the rules. Then talk units.",
    );
    await expectNoHorizontalOverflow(page);
  });

  test("Spanish home renders v7.2 problem-frame section in usted form", async ({
    page,
  }) => {
    await page.setViewportSize({width: 390, height: 844});
    await page.goto("/es");

    await expect(page.locator('[data-test-id="problem-frame-section"]')).toContainText(
      "La mayoría de los compradores extranjeros descubre lo que el edificio realmente permite después de haber firmado.",
    );
    await expect(page.locator('[data-test-id="problem-frame-section"]')).toContainText(
      "Nosotros leemos el edificio primero.",
    );
    await expect(page.locator('[data-test-id="old-way-our-way"]')).toContainText(
      "Leer la declaración. Verificar las reglas. Después hablar de unidades.",
    );
    await expectNoHorizontalOverflow(page);
  });

  test("homepage renders curated six plus all-buildings link", async ({page}) => {
    await page.goto("/");

    await expect(page.locator('[data-test-id^="building-card-"]')).toHaveCount(
      featuredBuildingSlugs.length,
    );
    await expect(page.locator(".showroom-link-row a")).toHaveAttribute(
      "href",
      "/buildings",
    );

    for (const slug of featuredBuildingSlugs) {
      await expect(
        page.locator(`[data-test-id="building-card-${slug}"]`),
      ).toBeVisible();
    }
  });

  test("founder section is hidden when server flag is unset", async ({page}) => {
    await page.goto("/");

    await expect(page.locator('[data-test-id="founder-section"]')).toHaveCount(0);
  });

  test("renders full public-safe corridor list", async ({page}) => {
    await page.goto("/buildings");

    await expect(page.locator('[data-test-id^="building-card-"]')).toHaveCount(
      19,
    );
    await expect(page.getByText("legal_no_minimum")).toHaveCount(0);
    await expect(page.getByText("legal_7_night_min")).toHaveCount(0);
    await expect(page.getByText("isaac_relationship")).toHaveCount(0);
    await expect(page.getByText("operating_units_room305")).toHaveCount(0);
    await expect(page.getByText("bankruptcy")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("submarket filters are functional with no orphan buildings", async ({page}) => {
    expect(uncoveredBuildingSlugs()).toEqual([]);

    await page.goto("/buildings");
    await expect(page.locator('[data-test-id="submarket-chip-all"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    for (const id of submarketFilterIds) {
      const expectedCount = buildingsForSubmarket(id).length;
      expect(expectedCount).toBeGreaterThan(0);

      await page.locator(`[data-test-id="submarket-chip-${id}"]`).click();
      await expect(
        page.locator('[data-test-id^="building-card-"]:visible'),
      ).toHaveCount(expectedCount);
    }
  });

  test("building cards use a single click target before dossier", async ({page}) => {
    await page.goto("/");
    await expect(page.locator('[data-test-id^="building-context-"]')).toHaveCount(0);

    await page.goto("/buildings");
    await expect(page.locator('[data-test-id^="building-context-"]')).toHaveCount(0);

    await page.goto("/buildings/beachwalk-resort");
    await expect(
      page.locator('[data-test-id="beachwalk-section-cta"] a'),
    ).toBeVisible();
  });

  test("desktop building-card heading keeps usable width", async ({page}) => {
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto("/");

    const firstHeading = page.locator(".building-card h3").first();
    await expect(firstHeading).toBeVisible();

    const width = await firstHeading.evaluate(
      (element) => (element as HTMLElement).clientWidth,
    );

    expect(width).toBeGreaterThan(120);
  });
});

test.describe("v7.2 Beachwalk proof dossier", () => {
  test("operator memo gate only opens with approval and non-empty copy", () => {
    expect(shouldRenderOperatorMemo(false, "Approved copy")).toBe(false);
    expect(shouldRenderOperatorMemo(true, "")).toBe(false);
    expect(shouldRenderOperatorMemo(true, "   ")).toBe(false);
    expect(shouldRenderOperatorMemo(true, "Approved copy")).toBe(true);
  });

  test("source packet has lifecycle fields and hides stale public claims", () => {
    const packet = getSourcePacket("beachwalk-resort");

    expect(packet).toBeTruthy();
    expect(packet?.claims.length).toBeGreaterThanOrEqual(8);
    expect(packet?.claims.length).toBeLessThanOrEqual(12);

    for (const claim of packet?.claims ?? []) {
      expect(claim.buildingId).toBe("beachwalk-resort");
      expect(claim.claimId).toBeTruthy();
      expect(claim.publicText).toBeTruthy();
      expect(claim.observedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(claim.freshnessState).toMatch(/fresh|review-due|stale|expired/);
      expect(claim.confidence).toMatch(/verified|high|medium|verifying/);
      expect(claim.visibility).toMatch(/public|private|internal/);
      expect(claim.whatCouldChange).toBeTruthy();
    }

    const publicClaims = getPublicClaims("beachwalk-resort");

    expect(publicClaims.length).toBeGreaterThanOrEqual(8);
    expect(publicClaims.map((claim) => claim.claimId)).not.toContain(
      "stale-render-test",
    );
    expect(publicClaims.every((claim) => claim.visibility === "public")).toBe(true);
  });

  test("renders all required Beachwalk dossier sections", async ({page}) => {
    await page.goto("/buildings/beachwalk-resort");

    for (const id of [
      "header",
      "at-a-glance",
      "known",
      "unknown",
      "verify-before-offer",
      "fit-review-sample",
      "cta",
      "source-footer",
    ]) {
      await expect(
        page.locator(`[data-test-id="beachwalk-section-${id}"]`),
      ).toBeVisible();
    }

    await expect(
      page.locator('[data-test-id="beachwalk-section-operator-memo"]'),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("renders source-status badges for every public claim", async ({page}) => {
    const publicClaims = getPublicClaims("beachwalk-resort");

    await page.goto("/buildings/beachwalk-resort");

    for (const claim of publicClaims) {
      await expect(
        page.locator(`[data-test-id="source-status-${claim.claimId}"]`).first(),
      ).toBeVisible();
    }

    await expect(
      page.locator('[data-test-id="source-status-rental-minimum"]').first(),
    ).toHaveAttribute("data-freshness-state", "review-due");
    await expect(
      page.locator('[data-test-id="source-status-stale-render-test"]'),
    ).toHaveCount(0);
  });

  test("Building Fit Review sample and CTA are public-safe", async ({page}) => {
    await page.goto("/buildings/beachwalk-resort");

    await expect(
      page.locator('[data-test-id="beachwalk-section-fit-review-sample"]'),
    ).toContainText("Known");
    await expect(
      page.locator('[data-test-id="beachwalk-section-fit-review-sample"]'),
    ).toContainText("Verify Before Offer");
    await expect(
      page.locator('[data-test-id="beachwalk-section-cta"] a'),
    ).toHaveAttribute("href", "/buy?building=beachwalk-resort&intent=buy");
  });

  test("Beachwalk JSON-LD uses Article and BreadcrumbList only", async ({page}) => {
    await page.goto("/buildings/beachwalk-resort");

    const types = await page.locator('script[type="application/ld+json"]').evaluateAll(
      (nodes) =>
        nodes.flatMap((node) => {
          const text = node.textContent ?? "{}";
          const parsed = JSON.parse(text) as {"@type"?: string};
          return parsed["@type"] ? [parsed["@type"]] : [];
        }),
    );

    expect(types).toContain("Article");
    expect(types).toContain("BreadcrumbList");
    expect(types).not.toContain("FAQPage");
    expect(types).not.toContain("Answer");
  });

  test("v7.2 forbidden language is absent from public rendered text", async ({
    page,
  }) => {
    for (const path of [
      "/",
      "/buildings/beachwalk-resort",
      "/es",
      "/es/edificios/beachwalk-resort",
    ] as const) {
      await page.goto(path);
      const text = await page.locator("body").innerText();

      expect(text).not.toMatch(/\baudit\b/i);
      expect(text).not.toMatch(/Operating-Aware Brokerage|Fit-Before-Sign/i);
      expect(text).not.toMatch(/AI Overview eligibility/i);
      expect(text).not.toMatch(/\d+\s*%\s*(yield|return|appreciation|IRR|ROI|occupancy)/i);
      expect(text).not.toMatch(/\$\s*\d+(\.\d+)?\s*(per night|per month|nightly|monthly)/i);
    }
  });
});

test.describe("ambient assets", () => {
  test("manifest keeps source contracts and claim-safety boundaries", () => {
    const forbiddenTerms = corridorBuildings.flatMap((building) => [
      building.slug,
      building.name,
    ]);
    const placements = new Set<string>();

    expect(ambientAssets.length).toBeGreaterThanOrEqual(3);
    expect(ambientAssets.length).toBeLessThanOrEqual(4);

    for (const asset of ambientAssets) {
      expect(allowedAssetIntents.has(asset.intent)).toBe(true);
      expect(placements.has(asset.placement)).toBe(false);
      placements.add(asset.placement);

      if (asset.source === "generated-atmospheric") {
        expect(asset.promptDigest).toBeTruthy();
        expect(asset.attribution).toBeNull();
      } else {
        expect(asset.promptDigest).toBeNull();
        expect(asset.attribution).toBeTruthy();
      }

      const checkedText = [
        asset.alt,
        asset.srcAvif,
        asset.srcWebp,
        asset.promptDigest ?? "",
        asset.attribution?.photographer ?? "",
        asset.attribution?.sourceUrl ?? "",
      ]
        .join(" ")
        .toLowerCase();

      for (const term of forbiddenTerms) {
        expect(checkedText).not.toContain(term.toLowerCase());
      }
    }

    expect(placements.has("buy-intro")).toBe(true);
    expect(placements.has("sell-intro")).toBe(true);
    expect(placements.has("slug-shared-backdrop")).toBe(true);
  });

  test("ambient images only prioritize likely LCP placements", async ({
    page,
  }) => {
    const routes = [
      {path: "/", maxPrioritizedAmbient: 0},
      {path: "/buy", maxPrioritizedAmbient: 1},
      {path: "/buildings/beachwalk-resort", maxPrioritizedAmbient: 1},
    ] as const;
    const viewports = [
      {width: 1440, height: 900},
      {width: 390, height: 844},
    ] as const;

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      for (const route of routes) {
        await page.goto(route.path);

        const eagerImages = await page.locator('img[loading="eager"]').count();
        const prioritizedAmbient = await page
          .locator('.ambient-strip img:not([loading="lazy"])')
          .count();
        const prioritizedDividers = await page
          .locator('.ambient-strip[data-variant="divider"] img:not([loading="lazy"])')
          .count();

        expect(eagerImages).toBeLessThanOrEqual(1);
        expect(prioritizedAmbient).toBeLessThanOrEqual(
          route.maxPrioritizedAmbient,
        );
        expect(prioritizedDividers).toBe(0);
        await expectNoHorizontalOverflow(page);
      }
    }
  });
});

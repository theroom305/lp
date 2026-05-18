import {expect, test} from "@playwright/test";

import {ambientAssets} from "../src/content/ambient-assets";
import {corridorBuildings} from "../src/content/building-registry";
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
    await page.getByLabel("Where do you live now?").fill("Colombia");
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
    await page.getByLabel("Where do you live now?").fill("Mexico");
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
    await page.getByLabel("Where do you live now?").fill("Mexico");
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
    await page.getByLabel("¿Dónde vive actualmente?").fill("Colombia");
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
});

test.describe("building atlas", () => {
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

  test("ambient images stay lazy-loaded around above-fold routes", async ({
    page,
  }) => {
    const routes = ["/", "/buy"] as const;
    const viewports = [
      {width: 1440, height: 900},
      {width: 390, height: 844},
    ] as const;

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      for (const route of routes) {
        await page.goto(route);

        const eagerImages = await page.locator('img[loading="eager"]').count();
        const nonLazyAmbient = await page
          .locator('.ambient-strip img:not([loading="lazy"])')
          .count();

        expect(eagerImages).toBeLessThanOrEqual(1);
        expect(nonLazyAmbient).toBe(0);
        await expectNoHorizontalOverflow(page);
      }
    }
  });
});

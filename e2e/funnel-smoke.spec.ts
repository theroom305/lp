import {expect, test} from "@playwright/test";

import {ambientAssets} from "../src/content/ambient-assets";
import {corridorBuildings} from "../src/content/building-registry";

const publicPaths = ["/", "/buy", "/sell", "/buildings", "/contact"] as const;
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
          lead: {id: "e2e-lead", tier: "a"},
          preCallBrief: {generated: true},
          notification: {mode: "dry-run"},
        }),
      });
    });
  });

  test("buyer can submit context", async ({page}) => {
    await page.goto("/buy");
    await page.getByLabel("Where you live now").fill("Colombia");
    await page
      .getByLabel("Target area or building")
      .fill("Beachwalk or Hallandale");
    await page.getByLabel("$750k-$1.25M").check();
    await page.getByLabel("This season").check();
    await page.getByLabel("How would you likely buy?").selectOption("cash");
    await page.getByLabel("What do you want to avoid?").fill("Bad rules.");
    await page
      .getByLabel("What would make this call useful?")
      .fill("I want to know which buildings are realistic.");
    await page.getByLabel("Name").fill("E2E Buyer");
    await page.getByLabel("Email").fill("buyer@example.com");
    await page.getByRole("button", {name: "Send for review"}).click();

    await expect(page.getByText("We have your context.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("seller can submit context", async ({page}) => {
    await page.goto("/sell");
    await page.getByLabel("Where you live now").fill("Mexico");
    await page.getByLabel("Building and unit").fill("Beachwalk 305");
    await page.getByLabel("Is it currently listed?").selectOption("no");
    await page.getByLabel("After season").check();
    await page.getByLabel("What is the main issue?").selectOption("uncertainty");
    await page.getByLabel("Approximate expected price").fill("$900k");
    await page
      .getByLabel("What would make this call useful?")
      .fill("I want to understand timing and pricing.");
    await page.getByLabel("Name").fill("E2E Seller");
    await page.getByLabel("Email").fill("seller@example.com");
    await page.getByRole("button", {name: "Send for review"}).click();

    await expect(page.getByText("We have your context.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("building context deep link prefills buyer intake", async ({page}) => {
    await page.goto("/buy?building=beachwalk-resort&intent=buy");

    await expect(page.getByLabel("Target area or building")).toHaveValue(
      "Beachwalk Resort",
    );
    await expect(page.getByLabel("I'm buying")).toBeChecked();
    await expectNoHorizontalOverflow(page);
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

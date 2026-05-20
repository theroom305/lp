import {AxeBuilder} from "@axe-core/playwright";
import {expect, test, type Locator, type Page} from "@playwright/test";

const auditedPaths = ["/", "/es", "/buy", "/buildings/beachwalk-resort"] as const;
const brandMobileCases = [
  {
    path: "/",
    locale: "en",
    viewport: {width: 390, height: 844},
    headline: "Own a piece of Miami. Use it, rent it, sell when the time is right.",
    subcopy: "Room 305 reads the building first",
    noteCue: "Building note",
    reply: "Prepared before Isaac replies.",
    primaryAction: "I'm buying",
  },
  {
    path: "/",
    locale: "en",
    viewport: {width: 360, height: 800},
    headline: "Own a piece of Miami. Use it, rent it, sell when the time is right.",
    subcopy: "Room 305 reads the building first",
    noteCue: "Building note",
    reply: "Prepared before Isaac replies.",
    primaryAction: "I'm buying",
  },
  {
    path: "/es",
    locale: "es",
    viewport: {width: 390, height: 844},
    headline: "Tenga un pedazo de Miami. Úselo, alquílelo, véndalo cuando sea el momento.",
    subcopy: "Room 305 lee el edificio primero",
    noteCue: "Nota del edificio",
    reply: "Preparado antes de que Isaac responda.",
    primaryAction: "Estoy comprando",
  },
  {
    path: "/es",
    locale: "es",
    viewport: {width: 360, height: 800},
    headline: "Tenga un pedazo de Miami. Úselo, alquílelo, véndalo cuando sea el momento.",
    subcopy: "Room 305 lee el edificio primero",
    noteCue: "Nota del edificio",
    reply: "Preparado antes de que Isaac responda.",
    primaryAction: "Estoy comprando",
  },
] as const;

async function expectBodyHasNoA11yViolations(page: Page): Promise<void> {
  const result = await new AxeBuilder({page})
    .include("body")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(" ")),
    })),
  ).toEqual([]);
}

async function expectInInitialViewport(
  locator: Locator,
  viewportHeight: number,
): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error("Visible locator did not produce a bounding box.");
  }

  expect(box.y + box.height).toBeLessThanOrEqual(viewportHeight + 1);
}

test.describe("accessibility smoke", () => {
  for (const path of auditedPaths) {
    test(`${path} body has no WCAG A/AA axe violations`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectBodyHasNoA11yViolations(page);
    });
  }

  for (const brandCase of brandMobileCases) {
    test(`${brandCase.locale} ${brandCase.viewport.width}x${brandCase.viewport.height} hero keeps note, Isaac cue, and action visible`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(brandCase.viewport);
      await page.goto(brandCase.path);

      await expect(page.locator(".hero-proof-panel h2")).toHaveCount(0);
      await expect(page.locator(".hero-proof-footer")).toBeVisible();
      await expect(page.getByText(brandCase.reply)).toBeVisible();
      await expectInInitialViewport(
        page.getByText(brandCase.noteCue),
        brandCase.viewport.height,
      );
      await expectInInitialViewport(
        page.getByRole("heading", {name: brandCase.headline}),
        brandCase.viewport.height,
      );
      await expectInInitialViewport(
        page.getByText(brandCase.subcopy),
        brandCase.viewport.height,
      );
      await expectInInitialViewport(
        page.getByRole("button", {name: brandCase.primaryAction}),
        brandCase.viewport.height,
      );

      const visibleText = await page.locator("body").innerText();
      expect(visibleText.match(/\bIsaac\b/g) ?? []).toHaveLength(3);

      await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(
          `v7-2-4-${brandCase.locale}-${brandCase.viewport.width}x${brandCase.viewport.height}.png`,
        ),
      });
    });
  }
});

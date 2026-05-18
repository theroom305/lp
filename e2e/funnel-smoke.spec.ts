import {expect, test} from "@playwright/test";

const publicPaths = ["/", "/buy", "/sell", "/buildings", "/contact"] as const;

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
});

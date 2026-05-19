import {AxeBuilder} from "@axe-core/playwright";
import {expect, test, type Page} from "@playwright/test";

const auditedPaths = ["/buy", "/buildings/beachwalk-resort"] as const;

async function expectMainHasNoA11yViolations(page: Page): Promise<void> {
  const result = await new AxeBuilder({page})
    .include("main")
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

test.describe("accessibility smoke", () => {
  for (const path of auditedPaths) {
    test(`${path} main content has no WCAG A/AA axe violations`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await expectMainHasNoA11yViolations(page);
    });
  }
});

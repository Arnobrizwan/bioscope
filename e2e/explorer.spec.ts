import { expect, test } from "@playwright/test";
import { locationIntelligenceFixture } from "../tests/fixtures/location-intelligence";

test("researcher analyzes an area and sees biodiversity intelligence", async ({
  page,
}) => {
  await page.route("**/api/location-intelligence?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: locationIntelligenceFixture }),
    }),
  );
  await page.goto("/explorer");
  await page.getByRole("button", { name: "Analyze Area" }).click();
  await expect(
    page.getByText("Georeferenced records").locator(".."),
  ).toContainText("3");
  await expect(page.getByText("28.4 °C")).toBeVisible();
  await expect(page.getByText("Anthracoceros malayanus").first()).toBeVisible();
});

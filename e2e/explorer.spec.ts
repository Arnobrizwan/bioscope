import { expect, test } from "@playwright/test";
import { locationIntelligenceFixture } from "../tests/fixtures/location-intelligence";

test("researcher sees automatic biodiversity markers and intelligence", async ({
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
  await expect(page.getByText("3 mappable records")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /occurrence marker/ }),
  ).toHaveCount(3);
  await expect(
    page.getByText("Georeferenced records").locator(".."),
  ).toContainText("3");
  await expect(page.getByText("28.4 °C")).toBeVisible();
  await expect(page.getByText("Anthracoceros malayanus").first()).toBeVisible();
});

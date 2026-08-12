import { expect, test } from "@playwright/test";
import { locationIntelligenceFixture } from "../tests/fixtures/location-intelligence";

test("observation form automatically shows nearby GBIF reference markers", async ({
  page,
}) => {
  await page.route("**/api/occurrences?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          occurrences: locationIntelligenceFixture.biodiversity.occurrences,
          providerCount: 3,
          source: { provider: "GBIF", url: "https://www.gbif.org/" },
        },
      }),
    }),
  );

  await page.goto("/observations/new");
  await expect(
    page.getByText("3 nearby GBIF reference markers within 25 km"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /occurrence marker/ }),
  ).toHaveCount(3);
});

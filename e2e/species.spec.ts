import { expect, test } from "@playwright/test";

test("species search explains and distinguishes normalized GBIF results", async ({
  page,
}) => {
  await page.route("**/api/species?q=**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            key: 5219416,
            scientificName: "Panthera tigris (Linnaeus, 1758)",
            canonicalName: "Panthera tigris",
            vernacularName: "Tiger",
            rank: "SPECIES",
            kingdom: "Animalia",
            class: "Mammalia",
            family: "Felidae",
            isBackbone: true,
          },
          {
            key: 104061174,
            scientificName: "Panthera tigris jacksoni",
            canonicalName: "Panthera tigris jacksoni",
            vernacularName: "Malayan tiger",
            rank: "SUBSPECIES",
            kingdom: "Animalia",
            class: "Mammalia",
            family: "Felidae",
            isBackbone: false,
          },
        ],
      }),
    });
  });

  await page.goto("/species");
  await expect(page.getByText("Rhinoceros hornbill")).toBeVisible();
  await expect(page.getByText("Malayan tapir")).toBeVisible();
  await page.getByRole("button", { name: "Plants" }).click();
  await expect(page.getByText("Red meranti")).toBeVisible();
  await expect(page.getByText("Rhinoceros hornbill")).not.toBeVisible();
  await page.getByRole("button", { name: "All" }).click();
  await expect(
    page.getByText(/prefer accepted GBIF backbone taxa/),
  ).toBeVisible();
  await page.getByLabel("Species name").fill("Panthera tigris");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(
    page.getByText("2 distinct taxonomy matches from GBIF."),
  ).toBeVisible();
  const backbone = page.locator('a[href="/species/5219416"]');
  await expect(backbone).toHaveCount(1);
  await expect(backbone.getByText("GBIF backbone")).toBeVisible();
  await expect(
    page.locator('a[href="/species/104061174"]').getByText("Checklist taxon"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Browse featured species" }).click();
  await expect(page.getByText("Rajah Brooke's birdwing")).toBeVisible();
});

test("live species search selects one accepted backbone taxon", async ({
  page,
}) => {
  test.skip(
    !process.env.LIVE_SPECIES_SMOKE,
    "Runs only when live GBIF integration is explicitly selected.",
  );

  await page.goto("/species");
  await page.getByLabel("Species name").fill("Panthera tigris");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(
    page.getByText(/distinct taxonomy matches from GBIF/),
  ).toBeVisible({
    timeout: 20_000,
  });

  const backbone = page.locator('a[href="/species/5219416"]');
  await expect(backbone).toHaveCount(1);
  await expect(backbone.getByText("GBIF backbone")).toBeVisible();
  await backbone.click();
  await expect(page).toHaveURL(/\/species\/5219416$/);
  await expect(
    page.getByText("Global georeferenced GBIF occurrence records"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "View georeferenced records on GBIF",
    }),
  ).toHaveAttribute("href", /taxon_key=5219416&has_coordinate=true/);
});

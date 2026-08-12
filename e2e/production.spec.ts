import { expect, test } from "@playwright/test";

test.skip(
  !process.env.PRODUCTION_SMOKE,
  "Runs only against an explicitly selected production deployment.",
);

test("production scientific workflows are dynamic and operational", async ({
  page,
  request,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  await expect(health.json()).resolves.toMatchObject({
    status: "ok",
    service: "bioscope",
  });

  await page.goto("/explorer");
  await expect(
    page.getByRole("heading", { name: "Biodiversity Explorer" }),
  ).toBeVisible();
  await expect(page.getByText("Recent meteorological context")).toBeVisible({
    timeout: 45_000,
  });
  await expect(
    page.getByText("Occurrence data: GBIF", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(/mappable records/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /occurrence marker/ }).first(),
  ).toBeVisible();

  await page.goto("/species");
  await page.getByLabel("Species name").fill("Panthera tigris");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/taxonomy matches from GBIF/)).toBeVisible({
    timeout: 20_000,
  });
  const backboneResult = page.locator('a[href="/species/5219416"]');
  await expect(backboneResult).toBeVisible();
  await expect(backboneResult.getByText("GBIF backbone")).toBeVisible();
  await expect(page.locator('a[href="/species/5219416"]')).toHaveCount(1);
  await backboneResult.click();
  await expect(page).toHaveURL(/\/species\/5219416$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Panthera tigris/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Global georeferenced GBIF occurrence records"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View georeferenced records on GBIF" }),
  ).toHaveAttribute("href", /taxon_key=5219416&has_coordinate=true/);

  await page.goto("/observations");
  await expect(page.getByText("Authentication required")).toBeVisible();

  await page.goto("/login");
  await expect(page.getByLabel("Work email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Email me a sign-in link" }),
  ).toBeEnabled();

  expect(pageErrors).toEqual([]);
});

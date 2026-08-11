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
  await page.getByRole("button", { name: "25 km" }).click();
  await page.getByRole("button", { name: "Analyze Area" }).click();
  await expect(page.getByText("Recent meteorological context")).toBeVisible({
    timeout: 45_000,
  });
  await expect(
    page.getByText("Occurrence data: GBIF", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(/mappable records/)).toBeVisible();

  await page.goto("/species");
  await page.getByLabel("Species name").fill("Panthera tigris");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/taxonomy matches from GBIF/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('a[href^="/species/"]').first()).toBeVisible();

  await page.goto("/observations");
  await expect(page.getByText("Authentication required")).toBeVisible();

  await page.goto("/login");
  await expect(page.getByLabel("Work email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Email me a sign-in link" }),
  ).toBeEnabled();

  expect(pageErrors).toEqual([]);
});

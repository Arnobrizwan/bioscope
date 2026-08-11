import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";
import { createClient, type Session } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";

const requiredEnvironment = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const canRun =
  Boolean(process.env.PRODUCTION_AUTH_SMOKE) &&
  requiredEnvironment.every((name) => Boolean(process.env[name]));

test.skip(
  !canRun,
  "Runs only when disposable production-auth credentials are supplied.",
);

test("authenticated researcher can save locations and run a PostGIS nearby query", async ({
  context,
  page,
}) => {
  const url = process.env.SUPABASE_URL!;
  const anonKey = process.env.SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const projectRef = new URL(url).hostname.split(".")[0];
  const unique = randomUUID();
  const email = `bioscope-e2e-${unique}@example.com`;
  const password = `BioScope-${randomUUID()}-9a`;
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const browserAuth = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  let userId: string | undefined;

  try {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    expect(createError).toBeNull();
    userId = created.user?.id;
    expect(userId).toBeTruthy();

    const { data: signedIn, error: signInError } =
      await browserAuth.auth.signInWithPassword({
        email,
        password,
      });
    expect(signInError).toBeNull();
    expect(signedIn.session).toBeTruthy();
    await installSupabaseSession(context, projectRef, signedIn.session!);

    const observationResponse = await context.request.post(
      "/api/observations",
      {
        data: {
          speciesName: "Malayan tapir",
          scientificName: "Tapirus indicus",
          latitude: 3.312,
          longitude: 101.735,
          observedAt: new Date().toISOString(),
          count: 1,
          notes: "Disposable production verification record.",
          evidenceUrl: "",
          isPublic: false,
        },
      },
    );
    expect(observationResponse.status()).toBe(201);
    const observation = (await observationResponse.json()) as {
      data: { id: string; speciesName: string };
    };
    expect(observation.data.speciesName).toBe("Malayan tapir");

    const locationResponse = await context.request.post(
      "/api/saved-locations",
      {
        data: {
          label: "Production verification site",
          latitude: 3.312,
          longitude: 101.735,
          radiusKm: 25,
        },
      },
    );
    expect(locationResponse.status()).toBe(201);

    const nearbyResponse = await context.request.get(
      "/api/observations/nearby?lat=3.312&lng=101.735&radius=5",
    );
    expect(nearbyResponse.ok()).toBe(true);
    const nearby = (await nearbyResponse.json()) as {
      data: Array<{ id: string; distanceKm?: number }>;
    };
    expect(nearby.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: observation.data.id,
          distanceKm: expect.any(Number),
        }),
      ]),
    );

    await page.goto("/dashboard");
    await expect(
      page.getByText("Researcher dashboard", { exact: false }),
    ).toBeVisible();
    await expect(page.getByText("Production verification site")).toBeVisible();

    await page.goto("/observations");
    await expect(page.getByText("Malayan tapir")).toBeVisible();
    await page.getByRole("button", { name: "Search nearby" }).click();
    await expect(
      page.getByText(/observations found within 25 km/),
    ).toBeVisible();
    await expect(page.getByText(/0\.00 km/)).toBeVisible();
  } finally {
    if (userId) {
      await admin.from("saved_locations").delete().eq("user_id", userId);
      await admin.from("field_observations").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

async function installSupabaseSession(
  context: BrowserContext,
  projectRef: string,
  session: Session,
) {
  const storageKey = `sb-${projectRef}-auth-token`;
  const encoded = `base64-${stringToBase64URL(JSON.stringify(session))}`;
  const chunks = createChunks(storageKey, encoded);
  await context.addCookies(
    chunks.map(({ name, value }) => ({
      name,
      value,
      domain: "bioscope-malaysia.fly.dev",
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "Lax" as const,
    })),
  );
}

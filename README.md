# BioScope

BioScope is a production-oriented biodiversity intelligence and field operations prototype. A researcher selects an area in MapLibre, the server concurrently retrieves GBIF occurrence records and recent NASA POWER meteorological data, provider adapters normalize both sources, and the UI presents a single scientifically cautious `LocationIntelligence` model. Authenticated researchers can persist observations as PostGIS geography points and retrieve nearby records with spatial SQL.

## Key capabilities

- MapLibre area selection, draggable marker, radius controls, occurrence clusters, and taxonomic filters
- Bounded, cached GBIF occurrence search plus species taxonomy search and detail pages
- Recent completed-period NASA POWER temperature, precipitation, humidity, and solar context
- Resilient partial-provider results, timeouts, rate limits, Zod validation, and safe error envelopes
- Supabase passwordless authentication, PostgreSQL/PostGIS persistence, spatial functions, indexes, and RLS
- Provider-independent AI interface with constrained structured input and a clearly labeled development-only no-key fallback
- Real-user dashboard values, accessible loading/error/empty states, unit/component/API tests, and Playwright E2E

## Screenshots

Add review screenshots here after running the configured application:

- `docs/screenshots/explorer.png`
- `docs/screenshots/dashboard.png`
- `docs/screenshots/observations.png`

## Architecture

The full diagrams and design rationale are in [docs/architecture.md](docs/architecture.md). The key boundary is:

```text
provider response → provider adapter → normalized domain model → route response → UI
```

This prevents nullable or provider-specific scientific schemas from leaking into React. Persistence follows a separate route → repository → PostGIS function boundary.

## Technology stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, shadcn-style UI primitives, MapLibre GL JS, Recharts, Zod, Supabase Auth/PostgreSQL/PostGIS, Vitest, React Testing Library, Playwright, Docker, and Fly.io.

## External data sources

- [GBIF API](https://techdocs.gbif.org/en/openapi/) for occurrence and taxonomy records
- [NASA POWER](https://power.larc.nasa.gov/docs/services/api/) for gridded daily meteorological parameters

The server proxies and normalizes both sources. Neither requires a browser-side credential.

## Local setup

Requirements: Node.js 20.9+ and npm. A Supabase project is optional for the public Explorer but required for authentication and observations.

```bash
git clone <repository-url> bioscope
cd bioscope
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The public Explorer works without Supabase. Outside production, the field-brief action uses a prominently labeled deterministic demo summary when `AI_API_KEY` is absent; production returns an explicit unavailable response until a real key is configured.

## Environment variables

| Variable                        | Visibility   | Required              | Purpose                             |
| ------------------------------- | ------------ | --------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser-safe | For auth/data         | Supabase project URL                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | For auth/data         | RLS-constrained publishable key     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only  | No current user route | Reserved admin operations           |
| `AI_API_KEY`                    | Server only  | Optional              | OpenAI-compatible API key           |
| `AI_MODEL`                      | Server only  | Optional              | Defaults to `gpt-4o-mini`           |
| `AI_BASE_URL`                   | Server only  | Optional              | Compatible `/chat/completions` base |

Never prefix AI or service-role secrets with `NEXT_PUBLIC_`.

## Database and Supabase setup

1. Create a Supabase project and install the Supabase CLI.
2. Link the local directory: `npx supabase link --project-ref <project-ref>`.
3. Apply [the migration](supabase/migrations/202608100001_bioscope_schema.sql): `npx supabase db push`.
4. In Authentication URL Configuration, set the site URL to your local or deployed URL and allow `/auth/callback`.
5. Fill in the public URL and anon key in `.env.local`.

The migration enables PostGIS; creates profiles, observations, saved locations, and field briefs; creates GIST and user/time indexes; enables RLS; and installs `create_field_observation` and `nearby_field_observations`. Nearby queries use `ST_DWithin` in meters and sort using `ST_Distance`.

After creating a local Auth user, apply the optional repeatable technical-demo dataset with `npx supabase db push --include-seed`. Seed records are attached to the newest non-test user and are visibly labeled as synthetic Demo data in the UI.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

Third-party scientific endpoints are mocked in automated workflows. Unit tests cover coordinate/radius and observation validation, GBIF/NASA normalization, taxonomic classification, species deduplication, provider degradation, and AI input/fallback behavior.

Production verification is intentionally opt-in. `npm run test:e2e:production` exercises live public scientific workflows. `npm run test:e2e:auth-production` additionally requires temporary admin test credentials supplied through the shell; it creates and removes a disposable user while validating protected persistence and the PostGIS nearby query.

## Deployment to Fly.io

BioScope ships as a minimal non-root Next.js standalone container. The Fly configuration uses Singapore (`sin`) as the primary region, HTTPS-only ingress, health checks, and automatic machine start/stop for a cost-conscious technical demo.

The current public technical demonstration is available at [bioscope-malaysia.fly.dev](https://bioscope-malaysia.fly.dev).

```bash
flyctl auth login
flyctl launch --no-deploy --copy-config --name bioscope-malaysia --region sin
flyctl deploy
flyctl status
```

For Supabase authentication, the two `NEXT_PUBLIC_` values must be provided while building because Next.js compiles them into the browser bundle:

```bash
flyctl deploy \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Set server-only AI configuration through Fly secrets, then redeploy:

```bash
flyctl secrets set AI_API_KEY=... AI_MODEL=gpt-4o-mini
```

Add `https://bioscope-malaysia.fly.dev/auth/callback` to the Supabase allowed redirect URLs before testing passwordless sign-in. Apply the Supabase migration before enabling observation workflows.

No service-role or LLM secret is sent to the browser. External requests execute in Node.js route handlers and services.

## Security decisions

- Verified server identity (`auth.getUser`), ownership RLS, and no trusted browser `user_id`
- Zod validation at every API boundary and controlled error messages without stack traces
- External service and LLM timeouts, bounded payloads, and sensitive endpoint rate limiting
- AI inputs are compact structured data; system instructions treat strings as data and prohibit unsupported conclusions
- Evidence input is URL-only in this prototype, avoiding an unsafe partial upload implementation
- In-memory rate limiting is intentionally documented as single-instance protection

## Data limitations

The 200-record GBIF cap controls raw cache size, API payload, and map performance. The query uses a 32-segment geodesic search polygon approximating the selected radius; aggregate pagination remains a future refinement. NASA POWER values are recent daily gridded product averages, not real-time sensor readings. The supplied public demo map style should be replaced by an operational tile provider with an appropriate SLA before production use.

## Scientific Data Disclaimer

GBIF occurrence data represents recorded observations, not exhaustive population or abundance data. Records can contain geographic, temporal, taxonomic, and sampling bias; no returned records does not establish species absence. NASA environmental values depend on the selected POWER product, grid, parameters, and completed time period and are not real-time site measurements. AI-assisted summaries are decision-support aids, not scientific conclusions, and must be reviewed by qualified researchers. BioScope does not infer formal conservation status from GBIF occurrence records.

## Future improvements

- Shared Redis-backed rate limiting and observability for multi-region production
- Exact circular GBIF querying with server-side pagination and aggregate caching
- Persisted generated field briefs and an authenticated activity timeline
- Managed evidence uploads with MIME, size, malware, and signed-URL controls
- A verified conservation-status provider kept separate from occurrence evidence
- Offline-capable field capture and synchronization conflict handling

# Censio Multi-Client GHL Dashboard

Multi-tenant marketing dashboard for Censio clients. Each client has GHL credentials, three pipeline slots (new leads / sales / optional after-sales), and synced snapshot data. Clients view the dashboard inside GHL via iframe + SSO; Censio staff manage accounts from the admin hub.

Production: https://cenhub-dashboard.vercel.app/

## Routes

| URL | Who | Purpose |
|-----|-----|---------|
| `/` | Client (GHL iframe) | Dashboard — tenant from GHL SSO (`location_id`) |
| `/admin` | Censio admin | Client hub — card grid, add client, sync all |
| `/{client_id}` | Censio admin | Setup wizard — credentials, pipeline slots, preview |
| `/?client=slug` | Dev / preview only | Local testing with admin key — not for GHL menu links |

Health check: `GET /api/health` returns DB + KV status (200 ok / 503 degraded).

## Quick start (local)

1. Copy env template and fill in values:

```bash
cp .env.example .env
```

2. Install and seed SunTech (uses file store at `.data/multi-tenant-store.json` when `DATABASE_URL` is unset):

```bash
npm install
npm run seed:suntech
npm start
```

3. Open:

- Admin hub: http://localhost:3000/admin
- SunTech setup: http://localhost:3000/suntech-nordic
- Client preview: http://localhost:3000/?client=suntech-nordic

## Environment variables

See `.env.example` for the full list. Key vars:

| Variable | Purpose |
|----------|---------|
| `CENHUB_PRIVATE_INTEGRATION_TOKEN` | GHL token (seed + legacy fallback) |
| `DASHBOARD_ADMIN_API_KEY` | Protects `/api/clients` writes and admin list |
| `ACCOUNT_CONFIG_ENCRYPTION_KEY` | Encrypts stored GHL tokens (optional locally — plaintext fallback in file store) |
| `DATABASE_URL` | Neon Postgres (optional — file fallback if unset) |
| `DASHBOARD_READ_SOURCE` | `live` (default) or `snapshot` (debug only) |
| `DASHBOARD_CACHE_TTL_MINUTES` | Short server buffer so filter clicks don’t re-hit GHL (default `2`) |
| `GHL_SSO_SHARED_SECRET` | GHL marketplace app SSO validation |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Daily cron sync (optional — manual sync works without) |
| `DASHBOARD_ACCESS_KEY_SECRET` | Enables per-client access keys for read APIs (see below) |
| `REQUIRE_CLIENT_ACCESS_KEY` | Set `1` to enforce access keys on `/api/dashboard` and Facebook metrics GET |

## Per-client access keys (optional hardening)

By default the client dashboard and its read APIs are public to anyone who knows a client slug. To lock them down:

1. Set `DASHBOARD_ACCESS_KEY_SECRET` to a strong random string and deploy.
2. Fetch each client's key: `GET /api/clients/{slug}` (admin) returns `accessKey` and a ready-to-share `clientUrl` like `/{slug}?key=abc123...`.
3. Update GHL menu links / bookmarks to the key-based URLs.
4. Set `REQUIRE_CLIENT_ACCESS_KEY=1` and redeploy. Requests without a valid key (or admin `x-api-key`) get 403.

Keys are HMAC-derived from the secret, so rotating `DASHBOARD_ACCESS_KEY_SECRET` rotates every client key at once.

## Testing

```bash
npm test        # unit tests + lib/public sync check (also runs in GitHub Actions CI)
npm run test:api  # integration test against live env (needs GHL token or snapshot)
```

## Onboarding a new client

1. Open `/admin` and enter your admin API key (stored in browser localStorage).
2. Click **Add client** — pick an available slug (e.g. `scantherm`). You are redirected to `/{slug}` setup.
3. Go to `/{slug}` setup:
   - **Step 1 · Metrics model** — choose Simple (all won opps) or Funnel + deduplication (pick win pipeline, e.g. Eftersalg)
   - Paste GHL private integration token + location ID
   - **Fetch pipelines** → assign New leads, Sales, After-sales (optional for dedupe clients)
   - **Save** → **Sync now** (locks metrics model after first successful sync)
4. Click **View as client** to verify KPIs match expectations.
5. Mark **Ready for GHL** when satisfied.
6. In GHL sub-account: add custom menu iframe pointing to the shared root URL (`https://cenhub-dashboard.vercel.app/`). SSO resolves the client by `location_id`.

SunTech slug stays **`suntech-nordic`** for Make.com / Facebook metrics compatibility.

## Metrics model

Each client chooses how **clients won**, **revenue**, **Bundlinje**, **ROAS**, and **won-revenue charts** are calculated:

| Mode | Dedupe | Win source |
|------|--------|------------|
| **Simple** | Off | All `status=won` opportunities |
| **Funnel + deduplication** | On | Single win pipeline (required) |

- Set on first visit to `/{slug}` (required before sync).
- **Locked after first successful sync** — change only via **Change metrics model** (confirm slug + acknowledge impact).
- Postgres: run `db/migrate-metrics-model.sql` on existing databases.

API: `POST /api/clients/:clientId/metrics-model` with `{ dedupeEnabled, winPipelineId }` (plus `confirmSlug` + `acknowledgeImpact` when locked).

## Sync

- **Manual:** Admin hub **Sync now** or `POST /api/clients/:clientId/sync` (staff session).
- **Bulk:** `POST /api/clients` with `{ "action": "sync-all" }`. When Inngest is configured, this queues one background job per client and returns immediately (`202`). Without Inngest, it falls back to sequential sync in the same request.
- **Scheduled:** Inngest daily cron at 03:00 Europe/Copenhagen fans out the same per-client jobs when Inngest keys are set. Until then, `/api/inngest` returns 503 with instructions.

Every sync attempt is logged to `sync_runs`. Failures surface as `sync_error` on hub cards.

## Pipeline slots

| Slot | Required | Metrics |
|------|----------|---------|
| New leads | Yes | Total leads (period), CPL denominator |
| Sales | Yes | Open pipeline value; wins if no after-sales |
| After-sales | No | Revenue, clients won, Bundlinje, POAS |

When after-sales is set, dedupe pairs funnel + sales opportunities with after-sales wins by `contactId`. Win KPIs follow the account **metrics model** (`lib/metrics-model.js`).

## Data flow (simplified)

One client, low traffic — dashboard always reads **live GHL**, with a small buffer so clicking filters doesn’t hammer the API.

```
Open dashboard / refresh after 1+ min  →  GHL live (fresh leads)
Click filters within 1 min             →  same data, new filters only (fast)
GHL down                               →  last Neon sync (fallback)
Admin Sync now                         →  updates Neon backup
```

| When | What happens |
|------|----------------|
| First open / browser refresh | GHL live |
| Click preset or filter **within 1 min** | Reuses recent GHL data (fast) |
| Click preset or filter **after 1 min** | GHL live again |
| Tab hidden then visible after 1 min | Background GHL refresh |
| Every 2 min while page is open | Background GHL refresh |
| GHL error | Neon snapshot fallback |

Neon is for **admin config, tokens, and backup** — not the normal read path.

Optional env (defaults are fine for SunTech):

```
DASHBOARD_CACHE_TTL_MINUTES=2
```

Remove `DASHBOARD_READ_SOURCE=live` if you added it for testing — live is already the default.

## Facebook metrics (temporary)

Ad spend still flows Make.com → Vercel KV per `facebook_client_id`. End state is Postgres alongside GHL snapshots after Meta verification.

## Tests

```bash
npm run test:pipeline-slots
npm run test:metrics-model
npm run test:sync
npm run test:dedupe
npm run test:facebook-metrics
npm run test:api          # uses suntech-nordic snapshot; may hit GHL if no snapshot
npm run test:ghl-sso
```

Set `TEST_CLIENT_ID=other-slug` to point `test:api` at another account.

## Deploy (Vercel)

1. Connect repo to Vercel.
2. Set env vars from `.env.example` (at minimum: admin key, encryption key, `DATABASE_URL` for production).
3. Run `npm run seed:suntech` once against production DB (or migrate account via admin UI).
4. GHL iframe URL for all clients: `https://your-deployment.vercel.app/`

## Project layout

| Path | Role |
|------|------|
| `index.html` | Client dashboard + admin hub + setup UI |
| `lib/dashboard-data.js` | KPI aggregation from snapshots |
| `lib/account-store.js` | Account CRUD + encryption |
| `lib/ghl-sync.js` | GHL fetch + retries |
| `lib/sync-service.js` | Snapshot upsert + sync_runs |
| `lib/metrics-model.js` | Win/revenue resolution (simple vs dedupe + win pipeline) |
| `lib/pipeline-slots.js` | 3-slot pipeline mapping |
| `api/clients.js` | Admin CRUD + sync |
| `api/dashboard.js` | Dashboard JSON API |
| `api/ghl-sso.js` | GHL iframe SSO |
| `api/inngest.js` | Inngest handler |
| `db/schema.sql` | Postgres schema |
| `scripts/seed-suntech.js` | Seed SunTech Nordic |

## Slug rules

- Lowercase `a-z`, digits, hyphens; 2–32 chars; unique.
- Reserved: `admin`, `api`, `lib`, `dashboard`, etc.
- Immutable after create in v1 — create a new client to rename.

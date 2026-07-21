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
| `DASHBOARD_READ_SOURCE` | Production auto-uses `snapshot`; rollback needs `live` + `DASHBOARD_LIVE_ROLLBACK=1` |
| `DASHBOARD_CACHE_TTL_MINUTES` | Short server buffer for live mode filter clicks (default `2`) |
| `GHL_WEBHOOK_ENABLED` | Force webhooks on locally; production enables automatically unless `GHL_WEBHOOK_DISABLED=1` |
| `GHL_WEBHOOK_DISABLED` | Set `1` to disable webhook processing in production |
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
- **Scheduled:** Vercel daily cron at **01:00 UTC** (~3:00 Copenhagen in DST) syncs all GHL snapshots via `/api/ghl-sync-cron` (same pattern as Meta at 04:00 UTC). Requires `CRON_SECRET`. Inngest remains available for manual **Sync all** queueing and webhook workers.
- **Webhooks:** GHL opportunity events hit `POST /api/ghl-webhook` (enabled in production by default). In GHL marketplace, set webhook URL to `https://cenhub-dashboard.vercel.app/api/ghl-webhook` and subscribe to **Opportunity Create / Update / Delete / Status Update**. Verify with `GET /api/ghl-webhook` or `npm run preflight:ghl`. When Inngest is configured, webhooks queue per location; otherwise they process inline. Webhook merges defer while a full sync is running (`sync_status=syncing`).

Every sync attempt is logged to `sync_runs`. Failures surface as `sync_error` on hub cards.

## Pipeline slots

| Slot | Required | Metrics |
|------|----------|---------|
| New leads | Yes | Total leads (period), CPL denominator |
| Sales | Yes | Open pipeline value; wins if no after-sales |
| After-sales | No | Revenue, clients won, Bundlinje, POAS |

When after-sales is set, dedupe pairs funnel + sales opportunities with after-sales wins by `contactId`. Win KPIs follow the account **metrics model** (`lib/metrics-model.js`).

## Data flow (production)

Production reads **Neon snapshots** for fast dashboard loads. GHL webhooks patch individual opportunities near-real-time; daily Inngest sync at 03:00 Copenhagen is the safety net.

```
GHL opportunity change  →  POST /api/ghl-webhook  →  verify + dedupe  →  Inngest worker
  →  GET /opportunities/:id  →  merge into sync_snapshots (Neon)
Dashboard GET /api/dashboard  →  read snapshot only (production)
Daily 3am Vercel cron  →  full syncAccount  →  sync_snapshots
Admin Sync now  →  full sync override
```

| When | What happens |
|------|----------------|
| Open dashboard / filter change | Neon snapshot (fast) |
| GHL webhook (enabled) | Single opportunity merged into snapshot |
| Admin **Sync now** | Full GHL pull → Neon snapshot |
| Daily 03:00 Copenhagen | Full sync all clients (Inngest) |
| Every 2 min while page open | Background snapshot re-read (no live GHL) |

**Rollback:** set `DASHBOARD_READ_SOURCE=live` and `DASHBOARD_LIVE_ROLLBACK=1` on Vercel to revert reads without redeploying.

### GHL webhook setup

1. Run `npm run migrate:ghl-webhooks` on Neon (creates `ghl_webhook_events`).
2. Deploy with `/api/ghl-webhook` live.
3. In GHL marketplace app: webhook URL `https://cenhub-dashboard.vercel.app/api/ghl-webhook`, subscribe to opportunity create/update/delete events.
4. Set `GHL_WEBHOOK_ENABLED=1` on production after the endpoint responds 200.

Local dev defaults to **live GHL** reads (`DASHBOARD_READ_SOURCE=live` unless overridden).

Optional env:

```
DASHBOARD_CACHE_TTL_MINUTES=2
GHL_WEBHOOK_ENABLED=1
```

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

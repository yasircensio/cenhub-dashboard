# SunTech Nordic Cenhub Dashboard

This widget loads opportunity totals from the two configured Cenhub pipelines and displays them as a dashboard that can be embedded in Cenhub with a custom iframe.

## Files

- `index.html` is the iframe dashboard.
- `api/dashboard.js` is the serverless API proxy that calls the Cenhub API, handles pagination, and calculates totals.
- `.env.example` shows the required environment variable name.

## Environment Variable

Set this in Vercel project settings:

```bash
CENHUB_PRIVATE_INTEGRATION_TOKEN=your_rotated_private_integration_token
```

The private integration token must not be pasted into `index.html` or committed to git.

## Deploy

1. Rotate the private integration token in Cenhub because any token pasted into chat should be treated as exposed.
2. Create a Vercel project from this folder.
3. Add `CENHUB_PRIVATE_INTEGRATION_TOKEN` in Vercel's environment variables.
4. Deploy.
5. Use the Vercel URL in Cenhub as a custom iframe dashboard widget.

## Local Test (no deploy needed)

1. Copy the env template and add your token:

```bash
cp .env.example .env
```

2. Install and test:

```bash
npm install
npm run test:api
npm start
```

Open `http://localhost:3000` for the full filterable dashboard.

Optional ad spend default for CPL/ROAS:

```bash
CENHUB_AD_SPEND=45190
```

## Dashboard Features

The dashboard supports filters similar to the built-in Cenhub dashboard:

- Pipeline (all pipelines, Salg Pipeline, Nye leads Pipeline, etc.)
- Status (open, won, lost, abandoned)
- Source (facebook, suntech-battery-funnel, etc.)
- Assignee
- Date range presets: till date, this month, this year, custom
- Date field: created, updated, or status change date

Metrics shown:

- Total revenue (won)
- Clients won
- Total leads
- Total leads value
- Average lead value
- Conversion rate
- Total bundlinje
- Weekly won revenue chart
- Lead source report
- Leads closed by assignee
- Pipeline breakdown

Display options:

- Choose which KPI cards to show
- Choose which sections and charts to show
- Choose which status items to show
- Choose which table columns to show in each report
- Selections are saved automatically in your browser

Manual metrics:

- Ad spend, cost per lead, and ROAS require manual ad spend input because Cenhub does not expose ad cost through the opportunities API.

## Facebook metrics API (Make.com)

Receives Facebook ad data from Make.com and stores it for the dashboard.

### Files

- `api/facebook-metrics.js` — Vercel serverless endpoint
- `lib/facebook-metrics-handler.js` — POST/GET logic
- `lib/facebook-metrics-store.js` — Vercel KV in production, local `.data/` file fallback

### Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| `POST` | `/api/facebook-metrics` | Make.com sends metrics (requires `x-api-key` header) |
| `GET` | `/api/facebook-metrics` | List all clients |
| `GET` | `/api/facebook-metrics?client=suntech-nordic` | One client's metrics |

### Vercel setup

1. **Storage** → Create **KV** or **Upstash Redis** → Connect to project
2. **Environment variables:**
   - `MAKE_WEBHOOK_SECRET` — same secret Make.com sends in `x-api-key` header
3. Redeploy

### Make.com HTTP module

- **URL:** `https://cenhub-dashboard.vercel.app/api/facebook-metrics`
- **Method:** POST
- **Header:** `x-api-key: YOUR_MAKE_WEBHOOK_SECRET`
- **Body:** JSON with `client_id`, `yearly`, `this_month`, `last_month`

### Local test

```bash
npm run test:facebook-metrics
npm start
curl http://localhost:3000/api/facebook-metrics
curl "http://localhost:3000/api/facebook-metrics?client=suntech-nordic"
```

## Vercel Local Test

If you prefer Vercel's local runtime instead:

```bash
npx vercel dev
```

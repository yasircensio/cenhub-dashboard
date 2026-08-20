# Google Ads setup (CenHub)

Step-by-step guide to connect Google Ads reporting alongside Meta.

---

## Production URLs (use these in Google Cloud)

**Authorized redirect URI** — add in Google Cloud → OAuth client:

```
https://analytics.censio.dk/api/google-ads/oauth/callback
```

Optional second URI if you also use the Vercel URL:

```
https://cenhub-dashboard.vercel.app/api/google-ads/oauth/callback
```

**Start OAuth in production** (after env vars are set and you are logged into admin):

```
https://analytics.censio.dk/api/google-ads/oauth/start
```

---

## Step 1 — Developer token

In [Google Ads API Center](https://ads.google.com/aw/apicenter) → **View token**.

Censio customer ID: **910-326-8801** → API format **9103268801**.

---

## Step 2 — Google Cloud OAuth client

Project: `cenhub-google-ads`

1. Enable **Google Ads API**
2. OAuth consent screen (Internal for @censio.dk Workspace)
3. Create **Web application** OAuth client
4. Redirect URI: `https://analytics.censio.dk/api/google-ads/oauth/callback`

---

## Step 3 — Vercel environment variables

Vercel → your project → **Settings → Environment Variables**

Add each variable for **Production** (and Preview if you test there):

| Variable | Required when | Where to get it |
|----------|---------------|-----------------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | OAuth + API calls | Google Ads → API Center → View token |
| `GOOGLE_ADS_CLIENT_ID` | OAuth + API calls | Google Cloud → Credentials → OAuth client |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth + API calls | Same OAuth client |
| `GOOGLE_ADS_OAUTH_REDIRECT_URI` | OAuth flow | `https://analytics.censio.dk/api/google-ads/oauth/callback` |
| `GOOGLE_ADS_REFRESH_TOKEN` | API calls (after OAuth) | From prod OAuth start URL (Step 4) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Optional | MCC id (10 digits) if querying via manager |
| `GOOGLE_ADS_TEST_CUSTOMER_ID` | Optional | Default test customer, e.g. `9103268801` |
| `GOOGLE_ADS_API_VERSION` | Optional | Default `v18` |

**Add in this order:**

1. `GOOGLE_ADS_DEVELOPER_TOKEN`
2. `GOOGLE_ADS_CLIENT_ID`
3. `GOOGLE_ADS_CLIENT_SECRET`
4. `GOOGLE_ADS_OAUTH_REDIRECT_URI`
5. **Redeploy** (Deployments → … → Redeploy)
6. Open OAuth start (Step 4) → copy refresh token
7. Add `GOOGLE_ADS_REFRESH_TOKEN`
8. **Redeploy again**

Do not paste tokens in chat or commit them to git.

---

## Step 4 — Get refresh token (production)

1. Log into https://analytics.censio.dk/admin
2. Open https://analytics.censio.dk/api/google-ads/oauth/start
3. Sign in as `marketing@censio.dk` and approve Google Ads access
4. Copy `GOOGLE_ADS_REFRESH_TOKEN=...` from the success page
5. Paste into Vercel env vars → Redeploy

Local alternative (optional):

```bash
npm run google-ads:oauth
```

Uses `http://localhost:3333/oauth2callback` — only if that URI is also in Google Cloud.

---

## Step 5 — Test metrics

After refresh token is in Vercel and redeployed, run locally with the same env values in `.env`:

```bash
npm run test:google-ads
```

Or:

```bash
node scripts/test-google-ads-insights.js 9103268801
```

---

## Step 6 — Wire into CenHub UI (later)

Mirror Meta: per-client `googleAdsCustomerId`, cron sync, DB columns, report tables.

---

## Quota

Explorer Access ≈ 2,880 ops/day — plenty for 5–10 clients on 6-hour sync.

---

## npm scripts

```bash
npm run google-ads:oauth    # Local OAuth (optional)
npm run test:google-ads     # Test GAQL query
```

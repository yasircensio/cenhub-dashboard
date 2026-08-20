# Google Ads setup (CenHub)

---

## Production URLs (use these)

| Step | URL |
|------|-----|
| **Start OAuth** (logged into admin first) | https://analytics.censio.dk/api/auth/google-ads/start |
| **Redirect URI** (Google Cloud + Vercel) | https://analytics.censio.dk/api/auth/google-ads/callback |

---

## Vercel environment variables

Settings → Environment Variables → **Production**:

| Variable | Value |
|----------|--------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | API Center → View token |
| `GOOGLE_ADS_CLIENT_ID` | OAuth client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_ADS_OAUTH_REDIRECT_URI` | `https://analytics.censio.dk/api/auth/google-ads/callback` |
| `GOOGLE_ADS_REFRESH_TOKEN` | After OAuth (step below) |

Redeploy after adding or changing vars.

---

## Google Cloud OAuth client

**Authorized redirect URIs:**

```
https://analytics.censio.dk/api/auth/google-ads/callback
```

**Authorized JavaScript origins** (domain only, no path):

```
https://analytics.censio.dk
```

---

## Get refresh token

1. Log into https://analytics.censio.dk/admin
2. Open https://analytics.censio.dk/api/auth/google-ads/start
3. Sign in as `marketing@censio.dk` → approve Google Ads access
4. Copy `GOOGLE_ADS_REFRESH_TOKEN` from the success page
5. Add to Vercel → redeploy

---

## Test

```bash
npm run test:google-ads
```

Censio customer ID: `9103268801` (from `910-326-8801`).

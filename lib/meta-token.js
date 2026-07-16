const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';

function normalizeMetaAccessToken(value) {
  let token = String(value || '').trim();
  if (!token) return '';
  if (
    (token.startsWith('"') && token.endsWith('"'))
    || (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  const urlTokenMatch = token.match(/(?:^|[?&])access_token=([^&]+)/i);
  if (urlTokenMatch) {
    try {
      token = decodeURIComponent(urlTokenMatch[1]);
    } catch {
      token = urlTokenMatch[1];
    }
  }
  return token.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '');
}

function validateMetaAccessToken(token) {
  const normalized = normalizeMetaAccessToken(token);
  if (!normalized) {
    return { ok: false, reason: 'Missing Meta system user access token.' };
  }
  if (/^\d{8,20}$/.test(normalized)) {
    return {
      ok: false,
      reason: 'This looks like a Meta App ID or Ad Account ID, not an access token. Use the long System User token from Business Settings (starts with EAA…).',
    };
  }
  if (/^\d+\|/.test(normalized)) {
    return {
      ok: false,
      reason: 'This looks like an App access token (app_id|app_secret). Use a System User user access token instead.',
    };
  }
  if (normalized.length < 40) {
    return {
      ok: false,
      reason: 'Meta access token is too short. Paste the full System User token from Business Settings.',
    };
  }
  if (!/^EAA/i.test(normalized)) {
    return {
      ok: false,
      reason: 'Meta System User token should start with EAA…. Paste the token from Business Settings → System Users (not App ID, Ad Account ID, or app secret).',
    };
  }
  return { ok: true, token: normalized };
}

function tokenHint(token) {
  const normalized = normalizeMetaAccessToken(token);
  if (!normalized) return null;
  if (normalized.length <= 8) return '***';
  return `${normalized.slice(0, 3)}…${normalized.slice(-4)} (${normalized.length} chars)`;
}

function parseGraphError(body, statusCode) {
  const message = body?.error?.message || body?.error?.error_user_msg || `Graph API HTTP ${statusCode}`;
  const code = body?.error?.code;
  if (code === 190) return new Error(`Meta access token invalid or expired: ${message}`);
  if (/active access token must be used/i.test(message)) {
    return new Error(
      'Meta access token is missing or inactive. Check META_SYSTEM_USER_TOKEN on Vercel (full System User token, no quotes), redeploy, and leave the admin token override blank.',
    );
  }
  if (code === 200 && /valid app id/i.test(message)) {
    return new Error(
      'Meta rejected the access token (#200 Provide valid app ID). '
      + 'Confirm META_SYSTEM_USER_TOKEN on Vercel is the System User token for the Cenhub Connection app (not App ID / Ad Account ID). '
      + 'If you saved a token override in admin, clear it and use the env token only.',
    );
  }
  if (code === 100 || code === 803) return new Error(`Meta ad account not accessible: ${message}`);
  if (code === 4 || code === 17 || code === 32) return new Error(`Meta rate limit: ${message}`);
  return new Error(message);
}

async function graphFetch(url, accessToken) {
  const token = normalizeMetaAccessToken(accessToken);
  if (!token) {
    throw new Error('Missing Meta access token on Graph API request.');
  }

  let fullUrl;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else {
    const separator = url.includes('?') ? '&' : '?';
    fullUrl = `${url}${separator}access_token=${encodeURIComponent(token)}`;
  }

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    throw parseGraphError(body, response.status);
  }
  return body;
}

async function verifyMetaAccessToken(accessToken, { adAccountId } = {}) {
  const check = validateMetaAccessToken(accessToken);
  if (!check.ok) return check;

  const normalizedAdAccountId = String(adAccountId || '').trim().replace(/^act_/i, '');
  if (!normalizedAdAccountId) {
    return { ok: true, token: check.token };
  }

  // System User tokens do not support /me/adaccounts — probe the configured ad account instead.
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/act_${normalizedAdAccountId}?fields=account_id,name`;
  try {
    await graphFetch(url, check.token);
    return { ok: true, token: check.token };
  } catch (error) {
    return {
      ok: false,
      reason: error.message || 'Meta token verification failed.',
      token: check.token,
    };
  }
}

function resolveMetaAccessToken(account) {
  const accountToken = normalizeMetaAccessToken(account?.metaSystemUserToken);
  const envToken = normalizeMetaAccessToken(process.env.META_SYSTEM_USER_TOKEN || '');

  const envCheck = envToken ? validateMetaAccessToken(envToken) : { ok: false };
  if (envCheck.ok) {
    return {
      token: envCheck.token,
      source: 'env',
      hint: tokenHint(envCheck.token),
      ignoredAccountOverride: Boolean(accountToken),
      accountOverrideIssue: accountToken && !validateMetaAccessToken(accountToken).ok
        ? validateMetaAccessToken(accountToken).reason
        : null,
    };
  }

  const accountCheck = accountToken ? validateMetaAccessToken(accountToken) : { ok: false };
  if (accountCheck.ok) {
    return {
      token: accountCheck.token,
      source: 'account',
      hint: tokenHint(accountCheck.token),
      envIssue: envToken ? envCheck.reason : null,
    };
  }

  return {
    token: '',
    source: 'none',
    hint: null,
    reason: envCheck.reason || accountCheck.reason || 'Missing Meta system user token (set META_SYSTEM_USER_TOKEN or per-client override).',
    ignoredAccountOverride: Boolean(accountToken),
  };
}

module.exports = {
  GRAPH_VERSION,
  graphFetch,
  normalizeMetaAccessToken,
  parseGraphError,
  resolveMetaAccessToken,
  tokenHint,
  validateMetaAccessToken,
  verifyMetaAccessToken,
};

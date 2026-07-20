const { query, usePostgres } = require('./db');
const { useKv } = require('./facebook-metrics-store');

async function checkDatabase() {
  if (!usePostgres()) return { configured: false };
  try {
    await query`SELECT 1`;
    return { configured: true, ok: true };
  } catch (error) {
    return { configured: true, ok: false, error: error.message };
  }
}

async function checkKv() {
  if (!useKv()) return { configured: false };
  try {
    const { kv } = require('@vercel/kv');
    await kv.get('health_check');
    return { configured: true, ok: true };
  } catch (error) {
    return { configured: true, ok: false, error: error.message };
  }
}

async function checkMetaSyncHistory() {
  if (!usePostgres()) return { configured: false };
  try {
    const rows = await query`
      SELECT count(*)::int AS total, max(started_at) AS last_run_at
      FROM meta_sync_runs
    `;
    const row = rows[0] || {};
    return {
      configured: true,
      ok: true,
      total: row.total ?? 0,
      lastRunAt: row.last_run_at || null,
    };
  } catch (error) {
    return { configured: true, ok: false, error: error.message };
  }
}

async function checkMetaSyncClients() {
  if (!usePostgres()) return { configured: false };
  try {
    const rows = await query`
      SELECT client_id, meta_last_synced_at, meta_sync_status
      FROM accounts
      WHERE meta_ad_account_id IS NOT NULL AND meta_ad_account_id <> ''
      ORDER BY client_id
    `;
    const now = Date.now();
    const staleHours = 36;
    const clients = rows.map((row) => {
      const lastSyncedAt = row.meta_last_synced_at || null;
      const ageMs = lastSyncedAt ? now - new Date(lastSyncedAt).getTime() : null;
      const stale = ageMs == null || ageMs > staleHours * 60 * 60 * 1000;
      return {
        clientId: row.client_id,
        lastSyncedAt,
        status: row.meta_sync_status || null,
        stale,
        ageHours: ageMs != null ? Math.round(ageMs / (60 * 60 * 1000)) : null,
      };
    });
    const allFresh = clients.length > 0 && clients.every((row) => !row.stale);
    return {
      configured: true,
      ok: allFresh,
      schedule: '0 4 * * * UTC (Vercel Hobby daily cron → /api/meta-sync-cron)',
      cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      clients,
    };
  } catch (error) {
    return { configured: true, ok: false, error: error.message };
  }
}

async function handleHealthRequest(response) {
  const [database, kv, metaSyncHistory, metaSync] = await Promise.all([
    checkDatabase(),
    checkKv(),
    checkMetaSyncHistory(),
    checkMetaSyncClients(),
  ]);
  const healthy = (database.configured ? database.ok : true)
    && (kv.configured ? kv.ok : true)
    && (metaSync.configured ? metaSync.ok : true);

  response.setHeader('Cache-Control', 'no-store');
  response.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    env: process.env.VERCEL_ENV || null,
    checks: { database, kv, metaSyncHistory, metaSync },
  });
}

module.exports = { handleHealthRequest };

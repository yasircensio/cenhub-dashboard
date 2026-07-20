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

async function handleHealthRequest(response) {
  const [database, kv, metaSyncHistory] = await Promise.all([
    checkDatabase(),
    checkKv(),
    checkMetaSyncHistory(),
  ]);
  const healthy = (database.configured ? database.ok : true)
    && (kv.configured ? kv.ok : true);

  response.setHeader('Cache-Control', 'no-store');
  response.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    env: process.env.VERCEL_ENV || null,
    checks: { database, kv, metaSyncHistory },
  });
}

module.exports = { handleHealthRequest };

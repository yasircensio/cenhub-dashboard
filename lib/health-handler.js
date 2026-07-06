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

async function handleHealthRequest(response) {
  const [database, kv] = await Promise.all([checkDatabase(), checkKv()]);
  const healthy = (database.configured ? database.ok : true)
    && (kv.configured ? kv.ok : true);

  response.setHeader('Cache-Control', 'no-store');
  response.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: { database, kv },
  });
}

module.exports = { handleHealthRequest };

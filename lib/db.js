const { neon } = require('@neondatabase/serverless');

let sqlClient = null;

function usePostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!usePostgres()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

function isRetryableDbError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return /fetch failed|econnreset|etimedout|timeout|503|502|504|connection|socket|network|neon/.test(message);
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function query(strings, ...values) {
  const sql = getSql();
  const maxAttempts = 4;
  let lastError = null;

  // #region agent log (debug session b952dc, hypotheses H1-H3: per-query latency + retry behavior)
  const __dbgLabel = Array.isArray(strings) ? strings.join('?').replace(/\s+/g, ' ').trim().slice(0, 80) : 'unknown';
  const __dbgStart = Date.now();
  // #endregion agent log

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const __dbgAttemptStart = Date.now();
      const result = await sql(strings, ...values);
      // #region agent log (debug session b952dc, hypotheses H1-H3)
      if (Array.isArray(global.__cvDebugTiming)) {
        global.__cvDebugTiming.push({
          label: __dbgLabel,
          attempt,
          ms: Date.now() - __dbgAttemptStart,
          totalMsSinceFirstAttempt: Date.now() - __dbgStart,
        });
      }
      // #endregion agent log
      return result;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableDbError(error);
      // #region agent log (debug session b952dc, hypothesis H3: retries)
      if (Array.isArray(global.__cvDebugTiming)) {
        global.__cvDebugTiming.push({
          label: __dbgLabel,
          attempt,
          ms: Date.now() - __dbgStart,
          error: String(error?.message || error),
          retryable,
        });
      }
      // #endregion agent log
      if (!retryable || attempt >= maxAttempts) {
        throw error;
      }
      await sleepMs(250 * attempt);
    }
  }

  throw lastError || new Error('Database query failed.');
}

module.exports = {
  getSql,
  query,
  usePostgres,
  isRetryableDbError,
};

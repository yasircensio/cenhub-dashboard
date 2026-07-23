const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const DEBUG_LOG_PATH = path.join(__dirname, '..', '.cursor', 'debug-7ba7fd.log');
const DEBUG_SESSION_ID = '7ba7fd';

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

function debugDbLog(message, data = {}, hypothesisId = 'A') {
  // #region agent log
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, `${JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      hypothesisId,
      location: 'lib/db.js',
      message,
      data,
      timestamp: Date.now(),
    })}\n`);
  } catch {
    // ignore debug log failures
  }
  // #endregion
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function query(strings, ...values) {
  const sql = getSql();
  const maxAttempts = 4;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await sql(strings, ...values);
      if (attempt > 1) {
        debugDbLog('db query recovered after retry', { attempt }, 'A');
      }
      return result;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableDbError(error);
      debugDbLog('db query failed', {
        attempt,
        retryable,
        error: String(error?.message || error),
      }, 'A');
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

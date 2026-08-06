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

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await sql(strings, ...values);
    } catch (error) {
      lastError = error;
      const retryable = isRetryableDbError(error);
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

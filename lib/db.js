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

async function query(strings, ...values) {
  const sql = getSql();
  return sql(strings, ...values);
}

module.exports = {
  getSql,
  query,
  usePostgres,
};

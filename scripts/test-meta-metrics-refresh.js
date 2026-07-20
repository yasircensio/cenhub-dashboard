require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  isMetaMetricsStale,
  getMetricsDateStop,
  shouldSkipRefresh,
} = require('../lib/meta-metrics-refresh');
const { getTodayIso } = require('../lib/marketing-metrics');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const timeZone = 'Europe/Copenhagen';
  const today = getTodayIso(timeZone);

  assert(isMetaMetricsStale(null, timeZone), 'missing metrics should be stale');

  const freshMetrics = {
    this_month: {
      spend: '1000',
      date_start: `${today.slice(0, 8)}01`,
      date_stop: today,
    },
  };
  assert(!isMetaMetricsStale(freshMetrics, timeZone), 'today date_stop should be fresh');

  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);
  const lagOneDay = {
    this_month: {
      spend: '1000',
      date_stop: yesterdayIso,
    },
  };
  assert(!isMetaMetricsStale(lagOneDay, timeZone), 'yesterday date_stop should be fresh');

  const oldMetrics = {
    this_month: {
      spend: '8033.66',
      date_stop: '2026-07-17',
    },
  };
  assert(isMetaMetricsStale(oldMetrics, timeZone), '4-day-old metrics should be stale');
  assert(getMetricsDateStop(oldMetrics) === '2026-07-17', 'date_stop helper');

  const recentSync = {
    metaLastSyncedAt: new Date().toISOString(),
  };
  assert(shouldSkipRefresh(recentSync), 'recent sync should hit cooldown');
  assert(!shouldSkipRefresh(recentSync, { force: true }), 'force should bypass cooldown');

  console.log('Meta metrics refresh tests passed.');
}

main();

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getAllMetrics, getMetrics, getClientList, setClientList } = require('../lib/facebook-metrics-store');
const { saveClientMetrics } = require('../lib/facebook-metrics-handler');
const {
  buildMonthlyAdSpend,
  monthKeyFromDate,
  resolveMonthlyFromPayload,
  getSpendForPreset,
  getSpendForDateRange,
  getProratedMonthRatio,
  getTodayIso,
  getPeriodLabelForRange,
  getLeadsForPreset,
  getCurrentMonthKey,
  getPreviousMonthKey,
  monthsBetween,
} = require('../lib/marketing-metrics');

// Dedicated test slug so running this against a real store never overwrites
// a production client's metrics.
const samplePayload = {
  client_id: 'test-metrics-sample',
  account_name: 'Test Metrics Sample',
  currency: 'DKK',
  yearly: {
    spend: '45190',
    impressions: '120000',
    clicks: '2400',
    ctr: '2.0',
    cpc: '18.82',
    cpm: '376.58',
    reach: '85000',
    frequency: '1.41',
    date_start: '2026-01-01',
    date_stop: '2026-06-24',
  },
  this_month: {
    spend: '8200',
    impressions: '22000',
    clicks: '410',
    ctr: '1.86',
    cpc: '20.00',
    cpm: '372.73',
    reach: '18000',
    frequency: '1.22',
    date_start: '2026-06-01',
    date_stop: '2026-06-24',
  },
  last_month: {
    spend: '9100',
    impressions: '25000',
    clicks: '460',
    ctr: '1.84',
    cpc: '19.78',
    cpm: '364.00',
    reach: '19500',
    frequency: '1.28',
    date_start: '2026-05-01',
    date_stop: '2026-05-31',
  },
};

async function main() {
  console.log('Testing Facebook metrics month mapping...\n');

  const thisMonthKey = monthKeyFromDate('2026-06-30T22:00:00.000Z');
  const lastMonthKey = monthKeyFromDate('2026-05-31T22:00:00.000Z');
  if (thisMonthKey !== '2026-07') {
    throw new Error(`Expected July for this_month, got ${thisMonthKey}`);
  }
  if (lastMonthKey !== '2026-06') {
    throw new Error(`Expected June for last_month, got ${lastMonthKey}`);
  }

  const monthly = buildMonthlyAdSpend({
    yearly: { spend: '54869.55', date_start: '2025-12-31T23:00:00.000Z', date_stop: '2026-07-05T22:00:00.000Z' },
    this_month: { spend: '3692.46', date_start: '2026-06-30T22:00:00.000Z', date_stop: '2026-07-05T22:00:00.000Z' },
    last_month: { spend: '20894.05', date_start: '2026-05-31T22:00:00.000Z', date_stop: '2026-06-29T22:00:00.000Z' },
  });
  const byMonth = Object.fromEntries(monthly.map((row) => [row.month, row.spend]));
  if (byMonth['2026-07'] !== 3692.46) {
    throw new Error(`July spend mismatch: ${byMonth['2026-07']}`);
  }
  if (byMonth['2026-06'] !== 20894.05) {
    throw new Error(`June spend mismatch: ${byMonth['2026-06']}`);
  }
  if (Object.keys(byMonth).length !== 2) {
    throw new Error(`Expected only 2 real months, got ${JSON.stringify(byMonth)}`);
  }

  const fromMake = buildMonthlyAdSpend({
    monthly: [
      { Spend: '963.82', 'Date Start': 'January 1, 2024 12:00 AM', 'Date Stop': 'January 31, 2024 12:00 AM' },
      { Spend: '1790.58', 'Date Start': 'February 1, 2024 12:00 AM', 'Date Stop': 'February 29, 2024 12:00 AM' },
      { Spend: '2760.75', 'Date Start': 'July 1, 2026 12:00 AM', 'Date Stop': 'July 6, 2026 12:00 AM' },
    ],
  });
  const makeByMonth = Object.fromEntries(fromMake.map((row) => [row.month, row.spend]));
  if (makeByMonth['2024-01'] !== 963.82 || makeByMonth['2024-02'] !== 1790.58 || makeByMonth['2026-07'] !== 2760.75) {
    throw new Error(`Make monthly format mismatch: ${JSON.stringify(makeByMonth)}`);
  }

  const merged = buildMonthlyAdSpend({
    monthly: [
      { spend: '13330.26', date_start: '2026-05-31T22:00:00.000Z' },
      { spend: '2769.69', date_start: '2026-06-30T22:00:00.000Z' },
    ],
    this_month: { spend: '3744.05', date_start: '2026-06-30T22:00:00.000Z' },
    last_month: { spend: '20894.05', date_start: '2026-05-31T22:00:00.000Z' },
  });
  const mergedByMonth = Object.fromEntries(merged.map((row) => [row.month, row.spend]));
  if (mergedByMonth['2026-07'] !== 3744.05 || mergedByMonth['2026-06'] !== 20894.05) {
    throw new Error(`Monthly + bucket merge mismatch: ${JSON.stringify(mergedByMonth)}`);
  }

  const monthlyAdSpend = merged;
  const thisMonthSpend = getSpendForPreset({}, 'month', monthlyAdSpend);
  const lastMonthSpend = getSpendForPreset({}, 'lastMonth', monthlyAdSpend);
  if (thisMonthSpend !== 3744.05 || lastMonthSpend !== 20894.05) {
    throw new Error(`Preset spend mismatch: this=${thisMonthSpend}, last=${lastMonthSpend}`);
  }

  const leads = getLeadsForPreset(
    { totalLeads: 99 },
    [{ month: getCurrentMonthKey(), count: 12 }, { month: getPreviousMonthKey(), count: 34 }],
    'month',
  );
  if (leads !== 12) {
    throw new Error(`Expected preset leads from monthly series, got ${leads}`);
  }

  const timeZone = 'Europe/Copenhagen';
  const currentMonthKey = getCurrentMonthKey(timeZone);
  const monthSpend = 8410;
  const currentMonthly = [{ month: currentMonthKey, spend: monthSpend }];
  const todayIso = getTodayIso(timeZone);
  const [year, month, todayDay] = todayIso.split('-').map((part, index) => (
    index === 0 ? Number(part) : Number(part)
  ));
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthToToday = getSpendForDateRange({}, monthStart, todayIso, currentMonthly, timeZone);
  if (Math.abs(monthToToday - monthSpend) > 0.01) {
    throw new Error(`Month start to today should equal full month spend, got ${monthToToday}`);
  }

  if (todayDay > 1) {
    const endBeforeToday = `${year}-${String(month).padStart(2, '0')}-${String(todayDay - 1).padStart(2, '0')}`;
    const monthToYesterday = getSpendForDateRange({}, monthStart, endBeforeToday, currentMonthly, timeZone);
    const expectedYesterday = monthSpend * ((todayDay - 1) / todayDay);
    if (Math.abs(monthToYesterday - expectedYesterday) > 0.01) {
      throw new Error(`Expected ${expectedYesterday} for month to yesterday, got ${monthToYesterday}`);
    }
  }

  const rangeMonthly = [
    { month: '2026-04', spend: 1500 },
    { month: '2026-05', spend: 2000 },
  ];
  const aprilRatio = getProratedMonthRatio('2026-04', '2026-04-10', '2026-04-20', timeZone);
  if (aprilRatio <= 0 || aprilRatio >= 1) {
    throw new Error(`Expected partial April ratio for past month, got ${aprilRatio}`);
  }

  const multiMonthSpend = getSpendForDateRange({}, '2026-04-10', '2026-05-05', rangeMonthly, timeZone);
  if (multiMonthSpend <= 0 || multiMonthSpend >= 3500) {
    throw new Error(`Expected prorated multi-month spend, got ${multiMonthSpend}`);
  }

  const monthKeys = monthsBetween('2026-03-01', '2026-05-31');
  if (monthKeys.join(',') !== '2026-03,2026-04,2026-05') {
    throw new Error(`monthsBetween mismatch: ${monthKeys.join(',')}`);
  }

  const sameMonthLabel = getPeriodLabelForRange('2026-03-01', '2026-03-31');
  if (!sameMonthLabel.includes('2026')) {
    throw new Error(`Expected same-month label, got ${sameMonthLabel}`);
  }

  const crossYearLabel = getPeriodLabelForRange('2025-12-01', '2026-01-31');
  if (!crossYearLabel.includes('2025') || !crossYearLabel.includes('2026')) {
    throw new Error(`Expected cross-year label, got ${crossYearLabel}`);
  }

  const monthlyJson = JSON.stringify([
    { spend: '963.82', date_start: '2023-12-31T23:00:00.000Z' },
    { spend: '2763.06', date_start: '2026-06-30T22:00:00.000Z' },
  ]);
  const parsedMonthly = resolveMonthlyFromPayload({ monthly_json: monthlyJson });
  if (parsedMonthly.length !== 2) {
    throw new Error(`monthly_json parse failed: ${parsedMonthly.length}`);
  }

  console.log('Testing Facebook metrics store...\n');

  // saveClientMetrics validates client_id against known clients; register the
  // sample client first so the test passes on a clean store.
  const existingClients = await getClientList();
  if (!existingClients.includes(samplePayload.client_id)) {
    await setClientList([...existingClients, samplePayload.client_id]);
  }

  const { clientId } = await saveClientMetrics(samplePayload);
  console.log(`Saved metrics for ${clientId}`);

  const one = await getMetrics(clientId);
  console.log(`  this_month.spend: ${one.this_month.spend}`);

  const all = await getAllMetrics();
  console.log(`  clients in store: ${Object.keys(all).join(', ') || 'none'}`);
  console.log('\nFacebook metrics test passed.');
}

main().catch((error) => {
  console.error('\nFacebook metrics test failed.');
  console.error(error.message);
  process.exit(1);
});

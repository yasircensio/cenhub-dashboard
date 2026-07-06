require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getAllMetrics, getMetrics } = require('../lib/facebook-metrics-store');
const { saveClientMetrics } = require('../lib/facebook-metrics-handler');
const {
  buildMonthlyAdSpend,
  monthKeyFromDate,
  resolveMonthlyFromPayload,
} = require('../lib/marketing-metrics');

const samplePayload = {
  client_id: 'suntech-nordic',
  account_name: 'SunTech Nordic',
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

  const monthlyJson = JSON.stringify([
    { spend: '963.82', date_start: '2023-12-31T23:00:00.000Z' },
    { spend: '2763.06', date_start: '2026-06-30T22:00:00.000Z' },
  ]);
  const parsedMonthly = resolveMonthlyFromPayload({ monthly_json: monthlyJson });
  if (parsedMonthly.length !== 2) {
    throw new Error(`monthly_json parse failed: ${parsedMonthly.length}`);
  }

  console.log('Testing Facebook metrics store...\n');

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

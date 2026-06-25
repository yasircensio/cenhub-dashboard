require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getAllMetrics, getMetrics } = require('../lib/facebook-metrics-store');
const { saveClientMetrics } = require('../lib/facebook-metrics-handler');

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

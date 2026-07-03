require('dotenv').config();

const {
  createAccount,
  getAccount,
  setMetricsModel,
  updateAccount,
} = require('../lib/account-store');
const { syncAccount } = require('../lib/sync-service');

const CLIENT_ID = 'suntech-nordic';
const ACCOUNT = {
  clientId: CLIENT_ID,
  accountName: 'SunTech Nordic',
  locationId: process.env.CENHUB_LOCATION_ID || 'XTl96fVPBYqWgZdWkfFM',
  ghlToken: process.env.CENHUB_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_PRIVATE_INTEGRATION_TOKEN || '',
  timezone: process.env.DASHBOARD_TIMEZONE || 'Europe/Copenhagen',
  profitFieldId: process.env.CENHUB_PROFIT_FIELD_ID || '2YAu8bEKpOUSXwfYljWT',
  facebookClientId: CLIENT_ID,
  defaultAdSpend: Number(process.env.CENHUB_AD_SPEND) || null,
  newLeadsPipelineId: process.env.CENHUB_NEW_LEADS_PIPELINE_ID || 'YIgoFK04OJCRlMkCIa0X',
  salesPipelineId: process.env.CENHUB_SALES_PIPELINE_ID || 'mHvsnX8pjfQMEEzAvdIx',
  afterSalesPipelineId: process.env.CENHUB_AFTER_SALES_PIPELINE_ID || 'YrKUKuQ1HlSQ1rZpeGex',
  dedupeEnabled: true,
  readyForGhl: true,
};

async function main() {
  if (!ACCOUNT.ghlToken) {
    console.error('Missing CENHUB_PRIVATE_INTEGRATION_TOKEN in environment.');
    process.exit(1);
  }

  const existing = await getAccount(CLIENT_ID);
  if (existing) {
    console.log(`Updating existing account "${CLIENT_ID}"...`);
    await updateAccount(CLIENT_ID, ACCOUNT);
  } else {
    console.log(`Creating account "${CLIENT_ID}"...`);
    await createAccount(ACCOUNT);
  }

  await setMetricsModel(CLIENT_ID, {
    dedupeEnabled: true,
    winPipelineId: ACCOUNT.afterSalesPipelineId,
    afterSalesPipelineId: ACCOUNT.afterSalesPipelineId,
  });

  console.log('Running initial GHL sync...');
  const result = await syncAccount(CLIENT_ID);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('');
  console.error(error.message || error);
  if (/401|token/i.test(String(error.message))) {
    console.error('');
    console.error('Tips:');
    console.error('  1. Confirm CENHUB_PRIVATE_INTEGRATION_TOKEN is set in .env');
    console.error('  2. If the message says "timed out", wait a minute and run: npm run seed:suntech');
    console.error('  3. Regenerate the token in GHL if auth keeps failing');
  }
  console.error('');
  process.exit(1);
});

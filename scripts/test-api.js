require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getDashboardData } = require('../lib/dashboard-data');

const CLIENT_ID = process.env.TEST_CLIENT_ID || 'suntech-nordic';
const SUNTECH_PIPELINES = {
  newLeads: process.env.CENHUB_NEW_LEADS_PIPELINE_ID || 'YIgoFK04OJCRlMkCIa0X',
  sales: process.env.CENHUB_SALES_PIPELINE_ID || 'mHvsnX8pjfQMEEzAvdIx',
  afterSales: process.env.CENHUB_AFTER_SALES_PIPELINE_ID || 'YrKUKuQ1HlSQ1rZpeGex',
};

function formatDkk(value) {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
}

function clientQuery(extra = {}) {
  return { client: CLIENT_ID, ...extra };
}

async function main() {
  console.log(`Testing dashboard data for client "${CLIENT_ID}"...\n`);

  const data = await getDashboardData(clientQuery());
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const monthData = await getDashboardData(clientQuery({ dateFrom: monthStart, dateTo: monthEnd }));
  const yearStart = `${now.getFullYear()}-01-01`;
  const yearEnd = `${now.getFullYear()}-12-31`;
  const funnelIds = `${SUNTECH_PIPELINES.newLeads},${SUNTECH_PIPELINES.sales}`;
  const yearData = await getDashboardData(clientQuery({
    pipelineIds: funnelIds,
    dateFrom: yearStart,
    dateTo: yearEnd,
  }));
  const tillFunnel = await getDashboardData(clientQuery({
    pipelineIds: funnelIds,
  }));

  console.log('Totals (Cenhub-aligned when no filters)');
  console.log(`  Account:       ${data.account?.accountName || CLIENT_ID}`);
  console.log(`  Won revenue:   DKK ${formatDkk(data.kpis.totalRevenue)}`);
  console.log(`  Clients won:   ${data.kpis.clientsWon}${data.kpis.usingCenhubDefaults ? ' (after-sales pipeline)' : ''}`);
  console.log(`  Total leads:   ${data.kpis.totalLeads}${data.kpis.contactCount ? ` (${data.kpis.opportunityCount} opportunities)` : ''}`);
  console.log(`  Leads value:   DKK ${formatDkk(data.kpis.totalLeadsValue)}`);
  console.log(`  Avg lead val:  DKK ${formatDkk(data.kpis.averageLeadValue)}`);
  console.log(`  Bundlinje:     DKK ${formatDkk(data.kpis.totalBundlinje)}`);
  console.log(`  Conversion:    ${data.kpis.conversionRate.toFixed(2)}%`);
  console.log('');

  console.log(`This month (${monthStart} to ${monthEnd})`);
  console.log(`  Won revenue:   DKK ${formatDkk(monthData.kpis.totalRevenue)}`);
  console.log(`  Clients won:   ${monthData.kpis.clientsWon}`);
  console.log(`  Total leads:   ${monthData.kpis.totalLeads}`);
  console.log(`  Leads value:   DKK ${formatDkk(monthData.kpis.totalLeadsValue)}`);
  if (!monthData.kpis.totalRevenue && monthData.kpis.totalLeads > 0) {
    throw new Error('This month revenue is 0 while leads exist — period KPI logic is broken.');
  }

  console.log(`This year vs till-date (2 funnel pipelines, ${yearStart} to ${yearEnd})`);
  console.log(`  Till revenue:  DKK ${formatDkk(tillFunnel.kpis.totalRevenue)} (${tillFunnel.kpis.wonOpportunityCount} won)`);
  console.log(`  Year revenue:  DKK ${formatDkk(yearData.kpis.totalRevenue)} (${yearData.kpis.wonOpportunityCount} won)`);
  if (tillFunnel.kpis.totalRevenue !== yearData.kpis.totalRevenue) {
    throw new Error('This year revenue must match till-date when all wins are in the current year.');
  }
  if (tillFunnel.kpis.clientsWon !== yearData.kpis.clientsWon) {
    throw new Error('This year clients won must match till-date for the same pipeline selection.');
  }

  const customData = await getDashboardData(clientQuery({
    dateFrom: '2026-03-01',
    dateTo: '2026-03-31',
    dateField: 'createdAt',
  }));
  console.log(`Custom range (2026-03-01 to 2026-03-31, createdAt)`);
  console.log(`  Total leads:   ${customData.kpis.totalLeads}`);
  console.log(`  Clients won:   ${customData.kpis.clientsWon}`);
  console.log(`  Has date filter: ${customData.kpis.hasDateFilter}`);
  if (!customData.kpis.hasDateFilter) {
    throw new Error('Custom date range query must set hasDateFilter.');
  }

  const chartCheck = await getDashboardData(clientQuery({
    pipelineIds: `${funnelIds},${SUNTECH_PIPELINES.afterSales}`,
  }));
  const weeklyRevenueTotal = chartCheck.weeklyRevenue.reduce((sum, row) => sum + row.revenue, 0);
  const monthlyRevenueTotal = chartCheck.monthlyRevenue.reduce((sum, row) => sum + row.revenue, 0);
  if (weeklyRevenueTotal !== chartCheck.kpis.totalRevenue) {
    throw new Error(`Weekly revenue chart (${weeklyRevenueTotal}) must match KPI total (${chartCheck.kpis.totalRevenue}).`);
  }
  if (monthlyRevenueTotal !== chartCheck.kpis.totalRevenue) {
    throw new Error(`Monthly revenue chart (${monthlyRevenueTotal}) must match KPI total (${chartCheck.kpis.totalRevenue}).`);
  }
  console.log('');

  console.log('Top sources');
  for (const row of data.sourceReport.slice(0, 5)) {
    console.log(`  ${row.source}: ${row.totalLeads} leads, DKK ${formatDkk(row.totalValue)}, won ${row.won}`);
  }
  console.log('');

  for (const pipeline of data.pipelines) {
    console.log(pipeline.name);
    console.log(`  Bundlinje:     DKK ${formatDkk(pipeline.profit)}`);
    console.log(`  Omsaetning:    DKK ${formatDkk(pipeline.monetary)}`);
    console.log(`  Leads:         ${pipeline.count}`);
    console.log(`  Won:           ${pipeline.won}`);
    console.log('');
  }

  console.log(`Updated at: ${data.updatedAt}`);
  console.log(`Data source: ${data.dataSource || 'unknown'}`);
  console.log('\nAPI test passed.');
}

main().catch((error) => {
  console.error('\nAPI test failed.');
  console.error(error.message);
  process.exit(1);
});

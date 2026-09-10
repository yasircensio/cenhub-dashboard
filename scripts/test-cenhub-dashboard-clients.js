const assert = require('assert');
const {
  filterCenhubHubClients,
  resolveCenhubDashboardFlag,
} = require('../lib/account-store');
const { shouldListOnMetaCenhubPage } = require('../lib/meta-report-ghl-service');

function testResolveFlag() {
  assert.strictEqual(
    resolveCenhubDashboardFlag({ cenhub_dashboard: true }),
    true,
    'explicit true',
  );
  assert.strictEqual(
    resolveCenhubDashboardFlag({ cenhub_dashboard: false, location_id: 'loc', ghl_token_encrypted: 'x' }),
    false,
    'explicit false wins over GHL fields',
  );
  assert.strictEqual(
    resolveCenhubDashboardFlag({ location_id: 'loc-1' }),
    true,
    'legacy location is a Cenhub client',
  );
  assert.strictEqual(
    resolveCenhubDashboardFlag({ ghl_token_encrypted: 'enc' }),
    true,
    'legacy GHL token is a Cenhub client',
  );
  assert.strictEqual(
    resolveCenhubDashboardFlag({ meta_ad_account_id: '123', cenhub_dashboard: false }),
    false,
    'Meta-only stays off the Clients hub',
  );
  assert.strictEqual(
    resolveCenhubDashboardFlag({ meta_ad_account_id: '123' }),
    false,
    'Meta-only legacy row is not a Cenhub client',
  );
}

function testHubFilters() {
  const clients = [
    { clientId: 'live-one', accountName: 'Live One', status: 'ready' },
    { clientId: 'setup-one', accountName: 'Setup One', status: 'needs_token' },
    { clientId: 'review', accountName: 'Needs Review', status: 'needs_review' },
  ];
  assert.strictEqual(filterCenhubHubClients(clients, 'all').length, 3);
  assert.deepStrictEqual(
    filterCenhubHubClients(clients, 'live').map((row) => row.clientId),
    ['live-one'],
  );
  assert.deepStrictEqual(
    filterCenhubHubClients(clients, 'needs-setup').map((row) => row.clientId),
    ['setup-one', 'review'],
  );
  assert.deepStrictEqual(
    filterCenhubHubClients(clients, 'all', 'setup').map((row) => row.clientId),
    ['setup-one'],
  );
}

testResolveFlag();
testHubFilters();

assert.strictEqual(
  shouldListOnMetaCenhubPage({ cenhubDashboard: true, metaAdAccountId: '1' }),
  true,
  'Cenhub GHL client can appear on Meta Cenhub list',
);
assert.strictEqual(
  shouldListOnMetaCenhubPage({ cenhubDashboard: false, metaAdAccountId: '460777740387875' }),
  false,
  'Nova-C style Meta-only client stays off Meta Cenhub list',
);

console.log('cenhub dashboard client tests passed');

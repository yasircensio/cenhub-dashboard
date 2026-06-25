const {
  dedupeOpportunities,
  mergeOpportunityPair,
} = require('../lib/opportunity-dedupe');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const pipelines = [
    { id: 'salg', name: 'Salg Pipeline' },
    { id: 'nye', name: 'Nye leads Pipeline' },
    { id: 'eft', name: 'Eftersalg & Betalinger' },
  ];

  const funnelOpp = {
    id: 'f1',
    contactId: 'c1',
    pipelineId: 'salg',
    status: 'won',
    monetaryValue: 50000,
    createdAt: '2026-01-10T10:00:00.000Z',
    lastStatusChangeAt: '2026-02-01T12:00:00.000Z',
    customFields: [],
  };

  const afterSaleOpp = {
    id: 'a1',
    contactId: 'c1',
    pipelineId: 'eft',
    status: 'won',
    monetaryValue: 55000,
    createdAt: '2026-02-02T08:00:00.000Z',
    lastStatusChangeAt: '2026-02-02T08:00:00.000Z',
    customFields: [{
      id: '2YAu8bEKpOUSXwfYljWT',
      fieldValueNumber: 12000,
      name: 'Bundlinje',
    }],
  };

  const merged = mergeOpportunityPair(funnelOpp, afterSaleOpp);
  assert(merged.pipelineId === 'salg', 'merged opportunity keeps funnel pipeline');
  assert(merged.status === 'won', 'merged opportunity is won');
  assert(merged.monetaryValue === 55000, 'merged deal value should prefer Eftersalg');
  assert(merged._dedupe.merged === true, 'merged metadata is set');

  const opportunities = [
    funnelOpp,
    afterSaleOpp,
    {
      id: 'f2',
      contactId: 'c2',
      pipelineId: 'nye',
      status: 'open',
      monetaryValue: 1000,
      createdAt: '2026-03-01T10:00:00.000Z',
      customFields: [],
    },
  ];

  const { opportunities: deduped, stats } = dedupeOpportunities(opportunities, pipelines);
  assert(stats.pairsMerged === 1, 'one duplicate pair should merge');
  assert(deduped.length === 2, 'deduped list should remove hidden after-sale row');
  assert(deduped.some((opp) => opp.id === 'f1' && opp._dedupe?.merged), 'funnel row should be replaced by merged row');

  const unpairedAfterSale = {
    id: 'a2',
    contactId: 'c9',
    pipelineId: 'eft',
    status: 'won',
    monetaryValue: 25000,
    createdAt: '2026-04-01T10:00:00.000Z',
    lastStatusChangeAt: '2026-04-02T10:00:00.000Z',
    customFields: [],
  };
  const unpairedResult = dedupeOpportunities([unpairedAfterSale], pipelines);
  assert(unpairedResult.stats.unpairedAfterSale === 1, 'standalone Eftersalg should remain unpaired');
  assert(unpairedResult.opportunities.length === 1, 'unpaired Eftersalg should still be counted');
  assert(unpairedResult.opportunities[0].id === 'a2', 'unpaired Eftersalg row is kept');

  console.log('Dedupe unit tests passed.');
}

run();

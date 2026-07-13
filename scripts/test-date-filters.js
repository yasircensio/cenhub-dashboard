#!/usr/bin/env node
const assert = require('assert');
const { parseFilters, normalizeDateFilters, buildPeriodKpis } = require('../lib/dashboard-data');
const { computeWinMetrics, resolveMetricsModel } = require('../lib/metrics-model');

function testNormalizeDateFilters() {
  assert.deepStrictEqual(
    normalizeDateFilters(null, null),
    { dateFrom: null, dateTo: null },
  );

  assert.throws(
    () => normalizeDateFilters('2026-03-01', null),
    /Both dateFrom and dateTo are required/,
  );

  assert.throws(
    () => normalizeDateFilters('2026-05-01', '2026-03-01'),
    /dateFrom must be on or before dateTo/,
  );

  assert.throws(
    () => normalizeDateFilters('2024-01-01', '2026-12-31'),
    /cannot exceed 24 months/,
  );
}

function testParseFiltersCustomRange() {
  const filters = parseFilters({
    dateFrom: '2026-03-01',
    dateTo: '2026-03-31',
    dateField: 'createdAt',
  }, { timezone: 'Europe/Copenhagen' });

  assert.strictEqual(filters.dateFrom, '2026-03-01');
  assert.strictEqual(filters.dateTo, '2026-03-31');
  assert.strictEqual(filters.dateField, 'createdAt');
}

function testLeadKpisUseCreatedAt() {
  const filters = {
    dateFrom: '2026-03-01',
    dateTo: '2026-03-31',
    timeZone: 'Europe/Copenhagen',
  };
  const opportunities = [
    { id: '1', createdAt: '2026-03-10T10:00:00Z', monetaryValue: 100 },
    { id: '2', createdAt: '2026-02-10T10:00:00Z', monetaryValue: 200 },
    { id: '3', createdAt: '2026-03-20T10:00:00Z', monetaryValue: 50 },
  ];

  const kpis = buildPeriodKpis(opportunities, filters);
  assert.strictEqual(kpis.totalLeads, 2);
  assert.strictEqual(kpis.totalLeadsValue, 150);
}

function testWonKpisUseStatusChangedDate() {
  const model = resolveMetricsModel({ dedupeEnabled: false });
  const opportunities = [
    {
      id: '1',
      status: 'won',
      pipelineId: 'a',
      monetaryValue: 100,
      createdAt: '2026-03-10T10:00:00Z',
      lastStatusChangeAt: '2026-01-10T10:00:00Z',
      contactId: 'c1',
    },
    {
      id: '2',
      status: 'won',
      pipelineId: 'a',
      monetaryValue: 200,
      createdAt: '2026-01-05T10:00:00Z',
      lastStatusChangeAt: '2026-03-15T10:00:00Z',
      contactId: 'c2',
    },
  ];

  const filters = {
    dateFrom: '2026-03-01',
    dateTo: '2026-03-31',
    timeZone: 'Europe/Copenhagen',
  };

  const leadKpis = buildPeriodKpis(opportunities, filters);
  const winKpis = computeWinMetrics(opportunities, model, filters);

  assert.strictEqual(leadKpis.totalLeads, 1, 'Lead count should use createdAt');
  assert.strictEqual(winKpis.wonRevenue, 200, 'Won revenue should use status-changed date');
  assert.strictEqual(winKpis.clientsWon, 1);
}

testNormalizeDateFilters();
testParseFiltersCustomRange();
testLeadKpisUseCreatedAt();
testWonKpisUseStatusChangedDate();

console.log('Date filter unit tests passed.');

#!/usr/bin/env node
/**
 * Export GHL opportunities/contacts where source is Facebook.
 *
 * Usage:
 *   node scripts/export-ghl-facebook-leads.js censio
 *   node scripts/export-ghl-facebook-leads.js censio --live   # fetch fresh from GHL API
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getAccount, getSnapshot } = require('../lib/account-store');
const { fetchGhlData } = require('../lib/ghl-sync');

function getOpportunitySource(opportunity) {
  const raw = opportunity.source
    || opportunity.attributions?.[0]?.adSource
    || opportunity.attributions?.[0]?.utmSource
    || opportunity.attributions?.[0]?.medium
    || '';
  return String(raw).trim();
}

function isFacebookSource(opportunity) {
  const source = getOpportunitySource(opportunity).toLowerCase();
  return source === 'facebook' || source === 'meta';
}

function pickContact(opportunity) {
  const contact = opportunity.contact || opportunity.relations?.find((r) => r.objectKey === 'contact') || {};
  return {
    contactId: opportunity.contactId || contact.id || contact.recordId || null,
    name: contact.name || contact.fullName || contact.contactName || opportunity.name || null,
    email: contact.email || null,
    phone: contact.phone || null,
    companyName: contact.companyName || null,
    tags: contact.tags || [],
  };
}

function pickAttribution(opportunity) {
  const attr = opportunity.attributions?.[0] || {};
  return {
    medium: attr.medium || null,
    adSource: attr.adSource || null,
    utmSource: attr.utmSource || null,
    utmMedium: attr.utmMedium || null,
    utmAdId: attr.utmAdId || null,
    mediumId: attr.mediumId || null,
    utmContent: attr.utmContent || null,
  };
}

function toLeadRow(opportunity) {
  const contact = pickContact(opportunity);
  return {
    opportunityId: opportunity.id,
    contactId: contact.contactId,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    companyName: contact.companyName,
    source: getOpportunitySource(opportunity),
    status: opportunity.status || null,
    monetaryValue: opportunity.monetaryValue ?? null,
    createdAt: opportunity.createdAt || null,
    updatedAt: opportunity.updatedAt || null,
    pipelineId: opportunity.pipelineId || null,
    pipelineStageId: opportunity.pipelineStageId || null,
    assignedTo: opportunity.assignedTo || null,
    tags: contact.tags,
    attribution: pickAttribution(opportunity),
  };
}

function dedupeByContact(leads) {
  const byContact = new Map();
  for (const lead of leads) {
    const key = lead.contactId || lead.email || lead.opportunityId;
    const existing = byContact.get(key);
    if (!existing || String(lead.createdAt || '') > String(existing.createdAt || '')) {
      byContact.set(key, lead);
    }
  }
  return [...byContact.values()].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function toCsv(leads) {
  const headers = [
    'email',
    'name',
    'phone',
    'contactId',
    'opportunityId',
    'source',
    'status',
    'monetaryValue',
    'createdAt',
    'companyName',
    'tags',
    'formId',
    'utmAdId',
  ];
  const rows = leads.map((lead) => [
    lead.email || '',
    lead.name || '',
    lead.phone || '',
    lead.contactId || '',
    lead.opportunityId || '',
    lead.source || '',
    lead.status || '',
    lead.monetaryValue ?? '',
    lead.createdAt || '',
    lead.companyName || '',
    (lead.tags || []).join('; '),
    lead.attribution?.mediumId || '',
    lead.attribution?.utmAdId || '',
  ]);
  const escape = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
}

async function loadOpportunities(clientId, { live = false } = {}) {
  if (!live) {
    const snapshot = await getSnapshot(clientId);
    if (snapshot?.opportunities?.length) {
      return { opportunities: snapshot.opportunities, fetchedAt: snapshot.fetched_at, source: 'snapshot' };
    }
  }

  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account?.ghlToken || !account.locationId) {
    throw new Error(`Missing GHL token or location ID for ${clientId}.`);
  }
  const data = await fetchGhlData(account.ghlToken, account.locationId);
  return { opportunities: data.opportunities, fetchedAt: data.fetchedAt, source: 'live' };
}

async function exportGhlFacebookLeads(clientId, { live = false } = {}) {
  const account = await getAccount(clientId);
  const { opportunities, fetchedAt, source: dataSource } = await loadOpportunities(clientId, { live });

  const facebookOpportunities = opportunities.filter(isFacebookSource);
  const leads = dedupeByContact(facebookOpportunities.map(toLeadRow));

  return {
    clientId,
    accountName: account?.accountName || clientId,
    locationId: account?.locationId || null,
    exportedAt: new Date().toISOString(),
    dataSource,
    snapshotFetchedAt: fetchedAt || null,
    filter: 'source is Facebook or Meta',
    totalOpportunities: opportunities.length,
    facebookOpportunityCount: facebookOpportunities.length,
    uniqueContactCount: leads.length,
    leads,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const clientId = args.find((a) => !a.startsWith('--')) || 'censio';
  const live = args.includes('--live');

  const result = await exportGhlFacebookLeads(clientId, { live });
  const outDir = path.join(__dirname, '..', '.data');
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `${clientId}-ghl-facebook-leads.json`);
  const csvPath = path.join(outDir, `${clientId}-ghl-facebook-leads.csv`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(csvPath, `${toCsv(result.leads)}\n`);

  console.log(`Client: ${result.accountName} (${clientId})`);
  console.log(`Data: ${result.dataSource}${result.snapshotFetchedAt ? ` @ ${result.snapshotFetchedAt}` : ''}`);
  console.log(`Facebook opportunities: ${result.facebookOpportunityCount}`);
  console.log(`Unique contacts: ${result.uniqueContactCount}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV:  ${csvPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

module.exports = {
  exportGhlFacebookLeads,
  isFacebookSource,
};

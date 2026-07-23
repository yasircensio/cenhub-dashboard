#!/usr/bin/env node
/**
 * Fetch all Facebook Lead Ads lead IDs (and optional field_data) for a client.
 *
 * Usage:
 *   node scripts/fetch-meta-leads.js censio
 *   node scripts/fetch-meta-leads.js censio --with-fields   # include email, name, etc.
 *   node scripts/fetch-meta-leads.js censio --json > censio-meta-leads.json
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getAccount } = require('../lib/account-store');
const { graphFetch, GRAPH_VERSION, resolveMetaAccessToken } = require('../lib/meta-token');

async function fetchAllPages(firstUrl, token) {
  const items = [];
  let url = firstUrl;
  while (url) {
    const body = await graphFetch(url, token);
    items.push(...(body.data || []));
    url = body.paging?.next || null;
  }
  return items;
}

function resolveToken(account) {
  const pageToken = account.metaPageAccessToken;
  if (pageToken) return { token: pageToken, source: 'page' };
  const resolved = resolveMetaAccessToken(account);
  return { token: resolved.token, source: resolved.source };
}

async function fetchMetaLeads(clientId, { withFields = false } = {}) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) throw new Error(`Account "${clientId}" not found.`);

  const pageId = account.metaPageId;
  if (!pageId) throw new Error(`No metaPageId configured for ${clientId}.`);

  const { token, source } = resolveToken(account);
  if (!token) {
    throw new Error(
      'No Meta token. Save a Page access token in admin (Meta page token) or set META_SYSTEM_USER_TOKEN.',
    );
  }

  const leadFields = withFields ? 'id,created_time,field_data' : 'id,created_time';
  const formsUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/leadgen_forms?fields=id,name,status,leads_count,created_time`;
  const forms = await fetchAllPages(formsUrl, token);

  const leads = [];
  for (const form of forms) {
    const leadsUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${form.id}/leads?fields=${leadFields}`;
    const rows = await fetchAllPages(leadsUrl, token);
    for (const row of rows) {
      leads.push({
        id: row.id,
        created_time: row.created_time,
        formId: form.id,
        formName: form.name,
        ...(withFields && row.field_data ? { field_data: row.field_data } : {}),
      });
    }
  }

  return {
    clientId,
    pageId,
    metaAdAccountId: account.metaAdAccountId,
    graphVersion: GRAPH_VERSION,
    tokenSource: source,
    formsUrl,
    leadsUrlTemplate: `https://graph.facebook.com/${GRAPH_VERSION}/{form-id}/leads?fields=${leadFields}`,
    formCount: forms.length,
    leadCount: leads.length,
    forms,
    leads,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const clientId = args.find((a) => !a.startsWith('--')) || 'censio';
  const withFields = args.includes('--with-fields');

  const result = await fetchMetaLeads(clientId, { withFields });

  if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  console.log(`Client: ${result.clientId}`);
  console.log(`Page ID: ${result.pageId}`);
  console.log(`Token: ${result.tokenSource}`);
  console.log(`Forms: ${result.formCount}`);
  console.log(`Leads: ${result.leadCount}`);
  console.log('');
  console.log('List forms:');
  console.log(`  ${result.formsUrl}`);
  console.log('');
  console.log('List leads per form:');
  console.log(`  ${result.leadsUrlTemplate}`);
  console.log('');
  for (const lead of result.leads) {
    console.log(`${lead.id}\t${lead.created_time}\t${lead.formName}`);
  }

  const outPath = path.join(__dirname, '..', '.data', `${clientId}-meta-leads.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`\nSaved to ${outPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  fetchMetaLeads,
};

const { query, usePostgres } = require('./db');
const { getSnapshot, upsertSnapshot } = require('./account-store');
const { syncAccount } = require('./sync-service');
const { assertClientNotSyncing } = require('./snapshot-sync-lock');

function normalizeClientId(clientId) {
  return String(clientId || '').trim().toLowerCase();
}

function hasUsableSnapshot(snapshot) {
  return Boolean(
    snapshot?.fetched_at
    && (snapshot?.opportunities?.length || snapshot?.pipelines?.length),
  );
}

async function mergeOpportunityIntoSnapshot(clientId, opportunity) {
  const id = normalizeClientId(clientId);
  const oppId = String(opportunity?.id || '').trim();
  if (!oppId) {
    throw new Error('Cannot merge opportunity without id.');
  }

  const existing = await getSnapshot(id);
  await assertClientNotSyncing(id, existing);
  if (!hasUsableSnapshot(existing)) {
    await syncAccount(id, { source: 'webhook-bootstrap' });
    const afterSync = await getSnapshot(id);
    if (!hasUsableSnapshot(afterSync)) {
      throw new Error(`No snapshot available for "${id}" after bootstrap sync.`);
    }
    return { clientId: id, opportunityId: oppId, bootstrapped: true };
  }

  const oppJson = JSON.stringify(opportunity);

  if (usePostgres()) {
    await query`
      UPDATE sync_snapshots
      SET
        opportunities = (
          SELECT COALESCE(jsonb_agg(entry ORDER BY entry->>'id'), '[]'::jsonb)
          FROM (
            SELECT entry
            FROM jsonb_array_elements(
              CASE
                WHEN jsonb_typeof(opportunities) = 'array' THEN opportunities
                ELSE '[]'::jsonb
              END
            ) AS entry
            WHERE entry->>'id' IS DISTINCT FROM ${oppId}
            UNION ALL
            SELECT ${oppJson}::jsonb AS entry
          ) AS merged
        ),
        fetched_at = NOW(),
        sync_status = 'success',
        sync_error = NULL
      WHERE client_id = ${id}
    `;
    return { clientId: id, opportunityId: oppId, merged: true };
  }

  const opportunities = Array.isArray(existing.opportunities) ? [...existing.opportunities] : [];
  const index = opportunities.findIndex((row) => String(row?.id) === oppId);
  if (index >= 0) {
    opportunities[index] = opportunity;
  } else {
    opportunities.push(opportunity);
  }

  await upsertSnapshot(id, {
    fetchedAt: new Date().toISOString(),
    opportunities,
    pipelines: existing.pipelines || [],
    users: existing.users || [],
    contactCount: existing.contact_count || 0,
    syncStatus: 'success',
    syncError: null,
  });

  return { clientId: id, opportunityId: oppId, merged: true };
}

async function removeOpportunityFromSnapshot(clientId, opportunityId) {
  const id = normalizeClientId(clientId);
  const oppId = String(opportunityId || '').trim();
  if (!oppId) return { clientId: id, removed: false };

  const existing = await getSnapshot(id);
  await assertClientNotSyncing(id, existing);
  if (!existing?.opportunities?.length) {
    return { clientId: id, removed: false };
  }

  if (usePostgres()) {
    await query`
      UPDATE sync_snapshots
      SET
        opportunities = (
          SELECT COALESCE(jsonb_agg(entry ORDER BY entry->>'id'), '[]'::jsonb)
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(opportunities) = 'array' THEN opportunities
              ELSE '[]'::jsonb
            END
          ) AS entry
          WHERE entry->>'id' IS DISTINCT FROM ${oppId}
        ),
        fetched_at = NOW()
      WHERE client_id = ${id}
    `;
    return { clientId: id, opportunityId: oppId, removed: true };
  }

  const opportunities = (existing.opportunities || []).filter(
    (row) => String(row?.id) !== oppId,
  );
  await upsertSnapshot(id, {
    fetchedAt: new Date().toISOString(),
    opportunities,
    pipelines: existing.pipelines || [],
    users: existing.users || [],
    contactCount: existing.contact_count || 0,
    syncStatus: existing.sync_status || 'success',
    syncError: existing.sync_error || null,
  });

  return { clientId: id, opportunityId: oppId, removed: true };
}

module.exports = {
  hasUsableSnapshot,
  mergeOpportunityIntoSnapshot,
  removeOpportunityFromSnapshot,
};

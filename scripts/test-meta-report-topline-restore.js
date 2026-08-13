const assert = require('assert');
const {
  buildMetaInputsSnapshot,
  restoreMetaInputsPatch,
  shouldSnapshotMetaInputs,
} = require('../lib/meta-report-topline-restore');

function main() {
  assert.strictEqual(shouldSnapshotMetaInputs({ toplineSource: 'meta' }), true);
  assert.strictEqual(shouldSnapshotMetaInputs({ toplineSource: null }), true);
  assert.strictEqual(shouldSnapshotMetaInputs({ toplineSource: 'ghl' }), false);
  assert.strictEqual(shouldSnapshotMetaInputs({ toplineSource: 'manual' }), false);

  assert.deepStrictEqual(buildMetaInputsSnapshot({
    wonLeads: 3,
    avgLeadValue: 51000,
    avgProfitPerWon: 41000,
  }), {
    metaSavedWonLeads: 3,
    metaSavedAvgLeadValue: 51000,
    metaSavedAvgProfitPerWon: 41000,
  });

  assert.deepStrictEqual(restoreMetaInputsPatch({
    wonLeads: 1,
    avgLeadValue: 1000,
    avgProfitPerWon: 500,
    metaSavedWonLeads: 3,
    metaSavedAvgLeadValue: 51000,
    metaSavedAvgProfitPerWon: 41000,
  }), {
    wonLeads: 3,
    avgLeadValue: 51000,
    avgProfitPerWon: 41000,
  });

  assert.deepStrictEqual(restoreMetaInputsPatch({
    wonLeads: 1,
    avgLeadValue: 1000,
    avgProfitPerWon: 500,
  }), {});

  console.log('Meta report topline restore tests passed.');
}

main();

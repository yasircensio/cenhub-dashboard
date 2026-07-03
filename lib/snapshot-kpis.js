const { computeWinMetrics } = require('./metrics-model');

function getSnapshotPreviewKpis(snapshot, account = {}) {
  if (!snapshot?.opportunities?.length) {
    return {
      totalLeads: snapshot?.contact_count || 0,
      clientsWon: 0,
      wonRevenue: 0,
    };
  }

  const { clientsWon, wonRevenue } = computeWinMetrics(snapshot.opportunities, account, {});

  return {
    totalLeads: snapshot.contact_count || snapshot.opportunities.length,
    clientsWon,
    wonRevenue,
  };
}

module.exports = {
  getSnapshotPreviewKpis,
};

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '.data');
const METRICS_FILE = path.join(DATA_DIR, 'facebook-metrics.json');

let kvClient = null;

function useKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function getKv() {
  if (!kvClient) {
    // eslint-disable-next-line global-require
    const { kv } = require('@vercel/kv');
    kvClient = kv;
  }
  return kvClient;
}

function readFileStore() {
  if (!fs.existsSync(METRICS_FILE)) {
    return { clients: [], metrics: {} };
  }

  try {
    return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
  } catch {
    return { clients: [], metrics: {} };
  }
}

function writeFileStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(METRICS_FILE, JSON.stringify(store, null, 2));
}

async function getClientList() {
  if (useKv()) {
    return (await getKv().get('client_list')) || [];
  }

  return readFileStore().clients;
}

async function setClientList(clients) {
  if (useKv()) {
    await getKv().set('client_list', clients);
    return;
  }

  const store = readFileStore();
  store.clients = clients;
  writeFileStore(store);
}

async function getMetrics(clientId) {
  if (useKv()) {
    return getKv().get(`metrics_${clientId}`);
  }

  return readFileStore().metrics[clientId] || null;
}

async function setMetrics(clientId, payload) {
  if (useKv()) {
    await getKv().set(`metrics_${clientId}`, payload);
    return;
  }

  const store = readFileStore();
  store.metrics[clientId] = payload;
  if (!store.clients.includes(clientId)) {
    store.clients.push(clientId);
  }
  writeFileStore(store);
}

async function getAllMetrics() {
  const clients = await getClientList();
  const all = {};

  for (const clientId of clients) {
    all[clientId] = await getMetrics(clientId);
  }

  return all;
}

module.exports = {
  getAllMetrics,
  getClientList,
  getMetrics,
  setClientList,
  setMetrics,
  useKv,
};

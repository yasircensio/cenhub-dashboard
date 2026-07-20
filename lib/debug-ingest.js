function debugIngest(location, message, data = {}, hypothesisId = '') {
  const payload = {
    sessionId: '7ba7fd',
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  // #region agent log
  fetch('http://127.0.0.1:7412/ingest/8036624f-bbd1-4142-b516-bb72c323b06c', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '7ba7fd',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
  console.error('[debug-7ba7fd]', JSON.stringify(payload));
}

module.exports = {
  debugIngest,
};

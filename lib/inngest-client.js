const { Inngest } = require('inngest');

const inngest = new Inngest({
  id: 'cenhub-dashboard',
  eventKey: process.env.INNGEST_EVENT_KEY || undefined,
});

function isInngestConfigured() {
  return Boolean(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY);
}

module.exports = {
  inngest,
  isInngestConfigured,
};

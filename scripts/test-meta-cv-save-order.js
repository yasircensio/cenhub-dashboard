#!/usr/bin/env node
/**
 * Simulates custom-values save reading inputs after editor re-render (hypothesis A).
 */
function agentLog() {
  // Debug session logging removed.
}

function readWonLeadsFromDom(html) {
  const match = html.match(/id="meta-cv-won-leads"[^>]*value="([^"]*)"/);
  return match ? match[1] : '';
}

function renderEditorFromState(state) {
  return `<input type="number" id="meta-cv-won-leads" value="${state.wonLeads ?? ''}" />`;
}

const userEntered = { wonLeads: 12, avgLeadValue: 4500 };
let editorHtml = renderEditorFromState({ wonLeads: '', avgLeadValue: '' });
editorHtml = editorHtml.replace('value=""', `value="${userEntered.wonLeads}"`);

agentLog('user entered values in DOM', {
  wonLeadsDom: readWonLeadsFromDom(editorHtml),
}, 'A');

// Wrong order (current bug): re-render from stale state before reading body
editorHtml = renderEditorFromState({ wonLeads: null, avgLeadValue: null });
const wrongBody = {
  wonLeads: readWonLeadsFromDom(editorHtml) === '' ? null : Number(readWonLeadsFromDom(editorHtml)),
};

agentLog('body read AFTER re-render (buggy order)', wrongBody, 'A');

// Correct order: read first, then re-render
editorHtml = renderEditorFromState({ wonLeads: '', avgLeadValue: '' });
editorHtml = editorHtml.replace('value=""', `value="${userEntered.wonLeads}"`);
const correctBody = {
  wonLeads: readWonLeadsFromDom(editorHtml) === '' ? null : Number(readWonLeadsFromDom(editorHtml)),
};
editorHtml = renderEditorFromState({ wonLeads: null, avgLeadValue: null });

agentLog('body read BEFORE re-render (fixed order)', correctBody, 'A');

if (wrongBody.wonLeads !== null) {
  console.error('Simulation failed: expected null body after buggy re-render');
  process.exit(1);
}
if (correctBody.wonLeads !== userEntered.wonLeads) {
  console.error('Simulation failed: expected saved won leads from fixed order');
  process.exit(1);
}

console.log('Meta CV save-order simulation passed (hypothesis A confirmed).');

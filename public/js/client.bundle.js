(function(){const t=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);if(t[0]==="login"){document.body.dataset.dashboardMode="login",delete document.body.dataset.clientSlug;return}if(t[0]==="team"){document.body.dataset.dashboardMode="team",delete document.body.dataset.clientSlug;return}if(t[0]==="admin"){document.body.dataset.dashboardMode=t.length>=2?"admin":"hub",t.length>=2?document.body.dataset.clientSlug=t[1]:delete document.body.dataset.clientSlug;return}t[0]&&t[0]!=="index.html"&&(document.body.dataset.dashboardMode="client",document.body.dataset.clientSlug=t[0])})();const DASHBOARD_MODE=document.body.dataset.dashboardMode||"client",IS_LOGIN_PAGE=DASHBOARD_MODE==="login",IS_TEAM_PAGE=DASHBOARD_MODE==="team",IS_ADMIN_HUB=DASHBOARD_MODE==="hub",IS_ADMIN_CLIENT=DASHBOARD_MODE==="admin",IS_CLIENT_VIEW=DASHBOARD_MODE==="client",IS_PREVIEW=IS_CLIENT_VIEW&&!!new URLSearchParams(window.location.search).get("client"),IS_ADMIN=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||new URLSearchParams(window.location.search).get("view")==="admin",ADMIN_UI=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN,LOADING_MSG=ADMIN_UI?"Loading dashboard data...":"Henter dashboard data...",RETRY_MSG=ADMIN_UI?"Try again":"Pr\xF8v igen";(function(){const t=document.getElementById("initial-loading-msg");t&&(t.textContent=LOADING_MSG)})();function resolveClientSlug(){if(document.body.dataset.clientSlug)return document.body.dataset.clientSlug;const e=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);return e[0]==="admin"&&e[1]?e[1]:e[0]&&e[0]!=="admin"&&e[0]!=="index.html"?e[0]:new URLSearchParams(window.location.search).get("client")||"suntech-nordic"}const CLIENT_SLUG=resolveClientSlug();let tenantParams={},facebookClientId=CLIENT_SLUG,setupAccount=null,setupPipelines=[],metricsModelChangeMode=!1;function esc(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function renderBrandTopbar(e=""){return`
    <header class="brand-topbar">
      <div class="brand-topbar-left">
        <img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" />
      </div>
      ${e?`<div class="brand-topbar-right">${e}</div>`:""}
    </header>
  `}function wrapDashboardShell(e){return`<div class="dashboard-shell">${e}</div>`}function showToast(e,t="info"){const n=document.getElementById("toast-host");if(!n)return;const a=document.createElement("div");a.className=`toast${t==="error"?" toast--error":t==="success"?" toast--success":""}`,a.textContent=e,n.appendChild(a),setTimeout(()=>a.remove(),4200)}function fmtDkk(e){return new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0))}function fmtRevenueDkk(e){const t=Math.round(Number(e)||0);if(t>=1e6){const n=t/1e6;return`${new Intl.NumberFormat("da-DK",{minimumFractionDigits:n%1===0?0:2,maximumFractionDigits:2}).format(n)}M kr`}return`${fmtDkk(t)} kr`}function clientNeedsAction(e){return!!(e&&e!=="ready"&&e!=="syncing")}function clientActionHint(e){return{syncing:"Sync in progress...",needs_token:"Action needed \u2014 add GHL token in Settings",needs_metrics_model:"Action needed \u2014 choose metrics model in Settings",needs_pipelines:"Action needed \u2014 map pipelines in Settings",needs_sync:"Action needed \u2014 sync data from Settings or click Sync",needs_review:"Action needed \u2014 review client setup in Settings",sync_error:"Sync failed \u2014 open Settings and try again"}[e]||"Action needed \u2014 open Settings to finish setup"}function requestGhlUserData(e=8e3){return new Promise(t=>{if(window.self===window.top){t(null);return}const n=setTimeout(()=>{window.removeEventListener("message",a),t(null)},e);function a(o){o.data?.message==="REQUEST_USER_DATA_RESPONSE"&&o.data.payload&&(clearTimeout(n),window.removeEventListener("message",a),t(o.data.payload))}window.addEventListener("message",a),window.parent.postMessage({message:"REQUEST_USER_DATA"},"*")})}async function resolveTenantParams(){const e=new URLSearchParams(window.location.search);if(IS_ADMIN_HUB)return{};if(IS_ADMIN_CLIENT||IS_CLIENT_VIEW)return{client:CLIENT_SLUG};if(e.get("client"))return{client:e.get("client")};const t=e.get("location_id")||e.get("locationId");return t?{location_id:t}:{client:CLIENT_SLUG}}let CLIENT_ACCESS_KEY=new URLSearchParams(window.location.search).get("key")||"";function appendTenantParams(e){tenantParams.location_id?e.set("location_id",tenantParams.location_id):tenantParams.client&&e.set("client",tenantParams.client),CLIENT_ACCESS_KEY&&e.set("key",CLIENT_ACCESS_KEY)}const ADMIN_API_KEY_STORAGE="cenhub_admin_api_key";let currentStaffUser=null;function getAdminApiKey(){return localStorage.getItem(ADMIN_API_KEY_STORAGE)||""}function redirectToLogin(){const e=`${window.location.pathname}${window.location.search}`;window.location.href=`/login?next=${encodeURIComponent(e)}`}const ICON_SEARCH='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',ICON_PLUS='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',ICON_CALENDAR='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/></svg>',ICON_CHEVRON_LEFT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',ICON_CHEVRON_RIGHT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',ICON_SYNC='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',ICON_CHEVRON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',ICON_CHART='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',ICON_CHECK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',ICON_LAYER='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',ICON_MERGE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="15" r="2.4"/><path d="M6 8.4V15.6"/><path d="M8.2 6.4C14 6.4 14 12.6 15.8 13.4"/></svg>',ICON_TARGET='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',ICON_LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>',ICON_UNLOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 017.8-1.2"/></svg>',ICON_TAG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 12.7L12.7 20.6a2 2 0 01-2.8 0l-7-7a2 2 0 010-2.8L10.8 3H19a2 2 0 012 2v7.7z"/><circle cx="15" cy="8" r="1.2"/></svg>',ICON_HASH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/></svg>',ICON_EDIT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',ICON_WARNING='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.6 18a1.5 1.5 0 001.3 2.2h16.2a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-3.4 0z"/><path d="M12 9v4"/><path d="M12 16.5h.01"/></svg>';(function(t){const n=["#ff6a00","#138b53","#0085f2","#dc640a","#833b08","#a07868","#ff9147","#6b5348"],a={open:"#0085f2",won:"#138b53",lost:"#dc640a",abandoned:"#a07868"};function o(l){const c=String(l).match(/^(\d{4})-W(\d{2})$/);if(!c)return null;const d=Number(c[1]),h=Number(c[2]),s=new Date(Date.UTC(d,0,4)),u=s.getUTCDay()||7,b=new Date(s);b.setUTCDate(s.getUTCDate()-u+1);const y=new Date(b);y.setUTCDate(b.getUTCDate()+(h-1)*7);const $=new Date(y);return $.setUTCDate(y.getUTCDate()+3),{monday:new Date(y.getUTCFullYear(),y.getUTCMonth(),y.getUTCDate()),thursday:new Date($.getUTCFullYear(),$.getUTCMonth(),$.getUTCDate())}}function i(l){let c=0;for(let d=1;d<=l.getDate();d+=1)new Date(l.getFullYear(),l.getMonth(),d).getDay()===1&&(c+=1);return c}function r(l){const c=o(l);if(!c)return String(l).replace("-W"," W");const d=c.monday,h=d.toLocaleDateString("da-DK",{month:"short"}).replace(".","").replace(/^\w/u,u=>u.toUpperCase()),s=i(d);return`${h} W${s}`}function v(l){const[c,d]=String(l).split("-");return new Date(Number(c),Number(d)-1,1).toLocaleDateString("da-DK",{month:"short",year:"2-digit"})}function p(l,c=18){const d=String(l);return d.length>c?`${d.slice(0,c-1)}\u2026`:d}function f(){return{text:"#1a1208",muted:"#6b5348",grid:"rgba(26, 18, 8, 0.1)",border:"#e8e0d8",tooltipBg:"#ffffff",tooltipBorder:"#e8e0d8",tooltipText:"#1a1208"}}function m(l,c,d,h){return{labels:l.map(s=>h(s[c])),values:l.map(s=>Number(s[d])||0)}}function k(l){const c=Number(l)||0;return c>=1e6?`${(c/1e6).toFixed(1)}M`:c>=1e3?`${Math.round(c/1e3)}K`:c}function T(l){const c=new Map((l.monthlyAdSpend||[]).map(s=>[s.month,Number(s.spend)||0])),d=new Map((l.monthlyRevenue||[]).map(s=>[s.month,Number(s.revenue)||0])),h=[...new Set([...c.keys(),...d.keys()])].sort();return{dualAxis:!0,labels:h.map(s=>v(s)),spendValues:h.map(s=>c.get(s)||0),revenueValues:h.map(s=>d.get(s)||0)}}function C(l,c,d){const h=c.spendValues.some(s=>s>0)||c.revenueValues.some(s=>s>0);return!c.labels.length||!h?null:{type:"bar",data:{labels:c.labels,datasets:[{type:"bar",label:"Ad Spend",data:c.spendValues,backgroundColor:"#ff6a00cc",borderColor:"#ff6a00",borderWidth:2,borderRadius:6,maxBarThickness:42,yAxisID:"y",order:2},{type:"line",label:"Won Revenue",data:c.revenueValues,backgroundColor:"#138b5333",borderColor:"#138b53",borderWidth:2.5,fill:!0,tension:.35,pointRadius:4,pointHoverRadius:6,yAxisID:"y1",order:1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"bottom",align:"center",labels:{color:d.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:d.tooltipBg,borderColor:d.tooltipBorder,borderWidth:1,titleColor:d.tooltipText,bodyColor:d.muted,padding:12,callbacks:{label(s){const u=s.parsed.y??0;return`${s.dataset.label}: Dkr ${Math.round(u).toLocaleString("da-DK")}`}}}},scales:{x:{ticks:{color:d.muted,maxRotation:45,minRotation:0},grid:{color:d.grid},border:{color:d.border}},y:{type:"linear",position:"left",title:{display:!0,text:"Ad Spend (Dkr)",color:"#ff6a00",font:{size:11,weight:"600"}},ticks:{color:"#ff6a00",callback:k},grid:{color:d.grid},border:{color:d.border},beginAtZero:!0},y1:{type:"linear",position:"right",title:{display:!0,text:"Won Revenue (Dkr)",color:"#138b53",font:{size:11,weight:"600"}},ticks:{color:"#138b53",callback:k},grid:{drawOnChartArea:!1},border:{color:d.border},beginAtZero:!0}}}}}const w={weeklyRevenue:{title:"Won Revenue (Weekly)",defaultType:"area",format:"currency",extract(l){return m(l.weeklyRevenue||[],"week","revenue",r)}},monthlyRevenue:{title:"Won Revenue (Monthly)",defaultType:"area",format:"currency",extract(l){return m(l.monthlyRevenue||[],"month","revenue",v)}},weeklyLeads:{title:"New Leads (Weekly)",defaultType:"area",format:"number",extract(l){return m(l.weeklyLeads||[],"week","count",r)}},monthlyLeads:{title:"New Leads (Monthly)",defaultType:"area",format:"number",extract(l){return m(l.monthlyLeads||[],"month","count",v)}},conversionTrend:{title:"Conversion Rate Trend",defaultType:"line",format:"percent",extract(l){return m(l.monthlyConversion||[],"month","rate",v)}},statusBreakdown:{title:"Opportunity Status",defaultType:"doughnut",format:"number",extract(l){const c=l.chartStatusBreakdown||l.statusBreakdown||{},d=["open","won","lost","abandoned"];return{labels:["Open","Won","Lost","Abandoned"],values:d.map(h=>Number(c[h])||0),colors:d.map(h=>a[h])}}},marketingSpendComparison:{title:"Facebook Ad Spend",defaultType:"area",format:"currency",extract(l){return m((l.monthlyAdSpend||[]).slice(-8),"month","spend",v)}},monthlyCostPerLead:{title:"Cost per Lead (Monthly)",defaultType:"area",format:"currency",extract(l){return m(l.monthlyCostPerLead||[],"month","cpl",v)}}};function S(l,c,d,h){const s=Number(l)||0,u=Array.isArray(d)?d[h]:c;return u==="ratio"?`${s.toFixed(2)}x`:u==="currency"||c==="currency"?`Dkr ${Math.round(s).toLocaleString("da-DK")}`:u==="percent"||c==="percent"?`${s.toFixed(1)}%`:Math.round(s).toLocaleString("da-DK")}function A(l,c,d){const h=w[l];if(!h)return null;const s=h.extract(c),u=f();if(s.dualAxis||d==="dualAxis")return C(h,s,u);if(!s.labels?.length||s.values.every(g=>g===0))return null;const b=["pie","doughnut","polarArea"].includes(d),y=s.colors||s.labels.map((g,D)=>n[D%n.length]),$=d==="area"?"line":d==="horizontalBar"?"bar":d,F=`${n[0]}55`,I=d==="doughnut",M={label:h.title,data:s.values,backgroundColor:b?I?y:y.map(g=>`${g}cc`):s.colors?s.colors.map(g=>`${g}cc`):d==="area"?F:`${n[0]}cc`,borderColor:b?y:s.colors||n[0],borderWidth:b?I?0:1:2,fill:d==="area",tension:.35,borderRadius:b?0:6,maxBarThickness:42,...I?{cutout:"62%",borderAlign:"inner"}:{}};return{type:$,data:{labels:s.labels,datasets:[M]},options:{responsive:!0,maintainAspectRatio:I?!1:b,indexAxis:d==="horizontalBar"?"y":"x",plugins:{legend:{display:b,position:"bottom",align:"center",labels:{color:u.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:u.tooltipBg,borderColor:u.tooltipBorder,borderWidth:1,titleColor:u.tooltipText,bodyColor:u.muted,padding:12,callbacks:{label(g){const D=g.parsed,P=typeof D=="object"?D.y??D.x??0:D??0;return`${g.label}: ${S(P,h.format,s.valueFormats,g.dataIndex)}`}}}},...I?{layout:{padding:8},devicePixelRatio:typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1,elements:{arc:{borderAlign:"inner"}}}:{},scales:b?{}:{x:{ticks:{color:u.muted,maxRotation:45,minRotation:0},grid:{color:u.grid},border:{color:u.border}},y:{ticks:{color:u.muted,callback(g,D){return h.format==="mixed"&&s.valueFormats?.[D]==="ratio"?`${Number(g).toFixed(2)}x`:h.format==="currency"||s.valueFormats?.[D]==="currency"?g>=1e6?`${(g/1e6).toFixed(1)}M`:g>=1e3?`${Math.round(g/1e3)}K`:g:h.format==="percent"?`${g}%`:g}},grid:{color:u.grid},border:{color:u.border},beginAtZero:!0}}}}}t.DashboardCharts={CHART_DEFINITIONS:w,buildChartConfig:A,formatTooltipValue:S}})(window);const STORAGE_KEY=`cenhub_display_${CLIENT_SLUG}`,LEGACY_STORAGE_KEY="suntech-dashboard-display",PIPELINE_KEY="suntech-dashboard-pipelines",DISPLAY_OPTIONS={kpis:{totalRevenue:"Total Revenue",adSpend:"Ad Spend",roas:"ROAS",roasDk:"ROAS (DK)",poas:"POAS",poasDk:"POAS (DK)",costPerLead:"Cost per Lead",costPerWonClient:"Cost per Won Client",clientsWon:"Clients Won",totalLeads:"Total Leads",totalLeadsValue:"Total Leads Value",averageLeadValue:"Average Lead Value",conversionRate:"Conversion Rate",totalBundlinje:"Total Bundlinje",openLeads:"Open Leads",openPipelineValue:"Open Pipeline Value",averageWonDealSize:"Avg Won Deal Size"},sections:{statusBreakdown:"Opportunity Status (Cards)",sourceReport:"Lead Source Report",assigneeReport:"Leads Closed by Assignee",pipelineBreakdown:"Pipeline Breakdown"},charts:{weeklyRevenue:"Won Revenue (Weekly)",monthlyRevenue:"Won Revenue (Monthly)",marketingSpendComparison:"Facebook Ad Spend",monthlyCostPerLead:"Cost per Lead (Monthly)",weeklyLeads:"New Leads (Weekly)",monthlyLeads:"New Leads (Monthly)",conversionTrend:"Conversion Rate Trend",statusBreakdown:"Opportunity Status"},statusItems:{open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned"},columns:{sourceReport:{totalLeads:"Total leads",totalValue:"Total values",open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned",winPct:"Win %"},assigneeReport:{won:"Won",totalLeads:"Total leads",wonValue:"Won revenue",totalValue:"Total value"},pipelineBreakdown:{count:"Leads",won:"Won",monetary:"Value",profit:"Bundlinje",wonValue:"Won revenue"}}},state={pipelineIds:usesClientPipelineDefaults()?[]:loadPipelineSelection(),status:"all",source:"all",assignedTo:"all",dateField:"createdAt",dateFrom:"",dateTo:"",adSpend:"",preset:"all"};let cachedData=null,cachedFacebookMetrics=null,cachedMonthlyAdSpend=null,availablePipelines=[],display=loadDisplayPrefs(),pipelineDefaultsApplied=!1,chartInstances={},chartFieldsCache=null,chartFieldsCacheKey=null,lastFetchedAt=0;const DATA_FRESH_MS=60*1e3,CHART_FIELD_KEYS=["weeklyRevenue","monthlyRevenue","weeklyLeads","monthlyLeads","monthlyLeadsValue","monthlyConversion","chartStatusBreakdown"];function getChartCacheKey(){return[[...state.pipelineIds].sort().join(","),state.status,state.source,state.assignedTo,state.dateField,state.dateFrom||"",state.dateTo||""].join("|")}function cacheChartFields(e){chartFieldsCache={},CHART_FIELD_KEYS.forEach(t=>{e[t]!==void 0&&(chartFieldsCache[t]=e[t])}),chartFieldsCacheKey=getChartCacheKey()}function applyChartFieldsCache(e){if(!!!(state.dateFrom||state.dateTo))return cacheChartFields(e),e;if(chartFieldsCache&&chartFieldsCacheKey===getChartCacheKey()){const n={...e};return CHART_FIELD_KEYS.forEach(a=>{chartFieldsCache[a]!==void 0&&(n[a]=chartFieldsCache[a])}),n}return cacheChartFields(e),e}function getDefaultChartPrefs(){const e={};return(window.DashboardCharts?Object.keys(DashboardCharts.CHART_DEFINITIONS):Object.keys(DISPLAY_OPTIONS.charts)).forEach(n=>{e[n]=!0}),e}function destroyCharts(){Object.values(chartInstances).forEach(e=>e.destroy()),chartInstances={}}function mountCharts(e){typeof Chart>"u"||!window.DashboardCharts||(destroyCharts(),Object.keys(DashboardCharts.CHART_DEFINITIONS).forEach(t=>{if(!isVisible("charts",t))return;const n=DashboardCharts.CHART_DEFINITIONS[t],a=document.getElementById(`chart-${t}`);if(!a)return;const i=a.closest(".chart-card")?.querySelector(".chart-empty"),r=n?.defaultType||"bar",v=DashboardCharts.buildChartConfig(t,e,r);if(!v){a.style.display="none",i&&(i.style.display="block");return}a.style.display="block",i&&(i.style.display="none"),chartInstances[t]=new Chart(a,v)}))}function usesClientPipelineDefaults(){return IS_CLIENT_VIEW||IS_ADMIN}function getPipelineStorageKey(){return`cenhub_pipelines_${facebookClientId||CLIENT_SLUG}`}function loadPipelineSelection(){try{const e=JSON.parse(localStorage.getItem(getPipelineStorageKey())||"[]");return Array.isArray(e)?e:[]}catch{return[]}}function getAllPipelineIds(e){return e.map(t=>t.id)}function getDefaultPipelineIds(e,t=[]){const n=getAllPipelineIds(e),a=(t||[]).filter(o=>n.includes(o));return a.length?a:n.length?n:[]}function ensurePipelineDefaults(e,t=[]){if(!e.length)return;if(usesClientPipelineDefaults()){state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0;return}const n=getAllPipelineIds(e);let a=loadPipelineSelection();if(!a.length)try{a=JSON.parse(localStorage.getItem(PIPELINE_KEY)||"[]")}catch{a=[]}!a.length||!pipelineDefaultsApplied?(a.length?(state.pipelineIds=a.filter(o=>n.includes(o)),state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t))):state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0,savePipelineSelection()):state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t),savePipelineSelection())}function ensurePipelineSelectionBeforeFetch(){return state.pipelineIds.length?!0:availablePipelines.length?(state.pipelineIds=getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds),state.pipelineIds.length&&!usesClientPipelineDefaults()&&savePipelineSelection(),state.pipelineIds.length>0):!1}function savePipelineSelection(){localStorage.setItem(getPipelineStorageKey(),JSON.stringify(state.pipelineIds))}function isPipelineSelected(e){return state.pipelineIds.includes(e)}function isAllPipelinesSelected(e){const t=getAllPipelineIds(e);return t.length>0&&t.every(n=>state.pipelineIds.includes(n))}function selectAllPipelines(e){state.pipelineIds=getAllPipelineIds(e),savePipelineSelection()}function clearPipelineSelection(){state.pipelineIds=[],savePipelineSelection()}function setPipelineSelection(e){state.pipelineIds=[...new Set(e)],savePipelineSelection()}function togglePipelineSelection(e){isPipelineSelected(e)?state.pipelineIds=state.pipelineIds.filter(t=>t!==e):state.pipelineIds=[...state.pipelineIds,e],savePipelineSelection()}function formatSelectedPipelines(e){return state.pipelineIds.length?isAllPipelinesSelected(e)?"All pipelines":state.pipelineIds.map(t=>e.find(n=>n.id===t)?.name||t).join(", "):"None selected"}function renderPipelineChips(e){return state.pipelineIds.length?`
    <div class="pipeline-chips">
      ${state.pipelineIds.map(n=>e.find(a=>a.id===n)).filter(Boolean).map(n=>`
        <span class="pipeline-chip">${esc(n.name)}</span>
      `).join("")}
    </div>
  `:'<div class="pipeline-warning">Select at least one pipeline, then click Apply data filters.</div>'}function defaultDisplayPrefs(){const e={kpis:{},sections:{},charts:getDefaultChartPrefs(),statusItems:{},columns:{}};return Object.keys(DISPLAY_OPTIONS.kpis).forEach(t=>{e.kpis[t]=!0}),Object.keys(DISPLAY_OPTIONS.sections).forEach(t=>{e.sections[t]=!0}),Object.keys(DISPLAY_OPTIONS.charts).forEach(t=>{e.charts[t]=!0}),Object.keys(DISPLAY_OPTIONS.statusItems).forEach(t=>{e.statusItems[t]=!0}),Object.entries(DISPLAY_OPTIONS.columns).forEach(([t,n])=>{e.columns[t]={},Object.keys(n).forEach(a=>{e.columns[t][a]=!0})}),e}function loadDisplayPrefs(){if(IS_CLIENT_VIEW&&!IS_PREVIEW)return defaultDisplayPrefs();try{const e=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY)||"null");if(!e)return defaultDisplayPrefs();const t=defaultDisplayPrefs();return{kpis:{...t.kpis,...e.kpis},sections:{...t.sections,...e.sections},charts:{...t.charts,...e.charts},statusItems:{...t.statusItems,...e.statusItems},columns:{sourceReport:{...t.columns.sourceReport,...e.columns?.sourceReport||{}},assigneeReport:{...t.columns.assigneeReport,...e.columns?.assigneeReport||{}},pipelineBreakdown:{...t.columns.pipelineBreakdown,...e.columns?.pipelineBreakdown||{}}}}}catch{return defaultDisplayPrefs()}}function ensureChartsVisible(){const e=Object.keys(DISPLAY_OPTIONS.charts);e.some(n=>display.charts[n]!==!1)||(e.forEach(n=>{display.charts[n]=!0}),saveDisplayPrefs())}function saveDisplayPrefs(){localStorage.setItem(STORAGE_KEY,JSON.stringify(display))}function isVisible(e,t,n){return e==="columns"?display.columns[n]?.[t]!==!1:display[e]?.[t]!==!1}function toggleDisplay(e,t,n){e==="columns"?display.columns[n][t]=!display.columns[n][t]:display[e][t]=!display[e][t],saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}function setAllDisplay(e,t,n){e==="columns"?Object.keys(DISPLAY_OPTIONS.columns[n]).forEach(a=>{display.columns[n][a]=t}):Object.keys(DISPLAY_OPTIONS[e]).forEach(a=>{display[e][a]=t}),saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}const fmt=e=>new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0)),fmtCompact=e=>{const t=Number(e)||0;return t>=1e6?`${(t/1e6).toFixed(2)}M`:t>=1e3?`${(t/1e3).toFixed(2)}K`:fmt(t)},fmtPct=e=>`${(Number(e)||0).toFixed(2)}%`,fmtRoas=e=>{const t=Number(e)||0;return t>0?`${t.toFixed(2)}x`:"\u2014"};function formatActiveDateFilter(e){if(!e.dateFrom&&!e.dateTo)return"Till date";const t=getDashboardTimeZone();if(window.MarketingMetrics?.formatShortDateLabel){const n=window.MarketingMetrics.formatShortDateLabel(e.dateFrom,t),a=window.MarketingMetrics.formatShortDateLabel(e.dateTo,t);if(n&&a)return`${n} \u2013 ${a}`}return`${e.dateFrom||"start"} to ${e.dateTo||"now"}`}function showDateRangeError(e){document.querySelectorAll("#date-range-error").forEach(t=>{t.textContent=e,t.hidden=!e})}function clearDateRangeError(){showDateRangeError("")}function needsFreshData(){return!lastFetchedAt||Date.now()-lastFetchedAt>DATA_FRESH_MS}function buildQuery(e,t={}){const n=new URLSearchParams,a=getAllPipelineIds(e||[]),o=state.pipelineIds.filter(i=>a.includes(i));if(!o.length)throw new Error("Select at least one pipeline.");return n.set("pipelineIds",o.join(",")),state.dateField&&n.set("dateField",state.dateField),state.dateFrom&&n.set("dateFrom",state.dateFrom),state.dateTo&&n.set("dateTo",state.dateTo),["status","source","assignedTo","adSpend"].forEach(i=>{state[i]&&state[i]!=="all"&&n.set(i,state[i])}),appendTenantParams(n),t.forceFresh&&n.set("fresh","1"),n.toString()}function formatDateInput(e){const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${a}`}function getDashboardTimeZone(){return cachedData?.account?.timezone||"Europe/Copenhagen"}function getCalendarPartsInTimeZone(e,t=new Date){const n=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(t);return{year:Number(n.find(a=>a.type==="year")?.value),month:Number(n.find(a=>a.type==="month")?.value),day:Number(n.find(a=>a.type==="day")?.value)}}function formatMonthDateRange(e,t){const n=`${e}-${String(t).padStart(2,"0")}-01`,a=new Date(e,t,0).getDate(),o=`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`;return{start:n,end:o}}const datePickerState={inputId:null,anchorEl:null,viewYear:null,viewMonth:null};let datePickerListenersBound=!1;function isoFromParts(e,t,n){const a=Number(n);return!e||!t||!Number.isFinite(a)?"":`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`}function formatPickerDisplayLabel(e,t){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return t;const n=getDashboardTimeZone();return window.MarketingMetrics?.formatShortDateLabel&&window.MarketingMetrics.formatShortDateLabel(e,n)||e}function ensureDatePickerPopover(){if(document.getElementById("date-picker-popover"))return;const e=document.createElement("div");e.id="date-picker-backdrop",e.className="date-picker-backdrop",e.hidden=!0,e.addEventListener("click",closeDatePicker),document.body.appendChild(e);const t=document.createElement("div");t.id="date-picker-popover",t.className="date-picker-popover",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),document.body.appendChild(t)}function syncDatePickerDisplays(){[{id:"dateFrom",key:"dateFrom",placeholder:"Pick start date"},{id:"dateTo",key:"dateTo",placeholder:"Pick end date"}].forEach(({id:e,key:t,placeholder:n})=>{const a=document.getElementById(e),o=document.getElementById(`${e}-display`),i=document.getElementById(`${e}-trigger`),r=state[t]??"";a&&(a.value=r),o&&(o.textContent=formatPickerDisplayLabel(r,n)),i?.classList.toggle("is-empty",!r),i?.classList.toggle("has-value",!!r)})}function getStateDateValue(e){return state[e]??""}function getDatePickerViewMonth(e){const t=getStateDateValue(e);if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[n,a]=t.split("-").map(Number);return{year:n,month:a}}return getCalendarPartsInTimeZone(getDashboardTimeZone())}function getTodayIso(){const e=getCalendarPartsInTimeZone(getDashboardTimeZone());return isoFromParts(e.year,e.month,e.day)}function isStartDateDisabled(e){return e>=getTodayIso()}function isFutureDateDisabled(e){return e>getTodayIso()}function isFutureMonthView(e,t){const n=getCalendarPartsInTimeZone(getDashboardTimeZone());return e>n.year||e===n.year&&t>n.month}function isDatePickerDayDisabled(e,t){return t==="dateFrom"&&isStartDateDisabled(e)?!0:isFutureDateDisabled(e)}function renderDatePickerDayCell(e,t,n,a,o,i,r,v){const p=["date-picker-day"];if(n&&p.push("is-outside"),e===a&&p.push("is-today"),e===o&&p.push("is-selected"),i&&r){const f=i<=r?i:r,m=i<=r?r:i;e>=f&&e<=m&&p.push("is-in-range")}return e===i&&p.push("is-range-start"),e===r&&p.push("is-range-end"),isDatePickerDayDisabled(e,v)?(p.push("is-disabled"),`<button type="button" class="${p.join(" ")}" disabled aria-disabled="true">${t}</button>`):`<button type="button" class="${p.join(" ")}" onclick="selectDatePickerDay('${e}')">${t}</button>`}function renderDatePickerPopover(){const e=document.getElementById("date-picker-popover");if(!e||!datePickerState.inputId)return;const{viewYear:t,viewMonth:n,inputId:a}=datePickerState,o=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(t,n-1,1)),i=["Mo","Tu","We","Th","Fr","Sa","Su"],v=(new Date(t,n-1,1).getDay()+6)%7,p=new Date(t,n,0).getDate(),f=new Date(t,n-1,0).getDate(),m=getCalendarPartsInTimeZone(getDashboardTimeZone()),k=isoFromParts(m.year,m.month,m.day),T=getStateDateValue(a),C=getStateDateValue("dateFrom"),w=getStateDateValue("dateTo");let S="";for(let u=v-1;u>=0;u-=1){const b=f-u,y=n===1?12:n-1,$=n===1?t-1:t,F=isoFromParts($,y,b);S+=renderDatePickerDayCell(F,b,!0,k,T,C,w,a)}for(let u=1;u<=p;u+=1){const b=isoFromParts(t,n,u);S+=renderDatePickerDayCell(b,u,!1,k,T,C,w,a)}const A=(7-(v+p)%7)%7;for(let u=1;u<=A;u+=1){const b=n===12?1:n+1,y=n===12?t+1:t,$=isoFromParts(y,b,u);S+=renderDatePickerDayCell($,u,!0,k,T,C,w,a)}const l=a==="dateFrom"?'<span class="date-picker-hint">Start date must be before today</span>':"",c=a==="dateTo"?'<button type="button" class="date-picker-footer-btn primary" onclick="setDatePickerToday()">Today</button>':"",d=n===12?1:n+1,h=n===12?t+1:t,s=!isFutureMonthView(h,d);e.innerHTML=`
    <div class="date-picker-panel">
      <div class="date-picker-header">
        <div class="date-picker-title">${esc(o)}</div>
        <div class="date-picker-nav">
          <button type="button" class="date-picker-nav-btn" aria-label="Previous month" onclick="shiftDatePickerMonth(-1)">${ICON_CHEVRON_LEFT}</button>
          <button type="button" class="date-picker-nav-btn" aria-label="Next month" onclick="shiftDatePickerMonth(1)" ${s?"":"disabled"}>${ICON_CHEVRON_RIGHT}</button>
        </div>
      </div>
      <div class="date-picker-weekdays">
        ${i.map(u=>`<div class="date-picker-weekday">${u}</div>`).join("")}
      </div>
      <div class="date-picker-grid">${S}</div>
      <div class="date-picker-footer">
        ${l}
        <button type="button" class="date-picker-footer-btn" onclick="clearDatePickerField()">Clear</button>
        ${c}
      </div>
    </div>
  `}function positionDatePickerPopover(){const e=document.getElementById("date-picker-popover"),t=datePickerState.anchorEl;if(!e||!t)return;e.hidden=!1,e.style.visibility="hidden",e.style.left="0",e.style.top="0",e.style.transform="";const n=t.getBoundingClientRect(),a=e.getBoundingClientRect(),o=8;let i=n.bottom+o,r=n.left;window.innerWidth<=640?(r=Math.max(16,(window.innerWidth-a.width)/2),i=Math.max(16,(window.innerHeight-a.height)/2),e.style.transform="none"):(r+a.width>window.innerWidth-16&&(r=window.innerWidth-a.width-16),r<16&&(r=16),i+a.height>window.innerHeight-16&&(i=Math.max(16,n.top-a.height-o))),e.style.top=`${i}px`,e.style.left=`${r}px`,e.style.visibility=""}function openDatePicker(e,t){ensureDatePickerPopover();const n=document.getElementById("date-picker-popover"),a=document.getElementById("date-picker-backdrop");if(!n||!a||!t)return;if(datePickerState.inputId===e&&!n.hidden){closeDatePicker();return}closeDatePicker(),datePickerState.inputId=e,datePickerState.anchorEl=t;const o=getDatePickerViewMonth(e);datePickerState.viewYear=o.year,datePickerState.viewMonth=o.month,renderDatePickerPopover(),a.hidden=!1,t.classList.add("is-active"),positionDatePickerPopover()}function closeDatePicker(){const e=document.getElementById("date-picker-popover"),t=document.getElementById("date-picker-backdrop");e&&(e.hidden=!0),t&&(t.hidden=!0),datePickerState.anchorEl?.classList.remove("is-active"),datePickerState.inputId=null,datePickerState.anchorEl=null}function shiftDatePickerMonth(e){let{viewYear:t,viewMonth:n}=datePickerState;n+=e,n<1?(n=12,t-=1):n>12&&(n=1,t+=1),!(e>0&&isFutureMonthView(t,n))&&(datePickerState.viewYear=t,datePickerState.viewMonth=n,renderDatePickerPopover(),positionDatePickerPopover())}function selectDatePickerDay(e){const t=datePickerState.inputId;if(!t||!/^\d{4}-\d{2}-\d{2}$/.test(e))return;if(isDatePickerDayDisabled(e,t)){showDateRangeError(t==="dateFrom"?"Start date must be before today.":"End date cannot be after today.");return}t==="dateFrom"&&(state.dateFrom=e),t==="dateTo"&&(state.dateTo=e);const n=document.getElementById(t);n&&(n.value=e),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function setDatePickerToday(){if(datePickerState.inputId==="dateFrom"){showDateRangeError("Start date must be before today.");return}const e=getCalendarPartsInTimeZone(getDashboardTimeZone());selectDatePickerDay(isoFromParts(e.year,e.month,e.day))}function clearDatePickerField(){const e=datePickerState.inputId;if(!e)return;state[e]="";const t=document.getElementById(e);t&&(t.value=""),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function handleDatePickerEscape(e){e.key==="Escape"&&closeDatePicker()}function initDatePickers(){ensureDatePickerPopover(),syncDatePickerDisplays(),datePickerListenersBound||(document.addEventListener("keydown",handleDatePickerEscape),window.addEventListener("resize",closeDatePicker),datePickerListenersBound=!0)}let lastCustomDateFrom="",lastCustomDateTo="";function getPresetDateRange(e){const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="month")return formatMonthDateRange(n,a);if(e==="lastMonth"){let o=n,i=a-1;return i<1&&(i=12,o-=1),formatMonthDateRange(o,i)}return e==="year"?{start:`${n}-01-01`,end:`${n}-12-31`}:null}function isPresetGeneratedRange(e,t){return!e||!t?!1:["month","lastMonth","year"].some(n=>{const a=getPresetDateRange(n);return a&&e===a.start&&t===a.end})}function saveCustomDateRange(){!state.dateFrom||!state.dateTo||isPresetGeneratedRange(state.dateFrom,state.dateTo)||(lastCustomDateFrom=state.dateFrom,lastCustomDateTo=state.dateTo)}function restoreCustomDateRange(){if(lastCustomDateFrom&&lastCustomDateTo&&!isPresetGeneratedRange(lastCustomDateFrom,lastCustomDateTo)){state.dateFrom=lastCustomDateFrom,state.dateTo=lastCustomDateTo;return}state.dateFrom="",state.dateTo=""}function setPreset(e){state.preset==="custom"&&e!=="custom"&&saveCustomDateRange(),state.preset=e;const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="all")state.dateFrom="",state.dateTo="",state.dateField="createdAt";else if(e==="month"){const o=formatMonthDateRange(n,a);state.dateFrom=o.start,state.dateTo=o.end,state.dateField="lastStatusChangeAt"}else if(e==="lastMonth"){let o=n,i=a-1;i<1&&(i=12,o-=1);const r=formatMonthDateRange(o,i);state.dateFrom=r.start,state.dateTo=r.end,state.dateField="lastStatusChangeAt"}else if(e==="year"){const o=getPresetDateRange("year");state.dateFrom=o.start,state.dateTo=o.end,state.dateField="lastStatusChangeAt"}else e==="custom"&&(state.dateField="createdAt",restoreCustomDateRange())}function updateCustomDateRowVisibility(){document.querySelectorAll("#custom-date-row").forEach(e=>{e.hidden=state.preset!=="custom"})}function updateFilterUi(){const e=document.getElementById("dateFrom"),t=document.getElementById("dateTo"),n=document.getElementById("adSpend");e&&(e.value=state.dateFrom||""),t&&(t.value=state.dateTo||""),n&&(n.value=state.adSpend||""),["status","source","assignedTo","dateField"].forEach(a=>{const o=document.getElementById(a);o&&(o.value=state[a])}),document.querySelectorAll("[data-preset]").forEach(a=>{a.classList.toggle("active",a.dataset.preset===state.preset)}),updateCustomDateRowVisibility(),syncDatePickerDisplays(),refreshPipelinePanel()}function onManualDateChange(){if(syncFiltersFromDom(),state.preset="custom",state.dateField="createdAt",state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date."),updateFilterUi();return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){state.dateFrom="";const e=document.getElementById("dateFrom");e&&(e.value=""),showDateRangeError("Start date must be before today."),updateFilterUi();return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){state.dateTo="";const e=document.getElementById("dateTo");e&&(e.value=""),showDateRangeError("End date cannot be after today."),updateFilterUi();return}clearDateRangeError(),updateFilterUi(),state.dateFrom&&state.dateTo&&(saveCustomDateRange(),applyDataFilters(!1))}function onFilterChange(e,t){state[e]=t,applyDataFilters(!1)}async function fetchJson(e,t){const n=new AbortController,a=setTimeout(()=>n.abort(),FETCH_TIMEOUT_MS),o=()=>n.abort();t?.addEventListener("abort",o);try{const i=await fetch(e,{signal:n.signal}),r=await i.json().catch(()=>({}));if(!i.ok)throw new Error(r.error||`Request failed (${i.status})`);return r}catch(i){throw i.name==="AbortError",i}finally{clearTimeout(a),t?.removeEventListener("abort",o)}}async function fetchFacebookMetrics(e){try{const t=new URLSearchParams({client:facebookClientId});return CLIENT_ACCESS_KEY&&t.set("key",CLIENT_ACCESS_KEY),await fetchJson(`/api/facebook-metrics?${t}`,e)}catch(t){if(t.name==="AbortError")throw t;return null}}function applyMarketingData(e,t){if(!window.MarketingMetrics)return e;const n=!!(state.dateFrom&&state.dateTo),a=window.MarketingMetrics.applyMarketingToDashboard(e,t,n?"custom":state.preset,{timeZone:e.account?.timezone||"Europe/Copenhagen",dateFrom:n?state.dateFrom:null,dateTo:n?state.dateTo:null});return a.monthlyAdSpend?.length&&(cachedMonthlyAdSpend=a.monthlyAdSpend),cachedMonthlyAdSpend?.length&&(a.monthlyAdSpend=cachedMonthlyAdSpend),window.MarketingMetrics?.buildMonthlyCostPerLead&&(a.monthlyCostPerLead=window.MarketingMetrics.buildMonthlyCostPerLead(a.monthlyAdSpend,a.monthlyLeads||e.monthlyLeads||[])),a}async function fetchDashboardData(e,t,n={}){const a=buildQuery(e,n),o=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,t);return applyChartFieldsCache(o)}async function bootstrapDashboardData(e,t={}){const n=new URLSearchParams;appendTenantParams(n),t.forceFresh&&n.set("fresh","1");const a=n.toString(),o=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,e);return o.account?.clientId&&(facebookClientId=o.account.clientId),applyChartFieldsCache(o)}function refreshPipelinePanel(){const e=document.getElementById("pipeline-panel");if(e){if(!availablePipelines.length){e.innerHTML='<div class="pipeline-note">Sync client data to load pipelines.</div>';return}e.innerHTML=renderPipelineSelector(availablePipelines)}}function selectAllPipelinesAction(){selectAllPipelines(availablePipelines),refreshPipelinePanel()}function clearPipelineSelectionAction(){clearPipelineSelection(),refreshPipelinePanel()}function togglePipelineSelectionAction(e){togglePipelineSelection(e),refreshPipelinePanel()}function selectCenhubPipelinesAction(){setPipelineSelection(getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds)),refreshPipelinePanel()}function renderPipelineSelector(e){return e.length?`
    <div class="pipeline-actions">
      <button type="button" class="widget-btn ${isAllPipelinesSelected(e)?"active":""}" onclick="selectAllPipelinesAction()">All pipelines</button>
      <button type="button" class="widget-btn" onclick="selectCenhubPipelinesAction()">Funnel only (Salg + Nye leads)</button>
      <button type="button" class="widget-btn" onclick="clearPipelineSelectionAction()">Clear all</button>
    </div>
    <div class="pipeline-list">
      ${e.map(t=>`
        <label class="pipeline-item">
          <input type="checkbox"
            ${isPipelineSelected(t.id)?"checked":""}
            onchange="togglePipelineSelectionAction('${t.id}')" />
          <span>${esc(t.name)}</span>
        </label>
      `).join("")}
    </div>
    ${renderPipelineChips(e)}
  `:'<div class="pipeline-note">No pipelines found.</div>'}function renderSelect(e,t,n,a){return`
    <div class="filter-group">
      <label for="${e}">${t}</label>
      <select id="${e}" onchange="onFilterChange('${e}', this.value)">
        ${n.map(o=>`
          <option value="${esc(o.id)}" ${o.id===a?"selected":""}>${esc(o.name)}</option>
        `).join("")}
      </select>
    </div>
  `}function renderCheckboxGroup(e,t,n,a){const o=Object.entries(n);return`
    <div class="display-group">
      <h3>${e}</h3>
      <div class="widget-actions" style="margin-bottom:10px">
        <button class="widget-btn" onclick="setAllDisplay('${t}', true${a?`, '${a}'`:""})">Select all</button>
        <button class="widget-btn" onclick="setAllDisplay('${t}', false${a?`, '${a}'`:""})">Clear all</button>
      </div>
      <div class="checkbox-list">
        ${o.map(([i,r])=>`
          <label class="checkbox-item">
            <input type="checkbox"
              ${isVisible(t,i,a)?"checked":""}
              onchange="toggleDisplay('${t}', '${i}'${a?`, '${a}'`:""})" />
            <span>${r}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `}function renderChartCard(e){const t=window.DashboardCharts?.CHART_DEFINITIONS?.[e];if(!t)return"";const n=["pie","doughnut","polarArea"].includes(t.defaultType);return`
    <div class="card chart-card">
      <div class="section-title">${t.title}</div>
      ${t.subtitle?`<div class="card-sub" style="margin-top:-4px;margin-bottom:12px">${t.subtitle}</div>`:""}
      <div class="chart-empty note" style="display:none">${ADMIN_UI?"No data for selected filters.":"Ingen data for den valgte periode."}</div>
      <div class="chart-canvas-wrap${n?" chart-canvas-wrap--circular":""}">
        <canvas id="chart-${e}"></canvas>
      </div>
    </div>
  `}function renderChartsSection(){if(typeof Chart>"u")return`
      <div class="panel">
        <div class="error-state" style="padding:24px">
          Charts could not load (Chart.js blocked). Check your internet connection or ad blocker.
        </div>
      </div>
    `;const e=Object.keys(DISPLAY_OPTIONS.charts).filter(t=>isVisible("charts",t));return e.length?`
    <div class="panel" id="charts-section">
      <div class="charts-panel-title">
        <h2>Charts</h2>
      </div>
      <div class="charts-grid">
        ${e.map(t=>renderChartCard(t)).join("")}
      </div>
    </div>
  `:`
      <div class="panel">
        <div class="empty-section">
          No charts enabled. Open <strong>Display options</strong> and tick items under <strong>Charts</strong>.
        </div>
      </div>
    `}function renderTable(e,t,n,a,o){const i=n.filter(r=>isVisible("columns",r.key,e));return i.length?`
    <table>
      <thead>
        <tr>
          <th>${t}</th>
          ${i.map(r=>`<th class="${r.align||""}">${r.label}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${a.length?a.map(r=>`
          <tr>
            <td>${o(r,"label")}</td>
            ${i.map(v=>`<td class="${v.align||""}">${o(r,v.key)}</td>`).join("")}
          </tr>
        `).join(""):`<tr><td colspan="${i.length+1}">Ingen data for valgte filtre.</td></tr>`}
      </tbody>
    </table>
  `:'<div class="empty-section">No columns selected for this table.</div>'}function renderDatePickerTrigger(e,t,n){const a=state[e]||"",o=formatPickerDisplayLabel(a,n);return`
    <div class="date-picker-field">
      <span class="date-picker-label">${t}</span>
      <button
        type="button"
        class="date-picker-trigger${a?"":" is-empty"}"
        id="${e}-trigger"
        aria-haspopup="dialog"
        aria-controls="date-picker-popover"
        onclick="openDatePicker('${e}', this)"
      >
        <span class="date-picker-icon" aria-hidden="true">${ICON_CALENDAR}</span>
        <span class="date-picker-value" id="${e}-display">${esc(o)}</span>
      </button>
      <input type="hidden" id="${e}" value="${esc(a)}" />
    </div>
  `}function renderCustomDateInputs(){return`
    <div class="custom-date-row" id="custom-date-row" ${state.preset!=="custom"?"hidden":""}>
      <div class="custom-date-range">
        ${renderDatePickerTrigger("dateFrom","From","Pick start date")}
        <span class="date-range-separator" aria-hidden="true">\u2192</span>
        ${renderDatePickerTrigger("dateTo","To","Pick end date")}
      </div>
      <div class="date-range-error" id="date-range-error" hidden></div>
    </div>
  `}function renderPresetControls(e=!1){return`
    <div class="preset-controls${e?" preset-controls--header":""}">
      <div class="preset-btn-row${e?" header-presets":""}">
        ${renderPresetButtons()}
      </div>
      ${renderCustomDateInputs()}
    </div>
  `}function renderPresetButtons(){return`
    <button type="button" class="preset-btn ${state.preset==="all"?"active":""}" data-preset="all" onclick="applyPreset('all')">Till date</button>
    <button type="button" class="preset-btn ${state.preset==="month"?"active":""}" data-preset="month" onclick="applyPreset('month')">This month</button>
    <button type="button" class="preset-btn ${state.preset==="lastMonth"?"active":""}" data-preset="lastMonth" onclick="applyPreset('lastMonth')">Last month</button>
    <button type="button" class="preset-btn ${state.preset==="year"?"active":""}" data-preset="year" onclick="applyPreset('year')">This year</button>
    <button type="button" class="preset-btn ${state.preset==="custom"?"active":""}" data-preset="custom" onclick="applyPreset('custom')">Custom</button>
  `}function renderAdminFiltersPanel(e){return`
    <div class="panel" id="admin-filters-panel">
      <div class="panel-title">Data filters</div>
      <div class="filters">
        <div class="filters-row">
          ${renderSelect("source","Source",e.sources,state.source)}
          ${renderSelect("assignedTo","Assignee",e.assignees,state.assignedTo)}
        </div>

        <div class="filters-row actions-row">
          ${renderPresetControls(!1)}
          <button type="button" class="refresh-btn primary" id="apply-filters-btn" onclick="applyDataFilters()">Apply data filters</button>
        </div>
      </div>
    </div>
  `}function renderAdminDisplayOptions(e){return`
    <details class="panel" id="admin-display-panel" ${e?"open":""}>
      <summary class="panel-title">Display options</summary>
      <div class="display-grid">
        ${renderCheckboxGroup("KPI cards","kpis",DISPLAY_OPTIONS.kpis)}
        ${renderCheckboxGroup("Charts","charts",DISPLAY_OPTIONS.charts)}
        ${renderCheckboxGroup("Sections","sections",DISPLAY_OPTIONS.sections)}
        ${renderCheckboxGroup("Status items","statusItems",DISPLAY_OPTIONS.statusItems)}
        ${renderCheckboxGroup("Source report columns","columns",DISPLAY_OPTIONS.columns.sourceReport,"sourceReport")}
        ${renderCheckboxGroup("Assignee report columns","columns",DISPLAY_OPTIONS.columns.assigneeReport,"assigneeReport")}
        ${renderCheckboxGroup("Pipeline report columns","columns",DISPLAY_OPTIONS.columns.pipelineBreakdown,"pipelineBreakdown")}
      </div>
    </details>
  `}function renderKpiSkeleton(){return`
    <div class="kpi-skeleton-grid">
      ${Array.from({length:6}).map(()=>'<div class="skeleton-block"></div>').join("")}
    </div>
  `}function clientKpiCopy(e,t){return IS_CLIENT_VIEW&&!IS_PREVIEW?t:e}function getAdSpendSubtitle(e){if(e.adSpendSource!=="facebook")return"No ad spend data for this period";if(state.preset==="all")return"Ad spend";const t=e.adSpendLabel;return!t||t==="Custom range"||t==="Till date"?"Ad spend":/^\d{4}$/.test(t)?`Ad spend year ${t}`:`Ad spend ${t.toLowerCase()}`}function renderKpiCards(e){const t=[];if(isVisible("kpis","totalRevenue")&&t.push(`
      <div class="card primary">
        <div class="card-label">Total Revenue</div>
        <div class="card-value">Dkr ${fmtCompact(e.totalRevenue)}</div>
        <div class="card-sub">${clientKpiCopy(e.hasDateFilter?`Won deal value in period (${fmt(e.wonOpportunityCount)} won deals)`:`Sum of won deal values (${fmt(e.wonOpportunityCount)} won deals)`,e.hasDateFilter?`Vundet oms\xE6tning i perioden (${fmt(e.wonOpportunityCount)} handler)`:`Samlet vundet oms\xE6tning (${fmt(e.wonOpportunityCount)} handler)`)}</div>
      </div>
    `),isVisible("kpis","adSpend")){const n=getAdSpendSubtitle(e);t.push(`
      <div class="card accent">
        <div class="card-label">Ad Spend</div>
        <div class="card-value">${e.adSpend>0?`Dkr ${fmtCompact(e.adSpend)}`:"\u2014"}</div>
        ${n?`<div class="card-sub">${n}</div>`:""}
      </div>
    `)}return isVisible("kpis","roas")&&t.push(`
      <div class="card accent">
        <div class="card-label">ROAS</div>
        <div class="card-value">${fmtRoas(e.roas)}</div>
        <div class="card-sub">Won revenue \xF7 ad spend</div>
      </div>
    `),isVisible("kpis","roasDk")&&t.push(`
      <div class="card accent">
        <div class="card-label">ROAS (DK)</div>
        <div class="card-value">${e.adSpend>0?`Dkr ${fmtCompact(e.roasDk)}`:"\u2014"}</div>
        <div class="card-sub">Won revenue \u2212 ad spend</div>
      </div>
    `),isVisible("kpis","poas")&&t.push(`
      <div class="card accent">
        <div class="card-label">POAS</div>
        <div class="card-value">${fmtRoas(e.poas)}</div>
        <div class="card-sub">Bundlinje \xF7 ad spend</div>
      </div>
    `),isVisible("kpis","poasDk")&&t.push(`
      <div class="card accent">
        <div class="card-label">POAS (DK)</div>
        <div class="card-value">${e.adSpend>0?`Dkr ${fmtCompact(e.poasDk)}`:"\u2014"}</div>
        <div class="card-sub">Bundlinje \u2212 ad spend</div>
      </div>
    `),isVisible("kpis","costPerLead")&&t.push(`
      <div class="card">
        <div class="card-label">Cost per Lead</div>
        <div class="card-value">${e.costPerLead>0?`Dkr ${fmtCompact(e.costPerLead)}`:"\u2014"}</div>
        <div class="card-sub">Ad spend \xF7 new leads in period</div>
      </div>
    `),isVisible("kpis","costPerWonClient")&&t.push(`
      <div class="card">
        <div class="card-label">Cost per Won Client</div>
        <div class="card-value">${e.costPerWonClient>0?`Dkr ${fmtCompact(e.costPerWonClient)}`:"\u2014"}</div>
        <div class="card-sub">${clientKpiCopy("Ad spend \xF7 clients won","Annonceforbrug \xF7 vundne kunder")}</div>
      </div>
    `),isVisible("kpis","clientsWon")&&t.push(`
      <div class="card">
        <div class="card-label">Clients Won</div>
        <div class="card-value">${fmt(e.clientsWon)}</div>
        <div class="card-sub">${clientKpiCopy(e.hasDateFilter?"Unique wins in period":"Unique won clients in win pipeline",e.hasDateFilter?"Unikke kunder vundet i perioden":"Unikke kunder vundet i alt")}</div>
      </div>
    `),isVisible("kpis","totalLeads")&&t.push(`
      <div class="card">
        <div class="card-label">Total Leads</div>
        <div class="card-value">${fmt(e.totalLeads)}</div>
        <div class="card-sub">${e.hasDateFilter||e.usingCenhubDefaults?"New opportunities created in selected period":"Opportunities in filter"}</div>
      </div>
    `),isVisible("kpis","totalLeadsValue")&&t.push(`
      <div class="card">
        <div class="card-label">Total Leads Value</div>
        <div class="card-value">Dkr ${fmtCompact(e.totalLeadsValue)}</div>
        <div class="card-sub">${e.hasDateFilter?"Sum of opportunity values in selected period":e.usingCenhubDefaults?"Sum of opportunity values for selected pipelines":"Sum of all opportunity values"}</div>
      </div>
    `),isVisible("kpis","averageLeadValue")&&t.push(`
      <div class="card">
        <div class="card-label">Average Lead Value</div>
        <div class="card-value">Dkr ${fmtCompact(e.averageLeadValue)}</div>
        <div class="card-sub">${e.hasDateFilter?"Average value per lead in selected period":e.usingCenhubDefaults?"All pipeline value \xF7 opportunity count":"Per opportunity in filter"}</div>
      </div>
    `),isVisible("kpis","conversionRate")&&t.push(`
      <div class="card">
        <div class="card-label">Conversion Rate</div>
        <div class="card-value">${fmtPct(e.conversionRate)}</div>
        <div class="card-sub">${clientKpiCopy("Wins \xF7 new leads in period","Vundne kunder \xF7 nye leads i perioden")}</div>
      </div>
    `),isVisible("kpis","openLeads")&&t.push(`
      <div class="card">
        <div class="card-label">Open Leads</div>
        <div class="card-value">${fmt(e.openLeads)}</div>
        <div class="card-sub">Opportunities still in pipeline</div>
      </div>
    `),isVisible("kpis","openPipelineValue")&&t.push(`
      <div class="card">
        <div class="card-label">Open Pipeline Value</div>
        <div class="card-value">Dkr ${fmtCompact(e.openPipelineValue)}</div>
        <div class="card-sub">Monetary value of open deals</div>
      </div>
    `),isVisible("kpis","averageWonDealSize")&&t.push(`
      <div class="card">
        <div class="card-label">Avg Won Deal Size</div>
        <div class="card-value">Dkr ${fmtCompact(e.averageWonDealSize)}</div>
        <div class="card-sub">${clientKpiCopy(`Won revenue \xF7 won deals (${fmt(e.wonOpportunityCount)})`,`Gns. vundet handel (${fmt(e.wonOpportunityCount)} handler)`)}</div>
      </div>
    `),isVisible("kpis","totalBundlinje")&&t.push(`
      <div class="card">
        <div class="card-label">Total Bundlinje</div>
        <div class="card-value">Dkr ${fmtCompact(e.totalBundlinje)}</div>
        <div class="card-sub">Bundlinje on won deals</div>
      </div>
    `),t.length?`<div class="kpi-grid">${t.join("")}</div>`:IS_ADMIN?'<div class="empty-section">No KPI cards selected. Use the display options below.</div>':'<div class="empty-section">No KPI data for selected period.</div>'}function renderStatusBreakdown(e){const t=Object.entries(DISPLAY_OPTIONS.statusItems).filter(([n])=>isVisible("statusItems",n)).map(([n,a])=>`
      <div class="status-item">
        <div class="name">${a}</div>
        <div class="value">${fmt(e[n])}</div>
      </div>
    `);return t.length?`<div class="status-grid">${t.join("")}</div>`:'<div class="empty-section">No status items selected.</div>'}function renderMetricsChangeBanner(e){const t=e.account?.metricsModel?.changedAt;if(!t||Date.now()-new Date(t).getTime()>10080*60*1e3)return"";const a=e.account?.metricsModel?.version||1;return`
    <div class="metrics-change-banner">
      Metrics model updated on ${new Date(t).toLocaleString("en-GB")} (v${a}).
      Revenue, clients won, and won-revenue charts now use: ${esc(e.account.metricsModel.winSourceLabel||e.account.metricsModel.label)}.
    </div>
  `}function renderDashboardContent(e){const{kpis:t,statusBreakdown:n,sourceReport:a,assigneeReport:o,pipelines:i,filters:r}=e,v=isVisible("sections","statusBreakdown");return`
    ${renderMetricsChangeBanner(e)}
    ${renderKpiCards(t)}

    ${renderChartsSection()}

    ${v?`
      <div class="card">
        <div class="section-title">Opportunity Status (Cards)</div>
        ${renderStatusBreakdown(n)}
      </div>
    `:""}

    ${isVisible("sections","sourceReport")?`
      <div class="card">
        <div class="section-title">Lead Source Report</div>
        ${renderTable("sourceReport","Source",[{key:"totalLeads",label:"Total leads",align:"num"},{key:"totalValue",label:"Total values",align:"num"},{key:"open",label:"Open",align:"num"},{key:"won",label:"Won",align:"num"},{key:"lost",label:"Lost",align:"num"},{key:"abandoned",label:"Abandoned",align:"num"},{key:"winPct",label:"Win %",align:"num"}],a,(p,f)=>f==="label"?esc(p.source):f==="totalValue"?`Dkr ${fmt(p.totalValue)}`:f==="winPct"?fmtPct(p.winPct):fmt(p[f]))}
      </div>
    `:""}

    ${isVisible("sections","assigneeReport")||isVisible("sections","pipelineBreakdown")?`
      <div class="section-grid">
        ${isVisible("sections","assigneeReport")?`
          <div class="card">
            <div class="section-title">Leads Closed by Assignee</div>
            ${renderTable("assigneeReport","Assignee",[{key:"won",label:"Won",align:"num"},{key:"totalLeads",label:"Total leads",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"},{key:"totalValue",label:"Total value",align:"num"}],o,(p,f)=>f==="label"?esc(p.assigneeName):f==="wonValue"||f==="totalValue"?`Dkr ${fmt(p[f])}`:fmt(p[f]))}
          </div>
        `:""}
        ${isVisible("sections","pipelineBreakdown")?`
          <div class="card">
            <div class="section-title">Pipeline Breakdown</div>
            ${renderTable("pipelineBreakdown","Pipeline",[{key:"count",label:"Leads",align:"num"},{key:"won",label:"Won",align:"num"},{key:"monetary",label:"Value",align:"num"},{key:"profit",label:"Bundlinje",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"}],i,(p,f)=>f==="label"?esc(p.name):f==="monetary"||f==="profit"||f==="wonValue"?`Dkr ${fmt(p[f])}`:fmt(p[f]))}
          </div>
        `:""}
      </div>
    `:""}

    ${IS_ADMIN?`
    <div class="note">
      ${t.usingCenhubDefaults?"Till-date Total Leads uses deduped opportunities from account pipeline defaults. ":""}
      Active filters: source=${r.source}, assignee=${r.assignedTo}, dates=${formatActiveDateFilter(r)}.
    </div>
    `:""}
    <div class="brand-footer">
      Dashboard by Cenhub
      \xB7 Holstebro
    </div>
  `}function updateDashboardContent(e){if(IS_ADMIN){const n=document.getElementById("admin-filters-panel");n&&(n.outerHTML=renderAdminFiltersPanel(e.filterOptions||{pipelines:[],statuses:[],sources:[],assignees:[],dateFields:[]}));const a=document.getElementById("admin-display-panel");if(a){const o=!!a.open;a.outerHTML=renderAdminDisplayOptions(o)}}const t=document.getElementById("dashboard-content");t&&(t.innerHTML=renderDashboardContent(e),mountCharts(e))}function renderDashboard(e){const t=document.getElementById("dashboard"),{filterOptions:n,account:a={}}=e,o=document.querySelector("details.panel")?.open,i=a.accountName||"Dashboard";IS_CLIENT_VIEW&&a.accountName&&(document.title=`${a.accountName} \xB7 Cenhub Dashboard`),t.innerHTML=`
    ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
    ${wrapDashboardShell(`
    ${IS_ADMIN_CLIENT?`
    <div id="setup-panel-mount"></div>
    <details class="panel admin-preview-section"${document.querySelector(".admin-preview-section")?.open?" open":""}>
      <summary>${ICON_CHART} Dashboard preview <span style="color:var(--text-soft);font-weight:500">\xB7 advanced filters</span><span class="summary-chevron">${ICON_CHEVRON}</span></summary>
      ${renderAdminFiltersPanel(n)}
      ${renderAdminDisplayOptions(o)}
      <div class="content-area" id="dashboard-content">
        ${renderDashboardContent(e)}
      </div>
    </details>
    `:`
    <div class="page-hero">
      <div class="header">
        <div>
          <h1>${esc(i)}</h1>
          <p>Performance dashboard \xB7 Pipeline & oms\xE6tning</p>
        </div>
        ${IS_ADMIN?"":`
        <div class="header-actions header-actions--client">
          ${renderPresetControls(!0)}
        </div>
        `}
      </div>
    </div>
    ${IS_ADMIN?renderAdminFiltersPanel(n):""}
    ${IS_ADMIN?renderAdminDisplayOptions(o):""}
    <div class="content-area" id="dashboard-content">
      ${renderDashboardContent(e)}
    </div>
    `}
    `)}
  `,IS_ADMIN_CLIENT&&loadSetupAccount(),initDatePickers()}let isFetching=!1,pendingRefetch=!1,fetchGeneration=0,activeFetchController=null,fetchStartedAt=0;const FETCH_TIMEOUT_MS=9e4;function setPresetButtonsDisabled(e){document.querySelectorAll("[data-preset]").forEach(t=>{t.disabled=e})}function resetFetchUiState(){isFetching=!1,setPresetButtonsDisabled(!1);const e=document.getElementById("apply-filters-btn");e&&(e.disabled=!1,e.textContent="Apply data filters")}function cancelActiveFetch(){activeFetchController&&(activeFetchController.abort(),activeFetchController=null)}function canReuseBootstrapDashboard(e){return!!(e?.kpis&&usesClientPipelineDefaults()&&!state.dateFrom&&!state.dateTo&&state.status==="all"&&state.source==="all"&&state.assignedTo==="all")}async function loadDashboard(e=!0,t={}){const{background:n=!1,forceFresh:a=!1}=t,o=!!a||e&&cachedData&&needsFreshData(),i=document.getElementById("dashboard");if(isFetching&&(e||!cachedData))cancelActiveFetch(),fetchGeneration+=1,pendingRefetch=!1,resetFetchUiState();else if(isFetching){e&&(pendingRefetch=!0);return}const r=!!document.getElementById("dashboard-content"),v=document.getElementById("apply-filters-btn");if(e||!cachedData){const p=++fetchGeneration;activeFetchController=new AbortController;const f=activeFetchController.signal;if(isFetching=!0,fetchStartedAt=Date.now(),!r)i.innerHTML=`
        ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
        ${wrapDashboardShell(`
          <div class="loading-state">
            <div class="spinner"></div>
            ${LOADING_MSG}
          </div>
        `)}`;else if(!n){const m=document.getElementById("dashboard-content");m&&(m.innerHTML=renderKpiSkeleton()),v&&(v.disabled=!0,v.textContent="Loading..."),setPresetButtonsDisabled(!0)}try{let m=null;if(!availablePipelines.length){if(m=await bootstrapDashboardData(f),p!==fetchGeneration)return;availablePipelines=m.filterOptions.pipelines||[],ensurePipelineDefaults(availablePipelines,m.account?.defaultPipelineIds)}if(!ensurePipelineSelectionBeforeFetch())throw new Error("Select at least one pipeline.");const T=canReuseBootstrapDashboard(m)&&!o;let C,w;if(T?[w,C]=await Promise.all([fetchFacebookMetrics(f),Promise.resolve(m)]):[C,w]=await Promise.all([fetchDashboardData(availablePipelines,f,{forceFresh:o}),fetchFacebookMetrics(f)]),p!==fetchGeneration)return;cachedFacebookMetrics=w,cachedData=applyMarketingData(C,w),cachedData.account?.clientId&&(facebookClientId=cachedData.account.clientId),availablePipelines=cachedData.filterOptions.pipelines||availablePipelines,ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),lastFetchedAt=cachedData.cachedAt?new Date(cachedData.cachedAt).getTime():Date.now()}catch(m){if(p!==fetchGeneration)return;if(m.name==="AbortError"){r||(i.innerHTML=`
            ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
            ${wrapDashboardShell(`
              <div class="error-state">
                <div>Fejl ved hentning af data</div>
                <div style="margin-top:8px;font-size:12px;color:#666">Request timed out. Pr\xF8v igen.</div>
                <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            `)}`);return}if(IS_ADMIN_CLIENT&&r){const k=document.getElementById("dashboard-content");k&&(k.innerHTML=`
            <div class="note admin-setup-placeholder">
              ${esc(m.message)}
              <div style="margin-top:12px">
                <button type="button" class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            </div>`)}else r?v&&(v.textContent="Apply failed - try again"):i.innerHTML=`
          ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
          ${wrapDashboardShell(`
            <div class="error-state">
              <div>Fejl ved hentning af data</div>
              <div style="margin-top:8px;font-size:12px;color:#666">${esc(m.message)}</div>
              <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
            </div>
          `)}`;return}finally{p===fetchGeneration&&(activeFetchController=null,resetFetchUiState()),pendingRefetch&&(pendingRefetch=!1,loadDashboard(!0))}if(p!==fetchGeneration)return}try{r?(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi()):(renderDashboard(cachedData),mountCharts(cachedData))}catch(p){resetFetchUiState(),i.innerHTML=`
      ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
      ${wrapDashboardShell(`
        <div class="error-state">
          <div>Fejl ved visning af dashboard</div>
          <div style="margin-top:8px;font-size:12px;color:#666">${esc(p.message)}</div>
          <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
        </div>
      `)}
    `}}function syncFiltersFromDom(){["status","source","assignedTo","dateField"].forEach(t=>{const n=document.getElementById(t);n&&(state[t]=n.value)});const e=document.getElementById("adSpend");if(e&&(state.adSpend=e.value),state.preset==="custom"){const t=document.getElementById("dateFrom"),n=document.getElementById("dateTo");t&&(state.dateFrom=t.value),n&&(state.dateTo=n.value),state.dateField="createdAt"}}function hasPartialDateRange(){return!!(state.dateFrom&&!state.dateTo||!state.dateFrom&&state.dateTo)}function applyPreset(e){if(clearDateRangeError(),closeDatePicker(),setPreset(e),updateFilterUi(),e==="custom"){const t=document.getElementById("dateFrom-trigger");t&&openDatePicker("dateFrom",t);return}applyDataFilters(!1)}function applyDataFilters(e=!0){if(e&&syncFiltersFromDom(),state.preset==="custom"){if(hasPartialDateRange()){showDateRangeError("Select both From and To dates.");return}if(state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date.");return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){showDateRangeError("Start date must be before today.");return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){showDateRangeError("End date cannot be after today.");return}}clearDateRangeError(),!state.pipelineIds.length&&availablePipelines.length&&ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),state.pipelineIds.length&&loadDashboard(!0)}async function bootClientApp(){try{tenantParams=await resolveTenantParams()}catch(e){document.getElementById("dashboard").innerHTML='<div class="error-state" style="padding:24px">'+esc(e.message)+"</div>";return}ensureChartsVisible(),loadDashboard(!0),setTimeout(function(){loadDashboard(!0,{background:!0,forceFresh:!0})},500),setInterval(function(){loadDashboard(!0,{background:!0,forceFresh:!0})},120*1e3)}bootClientApp(),document.addEventListener("visibilitychange",function(){document.visibilityState==="visible"&&(isFetching&&Date.now()-fetchStartedAt>FETCH_TIMEOUT_MS&&(cancelActiveFetch(),fetchGeneration+=1,resetFetchUiState()),cachedData&&needsFreshData()&&loadDashboard(!0,{background:!0,forceFresh:!0}))});

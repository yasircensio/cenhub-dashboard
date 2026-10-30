(function(){const t=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);if(t[0]==="login"){document.body.dataset.dashboardMode="login",delete document.body.dataset.clientSlug;return}if(t[0]==="team"){document.body.dataset.dashboardMode="team",delete document.body.dataset.clientSlug;return}if(t[0]==="admin"){if(t[1]==="sync-history"&&(t[2]==="ghl"||t[2]==="meta"||t[2]==="meta-reports")){document.body.dataset.dashboardMode=t[2]==="meta-reports"?"sync-history-meta-reports":`sync-history-${t[2]}`,delete document.body.dataset.clientSlug;return}if(t[1]==="fb-lead-sync"){document.body.dataset.dashboardMode="fb-lead-sync",delete document.body.dataset.clientSlug;return}if(t[1]==="google-ads"&&t[2]==="custom-values"){document.body.dataset.dashboardMode="google-ads-custom",delete document.body.dataset.clientSlug;return}if(t[1]==="google-ads"&&t[2]){document.body.dataset.dashboardMode="google-ads-client",document.body.dataset.clientSlug=t[2];return}if(t[1]==="google-ads"){document.body.dataset.dashboardMode="google-ads",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]==="custom-values"){document.body.dataset.dashboardMode="meta-reports-custom",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]==="ghl-clients"){document.body.dataset.dashboardMode="meta-reports-ghl-clients",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]&&t[3]==="ads-check"){document.body.dataset.dashboardMode="meta-reports-ads-check",document.body.dataset.clientSlug=t[2];return}if(t[1]==="meta-reports"&&t[2]){document.body.dataset.dashboardMode="meta-reports-client",document.body.dataset.clientSlug=t[2];return}if(t[1]==="meta-reports"){document.body.dataset.dashboardMode="meta-reports",delete document.body.dataset.clientSlug;return}document.body.dataset.dashboardMode=t.length>=2?"admin":"hub",t.length>=2?document.body.dataset.clientSlug=t[1]:delete document.body.dataset.clientSlug;return}if(t[0]==="report"&&t[1]){document.body.dataset.dashboardMode="report",document.body.dataset.reportToken=t[1],delete document.body.dataset.clientSlug;return}t[0]&&t[0]!=="index.html"&&(document.body.dataset.dashboardMode="client",document.body.dataset.clientSlug=t[0])})();const DASHBOARD_MODE=document.body.dataset.dashboardMode||"client",IS_LOGIN_PAGE=DASHBOARD_MODE==="login",IS_TEAM_PAGE=DASHBOARD_MODE==="team",IS_ADMIN_HUB=DASHBOARD_MODE==="hub",IS_ADMIN_CLIENT=DASHBOARD_MODE==="admin",IS_ADMIN_SYNC_HISTORY_GHL=DASHBOARD_MODE==="sync-history-ghl",IS_ADMIN_SYNC_HISTORY_META=DASHBOARD_MODE==="sync-history-meta",IS_ADMIN_SYNC_HISTORY_META_REPORTS=DASHBOARD_MODE==="sync-history-meta-reports",IS_ADMIN_FB_LEAD_SYNC=DASHBOARD_MODE==="fb-lead-sync",IS_ADMIN_META_REPORTS=DASHBOARD_MODE==="meta-reports",IS_ADMIN_META_REPORTS_CLIENT=DASHBOARD_MODE==="meta-reports-client",IS_ADMIN_META_REPORTS_CUSTOM=DASHBOARD_MODE==="meta-reports-custom",IS_ADMIN_META_REPORTS_GHL_CLIENTS=DASHBOARD_MODE==="meta-reports-ghl-clients",IS_ADMIN_META_REPORTS_ADS_CHECK=DASHBOARD_MODE==="meta-reports-ads-check",IS_ADMIN_GOOGLE_ADS=DASHBOARD_MODE==="google-ads",IS_ADMIN_GOOGLE_ADS_CLIENT=DASHBOARD_MODE==="google-ads-client",IS_ADMIN_GOOGLE_ADS_CUSTOM=DASHBOARD_MODE==="google-ads-custom",IS_REPORT_VIEW=DASHBOARD_MODE==="report",REPORT_TOKEN=document.body.dataset.reportToken||"",IS_ADMIN_SYNC_HISTORY=IS_ADMIN_SYNC_HISTORY_GHL||IS_ADMIN_SYNC_HISTORY_META||IS_ADMIN_SYNC_HISTORY_META_REPORTS,IS_CLIENT_VIEW=DASHBOARD_MODE==="client",IS_PREVIEW=IS_CLIENT_VIEW&&!!new URLSearchParams(window.location.search).get("client"),IS_ADMIN=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||IS_ADMIN_META_REPORTS_GHL_CLIENTS||IS_ADMIN_META_REPORTS_ADS_CHECK||IS_ADMIN_GOOGLE_ADS||IS_ADMIN_GOOGLE_ADS_CLIENT||IS_ADMIN_GOOGLE_ADS_CUSTOM||new URLSearchParams(window.location.search).get("view")==="admin",ADMIN_UI=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||IS_ADMIN_META_REPORTS_GHL_CLIENTS||IS_ADMIN_META_REPORTS_ADS_CHECK||IS_ADMIN_GOOGLE_ADS||IS_ADMIN_GOOGLE_ADS_CLIENT||IS_ADMIN_GOOGLE_ADS_CUSTOM||IS_ADMIN,LOADING_MSG=ADMIN_UI?"Loading dashboard data...":"Henter dashboard data...",RETRY_MSG=ADMIN_UI?"Try again":"Pr\xF8v igen";(function(){const t=document.getElementById("initial-loading-msg");t&&(t.textContent=LOADING_MSG)})();function resolveClientSlug(){if(document.body.dataset.clientSlug)return document.body.dataset.clientSlug;const e=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean),t=new Set(["meta-reports","google-ads","sync-history","fb-lead-sync"]);return e[0]==="admin"&&e[1]==="google-ads"&&e[2]&&e[2]!=="custom-values"||e[0]==="admin"&&e[1]==="meta-reports"&&e[2]&&e[2]!=="custom-values"&&e[2]!=="ghl-clients"?e[2]:e[0]==="admin"&&e[1]&&!t.has(e[1])?e[1]:e[0]&&e[0]!=="admin"&&e[0]!=="index.html"&&e[0]!=="report"?e[0]:new URLSearchParams(window.location.search).get("client")||"suntech-nordic"}const CLIENT_SLUG=resolveClientSlug();let tenantParams={},facebookClientId=CLIENT_SLUG,setupAccount=null,setupPipelines=[],metricsModelChangeMode=!1;function esc(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function renderCensioAnalyticsLogoMarkup(e=""){const t='<img class="meta-report-public-logo" src="/censio-analytics-logo.png?v=4" alt="Censio Analytics" />';return e?`<a href="${e}" class="brand-logo-link" aria-label="Censio Analytics">${t}</a>`:t}function renderBrandTopbar(e="",t={}){const n=t.logo==="analytics"?"analytics":"cenhub",a=!!(e&&e.includes("staff-admin-chrome")),o=a||e&&e.includes("admin-topbar-link")?"/admin":"",r=n==="analytics"?renderCensioAnalyticsLogoMarkup(o):o?`<a href="${o}" class="brand-logo-link" aria-label="Cenhub home"><img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" /></a>`:'<img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" />',s=a?`<button type="button" class="staff-nav-toggle" id="staff-nav-toggle" aria-expanded="false" aria-controls="staff-topbar-panel" aria-label="Open menu">
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
      </button>`:"",i=e?a?`<div class="brand-topbar-right brand-topbar-panel" id="staff-topbar-panel">${e}</div>`:`<div class="brand-topbar-right">${e}</div>`:"";return`
    <header class="brand-topbar${a?" brand-topbar--collapsible":""}${!a?" brand-topbar--centered":""}">
      <div class="brand-topbar-inner">
        <div class="brand-topbar-left">${r}</div>
        ${s}
        ${i}
      </div>
    </header>
  `}function clientFacingStaffNavTab(){return IS_REPORT_VIEW?typeof linkedReportsState<"u"&&linkedReportsState.activePlatform==="google-ads"?"google-ads":"meta-reports":"clients"}function renderAppTopbar(e){return currentStaffUser&&(IS_REPORT_VIEW||IS_CLIENT_VIEW)?renderBrandTopbar(renderStaffAdminChrome(clientFacingStaffNavTab()),{logo:"analytics"}):IS_REPORT_VIEW?renderBrandTopbar("",{logo:"analytics"}):renderBrandTopbar(e!==void 0?e:IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}function refreshClientFacingTopbar(){if(!IS_REPORT_VIEW&&!IS_CLIENT_VIEW)return;const e=document.querySelector("#dashboard > .brand-topbar");if(!e)return;const t=document.createElement("div");t.innerHTML=renderAppTopbar().trim();const n=t.firstElementChild;n&&e.replaceWith(n)}function wrapDashboardShell(e){return`<div class="dashboard-shell">${e}</div>`}function renderHubSkeletonCards(e=6){return Array.from({length:e},()=>`
    <div class="hub-skeleton-card" aria-hidden="true">
      <div class="hub-skeleton-card-head">
        <span class="hub-skeleton-mark"></span>
        <div class="hub-skeleton-copy">
          <span class="hub-skeleton-bar hub-skeleton-bar--title"></span>
          <span class="hub-skeleton-bar hub-skeleton-bar--sub"></span>
        </div>
      </div>
      <span class="hub-skeleton-bar hub-skeleton-bar--foot"></span>
    </div>
  `).join("")}function renderAdminHubSkeletonPage(e){const t=e==="clients",n=e==="google-ads",a=t?"clients":n?"google-ads":"meta-reports",o=t?"Client administration":n?"Google Ads reports":"Meta client reports",s=t?`<div class="page-hero admin-hub-hero">
        <h1>${o}</h1>
        <p>Manage dashboard accounts, sync GHL data, and preview client views.</p>
      </div>`:`<div class="page-hero admin-hub-hero meta-premium-page-hero">
        <div class="meta-premium-page-hero-inner">
          <div class="admin-breadcrumb">
            <a href="/admin">Clients</a>
            <span aria-hidden="true"> / </span>
            <span>${n?"Google Ads":"Meta reports"}</span>
          </div>
          <h1>${o}</h1>
        </div>
      </div>`,i=t?"client-grid":"meta-hub-cards";return`
    ${renderBrandTopbar(renderStaffAdminChrome(a))}
    ${wrapDashboardShell(`
    ${s}
    <div class="admin-hub${t?"":" meta-reports-page"}" aria-busy="true">
      <p class="sr-only">Loading ${esc(o)}\u2026</p>
      <div class="${i}">
        ${renderHubSkeletonCards()}
      </div>
    </div>
    `)}
  `}function showToast(e,t="info"){const n=document.getElementById("toast-host");if(!n)return;const a=document.createElement("div");a.className=`toast${t==="error"?" toast--error":t==="success"?" toast--success":""}`,a.textContent=e,n.appendChild(a),setTimeout(()=>a.remove(),4200)}function fmtDkk(e){return new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0))}function fmtRevenueDkk(e){const t=Math.round(Number(e)||0);if(t>=1e6){const n=t/1e6;return`${new Intl.NumberFormat("da-DK",{minimumFractionDigits:n%1===0?0:2,maximumFractionDigits:2}).format(n)}M kr`}return`${fmtDkk(t)} kr`}function clientNeedsAction(e){return!!(e&&e!=="ready"&&e!=="syncing")}function clientActionHint(e){return{syncing:"Sync in progress...",needs_token:"Action needed \u2014 add GHL token in Settings",needs_metrics_model:"Action needed \u2014 choose metrics model in Settings",needs_pipelines:"Action needed \u2014 map pipelines in Settings",needs_sync:"Action needed \u2014 sync data from Settings or click Sync",needs_review:"Action needed \u2014 review client setup in Settings",sync_error:"Sync failed \u2014 open Settings and try again"}[e]||"Action needed \u2014 open Settings to finish setup"}function requestGhlUserData(e=8e3){return new Promise(t=>{if(window.self===window.top){t(null);return}const n=setTimeout(()=>{window.removeEventListener("message",a),t(null)},e);function a(o){o.data?.message==="REQUEST_USER_DATA_RESPONSE"&&o.data.payload&&(clearTimeout(n),window.removeEventListener("message",a),t(o.data.payload))}window.addEventListener("message",a),window.parent.postMessage({message:"REQUEST_USER_DATA"},"*")})}async function resolveTenantParams(){const e=new URLSearchParams(window.location.search);if(IS_ADMIN_HUB)return{};if(IS_ADMIN_CLIENT||IS_CLIENT_VIEW)return{client:CLIENT_SLUG};if(e.get("client"))return{client:e.get("client")};const t=e.get("location_id")||e.get("locationId");return t?{location_id:t}:{client:CLIENT_SLUG}}let CLIENT_ACCESS_KEY=new URLSearchParams(window.location.search).get("key")||"";function appendTenantParams(e){tenantParams.location_id?e.set("location_id",tenantParams.location_id):tenantParams.client&&e.set("client",tenantParams.client),CLIENT_ACCESS_KEY&&e.set("key",CLIENT_ACCESS_KEY)}const ADMIN_API_KEY_STORAGE="cenhub_admin_api_key";let currentStaffUser=null;function getAdminApiKey(){return localStorage.getItem(ADMIN_API_KEY_STORAGE)||""}function redirectToLogin(){const e=`${window.location.pathname}${window.location.search}`;window.location.href=`/login?next=${encodeURIComponent(e)}`}async function fetchStaffMe(){const e=await fetch("/api/auth/me",{credentials:"include"}),t=await e.json().catch(()=>({}));return e.ok&&t.user||null}let staffPreviewSessionProbed=!1;async function probeStaffPreviewSession(){if(staffPreviewSessionProbed)return currentStaffUser;staffPreviewSessionProbed=!0;try{currentStaffUser=await fetchStaffMe()}catch{currentStaffUser=null}return currentStaffUser}async function staffLogout(){try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"})}catch{}window.location.href="/login"}function isStaffAdmin(){return currentStaffUser?.role==="admin"}function renderStaffUserMenu(){const e=currentStaffUser;return e?`
    <div class="staff-user-menu" id="staff-user-menu">
      <button type="button" class="staff-user-trigger" onclick="toggleStaffUserMenu(event)" aria-haspopup="menu" aria-expanded="false">
        <span class="staff-header-name">${esc(e.name||e.email)}</span>
        <span aria-hidden="true">\u25BE</span>
      </button>
      <div class="staff-user-dropdown" id="staff-user-dropdown" hidden role="menu">
        <div class="staff-user-meta">${esc(e.email)}<br>${esc(e.role)}</div>
        <button type="button" role="menuitem" class="staff-user-menu-item" onclick="staffLogout()">Log out</button>
      </div>
    </div>
  `:""}function renderStaffAdminChrome(e){return currentStaffUser?`
    <div class="staff-admin-chrome">
      ${`
    <nav class="staff-nav" aria-label="Admin navigation">
      <a href="/admin" class="staff-nav-link${e==="clients"?" is-active":""}">Cenhub clients</a>
      <div class="staff-nav-dropdown" data-staff-nav-dropdown="meta-reports">
        <button type="button" class="staff-nav-link staff-nav-dropdown-trigger${e==="meta-reports"||e==="meta-reports-custom"||e==="meta-reports-ghl-clients"||e==="meta-reports-ads-check"?" is-active":""}" aria-expanded="false" aria-haspopup="true" onclick="toggleStaffNavDropdown(this, event)">Meta reports</button>
        <div class="staff-nav-dropdown-menu" role="menu">
          <a href="/admin/meta-reports" class="staff-nav-dropdown-item${e==="meta-reports"?" is-active":""}" role="menuitem">All clients</a>
          <a href="/admin/meta-reports/ghl-clients" class="staff-nav-dropdown-item${e==="meta-reports-ghl-clients"?" is-active":""}" role="menuitem">Cenhub clients</a>
          <a href="/admin/meta-reports/custom-values" class="staff-nav-dropdown-item${e==="meta-reports-custom"?" is-active":""}" role="menuitem">Custom values</a>
        </div>
      </div>
      <div class="staff-nav-dropdown" data-staff-nav-dropdown="google-ads">
        <button type="button" class="staff-nav-link staff-nav-dropdown-trigger${e==="google-ads"||e==="google-ads-custom"?" is-active":""}" aria-expanded="false" aria-haspopup="true" onclick="toggleStaffNavDropdown(this, event)">Google Ads</button>
        <div class="staff-nav-dropdown-menu" role="menu">
          <a href="/admin/google-ads" class="staff-nav-dropdown-item${e==="google-ads"?" is-active":""}" role="menuitem">All clients</a>
          <a href="/admin/google-ads/custom-values" class="staff-nav-dropdown-item${e==="google-ads-custom"?" is-active":""}" role="menuitem">Custom values</a>
        </div>
      </div>
      <div class="staff-nav-dropdown" data-staff-nav-dropdown="sync">
        <button type="button" class="staff-nav-link staff-nav-dropdown-trigger${e==="ghl-sync"||e==="meta-sync"||e==="meta-report-sync"||e==="fb-lead-sync"?" is-active":""}" aria-expanded="false" aria-haspopup="true" onclick="toggleStaffNavDropdown(this, event)">Sync</button>
        <div class="staff-nav-dropdown-menu" role="menu">
          <a href="/admin/sync-history/ghl" class="staff-nav-dropdown-item${e==="ghl-sync"?" is-active":""}" role="menuitem">GHL sync</a>
          <a href="/admin/sync-history/meta" class="staff-nav-dropdown-item${e==="meta-sync"?" is-active":""}" role="menuitem">Meta sync</a>
          <a href="/admin/sync-history/meta-reports" class="staff-nav-dropdown-item${e==="meta-report-sync"?" is-active":""}" role="menuitem">Meta report sync</a>
          <a href="/admin/fb-lead-sync" class="staff-nav-dropdown-item${e==="fb-lead-sync"?" is-active":""}" role="menuitem">FB lead sync</a>
        </div>
      </div>
      ${isStaffAdmin()?`<a href="/team" class="staff-nav-link${e==="team"?" is-active":""}">Team</a>`:""}
    </nav>
  `}
      ${renderStaffUserMenu()}
    </div>
  `:""}function isStaffNavMobilePanelOpen(){return!!(document.getElementById("staff-topbar-panel")?.classList.contains("is-open")&&window.matchMedia("(max-width: 1100px)").matches)}function resetStaffNavDropdownMenu(e){e&&(e.classList.remove("is-floating"),e.style.position="",e.style.left="",e.style.top="",e.style.right="",e.style.width="",e.style.minWidth="")}function restoreStaffNavDropdownMenu(e){const t=e._floatingMenu;t&&(resetStaffNavDropdownMenu(t),e._menuAnchor&&e._menuAnchor.parentNode?e._menuAnchor.parentNode.insertBefore(t,e._menuAnchor):e.appendChild(t),e._floatingMenu=null)}function floatStaffNavDropdownMenu(e,t){isStaffNavMobilePanelOpen()||e._floatingMenu!==t&&(e._menuAnchor=document.createComment("staff-nav-menu-anchor"),t.parentNode.insertBefore(e._menuAnchor,t),document.body.appendChild(t),t.classList.add("is-floating"),e._floatingMenu=t)}function positionStaffNavDropdown(e){const t=e.querySelector(".staff-nav-dropdown-trigger"),n=e._floatingMenu||e.querySelector(".staff-nav-dropdown-menu");if(!t||!n)return;if(isStaffNavMobilePanelOpen()){resetStaffNavDropdownMenu(n),n.style.position="static",n.style.width="100%";return}floatStaffNavDropdownMenu(e,n);const a=t.getBoundingClientRect(),o=Math.max(188,a.width);n.style.position="fixed",n.style.width="",n.style.minWidth=`${o}px`,n.style.left=`${Math.max(8,a.left)}px`,n.style.top=`${a.bottom+6}px`,n.style.right="auto";const r=n.getBoundingClientRect();if(r.right>window.innerWidth-8&&(n.style.left=`${Math.max(8,window.innerWidth-r.width-8)}px`),r.bottom>window.innerHeight-8){const s=a.top-r.height-6;s>=8&&(n.style.top=`${s}px`)}}function closeStaffNavDropdowns(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(e=>{e.classList.remove("is-open"),e.querySelector(".staff-nav-dropdown-trigger")?.setAttribute("aria-expanded","false"),restoreStaffNavDropdownMenu(e)})}function toggleStaffNavDropdown(e,t){t?.stopPropagation();const n=e?.closest(".staff-nav-dropdown");if(!n)return;const a=!n.classList.contains("is-open");if(closeStaffNavDropdowns(),closeStaffUserMenu(),!a){e.setAttribute("aria-expanded","false");return}n.classList.add("is-open"),e.setAttribute("aria-expanded","true"),positionStaffNavDropdown(n)}function toggleStaffUserMenu(e){e.stopPropagation();const t=document.getElementById("staff-user-dropdown"),n=e.currentTarget;if(!t)return;const a=t.hidden;closeStaffUserMenu(),a&&(t.hidden=!1,n?.setAttribute("aria-expanded","true"))}function closeStaffUserMenu(){const e=document.getElementById("staff-user-dropdown"),t=document.querySelector(".staff-user-trigger");e&&(e.hidden=!0),t&&t.setAttribute("aria-expanded","false")}function toggleStaffTopbarNav(e){const t=document.getElementById("staff-topbar-panel");if(!t)return;const n=!t.classList.contains("is-open");t.classList.toggle("is-open",n),e.setAttribute("aria-expanded",n?"true":"false"),e.setAttribute("aria-label",n?"Close menu":"Open menu"),e.classList.toggle("is-active",n),n&&closeStaffUserMenu()}function closeStaffTopbarNav(){const e=document.getElementById("staff-topbar-panel"),t=document.getElementById("staff-nav-toggle");e&&e.classList.remove("is-open"),t&&(t.setAttribute("aria-expanded","false"),t.setAttribute("aria-label","Open menu"),t.classList.remove("is-active"))}let staffChromeEventsBound=!1;function bindStaffChromeEvents(){staffChromeEventsBound||(staffChromeEventsBound=!0,document.addEventListener("click",function(e){const t=e.target.closest("#staff-nav-toggle");if(t){e.stopPropagation(),toggleStaffTopbarNav(t);return}if(e.target.closest(".staff-nav-dropdown-item")){closeStaffTopbarNav(),closeStaffNavDropdowns();return}(e.target.closest(".staff-nav-link")&&!e.target.closest(".staff-nav-dropdown-trigger")||!e.target.closest(".brand-topbar-right")&&!e.target.closest(".staff-nav-dropdown-menu"))&&closeStaffTopbarNav(),!e.target.closest(".staff-nav-dropdown")&&!e.target.closest(".staff-nav-dropdown-menu")&&closeStaffNavDropdowns(),typeof closeCardMenus=="function"&&closeCardMenus(),closeStaffUserMenu()}),window.addEventListener("resize",function(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(function(e){positionStaffNavDropdown(e)})}),window.addEventListener("scroll",function(){document.querySelector(".staff-nav-dropdown.is-open")&&closeStaffNavDropdowns()},{passive:!0}))}const ICON_SEARCH='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',ICON_PLUS='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',ICON_CALENDAR='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/></svg>',ICON_CHEVRON_LEFT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',ICON_CHEVRON_RIGHT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',ICON_SYNC='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',ICON_CHEVRON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',ICON_CHART='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',ICON_CHECK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',ICON_LAYER='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',ICON_MERGE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="15" r="2.4"/><path d="M6 8.4V15.6"/><path d="M8.2 6.4C14 6.4 14 12.6 15.8 13.4"/></svg>',ICON_TARGET='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',ICON_LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>',ICON_UNLOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 017.8-1.2"/></svg>',ICON_TAG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 12.7L12.7 20.6a2 2 0 01-2.8 0l-7-7a2 2 0 010-2.8L10.8 3H19a2 2 0 012 2v7.7z"/><circle cx="15" cy="8" r="1.2"/></svg>',ICON_HASH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/></svg>',ICON_EDIT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',ICON_WARNING='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.6 18a1.5 1.5 0 001.3 2.2h16.2a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-3.4 0z"/><path d="M12 9v4"/><path d="M12 16.5h.01"/></svg>';(function(t){const n=["#ff6a00","#138b53","#0085f2","#dc640a","#833b08","#a07868","#ff9147","#6b5348"],a={open:"#0085f2",won:"#138b53",lost:"#dc640a",abandoned:"#a07868"};function o(c){const p=String(c).match(/^(\d{4})-W(\d{2})$/);if(!p)return null;const l=Number(p[1]),h=Number(p[2]),d=new Date(Date.UTC(l,0,4)),f=d.getUTCDay()||7,b=new Date(d);b.setUTCDate(d.getUTCDate()-f+1);const y=new Date(b);y.setUTCDate(b.getUTCDate()+(h-1)*7);const S=new Date(y);return S.setUTCDate(y.getUTCDate()+3),{monday:new Date(y.getUTCFullYear(),y.getUTCMonth(),y.getUTCDate()),thursday:new Date(S.getUTCFullYear(),S.getUTCMonth(),S.getUTCDate())}}function r(c){let p=0;for(let l=1;l<=c.getDate();l+=1)new Date(c.getFullYear(),c.getMonth(),l).getDay()===1&&(p+=1);return p}function s(c){const p=o(c);if(!p)return String(c).replace("-W"," W");const l=p.monday,h=l.toLocaleDateString("da-DK",{month:"short"}).replace(".","").replace(/^\w/u,f=>f.toUpperCase()),d=r(l);return`${h} W${d}`}function i(c){const[p,l]=String(c).split("-");return new Date(Number(p),Number(l)-1,1).toLocaleDateString("da-DK",{month:"short",year:"2-digit"})}function u(c,p=18){const l=String(c);return l.length>p?`${l.slice(0,p-1)}\u2026`:l}function m(){return{text:"#1a1208",muted:"#6b5348",grid:"rgba(26, 18, 8, 0.1)",border:"#e8e0d8",tooltipBg:"#ffffff",tooltipBorder:"#e8e0d8",tooltipText:"#1a1208"}}function v(c,p,l,h){return{labels:c.map(d=>h(d[p])),values:c.map(d=>Number(d[l])||0)}}function k(c){const p=Number(c)||0;return p>=1e6?`${(p/1e6).toFixed(1)}M`:p>=1e3?`${Math.round(p/1e3)}K`:p}function A(c){const p=new Map((c.monthlyAdSpend||[]).map(d=>[d.month,Number(d.spend)||0])),l=new Map((c.monthlyRevenue||[]).map(d=>[d.month,Number(d.revenue)||0])),h=[...new Set([...p.keys(),...l.keys()])].sort();return{dualAxis:!0,labels:h.map(d=>i(d)),spendValues:h.map(d=>p.get(d)||0),revenueValues:h.map(d=>l.get(d)||0)}}function $(c,p,l){const h=p.spendValues.some(d=>d>0)||p.revenueValues.some(d=>d>0);return!p.labels.length||!h?null:{type:"bar",data:{labels:p.labels,datasets:[{type:"bar",label:"Ad Spend",data:p.spendValues,backgroundColor:"#ff6a00cc",borderColor:"#ff6a00",borderWidth:2,borderRadius:6,maxBarThickness:42,yAxisID:"y",order:2},{type:"line",label:"Won Revenue",data:p.revenueValues,backgroundColor:"#138b5333",borderColor:"#138b53",borderWidth:2.5,fill:!0,tension:.35,pointRadius:4,pointHoverRadius:6,yAxisID:"y1",order:1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"bottom",align:"center",labels:{color:l.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:l.tooltipBg,borderColor:l.tooltipBorder,borderWidth:1,titleColor:l.tooltipText,bodyColor:l.muted,padding:12,callbacks:{label(d){const f=d.parsed.y??0;return`${d.dataset.label}: Dkr ${Math.round(f).toLocaleString("da-DK")}`}}}},scales:{x:{ticks:{color:l.muted,maxRotation:45,minRotation:0},grid:{color:l.grid},border:{color:l.border}},y:{type:"linear",position:"left",title:{display:!0,text:"Ad Spend (Dkr)",color:"#ff6a00",font:{size:11,weight:"600"}},ticks:{color:"#ff6a00",callback:k},grid:{color:l.grid},border:{color:l.border},beginAtZero:!0},y1:{type:"linear",position:"right",title:{display:!0,text:"Won Revenue (Dkr)",color:"#138b53",font:{size:11,weight:"600"}},ticks:{color:"#138b53",callback:k},grid:{drawOnChartArea:!1},border:{color:l.border},beginAtZero:!0}}}}}const w={weeklyRevenue:{title:"Won Revenue (Weekly)",defaultType:"area",format:"currency",extract(c){return v(c.weeklyRevenue||[],"week","revenue",s)}},monthlyRevenue:{title:"Won Revenue (Monthly)",defaultType:"area",format:"currency",extract(c){return v(c.monthlyRevenue||[],"month","revenue",i)}},weeklyLeads:{title:"New Leads (Weekly)",defaultType:"area",format:"number",extract(c){return v(c.weeklyLeads||[],"week","count",s)}},monthlyLeads:{title:"New Leads (Monthly)",defaultType:"area",format:"number",extract(c){return v(c.monthlyLeads||[],"month","count",i)}},conversionTrend:{title:"Conversion Rate Trend",defaultType:"line",format:"percent",extract(c){return v(c.monthlyConversion||[],"month","rate",i)}},statusBreakdown:{title:"Opportunity Status",defaultType:"doughnut",format:"number",extract(c){const p=c.chartStatusBreakdown||c.statusBreakdown||{},l=["open","won","lost","abandoned"];return{labels:["Open","Won","Lost","Abandoned"],values:l.map(h=>Number(p[h])||0),colors:l.map(h=>a[h])}}},marketingSpendComparison:{title:"Facebook Ad Spend",defaultType:"area",format:"currency",extract(c){return v((c.monthlyAdSpend||[]).slice(-8),"month","spend",i)}},monthlyCostPerLead:{title:"Cost per Lead (Monthly)",defaultType:"area",format:"currency",extract(c){return v(c.monthlyCostPerLead||[],"month","cpl",i)}}};function D(c,p,l,h){const d=Number(c)||0,f=Array.isArray(l)?l[h]:p;return f==="ratio"?`${d.toFixed(2)}x`:f==="currency"||p==="currency"?`Dkr ${Math.round(d).toLocaleString("da-DK")}`:f==="percent"||p==="percent"?`${d.toFixed(1)}%`:Math.round(d).toLocaleString("da-DK")}function M(c,p,l){const h=w[c];if(!h)return null;const d=h.extract(p),f=m();if(d.dualAxis||l==="dualAxis")return $(h,d,f);if(!d.labels?.length||d.values.every(g=>g===0))return null;const b=["pie","doughnut","polarArea"].includes(l),y=d.colors||d.labels.map((g,C)=>n[C%n.length]),S=l==="area"?"line":l==="horizontalBar"?"bar":l,T=`${n[0]}55`,I=l==="doughnut",L={label:h.title,data:d.values,backgroundColor:b?I?y:y.map(g=>`${g}cc`):d.colors?d.colors.map(g=>`${g}cc`):l==="area"?T:`${n[0]}cc`,borderColor:b?y:d.colors||n[0],borderWidth:b?I?0:1:2,fill:l==="area",tension:.35,borderRadius:b?0:6,maxBarThickness:42,...I?{cutout:"62%",borderAlign:"inner"}:{}};return{type:S,data:{labels:d.labels,datasets:[L]},options:{responsive:!0,maintainAspectRatio:I?!1:b,indexAxis:l==="horizontalBar"?"y":"x",plugins:{legend:{display:b,position:"bottom",align:"center",labels:{color:f.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:f.tooltipBg,borderColor:f.tooltipBorder,borderWidth:1,titleColor:f.tooltipText,bodyColor:f.muted,padding:12,callbacks:{label(g){const C=g.parsed,E=typeof C=="object"?C.y??C.x??0:C??0;return`${g.label}: ${D(E,h.format,d.valueFormats,g.dataIndex)}`}}}},...I?{layout:{padding:8},devicePixelRatio:typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1,elements:{arc:{borderAlign:"inner"}}}:{},scales:b?{}:{x:{ticks:{color:f.muted,maxRotation:45,minRotation:0},grid:{color:f.grid},border:{color:f.border}},y:{ticks:{color:f.muted,callback(g,C){return h.format==="mixed"&&d.valueFormats?.[C]==="ratio"?`${Number(g).toFixed(2)}x`:h.format==="currency"||d.valueFormats?.[C]==="currency"?g>=1e6?`${(g/1e6).toFixed(1)}M`:g>=1e3?`${Math.round(g/1e3)}K`:g:h.format==="percent"?`${g}%`:g}},grid:{color:f.grid},border:{color:f.border},beginAtZero:!0}}}}}t.DashboardCharts={CHART_DEFINITIONS:w,buildChartConfig:M,formatTooltipValue:D}})(window);const STORAGE_KEY=`cenhub_display_${CLIENT_SLUG}`,LEGACY_STORAGE_KEY="suntech-dashboard-display",PIPELINE_KEY="suntech-dashboard-pipelines",DISPLAY_OPTIONS={kpis:{totalRevenue:"Total Revenue",adSpend:"Ad Spend",roas:"ROAS",roasDk:"ROAS (DK)",poas:"POAS",poasDk:"POAS (DK)",costPerLead:"Cost per Lead",costPerWonClient:"Cost per Won Client",clientsWon:"Clients Won",totalLeads:"Total Leads",totalLeadsValue:"Total Leads Value",averageLeadValue:"Average Lead Value",conversionRate:"Conversion Rate",totalBundlinje:"Total Bundlinje",openLeads:"Open Leads",openPipelineValue:"Open Pipeline Value",averageWonDealSize:"Avg Won Deal Size"},sections:{statusBreakdown:"Opportunity Status (Cards)",sourceReport:"Lead Source Report",assigneeReport:"Leads Closed by Assignee",pipelineBreakdown:"Pipeline Breakdown"},charts:{weeklyRevenue:"Won Revenue (Weekly)",monthlyRevenue:"Won Revenue (Monthly)",marketingSpendComparison:"Facebook Ad Spend",monthlyCostPerLead:"Cost per Lead (Monthly)",weeklyLeads:"New Leads (Weekly)",monthlyLeads:"New Leads (Monthly)",conversionTrend:"Conversion Rate Trend",statusBreakdown:"Opportunity Status"},statusItems:{open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned"},columns:{sourceReport:{totalLeads:"Total leads",totalValue:"Total values",open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned",winPct:"Win %"},assigneeReport:{won:"Won",totalLeads:"Total leads",wonValue:"Won revenue",totalValue:"Total value"},pipelineBreakdown:{count:"Leads",won:"Won",monetary:"Value",profit:"Bundlinje",wonValue:"Won revenue"}}},state={pipelineIds:usesClientPipelineDefaults()?[]:loadPipelineSelection(),status:"all",source:"all",assignedTo:"all",dateField:"createdAt",dateFrom:"",dateTo:"",adSpend:"",preset:"all"};let cachedData=null,cachedFacebookMetrics=null,cachedMonthlyAdSpend=null,availablePipelines=[],display=loadDisplayPrefs(),pipelineDefaultsApplied=!1,chartInstances={},chartFieldsCache=null,chartFieldsCacheKey=null,lastFetchedAt=0;const DATA_REFRESH_MS=120*1e3,DATA_FRESH_MS=DATA_REFRESH_MS,CHART_FIELD_KEYS=["weeklyRevenue","monthlyRevenue","weeklyLeads","monthlyLeads","monthlyLeadsValue","monthlyConversion","chartStatusBreakdown"];function getChartCacheKey(){return[[...state.pipelineIds].sort().join(","),state.status,state.source,state.assignedTo,state.dateField,state.dateFrom||"",state.dateTo||""].join("|")}function cacheChartFields(e){chartFieldsCache={},CHART_FIELD_KEYS.forEach(t=>{e[t]!==void 0&&(chartFieldsCache[t]=e[t])}),chartFieldsCacheKey=getChartCacheKey()}function applyChartFieldsCache(e){if(!!!(state.dateFrom||state.dateTo))return cacheChartFields(e),e;if(chartFieldsCache&&chartFieldsCacheKey===getChartCacheKey()){const n={...e};return CHART_FIELD_KEYS.forEach(a=>{chartFieldsCache[a]!==void 0&&(n[a]=chartFieldsCache[a])}),n}return cacheChartFields(e),e}function getDefaultChartPrefs(){const e={};return(window.DashboardCharts?Object.keys(DashboardCharts.CHART_DEFINITIONS):Object.keys(DISPLAY_OPTIONS.charts)).forEach(n=>{e[n]=!0}),e}function destroyCharts(){Object.values(chartInstances).forEach(e=>e.destroy()),chartInstances={},destroyCrmDevelopmentChart()}let crmDevelopmentMetricId="revenue",crmDevelopmentChartInstance=null;function usesCrmClientDashboard(){return IS_CLIENT_VIEW&&!IS_PREVIEW}function crmSafeDivide(e,t){const n=Number(e)||0,a=Number(t)||0;if(!a)return null;const o=n/a;return Number.isFinite(o)?o:null}function crmMetricValue(e,t){const n=e||{};switch(t){case"revenue":return n.revenue??0;case"profit":return Number.isFinite(Number(n.profit))?Number(n.profit):(Number(n.revenue)||0)-(Number(n.adSpend)||0);case"roas":return crmSafeDivide(n.revenue,n.adSpend);case"customers":return n.customers??0;case"adSpend":return n.adSpend??0;case"closeRate":return Number.isFinite(Number(n.closeRate))?Number(n.closeRate):crmSafeDivide(n.customers,n.leads)!=null?crmSafeDivide(n.customers,n.leads)*100:null;case"cpl":return n.cpl??crmSafeDivide(n.adSpend,n.leads);case"leads":return n.leads??0;case"ltv":return n.ltv;case"cac":return n.cac??crmSafeDivide(n.adSpend,n.customers);default:return null}}function formatCrmMetricValue(e,t){if(t==null||e!=="ltv"&&Number.isNaN(Number(t)))return"\u2014";switch(e){case"revenue":case"profit":case"adSpend":case"cpl":case"cac":return`Dkr ${fmtCompact(t)}`;case"roas":return fmtRoas(t);case"closeRate":return fmtPct(t);case"leads":case"customers":return fmt(t);case"ltv":return"\u2014";default:return String(t)}}const CRM_KPI_LAYOUT=[{kind:"single",id:"revenue"},{kind:"single",id:"profit"},{kind:"single",id:"roas"},{kind:"single",id:"customers"},{kind:"single",id:"adSpend"},{kind:"single",id:"closeRate"},{kind:"pair",ids:["cpl","leads"]},{kind:"pair",ids:["ltv","cac"]}],CRM_KPI_CARD_CLASS={revenue:" primary",profit:" accent",roas:" accent",adSpend:" accent"},CRM_KPI_LABELS={revenue:{label:"Oms\xE6tning",hint:""},profit:{label:"POAS (DK)",hint:"Bundlinje \u2212 annonceforbrug"},roas:{label:"ROAS",hint:"Oms\xE6tning \xF7 annonceforbrug"},customers:{label:"Lukkede kunder",hint:""},adSpend:{label:"Annoncebudget",hint:""},closeRate:{label:"Close rate",hint:"Vundne kunder \xF7 leads"},cpl:{label:"CPL",hint:"Pris pr. lead"},leads:{label:"Leads",hint:""},ltv:{label:"LTV",hint:"Kommer snart"},cac:{label:"CAC",hint:"Pris pr. lukket kunde"}},CRM_CHART_METRICS=["revenue","profit","adSpend","leads","customers","cpl","cac","closeRate"];function renderCrmKpiMetricInner(e,t){const n=CRM_KPI_LABELS[e]||{label:e,hint:""},a=formatCrmMetricValue(e,crmMetricValue(t,e)),o=n.hint||"";return`
      <div class="card-label">${n.label}</div>
      <div class="card-value">${a}</div>
      ${o?`<div class="card-sub">${o}</div>`:""}
  `}function renderCrmKpiGrid(e){if(!e?.totals)return'<div class="empty-section">Ingen performance-data for valgt periode.</div>';const t=e.totals;return`<div class="kpi-grid kpi-grid--client-top">${CRM_KPI_LAYOUT.map(a=>a.kind==="single"?`
        <div class="card${CRM_KPI_CARD_CLASS[a.id]||""}">
          ${renderCrmKpiMetricInner(a.id,t)}
        </div>
      `:`
      <div class="card crm-kpi-card--pair">
        <div>${renderCrmKpiMetricInner(a.ids[0],t)}</div>
        <div class="crm-kpi-pair-divider">${renderCrmKpiMetricInner(a.ids[1],t)}</div>
      </div>
    `).join("")}</div>`}function crmBucketMetricValue(e,t){switch(t){case"revenue":return e.revenue||0;case"profit":return Number.isFinite(Number(e.profit))?Number(e.profit):(e.revenue||0)-(e.adSpend||0);case"adSpend":return e.adSpend||0;case"leads":return e.leads||0;case"customers":return e.customers||0;case"cpl":return crmSafeDivide(e.adSpend,e.leads)||0;case"cac":return crmSafeDivide(e.adSpend,e.customers)||0;case"closeRate":{const n=crmSafeDivide(e.customers,e.leads);return n!=null?n*100:0}default:return 0}}function formatCrmBucketLabel(e,t){const n=e.start?.slice(0,10)||"";if(t==="month"){const[a,o]=n.split("-");return new Date(Number(a),Number(o)-1,1).toLocaleDateString("da-DK",{month:"short",year:"numeric"})}if(t==="week"){const a=e.end?.slice(0,10)||n;return`${n.slice(8,10)}/${n.slice(5,7)}\u2013${a.slice(8,10)}/${a.slice(5,7)}`}return`${n.slice(8,10)}/${n.slice(5,7)}`}function crmGranularityLabel(e){return e==="week"?"uge":e==="month"?"m\xE5ned":"dag"}function renderCrmDevelopmentChart(e){const t=!!e?.buckets?.length,n=crmDevelopmentMetricId,a=CRM_KPI_LABELS[n]?.label||n,o=e?.periodLabel||"Valgt periode",r=e?.granularity||"day",s=CRM_CHART_METRICS.map(i=>{const u=CRM_KPI_LABELS[i]?.label||i;return`<button type="button" class="crm-chart-metric-pill${i===n?" is-active":""}" data-crm-chart-metric="${i}">${u}</button>`}).join("");return`
    <div class="card chart-card crm-development-chart" id="crm-development-chart">
      <div class="crm-chart-header">
        <div>
          <div class="section-title">Udvikling over tid</div>
          <div class="crm-chart-subtitle" id="crm-chart-subtitle">${esc(o)} \xB7 ${crmGranularityLabel(r)} \xB7 ${esc(a)}</div>
        </div>
        <div class="crm-chart-metric-pills">${s}</div>
      </div>
      <div class="chart-empty note" style="display:${t?"none":"block"}">Ingen data for den valgte periode.</div>
      <div class="chart-canvas-wrap" style="display:${t?"block":"none"}">
        <canvas id="crm-development-chart-canvas" aria-label="Udviklingsgraf"></canvas>
      </div>
    </div>
  `}function destroyCrmDevelopmentChart(){crmDevelopmentChartInstance&&(crmDevelopmentChartInstance.destroy(),crmDevelopmentChartInstance=null)}function setCrmChartEmptyState(e){const t=document.getElementById("crm-development-chart");if(!t)return;const n=t.querySelector(".chart-empty"),a=t.querySelector(".chart-canvas-wrap");n&&(n.style.display=e?"block":"none"),a&&(a.style.display=e?"none":"block")}function mountCrmDevelopmentChart(e){if(!usesCrmClientDashboard())return;const t=document.getElementById("crm-development-chart-canvas");if(!t)return;if(typeof Chart>"u"||!e?.buckets?.length){destroyCrmDevelopmentChart(),setCrmChartEmptyState(!0),bindCrmChartMetricPills(e);return}if(setCrmChartEmptyState(!1),destroyCrmDevelopmentChart(),typeof Chart.getChart=="function"){const i=Chart.getChart(t);i&&i.destroy()}const n=crmDevelopmentMetricId,a=e.buckets.map(i=>formatCrmBucketLabel(i,e.granularity)),o=e.buckets.map(i=>crmBucketMetricValue(i,n)),r=[{label:CRM_KPI_LABELS[n]?.label||n,data:o,borderColor:"#46C7A0",backgroundColor:"rgba(70, 199, 160, 0.22)",fill:!0,tension:.35,pointRadius:e.granularity==="day"?0:3,pointHoverRadius:4,borderWidth:2}];n==="revenue"&&r.push({label:CRM_KPI_LABELS.adSpend.label,data:e.buckets.map(i=>i.adSpend||0),borderColor:"#1877F2",backgroundColor:"transparent",fill:!1,tension:.35,pointRadius:0,borderWidth:2,yAxisID:"y"});const s=new Set(["revenue","profit","adSpend","cpl","cac"]);crmDevelopmentChartInstance=new Chart(t,{type:"line",data:{labels:a,datasets:r},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:r.length>1,position:"bottom"},tooltip:{callbacks:{label(i){const u=i.parsed.y;return n==="closeRate"||i.dataset.label===CRM_KPI_LABELS.closeRate?.label?`${i.dataset.label}: ${fmtPct(u)}`:s.has(n)||i.dataset.label===CRM_KPI_LABELS.adSpend.label?`${i.dataset.label}: Dkr ${fmt(u)}`:`${i.dataset.label}: ${fmt(u)}`}}}},scales:{x:{grid:{display:!1},ticks:{maxRotation:0,autoSkip:!0,maxTicksLimit:12}},y:{beginAtZero:!0,ticks:{callback(i){return n==="closeRate"?`${i}%`:s.has(n)?fmtCompact(i):fmt(i)}}}}}}),bindCrmChartMetricPills(e)}function bindCrmChartMetricPills(e){const t=document.getElementById("crm-development-chart");!t||t.dataset.crmChartBound||(t.dataset.crmChartBound="1",t.addEventListener("click",n=>{const a=n.target.closest("[data-crm-chart-metric]");if(!a)return;const o=a.getAttribute("data-crm-chart-metric");if(!o||o===crmDevelopmentMetricId)return;crmDevelopmentMetricId=o,t.querySelectorAll("[data-crm-chart-metric]").forEach(m=>{m.classList.toggle("is-active",m.getAttribute("data-crm-chart-metric")===crmDevelopmentMetricId)});const r=cachedData?.performance||e,s=document.getElementById("crm-chart-subtitle"),i=r?.periodLabel||"Valgt periode",u=CRM_KPI_LABELS[crmDevelopmentMetricId]?.label||crmDevelopmentMetricId;s&&(s.textContent=`${i} \xB7 ${crmGranularityLabel(r?.granularity)} \xB7 ${u}`),mountCrmDevelopmentChart(r)}))}function mountCharts(e){usesCrmClientDashboard()||typeof Chart>"u"||!window.DashboardCharts||(destroyCharts(),Object.keys(DashboardCharts.CHART_DEFINITIONS).forEach(t=>{if(!isVisible("charts",t))return;const n=DashboardCharts.CHART_DEFINITIONS[t],a=document.getElementById(`chart-${t}`);if(!a)return;const r=a.closest(".chart-card")?.querySelector(".chart-empty"),s=n?.defaultType||"bar",i=DashboardCharts.buildChartConfig(t,e,s);if(!i){a.style.display="none",r&&(r.style.display="block");return}a.style.display="block",r&&(r.style.display="none"),chartInstances[t]=new Chart(a,i)}))}function usesClientPipelineDefaults(){return IS_CLIENT_VIEW||IS_ADMIN}function getPipelineStorageKey(){return`cenhub_pipelines_${facebookClientId||CLIENT_SLUG}`}function loadPipelineSelection(){try{const e=JSON.parse(localStorage.getItem(getPipelineStorageKey())||"[]");return Array.isArray(e)?e:[]}catch{return[]}}function getAllPipelineIds(e){return e.map(t=>t.id)}function getDefaultPipelineIds(e,t=[]){const n=getAllPipelineIds(e),a=(t||[]).filter(o=>n.includes(o));return a.length?a:n.length?n:[]}function ensurePipelineDefaults(e,t=[]){if(!e.length)return;if(usesClientPipelineDefaults()){state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0;return}const n=getAllPipelineIds(e);let a=loadPipelineSelection();if(!a.length)try{a=JSON.parse(localStorage.getItem(PIPELINE_KEY)||"[]")}catch{a=[]}!a.length||!pipelineDefaultsApplied?(a.length?(state.pipelineIds=a.filter(o=>n.includes(o)),state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t))):state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0,savePipelineSelection()):state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t),savePipelineSelection())}function ensurePipelineSelectionBeforeFetch(){return state.pipelineIds.length?!0:availablePipelines.length?(state.pipelineIds=getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds),state.pipelineIds.length&&!usesClientPipelineDefaults()&&savePipelineSelection(),state.pipelineIds.length>0):!1}function savePipelineSelection(){localStorage.setItem(getPipelineStorageKey(),JSON.stringify(state.pipelineIds))}function isPipelineSelected(e){return state.pipelineIds.includes(e)}function isAllPipelinesSelected(e){const t=getAllPipelineIds(e);return t.length>0&&t.every(n=>state.pipelineIds.includes(n))}function selectAllPipelines(e){state.pipelineIds=getAllPipelineIds(e),savePipelineSelection()}function clearPipelineSelection(){state.pipelineIds=[],savePipelineSelection()}function setPipelineSelection(e){state.pipelineIds=[...new Set(e)],savePipelineSelection()}function togglePipelineSelection(e){isPipelineSelected(e)?state.pipelineIds=state.pipelineIds.filter(t=>t!==e):state.pipelineIds=[...state.pipelineIds,e],savePipelineSelection()}function formatSelectedPipelines(e){return state.pipelineIds.length?isAllPipelinesSelected(e)?"All pipelines":state.pipelineIds.map(t=>e.find(n=>n.id===t)?.name||t).join(", "):"None selected"}function renderPipelineChips(e){return state.pipelineIds.length?`
    <div class="pipeline-chips">
      ${state.pipelineIds.map(n=>e.find(a=>a.id===n)).filter(Boolean).map(n=>`
        <span class="pipeline-chip">${esc(n.name)}</span>
      `).join("")}
    </div>
  `:'<div class="pipeline-warning">Select at least one pipeline, then click Apply data filters.</div>'}function defaultDisplayPrefs(){const e={kpis:{},sections:{},charts:getDefaultChartPrefs(),statusItems:{},columns:{}};return Object.keys(DISPLAY_OPTIONS.kpis).forEach(t=>{e.kpis[t]=!0}),Object.keys(DISPLAY_OPTIONS.sections).forEach(t=>{e.sections[t]=!0}),Object.keys(DISPLAY_OPTIONS.charts).forEach(t=>{e.charts[t]=!0}),Object.keys(DISPLAY_OPTIONS.statusItems).forEach(t=>{e.statusItems[t]=!0}),Object.entries(DISPLAY_OPTIONS.columns).forEach(([t,n])=>{e.columns[t]={},Object.keys(n).forEach(a=>{e.columns[t][a]=!0})}),e}function loadDisplayPrefs(){if(IS_CLIENT_VIEW&&!IS_PREVIEW)return defaultDisplayPrefs();try{const e=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY)||"null");if(!e)return defaultDisplayPrefs();const t=defaultDisplayPrefs();return{kpis:{...t.kpis,...e.kpis},sections:{...t.sections,...e.sections},charts:{...t.charts,...e.charts},statusItems:{...t.statusItems,...e.statusItems},columns:{sourceReport:{...t.columns.sourceReport,...e.columns?.sourceReport||{}},assigneeReport:{...t.columns.assigneeReport,...e.columns?.assigneeReport||{}},pipelineBreakdown:{...t.columns.pipelineBreakdown,...e.columns?.pipelineBreakdown||{}}}}}catch{return defaultDisplayPrefs()}}function ensureChartsVisible(){const e=Object.keys(DISPLAY_OPTIONS.charts);e.some(n=>display.charts[n]!==!1)||(e.forEach(n=>{display.charts[n]=!0}),saveDisplayPrefs())}function saveDisplayPrefs(){localStorage.setItem(STORAGE_KEY,JSON.stringify(display))}function isVisible(e,t,n){return e==="columns"?display.columns[n]?.[t]!==!1:display[e]?.[t]!==!1}function toggleDisplay(e,t,n){e==="columns"?display.columns[n][t]=!display.columns[n][t]:display[e][t]=!display[e][t],saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}function setAllDisplay(e,t,n){e==="columns"?Object.keys(DISPLAY_OPTIONS.columns[n]).forEach(a=>{display.columns[n][a]=t}):Object.keys(DISPLAY_OPTIONS[e]).forEach(a=>{display[e][a]=t}),saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}const fmt=e=>new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0)),fmtCompact=e=>{const t=Number(e)||0;return t>=1e6?`${(t/1e6).toFixed(2)}M`:t>=1e3?`${(t/1e3).toFixed(2)}K`:fmt(t)},fmtPct=e=>`${(Number(e)||0).toFixed(2)}%`,fmtRoas=e=>{const t=Number(e)||0;return t>0?`${t.toFixed(2)}x`:"\u2014"};function formatActiveDateFilter(e){if(!e.dateFrom&&!e.dateTo)return"Till date";const t=getDashboardTimeZone();if(window.MarketingMetrics?.formatShortDateLabel){const n=window.MarketingMetrics.formatShortDateLabel(e.dateFrom,t),a=window.MarketingMetrics.formatShortDateLabel(e.dateTo,t);if(n&&a)return`${n} \u2013 ${a}`}return`${e.dateFrom||"start"} to ${e.dateTo||"now"}`}function showDateRangeError(e){document.querySelectorAll("#date-range-error").forEach(t=>{t.textContent=e,t.hidden=!e})}function clearDateRangeError(){showDateRangeError("")}function needsFreshData(){return!lastFetchedAt||Date.now()-lastFetchedAt>DATA_FRESH_MS}function buildQuery(e,t={}){const n=new URLSearchParams,a=getAllPipelineIds(e||[]),o=state.pipelineIds.filter(r=>a.includes(r));if(!o.length)throw new Error("Select at least one pipeline.");return n.set("pipelineIds",o.join(",")),state.dateField&&n.set("dateField",state.dateField),state.dateFrom&&n.set("dateFrom",state.dateFrom),state.dateTo&&n.set("dateTo",state.dateTo),["status","source","assignedTo","adSpend"].forEach(r=>{state[r]&&state[r]!=="all"&&n.set(r,state[r])}),appendTenantParams(n),t.forceFresh&&n.set("fresh","1"),n.toString()}function formatDateInput(e){const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${a}`}function getDashboardTimeZone(){return cachedData?.account?.timezone||"Europe/Copenhagen"}function getCalendarPartsInTimeZone(e,t=new Date){const n=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(t);return{year:Number(n.find(a=>a.type==="year")?.value),month:Number(n.find(a=>a.type==="month")?.value),day:Number(n.find(a=>a.type==="day")?.value)}}function formatMonthDateRange(e,t){const n=`${e}-${String(t).padStart(2,"0")}-01`,a=new Date(e,t,0).getDate(),o=`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`;return{start:n,end:o}}const datePickerState={inputId:null,anchorEl:null,viewYear:null,viewMonth:null};let datePickerListenersBound=!1;function isoFromParts(e,t,n){const a=Number(n);return!e||!t||!Number.isFinite(a)?"":`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`}function formatPickerDisplayLabel(e,t){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return t;const n=getDashboardTimeZone();return window.MarketingMetrics?.formatShortDateLabel&&window.MarketingMetrics.formatShortDateLabel(e,n)||e}function ensureDatePickerPopover(){if(document.getElementById("date-picker-popover"))return;const e=document.createElement("div");e.id="date-picker-backdrop",e.className="date-picker-backdrop",e.hidden=!0,e.addEventListener("click",closeDatePicker),document.body.appendChild(e);const t=document.createElement("div");t.id="date-picker-popover",t.className="date-picker-popover",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),document.body.appendChild(t)}function syncDatePickerDisplays(){[{id:"dateFrom",key:"dateFrom",placeholder:"Pick start date"},{id:"dateTo",key:"dateTo",placeholder:"Pick end date"}].forEach(({id:e,key:t,placeholder:n})=>{const a=document.getElementById(e),o=document.getElementById(`${e}-display`),r=document.getElementById(`${e}-trigger`),s=state[t]??"";a&&(a.value=s),o&&(o.textContent=formatPickerDisplayLabel(s,n)),r?.classList.toggle("is-empty",!s),r?.classList.toggle("has-value",!!s)})}function getStateDateValue(e){return state[e]??""}function getDatePickerViewMonth(e){const t=getStateDateValue(e);if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[n,a]=t.split("-").map(Number);return{year:n,month:a}}return getCalendarPartsInTimeZone(getDashboardTimeZone())}function getTodayIso(){const e=getCalendarPartsInTimeZone(getDashboardTimeZone());return isoFromParts(e.year,e.month,e.day)}function isStartDateDisabled(e){return e>=getTodayIso()}function isFutureDateDisabled(e){return e>getTodayIso()}function isFutureMonthView(e,t){const n=getCalendarPartsInTimeZone(getDashboardTimeZone());return e>n.year||e===n.year&&t>n.month}function isDatePickerDayDisabled(e,t){return t==="dateFrom"&&isStartDateDisabled(e)?!0:isFutureDateDisabled(e)}function renderDatePickerDayCell(e,t,n,a,o,r,s,i){const u=["date-picker-day"];if(n&&u.push("is-outside"),e===a&&u.push("is-today"),e===o&&u.push("is-selected"),r&&s){const m=r<=s?r:s,v=r<=s?s:r;e>=m&&e<=v&&u.push("is-in-range")}return e===r&&u.push("is-range-start"),e===s&&u.push("is-range-end"),isDatePickerDayDisabled(e,i)?(u.push("is-disabled"),`<button type="button" class="${u.join(" ")}" disabled aria-disabled="true">${t}</button>`):`<button type="button" class="${u.join(" ")}" onclick="selectDatePickerDay('${e}')">${t}</button>`}function renderDatePickerPopover(){const e=document.getElementById("date-picker-popover");if(!e||!datePickerState.inputId)return;const{viewYear:t,viewMonth:n,inputId:a}=datePickerState,o=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(t,n-1,1)),r=["Mo","Tu","We","Th","Fr","Sa","Su"],i=(new Date(t,n-1,1).getDay()+6)%7,u=new Date(t,n,0).getDate(),m=new Date(t,n-1,0).getDate(),v=getCalendarPartsInTimeZone(getDashboardTimeZone()),k=isoFromParts(v.year,v.month,v.day),A=getStateDateValue(a),$=getStateDateValue("dateFrom"),w=getStateDateValue("dateTo");let D="";for(let f=i-1;f>=0;f-=1){const b=m-f,y=n===1?12:n-1,S=n===1?t-1:t,T=isoFromParts(S,y,b);D+=renderDatePickerDayCell(T,b,!0,k,A,$,w,a)}for(let f=1;f<=u;f+=1){const b=isoFromParts(t,n,f);D+=renderDatePickerDayCell(b,f,!1,k,A,$,w,a)}const M=(7-(i+u)%7)%7;for(let f=1;f<=M;f+=1){const b=n===12?1:n+1,y=n===12?t+1:t,S=isoFromParts(y,b,f);D+=renderDatePickerDayCell(S,f,!0,k,A,$,w,a)}const c=a==="dateFrom"?'<span class="date-picker-hint">Start date must be before today</span>':"",p=a==="dateTo"?'<button type="button" class="date-picker-footer-btn primary" onclick="setDatePickerToday()">Today</button>':"",l=n===12?1:n+1,h=n===12?t+1:t,d=!isFutureMonthView(h,l);e.innerHTML=`
    <div class="date-picker-panel">
      <div class="date-picker-header">
        <div class="date-picker-title">${esc(o)}</div>
        <div class="date-picker-nav">
          <button type="button" class="date-picker-nav-btn" aria-label="Previous month" onclick="shiftDatePickerMonth(-1)">${ICON_CHEVRON_LEFT}</button>
          <button type="button" class="date-picker-nav-btn" aria-label="Next month" onclick="shiftDatePickerMonth(1)" ${d?"":"disabled"}>${ICON_CHEVRON_RIGHT}</button>
        </div>
      </div>
      <div class="date-picker-weekdays">
        ${r.map(f=>`<div class="date-picker-weekday">${f}</div>`).join("")}
      </div>
      <div class="date-picker-grid">${D}</div>
      <div class="date-picker-footer">
        ${c}
        <button type="button" class="date-picker-footer-btn" onclick="clearDatePickerField()">Clear</button>
        ${p}
      </div>
    </div>
  `}function positionDatePickerPopover(){const e=document.getElementById("date-picker-popover"),t=datePickerState.anchorEl;if(!e||!t)return;e.hidden=!1,e.style.visibility="hidden",e.style.left="0",e.style.top="0",e.style.transform="";const n=t.getBoundingClientRect(),a=e.getBoundingClientRect(),o=8;let r=n.bottom+o,s=n.left;window.innerWidth<=640?(s=Math.max(16,(window.innerWidth-a.width)/2),r=Math.max(16,(window.innerHeight-a.height)/2),e.style.transform="none"):(s+a.width>window.innerWidth-16&&(s=window.innerWidth-a.width-16),s<16&&(s=16),r+a.height>window.innerHeight-16&&(r=Math.max(16,n.top-a.height-o))),e.style.top=`${r}px`,e.style.left=`${s}px`,e.style.visibility=""}function openDatePicker(e,t){ensureDatePickerPopover();const n=document.getElementById("date-picker-popover"),a=document.getElementById("date-picker-backdrop");if(!n||!a||!t)return;if(datePickerState.inputId===e&&!n.hidden){closeDatePicker();return}closeDatePicker(),datePickerState.inputId=e,datePickerState.anchorEl=t;const o=getDatePickerViewMonth(e);datePickerState.viewYear=o.year,datePickerState.viewMonth=o.month,renderDatePickerPopover(),a.hidden=!1,t.classList.add("is-active"),positionDatePickerPopover()}function closeDatePicker(){const e=document.getElementById("date-picker-popover"),t=document.getElementById("date-picker-backdrop");e&&(e.hidden=!0),t&&(t.hidden=!0),datePickerState.anchorEl?.classList.remove("is-active"),datePickerState.inputId=null,datePickerState.anchorEl=null}function shiftDatePickerMonth(e){let{viewYear:t,viewMonth:n}=datePickerState;n+=e,n<1?(n=12,t-=1):n>12&&(n=1,t+=1),!(e>0&&isFutureMonthView(t,n))&&(datePickerState.viewYear=t,datePickerState.viewMonth=n,renderDatePickerPopover(),positionDatePickerPopover())}function selectDatePickerDay(e){const t=datePickerState.inputId;if(!t||!/^\d{4}-\d{2}-\d{2}$/.test(e))return;if(isDatePickerDayDisabled(e,t)){showDateRangeError(t==="dateFrom"?"Start date must be before today.":"End date cannot be after today.");return}t==="dateFrom"&&(state.dateFrom=e),t==="dateTo"&&(state.dateTo=e);const n=document.getElementById(t);n&&(n.value=e),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function setDatePickerToday(){if(datePickerState.inputId==="dateFrom"){showDateRangeError("Start date must be before today.");return}const e=getCalendarPartsInTimeZone(getDashboardTimeZone());selectDatePickerDay(isoFromParts(e.year,e.month,e.day))}function clearDatePickerField(){const e=datePickerState.inputId;if(!e)return;state[e]="";const t=document.getElementById(e);t&&(t.value=""),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function handleDatePickerEscape(e){e.key==="Escape"&&closeDatePicker()}function initDatePickers(){ensureDatePickerPopover(),syncDatePickerDisplays(),datePickerListenersBound||(document.addEventListener("keydown",handleDatePickerEscape),window.addEventListener("resize",closeDatePicker),datePickerListenersBound=!0)}let lastCustomDateFrom="",lastCustomDateTo="";function getPresetDateRange(e){const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="month")return formatMonthDateRange(n,a);if(e==="lastMonth"){let o=n,r=a-1;return r<1&&(r=12,o-=1),formatMonthDateRange(o,r)}return e==="year"?{start:`${n}-01-01`,end:`${n}-12-31`}:null}function isPresetGeneratedRange(e,t){return!e||!t?!1:["month","lastMonth","year"].some(n=>{const a=getPresetDateRange(n);return a&&e===a.start&&t===a.end})}function saveCustomDateRange(){!state.dateFrom||!state.dateTo||isPresetGeneratedRange(state.dateFrom,state.dateTo)||(lastCustomDateFrom=state.dateFrom,lastCustomDateTo=state.dateTo)}function restoreCustomDateRange(){if(lastCustomDateFrom&&lastCustomDateTo&&!isPresetGeneratedRange(lastCustomDateFrom,lastCustomDateTo)){state.dateFrom=lastCustomDateFrom,state.dateTo=lastCustomDateTo;return}state.dateFrom="",state.dateTo=""}function setPreset(e){state.preset==="custom"&&e!=="custom"&&saveCustomDateRange(),state.preset=e;const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="all")state.dateFrom="",state.dateTo="",state.dateField="createdAt";else if(e==="month"){const o=formatMonthDateRange(n,a);state.dateFrom=o.start,state.dateTo=o.end,state.dateField="lastStatusChangeAt"}else if(e==="lastMonth"){let o=n,r=a-1;r<1&&(r=12,o-=1);const s=formatMonthDateRange(o,r);state.dateFrom=s.start,state.dateTo=s.end,state.dateField="lastStatusChangeAt"}else if(e==="year"){const o=getPresetDateRange("year");state.dateFrom=o.start,state.dateTo=o.end,state.dateField="lastStatusChangeAt"}else e==="custom"&&(state.dateField="createdAt",restoreCustomDateRange())}function updateCustomDateRowVisibility(){document.querySelectorAll("#custom-date-row").forEach(e=>{e.hidden=state.preset!=="custom"})}function updateFilterUi(){const e=document.getElementById("dateFrom"),t=document.getElementById("dateTo"),n=document.getElementById("adSpend");e&&(e.value=state.dateFrom||""),t&&(t.value=state.dateTo||""),n&&(n.value=state.adSpend||""),["status","source","assignedTo","dateField"].forEach(a=>{const o=document.getElementById(a);o&&(o.value=state[a])}),document.querySelectorAll("[data-preset]").forEach(a=>{a.classList.toggle("active",a.dataset.preset===state.preset)}),updateCustomDateRowVisibility(),syncDatePickerDisplays(),refreshPipelinePanel()}function onManualDateChange(){if(syncFiltersFromDom(),state.preset="custom",state.dateField="createdAt",state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date."),updateFilterUi();return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){state.dateFrom="";const e=document.getElementById("dateFrom");e&&(e.value=""),showDateRangeError("Start date must be before today."),updateFilterUi();return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){state.dateTo="";const e=document.getElementById("dateTo");e&&(e.value=""),showDateRangeError("End date cannot be after today."),updateFilterUi();return}clearDateRangeError(),updateFilterUi(),state.dateFrom&&state.dateTo&&(saveCustomDateRange(),applyDataFilters(!1))}function onFilterChange(e,t){state[e]=t,applyDataFilters(!1)}async function fetchJson(e,t){const n=new AbortController,a=setTimeout(()=>n.abort(),FETCH_TIMEOUT_MS),o=()=>n.abort();t?.addEventListener("abort",o);try{const r=await fetch(e,{signal:n.signal}),s=await r.json().catch(()=>({}));if(!r.ok)throw new Error(s.error||`Request failed (${r.status})`);return s}catch(r){throw r.name==="AbortError",r}finally{clearTimeout(a),t?.removeEventListener("abort",o)}}async function fetchFacebookMetrics(e){try{const t=new URLSearchParams({client:facebookClientId});return CLIENT_ACCESS_KEY&&t.set("key",CLIENT_ACCESS_KEY),await fetchJson(`/api/facebook-metrics?${t}`,e)}catch(t){if(t.name==="AbortError")throw t;return null}}function resolveMarketingPreset(){return["all","month","lastMonth","year"].includes(state.preset)?state.preset:state.preset==="custom"&&state.dateFrom&&state.dateTo?"custom":state.preset}function applyMarketingData(e,t){if(!window.MarketingMetrics)return e;const n=resolveMarketingPreset(),a=n==="custom",o=window.MarketingMetrics.applyMarketingToDashboard(e,t,n,{timeZone:e.account?.timezone||"Europe/Copenhagen",dateFrom:a?state.dateFrom:null,dateTo:a?state.dateTo:null});return o.monthlyAdSpend?.length&&(cachedMonthlyAdSpend=o.monthlyAdSpend),cachedMonthlyAdSpend?.length&&(o.monthlyAdSpend=cachedMonthlyAdSpend),window.MarketingMetrics?.buildMonthlyCostPerLead&&(o.monthlyCostPerLead=window.MarketingMetrics.buildMonthlyCostPerLead(o.monthlyAdSpend,o.monthlyLeads||e.monthlyLeads||[])),o}async function fetchDashboardData(e,t,n={}){const a=buildQuery(e,n),o=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,t);return applyChartFieldsCache(o)}async function bootstrapDashboardData(e,t={}){const n=new URLSearchParams;appendTenantParams(n),t.forceFresh&&n.set("fresh","1");const a=n.toString(),o=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,e);return o.account?.facebookClientId?facebookClientId=o.account.facebookClientId:o.account?.clientId&&(facebookClientId=o.account.clientId),applyChartFieldsCache(o)}function refreshPipelinePanel(){const e=document.getElementById("pipeline-panel");if(e){if(!availablePipelines.length){e.innerHTML='<div class="pipeline-note">Sync client data to load pipelines.</div>';return}e.innerHTML=renderPipelineSelector(availablePipelines)}}function selectAllPipelinesAction(){selectAllPipelines(availablePipelines),refreshPipelinePanel()}function clearPipelineSelectionAction(){clearPipelineSelection(),refreshPipelinePanel()}function togglePipelineSelectionAction(e){togglePipelineSelection(e),refreshPipelinePanel()}function selectCenhubPipelinesAction(){setPipelineSelection(getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds)),refreshPipelinePanel()}function renderPipelineSelector(e){return e.length?`
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
        ${o.map(([r,s])=>`
          <label class="checkbox-item">
            <input type="checkbox"
              ${isVisible(t,r,a)?"checked":""}
              onchange="toggleDisplay('${t}', '${r}'${a?`, '${a}'`:""})" />
            <span>${s}</span>
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
    `}function renderTable(e,t,n,a,o){const r=n.filter(s=>isVisible("columns",s.key,e));return r.length?`
    <div class="dashboard-table-wrap">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>${t}</th>
            ${r.map(s=>`<th class="${s.align||""}">${s.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${a.length?a.map(s=>`
            <tr>
              <td>${o(s,"label")}</td>
              ${r.map(i=>`<td class="${i.align||""}">${o(s,i.key)}</td>`).join("")}
            </tr>
          `).join(""):`<tr><td colspan="${r.length+1}">Ingen data for valgte filtre.</td></tr>`}
        </tbody>
      </table>
    </div>
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
  `}function clientKpiCopy(e,t){return IS_CLIENT_VIEW&&!IS_PREVIEW?t:e}function getAdSpendSubtitle(e){if(e.adSpendSource!=="facebook")return"No ad spend data for this period";if(state.preset==="all")return"Ad spend";const t=e.adSpendLabel;if(!t||t==="Custom range"||t==="Till date")return"Ad spend";const n=e.adSpendShowAsAvg?"Avg ad spend":"Ad spend";return/^\d{4}$/.test(t)?`${n} year ${t}`:`${n} ${t.toLowerCase()}`}function renderKpiCards(e){const t=[];if(isVisible("kpis","totalRevenue")&&t.push(`
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
  `}function renderDashboardMiddleSections(e){const{kpis:t,statusBreakdown:n,sourceReport:a,assigneeReport:o,pipelines:r,filters:s}=e;return`
    ${isVisible("sections","statusBreakdown")?`
      <div class="card">
        <div class="section-title">Opportunity Status (Cards)</div>
        ${renderStatusBreakdown(n)}
      </div>
    `:""}

    ${isVisible("sections","sourceReport")?`
      <div class="card">
        <div class="section-title">Lead Source Report</div>
        ${renderTable("sourceReport","Source",[{key:"totalLeads",label:"Total leads",align:"num"},{key:"totalValue",label:"Total values",align:"num"},{key:"open",label:"Open",align:"num"},{key:"won",label:"Won",align:"num"},{key:"lost",label:"Lost",align:"num"},{key:"abandoned",label:"Abandoned",align:"num"},{key:"winPct",label:"Win %",align:"num"}],a,(u,m)=>m==="label"?esc(u.source):m==="totalValue"?`Dkr ${fmt(u.totalValue)}`:m==="winPct"?fmtPct(u.winPct):fmt(u[m]))}
      </div>
    `:""}

    ${isVisible("sections","assigneeReport")||isVisible("sections","pipelineBreakdown")?`
      <div class="section-grid">
        ${isVisible("sections","assigneeReport")?`
          <div class="card">
            <div class="section-title">Leads Closed by Assignee</div>
            ${renderTable("assigneeReport","Assignee",[{key:"won",label:"Won",align:"num"},{key:"totalLeads",label:"Total leads",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"},{key:"totalValue",label:"Total value",align:"num"}],o,(u,m)=>m==="label"?esc(u.assigneeName):m==="wonValue"||m==="totalValue"?`Dkr ${fmt(u[m])}`:fmt(u[m]))}
          </div>
        `:""}
        ${isVisible("sections","pipelineBreakdown")?`
          <div class="card">
            <div class="section-title">Pipeline Breakdown</div>
            ${renderTable("pipelineBreakdown","Pipeline",[{key:"count",label:"Leads",align:"num"},{key:"won",label:"Won",align:"num"},{key:"monetary",label:"Value",align:"num"},{key:"profit",label:"Bundlinje",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"}],r,(u,m)=>m==="label"?esc(u.name):m==="monetary"||m==="profit"||m==="wonValue"?`Dkr ${fmt(u[m])}`:fmt(u[m]))}
          </div>
        `:""}
      </div>
    `:""}

    ${IS_ADMIN?`
    <div class="note">
      ${t.usingCenhubDefaults?"Till-date Total Leads uses deduped opportunities from account pipeline defaults. ":""}
      Active filters: source=${s.source}, assignee=${s.assignedTo}, dates=${formatActiveDateFilter(s)}.
    </div>
    `:""}
  `}function renderDashboardContent(e){const{kpis:t,performance:n}=e;return usesCrmClientDashboard()?`
      ${renderMetricsChangeBanner(e)}
      ${renderCrmKpiGrid(n)}
      ${renderCrmDevelopmentChart(n)}
      ${renderDashboardMiddleSections(e)}
      <div class="crm-legacy-kpi-section">
        <div class="section-title">Detaljerede n\xF8gletal</div>
        ${renderKpiCards(t)}
      </div>
      <div class="brand-footer">
        Dashboard by Cenhub
        \xB7 Holstebro
      </div>
    `:`
    ${renderMetricsChangeBanner(e)}
    ${renderKpiCards(t)}
    ${renderChartsSection()}
    ${renderDashboardMiddleSections(e)}
    <div class="brand-footer">
      Dashboard by Cenhub
      \xB7 Holstebro
    </div>
  `}function updateDashboardContent(e){if(IS_ADMIN){const n=document.getElementById("admin-filters-panel");n&&(n.outerHTML=renderAdminFiltersPanel(e.filterOptions||{pipelines:[],statuses:[],sources:[],assignees:[],dateFields:[]}));const a=document.getElementById("admin-display-panel");if(a){const o=!!a.open;a.outerHTML=renderAdminDisplayOptions(o)}}const t=document.getElementById("dashboard-content");t&&(t.innerHTML=renderDashboardContent(e),mountCharts(e),mountCrmDevelopmentChart(e.performance))}function renderDashboard(e){const t=document.getElementById("dashboard"),{filterOptions:n,account:a={}}=e,o=document.querySelector("details.panel")?.open,r=a.accountName||"Dashboard";IS_CLIENT_VIEW&&a.accountName&&(document.title=`${a.accountName} \xB7 Cenhub Dashboard`),t.innerHTML=`
    ${renderAppTopbar()}
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
          <h1>${esc(r)}</h1>
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
  `,IS_ADMIN_CLIENT&&loadSetupAccount(),initDatePickers()}let isFetching=!1,pendingRefetch=!1,fetchGeneration=0,activeFetchController=null,fetchStartedAt=0;const FETCH_TIMEOUT_MS=9e4;function restoreDashboardContentAfterFailedFetch(e){!e||!cachedData||(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi())}function setPresetButtonsDisabled(e){document.querySelectorAll("[data-preset]").forEach(t=>{t.disabled=e})}function resetFetchUiState(){isFetching=!1,setPresetButtonsDisabled(!1);const e=document.getElementById("apply-filters-btn");e&&(e.disabled=!1,e.textContent="Apply data filters")}function cancelActiveFetch(){activeFetchController&&(activeFetchController.abort(),activeFetchController=null)}function canReuseBootstrapDashboard(e){return!!(e?.kpis&&usesClientPipelineDefaults()&&!state.dateFrom&&!state.dateTo&&state.status==="all"&&state.source==="all"&&state.assignedTo==="all")}async function loadDashboard(e=!0,t={}){const{background:n=!1,forceFresh:a=!1}=t,o=!!a,r=document.getElementById("dashboard");if(isFetching&&(e||!cachedData))cancelActiveFetch(),fetchGeneration+=1,pendingRefetch=!1,resetFetchUiState();else if(isFetching){e&&(pendingRefetch=!0);return}const s=!!document.getElementById("dashboard-content"),i=document.getElementById("apply-filters-btn");if(e||!cachedData){const u=++fetchGeneration;activeFetchController=new AbortController;const m=activeFetchController.signal;if(isFetching=!0,fetchStartedAt=Date.now(),!s)r.innerHTML=`
        ${renderAppTopbar()}
        ${wrapDashboardShell(`
          <div class="loading-state">
            <div class="spinner"></div>
            ${LOADING_MSG}
          </div>
        `)}`;else if(!n){const v=document.getElementById("dashboard-content");v&&(v.innerHTML=renderKpiSkeleton()),i&&(i.disabled=!0,i.textContent="Loading..."),setPresetButtonsDisabled(!0)}try{let v=null;if(!availablePipelines.length){if(v=await bootstrapDashboardData(m),u!==fetchGeneration)return;availablePipelines=v.filterOptions.pipelines||[],ensurePipelineDefaults(availablePipelines,v.account?.defaultPipelineIds)}if(!ensurePipelineSelectionBeforeFetch())throw new Error("Select at least one pipeline.");const A=canReuseBootstrapDashboard(v)&&!o;let $,w;if(A?[w,$]=await Promise.all([fetchFacebookMetrics(m),Promise.resolve(v)]):[$,w]=await Promise.all([fetchDashboardData(availablePipelines,m,{forceFresh:o}),fetchFacebookMetrics(m)]),u!==fetchGeneration)return;cachedFacebookMetrics=w,cachedData=applyMarketingData($,w),cachedData.account?.facebookClientId?facebookClientId=cachedData.account.facebookClientId:cachedData.account?.clientId&&(facebookClientId=cachedData.account.clientId),availablePipelines=cachedData.filterOptions.pipelines||availablePipelines,ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),lastFetchedAt=cachedData.cachedAt?new Date(cachedData.cachedAt).getTime():Date.now()}catch(v){if(u!==fetchGeneration)return;if(v.name==="AbortError"){s?restoreDashboardContentAfterFailedFetch(s):r.innerHTML=`
            ${renderAppTopbar()}
            ${wrapDashboardShell(`
              <div class="error-state">
                <div>Fejl ved hentning af data</div>
                <div style="margin-top:8px;font-size:12px;color:#666">Request timed out. Pr\xF8v igen.</div>
                <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            `)}`;return}if(IS_ADMIN_CLIENT&&s){const k=document.getElementById("dashboard-content");k&&(k.innerHTML=`
            <div class="note admin-setup-placeholder">
              ${esc(v.message)}
              <div style="margin-top:12px">
                <button type="button" class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            </div>`)}else s?s&&cachedData?(restoreDashboardContentAfterFailedFetch(s),showToast(v.message||"Failed to load filtered data.","error")):i&&(i.textContent="Apply failed - try again"):r.innerHTML=`
          ${renderAppTopbar()}
          ${wrapDashboardShell(`
            <div class="error-state">
              <div>Fejl ved hentning af data</div>
              <div style="margin-top:8px;font-size:12px;color:#666">${esc(v.message)}</div>
              <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
            </div>
          `)}`;return}finally{u===fetchGeneration&&(activeFetchController=null,resetFetchUiState()),pendingRefetch&&(pendingRefetch=!1,loadDashboard(!0))}if(u!==fetchGeneration)return}try{s?(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi()):(renderDashboard(cachedData),mountCharts(cachedData),mountCrmDevelopmentChart(cachedData?.performance))}catch(u){resetFetchUiState(),r.innerHTML=`
      ${renderAppTopbar()}
      ${wrapDashboardShell(`
        <div class="error-state">
          <div>Fejl ved visning af dashboard</div>
          <div style="margin-top:8px;font-size:12px;color:#666">${esc(u.message)}</div>
          <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
        </div>
      `)}
    `}}function syncFiltersFromDom(){["status","source","assignedTo","dateField"].forEach(t=>{const n=document.getElementById(t);n&&(state[t]=n.value)});const e=document.getElementById("adSpend");if(e&&(state.adSpend=e.value),state.preset==="custom"){const t=document.getElementById("dateFrom"),n=document.getElementById("dateTo");t&&(state.dateFrom=t.value),n&&(state.dateTo=n.value),state.dateField="createdAt"}}function hasPartialDateRange(){return!!(state.dateFrom&&!state.dateTo||!state.dateFrom&&state.dateTo)}function applyPreset(e){if(clearDateRangeError(),closeDatePicker(),setPreset(e),updateFilterUi(),e==="custom"){const t=document.getElementById("dateFrom-trigger");t&&openDatePicker("dateFrom",t);return}applyDataFilters(!1)}function applyDataFilters(e=!0){if(e&&syncFiltersFromDom(),state.preset==="custom"){if(hasPartialDateRange()){showDateRangeError("Select both From and To dates.");return}if(state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date.");return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){showDateRangeError("Start date must be before today.");return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){showDateRangeError("End date cannot be after today.");return}}if(clearDateRangeError(),!state.pipelineIds.length&&availablePipelines.length&&ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),!state.pipelineIds.length){!availablePipelines.length&&isFetching&&loadDashboard(!0);return}loadDashboard(!0)}async function bootClientApp(){const e=window.location.pathname.replace(/\/+$/,"")||"/";if(e==="/admin"||e==="/login"||e==="/team"||e.startsWith("/admin/")||e.startsWith("/report/")){if(!document.querySelector('script[src*="admin.bundle.js"]')){const n=document.createElement("script");n.src="/js/admin.bundle.js?v=349",n.defer=!0,document.body.appendChild(n)}return}if(bindStaffChromeEvents(),await probeStaffPreviewSession(),IS_REPORT_VIEW){await loadPublicMetaReportPage();return}try{tenantParams=await resolveTenantParams()}catch(n){document.getElementById("dashboard").innerHTML=renderAppTopbar()+wrapDashboardShell('<div class="error-state" style="padding:24px">'+esc(n.message)+"</div>");return}ensureChartsVisible(),loadDashboard(!0),setInterval(function(){loadDashboard(!0,{background:!0})},120*1e3)}bootClientApp(),document.addEventListener("visibilitychange",function(){document.visibilityState==="visible"&&(isFetching&&Date.now()-fetchStartedAt>FETCH_TIMEOUT_MS&&(cancelActiveFetch(),fetchGeneration+=1,resetFetchUiState()),cachedData&&needsFreshData()&&loadDashboard(!0,{background:!0}))});

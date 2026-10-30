(function(){const t=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);if(t[0]==="login"){document.body.dataset.dashboardMode="login",delete document.body.dataset.clientSlug;return}if(t[0]==="team"){document.body.dataset.dashboardMode="team",delete document.body.dataset.clientSlug;return}if(t[0]==="admin"){if(t[1]==="sync-history"&&(t[2]==="ghl"||t[2]==="meta"||t[2]==="meta-reports")){document.body.dataset.dashboardMode=t[2]==="meta-reports"?"sync-history-meta-reports":`sync-history-${t[2]}`,delete document.body.dataset.clientSlug;return}if(t[1]==="fb-lead-sync"){document.body.dataset.dashboardMode="fb-lead-sync",delete document.body.dataset.clientSlug;return}if(t[1]==="google-ads"&&t[2]==="custom-values"){document.body.dataset.dashboardMode="google-ads-custom",delete document.body.dataset.clientSlug;return}if(t[1]==="google-ads"&&t[2]){document.body.dataset.dashboardMode="google-ads-client",document.body.dataset.clientSlug=t[2];return}if(t[1]==="google-ads"){document.body.dataset.dashboardMode="google-ads",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]==="custom-values"){document.body.dataset.dashboardMode="meta-reports-custom",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]==="ghl-clients"){document.body.dataset.dashboardMode="meta-reports-ghl-clients",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]&&t[3]==="ads-check"){document.body.dataset.dashboardMode="meta-reports-ads-check",document.body.dataset.clientSlug=t[2];return}if(t[1]==="meta-reports"&&t[2]){document.body.dataset.dashboardMode="meta-reports-client",document.body.dataset.clientSlug=t[2];return}if(t[1]==="meta-reports"){document.body.dataset.dashboardMode="meta-reports",delete document.body.dataset.clientSlug;return}document.body.dataset.dashboardMode=t.length>=2?"admin":"hub",t.length>=2?document.body.dataset.clientSlug=t[1]:delete document.body.dataset.clientSlug;return}if(t[0]==="report"&&t[1]){document.body.dataset.dashboardMode="report",document.body.dataset.reportToken=t[1],delete document.body.dataset.clientSlug;return}t[0]&&t[0]!=="index.html"&&(document.body.dataset.dashboardMode="client",document.body.dataset.clientSlug=t[0])})();const DASHBOARD_MODE=document.body.dataset.dashboardMode||"client",IS_LOGIN_PAGE=DASHBOARD_MODE==="login",IS_TEAM_PAGE=DASHBOARD_MODE==="team",IS_ADMIN_HUB=DASHBOARD_MODE==="hub",IS_ADMIN_CLIENT=DASHBOARD_MODE==="admin",IS_ADMIN_SYNC_HISTORY_GHL=DASHBOARD_MODE==="sync-history-ghl",IS_ADMIN_SYNC_HISTORY_META=DASHBOARD_MODE==="sync-history-meta",IS_ADMIN_SYNC_HISTORY_META_REPORTS=DASHBOARD_MODE==="sync-history-meta-reports",IS_ADMIN_FB_LEAD_SYNC=DASHBOARD_MODE==="fb-lead-sync",IS_ADMIN_META_REPORTS=DASHBOARD_MODE==="meta-reports",IS_ADMIN_META_REPORTS_CLIENT=DASHBOARD_MODE==="meta-reports-client",IS_ADMIN_META_REPORTS_CUSTOM=DASHBOARD_MODE==="meta-reports-custom",IS_ADMIN_META_REPORTS_GHL_CLIENTS=DASHBOARD_MODE==="meta-reports-ghl-clients",IS_ADMIN_META_REPORTS_ADS_CHECK=DASHBOARD_MODE==="meta-reports-ads-check",IS_ADMIN_GOOGLE_ADS=DASHBOARD_MODE==="google-ads",IS_ADMIN_GOOGLE_ADS_CLIENT=DASHBOARD_MODE==="google-ads-client",IS_ADMIN_GOOGLE_ADS_CUSTOM=DASHBOARD_MODE==="google-ads-custom",IS_REPORT_VIEW=DASHBOARD_MODE==="report",REPORT_TOKEN=document.body.dataset.reportToken||"",IS_ADMIN_SYNC_HISTORY=IS_ADMIN_SYNC_HISTORY_GHL||IS_ADMIN_SYNC_HISTORY_META||IS_ADMIN_SYNC_HISTORY_META_REPORTS,IS_CLIENT_VIEW=DASHBOARD_MODE==="client",IS_PREVIEW=IS_CLIENT_VIEW&&!!new URLSearchParams(window.location.search).get("client"),IS_ADMIN=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||IS_ADMIN_META_REPORTS_GHL_CLIENTS||IS_ADMIN_META_REPORTS_ADS_CHECK||IS_ADMIN_GOOGLE_ADS||IS_ADMIN_GOOGLE_ADS_CLIENT||IS_ADMIN_GOOGLE_ADS_CUSTOM||new URLSearchParams(window.location.search).get("view")==="admin",ADMIN_UI=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||IS_ADMIN_META_REPORTS_GHL_CLIENTS||IS_ADMIN_META_REPORTS_ADS_CHECK||IS_ADMIN_GOOGLE_ADS||IS_ADMIN_GOOGLE_ADS_CLIENT||IS_ADMIN_GOOGLE_ADS_CUSTOM||IS_ADMIN,LOADING_MSG=ADMIN_UI?"Loading dashboard data...":"Henter dashboard data...",RETRY_MSG=ADMIN_UI?"Try again":"Pr\xF8v igen";(function(){const t=document.getElementById("initial-loading-msg");t&&(t.textContent=LOADING_MSG)})();function resolveClientSlug(){if(document.body.dataset.clientSlug)return document.body.dataset.clientSlug;const e=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean),t=new Set(["meta-reports","google-ads","sync-history","fb-lead-sync"]);return e[0]==="admin"&&e[1]==="google-ads"&&e[2]&&e[2]!=="custom-values"||e[0]==="admin"&&e[1]==="meta-reports"&&e[2]&&e[2]!=="custom-values"&&e[2]!=="ghl-clients"?e[2]:e[0]==="admin"&&e[1]&&!t.has(e[1])?e[1]:e[0]&&e[0]!=="admin"&&e[0]!=="index.html"&&e[0]!=="report"?e[0]:new URLSearchParams(window.location.search).get("client")||"suntech-nordic"}const CLIENT_SLUG=resolveClientSlug();let tenantParams={},facebookClientId=CLIENT_SLUG,setupAccount=null,setupPipelines=[],metricsModelChangeMode=!1;function esc(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function renderCensioAnalyticsLogoMarkup(e=""){const t='<img class="meta-report-public-logo" src="/censio-analytics-logo.png?v=4" alt="Censio Analytics" />';return e?`<a href="${e}" class="brand-logo-link" aria-label="Censio Analytics">${t}</a>`:t}function renderBrandTopbar(e="",t={}){const n=t.logo==="analytics"?"analytics":"cenhub",a=!!(e&&e.includes("staff-admin-chrome")),o=a||e&&e.includes("admin-topbar-link")?"/admin":"",r=n==="analytics"?renderCensioAnalyticsLogoMarkup(o):o?`<a href="${o}" class="brand-logo-link" aria-label="Cenhub home"><img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" /></a>`:'<img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" />',i=a?`<button type="button" class="staff-nav-toggle" id="staff-nav-toggle" aria-expanded="false" aria-controls="staff-topbar-panel" aria-label="Open menu">
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
      </button>`:"",d=e?a?`<div class="brand-topbar-right brand-topbar-panel" id="staff-topbar-panel">${e}</div>`:`<div class="brand-topbar-right">${e}</div>`:"";return`
    <header class="brand-topbar${a?" brand-topbar--collapsible":""}${!a?" brand-topbar--centered":""}">
      <div class="brand-topbar-inner">
        <div class="brand-topbar-left">${r}</div>
        ${i}
        ${d}
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
  `).join("")}function renderAdminHubSkeletonPage(e){const t=e==="clients",n=e==="google-ads",a=t?"clients":n?"google-ads":"meta-reports",o=t?"Client administration":n?"Google Ads reports":"Meta client reports",i=t?`<div class="page-hero admin-hub-hero">
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
      </div>`,d=t?"client-grid":"meta-hub-cards";return`
    ${renderBrandTopbar(renderStaffAdminChrome(a))}
    ${wrapDashboardShell(`
    ${i}
    <div class="admin-hub${t?"":" meta-reports-page"}" aria-busy="true">
      <p class="sr-only">Loading ${esc(o)}\u2026</p>
      <div class="${d}">
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
  `:""}function isStaffNavMobilePanelOpen(){return!!(document.getElementById("staff-topbar-panel")?.classList.contains("is-open")&&window.matchMedia("(max-width: 1100px)").matches)}function resetStaffNavDropdownMenu(e){e&&(e.classList.remove("is-floating"),e.style.position="",e.style.left="",e.style.top="",e.style.right="",e.style.width="",e.style.minWidth="")}function restoreStaffNavDropdownMenu(e){const t=e._floatingMenu;t&&(resetStaffNavDropdownMenu(t),e._menuAnchor&&e._menuAnchor.parentNode?e._menuAnchor.parentNode.insertBefore(t,e._menuAnchor):e.appendChild(t),e._floatingMenu=null)}function floatStaffNavDropdownMenu(e,t){isStaffNavMobilePanelOpen()||e._floatingMenu!==t&&(e._menuAnchor=document.createComment("staff-nav-menu-anchor"),t.parentNode.insertBefore(e._menuAnchor,t),document.body.appendChild(t),t.classList.add("is-floating"),e._floatingMenu=t)}function positionStaffNavDropdown(e){const t=e.querySelector(".staff-nav-dropdown-trigger"),n=e._floatingMenu||e.querySelector(".staff-nav-dropdown-menu");if(!t||!n)return;if(isStaffNavMobilePanelOpen()){resetStaffNavDropdownMenu(n),n.style.position="static",n.style.width="100%";return}floatStaffNavDropdownMenu(e,n);const a=t.getBoundingClientRect(),o=Math.max(188,a.width);n.style.position="fixed",n.style.width="",n.style.minWidth=`${o}px`,n.style.left=`${Math.max(8,a.left)}px`,n.style.top=`${a.bottom+6}px`,n.style.right="auto";const r=n.getBoundingClientRect();if(r.right>window.innerWidth-8&&(n.style.left=`${Math.max(8,window.innerWidth-r.width-8)}px`),r.bottom>window.innerHeight-8){const i=a.top-r.height-6;i>=8&&(n.style.top=`${i}px`)}}function closeStaffNavDropdowns(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(e=>{e.classList.remove("is-open"),e.querySelector(".staff-nav-dropdown-trigger")?.setAttribute("aria-expanded","false"),restoreStaffNavDropdownMenu(e)})}function toggleStaffNavDropdown(e,t){t?.stopPropagation();const n=e?.closest(".staff-nav-dropdown");if(!n)return;const a=!n.classList.contains("is-open");if(closeStaffNavDropdowns(),closeStaffUserMenu(),!a){e.setAttribute("aria-expanded","false");return}n.classList.add("is-open"),e.setAttribute("aria-expanded","true"),positionStaffNavDropdown(n)}function toggleStaffUserMenu(e){e.stopPropagation();const t=document.getElementById("staff-user-dropdown"),n=e.currentTarget;if(!t)return;const a=t.hidden;closeStaffUserMenu(),a&&(t.hidden=!1,n?.setAttribute("aria-expanded","true"))}function closeStaffUserMenu(){const e=document.getElementById("staff-user-dropdown"),t=document.querySelector(".staff-user-trigger");e&&(e.hidden=!0),t&&t.setAttribute("aria-expanded","false")}function toggleStaffTopbarNav(e){const t=document.getElementById("staff-topbar-panel");if(!t)return;const n=!t.classList.contains("is-open");t.classList.toggle("is-open",n),e.setAttribute("aria-expanded",n?"true":"false"),e.setAttribute("aria-label",n?"Close menu":"Open menu"),e.classList.toggle("is-active",n),n&&closeStaffUserMenu()}function closeStaffTopbarNav(){const e=document.getElementById("staff-topbar-panel"),t=document.getElementById("staff-nav-toggle");e&&e.classList.remove("is-open"),t&&(t.setAttribute("aria-expanded","false"),t.setAttribute("aria-label","Open menu"),t.classList.remove("is-active"))}let staffChromeEventsBound=!1;function bindStaffChromeEvents(){staffChromeEventsBound||(staffChromeEventsBound=!0,document.addEventListener("click",function(e){const t=e.target.closest("#staff-nav-toggle");if(t){e.stopPropagation(),toggleStaffTopbarNav(t);return}if(e.target.closest(".staff-nav-dropdown-item")){closeStaffTopbarNav(),closeStaffNavDropdowns();return}(e.target.closest(".staff-nav-link")&&!e.target.closest(".staff-nav-dropdown-trigger")||!e.target.closest(".brand-topbar-right")&&!e.target.closest(".staff-nav-dropdown-menu"))&&closeStaffTopbarNav(),!e.target.closest(".staff-nav-dropdown")&&!e.target.closest(".staff-nav-dropdown-menu")&&closeStaffNavDropdowns(),typeof closeCardMenus=="function"&&closeCardMenus(),closeStaffUserMenu()}),window.addEventListener("resize",function(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(function(e){positionStaffNavDropdown(e)})}),window.addEventListener("scroll",function(){document.querySelector(".staff-nav-dropdown.is-open")&&closeStaffNavDropdowns()},{passive:!0}))}const ICON_SEARCH='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',ICON_PLUS='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',ICON_CALENDAR='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/></svg>',ICON_CHEVRON_LEFT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',ICON_CHEVRON_RIGHT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',ICON_SYNC='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',ICON_CHEVRON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',ICON_CHART='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',ICON_CHECK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',ICON_LAYER='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',ICON_MERGE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="15" r="2.4"/><path d="M6 8.4V15.6"/><path d="M8.2 6.4C14 6.4 14 12.6 15.8 13.4"/></svg>',ICON_TARGET='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',ICON_LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>',ICON_UNLOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 017.8-1.2"/></svg>',ICON_TAG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 12.7L12.7 20.6a2 2 0 01-2.8 0l-7-7a2 2 0 010-2.8L10.8 3H19a2 2 0 012 2v7.7z"/><circle cx="15" cy="8" r="1.2"/></svg>',ICON_HASH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/></svg>',ICON_EDIT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',ICON_WARNING='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.6 18a1.5 1.5 0 001.3 2.2h16.2a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-3.4 0z"/><path d="M12 9v4"/><path d="M12 16.5h.01"/></svg>';(function(t){const n=["#ff6a00","#138b53","#0085f2","#dc640a","#833b08","#a07868","#ff9147","#6b5348"],a={open:"#0085f2",won:"#138b53",lost:"#dc640a",abandoned:"#a07868"};function o(p){const h=String(p).match(/^(\d{4})-W(\d{2})$/);if(!h)return null;const u=Number(h[1]),v=Number(h[2]),c=new Date(Date.UTC(u,0,4)),g=c.getUTCDay()||7,w=new Date(c);w.setUTCDate(c.getUTCDate()-g+1);const S=new Date(w);S.setUTCDate(w.getUTCDate()+(v-1)*7);const D=new Date(S);return D.setUTCDate(S.getUTCDate()+3),{monday:new Date(S.getUTCFullYear(),S.getUTCMonth(),S.getUTCDate()),thursday:new Date(D.getUTCFullYear(),D.getUTCMonth(),D.getUTCDate())}}function r(p){let h=0;for(let u=1;u<=p.getDate();u+=1)new Date(p.getFullYear(),p.getMonth(),u).getDay()===1&&(h+=1);return h}function i(p){const h=o(p);if(!h)return String(p).replace("-W"," W");const u=h.monday,v=u.toLocaleDateString("da-DK",{month:"short"}).replace(".","").replace(/^\w/u,g=>g.toUpperCase()),c=r(u);return`${v} W${c}`}function d(p){const[h,u]=String(p).split("-");return new Date(Number(h),Number(u)-1,1).toLocaleDateString("da-DK",{month:"short",year:"2-digit"})}function s(p,h=18){const u=String(p);return u.length>h?`${u.slice(0,h-1)}\u2026`:u}function l(){return{text:"#1a1208",muted:"#6b5348",grid:"rgba(26, 18, 8, 0.1)",border:"#e8e0d8",tooltipBg:"#ffffff",tooltipBorder:"#e8e0d8",tooltipText:"#1a1208"}}function f(p,h,u,v){return{labels:p.map(c=>v(c[h])),values:p.map(c=>Number(c[u])||0)}}function b(p){const h=Number(p)||0;return h>=1e6?`${(h/1e6).toFixed(1)}M`:h>=1e3?`${Math.round(h/1e3)}K`:h}function m(p){const h=new Map((p.monthlyAdSpend||[]).map(c=>[c.month,Number(c.spend)||0])),u=new Map((p.monthlyRevenue||[]).map(c=>[c.month,Number(c.revenue)||0])),v=[...new Set([...h.keys(),...u.keys()])].sort();return{dualAxis:!0,labels:v.map(c=>d(c)),spendValues:v.map(c=>h.get(c)||0),revenueValues:v.map(c=>u.get(c)||0)}}function y(p,h,u){const v=h.spendValues.some(c=>c>0)||h.revenueValues.some(c=>c>0);return!h.labels.length||!v?null:{type:"bar",data:{labels:h.labels,datasets:[{type:"bar",label:"Ad Spend",data:h.spendValues,backgroundColor:"#ff6a00cc",borderColor:"#ff6a00",borderWidth:2,borderRadius:6,maxBarThickness:42,yAxisID:"y",order:2},{type:"line",label:"Won Revenue",data:h.revenueValues,backgroundColor:"#138b5333",borderColor:"#138b53",borderWidth:2.5,fill:!0,tension:.35,pointRadius:4,pointHoverRadius:6,yAxisID:"y1",order:1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"bottom",align:"center",labels:{color:u.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:u.tooltipBg,borderColor:u.tooltipBorder,borderWidth:1,titleColor:u.tooltipText,bodyColor:u.muted,padding:12,callbacks:{label(c){const g=c.parsed.y??0;return`${c.dataset.label}: Dkr ${Math.round(g).toLocaleString("da-DK")}`}}}},scales:{x:{ticks:{color:u.muted,maxRotation:45,minRotation:0},grid:{color:u.grid},border:{color:u.border}},y:{type:"linear",position:"left",title:{display:!0,text:"Ad Spend (Dkr)",color:"#ff6a00",font:{size:11,weight:"600"}},ticks:{color:"#ff6a00",callback:b},grid:{color:u.grid},border:{color:u.border},beginAtZero:!0},y1:{type:"linear",position:"right",title:{display:!0,text:"Won Revenue (Dkr)",color:"#138b53",font:{size:11,weight:"600"}},ticks:{color:"#138b53",callback:b},grid:{drawOnChartArea:!1},border:{color:u.border},beginAtZero:!0}}}}}const $={weeklyRevenue:{title:"Won Revenue (Weekly)",defaultType:"area",format:"currency",extract(p){return f(p.weeklyRevenue||[],"week","revenue",i)}},monthlyRevenue:{title:"Won Revenue (Monthly)",defaultType:"area",format:"currency",extract(p){return f(p.monthlyRevenue||[],"month","revenue",d)}},weeklyLeads:{title:"New Leads (Weekly)",defaultType:"area",format:"number",extract(p){return f(p.weeklyLeads||[],"week","count",i)}},monthlyLeads:{title:"New Leads (Monthly)",defaultType:"area",format:"number",extract(p){return f(p.monthlyLeads||[],"month","count",d)}},conversionTrend:{title:"Conversion Rate Trend",defaultType:"line",format:"percent",extract(p){return f(p.monthlyConversion||[],"month","rate",d)}},statusBreakdown:{title:"Opportunity Status",defaultType:"doughnut",format:"number",extract(p){const h=p.chartStatusBreakdown||p.statusBreakdown||{},u=["open","won","lost","abandoned"];return{labels:["Open","Won","Lost","Abandoned"],values:u.map(v=>Number(h[v])||0),colors:u.map(v=>a[v])}}},marketingSpendComparison:{title:"Facebook Ad Spend",defaultType:"area",format:"currency",extract(p){return f((p.monthlyAdSpend||[]).slice(-8),"month","spend",d)}},monthlyCostPerLead:{title:"Cost per Lead (Monthly)",defaultType:"area",format:"currency",extract(p){return f(p.monthlyCostPerLead||[],"month","cpl",d)}}};function C(p,h,u,v){const c=Number(p)||0,g=Array.isArray(u)?u[v]:h;return g==="ratio"?`${c.toFixed(2)}x`:g==="currency"||h==="currency"?`Dkr ${Math.round(c).toLocaleString("da-DK")}`:g==="percent"||h==="percent"?`${c.toFixed(1)}%`:Math.round(c).toLocaleString("da-DK")}function A(p,h,u){const v=$[p];if(!v)return null;const c=v.extract(h),g=l();if(c.dualAxis||u==="dualAxis")return y(v,c,g);if(!c.labels?.length||c.values.every(k=>k===0))return null;const w=["pie","doughnut","polarArea"].includes(u),S=c.colors||c.labels.map((k,M)=>n[M%n.length]),D=u==="area"?"line":u==="horizontalBar"?"bar":u,T=`${n[0]}55`,I=u==="doughnut",P={label:v.title,data:c.values,backgroundColor:w?I?S:S.map(k=>`${k}cc`):c.colors?c.colors.map(k=>`${k}cc`):u==="area"?T:`${n[0]}cc`,borderColor:w?S:c.colors||n[0],borderWidth:w?I?0:1:2,fill:u==="area",tension:.35,borderRadius:w?0:6,maxBarThickness:42,...I?{cutout:"62%",borderAlign:"inner"}:{}};return{type:D,data:{labels:c.labels,datasets:[P]},options:{responsive:!0,maintainAspectRatio:I?!1:w,indexAxis:u==="horizontalBar"?"y":"x",plugins:{legend:{display:w,position:"bottom",align:"center",labels:{color:g.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:g.tooltipBg,borderColor:g.tooltipBorder,borderWidth:1,titleColor:g.tooltipText,bodyColor:g.muted,padding:12,callbacks:{label(k){const M=k.parsed,L=typeof M=="object"?M.y??M.x??0:M??0;return`${k.label}: ${C(L,v.format,c.valueFormats,k.dataIndex)}`}}}},...I?{layout:{padding:8},devicePixelRatio:typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1,elements:{arc:{borderAlign:"inner"}}}:{},scales:w?{}:{x:{ticks:{color:g.muted,maxRotation:45,minRotation:0},grid:{color:g.grid},border:{color:g.border}},y:{ticks:{color:g.muted,callback(k,M){return v.format==="mixed"&&c.valueFormats?.[M]==="ratio"?`${Number(k).toFixed(2)}x`:v.format==="currency"||c.valueFormats?.[M]==="currency"?k>=1e6?`${(k/1e6).toFixed(1)}M`:k>=1e3?`${Math.round(k/1e3)}K`:k:v.format==="percent"?`${k}%`:k}},grid:{color:g.grid},border:{color:g.border},beginAtZero:!0}}}}}t.DashboardCharts={CHART_DEFINITIONS:$,buildChartConfig:A,formatTooltipValue:C}})(window);const STORAGE_KEY=`cenhub_display_${CLIENT_SLUG}`,LEGACY_STORAGE_KEY="suntech-dashboard-display",PIPELINE_KEY="suntech-dashboard-pipelines",DISPLAY_OPTIONS={kpis:{totalRevenue:"Total Revenue",adSpend:"Ad Spend",roas:"ROAS",roasDk:"ROAS (DK)",poas:"POAS",poasDk:"POAS (DK)",costPerLead:"Cost per Lead",costPerWonClient:"Cost per Won Client",clientsWon:"Clients Won",totalLeads:"Total Leads",totalLeadsValue:"Total Leads Value",averageLeadValue:"Average Lead Value",conversionRate:"Conversion Rate",totalBundlinje:"Total Bundlinje",openLeads:"Open Leads",openPipelineValue:"Open Pipeline Value",averageWonDealSize:"Avg Won Deal Size"},sections:{statusBreakdown:"Opportunity Status (Cards)",sourceReport:"Lead Source Report",assigneeReport:"Leads Closed by Assignee",pipelineBreakdown:"Pipeline Breakdown"},charts:{weeklyRevenue:"Won Revenue (Weekly)",monthlyRevenue:"Won Revenue (Monthly)",marketingSpendComparison:"Facebook Ad Spend",monthlyCostPerLead:"Cost per Lead (Monthly)",weeklyLeads:"New Leads (Weekly)",monthlyLeads:"New Leads (Monthly)",conversionTrend:"Conversion Rate Trend",statusBreakdown:"Opportunity Status"},statusItems:{open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned"},columns:{sourceReport:{totalLeads:"Total leads",totalValue:"Total values",open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned",winPct:"Win %"},assigneeReport:{won:"Won",totalLeads:"Total leads",wonValue:"Won revenue",totalValue:"Total value"},pipelineBreakdown:{count:"Leads",won:"Won",monetary:"Value",profit:"Bundlinje",wonValue:"Won revenue"}}},state={pipelineIds:usesClientPipelineDefaults()?[]:loadPipelineSelection(),status:"all",source:"all",assignedTo:"all",dateField:"createdAt",dateFrom:"",dateTo:"",adSpend:"",preset:"all"};let cachedData=null,cachedFacebookMetrics=null,cachedMonthlyAdSpend=null,availablePipelines=[],display=loadDisplayPrefs(),pipelineDefaultsApplied=!1,chartInstances={},chartFieldsCache=null,chartFieldsCacheKey=null,lastFetchedAt=0;const DATA_REFRESH_MS=120*1e3,DATA_FRESH_MS=DATA_REFRESH_MS,CHART_FIELD_KEYS=["weeklyRevenue","monthlyRevenue","weeklyLeads","monthlyLeads","monthlyLeadsValue","monthlyConversion","chartStatusBreakdown"];function getChartCacheKey(){return[[...state.pipelineIds].sort().join(","),state.status,state.source,state.assignedTo,state.dateField,state.dateFrom||"",state.dateTo||""].join("|")}function cacheChartFields(e){chartFieldsCache={},CHART_FIELD_KEYS.forEach(t=>{e[t]!==void 0&&(chartFieldsCache[t]=e[t])}),chartFieldsCacheKey=getChartCacheKey()}function applyChartFieldsCache(e){if(!!!(state.dateFrom||state.dateTo))return cacheChartFields(e),e;if(chartFieldsCache&&chartFieldsCacheKey===getChartCacheKey()){const n={...e};return CHART_FIELD_KEYS.forEach(a=>{chartFieldsCache[a]!==void 0&&(n[a]=chartFieldsCache[a])}),n}return cacheChartFields(e),e}function getDefaultChartPrefs(){const e={};return(window.DashboardCharts?Object.keys(DashboardCharts.CHART_DEFINITIONS):Object.keys(DISPLAY_OPTIONS.charts)).forEach(n=>{e[n]=!0}),e}function destroyCharts(){Object.values(chartInstances).forEach(e=>e.destroy()),chartInstances={},destroyCrmDevelopmentChart()}let crmDevelopmentMetricId="revenue",crmDevelopmentChartInstance=null;function usesCrmClientDashboard(){return IS_CLIENT_VIEW&&!IS_PREVIEW}function crmSafeDivide(e,t){const n=Number(e)||0,a=Number(t)||0;if(!a)return null;const o=n/a;return Number.isFinite(o)?o:null}function crmMetricValue(e,t){const n=e||{};switch(t){case"revenue":return n.revenue??0;case"profit":return Number.isFinite(Number(n.profit))?Number(n.profit):(Number(n.revenue)||0)-(Number(n.adSpend)||0);case"roas":return crmSafeDivide(n.revenue,n.adSpend);case"customers":return n.customers??0;case"adSpend":return Number(n.adSpend)>0?Number(n.adSpend):null;case"closeRate":return Number.isFinite(Number(n.closeRate))?Number(n.closeRate):crmSafeDivide(n.customers,n.leads)!=null?crmSafeDivide(n.customers,n.leads)*100:null;case"cpl":return Number(n.adSpend)>0?n.cpl??crmSafeDivide(n.adSpend,n.leads):null;case"leads":return n.leads??0;case"ltv":return n.ltv;case"cac":return Number(n.adSpend)>0?n.cac??crmSafeDivide(n.adSpend,n.customers):null;default:return null}}function formatCrmMetricValue(e,t){if(t==null||e!=="ltv"&&Number.isNaN(Number(t)))return"\u2014";switch(e){case"revenue":case"profit":case"adSpend":case"cpl":case"cac":return`Dkr ${fmtCompact(t)}`;case"roas":return fmtRoas(t);case"closeRate":return fmtPct(t);case"leads":case"customers":return fmt(t);case"ltv":return"\u2014";default:return String(t)}}const CRM_KPI_ORDER=["revenue","profit","roas","customers","adSpend","closeRate","leads","cpl","cac","ltv"],CRM_KPI_CARD_CLASS={revenue:" primary",profit:" accent",roas:" accent",adSpend:" accent"},CRM_KPI_LABELS={revenue:{label:"Oms\xE6tning",hint:"Vundet oms\xE6tning i perioden"},profit:{label:"POAS (DK)",hint:"Bundlinje \u2212 annonceforbrug"},roas:{label:"ROAS",hint:"Oms\xE6tning \xF7 annonceforbrug"},customers:{label:"Lukkede kunder",hint:"Unikke kunder vundet i perioden"},adSpend:{label:"Annoncebudget",hint:"Annonceforbrug i perioden"},closeRate:{label:"Close rate",hint:"Vundne kunder \xF7 nye leads"},cpl:{label:"CPL",hint:"Pris pr. lead"},leads:{label:"Leads",hint:"Nye leads i perioden"},ltv:{label:"LTV",hint:"Kommer snart"},cac:{label:"CAC",hint:"Pris pr. lukket kunde"}},CRM_CHART_METRICS=["revenue","profit","adSpend","leads","customers","cpl","cac","closeRate"];function comparisonIsReady(){return cachedComparison?.status==="ready"&&!!cachedComparison.performance?.totals}function comparisonHasNoData(){if(!comparisonIsReady())return!1;if(comparisonHelpers().isBeforeDataStart(cachedComparison.range,clientEarliestDataDate))return!0;const t=cachedComparison.performance.totals;return!(t.leads||t.customers||t.revenue||t.adSpend)}function getComparisonDescription(){return comparisonIsReady()?comparisonHelpers().describeComparison({current:cachedComparison.currentRange,comparison:cachedComparison.range,mode:cachedComparison.mode,todayIso:getTodayIso()}):null}function renderCompareSummary(e){if(!e)return"V\xE6lg en bestemt periode for at sammenligne med en tidligere periode.";if(compareState.mode==="off"||!cachedComparison)return"Ingen sammenligning valgt.";if(cachedComparison.status==="loading")return"Henter sammenligning\u2026";if(cachedComparison.status==="error")return"Sammenligning kunne ikke hentes.";if(cachedComparison.status==="unavailable")return"Der findes ingen sammenligningsperiode for denne periode.";const t=getComparisonDescription();if(!t)return"Ingen sammenligning valgt.";const n=comparisonHasNoData()?' <span class="compare-note">Ingen data i sammenligningsperioden.</span>':"";return`<strong>${esc(t.currentLabel)}</strong> sammenlignet med <strong>${esc(t.comparisonLabel)}</strong> <span class="compare-relation">(${esc(t.relation)})</span>${n}`}function renderCompareMonthOptions(e,t){const n=getClientPeriodMaxMonth(e),a=CLIENT_MONTH_NAMES.slice(0,n).map((o,r)=>`<option value="${r+1}"${Number(t)===r+1?" selected":""}>${o}</option>`).join("");return`<option value=""${t?"":" selected"} disabled>V\xE6lg m\xE5ned</option>${a}`}function renderCompareMenu(e){const t=comparisonHelpers(),n=getTodayIso();if(!e)return`
      <div class="compare-menu-note">Sammenligning kr\xE6ver en bestemt periode. V\xE6lg en periode f\xF8rst:</div>
      <button type="button" class="compare-menu-item" onclick="applyPreset('month'); closeCompareMenu()"><span class="compare-menu-title">Denne m\xE5ned</span></button>
      <button type="button" class="compare-menu-item" onclick="applyPreset('lastMonth'); closeCompareMenu()"><span class="compare-menu-title">Sidste m\xE5ned</span></button>
      <button type="button" class="compare-menu-item" onclick="applyPreset('year'); closeCompareMenu()"><span class="compare-menu-title">I \xE5r</span></button>
    `;const a=t.detectRangeShape(e,n),r=[{mode:"previous_period",title:a==="month"?"Forrige m\xE5ned":a==="year"?"Forrige \xE5r":"Forrige periode"},{mode:"previous_year",title:"Samme periode sidste \xE5r"}].map(({mode:s,title:l})=>{const f=t.resolveComparisonRange(e,s,{todayIso:n}),b=compareState.mode===s,m=f?t.formatComparisonRangeLabel(f,n):"Ikke tilg\xE6ngelig for denne periode";return`
      <button type="button" class="compare-menu-item${b?" is-selected":""}" ${f?"":"disabled"} onclick="setCompareMode('${s}')">
        <span class="compare-menu-title">${l}</span>
        <span class="compare-menu-sub">${esc(m)}</span>
      </button>
    `}).join("");let i="";if(a!=="custom"){const s=getClientPeriodYears(),l=compareState.pickYear&&s.includes(Number(compareState.pickYear))?Number(compareState.pickYear):null,f=`<option value=""${l?"":" selected"} disabled>\xC5r</option>${s.map(m=>`<option value="${m}"${l===m?" selected":""}>${m}</option>`).join("")}`,b=a==="month"?`<select id="compare-pick-month" class="client-period-select" aria-label="M\xE5ned" onchange="onComparePickChange()">${renderCompareMonthOptions(l||s[0],compareState.pickMonth)}</select>`:"";i=`
      <div class="compare-menu-pick${compareState.mode==="pick"?" is-selected":""}">
        <span class="compare-menu-title">${a==="month"?"V\xE6lg m\xE5ned og \xE5r":"V\xE6lg \xE5r"}</span>
        <div class="compare-menu-pick-row">
          <select id="compare-pick-year" class="client-period-select" aria-label="\xC5r" onchange="onComparePickYearChange()">${f}</select>
          ${b}
        </div>
      </div>
    `}return`${compareState.mode!=="off"?'<button type="button" class="compare-menu-item compare-menu-off" onclick="clearComparison()"><span class="compare-menu-title">Ingen sammenligning</span></button>':""}${r}${i}`}let compareControlHtmlInDom="";function renderCompareControl(){const e=buildCompareControlHtml();return compareControlHtmlInDom=e,e}function buildCompareControlHtml(){if(!usesCrmClientDashboard()||!comparisonHelpers())return"";const e=getCurrentBoundedRange(),t=!!e&&compareState.mode!=="off",n=t?cachedComparison?.status:null,a=t&&comparisonIsReady();let o="Sammenlign",r=e?"":" is-disabled",i=e?"Sammenlign med en tidligere periode":"V\xE6lg en bestemt periode for at kunne sammenligne";if(t&&n==="loading")o="Henter\u2026",i="Henter sammenligning";else if(t&&n==="error")o="Sammenligning fejlede",r=" is-error",i="Sammenligningen kunne ikke hentes";else if(t&&n==="unavailable")o="Sammenlign",i="Der findes ingen sammenligningsperiode for denne periode";else if(a){const f=getComparisonDescription();f&&(o=`vs. ${f.comparisonSeriesLabel}`,r=" is-active",i=`${f.sentence}${comparisonHasNoData()?" - ingen data i sammenligningsperioden":""}`)}const d=r===" is-active"?'<button type="button" class="compare-clear" aria-label="Fjern sammenligning" title="Fjern sammenligning" onclick="clearComparison()">\xD7</button>':"",s=compareState.notice?`<div class="compare-notice compare-summary">${esc(compareState.notice)}</div>`:"",l=t?`<div class="compare-summary">${renderCompareSummary(e)}</div>`:"";return`
    <div class="compare-control" id="compare-control">
      <button type="button" class="compare-btn${r}" aria-haspopup="true" title="${esc(i)}" onclick="toggleCompareMenu(event)">
        <span class="compare-btn-icon" aria-hidden="true">\u21C4</span>
        <span class="compare-btn-label">${esc(o)}</span>
        <span class="compare-btn-caret" aria-hidden="true"></span>
      </button>
      ${d}
      <div class="compare-menu" id="compare-menu" hidden onclick="event.stopPropagation()">${l}${s}${renderCompareMenu(e)}</div>
    </div>
  `}function refreshCompareControl(){const e=document.getElementById("compare-control");if(!e||!usesCrmClientDashboard())return;const t=buildCompareControlHtml();t!==compareControlHtmlInDom&&(compareControlHtmlInDom=t,e.outerHTML=t)}function closeCompareMenu(){const e=document.getElementById("compare-menu");e&&(e.hidden=!0)}function toggleCompareMenu(e){e?.stopPropagation();const t=document.getElementById("compare-menu");if(!t)return;const n=t.hidden;closePeriodPicker(),t.hidden=!n,bindHeaderPopoverDismiss()}function onComparePickYearChange(){const e=document.getElementById("compare-pick-year"),t=document.getElementById("compare-pick-month"),n=Number(e?.value)||null;if(n){if(t){let a=Number(t.value)||0;if(a>getClientPeriodMaxMonth(n)&&(a=0),t.innerHTML=renderCompareMonthOptions(n,a),!a){compareState.pickYear=n;return}setCompareMode("pick",{pickYear:n,pickMonth:a});return}setCompareMode("pick",{pickYear:n,pickMonth:0})}}function onComparePickChange(){const e=Number(document.getElementById("compare-pick-year")?.value)||compareState.pickYear,t=Number(document.getElementById("compare-pick-month")?.value)||0;!e||!t||setCompareMode("pick",{pickYear:e,pickMonth:t})}function formatCrmDeltaNumber(e){const t=Math.abs(Number(e)||0);return new Intl.NumberFormat("da-DK",{maximumFractionDigits:t>=100?0:1}).format(t)}function renderCrmDeltaLine(e,t){if(e==="ltv"||!comparisonIsReady())return"";const n=comparisonHelpers(),a=getComparisonDescription();if(!a)return"";const o=a.shortRef,r=cachedComparison.performance.totals,i=crmMetricValue(r,e),d=crmMetricValue(t,e),s=`${o}: ${formatCrmMetricValue(e,i)}`;if(comparisonHasNoData())return`<div class="card-sub compare-delta is-neutral" title="${esc(s)}">\u2013 ingen data i ${esc(o)}</div>`;const l=n.computeDelta(d,i,n.COMPARE_METRIC_DIRECTION[e]||"up",{points:e==="closeRate"}),f=l.kind==="change"||l.kind==="new"?l.isGood?"is-good":"is-bad":"is-neutral";let b;if(l.kind==="change"){const m=l.direction==="up"?"\u25B2":"\u25BC",y=l.unit==="pp"?" pp":"%";b=`${m} ${formatCrmDeltaNumber(l.value)}${y} vs. ${o}`}else l.kind==="new"?b=`\u25B2 Ny vs. ${o}`:l.kind==="flat"?b=`\u2013 u\xE6ndret vs. ${o}`:b=`\u2013 ingen data vs. ${o}`;return`<div class="card-sub compare-delta ${f}" title="${esc(s)}">${esc(b)}</div>`}function renderCrmKpiGrid(e){if(!e?.totals)return'<div class="empty-section">Ingen performance-data for valgt periode.</div>';const t=e.totals;return`<div class="kpi-grid">${CRM_KPI_ORDER.map(a=>{const o=CRM_KPI_LABELS[a],r=formatCrmMetricValue(a,crmMetricValue(t,a)),i=renderCrmDeltaLine(a,t);return`
      <div class="card${CRM_KPI_CARD_CLASS[a]||""}">
        <div class="card-label">${o.label}</div>
        <div class="card-value">${r}</div>
        ${i||`<div class="card-sub">${o.hint}</div>`}
      </div>
    `}).join("")}</div>`}function crmBucketMetricValue(e,t){switch(t){case"revenue":return e.revenue||0;case"profit":return(Number.isFinite(Number(e.bundlinje))?Number(e.bundlinje):Number(e.profit)||0)-(e.adSpend||0);case"adSpend":return e.adSpend||0;case"leads":return e.leads||0;case"customers":return e.customers||0;case"cpl":return crmSafeDivide(e.adSpend,e.leads)||0;case"cac":return crmSafeDivide(e.adSpend,e.customers)||0;case"closeRate":{const n=crmSafeDivide(e.customers,e.leads);return n!=null?n*100:0}default:return 0}}function formatCrmBucketLabel(e,t){const n=e.start?.slice(0,10)||"";if(t==="month"){const[a,o]=n.split("-");return new Date(Number(a),Number(o)-1,1).toLocaleDateString("da-DK",{month:"short",year:"numeric"})}if(t==="week"){const a=e.end?.slice(0,10)||n;return`${n.slice(8,10)}/${n.slice(5,7)}\u2013${a.slice(8,10)}/${a.slice(5,7)}`}return`${n.slice(8,10)}/${n.slice(5,7)}`}function crmGranularityLabel(e){return e==="week"?"uge":e==="month"?"m\xE5ned":"dag"}function crmChartSubtitleText(e,t){let a=`${e?.periodLabel||"Valgt periode"} \xB7 ${crmGranularityLabel(e?.granularity)} \xB7 ${t}`;const o=comparisonIsReady()&&!comparisonHasNoData()?getComparisonDescription():null;return o?a+=` \xB7 mod ${o.comparisonLabel}`:comparisonIsReady()&&comparisonHasNoData()&&(a+=" \xB7 ingen data i sammenligningsperioden"),a}function renderCrmDevelopmentChart(e){const t=!!e?.buckets?.length,n=crmDevelopmentMetricId,a=CRM_KPI_LABELS[n]?.label||n,o=e?.periodLabel||"Valgt periode",r=e?.granularity||"day",i=CRM_CHART_METRICS.map(d=>{const s=CRM_KPI_LABELS[d]?.label||d;return`<button type="button" class="crm-chart-metric-pill${d===n?" is-active":""}" data-crm-chart-metric="${d}">${s}</button>`}).join("");return`
    <div class="card chart-card crm-development-chart" id="crm-development-chart">
      <div class="crm-chart-header">
        <div>
          <div class="section-title">Udvikling over tid</div>
          <div class="crm-chart-subtitle" id="crm-chart-subtitle">${esc(crmChartSubtitleText(e,a))}</div>
        </div>
        <div class="crm-chart-metric-pills">${i}</div>
      </div>
      <div class="chart-empty note" style="display:${t?"none":"block"}">Ingen data for den valgte periode.</div>
      <div class="chart-canvas-wrap" style="display:${t?"block":"none"}">
        <canvas id="crm-development-chart-canvas" aria-label="Udviklingsgraf"></canvas>
      </div>
    </div>
  `}function destroyCrmDevelopmentChart(){crmDevelopmentChartInstance&&(crmDevelopmentChartInstance.destroy(),crmDevelopmentChartInstance=null)}function setCrmChartEmptyState(e){const t=document.getElementById("crm-development-chart");if(!t)return;const n=t.querySelector(".chart-empty"),a=t.querySelector(".chart-canvas-wrap");n&&(n.style.display=e?"block":"none"),a&&(a.style.display=e?"none":"block")}let crmChartAnimatedOnce=!1;function mountCrmDevelopmentChart(e,t={}){if(!usesCrmClientDashboard())return;const n=document.getElementById("crm-development-chart-canvas");if(!n)return;if(typeof Chart>"u"||!e?.buckets?.length){destroyCrmDevelopmentChart(),setCrmChartEmptyState(!0),bindCrmChartMetricPills(e);return}if(setCrmChartEmptyState(!1),destroyCrmDevelopmentChart(),typeof Chart.getChart=="function"){const m=Chart.getChart(n);m&&m.destroy()}const a=crmDevelopmentMetricId,o=comparisonIsReady()&&!comparisonHasNoData()&&!!cachedComparison.performance?.buckets?.length,r=o?getComparisonDescription():null,i=o?comparisonHelpers().alignComparisonBuckets(e.buckets,cachedComparison.performance.buckets):e.buckets.map(m=>({current:m,comparison:null})),d=i.map(m=>formatCrmBucketLabel(m.current||m.comparison,e.granularity)),s=i.map(m=>m.current?crmBucketMetricValue(m.current,a):null),l=[{label:o?r.currentSeriesLabel:CRM_KPI_LABELS[a]?.label||a,data:s,borderColor:"#46C7A0",backgroundColor:"rgba(70, 199, 160, 0.22)",fill:!0,tension:.35,pointRadius:e.granularity==="day"?0:3,pointHoverRadius:4,borderWidth:2}];o&&l.push({label:r.comparisonSeriesLabel,data:i.map(m=>m.comparison?crmBucketMetricValue(m.comparison,a):null),borderColor:"#f08a24",backgroundColor:"transparent",borderDash:[6,4],fill:!1,tension:.35,pointRadius:0,pointHoverRadius:4,borderWidth:2,spanGaps:!1}),a==="revenue"&&!o&&l.push({label:CRM_KPI_LABELS.adSpend.label,data:e.buckets.map(m=>m.adSpend||0),borderColor:"#1877F2",backgroundColor:"transparent",fill:!1,tension:.35,pointRadius:0,borderWidth:2,yAxisID:"y"});const f=new Set(["revenue","profit","adSpend","cpl","cac"]),b=t.animate===!0||!crmChartAnimatedOnce;crmChartAnimatedOnce=!0,crmDevelopmentChartInstance=new Chart(n,{type:"line",data:{labels:d,datasets:l},options:{animation:b?{duration:450}:!1,responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:l.length>1,position:"bottom"},tooltip:{callbacks:{title(m){const y=i[m[0]?.dataIndex];if(!o||!y)return m[0]?.label||"";const $=y.current?formatCrmBucketLabel(y.current,e.granularity):"\u2013",C=y.comparison?formatCrmBucketLabel(y.comparison,e.granularity):"\u2013";return`${r.currentSeriesLabel} ${$}  \xB7  ${r.comparisonSeriesLabel} ${C}`},label(m){const y=m.parsed.y;return a==="closeRate"||m.dataset.label===CRM_KPI_LABELS.closeRate?.label?`${m.dataset.label}: ${fmtPct(y)}`:f.has(a)||m.dataset.label===CRM_KPI_LABELS.adSpend.label?`${m.dataset.label}: Dkr ${fmt(y)}`:`${m.dataset.label}: ${fmt(y)}`}}}},scales:{x:{grid:{display:!1},ticks:{maxRotation:0,autoSkip:!0,maxTicksLimit:12}},y:{beginAtZero:!0,ticks:{callback(m){return a==="closeRate"?`${m}%`:f.has(a)?fmtCompact(m):fmt(m)}}}}}}),bindCrmChartMetricPills(e)}function bindCrmChartMetricPills(e){const t=document.getElementById("crm-development-chart");!t||t.dataset.crmChartBound||(t.dataset.crmChartBound="1",t.addEventListener("click",n=>{const a=n.target.closest("[data-crm-chart-metric]");if(!a)return;const o=a.getAttribute("data-crm-chart-metric");if(!o||o===crmDevelopmentMetricId)return;crmDevelopmentMetricId=o,t.querySelectorAll("[data-crm-chart-metric]").forEach(s=>{s.classList.toggle("is-active",s.getAttribute("data-crm-chart-metric")===crmDevelopmentMetricId)});const r=cachedData?.performance||e,i=document.getElementById("crm-chart-subtitle"),d=CRM_KPI_LABELS[crmDevelopmentMetricId]?.label||crmDevelopmentMetricId;i&&(i.textContent=crmChartSubtitleText(r,d)),mountCrmDevelopmentChart(r,{animate:!0})}))}function mountCharts(e){usesCrmClientDashboard()||typeof Chart>"u"||!window.DashboardCharts||(destroyCharts(),Object.keys(DashboardCharts.CHART_DEFINITIONS).forEach(t=>{if(!isVisible("charts",t))return;const n=DashboardCharts.CHART_DEFINITIONS[t],a=document.getElementById(`chart-${t}`);if(!a)return;const r=a.closest(".chart-card")?.querySelector(".chart-empty"),i=n?.defaultType||"bar",d=DashboardCharts.buildChartConfig(t,e,i);if(!d){a.style.display="none",r&&(r.style.display="block");return}a.style.display="block",r&&(r.style.display="none"),chartInstances[t]=new Chart(a,d)}))}function usesClientPipelineDefaults(){return IS_CLIENT_VIEW||IS_ADMIN}function getPipelineStorageKey(){return`cenhub_pipelines_${facebookClientId||CLIENT_SLUG}`}function loadPipelineSelection(){try{const e=JSON.parse(localStorage.getItem(getPipelineStorageKey())||"[]");return Array.isArray(e)?e:[]}catch{return[]}}function getAllPipelineIds(e){return e.map(t=>t.id)}function getDefaultPipelineIds(e,t=[]){const n=getAllPipelineIds(e),a=(t||[]).filter(o=>n.includes(o));return a.length?a:n.length?n:[]}function ensurePipelineDefaults(e,t=[]){if(!e.length)return;if(usesClientPipelineDefaults()){state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0;return}const n=getAllPipelineIds(e);let a=loadPipelineSelection();if(!a.length)try{a=JSON.parse(localStorage.getItem(PIPELINE_KEY)||"[]")}catch{a=[]}!a.length||!pipelineDefaultsApplied?(a.length?(state.pipelineIds=a.filter(o=>n.includes(o)),state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t))):state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0,savePipelineSelection()):state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t),savePipelineSelection())}function ensurePipelineSelectionBeforeFetch(){return state.pipelineIds.length?!0:availablePipelines.length?(state.pipelineIds=getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds),state.pipelineIds.length&&!usesClientPipelineDefaults()&&savePipelineSelection(),state.pipelineIds.length>0):!1}function savePipelineSelection(){localStorage.setItem(getPipelineStorageKey(),JSON.stringify(state.pipelineIds))}function isPipelineSelected(e){return state.pipelineIds.includes(e)}function isAllPipelinesSelected(e){const t=getAllPipelineIds(e);return t.length>0&&t.every(n=>state.pipelineIds.includes(n))}function selectAllPipelines(e){state.pipelineIds=getAllPipelineIds(e),savePipelineSelection()}function clearPipelineSelection(){state.pipelineIds=[],savePipelineSelection()}function setPipelineSelection(e){state.pipelineIds=[...new Set(e)],savePipelineSelection()}function togglePipelineSelection(e){isPipelineSelected(e)?state.pipelineIds=state.pipelineIds.filter(t=>t!==e):state.pipelineIds=[...state.pipelineIds,e],savePipelineSelection()}function formatSelectedPipelines(e){return state.pipelineIds.length?isAllPipelinesSelected(e)?"All pipelines":state.pipelineIds.map(t=>e.find(n=>n.id===t)?.name||t).join(", "):"None selected"}function renderPipelineChips(e){return state.pipelineIds.length?`
    <div class="pipeline-chips">
      ${state.pipelineIds.map(n=>e.find(a=>a.id===n)).filter(Boolean).map(n=>`
        <span class="pipeline-chip">${esc(n.name)}</span>
      `).join("")}
    </div>
  `:'<div class="pipeline-warning">Select at least one pipeline, then click Apply data filters.</div>'}function defaultDisplayPrefs(){const e={kpis:{},sections:{},charts:getDefaultChartPrefs(),statusItems:{},columns:{}};return Object.keys(DISPLAY_OPTIONS.kpis).forEach(t=>{e.kpis[t]=!0}),Object.keys(DISPLAY_OPTIONS.sections).forEach(t=>{e.sections[t]=!0}),Object.keys(DISPLAY_OPTIONS.charts).forEach(t=>{e.charts[t]=!0}),Object.keys(DISPLAY_OPTIONS.statusItems).forEach(t=>{e.statusItems[t]=!0}),Object.entries(DISPLAY_OPTIONS.columns).forEach(([t,n])=>{e.columns[t]={},Object.keys(n).forEach(a=>{e.columns[t][a]=!0})}),e}function loadDisplayPrefs(){if(IS_CLIENT_VIEW&&!IS_PREVIEW)return defaultDisplayPrefs();try{const e=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY)||"null");if(!e)return defaultDisplayPrefs();const t=defaultDisplayPrefs();return{kpis:{...t.kpis,...e.kpis},sections:{...t.sections,...e.sections},charts:{...t.charts,...e.charts},statusItems:{...t.statusItems,...e.statusItems},columns:{sourceReport:{...t.columns.sourceReport,...e.columns?.sourceReport||{}},assigneeReport:{...t.columns.assigneeReport,...e.columns?.assigneeReport||{}},pipelineBreakdown:{...t.columns.pipelineBreakdown,...e.columns?.pipelineBreakdown||{}}}}}catch{return defaultDisplayPrefs()}}function ensureChartsVisible(){const e=Object.keys(DISPLAY_OPTIONS.charts);e.some(n=>display.charts[n]!==!1)||(e.forEach(n=>{display.charts[n]=!0}),saveDisplayPrefs())}function saveDisplayPrefs(){localStorage.setItem(STORAGE_KEY,JSON.stringify(display))}function isVisible(e,t,n){return e==="columns"?display.columns[n]?.[t]!==!1:display[e]?.[t]!==!1}function toggleDisplay(e,t,n){e==="columns"?display.columns[n][t]=!display.columns[n][t]:display[e][t]=!display[e][t],saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}function setAllDisplay(e,t,n){e==="columns"?Object.keys(DISPLAY_OPTIONS.columns[n]).forEach(a=>{display.columns[n][a]=t}):Object.keys(DISPLAY_OPTIONS[e]).forEach(a=>{display[e][a]=t}),saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}const fmt=e=>new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0)),fmtCompact=e=>{const t=Number(e)||0;return t>=1e6?`${(t/1e6).toFixed(2)}M`:t>=1e3?`${(t/1e3).toFixed(2)}K`:fmt(t)},fmtPct=e=>`${(Number(e)||0).toFixed(2)}%`,fmtRoas=e=>{const t=Number(e)||0;return t>0?`${t.toFixed(2)}x`:"\u2014"};function formatActiveDateFilter(e){if(!e.dateFrom&&!e.dateTo)return"Till date";const t=getDashboardTimeZone();if(window.MarketingMetrics?.formatShortDateLabel){const n=window.MarketingMetrics.formatShortDateLabel(e.dateFrom,t),a=window.MarketingMetrics.formatShortDateLabel(e.dateTo,t);if(n&&a)return`${n} \u2013 ${a}`}return`${e.dateFrom||"start"} to ${e.dateTo||"now"}`}function showDateRangeError(e){document.querySelectorAll("#date-range-error").forEach(t=>{t.textContent=e,t.hidden=!e})}function clearDateRangeError(){showDateRangeError("")}function needsFreshData(){return!lastFetchedAt||Date.now()-lastFetchedAt>DATA_FRESH_MS}function buildQuery(e,t={}){const n=new URLSearchParams,a=getAllPipelineIds(e||[]),o=state.pipelineIds.filter(s=>a.includes(s));if(!o.length)throw new Error("Select at least one pipeline.");n.set("pipelineIds",o.join(","));const r=t.dateField??state.dateField,i=t.dateFrom??state.dateFrom,d=t.dateTo??state.dateTo;return r&&n.set("dateField",r),i&&n.set("dateFrom",i),d&&n.set("dateTo",d),t.granularity&&n.set("granularity",t.granularity),["status","source","assignedTo","adSpend"].forEach(s=>{state[s]&&state[s]!=="all"&&n.set(s,state[s])}),appendTenantParams(n),t.forceFresh&&n.set("fresh","1"),n.toString()}function formatDateInput(e){const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${a}`}function getDashboardTimeZone(){return cachedData?.account?.timezone||"Europe/Copenhagen"}function getCalendarPartsInTimeZone(e,t=new Date){const n=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(t);return{year:Number(n.find(a=>a.type==="year")?.value),month:Number(n.find(a=>a.type==="month")?.value),day:Number(n.find(a=>a.type==="day")?.value)}}function formatMonthDateRange(e,t){const n=`${e}-${String(t).padStart(2,"0")}-01`,a=new Date(e,t,0).getDate(),o=`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`;return{start:n,end:o}}const datePickerState={inputId:null,anchorEl:null,viewYear:null,viewMonth:null};let datePickerListenersBound=!1;function isoFromParts(e,t,n){const a=Number(n);return!e||!t||!Number.isFinite(a)?"":`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`}function formatPickerDisplayLabel(e,t){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return t;const n=getDashboardTimeZone();return window.MarketingMetrics?.formatShortDateLabel&&window.MarketingMetrics.formatShortDateLabel(e,n)||e}function ensureDatePickerPopover(){if(document.getElementById("date-picker-popover"))return;const e=document.createElement("div");e.id="date-picker-backdrop",e.className="date-picker-backdrop",e.hidden=!0,e.addEventListener("click",closeDatePicker),document.body.appendChild(e);const t=document.createElement("div");t.id="date-picker-popover",t.className="date-picker-popover",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),document.body.appendChild(t)}function syncDatePickerDisplays(){[{id:"dateFrom",key:"dateFrom",placeholder:"Pick start date"},{id:"dateTo",key:"dateTo",placeholder:"Pick end date"}].forEach(({id:e,key:t,placeholder:n})=>{const a=document.getElementById(e),o=document.getElementById(`${e}-display`),r=document.getElementById(`${e}-trigger`),i=state[t]??"";a&&(a.value=i),o&&(o.textContent=formatPickerDisplayLabel(i,n)),r?.classList.toggle("is-empty",!i),r?.classList.toggle("has-value",!!i)})}function getStateDateValue(e){return state[e]??""}function getDatePickerViewMonth(e){const t=getStateDateValue(e);if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[n,a]=t.split("-").map(Number);return{year:n,month:a}}return getCalendarPartsInTimeZone(getDashboardTimeZone())}function getTodayIso(){const e=getCalendarPartsInTimeZone(getDashboardTimeZone());return isoFromParts(e.year,e.month,e.day)}function isStartDateDisabled(e){return e>=getTodayIso()}function isFutureDateDisabled(e){return e>getTodayIso()}function isFutureMonthView(e,t){const n=getCalendarPartsInTimeZone(getDashboardTimeZone());return e>n.year||e===n.year&&t>n.month}function isDatePickerDayDisabled(e,t){return t==="dateFrom"&&isStartDateDisabled(e)?!0:isFutureDateDisabled(e)}function renderDatePickerDayCell(e,t,n,a,o,r,i,d){const s=["date-picker-day"];if(n&&s.push("is-outside"),e===a&&s.push("is-today"),e===o&&s.push("is-selected"),r&&i){const l=r<=i?r:i,f=r<=i?i:r;e>=l&&e<=f&&s.push("is-in-range")}return e===r&&s.push("is-range-start"),e===i&&s.push("is-range-end"),isDatePickerDayDisabled(e,d)?(s.push("is-disabled"),`<button type="button" class="${s.join(" ")}" disabled aria-disabled="true">${t}</button>`):`<button type="button" class="${s.join(" ")}" onclick="selectDatePickerDay('${e}')">${t}</button>`}function renderDatePickerPopover(){const e=document.getElementById("date-picker-popover");if(!e||!datePickerState.inputId)return;const{viewYear:t,viewMonth:n,inputId:a}=datePickerState,o=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(t,n-1,1)),r=["Mo","Tu","We","Th","Fr","Sa","Su"],d=(new Date(t,n-1,1).getDay()+6)%7,s=new Date(t,n,0).getDate(),l=new Date(t,n-1,0).getDate(),f=getCalendarPartsInTimeZone(getDashboardTimeZone()),b=isoFromParts(f.year,f.month,f.day),m=getStateDateValue(a),y=getStateDateValue("dateFrom"),$=getStateDateValue("dateTo");let C="";for(let g=d-1;g>=0;g-=1){const w=l-g,S=n===1?12:n-1,D=n===1?t-1:t,T=isoFromParts(D,S,w);C+=renderDatePickerDayCell(T,w,!0,b,m,y,$,a)}for(let g=1;g<=s;g+=1){const w=isoFromParts(t,n,g);C+=renderDatePickerDayCell(w,g,!1,b,m,y,$,a)}const A=(7-(d+s)%7)%7;for(let g=1;g<=A;g+=1){const w=n===12?1:n+1,S=n===12?t+1:t,D=isoFromParts(S,w,g);C+=renderDatePickerDayCell(D,g,!0,b,m,y,$,a)}const p=a==="dateFrom"?'<span class="date-picker-hint">Start date must be before today</span>':"",h=a==="dateTo"?'<button type="button" class="date-picker-footer-btn primary" onclick="setDatePickerToday()">Today</button>':"",u=n===12?1:n+1,v=n===12?t+1:t,c=!isFutureMonthView(v,u);e.innerHTML=`
    <div class="date-picker-panel">
      <div class="date-picker-header">
        <div class="date-picker-title">${esc(o)}</div>
        <div class="date-picker-nav">
          <button type="button" class="date-picker-nav-btn" aria-label="Previous month" onclick="shiftDatePickerMonth(-1)">${ICON_CHEVRON_LEFT}</button>
          <button type="button" class="date-picker-nav-btn" aria-label="Next month" onclick="shiftDatePickerMonth(1)" ${c?"":"disabled"}>${ICON_CHEVRON_RIGHT}</button>
        </div>
      </div>
      <div class="date-picker-weekdays">
        ${r.map(g=>`<div class="date-picker-weekday">${g}</div>`).join("")}
      </div>
      <div class="date-picker-grid">${C}</div>
      <div class="date-picker-footer">
        ${p}
        <button type="button" class="date-picker-footer-btn" onclick="clearDatePickerField()">Clear</button>
        ${h}
      </div>
    </div>
  `}function positionDatePickerPopover(){const e=document.getElementById("date-picker-popover"),t=datePickerState.anchorEl;if(!e||!t)return;e.hidden=!1,e.style.visibility="hidden",e.style.left="0",e.style.top="0",e.style.transform="";const n=t.getBoundingClientRect(),a=e.getBoundingClientRect(),o=8;let r=n.bottom+o,i=n.left;window.innerWidth<=640?(i=Math.max(16,(window.innerWidth-a.width)/2),r=Math.max(16,(window.innerHeight-a.height)/2),e.style.transform="none"):(i+a.width>window.innerWidth-16&&(i=window.innerWidth-a.width-16),i<16&&(i=16),r+a.height>window.innerHeight-16&&(r=Math.max(16,n.top-a.height-o))),e.style.top=`${r}px`,e.style.left=`${i}px`,e.style.visibility=""}function openDatePicker(e,t){ensureDatePickerPopover();const n=document.getElementById("date-picker-popover"),a=document.getElementById("date-picker-backdrop");if(!n||!a||!t)return;if(datePickerState.inputId===e&&!n.hidden){closeDatePicker();return}closeDatePicker(),datePickerState.inputId=e,datePickerState.anchorEl=t;const o=getDatePickerViewMonth(e);datePickerState.viewYear=o.year,datePickerState.viewMonth=o.month,renderDatePickerPopover(),a.hidden=!1,t.classList.add("is-active"),positionDatePickerPopover()}function closeDatePicker(){const e=document.getElementById("date-picker-popover"),t=document.getElementById("date-picker-backdrop");e&&(e.hidden=!0),t&&(t.hidden=!0),datePickerState.anchorEl?.classList.remove("is-active"),datePickerState.inputId=null,datePickerState.anchorEl=null}function shiftDatePickerMonth(e){let{viewYear:t,viewMonth:n}=datePickerState;n+=e,n<1?(n=12,t-=1):n>12&&(n=1,t+=1),!(e>0&&isFutureMonthView(t,n))&&(datePickerState.viewYear=t,datePickerState.viewMonth=n,renderDatePickerPopover(),positionDatePickerPopover())}function selectDatePickerDay(e){const t=datePickerState.inputId;if(!t||!/^\d{4}-\d{2}-\d{2}$/.test(e))return;if(isDatePickerDayDisabled(e,t)){showDateRangeError(t==="dateFrom"?"Start date must be before today.":"End date cannot be after today.");return}t==="dateFrom"&&(state.dateFrom=e),t==="dateTo"&&(state.dateTo=e);const n=document.getElementById(t);n&&(n.value=e),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function setDatePickerToday(){if(datePickerState.inputId==="dateFrom"){showDateRangeError("Start date must be before today.");return}const e=getCalendarPartsInTimeZone(getDashboardTimeZone());selectDatePickerDay(isoFromParts(e.year,e.month,e.day))}function clearDatePickerField(){const e=datePickerState.inputId;if(!e)return;state[e]="";const t=document.getElementById(e);t&&(t.value=""),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function handleDatePickerEscape(e){e.key==="Escape"&&closeDatePicker()}function initDatePickers(){ensureDatePickerPopover(),syncDatePickerDisplays(),datePickerListenersBound||(document.addEventListener("keydown",handleDatePickerEscape),window.addEventListener("resize",closeDatePicker),datePickerListenersBound=!0)}let lastCustomDateFrom="",lastCustomDateTo="";function getPresetDateRange(e){const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="month")return formatMonthDateRange(n,a);if(e==="lastMonth"){let o=n,r=a-1;return r<1&&(r=12,o-=1),formatMonthDateRange(o,r)}return e==="year"?{start:`${n}-01-01`,end:`${n}-12-31`}:null}function isPresetGeneratedRange(e,t){return!e||!t?!1:["month","lastMonth","year"].some(n=>{const a=getPresetDateRange(n);return a&&e===a.start&&t===a.end})}function saveCustomDateRange(){!state.dateFrom||!state.dateTo||isPresetGeneratedRange(state.dateFrom,state.dateTo)||(lastCustomDateFrom=state.dateFrom,lastCustomDateTo=state.dateTo)}function restoreCustomDateRange(){if(lastCustomDateFrom&&lastCustomDateTo&&!isPresetGeneratedRange(lastCustomDateFrom,lastCustomDateTo)){state.dateFrom=lastCustomDateFrom,state.dateTo=lastCustomDateTo;return}state.dateFrom="",state.dateTo=""}function setPreset(e){state.preset==="custom"&&e!=="custom"&&saveCustomDateRange(),state.preset=e;const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="all")state.dateFrom="",state.dateTo="",state.dateField="createdAt";else if(e==="month"){const o=formatMonthDateRange(n,a);state.dateFrom=o.start,state.dateTo=o.end,state.dateField="lastStatusChangeAt"}else if(e==="lastMonth"){let o=n,r=a-1;r<1&&(r=12,o-=1);const i=formatMonthDateRange(o,r);state.dateFrom=i.start,state.dateTo=i.end,state.dateField="lastStatusChangeAt"}else if(e==="year"){const o=getPresetDateRange("year");state.dateFrom=o.start,state.dateTo=o.end,state.dateField="lastStatusChangeAt"}else e==="custom"&&(state.dateField="createdAt",restoreCustomDateRange())}function updateCustomDateRowVisibility(){document.querySelectorAll("#custom-date-row").forEach(e=>{e.hidden=state.preset!=="custom"||isClientPeriodPickActive()})}function updateFilterUi(){const e=document.getElementById("dateFrom"),t=document.getElementById("dateTo"),n=document.getElementById("adSpend");e&&(e.value=state.dateFrom||""),t&&(t.value=state.dateTo||""),n&&(n.value=state.adSpend||""),["status","source","assignedTo","dateField"].forEach(a=>{const o=document.getElementById(a);o&&(o.value=state[a])}),document.querySelectorAll("[data-preset]").forEach(a=>{const o=a.dataset.preset==="custom",r=a.dataset.preset===state.preset&&!(o&&isClientPeriodPickActive());a.classList.toggle("active",r),a.classList.contains("period-seg-btn")&&a.setAttribute("aria-pressed",String(r))}),updateCustomDateRowVisibility(),syncDatePickerDisplays(),refreshClientPeriodPicker(),refreshCompareControl(),updateHeroSubtitle(),refreshPipelinePanel()}function onManualDateChange(){if(syncFiltersFromDom(),clearClientPeriodMonthSelection(),state.preset="custom",state.dateField="createdAt",state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date."),updateFilterUi();return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){state.dateFrom="";const e=document.getElementById("dateFrom");e&&(e.value=""),showDateRangeError("Start date must be before today."),updateFilterUi();return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){state.dateTo="";const e=document.getElementById("dateTo");e&&(e.value=""),showDateRangeError("End date cannot be after today."),updateFilterUi();return}clearDateRangeError(),updateFilterUi(),state.dateFrom&&state.dateTo&&(saveCustomDateRange(),usesCrmClientDashboard()&&closePeriodPicker(),applyDataFilters(!1))}function onFilterChange(e,t){state[e]=t,applyDataFilters(!1)}async function fetchJson(e,t){const n=new AbortController,a=setTimeout(()=>n.abort(),FETCH_TIMEOUT_MS),o=()=>n.abort();t?.addEventListener("abort",o);try{const r=await fetch(e,{signal:n.signal}),i=await r.json().catch(()=>({}));if(!r.ok)throw new Error(i.error||`Request failed (${r.status})`);return i}catch(r){throw r.name==="AbortError",r}finally{clearTimeout(a),t?.removeEventListener("abort",o)}}async function fetchFacebookMetrics(e){try{const t=new URLSearchParams({client:facebookClientId});return CLIENT_ACCESS_KEY&&t.set("key",CLIENT_ACCESS_KEY),await fetchJson(`/api/facebook-metrics?${t}`,e)}catch(t){if(t.name==="AbortError")throw t;return null}}function resolveMarketingPreset(){return["all","month","lastMonth","year"].includes(state.preset)?state.preset:state.preset==="custom"&&state.dateFrom&&state.dateTo?"custom":state.preset}function applyMarketingData(e,t){if(trackClientEarliestDataYear(e?.performance),!window.MarketingMetrics)return e;const n=resolveMarketingPreset(),a=n==="custom",o=window.MarketingMetrics.applyMarketingToDashboard(e,t,n,{timeZone:e.account?.timezone||"Europe/Copenhagen",dateFrom:a?state.dateFrom:null,dateTo:a?state.dateTo:null});return o.monthlyAdSpend?.length&&(cachedMonthlyAdSpend=o.monthlyAdSpend),cachedMonthlyAdSpend?.length&&(o.monthlyAdSpend=cachedMonthlyAdSpend),window.MarketingMetrics?.buildMonthlyCostPerLead&&(o.monthlyCostPerLead=window.MarketingMetrics.buildMonthlyCostPerLead(o.monthlyAdSpend,o.monthlyLeads||e.monthlyLeads||[])),o}const compareState={mode:"off",pickYear:null,pickMonth:0,notice:""};let cachedComparison=null,comparisonRequestId=0;function comparisonHelpers(){return window.PerformanceMerge||null}function getCurrentBoundedRange(){return state.preset==="all"||!state.dateFrom||!state.dateTo?null:{start:state.dateFrom,end:state.dateTo}}function isComparisonRequested(){return usesCrmClientDashboard()&&compareState.mode!=="off"&&!!comparisonHelpers()&&!!getCurrentBoundedRange()}function resolveActiveComparisonRange(){if(!isComparisonRequested())return null;const e=comparisonHelpers(),t=getCurrentBoundedRange(),n=e.detectRangeShape(t,getTodayIso());let a=compareState.mode;a==="pick"&&n==="month"&&!compareState.pickMonth&&(a="previous_period",compareState.mode=a,compareState.notice="Den valgte m\xE5ned passer ikke til denne periode. Viser forrige periode.",showToast(compareState.notice));const o={todayIso:getTodayIso(),pick:{year:compareState.pickYear,month:compareState.pickMonth}},r=e.resolveComparisonRange(t,a,o);if(!r&&a==="pick"){const i=e.resolveComparisonRange(t,"previous_period",o);if(i)return compareState.mode="previous_period",compareState.notice="Den valgte periode kan ikke sammenlignes med sig selv. Viser forrige periode.",showToast(compareState.notice),i}return r}function applyMarketingDataForRange(e,t,n){return window.MarketingMetrics?window.MarketingMetrics.applyMarketingToDashboard(e,t,"custom",{timeZone:e.account?.timezone||"Europe/Copenhagen",dateFrom:n.start,dateTo:n.end}):e}async function fetchComparisonRaw(e){if(!isComparisonRequested())return null;const t=comparisonHelpers(),n=getCurrentBoundedRange(),a=resolveActiveComparisonRange();if(!a)return{status:"unavailable",range:null,currentRange:n,mode:compareState.mode};try{const o=buildQuery(availablePipelines,{dateFrom:a.start,dateTo:a.end,dateField:"createdAt",granularity:t.inferGranularityForRange(n)});return{status:"raw",data:await fetchJson(`/api/dashboard?${o}`,e),range:a,currentRange:n,mode:compareState.mode}}catch(o){if(o.name==="AbortError")throw o;return{status:"error",range:a,currentRange:n,mode:compareState.mode,error:o.message}}}function buildComparisonResult(e,t){if(!e)return null;if(e.status!=="raw")return{...e};const n=applyMarketingDataForRange(e.data,t,e.range);return{status:"ready",range:e.range,currentRange:e.currentRange,mode:e.mode,performance:n.performance||null,kpis:n.kpis||null}}async function refreshComparisonOnly(){const e=++comparisonRequestId;if(!isComparisonRequested()){cachedComparison=null,cachedData&&updateDashboardContent(cachedData);return}cachedComparison={status:"loading",mode:compareState.mode,currentRange:getCurrentBoundedRange(),range:null},refreshCompareControl(),setContentRefreshing(!0);try{const t=await fetchComparisonRaw(void 0);if(e!==comparisonRequestId)return;cachedComparison=buildComparisonResult(t,cachedFacebookMetrics)}catch{if(e!==comparisonRequestId)return;cachedComparison={status:"error",mode:compareState.mode,range:null,currentRange:getCurrentBoundedRange()}}cachedData&&updateDashboardContent(cachedData)}function setCompareMode(e,t={}){compareState.mode=e,compareState.notice="",t.pickYear&&(compareState.pickYear=Number(t.pickYear)),t.pickMonth!==void 0&&(compareState.pickMonth=Number(t.pickMonth)||0),closeCompareMenu(),refreshComparisonOnly()}function clearComparison(){setCompareMode("off")}async function fetchDashboardData(e,t,n={}){const a=buildQuery(e,n),o=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,t);return applyChartFieldsCache(o)}async function bootstrapDashboardData(e,t={}){const n=new URLSearchParams;appendTenantParams(n),t.forceFresh&&n.set("fresh","1");const a=n.toString(),o=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,e);return o.account?.facebookClientId?facebookClientId=o.account.facebookClientId:o.account?.clientId&&(facebookClientId=o.account.clientId),applyChartFieldsCache(o)}function refreshPipelinePanel(){const e=document.getElementById("pipeline-panel");if(e){if(!availablePipelines.length){e.innerHTML='<div class="pipeline-note">Sync client data to load pipelines.</div>';return}e.innerHTML=renderPipelineSelector(availablePipelines)}}function selectAllPipelinesAction(){selectAllPipelines(availablePipelines),refreshPipelinePanel()}function clearPipelineSelectionAction(){clearPipelineSelection(),refreshPipelinePanel()}function togglePipelineSelectionAction(e){togglePipelineSelection(e),refreshPipelinePanel()}function selectCenhubPipelinesAction(){setPipelineSelection(getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds)),refreshPipelinePanel()}function renderPipelineSelector(e){return e.length?`
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
        ${o.map(([r,i])=>`
          <label class="checkbox-item">
            <input type="checkbox"
              ${isVisible(t,r,a)?"checked":""}
              onchange="toggleDisplay('${t}', '${r}'${a?`, '${a}'`:""})" />
            <span>${i}</span>
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
    `}function renderTable(e,t,n,a,o){const r=n.filter(i=>isVisible("columns",i.key,e));return r.length?`
    <div class="dashboard-table-wrap">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>${t}</th>
            ${r.map(i=>`<th class="${i.align||""}">${i.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${a.length?a.map(i=>`
            <tr>
              <td>${o(i,"label")}</td>
              ${r.map(d=>`<td class="${d.align||""}">${o(i,d.key)}</td>`).join("")}
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
  `}const CLIENT_MONTH_NAMES=["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];let clientPeriodYear=null,clientPeriodMonth="",clientEarliestDataYear=null,clientEarliestDataDate=null,clientPeriodSkipValidation=!1;function trackClientEarliestDataYear(e){if(state.preset!=="all")return;const t=Number(String(e?.range?.start||"").slice(0,4));if(t>=2e3){clientEarliestDataYear=clientEarliestDataYear?Math.min(clientEarliestDataYear,t):t;const n=String(e.range.start).slice(0,10);(!clientEarliestDataDate||n<clientEarliestDataDate)&&(clientEarliestDataDate=n)}}function getClientPeriodYears(){const{year:e}=getCalendarPartsInTimeZone(getDashboardTimeZone()),t=Math.min(clientEarliestDataYear||e-2,e),n=[];for(let a=e;a>=t;a-=1)n.push(a);return n}function getClientPeriodMaxMonth(e){const{year:t,month:n}=getCalendarPartsInTimeZone(getDashboardTimeZone());return Number(e)===t?n:12}function isClientPeriodPickActive(){return usesCrmClientDashboard()&&state.preset==="custom"&&!!clientPeriodMonth}let periodPickerViewYear=null;function getPeriodPickerViewYear(){const e=getClientPeriodYears();return(!periodPickerViewYear||!e.includes(Number(periodPickerViewYear)))&&(periodPickerViewYear=clientPeriodYear&&e.includes(Number(clientPeriodYear))?Number(clientPeriodYear):e[0]),Number(periodPickerViewYear)}function getPeriodPickerLabel(){return state.preset!=="custom"?"Anden periode":clientPeriodMonth&&clientPeriodYear?clientPeriodMonth==="all"?String(clientPeriodYear):`${CLIENT_MONTH_NAMES[Number(clientPeriodMonth)-1]} ${clientPeriodYear}`:state.dateFrom&&state.dateTo&&comparisonHelpers()?comparisonHelpers().formatComparisonRangeLabel({start:state.dateFrom,end:state.dateTo},getTodayIso()):"Anden periode"}function renderPeriodMonthGrid(e){const t=getClientPeriodMaxMonth(e),{year:n,month:a}=getCalendarPartsInTimeZone(getDashboardTimeZone());return CLIENT_MONTH_NAMES.map((o,r)=>{const i=r+1,d=i>t,s=isClientPeriodPickActive()&&Number(clientPeriodYear)===e&&String(clientPeriodMonth)===String(i);return`<button type="button" class="period-month${s?" is-selected":""}${e===n&&i===a?" is-current":""}" data-month="${i}" aria-label="${o} ${e}" ${s?'aria-pressed="true"':""} ${d?"disabled":""} onclick="selectPeriodMonth(${i})">${o.slice(0,3)}</button>`}).join("")}function renderClientPresetSegments(){return`
    <div class="period-seg" role="group" aria-label="Periode">
      ${[["all","Til dato"],["month","Denne m\xE5ned"],["lastMonth","Sidste m\xE5ned"],["year","I \xE5r"]].map(([t,n])=>`<button type="button" class="period-seg-btn${state.preset===t?" active":""}" data-preset="${t}" aria-pressed="${state.preset===t}" onclick="applyPreset('${t}')">${n}</button>`).join("")}
    </div>
  `}function renderPeriodPicker(){const e=getPeriodPickerViewYear(),t=getClientPeriodYears(),n=isClientPeriodPickActive()&&Number(clientPeriodYear)===e&&clientPeriodMonth==="all";return`
    <div class="period-picker" id="period-picker">
      <button type="button" class="compare-btn period-picker-btn${state.preset==="custom"?" is-active":""}" id="period-picker-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="period-popover" onclick="togglePeriodPicker(event)">
        <span class="period-picker-icon" aria-hidden="true">${ICON_CALENDAR}</span>
        <span class="compare-btn-label" id="period-picker-label">${esc(getPeriodPickerLabel())}</span>
        <span class="compare-btn-caret" aria-hidden="true"></span>
      </button>
      <div class="compare-menu period-popover" id="period-popover" role="dialog" aria-label="V\xE6lg periode" hidden onclick="event.stopPropagation()">
        <div class="period-popover-head">
          <div class="period-year-nav">
            <button type="button" id="period-year-prev" aria-label="Tidligere \xE5r" ${e===t[t.length-1]?"disabled":""} onclick="stepPeriodYear(-1)">\u2039</button>
            <span id="period-year-label" aria-live="polite">${e}</span>
            <button type="button" id="period-year-next" aria-label="N\xE6ste \xE5r" ${e===t[0]?"disabled":""} onclick="stepPeriodYear(1)">\u203A</button>
          </div>
          <button type="button" class="period-whole-year${n?" is-selected":""}" id="period-whole-year" onclick="selectPeriodMonth('all')">Hele \xE5ret</button>
        </div>
        <div class="period-month-grid" id="period-month-grid" role="group" aria-label="M\xE5ned" onkeydown="onPeriodGridKeydown(event)">${renderPeriodMonthGrid(e)}</div>
        <div class="period-popover-section">
          <div class="period-popover-title">Egen periode</div>
          <div class="period-custom-range">
            ${renderDatePickerTrigger("dateFrom","Fra","Fra dato")}
            <span class="date-range-separator" aria-hidden="true">\u2192</span>
            ${renderDatePickerTrigger("dateTo","Til","Til dato")}
          </div>
          <div class="date-range-error" id="date-range-error" hidden></div>
        </div>
      </div>
    </div>
  `}function refreshClientPeriodPicker(){const e=document.getElementById("period-picker-btn");if(!e)return;e.classList.toggle("is-active",state.preset==="custom");const t=document.getElementById("period-picker-label");t&&(t.textContent=getPeriodPickerLabel());const n=getPeriodPickerViewYear(),a=getClientPeriodYears(),o=document.getElementById("period-year-label");o&&(o.textContent=String(n));const r=document.getElementById("period-year-prev"),i=document.getElementById("period-year-next");r&&(r.disabled=n===a[a.length-1]),i&&(i.disabled=n===a[0]);const d=document.getElementById("period-month-grid");d&&(d.innerHTML=renderPeriodMonthGrid(n));const s=document.getElementById("period-whole-year");s&&s.classList.toggle("is-selected",isClientPeriodPickActive()&&Number(clientPeriodYear)===n&&clientPeriodMonth==="all")}function closePeriodPicker(){const e=document.getElementById("period-popover");e&&(e.hidden=!0),document.getElementById("period-picker-btn")?.setAttribute("aria-expanded","false")}function togglePeriodPicker(e){e?.stopPropagation();const t=document.getElementById("period-popover");if(!t)return;const n=t.hidden;closeCompareMenu(),n?(periodPickerViewYear=null,refreshClientPeriodPicker(),t.hidden=!1,document.getElementById("period-picker-btn")?.setAttribute("aria-expanded","true"),t.querySelector(".period-month.is-selected, .period-month.is-current, .period-month:not(:disabled)")?.focus()):closePeriodPicker(),bindHeaderPopoverDismiss()}function stepPeriodYear(e){const t=getClientPeriodYears(),n=t.indexOf(getPeriodPickerViewYear()),a=e<0?n+1:n-1;a<0||a>=t.length||(periodPickerViewYear=t[a],refreshClientPeriodPicker())}function selectPeriodMonth(e){clientPeriodYear=getPeriodPickerViewYear(),clientPeriodMonth=e==="all"?"all":String(e),closePeriodPicker(),applyClientPeriodSelection()}function onPeriodGridKeydown(e){const n={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4}[e.key];if(!n)return;const a=[...document.querySelectorAll("#period-month-grid .period-month")];let o=a.indexOf(document.activeElement);if(!(o<0)){e.preventDefault();for(let r=0;r<a.length;r+=1){if(o+=n,o<0||o>=a.length)return;if(!a[o].disabled){a[o].focus();return}}}}let headerPopoverDismissBound=!1;function bindHeaderPopoverDismiss(){headerPopoverDismissBound||(headerPopoverDismissBound=!0,document.addEventListener("click",e=>{(typeof e.composedPath=="function"?e.composedPath():[]).some(n=>n&&(n.id==="date-picker-popover"||n.id==="date-picker-backdrop"))||(closePeriodPicker(),closeCompareMenu())}),document.addEventListener("keydown",e=>{e.key==="Escape"&&(closePeriodPicker(),closeCompareMenu())}))}function getHeroSubtitleText(){if(!usesCrmClientDashboard())return"Performance dashboard \xB7 Pipeline & oms\xE6tning";const e=getCurrentBoundedRange();return`Performance dashboard \xB7 ${e&&comparisonHelpers()?comparisonHelpers().formatComparisonRangeLabel(e,getTodayIso()):"Til dato"}`}function updateHeroSubtitle(){const e=document.getElementById("hero-subtitle");e&&(e.textContent=getHeroSubtitleText())}function applyClientPeriodSelection(){if(!clientPeriodYear||!clientPeriodMonth)return;const e=Number(clientPeriodYear),t=getTodayIso();let n;clientPeriodMonth==="all"?n={start:`${e}-01-01`,end:`${e}-12-31`}:n=formatMonthDateRange(e,Number(clientPeriodMonth)),t&&n.end>t&&(n.end=t),clearDateRangeError(),state.preset="custom",state.dateField="createdAt",state.dateFrom=n.start,state.dateTo=n.end,updateFilterUi(),clientPeriodSkipValidation=!0;try{applyDataFilters(!1)}finally{clientPeriodSkipValidation=!1}}function clearClientPeriodMonthSelection(){!usesCrmClientDashboard()||!clientPeriodMonth||(clientPeriodMonth="",refreshClientPeriodPicker())}function renderCustomDateInputs(){return`
    <div class="custom-date-row" id="custom-date-row" ${state.preset!=="custom"||isClientPeriodPickActive()?"hidden":""}>
      <div class="custom-date-range">
        ${renderDatePickerTrigger("dateFrom","From","Pick start date")}
        <span class="date-range-separator" aria-hidden="true">\u2192</span>
        ${renderDatePickerTrigger("dateTo","To","Pick end date")}
      </div>
      <div class="date-range-error" id="date-range-error" hidden></div>
    </div>
  `}function renderPresetControls(e=!1){return usesCrmClientDashboard()?`
      <div class="preset-controls preset-controls--header">
        <div class="preset-btn-row header-presets">
          ${renderClientPresetSegments()}
          ${renderPeriodPicker()}
          ${renderCompareControl()}
        </div>
      </div>
    `:`
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
    <button type="button" class="preset-btn ${state.preset==="custom"&&!isClientPeriodPickActive()?"active":""}" data-preset="custom" onclick="applyPreset('custom')">Custom</button>
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
  `}function renderDashboardMiddleSections(e){const{kpis:t,statusBreakdown:n,sourceReport:a,assigneeReport:o,pipelines:r,filters:i}=e;return`
    ${isVisible("sections","statusBreakdown")?`
      <div class="card">
        <div class="section-title">Opportunity Status (Cards)</div>
        ${renderStatusBreakdown(n)}
      </div>
    `:""}

    ${isVisible("sections","sourceReport")?`
      <div class="card">
        <div class="section-title">Lead Source Report</div>
        ${renderTable("sourceReport","Source",[{key:"totalLeads",label:"Total leads",align:"num"},{key:"totalValue",label:"Total values",align:"num"},{key:"open",label:"Open",align:"num"},{key:"won",label:"Won",align:"num"},{key:"lost",label:"Lost",align:"num"},{key:"abandoned",label:"Abandoned",align:"num"},{key:"winPct",label:"Win %",align:"num"}],a,(s,l)=>l==="label"?esc(s.source):l==="totalValue"?`Dkr ${fmt(s.totalValue)}`:l==="winPct"?fmtPct(s.winPct):fmt(s[l]))}
      </div>
    `:""}

    ${isVisible("sections","assigneeReport")||isVisible("sections","pipelineBreakdown")?`
      <div class="section-grid">
        ${isVisible("sections","assigneeReport")?`
          <div class="card">
            <div class="section-title">Leads Closed by Assignee</div>
            ${renderTable("assigneeReport","Assignee",[{key:"won",label:"Won",align:"num"},{key:"totalLeads",label:"Total leads",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"},{key:"totalValue",label:"Total value",align:"num"}],o,(s,l)=>l==="label"?esc(s.assigneeName):l==="wonValue"||l==="totalValue"?`Dkr ${fmt(s[l])}`:fmt(s[l]))}
          </div>
        `:""}
        ${isVisible("sections","pipelineBreakdown")?`
          <div class="card">
            <div class="section-title">Pipeline Breakdown</div>
            ${renderTable("pipelineBreakdown","Pipeline",[{key:"count",label:"Leads",align:"num"},{key:"won",label:"Won",align:"num"},{key:"monetary",label:"Value",align:"num"},{key:"profit",label:"Bundlinje",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"}],r,(s,l)=>l==="label"?esc(s.name):l==="monetary"||l==="profit"||l==="wonValue"?`Dkr ${fmt(s[l])}`:fmt(s[l]))}
          </div>
        `:""}
      </div>
    `:""}

    ${IS_ADMIN?`
    <div class="note">
      ${t.usingCenhubDefaults?"Till-date Total Leads uses deduped opportunities from account pipeline defaults. ":""}
      Active filters: source=${i.source}, assignee=${i.assignedTo}, dates=${formatActiveDateFilter(i)}.
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
  `}function setContentRefreshing(e){document.getElementById("dashboard-content")?.classList.toggle("is-refreshing",e),document.body.classList.toggle("is-refreshing",e)}let lastRenderSignature="";function getRenderSignature(e){try{return JSON.stringify([e.kpis,e.performance,e.statusBreakdown,e.sourceReport,e.assigneeReport,e.pipelines,e.filters,cachedComparison?.status,cachedComparison?.range,cachedComparison?.performance?.totals,crmDevelopmentMetricId])}catch{return""}}function updateDashboardContent(e){if(IS_ADMIN){const n=document.getElementById("admin-filters-panel");n&&(n.outerHTML=renderAdminFiltersPanel(e.filterOptions||{pipelines:[],statuses:[],sources:[],assignees:[],dateFields:[]}));const a=document.getElementById("admin-display-panel");if(a){const o=!!a.open;a.outerHTML=renderAdminDisplayOptions(o)}}const t=document.getElementById("dashboard-content");t&&(t.innerHTML=renderDashboardContent(e),mountCharts(e),mountCrmDevelopmentChart(e.performance)),lastRenderSignature=usesCrmClientDashboard()?getRenderSignature(e):"",setContentRefreshing(!1),refreshCompareControl()}function renderDashboard(e){const t=document.getElementById("dashboard"),{filterOptions:n,account:a={}}=e,o=document.querySelector("details.panel")?.open,r=a.accountName||"Dashboard";IS_CLIENT_VIEW&&a.accountName&&(document.title=`${a.accountName} \xB7 Cenhub Dashboard`),t.innerHTML=`
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
          <p id="hero-subtitle">${esc(getHeroSubtitleText())}</p>
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
  `,IS_ADMIN_CLIENT&&loadSetupAccount(),initDatePickers()}let isFetching=!1,pendingRefetch=!1,fetchGeneration=0,activeFetchController=null,fetchStartedAt=0;const FETCH_TIMEOUT_MS=9e4;function restoreDashboardContentAfterFailedFetch(e){!e||!cachedData||(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi())}function setPresetButtonsDisabled(e){usesCrmClientDashboard()||document.querySelectorAll("[data-preset]").forEach(t=>{t.disabled=e})}function resetFetchUiState(){isFetching=!1,setPresetButtonsDisabled(!1);const e=document.getElementById("apply-filters-btn");e&&(e.disabled=!1,e.textContent="Apply data filters")}function cancelActiveFetch(){activeFetchController&&(activeFetchController.abort(),activeFetchController=null)}function canReuseBootstrapDashboard(e){return!!(e?.kpis&&usesClientPipelineDefaults()&&!state.dateFrom&&!state.dateTo&&state.status==="all"&&state.source==="all"&&state.assignedTo==="all")}async function loadDashboard(e=!0,t={}){const{background:n=!1,forceFresh:a=!1}=t,o=!!a,r=document.getElementById("dashboard");if(isFetching&&(e||!cachedData))cancelActiveFetch(),fetchGeneration+=1,pendingRefetch=!1,resetFetchUiState();else if(isFetching){e&&(pendingRefetch=!0);return}const i=!!document.getElementById("dashboard-content"),d=document.getElementById("apply-filters-btn");if(e||!cachedData){const s=++fetchGeneration;activeFetchController=new AbortController;const l=activeFetchController.signal;if(isFetching=!0,fetchStartedAt=Date.now(),!i)r.innerHTML=`
        ${renderAppTopbar()}
        ${wrapDashboardShell(`
          <div class="loading-state">
            <div class="spinner"></div>
            ${LOADING_MSG}
          </div>
        `)}`;else if(!n){const f=document.getElementById("dashboard-content");usesCrmClientDashboard()&&cachedData?setContentRefreshing(!0):f&&(f.innerHTML=renderKpiSkeleton()),d&&(d.disabled=!0,d.textContent="Loading..."),setPresetButtonsDisabled(!0)}try{let f=null;if(!availablePipelines.length){if(f=await bootstrapDashboardData(l),s!==fetchGeneration)return;availablePipelines=f.filterOptions.pipelines||[],ensurePipelineDefaults(availablePipelines,f.account?.defaultPipelineIds)}if(!ensurePipelineSelectionBeforeFetch())throw new Error("Select at least one pipeline.");const m=canReuseBootstrapDashboard(f)&&!o;let y,$;const C=++comparisonRequestId,A=fetchComparisonRaw(l);if(A.catch(()=>{}),m?[$,y]=await Promise.all([fetchFacebookMetrics(l),Promise.resolve(f)]):[y,$]=await Promise.all([fetchDashboardData(availablePipelines,l,{forceFresh:o}),fetchFacebookMetrics(l)]),s!==fetchGeneration)return;cachedFacebookMetrics=$;const p=await A;if(s!==fetchGeneration)return;C===comparisonRequestId&&(cachedComparison=buildComparisonResult(p,$)),cachedData=applyMarketingData(y,$),cachedData.account?.facebookClientId?facebookClientId=cachedData.account.facebookClientId:cachedData.account?.clientId&&(facebookClientId=cachedData.account.clientId),availablePipelines=cachedData.filterOptions.pipelines||availablePipelines,ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),lastFetchedAt=cachedData.cachedAt?new Date(cachedData.cachedAt).getTime():Date.now()}catch(f){if(s!==fetchGeneration)return;if(f.name==="AbortError"){i?restoreDashboardContentAfterFailedFetch(i):r.innerHTML=`
            ${renderAppTopbar()}
            ${wrapDashboardShell(`
              <div class="error-state">
                <div>Fejl ved hentning af data</div>
                <div style="margin-top:8px;font-size:12px;color:#666">Request timed out. Pr\xF8v igen.</div>
                <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            `)}`;return}if(IS_ADMIN_CLIENT&&i){const b=document.getElementById("dashboard-content");b&&(b.innerHTML=`
            <div class="note admin-setup-placeholder">
              ${esc(f.message)}
              <div style="margin-top:12px">
                <button type="button" class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            </div>`)}else i?i&&cachedData?(restoreDashboardContentAfterFailedFetch(i),showToast(f.message||"Failed to load filtered data.","error")):d&&(d.textContent="Apply failed - try again"):r.innerHTML=`
          ${renderAppTopbar()}
          ${wrapDashboardShell(`
            <div class="error-state">
              <div>Fejl ved hentning af data</div>
              <div style="margin-top:8px;font-size:12px;color:#666">${esc(f.message)}</div>
              <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
            </div>
          `)}`;return}finally{s===fetchGeneration&&(activeFetchController=null,resetFetchUiState()),pendingRefetch&&(pendingRefetch=!1,loadDashboard(!0))}if(s!==fetchGeneration)return}try{i?(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),n&&usesCrmClientDashboard()&&lastRenderSignature&&getRenderSignature(cachedData)===lastRenderSignature||(updateDashboardContent(cachedData),updateFilterUi())):(renderDashboard(cachedData),mountCharts(cachedData),mountCrmDevelopmentChart(cachedData?.performance))}catch(s){resetFetchUiState(),r.innerHTML=`
      ${renderAppTopbar()}
      ${wrapDashboardShell(`
        <div class="error-state">
          <div>Fejl ved visning af dashboard</div>
          <div style="margin-top:8px;font-size:12px;color:#666">${esc(s.message)}</div>
          <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
        </div>
      `)}
    `}}function syncFiltersFromDom(){["status","source","assignedTo","dateField"].forEach(t=>{const n=document.getElementById(t);n&&(state[t]=n.value)});const e=document.getElementById("adSpend");if(e&&(state.adSpend=e.value),state.preset==="custom"){const t=document.getElementById("dateFrom"),n=document.getElementById("dateTo");t&&(state.dateFrom=t.value),n&&(state.dateTo=n.value),state.dateField="createdAt"}}function hasPartialDateRange(){return!!(state.dateFrom&&!state.dateTo||!state.dateFrom&&state.dateTo)}function applyPreset(e){if(clearDateRangeError(),closeDatePicker(),e==="all"&&(compareState.mode="off",compareState.notice="",cachedComparison=null),usesCrmClientDashboard()&&clientPeriodMonth&&(clientPeriodMonth="",state.preset==="custom"&&(state.preset="all"),refreshClientPeriodPicker()),setPreset(e),updateFilterUi(),e==="custom"){const t=document.getElementById("dateFrom-trigger");t&&openDatePicker("dateFrom",t);return}applyDataFilters(!1)}function applyDataFilters(e=!0){if(e&&syncFiltersFromDom(),state.preset==="custom"&&!clientPeriodSkipValidation){if(hasPartialDateRange()){showDateRangeError("Select both From and To dates.");return}if(state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date.");return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){showDateRangeError("Start date must be before today.");return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){showDateRangeError("End date cannot be after today.");return}}if(clearDateRangeError(),!state.pipelineIds.length&&availablePipelines.length&&ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),!state.pipelineIds.length){!availablePipelines.length&&isFetching&&loadDashboard(!0);return}loadDashboard(!0)}async function bootClientApp(){const e=window.location.pathname.replace(/\/+$/,"")||"/";if(e==="/admin"||e==="/login"||e==="/team"||e.startsWith("/admin/")||e.startsWith("/report/")){if(!document.querySelector('script[src*="admin.bundle.js"]')){const n=document.createElement("script");n.src="/js/admin.bundle.js?v=349",n.defer=!0,document.body.appendChild(n)}return}if(bindStaffChromeEvents(),await probeStaffPreviewSession(),IS_REPORT_VIEW){await loadPublicMetaReportPage();return}try{tenantParams=await resolveTenantParams()}catch(n){document.getElementById("dashboard").innerHTML=renderAppTopbar()+wrapDashboardShell('<div class="error-state" style="padding:24px">'+esc(n.message)+"</div>");return}ensureChartsVisible(),loadDashboard(!0),setInterval(function(){loadDashboard(!0,{background:!0})},120*1e3)}bootClientApp(),document.addEventListener("visibilitychange",function(){document.visibilityState==="visible"&&(isFetching&&Date.now()-fetchStartedAt>FETCH_TIMEOUT_MS&&(cancelActiveFetch(),fetchGeneration+=1,resetFetchUiState()),cachedData&&needsFreshData()&&loadDashboard(!0,{background:!0}))});

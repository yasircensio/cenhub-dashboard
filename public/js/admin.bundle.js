(function(){const t=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);if(t[0]==="login"){document.body.dataset.dashboardMode="login",delete document.body.dataset.clientSlug;return}if(t[0]==="team"){document.body.dataset.dashboardMode="team",delete document.body.dataset.clientSlug;return}if(t[0]==="admin"){if(t[1]==="sync-history"&&(t[2]==="ghl"||t[2]==="meta"||t[2]==="meta-reports")){document.body.dataset.dashboardMode=t[2]==="meta-reports"?"sync-history-meta-reports":`sync-history-${t[2]}`,delete document.body.dataset.clientSlug;return}if(t[1]==="fb-lead-sync"){document.body.dataset.dashboardMode="fb-lead-sync",delete document.body.dataset.clientSlug;return}if(t[1]==="google-ads"&&t[2]){document.body.dataset.dashboardMode="google-ads-client",document.body.dataset.clientSlug=t[2];return}if(t[1]==="google-ads"){document.body.dataset.dashboardMode="google-ads",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]==="custom-values"){document.body.dataset.dashboardMode="meta-reports-custom",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]==="ghl-clients"){document.body.dataset.dashboardMode="meta-reports-ghl-clients",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]){document.body.dataset.dashboardMode="meta-reports-client",document.body.dataset.clientSlug=t[2];return}if(t[1]==="meta-reports"){document.body.dataset.dashboardMode="meta-reports",delete document.body.dataset.clientSlug;return}document.body.dataset.dashboardMode=t.length>=2?"admin":"hub",t.length>=2?document.body.dataset.clientSlug=t[1]:delete document.body.dataset.clientSlug;return}if(t[0]==="report"&&t[1]){document.body.dataset.dashboardMode="report",document.body.dataset.reportToken=t[1],delete document.body.dataset.clientSlug;return}t[0]&&t[0]!=="index.html"&&(document.body.dataset.dashboardMode="client",document.body.dataset.clientSlug=t[0])})();const DASHBOARD_MODE=document.body.dataset.dashboardMode||"client",IS_LOGIN_PAGE=DASHBOARD_MODE==="login",IS_TEAM_PAGE=DASHBOARD_MODE==="team",IS_ADMIN_HUB=DASHBOARD_MODE==="hub",IS_ADMIN_CLIENT=DASHBOARD_MODE==="admin",IS_ADMIN_SYNC_HISTORY_GHL=DASHBOARD_MODE==="sync-history-ghl",IS_ADMIN_SYNC_HISTORY_META=DASHBOARD_MODE==="sync-history-meta",IS_ADMIN_SYNC_HISTORY_META_REPORTS=DASHBOARD_MODE==="sync-history-meta-reports",IS_ADMIN_FB_LEAD_SYNC=DASHBOARD_MODE==="fb-lead-sync",IS_ADMIN_META_REPORTS=DASHBOARD_MODE==="meta-reports",IS_ADMIN_META_REPORTS_CLIENT=DASHBOARD_MODE==="meta-reports-client",IS_ADMIN_META_REPORTS_CUSTOM=DASHBOARD_MODE==="meta-reports-custom",IS_ADMIN_META_REPORTS_GHL_CLIENTS=DASHBOARD_MODE==="meta-reports-ghl-clients",IS_ADMIN_GOOGLE_ADS=DASHBOARD_MODE==="google-ads",IS_ADMIN_GOOGLE_ADS_CLIENT=DASHBOARD_MODE==="google-ads-client",IS_REPORT_VIEW=DASHBOARD_MODE==="report",REPORT_TOKEN=document.body.dataset.reportToken||"",IS_ADMIN_SYNC_HISTORY=IS_ADMIN_SYNC_HISTORY_GHL||IS_ADMIN_SYNC_HISTORY_META||IS_ADMIN_SYNC_HISTORY_META_REPORTS,IS_CLIENT_VIEW=DASHBOARD_MODE==="client",IS_PREVIEW=IS_CLIENT_VIEW&&!!new URLSearchParams(window.location.search).get("client"),IS_ADMIN=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||IS_ADMIN_META_REPORTS_GHL_CLIENTS||IS_ADMIN_GOOGLE_ADS||IS_ADMIN_GOOGLE_ADS_CLIENT||new URLSearchParams(window.location.search).get("view")==="admin",ADMIN_UI=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||IS_ADMIN_META_REPORTS_GHL_CLIENTS||IS_ADMIN_GOOGLE_ADS||IS_ADMIN_GOOGLE_ADS_CLIENT||IS_ADMIN,LOADING_MSG=ADMIN_UI?"Loading dashboard data...":"Henter dashboard data...",RETRY_MSG=ADMIN_UI?"Try again":"Pr\xF8v igen";(function(){const t=document.getElementById("initial-loading-msg");t&&(t.textContent=LOADING_MSG)})();function resolveClientSlug(){if(document.body.dataset.clientSlug)return document.body.dataset.clientSlug;const e=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean),t=new Set(["meta-reports","google-ads","sync-history","fb-lead-sync"]);return e[0]==="admin"&&e[1]==="google-ads"&&e[2]||e[0]==="admin"&&e[1]==="meta-reports"&&e[2]&&e[2]!=="custom-values"&&e[2]!=="ghl-clients"?e[2]:e[0]==="admin"&&e[1]&&!t.has(e[1])?e[1]:e[0]&&e[0]!=="admin"&&e[0]!=="index.html"&&e[0]!=="report"?e[0]:new URLSearchParams(window.location.search).get("client")||"suntech-nordic"}const CLIENT_SLUG=resolveClientSlug();let tenantParams={},facebookClientId=CLIENT_SLUG,setupAccount=null,setupPipelines=[],metricsModelChangeMode=!1;function esc(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function renderBrandTopbar(e=""){const t=!!(e&&e.includes("staff-admin-chrome")),n=t||e&&e.includes("admin-topbar-link")?"/admin":"",a=n?`<a href="${n}" class="brand-logo-link" aria-label="Cenhub home"><img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" /></a>`:'<img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" />',o=t?`<button type="button" class="staff-nav-toggle" id="staff-nav-toggle" aria-expanded="false" aria-controls="staff-topbar-panel" aria-label="Open menu">
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
      </button>`:"",r=e?t?`<div class="brand-topbar-right brand-topbar-panel" id="staff-topbar-panel">${e}</div>`:`<div class="brand-topbar-right">${e}</div>`:"";return`
    <header class="brand-topbar${t?" brand-topbar--collapsible":""}${!t?" brand-topbar--centered":""}">
      <div class="brand-topbar-inner">
        <div class="brand-topbar-left">${a}</div>
        ${o}
        ${r}
      </div>
    </header>
  `}function wrapDashboardShell(e){return`<div class="dashboard-shell">${e}</div>`}function showToast(e,t="info"){const n=document.getElementById("toast-host");if(!n)return;const a=document.createElement("div");a.className=`toast${t==="error"?" toast--error":t==="success"?" toast--success":""}`,a.textContent=e,n.appendChild(a),setTimeout(()=>a.remove(),4200)}function fmtDkk(e){return new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0))}function fmtRevenueDkk(e){const t=Math.round(Number(e)||0);if(t>=1e6){const n=t/1e6;return`${new Intl.NumberFormat("da-DK",{minimumFractionDigits:n%1===0?0:2,maximumFractionDigits:2}).format(n)}M kr`}return`${fmtDkk(t)} kr`}function clientNeedsAction(e){return!!(e&&e!=="ready"&&e!=="syncing")}function clientActionHint(e){return{syncing:"Sync in progress...",needs_token:"Action needed \u2014 add GHL token in Settings",needs_metrics_model:"Action needed \u2014 choose metrics model in Settings",needs_pipelines:"Action needed \u2014 map pipelines in Settings",needs_sync:"Action needed \u2014 sync data from Settings or click Sync",needs_review:"Action needed \u2014 review client setup in Settings",sync_error:"Sync failed \u2014 open Settings and try again"}[e]||"Action needed \u2014 open Settings to finish setup"}function requestGhlUserData(e=8e3){return new Promise(t=>{if(window.self===window.top){t(null);return}const n=setTimeout(()=>{window.removeEventListener("message",a),t(null)},e);function a(o){o.data?.message==="REQUEST_USER_DATA_RESPONSE"&&o.data.payload&&(clearTimeout(n),window.removeEventListener("message",a),t(o.data.payload))}window.addEventListener("message",a),window.parent.postMessage({message:"REQUEST_USER_DATA"},"*")})}async function resolveTenantParams(){const e=new URLSearchParams(window.location.search);if(IS_ADMIN_HUB)return{};if(IS_ADMIN_CLIENT||IS_CLIENT_VIEW)return{client:CLIENT_SLUG};if(e.get("client"))return{client:e.get("client")};const t=e.get("location_id")||e.get("locationId");return t?{location_id:t}:{client:CLIENT_SLUG}}let CLIENT_ACCESS_KEY=new URLSearchParams(window.location.search).get("key")||"";function appendTenantParams(e){tenantParams.location_id?e.set("location_id",tenantParams.location_id):tenantParams.client&&e.set("client",tenantParams.client),CLIENT_ACCESS_KEY&&e.set("key",CLIENT_ACCESS_KEY)}const ADMIN_API_KEY_STORAGE="cenhub_admin_api_key";let currentStaffUser=null;function getAdminApiKey(){return localStorage.getItem(ADMIN_API_KEY_STORAGE)||""}function redirectToLogin(){const e=`${window.location.pathname}${window.location.search}`;window.location.href=`/login?next=${encodeURIComponent(e)}`}async function fetchStaffMe(){const e=await fetch("/api/auth/me",{credentials:"include"}),t=await e.json().catch(()=>({}));return e.ok&&t.user||null}async function requireStaffAuth(){const e=await fetchStaffMe();return e?(currentStaffUser=e,e):(redirectToLogin(),null)}async function adminFetch(e,t={}){const n={"Content-Type":"application/json",...t.headers||{}},a=getAdminApiKey();a&&(n["x-api-key"]=a);let o;try{o=await fetch(e,{...t,headers:n,credentials:"include"})}catch(s){throw s}const r=await o.json().catch(()=>({}));if(o.status===401&&ADMIN_UI)throw redirectToLogin(),new Error(r.error||"Unauthorized.");if(!o.ok)throw new Error(r.error||`Request failed (${o.status})`);return r}function sleepMs(e){return new Promise(t=>setTimeout(t,e))}async function adminFetchWithRetry(e,t={},{retries:n=3,timeoutMs:a=13e4}={}){let o=null;for(let r=1;r<=n;r+=1){const s=new AbortController,i=setTimeout(()=>s.abort(),a);try{const l={"Content-Type":"application/json",...t.headers||{}},c=getAdminApiKey();c&&(l["x-api-key"]=c);const d=await fetch(e,{...t,headers:l,credentials:"include",signal:s.signal});clearTimeout(i);const u=await d.json().catch(()=>({}));if(d.status===401&&ADMIN_UI)throw redirectToLogin(),new Error(u.error||"Unauthorized.");if(!d.ok){const p=new Error(u.error||`Request failed (${d.status})`);if(d.status>=500&&r<n){o=p,await sleepMs(1200*r);continue}throw p}return u}catch(l){if(clearTimeout(i),o=l,(l.name==="AbortError"||/fetch failed|network|timeout|timed out|502|503|504/i.test(String(l.message||"")))&&r<n){await sleepMs(1200*r);continue}throw l.name==="AbortError"?new Error("Request timed out \u2014 the server may still be processing. Try Resume if a partial run exists."):l}}throw o||new Error("Request failed after retries.")}async function staffLogout(){try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"})}catch{}window.location.href="/login"}function isStaffAdmin(){return currentStaffUser?.role==="admin"}function renderStaffUserMenu(){const e=currentStaffUser;return e?`
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
        <button type="button" class="staff-nav-link staff-nav-dropdown-trigger${e==="meta-reports"||e==="meta-reports-custom"||e==="meta-reports-ghl-clients"?" is-active":""}" aria-expanded="false" aria-haspopup="true" onclick="toggleStaffNavDropdown(this, event)">Meta reports</button>
        <div class="staff-nav-dropdown-menu" role="menu">
          <a href="/admin/meta-reports" class="staff-nav-dropdown-item${e==="meta-reports"?" is-active":""}" role="menuitem">All clients</a>
          <a href="/admin/meta-reports/ghl-clients" class="staff-nav-dropdown-item${e==="meta-reports-ghl-clients"?" is-active":""}" role="menuitem">Cenhub clients</a>
          <a href="/admin/meta-reports/custom-values" class="staff-nav-dropdown-item${e==="meta-reports-custom"?" is-active":""}" role="menuitem">Custom values</a>
        </div>
      </div>
      <a href="/admin/google-ads" class="staff-nav-link${e==="google-ads"?" is-active":""}">Google Ads</a>
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
  `:""}function isStaffNavMobilePanelOpen(){return!!(document.getElementById("staff-topbar-panel")?.classList.contains("is-open")&&window.matchMedia("(max-width: 1100px)").matches)}function resetStaffNavDropdownMenu(e){e&&(e.classList.remove("is-floating"),e.style.position="",e.style.left="",e.style.top="",e.style.right="",e.style.width="",e.style.minWidth="")}function restoreStaffNavDropdownMenu(e){const t=e._floatingMenu;t&&(resetStaffNavDropdownMenu(t),e._menuAnchor&&e._menuAnchor.parentNode?e._menuAnchor.parentNode.insertBefore(t,e._menuAnchor):e.appendChild(t),e._floatingMenu=null)}function floatStaffNavDropdownMenu(e,t){isStaffNavMobilePanelOpen()||e._floatingMenu!==t&&(e._menuAnchor=document.createComment("staff-nav-menu-anchor"),t.parentNode.insertBefore(e._menuAnchor,t),document.body.appendChild(t),t.classList.add("is-floating"),e._floatingMenu=t)}function positionStaffNavDropdown(e){const t=e.querySelector(".staff-nav-dropdown-trigger"),n=e._floatingMenu||e.querySelector(".staff-nav-dropdown-menu");if(!t||!n)return;if(isStaffNavMobilePanelOpen()){resetStaffNavDropdownMenu(n),n.style.position="static",n.style.width="100%";return}floatStaffNavDropdownMenu(e,n);const a=t.getBoundingClientRect(),o=Math.max(188,a.width);n.style.position="fixed",n.style.width="",n.style.minWidth=`${o}px`,n.style.left=`${Math.max(8,a.left)}px`,n.style.top=`${a.bottom+6}px`,n.style.right="auto";const r=n.getBoundingClientRect();if(r.right>window.innerWidth-8&&(n.style.left=`${Math.max(8,window.innerWidth-r.width-8)}px`),r.bottom>window.innerHeight-8){const s=a.top-r.height-6;s>=8&&(n.style.top=`${s}px`)}}function closeStaffNavDropdowns(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(e=>{e.classList.remove("is-open"),e.querySelector(".staff-nav-dropdown-trigger")?.setAttribute("aria-expanded","false"),restoreStaffNavDropdownMenu(e)})}function toggleStaffNavDropdown(e,t){t?.stopPropagation();const n=e?.closest(".staff-nav-dropdown");if(!n)return;const a=!n.classList.contains("is-open");if(closeStaffNavDropdowns(),closeStaffUserMenu(),!a){e.setAttribute("aria-expanded","false");return}n.classList.add("is-open"),e.setAttribute("aria-expanded","true"),positionStaffNavDropdown(n)}function toggleStaffUserMenu(e){e.stopPropagation();const t=document.getElementById("staff-user-dropdown"),n=e.currentTarget;if(!t)return;const a=t.hidden;closeStaffUserMenu(),a&&(t.hidden=!1,n?.setAttribute("aria-expanded","true"))}function closeStaffUserMenu(){const e=document.getElementById("staff-user-dropdown"),t=document.querySelector(".staff-user-trigger");e&&(e.hidden=!0),t&&t.setAttribute("aria-expanded","false")}function toggleStaffTopbarNav(e){const t=document.getElementById("staff-topbar-panel");if(!t)return;const n=!t.classList.contains("is-open");t.classList.toggle("is-open",n),e.setAttribute("aria-expanded",n?"true":"false"),e.setAttribute("aria-label",n?"Close menu":"Open menu"),e.classList.toggle("is-active",n),n&&closeStaffUserMenu()}function closeStaffTopbarNav(){const e=document.getElementById("staff-topbar-panel"),t=document.getElementById("staff-nav-toggle");e&&e.classList.remove("is-open"),t&&(t.setAttribute("aria-expanded","false"),t.setAttribute("aria-label","Open menu"),t.classList.remove("is-active"))}function formatStaffLastLogin(e){if(!e)return"Never";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}function renderStaffStatusBadge(e){return`<span class="staff-status-badge status-${e}">${e==="active"?"Active":e==="pending"?"Pending":"Disabled"}</span>`}async function copyTextToClipboard(e,t){try{await navigator.clipboard.writeText(e),showToast(t,"success")}catch{showToast("Could not copy to clipboard","error")}}function renderTeamPage(e){return`
    ${renderBrandTopbar(renderStaffAdminChrome("team"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero">
      <h1>Team & access</h1>
      <p>Invite Censio staff, manage roles, and control who can access the admin workspace.</p>
    </div>
    <div class="team-page">
      <div class="panel">
        <div class="panel-title">Staff members</div>
        <div id="team-users-content">${renderStaffUsersTable(e)}</div>
      </div>
    </div>
    <div class="brand-footer">
      Dashboard by Cenhub \xB7 Holstebro
    </div>
    `)}
  `}async function loadTeamPage(){const e=document.getElementById("dashboard");if(await requireStaffAuth()){if(!isStaffAdmin()){window.location.href="/admin";return}e.innerHTML=`
    ${renderBrandTopbar(renderStaffAdminChrome("team"))}
    ${wrapDashboardShell(`
      <div class="loading-state">
        <div class="spinner"></div>
        Loading team...
      </div>
    `)}`;try{const n=await adminFetch("/api/auth/users");e.innerHTML=renderTeamPage(n.users||[])}catch(n){e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("team"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(n.message)}</div>`)}
    `}}}async function reloadTeamUsersTable(){const e=document.getElementById("team-users-content");if(!e)return;const t=await adminFetch("/api/auth/users");e.innerHTML=renderStaffUsersTable(t.users||[])}function renderStaffUserActions(e){const t=currentStaffUser?.id===e.id,n=e.status==="disabled"?`<button class="admin-btn" type="button" onclick="updateStaffUser('${esc(e.id)}', { status: 'active' })">Enable</button>`:`<button class="admin-btn" type="button" ${t?'disabled title="You cannot disable your own account"':""} onclick="updateStaffUser('${esc(e.id)}', { status: 'disabled' })">Disable</button>`,a=e.status==="pending"||!e.hasPassword?`<button class="admin-btn" type="button" onclick="copyStaffInviteLink('${esc(e.id)}')">Copy invite link</button>`:`<button class="admin-btn" type="button" onclick="resetStaffUserPassword('${esc(e.id)}', true)">Reset password</button>`,o=t?"":`<button class="admin-btn card-menu-item--danger" type="button" onclick="deleteStaffUser('${esc(e.id)}')">Delete</button>`;return`
    <div class="staff-user-actions">
      ${n}
      ${a}
      ${o}
    </div>
  `}function renderStaffUserRoleSelect(e){return`
    <select
      class="staff-role-select"
      ${currentStaffUser?.id===e.id?'disabled title="You cannot change your own role here"':""}
      onchange="updateStaffUserRole('${esc(e.id)}', this.value)"
    >
      <option value="member" ${e.role==="member"?"selected":""}>Member</option>
      <option value="admin" ${e.role==="admin"?"selected":""}>Admin</option>
    </select>
  `}function renderStaffUserCard(e){return`
    <article class="staff-user-card">
      <div class="staff-user-card-header">
        <div class="staff-user-card-name">${esc(e.name||"\u2014")}</div>
        <div class="staff-user-card-email">${esc(e.email)}</div>
      </div>
      <div class="staff-user-card-row">
        <div class="staff-user-card-meta-label">Role</div>
        ${renderStaffUserRoleSelect(e)}
      </div>
      <div class="staff-user-card-meta">
        <div>
          <div class="staff-user-card-meta-label">Status</div>
          ${renderStaffStatusBadge(e.status)}
        </div>
        <div>
          <div class="staff-user-card-meta-label">Last login</div>
          <div>${esc(formatStaffLastLogin(e.lastLoginAt))}</div>
        </div>
      </div>
      ${renderStaffUserActions(e)}
    </article>
  `}function renderStaffUsersTable(e){const t=e.map(a=>`
      <tr>
        <td>${esc(a.name||"\u2014")}<div style="color:var(--text-soft);font-size:12px">${esc(a.email)}</div></td>
        <td>${renderStaffUserRoleSelect(a)}</td>
        <td>${renderStaffStatusBadge(a.status)}</td>
        <td>${esc(formatStaffLastLogin(a.lastLoginAt))}</td>
        <td>${renderStaffUserActions(a)}</td>
      </tr>
    `).join(""),n=e.map(a=>renderStaffUserCard(a)).join("");return`
    <div class="staff-users-table-wrap">
      <table class="staff-users-table staff-users-table--desktop">
        <thead>
          <tr><th>User</th><th>Role</th><th>Status</th><th>Last login</th><th>Actions</th></tr>
        </thead>
        <tbody>${t||'<tr><td colspan="5">No staff users yet.</td></tr>'}</tbody>
      </table>
    </div>
    <div class="staff-users-cards staff-users-cards--mobile">
      ${n||'<div class="note">No staff users yet.</div>'}
    </div>
    <div style="margin-top:20px">
      <div class="panel-title" style="margin-bottom:10px">Invite staff member</div>
      <div class="team-invite-row">
        <div class="auth-field" style="margin:0">
          <label for="new-staff-email">Email</label>
          <input id="new-staff-email" type="email" placeholder="name@company.dk" />
        </div>
        <div class="auth-field" style="margin:0">
          <label for="new-staff-name">Name</label>
          <input id="new-staff-name" type="text" placeholder="Full name" />
        </div>
        <div class="auth-field" style="margin:0">
          <label for="new-staff-role">Role</label>
          <select id="new-staff-role" class="staff-role-select">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button class="admin-btn admin-btn--primary" type="button" style="align-self:end" onclick="createStaffUserFromForm()">${ICON_PLUS} Invite</button>
      </div>
    </div>
  `}async function createStaffUserFromForm(){const e=document.getElementById("new-staff-email")?.value?.trim(),t=document.getElementById("new-staff-name")?.value?.trim(),n=document.getElementById("new-staff-role")?.value==="admin"?"admin":"member";if(!e){showToast("Email is required.","error");return}try{const a=await adminFetch("/api/auth/users",{method:"POST",body:JSON.stringify({email:e,name:t,role:n})});a.setupUrl&&await copyTextToClipboard(a.setupUrl,"Invite link copied to clipboard."),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("Staff member invited.","success")}catch(a){showToast(a.message,"error")}}async function updateStaffUser(e,t){try{await adminFetch(`/api/auth/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("User updated.","success")}catch(n){showToast(n.message,"error"),IS_TEAM_PAGE&&await reloadTeamUsersTable()}}async function updateStaffUserRole(e,t){await updateStaffUser(e,{role:t==="admin"?"admin":"member"})}async function deleteStaffUser(e){if(window.confirm("Delete this staff member? This permanently removes their account and cannot be undone."))try{await adminFetch(`/api/auth/users/${encodeURIComponent(e)}`,{method:"DELETE"}),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("Staff member deleted.","success")}catch(t){showToast(t.message,"error")}}async function copyStaffInviteLink(e){try{const t=await adminFetch(`/api/auth/users/${encodeURIComponent(e)}/reset-password`,{method:"POST",body:"{}"});t.setupUrl&&await copyTextToClipboard(t.setupUrl,"Invite link copied to clipboard.")}catch(t){showToast(t.message,"error")}}async function resetStaffUserPassword(e,t=!1){try{const n=await adminFetch(`/api/auth/users/${encodeURIComponent(e)}/reset-password`,{method:"POST",body:"{}"});n.setupUrl&&await copyTextToClipboard(n.setupUrl,t?"Reset link copied to clipboard.":"Password reset link generated.")}catch(n){showToast(n.message,"error")}}function renderLoginPage(){const e=new URLSearchParams(window.location.search),t=e.get("token"),n=e.get("next")||"/admin",a=e.get("saved")==="1",o=document.getElementById("dashboard"),r='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',s='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a20.3 20.3 0 014.06-5.94M9.9 4.24A10.94 10.94 0 0112 5c6.5 0 10 7 10 7a20.3 20.3 0 01-3.17 4.49"/><path d="M1 1l22 22"/><path d="M14.12 14.12A3 3 0 009.88 9.88"/></svg>',i='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>';function l(c,d,u=""){return`
      <div class="auth-field">
        <label for="${c}">${d}</label>
        <div class="auth-password-wrap">
          <input id="${c}" type="password" ${u} />
          <button
            type="button"
            class="auth-password-toggle"
            aria-label="Show password"
            onclick="toggleAuthPassword('${c}', this)"
          >${r}</button>
        </div>
      </div>
    `}if(t){o.innerHTML=`
      ${renderBrandTopbar()}
      ${wrapDashboardShell(`
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-card-header">
            <div class="auth-card-title-row">
              <div class="auth-card-icon" aria-hidden="true">${i}</div>
              <h1>Set your password</h1>
            </div>
            <p>Create a password for your Cenhub staff account. The link expires after 48 hours.</p>
          </div>
          <div id="auth-error" class="auth-error" style="display:none"></div>
          <div id="auth-success" class="auth-success" style="display:none"></div>
          ${l("set-password","New password",`autocomplete="new-password" minlength="8" placeholder="At least 8 characters" oninput="updatePasswordStrength()" onkeydown="if(event.key==='Enter')submitSetPassword()"`)}
          <div id="password-strength" class="password-strength" aria-live="polite"></div>
          ${l("set-password-confirm","Confirm password",`autocomplete="new-password" minlength="8" placeholder="Repeat your password" onkeydown="if(event.key==='Enter')submitSetPassword()"`)}
          <input id="password-token" type="hidden" value="${esc(t)}" />
          <button id="auth-submit-btn" class="admin-btn admin-btn--primary auth-submit" type="button" onclick="submitSetPassword()">Save password</button>
          <div class="auth-note"><a href="/login">Back to login</a></div>
        </div>
      </div>
      `)}
    `,initAuthPage("set-password");return}o.innerHTML=`
    ${renderBrandTopbar()}
    ${wrapDashboardShell(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-card-title-row">
            <div class="auth-card-icon" aria-hidden="true">${i}</div>
            <h1>Staff login</h1>
          </div>
          <p>Manage client dashboards and admin settings.</p>
        </div>
        ${a?'<div class="auth-success">Password saved. Sign in with your new password.</div>':""}
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <div id="auth-success" class="auth-success" style="display:none"></div>
        <div class="auth-field">
          <label for="login-email">Email</label>
          <input id="login-email" type="email" autocomplete="username" placeholder="you@company.dk" onkeydown="if(event.key==='Enter')document.getElementById('login-password')?.focus()" />
        </div>
        ${l("login-password","Password",`autocomplete="current-password" placeholder="Enter your password" onkeydown="if(event.key==='Enter')submitStaffLogin()"`)}
        <input id="login-next" type="hidden" value="${esc(n)}" />
        <button id="auth-submit-btn" class="admin-btn admin-btn--primary auth-submit" type="button" onclick="submitStaffLogin()">Sign in</button>
        <div class="auth-note">Forgot password? <a class="auth-help-link" href="mailto:?subject=Cenhub%20staff%20password%20reset">Contact your admin</a> for a new setup link.</div>
      </div>
    </div>
    `)}
  `,initAuthPage("login-email")}function initAuthPage(e){const t=document.getElementById(e);t&&requestAnimationFrame(()=>t.focus({preventScroll:!0}))}function toggleAuthPassword(e,t){const n=document.getElementById(e);if(!n||!t)return;const a=n.type==="password";n.type=a?"text":"password",t.setAttribute("aria-label",a?"Hide password":"Show password"),t.innerHTML=a?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a20.3 20.3 0 014.06-5.94M9.9 4.24A10.94 10.94 0 0112 5c6.5 0 10 7 10 7a20.3 20.3 0 01-3.17 4.49"/><path d="M1 1l22 22"/><path d="M14.12 14.12A3 3 0 009.88 9.88"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>'}function setAuthSubmitLoading(e,t,n){const a=document.getElementById("auth-submit-btn");a&&(a.disabled=e,a.classList.toggle("is-loading",e),a.textContent=e?t:n,document.querySelectorAll(".auth-card input").forEach(o=>{o.type!=="hidden"&&(o.disabled=e)}))}function updatePasswordStrength(){const e=document.getElementById("set-password")?.value||"",t=document.getElementById("password-strength");if(!t)return;if(!e){t.textContent="",t.className="password-strength";return}let n=0;e.length>=8&&(n+=1),e.length>=12&&(n+=1),/[A-Z]/.test(e)&&/[a-z]/.test(e)&&(n+=1),/\d/.test(e)&&(n+=1);const a=["Weak","Fair","Good","Strong"],o=["is-weak","is-fair","is-good","is-strong"],r=Math.min(Math.max(n-1,0),3);t.className=`password-strength ${o[r]}`,t.textContent=`Password strength: ${a[r]}`}function showAuthSuccess(e){const t=document.getElementById("auth-error"),n=document.getElementById("auth-success");t&&(t.style.display="none"),n&&(n.textContent=e,n.style.display=e?"block":"none")}function showAuthError(e){const t=document.getElementById("auth-error"),n=document.getElementById("auth-success");n&&e&&(n.style.display="none"),t&&(t.textContent=e,t.style.display=e?"block":"none")}async function submitStaffLogin(){showAuthError("");const e=document.getElementById("login-next")?.value||"/admin",t=document.getElementById("login-email")?.value?.trim(),n=document.getElementById("login-password")?.value||"";if(!t||!n){showAuthError("Email and password are required.");return}setAuthSubmitLoading(!0,"Signing in\u2026","Sign in");try{const a=await fetch("/api/auth/login",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,password:n})}),o=await a.json().catch(()=>({}));if(!a.ok){showAuthError(o.error||"Login failed."),setAuthSubmitLoading(!1,"Signing in\u2026","Sign in");return}showAuthSuccess("Signed in. Redirecting\u2026"),window.setTimeout(()=>{window.location.href=e||"/admin"},450)}catch(a){showAuthError(a.message||"Login failed."),setAuthSubmitLoading(!1,"Signing in\u2026","Sign in")}}async function submitSetPassword(){showAuthError("");const e=document.getElementById("password-token")?.value||"",t=document.getElementById("set-password")?.value||"",n=document.getElementById("set-password-confirm")?.value||"";if(t.length<8){showAuthError("Password must be at least 8 characters.");return}if(t!==n){showAuthError("Passwords do not match.");return}setAuthSubmitLoading(!0,"Saving\u2026","Save password");try{const a=await fetch("/api/auth/set-password",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:e,password:t,confirmPassword:n})}),o=await a.json().catch(()=>({}));if(!a.ok){showAuthError(o.error||"Could not set password."),setAuthSubmitLoading(!1,"Saving\u2026","Save password");return}showAuthSuccess("Password saved. Redirecting to sign in\u2026"),window.setTimeout(()=>{window.location.href="/login?saved=1&next=/admin"},1200)}catch(a){showAuthError(a.message||"Could not set password."),setAuthSubmitLoading(!1,"Saving\u2026","Save password")}}function statusLabel(e){return{ready:"Ready",syncing:"Syncing",needs_token:"Needs token",needs_metrics_model:"Needs metrics model",needs_pipelines:"Needs pipelines",needs_sync:"Needs sync",needs_review:"Needs review",sync_error:"Sync failed"}[e]||e}function formatRelativeSync(e,t){if(t==="syncing")return"Syncing now...";if(!e)return"Not synced yet";const n=Date.now()-new Date(e).getTime(),a=Math.round(n/6e4);if(a<2)return"Synced just now";if(a<60)return`Synced ${a} min ago`;const o=Math.round(a/60);return o<24?`Synced ${o} hr ago`:`Synced ${new Date(e).toLocaleString("en-GB")}`}const ICON_SEARCH='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',ICON_PLUS='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',ICON_CALENDAR='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/></svg>',ICON_CHEVRON_LEFT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',ICON_CHEVRON_RIGHT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',ICON_SYNC='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',ICON_CHEVRON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',ICON_CHART='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',ICON_CHECK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';function clientInitials(e){const t=String(e||"?").trim().split(/\s+/).filter(Boolean);return t.length?t.length===1?t[0].slice(0,2).toUpperCase():(t[0][0]+t[1][0]).toUpperCase():"?"}const SYNC_HISTORY_TIMEZONE="Europe/Copenhagen";function formatSyncHistoryTimestamp(e){if(!e)return"\u2014";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("da-DK",{timeZone:SYNC_HISTORY_TIMEZONE,day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})}function formatSyncHistoryDate(e){if(!e)return null;const t=new Date(e);return Number.isNaN(t.getTime())?null:t.toLocaleDateString("da-DK",{timeZone:SYNC_HISTORY_TIMEZONE,day:"numeric",month:"short",year:"numeric"})}function renderSyncStatusBadge(e){const t=String(e||"unknown").toLowerCase();let n="running",a=t;return t==="success"||t==="ok"||t==="cron_tick"?n="success":t==="error"||t==="failed"?n="error":t==="interrupted"?(n="running",a="Interrupted"):t==="skipped"?n="skipped":t==="partial"?(n="running",a="Partial"):t==="applying"&&(n="running",a="Applying"),`<span class="sync-status-badge sync-status-badge--${n}">${esc(a)}</span>`}function formatSyncSource(e){return{cron:"Scheduled (cron)","github-actions":"Scheduled (GitHub Actions)","cron-job.org":"Scheduled (cron-job.org)","http-cron":"Scheduled (HTTP cron)","ghl-webhook":"GHL webhook (OpportunityCreate)","fb-lead-retry":"Auto retry (5m worker)","daily-reconcile":"Daily reconcile (01:00 UTC)",admin:"Manual (admin)","vercel-cron":"Scheduled (Vercel cron)",manual:"Manual (admin)","full-ghl-sync":"After GHL snapshot sync",inngest:"Scheduled (legacy)","auto-refresh":"Dashboard auto-refresh",unknown:"Unknown"}[e]||e}function formatMetaReportGhlSyncDetail(e){const t=e.detail||{};if(e.status==="skipped"&&t.skipReason)return`Skipped (${t.skipReason})`;const n=[],a=t.synced||[],o=t.skipped||[],r=t.errors||[];if(a.length&&n.push(`${a.length} synced${a.length<=3?` (${a.join(", ")})`:""}`),o.length){const s=o.filter(l=>l.reason==="manual_override").length,i=s?` (${s} manual)`:"";n.push(`${o.length} skipped${i}`)}return r.length&&n.push(`${r.length} error${r.length===1?"":"s"}`),e.errorMessage&&!n.length&&n.push(e.errorMessage),t.opportunityId&&n.push(`opp ${t.opportunityId}`),n.join(" \xB7 ")||"\u2014"}function getSyncHistoryNavTab(e){return e==="meta"?"meta-sync":e==="meta-report-ghl"?"meta-report-sync":"ghl-sync"}function renderSyncHistorySummary(e,t){return`
    <div class="sync-history-summary">
      <div class="sync-history-stat">
        <div class="sync-history-stat-label">Last run</div>
        <div class="sync-history-stat-value">${esc(formatSyncHistoryTimestamp(e?.lastRunAt))}</div>
      </div>
      <div class="sync-history-stat">
        <div class="sync-history-stat-label">Last successful sync</div>
        <div class="sync-history-stat-value">${esc(formatSyncHistoryTimestamp(e?.lastSuccessAt))}</div>
      </div>
      <div class="sync-history-stat">
        <div class="sync-history-stat-label">${t==="meta"?"Meta cron schedule":t==="meta-report-ghl"?"Sync triggers":"GHL cron schedule"}</div>
        <div class="sync-history-stat-value" style="font-size:13px;font-family:monospace">${esc(e?.schedule||"\u2014")}</div>
      </div>
    </div>
  `}function renderSyncHistoryRows(e,t){if(!e.length)return'<div class="sync-history-empty">No sync runs logged yet.</div>';const n=t==="meta"?"Spend / details":t==="meta-report-ghl"?"Months / details":"Details",a=e.map(o=>{let r="\u2014";if(t==="meta-report-ghl")r=formatMetaReportGhlSyncDetail(o);else if(t==="meta"){const s=[];if(o.thisMonthSpend!=null&&s.push(`${fmtDkk(o.thisMonthSpend)} DKK this month`),o.spendDateStop){const i=formatSyncHistoryDate(o.spendDateStop);i&&s.push(`through ${i}`)}o.errorMessage&&s.push(o.errorMessage),r=s.join(" \xB7 ")||"\u2014"}else o.opportunityCount!=null?(r=`${o.opportunityCount} opportunities`,o.errorMessage&&(r+=` \xB7 ${o.errorMessage}`)):o.errorMessage&&(r=o.errorMessage);return`
      <tr>
        <td>${esc(formatSyncHistoryTimestamp(o.startedAt))}</td>
        <td>${esc(o.accountName||o.clientId)}</td>
        <td>${renderSyncStatusBadge(o.status)}</td>
        <td>${esc(formatSyncSource(o.source))}</td>
        <td class="sync-history-detail">${esc(r)}</td>
      </tr>
    `}).join("");return`
    <div class="sync-history-table-wrap">
      <table class="sync-history-table">
        <thead>
          <tr>
            <th>Started</th>
            <th>Client</th>
            <th>Status</th>
            <th>Source</th>
            <th>${n}</th>
          </tr>
        </thead>
        <tbody>${a}</tbody>
      </table>
    </div>
  `}function renderSyncHistoryPage(e,t){const n={ghl:{title:"GHL / Cenhub sync history",subtitle:"Every GHL snapshot sync \u2014 scheduled Vercel cron and manual admin syncs. Logs older than 3 days are auto-deleted."},meta:{title:"Meta ad spend sync history",subtitle:"Every Meta metrics sync \u2014 scheduled, manual, and dashboard auto-refresh. Logs older than 3 days are auto-deleted."},"meta-report-ghl":{title:"Meta report Cenhub sync history",subtitle:"Cenhub topline sync into Meta reports \u2014 GHL webhooks, post-snapshot auto-sync, and manual admin syncs. Logs older than 3 days are auto-deleted."}},a=n[e]||n.ghl,o=getSyncHistoryNavTab(e),r=e==="meta-report-ghl"?`<a class="admin-btn admin-btn--secondary" href="/admin/sync-history/ghl">GHL sync log</a>
       <a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta">Meta ad sync log</a>`:e==="ghl"?`<a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta">Meta sync log</a>
         <a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta-reports">Meta report sync log</a>`:`<a class="admin-btn admin-btn--secondary" href="/admin/sync-history/ghl">GHL sync log</a>
         <a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta-reports">Meta report sync log</a>`;return`
    ${renderBrandTopbar(renderStaffAdminChrome(o))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero">
      <div class="admin-breadcrumb">
        <a href="/admin">Clients</a>
        <span aria-hidden="true"> / </span>
        <span>${esc(a.title)}</span>
      </div>
      <h1>${esc(a.title)}</h1>
      <p>${esc(a.subtitle)}${t.summary?.totalShown?` \xB7 ${t.summary.totalShown} run(s) shown`:""}</p>
    </div>
    <div class="sync-history-page">
      <div class="sync-history-toolbar">
        <div class="sync-history-toolbar-actions">
          <a class="admin-btn admin-btn--secondary" href="/admin">\u2190 Back to clients</a>
          ${r}
        </div>
        <div class="sync-history-toolbar-actions">
          <button class="admin-btn admin-btn--secondary" type="button" id="sync-history-refresh">${ICON_SYNC} Refresh</button>
          ${isStaffAdmin()?'<button class="admin-btn admin-btn--secondary" type="button" id="sync-history-clear-log">Clear log</button>':""}
        </div>
      </div>
      ${renderSyncHistorySummary(t.summary,e)}
      ${renderSyncHistoryRows(t.runs||[],e)}
    </div>
    `)}
  `}let syncHistoryRefreshTimer=null;async function clearSyncHistoryLog(e){if(!isStaffAdmin())return;const t=e==="meta"?"Meta ad":e==="meta-report-ghl"?"Meta report Cenhub":"GHL",n=e==="meta"?"This only clears the history table. It does not change ad spend data or client sync status.":e==="meta-report-ghl"?"This only clears the history table. It does not change Meta report month values or Cenhub snapshots.":"This only clears the history table. It does not change GHL snapshot data or client sync status.";if(window.confirm(`Delete all ${t} sync log entries?

${n}`))try{const o=await adminFetch(`/api/sync-history?type=${encodeURIComponent(e)}`,{method:"DELETE"});showToast(`Cleared ${o.deleted||0} log entr${o.deleted===1?"y":"ies"}.`,"success"),await loadSyncHistoryPage(e)}catch(o){showToast(o.message||`Failed to clear ${t} sync log.`,"error")}}function renderSyncHistoryLoginPrompt(e){const t=e==="meta"?"Meta sync log":e==="meta-report-ghl"?"Meta report sync log":"GHL sync log";return`
    ${renderBrandTopbar("")}
    ${wrapDashboardShell(`
      <div class="page-hero admin-hub-hero">
        <h1>${esc(t)}</h1>
        <p>Sign in with your staff account to view sync run history.</p>
      </div>
      <div class="sync-history-page">
        <div class="sync-history-empty" style="padding:24px;text-align:center">
          <p style="margin-bottom:16px">Staff login is required. The public health endpoint shows DB totals, but this page reads authenticated sync history.</p>
          <a class="admin-btn admin-btn--primary" href="/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}">Sign in</a>
        </div>
      </div>
    `)}
  `}async function loadSyncHistoryPage(e,{silent:t=!1}={}){const n=document.getElementById("dashboard");if(!n)return;const a=await fetchStaffMe();if(!a){t||(n.innerHTML=renderSyncHistoryLoginPrompt(e));return}currentStaffUser=a,t||(n.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome(getSyncHistoryNavTab(e)))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading sync history...</p></div>')}
    `);try{const o=await adminFetch(`/api/sync-history?type=${encodeURIComponent(e)}&limit=150`);n.innerHTML=renderSyncHistoryPage(e,o);const r=document.getElementById("sync-history-refresh");r&&(r.onclick=()=>loadSyncHistoryPage(e));const s=document.getElementById("sync-history-clear-log");s&&(s.onclick=()=>clearSyncHistoryLog(e)),syncHistoryRefreshTimer&&(clearInterval(syncHistoryRefreshTimer),syncHistoryRefreshTimer=null),syncHistoryRefreshTimer=window.setInterval(()=>{loadSyncHistoryPage(e,{silent:!0}).catch(()=>{})},6e4)}catch(o){n.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome(getSyncHistoryNavTab(e)))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(o.message)}</div>`)}
    `}}const FB_LEAD_ROUTINE_HIDE_SOURCES=new Set(["cron-job.org","github-actions","vercel-cron","http-cron","daily-reconcile"]);let fbLeadSyncState={clients:[],preflightByClient:{},historyRuns:[],cronSummary24h:null,showRoutineCronRuns:!1,activeRun:null,previewOkByClient:{},applyingRunId:null,isApplying:!1,applyStartedAt:0,applyWaitTimer:null,applyProgress:null};function isRoutineSuccessfulCronRun(e){if(!e||e.dryRun||!FB_LEAD_ROUTINE_HIDE_SOURCES.has(String(e.source||"").trim()))return!1;const t=String(e.status||"").toLowerCase();return!(t==="interrupted"||t==="running"||t!=="success"&&t!=="ok"||(Number(e.updated)||0)>0||(Number(e.errors)||0)>0)}function getFbLeadHistoryRunsForDisplay(e=fbLeadSyncState.historyRuns){return fbLeadSyncState.showRoutineCronRuns?e||[]:(e||[]).filter(t=>!isRoutineSuccessfulCronRun(t))}function formatFbLeadCronLastRun(e){if(!e)return"\u2014";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("en-GB",{timeZone:"UTC",hour:"2-digit",minute:"2-digit",hour12:!1})+" UTC"}function renderFbLeadCronSummary24h(e){const t=e||{totalOpportunitiesCreated:0,totalWebhookSyncs:0,totalRetrySyncs:0,totalWorkerPolls:0,totalUpdated:0,legacyCronRuns:0,byClient:[]},n=(t.byClient||[]).map(a=>`
    <article class="fb-lead-cron-client">
      <h3 class="fb-lead-cron-client-name">${esc(a.accountName||a.clientId)}</h3>
      <dl class="fb-lead-cron-client-meta">
        <div>
          <dt>Opps created</dt>
          <dd>${esc(String(a.opportunitiesCreated||0))}</dd>
        </div>
        <div>
          <dt>Webhook syncs</dt>
          <dd>${esc(String(a.webhookSyncs||0))}</dd>
        </div>
        <div>
          <dt>Retry syncs</dt>
          <dd>${esc(String(a.retrySyncs||0))}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>${esc(String(a.updated||0))}</dd>
        </div>
        <div>
          <dt>Last activity</dt>
          <dd>${esc(formatFbLeadCronLastRun(a.lastActivityAt))}</dd>
        </div>
      </dl>
    </article>
  `).join("");return`
    <section class="fb-lead-cron-summary" id="fb-lead-cron-summary-24h" aria-label="Auto-sync last 24 hours">
      <div class="fb-lead-cron-summary-top">
        <div class="fb-lead-cron-summary-intro">
          <span class="fb-lead-cron-summary-label">Auto-sync (last 24h)</span>
          <p class="fb-lead-cron-summary-headline">${esc(String(t.totalOpportunitiesCreated||0))} opportunities created \xB7 ${esc(String(t.totalUpdated||0))} contacts updated</p>
          <p class="fb-lead-cron-summary-sub">Webhook on new GHL opportunities, retry worker every 5 min, daily reconcile at 01:00 UTC. Retry worker polls: ${esc(String(t.totalWorkerPolls||0))}.</p>
        </div>
        <div class="fb-lead-cron-summary-totals" aria-label="24 hour totals">
          <div class="fb-lead-cron-total">
            <span class="fb-lead-cron-total-value">${esc(String(t.totalOpportunitiesCreated||0))}</span>
            <span class="fb-lead-cron-total-label">Opps created</span>
          </div>
          <div class="fb-lead-cron-total">
            <span class="fb-lead-cron-total-value">${esc(String(t.totalWebhookSyncs||0))}</span>
            <span class="fb-lead-cron-total-label">Webhook syncs</span>
          </div>
          <div class="fb-lead-cron-total">
            <span class="fb-lead-cron-total-value">${esc(String(t.totalRetrySyncs||0))}</span>
            <span class="fb-lead-cron-total-label">Retry syncs</span>
          </div>
          <div class="fb-lead-cron-total">
            <span class="fb-lead-cron-total-value">${esc(String(t.totalWorkerPolls||0))}</span>
            <span class="fb-lead-cron-total-label">Worker polls</span>
          </div>
        </div>
      </div>
      ${n?`<div class="fb-lead-cron-client-grid">${n}</div>`:""}
    </section>
  `}let fbLeadSyncRefreshTimer=null;function clientFbLeadFieldReady(e){const t=fbLeadSyncState.preflightByClient[e?.clientId];return!(t?.fbLeadFieldMissing===!0||t?.fbLeadFieldExists===!1)}function getClientFbLeadFieldHint(e){return(fbLeadSyncState.preflightByClient[e?.clientId]||{}).fbLeadFieldHint||'Create a contact custom field named "Fb Lead id" in GHL (Settings \u2192 Custom Fields \u2192 Contact), then click Refresh.'}function renderFbLeadFieldWarnings(e){const t=(e||[]).filter(n=>!clientFbLeadFieldReady(n));return t.length?t.map(n=>`
    <div class="fb-lead-field-warning" id="fb-lead-field-warning-${esc(n.clientId)}">
      <strong>${esc(n.accountName)} \u2014 Fb Lead id field missing in GHL</strong>
      <p>${esc(getClientFbLeadFieldHint(n))}</p>
      <div class="fb-lead-field-warning-actions">
        <a class="admin-btn admin-btn--secondary admin-btn--small" href="/admin/${encodeURIComponent(n.clientId)}">Open client setup</a>
        <button class="admin-btn admin-btn--ghost admin-btn--small" type="button" onclick="loadFbLeadSyncPage()">Refresh check</button>
      </div>
    </div>
  `).join(""):""}function renderFbLeadReadinessBadges(e){const t=fbLeadSyncState.preflightByClient[e.clientId]||{},n=clientFbLeadFieldReady(e)&&t.fbLeadFieldExists!==!1;return`<div class="fb-lead-readiness">${[{key:"metaPageId",label:"Page",ok:!!e.metaPageId},{key:"ghl",label:"GHL",ok:e.hasGhlToken&&e.locationId},{key:"metaToken",label:"Meta token",ok:e.hasMetaToken},{key:"field",label:"Fb Lead id",ok:n}].map(o=>`<span class="fb-lead-badge${o.ok?" is-ok":" is-missing"}">${esc(o.label)}</span>`).join("")}</div>`}function ghlContactUrl(e,t){return!e||!t?null:`https://app.gohighlevel.com/v2/location/${encodeURIComponent(e)}/contacts/detail/${encodeURIComponent(t)}`}function fbLeadRunHasLaterSuccessfulRun(e,t,{dryRunOnly:n=!1,applyOnly:a=!1}={}){const o=Date.parse(t.startedAt||"");return Number.isFinite(o)?(e||[]).some(r=>{if(r.id===t.id||r.clientId!==t.clientId||(r.mode||"recent")!==(t.mode||"recent")||n&&!r.dryRun||a&&r.dryRun)return!1;const s=String(r.status||"").toLowerCase();return s!=="success"&&s!=="ok"?!1:Date.parse(r.startedAt||"")>o}):!1}function fbLeadRunHasLaterApply(e,t){return fbLeadRunHasLaterSuccessfulRun(e,t,{applyOnly:!0})}function dryRunIsReadyForApply(e,t=fbLeadSyncState.historyRuns){return e?!!(e.dryRun&&String(e.status||"").toLowerCase()==="success"&&(e.updated||0)>0&&!fbLeadRunHasLaterApply(t,e)&&!fbLeadRunHasLaterSuccessfulRun(t,e,{dryRunOnly:!0})):!1}function findActionablePreviewRun(e,t="backfill",n=fbLeadSyncState.historyRuns){return(n||[]).filter(a=>a.clientId===e&&(a.mode||"backfill")===t&&dryRunIsReadyForApply(a,n)).sort((a,o)=>Date.parse(o.startedAt||"")-Date.parse(a.startedAt||""))[0]||null}function clientPreviewAllSynced(e){if(!e?.lastRun)return!1;const t=e.lastRun;return!!(t.dryRun&&(t.mode||"backfill")==="backfill"&&String(t.status||"").toLowerCase()==="success"&&(t.updated||0)===0&&!findActionablePreviewRun(e.clientId,"backfill"))}function clientHasReadyPreview(e){if(!e)return!1;const t=fbLeadSyncState.previewOkByClient[e.clientId];return t&&(t.updated||0)>0?!!findActionablePreviewRun(e.clientId,t.mode||"backfill"):!!findActionablePreviewRun(e.clientId,"backfill")}function clearFbLeadPreviewReady(e){delete fbLeadSyncState.previewOkByClient[e];try{const t=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");delete t[e],sessionStorage.setItem("fbLeadSyncPreviewOk",JSON.stringify(t))}catch{}}function markFbLeadPreviewReady(e,t,n){if((n||0)<=0){clearFbLeadPreviewReady(e);return}fbLeadSyncState.previewOkByClient[e]={mode:t,updated:n,at:Date.now()};try{const a=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");a[e]={mode:t,updated:n,at:Date.now()},sessionStorage.setItem("fbLeadSyncPreviewOk",JSON.stringify(a))}catch{}}function hydrateFbLeadPreviewState(e){try{const t=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");for(const[n,a]of Object.entries(t))(a?.updated||0)>0&&(fbLeadSyncState.previewOkByClient[n]=a)}catch{}for(const t of e||[]){const n=findActionablePreviewRun(t.clientId,"backfill");n?fbLeadSyncState.previewOkByClient[t.clientId]={mode:n.mode||"backfill",updated:n.updated||0,at:Date.parse(n.startedAt||"")||Date.now()}:clearFbLeadPreviewReady(t.clientId)}}function isPartialSyncRun(e){if(!e)return!1;const t=Number(e.batchOffset)||0,n=Number(e.inWindow)||0;if(n<=0||t<=0||t>=n)return!1;const a=String(e.status||"").toLowerCase();return a==="interrupted"||a==="error"||a==="running"}function findPartialSyncRun(e,t="backfill",n=!1){return(fbLeadSyncState.historyRuns||[]).find(a=>isPartialSyncRun(a)&&a.clientId===e&&!!a.dryRun==!!n&&(a.mode||"backfill")===t)||null}function partialSyncRemaining(e){return Math.max(0,(Number(e.inWindow)||0)-(Number(e.batchOffset)||0))}async function resumeFbLeadRunFromHistory(e){const t=fbLeadSyncState.historyRuns.find(s=>Number(s.id)===Number(e));if(!t||!isPartialSyncRun(t)){showToast("Nothing to resume for this run.","error");return}const n=fbLeadSyncState.clients.find(s=>s.clientId===t.clientId);if(!clientFbLeadFieldReady(n)){showToast(getClientFbLeadFieldHint(n),"error");return}const a=partialSyncRemaining(t),o=t.dryRun?"preview":"apply";window.confirm(`Resume interrupted ${o} for ${t.clientId}?

${t.updated||0} processed so far \xB7 ${a} lead(s) remaining.`)&&(fbLeadSyncState.activeRun={clientId:t.clientId,mode:t.mode||"backfill",runId:t.id,previewOk:!t.dryRun,previewRunId:t.dryRun?null:t.id},await runFbLeadSyncBatch({clientId:t.clientId,mode:t.mode||"backfill",dryRun:!!t.dryRun,resumeRunId:t.id}))}async function applyFbLeadSyncFromHistory(e){const t=fbLeadSyncState.historyRuns.find(a=>Number(a.id)===Number(e));if(!t){showToast("Run not found. Refresh the page.","error");return}const n=fbLeadSyncState.clients.find(a=>a.clientId===t.clientId);if(!clientFbLeadFieldReady(n)){showToast(getClientFbLeadFieldHint(n),"error");return}await applyFbLeadSync(t.clientId,t.mode||"backfill",{previewRunId:e})}async function applyFbLeadSync(e,t="backfill",{previewRunId:n=null}={}){if(fbLeadSyncState.applyingRunId!=null){showToast("An apply is already running. Wait for it to finish.","error");return}const a=fbLeadSyncState.clients.find(c=>c.clientId===e);if(!clientFbLeadFieldReady(a)){showToast(getClientFbLeadFieldHint(a),"error");return}const o=n!=null?fbLeadSyncState.historyRuns.find(c=>Number(c.id)===Number(n)):null,r=o?dryRunIsReadyForApply(o):clientHasReadyPreview(a);if(t==="backfill"&&!r){showToast("No completed preview found. Run Preview first.","error");return}const s=o?.updated??fbLeadSyncState.previewOkByClient[e]?.updated??a?.lastRun?.updated??0,i=findPartialSyncRun(e,t,!1);if(i){const c=partialSyncRemaining(i);if(!window.confirm(`An apply for ${e} was interrupted (${i.updated||0} already processed, ${c} remaining).

Resume the interrupted apply instead of starting over?`))return;fbLeadSyncState.activeRun={clientId:e,mode:t,runId:i.id,previewOk:!0,previewRunId:n},await runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!1,resumeRunId:i.id});return}window.confirm(`Apply ${t==="backfill"?"90-day backfill":"recent sync"} for ${e}?

${s} contact(s) will get Fb Lead id written in GHL. This writes live data.`)&&(fbLeadSyncState.activeRun={clientId:e,mode:t,runId:null,previewOk:!0,previewRunId:n},await runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!1}))}async function refreshFbLeadClientRowsUi(){const e=document.getElementById("fb-lead-clients-mount"),t=document.getElementById("fb-lead-field-warnings-mount");e&&(e.innerHTML=renderFbLeadClientRows(fbLeadSyncState.clients)),t&&(t.innerHTML=renderFbLeadFieldWarnings(fbLeadSyncState.clients)),bindFbLeadSyncToggles()}function renderFbLeadClientActions(e){const t=esc(e.clientId),n=e.metaPageId?"":`<a class="admin-btn admin-btn--ghost admin-btn--small" href="/admin/${encodeURIComponent(e.clientId)}">Setup</a>`;return`
    <div class="fb-lead-client-actions">
      <button class="admin-btn admin-btn--secondary admin-btn--small" type="button"
        onclick="openFbLeadRunPanel('${t}', 'recent')">Preview</button>
      <button class="admin-btn admin-btn--secondary admin-btn--small" type="button"
        onclick="openFbLeadRunPanel('${t}', 'backfill')">Backfill</button>
      <button class="admin-btn admin-btn--ghost admin-btn--small" type="button"
        onclick="viewFbLeadClientHistory('${t}')">View log</button>
      ${n}
    </div>
  `}function lastRunIsSuccessfulApply(e){if(!e||e.dryRun)return!1;const t=String(e.status||"").toLowerCase();return t==="success"||t==="ok"}function lastRunIsSuccessfulPreview(e){if(!e||!e.dryRun)return!1;const t=String(e.status||"").toLowerCase();return t==="success"||t==="ok"}function resolveFbLeadClientStats(e,t={}){const n=e?.displayStats||{},a=t.metaLeadCount90d??n.metaLeadCount90d??null,o=t.estimatedMissing??n.outstanding??null,r=t.estimatedMissing!=null?"Estimated contacts still missing Fb Lead id (from a Meta sample)":n.outstandingHint||"Estimated contacts still missing Fb Lead id (from a Meta sample)";return{metaLeads:a!=null?String(a):"\u2014",missing:o!=null?String(o):"\u2014",missingTitle:r}}function formatFbLeadLastRunLabel(e){if(!e)return"\u2014";const t=[e.dryRun?"preview":e.status,`${e.updated||0} ${e.dryRun?"would update":"updated"}`];return(e.skippedNoMatch??0)>0&&t.push(`${e.skippedNoMatch} no match`),t.join(" \xB7 ")}function renderFbLeadClientRows(e){return e.length?`
    <div class="sync-history-table-wrap">
      <table class="sync-history-table fb-lead-clients-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Auto-sync</th>
            <th>Ready?</th>
            <th>Meta leads (90d)</th>
            <th title="Before sync: estimated contacts missing Fb Lead id. After preview: would update count. After apply: Meta leads with no GHL match.">Outstanding</th>
            <th>Last run</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${e.map(n=>{const a=fbLeadSyncState.preflightByClient[n.clientId]||{},o=resolveFbLeadClientStats(n,a),r=formatFbLeadLastRunLabel(n.lastRun);return`
      <tr>
        <td>
          <strong>${esc(n.accountName)}</strong><br>
          <span style="color:var(--text-soft);font-size:12px">${esc(n.clientId)}</span>
        </td>
        <td>
          <input type="checkbox" class="fb-lead-toggle" data-fb-sync-toggle="${esc(n.clientId)}"
            ${n.fbLeadSyncEnabled?"checked":""} aria-label="Enable auto-sync for ${esc(n.accountName)}" />
        </td>
        <td>${renderFbLeadReadinessBadges(n)}</td>
        <td>${esc(o.metaLeads)}</td>
        <td title="${esc(o.missingTitle||"")}">${esc(o.missing)}</td>
        <td>${esc(r)}</td>
        <td class="fb-lead-client-actions-cell">${renderFbLeadClientActions(n)}</td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `:'<div class="sync-history-empty">No clients configured yet.</div>'}function renderFbLeadClientRowsWrapper(e){return`<div id="fb-lead-clients-mount">${renderFbLeadClientRows(e)}</div>`}function renderFbLeadHistoryRows(e,t={}){const n=getFbLeadHistoryRunsForDisplay(e);if(!n.length){const o=fbLeadSyncState.showRoutineCronRuns?0:(e||[]).filter(r=>isRoutineSuccessfulCronRun(r)).length;return o>0?`<div class="sync-history-empty">${o} routine auto-sync run(s) hidden \u2014 enable <strong>Show routine auto-sync runs</strong> above to view them.</div>`:'<div class="sync-history-empty">No FB lead sync runs logged yet.</div>'}return e=n,`
    <div class="sync-history-table-wrap">
      <table class="sync-history-table">
        <thead>
          <tr>
            <th>Started</th>
            <th>Client</th>
            <th>Status</th>
            <th>Mode</th>
            <th>Source</th>
            <th>Summary</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${e.map(o=>{const r=[o.mode,o.dryRun?"dry-run":"apply",o.dryRun?`${o.updated||0} would update`:`${o.updated||0} updated`,`${o.skippedNoMatch||0} no match`,o.errors?`${o.errors} errors`:null].filter(Boolean).join(" \xB7 "),s=dryRunIsReadyForApply(o,e)&&!fbLeadSyncState.isApplying,i=isPartialSyncRun(o)&&!fbLeadSyncState.isApplying,l=fbLeadSyncState.isApplying&&fbLeadSyncState.applyingRunId===o.id,c=renderSyncStatusBadge(l?"applying":o.status);return`
      <tr class="fb-lead-audit-row${l?" is-applying":""}">
        <td>${esc(formatSyncHistoryTimestamp(o.startedAt))}</td>
        <td>${esc(o.accountName||o.clientId)}</td>
        <td>${c}</td>
        <td>${esc(o.mode||"recent")}</td>
        <td>${esc(formatSyncSource(o.source))}</td>
        <td class="sync-history-detail">${esc(r)}</td>
        <td>
          <div class="fb-lead-history-actions">
            ${l?'<span class="fb-lead-history-status-note">In progress above</span>':i?`<button class="admin-btn admin-btn--primary admin-btn--small" type="button" onclick="resumeFbLeadRunFromHistory(${Number(o.id)})">Resume (${partialSyncRemaining(o)})</button>`:s?`<button class="admin-btn admin-btn--primary admin-btn--small" type="button" data-fb-apply-run="${Number(o.id)}" data-apply-count="${Number(o.updated||0)}" onclick="applyFbLeadSyncFromHistory(${Number(o.id)})">Apply (${o.updated})</button>`:""}
            <button class="admin-btn admin-btn--ghost admin-btn--small" type="button" onclick="expandFbLeadRun(${Number(o.id)})">Audit</button>
            ${isStaffAdmin()?`<button class="admin-btn admin-btn--ghost admin-btn--small" type="button" onclick="deleteFbLeadRun(${Number(o.id)})">Delete</button>`:""}
          </div>
        </td>
      </tr>
      <tr id="fb-lead-run-audit-${Number(o.id)}" hidden>
        <td colspan="7"><div class="fb-lead-audit-scroll" id="fb-lead-audit-scroll-${Number(o.id)}">${renderFbLeadAuditTable(o.rows||[],t[o.clientId])}</div></td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `}function renderFbLeadAuditTable(e,t){if(!e.length)return'<div class="sync-history-empty" style="padding:12px">No contact-level rows stored for this run.</div>';const n=e.map(o=>{const r=ghlContactUrl(t,o.contactId),s=r?`<a href="${esc(r)}" target="_blank" rel="noopener noreferrer">Open in GHL</a>`:"\u2014";return`
      <tr>
        <td>${esc(o.email||o.phone||"\u2014")}</td>
        <td><code>${esc(o.metaLeadId||"\u2014")}</code></td>
        <td>${esc(o.contactId||"\u2014")}</td>
        <td>${renderSyncStatusBadge(o.status)}</td>
        <td>${esc(o.error||"")}</td>
        <td>${s}</td>
      </tr>
    `}).join(""),a=e.length===1?"1 contact row":`${e.length} contact rows`;return`
    <div class="fb-lead-audit-scroll-inner">
      <p style="color:var(--text-soft);font-size:12px;margin:0 0 8px;padding:8px 8px 0">${esc(a)} \u2014 scroll inside panel</p>
      <table class="sync-history-table">
        <thead>
          <tr>
            <th>Email / phone</th>
            <th>Meta lead id</th>
            <th>GHL contact</th>
            <th>Status</th>
            <th>Error</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${n}</tbody>
      </table>
    </div>
  `}function renderFbLeadSyncPage(e){const t=e.summary||{};return`
    ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero">
      <div class="admin-breadcrumb">
        <a href="/admin">Clients</a>
        <span aria-hidden="true"> / </span>
        <span>FB lead sync</span>
      </div>
      <h1>Facebook Lead ID sync</h1>
      <p>Match Meta Lead Ads to GHL contacts and write the <code>Fb Lead id</code> custom field. Run logs older than 3 days are auto-deleted.</p>
    </div>
    <div class="sync-history-page">
      <div class="sync-history-toolbar">
        <div class="sync-history-toolbar-actions">
          <a class="admin-btn admin-btn--secondary" href="/admin">\u2190 Back to clients</a>
        </div>
        <div class="sync-history-toolbar-actions">
          <button class="admin-btn admin-btn--secondary" type="button" id="fb-lead-sync-refresh">${ICON_SYNC} Refresh</button>
        </div>
      </div>
      <div class="sync-history-summary">
        <div class="sync-history-stat">
          <div class="sync-history-stat-label">Last auto-sync run</div>
          <div class="sync-history-stat-value">${esc(formatSyncHistoryTimestamp(t.lastRunAt))}</div>
        </div>
        <div class="sync-history-stat">
          <div class="sync-history-stat-label">Applied last 24h (live)</div>
          <div class="sync-history-stat-value">${esc(String(t.updatedLast24h??0))}</div>
        </div>
        <div class="sync-history-stat">
          <div class="sync-history-stat-label">Auto-sync enabled</div>
          <div class="sync-history-stat-value">${esc(String(t.enabledCount??0))} client(s)</div>
        </div>
        <div class="sync-history-stat">
          <div class="sync-history-stat-label">Schedule</div>
          <div class="sync-history-stat-value" style="font-size:13px;font-family:monospace">${esc(t.schedule||"Webhook + 5m Vercel cron \xB7 daily reconcile (01:00 UTC)")}</div>
        </div>
      </div>
      ${renderFbLeadCronSummary24h(t.cronSummary24h)}
      <h2 style="font-size:16px;margin:18px 0 10px">Clients</h2>
      <div id="fb-lead-field-warnings-mount">${renderFbLeadFieldWarnings(e.clients||[])}</div>
      ${renderFbLeadClientRowsWrapper(e.clients||[])}
      <div id="fb-lead-run-panel-mount"></div>
      <div id="fb-lead-apply-progress-mount"></div>
      <div class="section-heading-row">
        <h2>Run history</h2>
        <div class="section-heading-actions">
          <label class="fb-lead-history-toggle" style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--text-soft);cursor:pointer;margin-right:8px">
            <input type="checkbox" id="fb-lead-show-routine-cron" ${fbLeadSyncState.showRoutineCronRuns?"checked":""} />
            Show routine auto-sync runs
          </label>
          ${isStaffAdmin()?`
            <button
              class="admin-btn admin-btn--secondary admin-btn--small"
              type="button"
              id="fb-lead-history-clear-all"
              ${(fbLeadSyncState.historyRuns||[]).length?"":"disabled"}
            >Delete all history</button>
          `:""}
        </div>
      </div>
      <div id="fb-lead-history-mount">${renderFbLeadHistoryRows(fbLeadSyncState.historyRuns)}</div>
    </div>
    `)}
  `}async function toggleFbLeadSyncEnabled(e,t){try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"PUT",body:JSON.stringify({fbLeadSyncEnabled:t})}),showToast(t?"Automatic FB lead sync enabled":"Automatic FB lead sync disabled","success");const n=fbLeadSyncState.clients.find(a=>a.clientId===e);n&&(n.fbLeadSyncEnabled=t)}catch(n){showToast(n.message||"Failed to update auto-sync setting.","error"),await loadFbLeadSyncPage({silent:!0})}}function bindFbLeadSyncToggles(){document.querySelectorAll("[data-fb-sync-toggle]").forEach(e=>{e.onchange=()=>toggleFbLeadSyncEnabled(e.dataset.fbSyncToggle,e.checked)})}async function loadFbLeadPreflightForClients(e,{quick:t=!1}={}){const n=t?"&quick=1":"";await Promise.all((e||[]).map(async a=>{const o=fbLeadSyncState.preflightByClient[a.clientId]||{};try{const r=await adminFetch(`/api/fb-lead-sync/preflight?client=${encodeURIComponent(a.clientId)}${n}`);fbLeadSyncState.preflightByClient[a.clientId]=t?{...r,metaLeadCount90d:r.metaLeadCount90d??o.metaLeadCount90d??null,estimatedMissing:r.estimatedMissing??o.estimatedMissing??null,sampleSize:r.sampleSize||o.sampleSize||0,sampleWouldUpdate:r.sampleWouldUpdate??o.sampleWouldUpdate??0}:r}catch(r){fbLeadSyncState.preflightByClient[a.clientId]={...o,preflightError:r.message}}}))}function scheduleFbLeadFullPreflight(e){e?.length&&loadFbLeadPreflightForClients(e,{quick:!1}).then(()=>refreshFbLeadClientRowsUi()).catch(()=>{})}async function loadFbLeadHistory(e=50){const t=await adminFetch(`/api/fb-lead-sync/history?limit=${e}`);return fbLeadSyncState.historyRuns=t.runs||[],t}function renderFbLeadRunPanel(e,t="recent"){const n=fbLeadSyncState.clients.find(r=>r.clientId===e),a=clientHasReadyPreview(n),o=t==="backfill"?"Backfill (90 days)":"Recent (2 days)";return`
    <div class="fb-lead-run-panel" id="fb-lead-run-panel">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <strong>${esc(n?.accountName||e)}</strong>
          <div style="color:var(--text-soft);font-size:13px;margin-top:4px">${esc(o)}</div>
        </div>
        <button class="admin-btn admin-btn--ghost" type="button" onclick="closeFbLeadRunPanel()">Close</button>
      </div>
      ${t==="backfill"&&a?'<div class="fb-lead-banner" style="margin-top:12px;margin-bottom:0;background:#e8f7ef;border-color:#b8e6cf;color:#138b53">Preview complete \u2014 use <strong>Apply</strong> on that run in <strong>Run history</strong> below.</div>':t==="backfill"&&clientPreviewAllSynced(n)?'<div class="fb-lead-banner" style="margin-top:12px;margin-bottom:0;background:#e8f7ef;border-color:#b8e6cf;color:#138b53">All contacts already have <strong>Fb Lead id</strong> \u2014 nothing to apply.</div>':t==="backfill"?'<div class="fb-lead-banner" style="margin-top:12px;margin-bottom:0">Run Preview first. Backfill only matches leads Meta still has (~90 days).</div>':""}
      <div class="fb-lead-run-actions">
        <button class="admin-btn admin-btn--secondary" type="button" id="fb-lead-preview-btn">Preview (dry run)</button>
      </div>
      <div class="fb-lead-progress-wrap" id="fb-lead-progress-wrap" hidden>
        <div class="fb-lead-progress-label" id="fb-lead-progress-label">Starting\u2026</div>
        <div class="fb-lead-progress" id="fb-lead-progress">
          <div class="fb-lead-progress-bar" id="fb-lead-progress-bar"></div>
        </div>
      </div>
      <div id="fb-lead-run-results" style="margin-top:12px"></div>
    </div>
  `}function closeFbLeadRunPanel(){const e=document.getElementById("fb-lead-run-panel-mount");e&&(e.innerHTML=""),fbLeadSyncState.activeRun=null}function openFbLeadRunPanel(e,t){const n=fbLeadSyncState.clients.find(r=>r.clientId===e);if(!clientFbLeadFieldReady(n)){showToast(getClientFbLeadFieldHint(n),"error");return}const a=document.getElementById("fb-lead-run-panel-mount");if(!a)return;fbLeadSyncState.activeRun={clientId:e,mode:t,runId:null,previewOk:clientHasReadyPreview(fbLeadSyncState.clients.find(r=>r.clientId===e))},a.innerHTML=renderFbLeadRunPanel(e,t);const o=document.getElementById("fb-lead-preview-btn");o&&(o.onclick=()=>runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!0})),a.scrollIntoView({behavior:"smooth",block:"nearest"})}function renderFbLeadRunResults(e){const t=e.rows||[];if(!t.length)return'<div class="sync-history-empty" style="padding:12px">No rows in this batch.</div>';const n=t.map(r=>`
    <tr>
      <td>${esc(r.email||r.phone||"\u2014")}</td>
      <td><code>${esc(r.metaLeadId||"\u2014")}</code></td>
      <td>${esc(r.contactId||"\u2014")}</td>
      <td>${renderSyncStatusBadge(r.status)}</td>
    </tr>
  `).join(""),a=e.nextBatchOffset??(e.batchOffset||0)+(e.batchProcessed||0),o=e.inWindow||a;return`
    <div class="fb-lead-audit-scroll">
      <table class="sync-history-table">
        <thead><tr><th>Email / phone</th><th>Meta lead id</th><th>GHL contact</th><th>Status</th></tr></thead>
        <tbody>${n}</tbody>
      </table>
    </div>
    <p style="color:var(--text-soft);font-size:12px;margin-top:8px">
      ${a} / ${o} leads scanned \xB7 ${e.updated||0} would update/updated \xB7 ${e.errors||0} errors
    </p>
  `}function renderGlobalApplyProgress(e,t,n=0){const a=fbLeadSyncState.clients.find(s=>s.clientId===e),o=t==="backfill"?"90-day backfill":"recent sync",r=n>0?`${n} contact(s)`:"contacts";return`
    <div class="fb-lead-apply-progress-card" id="fb-lead-global-progress-card">
      <div class="fb-lead-apply-progress-header">
        <div>
          <strong>Writing to GHL \u2014 ${esc(o)}</strong>
          <div class="fb-lead-apply-progress-sub">${esc(a?.accountName||e)} \xB7 ${esc(r)}</div>
        </div>
        <span class="fb-lead-badge is-ok" id="fb-lead-apply-status-badge">Running</span>
      </div>
      <div class="fb-lead-apply-progress-stats" id="fb-lead-global-progress-stats">Preparing\u2026</div>
      <div class="fb-lead-progress is-visible is-indeterminate" id="fb-lead-global-progress">
        <div class="fb-lead-progress-bar" id="fb-lead-global-progress-bar"></div>
      </div>
      <div class="fb-lead-progress-label" id="fb-lead-global-progress-label">Starting apply \u2014 do not close this page</div>
    </div>
  `}function startGlobalApplyProgress(e,t,n=0){const a=document.getElementById("fb-lead-apply-progress-mount");a&&(fbLeadSyncState.isApplying=!0,fbLeadSyncState.applyStartedAt=Date.now(),fbLeadSyncState.applyProgress=null,a.innerHTML=renderGlobalApplyProgress(e,t,n),a.scrollIntoView({behavior:"smooth",block:"nearest"}),fbLeadSyncState.applyWaitTimer&&clearInterval(fbLeadSyncState.applyWaitTimer),fbLeadSyncState.applyWaitTimer=window.setInterval(()=>{if(!fbLeadSyncState.isApplying)return;const o=Math.floor((Date.now()-fbLeadSyncState.applyStartedAt)/1e3),r=fbLeadSyncState.applyProgress;r?.total>0?updateGlobalApplyProgress({...r,waiting:!0,elapsed:o}):updateGlobalApplyProgress({waiting:!0,elapsed:o})},1e3))}function updateGlobalApplyProgress({processed:e,total:t,written:n,waiting:a=!1,elapsed:o=0,complete:r=!1,error:s=""}={}){const i=document.getElementById("fb-lead-global-progress-card"),l=document.getElementById("fb-lead-global-progress"),c=document.getElementById("fb-lead-global-progress-bar"),d=document.getElementById("fb-lead-global-progress-label"),u=document.getElementById("fb-lead-global-progress-stats"),p=document.getElementById("fb-lead-apply-status-badge");if(!i||!l||!c||!d)return;const h=fbLeadSyncState.applyProgress||{},g=e??h.processed??0,b=t??h.total??0,y=n??h.written??0;!r&&!s&&(b>0||g>0)&&(fbLeadSyncState.applyProgress={processed:g,total:b,written:y});const m=b>0||g>0;if(a&&!m&&!r){l.classList.add("is-indeterminate"),c.style.width="35%",u&&(u.textContent="Contacting Meta and GHL\u2026"),d.textContent=`Writing to GHL\u2026 (${o}s \u2014 do not close this page)`;return}l.classList.remove("is-indeterminate");const f=b>0?Math.min(100,Math.round(g/b*100)):r?100:0;c.style.width=`${f}%`,u&&(u.textContent=r?`${y} written to GHL \xB7 ${g} / ${b} contacts processed`:`${y} written \xB7 ${g} / ${b} contacts (${f}%)`),r?(i.classList.add("is-complete"),i.classList.remove("is-error"),d.textContent=`Complete \u2014 ${y} contact(s) updated in GHL`,p&&(p.textContent="Complete",p.classList.add("is-ok"),p.classList.remove("is-missing"))):s?(i.classList.add("is-error"),i.classList.remove("is-complete"),d.textContent=s,p&&(p.textContent="Failed",p.classList.remove("is-ok"),p.classList.add("is-missing"))):a&&m?d.textContent=g>=b?`Finishing up\u2026 (${o}s)`:`Batch in progress \u2014 ${g} / ${b} leads (${f}%) \xB7 ${o}s`:d.textContent=`Writing to GHL \u2014 ${g} / ${b} leads (${f}%)`}function stopGlobalApplyProgress({success:e=!0,keepVisibleMs:t=6e3}={}){fbLeadSyncState.isApplying=!1,fbLeadSyncState.applyProgress=null,fbLeadSyncState.applyWaitTimer&&(clearInterval(fbLeadSyncState.applyWaitTimer),fbLeadSyncState.applyWaitTimer=null),window.setTimeout(()=>{const n=document.getElementById("fb-lead-apply-progress-mount");n&&!fbLeadSyncState.isApplying&&(n.innerHTML="")},t)}function setFbLeadProgress({processed:e=0,total:t=0,complete:n=!1,label:a=""}={}){const o=document.getElementById("fb-lead-progress-wrap"),r=document.getElementById("fb-lead-progress-bar"),s=document.getElementById("fb-lead-progress-label");if(!o||!r)return;o.hidden=!1,o.classList.toggle("is-complete",n);const i=t>0?Math.min(100,Math.round(e/t*100)):n?100:0;r.style.width=`${i}%`,s&&(s.textContent=a||(n?`Complete \u2014 ${e} / ${t} leads (${i}%)`:`Processing \u2014 ${e} / ${t} leads (${i}%)`))}function hideFbLeadProgress(e=!0){const t=document.getElementById("fb-lead-progress-wrap"),n=document.getElementById("fb-lead-progress-bar");t&&e&&(t.hidden=!0,t.classList.remove("is-complete"),n&&(n.style.width="0%"))}function updateFbLeadHistoryClearButton(){const e=document.getElementById("fb-lead-history-clear-all");if(!e)return;const t=(fbLeadSyncState.historyRuns||[]).length>0;e.disabled=!t}function updateFbLeadCronSummaryUi(){const e=document.getElementById("fb-lead-cron-summary-24h");!e||!fbLeadSyncState.cronSummary24h||(e.outerHTML=renderFbLeadCronSummary24h(fbLeadSyncState.cronSummary24h))}async function refreshFbLeadHistoryUi(){await loadFbLeadHistory();const e=document.getElementById("fb-lead-history-mount");if(!e)return;const t=Object.fromEntries(fbLeadSyncState.clients.map(n=>[n.clientId,n.locationId]));e.innerHTML=renderFbLeadHistoryRows(fbLeadSyncState.historyRuns,t),updateFbLeadHistoryClearButton()}function bindFbLeadHistoryClearButton(){const e=document.getElementById("fb-lead-history-clear-all");e&&(e.onclick=()=>clearFbLeadSyncHistory());const t=document.getElementById("fb-lead-show-routine-cron");t&&(t.checked=fbLeadSyncState.showRoutineCronRuns,t.onchange=()=>{fbLeadSyncState.showRoutineCronRuns=t.checked;const n=document.getElementById("fb-lead-history-mount");if(!n)return;const a=Object.fromEntries(fbLeadSyncState.clients.map(o=>[o.clientId,o.locationId]));n.innerHTML=renderFbLeadHistoryRows(fbLeadSyncState.historyRuns,a)}),updateFbLeadHistoryClearButton()}async function clearFbLeadSyncHistory(){if(!(!isStaffAdmin()||!window.confirm(`Delete all FB lead sync run history?

This only clears the log \u2014 it does not change GHL contacts or Meta data.`)))try{const t=await adminFetch("/api/fb-lead-sync/history",{method:"DELETE"});showToast(`Cleared ${t.deleted||0} run(s).`,"success"),await refreshFbLeadHistoryUi(),await loadFbLeadSyncPage({silent:!0})}catch(t){showToast(t.message||"Failed to clear FB lead sync log.","error")}}async function deleteFbLeadRun(e){if(!(!isStaffAdmin()||!window.confirm(`Delete run #${e} from history?`)))try{await adminFetch(`/api/fb-lead-sync/history/${e}`,{method:"DELETE"}),showToast("Run deleted.","success"),await refreshFbLeadHistoryUi(),await loadFbLeadSyncPage({silent:!0})}catch(n){showToast(n.message||"Failed to delete run.","error")}}async function runFbLeadSyncBatch({clientId:e,mode:t,dryRun:n,resumeRunId:a=null}){const o=document.getElementById("fb-lead-preview-btn"),r=document.getElementById("fb-lead-run-results");o&&(o.disabled=!0);const s=n?12:10,i=a!=null?fbLeadSyncState.historyRuns.find(y=>Number(y.id)===Number(a)):null;let l=i?.id||fbLeadSyncState.activeRun?.runId||null,c=i&&Number(i.batchOffset)||0,d=null,u=[],p=!1;const h=a??fbLeadSyncState.activeRun?.previewRunId??null,g=h!=null?fbLeadSyncState.historyRuns.find(y=>Number(y.id)===Number(h)):null,b=i?partialSyncRemaining(i):g?.updated??fbLeadSyncState.previewOkByClient[e]?.updated??0;n||(fbLeadSyncState.applyingRunId=h,startGlobalApplyProgress(e,t,b),await refreshFbLeadHistoryUi());try{if(!a){const $=findPartialSyncRun(e,t,n);if($){const w=partialSyncRemaining($),S=n?"preview":"apply";window.confirm(`A ${S} for ${e} was interrupted (${$.updated||0} processed, ${w} remaining).

Resume the interrupted ${S}?`)&&(l=$.id,c=Number($.batchOffset)||0)}}if(n?setFbLeadProgress({processed:c,total:0,label:c>0?"Resuming preview\u2026":"Fetching Meta leads\u2026"}):updateGlobalApplyProgress({waiting:!0,elapsed:0}),n&&c===0){const $=await adminFetchWithRetry("/api/fb-lead-sync/prepare",{method:"POST",body:JSON.stringify({clientId:e,mode:t,dryRun:n,runId:l})}),w=$.summary||$;l=w.runId,c=0,setFbLeadProgress({processed:0,total:w.inWindow||0,label:`Matching ${w.inWindow||0} Meta leads to GHL\u2026`})}else!n&&c===0&&updateGlobalApplyProgress({waiting:!1,processed:0,total:b||g?.updated||0});do{d=await adminFetchWithRetry("/api/fb-lead-sync/run",{method:"POST",body:JSON.stringify({clientId:e,mode:t,dryRun:n,runId:l,previewRunId:n?null:h,batchOffset:c,batchLimit:s})});const $=d.summary||d;l=$.runId,c=$.nextBatchOffset??$.batchOffset+($.batchProcessed||0),u=u.concat($.rows||[]),fbLeadSyncState.activeRun&&(fbLeadSyncState.activeRun.runId=l);const w=$.inWindow||c||b;n?(setFbLeadProgress({processed:c,total:w,complete:!$.hasMore}),r&&(r.innerHTML=renderFbLeadRunResults({...$,rows:u}))):updateGlobalApplyProgress({processed:c,total:w,written:$.updated||0,complete:!$.hasMore})}while((d.summary||d).hasMore);p=!0;const y=d.summary||d,m=y.inWindow||c||b,f=y.nextBatchOffset??c;if(n)setFbLeadProgress({processed:f,total:m,complete:!0}),markFbLeadPreviewReady(e,t,y.updated),fbLeadSyncState.activeRun&&(fbLeadSyncState.activeRun.previewOk=(y.updated||0)>0),showToast((y.updated||0)>0?"Preview complete \u2014 use Apply in Run history below.":"Preview complete \u2014 all contacts already have Fb Lead id. Nothing to apply.","success"),await refreshFbLeadHistoryUi(),document.getElementById("fb-lead-history-mount")?.scrollIntoView({behavior:"smooth",block:"nearest"});else{updateGlobalApplyProgress({processed:f,total:m,written:y.updated||0,complete:!0}),delete fbLeadSyncState.previewOkByClient[e];try{const $=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");delete $[e],sessionStorage.setItem("fbLeadSyncPreviewOk",JSON.stringify($))}catch{}showToast("FB lead sync complete \u2014 Fb Lead id written to GHL","success"),stopGlobalApplyProgress({success:!0})}await refreshFbLeadHistoryUi();const v=await adminFetch("/api/fb-lead-sync");fbLeadSyncState.clients=v.clients||[],hydrateFbLeadPreviewState(fbLeadSyncState.clients),await refreshFbLeadClientRowsUi()}catch(y){n?hideFbLeadProgress(!0):(updateGlobalApplyProgress({error:`Failed \u2014 ${y.message||"Apply failed"}`}),stopGlobalApplyProgress({success:!1,keepVisibleMs:12e3})),showToast((y.message||(n?"FB lead preview failed.":"FB lead apply failed."))+(n?" Partial progress is saved \u2014 use Resume in Run history or try Preview again.":" Partial progress is saved \u2014 use Resume in Run history."),"error"),await refreshFbLeadHistoryUi()}finally{o&&(o.disabled=!1),fbLeadSyncState.applyingRunId=null,!p&&n&&hideFbLeadProgress(!0),!n&&!p&&(fbLeadSyncState.isApplying=!1,await refreshFbLeadHistoryUi())}}async function expandFbLeadRun(e){const t=document.getElementById(`fb-lead-run-audit-${e}`);if(t){if(!t.hidden){t.hidden=!0;return}try{const n=await adminFetch(`/api/fb-lead-sync/history/${e}`),a=fbLeadSyncState.clients.find(r=>r.clientId===n.run.clientId);t.innerHTML=`<td colspan="7"><div class="fb-lead-audit-scroll" id="fb-lead-audit-scroll-${e}">${renderFbLeadAuditTable(n.run.rows||[],n.run.locationId||a?.locationId)}</div></td>`,t.hidden=!1;const o=document.getElementById(`fb-lead-audit-scroll-${e}`);o&&o.scrollIntoView({behavior:"smooth",block:"nearest"})}catch(n){showToast(n.message||"Failed to load run audit.","error")}}}function viewFbLeadClientHistory(e){const t=getFbLeadHistoryRunsForDisplay(fbLeadSyncState.historyRuns.filter(o=>o.clientId===e)),n=document.getElementById("fb-lead-history-mount");if(!n)return;const a=Object.fromEntries(fbLeadSyncState.clients.map(o=>[o.clientId,o.locationId]));n.innerHTML=t.length?renderFbLeadHistoryRows(t,a):`<div class="sync-history-empty">No runs for ${esc(e)} yet.</div>`,n.scrollIntoView({behavior:"smooth",block:"start"})}async function loadFbLeadSyncPage({silent:e=!1,fullPreflight:t=!1}={}){const n=document.getElementById("dashboard");if(!n)return;const a=await fetchStaffMe();if(!a){e||(n.innerHTML=`
        ${renderBrandTopbar("")}
        ${wrapDashboardShell(`
          <div class="page-hero admin-hub-hero"><h1>FB lead sync</h1><p>Sign in to manage FB lead ID sync.</p></div>
          <div class="sync-history-page">
            <div class="sync-history-empty" style="padding:24px;text-align:center">
              <a class="admin-btn admin-btn--primary" href="/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}">Sign in</a>
            </div>
          </div>
        `)}
      `);return}currentStaffUser=a,e||(n.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading FB lead sync...</p></div>')}
    `);try{if(e&&fbLeadSyncState.isApplying)return;const[o]=await Promise.all([adminFetch("/api/fb-lead-sync"),loadFbLeadHistory()]);if(fbLeadSyncState.clients=o.clients||[],fbLeadSyncState.cronSummary24h=o.summary?.cronSummary24h||null,hydrateFbLeadPreviewState(fbLeadSyncState.clients),!e){n.innerHTML=renderFbLeadSyncPage(o),bindFbLeadSyncToggles();const r=document.getElementById("fb-lead-sync-refresh");r&&(r.onclick=()=>loadFbLeadSyncPage({fullPreflight:!0})),bindFbLeadHistoryClearButton(),fbLeadSyncRefreshTimer&&(clearInterval(fbLeadSyncRefreshTimer),fbLeadSyncRefreshTimer=null),fbLeadSyncRefreshTimer=window.setInterval(()=>{loadFbLeadSyncPage({silent:!0}).catch(()=>{})},6e4)}(!e||t)&&await loadFbLeadPreflightForClients(fbLeadSyncState.clients,{quick:!t}),e?(updateFbLeadCronSummaryUi(),await refreshFbLeadHistoryUi(),await refreshFbLeadClientRowsUi()):await refreshFbLeadClientRowsUi(),t?(await loadFbLeadPreflightForClients(fbLeadSyncState.clients,{quick:!1}),await refreshFbLeadClientRowsUi()):e||scheduleFbLeadFullPreflight(fbLeadSyncState.clients)}catch(o){e||(n.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(o.message)}</div>`)}
      `)}}const metaReportsState={filter:"all",searchQuery:"",dashboardData:null,hubMounted:!1,clientPayload:null,clientPageMounted:!1,clientReportSettingsExpanded:!1,clientShareExpanded:!1,clientExcelSheetExpanded:!1,clientToplineDraftMode:null,clientToplineModalPayload:null,activeMonthKey:null,selectedYear:new Date().getFullYear(),publicPayload:null,publicPageMounted:!1,chartInstances:{roas:null,poas:null},chartScatterInstances:{roas:null,poas:null},chartTab:"trend",chartRoasMode:"kr",chartPoasMode:"kr",chartScatterRoasMode:"kr",chartScatterPoasMode:"kr",chartScenarioRoasMode:"x",chartScenarioPoasMode:"x",chartSeries:null,scenarioSeries:null,scenarioSourcePayload:null,chartDemo:!1,chartProjection:null,spendChartType:"area",scenarioChartInstances:{roas:null,poas:null},budgetMultiplier:2,budgetBaseline:"year",scenarioMonthWindow:"6",scenarioSmoothUneven:!0,scenarioBlendHistory:!1,scenarioIncludeTrend:!1,comparisonMode:"mom",comparisonPeriodA:{startDate:null,endDate:null},comparisonPeriodB:{startDate:null,endDate:null},comparisonChartMode:"kr",comparisonTab:"table",reportViewMode:"monthly",comparisonYearCache:{},comparisonResult:null,comparisonLoading:!1,comparisonDatePickers:[],comparisonMonthMenuListenerBound:!1,comparisonChartInstance:null,customValues:{mounted:!1,overview:null,searchQuery:"",selectedClientId:null,selectedMonthKey:null,editorPayload:null,draftInputs:null,loadingEditor:!1,saving:!1,settingsSaving:!1,settingsSavingScope:null},ghlClients:{mounted:!1,data:null,savingClientId:null},clientToplineSaving:!1},META_HUB_FILTER_OPTIONS=[{value:"all",label:"All"},{value:"enabled",label:"Live reports"},{value:"meta-only",label:"Meta only"},{value:"needs-setup",label:"Needs setup"}];function metaHubClientInitial(e){const t=String(e||"?").trim();return esc(t.charAt(0).toUpperCase())}function filterMetaReportsClients(e,t,n=""){let a=e||[];t==="enabled"&&(a=a.filter(r=>r.metaReportEnabled)),t==="meta-only"&&(a=a.filter(r=>!clientUsesCenhubMetaReportTopline(r))),t==="needs-setup"&&(a=a.filter(r=>r.needsSetup));const o=String(n||"").trim().toLowerCase();return o&&(a=a.filter(r=>[r.accountName,r.metaAdAccountId,r.clientId,r.metaName].filter(Boolean).join(" ").toLowerCase().includes(o))),a}function getMetaReportsHubView(e,t,n=metaReportsState.searchQuery){const a=e?.clients||[],o=filterMetaReportsClients(a,t,n),r=e?.summary||{};return{clients:o,allClients:a,summary:{...r,totalListed:a.length},meta:e?.meta||{},filter:t,searchQuery:n}}function renderMetaHubSwitch({label:e,attr:t,value:n,checked:a,disabled:o=!1}){return n?`
    <label class="meta-hub-switch${o?" is-disabled":""}">
      <span class="meta-hub-switch-label">${esc(e)}</span>
      <span class="meta-hub-switch-track">
        <input type="checkbox" class="meta-hub-switch-input" ${t}="${esc(n)}" ${a?"checked":""} ${o?"disabled":""} aria-label="${esc(e)}" />
        <span class="meta-hub-switch-thumb"></span>
      </span>
    </label>
  `:`<div class="meta-hub-switch is-disabled"><span class="meta-hub-switch-label">${esc(e)}</span><span class="meta-report-muted">\u2014</span></div>`}function metaReportFullUrl(e){return e?`${window.location.origin}${e}`:""}function normalizeMetaReportSlugInput(e){return String(e||"").trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}function resolveMetaReportShareSlug(e){const t=e.settings||{};if(t.metaReportSlug)return t.metaReportSlug;const a=String(e.reportUrl||"").replace(/^\/report\//,"").match(/^(.+)-(\d{4})$/);return a?a[1]:""}function resolveMetaReportShareCode(e){const n=String(e.reportUrl||"").replace(/^\/report\//,"").match(/-(\d{4})$/);return n?n[1]:""}function closeMetaReportModal(){metaReportsState.clientReportSettingsExpanded&&document.getElementById("meta-report-fee-editor")&&syncMetaReportBottomlineFeeDom(metaReportsState.clientPayload?.settings||{},"meta-report"),document.getElementById("meta-report-modal-root")?.remove(),document.body.classList.remove("meta-report-modal-open"),metaReportsState.clientShareExpanded=!1,metaReportsState.clientExcelSheetExpanded=!1,metaReportsState.clientReportSettingsExpanded=!1,syncMetaReportControlPanelUi()}function openMetaReportModal(e,{wizard:t=!1,wide:n=!1}={}){closeMetaReportModal();const a=document.createElement("div");a.id="meta-report-modal-root",a.className="meta-report-modal-root";const o=["meta-report-modal",t?"is-wizard":"",n?"is-wide":""].filter(Boolean).join(" ");a.innerHTML=`
    <div class="meta-report-modal-backdrop" data-meta-report-modal-close aria-hidden="true"></div>
    <div class="${o}" role="dialog" aria-modal="true">
      ${e}
      <div class="meta-report-modal-save-row">
        ${renderMetaReportSaveIndicator("meta-report-modal-save-indicator")}
      </div>
    </div>
  `,document.body.appendChild(a),document.body.classList.add("meta-report-modal-open"),a.querySelectorAll("[data-meta-report-modal-close]").forEach(r=>{r.addEventListener("click",closeMetaReportModal)}),a.querySelector(".meta-report-modal-close")?.addEventListener("click",closeMetaReportModal)}function renderMetaReportShareModalContent(e){const n=!!(e.settings||{}).metaReportEnabled,a=e.reportUrl||null;if(!a)return"";const o=metaReportFullUrl(a),r=resolveMetaReportShareSlug(e),s=resolveMetaReportShareCode(e);return`
    <div class="meta-report-modal-head">
      <h2 class="meta-report-modal-title">Share link & slug</h2>
      <button type="button" class="meta-report-modal-close" aria-label="Close">&times;</button>
    </div>
    <p class="metrics-model-copy">Control the public report preview link and slug prefix for this client.</p>
    <div class="meta-report-share-panel">
      <div class="meta-report-share-preview-row">
        <span class="meta-report-share-preview-title">Preview</span>
        ${renderMetaHubSwitch({label:n?"Enabled":"Disabled",attr:"data-meta-client-preview",value:e.clientId,checked:n})}
      </div>
      <div class="meta-report-share-field">
        <div class="meta-report-share-slug-row">
          <span class="meta-report-share-slug-prefix">/report/</span>
          <input type="text" id="meta-report-share-slug" class="admin-input meta-report-share-slug-input" value="${esc(r)}" autocomplete="off" spellcheck="false" aria-label="Report slug" />
          <span class="meta-report-share-slug-suffix" id="meta-report-share-slug-suffix">-${esc(s||"\xB7\xB7\xB7\xB7")}</span>
        </div>
      </div>
      <code class="meta-report-share-url" id="meta-report-share-url">${esc(o)}</code>
      <div class="meta-report-share-editor-actions">
        <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="meta-report-rotate-token"${n?"":" disabled"}>Rotate link</button>
        <div class="meta-report-share-editor-actions-end">
          <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" data-meta-report-modal-close>Done</button>
          <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="meta-report-share-save">Save slug</button>
        </div>
      </div>
      ${n?"":'<p class="meta-report-share-note">Preview disabled \u2014 link won\u2019t load.</p>'}
    </div>
  `}function openMetaReportShareModal(e){metaReportsState.clientShareExpanded=!0,openMetaReportModal(renderMetaReportShareModalContent(e)),bindMetaReportShareEvents(e)}function renderMetaReportShareSummary(e,{hidden:t=!1}={}){const a=!!(e.settings||{}).metaReportEnabled,o=resolveMetaReportShareSlug(e),r=resolveMetaReportShareCode(e),s=o?`${o}-${r||"\xB7\xB7\xB7\xB7"}`:"Not set";return`
    <div class="meta-report-share-summary" id="meta-report-share-summary"${t?" hidden":""}>
      <div class="meta-report-share-summary-main">
        <div class="meta-report-share-summary-row">
          <span class="meta-report-share-summary-label">Preview</span>
          <span class="meta-report-share-summary-value${a?" is-on":" is-off"}">${a?"Enabled":"Disabled"}</span>
        </div>
        <div class="meta-report-share-summary-row">
          <span class="meta-report-share-summary-label">Slug</span>
          <span class="meta-report-share-summary-value" id="meta-report-share-slug-display">${esc(s)}</span>
        </div>
      </div>
      <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-share-edit">Edit</button>
    </div>
  `}function syncMetaReportToolbarCopy(e){const t=document.getElementById("meta-report-toolbar-copy-link");t&&(e.reportUrl?(t.setAttribute("data-copy-report-url",e.reportUrl),t.disabled=!e.settings?.metaReportEnabled,t.hidden=!1):t.hidden=!0)}function applyMetaReportEnabledUi(e,t){e.settings||(e.settings={}),e.settings.metaReportEnabled=t,document.getElementById("meta-report-control-panel")?.classList.toggle("is-share-disabled",!t);const n=document.getElementById("meta-report-share-summary");n&&n.querySelectorAll(".meta-report-share-summary-row").forEach(l=>{if(l.querySelector(".meta-report-share-summary-label")?.textContent!=="Preview")return;const c=l.querySelector(".meta-report-share-summary-value");c&&(c.textContent=t?"Enabled":"Disabled",c.classList.toggle("is-on",t),c.classList.toggle("is-off",!t))});const a=document.querySelector("[data-meta-client-preview]");a&&(a.checked=t);const o=a?.closest(".meta-hub-switch")?.querySelector(".meta-hub-switch-label");o&&(o.textContent=t?"Enabled":"Disabled");const r=document.getElementById("meta-report-rotate-token");r&&(r.disabled=!t);const s=document.querySelector(".meta-report-share-panel"),i=s?.querySelector(".meta-report-share-note");if(t)i&&i.remove();else if(!i&&s){const l=document.createElement("p");l.className="meta-report-share-note",l.textContent="Preview disabled \u2014 link won\u2019t load.",s.appendChild(l)}syncMetaReportToolbarCopy(e)}function updateMetaReportHubCardReportState(e,t){const n=document.querySelector(`[data-meta-hub-row="${e}"]`);if(!n)return;const a=n.querySelector(".meta-report-badge");a&&!a.classList.contains("meta-report-badge--setup")&&(a.className=t?"meta-report-badge meta-report-badge--on":"meta-report-badge meta-report-badge--off",a.textContent=t?"Report live":"Report off"),n.querySelectorAll("[data-meta-bottomline], [data-meta-fee]").forEach(o=>{o.disabled=!t,o.closest(".meta-hub-switch")?.classList.toggle("is-disabled",!t)})}function updateMetaReportShareSummary(e){const t=document.getElementById("meta-report-share-summary");if(!t)return;const n=document.createElement("div");n.innerHTML=renderMetaReportShareSummary(e).trim();const a=n.firstElementChild;if(!a)return;a.hidden=metaReportsState.clientShareExpanded,t.replaceWith(a);const o=document.getElementById("meta-report-share-edit");if(o){const r=metaReportsState.clientPayload;o.onclick=()=>{r&&openMetaReportShareModal(r)}}}function syncMetaReportControlPanelUi(){const e=document.getElementById("meta-report-control-panel");if(!e)return;const t=metaReportsState.clientShareExpanded,n=metaReportsState.clientReportSettingsExpanded,a=metaReportsState.clientExcelSheetExpanded;e.classList.toggle("is-editing-share",t),e.classList.toggle("is-editing-report",n);const o=document.getElementById("meta-report-control-status");o&&(o.hidden=t||n||a)}function setMetaReportShareExpanded(e){metaReportsState.clientShareExpanded=!!e,e&&(metaReportsState.clientReportSettingsExpanded=!1);const t=document.getElementById("meta-report-share-summary"),n=document.getElementById("meta-report-share-editor");t&&(t.hidden=e),n&&(n.hidden=!e),syncMetaReportControlPanelUi()}function renderMetaReportShareEditor(e){const n=!!(e.settings||{}).metaReportEnabled,a=e.reportUrl||null;if(!a)return"";const o=metaReportFullUrl(a),r=resolveMetaReportShareSlug(e),s=resolveMetaReportShareCode(e);return`
    <div class="meta-report-control-editor meta-report-control-editor--share" id="meta-report-share-editor-wrap">
      <div class="meta-report-settings-card-head">
        <span class="meta-report-settings-card-title">Slug setting</span>
      </div>
      <div class="meta-report-share-editor" id="meta-report-share-editor"${metaReportsState.clientShareExpanded?"":" hidden"}>
        <div class="meta-report-share-panel">
          <div class="meta-report-share-preview-row">
            <span class="meta-report-share-preview-title">Preview</span>
            ${renderMetaHubSwitch({label:n?"Enabled":"Disabled",attr:"data-meta-client-preview",value:e.clientId,checked:n})}
          </div>
          <div class="meta-report-share-field">
            <div class="meta-report-share-slug-row">
              <span class="meta-report-share-slug-prefix">/report/</span>
              <input type="text" id="meta-report-share-slug" class="admin-input meta-report-share-slug-input" value="${esc(r)}" autocomplete="off" spellcheck="false" aria-label="Report slug" />
              <span class="meta-report-share-slug-suffix" id="meta-report-share-slug-suffix">-${esc(s||"\xB7\xB7\xB7\xB7")}</span>
            </div>
          </div>
          <code class="meta-report-share-url" id="meta-report-share-url">${esc(o)}</code>
          <div class="meta-report-share-editor-actions">
            <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="meta-report-rotate-token"${n?"":" disabled"}>Rotate link</button>
            <div class="meta-report-share-editor-actions-end">
              <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="meta-report-share-done">Done</button>
              <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="meta-report-share-save">Save slug</button>
            </div>
          </div>
          ${n?"":'<p class="meta-report-share-note">Preview disabled \u2014 link won\u2019t load.</p>'}
        </div>
      </div>
    </div>
  `}function resolveMetaReportExcelSheetUrl(e={}){return String(e?.metaReportExcelSheetUrl||"").trim()||null}function renderMetaReportExcelSheetButton(e={},{variant:t="primary"}={}){const n=resolveMetaReportExcelSheetUrl(e);return n?`<a class="${t==="secondary"?"admin-btn admin-btn--secondary":"admin-btn admin-btn--primary meta-report-excel-sheet-btn"}" href="${esc(n)}" target="_blank" rel="noopener noreferrer">See Excel sheet</a>`:""}function updateMetaReportPublicExcelSheetButton(e={}){const t=document.getElementById("meta-report-public-excel-sheet-btn");t&&(t.innerHTML=renderMetaReportExcelSheetButton(e,{variant:"secondary"}))}function describeMetaReportExcelSheetLabel(e){if(!e)return"Not set";try{const t=new URL(e),n=t.pathname.length>24?`${t.pathname.slice(0,24)}\u2026`:t.pathname;return`${t.hostname}${n}`}catch{return e.length>40?`${e.slice(0,40)}\u2026`:e}}function renderMetaReportExcelSheetSummary(e={}){const t=resolveMetaReportExcelSheetUrl(e),n=describeMetaReportExcelSheetLabel(t);return`
    <div class="meta-report-excel-sheet-summary" id="meta-report-excel-sheet-summary">
      <div class="meta-report-excel-sheet-summary-main">
        <div class="meta-report-excel-sheet-summary-row">
          <span class="meta-report-excel-sheet-summary-label">Excel sheet</span>
          <span class="meta-report-excel-sheet-summary-value${t?" is-on":" is-off"}" id="meta-report-excel-sheet-summary-value">${esc(n)}</span>
        </div>
      </div>
      <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-excel-sheet-edit">Edit</button>
    </div>
  `}function renderMetaReportExcelSheetModalContent(e){const t=e.settings||{},n=resolveMetaReportExcelSheetUrl(t)||"";return`
    <div class="meta-report-modal-head">
      <h2 class="meta-report-modal-title">Excel sheet link</h2>
      <button type="button" class="meta-report-modal-close" aria-label="Close">&times;</button>
    </div>
    <p class="metrics-model-copy">Add a Google Sheets or Excel Online link. Clients see a \u201CSee Excel sheet\u201D button on their report.</p>
    <div class="meta-report-share-panel">
      <div class="meta-report-share-field">
        <label for="meta-report-excel-sheet-url">Spreadsheet URL</label>
        <input
          type="url"
          id="meta-report-excel-sheet-url"
          class="admin-input meta-report-excel-sheet-url-input"
          value="${esc(n)}"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          autocomplete="off"
          spellcheck="false"
          aria-label="Excel sheet URL"
        />
      </div>
      <div class="meta-report-share-editor-actions">
        ${n?`<a class="admin-btn admin-btn--ghost admin-btn--small" href="${esc(n)}" target="_blank" rel="noopener noreferrer" id="meta-report-excel-sheet-preview">Preview link</a>`:'<span id="meta-report-excel-sheet-preview" hidden></span>'}
        <div class="meta-report-share-editor-actions-end">
          <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" data-meta-report-modal-close>Done</button>
          <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="meta-report-excel-sheet-save">Save link</button>
        </div>
      </div>
    </div>
  `}function openMetaReportExcelSheetModal(e){metaReportsState.clientExcelSheetExpanded=!0,syncMetaReportControlPanelUi(),openMetaReportModal(renderMetaReportExcelSheetModalContent(e),{wide:!0}),bindMetaReportExcelSheetModalEvents(e)}function updateMetaReportExcelSheetSummary(e={}){const t=document.getElementById("meta-report-excel-sheet-summary");if(!t)return;const n=document.createElement("div");n.innerHTML=renderMetaReportExcelSheetSummary(e).trim();const a=n.firstElementChild;a&&(t.replaceWith(a),bindMetaReportExcelSheetSummaryEvents(metaReportsState.clientPayload))}function bindMetaReportExcelSheetSummaryEvents(e){const t=document.getElementById("meta-report-excel-sheet-edit");!t||!e||(t.onclick=()=>openMetaReportExcelSheetModal(e))}function bindMetaReportExcelSheetModalEvents(e){const t=e.clientId,n=document.getElementById("meta-report-excel-sheet-url"),a=document.getElementById("meta-report-excel-sheet-save");if(!n||!a)return;const o=async()=>{const r=resolveMetaReportExcelSheetUrl(metaReportsState.clientPayload?.settings||{}),s=n.value.trim();a.disabled=!0;try{await saveMetaReportClientSettings(t,{metaReportExcelSheetUrl:s||null},()=>{n.value=r||""}),syncMetaReportExcelSheetUi(metaReportsState.clientPayload?.settings||{}),closeMetaReportModal()}finally{a.disabled=!1}};a.onclick=o,n.onkeydown=r=>{r.key==="Enter"&&(r.preventDefault(),o())}}function syncMetaReportExcelSheetUi(e={}){const t=resolveMetaReportExcelSheetUrl(e),n=document.getElementById("meta-report-excel-sheet-summary-value");n&&(n.textContent=describeMetaReportExcelSheetLabel(t),n.classList.toggle("is-on",!!t),n.classList.toggle("is-off",!t));const a=document.getElementById("meta-report-excel-sheet-toolbar-btn");a&&(t?(a.href=t,a.hidden=!1):a.hidden=!0);const o=document.getElementById("meta-report-public-excel-sheet-btn");o&&(o.innerHTML=renderMetaReportExcelSheetButton(e,{variant:"secondary"}))}function renderMetaReportClientControlPanel(e){const t=e.settings||{},n=metaReportsState.clientShareExpanded,a=metaReportsState.clientReportSettingsExpanded,o=metaReportsState.clientExcelSheetExpanded,r=!!e.reportUrl,s=n||a||o,i=metaReportMonthsNeedingBackfill(e),l=i.length?`${ICON_SYNC} Backfill ${i.length} month${i.length===1?"":"s"} from Meta`:`${ICON_SYNC} Re-sync year from Meta`;return`
    <div class="meta-report-control-panel${n?" is-editing-share":""}${a?" is-editing-report":""}${t.metaReportEnabled?"":" is-share-disabled"}" id="meta-report-control-panel">
      <div class="meta-report-control-bar">
        <div class="meta-report-control-bar-left meta-report-toolbar-left">
          <label class="meta-report-year-field">Year
            <select id="meta-report-year" class="admin-select">
              ${renderMetaReportYearSelectOptions(e,{disableUnavailable:!0})}
            </select>
          </label>
          <div class="meta-report-backfill-wrap">
            <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-backfill">${l}</button>
            <span class="meta-report-backfill-progress" id="meta-report-backfill-progress"></span>
          </div>
        </div>
        <div class="meta-report-control-bar-actions meta-report-toolbar-actions">
          <span class="meta-report-save-indicator" id="meta-report-save-indicator"><span class="meta-report-save-indicator-spinner"></span> Saving\u2026</span>
          ${r?`<button type="button" class="admin-btn admin-btn--secondary" id="meta-report-toolbar-copy-link" data-copy-report-url="${esc(e.reportUrl)}"${t.metaReportEnabled?"":" disabled"}>Copy link</button>`:""}
          ${resolveMetaReportExcelSheetUrl(t)?`<a class="admin-btn admin-btn--secondary" id="meta-report-excel-sheet-toolbar-btn" href="${esc(resolveMetaReportExcelSheetUrl(t))}" target="_blank" rel="noopener noreferrer">See Excel sheet</a>`:'<a class="admin-btn admin-btn--secondary" id="meta-report-excel-sheet-toolbar-btn" href="#" target="_blank" rel="noopener noreferrer" hidden>See Excel sheet</a>'}
        </div>
      </div>
      ${r?`
        <div class="meta-report-control-status-rows"${s?" hidden":""} id="meta-report-control-status">
          <div class="meta-report-control-status-grid">
            ${renderMetaReportShareSummary(e)}
            ${renderMetaReportBottomlineFeeSummary(t,"meta-report")}
          </div>
          <div class="meta-report-control-status-grid">
            <div id="meta-report-topline-source-host"${isMetaReportGhlListClient(t)?"":" hidden"}>
              ${isMetaReportGhlListClient(t)?renderMetaReportToplineSourceControl(e):""}
            </div>
            ${renderMetaReportExcelSheetSummary(t)}
          </div>
        </div>
      `:`
        <p class="meta-report-share-empty">Share link will appear once this client has a Meta ad account configured.</p>
      `}
    </div>
  `}function refreshMetaReportClientShareUi(e){syncMetaReportToolbarCopy(e),updateMetaReportShareSummary(e),updateMetaReportBottomlineFeeSummary(e.settings||{},"meta-report"),updateMetaReportExcelSheetSummary(e.settings||{}),document.getElementById("meta-report-control-panel")?.classList.toggle("is-share-disabled",!e.settings?.metaReportEnabled);const t=document.getElementById("meta-report-share-url");t&&e.reportUrl&&(t.textContent=metaReportFullUrl(e.reportUrl));const n=document.getElementById("meta-report-share-slug-suffix"),a=resolveMetaReportShareCode(e);n&&(n.textContent=`-${a||"\xB7\xB7\xB7\xB7"}`);const o=document.getElementById("meta-report-share-slug");o&&(o.value=resolveMetaReportShareSlug(e));const r=document.getElementById("meta-report-rotate-token");r&&(r.disabled=!e.settings?.metaReportEnabled);const s=document.querySelector("[data-meta-client-preview]");s&&(s.checked=!!e.settings?.metaReportEnabled),setMetaReportShareExpanded(metaReportsState.clientShareExpanded)}function syncMetaReportShareCard(e){const t=document.getElementById("meta-report-share-editor-wrap");if(!t)return;const n=t.parentElement;if(!n)return;const a=renderMetaReportShareEditor(e),o=document.createElement("div");o.innerHTML=a.trim();const r=o.firstElementChild;r&&(n.replaceChild(r,t),setMetaReportShareExpanded(metaReportsState.clientShareExpanded),bindMetaReportShareEvents(e),syncMetaReportToolbarCopy(e))}function bindMetaReportRotateButton(e){const t=document.getElementById("meta-report-rotate-token");t&&(t.onclick=async()=>{if(window.confirm("Rotate the share link? The old link will stop working.")){t.disabled=!0;try{const n=await patchMetaReportSettings(e,{rotateAccessToken:!0}),a=n.settings?.reportUrl||null,o=metaReportsState.clientPayload;o&&(o.reportUrl=a,n.settings&&(o.settings={...o.settings,...n.settings}));const r=o||{clientId:e,reportUrl:a,settings:n.settings||{}};metaReportsState.clientPayload=r,metaReportsState.clientShareExpanded?refreshMetaReportClientShareUi(r):syncMetaReportShareCard(r),showToast("Share link rotated","success")}catch(n){showToast(n.message||"Rotate failed","error")}finally{const n=document.getElementById("meta-report-rotate-token");n&&(n.disabled=!1)}}})}function bindMetaReportShareEvents(e){const t=e.clientId;bindMetaReportCopyButtons(),bindMetaReportRotateButton(t);const n=document.getElementById("meta-report-share-edit");n&&(n.onclick=()=>openMetaReportShareModal(e));const a=document.getElementById("meta-report-share-done");a&&(a.onclick=closeMetaReportModal);const o=document.getElementById("meta-report-share-save");o&&(o.onclick=async()=>{const i=document.getElementById("meta-report-share-slug"),l=normalizeMetaReportSlugInput(i?.value);if(!l||l.length<2){showToast("Enter a valid slug (at least 2 characters).","error");return}o.disabled=!0;try{const d=(await patchMetaReportSettings(t,{metaReportSlug:l})).settings||{},u=metaReportsState.clientPayload||e;u.settings={...u.settings,...d},u.reportUrl=d.reportUrl||null,metaReportsState.clientPayload=u,refreshMetaReportClientShareUi(u),closeMetaReportModal(),showToast("Share link slug saved","success")}catch(c){showToast(c.message||"Save failed","error")}finally{const c=document.getElementById("meta-report-share-save");c&&(c.disabled=!1)}});const r=document.getElementById("meta-report-share-slug");r&&(r.oninput=()=>{r.value=normalizeMetaReportSlugInput(r.value)});const s=document.querySelector("[data-meta-client-preview]");if(s){let i=0;s.onchange=async()=>{const l=++i,c=s.checked,d=!c,u=metaReportsState.clientPayload||e;applyMetaReportEnabledUi(u,c);const p=s.closest(".meta-hub-switch");p?.classList.add("is-saving");try{const h=await patchMetaReportSettings(t,{metaReportEnabled:c},{fast:!0});if(l!==i)return;const g=h.settings||{};u.settings={...u.settings,...g},u.reportUrl=g.reportUrl??u.reportUrl,metaReportsState.clientPayload=u,applyMetaReportEnabledUi(u,!!g.metaReportEnabled),showToast(c?"Client preview enabled":"Client preview disabled","success")}catch(h){if(l!==i)return;applyMetaReportEnabledUi(u,d),s.checked=d,showToast(h.message||"Update failed","error")}finally{l===i&&p?.classList.remove("is-saving")}}}}function renderMetaReportHubCard(e){const t=!!e.clientId,n=e.clientId||e.metaAdAccountId||"",a=e.needsSetup?"is-setup":"",o=e.needsSetup?'<span class="meta-report-badge meta-report-badge--setup">Needs setup</span>':e.metaReportEnabled?'<span class="meta-report-badge meta-report-badge--on">Report live</span>':'<span class="meta-report-badge meta-report-badge--off">Report off</span>',r=resolveMetaReportHubTypeLabel(e),s=t?`<a href="/admin/meta-reports/${encodeURIComponent(e.clientId)}" class="meta-hub-card-name">${esc(e.accountName)}</a>`:`<span class="meta-hub-card-name">${esc(e.accountName)}</span>`,i=[];e.needsSetup?i.push(`<button type="button" class="admin-btn admin-btn--primary" data-meta-provision="${esc(e.metaAdAccountId)}" data-meta-provision-name="${esc(e.accountName)}">Add client</button>`):t&&(i.push(`<a class="admin-btn" href="/admin/meta-reports/${encodeURIComponent(e.clientId)}">Edit report</a>`),e.reportUrl&&e.metaReportEnabled&&i.push(`<a class="admin-btn admin-btn--primary" href="${esc(e.reportUrl)}" target="_blank" rel="noopener noreferrer" title="Open client report">View Report</a>`),i.push(e.reportUrl?`<button type="button" class="admin-btn admin-btn--secondary" data-copy-report-url="${esc(e.reportUrl)}">Copy link</button>`:`<a class="admin-btn admin-btn--secondary" href="/admin/meta-reports/${encodeURIComponent(e.clientId)}">Enable report</a>`));const l=i.length===1?"meta-hub-card-actions meta-hub-card-actions--single":i.length>=3?"client-card-actions":"meta-hub-card-actions";return`
    <article class="meta-hub-card ${a}" data-meta-hub-row="${esc(n)}">
      <div class="meta-hub-card-head">
        <span class="meta-hub-avatar" aria-hidden="true">${metaHubClientInitial(e.accountName)}</span>
        <div class="meta-hub-card-title">
          ${s}
          <div class="meta-hub-card-slug">act_${esc(e.metaAdAccountId||"\u2014")}</div>
        </div>
      </div>
      <div class="meta-hub-card-meta">
        ${o}
        <span class="meta-hub-card-meta-dot" aria-hidden="true">\xB7</span>
        <span>${esc(r)}</span>
      </div>
      <div class="meta-hub-card-toggles">
        ${renderMetaHubSwitch({label:"Report",attr:"data-meta-report-enabled",value:t?e.clientId:null,checked:e.metaReportEnabled})}
        ${renderMetaHubSwitch({label:"Bottomline",attr:"data-meta-bottomline",value:t?e.clientId:null,checked:e.metaReportShowBottomline,disabled:!e.metaReportEnabled})}
        ${renderMetaHubSwitch({label:"Censio fee",attr:"data-meta-fee",value:t?e.clientId:null,checked:e.metaReportFeeEnabled,disabled:!e.metaReportEnabled})}
      </div>
      ${i.length?`<div class="${l}">${i.join("")}</div>`:""}
    </article>
  `}function renderMetaReportsClientCards(e,t="all",n=""){if(!e.length){const a=n?`No clients match \u201C${n}\u201D.`:t==="all"?"No Meta ad accounts found. Check META_SYSTEM_USER_TOKEN and META_BUSINESS_ID, or add clients manually.":"No clients match this filter.";return`
      <div class="meta-hub-empty">
        <h3>No clients to show</h3>
        <p>${esc(a)}</p>
      </div>
    `}return e.map(a=>renderMetaReportHubCard(a)).join("")}function renderMetaReportsBannerHtml(e){return e?.partnerFetchError?`
    <div class="meta-hub-banner">
      <strong>Meta Business Manager listing unavailable</strong>
      ${esc(e.partnerFetchError)} Showing only clients already configured in the app.
    </div>
  `:""}function renderMetaHubFiltersHtml(e){return META_HUB_FILTER_OPTIONS.map(t=>`
    <button
      type="button"
      class="meta-hub-filter${e===t.value?" is-active":""}"
      data-meta-filter="${esc(t.value)}"
    >${esc(t.label)}</button>
  `).join("")}function recomputeMetaReportsSummaryCounts(){const e=metaReportsState.dashboardData?.clients||[],t=metaReportsState.dashboardData?.summary||{};metaReportsState.dashboardData.summary={...t,inAppCount:e.filter(n=>n.inApp).length,enabledCount:e.filter(n=>n.metaReportEnabled).length,needsSetupCount:e.filter(n=>n.needsSetup).length,totalListed:e.length}}function mergeHubClient(e,t){const n=metaReportsState.dashboardData?.clients;if(!n)return null;const a=n.findIndex(o=>o.clientId===e);return a<0?null:(n[a]={...n[a],...t},recomputeMetaReportsSummaryCounts(),n[a])}function updateMetaReportsHubDom(e){const t=document.getElementById("meta-reports-banner"),n=document.getElementById("meta-reports-cards"),a=document.getElementById("meta-reports-count");t&&(t.innerHTML=renderMetaReportsBannerHtml(e.meta)),a&&(a.textContent=`${e.clients.length} client${e.clients.length===1?"":"s"}`),n&&(n.innerHTML=renderMetaReportsClientCards(e.clients,e.filter,e.searchQuery),bindMetaReportsHubRowEvents(n))}function renderMetaReportsClientTabs(e){const t=e.monthKeys||[],n=metaReportsState.activeMonthKey||t[t.length-1]||"";return t.map(a=>`
    <button type="button" class="meta-report-tab${a===n?" is-active":""}" data-meta-month-tab="${esc(a)}">${esc(metaMonthLabel(a))}</button>
  `).join("")}function syncMetaReportToplineSourceBar(e){const t=document.getElementById("meta-report-topline-source-host");if(!t||!e)return;const n=e.settings||{};if(!isMetaReportGhlListClient(n)){t.innerHTML="",t.hidden=!0;return}t.hidden=!1,t.innerHTML=renderMetaReportToplineSourceControl(e),bindMetaReportToplineSourceControl(e.clientId,e)}function bindMetaReportToplineSourceControl(e,t){if(!e||!t)return;const n=document.getElementById("meta-report-topline-change");n&&(n.onclick=()=>openMetaReportToplineChangeModal(t))}function bindMetaMonthSourceOverrideEvents(e,t,{prefix:n,getMonthKey:a,getMonthPayload:o,onSuccess:r}){const s=document.getElementById(`${n}-use-manual-month`),i=document.getElementById(`${n}-restore-month-source`);s&&(s.onclick=async()=>{const l=a();if(l){s.disabled=!0;try{const c=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(l)}/use-manual`,{method:"POST",body:"{}"});r(c,l),showToast("Manual values enabled for this month","success")}catch(c){showToast(c.message||"Could not switch to manual mode","error")}finally{s.disabled=!1}}}),i&&(i.onclick=async()=>{const l=a();if(l){i.disabled=!0;try{const c=o?.()||null,d=monthHasCenhubSnapshot(c,t),u=d?"sync-ghl":"use-meta",p=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(l)}/${u}`,{method:"POST",body:d?JSON.stringify({overwriteManual:!0}):"{}"});r(p,l),showToast(d?"Cenhub data restored for this month":"Meta restored for this month","success")}catch(c){showToast(c.message||"Could not restore month data source","error")}finally{i.disabled=!1}}})}function rebindMetaReportMonthPanelEvents(e,t){bindMetaReportsClientEditEvents(e,t),isMetaReportGhlListClient(t?.settings||{})&&(bindMetaReportMonthManualEvents(e,t),resolveClientToplineMode(t.settings)==="cenhub"&&bindMetaToplineCenhubActionEvents({clientId:e,prefix:"meta-report",getMonthKey:()=>metaReportsState.activeMonthKey,getYear:()=>metaReportsState.selectedYear,onMonthUpdated:async(n,a)=>{n?.monthPayload&&a&&refreshMetaReportMonthPanel(n.monthPayload)}}))}function bindMetaReportMonthManualEvents(e,t){bindMetaMonthSourceOverrideEvents(e,t?.settings||{},{prefix:"meta-report",getMonthKey:()=>metaReportsState.activeMonthKey,getMonthPayload:()=>{const n=metaReportsState.activeMonthKey;return n&&t?.months?.[n]||null},onSuccess:(n,a)=>{n?.monthPayload&&a&&(t.months=t.months||{},t.months[a]=n.monthPayload,refreshMetaReportMonthPanel(n.monthPayload))}})}function getMetaReportCalendarYear(e){const t=Number(e?.currentYear);return Number.isFinite(t)&&t>=2e3?t:new Date().getFullYear()}function getMetaReportYearOptions(e){const t=getMetaReportCalendarYear(e),n=t-1,a=new Map;Array.isArray(e?.years)&&e.years.forEach(r=>{const s=Number(r?.year);Number.isFinite(s)&&a.set(s,r.available!==!1)});const o=a.has(n)?a.get(n):e?.previousYearHasData===!0;return[{year:t,available:!0},{year:n,available:!!o}]}function renderMetaReportYearSelectOptions(e,{disableUnavailable:t=!1}={}){const n=Number(metaReportsState.selectedYear)||Number(e?.year);return getMetaReportYearOptions(e).map(({year:a,available:o})=>{const r=t&&!o;return`<option value="${a}"${Number(n)===a?" selected":""}${r?" disabled":""}>${a}${o?"":" (no data)"}</option>`}).join("")}function syncMetaReportSelectedYear(e,{disableUnavailable:t=!1}={}){const n=getMetaReportYearOptions(e),a=Number(metaReportsState.selectedYear),o=n.find(l=>l.year===a);if(o&&(!t||o.available)){metaReportsState.selectedYear=o.year;return}const r=Number(e?.year),s=n.find(l=>l.year===r);if(s&&(!t||s.available)){metaReportsState.selectedYear=s.year;return}const i=n.find(l=>l.available)||n[0];i&&(metaReportsState.selectedYear=i.year)}function refreshMetaReportMonthPanel(e){const t=metaReportsState.clientPayload;!t||!metaReportsState.activeMonthKey||(t.months=t.months||{},t.months[metaReportsState.activeMonthKey]=e,!document.getElementById("meta-report-month-panel"))||(syncMetaReportMonthPanelDom(e,getMetaReportMonthBodyOptions(t.settings,{editable:!0,yearPayload:t}),t),rebindMetaReportMonthPanelEvents(t.clientId,t),refreshMetaReportBackfillControl(t))}function refreshMetaReportBackfillControl(e){const t=document.querySelector(".meta-report-client-page .meta-report-toolbar-left"),n=document.querySelector(".meta-report-backfill-wrap"),a=metaReportMonthsNeedingBackfill(e),o=a.length?`${ICON_SYNC} Backfill ${a.length} month${a.length===1?"":"s"} from Meta`:`${ICON_SYNC} Re-sync year from Meta`,r=document.getElementById("meta-report-backfill");if(r)r.innerHTML=o,r.disabled=!1;else if(t){const s=document.createElement("div");s.className="meta-report-backfill-wrap",s.innerHTML=`
      <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-backfill">${o}</button>
      <span class="meta-report-backfill-progress" id="meta-report-backfill-progress"></span>
    `,t.appendChild(s),bindMetaReportBackfillButton(e.clientId)}n&&!r&&!t&&n.remove()}function updateMetaReportsClientContent(e){metaReportsState.clientPayload=e,metaReportsState.chartProjection=null;const t=e.monthKeys||[];metaReportsState.activeMonthKey&&t.includes(metaReportsState.activeMonthKey)||(metaReportsState.activeMonthKey=t[t.length-1]||null),syncMetaReportSelectedYear(e,{disableUnavailable:!0});const n=document.getElementById("meta-report-year");n&&(n.innerHTML=renderMetaReportYearSelectOptions(e,{disableUnavailable:!0})),syncMetaReportToolbarCopy(e),refreshMetaReportClientShareUi(e);const a=e.settings||{},o=e.months?.[metaReportsState.activeMonthKey]||null;syncMetaReportSettingsControls(a,o);const r=document.querySelector(".meta-report-tabs");r&&(r.innerHTML=renderMetaReportsClientTabs(e),bindMetaReportsClientTabEvents(e)),syncMetaReportToplineSourceBar(e),document.getElementById("meta-report-month-panel")&&(syncMetaReportMonthPanelDom(e.months?.[metaReportsState.activeMonthKey],getMetaReportMonthBodyOptions(a,{editable:!0,yearPayload:e}),e),rebindMetaReportMonthPanelEvents(e.clientId,e)),refreshMetaReportBackfillControl(e),ensureMetaReportScenarioSource(e,{editable:!0})}function updatePublicMetaReportContent(e){metaReportsState.publicPayload=e;const t=e.reportKind==="google-ads",n=t?googleAdsPayloadToMetaUiShape(e):e;syncMetaReportPublicBranding(e),t||updateMetaReportPublicExcelSheetButton(n.settings||{});const a=n.monthKeys||[];metaReportsState.activeMonthKey&&a.includes(metaReportsState.activeMonthKey)||(metaReportsState.activeMonthKey=a[a.length-1]||null),syncMetaReportSelectedYear(n,{disableUnavailable:!0});const o=document.getElementById("meta-report-year");o&&(o.innerHTML=renderMetaReportYearSelectOptions(n,{disableUnavailable:!0}));const r=document.querySelector(".meta-report-tabs");r&&(r.innerHTML=a.map(i=>`
      <button type="button" class="meta-report-tab${i===metaReportsState.activeMonthKey?" is-active":""}" data-meta-month-tab="${esc(i)}">${esc(metaMonthLabel(i))}</button>
    `).join(""),bindPublicMetaReportTabEvents(e));const s=document.getElementById("meta-report-month-panel");s&&(t?(s.innerHTML=renderGoogleAdsReportMonthBody(n.months?.[metaReportsState.activeMonthKey],{editable:!1,yearPayload:n,activeMonthKey:metaReportsState.activeMonthKey}),requestAnimationFrame(()=>{mountMetaReportCharts(n,{editable:!1})})):syncMetaReportMonthPanelDom(n.months?.[metaReportsState.activeMonthKey],getMetaReportMonthBodyOptions(n.settings,{editable:!1}),n))}const META_MONTH_LABELS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],META_MONTH_LABELS_FULL=["January","February","March","April","May","June","July","August","September","October","November","December"];function metaFmtKr(e){return`Dkr ${(Number(e)||0).toLocaleString("da-DK",{minimumFractionDigits:0,maximumFractionDigits:2})}`}function metaFmtNum(e,t=0){return(Number(e)||0).toLocaleString("da-DK",{minimumFractionDigits:t,maximumFractionDigits:t})}function metaReportFmtBaselineAmount(e){const t=Number(e)||0;return t<=0?"\u2014":metaFmtKr(t)}function metaFmtX(e){const t=Number(e);return Number.isFinite(t)?t===0?"0.00x":`${t.toFixed(2)}x`:"\u2014"}function metaMonthLabel(e){const t=Number(String(e||"").slice(5,7));return META_MONTH_LABELS[t-1]||e}function metaMonthLabelFull(e){const t=Number(String(e||"").slice(5,7));return META_MONTH_LABELS_FULL[t-1]||metaMonthLabel(e)}function metaReportMonthBounds(e){const t=String(e||"").trim();if(!/^\d{4}-\d{2}$/.test(t))return{start:"",end:""};const[n,a]=t.split("-").map(Number),o=new Date(n,a,0).getDate(),r=String(a).padStart(2,"0");return{start:`${n}-${r}-01`,end:`${n}-${r}-${String(o).padStart(2,"0")}`}}function metaReportMonthPeriodAligned(e){if(!e?.monthKey)return!0;const t=metaReportMonthBounds(e.monthKey),n=String(e.periodStart||"").slice(0,10),a=String(e.periodEnd||"").slice(0,10);return!!(n===t.start&&a===t.end||e.metaFetchedAt&&Number(e.meta?.spend)>0)}function resolveMetaReportActiveMonthPayload(e=null){const t=e||metaReportsState.clientPayload||metaReportsState.publicPayload,n=metaReportsState.activeMonthKey;return!t||!n?null:t.months?.[n]||null}function switchMetaReportMonthTab(e,{editable:t=!1}={}){if(!e)return;metaReportsState.reportViewMode==="comparison"&&(metaReportsState.reportViewMode="monthly"),metaReportsState.activeMonthKey=e;const n=metaReportsState.clientPayload||metaReportsState.publicPayload;if(!n)return;document.querySelectorAll("[data-meta-month-tab]").forEach(o=>{o.classList.toggle("is-active",o.getAttribute("data-meta-month-tab")===e)});const{series:a}=resolveMetaReportChartSeries(n,{allowDemo:!t});a.length&&(metaReportsState.chartSeries=a),(async()=>{const o=n.months?.[e];if(t&&n.clientId&&o&&!metaReportMonthPeriodAligned(o))try{const r=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(n.clientId)}/months/${encodeURIComponent(e)}`);r?.monthPayload&&(n.months[e]=r.monthPayload)}catch{}syncMetaReportMonthPanelDom(null,getMetaReportMonthBodyOptions(n.settings||{},{editable:t,yearPayload:n}),n),t&&n.clientId&&rebindMetaReportMonthPanelEvents(n.clientId,n),syncMetaReportSettingsControls(n.settings||{},resolveMetaReportActiveMonthPayload(n)),ensureMetaReportScenarioSource(n,{editable:t}).then(()=>{syncMetaReportScenario(n)})})()}function metaReportMonthsNeedingBackfill(e){return(e?.monthKeys||[]).filter(n=>!e.months?.[n]?.metaFetchedAt)}function metaReportTone(e){const t=Number(e);return!Number.isFinite(t)||t===0?"neutral":t>0?"positive":"negative"}function renderMetaReportHighlightStrip(e){if(!e||e.meta?.emptyMonth)return"";const t=Number(e.topline?.roasX)||0,n=[{label:"Ad spend",value:metaFmtKr(e.meta?.spend),tone:"neutral"},{label:"Leads",value:metaFmtNum(e.topline?.leads),tone:"neutral"},{label:"Return on ad spend",value:metaFmtX(t),tone:metaReportTone(t)}];if(e.bottomline){const a=Number(e.bottomline.feePercent)>0,o=a?e.bottomline.poiKr:e.bottomline.poasKr;n.push({label:a?"Profit on investment":"Profit on ad spend",value:metaFmtKr(o),tone:metaReportTone(o)})}else n.push({label:"Won leads",value:metaFmtNum(e.topline?.wonLeads),tone:"neutral"});return`
    <div class="meta-report-highlight-strip">
      ${n.map(({label:a,value:o,tone:r})=>`
        <div class="meta-report-highlight-item${r&&r!=="neutral"?` is-${r}`:""}">
          <div class="meta-report-highlight-label">${esc(a)}</div>
          <div class="meta-report-highlight-value">${esc(o)}</div>
        </div>
      `).join("")}
    </div>
  `}function renderMetaReportMetricTable(e,t,n="meta",{badge:a="",highlightLastN:o=0}={}){const r=t.map(([s,i,l],c)=>`
      <tr class="${o>0&&c>=t.length-o?`is-highlight accent-${n}`:""}">
        <th scope="row">${esc(s)}</th>
        <td>${esc(String(i??"\u2014"))}${l?`<span class="meta-report-row-unit">${esc(l)}</span>`:""}</td>
      </tr>
    `).join("");return`
    <section class="meta-report-group">
      <div class="meta-report-group-head">
        <span class="meta-report-group-bar meta-report-group-bar--${n}" aria-hidden="true"></span>
        <h3 class="meta-report-group-title">${esc(e)}</h3>
        ${a?`<span class="meta-report-group-badge">${esc(a)}</span>`:""}
      </div>
      <div class="meta-report-group-table-wrap">
        <table class="meta-report-group-table">
          <tbody>${r}</tbody>
        </table>
      </div>
    </section>
  `}function getMetaReportMonthBodyOptions(e={},{editable:t=!1,yearPayload:n=null}={}){return{editable:t,yearPayload:n,settings:e}}function shouldShowMetaReportYearVisuals(e,t,{editable:n=!1}={}){if(!e||e.meta?.emptyMonth||!t)return!1;const{series:a,demo:o}=resolveMetaReportChartSeries(t,{allowDemo:!n});return!(a.filter(s=>s.hasData).length<META_REPORT_CHART_MIN_POINTS||o)}const META_REPORT_CHART_MIN_POINTS=2,META_REPORT_SCENARIO_MAX_HISTORICAL=9,META_REPORT_SCENARIO_PROJECTED_MONTHS=4,META_REPORT_SPEND_CHART_TYPE_OPTIONS=[{value:"area",label:"Area"},{value:"bar",label:"Bar"}],META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS=[{value:"3",label:"Last 3 ad months"},{value:"6",label:"Last 6 ad months"},{value:"9",label:"Last 9 ad months"},{value:"12",label:"Last 12 ad months"},{value:"all",label:"All ad-active months"}],META_REPORT_SCENARIO_FIXED_ELASTICITY=.8,META_SCENARIO_TREND_R_THRESHOLD=.35,META_REPORT_SCENARIO_MODEL_PILLS=[{id:"scenarioSmoothUneven",label:"Remove uneven months",defaultOn:!0},{id:"scenarioBlendHistory",label:"Balance recent months",defaultOn:!1},{id:"scenarioIncludeTrend",label:"Follow trend",defaultOn:!1}];function normalizeMetaReportSpendChartType(e){const t=String(e||"area").trim().toLowerCase();return META_REPORT_SPEND_CHART_TYPE_OPTIONS.some(n=>n.value===t)?t:"area"}function hydrateMetaReportSpendChartType(e){metaReportsState.spendChartType=normalizeMetaReportSpendChartType(e?.settings?.metaReportSpendChartType)}function normalizeMetaReportScenarioPill(e,t=!1){if(typeof e=="boolean")return e;if(e==null)return t;const n=String(e).trim().toLowerCase();return n==="true"||n==="1"?!0:n==="false"||n==="0"?!1:t}function normalizeMetaReportScenarioMonthWindow(e){const t=String(e||"6").trim().toLowerCase();return META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS.some(n=>n.value===t)?t:"6"}function normalizeMetaReportBudgetBaseline(e){const t=String(e||"year").trim().toLowerCase();return t==="month"||t==="last"?t:"year"}function normalizeMetaReportBudgetMultiplier(e){const t=Number.parseFloat(e);return Number.isFinite(t)?Math.min(3,Math.max(.5,Math.round(t*10)/10)):2}function getMetaReportScenarioPillsFromState(){return{smoothUneven:!!metaReportsState.scenarioSmoothUneven,blendHistory:!!metaReportsState.scenarioBlendHistory,includeTrend:!!metaReportsState.scenarioIncludeTrend}}function applyMetaReportScenarioPillsToState(e={}){metaReportsState.scenarioSmoothUneven=!!e.smoothUneven,metaReportsState.scenarioBlendHistory=!!e.blendHistory,metaReportsState.scenarioIncludeTrend=!!e.includeTrend}function describeActiveMetaReportScenarioPills(){return META_REPORT_SCENARIO_MODEL_PILLS.filter(e=>!!metaReportsState[e.id]).map(e=>e.label)}function hydrateMetaReportScenarioSettings(e){const t=e?.settings||{};metaReportsState.budgetMultiplier=normalizeMetaReportBudgetMultiplier(t.metaReportBudgetMultiplier),metaReportsState.budgetBaseline=normalizeMetaReportBudgetBaseline(t.metaReportBudgetBaseline),metaReportsState.scenarioMonthWindow=normalizeMetaReportScenarioMonthWindow(t.metaReportScenarioMonthWindow),applyMetaReportScenarioPillsToState({smoothUneven:normalizeMetaReportScenarioPill(t.metaReportScenarioSmoothUneven,!0),blendHistory:normalizeMetaReportScenarioPill(t.metaReportScenarioBlendHistory,!1),includeTrend:normalizeMetaReportScenarioPill(t.metaReportScenarioIncludeTrend,!1)})}function renderMetaReportScenarioModelPills(){return`
    <div class="meta-report-scenario-pill-section" id="meta-report-scenario-pills-wrap">
      <div class="meta-report-scenario-pill-row" role="group" aria-label="Forecast options">
        ${META_REPORT_SCENARIO_MODEL_PILLS.map(({id:e,label:t})=>{const n=!!metaReportsState[e];return`
            <button type="button" class="meta-report-scenario-pill${n?" is-active":""}" data-scenario-pill="${esc(e)}" aria-pressed="${n}">${esc(t)}</button>
          `}).join("")}
      </div>
    </div>
  `}function renderMetaReportSpendChartTypePicker({editable:e=!1}={}){const t=metaReportsState.spendChartType||"area";return`
    <div class="meta-report-spend-chart-type" role="group" aria-label="Spend chart type">
      ${META_REPORT_SPEND_CHART_TYPE_OPTIONS.map(({value:n,label:a})=>`
        <button type="button" class="meta-report-chart-toggle-btn${n===t?" is-active":""}" data-spend-chart-type="${esc(n)}"${e?"":" disabled"}>${esc(a)}</button>
      `).join("")}
    </div>
  `}function isMetaReportCensioClient(e){const t=String(e?.clientId||"").toLowerCase(),n=String(e?.accountName||"");return t==="censio"||/censio/i.test(n)}function monthHasChartData(e){if(!e||e.meta?.emptyMonth)return!1;if(!metaReportMonthPeriodAligned(e))return(Number(e.topline?.leads)||0)>0;const t=Number(e.meta?.spend)||0,n=Number(e.topline?.leads)||0;return t>0||n>0}function buildMetaReportChartSeries(e){const t=e?.monthKeys||[],n=e?.months||{},a=[];for(const o of t){const r=n[o];if(!r||r.meta?.emptyMonth){a.push({monthKey:o,label:metaMonthLabel(o),periodEnd:r?.periodEnd||null,roasKr:null,roasX:null,poasKr:null,poasX:null,spend:0,leads:0,wonLeads:0,avgLeadValue:0,avgProfitPerWon:0,hasData:!1});continue}const s=!!r.bottomline;a.push({monthKey:o,label:metaMonthLabel(o),periodEnd:r.periodEnd||null,roasKr:Number(r.topline?.roasKr)||0,roasX:Number(r.topline?.roasX)||0,poasKr:s?Number(r.bottomline.poasKr)||0:null,poasX:s?Number(r.bottomline.poasX)||0:null,spend:Number(r.meta?.spend)||0,leads:Number(r.topline?.leads)||0,wonLeads:Number(r.topline?.wonLeads)||0,avgLeadValue:Number(r.topline?.avgLeadValue)||0,avgProfitPerWon:Number(r.inputs?.avgProfitPerWon)||0,hasData:monthHasChartData(r)})}return a}function getMetaReportDemoSeries(e,t,n,a){if(!isMetaReportCensioClient({clientId:e,accountName:t}))return null;const r=new Date,s=r.getFullYear(),i=r.getMonth()+1,l=Number(n)||s;let c=(a||[]).filter(d=>{const u=Number(String(d).slice(0,4)),p=Number(String(d).slice(5,7));return!(u!==l||l===s&&p>i)});if(!c.length){const d=l===s?Math.min(8,i):8;c=Array.from({length:d},(u,p)=>`${l}-${String(p+1).padStart(2,"0")}`)}return c.map((d,u)=>{const p=c.length>1?u/(c.length-1):0,h=Math.round(8e3+p*1e4),g=Math.round(2e3+p*15e3),b=Number((.5+p*2.5).toFixed(2)),y=Math.round(1500+p*12e3),m=Number((.4+p*2.2).toFixed(2)),f=Math.round(20+p*80),v=Math.max(1,Math.round(f*(.08+p*.04)));return{monthKey:d,label:metaMonthLabel(d),roasKr:g,roasX:b,poasKr:y,poasX:m,spend:h,leads:f,wonLeads:v,avgLeadValue:85e3,avgProfitPerWon:42e3,hasData:!0,demo:!0}})}function metaReportScenarioPointHasTopline(e){return metaReportParseAmount(e?.spend)>0&&metaReportParseAmount(e?.leads)>0&&metaReportParseAmount(e?.wonLeads)>0&&metaReportParseAmount(e?.avgLeadValue)>0}function metaReportScenarioPointHasBottomlineInputs(e){return metaReportScenarioPointHasTopline(e)&&metaReportParseAmount(e?.avgProfitPerWon)>0}function filterMetaReportScenarioSeries(e=[],{hasBottomline:t=!1}={}){const n=t?metaReportScenarioPointHasBottomlineInputs:metaReportScenarioPointHasTopline;return e.filter(n)}function resolveMetaReportChartSeries(e,{allowDemo:t=!0}={}){const n=buildMetaReportChartSeries(e);if(n.filter(o=>o.hasData).length>=META_REPORT_CHART_MIN_POINTS)return{series:n,demo:!1};if(t&&isMetaReportCensioClient(e)){const o=getMetaReportDemoSeries(e.clientId,e.accountName,e.year||metaReportsState.selectedYear,e.monthKeys);if(o&&o.length>=META_REPORT_CHART_MIN_POINTS)return{series:o,demo:!0}}return{series:n,demo:!1}}function metaReportParseAmount(e){const t=Number.parseFloat(e);return Number.isFinite(t)?t:0}function metaReportRoundMoney(e){return Math.round(metaReportParseAmount(e)*100)/100}function metaReportRoundRatio(e){return Math.round(metaReportParseAmount(e)*1e8)/1e8}function metaReportAggregateSeriesEfficiency(e=[]){let t=0,n=0,a=0,o=0,r=0;for(const i of e){const l=metaReportParseAmount(i.spend),c=metaReportParseAmount(i.leads),d=metaReportParseAmount(i.wonLeads);l<=0&&c<=0||(t+=l,n+=c,a+=d,o+=d*metaReportParseAmount(i.avgLeadValue),r+=d*metaReportParseAmount(i.avgProfitPerWon))}const s=e.filter(i=>metaReportParseAmount(i.spend)>0).length;return{avgCpl:n>0?metaReportRoundMoney(t/n):0,winRate:n>0?metaReportRoundRatio(a/n):0,avgLeadValue:a>0?metaReportRoundMoney(o/a):0,avgProfitPerWon:a>0?metaReportRoundMoney(r/a):0,avgMonthlySpend:s>0?metaReportRoundMoney(t/s):0}}const META_SCENARIO_MIN_EFFICIENCY_MONTHS=2,META_SCENARIO_MIN_TREND_MONTHS=4,META_SCENARIO_SPEND_RAMP_CAP=2,META_SCENARIO_MAD_MULTIPLIER=2.5,META_SCENARIO_MAX_MONTHLY_TREND=.03;function metaReportScenarioParseDate(e){if(!e)return null;const t=String(e).slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(t))return null;const n=new Date(`${t}T12:00:00.000Z`);return Number.isNaN(n.getTime())?null:n}function metaReportScenarioIsIncompleteMonth(e,t=new Date,{hasBottomline:n=!1}={}){if(!metaReportScenarioParseDate(e.periodEnd))return!0;const o=t.toISOString().slice(0,10);return String(e.periodEnd).slice(0,10)<o?!1:!(n?metaReportScenarioPointHasBottomlineInputs(e):metaReportScenarioPointHasTopline(e))}function metaReportScenarioIsAdActive(e){return metaReportParseAmount(e.spend)>0&&metaReportParseAmount(e.leads)>0}function metaReportScenarioMedian(e=[]){const t=e.filter(a=>Number.isFinite(a)).slice().sort((a,o)=>a-o);if(!t.length)return 0;const n=Math.floor(t.length/2);return t.length%2===0?(t[n-1]+t[n])/2:t[n]}function metaReportScenarioMad(e=[]){const t=metaReportScenarioMedian(e);return metaReportScenarioMedian(e.map(n=>Math.abs(n-t)))}function metaReportScenarioLinearRegression(e=[]){const t=e.length;if(t<2)return{slope:0,intercept:0,r:0};let n=0,a=0,o=0,r=0,s=0;for(const p of e){const h=metaReportParseAmount(p.x),g=metaReportParseAmount(p.y);n+=h,a+=g,o+=h*g,r+=h*h,s+=g*g}const i=t*r-n*n;if(i===0)return{slope:0,intercept:a/t,r:0};const l=(t*o-n*a)/i,c=(a-l*n)/t,d=Math.sqrt((t*r-n*n)*(t*s-a*a)),u=d>0?(t*o-n*a)/d:0;return{slope:l,intercept:c,r:u}}function metaReportScenarioEnrichMonth(e){const t=metaReportParseAmount(e.spend),n=metaReportParseAmount(e.leads),a=metaReportParseAmount(e.wonLeads),o=metaReportParseAmount(e.avgLeadValue),r=metaReportParseAmount(e.avgProfitPerWon),s=metaReportRoundMoney(a*o),i=metaReportRoundMoney(a*r);return{...e,spend:t,leads:n,wonLeads:a,avgLeadValue:o,avgProfitPerWon:r,cpl:n>0?metaReportRoundMoney(t/n):0,totalLeadValue:s,totalProfit:i,efficiencyIndex:t>0?s/t:0,profitEfficiencyIndex:t>0?i/t:0}}function metaReportPrepareScenarioSeries(e=[],{windowMonths:t="6",asOfDate:n=new Date,smoothOutliers:a=!0,hasBottomline:o=!1}={}){const r=normalizeMetaReportScenarioMonthWindow(t)==="all"?1/0:Number.parseInt(normalizeMetaReportScenarioMonthWindow(t),10)||6,s=e.filter(metaReportScenarioIsAdActive).filter(u=>!metaReportScenarioIsIncompleteMonth(u,n,{hasBottomline:o})).map(metaReportScenarioEnrichMonth),i=s.length,l=r===1/0?s:s.slice(-r);let c=0,d=l;if(a&&l.length>=3){const u=l.map(m=>metaReportParseAmount(m.cpl)),p=l.map(m=>metaReportParseAmount(m.leads)),h=metaReportScenarioMedian(u),g=metaReportScenarioMedian(p),b=metaReportScenarioMad(u),y=metaReportScenarioMad(p);d=l.map(m=>{const f={...m};let v=!1;const $=metaReportParseAmount(m.leads);if(b>0){const w=h-META_SCENARIO_MAD_MULTIPLIER*b,S=h+META_SCENARIO_MAD_MULTIPLIER*b,C=Math.min(S,Math.max(w,metaReportParseAmount(m.cpl)));C!==metaReportParseAmount(m.cpl)&&(f.cpl=metaReportRoundMoney(C),f.leads=Math.max(1,Math.round(metaReportParseAmount(m.spend)/C)),v=!0)}if(y>0){const w=g-META_SCENARIO_MAD_MULTIPLIER*y,S=g+META_SCENARIO_MAD_MULTIPLIER*y,C=Math.min(S,Math.max(w,metaReportParseAmount(m.leads)));Math.round(C)!==Math.round($)&&(f.leads=Math.max(1,Math.round(C)),v=!0)}if(v){c+=1;const w=$>0?metaReportParseAmount(m.wonLeads)/$:0,S=metaReportParseAmount(f.leads);f.wonLeads=Math.max(0,Math.round(S*w)),f.totalLeadValue=metaReportRoundMoney(f.wonLeads*metaReportParseAmount(m.avgLeadValue));const C=metaReportParseAmount(f.spend);f.totalProfit=metaReportRoundMoney(f.wonLeads*metaReportParseAmount(m.avgProfitPerWon)),f.efficiencyIndex=C>0?f.totalLeadValue/C:0,f.profitEfficiencyIndex=C>0?f.totalProfit/C:0}return f})}return{months:d,monthsAvailable:i,monthsUsed:d.length,outliersAdjusted:c,confidence:metaReportResolveScenarioConfidence(d.length)}}function metaReportScenarioRecencyEfficiency(e=[]){if(e.length<META_SCENARIO_MIN_EFFICIENCY_MONTHS)return null;let t=0,n=0,a=0,o=0,r=0,s=0;return e.forEach((i,l)=>{const c=l+1;t+=metaReportParseAmount(i.spend)*c,n+=metaReportParseAmount(i.leads)*c,a+=metaReportParseAmount(i.wonLeads)*c,o+=metaReportParseAmount(i.wonLeads)*metaReportParseAmount(i.avgLeadValue)*c,r+=metaReportParseAmount(i.wonLeads)*metaReportParseAmount(i.avgProfitPerWon)*c,s+=metaReportParseAmount(i.spend)}),{avgCpl:n>0?metaReportRoundMoney(t/n):0,winRate:n>0?metaReportRoundRatio(a/n):0,avgLeadValue:a>0?metaReportRoundMoney(o/a):0,avgProfitPerWon:a>0?metaReportRoundMoney(r/a):0,avgMonthlySpend:e.length>0?metaReportRoundMoney(s/e.length):0}}function metaReportScenarioPooledEfficiency(e=[]){return metaReportAggregateSeriesEfficiency(e)}function metaReportScenarioBlendEfficiency(e,t,n=.5){if(!e||!t)return e||t;const a=1-n;return{avgCpl:metaReportRoundMoney(e.avgCpl*n+t.avgCpl*a),winRate:metaReportRoundRatio(e.winRate*n+t.winRate*a),avgLeadValue:metaReportRoundMoney(e.avgLeadValue*n+t.avgLeadValue*a),avgProfitPerWon:metaReportRoundMoney(e.avgProfitPerWon*n+t.avgProfitPerWon*a),avgMonthlySpend:metaReportRoundMoney(e.avgMonthlySpend*n+t.avgMonthlySpend*a)}}function metaReportEfficiencyFromPreparedMonth(e){const t=metaReportParseAmount(e.leads),n=metaReportParseAmount(e.wonLeads);return{avgCpl:metaReportParseAmount(e.cpl),winRate:t>0?metaReportRoundRatio(n/t):0,avgLeadValue:metaReportParseAmount(e.avgLeadValue),avgProfitPerWon:metaReportParseAmount(e.avgProfitPerWon),avgMonthlySpend:metaReportParseAmount(e.spend)}}function metaReportResolveScenarioProjectionEfficiency(e,t,{hasBottomline:n=!1,activeMonthKey:a=null,asOfDate:o=new Date}={}){const r=e?.months||[];if(!r.length||!t)return t;const s=r[r.length-1],i=a||metaReportMonthKeyFromDate(o);return!i||s.monthKey!==i||!(n?metaReportScenarioPointHasBottomlineInputs(s):metaReportScenarioPointHasTopline(s))?t:metaReportScenarioBlendEfficiency(metaReportEfficiencyFromPreparedMonth(s),t,.65)}function metaReportScenarioMonthlyTrend(e=[],t=.75,{dampenHotStreak:n=!1,metricKey:a="efficiencyIndex"}={}){if(e.length<META_SCENARIO_MIN_TREND_MONTHS)return{trendRate:0,trendDirection:"flat",trendRatePct:0,trendR:0};const o=e.map(u=>metaReportParseAmount(u.spend)).filter(u=>u>0),r=metaReportScenarioMedian(o)||1,s=e.map((u,p)=>{const h=metaReportParseAmount(u.spend),g=metaReportParseAmount(u[a]),b=g>0?g:1e-6,y=h>0?h:r;return{x:p,y:Math.log(b)-t*Math.log(y/r)}}),{slope:i,r:l}=metaReportScenarioLinearRegression(s);let c=Math.max(-META_SCENARIO_MAX_MONTHLY_TREND,Math.min(META_SCENARIO_MAX_MONTHLY_TREND,i));if(n){const u=e.map(g=>metaReportParseAmount(g[a])).filter(g=>g>0),p=metaReportScenarioMedian(u),h=e.slice(-3).reduce((g,b)=>g+metaReportParseAmount(b[a]),0)/Math.min(3,e.length);p>0&&h>p*1.15&&c>0&&(c*=.5)}let d="flat";return Math.abs(c)>=.005&&(d=c>0?"up":"down"),{trendRate:c,trendDirection:d,trendRatePct:metaReportRoundRatio(c*100),trendR:metaReportRoundRatio(l)}}function metaReportScenarioCalibrateElasticity(){return META_REPORT_SCENARIO_FIXED_ELASTICITY}function metaReportResolveScenarioConfidence(e=0){const t=Number.parseInt(e,10)||0;return t<4?"low":t<7?"medium":"high"}function metaReportComputeScenarioEfficiency(e=[],{blendHistory:t=!1,includeTrend:n=!1,cautionStrongMonths:a=!1,hasBottomline:o=!1}={}){const r=META_REPORT_SCENARIO_FIXED_ELASTICITY,s=metaReportScenarioCalibrateElasticity(),i=metaReportScenarioRecencyEfficiency(e),l=metaReportScenarioPooledEfficiency(e);if(!i||i.avgCpl<=0)return{efficiency:null,elasticity:s,presetElasticity:r,trendRate:0,trendDirection:"flat",trendRatePct:0,trendR:0};const c=t?metaReportScenarioBlendEfficiency(l,i,.5):i;let d={trendRate:0,trendDirection:"flat",trendRatePct:0,trendR:0};if(n){const p=metaReportScenarioMonthlyTrend(e,s,{dampenHotStreak:a,metricKey:o?"profitEfficiencyIndex":"efficiencyIndex"});Math.abs(p.trendR)>=META_SCENARIO_TREND_R_THRESHOLD&&(d=p)}return{efficiency:c,elasticity:s,presetElasticity:r,...d}}function metaReportProjectBudgetAtSpend({baselineSpend:e,spend:t,efficiency:n,elasticity:a=.75,trendAdj:o=1,hasBottomline:r=!1}={}){const s=metaReportParseAmount(e),i=metaReportParseAmount(t);if(i<=0||s<=0||!n||n.avgCpl<=0)return{spend:0,leads:0,wonLeads:0,totalLeadValue:0,roasKr:0,roasX:0,poasKr:null,poasX:null};const l=s/n.avgCpl,c=i/s,d=metaReportParseAmount(o)>0?metaReportParseAmount(o):1,u=Math.max(0,Math.round(l*c**a*d)),p=Math.round(u*n.winRate),h=metaReportRoundMoney(p*n.avgLeadValue),g=metaReportRoundMoney(h-i),b=i>0?metaReportRoundRatio(g/i):0;let y=null,m=null;if(r&&n.avgProfitPerWon>0){const f=metaReportRoundMoney(p*n.avgProfitPerWon);y=metaReportRoundMoney(f-i),m=i>0?metaReportRoundRatio(y/i):0}return{spend:i,leads:u,wonLeads:p,totalLeadValue:h,roasKr:g,roasX:b,poasKr:y,poasX:m}}function metaReportSpendFromMonthKey(e=[],t=null,n=null){if(!n)return 0;const a=t?.months?.[n];if(a&&!a.meta?.emptyMonth&&metaReportMonthPeriodAligned(a)){const r=metaReportParseAmount(a.meta?.spend);if(r>0)return r}const o=e.find(r=>r.monthKey===n);return o?metaReportParseAmount(o.spend):0}function buildMetaReportScenarioProjection(e,t){const n=getMetaReportScenarioPillsFromState(),a=resolveMetaReportScenarioPayload(t)||t,o=payloadHasMetaReportBottomline(a),r=filterMetaReportScenarioSeries(e,{hasBottomline:o});return metaReportProjectBudgetScenario({series:r,multiplier:metaReportsState.budgetMultiplier,hasBottomline:o,blendHistory:n.blendHistory,includeTrend:n.includeTrend,monthWindow:metaReportsState.scenarioMonthWindow,baselineMode:metaReportsState.budgetBaseline,activeMonthKey:resolveMetaReportScenarioActiveMonthKey(a),smoothOutliers:n.smoothUneven,payload:a})}function isMetaReportViewingPastYear(e){const t=Number(e?.year||metaReportsState.selectedYear),n=getMetaReportCalendarYear(e);return Number.isFinite(t)&&t<n}function updateMetaReportScenarioSource(e){if(!e)return;const t=getMetaReportCalendarYear(e);if(Number(e.year)!==t)return;const{series:n,demo:a}=resolveMetaReportChartSeries(e,{allowDemo:!1});if(!n.length||a){metaReportsState.scenarioSourcePayload=null,metaReportsState.scenarioSeries=null;return}metaReportsState.scenarioSourcePayload=e,metaReportsState.scenarioSeries=n}function resolveMetaReportScenarioPayload(e){return isMetaReportViewingPastYear(e)&&metaReportsState.scenarioSourcePayload?metaReportsState.scenarioSourcePayload:e}function resolveMetaReportScenarioSeries(e){return metaReportsState.chartSeries?.length?metaReportsState.chartSeries:isMetaReportViewingPastYear(e)?metaReportsState.scenarioSeries||[]:[]}function resolveMetaReportScenarioActiveMonthKey(e){return isMetaReportViewingPastYear(e)?metaReportMonthKeyFromDate(new Date):metaReportsState.activeMonthKey}async function ensureMetaReportScenarioSource(e,{editable:t=!1}={}){if(!e||!isMetaReportViewingPastYear(e)||metaReportsState.scenarioSeries?.length)return;const n=getMetaReportCalendarYear(e),a=e.clientId;try{if(t&&a){const o=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(a)}?year=${encodeURIComponent(n)}`);updateMetaReportScenarioSource(o);return}if(REPORT_TOKEN){const o=await fetch(`/api/meta-reports/public/${encodeURIComponent(REPORT_TOKEN)}?year=${encodeURIComponent(n)}`).then(async r=>{const s=await r.json();if(!r.ok)throw new Error(s.error||"Report not found");return s});updateMetaReportScenarioSource(o)}}catch{}}function resolveMetaReportLastMonthBaseline(e=[],{activeMonthKey:t=null,asOfDate:n=new Date,payload:a=null}={}){const o=e.filter(c=>metaReportParseAmount(c.spend)>0).sort((c,d)=>String(c.monthKey).localeCompare(String(d.monthKey)));if(!o.length)return null;const r=t||metaReportMonthKeyFromDate(n);if(!r)return null;const s=r?metaReportAddMonthsToMonthKey(r,-1):null;if(!s)return null;const i=o.find(c=>c.monthKey===s),l=metaReportSpendFromMonthKey(e,a,s);return!i&&l<=0?null:{monthKey:s,label:metaMonthLabel(s),spend:l>0?l:metaReportParseAmount(i.spend)}}function resolveMetaReportPreparedWindowAverageSpend(e=[]){if(!e.length)return 0;const t=e.reduce((n,a)=>n+metaReportParseAmount(a.spend),0);return t>0?metaReportRoundMoney(t/e.length):0}function resolveMetaReportLatestPreparedSpend(e=[]){for(let t=e.length-1;t>=0;t-=1){const n=metaReportParseAmount(e[t]?.spend);if(n>0)return n}return 0}function resolveMetaReportScenarioBaselineSpend(e,t,{baselineMode:n="year",activeMonthKey:a=null,asOfDate:o=new Date,payload:r=null}={}){const s=t?.months||[];let i=0;if(n==="month"&&a){if(i=metaReportSpendFromMonthKey(e,r,a),i<=0){const l=s.find(c=>c.monthKey===a);l&&metaReportParseAmount(l.spend)>0&&(i=metaReportParseAmount(l.spend))}}else if(n==="last"){const l=resolveMetaReportLastMonthBaseline(e,{activeMonthKey:a,asOfDate:o,payload:r});l?.spend>0&&(i=l.spend)}else n==="year"&&(i=resolveMetaReportPreparedWindowAverageSpend(s));return i<=0&&(i=resolveMetaReportPreparedWindowAverageSpend(s)),i<=0&&(i=resolveMetaReportLatestPreparedSpend(s)),i}function metaReportProjectBudgetScenario({series:e=[],baselineSpend:t,multiplier:n=1,hasBottomline:a=!1,blendHistory:o=!1,includeTrend:r=!1,cautionStrongMonths:s=!1,monthWindow:i="6",baselineMode:l="year",activeMonthKey:c=null,asOfDate:d=new Date,smoothOutliers:u=!0,payload:p=null}={}){const h=metaReportPrepareScenarioSeries(e,{windowMonths:i,asOfDate:d,smoothOutliers:u,hasBottomline:a}),g=metaReportComputeScenarioEfficiency(h.months,{blendHistory:o,includeTrend:r,cautionStrongMonths:s,hasBottomline:a});let b=metaReportParseAmount(t);b||(b=resolveMetaReportScenarioBaselineSpend(e,h,{baselineMode:l,activeMonthKey:c,asOfDate:d,payload:p}));const y=metaReportParseAmount(n)||1;let{efficiency:m,elasticity:f,trendRate:v}=g;if(m=metaReportResolveScenarioProjectionEfficiency(h,m,{hasBottomline:a,activeMonthKey:c,asOfDate:d}),!m||m.avgCpl<=0||b<=0||h.monthsUsed<META_SCENARIO_MIN_EFFICIENCY_MONTHS)return{...g,efficiency:m,prepared:h,baseline:metaReportProjectBudgetAtSpend({baselineSpend:0,spend:0,efficiency:m}),projected:metaReportProjectBudgetAtSpend({baselineSpend:0,spend:0,efficiency:m}),projectedConservative:null,projectedOptimistic:null,multiplier:y,baselineSpend:b,hasBottomline:a,insufficientData:!0,insufficientReason:h.monthsUsed<META_SCENARIO_MIN_EFFICIENCY_MONTHS?"need_more_months":b<=0?"need_baseline_spend":"need_efficiency"};const w=Math.exp(v*1),S=metaReportProjectBudgetAtSpend({baselineSpend:b,spend:b,efficiency:m,elasticity:f,trendAdj:1,hasBottomline:a}),C=metaReportProjectBudgetAtSpend({baselineSpend:b,spend:metaReportRoundMoney(b*y),efficiency:m,elasticity:f,trendAdj:w,hasBottomline:a}),E=metaReportProjectBudgetAtSpend({baselineSpend:b,spend:metaReportRoundMoney(b*y),efficiency:m,elasticity:f,trendAdj:Math.exp(Math.min(v,0)*1),hasBottomline:a}),I=metaReportProjectBudgetAtSpend({baselineSpend:b,spend:metaReportRoundMoney(b*y),efficiency:m,elasticity:f,trendAdj:Math.exp(Math.max(v,0)*1),hasBottomline:a});return{...g,efficiency:m,prepared:h,baseline:S,projected:C,projectedConservative:E,projectedOptimistic:I,multiplier:y,baselineSpend:b,hasBottomline:a,insufficientData:!1}}function metaReportBuildScenarioProjectionMonthKeys(e=META_REPORT_SCENARIO_PROJECTED_MONTHS,t=new Date){const n=metaReportMonthKeyFromDate(t);if(!n||e<=0)return[];const a=[];for(let o=1;o<=e;o+=1)a.push(metaReportAddMonthsToMonthKey(n,o));return a}function metaReportResolveScenarioStepMultiplier(e,t=1){const n=metaReportParseAmount(t)||1,a=Number.parseInt(e,10)||1;return n<=META_SCENARIO_SPEND_RAMP_CAP?n:a<=1?META_SCENARIO_SPEND_RAMP_CAP:n}function buildMetaReportScenarioProjectionSteps(e,{months:t=META_REPORT_SCENARIO_PROJECTED_MONTHS,hasBottomline:n=!1,asOfDate:a=new Date,targetMultiplier:o=null}={}){if(!e||e.insufficientData)return[];const r=metaReportParseAmount(e.baselineSpend),s=metaReportParseAmount(o??e.multiplier)||1,i=e.efficiency,l=e.elasticity||.75,c=e.trendRate||0,d=metaReportBuildScenarioProjectionMonthKeys(t,a),u=[];for(let p=1;p<=t;p+=1){const h=metaReportResolveScenarioStepMultiplier(p,s),g=metaReportRoundMoney(r*h),b=Math.exp(c*p),y=metaReportProjectBudgetAtSpend({baselineSpend:r,spend:g,efficiency:i,elasticity:l,trendAdj:b,hasBottomline:n}),m=d[p-1]||null;u.push({label:m?metaMonthLabel(m):`+${p} mo`,monthKey:m,spendMultiplier:metaReportRoundRatio(h),spend:y.spend,leads:y.leads,wonLeads:y.wonLeads,totalLeadValue:y.totalLeadValue,roasKr:y.roasKr,roasX:y.roasX,poasKr:y.poasKr,poasX:y.poasX})}return u}function metaReportSpendAxisTick(e){const t=Number(e)||0;return Math.abs(t)>=1e6?`${(t/1e6).toFixed(1)}M`:Math.abs(t)>=1e3?`${Math.round(t/1e3)}K`:t}function metaReportSpendMultiplierValue(e,t){const n=metaReportParseAmount(t),a=metaReportParseAmount(e);return n<=0?0:metaReportRoundRatio(a/n)}function resolveMetaReportSpendChartBaseline(e,t=null){const n=metaReportParseAmount(t?.baselineSpend);return n>0?n:metaReportAggregateSeriesEfficiency(e).avgMonthlySpend}function trimMetaReportScenarioSeries(e,t=META_REPORT_SCENARIO_MAX_HISTORICAL){const n=e.filter(a=>metaReportParseAmount(a.spend)>0);return n.length>t?n.slice(-t):n}function metaReportMonthKeyFromDate(e=new Date){const t=e instanceof Date?e:new Date(e);return Number.isNaN(t.getTime())?null:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`}function metaReportAddMonthsToMonthKey(e,t=0){const n=String(e||"").trim();if(!/^\d{4}-\d{2}$/.test(n))return null;const[a,o]=n.split("-").map(Number),r=new Date(a,o-1+t,1);return`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}`}function metaReportDeltaPct(e,t){const n=metaReportParseAmount(t),a=metaReportParseAmount(e);return n?metaReportRoundRatio((a-n)/Math.abs(n)*100):null}function metaReportResolveBaselineSpend(e,t,n=null){if(n?.baselineSpend>0)return metaReportParseAmount(n.baselineSpend);const a=getMetaReportScenarioPillsFromState(),o=payloadHasMetaReportBottomline(e),r=n?.prepared||metaReportPrepareScenarioSeries(t,{windowMonths:metaReportsState.scenarioMonthWindow,smoothOutliers:a.smoothUneven,hasBottomline:o});return resolveMetaReportScenarioBaselineSpend(t,r,{baselineMode:metaReportsState.budgetBaseline,activeMonthKey:resolveMetaReportScenarioActiveMonthKey(e),payload:e})}function resolveMetaReportScenarioDisplayTimeline(e,t=[]){return metaReportsState.chartSeries?.length?metaReportsState.chartSeries:e?buildMetaReportChartSeries(e):t}function resolveMetaReportScenarioActiveTimeline(e=[]){const t=metaReportMonthKeyFromDate(new Date);return e.filter(n=>!t||!n.monthKey||n.monthKey<=t)}function resolveMetaReportScenarioAdActiveSeries(e,t){const n=resolveMetaReportScenarioActiveTimeline(e);return t==="poas"?n.filter(a=>a.poasKr!=null&&a.poasX!=null&&metaReportParseAmount(a.spend)>0):n.filter(a=>metaReportParseAmount(a.spend)>0)}function resolveMetaReportScenarioLastAdActiveIndex(e=[]){return e.reduce((t,n,a)=>metaReportParseAmount(n.spend)>0?a:t,-1)}function resolveMetaReportScenarioMonthWindowLimit(e=metaReportsState.scenarioMonthWindow){const t=normalizeMetaReportScenarioMonthWindow(e);return t==="all"?1/0:Number.parseInt(t,10)||6}function resolveMetaReportScenarioChartSeries(e){const t=metaReportMonthKeyFromDate(new Date),n=e.filter(r=>!(metaReportParseAmount(r.spend)<=0||t&&r.monthKey&&r.monthKey>t)),a=resolveMetaReportScenarioMonthWindowLimit();return trimMetaReportScenarioSeries(n,a===1/0?META_REPORT_SCENARIO_MAX_HISTORICAL:a)}function resolveMetaReportScenarioBaselineHints(e=[],t=null,n=null){const a=n||metaReportsState.clientPayload||null,o=getMetaReportScenarioPillsFromState(),r=payloadHasMetaReportBottomline(a),s=t?.prepared||metaReportPrepareScenarioSeries(e,{windowMonths:metaReportsState.scenarioMonthWindow,smoothOutliers:o.smoothUneven,hasBottomline:r}),i=resolveMetaReportScenarioActiveMonthKey(a),l=metaReportMonthKeyFromDate(new Date),c=getMetaReportCalendarYear(a)||a?.year||metaReportsState.selectedYear||(i?Number(String(i).slice(0,4)):null),d={activeMonthKey:i,asOfDate:new Date,payload:a},u=resolveMetaReportLastMonthBaseline(e,d),p=resolveMetaReportScenarioBaselineSpend(e,s,{baselineMode:"year",...d}),h=resolveMetaReportScenarioBaselineSpend(e,s,{baselineMode:"last",...d}),g=resolveMetaReportScenarioBaselineSpend(e,s,{baselineMode:"month",...d}),b=!!(l&&c&&String(l).startsWith(`${c}-`));return{windowAverage:p,windowMonthCount:s.monthsUsed||s.months.length||0,selectedMonthSpend:g,selectedMonthLabel:i?metaMonthLabel(i):"",activeKey:i,currentMonthSpend:b?metaReportSpendFromMonthKey(e,a,l):0,currentMonthLabel:b?metaMonthLabel(l):"",currentKey:b?l:null,lastMonthSpend:h,lastMonthLabel:u?.label||"",lastMonthKey:u?.monthKey||null}}function renderMetaReportBaselineSelectOptions(e=null,t="year"){const n=e?.windowAverage>0?metaReportFmtBaselineAmount(e.windowAverage):"\u2014",a=e?.lastMonthSpend>0?metaReportFmtBaselineAmount(e.lastMonthSpend):"\u2014",o=e?.selectedMonthSpend>0?metaReportFmtBaselineAmount(e.selectedMonthSpend):"\u2014",r=normalizeMetaReportBudgetBaseline(t),s=e?.lastMonthLabel?`Last month \xB7 ${e.lastMonthLabel}`:"Last month";return`
    <option value="year"${r==="year"?" selected":""}>Window average \xB7 ${esc(n)}</option>
    <option value="last"${r==="last"?" selected":""}>${esc(s)} \xB7 ${esc(a)}</option>
    <option value="month"${r==="month"?" selected":""}>Selected month \xB7 ${esc(o)}</option>
  `}function syncMetaReportBaselineUi(e=[],t=null,n=null){const a=resolveMetaReportScenarioBaselineHints(e,t,n),o=document.getElementById("meta-report-budget-baseline");if(o){const r=o.value||metaReportsState.budgetBaseline;o.innerHTML=renderMetaReportBaselineSelectOptions(a,r),o.value=normalizeMetaReportBudgetBaseline(r)}}function renderMetaReportScenarioInsufficientMessage(e){const t=e?.prepared?.monthsAvailable??0,n=e?.prepared?.monthsUsed??0,a=metaReportParseAmount(e?.baselineSpend),o=e?.insufficientReason||"";return o==="need_baseline_spend"||n>=META_SCENARIO_MIN_EFFICIENCY_MONTHS&&a<=0?"Could not resolve baseline spend for the selected baseline mode. Try Window average or choose a month with ad spend.":t>0&&t<META_SCENARIO_MIN_EFFICIENCY_MONTHS?`Only ${t} month${t===1?"":"s"} in the history window has ad spend, leads, won leads, and average lead value (need at least ${META_SCENARIO_MIN_EFFICIENCY_MONTHS}).`:n>=META_SCENARIO_MIN_EFFICIENCY_MONTHS&&o==="need_efficiency"?"Could not estimate efficiency from the selected history window. Check that won leads and average lead value are filled in for those months.":"Add at least two months with ad spend, leads, won leads, and average lead value in the selected history window to model a budget scenario."}function renderMetaReportScenarioContextStrip(e){if(!e||e.insufficientData)return`<p class="meta-report-scenario-context" id="meta-report-scenario-context">${esc(renderMetaReportScenarioInsufficientMessage(e))}</p>`;const t=describeActiveMetaReportScenarioPills(),n=t.length?t.join(" \xB7 "):"Recent months only",a=e.trendDirection==="up"?`trend up ${Math.abs(e.trendRatePct||0).toFixed(1)}%/mo`:e.trendDirection==="down"?`trend down ${Math.abs(e.trendRatePct||0).toFixed(1)}%/mo`:"trend flat",o=e.prepared?.outliersAdjusted?` \xB7 ${e.prepared.outliersAdjusted} uneven month${e.prepared.outliersAdjusted===1?"":"s"} removed`:"",s={low:"Low confidence",medium:"Medium confidence",high:"High confidence"}[e.prepared?.confidence]||"",i=s?` \xB7 ${s} (${e.prepared?.monthsUsed||0} mo data)`:"";return`<p class="meta-report-scenario-context" id="meta-report-scenario-context"><strong>Active:</strong> ${esc(n)} \xB7 last ${e.prepared?.monthsUsed||0} ad months \xB7 ${esc(a)}${esc(o)}${esc(i)}</p>`}function payloadHasMetaReportBottomline(e){return e?.settings?.metaReportShowBottomline===!1?!1:seriesHasBottomline(metaReportsState.chartSeries||buildMetaReportChartSeries(e))}function seriesHasBottomline(e=[]){return e.some(t=>t.poasKr!=null&&t.poasX!=null)}function renderMetaReportChartsPanel({editable:e=!1}={}){const t=metaReportsState.chartTab||"trend";return`
    <aside class="meta-report-charts-panel" id="meta-report-charts-panel">
      <span class="meta-report-chart-demo-badge" id="meta-report-chart-demo-badge" hidden>Sample trend data</span>
      <div class="meta-report-chart-toolbar">
        <div class="meta-report-chart-tabs" role="tablist" aria-label="Chart views">
          <button type="button" class="meta-report-chart-tab${t==="trend"?" is-active":""}" data-meta-chart-tab="trend" role="tab" aria-selected="${t==="trend"}">Monthly trend</button>
          <button type="button" class="meta-report-chart-tab${t==="spend"?" is-active":""}" data-meta-chart-tab="spend" role="tab" aria-selected="${t==="spend"}">Spend vs return</button>
        </div>
        ${e?`
        <div class="meta-report-spend-chart-type-wrap" id="meta-report-spend-chart-type-wrap"${t==="spend"?"":" hidden"}>
          ${renderMetaReportSpendChartTypePicker({editable:!0})}
        </div>
        `:""}
      </div>
      <div class="meta-report-chart-tab-panel${t==="trend"?" is-active":""}" data-meta-chart-panel="trend" role="tabpanel"${t==="trend"?"":" hidden"}>
        <div class="meta-report-chart-card" data-meta-chart="roas">
          <div class="meta-report-chart-head">
            <h3 class="meta-report-chart-title">ROAS trend</h3>
            <div class="meta-report-chart-toggle" id="meta-chart-roas-mode" role="group" aria-label="ROAS display mode">
              <button type="button" class="meta-report-chart-toggle-btn is-active" data-mode="kr">Dkr</button>
              <button type="button" class="meta-report-chart-toggle-btn" data-mode="x">Multiplier</button>
            </div>
          </div>
          <div class="meta-report-chart-canvas-wrap">
            <canvas id="meta-report-chart-roas" aria-label="ROAS trend chart"></canvas>
            <p class="meta-report-chart-empty" id="meta-report-chart-roas-empty" hidden>Not enough data for a trend yet.</p>
          </div>
        </div>
        <div class="meta-report-chart-card" data-meta-chart="poas">
          <div class="meta-report-chart-head">
            <h3 class="meta-report-chart-title">POAS trend</h3>
            <div class="meta-report-chart-toggle" id="meta-chart-poas-mode" role="group" aria-label="POAS display mode">
              <button type="button" class="meta-report-chart-toggle-btn is-active" data-mode="kr">Dkr</button>
              <button type="button" class="meta-report-chart-toggle-btn" data-mode="x">Multiplier</button>
            </div>
          </div>
          <div class="meta-report-chart-canvas-wrap">
            <canvas id="meta-report-chart-poas" aria-label="POAS trend chart"></canvas>
            <p class="meta-report-chart-empty" id="meta-report-chart-poas-empty" hidden>Not enough data for a trend yet.</p>
          </div>
        </div>
      </div>
      <div class="meta-report-chart-tab-panel${t==="spend"?" is-active":""}" data-meta-chart-panel="spend" role="tabpanel"${t==="spend"?"":" hidden"}>
        <div class="meta-report-chart-card" data-meta-chart="scatter-roas">
          <div class="meta-report-chart-head">
            <h3 class="meta-report-chart-title">Ad spend & ROAS by month</h3>
            <div class="meta-report-chart-toggle" id="meta-chart-scatter-roas-mode" role="group" aria-label="ROAS spend chart display mode">
              <button type="button" class="meta-report-chart-toggle-btn is-active" data-mode="kr">Dkr</button>
              <button type="button" class="meta-report-chart-toggle-btn" data-mode="x">Multiplier</button>
            </div>
          </div>
          <div class="meta-report-chart-canvas-wrap">
            <canvas id="meta-report-chart-scatter-roas" aria-label="Ad spend and ROAS by month chart"></canvas>
            <p class="meta-report-chart-empty" id="meta-report-chart-scatter-roas-empty" hidden>Not enough data for a spend chart yet.</p>
          </div>
        </div>
        <div class="meta-report-chart-card" data-meta-chart="scatter-poas">
          <div class="meta-report-chart-head">
            <h3 class="meta-report-chart-title">Ad spend & POAS by month</h3>
            <div class="meta-report-chart-toggle" id="meta-chart-scatter-poas-mode" role="group" aria-label="POAS spend chart display mode">
              <button type="button" class="meta-report-chart-toggle-btn is-active" data-mode="kr">Dkr</button>
              <button type="button" class="meta-report-chart-toggle-btn" data-mode="x">Multiplier</button>
            </div>
          </div>
          <div class="meta-report-chart-canvas-wrap">
            <canvas id="meta-report-chart-scatter-poas" aria-label="Ad spend and POAS by month chart"></canvas>
            <p class="meta-report-chart-empty" id="meta-report-chart-scatter-poas-empty" hidden>Not enough data for a spend chart yet.</p>
          </div>
        </div>
      </div>
    </aside>
  `}const META_REPORT_COMPARISON_PRESETS=[{id:"mom",label:"This month vs last month"},{id:"months",label:"Compare months"},{id:"custom",label:"Custom dates"},{id:"ytd",label:"This year vs last year"}],META_REPORT_COMPARISON_TABLE_GROUPS=[{title:"Meta ads",accent:"meta",rows:[{label:"Total spend",metricId:"spend",format:"kr",higherIsBetter:null},{label:"Cost Pr Mile (CPM)",metricId:"cpm",format:"kr",higherIsBetter:!1},{label:"Impressions",metricId:"impressions",format:"num",higherIsBetter:!0},{label:"Reach",metricId:"reach",format:"num",higherIsBetter:!0},{label:"Click",metricId:"clicks",format:"num",higherIsBetter:!0},{label:"CTR",metricId:"conversionRatePercent",format:"pct",higherIsBetter:!0}]},{title:"Topline KPI'er",accent:"topline",highlightLastN:2,rows:[{label:"Leads",metricId:"leads",format:"num",higherIsBetter:!0},{label:"Cost Per Lead (CPL)",metricId:"cpl",format:"kr",higherIsBetter:!1},{label:"Won leads",metricId:"wonLeads",format:"num",higherIsBetter:!0},{label:"Total Lead Value",metricId:"totalLeadValue",format:"kr",higherIsBetter:!0},{label:"Average Lead Value",metricId:"avgLeadValue",format:"kr",higherIsBetter:!0},{label:"Client acquisition cost (CAC)",metricId:"cac",format:"kr",higherIsBetter:!1},{label:"Return on Ads Spend (ROAS)",metricId:"roasKr",format:"kr",higherIsBetter:!0},{label:"Return on Ads Spend % (ROAS)",metricId:"roasX",format:"x",higherIsBetter:!0}]},{title:"Bottomline KPI'er",accent:"bottomline",highlightLastN:2,bottomlineOnly:!0,rows:[{label:"Leads",metricId:"leads",format:"num",higherIsBetter:!0},{label:"Won leads",metricId:"wonLeads",format:"num",higherIsBetter:!0},{label:"Total Lead Value",metricId:"totalLeadValue",format:"kr",higherIsBetter:!0},{label:"Average Lead Value",metricId:"avgLeadValue",format:"kr",higherIsBetter:!0},{label:"Client acquisition cost (CAC)",metricId:"cac",format:"kr",higherIsBetter:!1},{label:"Avg Total Profit",metricId:"totalProfit",format:"kr",higherIsBetter:!0},{label:"Avg Single Profit Order",metricId:"avgProfitPerWon",format:"kr",higherIsBetter:!0},{label:"Profit on Ads Spend (POAS)",metricId:"poasKr",format:"kr",higherIsBetter:!0},{label:"Profit on Ads Spend % (POAS)",metricId:"poasX",format:"x",higherIsBetter:!0},{label:"Censio fee",metricId:"censioFee",format:"kr",higherIsBetter:!1},{label:"Profit on Investment (POI)",metricId:"poiKr",format:"kr",higherIsBetter:!0},{label:"Profit on Investment % (POI)",metricId:"poiX",format:"x",higherIsBetter:!0}]}];function metaReportComparisonAddMonths(e,t=0){const n=String(e||"").trim();if(!/^\d{4}-\d{2}$/.test(n))return null;const[a,o]=n.split("-").map(Number),r=new Date(a,o-1+t,1);return`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}`}function metaReportComparisonMonthKeysInRange(e,t){if(!e||!t)return[];const[n,a]=e<=t?[e,t]:[t,e],o=[];let r=n;for(;r&&r<=a&&(o.push(r),r!==a);)r=metaReportComparisonAddMonths(r,1);return o}function metaReportComparisonParseDate(e){const t=String(e||"").trim().slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(t))return null;const[n,a,o]=t.split("-").map(Number),r=new Date(n,a-1,o);return r.getFullYear()!==n||r.getMonth()!==a-1||r.getDate()!==o?null:t}function metaReportComparisonDaysInclusive(e,t){const n=metaReportComparisonParseDate(e),a=metaReportComparisonParseDate(t);if(!n||!a||n>a)return 0;const[o,r,s]=n.split("-").map(Number),[i,l,c]=a.split("-").map(Number),d=Date.UTC(o,r-1,s),u=Date.UTC(i,l-1,c);return Math.floor((u-d)/864e5)+1}function metaReportComparisonOverlapDays(e,t,n,a){const o=e>n?e:n,r=t<a?t:a;return!o||!r||o>r?0:metaReportComparisonDaysInclusive(o,r)}function metaReportComparisonMonthKeysOverlappingDates(e,t){const n=metaReportComparisonParseDate(e),a=metaReportComparisonParseDate(t);if(!n||!a)return[];const[o,r]=n<=a?[n,a]:[a,n],s=[];let i=metaReportComparisonMonthKeyFromDate(o);const l=metaReportComparisonMonthKeyFromDate(r);for(;i&&i<=l&&(s.push(i),i!==l);)i=metaReportComparisonAddMonths(i,1);return s}function metaReportComparisonMonthEffectivePeriod(e,t){const n=metaReportMonthBounds(t||e?.monthKey),a=metaReportComparisonParseDate(e?.periodStart)||n.start,o=metaReportComparisonParseDate(e?.periodEnd)||n.end;return a&&o&&a<=o?{start:a,end:o}:n}function metaReportComparisonFormatDateLabel(e){const t=metaReportComparisonParseDate(e);if(!t)return"\u2014";const[n,a,o]=t.split("-").map(Number);return`${o} ${META_MONTH_LABELS[a-1]||a} ${n}`}function metaReportComparisonFormatDateRangeLabel(e,t){const n=metaReportComparisonParseDate(e),a=metaReportComparisonParseDate(t);if(!n||!a)return"\u2014";if(n===a)return metaReportComparisonFormatDateLabel(n);const o=n.slice(0,4),r=a.slice(0,4),s=n.slice(5,7),i=a.slice(5,7);if(o===r&&s===i){const[,l,c]=n.split("-").map(Number),[,,d]=a.split("-").map(Number);return`${c}\u2013${d} ${META_MONTH_LABELS[l-1]||l} ${o}`}return o===r?`${metaReportComparisonFormatDateLabel(n).replace(` ${o}`,"")}\u2013${metaReportComparisonFormatDateLabel(a)}`:`${metaReportComparisonFormatDateLabel(n)} \u2013 ${metaReportComparisonFormatDateLabel(a)}`}function metaReportComparisonMonthPayloadDates(e,t){const n=metaReportComparisonMonthEffectivePeriod(e,t);return{startDate:n.start,endDate:n.end,startMonthKey:t,endMonthKey:t}}function metaReportComparisonFullMonthDates(e){const t=metaReportMonthBounds(e);return{startDate:t.start,endDate:t.end,startMonthKey:e,endMonthKey:e}}function metaReportComparisonFormatDisplayLabel(e,t){const n=metaReportComparisonNormalizePeriod(t);return n?e==="mom"||e==="months"?metaReportComparisonPeriodLabel(n.startMonthKey,n.endMonthKey):e==="ytd"?n.startDate.slice(0,4):metaReportComparisonFormatDateRangeLabel(n.startDate,n.endDate):"\u2014"}function metaReportComparisonAggregateForMode(e,t,n){const a=metaReportComparisonNormalizePeriod(n);if(!a)return{label:"\u2014",monthKeys:[],monthCount:0,expectedMonthCount:0,partialData:!1,hasData:!1,hasBottomline:!1,metrics:metaReportComparisonAggregateDateRange({},null,null).metrics};let o;return e==="mom"||e==="months"?o=metaReportAggregateComparisonRange(t,a.startMonthKey,a.endMonthKey):o=metaReportComparisonAggregateDateRange(t,a.startDate,a.endDate),o.label=metaReportComparisonFormatDisplayLabel(e,a),o}function metaReportComparisonNormalizePeriod(e=null){if(!e)return null;const t=metaReportComparisonParseDate(e.startDate)||(e.startMonthKey?metaReportMonthBounds(e.startMonthKey).start:null),n=metaReportComparisonParseDate(e.endDate)||(e.endMonthKey?metaReportMonthBounds(e.endMonthKey).end:null);if(!t||!n)return null;const[a,o]=t<=n?[t,n]:[n,t];return{startDate:a,endDate:o,startMonthKey:metaReportComparisonMonthKeyFromDate(a),endMonthKey:metaReportComparisonMonthKeyFromDate(o)}}function metaReportComparisonPeriodLabel(e,t){if(!e||!t)return"\u2014";if(e===t)return`${metaMonthLabel(e)} ${String(e).slice(0,4)}`;const n=String(e).slice(0,4),a=String(t).slice(0,4);return n===a?`${metaMonthLabel(e)}\u2013${metaMonthLabel(t)} ${n}`:`${metaMonthLabel(e)} ${n}\u2013${metaMonthLabel(t)} ${a}`}function metaReportMonthHasComparisonData(e){return!e||e.meta?.emptyMonth?!1:metaReportParseAmount(e.meta?.spend)>0||metaReportParseAmount(e.topline?.leads)>0}function metaReportAggregateComparisonRange(e={},t,n){const a=metaReportComparisonMonthKeysInRange(t,n),o=[];let r=!1,s=0,i=0,l=0,c=0,d=0,u=0,p=0,h=0,g=0,b=0,y=0,m=0,f=0;for(const L of a){const D=e[L];if(!metaReportMonthHasComparisonData(D))continue;o.push(L),D.bottomline&&(r=!0);const k=metaReportParseAmount(D.meta?.spend),F=metaReportParseAmount(D.meta?.impressions),P=metaReportParseAmount(D.topline?.leads),O=metaReportParseAmount(D.topline?.wonLeads);s+=k,i+=F,l+=metaReportParseAmount(D.meta?.reach),c+=metaReportParseAmount(D.meta?.clicks),d+=P,u+=O,p+=metaReportParseAmount(D.topline?.totalLeadValue),O>0&&(b+=metaReportParseAmount(D.topline?.avgLeadValue)*O,D.bottomline&&(y+=metaReportParseAmount(D.bottomline.avgProfitPerWon)*O)),F>0&&(m+=metaReportParseAmount(D.meta?.cpm)*F,f+=F),D.bottomline&&(h+=metaReportParseAmount(D.bottomline.totalProfit),g+=metaReportParseAmount(D.bottomline.censioFee))}const v=d>0?Math.round(s/d*100)/100:0,$=u>0?Math.round(s/u*100)/100:0,w=u>0?Math.round(b/u*100)/100:0,S=u>0?Math.round(y/u*100)/100:0,C=f>0?Math.round(m/f*100)/100:0,E=i>0?Math.round(c/i*100*1e8)/1e8:0,I=Math.round((p-s)*100)/100,R=s>0?Math.round(I/s*1e8)/1e8:0,A=Math.round((h-s)*100)/100,B=s>0?Math.round(A/s*1e8)/1e8:0,M=r?Math.round((A-g)*100)/100:0,T=s>0&&r?Math.round(M/s*1e8)/1e8:0;return{startKey:t,endKey:n,label:metaReportComparisonPeriodLabel(t,n),monthKeys:o,monthCount:o.length,expectedMonthCount:a.length,partialData:o.length>0&&o.length<a.length,hasData:o.length>0,hasBottomline:r,metrics:{spend:s,cpm:C,impressions:i,reach:l,clicks:c,conversionRatePercent:E,leads:d,cpl:v,wonLeads:u,totalLeadValue:p,avgLeadValue:w,cac:$,roasKr:I,roasX:R,totalProfit:h,avgProfitPerWon:S,poasKr:A,poasX:B,censioFee:g,poiKr:M,poiX:T}}}function metaReportComparisonAggregateDateRange(e={},t,n){const a=metaReportComparisonParseDate(t),o=metaReportComparisonParseDate(n);if(!a||!o)return{startDate:t||null,endDate:n||null,label:"\u2014",monthKeys:[],monthCount:0,expectedMonthCount:0,partialData:!1,hasData:!1,hasBottomline:!1,metrics:metaReportAggregateComparisonRange({},"0000-00","0000-00").metrics};const[r,s]=a<=o?[a,o]:[o,a],i=metaReportComparisonMonthKeysOverlappingDates(r,s),l=[];let c=!1,d=0,u=0,p=0,h=0,g=0,b=0,y=0,m=0,f=0,v=0,$=0,w=0,S=0,C=0,E=0;for(const _ of i){const x=e[_],H=metaReportComparisonMonthEffectivePeriod(x,_),K=metaReportComparisonOverlapDays(r,s,H.start,H.end);if(K<=0||(d+=K,!metaReportMonthHasComparisonData(x)))continue;l.push(_),u+=K,x.bottomline&&(c=!0);const W=metaReportComparisonDaysInclusive(H.start,H.end),N=W>0?K/W:0,Y=metaReportParseAmount(x.meta?.spend)*N,U=metaReportParseAmount(x.meta?.impressions)*N,j=metaReportParseAmount(x.topline?.leads)*N,V=metaReportParseAmount(x.topline?.wonLeads)*N;p+=Y,h+=U,g+=metaReportParseAmount(x.meta?.reach)*N,b+=metaReportParseAmount(x.meta?.clicks)*N,y+=j,m+=V,f+=metaReportParseAmount(x.topline?.totalLeadValue)*N,V>0&&(w+=metaReportParseAmount(x.topline?.avgLeadValue)*V,x.bottomline&&(S+=metaReportParseAmount(x.bottomline.avgProfitPerWon)*V)),U>0&&(C+=metaReportParseAmount(x.meta?.cpm)*U,E+=U),x.bottomline&&(v+=metaReportParseAmount(x.bottomline.totalProfit)*N,$+=metaReportParseAmount(x.bottomline.censioFee)*N)}const I=y>0?Math.round(p/y*100)/100:0,R=m>0?Math.round(p/m*100)/100:0,A=m>0?Math.round(w/m*100)/100:0,B=m>0?Math.round(S/m*100)/100:0,M=E>0?Math.round(C/E*100)/100:0,T=h>0?Math.round(b/h*100*1e8)/1e8:0,L=Math.round((f-p)*100)/100,D=p>0?Math.round(L/p*1e8)/1e8:0,k=Math.round((v-p)*100)/100,F=p>0?Math.round(k/p*1e8)/1e8:0,P=c?Math.round((k-$)*100)/100:0,O=p>0&&c?Math.round(P/p*1e8)/1e8:0;return{startDate:r,endDate:s,label:metaReportComparisonFormatDateRangeLabel(r,s),monthKeys:l,monthCount:l.length,expectedMonthCount:i.length,partialData:d>0&&u<d,hasData:l.length>0,hasBottomline:c,metrics:{spend:p,cpm:M,impressions:h,reach:g,clicks:b,conversionRatePercent:T,leads:y,cpl:I,wonLeads:m,totalLeadValue:f,avgLeadValue:A,cac:R,roasKr:L,roasX:D,totalProfit:v,avgProfitPerWon:B,poasKr:k,poasX:F,censioFee:$,poiKr:P,poiX:O}}}function metaReportComparisonMergedMonthsMap(e,t,n){const a=metaReportComparisonYearsNeeded(t,n),o={...e?.months||{}};return a.forEach(r=>{Number(e?.year)!==Number(r)&&Object.assign(o,metaReportComparisonMonthsForYear(e,r))}),o}function metaReportResolveComparisonPresetDates(e,t="mom"){const n=metaReportsState.activeMonthKey||null,a=metaReportComparisonMergedMonthsMap(e,null,null);if(t==="custom")return{mode:t,periodA:metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodA),periodB:metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodB)};if(t==="months"){const o=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodA),r=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodB),s=l=>l&&l.startMonthKey===l.endMonthKey;if(s(o)&&s(r))return{mode:t,periodA:o,periodB:r};if(!n)return{mode:t,periodA:null,periodB:null};const i=metaReportComparisonAddMonths(n,-1);return{mode:t,periodA:metaReportComparisonFullMonthDates(n),periodB:i?metaReportComparisonFullMonthDates(i):null}}if(!n)return{mode:t,periodA:null,periodB:null};if(t==="mom"){const o=metaReportComparisonAddMonths(n,-1);return{mode:t,periodA:metaReportComparisonFullMonthDates(n),periodB:o?metaReportComparisonFullMonthDates(o):null}}if(t==="ytd"){const o=String(n).slice(0,4),r=String(n).slice(5,7),s=String(Number(o)-1),i=metaReportMonthBounds(n),l=`${s}-${r}`,c=metaReportMonthBounds(l);return{mode:t,periodA:{startDate:`${o}-01-01`,endDate:i.end,startMonthKey:`${o}-01`,endMonthKey:n},periodB:{startDate:`${s}-01-01`,endDate:c.end,startMonthKey:`${s}-01`,endMonthKey:l}}}return{mode:t,periodA:null,periodB:null}}function metaReportApplyComparisonPresetDefaults(e,t=metaReportsState.comparisonMode){const n=metaReportResolveComparisonPresetDates(e,t);return n.periodA&&(metaReportsState.comparisonPeriodA={...n.periodA}),n.periodB&&(metaReportsState.comparisonPeriodB={...n.periodB}),n}function metaReportResolveComparisonPresets({activeMonthKey:e=null,mode:t="mom"}={}){const n=metaReportsState.clientPayload||metaReportsState.publicPayload;return metaReportResolveComparisonPresetDates(n,t)}function metaReportComparisonMetricDefs(e=!1){const t=[{id:"spend",label:"Ad spend",group:"meta",format:"kr",higherIsBetter:null},{id:"cpm",label:"CPM",group:"meta",format:"kr",higherIsBetter:!1},{id:"impressions",label:"Impressions",group:"meta",format:"num",higherIsBetter:!0},{id:"reach",label:"Reach",group:"meta",format:"num",higherIsBetter:!0},{id:"clicks",label:"Clicks",group:"meta",format:"num",higherIsBetter:!0},{id:"conversionRatePercent",label:"CTR",group:"meta",format:"pct",higherIsBetter:!0},{id:"leads",label:"Leads",group:"topline",format:"num",higherIsBetter:!0},{id:"cpl",label:"CPL",group:"topline",format:"kr",higherIsBetter:!1},{id:"wonLeads",label:"Won leads",group:"topline",format:"num",higherIsBetter:!0},{id:"totalLeadValue",label:"Total lead value",group:"topline",format:"kr",higherIsBetter:!0},{id:"avgLeadValue",label:"Average lead value",group:"topline",format:"kr",higherIsBetter:!0},{id:"cac",label:"CAC",group:"topline",format:"kr",higherIsBetter:!1},{id:"roasKr",label:"ROAS",group:"topline",format:"kr",higherIsBetter:!0},{id:"roasX",label:"ROAS %",group:"topline",format:"x",higherIsBetter:!0}];return e&&t.push({id:"totalProfit",label:"Total profit",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"avgProfitPerWon",label:"Avg profit per won",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"poasKr",label:"POAS",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"poasX",label:"POAS %",group:"bottomline",format:"x",higherIsBetter:!0},{id:"poiKr",label:"POI",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"poiX",label:"POI %",group:"bottomline",format:"x",higherIsBetter:!0}),t}function metaReportComparisonHeroIds(e=!1){return e?["spend","leads","wonLeads","roasKr","totalLeadValue","poasKr"]:["spend","leads","wonLeads","roasKr","totalLeadValue"]}function metaReportComparisonChartIds(e=!1,t="kr"){const n=["spend","leads","totalLeadValue"];return t==="x"?[...n,"roasX",...e?["poasX"]:[]]:[...n,"roasKr",...e?["poasKr"]:[]]}function metaReportBuildYtdByMonthComparison(e,t,n,a){if(!n||!a)return[];const o=metaReportComparisonMonthKeysInRange(n.startMonthKey,n.endMonthKey),r=String(a.startMonthKey||"").slice(0,4);return o.map(s=>{const i=String(s).slice(5,7),l=`${r}-${i}`,c=metaReportAggregateComparisonRange(e,s,s),d=metaReportAggregateComparisonRange(t,l,l);return{monthKey:s,label:metaMonthLabel(s),periodA:c.hasData?c.metrics:null,periodB:d.hasData?d.metrics:null,hasDataA:c.hasData,hasDataB:d.hasData}})}function metaReportBuildComparison({monthsMap:e={},monthsMapA:t=null,monthsMapB:n=null,periodA:a=null,periodB:o=null,mode:r="mom"}={}){const s=t||n||e,i=metaReportComparisonNormalizePeriod(a),l=metaReportComparisonNormalizePeriod(o);if(!i?.startDate||!i?.endDate||!l?.startDate||!l?.endDate)return{mode:r,insufficientData:!0,samePeriod:!1,periodA:null,periodB:null,deltas:{},heroMetrics:[],detailRows:[],ytdByMonth:[],hasBottomline:!1};const c=i.startDate===l.startDate&&i.endDate===l.endDate,d=metaReportComparisonAggregateForMode(r,s,a),u=metaReportComparisonAggregateForMode(r,s,o),p=d.hasBottomline||u.hasBottomline,h=!d.hasData&&!u.hasData,g=metaReportComparisonMetricDefs(p),b={},y=g.map(v=>{const $=d.metrics[v.id],w=u.metrics[v.id],S=metaReportDeltaPct($,w);return b[v.id]={pct:S,abs:Math.round((metaReportParseAmount($)-metaReportParseAmount(w))*100)/100},{...v,valueA:$,valueB:w,deltaPct:S}}),m=metaReportComparisonHeroIds(p).map(v=>{const $=g.find(w=>w.id===v);return{id:v,label:$?.label||v,valueA:d.metrics[v],valueB:u.metrics[v],deltaPct:b[v]?.pct??null,format:$?.format||"num",higherIsBetter:$?.higherIsBetter??null}}),f=r==="ytd"?metaReportBuildYtdByMonthComparison(s,s,i,l):[];return{mode:r,insufficientData:h,samePeriod:c,hasBottomline:p,periodA:d,periodB:u,deltas:b,heroMetrics:m,detailRows:y,ytdByMonth:f}}function metaReportComparisonYearsNeeded(e,t){const n=new Set;for(const a of[e,t]){const o=metaReportComparisonNormalizePeriod(a);o&&(o.startDate&&n.add(o.startDate.slice(0,4)),o.endDate&&n.add(o.endDate.slice(0,4)))}return[...n].filter(Boolean)}function metaReportComparisonMonthsForYear(e,t){return!e||Number(e.year)===Number(t)?e?.months||{}:metaReportsState.comparisonYearCache?.[t]?.months||{}}function metaReportComparisonAvailableMonthKeys(e){const t=new Set,n=a=>{a&&Object.entries(a.months||{}).forEach(([o,r])=>{metaReportMonthHasComparisonData(r)&&t.add(o)})};return n(e),Object.values(metaReportsState.comparisonYearCache||{}).forEach(n),[...t].sort()}function metaReportComparisonPresetDisabled(e,t){const n=metaReportsState.activeMonthKey;return n?e==="mom"?!metaReportComparisonAddMonths(n,-1):!1:!0}function metaReportComparisonFmtValue(e,t="num",n=!0){return n?t==="kr"?metaFmtKr(e):t==="x"?metaFmtX(e):t==="pct"?`${metaFmtNum(e,2)}%`:metaFmtNum(e):"\u2014"}function metaReportComparisonDeltaTone(e,t=null){return e==null||!Number.isFinite(e)||e===0?"neutral":t===!1?e<0?"positive":"negative":e>0?"positive":"negative"}function metaReportComparisonPeriodsFromState(e){const t=metaReportsState.comparisonMode||"mom";if(t==="mom"||t==="ytd"){const o=metaReportResolveComparisonPresetDates(e,t);return o.periodA&&(metaReportsState.comparisonPeriodA={...o.periodA}),o.periodB&&(metaReportsState.comparisonPeriodB={...o.periodB}),{periodA:o.periodA,periodB:o.periodB,mode:t}}let n=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodA),a=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodB);if(!n||!a){const o=metaReportApplyComparisonPresetDefaults(e,t);n=o.periodA,a=o.periodB}return{periodA:n,periodB:a,mode:t}}function metaReportComparisonMaps(e,t,n){const a=metaReportComparisonMergedMonthsMap(e,t,n);return{monthsMapA:a,monthsMapB:a}}async function ensureMetaReportComparisonYears(e,{editable:t=!1}={}){const{periodA:n,periodB:a}=metaReportComparisonPeriodsFromState(e),o=metaReportComparisonYearsNeeded(n,a),r=String(e?.year||metaReportsState.selectedYear),s=o.filter(i=>i!==r&&!metaReportsState.comparisonYearCache[i]);if(s.length)for(const i of s)try{let l;t&&e?.clientId?l=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e.clientId)}?year=${encodeURIComponent(i)}`):REPORT_TOKEN&&(l=await fetch(`/api/meta-reports/public/${encodeURIComponent(REPORT_TOKEN)}?year=${encodeURIComponent(i)}`).then(async c=>{const d=await c.json();if(!c.ok)throw new Error(d.error||"Report not found");return d})),l&&(metaReportsState.comparisonYearCache[i]=l)}catch{}}function computeMetaReportComparison(e){const{periodA:t,periodB:n,mode:a}=metaReportComparisonPeriodsFromState(e),o=metaReportComparisonMergedMonthsMap(e,t,n);return metaReportBuildComparison({monthsMap:o,periodA:t,periodB:n,mode:a})}function metaReportComparisonDateInputBounds(e){const t=metaReportComparisonAvailableMonthKeys(e);if(!t.length)return{min:"",max:""};const n=metaReportComparisonMergedMonthsMap(e,null,null);let a="",o="";return t.forEach(r=>{const s=metaReportComparisonMonthEffectivePeriod(n[r],r);(!a||s.start<a)&&(a=s.start),(!o||s.end>o)&&(o=s.end)}),{min:a,max:o}}function metaReportComparisonMonthInputBounds(e){const t=new Set;if(e?.year&&t.add(String(e.year)),Object.keys(metaReportsState.comparisonYearCache||{}).forEach(a=>t.add(String(a))),metaReportComparisonAvailableMonthKeys(e).forEach(a=>t.add(String(a).slice(0,4))),!t.size){const a=metaReportsState.activeMonthKey;a&&t.add(String(a).slice(0,4))}if(!t.size){const a=String(new Date().getFullYear());return{min:`${a}-01`,max:`${a}-12`}}const n=[...t].sort((a,o)=>Number(a)-Number(o));return{min:`${n[0]}-01`,max:`${n[n.length-1]}-12`}}function metaReportComparisonReportYears(e){const t=new Set,n=i=>{i&&(i.year&&t.add(String(i.year)),Object.keys(i.months||{}).forEach(l=>{/^\d{4}-\d{2}$/.test(l)&&t.add(String(l).slice(0,4))}))};n(e),Object.values(metaReportsState.comparisonYearCache||{}).forEach(n),!t.size&&metaReportsState.activeMonthKey&&t.add(String(metaReportsState.activeMonthKey).slice(0,4)),t.size||t.add(String(new Date().getFullYear()));const a=[...t].sort((i,l)=>Number(i)-Number(l)),o=Number(a[0]),r=Number(a[a.length-1]),s=[];for(let i=o;i<=r;i+=1)s.push(String(i));return s}function metaReportComparisonMonthPickerYears(e){return metaReportComparisonReportYears(e)}function renderMetaReportComparisonMonthDropdown(e,t,n,a){const o=n.find(l=>l.value===t)||n[0],r=o?.value||t||"",s=o?.label||t||"\u2014",i=n.map(l=>`<button type="button" class="meta-report-comparison-month-option${l.value===r?" is-selected":""}" data-value="${esc(l.value)}" role="option" aria-selected="${l.value===r}">${esc(l.label)}</button>`).join("");return`
    <div class="meta-report-comparison-month-dropdown" data-comparison-month-part="${esc(e)}" data-selected-value="${esc(r)}">
      <button type="button" class="meta-report-comparison-month-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(a)}">
        <span class="meta-report-comparison-month-trigger-value">${esc(s)}</span>
        <span class="meta-report-comparison-month-trigger-icon" aria-hidden="true">\u25BE</span>
      </button>
      <div class="meta-report-comparison-month-menu meta-report-comparison-month-menu--${esc(e)}" data-comparison-menu-part="${esc(e)}" role="listbox" hidden>${i}</div>
    </div>
  `}function metaReportComparisonMonthKeyParts(e){if(!e||!/^\d{4}-\d{2}$/.test(e)){const t=metaReportsState.activeMonthKey;if(t&&/^\d{4}-\d{2}$/.test(t))return{month:t.slice(5,7),year:t.slice(0,4)};const n=new Date;return{month:String(n.getMonth()+1).padStart(2,"0"),year:String(n.getFullYear())}}return{month:e.slice(5,7),year:e.slice(0,4)}}function renderMetaReportComparisonMonthInput(e,t,n){const a=metaReportComparisonMonthPickerYears(n),{month:o,year:r}=metaReportComparisonMonthKeyParts(t),s=e==="b"?"Comparison month":"Current month",i=e==="b"?"Comparison year":"Current year",l=META_MONTH_LABELS.map((d,u)=>({value:String(u+1).padStart(2,"0"),label:d})),c=a.map(d=>({value:d,label:d}));return`
    <div class="meta-report-comparison-month-picker" data-comparison-month-side="${esc(e)}">
      ${renderMetaReportComparisonMonthDropdown("month",o,l,s)}
      ${renderMetaReportComparisonMonthDropdown("year",r,c,i)}
    </div>
  `}function renderMetaReportComparisonMonthPickerSide(e,t,n){return`
    <div class="meta-report-comparison-duel-side ${e==="b"?"is-b":"is-a"}">
      ${renderMetaReportComparisonMonthInput(e,t,n)}
    </div>
  `}function applyMetaReportComparisonMonthChange(e,t,n,{editable:a=!1}={}){if(!n||!/^\d{4}-\d{2}$/.test(n))return;const o=t==="b"?"comparisonPeriodB":"comparisonPeriodA";metaReportsState[o]=metaReportComparisonFullMonthDates(n),metaReportsState.comparisonMode="months",document.querySelectorAll("[data-comparison-preset]").forEach(r=>{const s=r.getAttribute("data-comparison-preset")==="months";r.classList.toggle("active",s),r.setAttribute("aria-pressed",s)}),refreshMetaReportComparison(e,{editable:a})}function positionMetaReportComparisonMonthMenu(e,t,n){const a=e.getBoundingClientRect(),r=(n?.getAttribute("data-comparison-month-part")||"month")==="year"?120:176;t.style.left=`${a.left+a.width/2}px`,t.style.top=`${a.bottom+6}px`,t.style.width=`${Math.max(r,a.width+28)}px`,t.style.minWidth=`${r}px`}function openMetaReportComparisonMonthMenu(e,t,n){closeMetaReportComparisonMonthMenus(t),t.parentElement!==document.body&&(t._metaComparisonOwner=n,document.body.appendChild(t)),t.hidden=!1,n.classList.add("is-open"),e.setAttribute("aria-expanded","true"),positionMetaReportComparisonMonthMenu(e,t,n)}function closeMetaReportComparisonMonthMenus(e=null){document.querySelectorAll(".meta-report-comparison-month-menu").forEach(t=>{if(t===e)return;t.hidden=!0;const n=t._metaComparisonOwner||t.closest(".meta-report-comparison-month-dropdown"),a=n?.querySelector(".meta-report-comparison-month-trigger");n?.classList.remove("is-open"),a?.setAttribute("aria-expanded","false"),t._metaComparisonOwner&&t.parentElement===document.body&&t._metaComparisonOwner.appendChild(t)})}function bindMetaReportComparisonMonthInputs(e,{editable:t=!1}={}){document.querySelectorAll("[data-comparison-month-side]").forEach(n=>{const a=n.getAttribute("data-comparison-month-side");if(!a)return;const o=n.querySelector('[data-comparison-month-part="month"]'),r=n.querySelector('[data-comparison-month-part="year"]'),s=()=>{const l=o?.getAttribute("data-selected-value")||"",c=r?.getAttribute("data-selected-value")||"";!l||!c||applyMetaReportComparisonMonthChange(e,a,`${c}-${l}`,{editable:t})};n.querySelectorAll(".meta-report-comparison-month-dropdown").forEach(l=>{const c=l.querySelector(".meta-report-comparison-month-trigger"),d=l.querySelector(".meta-report-comparison-month-menu");!c||!d||(c.onclick=u=>{if(u.preventDefault(),u.stopPropagation(),!d.hidden){closeMetaReportComparisonMonthMenus();return}openMetaReportComparisonMonthMenu(c,d,l)},l.querySelectorAll(".meta-report-comparison-month-option").forEach(u=>{u.onclick=p=>{p.preventDefault(),p.stopPropagation();const h=u.getAttribute("data-value")||"";l.setAttribute("data-selected-value",h);const g=c.querySelector(".meta-report-comparison-month-trigger-value");g&&(g.textContent=u.textContent||h),l.querySelectorAll(".meta-report-comparison-month-option").forEach(b=>{const y=b===u;b.classList.toggle("is-selected",y),b.setAttribute("aria-selected",String(y))}),closeMetaReportComparisonMonthMenus(),s()}}))});const i=n.closest(".meta-report-comparison-duel-side");i&&(i.onclick=l=>{if(l.target.closest(".meta-report-comparison-month-dropdown"))return;const c=n.getBoundingClientRect();(l.clientX<c.left+c.width/2?o:r)?.querySelector(".meta-report-comparison-month-trigger")?.click()})}),metaReportsState.comparisonMonthMenuListenerBound||(document.addEventListener("click",n=>{n.target.closest(".meta-report-comparison-month-menu")||n.target.closest(".meta-report-comparison-month-trigger")||closeMetaReportComparisonMonthMenus()}),window.addEventListener("resize",()=>closeMetaReportComparisonMonthMenus()),window.addEventListener("scroll",n=>{const a=n.target;a instanceof Element&&a.closest(".meta-report-comparison-month-menu")||closeMetaReportComparisonMonthMenus()},!0),metaReportsState.comparisonMonthMenuListenerBound=!0)}function renderMetaReportComparisonMonthPickersPanel(e,t,n){const a=metaReportComparisonMonthInputBounds(n),o=e?.startMonthKey||metaReportsState.activeMonthKey||a.min?.slice(0,7)||"",r=t?.startMonthKey||metaReportComparisonAddMonths(o,-1)||a.min?.slice(0,7)||"";return`
    <div class="meta-report-comparison-duel is-month-pickers" id="meta-report-comparison-range-panel" role="group" aria-label="Compare months">
      ${renderMetaReportComparisonMonthPickerSide("a",o,n)}
      <div class="meta-report-comparison-duel-divider" aria-hidden="true">vs</div>
      ${renderMetaReportComparisonMonthPickerSide("b",r,n)}
    </div>
  `}function metaReportComparisonMonthKeyFromDate(e){const t=metaReportComparisonParseDate(e);return t?t.slice(0,7):""}const metaReportComparisonDatePickerState={inputKey:null,side:null,bound:null,anchorEl:null,viewYear:null,viewMonth:null,payload:null,editable:!1};function getMetaReportComparisonDatePickerFieldBounds(e,t,n){const a=metaReportComparisonDateInputBounds(e),r=metaReportsState[t==="b"?"comparisonPeriodB":"comparisonPeriodA"]||{};let s=a.min||void 0,i=a.max||void 0;return n==="start"&&r.endDate&&(i=r.endDate),n==="end"&&r.startDate&&(s=r.startDate),metaReportComparisonSafePickerBounds(s,i)}function renderMetaReportComparisonDateInput(e,t,n,a,o=null){const r=`${e}-${t}`,s=t==="start"?"From date":"To date",i=n?metaReportComparisonFormatDateLabel(n):"Select date";return`
    <button type="button" class="meta-report-comparison-date-trigger${n?" has-value":" is-empty"}" data-comparison-date-trigger="${esc(r)}" aria-label="${esc(s)}" aria-haspopup="dialog">
      <span class="meta-report-comparison-date-trigger-value">${esc(i)}</span>
    </button>
    <input type="hidden" data-comparison-date="${esc(r)}" value="${esc(n||"")}" />
  `}function renderMetaReportComparisonCustomRangeSide(e,t,n,a,o=null){return`
    <div class="meta-report-comparison-duel-side ${e==="b"?"is-b":"is-a"}">
      <div class="meta-report-comparison-custom-range">
        <div class="meta-report-comparison-custom-range-field" data-comparison-range="${esc(e)}-start">
          ${renderMetaReportComparisonDateInput(e,"start",t,a,o)}
        </div>
        <span class="meta-report-comparison-custom-range-sep" aria-hidden="true">\u2013</span>
        <div class="meta-report-comparison-custom-range-field" data-comparison-range="${esc(e)}-end">
          ${renderMetaReportComparisonDateInput(e,"end",n,a,o)}
        </div>
        <span class="meta-report-comparison-date-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </span>
      </div>
    </div>
  `}function parseComparisonDateKey(e){const t=String(e||"").match(/^([ab])-(start|end)$/);return t?{side:t[1],bound:t[2],stateKey:t[1]==="b"?"comparisonPeriodB":"comparisonPeriodA"}:null}function metaReportComparisonSafePickerBounds(e,t){const n=e||void 0,a=t||void 0;return n&&a&&n>a?{min:a,max:n}:{min:n,max:a}}function syncMetaReportComparisonDateDisplays(){document.querySelectorAll("[data-comparison-date]").forEach(e=>{const t=e.getAttribute("data-comparison-date"),n=document.querySelector(`[data-comparison-date-trigger="${t}"]`);if(!t||!n)return;const a=e.value||"",o=n.querySelector(".meta-report-comparison-date-trigger-value");o&&(o.textContent=a?metaReportComparisonFormatDateLabel(a):"Select date"),n.classList.toggle("has-value",!!a),n.classList.toggle("is-empty",!a)})}function applyMetaReportComparisonDateChange(e,t,n,{editable:a=!1}={}){const o=parseComparisonDateKey(t);if(!o||!n)return;const{side:r,bound:s,stateKey:i}=o;metaReportsState[i]||(metaReportsState[i]={startDate:null,endDate:null});const l=metaReportsState[i];l[`${s}Date`]=n,l.startDate&&l.endDate&&l.startDate>l.endDate&&(s==="end"?l.startDate=l.endDate:l.endDate=l.startDate);const c=document.querySelector(`[data-comparison-date="${r}-start"]`),d=document.querySelector(`[data-comparison-date="${r}-end"]`);c&&(c.value=l.startDate||""),d&&(d.value=l.endDate||""),syncMetaReportComparisonDateDisplays(),metaReportsState.comparisonMode="custom",document.querySelectorAll("[data-comparison-preset]").forEach(u=>{const p=u.getAttribute("data-comparison-preset")==="custom";u.classList.toggle("active",p),u.setAttribute("aria-pressed",p)}),refreshMetaReportComparison(e,{editable:a})}function ensureMetaReportComparisonDatePickerPopover(){if(document.getElementById("meta-report-comparison-date-popover"))return;const e=document.createElement("div");e.id="meta-report-comparison-date-backdrop",e.className="meta-report-comparison-date-backdrop",e.hidden=!0,e.addEventListener("click",closeMetaReportComparisonDatePicker),document.body.appendChild(e);const t=document.createElement("div");t.id="meta-report-comparison-date-popover",t.className="meta-report-comparison-date-popover",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),document.body.appendChild(t)}function isMetaReportComparisonDatePickerDayDisabled(e,t,n,a){const{min:o,max:r}=getMetaReportComparisonDatePickerFieldBounds(t,n,a);return!!(o&&e<o||r&&e>r)}function metaReportComparisonDatePickerCanShiftMonth(e){const{viewYear:t,viewMonth:n,payload:a,side:o,bound:r}=metaReportComparisonDatePickerState;if(!t||!n||!a||!o||!r)return!1;let s=n+e,i=t;s<1&&(s=12,i-=1),s>12&&(s=1,i+=1);const l=`${i}-${String(s).padStart(2,"0")}`,{min:c,max:d}=getMetaReportComparisonDatePickerFieldBounds(a,o,r),u=c?c.slice(0,7):null,p=d?d.slice(0,7):null;return!(u&&l<u||p&&l>p)}function renderMetaReportComparisonDatePickerDayCell(e,t,n,a,o,r,s,i,l,c){const d=["date-picker-day"];if(n&&d.push("is-outside"),e===a&&d.push("is-today"),e===o&&d.push("is-selected"),r&&s){const u=r<=s?r:s,p=r<=s?s:r;e>=u&&e<=p&&d.push("is-in-range"),e===r&&d.push("is-range-start"),e===s&&d.push("is-range-end")}return isMetaReportComparisonDatePickerDayDisabled(e,i,l,c)?(d.push("is-disabled"),`<button type="button" class="${d.join(" ")}" disabled aria-disabled="true">${t}</button>`):`<button type="button" class="${d.join(" ")}" onclick="selectMetaReportComparisonDatePickerDay('${e}')">${t}</button>`}function renderMetaReportComparisonDatePickerPopover(){const e=document.getElementById("meta-report-comparison-date-popover"),{viewYear:t,viewMonth:n,inputKey:a,payload:o,side:r,bound:s}=metaReportComparisonDatePickerState;if(!e||!a||!t||!n||!o||!r||!s)return;const i=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(t,n-1,1)),l=["Mo","Tu","We","Th","Fr","Sa","Su"],d=(new Date(t,n-1,1).getDay()+6)%7,u=new Date(t,n,0).getDate(),p=new Date(t,n-1,0).getDate(),h=isoFromParts(new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate()),b=document.querySelector(`[data-comparison-date="${a}"]`)?.value||"",m=metaReportsState[r==="b"?"comparisonPeriodB":"comparisonPeriodA"]||{},f=m.startDate||"",v=m.endDate||"",{min:$,max:w}=getMetaReportComparisonDatePickerFieldBounds(o,r,s);let S="";for(let I=d-1;I>=0;I-=1){const R=p-I,A=n===1?12:n-1,B=n===1?t-1:t,M=isoFromParts(B,A,R);S+=renderMetaReportComparisonDatePickerDayCell(M,R,!0,h,b,f,v,o,r,s)}for(let I=1;I<=u;I+=1){const R=isoFromParts(t,n,I);S+=renderMetaReportComparisonDatePickerDayCell(R,I,!1,h,b,f,v,o,r,s)}const C=(7-(d+u)%7)%7;for(let I=1;I<=C;I+=1){const R=n===12?1:n+1,A=n===12?t+1:t,B=isoFromParts(A,R,I);S+=renderMetaReportComparisonDatePickerDayCell(B,I,!0,h,b,f,v,o,r,s)}const E=s==="start"&&w?`<span class="date-picker-hint">Through ${esc(metaReportComparisonFormatDateLabel(w))}</span>`:s==="end"&&$?`<span class="date-picker-hint">From ${esc(metaReportComparisonFormatDateLabel($))}</span>`:"";e.innerHTML=`
    <div class="date-picker-panel">
      <div class="date-picker-header">
        <div class="date-picker-title">${esc(i)}</div>
        <div class="date-picker-nav">
          <button type="button" class="date-picker-nav-btn" aria-label="Previous month" onclick="shiftMetaReportComparisonDatePickerMonth(-1)" ${metaReportComparisonDatePickerCanShiftMonth(-1)?"":"disabled"}>${ICON_CHEVRON_LEFT}</button>
          <button type="button" class="date-picker-nav-btn" aria-label="Next month" onclick="shiftMetaReportComparisonDatePickerMonth(1)" ${metaReportComparisonDatePickerCanShiftMonth(1)?"":"disabled"}>${ICON_CHEVRON_RIGHT}</button>
        </div>
      </div>
      <div class="date-picker-weekdays">
        ${l.map(I=>`<div class="date-picker-weekday">${I}</div>`).join("")}
      </div>
      <div class="date-picker-grid">${S}</div>
      <div class="date-picker-footer">
        ${E}
        <button type="button" class="date-picker-footer-btn" onclick="clearMetaReportComparisonDatePickerField()">Clear</button>
      </div>
    </div>
  `}function positionMetaReportComparisonDatePickerPopover(){const e=document.getElementById("meta-report-comparison-date-popover"),t=metaReportComparisonDatePickerState.anchorEl;if(!e||!t)return;e.hidden=!1,e.style.visibility="hidden",e.style.left="0",e.style.top="0",e.style.transform="";const n=t.getBoundingClientRect(),a=e.getBoundingClientRect(),o=8;let r=n.bottom+o,s=n.left+n.width/2-a.width/2;window.innerWidth<=640?(s=Math.max(16,(window.innerWidth-a.width)/2),r=Math.max(16,(window.innerHeight-a.height)/2)):(s+a.width>window.innerWidth-16&&(s=window.innerWidth-a.width-16),s<16&&(s=16),r+a.height>window.innerHeight-16&&(r=Math.max(16,n.top-a.height-o))),e.style.top=`${r}px`,e.style.left=`${s}px`,e.style.visibility=""}function openMetaReportComparisonDatePicker(e,t,n,{editable:a=!1}={}){ensureMetaReportComparisonDatePickerPopover();const o=document.getElementById("meta-report-comparison-date-popover"),r=document.getElementById("meta-report-comparison-date-backdrop"),s=parseComparisonDateKey(e);if(!o||!r||!t||!s)return;if(metaReportComparisonDatePickerState.inputKey===e&&!o.hidden){closeMetaReportComparisonDatePicker();return}closeMetaReportComparisonDatePicker();const l=document.querySelector(`[data-comparison-date="${e}"]`)?.value||"";let c=new Date().getFullYear(),d=new Date().getMonth()+1;if(/^\d{4}-\d{2}-\d{2}$/.test(l))c=Number(l.slice(0,4)),d=Number(l.slice(5,7));else{const{min:u}=getMetaReportComparisonDatePickerFieldBounds(n,s.side,s.bound);u&&/^\d{4}-\d{2}-\d{2}$/.test(u)&&(c=Number(u.slice(0,4)),d=Number(u.slice(5,7)))}metaReportComparisonDatePickerState.inputKey=e,metaReportComparisonDatePickerState.side=s.side,metaReportComparisonDatePickerState.bound=s.bound,metaReportComparisonDatePickerState.anchorEl=t,metaReportComparisonDatePickerState.viewYear=c,metaReportComparisonDatePickerState.viewMonth=d,metaReportComparisonDatePickerState.payload=n,metaReportComparisonDatePickerState.editable=a,renderMetaReportComparisonDatePickerPopover(),r.hidden=!1,t.classList.add("is-active"),positionMetaReportComparisonDatePickerPopover()}function closeMetaReportComparisonDatePicker(){const e=document.getElementById("meta-report-comparison-date-popover"),t=document.getElementById("meta-report-comparison-date-backdrop");e&&(e.hidden=!0),t&&(t.hidden=!0),metaReportComparisonDatePickerState.anchorEl?.classList.remove("is-active"),metaReportComparisonDatePickerState.inputKey=null,metaReportComparisonDatePickerState.side=null,metaReportComparisonDatePickerState.bound=null,metaReportComparisonDatePickerState.anchorEl=null,metaReportComparisonDatePickerState.payload=null}function shiftMetaReportComparisonDatePickerMonth(e){if(!metaReportComparisonDatePickerCanShiftMonth(e))return;let{viewYear:t,viewMonth:n}=metaReportComparisonDatePickerState;n+=e,n<1&&(n=12,t-=1),n>12&&(n=1,t+=1),metaReportComparisonDatePickerState.viewYear=t,metaReportComparisonDatePickerState.viewMonth=n,renderMetaReportComparisonDatePickerPopover(),positionMetaReportComparisonDatePickerPopover()}function selectMetaReportComparisonDatePickerDay(e){const{inputKey:t,payload:n,editable:a}=metaReportComparisonDatePickerState;if(!t||!n||!e)return;const o=document.querySelector(`[data-comparison-date="${t}"]`);o&&(o.value=e),closeMetaReportComparisonDatePicker(),applyMetaReportComparisonDateChange(n,t,e,{editable:a})}function clearMetaReportComparisonDatePickerField(){const{inputKey:e,payload:t,editable:n}=metaReportComparisonDatePickerState;if(!e||!t)return;closeMetaReportComparisonDatePicker();const a=parseComparisonDateKey(e);if(!a)return;const{side:o,bound:r,stateKey:s}=a;metaReportsState[s]||(metaReportsState[s]={startDate:null,endDate:null}),metaReportsState[s][`${r}Date`]=null;const i=document.querySelector(`[data-comparison-date="${e}"]`);i&&(i.value=""),syncMetaReportComparisonDateDisplays(),refreshMetaReportComparison(t,{editable:n})}function closeMetaReportComparisonDatePickers(){closeMetaReportComparisonDatePicker()}function destroyMetaReportComparisonDatePickers(){closeMetaReportComparisonDatePicker()}function bindMetaReportComparisonDateInputs(e,{editable:t=!1}={}){destroyMetaReportComparisonDatePickers(),syncMetaReportComparisonDateDisplays(),document.querySelectorAll("[data-comparison-date-trigger]").forEach(n=>{n.onclick=a=>{a.preventDefault(),a.stopPropagation();const o=n.getAttribute("data-comparison-date-trigger");o&&openMetaReportComparisonDatePicker(o,n,e,{editable:t})}}),document.querySelectorAll(".meta-report-comparison-custom-range").forEach(n=>{n.onclick=a=>{const o=a.target.closest(".meta-report-comparison-custom-range-field");if(!o)return;const r=o.querySelector("[data-comparison-date-trigger]");if(!r)return;a.preventDefault(),a.stopPropagation();const s=r.getAttribute("data-comparison-date-trigger");s&&openMetaReportComparisonDatePicker(s,r,e,{editable:t})}}),metaReportsState.comparisonDatePickerListenerBound||(window.addEventListener("resize",closeMetaReportComparisonDatePicker),window.addEventListener("scroll",n=>{const a=n.target;a instanceof Element&&a.closest("#meta-report-comparison-date-popover")||closeMetaReportComparisonDatePicker()},!0),metaReportsState.comparisonDatePickerListenerBound=!0)}function metaReportComparisonYtdSpanLabel(e,t){const n=metaReportComparisonParseDate(e),a=metaReportComparisonParseDate(t);if(!n||!a)return"";const o=Number(n.slice(5,7)),r=Number(a.slice(5,7)),s=n.slice(0,4),i=a.slice(0,4);return s!==i?metaReportComparisonFormatDateRangeLabel(n,a):o===1&&r===12?"Full year":o===r?`Through ${META_MONTH_LABELS[o-1]}`:`${META_MONTH_LABELS[o-1]} \u2013 ${META_MONTH_LABELS[r-1]}`}function metaReportComparisonPresetPeriodDisplay(e,t){const n=metaReportComparisonNormalizePeriod(t);if(!n)return{value:"\u2014",hint:""};if(e==="mom"||e==="months"){const a=n.startMonthKey||n.endMonthKey,o=String(a||n.startDate).slice(0,4);return{value:`${metaMonthLabel(a)} ${o}`,hint:""}}if(e==="ytd"){const a=metaReportComparisonYtdSpanLabel(n.startDate,n.endDate);return{value:n.startDate.slice(0,4),hint:a&&a!=="Full year"?a:""}}return{value:metaReportComparisonFormatDateRangeLabel(n.startDate,n.endDate),hint:""}}function renderMetaReportComparisonDuelSide(e,t,n=!1){const a=t.hint?`<span class="meta-report-comparison-duel-hint">${esc(t.hint)}</span>`:"",o=n?" is-partial":"",r=n?' title="Partial data"':"";return`
    <div class="meta-report-comparison-duel-side is-${esc(e)}${o}"${r}>
      <span class="meta-report-comparison-duel-value">${esc(t.value)}</span>
      ${a}
    </div>
  `}function renderMetaReportComparisonSummaryBar(e,t,n=null){const a=n?.periodA?.partialData===!0,o=n?.periodB?.partialData===!0,r=metaReportComparisonPresetPeriodDisplay(metaReportsState.comparisonMode||"mom",e),s=metaReportComparisonPresetPeriodDisplay(metaReportsState.comparisonMode||"mom",t);return`
    <div class="meta-report-comparison-duel" id="meta-report-comparison-range-panel" role="group" aria-label="Compared periods">
      ${renderMetaReportComparisonDuelSide("a",r,a)}
      <div class="meta-report-comparison-duel-divider" aria-hidden="true">vs</div>
      ${renderMetaReportComparisonDuelSide("b",s,o)}
    </div>
  `}function renderMetaReportComparisonCustomDatesPanel(e,t,n){const a=metaReportComparisonDateInputBounds(n),o=e?.startDate||a.min||"",r=e?.endDate||o,s=t?.startDate||a.min||"",i=t?.endDate||s;return`
    <div class="meta-report-comparison-duel is-custom-dates" id="meta-report-comparison-range-panel" role="group" aria-label="Custom compared periods">
      ${renderMetaReportComparisonCustomRangeSide("a",o,r,a,e)}
      <div class="meta-report-comparison-duel-divider" aria-hidden="true">vs</div>
      ${renderMetaReportComparisonCustomRangeSide("b",s,i,a,t)}
    </div>
  `}function renderMetaReportComparisonPeriodControls(e,t,n,a=null){const o=metaReportsState.comparisonMode||"mom";return o==="custom"?renderMetaReportComparisonCustomDatesPanel(e,t,n):o==="months"?renderMetaReportComparisonMonthPickersPanel(e,t,n):renderMetaReportComparisonSummaryBar(e,t,a)}function renderMetaReportComparisonPeriodTiles(e,t,n,a=null){return renderMetaReportComparisonPeriodControls(e,t,n,a)}function renderMetaReportComparisonChangeCell(e,t,n=!0,a=!0){const o=metaReportComparisonDeltaTone(e,t);if(!n&&!a||!n||!a||e==null||!Number.isFinite(e))return'<span class="meta-report-comparison-change is-neutral">\u2014</span>';const r=e>0?"\u2191":e<0?"\u2193":"\u2014",s=metaReportFormatDeltaPct(e);return`<span class="meta-report-comparison-change is-${o}">${esc(r)} ${esc(s)}</span>`}function renderMetaReportComparisonGroupTable(e,t,n,a,{highlightLastN:o=0}={}){if(!a||a.insufficientData||a.samePeriod)return"";const r=a.periodA.label,s=a.periodB.label,i=a.periodA.hasData!==!1,l=a.periodB.hasData!==!1,c=t.map((d,u)=>{const p=a.periodA.metrics[d.metricId],h=a.periodB.metrics[d.metricId],g=i&&l?metaReportDeltaPct(p,h):null;return`
      <tr class="${o>0&&u>=t.length-o?`is-highlight accent-${n}`:""}">
        <th scope="row">${esc(d.label)}</th>
        <td class="meta-report-comparison-col-a">${esc(metaReportComparisonFmtValue(p,d.format,i))}</td>
        <td class="meta-report-comparison-col-b">${esc(metaReportComparisonFmtValue(h,d.format,l))}</td>
        <td class="meta-report-comparison-col-change">${renderMetaReportComparisonChangeCell(g,d.higherIsBetter,i,l)}</td>
      </tr>
    `}).join("");return`
    <section class="meta-report-group">
      <div class="meta-report-group-head">
        <span class="meta-report-group-bar meta-report-group-bar--${n}" aria-hidden="true"></span>
        <h3 class="meta-report-group-title">${esc(e)}</h3>
      </div>
      <div class="meta-report-group-table-wrap">
        <table class="meta-report-group-table meta-report-comparison-table">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col" class="meta-report-comparison-col-a">${esc(r)}</th>
              <th scope="col" class="meta-report-comparison-col-b">${esc(s)}</th>
              <th scope="col" class="meta-report-comparison-col-change">Change</th>
            </tr>
          </thead>
          <tbody>${c}</tbody>
        </table>
      </div>
    </section>
  `}function renderMetaReportComparisonTableSkeleton(){const e=Array.from({length:6}).map(()=>`
    <div class="meta-report-comparison-skeleton-row">
      <div class="meta-report-comparison-skeleton-cell meta-report-comparison-skeleton-cell--label"></div>
      <div class="meta-report-comparison-skeleton-cell"></div>
      <div class="meta-report-comparison-skeleton-cell"></div>
      <div class="meta-report-comparison-skeleton-cell meta-report-comparison-skeleton-cell--short"></div>
    </div>
  `).join("");return`
    <div class="meta-report-comparison-skeleton" aria-busy="true" aria-label="Loading comparison data">
      <div class="meta-report-comparison-skeleton-group">
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--sm"></div>
        ${e}
      </div>
      <div class="meta-report-comparison-skeleton-group">
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--sm"></div>
        ${e}
      </div>
    </div>
  `}function renderMetaReportComparisonTables(e){return metaReportsState.comparisonLoading?renderMetaReportComparisonTableSkeleton():!e||e.insufficientData?'<p class="meta-report-comparison-empty">Select two periods with ad data to compare performance.</p>':e.samePeriod?'<p class="meta-report-comparison-warning">Both periods are the same. Choose different ranges to compare.</p>':`<div class="meta-report-groups-stack">${META_REPORT_COMPARISON_TABLE_GROUPS.filter(n=>!n.bottomlineOnly||e.hasBottomline).map(n=>renderMetaReportComparisonGroupTable(n.title,n.rows,n.accent,e,{highlightLastN:n.highlightLastN||0})).join("")}</div>`}const META_REPORT_COMPARISON_SUMMARY_LABELS={spend:"Ad spend",leads:"Leads",wonLeads:"Won leads",roasKr:"Return on ad spend",totalLeadValue:"Total lead value",poasKr:"Profit on ad spend"};function renderMetaReportComparisonSummarySkeleton(){return`
    <aside class="meta-report-comparison-summary" aria-label="Comparison summary" aria-busy="true">
      <h3 class="meta-report-comparison-summary-heading">Key changes</h3>
      <div class="meta-report-comparison-summary-stack">${Array.from({length:5}).map(()=>`
    <div class="meta-report-comparison-summary-skeleton-item" aria-hidden="true">
      <div class="meta-cv-skeleton-line meta-cv-skeleton-line--sm"></div>
      <div class="meta-cv-skeleton-line meta-cv-skeleton-line--lg"></div>
      <div class="meta-cv-skeleton-line meta-cv-skeleton-line--sm"></div>
    </div>
  `).join("")}</div>
    </aside>
  `}function renderMetaReportComparisonSummaryBoxes(e){if(metaReportsState.comparisonLoading)return renderMetaReportComparisonSummarySkeleton();if(!e||e.insufficientData||e.samePeriod)return"";const t=e.periodA?.label||"Period A",n=e.periodB?.label||"Period B",a=e.periodA?.hasData!==!1,o=e.periodB?.hasData!==!1,s=(e.heroMetrics||[]).map(i=>{const l=META_REPORT_COMPARISON_SUMMARY_LABELS[i.id]||i.label||i.id,c=metaReportComparisonDeltaTone(i.deltaPct,i.higherIsBetter),d=esc(metaReportComparisonFmtValue(i.valueA,i.format,a));let u="\u2014";return a&&o&&i.deltaPct!=null&&Number.isFinite(i.deltaPct)&&(u=`${i.deltaPct>0?"\u2191":i.deltaPct<0?"\u2193":"\u2014"} ${esc(metaReportFormatDeltaPct(i.deltaPct))} vs ${esc(n)}`),`
      <div class="meta-report-comparison-summary-item${c!=="neutral"?` is-${c}`:""}">
        <div class="meta-report-comparison-summary-label">${esc(l)}</div>
        <div class="meta-report-comparison-summary-value">${d}</div>
        <div class="meta-report-comparison-summary-change">${u}</div>
      </div>
    `}).join("");return s?`
    <aside class="meta-report-comparison-summary" aria-label="Comparison summary">
      <h3 class="meta-report-comparison-summary-heading">Key changes \xB7 ${esc(t)}</h3>
      <div class="meta-report-comparison-summary-stack">${s}</div>
    </aside>
  `:""}function renderMetaReportViewModeTabs(){const e=metaReportsState.reportViewMode||"monthly";return`
    <div class="meta-report-view-mode-tabs" role="tablist" aria-label="Report views">
      <button type="button" class="meta-report-chart-tab${e==="monthly"?" is-active":""}" data-report-view-mode="monthly" role="tab" aria-selected="${e==="monthly"}">Monthly report</button>
      <button type="button" class="meta-report-chart-tab${e==="comparison"?" is-active":""}" data-report-view-mode="comparison" role="tab" aria-selected="${e==="comparison"}">Period comparison</button>
    </div>
  `}function renderMetaReportComparisonView(){const e=metaReportsState.clientPayload||metaReportsState.publicPayload,t=metaReportsState.comparisonResult||computeMetaReportComparison(e),{periodA:n,periodB:a}=metaReportComparisonPeriodsFromState(e),o=metaReportsState.comparisonTab||"table",r=metaReportsState.comparisonLoading;return`
    <section class="meta-report-comparison-view" id="meta-report-comparison-view">
      <div class="meta-report-comparison-controls">
        <div class="meta-report-comparison-presets" id="meta-report-comparison-presets">
          ${META_REPORT_COMPARISON_PRESETS.map(({id:s,label:i})=>{const l=metaReportComparisonPresetDisabled(s,e),c=l&&s==="mom"?"No previous month available":i;return`
              <button type="button" class="preset-btn${metaReportsState.comparisonMode===s?" active":""}${l?" is-disabled":""}" data-comparison-preset="${esc(s)}" aria-pressed="${metaReportsState.comparisonMode===s}"${l?" disabled":""}${c?` title="${esc(c)}"`:""}>${esc(i)}</button>
            `}).join("")}
        </div>
        <div class="meta-report-comparison-period-card">
          <div id="meta-report-comparison-range-wrap">
            ${renderMetaReportComparisonPeriodControls(n,a,e,t)}
          </div>
        </div>
      </div>
      <div class="meta-report-comparison-table-layout">
        <div class="meta-report-comparison-view-card meta-report-comparison-table-card${r?" is-loading":""}">
          <div class="meta-report-comparison-view-head">
            <div class="meta-report-comparison-tabs" role="tablist" aria-label="Comparison views">
              <button type="button" class="meta-report-chart-tab${o==="table"?" is-active":""}" data-comparison-tab="table" role="tab" aria-selected="${o==="table"}">Compare table</button>
              <button type="button" class="meta-report-chart-tab${o==="chart"?" is-active":""}" data-comparison-tab="chart" role="tab" aria-selected="${o==="chart"}">Show in chart</button>
            </div>
          </div>
          <div class="meta-report-comparison-tab-panel${o==="table"?" is-active":""}" data-comparison-panel="table" role="tabpanel"${o==="table"?"":" hidden"}>
            <div id="meta-report-comparison-table-wrap">${renderMetaReportComparisonTables(t)}</div>
          </div>
          <div class="meta-report-comparison-tab-panel${o==="chart"?" is-active":""}" data-comparison-panel="chart" role="tabpanel"${o==="chart"?"":" hidden"}>
            <div class="meta-report-comparison-chart-card">
              <div class="meta-report-comparison-chart-toolbar">
                <div class="meta-report-chart-toggle" id="meta-report-comparison-chart-mode" role="group" aria-label="Comparison chart display mode">
                  <button type="button" class="meta-report-chart-toggle-btn${metaReportsState.comparisonChartMode==="kr"?" is-active":""}" data-mode="kr">Dkr</button>
                  <button type="button" class="meta-report-chart-toggle-btn${metaReportsState.comparisonChartMode==="x"?" is-active":""}" data-mode="x">Multiplier</button>
                </div>
              </div>
              <div class="meta-report-comparison-chart-canvas-wrap">
                <canvas id="meta-report-comparison-chart" aria-label="Period comparison chart"></canvas>
                <p class="meta-report-chart-empty" id="meta-report-comparison-chart-empty" hidden>Not enough data to chart this comparison yet.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="meta-report-comparison-view-card meta-report-comparison-summary-card${r?" is-loading":""}" id="meta-report-comparison-summary-card"${!r&&(!t||t.insufficientData||t.samePeriod)?" hidden":""}>
          <div id="meta-report-comparison-summary-wrap">${renderMetaReportComparisonSummaryBoxes(t)}</div>
        </div>
      </div>
    </section>
  `}function destroyMetaReportComparisonChart(){metaReportsState.comparisonChartInstance&&(metaReportsState.comparisonChartInstance.destroy(),metaReportsState.comparisonChartInstance=null)}function metaReportComparisonChartLabel(e,t){return t.find(n=>n.id===e)?.label||e}function buildMetaReportComparisonGroupedBarChart(e,t,n="kr"){const a=metaReportComparisonMetricDefs(t.hasBottomline),o=metaReportComparisonChartIds(t.hasBottomline,n),r=o.map(c=>metaReportComparisonChartLabel(c,a)),s=o.map(c=>metaReportParseAmount(t.periodA.metrics[c])),i=t.periodB.hasData!==!1,l=o.map(c=>i?metaReportParseAmount(t.periodB.metrics[c]):null);return new Chart(e,{type:"bar",data:{labels:r,datasets:[{label:t.periodA.label,data:s,backgroundColor:"rgba(255, 106, 0, 0.82)",borderColor:"#ff6a00",borderWidth:1,borderRadius:6,maxBarThickness:42},{label:t.periodB.label,data:l,backgroundColor:"rgba(148, 163, 184, 0.82)",borderColor:"#94a3b8",borderWidth:1,borderRadius:6,maxBarThickness:42}]},options:{responsive:!0,maintainAspectRatio:!1,layout:{padding:{left:8,right:12,top:0,bottom:0}},interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",labels:{boxWidth:12,font:{size:11}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,callbacks:{label(c){const d=c.parsed.y,u=o[c.dataIndex],p=a.find(h=>h.id===u);return`${c.dataset.label}: ${metaReportComparisonFmtValue(d,p?.format||"num")}`}}}},scales:{x:{grid:{display:!1},ticks:{color:"#6b5348",font:{size:11},maxRotation:45,minRotation:0}},y:{grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:c=>{const d=Number(c)||0;return Math.abs(d)>=1e6?`${(d/1e6).toFixed(1)}M`:Math.abs(d)>=1e3?`${Math.round(d/1e3)}K`:d}}}}}})}function metaReportComparisonYtdLineMetricId(e,t){return t==="x"?e?"poasX":"roasX":e?"poasKr":"totalLeadValue"}function buildMetaReportComparisonYtdLineChart(e,t,n="kr"){const a=t.ytdByMonth||[];if(!a.length)return null;const o=metaReportComparisonYtdLineMetricId(t.hasBottomline,n),s=metaReportComparisonMetricDefs(t.hasBottomline).find(u=>u.id===o),i=a.map(u=>u.label),l=a.map(u=>u.hasDataA&&u.periodA?metaReportParseAmount(u.periodA[o]):null),c=a.map(u=>u.hasDataB&&u.periodB?metaReportParseAmount(u.periodB[o]):null);return l.some(u=>u!=null)||c.some(u=>u!=null)?new Chart(e,{type:"line",data:{labels:i,datasets:[{label:t.periodA.label,data:l,borderColor:"#ff6a00",backgroundColor:"rgba(255, 106, 0, 0.08)",borderWidth:2,pointBackgroundColor:"#ff6a00",pointRadius:3,tension:.3,spanGaps:!1},{label:t.periodB.label,data:c,borderColor:"#94a3b8",backgroundColor:"rgba(148, 163, 184, 0.08)",borderWidth:2,pointBackgroundColor:"#94a3b8",pointRadius:3,tension:.3,spanGaps:!1}]},options:{responsive:!0,maintainAspectRatio:!1,layout:{padding:{left:8,right:12,top:0,bottom:0}},interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",labels:{boxWidth:12,font:{size:11}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,callbacks:{label(u){const p=u.parsed.y;return p==null?`${u.dataset.label}: \u2014`:`${u.dataset.label}: ${metaReportComparisonFmtValue(p,s?.format||"num")}`}}},title:{display:!0,text:s?.label||o,color:"#6b5348",font:{size:12,weight:"600"},padding:{bottom:8}}},scales:{x:{grid:{display:!1},ticks:{color:"#6b5348",font:{size:11}}},y:{grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:u=>{const p=Number(u)||0;return n==="x"?`${p.toFixed(2)}x`:Math.abs(p)>=1e6?`${(p/1e6).toFixed(1)}M`:Math.abs(p)>=1e3?`${Math.round(p/1e3)}K`:p}}}}}}):null}function buildMetaReportComparisonChart(e,t,n="kr"){const a=document.getElementById("meta-report-comparison-chart-empty");if(!t||t.insufficientData||t.samePeriod)return a&&(a.hidden=!1),null;let o=null;return t.mode==="ytd"?o=buildMetaReportComparisonYtdLineChart(e,t,n):o=buildMetaReportComparisonGroupedBarChart(e,t,n),a&&(a.hidden=!!o),o}function mountMetaReportComparisonChart(e){if(destroyMetaReportComparisonChart(),(metaReportsState.comparisonTab||"table")!=="chart")return;const t=document.getElementById("meta-report-comparison-chart");t&&(metaReportsState.comparisonChartInstance=buildMetaReportComparisonChart(t,e,metaReportsState.comparisonChartMode))}function setMetaReportComparisonTab(e){if(metaReportsState.comparisonTab=e==="chart"?"chart":"table",document.querySelectorAll("[data-comparison-tab]").forEach(t=>{const n=t.getAttribute("data-comparison-tab")===metaReportsState.comparisonTab;t.classList.toggle("is-active",n),t.setAttribute("aria-selected",n)}),document.querySelectorAll("[data-comparison-panel]").forEach(t=>{const n=t.getAttribute("data-comparison-panel")===metaReportsState.comparisonTab;t.classList.toggle("is-active",n),t.hidden=!n}),metaReportsState.comparisonTab==="chart"){const t=metaReportsState.clientPayload||metaReportsState.publicPayload;mountMetaReportComparisonChart(metaReportsState.comparisonResult||computeMetaReportComparison(t))}else destroyMetaReportComparisonChart()}function setMetaReportViewMode(e,t,{editable:n=!1}={}){if(metaReportsState.reportViewMode=e==="comparison"?"comparison":"monthly",document.querySelectorAll("[data-report-view-mode]").forEach(a=>{const o=a.getAttribute("data-report-view-mode")===metaReportsState.reportViewMode;a.classList.toggle("is-active",o),a.setAttribute("aria-selected",o)}),document.querySelectorAll("[data-report-view-panel]").forEach(a=>{const o=a.getAttribute("data-report-view-panel")===metaReportsState.reportViewMode;a.classList.toggle("is-active",o),a.hidden=!o}),metaReportsState.reportViewMode==="monthly")destroyMetaReportComparisonChart(),mountMetaReportTrendCharts(t,{editable:n,clientId:t?.clientId||null}),n&&syncMetaReportScenario(t);else if(destroyMetaReportTrendCharts(),t){const{series:a}=resolveMetaReportChartSeries(t,{allowDemo:!n});a.length&&(metaReportsState.chartSeries=a),bindMetaReportComparisonControls(t,{editable:n}),refreshMetaReportComparison(t,{editable:n}),n&&(bindMetaReportScenarioControls(t,{editable:!0}),syncMetaReportScenario(t))}}function bindMetaReportViewModeTabs(e,{editable:t=!1}={}){document.querySelectorAll("[data-report-view-mode]").forEach(n=>{n.onclick=()=>{const a=n.getAttribute("data-report-view-mode");!a||a===metaReportsState.reportViewMode||setMetaReportViewMode(a,e,{editable:t})}})}function syncMetaReportComparisonPeriodControls(e,t,{editable:n=!1}={}){const a=document.getElementById("meta-report-comparison-range-wrap");if(!a)return;const{periodA:o,periodB:r}=metaReportComparisonPeriodsFromState(e);a.innerHTML=renderMetaReportComparisonPeriodControls(o,r,e,t);const s=metaReportsState.comparisonMode||"mom";s==="custom"?bindMetaReportComparisonDateInputs(e,{editable:n}):s==="months"&&bindMetaReportComparisonMonthInputs(e,{editable:n})}function syncMetaReportComparisonUi(e,{editable:t=!1}={}){const n=document.getElementById("meta-report-comparison-view");if(!n)return;const a=computeMetaReportComparison(e);metaReportsState.comparisonResult=a,syncMetaReportComparisonPeriodControls(e,a,{editable:t});const o=document.getElementById("meta-report-comparison-headline-wrap");o&&o.remove();const r=!!metaReportsState.comparisonLoading,s=n.querySelector(".meta-report-comparison-table-card"),i=document.getElementById("meta-report-comparison-summary-card");s&&s.classList.toggle("is-loading",r),i&&i.classList.toggle("is-loading",r);const l=document.getElementById("meta-report-comparison-table-wrap");l&&(l.innerHTML=renderMetaReportComparisonTables(a));const c=renderMetaReportComparisonSummaryBoxes(a),d=document.getElementById("meta-report-comparison-summary-wrap");d&&(d.innerHTML=c),i&&(i.hidden=!r&&!c);const u=document.getElementById("meta-report-comparison-chart-empty");u&&(u.hidden=!(a.insufficientData||a.samePeriod)),(metaReportsState.comparisonTab||"table")==="chart"&&mountMetaReportComparisonChart(a)}async function refreshMetaReportComparison(e,{editable:t=!1}={}){if(!e||!document.getElementById("meta-report-comparison-view"))return;const n=Date.now();metaReportsState.comparisonLoading=!0,syncMetaReportComparisonUi(e,{editable:t});try{await ensureMetaReportComparisonYears(e,{editable:t})}finally{const a=Date.now()-n;a<180&&await new Promise(o=>setTimeout(o,180-a)),metaReportsState.comparisonLoading=!1,syncMetaReportComparisonUi(e,{editable:t})}}function bindMetaReportComparisonControls(e,{editable:t=!1}={}){const n=()=>{document.querySelectorAll("[data-comparison-preset]").forEach(a=>{a.onclick=async()=>{if(a.disabled)return;const o=a.getAttribute("data-comparison-preset");if(!o)return;metaReportsState.comparisonMode=o,metaReportApplyComparisonPresetDefaults(e,o),metaReportsState.comparisonLoading=!0;const r=document.getElementById("meta-report-comparison-view");r&&(r.outerHTML=renderMetaReportComparisonView(),bindMetaReportComparisonControls(e,{editable:t})),await refreshMetaReportComparison(e,{editable:t})}})};document.querySelectorAll("[data-comparison-tab]").forEach(a=>{a.onclick=()=>{const o=a.getAttribute("data-comparison-tab");o&&setMetaReportComparisonTab(o)}}),document.querySelectorAll("#meta-report-comparison-chart-mode .meta-report-chart-toggle-btn").forEach(a=>{a.onclick=()=>{metaReportsState.comparisonChartMode=a.getAttribute("data-mode")||"kr",document.querySelectorAll("#meta-report-comparison-chart-mode .meta-report-chart-toggle-btn").forEach(o=>{o.classList.toggle("is-active",o===a)}),mountMetaReportComparisonChart(metaReportsState.comparisonResult||computeMetaReportComparison(e))}}),n(),bindMetaReportComparisonDateInputs(e,{editable:t}),bindMetaReportComparisonMonthInputs(e,{editable:t}),setMetaReportComparisonTab(metaReportsState.comparisonTab||"table")}function mountMetaReportComparison(e,{editable:t=!1}={}){document.getElementById("meta-report-comparison-view")&&(bindMetaReportComparisonControls(e,{editable:t}),refreshMetaReportComparison(e,{editable:t}))}function renderMetaReportScenarioCard(){return`
    <section class="meta-report-scenario-card" id="meta-report-scenario-card">
      <div class="meta-report-scenario-head">
        <div>
          <h3 class="meta-report-scenario-title">Budget scenario</h3>
          <p class="meta-report-scenario-copy">Estimate based on recent ad performance and diminishing returns\u2014not a guarantee.</p>
        </div>
      </div>
      <div class="meta-report-scenario-controls">
        <label class="meta-report-scenario-field">
          <span>Budget multiplier</span>
          <div class="meta-report-scenario-slider-row">
            <input type="range" id="meta-report-budget-multiplier" min="0.5" max="3" step="0.1" value="${esc(metaReportsState.budgetMultiplier)}" />
            <output id="meta-report-budget-multiplier-value">${esc(Number(metaReportsState.budgetMultiplier).toFixed(1))}\xD7</output>
          </div>
        </label>
        <label class="meta-report-scenario-field">
          <span>Baseline spend</span>
          <select id="meta-report-budget-baseline" class="admin-select">
            ${renderMetaReportBaselineSelectOptions(resolveMetaReportScenarioBaselineHints(metaReportsState.chartSeries||[],metaReportsState.chartProjection),metaReportsState.budgetBaseline)}
          </select>
        </label>
        <label class="meta-report-scenario-field">
          <span>History window</span>
          <select id="meta-report-scenario-month-window" class="admin-select">
            ${META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS.map(({value:e,label:t})=>`
              <option value="${esc(e)}"${metaReportsState.scenarioMonthWindow===e?" selected":""}>${esc(t)}</option>
            `).join("")}
          </select>
        </label>
      </div>
      ${renderMetaReportScenarioModelPills()}
      <div id="meta-report-scenario-context-wrap">${renderMetaReportScenarioContextStrip(metaReportsState.chartProjection)}</div>
      <div class="meta-report-scenario-grid" id="meta-report-scenario-grid"></div>
      <div class="meta-report-scenario-charts" id="meta-report-scenario-charts">
        <div class="meta-report-scenario-chart-card">
          <div class="meta-report-chart-head">
            <h3 class="meta-report-chart-title">ROAS extrapolation</h3>
            <div class="meta-report-chart-toggle" id="meta-scenario-roas-mode" role="group" aria-label="Scenario ROAS display mode">
              <button type="button" class="meta-report-chart-toggle-btn" data-mode="kr">Dkr</button>
              <button type="button" class="meta-report-chart-toggle-btn is-active" data-mode="x">Multiplier</button>
            </div>
          </div>
          <div class="meta-report-scenario-chart-canvas-wrap">
            <canvas id="meta-report-scenario-chart-roas" aria-label="ROAS budget extrapolation chart"></canvas>
            <p class="meta-report-chart-empty" id="meta-report-scenario-chart-roas-empty" hidden>Not enough data for extrapolation yet.</p>
          </div>
        </div>
        <div class="meta-report-scenario-chart-card" id="meta-report-scenario-poas-wrap">
          <div class="meta-report-chart-head">
            <h3 class="meta-report-chart-title">POAS extrapolation</h3>
            <div class="meta-report-chart-toggle" id="meta-scenario-poas-mode" role="group" aria-label="Scenario POAS display mode">
              <button type="button" class="meta-report-chart-toggle-btn" data-mode="kr">Dkr</button>
              <button type="button" class="meta-report-chart-toggle-btn is-active" data-mode="x">Multiplier</button>
            </div>
          </div>
          <div class="meta-report-scenario-chart-canvas-wrap">
            <canvas id="meta-report-scenario-chart-poas" aria-label="POAS budget extrapolation chart"></canvas>
            <p class="meta-report-chart-empty" id="meta-report-scenario-chart-poas-empty" hidden>Not enough data for extrapolation yet.</p>
          </div>
        </div>
      </div>
      <p class="meta-report-scenario-disclaimer">Projections use ad-active months only, skip in-progress months without complete inputs, and apply diminishing returns when spend scales.</p>
    </section>
  `}function metaReportFormatDeltaPct(e){return e==null||!Number.isFinite(e)?"":`${e>0?"+":""}${e.toFixed(0)}%`}function metaReportScenarioDeltaTone(e=""){return String(e).startsWith("+")?"positive":String(e).startsWith("-")?"negative":"neutral"}function renderMetaReportScenarioOutcomeCard({label:e,projectedValue:t,projectedSub:n="",baselineValue:a="",delta:o=""}={}){const r=metaReportScenarioDeltaTone(o);return`
    <div class="meta-report-scenario-outcome-card ${r==="negative"?"is-negative":"is-positive"}">
      <div class="meta-report-scenario-outcome-label">${esc(e)}</div>
      <div class="meta-report-scenario-outcome-value">${esc(t)}</div>
      ${n?`<div class="meta-report-scenario-outcome-sub">${esc(n)}</div>`:""}
      ${o?`<div class="meta-report-scenario-outcome-delta is-${r}">${esc(o)}</div>`:""}
      ${a?`<div class="meta-report-scenario-outcome-baseline">Baseline ${esc(a)}</div>`:""}
    </div>
  `}function renderMetaReportScenarioDetailRow(e,t,n,a){const o=metaReportScenarioDeltaTone(a);return`
    <div class="meta-report-scenario-details-row">
      <span class="meta-report-scenario-label">${esc(e)}</span>
      <span class="meta-report-scenario-value">${esc(t)}</span>
      <span class="meta-report-scenario-value is-projected">${esc(n)}</span>
      <span class="meta-report-scenario-delta${o==="positive"?" is-positive":o==="negative"?" is-negative":""}">${esc(a||"\u2014")}</span>
    </div>
  `}function renderMetaReportScenarioMetrics(e){if(!e||e.insufficientData)return`<p class="meta-report-scenario-empty">${esc(renderMetaReportScenarioInsufficientMessage(e))}</p>`;const t=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.totalLeadValue,e.baseline.totalLeadValue)),n=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.roasKr,e.baseline.roasKr)),a=e.projectedConservative&&e.projectedOptimistic&&e.projectedConservative.totalLeadValue!==e.projectedOptimistic.totalLeadValue?`${metaFmtKr(e.projectedConservative.totalLeadValue)} \u2013 ${metaFmtKr(e.projectedOptimistic.totalLeadValue)}`:"",o=[renderMetaReportScenarioOutcomeCard({label:"Projected revenue",projectedValue:metaFmtKr(e.projected.totalLeadValue),projectedSub:a,baselineValue:metaFmtKr(e.baseline.totalLeadValue),delta:t}),renderMetaReportScenarioOutcomeCard({label:"Projected ROAS",projectedValue:metaFmtKr(e.projected.roasKr),projectedSub:metaFmtX(e.projected.roasX),baselineValue:`${metaFmtKr(e.baseline.roasKr)} \xB7 ${metaFmtX(e.baseline.roasX)}`,delta:n})];if(e.hasBottomline){const s=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.poasKr,e.baseline.poasKr));o.push(renderMetaReportScenarioOutcomeCard({label:"Projected profit",projectedValue:metaFmtKr(e.projected.poasKr),projectedSub:metaFmtX(e.projected.poasX),baselineValue:`${metaFmtKr(e.baseline.poasKr)} \xB7 ${metaFmtX(e.baseline.poasX)}`,delta:s}))}else{const s=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.wonLeads,e.baseline.wonLeads));o.push(renderMetaReportScenarioOutcomeCard({label:"Projected won leads",projectedValue:metaFmtNum(e.projected.wonLeads),baselineValue:metaFmtNum(e.baseline.wonLeads),delta:s}))}const r=[renderMetaReportScenarioDetailRow("Ad spend",metaFmtKr(e.baseline.spend),metaFmtKr(e.projected.spend),metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.spend,e.baseline.spend))),renderMetaReportScenarioDetailRow("Leads",metaFmtNum(e.baseline.leads),metaFmtNum(e.projected.leads),metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.leads,e.baseline.leads)))];return e.hasBottomline&&r.push(renderMetaReportScenarioDetailRow("Won leads",metaFmtNum(e.baseline.wonLeads),metaFmtNum(e.projected.wonLeads),metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.wonLeads,e.baseline.wonLeads)))),`
    <div class="meta-report-scenario-outcomes">
      ${o.join("")}
    </div>
    <div class="meta-report-scenario-details">
      <div class="meta-report-scenario-details-head">Investment & funnel</div>
      ${r.join("")}
    </div>
  `}function destroyMetaReportTrendCharts(){["roas","poas"].forEach(e=>{metaReportsState.chartInstances[e]&&(metaReportsState.chartInstances[e].destroy(),metaReportsState.chartInstances[e]=null),metaReportsState.chartScatterInstances[e]&&(metaReportsState.chartScatterInstances[e].destroy(),metaReportsState.chartScatterInstances[e]=null)})}function destroyMetaReportCharts(){destroyMetaReportTrendCharts(),destroyMetaReportScenarioCharts(),destroyMetaReportComparisonChart()}function destroyMetaReportScenarioCharts(){["roas","poas"].forEach(e=>{metaReportsState.scenarioChartInstances[e]&&(metaReportsState.scenarioChartInstances[e].destroy(),metaReportsState.scenarioChartInstances[e]=null)})}function metaReportChartValue(e,t,n,a){if(e?.hasData===!1)return null;const o=t==="x"?e[a]:e[n];if(o==null)return null;const r=Number(o);return Number.isFinite(r)?r:null}function metaReportChartTooltipLabel(e,t){return t==="x"?metaFmtX(e):metaFmtKr(e)}function metaReportChartAxisTick(e,t){if(t==="x")return`${Number(e).toFixed(1)}x`;const n=Number(e)||0;return Math.abs(n)>=1e6?`${(n/1e6).toFixed(1)}M`:Math.abs(n)>=1e3?`${Math.round(n/1e3)}K`:n}function buildMetaReportLineChart(e,t,n,a,o){const r=t.map(i=>i.label),s=t.map(i=>metaReportChartValue(i,n,a,o));return new Chart(e,{type:"line",data:{labels:r,datasets:[{label:n==="x"?"Multiplier":"Dkr",data:s,borderColor:"#ff6a00",backgroundColor:"rgba(255, 106, 0, 0.12)",borderWidth:2.5,pointBackgroundColor:"#ff6a00",pointBorderColor:"#ffffff",pointBorderWidth:2,pointRadius:4,pointHoverRadius:5,fill:!0,tension:.3,spanGaps:!1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!1},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,callbacks:{label(i){return i.parsed.y==null?"No data":metaReportChartTooltipLabel(i.parsed.y,n)}}}},scales:{x:{grid:{color:"rgba(26, 18, 8, 0.06)"},ticks:{color:"#6b5348",font:{size:11}}},y:{grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:i=>metaReportChartAxisTick(i,n)}}}}})}function buildMetaReportDualMetricChart(e,{series:t,mode:n,krKey:a,xKey:o,returnLabel:r,chartType:s="area",projection:i=null,projectionLabel:l="Projected",showProjection:c=!1,baselineSpend:d=null}={}){const u=t.filter(R=>metaReportParseAmount(R.spend)>0),p=u.map(R=>R.label),h=metaReportParseAmount(d??i?.baselineSpend??0)||resolveMetaReportSpendChartBaseline(u,i),g=n==="x"&&h>0,b=u.map(R=>g?metaReportSpendMultiplierValue(R.spend,h):metaReportParseAmount(R.spend)),y=u.map(R=>metaReportChartValue(R,n,a,o)),m=normalizeMetaReportSpendChartType(s),f=n==="x",v=u.length-1;c&&i&&!i.insufficientData&&(p.push(l||`Projected (${Number(i.multiplier).toFixed(1)}\xD7)`),b.push(metaReportParseAmount(g?i.multiplier:i.projected.spend)),y.push(metaReportParseAmount(i.projected[n==="x"?o:a])));const $=p.length-1,w=c&&i&&!i.insufficientData&&$>v;function S(R,A){const B=w&&R===$;return{pointBackgroundColor:A,pointBorderColor:"#ffffff",pointBorderWidth:2,pointRadius:B?7:m==="scatter"?5:4,pointHoverRadius:B?8:m==="scatter"?6:5,pointStyle:B?"rectRot":"circle"}}function C(R,A,B,M,T){const L=A.map((k,F)=>S(F,B)),D={label:R,data:A,borderColor:B,yAxisID:T};return m==="bar"?{...D,type:"bar",backgroundColor:B==="#138b53"?"rgba(19, 139, 83, 0.72)":"rgba(255, 106, 0, 0.72)",borderRadius:4,borderWidth:0}:m==="scatter"?{...D,type:"line",backgroundColor:"transparent",borderWidth:0,showLine:!1,fill:!1,pointBackgroundColor:L.map(k=>k.pointBackgroundColor),pointBorderColor:L.map(k=>k.pointBorderColor),pointBorderWidth:L.map(k=>k.pointBorderWidth),pointRadius:L.map(k=>k.pointRadius),pointHoverRadius:L.map(k=>k.pointHoverRadius),pointStyle:L.map(k=>k.pointStyle)}:{...D,type:"line",backgroundColor:M,borderWidth:2.5,fill:m==="area",tension:.3,pointBackgroundColor:L.map(k=>k.pointBackgroundColor),pointBorderColor:L.map(k=>k.pointBorderColor),pointBorderWidth:L.map(k=>k.pointBorderWidth),pointRadius:L.map(k=>k.pointRadius),pointHoverRadius:L.map(k=>k.pointHoverRadius),pointStyle:L.map(k=>k.pointStyle)}}const E=[C("Ad spend",b,"#138b53","rgba(19, 139, 83, 0.16)","ySpend"),C(r,y,"#ff6a00","rgba(255, 106, 0, 0.12)",f?"yReturn":"ySpend")];if(w&&m!=="bar"){const R={type:"line",borderWidth:2,fill:!1,tension:0,pointRadius:0,pointHoverRadius:0,spanGaps:!0};E.push({...R,label:"",data:p.map((A,B)=>B===v||B===$?b[B]:null),borderColor:"rgba(19, 139, 83, 0.55)",borderDash:[5,4],yAxisID:"ySpend"}),E.push({...R,label:"",data:p.map((A,B)=>B===v||B===$?y[B]:null),borderColor:"rgba(255, 106, 0, 0.55)",borderDash:[5,4],yAxisID:f?"yReturn":"ySpend"})}const I={x:{grid:{color:"rgba(26, 18, 8, 0.06)"},ticks:{color:"#6b5348",font:{size:11},maxRotation:45,minRotation:0}},ySpend:{type:"linear",position:"left",title:{display:!0,text:g?"Ad spend (\xD7)":f?"Ad spend (Dkr)":"Dkr",color:f?"#138b53":"#6b5348",font:{size:11,weight:"600"}},grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:f?"#138b53":"#6b5348",font:{size:11},callback:R=>g?metaReportChartAxisTick(R,"x"):metaReportSpendAxisTick(R)}}};return f&&(I.yReturn={type:"linear",position:"right",title:{display:!0,text:"Multiplier",color:"#ff6a00",font:{size:11,weight:"600"}},grid:{drawOnChartArea:!1},ticks:{color:"#ff6a00",font:{size:11},callback:R=>metaReportChartAxisTick(R,"x")}}),new Chart(e,{type:m==="bar"?"bar":"line",data:{labels:p,datasets:E},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",align:"end",labels:{boxWidth:10,boxHeight:10,font:{size:11,weight:"600"},color:"#6b5348",filter(R){return!!R.text}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,filter(R){return!!R.dataset.label},callbacks:{label(R){const A=R.dataset.label||"";return R.dataset.yAxisID==="yReturn"?`${A}: ${metaReportChartTooltipLabel(R.parsed.y,"x")}`:g&&R.dataset.yAxisID==="ySpend"?`${A}: ${metaReportChartTooltipLabel(R.parsed.y,"x")}`:R.datasetIndex===1&&!f?`${A}: ${metaReportChartTooltipLabel(R.parsed.y,n)}`:`${A}: ${metaFmtKr(R.parsed.y)}`}}}},scales:I}})}function buildMetaReportScenarioExtrapolationChart(e,{series:t,mode:n,kind:a,projection:o,chartType:r="area",hasBottomline:s=!1}={}){const i=a==="roas"?"roasKr":"poasKr",l=a==="roas"?"roasX":"poasX",c=a==="roas"?"ROAS":"POAS",d=resolveMetaReportScenarioActiveTimeline(t),u=resolveMetaReportScenarioAdActiveSeries(d,a),p=resolveMetaReportScenarioChartSeries(u),h=resolveMetaReportSpendChartBaseline(p,o),g=n==="x"&&h>0,b=buildMetaReportScenarioProjectionSteps(o,{hasBottomline:s,targetMultiplier:metaReportsState.budgetMultiplier}),y=normalizeMetaReportSpendChartType(r),m=d.map(M=>M.label),f=d.map(M=>metaReportParseAmount(M.spend)<=0?null:g?metaReportSpendMultiplierValue(M.spend,h):metaReportParseAmount(M.spend)),v=d.map(M=>metaReportParseAmount(M.spend)<=0?null:metaReportChartValue(M,n,i,l)),$=resolveMetaReportScenarioLastAdActiveIndex(d),w=m.length;for(const M of b)m.push(M.label),f.push(g?metaReportSpendMultiplierValue(M.spend,h):M.spend),v.push(metaReportParseAmount(M[n==="x"?l:i]));const S=new Set(b.map((M,T)=>w+T)),C=b.length>0;function E(M,T){const L=S.has(M);return{pointBackgroundColor:T,pointBorderColor:"#ffffff",pointBorderWidth:2,pointRadius:L?7:y==="scatter"?5:4,pointHoverRadius:L?8:y==="scatter"?6:5,pointStyle:L?"rectRot":"circle"}}function I(M,T,L,D){const k=T.map((P,O)=>E(O,L)),F={label:M,data:T,borderColor:L,yAxisID:"y"};return y==="bar"?{...F,type:"bar",backgroundColor:L==="#138b53"?"rgba(19, 139, 83, 0.72)":"rgba(255, 106, 0, 0.72)",borderRadius:4,borderWidth:0}:y==="scatter"?{...F,type:"line",backgroundColor:"transparent",borderWidth:0,showLine:!1,fill:!1,pointBackgroundColor:k.map(P=>P.pointBackgroundColor),pointBorderColor:k.map(P=>P.pointBorderColor),pointBorderWidth:k.map(P=>P.pointBorderWidth),pointRadius:k.map(P=>P.pointRadius),pointHoverRadius:k.map(P=>P.pointHoverRadius),pointStyle:k.map(P=>P.pointStyle)}:{...F,type:"line",backgroundColor:D,borderWidth:2.5,fill:y==="area",tension:.3,pointBackgroundColor:k.map(P=>P.pointBackgroundColor),pointBorderColor:k.map(P=>P.pointBorderColor),pointBorderWidth:k.map(P=>P.pointBorderWidth),pointRadius:k.map(P=>P.pointRadius),pointHoverRadius:k.map(P=>P.pointHoverRadius),pointStyle:k.map(P=>P.pointStyle)}}const R=[I("Ad spend",f,"#138b53","rgba(19, 139, 83, 0.16)"),I(c,v,"#ff6a00","rgba(255, 106, 0, 0.12)")];if(C&&y!=="bar"){const M={type:"line",borderWidth:2,fill:!1,tension:0,pointRadius:0,pointHoverRadius:0,spanGaps:!0,yAxisID:"y"},T=L=>m.map((D,k)=>k===$||S.has(k)?L[k]:null);R.push({...M,label:"",data:T(f),borderColor:"rgba(19, 139, 83, 0.55)",borderDash:[5,4]}),R.push({...M,label:"",data:T(v),borderColor:"rgba(255, 106, 0, 0.55)",borderDash:[5,4]})}const A=g?"Multiplier (\xD7)":"Dkr",B=M=>g?metaReportChartAxisTick(M,"x"):metaReportChartAxisTick(M,"kr");return new Chart(e,{type:y==="bar"?"bar":"line",data:{labels:m,datasets:R},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",align:"end",labels:{boxWidth:10,boxHeight:10,font:{size:11,weight:"600"},color:"#6b5348",filter(M){return!!M.text}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,filter(M){return!!M.dataset.label},callbacks:{label(M){return`${M.dataset.label||""}: ${metaReportChartTooltipLabel(M.parsed.y,n)}`}}}},scales:{x:{grid:{color:"rgba(26, 18, 8, 0.06)"},ticks:{color:"#6b5348",font:{size:11},maxRotation:45,minRotation:0}},y:{type:"linear",position:"left",title:{display:!0,text:A,color:"#6b5348",font:{size:11,weight:"600"}},grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:B}}}}})}function updateMetaReportChart(e,t,n){const a=document.getElementById(`meta-report-chart-${e}`),o=document.getElementById(`meta-report-chart-${e}-empty`);if(!a||!o)return;const r=e==="roas"?"roasKr":"poasKr",s=e==="roas"?"roasX":"poasX",i=t,l=i.filter(c=>metaReportChartValue(c,n,r,s)!=null);if(metaReportsState.chartInstances[e]&&(metaReportsState.chartInstances[e].destroy(),metaReportsState.chartInstances[e]=null),l.length<META_REPORT_CHART_MIN_POINTS||typeof Chart>"u"){a.hidden=!0,o.hidden=!1;return}a.hidden=!1,o.hidden=!0,metaReportsState.chartInstances[e]=buildMetaReportLineChart(a,i,n,r,s)}function updateMetaReportSpendReturnChart(e,t,n,{projection:a=null,showProjection:o=!1,projectionLabel:r="Projected",chartType:s=metaReportsState.spendChartType,target:i="spend"}={}){const l=i==="scenario"?`meta-report-scenario-chart-${e}`:`meta-report-chart-scatter-${e}`,c=i==="scenario"?`meta-report-scenario-chart-${e}-empty`:`meta-report-chart-scatter-${e}-empty`,d=document.getElementById(l),u=document.getElementById(c);if(!d||!u)return;const p=e==="roas"?"roasKr":"poasKr",h=e==="roas"?"roasX":"poasX",g=e==="poas"?t.filter(m=>m.poasKr!=null&&m.poasX!=null):t.filter(m=>metaReportParseAmount(m.spend)>0),b=i==="scenario"?"scenarioChartInstances":"chartScatterInstances";if(metaReportsState[b][e]&&(metaReportsState[b][e].destroy(),metaReportsState[b][e]=null),g.length<META_REPORT_CHART_MIN_POINTS||typeof Chart>"u"){d.hidden=!0,u.hidden=!1;return}if(o&&a?.insufficientData){d.hidden=!0,u.hidden=!1;return}d.hidden=!1,u.hidden=!0;const y=n==="x"?resolveMetaReportSpendChartBaseline(g,a):null;metaReportsState[b][e]=buildMetaReportDualMetricChart(d,{series:g,mode:n,krKey:p,xKey:h,returnLabel:e==="roas"?"ROAS":"POAS",chartType:s,projection:a,projectionLabel:r,showProjection:o,baselineSpend:y})}function updateMetaReportScatterChart(e,t,n){updateMetaReportSpendReturnChart(e,t,n,{showProjection:!1,chartType:metaReportsState.spendChartType,target:"spend"})}function updateMetaReportScenarioChart(e,t,n,a,o=null){const r=document.getElementById(`meta-report-scenario-chart-${e}`),s=document.getElementById(`meta-report-scenario-chart-${e}-empty`);if(!r||!s)return;const i=o||metaReportsState.clientPayload||metaReportsState.publicPayload,l=resolveMetaReportScenarioDisplayTimeline(i,t),c=resolveMetaReportScenarioAdActiveSeries(l,e),d=resolveMetaReportScenarioChartSeries(c);if(metaReportsState.scenarioChartInstances[e]&&(metaReportsState.scenarioChartInstances[e].destroy(),metaReportsState.scenarioChartInstances[e]=null),d.length<META_REPORT_CHART_MIN_POINTS||typeof Chart>"u"){r.hidden=!0,s.hidden=!1;return}r.hidden=!1,s.hidden=!0;const u=n?.insufficientData?null:n;metaReportsState.scenarioChartInstances[e]=buildMetaReportScenarioExtrapolationChart(r,{series:l,mode:a,kind:e,projection:u,chartType:metaReportsState.spendChartType,hasBottomline:e==="poas"})}function mountMetaReportScenarioCharts(e){const t=resolveMetaReportScenarioPayload(e),n=e||metaReportsState.clientPayload||metaReportsState.publicPayload,a=resolveMetaReportScenarioDisplayTimeline(n),o=payloadHasMetaReportBottomline(t),r=document.getElementById("meta-report-scenario-poas-wrap");r&&(r.hidden=!o);const s=metaReportsState.chartProjection;updateMetaReportScenarioChart("roas",a,s,metaReportsState.chartScenarioRoasMode,n),o?updateMetaReportScenarioChart("poas",a,s,metaReportsState.chartScenarioPoasMode,n):metaReportsState.scenarioChartInstances.poas&&(metaReportsState.scenarioChartInstances.poas.destroy(),metaReportsState.scenarioChartInstances.poas=null)}function syncMetaReportSpendChartTypeToolbar(e=metaReportsState.chartTab||"trend"){const t=document.getElementById("meta-report-spend-chart-type-wrap");t&&(t.hidden=e!=="spend")}function setMetaReportChartTab(e){metaReportsState.chartTab=e,document.querySelectorAll("[data-meta-chart-tab]").forEach(t=>{const n=t.getAttribute("data-meta-chart-tab")===e;t.classList.toggle("is-active",n),t.setAttribute("aria-selected",n?"true":"false")}),document.querySelectorAll("[data-meta-chart-panel]").forEach(t=>{const n=t.getAttribute("data-meta-chart-panel")===e;t.classList.toggle("is-active",n),t.hidden=!n}),syncMetaReportSpendChartTypeToolbar(e),mountActiveMetaReportCharts()}function mountActiveMetaReportCharts(){const e=metaReportsState.chartSeries||[];metaReportsState.chartTab==="spend"?(updateMetaReportScatterChart("roas",e,metaReportsState.chartScatterRoasMode),updateMetaReportScatterChart("poas",e,metaReportsState.chartScatterPoasMode)):(updateMetaReportChart("roas",e,metaReportsState.chartRoasMode),updateMetaReportChart("poas",e,metaReportsState.chartPoasMode))}function refreshMetaReportSpendAndScenarioCharts(e){mountActiveMetaReportCharts(),document.getElementById("meta-report-scenario-card")&&e?syncMetaReportScenario(e):mountMetaReportScenarioCharts(e)}function setMetaReportSpendChartType(e,{persist:t=!1,clientId:n=null,payload:a=null}={}){const o=normalizeMetaReportSpendChartType(e);metaReportsState.spendChartType=o,document.querySelectorAll("[data-spend-chart-type]").forEach(s=>{s.classList.toggle("is-active",s.getAttribute("data-spend-chart-type")===o)});const r=a||metaReportsState.clientPayload||metaReportsState.publicPayload;return refreshMetaReportSpendAndScenarioCharts(r),t&&n?patchMetaReportSettings(n,{metaReportSpendChartType:o}):Promise.resolve(null)}function bindMetaReportChartTabs(){document.querySelectorAll("[data-meta-chart-tab]").forEach(e=>{e.onclick=()=>{setMetaReportChartTab(e.getAttribute("data-meta-chart-tab"))}})}function bindMetaReportChartToggles(){const e=document.getElementById("meta-chart-roas-mode");e&&e.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartRoasMode=i,e.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportChart("roas",metaReportsState.chartSeries||[],i)}});const t=document.getElementById("meta-chart-poas-mode");t&&t.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartPoasMode=i,t.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportChart("poas",metaReportsState.chartSeries||[],i)}});const n=document.getElementById("meta-chart-scatter-roas-mode");n&&n.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScatterRoasMode=i,n.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScatterChart("roas",metaReportsState.chartSeries||[],i)}});const a=document.getElementById("meta-chart-scatter-poas-mode");a&&a.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScatterPoasMode=i,a.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScatterChart("poas",metaReportsState.chartSeries||[],i)}});const o=document.getElementById("meta-scenario-roas-mode");o&&o.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScenarioRoasMode=i,o.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScenarioChart("roas",resolveMetaReportScenarioDisplayTimeline(metaReportsState.clientPayload||metaReportsState.publicPayload,metaReportsState.chartSeries||[]),metaReportsState.chartProjection,i)}});const r=document.getElementById("meta-scenario-poas-mode");r&&r.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScenarioPoasMode=i,r.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScenarioChart("poas",resolveMetaReportScenarioDisplayTimeline(metaReportsState.clientPayload||metaReportsState.publicPayload,metaReportsState.chartSeries||[]),metaReportsState.chartProjection,i)}})}function bindMetaReportSpendChartTypePicker(e,t){document.querySelectorAll("#meta-report-spend-chart-type-wrap [data-spend-chart-type]").forEach(n=>{n.onclick=async()=>{const a=n.getAttribute("data-spend-chart-type");if(!(!a||a===metaReportsState.spendChartType)&&(setMetaReportSpendChartType(a,{payload:t}),!!e))try{const o=await patchMetaReportSettings(e,{metaReportSpendChartType:normalizeMetaReportSpendChartType(a)});o?.settings&&t&&(t.settings={...t.settings,...o.settings},metaReportsState.clientPayload?.clientId===t.clientId&&(metaReportsState.clientPayload.settings=t.settings))}catch(o){showToast(o.message||"Could not save chart type default","error")}}})}function syncMetaReportChartToggleUi(){[["roas",metaReportsState.chartRoasMode,"meta-chart-roas-mode"],["poas",metaReportsState.chartPoasMode,"meta-chart-poas-mode"],["scatter-roas",metaReportsState.chartScatterRoasMode,"meta-chart-scatter-roas-mode"],["scatter-poas",metaReportsState.chartScatterPoasMode,"meta-chart-scatter-poas-mode"],["scenario-roas",metaReportsState.chartScenarioRoasMode,"meta-scenario-roas-mode"],["scenario-poas",metaReportsState.chartScenarioPoasMode,"meta-scenario-poas-mode"]].forEach(([,e,t])=>{const n=document.getElementById(t);n&&n.querySelectorAll("[data-mode]").forEach(a=>{a.classList.toggle("is-active",a.getAttribute("data-mode")===e)})})}function scheduleMetaReportScenarioSettingsPersist(e){e&&(clearTimeout(metaReportsState._scenarioSettingsTimer),metaReportsState._scenarioSettingsTimer=setTimeout(()=>{patchMetaReportSettings(e,{metaReportBudgetMultiplier:metaReportsState.budgetMultiplier,metaReportBudgetBaseline:metaReportsState.budgetBaseline,metaReportScenarioMonthWindow:metaReportsState.scenarioMonthWindow,metaReportScenarioSmoothUneven:metaReportsState.scenarioSmoothUneven,metaReportScenarioBlendHistory:metaReportsState.scenarioBlendHistory,metaReportScenarioIncludeTrend:metaReportsState.scenarioIncludeTrend},{fast:!0}).catch(()=>{})},350))}function syncMetaReportScenarioControlValues(){const e=document.getElementById("meta-report-budget-multiplier"),t=document.getElementById("meta-report-budget-multiplier-value");e&&(e.value=String(metaReportsState.budgetMultiplier)),t&&(t.textContent=`${metaReportsState.budgetMultiplier.toFixed(1)}\xD7`);const n=document.getElementById("meta-report-budget-baseline");n&&(n.value=normalizeMetaReportBudgetBaseline(metaReportsState.budgetBaseline));const a=document.getElementById("meta-report-scenario-month-window");a&&(a.value=normalizeMetaReportScenarioMonthWindow(metaReportsState.scenarioMonthWindow))}function bindMetaReportScenarioControls(e,{editable:t=!1}={}){if(!t)return;const n=e?.clientId||null;syncMetaReportScenarioControlValues();const a=document.getElementById("meta-report-budget-multiplier"),o=document.getElementById("meta-report-budget-multiplier-value"),r=document.getElementById("meta-report-budget-baseline"),s=document.getElementById("meta-report-scenario-month-window"),i=()=>scheduleMetaReportScenarioSettingsPersist(n),l=()=>syncMetaReportScenario(e);a&&(a.oninput=()=>{metaReportsState.budgetMultiplier=normalizeMetaReportBudgetMultiplier(a.value),o&&(o.textContent=`${metaReportsState.budgetMultiplier.toFixed(1)}\xD7`),l(),i()}),r&&(r.onchange=()=>{metaReportsState.budgetBaseline=normalizeMetaReportBudgetBaseline(r.value),l(),i()}),s&&(s.onchange=()=>{metaReportsState.scenarioMonthWindow=normalizeMetaReportScenarioMonthWindow(s.value),l(),i()});const c=()=>{document.querySelectorAll("[data-scenario-pill]").forEach(d=>{d.onclick=()=>{const u=d.getAttribute("data-scenario-pill");if(!u||d.disabled)return;metaReportsState[u]=!metaReportsState[u],applyMetaReportScenarioPillsToState(getMetaReportScenarioPillsFromState());const p=document.getElementById("meta-report-scenario-pills-wrap");p&&(p.outerHTML=renderMetaReportScenarioModelPills(),c()),l(),i()}})};c()}function syncMetaReportScenario(e){const t=resolveMetaReportScenarioPayload(e),n=resolveMetaReportScenarioSeries(e),a=payloadHasMetaReportBottomline(t),o=filterMetaReportScenarioSeries(n,{hasBottomline:a}),r=buildMetaReportScenarioProjection(n,e);if(metaReportsState.chartProjection=r,syncMetaReportBaselineUi(o,r,t),!document.getElementById("meta-report-scenario-card"))return;const i=document.getElementById("meta-report-scenario-context-wrap");i&&(i.innerHTML=renderMetaReportScenarioContextStrip(r));const l=document.getElementById("meta-report-scenario-grid");l&&(l.innerHTML=renderMetaReportScenarioMetrics(r)),mountMetaReportScenarioCharts(e)}function mountMetaReportTrendCharts(e,{editable:t=!1,clientId:n=null}={}){const a=document.getElementById("meta-report-charts-panel");if(!e||!a)return;hydrateMetaReportSpendChartType(e),hydrateMetaReportScenarioSettings(e);const{series:o,demo:r}=resolveMetaReportChartSeries(e,{allowDemo:!t});metaReportsState.chartSeries=o,metaReportsState.chartDemo=r,updateMetaReportScenarioSource(e);const s=document.getElementById("meta-report-chart-demo-badge");s&&(s.hidden=!(r&&t)),bindMetaReportChartTabs(),bindMetaReportChartToggles(),t&&(bindMetaReportScenarioControls(e,{editable:!0}),bindMetaReportSpendChartTypePicker(n,e)),syncMetaReportChartToggleUi(),syncMetaReportSpendChartTypeToolbar(metaReportsState.chartTab||"trend"),document.querySelectorAll("[data-spend-chart-type]").forEach(i=>{i.classList.toggle("is-active",i.getAttribute("data-spend-chart-type")===metaReportsState.spendChartType)}),setMetaReportChartTab(metaReportsState.chartTab||"trend"),syncMetaReportScenario(e)}function mountMetaReportCharts(e,{editable:t=!1,clientId:n=null}={}){if(destroyMetaReportCharts(),destroyMetaReportComparisonChart(),!e)return;t||(metaReportsState.reportViewMode="monthly");const a=metaReportsState.reportViewMode||"monthly";if(t&&bindMetaReportViewModeTabs(e,{editable:t}),a==="monthly"||!t){mountMetaReportTrendCharts(e,{editable:t,clientId:n});return}if(mountMetaReportComparison(e,{editable:t}),t){const{series:o}=resolveMetaReportChartSeries(e,{allowDemo:!1});o.length&&(metaReportsState.chartSeries=o),bindMetaReportScenarioControls(e,{editable:!0}),syncMetaReportScenario(e)}}function syncMetaReportMonthPanelDom(e,t={},n=null){const a=n||metaReportsState.clientPayload||metaReportsState.publicPayload,o=metaReportsState.activeMonthKey,r=resolveMetaReportActiveMonthPayload(a)||e,s=document.getElementById("meta-report-month-panel");s&&(a&&(hydrateMetaReportSpendChartType(a),hydrateMetaReportScenarioSettings(a)),s.innerHTML=renderMetaReportMonthBody(r,{...t,yearPayload:t.yearPayload||a,activeMonthKey:o||r?.monthKey||null}),requestAnimationFrame(()=>{mountMetaReportCharts(a,{editable:!!t.editable,clientId:a?.clientId||null})}))}function renderMetaReportEmptyMonthCard({editable:e=!1,synced:t=!1}={}){return t?`
      <div class="meta-report-empty-month-wrap">
        <div class="meta-report-empty-month-card is-synced-empty" role="status">
          <div class="meta-report-empty-month-icon" aria-hidden="true">${ICON_CHART}</div>
          <h3 class="meta-report-empty-month-title">No ad spend recorded for this month</h3>
        </div>
      </div>
    `:`
    <div class="meta-report-empty-month-wrap">
      <div class="meta-report-empty-month-card" role="status">
        <div class="meta-report-empty-month-icon" aria-hidden="true">${ICON_CHART}</div>
        <h3 class="meta-report-empty-month-title">No ad spend recorded for this month yet</h3>
        ${e?'<p class="meta-report-empty-month-text">Sync Meta ads data to populate this report.</p>':""}
        ${e?`
    <div class="meta-report-empty-month-hints">
      <div class="meta-report-empty-month-hint">
        <span class="meta-report-empty-month-hint-icon" aria-hidden="true">\u2193</span>
        <span>Click <strong>Refresh from Meta</strong> below to pull data for this month.</span>
      </div>
      <div class="meta-report-empty-month-hint">
        <span class="meta-report-empty-month-hint-icon" aria-hidden="true">\u2191</span>
        <span>Use <strong>Backfill from Meta</strong> above to import historical months.</span>
      </div>
    </div>
  `:`
    <p class="meta-report-empty-month-text">Ad spend data has not been synced for this month yet.</p>
  `}
      </div>
    </div>
  `}function renderMetaReportMonthTables(e,{editable:t=!1,adGroupTitle:n="Meta ads"}={}){if(!e)return'<div class="meta-report-empty">No data for this month yet.</div>';if(e.meta?.emptyMonth)return renderMetaReportEmptyMonthCard({editable:t,synced:!!e.metaFetchedAt});const a=[["Total spend",metaFmtKr(e.meta?.spend),""],["Cost Pr Mile (CPM)",metaFmtKr(e.meta?.cpm),""],["Impressions",metaFmtNum(e.meta?.impressions),""],["Reach",metaFmtNum(e.meta?.reach),""],["Click",metaFmtNum(e.meta?.clicks),""],["CTR",metaFmtNum(e.meta?.conversionRatePercent,2),"%"]],o=[["Leads",metaFmtNum(e.topline?.leads),""],["Cost Per Lead (CPL)",metaFmtKr(e.topline?.cpl),""],["Won leads",metaFmtNum(e.topline?.wonLeads),""],["Total Lead Value",metaFmtKr(e.topline?.totalLeadValue),""],["Average Lead Value",metaFmtKr(e.topline?.avgLeadValue),""],["Client acquisition cost (CAC)",metaFmtKr(e.topline?.cac),""],["Return on Ads Spend (ROAS)",metaFmtKr(e.topline?.roasKr),""],["Return on Ads Spend % (ROAS)",metaFmtX(e.topline?.roasX),""]];let r="";if(r+=renderMetaReportMetricTable(n,a,"meta"),r+=renderMetaReportMetricTable("Topline KPI'er",o,"topline",{highlightLastN:2}),e.bottomline){const s=[["Leads",metaFmtNum(e.bottomline.leads),""],["Won leads",metaFmtNum(e.bottomline.wonLeads),""],["Total Lead Value",metaFmtKr(e.bottomline.totalLeadValue),""],["Average Lead Value",metaFmtKr(e.bottomline.avgLeadValue),""],["Client acquisition cost (CAC)",metaFmtKr(e.bottomline.cac),""],["Avg Total Profit",metaFmtKr(e.bottomline.totalProfit),""],["Avg Single Profit Order",metaFmtKr(e.bottomline.avgProfitPerWon),""],["Profit on Ads Spend (POAS)",metaFmtKr(e.bottomline.poasKr),""],["Profit on Ads Spend % (POAS)",metaFmtX(e.bottomline.poasX),""]];if(e.bottomline.feeMode){const i=e.bottomline.feeLabel||(e.bottomline.feeMode==="marketing"?"Censio marketing fee":`Censio performance fee (${metaFmtNum(e.bottomline.feePercent,0)}%)`);s.push([i,metaFmtKr(e.bottomline.censioFee),""]),s.push(["Profit on Investment (POI)",metaFmtKr(e.bottomline.poiKr),""]),s.push(["Profit on Investment % (POI)",metaFmtX(e.bottomline.poiX),""])}r+=renderMetaReportMetricTable("Bottomline KPI'er",s,"bottomline",{highlightLastN:2})}return r?`
    <div class="meta-report-tables-card">
      <div class="meta-report-tables-card-label">Details</div>
      <div class="meta-report-groups-stack">${r}</div>
    </div>
  `:""}function renderMetaReportMonthBody(e,{editable:t=!1,yearPayload:n=null,activeMonthKey:a=null,settings:o=null}={}){const r=a||e?.monthKey||null,s=r?metaReportMonthBounds(r):null,i=o||n?.settings||{},l=isMetaReportGhlListClient(i),c=resolveClientToplineMode(i),d=resolveMetaToplineSource(e,i),u=l&&c==="cenhub"&&d==="ghl";let p="";if(t&&e&&!e.meta?.emptyMonth&&s){const E=u?" readonly":"",I=renderMetaReportMonthManualRow(e,i);p=`
      <div class="meta-report-edit-panel" id="meta-report-edit-panel">
        <div class="meta-report-edit-panel-head">
          <h3>Edit month inputs \xB7 ${esc(metaMonthLabel(r))}</h3>
          ${renderMetaMonthSourcePill(e,i)}
        </div>
        <p class="meta-report-edit-note">These fields drive Topline KPI'er. Ad spend comes from Meta.</p>
        <div class="meta-report-edit-grid">
          <label>Period start<input type="date" id="meta-report-period-start" value="${esc(s.start)}" /></label>
          <label>Period end<input type="date" id="meta-report-period-end" value="${esc(s.end)}" /></label>
          <label class="meta-cv-value-field${u?" is-locked":""}">Number of leads<input type="number" step="any" id="meta-report-leads" value="${esc(u?e.ghlTotals?.leads??e.topline?.leads??"":e.topline?.leads??"")}"${E}${u?' disabled tabindex="-1" aria-readonly="true"':""} /></label>
          <label class="meta-cv-value-field${u?" is-locked":""}">Won leads<input type="number" step="any" id="meta-report-won-leads" value="${esc(e.topline?.wonLeads??"")}"${E}${u?' disabled tabindex="-1" aria-readonly="true"':""} /></label>
          <label>Avg lead value<input type="number" step="any" id="meta-report-avg-lead-value" value="${esc(e.topline?.avgLeadValue??"")}"${E} /></label>
          <label>Avg profit per won<input type="number" step="any" id="meta-report-avg-profit" value="${esc(e.inputs?.avgProfitPerWon??"")}"${E} /></label>
        </div>
        ${I}
        <div class="meta-report-edit-actions">
          <button type="button" class="admin-btn admin-btn--ghost" id="meta-report-refresh-meta">${ICON_SYNC} Refresh from Meta</button>
          ${u?`<button type="button" class="admin-btn admin-btn--ghost" id="meta-report-refresh-snapshot">${ICON_SYNC} Refresh Cenhub snapshot</button>`:""}
          <button type="button" class="admin-btn admin-btn--primary" id="meta-report-save-month"${u?" disabled":""}>Save month</button>
        </div>
      </div>
    `}const h=a||e?.monthKey||null,g=t?h?`Report preview \xB7 ${metaMonthLabel(h)}`:"Report preview":h?`Report \xB7 ${metaMonthLabel(h)}`:"Report",b=metaReportsState.reportViewMode||"monthly",y=shouldShowMetaReportYearVisuals(e,n,{editable:t}),m=t&&y,f=e&&!e.meta?.emptyMonth?`
    <div class="meta-report-preview-card">
      <div class="meta-report-preview-card-label">${g}</div>
      ${renderMetaReportHighlightStrip(e)}
    </div>
  `:"",v=renderMetaReportMonthTables(e,{editable:t}),$=y?renderMetaReportChartsPanel({editable:t}):"",w=t&&y?renderMetaReportScenarioCard():"",S=m?renderMetaReportViewModeTabs():"";let C;return y?C=`
      <div class="meta-report-view-panel${!m||b==="monthly"?" is-active":""}" data-report-view-panel="monthly" role="tabpanel"${!m||b==="monthly"?"":" hidden"}>
        <div class="meta-report-content-layout">
          <div class="meta-report-content-main">${v}</div>
          ${$}
        </div>
      </div>
      ${m?`
      <div class="meta-report-view-panel${b==="comparison"?" is-active":""}" data-report-view-panel="comparison" role="tabpanel"${b==="comparison"?"":" hidden"}>
        ${renderMetaReportComparisonView()}
      </div>`:""}
      ${w}
    `:C=`<div class="meta-report-content-main">${v}</div>`,`${p}${f}${S}${C}`}function renderMetaReportsHubPage(e){const t=e.clients||[],n=e.meta||{};return`
    ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero meta-premium-page-hero">
      <div class="meta-premium-page-hero-inner">
        <div class="admin-breadcrumb">
          <a href="/admin">Clients</a>
          <span aria-hidden="true"> / </span>
          <span>Meta reports</span>
        </div>
        <h1>Meta client reports</h1>
      </div>
    </div>
    <div class="admin-hub meta-reports-page">
      <div class="meta-hub-layout">
        <div id="meta-reports-banner">${renderMetaReportsBannerHtml(n)}</div>
        <div class="hub-toolbar-row">
          <div class="hub-search">
            ${ICON_SEARCH}
            <input type="search" id="meta-reports-search" placeholder="Search clients or ad account\u2026" value="${esc(metaReportsState.searchQuery)}" autocomplete="off" />
          </div>
          <span class="hub-count" id="meta-reports-count">${t.length} client${t.length===1?"":"s"}</span>
          <div class="hub-toolbar-actions">
            <div class="meta-hub-filters" id="meta-reports-filters" role="tablist" aria-label="Filter clients">
              ${renderMetaHubFiltersHtml(metaReportsState.filter)}
            </div>
            <a class="admin-btn admin-btn--secondary" href="/admin/meta-reports/ghl-clients">Cenhub clients</a>
            <a class="admin-btn admin-btn--secondary" href="/admin/meta-reports/custom-values">Custom values</a>
            <button class="admin-btn admin-btn--secondary" type="button" id="meta-reports-refresh">${ICON_SYNC} Refresh</button>
          </div>
        </div>
        <div class="meta-hub-cards" id="meta-reports-cards">
          ${renderMetaReportsClientCards(t,e.filter,e.searchQuery)}
        </div>
      </div>
    </div>
    `)}
  `}function renderMetaReportsClientPage(e){const t=e.monthKeys||[],n=metaReportsState.activeMonthKey||t[t.length-1]||"",a=e.months?.[n]||null,o=e.settings||{},r=t.map(s=>`
    <button type="button" class="meta-report-tab${s===n?" is-active":""}" data-meta-month-tab="${esc(s)}">${esc(metaMonthLabel(s))}</button>
  `).join("");return`
    ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero meta-premium-page-hero">
      <div class="meta-premium-page-hero-inner">
        <div class="admin-breadcrumb">
          <a href="/admin">Clients</a>
          <span aria-hidden="true"> / </span>
          <a href="/admin/meta-reports">Meta reports</a>
          <span aria-hidden="true"> / </span>
          <span>${esc(e.accountName)}</span>
        </div>
        <h1>${esc(e.accountName)}</h1>
      </div>
    </div>
    <div class="sync-history-page meta-reports-page meta-report-client-page">
      ${renderMetaReportClientControlPanel(e)}
      <div class="meta-report-tabs" role="tablist">${r}</div>
      <div class="meta-report-month-panel" id="meta-report-month-panel">
        ${renderMetaReportMonthBody(a,getMetaReportMonthBodyOptions(o,{editable:!0,yearPayload:e}))}
      </div>
    </div>
    `)}
  `}function metaReportClientDisplayName(e){return String(e?.accountName||e?.clientId||"").trim()||"Meta report"}function syncMetaReportPublicBranding(e){const t=metaReportClientDisplayName(e);document.title=`${t} \xB7 Censio Analytics`;const n=document.querySelector(".meta-report-public-hero h1");n&&(n.textContent=t)}function renderPublicMetaReportPage(e){const t=metaReportClientDisplayName(e),n=e.reportKind==="google-ads",a=n?googleAdsPayloadToMetaUiShape(e):e,o=a.monthKeys||[],r=metaReportsState.activeMonthKey||o[o.length-1]||"",s=a.months?.[r]||null,i=n?renderGoogleAdsReportMonthBody(s,{editable:!1,yearPayload:a,activeMonthKey:r}):renderMetaReportMonthBody(s,getMetaReportMonthBodyOptions(a.settings,{editable:!1,yearPayload:a})),l=o.map(d=>`
    <button type="button" class="meta-report-tab${d===r?" is-active":""}" data-meta-month-tab="${esc(d)}">${esc(metaMonthLabel(d))}</button>
  `).join(""),c=n?"Google Ads performance report":"Meta ads performance report";return`
    <header class="brand-topbar">
      <div class="brand-topbar-inner">
        <div class="brand-topbar-left">
          <div class="meta-report-public-topbar-brand">
            <img
              class="meta-report-public-brand-mark"
              src="/censio-mark-orange.png"
              alt=""
              width="180"
              height="180"
            />
            <span class="meta-report-public-wordmark">
              <span class="meta-report-public-wordmark-censio">Censio</span>
              <span class="meta-report-public-wordmark-analytics">Analytics</span>
            </span>
          </div>
        </div>
      </div>
    </header>
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero meta-premium-page-hero meta-report-public-hero">
      <div class="meta-premium-page-hero-inner">
        <h1>${esc(t)}</h1>
        <p class="meta-report-public-subtitle">${esc(c)}</p>
      </div>
    </div>
    <div class="meta-reports-page meta-reports-page--public">
      <div class="meta-report-toolbar">
        <div class="meta-report-toolbar-left">
          <label class="meta-report-year-field">Year
            <select id="meta-report-year" class="admin-select">
              ${renderMetaReportYearSelectOptions(a,{disableUnavailable:!0})}
            </select>
          </label>
          <span class="meta-report-year-loading-banner" id="meta-report-public-year-loading-banner" hidden aria-live="polite"></span>
        </div>
        <div class="meta-report-toolbar-actions" id="meta-report-public-excel-sheet-btn"${n?" hidden":""}>
          ${renderMetaReportExcelSheetButton(a.settings||{},{variant:"secondary"})}
        </div>
      </div>
      <div class="meta-report-tabs" role="tablist">${l}</div>
      <div class="meta-report-month-panel" id="meta-report-month-panel">
        ${i}
      </div>
    </div>
    <div class="brand-footer brand-footer--public-report">
      Report by <strong>Censio Analytics</strong>
    </div>
    `)}
  `}function bindMetaReportCopyButtons(e=document){e.querySelectorAll("[data-copy-report-url]").forEach(t=>{t.onclick=async()=>{const n=t.getAttribute("data-copy-report-url"),a=`${window.location.origin}${n}`;try{await navigator.clipboard.writeText(a),showToast("Share link copied","success")}catch{showToast(a,"info")}}})}async function patchMetaReportSettings(e,t,{fast:n=!1}={}){metaReportsState._settingsInflight=(metaReportsState._settingsInflight||0)+1;const a=`/api/meta-reports/clients/${encodeURIComponent(e)}/settings`,o={method:"PATCH",body:JSON.stringify(t)};try{return n?await adminFetch(a,o):await adminFetchWithRetry(a,o,{retries:2,timeoutMs:2e4})}finally{metaReportsState._settingsInflight=Math.max(0,(metaReportsState._settingsInflight||1)-1)}}async function refreshMetaReportsHubData({silent:e=!0}={}){const t=document.getElementById("meta-reports-refresh");t&&(t.disabled=!0);try{const n=await adminFetch("/api/meta-reports?filter=all");metaReportsState.dashboardData=n,updateMetaReportsHubDom(getMetaReportsHubView(n,metaReportsState.filter,metaReportsState.searchQuery)),e||showToast("Meta reports refreshed","success")}catch(n){showToast(n.message||"Refresh failed","error")}finally{t&&(t.disabled=!1)}}function bindMetaReportsHubChromeEvents(){document.querySelectorAll("[data-meta-filter]").forEach(n=>{n.onclick=()=>{metaReportsState.filter=n.getAttribute("data-meta-filter")||"all",document.querySelectorAll("[data-meta-filter]").forEach(a=>{a.classList.toggle("is-active",a.getAttribute("data-meta-filter")===metaReportsState.filter)}),metaReportsState.dashboardData&&updateMetaReportsHubDom(getMetaReportsHubView(metaReportsState.dashboardData,metaReportsState.filter,metaReportsState.searchQuery))}});const e=document.getElementById("meta-reports-search");if(e){let n=null;e.oninput=()=>{clearTimeout(n),n=setTimeout(()=>{metaReportsState.searchQuery=e.value||"",metaReportsState.dashboardData&&updateMetaReportsHubDom(getMetaReportsHubView(metaReportsState.dashboardData,metaReportsState.filter,metaReportsState.searchQuery))},180)}}const t=document.getElementById("meta-reports-refresh");t&&(t.onclick=()=>refreshMetaReportsHubData({silent:!1}))}function mergeHubClientFromSettings(e,t={}){return!t||typeof t!="object"?null:mergeHubClient(e,{metaReportEnabled:t.metaReportEnabled,metaReportShowBottomline:t.metaReportShowBottomline,metaReportFeeEnabled:t.metaReportFeeEnabled,metaReportFeeMode:t.metaReportFeeMode,metaReportFeePercent:t.metaReportFeePercent,metaReportMarketingFeeAmount:t.metaReportMarketingFeeAmount,metaReportSlug:t.metaReportSlug,reportUrl:t.reportUrl})}function refreshMetaReportsHubCards(){metaReportsState.dashboardData&&updateMetaReportsHubDom(getMetaReportsHubView(metaReportsState.dashboardData,metaReportsState.filter,metaReportsState.searchQuery))}function resolveMetaReportStoredFeeMode(e={}){return e.metaReportFeeMode?e.metaReportFeeMode:Number(e.metaReportMarketingFeeAmount)>0?"marketing":"performance"}function resolveMetaReportFeeModeToRestore(e){return e?resolveMetaReportStoredFeeMode(e):"performance"}function bindMetaReportsHubRowEvents(e=document){e.querySelectorAll("[data-meta-report-enabled]").forEach(t=>{let n=0;t.onchange=async()=>{const a=t.getAttribute("data-meta-report-enabled"),o=++n,r=t.checked,s=!r;mergeHubClientFromSettings(a,{metaReportEnabled:r}),updateMetaReportHubCardReportState(a,r);const i=t.closest(".meta-hub-switch");i?.classList.add("is-saving");try{const l=await patchMetaReportSettings(a,{metaReportEnabled:r},{fast:!0});if(o!==n)return;const c=l.settings||{};mergeHubClientFromSettings(a,c),updateMetaReportHubCardReportState(a,!!(c.metaReportEnabled??r)),showToast(r?"Report enabled":"Report disabled","success")}catch(l){if(o!==n)return;mergeHubClientFromSettings(a,{metaReportEnabled:s}),t.checked=s,updateMetaReportHubCardReportState(a,s),showToast(l.message||"Update failed","error")}finally{o===n&&i?.classList.remove("is-saving")}}}),e.querySelectorAll("[data-meta-bottomline]").forEach(t=>{t.onchange=async()=>{const n=t.getAttribute("data-meta-bottomline");t.disabled=!0;try{const a=await patchMetaReportSettings(n,{metaReportShowBottomline:t.checked});mergeHubClientFromSettings(n,a.settings||{}),showToast("Bottomline setting saved","success"),refreshMetaReportsHubCards()}catch(a){showToast(a.message||"Update failed","error"),t.checked=!t.checked}finally{t.disabled=!1}}}),e.querySelectorAll("[data-meta-fee]").forEach(t=>{t.onchange=async()=>{const n=t.getAttribute("data-meta-fee"),a=(metaReportsState.dashboardData?.clients||[]).find(o=>o.clientId===n);t.disabled=!0;try{const o=t.checked?{metaReportFeeEnabled:!0,metaReportFeeMode:resolveMetaReportFeeModeToRestore(a)}:{metaReportFeeEnabled:!1},r=await patchMetaReportSettings(n,o);mergeHubClientFromSettings(n,r.settings||{}),showToast("Fee setting saved","success"),refreshMetaReportsHubCards()}catch(o){showToast(o.message||"Update failed","error"),t.checked=!t.checked}finally{t.disabled=!1}}}),bindMetaReportCopyButtons(e),e.querySelectorAll("[data-meta-provision]").forEach(t=>{t.onclick=async()=>{t.disabled=!0;try{await adminFetch("/api/meta-reports/provision",{method:"POST",body:JSON.stringify({accountName:t.getAttribute("data-meta-provision-name"),metaAdAccountId:t.getAttribute("data-meta-provision"),metaReportEnabled:!0})}),showToast("Client added","success"),await refreshMetaReportsHubData({silent:!0})}catch(n){showToast(n.message||"Failed to add client","error"),t.disabled=!1}}})}function bindMetaReportsHubEvents(){bindMetaReportsHubChromeEvents(),bindMetaReportsHubRowEvents(document.getElementById("meta-reports-cards")||document)}function bindMetaReportsClientTabEvents(e){document.querySelectorAll("[data-meta-month-tab]").forEach(t=>{t.onclick=()=>{switchMetaReportMonthTab(t.getAttribute("data-meta-month-tab"),{editable:!0})}})}function setMetaReportSavingState(e){const t=document.getElementById("meta-report-modal-save-indicator");if(t){t.closest(".meta-report-modal")?.classList.toggle("is-saving",e),t.classList.toggle("is-visible",e);return}const n=document.getElementById("meta-report-month-panel"),a=document.getElementById("meta-report-save-indicator");n&&n.classList.toggle("is-loading",e),a&&a.classList.toggle("is-visible",e)}function syncMetaReportFeeFieldState(e,t="meta-report"){const n=document.getElementById(`${t}-fee-field`),a=document.getElementById(`${t}-setting-fee-percent`);n&&n.classList.toggle("is-disabled",!e),a&&(a.disabled=!e)}function syncMetaReportSettingsControls(e={},t=null){syncMetaReportBottomlineFeeDom(e,"meta-report")}function describeMetaReportSettingsChange(e,t){if(Object.prototype.hasOwnProperty.call(e,"metaReportFeeMode")){const n=t.metaReportFeeMode;return n?n==="marketing"?"Censio marketing fee enabled":"Censio performance fee enabled":"Censio fee disabled"}return Object.prototype.hasOwnProperty.call(e,"metaReportFeeEnabled")?t.metaReportFeeEnabled?"Censio fee enabled":"Censio fee disabled":Object.prototype.hasOwnProperty.call(e,"metaReportFeePercent")?`Performance fee set to ${t.metaReportFeePercent??20}% \u2014 report updated`:Object.prototype.hasOwnProperty.call(e,"metaReportMarketingFeeAmount")?`Marketing fee set to Dkr ${t.metaReportMarketingFeeAmount??0} \u2014 report updated`:Object.prototype.hasOwnProperty.call(e,"metaReportShowBottomline")?t.metaReportShowBottomline?"Bottomline shown on report":"Bottomline hidden from report":Object.prototype.hasOwnProperty.call(e,"metaReportSpendChartType")?`Default spend chart set to ${META_REPORT_SPEND_CHART_TYPE_OPTIONS.find(a=>a.value===t.metaReportSpendChartType)?.label||t.metaReportSpendChartType}`:Object.prototype.hasOwnProperty.call(e,"metaReportExcelSheetUrl")?resolveMetaReportExcelSheetUrl(t)?"Excel sheet link saved":"Excel sheet link removed":"Settings saved"}async function saveMetaReportClientSettings(e,t,n){setMetaReportSavingState(!0);try{const a=await patchMetaReportSettings(e,{...t,monthKey:metaReportsState.activeMonthKey}),o=a.settings||{},r=metaReportsState.clientPayload;r&&(r.settings=o,a.monthPayload&&metaReportsState.activeMonthKey&&(r.months=r.months||{},r.months[metaReportsState.activeMonthKey]=a.monthPayload));const s=a.monthPayload||r?.months?.[metaReportsState.activeMonthKey]||null;syncMetaReportSettingsControls(o,s),Object.prototype.hasOwnProperty.call(t,"metaReportExcelSheetUrl")&&(updateMetaReportExcelSheetSummary(o),syncMetaReportExcelSheetUi(o)),(Object.prototype.hasOwnProperty.call(t,"metaReportShowBottomline")||Object.prototype.hasOwnProperty.call(t,"metaReportFeeMode")||Object.prototype.hasOwnProperty.call(t,"metaReportFeePercent")||Object.prototype.hasOwnProperty.call(t,"metaReportMarketingFeeAmount"))&&updateMetaReportBottomlineFeeSummary(o,"meta-report"),s&&document.getElementById("meta-report-month-panel")&&(syncMetaReportMonthPanelDom(s,getMetaReportMonthBodyOptions(o,{editable:!0,yearPayload:r}),r),rebindMetaReportMonthPanelEvents(e,r)),showToast(describeMetaReportSettingsChange(t,o),"success")}catch(a){showToast(a.message||"Update failed","error"),n&&n()}finally{setMetaReportSavingState(!1)}}function bindMetaReportBackfillButton(e){const t=document.getElementById("meta-report-backfill");t&&(t.onclick=async()=>{const n=metaReportsState.clientPayload,a=metaReportMonthsNeedingBackfill(n),o=a.length?a:n?.monthKeys||[];if(!o.length)return;t.disabled=!0;const r=document.getElementById("meta-report-backfill-progress");let s=0,i=0;for(const l of o){s+=1,r&&(r.textContent=`Fetching ${metaMonthLabel(l)} ${l.slice(0,4)}\u2026 (${s}/${o.length})`);try{await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(l)}/refresh`,{method:"POST"})}catch{i+=1}}r&&(r.textContent=""),i?showToast(`Synced ${s-i}/${o.length} months. ${i} failed (check Meta token access).`,"error"):showToast(`Synced ${o.length} month${o.length===1?"":"s"} from Meta`,"success"),await loadMetaReportsClientPage({silent:!0})})}function renderMetaReportTabsSkeleton(e=12){return Array.from({length:e}).map(()=>'<span class="meta-cv-skeleton-pill meta-report-tab-skeleton" aria-hidden="true"></span>').join("")}function renderMetaReportMonthPanelSkeleton(){return`
    <div class="meta-report-year-content-skeleton" aria-busy="true" aria-label="Loading year data">
      <div class="meta-cv-skeleton-panel">
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--md"></div>
        <div class="meta-cv-skeleton-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));">
          ${Array.from({length:5}).map(()=>`
            <div class="meta-cv-skeleton-field">
              <div class="meta-cv-skeleton-line meta-cv-skeleton-line--xs"></div>
              <div class="meta-cv-skeleton-input"></div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="meta-report-groups-stack">
        ${Array.from({length:3}).map(()=>`
          <div class="meta-cv-skeleton-panel">
            <div class="meta-cv-skeleton-line meta-cv-skeleton-line--sm"></div>
            <div class="meta-cv-skeleton-line meta-cv-skeleton-line--full"></div>
          </div>
        `).join("")}
      </div>
    </div>
  `}function renderMetaCvListSkeleton(e=5){return Array.from({length:e}).map(()=>`
    <article class="meta-cv-client meta-cv-client-skeleton" aria-hidden="true">
      <div class="meta-cv-skeleton-row">
        <div class="meta-cv-skeleton-field" style="flex:1">
          <div class="meta-cv-skeleton-line meta-cv-skeleton-line--sm"></div>
          <div class="meta-cv-skeleton-line meta-cv-skeleton-line--xs"></div>
        </div>
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--xs"></div>
      </div>
      <div class="meta-cv-skeleton-row" style="margin-top:12px">
        ${Array.from({length:12}).map(()=>'<span class="meta-cv-skeleton-pill meta-cv-skeleton-pill--short"></span>').join("")}
      </div>
    </article>
  `).join("")}function renderMetaCvSummarySkeleton(){return Array.from({length:4}).map(()=>'<span class="meta-cv-skeleton-pill"></span>').join("")}function renderMetaCvEditorYearSkeleton(){return`
    <div class="meta-cv-editor-skeleton" aria-busy="true" aria-label="Loading year data">
      <div class="meta-cv-skeleton-line meta-cv-skeleton-line--sm"></div>
      <div class="meta-cv-skeleton-line meta-cv-skeleton-line--xs"></div>
      <div class="meta-cv-skeleton-grid">
        ${Array.from({length:5}).map(()=>`
          <div class="meta-cv-skeleton-field">
            <div class="meta-cv-skeleton-line meta-cv-skeleton-line--xs"></div>
            <div class="meta-cv-skeleton-input"></div>
          </div>
        `).join("")}
      </div>
      <div class="meta-cv-skeleton-panel">
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--md"></div>
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--full"></div>
      </div>
    </div>
  `}function setMetaReportYearLoadingBanner(e,t,n){const a=document.querySelector(e);if(!a)return;let o=a.querySelector(".meta-report-year-loading-banner");n?(o||(o=document.createElement("span"),o.className="meta-report-year-loading-banner",o.setAttribute("aria-live","polite"),a.appendChild(o)),o.innerHTML=`<span class="meta-report-save-indicator-spinner"></span> Loading ${esc(t)}\u2026`,o.hidden=!1):o&&(o.hidden=!0)}function setMetaReportClientYearLoading(e,t){const n=document.querySelector(".meta-report-client-page"),a=document.getElementById("meta-report-year");if(t){a&&(a.disabled=!0),n&&n.classList.add("is-year-loading"),setMetaReportYearLoadingBanner(".meta-report-client-page .meta-report-toolbar-left",e,!0);const o=document.querySelector(".meta-report-tabs");o&&(o.innerHTML=renderMetaReportTabsSkeleton(),o.setAttribute("aria-busy","true"));const r=document.getElementById("meta-report-month-panel");r&&(r.innerHTML=renderMetaReportMonthPanelSkeleton(),r.classList.add("is-loading")),destroyMetaReportCharts()}else{a&&(a.disabled=!1),n&&n.classList.remove("is-year-loading"),setMetaReportYearLoadingBanner(".meta-report-client-page .meta-report-toolbar-left",e,!1);const o=document.querySelector(".meta-report-tabs");o&&o.removeAttribute("aria-busy");const r=document.getElementById("meta-report-month-panel");r&&r.classList.remove("is-loading")}}function setMetaCvYearLoading(e,t){const n=document.querySelector(".sync-history-page.meta-reports-page"),a=document.getElementById("meta-cv-year"),o=document.getElementById("meta-cv-search");if(t){a&&(a.disabled=!0),o&&(o.disabled=!0),n&&n.classList.add("is-year-loading"),setMetaReportYearLoadingBanner(".meta-cv-toolbar-left",e,!0);const r=document.querySelector(".meta-cv-summary");r&&(r.classList.add("is-skeleton"),r.innerHTML=renderMetaCvSummarySkeleton());const s=document.querySelector(".meta-cv-legend");s&&s.setAttribute("aria-hidden","true");const i=document.getElementById("meta-cv-client-list");i&&(i.innerHTML=renderMetaCvListSkeleton(),i.setAttribute("aria-busy","true"));const l=document.getElementById("meta-cv-editor");l&&(l.innerHTML=renderMetaCvEditorYearSkeleton(),l.setAttribute("aria-busy","true"))}else{a&&(a.disabled=!1),o&&(o.disabled=!1),n&&n.classList.remove("is-year-loading"),setMetaReportYearLoadingBanner(".meta-cv-toolbar-left",e,!1);const r=document.querySelector(".meta-cv-summary");r&&r.classList.remove("is-skeleton");const s=document.querySelector(".meta-cv-legend");s&&s.removeAttribute("aria-hidden");const i=document.getElementById("meta-cv-client-list");i&&i.removeAttribute("aria-busy");const l=document.getElementById("meta-cv-editor");l&&l.removeAttribute("aria-busy")}}function setMetaReportPublicYearLoading(e,t){const n=document.querySelector(".meta-reports-page--public"),a=document.getElementById("meta-report-year");if(t){a&&(a.disabled=!0),n&&n.classList.add("is-year-loading"),setMetaReportYearLoadingBanner(".meta-reports-page--public .meta-report-toolbar-left",e,!0);const o=document.querySelector(".meta-reports-page--public .meta-report-tabs");o&&(o.innerHTML=renderMetaReportTabsSkeleton(),o.setAttribute("aria-busy","true"));const r=document.getElementById("meta-report-month-panel");r&&(r.innerHTML=renderMetaReportMonthPanelSkeleton(),r.classList.add("is-loading")),destroyMetaReportCharts()}else{a&&(a.disabled=!1),n&&n.classList.remove("is-year-loading"),setMetaReportYearLoadingBanner(".meta-reports-page--public .meta-report-toolbar-left",e,!1);const o=document.querySelector(".meta-reports-page--public .meta-report-tabs");o&&o.removeAttribute("aria-busy");const r=document.getElementById("meta-report-month-panel");r&&r.classList.remove("is-loading")}}function bindMetaReportsClientChromeEvents(e){const t=e.clientId,n=document.getElementById("meta-report-year");n&&(n.onchange=async()=>{if(n.selectedOptions?.[0]?.disabled){n.value=String(metaReportsState.selectedYear);return}const o=metaReportsState.selectedYear,r=Number(n.value);if(r!==o){metaReportsState.selectedYear=r,metaReportsState.activeMonthKey=null,metaReportsState.comparisonYearCache={},setMetaReportClientYearLoading(r,!0);try{await loadMetaReportsClientPage({silent:!0})}catch(s){metaReportsState.selectedYear=o,n&&(n.value=String(o)),await loadMetaReportsClientPage({silent:!0}),showToast(s.message||"Load failed","error")}finally{setMetaReportClientYearLoading(r,!1)}}}),bindMetaReportCopyButtons(),bindMetaReportBackfillButton(t),bindMetaReportBottomlineSummaryEvents(e),bindMetaReportExcelSheetSummaryEvents(e),bindMetaReportShareEvents(e)}function bindMetaReportsClientEvents(e){bindMetaReportsClientChromeEvents(e),bindMetaReportsClientTabEvents(e),rebindMetaReportMonthPanelEvents(e.clientId,e),isMetaReportGhlListClient(e.settings||{})&&bindMetaReportToplineSourceControl(e.clientId,e)}function bindMetaReportsClientEditEvents(e,t){const n=document.getElementById("meta-report-refresh-meta");n&&(n.onclick=async()=>{n.disabled=!0;try{const o=metaReportsState.activeMonthKey,r=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(o)}/refresh`,{method:"POST"});refreshMetaReportMonthPanel(r.monthPayload),showToast("Meta data refreshed","success")}catch(o){showToast(o.message||"Meta refresh failed","error")}finally{n.disabled=!1}});const a=document.getElementById("meta-report-save-month");a&&(a.onclick=async()=>{a.disabled=!0;try{const o=metaReportsState.activeMonthKey,r=t?.months?.[o],s=t?.settings||{},i=resolveClientToplineMode(s),l=resolveMetaToplineSource(r,s),c=isMetaReportGhlListClient(s)&&i==="cenhub"&&l==="manual",d={periodStart:document.getElementById("meta-report-period-start")?.value,periodEnd:document.getElementById("meta-report-period-end")?.value,wonLeads:document.getElementById("meta-report-won-leads")?.value===""?null:Number(document.getElementById("meta-report-won-leads")?.value),avgLeadValue:document.getElementById("meta-report-avg-lead-value")?.value===""?null:Number(document.getElementById("meta-report-avg-lead-value")?.value),avgProfitPerWon:document.getElementById("meta-report-avg-profit")?.value===""?null:Number(document.getElementById("meta-report-avg-profit")?.value)};c&&(d.toplineSource="manual",d.manualOverride=!0,d.manualLeads=document.getElementById("meta-report-leads")?.value===""?null:Number(document.getElementById("meta-report-leads")?.value));const u=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(o)}`,{method:"PUT",body:JSON.stringify(d)});refreshMetaReportMonthPanel(u.monthPayload),showToast("Month saved","success")}catch(o){showToast(o.message||"Save failed","error")}finally{a.disabled=!1}})}function bindPublicMetaReportTabEvents(e){document.querySelectorAll("[data-meta-month-tab]").forEach(t=>{t.onclick=()=>{switchMetaReportMonthTab(t.getAttribute("data-meta-month-tab"),{editable:!1})}})}function bindPublicMetaReportEvents(e){bindPublicMetaReportTabEvents(e);const t=document.getElementById("meta-report-year");t&&(t.onchange=async()=>{if(t.selectedOptions?.[0]?.disabled){t.value=String(metaReportsState.selectedYear);return}const a=metaReportsState.selectedYear,o=Number(t.value);if(o!==a){metaReportsState.selectedYear=o,metaReportsState.activeMonthKey=null,metaReportsState.comparisonYearCache={},setMetaReportPublicYearLoading(o,!0);try{await loadPublicMetaReportPage({silent:!0})}catch(r){metaReportsState.selectedYear=a,t&&(t.value=String(a)),await loadPublicMetaReportPage({silent:!0}),showToast(r.message||"Load failed","error")}finally{setMetaReportPublicYearLoading(o,!1)}}})}async function loadMetaReportsHubPage(){const e=document.getElementById("dashboard");if(!e)return;const t=await fetchStaffMe();if(!t){e.innerHTML=`
      ${renderBrandTopbar("")}
      ${wrapDashboardShell('<div class="sync-history-empty" style="padding:24px;text-align:center"><a class="admin-btn admin-btn--primary" href="/login?next='+encodeURIComponent(window.location.pathname)+'">Sign in</a></div>')}
    `;return}currentStaffUser=t,metaReportsState.hubMounted||(e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading Meta reports...</p></div>')}
    `);try{const n=await adminFetch("/api/meta-reports?filter=all");metaReportsState.dashboardData=n;const a=getMetaReportsHubView(n,metaReportsState.filter,metaReportsState.searchQuery);metaReportsState.hubMounted?updateMetaReportsHubDom(a):(e.innerHTML=renderMetaReportsHubPage(a),metaReportsState.hubMounted=!0,bindMetaReportsHubEvents())}catch(n){metaReportsState.hubMounted?showToast(n.message||"Load failed","error"):e.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(n.message)}</div>`)}
      `}}async function loadMetaReportsClientPage({silent:e=!1}={}){const t=document.getElementById("dashboard");if(!t)return;const n=await fetchStaffMe();if(!n){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}currentStaffUser=n;const a=CLIENT_SLUG;if(!metaReportsState.clientPageMounted)t.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading report editor...</p></div>')}
    `;else if(!e){const o=document.getElementById("meta-report-month-panel");o&&o.classList.add("is-loading")}try{const o=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(a)}?year=${encodeURIComponent(metaReportsState.selectedYear)}`);if(syncMetaReportSelectedYear(o,{disableUnavailable:!0}),Number(metaReportsState.selectedYear)!==Number(o.year))return loadMetaReportsClientPage({silent:!0});metaReportsState.activeMonthKey||(metaReportsState.activeMonthKey=o.monthKeys?.[o.monthKeys.length-1]||null),await ensureMetaReportScenarioSource(o,{editable:!0}),metaReportsState.clientPageMounted?updateMetaReportsClientContent(o):(metaReportsState.clientPayload=o,metaReportsState.clientReportSettingsExpanded=!1,metaReportsState.clientShareExpanded=!1,hydrateMetaReportSpendChartType(o),hydrateMetaReportScenarioSettings(o),t.innerHTML=renderMetaReportsClientPage(o),metaReportsState.clientPageMounted=!0,bindMetaReportsClientEvents(o),mountMetaReportCharts(o,{editable:!0}))}catch(o){if(!metaReportsState.clientPageMounted)t.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(o.message)}</div>`)}
      `;else{if(e)throw o;showToast(o.message||"Load failed","error")}}finally{const o=document.getElementById("meta-report-month-panel");o&&o.classList.remove("is-loading")}}const googleAdsReportsState={filter:"all",searchQuery:"",dashboardData:null,hubMounted:!1,clientPageMounted:!1,clientPayload:null,activeMonthKey:null,selectedYear:new Date().getFullYear(),reportViewMode:"monthly"};function googleAdsSettingsToMetaUx(e={}){return{metaReportEnabled:e.googleAdsReportEnabled,metaReportShowBottomline:e.googleAdsReportShowBottomline,metaReportFeeEnabled:e.googleAdsReportFeeEnabled,metaReportFeeMode:e.googleAdsReportFeeMode,metaReportFeePercent:e.googleAdsReportFeePercent,metaReportMarketingFeeAmount:e.googleAdsReportMarketingFeeAmount,metaReportSlug:e.googleAdsReportSlug,metaReportAccessToken:e.googleAdsReportAccessToken}}function metaUxPatchToGoogleAds(e={}){const t={};return e.metaReportEnabled!==void 0&&(t.googleAdsReportEnabled=e.metaReportEnabled),e.metaReportShowBottomline!==void 0&&(t.googleAdsReportShowBottomline=e.metaReportShowBottomline),e.metaReportFeeEnabled!==void 0&&(t.googleAdsReportFeeEnabled=e.metaReportFeeEnabled),e.metaReportFeeMode!==void 0&&(t.googleAdsReportFeeMode=e.metaReportFeeMode),e.metaReportFeePercent!==void 0&&(t.googleAdsReportFeePercent=e.metaReportFeePercent),e.metaReportMarketingFeeAmount!==void 0&&(t.googleAdsReportMarketingFeeAmount=e.metaReportMarketingFeeAmount),e.metaReportSlug!==void 0&&(t.googleAdsReportSlug=e.metaReportSlug),e.rotateAccessToken&&(t.rotateAccessToken=!0),t}function googleAdsMonthToMetaUiShape(e){if(!e)return null;const t=e.google||{},n=Number(t.spend)||0,a=Number(t.impressions)||0,o=!e.googleFetchedAt&&n<=0&&a<=0,r=t.cpm!=null?Number(t.cpm):a>0?Math.round(n/a*1e5)/100:0;return{...e,meta:{spend:n,cpm:r,impressions:a,reach:0,clicks:Number(t.clicks)||0,conversionRatePercent:Number(t.ctr)||0,emptyMonth:o},metaFetchedAt:e.googleFetchedAt||null,inputs:e.inputs||{wonLeads:e.topline?.wonLeads,avgLeadValue:e.topline?.avgLeadValue,avgProfitPerWon:e.topline?.avgProfitPerWon}}}function googleAdsPayloadToMetaUiShape(e){if(!e)return e;const t=e.settings||{};return{...e,reportUrl:e.reportUrl||null,settings:googleAdsSettingsToMetaUx(t),months:Object.fromEntries(Object.entries(e.months||{}).map(([n,a])=>[n,googleAdsMonthToMetaUiShape(a)]))}}function googleAdsMonthsNeedingBackfill(e){return(e?.monthKeys||[]).filter(n=>!e.months?.[n]?.googleFetchedAt)}async function patchGoogleAdsReportSettings(e,t,{fast:n=!1}={}){const a=`/api/google-ads-reports/clients/${encodeURIComponent(e)}/settings`,o=metaUxPatchToGoogleAds(t),r={method:"PATCH",body:JSON.stringify(o)};return n?adminFetch(a,r):adminFetchWithRetry(a,r,{retries:2,timeoutMs:2e4})}function renderGoogleAdsReportYearSelectOptions(e,{disableUnavailable:t=!1}={}){const n=Number(googleAdsReportsState.selectedYear)||Number(e?.year);return getMetaReportYearOptions(e).map(({year:a,available:o})=>{const r=t&&!o;return`<option value="${a}"${Number(n)===a?" selected":""}${r?" disabled":""}>${a}${o?"":" (no data)"}</option>`}).join("")}function renderGoogleAdsReportClientControlPanel(e){const t=googleAdsPayloadToMetaUiShape(e),n=t.settings||{},a=metaReportsState.clientShareExpanded,o=metaReportsState.clientReportSettingsExpanded,r=!!t.reportUrl,s=a||o,i=googleAdsMonthsNeedingBackfill(e),l=i.length?`${ICON_SYNC} Backfill ${i.length} month${i.length===1?"":"s"} from Google Ads`:`${ICON_SYNC} Re-sync year from Google Ads`;return`
    <div class="meta-report-control-panel${a?" is-editing-share":""}${o?" is-editing-report":""}${n.metaReportEnabled?"":" is-share-disabled"}" id="meta-report-control-panel">
      <div class="meta-report-control-bar">
        <div class="meta-report-control-bar-left meta-report-toolbar-left">
          <label class="meta-report-year-field">Year
            <select id="meta-report-year" class="admin-select">
              ${renderGoogleAdsReportYearSelectOptions(e,{disableUnavailable:!0})}
            </select>
          </label>
          <div class="meta-report-backfill-wrap">
            <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-backfill">${l}</button>
            <span class="meta-report-backfill-progress" id="meta-report-backfill-progress"></span>
          </div>
        </div>
        <div class="meta-report-control-bar-actions meta-report-toolbar-actions">
          <span class="meta-report-save-indicator" id="meta-report-save-indicator"><span class="meta-report-save-indicator-spinner"></span> Saving\u2026</span>
          ${r?`<button type="button" class="admin-btn admin-btn--secondary" id="meta-report-toolbar-copy-link" data-copy-report-url="${esc(t.reportUrl)}"${n.metaReportEnabled?"":" disabled"}>Copy link</button>`:""}
        </div>
      </div>
      ${r?`
        <div class="meta-report-control-status-rows"${s?" hidden":""} id="meta-report-control-status">
          <div class="meta-report-control-status-grid">
            ${renderMetaReportShareSummary(t)}
            ${renderMetaReportBottomlineFeeSummary(n,"meta-report")}
          </div>
        </div>
      `:`
        <p class="meta-report-share-empty">Share link will appear once this client is enabled.</p>
      `}
    </div>
  `}function refreshGoogleAdsReportClientShareUi(e){const t=googleAdsPayloadToMetaUiShape(e);refreshMetaReportClientShareUi(t)}function bindGoogleAdsReportShareEvents(e){const t=googleAdsPayloadToMetaUiShape(e),n=e.clientId;bindMetaReportCopyButtons();const a=document.getElementById("meta-report-rotate-token");a&&(a.onclick=async()=>{if(window.confirm("Rotate the share link? The old link will stop working.")){a.disabled=!0;try{const c=(await patchGoogleAdsReportSettings(n,{rotateAccessToken:!0})).settings||{},d=googleAdsReportsState.clientPayload||e;d.reportUrl=c.reportUrl||d.reportUrl,c&&(d.settings={...d.settings,...c}),googleAdsReportsState.clientPayload=d,refreshGoogleAdsReportClientShareUi(d),showToast("Share link rotated","success")}catch(l){showToast(l.message||"Rotate failed","error")}finally{const l=document.getElementById("meta-report-rotate-token");l&&(l.disabled=!1)}}});const o=document.getElementById("meta-report-share-edit");o&&(o.onclick=()=>openGoogleAdsReportShareModal(e));const r=document.getElementById("meta-report-share-save");r&&(r.onclick=async()=>{const l=document.getElementById("meta-report-share-slug"),c=normalizeMetaReportSlugInput(l?.value);if(!c||c.length<2){showToast("Enter a valid slug (at least 2 characters).","error");return}r.disabled=!0;try{const u=(await patchGoogleAdsReportSettings(n,{metaReportSlug:c})).settings||{},p=googleAdsReportsState.clientPayload||e;p.settings={...p.settings,...u},p.reportUrl=u.reportUrl||null,googleAdsReportsState.clientPayload=p,refreshGoogleAdsReportClientShareUi(p),closeMetaReportModal(),showToast("Share link slug saved","success")}catch(d){showToast(d.message||"Save failed","error")}finally{const d=document.getElementById("meta-report-share-save");d&&(d.disabled=!1)}});const s=document.getElementById("meta-report-share-slug");s&&(s.oninput=()=>{s.value=normalizeMetaReportSlugInput(s.value)});const i=document.querySelector("[data-meta-client-preview]");if(i){let l=0;i.onchange=async()=>{const c=++l,d=i.checked,u=!d,p=googleAdsReportsState.clientPayload||e;applyMetaReportEnabledUi(googleAdsPayloadToMetaUiShape(p),d);const h=i.closest(".meta-hub-switch");h?.classList.add("is-saving");try{const g=await patchGoogleAdsReportSettings(n,{metaReportEnabled:d},{fast:!0});if(c!==l)return;const b=g.settings||{};p.settings={...p.settings,...b},p.reportUrl=b.reportUrl??p.reportUrl,googleAdsReportsState.clientPayload=p,applyMetaReportEnabledUi(googleAdsPayloadToMetaUiShape(p),!!b.googleAdsReportEnabled),showToast(d?"Client preview enabled":"Client preview disabled","success")}catch(g){if(c!==l)return;applyMetaReportEnabledUi(googleAdsPayloadToMetaUiShape(p),u),i.checked=u,showToast(g.message||"Update failed","error")}finally{c===l&&h?.classList.remove("is-saving")}}}bindGoogleAdsReportBottomlineSummaryEvents(e)}function openGoogleAdsReportShareModal(e){metaReportsState.clientShareExpanded=!0,openMetaReportModal(renderMetaReportShareModalContent(googleAdsPayloadToMetaUiShape(e))),bindGoogleAdsReportShareEvents(e)}function openGoogleAdsReportBottomlineModal(e){metaReportsState.clientReportSettingsExpanded=!0,syncMetaReportControlPanelUi();const t=googleAdsPayloadToMetaUiShape(e);openMetaReportModal(renderMetaReportBottomlineModalContent(t)),bindMetaReportBottomlineFeeEvents(e.clientId,"meta-report",async(n,a)=>{try{const r=(await patchGoogleAdsReportSettings(e.clientId,n)).settings||{},s=googleAdsReportsState.clientPayload||e;s.settings={...s.settings,...r},googleAdsReportsState.clientPayload=s,updateMetaReportBottomlineFeeSummary(googleAdsSettingsToMetaUx(s.settings),"meta-report"),bindGoogleAdsReportBottomlineSummaryEvents(s),closeMetaReportModal(),await loadGoogleAdsClientPage({silent:!0}),showToast("Bottomline settings saved","success")}catch(o){typeof a=="function"&&a(),showToast(o.message||"Save failed","error")}})}function bindGoogleAdsReportBottomlineSummaryEvents(e){const t=document.getElementById("meta-report-fee-edit");!t||!e||(t.onclick=()=>openGoogleAdsReportBottomlineModal(e))}function bindGoogleAdsReportBackfillButton(e){const t=document.getElementById("meta-report-backfill");t&&(t.onclick=async()=>{const n=googleAdsReportsState.clientPayload,a=googleAdsMonthsNeedingBackfill(n),o=a.length?a:n?.monthKeys||[];if(!o.length)return;t.disabled=!0;const r=document.getElementById("meta-report-backfill-progress");let s=0,i=0;for(const l of o){s+=1,r&&(r.textContent=`Fetching ${metaMonthLabel(l)} ${l.slice(0,4)}\u2026 (${s}/${o.length})`);try{await adminFetch(`/api/google-ads-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(l)}/refresh`,{method:"POST"})}catch{i+=1}}r&&(r.textContent=""),i?showToast(`Synced ${s-i}/${o.length} months. ${i} failed (check Google Ads access).`,"error"):showToast(`Synced ${o.length} month${o.length===1?"":"s"} from Google Ads`,"success"),await loadGoogleAdsClientPage({silent:!0})})}function renderGoogleAdsReportMonthBody(e,{editable:t=!1,yearPayload:n=null,activeMonthKey:a=null}={}){const o=a||e?.monthKey||null;let r="";t&&e&&!e.meta?.emptyMonth&&o&&(r=`
      <div class="meta-report-edit-panel" id="meta-report-edit-panel">
        <div class="meta-report-edit-panel-head">
          <h3>Edit month inputs \xB7 ${esc(metaMonthLabel(o))}</h3>
        </div>
        <p class="meta-report-edit-note">These fields drive Topline and Bottomline KPI'er. Ad spend comes from Google Ads.</p>
        <div class="meta-report-edit-grid">
          <label>Won leads<input type="number" step="any" id="meta-report-won-leads" value="${esc(e.topline?.wonLeads??"")}" /></label>
          <label>Avg lead value<input type="number" step="any" id="meta-report-avg-lead-value" value="${esc(e.topline?.avgLeadValue??"")}" /></label>
          <label>Avg profit per won<input type="number" step="any" id="meta-report-avg-profit" value="${esc(e.inputs?.avgProfitPerWon??"")}" /></label>
        </div>
        <div class="meta-report-edit-actions">
          <button type="button" class="admin-btn admin-btn--ghost" id="meta-report-refresh-meta">${ICON_SYNC} Refresh from Google Ads</button>
          <button type="button" class="admin-btn admin-btn--primary" id="meta-report-save-month">Save month</button>
        </div>
      </div>
    `);const s=a||e?.monthKey||null,i=t?s?`Report preview \xB7 ${metaMonthLabel(s)}`:"Report preview":s?`Report \xB7 ${metaMonthLabel(s)}`:"Report",l=googleAdsReportsState.reportViewMode||"monthly",c=shouldShowMetaReportYearVisuals(e,n,{editable:t}),d=t&&c,u=e&&!e.meta?.emptyMonth?`
    <div class="meta-report-preview-card">
      <div class="meta-report-preview-card-label">${i}</div>
      ${renderMetaReportHighlightStrip(e)}
    </div>
  `:"",p=renderMetaReportMonthTables(e,{editable:t,adGroupTitle:"Google ads"}),h=c?renderMetaReportChartsPanel({editable:t}):"",g=t&&c?renderMetaReportScenarioCard():"",b=d?renderMetaReportViewModeTabs():"";let y;return c?y=`
      <div class="meta-report-view-panel${!d||l==="monthly"?" is-active":""}" data-report-view-panel="monthly" role="tabpanel"${!d||l==="monthly"?"":" hidden"}>
        <div class="meta-report-content-layout">
          <div class="meta-report-content-main">${p}</div>
          ${h}
        </div>
      </div>
      ${d?`
      <div class="meta-report-view-panel${l==="comparison"?" is-active":""}" data-report-view-panel="comparison" role="tabpanel"${l==="comparison"?"":" hidden"}>
        ${renderMetaReportComparisonView()}
      </div>`:""}
      ${g}
    `:y=`<div class="meta-report-content-main">${p}</div>`,`${r}${u}${b}${y}`}function syncGoogleAdsReportMonthPanelDom(e,t={},n=null){const a=n||googleAdsReportsState.clientPayload,o=googleAdsMonthToMetaUiShape(e),r=a?googleAdsPayloadToMetaUiShape(a):null,s=document.getElementById("meta-report-month-panel");s&&(r&&(hydrateMetaReportSpendChartType(r),hydrateMetaReportScenarioSettings(r)),s.innerHTML=renderGoogleAdsReportMonthBody(o,{...t,yearPayload:r,activeMonthKey:googleAdsReportsState.activeMonthKey||o?.monthKey||null}),requestAnimationFrame(()=>{const i=metaReportsState.reportViewMode;metaReportsState.reportViewMode=googleAdsReportsState.reportViewMode||"monthly",mountMetaReportCharts(r,{editable:!!t.editable,clientId:a?.clientId||null}),metaReportsState.reportViewMode=i}))}function refreshGoogleAdsReportMonthPanel(e){const t=googleAdsReportsState.clientPayload;!t||!googleAdsReportsState.activeMonthKey||(t.months=t.months||{},t.months[googleAdsReportsState.activeMonthKey]=e,syncGoogleAdsReportMonthPanelDom(e,{editable:!0,yearPayload:googleAdsPayloadToMetaUiShape(t)},t),bindGoogleAdsReportMonthEditEvents(t.clientId,t))}function bindGoogleAdsReportMonthEditEvents(e,t){const n=document.getElementById("meta-report-refresh-meta");n&&(n.onclick=async()=>{n.disabled=!0;try{const o=googleAdsReportsState.activeMonthKey,r=await adminFetch(`/api/google-ads-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(o)}/refresh`,{method:"POST"});googleAdsReportsState.clientPayload=r;const s=r.months?.[o];s&&refreshGoogleAdsReportMonthPanel(s),showToast("Google Ads data refreshed","success")}catch(o){showToast(o.message||"Google Ads refresh failed","error")}finally{n.disabled=!1}});const a=document.getElementById("meta-report-save-month");a&&(a.onclick=async()=>{a.disabled=!0;try{const o=googleAdsReportsState.activeMonthKey,r={wonLeads:document.getElementById("meta-report-won-leads")?.value===""?null:Number(document.getElementById("meta-report-won-leads")?.value),avgLeadValue:document.getElementById("meta-report-avg-lead-value")?.value===""?null:Number(document.getElementById("meta-report-avg-lead-value")?.value),avgProfitPerWon:document.getElementById("meta-report-avg-profit")?.value===""?null:Number(document.getElementById("meta-report-avg-profit")?.value)},s=await adminFetch(`/api/google-ads-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(o)}`,{method:"PUT",body:JSON.stringify(r)});googleAdsReportsState.clientPayload=s;const i=s.months?.[o];i&&refreshGoogleAdsReportMonthPanel(i),showToast("Month saved","success")}catch(o){showToast(o.message||"Save failed","error")}finally{a.disabled=!1}})}function switchGoogleAdsReportMonthTab(e){googleAdsReportsState.activeMonthKey=e;const t=googleAdsReportsState.clientPayload;t&&(document.querySelectorAll("[data-google-ads-month-tab]").forEach(n=>{n.classList.toggle("is-active",n.getAttribute("data-google-ads-month-tab")===e)}),syncGoogleAdsReportMonthPanelDom(t.months?.[e],{editable:!0,yearPayload:googleAdsPayloadToMetaUiShape(t)},t),bindGoogleAdsReportMonthEditEvents(t.clientId,t))}function updateGoogleAdsReportsClientContent(e){googleAdsReportsState.clientPayload=e,metaReportsState.chartProjection=null;const t=e.monthKeys||[];googleAdsReportsState.activeMonthKey&&t.includes(googleAdsReportsState.activeMonthKey)||(googleAdsReportsState.activeMonthKey=t[t.length-1]||null),googleAdsReportsState.selectedYear=Number(e.year)||googleAdsReportsState.selectedYear,metaReportsState.selectedYear=googleAdsReportsState.selectedYear;const n=document.getElementById("meta-report-year");n&&(n.innerHTML=renderGoogleAdsReportYearSelectOptions(e,{disableUnavailable:!0})),refreshGoogleAdsReportClientShareUi(e);const a=document.querySelector(".meta-report-tabs");a&&(a.innerHTML=t.map(o=>`
      <button type="button" class="meta-report-tab${o===googleAdsReportsState.activeMonthKey?" is-active":""}" data-google-ads-month-tab="${esc(o)}">${esc(metaMonthLabel(o))}</button>
    `).join(""),document.querySelectorAll("[data-google-ads-month-tab]").forEach(o=>{o.onclick=()=>switchGoogleAdsReportMonthTab(o.getAttribute("data-google-ads-month-tab"))})),syncGoogleAdsReportMonthPanelDom(e.months?.[googleAdsReportsState.activeMonthKey],{editable:!0,yearPayload:googleAdsPayloadToMetaUiShape(e)},e),bindGoogleAdsReportMonthEditEvents(e.clientId,e),bindGoogleAdsReportBackfillButton(e.clientId),bindGoogleAdsReportShareEvents(e),bindGoogleAdsReportBottomlineSummaryEvents(e)}function bindGoogleAdsReportsClientChromeEvents(e){const t=e.clientId,n=document.getElementById("meta-report-year");n&&(n.onchange=async()=>{if(n.selectedOptions?.[0]?.disabled){n.value=String(googleAdsReportsState.selectedYear);return}const o=googleAdsReportsState.selectedYear,r=Number(n.value);if(r!==o){googleAdsReportsState.selectedYear=r,metaReportsState.selectedYear=r,googleAdsReportsState.activeMonthKey=null,metaReportsState.comparisonYearCache={},setMetaReportClientYearLoading(r,!0);try{await loadGoogleAdsClientPage({silent:!0})}catch(s){googleAdsReportsState.selectedYear=o,metaReportsState.selectedYear=o,n&&(n.value=String(o)),await loadGoogleAdsClientPage({silent:!0}),showToast(s.message||"Load failed","error")}finally{setMetaReportClientYearLoading(r,!1)}}}),bindMetaReportCopyButtons(),bindGoogleAdsReportBackfillButton(t),bindGoogleAdsReportBottomlineSummaryEvents(e),bindGoogleAdsReportShareEvents(e)}function bindGoogleAdsReportsClientEvents(e){bindGoogleAdsReportsClientChromeEvents(e),document.querySelectorAll("[data-google-ads-month-tab]").forEach(t=>{t.onclick=()=>switchGoogleAdsReportMonthTab(t.getAttribute("data-google-ads-month-tab"))}),bindGoogleAdsReportMonthEditEvents(e.clientId,e)}const GOOGLE_ADS_HUB_FILTERS=[{value:"all",label:"All"},{value:"enabled",label:"Live"},{value:"needs-setup",label:"Needs setup"}];function filterGoogleAdsClients(e,t,n=""){let a=e||[];t==="enabled"&&(a=a.filter(r=>r.googleAdsReportEnabled)),t==="needs-setup"&&(a=a.filter(r=>r.needsSetup));const o=String(n||"").trim().toLowerCase();return o&&(a=a.filter(r=>[r.accountName,r.googleCustomerId,r.googleCustomerLabel,r.clientId].filter(Boolean).join(" ").toLowerCase().includes(o))),a}function getGoogleAdsHubView(e,t,n=googleAdsReportsState.searchQuery){const a=e?.clients||[];return{clients:filterGoogleAdsClients(a,t,n),allClients:a,summary:e?.summary||{},google:e?.google||{},filter:t,searchQuery:n}}function renderGoogleAdsHubFiltersHtml(e){return GOOGLE_ADS_HUB_FILTERS.map(t=>`
    <button
      type="button"
      class="meta-hub-filter${e===t.value?" is-active":""}"
      data-google-ads-filter="${esc(t.value)}"
    >${esc(t.label)}</button>
  `).join("")}function renderGoogleAdsHubCard(e){const t=!!e.clientId,n=e.clientId||e.googleCustomerId||"",a=e.needsSetup?'<span class="meta-report-badge meta-report-badge--setup">Needs setup</span>':e.googleAdsReportEnabled?'<span class="meta-report-badge meta-report-badge--on">Report live</span>':'<span class="meta-report-badge meta-report-badge--off">Report off</span>',o=t?`<a href="/admin/google-ads/${encodeURIComponent(e.clientId)}" class="meta-hub-card-name">${esc(e.accountName)}</a>`:`<span class="meta-hub-card-name">${esc(e.accountName)}</span>`,r=[];return e.needsSetup?r.push(`<button type="button" class="admin-btn admin-btn--primary" data-google-ads-enable="${esc(e.googleCustomerId)}" data-google-ads-name="${esc(e.accountName)}">Enable</button>`):t&&(r.push(`<a class="admin-btn" href="/admin/google-ads/${encodeURIComponent(e.clientId)}">Edit report</a>`),e.reportUrl&&e.googleAdsReportEnabled&&r.push(`<button type="button" class="admin-btn admin-btn--secondary" data-copy-report-url="${esc(e.reportUrl)}">Copy link</button>`)),`
    <article class="meta-hub-card ${e.needsSetup?"is-setup":""}" data-google-ads-row="${esc(n)}">
      <div class="meta-hub-card-head">
        <span class="meta-hub-avatar" aria-hidden="true">${metaHubClientInitial(e.accountName)}</span>
        <div class="meta-hub-card-title">
          ${o}
          <div class="meta-hub-card-slug">${esc(e.googleCustomerLabel||e.googleCustomerId||"\u2014")}</div>
        </div>
      </div>
      <div class="meta-hub-card-meta">
        ${a}
        <span class="meta-hub-card-meta-dot" aria-hidden="true">\xB7</span>
        <span>Google Ads</span>
      </div>
      <div class="meta-hub-card-actions${r.length===1?" meta-hub-card-actions--single":""}">
        ${r.join("")}
      </div>
    </article>
  `}function renderGoogleAdsHubPage(e){const t=e.clients||[],n=e.google||{},a=n.partnerFetchError?`<div class="admin-banner admin-banner--warn">${esc(n.partnerFetchError)}</div>`:"";return`
    ${renderBrandTopbar(renderStaffAdminChrome("google-ads"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero meta-premium-page-hero">
      <div class="meta-premium-page-hero-inner">
        <div class="admin-breadcrumb">
          <a href="/admin">Clients</a>
          <span aria-hidden="true"> / </span>
          <span>Google Ads</span>
        </div>
        <h1>Google Ads reports</h1>
      </div>
    </div>
    <div class="admin-hub meta-reports-page">
      <div class="meta-hub-layout">
        <div id="google-ads-banner">${a}</div>
        <div class="hub-toolbar-row">
          <div class="hub-search">
            ${ICON_SEARCH}
            <input type="search" id="google-ads-search" placeholder="Search accounts\u2026" value="${esc(e.searchQuery||"")}" autocomplete="off" />
          </div>
          <span class="hub-count" id="google-ads-count">${t.length} account${t.length===1?"":"s"}</span>
          <div class="hub-toolbar-actions">
            <div class="meta-hub-filters" id="google-ads-filters" role="tablist" aria-label="Filter accounts">
              ${renderGoogleAdsHubFiltersHtml(e.filter)}
            </div>
            <button class="admin-btn admin-btn--secondary" type="button" id="google-ads-refresh">${ICON_SYNC} Refresh</button>
          </div>
        </div>
        <div class="meta-hub-cards" id="google-ads-cards">
          ${t.length?t.map(renderGoogleAdsHubCard).join(""):'<div class="sync-history-empty" style="padding:24px">No Google Ads accounts found.</div>'}
        </div>
      </div>
    </div>
    `)}
  `}function updateGoogleAdsHubDom(e){const t=document.getElementById("google-ads-banner"),n=document.getElementById("google-ads-cards"),a=document.getElementById("google-ads-count"),o=e.google||{};if(t&&(t.innerHTML=o.partnerFetchError?`<div class="admin-banner admin-banner--warn">${esc(o.partnerFetchError)}</div>`:""),a){const r=(e.clients||[]).length;a.textContent=`${r} account${r===1?"":"s"}`}n&&(n.innerHTML=(e.clients||[]).length?e.clients.map(renderGoogleAdsHubCard).join(""):'<div class="sync-history-empty" style="padding:24px">No Google Ads accounts found.</div>'),bindGoogleAdsHubRowEvents(),bindMetaReportCopyButtons(document.getElementById("google-ads-cards"))}function bindGoogleAdsHubRowEvents(){document.querySelectorAll("[data-google-ads-enable]").forEach(e=>{e.onclick=async()=>{const t=e.getAttribute("data-google-ads-enable"),n=e.getAttribute("data-google-ads-name")||t;e.disabled=!0;try{const a=await adminFetch("/api/google-ads-reports/provision",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({googleCustomerId:t,accountName:n})});if(showToast(`Enabled ${n}`,"success"),a?.clientId){window.location.href=`/admin/google-ads/${encodeURIComponent(a.clientId)}`;return}await loadGoogleAdsHubPage()}catch(a){showToast(a.message||"Enable failed","error"),e.disabled=!1}}})}function bindGoogleAdsHubEvents(){const e=document.getElementById("google-ads-search");e&&(e.oninput=()=>{googleAdsReportsState.searchQuery=e.value,updateGoogleAdsHubDom(getGoogleAdsHubView(googleAdsReportsState.dashboardData,googleAdsReportsState.filter,googleAdsReportsState.searchQuery))}),document.querySelectorAll("[data-google-ads-filter]").forEach(n=>{n.onclick=()=>{googleAdsReportsState.filter=n.getAttribute("data-google-ads-filter")||"all",document.querySelectorAll("[data-google-ads-filter]").forEach(a=>{a.classList.toggle("is-active",a===n)}),updateGoogleAdsHubDom(getGoogleAdsHubView(googleAdsReportsState.dashboardData,googleAdsReportsState.filter,googleAdsReportsState.searchQuery))}});const t=document.getElementById("google-ads-refresh");t&&(t.onclick=()=>loadGoogleAdsHubPage()),bindGoogleAdsHubRowEvents()}async function loadGoogleAdsHubPage(){const e=document.getElementById("dashboard");if(!e)return;const t=await fetchStaffMe();if(!t){e.innerHTML=`
      ${renderBrandTopbar("")}
      ${wrapDashboardShell('<div class="sync-history-empty" style="padding:24px;text-align:center"><a class="admin-btn admin-btn--primary" href="/login?next='+encodeURIComponent(window.location.pathname)+'">Sign in</a></div>')}
    `;return}currentStaffUser=t,googleAdsReportsState.hubMounted||(e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("google-ads"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading Google Ads reports...</p></div>')}
    `);try{const n=await adminFetch("/api/google-ads-reports?filter=all");googleAdsReportsState.dashboardData=n;const a=getGoogleAdsHubView(n,googleAdsReportsState.filter,googleAdsReportsState.searchQuery);googleAdsReportsState.hubMounted?updateGoogleAdsHubDom(a):(e.innerHTML=renderGoogleAdsHubPage(a),googleAdsReportsState.hubMounted=!0,bindGoogleAdsHubEvents())}catch(n){e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("google-ads"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(n.message)}</div>`)}
    `}}function renderGoogleAdsClientPage(e){const t=e.monthKeys||[],n=googleAdsReportsState.activeMonthKey||t[t.length-1]||"",a=googleAdsMonthToMetaUiShape(e.months?.[n]||null),o=t.map(r=>`
    <button type="button" class="meta-report-tab${r===n?" is-active":""}" data-google-ads-month-tab="${esc(r)}">${esc(metaMonthLabel(r))}</button>
  `).join("");return`
    ${renderBrandTopbar(renderStaffAdminChrome("google-ads"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero meta-premium-page-hero">
      <div class="meta-premium-page-hero-inner">
        <div class="admin-breadcrumb">
          <a href="/admin">Clients</a>
          <span aria-hidden="true"> / </span>
          <a href="/admin/google-ads">Google Ads</a>
          <span aria-hidden="true"> / </span>
          <span>${esc(e.accountName)}</span>
        </div>
        <h1>${esc(e.accountName)}</h1>
        <p class="meta-report-public-subtitle">${esc(e.settings?.googleCustomerLabel||e.settings?.googleCustomerId||"")}</p>
      </div>
    </div>
    <div class="sync-history-page meta-reports-page meta-report-client-page">
      ${renderGoogleAdsReportClientControlPanel(e)}
      <div class="meta-report-tabs" role="tablist">${o}</div>
      <div class="meta-report-month-panel" id="meta-report-month-panel">
        ${renderGoogleAdsReportMonthBody(a,{editable:!0,yearPayload:googleAdsPayloadToMetaUiShape(e),activeMonthKey:n})}
      </div>
    </div>
    `)}
  `}async function loadGoogleAdsClientPage({silent:e=!1}={}){const t=document.getElementById("dashboard");if(!t)return;const n=await fetchStaffMe();if(!n){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}currentStaffUser=n;const a=CLIENT_SLUG;if(!googleAdsReportsState.clientPageMounted)t.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("google-ads"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading Google Ads report...</p></div>')}
    `;else if(!e){const o=document.getElementById("meta-report-month-panel");o&&o.classList.add("is-loading")}try{const o=await adminFetch(`/api/google-ads-reports/clients/${encodeURIComponent(a)}?year=${encodeURIComponent(googleAdsReportsState.selectedYear)}`);googleAdsReportsState.selectedYear=Number(o.year)||googleAdsReportsState.selectedYear,metaReportsState.selectedYear=googleAdsReportsState.selectedYear,(!googleAdsReportsState.activeMonthKey||!(o.monthKeys||[]).includes(googleAdsReportsState.activeMonthKey))&&(googleAdsReportsState.activeMonthKey=o.monthKeys?.[o.monthKeys.length-1]||null),googleAdsReportsState.clientPageMounted?updateGoogleAdsReportsClientContent(o):(googleAdsReportsState.clientPayload=o,metaReportsState.clientShareExpanded=!1,metaReportsState.clientReportSettingsExpanded=!1,t.innerHTML=renderGoogleAdsClientPage(o),googleAdsReportsState.clientPageMounted=!0,bindGoogleAdsReportsClientEvents(o),requestAnimationFrame(()=>{mountMetaReportCharts(googleAdsPayloadToMetaUiShape(o),{editable:!0,clientId:a})}))}catch(o){googleAdsReportsState.clientPageMounted?e||showToast(o.message||"Load failed","error"):t.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("google-ads"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(o.message)}</div>`)}
      `}finally{const o=document.getElementById("meta-report-month-panel");o&&o.classList.remove("is-loading")}}async function loadPublicMetaReportPage({silent:e=!1}={}){const t=document.getElementById("dashboard");if(!(!t||!REPORT_TOKEN)){if(metaReportsState.reportViewMode="monthly",!metaReportsState.publicPageMounted)t.innerHTML=wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading report...</p></div>');else if(!e){const n=document.getElementById("meta-report-month-panel");n&&n.classList.add("is-loading")}try{const n=await fetch(`/api/meta-reports/public/${encodeURIComponent(REPORT_TOKEN)}?year=${encodeURIComponent(metaReportsState.selectedYear)}`).then(async o=>{const r=await o.json();if(!o.ok)throw new Error(r.error||"Report not found");return r});if(syncMetaReportSelectedYear(n,{disableUnavailable:!0}),Number(metaReportsState.selectedYear)!==Number(n.year))return loadPublicMetaReportPage({silent:!0});metaReportsState.activeMonthKey||(metaReportsState.activeMonthKey=n.monthKeys?.[n.monthKeys.length-1]||null),await ensureMetaReportScenarioSource(n,{editable:!1});const a=n.reportKind==="google-ads"?googleAdsPayloadToMetaUiShape(n):n;metaReportsState.publicPageMounted?updatePublicMetaReportContent(n):(metaReportsState.publicPayload=n,hydrateMetaReportSpendChartType(a),hydrateMetaReportScenarioSettings(a),t.innerHTML=renderPublicMetaReportPage(n),metaReportsState.publicPageMounted=!0,syncMetaReportPublicBranding(n),bindPublicMetaReportEvents(n),mountMetaReportCharts(a,{editable:!1}))}catch(n){if(!metaReportsState.publicPageMounted)t.innerHTML=wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(n.message||"Report not found")}</div>`);else{if(e)throw n;showToast(n.message||"Load failed","error")}}finally{const n=document.getElementById("meta-report-month-panel");n&&n.classList.remove("is-loading")}}}function metaCvShortMonth(e){const t=Number(String(e||"").slice(5,7));return["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][t-1]||e}function metaCvFormatUpdatedAt(e){if(!e)return"Not updated yet";const t=new Date(e);return Number.isNaN(t.getTime())?"Not updated yet":t.toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}function getMetaCvFilteredClients(e=metaReportsState.customValues.overview){const t=e?.clients||[],n=String(metaReportsState.customValues.searchQuery||"").trim().toLowerCase();return n?t.filter(a=>[a.accountName,a.clientId,a.metaAdAccountId].filter(Boolean).join(" ").toLowerCase().includes(n)):t}function renderMetaCvMonthPills(e,t=[]){const n=metaReportsState.customValues.selectedClientId,a=metaReportsState.customValues.selectedMonthKey;return t.map(o=>{const s=(e.months?.[o]||{}).status||"empty",i=n===e.clientId&&a===o;return`
      <button
        type="button"
        class="meta-cv-month-pill is-${esc(s)}${i?" is-active":""}"
        data-meta-cv-client="${esc(e.clientId)}"
        data-meta-cv-month="${esc(o)}"
        title="${esc(metaCvShortMonth(o))} \xB7 ${esc(s)}"
      >${esc(metaCvShortMonth(o))}</button>
    `}).join("")}function isMetaReportGhlListClient(e={}){return!!e.metaReportGhlDataEnabled}function resolveMetaToplineSource(e,t={}){const n=e?.dataSource||e?.toplineSource||"meta";return isMetaReportGhlListClient(t)&&resolveClientToplineMode(t)==="meta"&&(n==="manual"||n==="ghl")?"meta":n}function resolveMetaCvMonthToplineSource(e,t,n={}){return resolveMetaToplineSource({...e||{},dataSource:t?.toplineSource??e?.dataSource},n)}function classifyMetaReportMonthInputStatus(e,t=!1){if(!e)return"empty";const n=e.topline?.wonLeads!=null||e.inputs?.wonLeads!=null,a=e.topline?.avgLeadValue!=null||e.inputs?.avgLeadValue!=null,o=e.inputs?.avgProfitPerWon!=null;return n&&a&&(!t||o)?"complete":n||a||o?"partial":"empty"}function resolveClientToplineMode(e={}){return e.metaReportToplineMode==="cenhub"?"cenhub":"meta"}function resolveMetaReportHubTypeLabel(e={}){return e.metaReportGhlDataEnabled&&resolveClientToplineMode(e)==="cenhub"?"Cenhub":"Meta"}function clientUsesCenhubMetaReportTopline(e={}){return!!e.metaReportGhlDataEnabled&&resolveClientToplineMode(e)==="cenhub"}function metaMonthAllowsManualControls(e,t={}){if(!isMetaReportGhlListClient(t)||resolveClientToplineMode(t)!=="cenhub")return!1;const n=resolveMetaToplineSource(e,t);return n==="ghl"||n==="manual"}function metaToplineSourceNote(e){return e==="cenhub"?"Using Cenhub for all months":"Using Meta for all months"}function metaToplineConfirmWord(e){return e==="cenhub"?"Cenhub":"Meta"}function renderMetaToplineSourcePillHtml(e,t){return`<span class="meta-topline-source-pill is-${t}"><span class="meta-topline-source-pill-dot" aria-hidden="true"></span><span class="meta-topline-source-pill-text">${esc(e)}</span></span>`}function renderMetaMonthSourcePill(e,t={}){if(!isMetaReportGhlListClient(t))return"";const n=resolveMetaToplineSource(e,t),a=resolveClientToplineMode(t);return a==="cenhub"&&n==="manual"?renderMetaToplineSourcePillHtml("Manual this month","manual"):a==="meta"||n==="meta"?renderMetaToplineSourcePillHtml("Meta","meta"):n==="ghl"?renderMetaToplineSourcePillHtml("Cenhub","cenhub"):renderMetaToplineSourcePillHtml("No Cenhub data","cenhub-empty")}function renderMetaReportToplineSourceControl(e){const t=e?.settings||{};if(!isMetaReportGhlListClient(t))return"";const n=resolveClientToplineMode(t),a=metaReportsState.clientToplineSaving,o=a?" disabled":"",r=t.hasGhl!==!1;return`
    <div class="meta-report-topline-source-wrap meta-topline-source-panel${a?" is-loading":""}" id="meta-report-topline-source-panel">
      <div class="meta-report-topline-summary">
        <div class="meta-report-topline-summary-content">
          <div class="meta-report-topline-summary-row">
            <span class="meta-report-topline-summary-label">Data source</span>
            <span class="meta-report-topline-summary-value ${n==="cenhub"?"is-cenhub":"is-meta"}">${esc(n==="cenhub"?"Cenhub":"Meta")}</span>
          </div>
          <div class="meta-report-topline-summary-row">
            <span class="meta-report-topline-summary-label">Scope</span>
            <span class="meta-report-topline-summary-value">All months \xB7 ${esc(metaReportsState.selectedYear)}</span>
          </div>
        </div>
        <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-topline-change"${o}>Edit</button>
      </div>
      <div class="meta-topline-source-loading" id="meta-report-topline-loading"${a?"":" hidden"}>
        <span class="meta-report-save-indicator-spinner"></span> Switching source\u2026
      </div>
    </div>
  `}function renderMetaReportToplineChangeModal(e,t){const n=e?.settings||{},a=resolveClientToplineMode(n),o=n.hasGhl!==!1;return`
    <div class="meta-report-modal-head">
      <h2 class="meta-report-modal-title">Change data source</h2>
      <button type="button" class="meta-report-modal-close" aria-label="Close">&times;</button>
    </div>
    <p class="metrics-model-copy">Choose where won leads, average lead value, and profit come from for every month in ${esc(metaReportsState.selectedYear)}.</p>
    <div class="metrics-option-cards">
      <label class="metrics-option-card">
        <input type="radio" name="meta-topline-draft-mode" value="meta"${t==="meta"?" checked":""} />
        <span class="metrics-option-card-top">
          <span class="metrics-option-card-icon">${ICON_TARGET}</span>
          <span class="metrics-option-card-title">Meta</span>
          <span class="metrics-option-card-radio">${ICON_CHECK}</span>
        </span>
        <span class="metrics-option-card-desc">Use Meta-derived topline KPIs. Ad spend always comes from Meta.</span>
      </label>
      <label class="metrics-option-card">
        <input type="radio" name="meta-topline-draft-mode" value="cenhub"${t==="cenhub"?" checked":""} />
        <span class="metrics-option-card-top">
          <span class="metrics-option-card-icon">${ICON_TAG}</span>
          <span class="metrics-option-card-title">Cenhub</span>
          <span class="metrics-option-card-radio">${ICON_CHECK}</span>
        </span>
        <span class="metrics-option-card-desc">Pull leads, won deals, revenue, and profit from Cenhub dashboard snapshots.</span>
      </label>
    </div>
    ${a==="cenhub"?`
      <div class="meta-report-topline-sync-strip">
        <div class="meta-report-topline-sync-strip-copy">
          <span class="meta-report-topline-sync-strip-title">Sync from Cenhub</span>
          <span class="meta-report-topline-sync-strip-desc">Re-pull all months in ${esc(metaReportsState.selectedYear)} from Cenhub snapshots.</span>
        </div>
        <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-topline-modal-sync-ghl-year"${o?"":' disabled title="Cenhub not connected"'}>Sync year from Cenhub</button>
      </div>
    `:""}
    <p class="meta-report-edit-note" id="meta-report-topline-no-change-hint"${t!==a?" hidden":""}>Select a different source above to switch.</p>
    <div class="metrics-confirm-strip" id="meta-report-topline-confirm-strip"${t===a?" hidden":""}>
      <div class="metrics-confirm-strip-title">${ICON_WARNING} Topline KPIs will change for all months in ${esc(metaReportsState.selectedYear)}</div>
      <div class="metrics-confirm-strip-row">
        <label class="metrics-confirm-check">
          <input id="meta-report-topline-ack" type="checkbox" />
          <span>I understand the numbers will change</span>
        </label>
        <input id="meta-report-topline-confirm" type="text" placeholder="Type ${esc(metaToplineConfirmWord(t))} to confirm" autocomplete="off" />
      </div>
    </div>
    <div class="metrics-model-actions">
      <button type="button" class="admin-btn" data-meta-report-modal-close>Cancel</button>
      <button type="button" class="admin-btn admin-btn--danger-solid" id="meta-report-topline-apply" disabled>${ICON_CHECK} Apply change</button>
    </div>
    <div class="meta-topline-source-loading" id="meta-report-topline-modal-loading" hidden>
      <span class="meta-report-save-indicator-spinner"></span> Switching source\u2026
    </div>
  `}function openMetaReportToplineChangeModal(e){const t=resolveClientToplineMode(e?.settings||{});metaReportsState.clientToplineModalPayload=e,openMetaReportModal(renderMetaReportToplineChangeModal(e,t),{wizard:!0,wide:!0}),bindMetaReportToplineChangeModal(e),updateMetaReportToplineApplyState()}function openMetaCvToplineChangeModal(e){const t={clientId:e.clientId,settings:{metaReportToplineMode:e.metaReportToplineMode,hasGhl:e.hasGhl!==!1},reload:async()=>{await refreshMetaCvOverviewSilently(),refreshMetaCvListAndEditor()}};metaReportsState.clientToplineModalPayload=t,openMetaReportModal(renderMetaReportToplineChangeModal(t,resolveClientToplineMode(t.settings)),{wizard:!0,wide:!0}),bindMetaReportToplineChangeModal(t),updateMetaReportToplineApplyState()}function getMetaReportToplineDraftMode(){return document.querySelector('input[name="meta-topline-draft-mode"]:checked')?.value==="cenhub"?"cenhub":"meta"}function updateMetaReportToplineApplyState(){const e=metaReportsState.clientToplineModalPayload||metaReportsState.clientPayload;if(!e)return;const t=resolveClientToplineMode(e.settings||{}),n=getMetaReportToplineDraftMode(),a=n!==t,o=document.getElementById("meta-report-topline-confirm-strip"),r=document.getElementById("meta-report-topline-no-change-hint");o&&(o.hidden=!a),r&&(r.hidden=a);const s=document.getElementById("meta-report-topline-confirm");s&&(s.placeholder=`Type ${metaToplineConfirmWord(n)} to confirm`,a||(s.value=""));const i=document.getElementById("meta-report-topline-ack");i&&!a&&(i.checked=!1);const l=document.getElementById("meta-report-topline-apply");if(!l)return;if(!a){l.disabled=!0;return}const c=!!i?.checked,d=s?.value?.trim()||"";l.disabled=!(c&&d===metaToplineConfirmWord(n))}async function applyMetaReportToplineSwitch(e,t,n){let a={mode:n,year:metaReportsState.selectedYear};if(n==="cenhub"){const o=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/sync-ghl-preview?year=${encodeURIComponent(metaReportsState.selectedYear)}`);if((o.skipManual||[]).length){const r=window.prompt(`${o.skipManual.length} month(s) have manual values (${o.skipManual.join(", ")}).
Type "skip" to skip manual months, or "overwrite" to replace all:`,"skip");if(!r)return!1;r.trim().toLowerCase()==="overwrite"&&(a={...a,skipManual:!1,overwriteManual:!0})}}return await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/switch-topline-source`,{method:"POST",body:JSON.stringify(a)}),showToast(n==="cenhub"?"Switched all months to Cenhub":"Switched all months to Meta","success"),typeof t.reload=="function"?await t.reload():await loadMetaReportsClientPage({silent:!0}),!0}function bindMetaReportToplineChangeModal(e){const t=e.clientId;if(document.querySelectorAll('input[name="meta-topline-draft-mode"]').forEach(a=>{a.addEventListener("change",updateMetaReportToplineApplyState)}),document.getElementById("meta-report-topline-ack")?.addEventListener("change",updateMetaReportToplineApplyState),document.getElementById("meta-report-topline-confirm")?.addEventListener("input",updateMetaReportToplineApplyState),resolveClientToplineMode(e.settings||{})==="cenhub"){const a=typeof e.reload=="function";bindMetaToplineCenhubActionEvents({clientId:t,prefix:"meta-report-topline-modal",getMonthKey:()=>metaReportsState.activeMonthKey,getYear:()=>metaReportsState.selectedYear,setSaving:o=>{const r=document.getElementById("meta-report-topline-modal-loading");r&&(r.hidden=!o);const s=document.getElementById("meta-report-topline-modal-sync-ghl-year");s&&(s.disabled=o||e.settings?.hasGhl===!1)},onReload:async()=>{a?await e.reload():await loadMetaReportsClientPage({silent:!0}),closeMetaReportModal()}})}const n=document.getElementById("meta-report-topline-apply");n&&(n.onclick=async()=>{const a=getMetaReportToplineDraftMode(),o=resolveClientToplineMode(e.settings||{});if(a===o)return;n.disabled=!0,document.getElementById("meta-report-topline-modal-loading")?.removeAttribute("hidden");const r=typeof e.reload=="function";r?setMetaCvSavePending(!0):(metaReportsState.clientToplineSaving=!0,syncMetaReportToplineSourceBar(metaReportsState.clientPayload||e));try{await applyMetaReportToplineSwitch(t,e,a)&&closeMetaReportModal()}catch(s){showToast(s.message||"Could not switch data source","error")}finally{r?setMetaCvSavePending(!1):(metaReportsState.clientToplineSaving=!1,syncMetaReportToplineSourceBar(metaReportsState.clientPayload)),document.getElementById("meta-report-topline-modal-loading")?.setAttribute("hidden","")}})}function renderMetaReportMonthManualRow(e,t={},{prefix:n="meta-report"}={}){if(!metaMonthAllowsManualControls(e,t))return"";const o=resolveMetaToplineSource(e,t)==="manual",r=monthHasCenhubSnapshot(e,t)?"Switch back to Cenhub":"Switch back to Meta";return o?`
    <div class="meta-report-month-manual-row">
      <div class="meta-report-month-manual-row-copy">
        <p class="meta-report-month-manual-row-title">Manual override active</p>
        <p class="meta-report-month-manual-row-desc">You are editing custom values for this month instead of Cenhub data.</p>
      </div>
      <div class="meta-report-month-manual-row-actions">
        ${renderMetaToplineSourcePillHtml("Manual this month","manual")}
        <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="${n}-restore-month-source">${esc(r)}</button>
      </div>
    </div>
  `:`
      <div class="meta-report-month-manual-row">
        <div class="meta-report-month-manual-row-copy">
          <p class="meta-report-month-manual-row-title">Month data source</p>
          <p class="meta-report-month-manual-row-desc">This month uses Cenhub values (leads, won leads, average lead value, and profit). Switch to manual if you need to override them.</p>
        </div>
        <div class="meta-report-month-manual-row-actions">
          <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="${n}-use-manual-month">Use manual values</button>
        </div>
      </div>
    `}function renderMetaCvToplineSourceControl(e,t){if(!e?.metaReportGhlDataEnabled)return"";const n=e.metaReportToplineMode==="cenhub"?"cenhub":"meta",a=metaReportsState.customValues.saving,o=a?" disabled":"",r=e.hasGhl!==!1;return`
    <div class="meta-report-topline-source-wrap meta-topline-source-panel${a?" is-loading":""}" id="meta-cv-topline-source-panel">
      <div class="meta-report-topline-summary">
        <div class="meta-report-topline-summary-content">
          <div class="meta-report-topline-summary-row">
            <span class="meta-report-topline-summary-label">Data source</span>
            <span class="meta-report-topline-summary-value ${n==="cenhub"?"is-cenhub":"is-meta"}">${esc(n==="cenhub"?"Cenhub":"Meta")}</span>
          </div>
          <div class="meta-report-topline-summary-row">
            <span class="meta-report-topline-summary-label">Scope</span>
            <span class="meta-report-topline-summary-value">All months \xB7 ${esc(metaReportsState.selectedYear)}</span>
          </div>
        </div>
        <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-cv-topline-change"${o}>Edit</button>
      </div>
      <div class="meta-topline-source-loading" id="meta-cv-topline-loading"${a?"":" hidden"}>
        <span class="meta-report-save-indicator-spinner"></span> Switching source\u2026
      </div>
    </div>
  `}function renderMetaCvMonthManualRow(e,t){if(!t?.metaReportGhlDataEnabled)return"";const n={metaReportGhlDataEnabled:t.metaReportGhlDataEnabled,metaReportToplineMode:t.metaReportToplineMode};return renderMetaReportMonthManualRow(e||{dataSource:e?.toplineSource||"meta"},n,{prefix:"meta-cv"})}function bindMetaToplineCenhubActionEvents({clientId:e,prefix:t,getMonthKey:n,getYear:a,setSaving:o,onReload:r,onMonthUpdated:s}){if(!e||!t)return;const i=document.getElementById(`${t}-sync-ghl-year`);i&&(i.onclick=async()=>{o&&o(!0);try{const c=a?.()||metaReportsState.selectedYear,d=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/sync-ghl-preview?year=${encodeURIComponent(c)}`);let u=!0,p=!1;if((d.skipManual||[]).length){const g=window.prompt(`${d.skipManual.length} month(s) have manual values (${d.skipManual.join(", ")}).
Type "skip" to skip manual months, or "overwrite" to replace all:`,"skip");if(!g)return;g.trim().toLowerCase()==="overwrite"&&(u=!1,p=!0)}const h=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/sync-ghl-year?year=${encodeURIComponent(c)}`,{method:"POST",body:JSON.stringify({skipManual:u,overwriteManual:p})});r?await r():s&&await s(h,null,{yearSync:!0}),showToast(`Synced ${h.synced?.length||0} month(s)${h.skipped?.length?`, skipped ${h.skipped.length}`:""}`,"success")}catch(c){showToast(c.message||"Year sync failed","error")}finally{o&&o(!1)}});const l=document.getElementById(`${t}-refresh-snapshot`);l&&(l.onclick=async()=>{const c=n?.();if(c){o&&o(!0);try{const d=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(c)}/refresh-snapshot`,{method:"POST",body:"{}"});s&&await s(d,c),showToast("Cenhub data refreshed and synced","success")}catch(d){showToast(d.message||"Refresh failed","error")}finally{o&&o(!1)}}})}function monthHasCenhubSnapshot(e,t={}){return e?resolveMetaToplineSource(e,t)==="ghl"?!0:!!e.ghlSyncedAt:!1}function renderMetaCvClientRows(e){const t=getMetaCvFilteredClients(e),n=e.monthKeys||[];return t.length?t.map(a=>`
      <article class="meta-cv-client${metaReportsState.customValues.selectedClientId===a.clientId?" is-selected":""}" data-meta-cv-client-card="${esc(a.clientId)}">
        <div class="meta-cv-client-head">
          <div>
            <h3>${esc(a.accountName)}</h3>
            <div class="meta-cv-client-meta">
              ${a.metaReportEnabled?"Live report":"Report off"}
              \xB7 Last update ${esc(metaCvFormatUpdatedAt(a.lastUpdatedAt))}
            </div>
          </div>
          <div class="meta-cv-client-stats">
            ${a.completeCount}/${n.length} done
            ${a.emptyCount?`<br>${a.emptyCount} remaining`:""}
          </div>
        </div>
        <div class="meta-cv-month-pills">${renderMetaCvMonthPills(a,n)}</div>
      </article>
    `).join(""):'<div class="meta-report-empty" style="padding:32px 12px">No matching clients.</div>'}function monthStatusIsEmpty(e,t={}){return e?(e.status??classifyMetaCvMonthStatus({wonLeads:e.inputs?.wonLeads??e.topline?.wonLeads??e.wonLeads,avgLeadValue:e.inputs?.avgLeadValue??e.topline?.avgLeadValue??e.avgLeadValue,avgProfitPerWon:e.inputs?.avgProfitPerWon??e.avgProfitPerWon},!!t.metaReportShowBottomline))==="empty":!0}function metaReportEffectiveFeeEnabled(e,t=null){if(!t)return!!e?.metaReportFeeEnabled;const n=!!e?.metaReportShowBottomline;return(t.status??classifyMetaCvMonthStatus({wonLeads:t.inputs?.wonLeads??t.topline?.wonLeads??t.wonLeads,avgLeadValue:t.inputs?.avgLeadValue??t.topline?.avgLeadValue??t.avgLeadValue,avgProfitPerWon:t.inputs?.avgProfitPerWon??t.avgProfitPerWon},n))==="empty"?!1:!!e?.metaReportFeeEnabled}function resolveMetaReportFeeMode(e={}){return e.metaReportFeeEnabled?resolveMetaReportStoredFeeMode(e):""}const META_REPORT_FEE_MODE_META=[{value:"",icon:"\u2013",title:"None",desc:"No Censio fee"},{value:"performance",icon:"%",title:"Performance fee",desc:"% of profit (POAS)"},{value:"marketing",icon:"Dkr",title:"Marketing fee",desc:"Fixed Dkr amount"}];function metaReportFeeValueBlockHtml(e,t,n,a,{inline:o=!1}={}){return o&&t==="performance"?`
      <label class="meta-cv-fee-inline-field">
        <span class="meta-cv-fee-inline-label">Performance fee</span>
        <span class="meta-report-fee-value-input-wrap meta-cv-fee-inline-input">
          <input type="number" step="any" min="0" max="100" id="${e}-setting-fee-percent" value="${esc(n)}" />
          <span class="meta-report-fee-value-input-suffix">%</span>
        </span>
      </label>`:o&&t==="marketing"?`
      <label class="meta-cv-fee-inline-field">
        <span class="meta-cv-fee-inline-label">Marketing fee</span>
        <span class="meta-report-fee-value-input-wrap meta-cv-fee-inline-input">
          <input type="number" step="any" min="0" id="${e}-setting-marketing-fee" value="${esc(a)}" />
          <span class="meta-report-fee-value-input-suffix">Dkr</span>
        </span>
      </label>`:o?'<span class="meta-cv-fee-inline-hint">No fee amount \u2014 save to apply.</span>':t==="performance"?`
      <label class="meta-report-fee-value-field">
        <span class="meta-report-fee-value-label">Performance fee percentage</span>
        <span class="meta-report-fee-value-input-wrap">
          <input type="number" step="any" min="0" max="100" id="${e}-setting-fee-percent" value="${esc(n)}" />
          <span class="meta-report-fee-value-input-suffix">%</span>
        </span>
      </label>`:t==="marketing"?`
      <label class="meta-report-fee-value-field">
        <span class="meta-report-fee-value-label">Marketing fee amount</span>
        <span class="meta-report-fee-value-input-wrap">
          <input type="number" step="any" min="0" id="${e}-setting-marketing-fee" value="${esc(a)}" />
          <span class="meta-report-fee-value-input-suffix">Dkr</span>
        </span>
      </label>`:'<p class="meta-report-fee-value-empty">No amount needed \u2014 just save your selection.</p>'}function metaReportUsesInlineFeeValue(e){return e==="meta-cv"}function describeMetaReportFeeModeLabel(e,t,n,{feeEnabled:a=!0}={}){if(!a||e===""||e==null)return"No Censio fee";if(e==="performance"){const o=Number(t);return`Performance fee \xB7 ${Number.isFinite(o)?o:20}%`}if(e==="marketing"){const o=Number(n);return`Marketing fee \xB7 Dkr ${Number.isFinite(o)?o:0}`}return"No Censio fee"}function readMetaReportFeeDraftState(e){const t=document.getElementById(`${e}-fee-nested`);if(!t)return null;const n=t.querySelector(`input[name="${e}-fee-mode"]:checked`),a=n?n.value||"":t.dataset.feeMode||"";let o=Number(t.dataset.feePercent),r=Number(t.dataset.marketingFee);if(a==="performance"){const u=document.getElementById(`${e}-setting-fee-percent`),p=Number(u?.value);Number.isFinite(p)&&(o=p)}else if(a==="marketing"){const u=document.getElementById(`${e}-setting-marketing-fee`),p=Number(u?.value);Number.isFinite(p)&&(r=p)}const s=t.dataset.feeEnabled==="true"?resolveMetaReportStoredFeeMode({metaReportFeeEnabled:!0,metaReportFeeMode:t.dataset.feeMode||null,metaReportMarketingFeeAmount:t.dataset.marketingFee}):"",i=Number(t.dataset.feePercent),l=Number(t.dataset.marketingFee);return{appliedMode:s,appliedPercent:i,appliedMarketing:l,selectedMode:a,selectedPercent:o,selectedMarketing:r,isDirty:a!==s||(a==="performance"?o!==i:a==="marketing"?r!==l:!1),appliedLabel:describeMetaReportFeeModeLabel(s,i,l),selectedLabel:describeMetaReportFeeModeLabel(a,o,r)}}function metaReportFeeStatusHtml(e){return e.isDirty?`
        <span class="meta-report-fee-status-value is-active">${esc(e.appliedLabel)}</span>
        <span class="meta-report-fee-status-arrow" aria-hidden="true">\u2192</span>
        <span class="meta-report-fee-status-pending">${esc(e.selectedLabel)}</span>`:`<span class="meta-report-fee-status-value is-active">${esc(e.appliedLabel)}</span>`}function syncMetaReportFeeSelectionState(e){const t=document.getElementById(`${e}-fee-nested`),n=readMetaReportFeeDraftState(e);if(!t||!n)return;const a=document.getElementById(`${e}-fee-status`);a&&(a.innerHTML=metaReportFeeStatusHtml(n));const o=document.getElementById(`${e}-fee-save`);o&&(o.classList.toggle("is-dirty",n.isDirty),e==="meta-cv"&&(o.disabled=!n.isDirty,o.textContent=n.isDirty?"Save changes":"Saved"))}function bindMetaReportFeeAmountInputs(e){const t=document.getElementById(`${e}-setting-fee-percent`),n=document.getElementById(`${e}-setting-marketing-fee`);t&&(t.oninput=()=>syncMetaReportFeeSelectionState(e)),n&&(n.oninput=()=>syncMetaReportFeeSelectionState(e))}function bindMetaReportFeeDraftTracking(e){bindMetaReportFeeAmountInputs(e),syncMetaReportFeeSelectionState(e)}function renderMetaReportBottomlineFeeSummary(e={},t="meta-report"){const n=!!e.metaReportShowBottomline,a=resolveMetaReportFeeMode(e)||"",o=e.metaReportFeePercent??20,r=e.metaReportMarketingFeeAmount??0,s=describeMetaReportFeeModeLabel(a,o,r);return`
    <div class="meta-report-bottomline-summary" id="${t}-fee-summary">
      <div class="meta-report-bottomline-summary-content">
        <div class="meta-report-bottomline-summary-row">
          <span class="meta-report-bottomline-summary-label">Bottomline</span>
          <span class="meta-report-bottomline-summary-value${n?" is-on":" is-off"}">${n?"Enabled":"Disabled"}</span>
        </div>
        ${n?`
        <div class="meta-report-bottomline-summary-row">
          <span class="meta-report-bottomline-summary-label">Censio fee</span>
          <span class="meta-report-bottomline-summary-value">${esc(s)}</span>
        </div>`:""}
      </div>
      <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="${t}-fee-edit">Edit</button>
    </div>
  `}function renderMetaReportBottomlineFeeEditor(e={},t="meta-report",{compact:n=!1,modal:a=!1}={}){const o=!!e.metaReportShowBottomline,r=!!e.metaReportFeeEnabled,s=e.metaReportFeeMode||"",i=resolveMetaReportFeeMode(e),l=e.metaReportFeePercent??20,c=e.metaReportMarketingFeeAmount??0,d=metaReportUsesInlineFeeValue(t),u=`data-fee-mode="${esc(s)}" data-fee-enabled="${r?"true":"false"}" data-fee-percent="${esc(l)}" data-marketing-fee="${esc(c)}"`,p=describeMetaReportFeeModeLabel(i,l,c),h=META_REPORT_FEE_MODE_META.map(({value:b,icon:y,title:m,desc:f})=>`
        <label class="meta-report-fee-mode-card">
          <input type="radio" name="${t}-fee-mode" value="${esc(b)}"${i===b?" checked":""} />
          <span class="meta-report-fee-mode-card-icon" aria-hidden="true">${esc(y)}</span>
          <span class="meta-report-fee-mode-card-text">
            <span class="meta-report-fee-mode-card-title">${esc(m)}</span>
            <small>${esc(f)}</small>
          </span>
          <span class="meta-report-fee-mode-card-radio" aria-hidden="true">${ICON_CHECK}</span>
        </label>`).join(""),g=a?`
    <div class="meta-report-fee-editor-actions">
      <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" data-meta-report-modal-close>Done</button>
      <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="${t}-fee-save">Save fee settings</button>
    </div>`:`
        <div class="meta-report-fee-save-row">
          <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="${t}-fee-save">Save fee settings</button>
        </div>`;return a?`
    <div class="meta-report-bottomline-editor meta-report-bottomline-editor--modal" id="${t}-fee-editor">
      <div class="meta-report-bottomline-panel">
        <div class="meta-report-bottomline-row">
          <div class="meta-report-bottomline-row-text">
            <span class="meta-report-bottomline-row-title">Show bottomline</span>
            <span class="meta-report-bottomline-row-desc">Adds profit, ROAS and Censio fee breakdown to this report</span>
          </div>
          ${renderMetaReportSwitch(`${t}-setting-bottomline`,o,"Show bottomline",!1,{hideLabel:!0})}
        </div>
        <div class="meta-report-fee-nested${o?"":" is-hidden"}" id="${t}-fee-nested" ${u}>
          <div class="meta-report-fee-status" id="${t}-fee-status" aria-live="polite">
            <span class="meta-report-fee-status-value is-active">${esc(p)}</span>
          </div>
          <div class="meta-report-fee-mode-grid meta-report-fee-mode-grid--list">${h}
          </div>
          <div class="meta-report-fee-value" id="${t}-fee-value">${metaReportFeeValueBlockHtml(t,i,l,c,{inline:d})}</div>
        </div>
      </div>
      ${g}
    </div>`:`
    <div class="meta-report-bottomline-editor" id="${t}-fee-editor">
      <div class="meta-report-bottomline-row">
        <div class="meta-report-bottomline-row-text">
          <span class="meta-report-bottomline-row-title">Show bottomline</span>
          <span class="meta-report-bottomline-row-desc">Adds profit, ROAS and Censio fee breakdown to this report</span>
        </div>
        ${renderMetaReportSwitch(`${t}-setting-bottomline`,o,"Show bottomline",!1,{hideLabel:!0})}
      </div>
      <div class="meta-report-fee-nested${o?"":" is-hidden"}" id="${t}-fee-nested" ${u}>
        <div class="meta-report-fee-status" id="${t}-fee-status" aria-live="polite">
          <span class="meta-report-fee-status-value is-active">${esc(p)}</span>
        </div>
        <div class="meta-report-fee-mode-grid${n?" meta-report-fee-mode-grid--rows":""}">${h}
        </div>
        <div class="meta-report-fee-value" id="${t}-fee-value">${metaReportFeeValueBlockHtml(t,i,l,c,{inline:d})}</div>
        ${g}
      </div>
    </div>
  `}function renderMetaReportBottomlineModalContent(e){const t=e.settings||{};return`
    <div class="meta-report-modal-head">
      <h2 class="meta-report-modal-title">Bottomline & Censio fee</h2>
      <button type="button" class="meta-report-modal-close" aria-label="Close">&times;</button>
    </div>
    <div class="meta-report-share-panel">
      ${renderMetaReportBottomlineFeeEditor(t,"meta-report",{modal:!0})}
    </div>
  `}function openMetaReportBottomlineModal(e){metaReportsState.clientReportSettingsExpanded=!0,syncMetaReportControlPanelUi(),openMetaReportModal(renderMetaReportBottomlineModalContent(e)),bindMetaReportBottomlineFeeEvents(e.clientId,"meta-report")}function bindMetaReportBottomlineSummaryEvents(e){const t=document.getElementById("meta-report-fee-edit");!t||!e||(t.onclick=()=>openMetaReportBottomlineModal(e))}function updateMetaReportBottomlineFeeSummary(e={},t="meta-report"){const n=document.getElementById(`${t}-fee-summary`);if(!n)return;const a=document.createElement("div");a.innerHTML=renderMetaReportBottomlineFeeSummary(e,t);const o=a.firstElementChild;o&&n.replaceWith(o),bindMetaReportBottomlineSummaryEvents(metaReportsState.clientPayload)}function renderMetaReportBottomlineFeeSettings(e={},t="meta-report",{compact:n=!1,variant:a="default",collapsible:o=!1,externalSummary:r=!1}={}){const s=!!e.metaReportShowBottomline,i=!!e.metaReportFeeEnabled,l=e.metaReportFeeMode||"",c=resolveMetaReportFeeMode(e),d=e.metaReportFeePercent??20,u=e.metaReportMarketingFeeAmount??0,p=metaReportUsesInlineFeeValue(t),h=`data-fee-mode="${esc(l)}" data-fee-enabled="${i?"true":"false"}" data-fee-percent="${esc(d)}" data-marketing-fee="${esc(u)}"`;if(a==="cv"){const g=describeMetaReportFeeModeLabel(c,d,u),b=META_REPORT_FEE_MODE_META.map(({value:y,title:m})=>`
        <label class="meta-report-fee-mode-pill">
          <input type="radio" name="${t}-fee-mode" value="${esc(y)}"${c===y?" checked":""} />
          <span>${esc(m)}</span>
        </label>`).join("");return`
    <div class="meta-report-bottomline-fee-settings meta-report-bottomline-fee-settings--cv">
      <div class="meta-cv-bottomline-panel">
        <div class="meta-cv-bottomline-head">
          <div class="meta-cv-bottomline-head-text">
            <span class="meta-cv-bottomline-title">Enable bottomline</span>
            <span class="meta-cv-bottomline-hint">Adds profit breakdown and Censio fee to client report</span>
          </div>
          ${renderMetaReportSwitch(`${t}-setting-bottomline`,s,"Enable bottomline on report",!1,{hideLabel:!0})}
        </div>
        <div class="meta-report-fee-nested meta-cv-bottomline-body${s?"":" is-hidden"}" id="${t}-fee-nested" ${h}>
          <div class="meta-report-fee-status" id="${t}-fee-status" aria-live="polite">
            <span class="meta-report-fee-status-value is-active">${esc(g)}</span>
          </div>
          <div class="meta-report-fee-mode-pills">${b}</div>
          <div class="meta-cv-fee-footer">
            <div class="meta-cv-fee-value-inline" id="${t}-fee-value">${metaReportFeeValueBlockHtml(t,c,d,u,{inline:!0})}</div>
            <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="${t}-fee-save" disabled>Saved</button>
          </div>
        </div>
      </div>
    </div>
  `}return`
    <div class="meta-report-bottomline-fee-settings">
      ${renderMetaReportBottomlineFeeEditor(e,t,{compact:n})}
    </div>
  `}function syncMetaReportBottomlineFeeDom(e={},t="meta-report"){const n=!!e.metaReportShowBottomline,a=!!e.metaReportFeeEnabled,o=e.metaReportFeeMode||"",r=resolveMetaReportFeeMode(e),s=e.metaReportFeePercent??20,i=e.metaReportMarketingFeeAmount??0,l=document.getElementById(`${t}-setting-bottomline`);l&&(l.checked=n);const c=document.getElementById(`${t}-fee-nested`);c?.classList.toggle("is-hidden",!n),c&&(c.dataset.feeMode=o,c.dataset.feeEnabled=a?"true":"false",c.dataset.feePercent=String(s),c.dataset.marketingFee=String(i)),document.querySelectorAll(`input[name="${t}-fee-mode"]`).forEach(p=>{p.checked=p.value===r});const d=metaReportUsesInlineFeeValue(t),u=document.getElementById(`${t}-fee-value`);u&&(u.innerHTML=metaReportFeeValueBlockHtml(t,r,s,i,{inline:d}),bindMetaReportFeeValueInputEnterKey(t)),syncMetaReportFeeSelectionState(t),t==="meta-report"&&updateMetaReportBottomlineFeeSummary(e,t)}function bindMetaReportFeeValueInputEnterKey(e){const t=document.getElementById(`${e}-setting-fee-percent`)||document.getElementById(`${e}-setting-marketing-fee`);t&&(t.onkeydown=n=>{n.key==="Enter"&&(n.preventDefault(),document.getElementById(`${e}-fee-save`)?.click())})}function bindMetaReportBottomlineFeeEvents(e,t,n){const a=n||((s,i)=>saveMetaReportClientSettings(e,s,i)),o=document.getElementById(`${t}-setting-bottomline`);o&&(o.onchange=()=>{const s=o.checked;a({metaReportShowBottomline:s},()=>{o.checked=!s})}),document.querySelectorAll(`input[name="${t}-fee-mode"]`).forEach(s=>{s.onchange=()=>{if(!s.checked)return;const i=document.getElementById(`${t}-fee-nested`),l=metaReportUsesInlineFeeValue(t),c=document.getElementById(`${t}-fee-value`);c&&i&&(c.innerHTML=metaReportFeeValueBlockHtml(t,s.value||"",i.dataset.feePercent??20,i.dataset.marketingFee??0,{inline:l}),bindMetaReportFeeValueInputEnterKey(t)),bindMetaReportFeeAmountInputs(t),syncMetaReportFeeSelectionState(t)}}),bindMetaReportFeeValueInputEnterKey(t),bindMetaReportFeeDraftTracking(t);const r=document.getElementById(`${t}-fee-save`);r&&(r.onclick=async()=>{if(r.disabled)return;const s=document.getElementById(`${t}-fee-nested`),i=s?.querySelector(`input[name="${t}-fee-mode"]:checked`),l=i&&i.value||null,c={metaReportFeeMode:l};if(l==="performance"){const u=document.getElementById(`${t}-setting-fee-percent`);let p=Number(u?.value);Number.isFinite(p)||(p=20),p=Math.min(100,Math.max(0,p)),u&&(u.value=String(p)),c.metaReportFeePercent=p}else if(l==="marketing"){const u=document.getElementById(`${t}-setting-marketing-fee`);let p=Number(u?.value);Number.isFinite(p)||(p=0),p=Math.max(0,p),u&&(u.value=String(p)),c.metaReportMarketingFeeAmount=p}const d=r.textContent;r.disabled=!0,r.textContent="Saving\u2026",r.classList.remove("is-dirty");try{await a(c,()=>syncMetaReportBottomlineFeeDom({metaReportShowBottomline:o?o.checked:!0,metaReportFeeMode:s?.dataset.feeMode||null,metaReportFeePercent:Number(s?.dataset.feePercent)||20,metaReportMarketingFeeAmount:Number(s?.dataset.marketingFee)||0},t)),syncMetaReportFeeSelectionState(t)}finally{r.disabled=!1,r.textContent=d,syncMetaReportFeeSelectionState(t)}})}function renderMetaReportSaveIndicator(e,t=!1){return`
    <span class="meta-report-save-indicator${t?" is-visible":""}" id="${esc(e)}" aria-live="polite">
      <span class="meta-report-save-indicator-spinner"></span> Saving\u2026
    </span>
  `}function renderMetaReportSwitch(e,t,n,a=!1,{hideLabel:o=!1}={}){return`
    <div class="meta-report-switch">
      <label class="meta-report-switch-track" for="${esc(e)}" aria-label="${esc(n)}">
        <input type="checkbox" class="meta-report-switch-input" id="${esc(e)}"${t?" checked":""}${a?" disabled":""} />
        <span class="meta-report-switch-thumb" aria-hidden="true"></span>
      </label>
      ${o?"":`<span class="meta-report-switch-label">${esc(n)}</span>`}
    </div>
  `}function renderMetaCvEditorSkeleton(e,t,n={}){return`
    <h3>${esc(e.accountName)}</h3>
    <p class="meta-cv-editor-sub">
      ${esc(metaMonthLabel(t))}
      \xB7 ${esc(n.status||"empty")}
    </p>
    <div class="meta-cv-editor-skeleton" aria-busy="true" aria-label="Loading month details">
      <div class="meta-cv-skeleton-grid">
        ${Array.from({length:5}).map(()=>`
          <div class="meta-cv-skeleton-field">
            <div class="meta-cv-skeleton-line meta-cv-skeleton-line--xs"></div>
            <div class="meta-cv-skeleton-input"></div>
          </div>
        `).join("")}
      </div>
      <div class="meta-cv-skeleton-panel">
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--md"></div>
        <div class="meta-cv-skeleton-line meta-cv-skeleton-line--full"></div>
      </div>
      <div class="meta-cv-skeleton-actions">
        <div class="meta-cv-skeleton-btn"></div>
        <div class="meta-cv-skeleton-btn meta-cv-skeleton-btn--primary"></div>
      </div>
    </div>
  `}function renderMetaCvEditor(e){const t=metaReportsState.customValues,n=(e.clients||[]).find(L=>L.clientId===t.selectedClientId),a=t.selectedMonthKey;if(!n||!a)return`
      <div class="meta-cv-editor-empty">
        Select a client month pill to edit won leads, average lead value, and average profit.
      </div>
    `;const o=n.months?.[a]||{};if(t.loadingEditor)return renderMetaCvEditorSkeleton(n,a,o);const r=t.editorPayload?.months?.[a]||null,s=n.metaReportShowBottomline,i=!!n.metaReportGhlDataEnabled,l={metaReportGhlDataEnabled:n.metaReportGhlDataEnabled,metaReportToplineMode:n.metaReportToplineMode},c=resolveClientToplineMode(l),d=resolveMetaCvMonthToplineSource(r,o,l),u=i&&c==="cenhub"&&d==="ghl",p=o.wonLeads!=null?o.wonLeads:r?.inputs?.wonLeads??r?.topline?.wonLeads??"",h=o.avgLeadValue!=null?o.avgLeadValue:r?.inputs?.avgLeadValue??r?.topline?.avgLeadValue??"",g=o.avgProfitPerWon!=null?o.avgProfitPerWon:r?.inputs?.avgProfitPerWon??"",b=o.ghlLeads??r?.ghlTotals?.leads??r?.topline?.leads??"",y=o.ghlTotalRevenue??r?.ghlTotals?.totalRevenue??"",m=o.ghlTotalProfit??r?.ghlTotals?.totalProfit??"",f=metaReportsState.customValues.draftInputs,v=i&&c==="cenhub"&&d==="manual",$=u?b:f?.manualLeads??(v?o.manualLeads??r?.topline?.leads??"":r?.topline?.leads??o.manualLeads??""),w=f?.wonLeads??p,S=f?.avgLeadValue??h,C=f?.avgProfitPerWon??g,E=u?' readonly disabled tabindex="-1" aria-readonly="true"':"",I=u?" disabled":"",R=u?" is-locked":"",A=t.settingsSaving&&t.settingsSavingScope==="report",B=i?renderMetaCvToplineSourceControl(n,e):"",M=renderMetaCvMonthManualRow(r||{dataSource:d},n),T=i?renderMetaMonthSourcePill(r||{dataSource:d},l):"";return`
    <div class="meta-report-edit-panel-head">
      <div>
        <h3>${esc(n.accountName)}</h3>
        <p class="meta-cv-editor-sub">
          ${esc(metaMonthLabel(a))}
          \xB7 ${esc(o.status||"empty")}
          \xB7 ${o.updatedAt?`Updated ${esc(metaCvFormatUpdatedAt(o.updatedAt))}`:"Not updated yet"}
        </p>
      </div>
      ${T}
    </div>
    ${B}
    <div class="meta-cv-editor-grid">
      <label>Client
        <select id="meta-cv-client-select" class="admin-select">
          ${(e.clients||[]).map(L=>`
            <option value="${esc(L.clientId)}"${L.clientId===n.clientId?" selected":""}>${esc(L.accountName)}</option>
          `).join("")}
        </select>
      </label>
      <label>Month
        <select id="meta-cv-month-select" class="admin-select">
          ${(e.monthKeys||[]).map(L=>`
            <option value="${esc(L)}"${L===a?" selected":""}>${esc(metaMonthLabel(L))}</option>
          `).join("")}
        </select>
      </label>
      <label class="meta-cv-value-field${R}">Number of leads
        <input type="number" step="any" id="meta-cv-leads" value="${esc($)}"${E} />
      </label>
      <label class="meta-cv-value-field${R}">Won leads
        <input type="number" step="any" id="meta-cv-won-leads" value="${esc(w)}"${E} />
      </label>
      <label class="meta-cv-value-field${R}">Avg lead value
        <input type="number" step="any" id="meta-cv-avg-lead-value" value="${esc(S)}"${E} />
      </label>
      <label class="meta-cv-value-field${R}">Avg profit per won${s?"":" (optional)"}
        <input type="number" step="any" id="meta-cv-avg-profit" value="${esc(C)}"${E} />
      </label>
    </div>
    ${M}
    <div class="meta-report-settings-group meta-report-settings-group--stacked meta-cv-client-settings${A?" is-saving":""}">
      ${renderMetaReportSaveIndicator("meta-cv-settings-status",A)}
      ${renderMetaReportBottomlineFeeSettings(n,"meta-cv",{variant:"cv"})}
    </div>
    <div class="meta-cv-editor-actions">
      <div class="meta-cv-editor-actions-left">
        <a class="admin-btn admin-btn--ghost" href="/admin/meta-reports/${encodeURIComponent(n.clientId)}">Open full editor</a>
        ${i?'<a class="admin-btn admin-btn--ghost" href="/admin/meta-reports/ghl-clients">Cenhub clients</a>':""}
        ${renderMetaReportSaveIndicator("meta-cv-save-indicator",t.saving)}
      </div>
      <button type="button" class="admin-btn admin-btn--primary" id="meta-cv-save"${t.saving||t.loadingEditor||t.settingsSaving||u?" disabled":""}${I}>
        ${t.saving?"Saving\u2026":"Save values"}
      </button>
    </div>
  `}function renderMetaReportsCustomValuesPage(e){const t=e.summary||{},n=(e.years||[]).map(a=>`
    <option value="${esc(a.year)}"${Number(e.year)===Number(a.year)?" selected":""}>${esc(a.year)}</option>
  `).join("");return`
    ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-custom"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero meta-premium-page-hero">
      <div class="meta-premium-page-hero-inner">
        <div class="admin-breadcrumb">
          <a href="/admin">Clients</a>
          <span aria-hidden="true"> / </span>
          <a href="/admin/meta-reports">Meta reports</a>
          <span aria-hidden="true"> / </span>
          <span>Custom values</span>
        </div>
        <h1>Custom values</h1>
      </div>
    </div>
    <div class="sync-history-page meta-reports-page">
      <div class="meta-cv-toolbar">
        <div class="meta-cv-toolbar-left">
          <label class="meta-report-year-field">Year
            <select id="meta-cv-year" class="admin-select">${n}</select>
          </label>
          <span class="meta-report-year-loading-banner" id="meta-cv-year-loading-banner" hidden aria-live="polite"></span>
        </div>
        <div class="meta-cv-search">
          <input id="meta-cv-search" type="search" placeholder="Search clients..." value="${esc(metaReportsState.customValues.searchQuery)}" autocomplete="off" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:10px;font:inherit" />
        </div>
      </div>
      <div class="meta-cv-summary">
        <span class="meta-cv-summary-pill is-complete">${t.completeMonths||0} complete</span>
        <span class="meta-cv-summary-pill is-partial">${t.partialMonths||0} partial</span>
        <span class="meta-cv-summary-pill is-empty">${t.emptyMonths||0} remaining</span>
        <span class="meta-cv-summary-pill">${t.clientCount||0} clients \xB7 ${t.monthCount||0} months</span>
      </div>
      <div class="meta-cv-legend">
        <span><i class="is-complete"></i> Complete</span>
        <span><i class="is-partial"></i> Partial</span>
        <span><i class="is-empty"></i> Remaining</span>
      </div>
      <div class="meta-cv-layout" style="margin-top:16px">
        <div class="meta-cv-list" id="meta-cv-client-list">
          ${renderMetaCvClientRows(e)}
        </div>
        <aside class="meta-cv-editor" id="meta-cv-editor">
          ${renderMetaCvEditor(e)}
        </aside>
      </div>
    </div>
    `)}
  `}function bindMetaCvToplineSourceControl(e,t){const n=document.getElementById("meta-cv-topline-change");n&&(n.onclick=()=>openMetaCvToplineChangeModal(t))}function bindMetaCvMonthManualEvents(e){const t=metaReportsState.customValues.overview?.clients?.find(n=>n.clientId===e);bindMetaMonthSourceOverrideEvents(e,{metaReportGhlDataEnabled:t?.metaReportGhlDataEnabled,metaReportToplineMode:t?.metaReportToplineMode},{prefix:"meta-cv",getMonthKey:()=>metaReportsState.customValues.selectedMonthKey,getMonthPayload:()=>{const n=metaReportsState.customValues.selectedMonthKey;return n&&metaReportsState.customValues.editorPayload?.months?.[n]||null},onSuccess:async(n,a)=>{applyMetaCvSaveResult(e,a,{},n),refreshMetaCvListAndEditor(),await refreshMetaCvOverviewSilently()}})}function refreshMetaCvListAndEditor(){const e=metaReportsState.customValues.overview;if(!e)return;const t=document.getElementById("meta-cv-client-list");t&&(t.innerHTML=renderMetaCvClientRows(e));const n=document.getElementById("meta-cv-editor");n&&(n.innerHTML=renderMetaCvEditor(e)),metaReportsState.customValues.draftInputs=null,bindMetaCvEditorEvents(),bindMetaCvListEvents()}function setMetaCvSavePending(e){metaReportsState.customValues.saving=e;const t=document.getElementById("meta-cv-save"),n=document.getElementById("meta-cv-save-indicator"),a=document.getElementById("meta-cv-topline-source-panel"),o=document.getElementById("meta-cv-topline-loading");n&&n.classList.toggle("is-visible",e),a&&a.classList.toggle("is-loading",e),o&&(e?o.removeAttribute("hidden"):o.setAttribute("hidden","")),t&&(t.disabled=e||metaReportsState.customValues.loadingEditor||metaReportsState.customValues.settingsSaving,t.textContent=e?"Saving\u2026":"Save values")}function setMetaCvSettingsSaving(e,t="report"){metaReportsState.customValues.settingsSaving=e,metaReportsState.customValues.settingsSavingScope=e?t:null;const n=e&&t==="report";document.getElementById("meta-cv-settings-status")?.classList.toggle("is-visible",n),document.querySelector(".meta-cv-client-settings")?.classList.toggle("is-saving",n),["meta-cv-setting-bottomline"].forEach(r=>{const s=document.getElementById(r);s&&(s.disabled=n)}),document.querySelectorAll('input[name="meta-cv-fee-mode"]').forEach(r=>{r.disabled=n}),["meta-cv-setting-fee-percent","meta-cv-setting-marketing-fee"].forEach(r=>{const s=document.getElementById(r);s&&(s.disabled=n||s.disabled)});const o=document.getElementById("meta-cv-save");o&&(o.disabled=e||metaReportsState.customValues.saving||metaReportsState.customValues.loadingEditor)}function classifyMetaCvMonthStatus(e,t=!1){if(!e)return"empty";const n=e.wonLeads!=null,a=e.avgLeadValue!=null,o=e.avgProfitPerWon!=null;return n&&a&&(!t||o)?"complete":n||a||o?"partial":"empty"}function applyMetaCvSaveResult(e,t,n,a){const r=metaReportsState.customValues.overview?.clients?.find(l=>l.clientId===e),s=r?.months?.[t],i=a?.month||{};s&&(s.wonLeads=i.wonLeads??n.wonLeads,s.avgLeadValue=i.avgLeadValue??n.avgLeadValue,s.avgProfitPerWon=i.avgProfitPerWon??n.avgProfitPerWon,s.toplineSource=i.toplineSource??n.toplineSource??s.toplineSource,s.manualOverride=i.manualOverride??n.manualOverride??s.manualOverride,s.ghlLeads=i.ghlLeads??s.ghlLeads,s.ghlWonLeads=i.ghlWonLeads??s.ghlWonLeads,s.ghlTotalRevenue=i.ghlTotalRevenue??s.ghlTotalRevenue,s.ghlTotalProfit=i.ghlTotalProfit??s.ghlTotalProfit,s.ghlSyncedAt=i.ghlSyncedAt??s.ghlSyncedAt,s.manualLeads=i.manualLeads??n.manualLeads??s.manualLeads,s.status=classifyMetaCvMonthStatus(s,!!r.metaReportShowBottomline),s.updatedAt=s.status==="empty"?null:i.updatedAt||new Date().toISOString()),a?.monthPayload&&(metaReportsState.customValues.editorPayload={...metaReportsState.customValues.editorPayload||{},months:{...metaReportsState.customValues.editorPayload?.months||{},[t]:a.monthPayload}})}async function refreshMetaCvOverviewSilently(){const e=await adminFetch(`/api/meta-reports/custom-values?year=${encodeURIComponent(metaReportsState.selectedYear)}`);metaReportsState.selectedYear=Number(e.year)||metaReportsState.selectedYear,metaReportsState.customValues.overview=e;const t=document.getElementById("meta-cv-client-list");t&&(t.innerHTML=renderMetaCvClientRows(e),bindMetaCvListEvents());const n=document.querySelector(".meta-cv-summary");if(n&&e.summary){const a=e.summary;n.innerHTML=`
      <span class="meta-cv-summary-pill is-complete">${a.completeMonths||0} complete</span>
      <span class="meta-cv-summary-pill is-partial">${a.partialMonths||0} partial</span>
      <span class="meta-cv-summary-pill is-empty">${a.emptyMonths||0} remaining</span>
      <span class="meta-cv-summary-pill">${a.clientCount||0} clients \xB7 ${a.monthCount||0} months</span>
    `}}function collectMetaCvSaveBody(){const e=metaReportsState.customValues.selectedClientId,t=metaReportsState.customValues.selectedMonthKey,n=metaReportsState.customValues.overview?.clients?.find(d=>d.clientId===e),a=n?.months?.[t],o=metaReportsState.customValues.editorPayload?.months?.[t]||null,r={metaReportGhlDataEnabled:n?.metaReportGhlDataEnabled,metaReportToplineMode:n?.metaReportToplineMode},s=resolveClientToplineMode(r),i=resolveMetaCvMonthToplineSource(o,a,r),l=!!n?.metaReportGhlDataEnabled&&s==="cenhub"&&i==="manual",c={wonLeads:document.getElementById("meta-cv-won-leads")?.value===""?null:Number(document.getElementById("meta-cv-won-leads")?.value),avgLeadValue:document.getElementById("meta-cv-avg-lead-value")?.value===""?null:Number(document.getElementById("meta-cv-avg-lead-value")?.value),avgProfitPerWon:document.getElementById("meta-cv-avg-profit")?.value===""?null:Number(document.getElementById("meta-cv-avg-profit")?.value)};return l&&(c.toplineSource="manual",c.manualOverride=!0,c.manualLeads=document.getElementById("meta-cv-leads")?.value===""?null:Number(document.getElementById("meta-cv-leads")?.value)),c}function syncMetaCvClientSettingsDom(e={}){syncMetaReportBottomlineFeeDom(e,"meta-cv")}async function saveMetaCvClientSettings(e,t,n){setMetaCvSettingsSaving(!0,"report");try{const a=metaReportsState.customValues.selectedMonthKey,o=await patchMetaReportSettings(e,{...t,monthKey:a||void 0}),s=metaReportsState.customValues.overview?.clients?.find(i=>i.clientId===e);s&&o.settings&&(s.metaReportShowBottomline=!!o.settings.metaReportShowBottomline,s.metaReportFeeEnabled=!!o.settings.metaReportFeeEnabled,s.metaReportFeeMode=o.settings.metaReportFeeMode||null,s.metaReportFeePercent=o.settings.metaReportFeePercent??20,s.metaReportMarketingFeeAmount=o.settings.metaReportMarketingFeeAmount??0),o.monthPayload&&a&&(metaReportsState.customValues.editorPayload={...metaReportsState.customValues.editorPayload||{},months:{...metaReportsState.customValues.editorPayload?.months||{},[a]:o.monthPayload}}),setMetaCvSettingsSaving(!1),syncMetaCvClientSettingsDom(o.settings||{}),showToast(describeMetaReportSettingsChange(t,o.settings||{}),"success")}catch(a){showToast(a.message||"Update failed","error"),n&&n(),setMetaCvSettingsSaving(!1)}}function bindMetaCvSettingsEvents(e){bindMetaReportBottomlineFeeEvents(e,"meta-cv",(t,n)=>saveMetaCvClientSettings(e,t,n))}async function selectMetaCvMonth(e,t,{reloadEditor:n=!0}={}){if(metaReportsState.customValues.selectedClientId=e,metaReportsState.customValues.selectedMonthKey=t,refreshMetaCvListAndEditor(),!!n){metaReportsState.customValues.loadingEditor=!0,refreshMetaCvListAndEditor();try{const a=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(t)}`);metaReportsState.customValues.selectedClientId===e&&metaReportsState.customValues.selectedMonthKey===t&&(metaReportsState.customValues.editorPayload={...metaReportsState.customValues.editorPayload||{},months:{...metaReportsState.customValues.editorPayload?.months||{},[t]:a.monthPayload}})}catch(a){showToast(a.message||"Failed to load month","error")}finally{metaReportsState.customValues.loadingEditor=!1,refreshMetaCvListAndEditor()}}}function bindMetaCvListEvents(){document.querySelectorAll("[data-meta-cv-month]").forEach(e=>{e.onclick=()=>{selectMetaCvMonth(e.getAttribute("data-meta-cv-client"),e.getAttribute("data-meta-cv-month"))}})}function bindMetaCvEditorEvents(){const e=metaReportsState.customValues.selectedClientId;e&&bindMetaCvSettingsEvents(e);const t=document.getElementById("meta-cv-client-select"),n=document.getElementById("meta-cv-month-select");t&&(t.onchange=()=>{const s=metaReportsState.customValues.selectedMonthKey||metaReportsState.customValues.overview?.monthKeys?.slice(-1)[0];s&&selectMetaCvMonth(t.value,s)}),n&&(n.onchange=()=>{const s=metaReportsState.customValues.selectedClientId;s&&selectMetaCvMonth(s,n.value)});const a=document.getElementById("meta-cv-save");a&&(a.onclick=async()=>{const s=metaReportsState.customValues.selectedClientId,i=metaReportsState.customValues.selectedMonthKey;if(!s||!i||metaReportsState.customValues.saving)return;const l=collectMetaCvSaveBody();setMetaCvSavePending(!0);try{const c=await adminFetchWithRetry(`/api/meta-reports/clients/${encodeURIComponent(s)}/months/${encodeURIComponent(i)}`,{method:"PUT",body:JSON.stringify(l)},{retries:2,timeoutMs:3e4});applyMetaCvSaveResult(s,i,l,c),metaReportsState.customValues.draftInputs=l,setMetaCvSavePending(!1),refreshMetaCvListAndEditor(),showToast("Custom values saved","success");try{await refreshMetaCvOverviewSilently()}catch(d){console.warn("Custom values overview refresh failed after save",d)}}catch(c){const d=c?.name==="AbortError"?"Save timed out \u2014 try again":c.message||"Save failed";showToast(d,"error"),setMetaCvSavePending(!1)}});const r=metaReportsState.customValues.overview?.clients?.find(s=>s.clientId===e);r?.metaReportGhlDataEnabled&&(bindMetaCvToplineSourceControl(e,r),bindMetaCvMonthManualEvents(e))}function bindMetaReportsCustomValuesEvents(e){const t=document.getElementById("meta-cv-year");t&&(t.onchange=async()=>{const a=metaReportsState.selectedYear,o=Number(t.value);if(o!==a){metaReportsState.selectedYear=o,metaReportsState.customValues.selectedClientId=null,metaReportsState.customValues.selectedMonthKey=null,metaReportsState.customValues.editorPayload=null,setMetaCvYearLoading(o,!0);try{await loadMetaReportsCustomValuesPage({silent:!0})}catch(r){metaReportsState.selectedYear=a,t&&(t.value=String(a)),await loadMetaReportsCustomValuesPage({silent:!0,keepSelection:!0}),showToast(r.message||"Load failed","error")}finally{setMetaCvYearLoading(o,!1)}}});const n=document.getElementById("meta-cv-search");n&&(n.oninput=()=>{metaReportsState.customValues.searchQuery=n.value;const a=document.getElementById("meta-cv-client-list");a&&(a.innerHTML=renderMetaCvClientRows(e)),bindMetaCvListEvents()}),bindMetaCvListEvents(),bindMetaCvEditorEvents()}function renderMetaReportsGhlClientsPage(e){const t=e.summary||{},n=(e.clients||[]).map(a=>`
    <tr>
      <td><strong>${esc(a.accountName)}</strong><div class="meta-cv-client-meta">${esc(a.clientId)}</div></td>
      <td>${a.hasGhl?"Connected":"Not connected"}</td>
      <td>
        <label style="display:inline-flex;align-items:center;gap:8px">
          <input type="checkbox" data-ghl-list-toggle="${esc(a.clientId)}"${a.onGhlList?" checked":""}${a.hasGhl?"":" disabled"} />
          On Cenhub list
        </label>
      </td>
      <td>${a.snapshotFetchedAt?esc(metaCvFormatUpdatedAt(a.snapshotFetchedAt)):"\u2014"}${a.snapshotStale?" \xB7 stale":""}</td>
      <td>
        ${a.onGhlList?'<a class="admin-btn admin-btn--ghost" href="/admin/meta-reports/custom-values">Custom values</a>':""}
      </td>
    </tr>
  `).join("");return`
    ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-ghl-clients"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero meta-premium-page-hero">
      <div class="meta-premium-page-hero-inner">
        <div class="admin-breadcrumb">
          <a href="/admin">Clients</a>
          <span aria-hidden="true"> / </span>
          <a href="/admin/meta-reports">Meta reports</a>
          <span aria-hidden="true"> / </span>
          <span>Cenhub clients</span>
        </div>
        <h1>Cenhub clients</h1>
        <p class="meta-premium-page-hero-copy">Choose which Meta report clients pull leads, revenue, and profit from Cenhub snapshots.</p>
      </div>
    </div>
    <div class="sync-history-page meta-reports-page">
      <div class="meta-cv-summary">
        <span class="meta-cv-summary-pill">${t.ghlConnected||0} Cenhub connected</span>
        <span class="meta-cv-summary-pill is-complete">${t.onGhlList||0} on Cenhub list</span>
        <span class="meta-cv-summary-pill">${t.totalClients||0} Meta report clients</span>
      </div>
      <table class="meta-ghl-clients-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Cenhub</th>
            <th>Cenhub list</th>
            <th>Last snapshot</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${n||'<tr><td colspan="5">No Meta report clients found.</td></tr>'}</tbody>
      </table>
    </div>
    `)}
  `}function bindMetaReportsGhlClientsEvents(){document.querySelectorAll("[data-ghl-list-toggle]").forEach(e=>{e.onchange=async()=>{const t=e.getAttribute("data-ghl-list-toggle"),n=e.checked,a=!n;metaReportsState.ghlClients.savingClientId=t;try{await adminFetch(`/api/meta-reports/ghl-clients/${encodeURIComponent(t)}`,{method:"PATCH",body:JSON.stringify({enabled:n})});const o=metaReportsState.ghlClients.data?.clients?.find(r=>r.clientId===t);o&&(o.onGhlList=n),showToast(n?"Added to Cenhub list":"Removed from Cenhub list","success")}catch(o){e.checked=a,showToast(o.message||"Update failed","error")}finally{metaReportsState.ghlClients.savingClientId=null}}})}async function loadMetaReportsGhlClientsPage(){const e=document.getElementById("dashboard");if(!e)return;const t=await fetchStaffMe();if(!t){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}currentStaffUser=t,metaReportsState.ghlClients.mounted||(e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-ghl-clients"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading Cenhub clients...</p></div>')}
    `);try{const n=await adminFetch("/api/meta-reports/ghl-clients");metaReportsState.ghlClients.data=n,e.innerHTML=renderMetaReportsGhlClientsPage(n),metaReportsState.ghlClients.mounted=!0,bindMetaReportsGhlClientsEvents()}catch(n){e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-ghl-clients"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(n.message)}</div>`)}
    `}}async function loadMetaReportsCustomValuesPage({silent:e=!1,keepSelection:t=!1}={}){const n=document.getElementById("dashboard");if(!n)return;const a=await fetchStaffMe();if(!a){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}currentStaffUser=a,!metaReportsState.customValues.mounted&&!e&&(n.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-custom"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading custom values...</p></div>')}
    `);try{const o=await adminFetch(`/api/meta-reports/custom-values?year=${encodeURIComponent(metaReportsState.selectedYear)}`);metaReportsState.selectedYear=Number(o.year)||metaReportsState.selectedYear,metaReportsState.customValues.overview=o,t||(o.clients||[]).some(s=>s.clientId===metaReportsState.customValues.selectedClientId)||(metaReportsState.customValues.selectedClientId=null,metaReportsState.customValues.selectedMonthKey=null,metaReportsState.customValues.editorPayload=null),n.innerHTML=renderMetaReportsCustomValuesPage(o),metaReportsState.customValues.mounted=!0,metaReportsState.customValues.saving=!1,bindMetaReportsCustomValuesEvents(o)}catch(o){if(!metaReportsState.customValues.mounted)n.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-custom"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(o.message)}</div>`)}
      `;else{if(e)throw o;showToast(o.message||"Load failed","error")}}}function renderAdminHubPage(e){const t=e.length,n=currentStaffUser?`
          <a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta">Meta sync log</a>
          <a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta-reports">Meta report sync log</a>
  `:"",a=isStaffAdmin()?`
          ${n}
          <button class="admin-btn" type="button" onclick="syncAllClients(this)">${ICON_SYNC} Sync all</button>
          <button class="admin-btn admin-btn--primary" type="button" onclick="focusAddClient()">${ICON_PLUS} Add client</button>
  `:n;return`
    ${renderBrandTopbar(renderStaffAdminChrome("clients"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero">
      <h1>Client administration</h1>
      <p>Manage dashboard accounts, sync GHL data, and preview client views.</p>
    </div>
    <div class="admin-hub">
      <div class="hub-toolbar-row">
        <div class="hub-search">
          ${ICON_SEARCH}
          <input id="hub-search" type="search" placeholder="Search clients..." oninput="filterHubCards()" />
        </div>
        <span class="hub-count" id="hub-count">${t} client${t===1?"":"s"}</span>
        <div class="hub-toolbar-actions">
          ${a}
        </div>
      </div>
      <div class="client-grid" id="client-grid">
        ${t?e.map(o=>renderClientCard(o)).join(""):`<div class="hub-empty">${isStaffAdmin()?"No clients yet. Create your first client below.":"No clients yet."}</div>`}
        <div class="hub-empty" id="hub-no-results" style="display:none">No clients match your search.</div>
      </div>
      ${isStaffAdmin()?renderAddClientPanel():""}
    </div>
    <div class="brand-footer">
      Dashboard by Cenhub \xB7 Holstebro
    </div>
    `)}
  `}function focusAddClient(){const e=document.getElementById("add-client-panel");e&&(e.open=!0);const t=document.getElementById("new-account-name");t&&(t.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>t.focus({preventScroll:!0}),350))}function copyAdminUrl(e){const t=`${window.location.origin}/admin/${e}`;navigator.clipboard.writeText(t).then(()=>showToast("Admin URL copied","success"),()=>showToast("Could not copy URL","error"))}function closeCardMenus(){document.querySelectorAll(".card-menu.open").forEach(e=>e.classList.remove("open"))}function toggleCardMenu(e,t){t.stopPropagation();const n=document.getElementById(`card-menu-${e}`);if(!n)return;const a=!n.classList.contains("open");closeCardMenus(),a&&n.classList.add("open")}function renderCardMenu(e,t){const n=t||e,a=isStaffAdmin()?`<button type="button" role="menuitem" class="card-menu-item--danger" onclick="closeCardMenus(); deleteClient('${e}');">Delete client</button>`:"";return`
    <div class="card-menu" id="card-menu-${e}" data-client-id="${e}">
      <button
        type="button"
        class="icon-btn card-menu-trigger"
        aria-label="More actions for ${esc(n)}"
        title="More actions"
        aria-haspopup="menu"
        onclick="toggleCardMenu('${e}', event)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.75"></circle>
          <circle cx="12" cy="12" r="1.75"></circle>
          <circle cx="12" cy="19" r="1.75"></circle>
        </svg>
      </button>
      <div class="card-menu-dropdown" role="menu">
        <button type="button" role="menuitem" onclick="copyAdminUrl('${e}'); closeCardMenus();">Copy admin URL</button>
        ${a}
      </div>
    </div>
  `}function renderClientCard(e){const t=e.previewKpis||{},n=e.pipelineMode==="3-pipeline"?"3 pipelines":"2 pipelines",a=clientNeedsAction(e.status);return`
    <article class="client-card${a?" client-card--needs-action":""}" data-client-id="${e.clientId}" data-search="${esc(`${e.accountName} ${e.clientId}`.toLowerCase())}">
      <div class="client-card-header">
        <span class="client-avatar" aria-hidden="true">${esc(clientInitials(e.accountName))}</span>
        <div class="client-card-title-block">
          <h3>${esc(e.accountName)}</h3>
          <div class="client-card-slug">/${e.clientId}</div>
        </div>
        ${renderCardMenu(e.clientId,e.accountName)}
      </div>
      <div class="client-card-meta">
        <span class="status-badge status-${e.status}">${statusLabel(e.status)}</span>
        <span class="client-card-meta-divider" aria-hidden="true">\xB7</span>
        <span>${n}</span>
        <span class="client-card-meta-divider" aria-hidden="true">\xB7</span>
        <span data-sync-meta>${formatRelativeSync(e.lastSyncAt,e.status)}</span>
      </div>
      ${a?`<p class="client-card-action-hint">${esc(clientActionHint(e.status))}</p>`:""}
      ${t.totalLeads!=null?`
        <div class="client-card-stats">
          <div class="client-card-stat">
            <div class="client-card-stat-value">${fmtDkk(t.totalLeads)}</div>
            <div class="client-card-stat-label">Leads</div>
          </div>
          <div class="client-card-stat">
            <div class="client-card-stat-value">${fmtDkk(t.clientsWon)}</div>
            <div class="client-card-stat-label">Won</div>
          </div>
          <div class="client-card-stat">
            <div class="client-card-stat-value">${fmtRevenueDkk(t.wonRevenue)}</div>
            <div class="client-card-stat-label">Revenue</div>
          </div>
        </div>
      `:""}
      <div class="client-card-actions">
        <a class="admin-btn" href="/admin/${e.clientId}">Settings</a>
        <a class="admin-btn admin-btn--primary" href="/${encodeURIComponent(e.clientId)}" target="_blank" rel="noopener noreferrer" title="Open client dashboard">Dashboard</a>
        <button class="admin-btn admin-btn--secondary" type="button" onclick="syncClient('${e.clientId}', this)">${ICON_SYNC} Sync</button>
      </div>
    </article>
  `}function filterHubCards(){const e=(document.getElementById("hub-search")?.value||"").trim().toLowerCase();let t=0;document.querySelectorAll("#client-grid .client-card").forEach(a=>{const o=!e||(a.dataset.search||"").includes(e);a.style.display=o?"":"none",o&&(t+=1)});const n=document.getElementById("hub-no-results");n&&(n.style.display=e&&!t?"":"none")}function renderAddClientPanel(){return`
    <details class="add-client-panel" id="add-client-panel">
      <summary class="add-client-summary">
        <h2>${ICON_PLUS} Add new client</h2>
        <span class="add-client-summary-hint">Click to expand</span>
      </summary>
      <p class="add-client-desc">Creates the account and opens the setup page where you pick the metrics model and connect GHL.</p>
      <div class="add-client-body">
        <div class="setup-grid setup-grid--3">
          <div class="field-group">
            <label for="new-account-name">Account name</label>
            <input id="new-account-name" type="text" placeholder="ScanTherm" oninput="suggestNewClientSlug()" />
          </div>
          <div class="field-group">
            <label for="new-client-slug">Admin slug</label>
            <input id="new-client-slug" type="text" placeholder="scantherm" oninput="checkNewClientSlug()" />
            <div id="slug-status" class="slug-status"></div>
          </div>
          <div class="field-group">
            <label for="new-location-id">GHL location ID</label>
            <input id="new-location-id" type="text" placeholder="Optional \u2014 can be added later" />
          </div>
        </div>
        <div class="setup-actions" style="border-top:0;padding-top:16px;margin-top:0">
          <div></div>
          <button class="admin-btn admin-btn--primary" type="button" onclick="createClient()">${ICON_PLUS} Create client</button>
        </div>
      </div>
    </details>
  `}async function loadAdminHub(){const e=document.getElementById("dashboard");if(await requireStaffAuth()){e.innerHTML=`
    ${renderBrandTopbar(renderStaffAdminChrome("clients"))}
    ${wrapDashboardShell(`
      <div class="loading-state">
        <div class="spinner"></div>
        Loading clients...
      </div>
    `)}`;try{const n=await adminFetch("/api/clients");e.innerHTML=renderAdminHubPage(n.clients||[])}catch(n){e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("clients"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(n.message)}</div>`)}
    `}}}let slugCheckTimer=null;function suggestNewClientSlug(){const e=document.getElementById("new-account-name")?.value||"",t=document.getElementById("new-client-slug");!t||t.dataset.userEdited==="true"||(t.value=e.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),checkNewClientSlug())}function checkNewClientSlug(){const e=document.getElementById("new-client-slug");e&&(e.dataset.userEdited="true"),clearTimeout(slugCheckTimer),slugCheckTimer=setTimeout(async()=>{const t=document.getElementById("new-client-slug")?.value||"",n=document.getElementById("slug-status");if(!n||!t){n&&(n.textContent="");return}try{const a=await adminFetch(`/api/clients/check-slug?slug=${encodeURIComponent(t)}`);n.className=`slug-status ${a.available?"ok":"bad"}`,n.textContent=a.available?`Available \xB7 ${a.adminUrl}`:`Unavailable (${a.reason||"taken"})`}catch(a){n.className="slug-status bad",n.textContent=a.message}},300)}async function createClient(){const e=document.getElementById("new-account-name")?.value?.trim(),t=document.getElementById("new-client-slug")?.value?.trim(),n=document.getElementById("new-location-id")?.value?.trim();if(!e||!t){window.alert("Account name and slug are required.");return}try{await adminFetch("/api/clients",{method:"POST",body:JSON.stringify({accountName:e,clientId:t,locationId:n||null})}),showToast("Client created","success"),window.location.href=`/admin/${encodeURIComponent(t)}`}catch(a){showToast(a.message,"error")}}let hubSyncPollTimer=null,hubSyncPendingIds=new Set,hubSyncPollStartedAt=0,hubSyncBaselineAt=new Map;function stopHubSyncPolling(){hubSyncPollTimer&&(clearInterval(hubSyncPollTimer),hubSyncPollTimer=null),hubSyncPendingIds=new Set,hubSyncPollStartedAt=0,hubSyncBaselineAt=new Map}function isClientSyncing(e){return e.status==="syncing"||e.lastSyncStatus==="syncing"}function hubBatchStillPending(e){if(!hubSyncPendingIds.size)return!1;const t=new Map((e||[]).map(n=>[n.clientId,n]));for(const n of hubSyncPendingIds){const a=t.get(n);if(!a)continue;if(isClientSyncing(a))return!0;if(a.lastSyncStatus==="error")continue;if(hubSyncBaselineAt.get(n)===a.lastSyncAt)return!0}return!1}async function pollHubSyncProgress(){if(!IS_ADMIN_HUB||!document.getElementById("client-grid")){stopHubSyncPolling();return}if(hubSyncPollStartedAt&&Date.now()-hubSyncPollStartedAt>900*1e3){stopHubSyncPolling(),showToast("Some sync jobs are still running. Refresh the page in a minute.","error");return}try{const t=(await adminFetch("/api/clients")).clients||[];if(updateHubCardsFromClients(t),hubBatchStillPending(t))return;const n=new Set(hubSyncPendingIds);stopHubSyncPolling();const a=document.getElementById("dashboard");a&&(a.innerHTML=renderAdminHubPage(t));const o=t.filter(r=>n.has(r.clientId)&&r.lastSyncStatus==="error");o.length?showToast(`${o.length} sync(s) failed`,"error"):showToast("All clients synced","success")}catch{}}function startHubSyncPolling(e=[],t=[]){stopHubSyncPolling(),hubSyncPendingIds=new Set(e),hubSyncPollStartedAt=Date.now(),hubSyncBaselineAt=new Map((t||[]).filter(n=>e.includes(n.clientId)).map(n=>[n.clientId,n.lastSyncAt])),markHubCardsSyncing(e),pollHubSyncProgress(),hubSyncPollTimer=setInterval(pollHubSyncProgress,3e3)}function markHubCardsSyncing(e=[]){e.forEach(t=>{const n=document.querySelector(`.client-card[data-client-id="${t}"]`);if(!n)return;const a=n.querySelector(".status-badge");a&&(a.className="status-badge status-syncing",a.textContent=statusLabel("syncing"));const o=n.querySelector("[data-sync-meta]");o&&(o.textContent="Syncing now...")})}function updateHubCardsFromClients(e){(e||[]).forEach(t=>{const n=document.querySelector(`.client-card[data-client-id="${t.clientId}"]`);if(!n)return;const a=n.querySelector(".status-badge");a&&(a.className=`status-badge status-${t.status}`,a.textContent=statusLabel(t.status));const o=n.querySelector("[data-sync-meta]");o&&(o.textContent=formatRelativeSync(t.lastSyncAt,t.status))})}async function syncAllClients(e){e&&(e.disabled=!0);try{showToast("Syncing all clients...");const t=await adminFetch("/api/clients",{method:"POST",body:JSON.stringify({action:"sync-all"})});if(t.queued){const a=t.count??(t.clientIds||[]).length;showToast(`Syncing ${a} client${a===1?"":"s"} in background`,"success");const o=await adminFetch("/api/clients");startHubSyncPolling(t.clientIds||[],o.clients||[]);return}const n=(t.results||[]).filter(a=>!a.success);n.length?showToast(`${n.length} sync(s) failed`,"error"):showToast("All clients synced","success"),await loadAdminHub()}catch(t){showToast(t.message,"error")}finally{e&&(e.disabled=!1)}}async function deleteClient(e){const t=e;if(!window.confirm(`Delete "${t}" permanently?

This removes the account, GHL token, and all synced snapshot data. This cannot be undone.`))return;if(window.prompt(`Type "${e}" to confirm deletion:`)!==e){showToast("Deletion cancelled \u2014 slug did not match.","error");return}try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"DELETE"}),showToast(`Deleted ${e}`,"success"),IS_ADMIN_HUB?await loadAdminHub():window.location.href="/admin"}catch(o){showToast(o.message,"error")}}async function syncClient(e,t){t&&(t.disabled=!0,t.textContent="Syncing...");try{await adminFetch(`/api/clients/${encodeURIComponent(e)}/sync`,{method:"POST",body:"{}"}),showToast("Sync completed","success"),IS_ADMIN_HUB?await loadAdminHub():IS_ADMIN_CLIENT?(await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0,{background:!0})):loadDashboard(!0,{background:!0})}catch(n){showToast(n.message,"error")}finally{if(t){t.disabled=!1;const n=t.dataset.syncLabel||"Sync";t.innerHTML=t.dataset.syncLabel?`${ICON_SYNC} ${n}`:n}}}function getMetricsModelLabels(e,t=setupPipelines){const n=new Map((t||[]).map(a=>[a.id,a.name]));return e.dedupeEnabled?{typeLabel:"Funnel + deduplication",winLabel:`Win pipeline: ${n.get(e.winPipelineId)||e.winPipelineId||"\u2014"}`}:e.winPipelineId?{typeLabel:"Simple (single win pipeline)",winLabel:`Win pipeline: ${n.get(e.winPipelineId)||e.winPipelineId}`}:{typeLabel:"Simple (no deduplication)",winLabel:"All won opportunities"}}const ICON_LAYER='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',ICON_MERGE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="15" r="2.4"/><path d="M6 8.4V15.6"/><path d="M8.2 6.4C14 6.4 14 12.6 15.8 13.4"/></svg>',ICON_TARGET='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',ICON_LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>',ICON_UNLOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 017.8-1.2"/></svg>',ICON_TAG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 12.7L12.7 20.6a2 2 0 01-2.8 0l-7-7a2 2 0 010-2.8L10.8 3H19a2 2 0 012 2v7.7z"/><circle cx="15" cy="8" r="1.2"/></svg>',ICON_HASH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/></svg>',ICON_EDIT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',ICON_WARNING='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.6 18a1.5 1.5 0 001.3 2.2h16.2a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-3.4 0z"/><path d="M12 9v4"/><path d="M12 16.5h.01"/></svg>';function renderMetricsModelPanel(e){const t=getMetricsModelLabels(e),n=!e.metricsModelSetAt||metricsModelChangeMode,a=n?" is-wizard":" is-locked",o=e.dedupeEnabled?"dedupe":e.winPipelineId?"pipeline":"simple",r=e.metricsModelLockedAt?`Locked since ${new Date(e.metricsModelLockedAt).toLocaleDateString("en-GB")}`:"Editable until first successful sync",s=e.metricsModelLockedAt?"metrics-model-badge is-locked":"metrics-model-badge";return n?`
    <div class="metrics-model-panel${a}">
      <div class="metrics-model-header">
        <div class="metrics-model-heading">
          <h3 class="metrics-model-title">${metricsModelChangeMode?"Change metrics model":"Metrics model"}</h3>
        </div>
      </div>
      <p class="metrics-model-copy">How should wins and revenue be counted for this client?</p>
      <div class="metrics-option-cards">
        <label class="metrics-option-card">
          <input type="radio" name="metrics-model-type" value="simple" ${o==="simple"?"checked":""} onchange="onMetricsModelTypeChange()" />
          <span class="metrics-option-card-top">
            <span class="metrics-option-card-icon">${ICON_LAYER}</span>
            <span class="metrics-option-card-title">Simple</span>
            <span class="metrics-option-card-radio">${ICON_CHECK}</span>
          </span>
          <span class="metrics-option-card-desc">Every won deal counts, from any pipeline. For clients without duplicate opportunities.</span>
        </label>
        <label class="metrics-option-card">
          <input type="radio" name="metrics-model-type" value="dedupe" ${o==="dedupe"?"checked":""} onchange="onMetricsModelTypeChange()" />
          <span class="metrics-option-card-top">
            <span class="metrics-option-card-icon">${ICON_MERGE}</span>
            <span class="metrics-option-card-title">Funnel + dedup</span>
            <span class="metrics-option-card-radio">${ICON_CHECK}</span>
          </span>
          <span class="metrics-option-card-desc">Wins count from one win pipeline only (e.g. Eftersalg). Duplicates are merged by contact.</span>
        </label>
      </div>
      <div class="metrics-model-win-select" id="metrics-win-pipeline-wrap" style="${o==="dedupe"?"":"display:none"}">
        ${renderPipelineSelect("metrics-win-pipeline","Win pipeline (required)",e.winPipelineId||e.afterSalesPipelineId,setupPipelines)}
      </div>
      ${metricsModelChangeMode?`
        <div class="metrics-confirm-strip">
          <div class="metrics-confirm-strip-title">${ICON_WARNING} Applying this recalculates revenue, clients won and all charts</div>
          <div class="metrics-confirm-strip-row">
            <label class="metrics-confirm-check">
              <input id="metrics-acknowledge-impact" type="checkbox" onchange="updateMetricsApplyState()" />
              <span>I understand the numbers will change</span>
            </label>
            <input id="metrics-confirm-slug" type="text" placeholder="Type ${CLIENT_SLUG} to confirm" autocomplete="off" oninput="updateMetricsApplyState()" />
          </div>
        </div>
      `:""}
      <div class="metrics-model-actions">
        ${metricsModelChangeMode?'<button class="admin-btn" type="button" onclick="cancelMetricsModelChange()">Cancel</button>':""}
        <button
          id="metrics-apply-btn"
          class="admin-btn ${metricsModelChangeMode?"admin-btn--danger-solid":"admin-btn--primary"}"
          type="button"
          onclick="saveMetricsModel()"
          ${metricsModelChangeMode?"disabled":""}
        >
          ${ICON_CHECK} ${metricsModelChangeMode?"Apply change":"Save metrics model"}
        </button>
      </div>
    </div>
  `:`
      <div class="metrics-model-panel is-locked">
        <div class="metrics-model-header">
          <div class="metrics-model-heading">
            <h3 class="metrics-model-title">Metrics model</h3>
          </div>
          <span class="${s}">${e.metricsModelLockedAt?ICON_LOCK:ICON_UNLOCK} ${e.metricsModelLockedAt?"Locked":"Editable"}</span>
        </div>
        <p class="metrics-model-copy">
          Defines how clients won, revenue, Bundlinje, ROAS, and won-revenue charts are calculated.
        </p>
        <div class="metrics-model-facts">
          <div class="metrics-model-fact is-config">
            <span class="metrics-model-fact-icon">${ICON_TAG}</span>
            <div class="metrics-model-fact-body">
              <div class="metrics-model-fact-label">Model</div>
              <div class="metrics-model-fact-value">${t.typeLabel}</div>
            </div>
          </div>
          <div class="metrics-model-fact is-config">
            <span class="metrics-model-fact-icon">${ICON_TARGET}</span>
            <div class="metrics-model-fact-body">
              <div class="metrics-model-fact-label">Win source</div>
              <div class="metrics-model-fact-value">${t.winLabel}</div>
            </div>
          </div>
          <div class="metrics-model-fact">
            <span class="metrics-model-fact-icon">${e.metricsModelLockedAt?ICON_LOCK:ICON_UNLOCK}</span>
            <div class="metrics-model-fact-body">
              <div class="metrics-model-fact-label">Status</div>
              <div class="metrics-model-fact-value">${r}</div>
            </div>
          </div>
          <div class="metrics-model-fact">
            <span class="metrics-model-fact-icon">${ICON_HASH}</span>
            <div class="metrics-model-fact-body">
              <div class="metrics-model-fact-label">Version</div>
              <div class="metrics-model-fact-value">v${e.metricsModelVersion||1}</div>
            </div>
          </div>
        </div>
        <div class="metrics-model-actions">
          <button class="admin-btn" type="button" onclick="startMetricsModelChange()">${ICON_EDIT} Change metrics model</button>
        </div>
      </div>
    `}function updateMetricsApplyState(){const e=document.getElementById("metrics-apply-btn");if(!e||!metricsModelChangeMode)return;const t=!!document.getElementById("metrics-acknowledge-impact")?.checked,n=document.getElementById("metrics-confirm-slug")?.value?.trim()||"";e.disabled=!(t&&n===CLIENT_SLUG)}function onMetricsModelTypeChange(){const e=document.querySelector('input[name="metrics-model-type"]:checked')?.value,t=document.getElementById("metrics-win-pipeline-wrap");t&&(t.style.display=e==="dedupe"?"":"none")}async function saveMetricsModel(){const t=(document.querySelector('input[name="metrics-model-type"]:checked')?.value||"simple")==="dedupe",n=t&&document.getElementById("metrics-win-pipeline")?.value||null;if(t&&!n){showToast("Select a win pipeline for deduplication mode.","error");return}const a={dedupeEnabled:t,winPipelineId:n,afterSalesPipelineId:t?n:void 0};metricsModelChangeMode&&(a.confirmSlug=document.getElementById("metrics-confirm-slug")?.value?.trim()||"",a.acknowledgeImpact=!!document.getElementById("metrics-acknowledge-impact")?.checked);try{await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}/metrics-model`,{method:"POST",body:JSON.stringify(a)}),metricsModelChangeMode=!1,showToast("Metrics model saved","success"),await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0,{background:!0})}catch(o){showToast(o.message,"error")}}function startMetricsModelChange(){if(metricsModelChangeMode=!0,setupAccount){const e=document.getElementById("setup-panel-mount");e&&(e.innerHTML=renderClientSetupPanel(setupAccount))}}function cancelMetricsModelChange(){if(metricsModelChangeMode=!1,setupAccount){const e=document.getElementById("setup-panel-mount");e&&(e.innerHTML=renderClientSetupPanel(setupAccount))}}function renderPipelineSelect(e,t,n,a,o=""){return`
    <div class="field-group">
      <label for="${e}">${t}</label>
      <select id="${e}">
        <option value="">\u2014 Select pipeline \u2014</option>
        ${a.map(r=>`
          <option value="${esc(r.id)}" ${r.id===n?"selected":""}>${esc(r.name)}</option>
        `).join("")}
      </select>
      ${o?`<p class="field-hint">${esc(o)}</p>`:""}
    </div>
  `}function getSetupProgressSteps(e){return[{id:"metrics",label:"Metrics",done:!!e.metricsModelSetAt},{id:"ghl",label:"GHL",done:!!(e.hasGhlToken&&e.locationId)},{id:"pipelines",label:"Pipelines",done:!!(e.newLeadsPipelineId&&e.salesPipelineId)},{id:"meta",label:"Meta",done:e.metaSyncStatus==="ok",partial:!!(e.metaAdAccountId&&e.metaSyncStatus!=="ok")}]}function renderSetupProgressStrip(e){const t=getSetupProgressSteps(e),n='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';return`
    <nav class="setup-progress" aria-label="Setup progress">
      ${t.map((a,o)=>{const r=a.done?" is-done":a.partial?" is-partial":"",s=a.done?`<span class="setup-progress-mark">${n}</span>`:`<span class="setup-progress-mark">${o+1}</span>`;return`
          <button type="button" class="setup-progress-step${r}" onclick="scrollToSetupSection('${a.id}')">
            ${s}
            <span class="setup-progress-label">${a.label}</span>
          </button>
        `}).join("")}
    </nav>
  `}function scrollToSetupSection(e){const t=document.getElementById(`setup-section-${e}`);t&&t.scrollIntoView({behavior:"smooth",block:"start"})}function renderMetaSetupSection(e){return`
      <div class="setup-section" id="setup-section-meta">
        <div class="setup-section-info">
          <div class="setup-section-title">Meta / Facebook connection</div>
          <div class="setup-section-status">
            <span class="status-badge status-${e.metaSyncStatus==="ok"?"ready":e.metaSyncStatus==="error"?"sync_error":"needs_sync"}">${e.metaSyncStatus==="ok"?"Meta synced":e.metaSyncStatus==="error"?"Meta sync error":"Meta not synced"}</span>
            ${e.metaLastSyncedAt?`<span class="setup-section-sync-time">Last Meta sync: ${formatRelativeSync(e.metaLastSyncedAt)}</span>`:""}
            <a class="setup-section-sync-time" href="/admin/sync-history/meta" style="margin-left:12px">View Meta sync log \u2192</a>
            <a class="setup-section-sync-time" href="/admin/sync-history/meta-reports" style="margin-left:12px">View Meta report sync log \u2192</a>
            ${e.metaSyncError?`<span class="setup-meta-sync-error">${esc(e.metaSyncError)}</span>`:""}
          </div>
        </div>
        <div class="setup-section-content">
          <div class="setup-grid setup-grid--2">
            <div class="field-group">
              <label for="setup-meta-ad-account-id">Meta Ad Account ID (required for sync)</label>
              <input id="setup-meta-ad-account-id" type="text" value="${e.metaAdAccountId||""}" placeholder="154139302 or act_154139302" />
            </div>
            <div class="field-group">
              <label for="setup-facebook-client-id">Facebook metrics client key</label>
              <input id="setup-facebook-client-id" type="text" value="${e.facebookClientId||e.clientId||""}" placeholder="${esc(e.clientId)}" />
            </div>
            <div class="field-group">
              <label for="setup-meta-page-id">Meta Page ID (optional)</label>
              <input id="setup-meta-page-id" type="text" value="${e.metaPageId||""}" />
            </div>
            <div class="field-group">
              <label for="setup-meta-pixel-id">Meta Pixel ID (optional)</label>
              <input id="setup-meta-pixel-id" type="text" value="${e.metaPixelId||""}" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <div class="field-label-row">
                <label for="setup-meta-system-token">Meta System User token (override \u2014 usually leave blank)</label>
                ${e.hasEnvMetaSystemUserToken?'<span class="token-status-ok">Vercel env token set</span>':'<span class="token-status-warn">No META_SYSTEM_USER_TOKEN on server</span>'}
                ${e.hasSavedMetaSystemUserToken?'<span class="token-status-warn">Saved override in DB</span>':""}
              </div>
              <input id="setup-meta-system-token" type="password" placeholder="${e.hasSavedMetaSystemUserToken?"Leave blank to use Vercel env and clear saved override":"Uses META_SYSTEM_USER_TOKEN on Vercel when blank"}" autocomplete="off" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <div class="field-label-row">
                <label for="setup-meta-page-token">Meta Page access token (optional)</label>
                ${e.hasMetaPageAccessToken?'<span class="token-status-ok">Token configured</span>':""}
              </div>
              <input id="setup-meta-page-token" type="password" placeholder="${e.hasMetaPageAccessToken?"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022  (saved \u2014 leave blank to keep)":"For lead sync"}" autocomplete="off" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label class="setup-ready-toggle">
                <input id="setup-fb-lead-sync-enabled" type="checkbox" ${e.fbLeadSyncEnabled?"checked":""} />
                <span>Enable automatic FB lead ID sync</span>
              </label>
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label for="setup-ghl-fb-lead-field-id">GHL Fb Lead id field (optional override)</label>
              <input id="setup-ghl-fb-lead-field-id" type="text" value="${esc(e.ghlFbLeadFieldId||"")}" placeholder="Auto-detects a contact field named Fb Lead id" />
              <p class="field-hint" style="margin-top:8px;font-size:12px;color:var(--text-muted);line-height:1.5">
                Each GHL sub-account needs a <strong>contact</strong> custom field named <code>Fb Lead id</code>
                (Settings \u2192 Custom Fields \u2192 Contact). Leave blank to auto-detect by name on sync.
              </p>
            </div>
          </div>
          <div class="setup-actions-inline">
            <button class="admin-btn admin-btn--secondary" type="button" onclick="syncMetaMetricsClient('${CLIENT_SLUG}')">${ICON_SYNC} Sync Meta metrics</button>
            ${e.hasSavedMetaSystemUserToken?`<button class="admin-btn admin-btn--ghost" type="button" onclick="clearMetaSystemUserToken('${CLIENT_SLUG}')">Clear saved token override</button>`:""}
          </div>
        </div>
      </div>
  `}function renderClientSetupPanel(e){if(!IS_ADMIN_CLIENT||!e)return"";const t=e.metricsModelSetAt?"":" is-disabled";return`
    <div class="setup-panel">
      <nav class="admin-breadcrumb">
        <a href="/admin">Admin</a> / ${esc(e.accountName)}
      </nav>
      <div class="setup-panel-header">
        <div class="setup-panel-identity">
          <span class="setup-avatar" aria-hidden="true">${esc(clientInitials(e.accountName))}</span>
          <div>
            <h2>${esc(e.accountName)}</h2>
            <div class="setup-meta">
              <span class="status-badge status-${e.status}">${statusLabel(e.status)}</span>
              <span class="setup-meta-divider">\xB7</span>
              <span>${formatRelativeSync(e.lastSyncAt)}</span>
            </div>
          </div>
        </div>
        ${renderCardMenu(CLIENT_SLUG,e.accountName)}
      </div>
      ${renderSetupProgressStrip(e)}

      <div class="setup-section setup-section--display" id="setup-section-display">
        <div class="setup-section-info">
          <div class="setup-section-title">Dashboard display</div>
        </div>
        <div class="setup-section-content">
          <div class="setup-grid setup-grid--2">
            <div class="field-group" style="grid-column:1/-1">
              <label for="setup-account-name">Dashboard heading</label>
              <input id="setup-account-name" type="text" value="${esc(e.accountName||"")}" placeholder="e.g. ML Tagd\xE6kning" />
            </div>
          </div>
        </div>
      </div>

      <div id="setup-section-metrics">
        ${renderMetricsModelPanel(e)}
      </div>

      <div class="setup-section${t}" id="setup-section-ghl">
        <div class="setup-section-info">
          <div class="setup-section-title">GHL connection</div>
          <div class="setup-section-status">
            <span class="status-badge status-${e.status}">${statusLabel(e.status)}</span>
            ${e.lastSyncAt?`<span class="setup-section-sync-time">Last GHL sync: ${formatRelativeSync(e.lastSyncAt,e.status)}</span>`:""}
          </div>
        </div>
        <div class="setup-section-content">
          <div class="setup-grid setup-grid--2">
            <div class="field-group">
              <label for="setup-location-id">Location ID</label>
              <input id="setup-location-id" type="text" value="${e.locationId||""}" />
            </div>
            <div class="field-group">
              <label for="setup-timezone">Timezone</label>
              <input id="setup-timezone" type="text" value="${e.timezone||"Europe/Copenhagen"}" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <div class="field-label-row">
                <label for="setup-ghl-token">GHL token</label>
                ${e.hasGhlToken?'<span class="token-status-ok">Token configured</span>':""}
              </div>
              <input id="setup-ghl-token" type="password" placeholder="${e.hasGhlToken?"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022  (saved \u2014 leave blank to keep)":"Paste private integration token"}" autocomplete="off" />
            </div>
          </div>
          <div class="setup-actions-inline">
            <button class="admin-btn admin-btn--secondary" type="button" data-sync-label="Sync GHL data" onclick="syncClient('${CLIENT_SLUG}', this)">${ICON_SYNC} Sync GHL data</button>
          </div>
        </div>
      </div>

      <div class="setup-section${t}" id="setup-section-pipelines">
        <div class="setup-section-info">
          <div class="setup-section-title">Pipeline slots</div>
          <div class="setup-section-status">
            <span class="status-badge status-${setupPipelines.length?"ready":"needs_sync"}">${setupPipelines.length?`${setupPipelines.length} pipeline(s) loaded`:"Pipelines not fetched"}</span>
          </div>
        </div>
        <div class="setup-section-content">
          <div class="setup-grid setup-grid--3">
            ${renderPipelineSelect("setup-new-leads","New leads (required)",e.newLeadsPipelineId,setupPipelines)}
            ${renderPipelineSelect("setup-sales","Sales (required)",e.salesPipelineId,setupPipelines)}
            ${renderPipelineSelect("setup-after-sales","After-sales (optional)",e.afterSalesPipelineId,setupPipelines,"Leave empty if there is no after-sales pipeline.")}
          </div>
          <div class="setup-actions-inline">
            <button class="admin-btn admin-btn--secondary" type="button" data-sync-label="Fetch pipelines from GHL" onclick="fetchSetupPipelines(false, this)">${ICON_SYNC} Fetch pipelines from GHL</button>
          </div>
        </div>
      </div>

      ${renderMetaSetupSection(e)}

      <div class="setup-actions setup-actions--sticky${t}">
        <div class="setup-actions-group">
          <a class="admin-btn" href="/${encodeURIComponent(CLIENT_SLUG)}" target="_blank" rel="noopener noreferrer">${ICON_CHART} Open dashboard</a>
        </div>
        <div class="setup-save-group">
          <p class="setup-save-hint">Changes apply when you click Save changes.</p>
          <label class="setup-ready-toggle">
            <input id="setup-ready-ghl" type="checkbox" ${e.readyForGhl?"checked":""} />
            <span>Ready for GHL iframe</span>
          </label>
          <button class="admin-btn admin-btn--primary" type="button" onclick="saveSetupAccount()">${ICON_CHECK} Save changes</button>
        </div>
      </div>
    </div>
  `}function accountCanPreviewDashboard(e){return e?!!(e.hasGhlToken||e.lastSyncAt):!1}function renderAdminSetupPlaceholder(){return`
    <div class="note admin-setup-placeholder">
      Save a GHL token and location ID above, then sync to preview dashboard data here.
    </div>
  `}function renderAdminClientShell(){const e=document.getElementById("dashboard"),t={pipelines:[],statuses:[],sources:[],assignees:[],dateFields:[]};e.innerHTML=`
    ${renderBrandTopbar(`${renderStaffAdminChrome("clients")}<a class="admin-topbar-link" href="/admin">Clients</a>`)}
    ${wrapDashboardShell(`
    <div id="setup-panel-mount">
      <div class="loading-state" style="padding:24px">
        <div class="spinner"></div>
        Loading setup...
      </div>
    </div>
    <details class="panel admin-preview-section">
      <summary>${ICON_CHART} Dashboard preview <span style="color:var(--text-soft);font-weight:500">\xB7 advanced filters</span><span class="summary-chevron">${ICON_CHEVRON}</span></summary>
      ${renderAdminFiltersPanel(t)}
      ${renderAdminDisplayOptions(!1)}
      <div class="content-area" id="dashboard-content">
        ${renderAdminSetupPlaceholder()}
      </div>
    </details>
    `)}
  `}async function initAdminClientPage(){if(await requireStaffAuth()){renderAdminClientShell();try{await loadSetupAccount()}catch(t){const n=document.getElementById("setup-panel-mount");n&&(n.innerHTML=`<div class="note" style="padding:24px">${esc(t.message)}</div>`);return}accountCanPreviewDashboard(setupAccount)&&(ensureChartsVisible(),loadDashboard(!0))}}async function loadSetupAccount(){if(IS_ADMIN_CLIENT)try{setupAccount=(await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}`)).account,setupAccount.accessKey&&!CLIENT_ACCESS_KEY&&(CLIENT_ACCESS_KEY=setupAccount.accessKey),setupAccount.newLeadsPipelineId&&!setupPipelines.length&&await fetchSetupPipelines(!0);const t=document.getElementById("setup-panel-mount");t&&(t.innerHTML=renderClientSetupPanel(setupAccount))}catch(e){const t=document.getElementById("setup-panel-mount");throw t&&(t.innerHTML=`<div class="note" style="padding:24px">${esc(e.message)}</div>`),showToast(e.message,"error"),e}}async function fetchSetupPipelines(e=!1,t=null){t&&(t.disabled=!0,t.textContent="Fetching...");try{setupPipelines=(await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}/sync-pipelines`,{method:"POST",body:"{}"})).pipelines||[],e||showToast(`${setupPipelines.length} pipeline(s) loaded`,"success"),await loadSetupAccount()}catch(n){showToast(n.message,"error")}finally{if(t){t.disabled=!1;const n=t.dataset.syncLabel||"Fetch pipelines from GHL";t.innerHTML=`${ICON_SYNC} ${n}`}}}function collectMetaSetupPayload(){const e={metaAdAccountId:document.getElementById("setup-meta-ad-account-id")?.value?.trim()||null,metaPageId:document.getElementById("setup-meta-page-id")?.value?.trim()||null,metaPixelId:document.getElementById("setup-meta-pixel-id")?.value?.trim()||null,facebookClientId:document.getElementById("setup-facebook-client-id")?.value?.trim()||null,fbLeadSyncEnabled:!!document.getElementById("setup-fb-lead-sync-enabled")?.checked,ghlFbLeadFieldId:document.getElementById("setup-ghl-fb-lead-field-id")?.value?.trim()||null},t=document.getElementById("setup-meta-system-token")?.value?.trim();t&&(e.metaSystemUserToken=t);const n=document.getElementById("setup-meta-page-token")?.value?.trim();return n&&(e.metaPageAccessToken=n),e}async function clearMetaSystemUserToken(e){try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"PUT",body:JSON.stringify({clearMetaSystemUserToken:!0})}),showToast("Saved Meta token override cleared \u2014 using Vercel env token","success"),await loadSetupAccount()}catch(t){showToast(t.message,"error")}}async function saveSetupAccount(){try{const e=document.getElementById("setup-account-name")?.value?.trim();if(!e){showToast("Dashboard heading is required.","error");return}const t={accountName:e,locationId:document.getElementById("setup-location-id")?.value?.trim()||null,timezone:document.getElementById("setup-timezone")?.value?.trim()||"Europe/Copenhagen",newLeadsPipelineId:document.getElementById("setup-new-leads")?.value||null,salesPipelineId:document.getElementById("setup-sales")?.value||null,afterSalesPipelineId:document.getElementById("setup-after-sales")?.value||null,readyForGhl:!!document.getElementById("setup-ready-ghl")?.checked,...collectMetaSetupPayload()},n=document.getElementById("setup-ghl-token")?.value?.trim();n&&(t.ghlToken=n),await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}`,{method:"PUT",body:JSON.stringify(t)}),showToast("Account saved","success"),await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0)}catch(e){showToast(e.message,"error")}}async function syncMetaMetricsClient(e){try{const t=collectMetaSetupPayload();if(!t.metaAdAccountId){showToast("Enter a Meta Ad Account ID first.","error");return}showToast("Saving Meta settings and syncing\u2026","info"),document.getElementById("setup-meta-system-token")?.value?.trim()||(t.clearMetaSystemUserToken=!0);const a=await adminFetch(`/api/clients/${encodeURIComponent(e)}/sync-meta`,{method:"POST",body:JSON.stringify(t)});if(a.skipped)showToast(a.reason||"Meta sync skipped","error");else{let o="Meta metrics synced";a.tokenSource&&(o+=` (${a.tokenSource} token)`),a.ignoredAccountOverride&&(o+=" \u2014 cleared invalid saved token override"),showToast(o,"success")}await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0)}catch(t){showToast(t.message,"error"),await loadSetupAccount()}}(function(t){const n=["#ff6a00","#138b53","#0085f2","#dc640a","#833b08","#a07868","#ff9147","#6b5348"],a={open:"#0085f2",won:"#138b53",lost:"#dc640a",abandoned:"#a07868"};function o(m){const f=String(m).match(/^(\d{4})-W(\d{2})$/);if(!f)return null;const v=Number(f[1]),$=Number(f[2]),w=new Date(Date.UTC(v,0,4)),S=w.getUTCDay()||7,C=new Date(w);C.setUTCDate(w.getUTCDate()-S+1);const E=new Date(C);E.setUTCDate(C.getUTCDate()+($-1)*7);const I=new Date(E);return I.setUTCDate(E.getUTCDate()+3),{monday:new Date(E.getUTCFullYear(),E.getUTCMonth(),E.getUTCDate()),thursday:new Date(I.getUTCFullYear(),I.getUTCMonth(),I.getUTCDate())}}function r(m){let f=0;for(let v=1;v<=m.getDate();v+=1)new Date(m.getFullYear(),m.getMonth(),v).getDay()===1&&(f+=1);return f}function s(m){const f=o(m);if(!f)return String(m).replace("-W"," W");const v=f.monday,$=v.toLocaleDateString("da-DK",{month:"short"}).replace(".","").replace(/^\w/u,S=>S.toUpperCase()),w=r(v);return`${$} W${w}`}function i(m){const[f,v]=String(m).split("-");return new Date(Number(f),Number(v)-1,1).toLocaleDateString("da-DK",{month:"short",year:"2-digit"})}function l(m,f=18){const v=String(m);return v.length>f?`${v.slice(0,f-1)}\u2026`:v}function c(){return{text:"#1a1208",muted:"#6b5348",grid:"rgba(26, 18, 8, 0.1)",border:"#e8e0d8",tooltipBg:"#ffffff",tooltipBorder:"#e8e0d8",tooltipText:"#1a1208"}}function d(m,f,v,$){return{labels:m.map(w=>$(w[f])),values:m.map(w=>Number(w[v])||0)}}function u(m){const f=Number(m)||0;return f>=1e6?`${(f/1e6).toFixed(1)}M`:f>=1e3?`${Math.round(f/1e3)}K`:f}function p(m){const f=new Map((m.monthlyAdSpend||[]).map(w=>[w.month,Number(w.spend)||0])),v=new Map((m.monthlyRevenue||[]).map(w=>[w.month,Number(w.revenue)||0])),$=[...new Set([...f.keys(),...v.keys()])].sort();return{dualAxis:!0,labels:$.map(w=>i(w)),spendValues:$.map(w=>f.get(w)||0),revenueValues:$.map(w=>v.get(w)||0)}}function h(m,f,v){const $=f.spendValues.some(w=>w>0)||f.revenueValues.some(w=>w>0);return!f.labels.length||!$?null:{type:"bar",data:{labels:f.labels,datasets:[{type:"bar",label:"Ad Spend",data:f.spendValues,backgroundColor:"#ff6a00cc",borderColor:"#ff6a00",borderWidth:2,borderRadius:6,maxBarThickness:42,yAxisID:"y",order:2},{type:"line",label:"Won Revenue",data:f.revenueValues,backgroundColor:"#138b5333",borderColor:"#138b53",borderWidth:2.5,fill:!0,tension:.35,pointRadius:4,pointHoverRadius:6,yAxisID:"y1",order:1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"bottom",align:"center",labels:{color:v.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:v.tooltipBg,borderColor:v.tooltipBorder,borderWidth:1,titleColor:v.tooltipText,bodyColor:v.muted,padding:12,callbacks:{label(w){const S=w.parsed.y??0;return`${w.dataset.label}: Dkr ${Math.round(S).toLocaleString("da-DK")}`}}}},scales:{x:{ticks:{color:v.muted,maxRotation:45,minRotation:0},grid:{color:v.grid},border:{color:v.border}},y:{type:"linear",position:"left",title:{display:!0,text:"Ad Spend (Dkr)",color:"#ff6a00",font:{size:11,weight:"600"}},ticks:{color:"#ff6a00",callback:u},grid:{color:v.grid},border:{color:v.border},beginAtZero:!0},y1:{type:"linear",position:"right",title:{display:!0,text:"Won Revenue (Dkr)",color:"#138b53",font:{size:11,weight:"600"}},ticks:{color:"#138b53",callback:u},grid:{drawOnChartArea:!1},border:{color:v.border},beginAtZero:!0}}}}}const g={weeklyRevenue:{title:"Won Revenue (Weekly)",defaultType:"area",format:"currency",extract(m){return d(m.weeklyRevenue||[],"week","revenue",s)}},monthlyRevenue:{title:"Won Revenue (Monthly)",defaultType:"area",format:"currency",extract(m){return d(m.monthlyRevenue||[],"month","revenue",i)}},weeklyLeads:{title:"New Leads (Weekly)",defaultType:"area",format:"number",extract(m){return d(m.weeklyLeads||[],"week","count",s)}},monthlyLeads:{title:"New Leads (Monthly)",defaultType:"area",format:"number",extract(m){return d(m.monthlyLeads||[],"month","count",i)}},conversionTrend:{title:"Conversion Rate Trend",defaultType:"line",format:"percent",extract(m){return d(m.monthlyConversion||[],"month","rate",i)}},statusBreakdown:{title:"Opportunity Status",defaultType:"doughnut",format:"number",extract(m){const f=m.chartStatusBreakdown||m.statusBreakdown||{},v=["open","won","lost","abandoned"];return{labels:["Open","Won","Lost","Abandoned"],values:v.map($=>Number(f[$])||0),colors:v.map($=>a[$])}}},marketingSpendComparison:{title:"Facebook Ad Spend",defaultType:"area",format:"currency",extract(m){return d((m.monthlyAdSpend||[]).slice(-8),"month","spend",i)}},monthlyCostPerLead:{title:"Cost per Lead (Monthly)",defaultType:"area",format:"currency",extract(m){return d(m.monthlyCostPerLead||[],"month","cpl",i)}}};function b(m,f,v,$){const w=Number(m)||0,S=Array.isArray(v)?v[$]:f;return S==="ratio"?`${w.toFixed(2)}x`:S==="currency"||f==="currency"?`Dkr ${Math.round(w).toLocaleString("da-DK")}`:S==="percent"||f==="percent"?`${w.toFixed(1)}%`:Math.round(w).toLocaleString("da-DK")}function y(m,f,v){const $=g[m];if(!$)return null;const w=$.extract(f),S=c();if(w.dualAxis||v==="dualAxis")return h($,w,S);if(!w.labels?.length||w.values.every(M=>M===0))return null;const C=["pie","doughnut","polarArea"].includes(v),E=w.colors||w.labels.map((M,T)=>n[T%n.length]),I=v==="area"?"line":v==="horizontalBar"?"bar":v,R=`${n[0]}55`,A=v==="doughnut",B={label:$.title,data:w.values,backgroundColor:C?A?E:E.map(M=>`${M}cc`):w.colors?w.colors.map(M=>`${M}cc`):v==="area"?R:`${n[0]}cc`,borderColor:C?E:w.colors||n[0],borderWidth:C?A?0:1:2,fill:v==="area",tension:.35,borderRadius:C?0:6,maxBarThickness:42,...A?{cutout:"62%",borderAlign:"inner"}:{}};return{type:I,data:{labels:w.labels,datasets:[B]},options:{responsive:!0,maintainAspectRatio:A?!1:C,indexAxis:v==="horizontalBar"?"y":"x",plugins:{legend:{display:C,position:"bottom",align:"center",labels:{color:S.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:S.tooltipBg,borderColor:S.tooltipBorder,borderWidth:1,titleColor:S.tooltipText,bodyColor:S.muted,padding:12,callbacks:{label(M){const T=M.parsed,L=typeof T=="object"?T.y??T.x??0:T??0;return`${M.label}: ${b(L,$.format,w.valueFormats,M.dataIndex)}`}}}},...A?{layout:{padding:8},devicePixelRatio:typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1,elements:{arc:{borderAlign:"inner"}}}:{},scales:C?{}:{x:{ticks:{color:S.muted,maxRotation:45,minRotation:0},grid:{color:S.grid},border:{color:S.border}},y:{ticks:{color:S.muted,callback(M,T){return $.format==="mixed"&&w.valueFormats?.[T]==="ratio"?`${Number(M).toFixed(2)}x`:$.format==="currency"||w.valueFormats?.[T]==="currency"?M>=1e6?`${(M/1e6).toFixed(1)}M`:M>=1e3?`${Math.round(M/1e3)}K`:M:$.format==="percent"?`${M}%`:M}},grid:{color:S.grid},border:{color:S.border},beginAtZero:!0}}}}}t.DashboardCharts={CHART_DEFINITIONS:g,buildChartConfig:y,formatTooltipValue:b}})(window);const STORAGE_KEY=`cenhub_display_${CLIENT_SLUG}`,LEGACY_STORAGE_KEY="suntech-dashboard-display",PIPELINE_KEY="suntech-dashboard-pipelines",DISPLAY_OPTIONS={kpis:{totalRevenue:"Total Revenue",adSpend:"Ad Spend",roas:"ROAS",roasDk:"ROAS (DK)",poas:"POAS",poasDk:"POAS (DK)",costPerLead:"Cost per Lead",costPerWonClient:"Cost per Won Client",clientsWon:"Clients Won",totalLeads:"Total Leads",totalLeadsValue:"Total Leads Value",averageLeadValue:"Average Lead Value",conversionRate:"Conversion Rate",totalBundlinje:"Total Bundlinje",openLeads:"Open Leads",openPipelineValue:"Open Pipeline Value",averageWonDealSize:"Avg Won Deal Size"},sections:{statusBreakdown:"Opportunity Status (Cards)",sourceReport:"Lead Source Report",assigneeReport:"Leads Closed by Assignee",pipelineBreakdown:"Pipeline Breakdown"},charts:{weeklyRevenue:"Won Revenue (Weekly)",monthlyRevenue:"Won Revenue (Monthly)",marketingSpendComparison:"Facebook Ad Spend",monthlyCostPerLead:"Cost per Lead (Monthly)",weeklyLeads:"New Leads (Weekly)",monthlyLeads:"New Leads (Monthly)",conversionTrend:"Conversion Rate Trend",statusBreakdown:"Opportunity Status"},statusItems:{open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned"},columns:{sourceReport:{totalLeads:"Total leads",totalValue:"Total values",open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned",winPct:"Win %"},assigneeReport:{won:"Won",totalLeads:"Total leads",wonValue:"Won revenue",totalValue:"Total value"},pipelineBreakdown:{count:"Leads",won:"Won",monetary:"Value",profit:"Bundlinje",wonValue:"Won revenue"}}},state={pipelineIds:usesClientPipelineDefaults()?[]:loadPipelineSelection(),status:"all",source:"all",assignedTo:"all",dateField:"createdAt",dateFrom:"",dateTo:"",adSpend:"",preset:"all"};let cachedData=null,cachedFacebookMetrics=null,cachedMonthlyAdSpend=null,availablePipelines=[],display=loadDisplayPrefs(),pipelineDefaultsApplied=!1,chartInstances={},chartFieldsCache=null,chartFieldsCacheKey=null,lastFetchedAt=0;const DATA_REFRESH_MS=120*1e3,DATA_FRESH_MS=DATA_REFRESH_MS,CHART_FIELD_KEYS=["weeklyRevenue","monthlyRevenue","weeklyLeads","monthlyLeads","monthlyLeadsValue","monthlyConversion","chartStatusBreakdown"];function getChartCacheKey(){return[[...state.pipelineIds].sort().join(","),state.status,state.source,state.assignedTo,state.dateField,state.dateFrom||"",state.dateTo||""].join("|")}function cacheChartFields(e){chartFieldsCache={},CHART_FIELD_KEYS.forEach(t=>{e[t]!==void 0&&(chartFieldsCache[t]=e[t])}),chartFieldsCacheKey=getChartCacheKey()}function applyChartFieldsCache(e){if(!!!(state.dateFrom||state.dateTo))return cacheChartFields(e),e;if(chartFieldsCache&&chartFieldsCacheKey===getChartCacheKey()){const n={...e};return CHART_FIELD_KEYS.forEach(a=>{chartFieldsCache[a]!==void 0&&(n[a]=chartFieldsCache[a])}),n}return cacheChartFields(e),e}function getDefaultChartPrefs(){const e={};return(window.DashboardCharts?Object.keys(DashboardCharts.CHART_DEFINITIONS):Object.keys(DISPLAY_OPTIONS.charts)).forEach(n=>{e[n]=!0}),e}function destroyCharts(){Object.values(chartInstances).forEach(e=>e.destroy()),chartInstances={}}function mountCharts(e){typeof Chart>"u"||!window.DashboardCharts||(destroyCharts(),Object.keys(DashboardCharts.CHART_DEFINITIONS).forEach(t=>{if(!isVisible("charts",t))return;const n=DashboardCharts.CHART_DEFINITIONS[t],a=document.getElementById(`chart-${t}`);if(!a)return;const r=a.closest(".chart-card")?.querySelector(".chart-empty"),s=n?.defaultType||"bar",i=DashboardCharts.buildChartConfig(t,e,s);if(!i){a.style.display="none",r&&(r.style.display="block");return}a.style.display="block",r&&(r.style.display="none"),chartInstances[t]=new Chart(a,i)}))}function usesClientPipelineDefaults(){return IS_CLIENT_VIEW||IS_ADMIN}function getPipelineStorageKey(){return`cenhub_pipelines_${facebookClientId||CLIENT_SLUG}`}function loadPipelineSelection(){try{const e=JSON.parse(localStorage.getItem(getPipelineStorageKey())||"[]");return Array.isArray(e)?e:[]}catch{return[]}}function getAllPipelineIds(e){return e.map(t=>t.id)}function getDefaultPipelineIds(e,t=[]){const n=getAllPipelineIds(e),a=(t||[]).filter(o=>n.includes(o));return a.length?a:n.length?n:[]}function ensurePipelineDefaults(e,t=[]){if(!e.length)return;if(usesClientPipelineDefaults()){state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0;return}const n=getAllPipelineIds(e);let a=loadPipelineSelection();if(!a.length)try{a=JSON.parse(localStorage.getItem(PIPELINE_KEY)||"[]")}catch{a=[]}!a.length||!pipelineDefaultsApplied?(a.length?(state.pipelineIds=a.filter(o=>n.includes(o)),state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t))):state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0,savePipelineSelection()):state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t),savePipelineSelection())}function ensurePipelineSelectionBeforeFetch(){return state.pipelineIds.length?!0:availablePipelines.length?(state.pipelineIds=getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds),state.pipelineIds.length&&!usesClientPipelineDefaults()&&savePipelineSelection(),state.pipelineIds.length>0):!1}function savePipelineSelection(){localStorage.setItem(getPipelineStorageKey(),JSON.stringify(state.pipelineIds))}function isPipelineSelected(e){return state.pipelineIds.includes(e)}function isAllPipelinesSelected(e){const t=getAllPipelineIds(e);return t.length>0&&t.every(n=>state.pipelineIds.includes(n))}function selectAllPipelines(e){state.pipelineIds=getAllPipelineIds(e),savePipelineSelection()}function clearPipelineSelection(){state.pipelineIds=[],savePipelineSelection()}function setPipelineSelection(e){state.pipelineIds=[...new Set(e)],savePipelineSelection()}function togglePipelineSelection(e){isPipelineSelected(e)?state.pipelineIds=state.pipelineIds.filter(t=>t!==e):state.pipelineIds=[...state.pipelineIds,e],savePipelineSelection()}function formatSelectedPipelines(e){return state.pipelineIds.length?isAllPipelinesSelected(e)?"All pipelines":state.pipelineIds.map(t=>e.find(n=>n.id===t)?.name||t).join(", "):"None selected"}function renderPipelineChips(e){return state.pipelineIds.length?`
    <div class="pipeline-chips">
      ${state.pipelineIds.map(n=>e.find(a=>a.id===n)).filter(Boolean).map(n=>`
        <span class="pipeline-chip">${esc(n.name)}</span>
      `).join("")}
    </div>
  `:'<div class="pipeline-warning">Select at least one pipeline, then click Apply data filters.</div>'}function defaultDisplayPrefs(){const e={kpis:{},sections:{},charts:getDefaultChartPrefs(),statusItems:{},columns:{}};return Object.keys(DISPLAY_OPTIONS.kpis).forEach(t=>{e.kpis[t]=!0}),Object.keys(DISPLAY_OPTIONS.sections).forEach(t=>{e.sections[t]=!0}),Object.keys(DISPLAY_OPTIONS.charts).forEach(t=>{e.charts[t]=!0}),Object.keys(DISPLAY_OPTIONS.statusItems).forEach(t=>{e.statusItems[t]=!0}),Object.entries(DISPLAY_OPTIONS.columns).forEach(([t,n])=>{e.columns[t]={},Object.keys(n).forEach(a=>{e.columns[t][a]=!0})}),e}function loadDisplayPrefs(){if(IS_CLIENT_VIEW&&!IS_PREVIEW)return defaultDisplayPrefs();try{const e=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY)||"null");if(!e)return defaultDisplayPrefs();const t=defaultDisplayPrefs();return{kpis:{...t.kpis,...e.kpis},sections:{...t.sections,...e.sections},charts:{...t.charts,...e.charts},statusItems:{...t.statusItems,...e.statusItems},columns:{sourceReport:{...t.columns.sourceReport,...e.columns?.sourceReport||{}},assigneeReport:{...t.columns.assigneeReport,...e.columns?.assigneeReport||{}},pipelineBreakdown:{...t.columns.pipelineBreakdown,...e.columns?.pipelineBreakdown||{}}}}}catch{return defaultDisplayPrefs()}}function ensureChartsVisible(){const e=Object.keys(DISPLAY_OPTIONS.charts);e.some(n=>display.charts[n]!==!1)||(e.forEach(n=>{display.charts[n]=!0}),saveDisplayPrefs())}function saveDisplayPrefs(){localStorage.setItem(STORAGE_KEY,JSON.stringify(display))}function isVisible(e,t,n){return e==="columns"?display.columns[n]?.[t]!==!1:display[e]?.[t]!==!1}function toggleDisplay(e,t,n){e==="columns"?display.columns[n][t]=!display.columns[n][t]:display[e][t]=!display[e][t],saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}function setAllDisplay(e,t,n){e==="columns"?Object.keys(DISPLAY_OPTIONS.columns[n]).forEach(a=>{display.columns[n][a]=t}):Object.keys(DISPLAY_OPTIONS[e]).forEach(a=>{display[e][a]=t}),saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}const fmt=e=>new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0)),fmtCompact=e=>{const t=Number(e)||0;return t>=1e6?`${(t/1e6).toFixed(2)}M`:t>=1e3?`${(t/1e3).toFixed(2)}K`:fmt(t)},fmtPct=e=>`${(Number(e)||0).toFixed(2)}%`,fmtRoas=e=>{const t=Number(e)||0;return t>0?`${t.toFixed(2)}x`:"\u2014"};function formatActiveDateFilter(e){if(!e.dateFrom&&!e.dateTo)return"Till date";const t=getDashboardTimeZone();if(window.MarketingMetrics?.formatShortDateLabel){const n=window.MarketingMetrics.formatShortDateLabel(e.dateFrom,t),a=window.MarketingMetrics.formatShortDateLabel(e.dateTo,t);if(n&&a)return`${n} \u2013 ${a}`}return`${e.dateFrom||"start"} to ${e.dateTo||"now"}`}function showDateRangeError(e){document.querySelectorAll("#date-range-error").forEach(t=>{t.textContent=e,t.hidden=!e})}function clearDateRangeError(){showDateRangeError("")}function needsFreshData(){return!lastFetchedAt||Date.now()-lastFetchedAt>DATA_FRESH_MS}function buildQuery(e,t={}){const n=new URLSearchParams,a=getAllPipelineIds(e||[]),o=state.pipelineIds.filter(r=>a.includes(r));if(!o.length)throw new Error("Select at least one pipeline.");return n.set("pipelineIds",o.join(",")),state.dateField&&n.set("dateField",state.dateField),state.dateFrom&&n.set("dateFrom",state.dateFrom),state.dateTo&&n.set("dateTo",state.dateTo),["status","source","assignedTo","adSpend"].forEach(r=>{state[r]&&state[r]!=="all"&&n.set(r,state[r])}),appendTenantParams(n),t.forceFresh&&n.set("fresh","1"),n.toString()}function formatDateInput(e){const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${a}`}function getDashboardTimeZone(){return cachedData?.account?.timezone||"Europe/Copenhagen"}function getCalendarPartsInTimeZone(e,t=new Date){const n=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(t);return{year:Number(n.find(a=>a.type==="year")?.value),month:Number(n.find(a=>a.type==="month")?.value),day:Number(n.find(a=>a.type==="day")?.value)}}function formatMonthDateRange(e,t){const n=`${e}-${String(t).padStart(2,"0")}-01`,a=new Date(e,t,0).getDate(),o=`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`;return{start:n,end:o}}const datePickerState={inputId:null,anchorEl:null,viewYear:null,viewMonth:null};let datePickerListenersBound=!1;function isoFromParts(e,t,n){const a=Number(n);return!e||!t||!Number.isFinite(a)?"":`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`}function formatPickerDisplayLabel(e,t){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return t;const n=getDashboardTimeZone();return window.MarketingMetrics?.formatShortDateLabel&&window.MarketingMetrics.formatShortDateLabel(e,n)||e}function ensureDatePickerPopover(){if(document.getElementById("date-picker-popover"))return;const e=document.createElement("div");e.id="date-picker-backdrop",e.className="date-picker-backdrop",e.hidden=!0,e.addEventListener("click",closeDatePicker),document.body.appendChild(e);const t=document.createElement("div");t.id="date-picker-popover",t.className="date-picker-popover",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),document.body.appendChild(t)}function syncDatePickerDisplays(){[{id:"dateFrom",key:"dateFrom",placeholder:"Pick start date"},{id:"dateTo",key:"dateTo",placeholder:"Pick end date"}].forEach(({id:e,key:t,placeholder:n})=>{const a=document.getElementById(e),o=document.getElementById(`${e}-display`),r=document.getElementById(`${e}-trigger`),s=state[t]??"";a&&(a.value=s),o&&(o.textContent=formatPickerDisplayLabel(s,n)),r?.classList.toggle("is-empty",!s),r?.classList.toggle("has-value",!!s)})}function getStateDateValue(e){return state[e]??""}function getDatePickerViewMonth(e){const t=getStateDateValue(e);if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[n,a]=t.split("-").map(Number);return{year:n,month:a}}return getCalendarPartsInTimeZone(getDashboardTimeZone())}function getTodayIso(){const e=getCalendarPartsInTimeZone(getDashboardTimeZone());return isoFromParts(e.year,e.month,e.day)}function isStartDateDisabled(e){return e>=getTodayIso()}function isFutureDateDisabled(e){return e>getTodayIso()}function isFutureMonthView(e,t){const n=getCalendarPartsInTimeZone(getDashboardTimeZone());return e>n.year||e===n.year&&t>n.month}function isDatePickerDayDisabled(e,t){return t==="dateFrom"&&isStartDateDisabled(e)?!0:isFutureDateDisabled(e)}function renderDatePickerDayCell(e,t,n,a,o,r,s,i){const l=["date-picker-day"];if(n&&l.push("is-outside"),e===a&&l.push("is-today"),e===o&&l.push("is-selected"),r&&s){const c=r<=s?r:s,d=r<=s?s:r;e>=c&&e<=d&&l.push("is-in-range")}return e===r&&l.push("is-range-start"),e===s&&l.push("is-range-end"),isDatePickerDayDisabled(e,i)?(l.push("is-disabled"),`<button type="button" class="${l.join(" ")}" disabled aria-disabled="true">${t}</button>`):`<button type="button" class="${l.join(" ")}" onclick="selectDatePickerDay('${e}')">${t}</button>`}function renderDatePickerPopover(){const e=document.getElementById("date-picker-popover");if(!e||!datePickerState.inputId)return;const{viewYear:t,viewMonth:n,inputId:a}=datePickerState,o=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(t,n-1,1)),r=["Mo","Tu","We","Th","Fr","Sa","Su"],i=(new Date(t,n-1,1).getDay()+6)%7,l=new Date(t,n,0).getDate(),c=new Date(t,n-1,0).getDate(),d=getCalendarPartsInTimeZone(getDashboardTimeZone()),u=isoFromParts(d.year,d.month,d.day),p=getStateDateValue(a),h=getStateDateValue("dateFrom"),g=getStateDateValue("dateTo");let b="";for(let S=i-1;S>=0;S-=1){const C=c-S,E=n===1?12:n-1,I=n===1?t-1:t,R=isoFromParts(I,E,C);b+=renderDatePickerDayCell(R,C,!0,u,p,h,g,a)}for(let S=1;S<=l;S+=1){const C=isoFromParts(t,n,S);b+=renderDatePickerDayCell(C,S,!1,u,p,h,g,a)}const y=(7-(i+l)%7)%7;for(let S=1;S<=y;S+=1){const C=n===12?1:n+1,E=n===12?t+1:t,I=isoFromParts(E,C,S);b+=renderDatePickerDayCell(I,S,!0,u,p,h,g,a)}const m=a==="dateFrom"?'<span class="date-picker-hint">Start date must be before today</span>':"",f=a==="dateTo"?'<button type="button" class="date-picker-footer-btn primary" onclick="setDatePickerToday()">Today</button>':"",v=n===12?1:n+1,$=n===12?t+1:t,w=!isFutureMonthView($,v);e.innerHTML=`
    <div class="date-picker-panel">
      <div class="date-picker-header">
        <div class="date-picker-title">${esc(o)}</div>
        <div class="date-picker-nav">
          <button type="button" class="date-picker-nav-btn" aria-label="Previous month" onclick="shiftDatePickerMonth(-1)">${ICON_CHEVRON_LEFT}</button>
          <button type="button" class="date-picker-nav-btn" aria-label="Next month" onclick="shiftDatePickerMonth(1)" ${w?"":"disabled"}>${ICON_CHEVRON_RIGHT}</button>
        </div>
      </div>
      <div class="date-picker-weekdays">
        ${r.map(S=>`<div class="date-picker-weekday">${S}</div>`).join("")}
      </div>
      <div class="date-picker-grid">${b}</div>
      <div class="date-picker-footer">
        ${m}
        <button type="button" class="date-picker-footer-btn" onclick="clearDatePickerField()">Clear</button>
        ${f}
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
  `}function renderDashboardContent(e){const{kpis:t,statusBreakdown:n,sourceReport:a,assigneeReport:o,pipelines:r,filters:s}=e,i=isVisible("sections","statusBreakdown");return`
    ${renderMetricsChangeBanner(e)}
    ${renderKpiCards(t)}

    ${renderChartsSection()}

    ${i?`
      <div class="card">
        <div class="section-title">Opportunity Status (Cards)</div>
        ${renderStatusBreakdown(n)}
      </div>
    `:""}

    ${isVisible("sections","sourceReport")?`
      <div class="card">
        <div class="section-title">Lead Source Report</div>
        ${renderTable("sourceReport","Source",[{key:"totalLeads",label:"Total leads",align:"num"},{key:"totalValue",label:"Total values",align:"num"},{key:"open",label:"Open",align:"num"},{key:"won",label:"Won",align:"num"},{key:"lost",label:"Lost",align:"num"},{key:"abandoned",label:"Abandoned",align:"num"},{key:"winPct",label:"Win %",align:"num"}],a,(l,c)=>c==="label"?esc(l.source):c==="totalValue"?`Dkr ${fmt(l.totalValue)}`:c==="winPct"?fmtPct(l.winPct):fmt(l[c]))}
      </div>
    `:""}

    ${isVisible("sections","assigneeReport")||isVisible("sections","pipelineBreakdown")?`
      <div class="section-grid">
        ${isVisible("sections","assigneeReport")?`
          <div class="card">
            <div class="section-title">Leads Closed by Assignee</div>
            ${renderTable("assigneeReport","Assignee",[{key:"won",label:"Won",align:"num"},{key:"totalLeads",label:"Total leads",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"},{key:"totalValue",label:"Total value",align:"num"}],o,(l,c)=>c==="label"?esc(l.assigneeName):c==="wonValue"||c==="totalValue"?`Dkr ${fmt(l[c])}`:fmt(l[c]))}
          </div>
        `:""}
        ${isVisible("sections","pipelineBreakdown")?`
          <div class="card">
            <div class="section-title">Pipeline Breakdown</div>
            ${renderTable("pipelineBreakdown","Pipeline",[{key:"count",label:"Leads",align:"num"},{key:"won",label:"Won",align:"num"},{key:"monetary",label:"Value",align:"num"},{key:"profit",label:"Bundlinje",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"}],r,(l,c)=>c==="label"?esc(l.name):c==="monetary"||c==="profit"||c==="wonValue"?`Dkr ${fmt(l[c])}`:fmt(l[c]))}
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
    <div class="brand-footer">
      Dashboard by Cenhub
      \xB7 Holstebro
    </div>
  `}function updateDashboardContent(e){if(IS_ADMIN){const n=document.getElementById("admin-filters-panel");n&&(n.outerHTML=renderAdminFiltersPanel(e.filterOptions||{pipelines:[],statuses:[],sources:[],assignees:[],dateFields:[]}));const a=document.getElementById("admin-display-panel");if(a){const o=!!a.open;a.outerHTML=renderAdminDisplayOptions(o)}}const t=document.getElementById("dashboard-content");t&&(t.innerHTML=renderDashboardContent(e),mountCharts(e))}function renderDashboard(e){const t=document.getElementById("dashboard"),{filterOptions:n,account:a={}}=e,o=document.querySelector("details.panel")?.open,r=a.accountName||"Dashboard";IS_CLIENT_VIEW&&a.accountName&&(document.title=`${a.accountName} \xB7 Cenhub Dashboard`),t.innerHTML=`
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
  `,IS_ADMIN_CLIENT&&loadSetupAccount(),initDatePickers()}let isFetching=!1,pendingRefetch=!1,fetchGeneration=0,activeFetchController=null,fetchStartedAt=0;const FETCH_TIMEOUT_MS=9e4;function restoreDashboardContentAfterFailedFetch(e){!e||!cachedData||(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi())}function setPresetButtonsDisabled(e){document.querySelectorAll("[data-preset]").forEach(t=>{t.disabled=e})}function resetFetchUiState(){isFetching=!1,setPresetButtonsDisabled(!1);const e=document.getElementById("apply-filters-btn");e&&(e.disabled=!1,e.textContent="Apply data filters")}function cancelActiveFetch(){activeFetchController&&(activeFetchController.abort(),activeFetchController=null)}function canReuseBootstrapDashboard(e){return!!(e?.kpis&&usesClientPipelineDefaults()&&!state.dateFrom&&!state.dateTo&&state.status==="all"&&state.source==="all"&&state.assignedTo==="all")}async function loadDashboard(e=!0,t={}){const{background:n=!1,forceFresh:a=!1}=t,o=!!a,r=document.getElementById("dashboard");if(isFetching&&(e||!cachedData))cancelActiveFetch(),fetchGeneration+=1,pendingRefetch=!1,resetFetchUiState();else if(isFetching){e&&(pendingRefetch=!0);return}const s=!!document.getElementById("dashboard-content"),i=document.getElementById("apply-filters-btn");if(e||!cachedData){const l=++fetchGeneration;activeFetchController=new AbortController;const c=activeFetchController.signal;if(isFetching=!0,fetchStartedAt=Date.now(),!s)r.innerHTML=`
        ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
        ${wrapDashboardShell(`
          <div class="loading-state">
            <div class="spinner"></div>
            ${LOADING_MSG}
          </div>
        `)}`;else if(!n){const d=document.getElementById("dashboard-content");d&&(d.innerHTML=renderKpiSkeleton()),i&&(i.disabled=!0,i.textContent="Loading..."),setPresetButtonsDisabled(!0)}try{let d=null;if(!availablePipelines.length){if(d=await bootstrapDashboardData(c),l!==fetchGeneration)return;availablePipelines=d.filterOptions.pipelines||[],ensurePipelineDefaults(availablePipelines,d.account?.defaultPipelineIds)}if(!ensurePipelineSelectionBeforeFetch())throw new Error("Select at least one pipeline.");const p=canReuseBootstrapDashboard(d)&&!o;let h,g;if(p?[g,h]=await Promise.all([fetchFacebookMetrics(c),Promise.resolve(d)]):[h,g]=await Promise.all([fetchDashboardData(availablePipelines,c,{forceFresh:o}),fetchFacebookMetrics(c)]),l!==fetchGeneration)return;cachedFacebookMetrics=g,cachedData=applyMarketingData(h,g),cachedData.account?.facebookClientId?facebookClientId=cachedData.account.facebookClientId:cachedData.account?.clientId&&(facebookClientId=cachedData.account.clientId),availablePipelines=cachedData.filterOptions.pipelines||availablePipelines,ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),lastFetchedAt=cachedData.cachedAt?new Date(cachedData.cachedAt).getTime():Date.now()}catch(d){if(l!==fetchGeneration)return;if(d.name==="AbortError"){s?restoreDashboardContentAfterFailedFetch(s):r.innerHTML=`
            ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
            ${wrapDashboardShell(`
              <div class="error-state">
                <div>Fejl ved hentning af data</div>
                <div style="margin-top:8px;font-size:12px;color:#666">Request timed out. Pr\xF8v igen.</div>
                <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            `)}`;return}if(IS_ADMIN_CLIENT&&s){const u=document.getElementById("dashboard-content");u&&(u.innerHTML=`
            <div class="note admin-setup-placeholder">
              ${esc(d.message)}
              <div style="margin-top:12px">
                <button type="button" class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            </div>`)}else s?s&&cachedData?(restoreDashboardContentAfterFailedFetch(s),showToast(d.message||"Failed to load filtered data.","error")):i&&(i.textContent="Apply failed - try again"):r.innerHTML=`
          ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
          ${wrapDashboardShell(`
            <div class="error-state">
              <div>Fejl ved hentning af data</div>
              <div style="margin-top:8px;font-size:12px;color:#666">${esc(d.message)}</div>
              <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
            </div>
          `)}`;return}finally{l===fetchGeneration&&(activeFetchController=null,resetFetchUiState()),pendingRefetch&&(pendingRefetch=!1,loadDashboard(!0))}if(l!==fetchGeneration)return}try{s?(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi()):(renderDashboard(cachedData),mountCharts(cachedData))}catch(l){resetFetchUiState(),r.innerHTML=`
      ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
      ${wrapDashboardShell(`
        <div class="error-state">
          <div>Fejl ved visning af dashboard</div>
          <div style="margin-top:8px;font-size:12px;color:#666">${esc(l.message)}</div>
          <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
        </div>
      `)}
    `}}function syncFiltersFromDom(){["status","source","assignedTo","dateField"].forEach(t=>{const n=document.getElementById(t);n&&(state[t]=n.value)});const e=document.getElementById("adSpend");if(e&&(state.adSpend=e.value),state.preset==="custom"){const t=document.getElementById("dateFrom"),n=document.getElementById("dateTo");t&&(state.dateFrom=t.value),n&&(state.dateTo=n.value),state.dateField="createdAt"}}function hasPartialDateRange(){return!!(state.dateFrom&&!state.dateTo||!state.dateFrom&&state.dateTo)}function applyPreset(e){if(clearDateRangeError(),closeDatePicker(),setPreset(e),updateFilterUi(),e==="custom"){const t=document.getElementById("dateFrom-trigger");t&&openDatePicker("dateFrom",t);return}applyDataFilters(!1)}function applyDataFilters(e=!0){if(e&&syncFiltersFromDom(),state.preset==="custom"){if(hasPartialDateRange()){showDateRangeError("Select both From and To dates.");return}if(state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date.");return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){showDateRangeError("Start date must be before today.");return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){showDateRangeError("End date cannot be after today.");return}}if(clearDateRangeError(),!state.pipelineIds.length&&availablePipelines.length&&ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),!state.pipelineIds.length){!availablePipelines.length&&isFetching&&loadDashboard(!0);return}loadDashboard(!0)}async function bootAdminApp(){if(IS_REPORT_VIEW){await loadPublicMetaReportPage();return}if(IS_LOGIN_PAGE){renderLoginPage();return}if(IS_ADMIN_HUB){loadAdminHub();return}if(IS_ADMIN_SYNC_HISTORY_GHL){await loadSyncHistoryPage("ghl");return}if(IS_ADMIN_SYNC_HISTORY_META){await loadSyncHistoryPage("meta");return}if(IS_ADMIN_SYNC_HISTORY_META_REPORTS){await loadSyncHistoryPage("meta-report-ghl");return}if(IS_ADMIN_FB_LEAD_SYNC){await loadFbLeadSyncPage();return}if(IS_ADMIN_META_REPORTS){await loadMetaReportsHubPage();return}if(IS_ADMIN_META_REPORTS_CUSTOM){await loadMetaReportsCustomValuesPage();return}if(IS_ADMIN_META_REPORTS_GHL_CLIENTS){await loadMetaReportsGhlClientsPage();return}if(IS_ADMIN_META_REPORTS_CLIENT){await loadMetaReportsClientPage();return}if(IS_ADMIN_GOOGLE_ADS){await loadGoogleAdsHubPage();return}if(IS_ADMIN_GOOGLE_ADS_CLIENT){await loadGoogleAdsClientPage();return}if(IS_TEAM_PAGE){loadTeamPage();return}try{tenantParams=await resolveTenantParams()}catch(e){document.getElementById("dashboard").innerHTML='<div class="error-state" style="padding:24px">'+esc(e.message)+"</div>";return}if(IS_ADMIN_CLIENT){await initAdminClientPage();return}ensureChartsVisible(),loadDashboard(!0),setInterval(function(){loadDashboard(!0,{background:!0})},120*1e3)}bootAdminApp(),document.addEventListener("click",function(e){const t=e.target.closest("#staff-nav-toggle");if(t){e.stopPropagation(),toggleStaffTopbarNav(t);return}if(e.target.closest(".staff-nav-dropdown-item")){closeStaffTopbarNav(),closeStaffNavDropdowns();return}(e.target.closest(".staff-nav-link")&&!e.target.closest(".staff-nav-dropdown-trigger")||!e.target.closest(".brand-topbar-right")&&!e.target.closest(".staff-nav-dropdown-menu"))&&closeStaffTopbarNav(),!e.target.closest(".staff-nav-dropdown")&&!e.target.closest(".staff-nav-dropdown-menu")&&closeStaffNavDropdowns(),closeCardMenus(),closeStaffUserMenu()}),window.addEventListener("resize",function(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(function(e){positionStaffNavDropdown(e)})}),window.addEventListener("scroll",function(){document.querySelector(".staff-nav-dropdown.is-open")&&closeStaffNavDropdowns()},{passive:!0}),document.addEventListener("visibilitychange",function(){document.visibilityState==="visible"&&(isFetching&&Date.now()-fetchStartedAt>FETCH_TIMEOUT_MS&&(cancelActiveFetch(),fetchGeneration+=1,resetFetchUiState()),!IS_ADMIN_HUB&&cachedData&&needsFreshData()&&loadDashboard(!0,{background:!0}))});

(function(){const t=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);if(t[0]==="login"){document.body.dataset.dashboardMode="login",delete document.body.dataset.clientSlug;return}if(t[0]==="team"){document.body.dataset.dashboardMode="team",delete document.body.dataset.clientSlug;return}if(t[0]==="admin"){if(t[1]==="sync-history"&&(t[2]==="ghl"||t[2]==="meta")){document.body.dataset.dashboardMode=`sync-history-${t[2]}`,delete document.body.dataset.clientSlug;return}if(t[1]==="fb-lead-sync"){document.body.dataset.dashboardMode="fb-lead-sync",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]==="custom-values"){document.body.dataset.dashboardMode="meta-reports-custom",delete document.body.dataset.clientSlug;return}if(t[1]==="meta-reports"&&t[2]){document.body.dataset.dashboardMode="meta-reports-client",document.body.dataset.clientSlug=t[2];return}if(t[1]==="meta-reports"){document.body.dataset.dashboardMode="meta-reports",delete document.body.dataset.clientSlug;return}document.body.dataset.dashboardMode=t.length>=2?"admin":"hub",t.length>=2?document.body.dataset.clientSlug=t[1]:delete document.body.dataset.clientSlug;return}if(t[0]==="report"&&t[1]){document.body.dataset.dashboardMode="report",document.body.dataset.reportToken=t[1],delete document.body.dataset.clientSlug;return}t[0]&&t[0]!=="index.html"&&(document.body.dataset.dashboardMode="client",document.body.dataset.clientSlug=t[0])})();const DASHBOARD_MODE=document.body.dataset.dashboardMode||"client",IS_LOGIN_PAGE=DASHBOARD_MODE==="login",IS_TEAM_PAGE=DASHBOARD_MODE==="team",IS_ADMIN_HUB=DASHBOARD_MODE==="hub",IS_ADMIN_CLIENT=DASHBOARD_MODE==="admin",IS_ADMIN_SYNC_HISTORY_GHL=DASHBOARD_MODE==="sync-history-ghl",IS_ADMIN_SYNC_HISTORY_META=DASHBOARD_MODE==="sync-history-meta",IS_ADMIN_FB_LEAD_SYNC=DASHBOARD_MODE==="fb-lead-sync",IS_ADMIN_META_REPORTS=DASHBOARD_MODE==="meta-reports",IS_ADMIN_META_REPORTS_CLIENT=DASHBOARD_MODE==="meta-reports-client",IS_ADMIN_META_REPORTS_CUSTOM=DASHBOARD_MODE==="meta-reports-custom",IS_REPORT_VIEW=DASHBOARD_MODE==="report",REPORT_TOKEN=document.body.dataset.reportToken||"",IS_ADMIN_SYNC_HISTORY=IS_ADMIN_SYNC_HISTORY_GHL||IS_ADMIN_SYNC_HISTORY_META,IS_CLIENT_VIEW=DASHBOARD_MODE==="client",IS_PREVIEW=IS_CLIENT_VIEW&&!!new URLSearchParams(window.location.search).get("client"),IS_ADMIN=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||new URLSearchParams(window.location.search).get("view")==="admin",ADMIN_UI=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN_META_REPORTS||IS_ADMIN_META_REPORTS_CLIENT||IS_ADMIN_META_REPORTS_CUSTOM||IS_ADMIN,LOADING_MSG=ADMIN_UI?"Loading dashboard data...":"Henter dashboard data...",RETRY_MSG=ADMIN_UI?"Try again":"Pr\xF8v igen";(function(){const t=document.getElementById("initial-loading-msg");t&&(t.textContent=LOADING_MSG)})();function resolveClientSlug(){if(document.body.dataset.clientSlug)return document.body.dataset.clientSlug;const e=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);return e[0]==="admin"&&e[1]==="meta-reports"&&e[2]&&e[2]!=="custom-values"?e[2]:e[0]==="admin"&&e[1]&&e[1]!=="meta-reports"?e[1]:e[0]&&e[0]!=="admin"&&e[0]!=="index.html"&&e[0]!=="report"?e[0]:new URLSearchParams(window.location.search).get("client")||"suntech-nordic"}const CLIENT_SLUG=resolveClientSlug();let tenantParams={},facebookClientId=CLIENT_SLUG,setupAccount=null,setupPipelines=[],metricsModelChangeMode=!1;function esc(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function renderBrandTopbar(e=""){const t=!!(e&&e.includes("staff-admin-chrome")),a=t||e&&e.includes("admin-topbar-link")?"/admin":"",n=a?`<a href="${a}" class="brand-logo-link" aria-label="Cenhub home"><img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" /></a>`:'<img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" />',r=t?`<button type="button" class="staff-nav-toggle" id="staff-nav-toggle" aria-expanded="false" aria-controls="staff-topbar-panel" aria-label="Open menu">
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
        <span class="staff-nav-toggle-bar" aria-hidden="true"></span>
      </button>`:"",o=e?t?`<div class="brand-topbar-right brand-topbar-panel" id="staff-topbar-panel">${e}</div>`:`<div class="brand-topbar-right">${e}</div>`:"";return`
    <header class="brand-topbar${t?" brand-topbar--collapsible":""}${!t?" brand-topbar--centered":""}">
      <div class="brand-topbar-inner">
        <div class="brand-topbar-left">${n}</div>
        ${r}
        ${o}
      </div>
    </header>
  `}function wrapDashboardShell(e){return`<div class="dashboard-shell">${e}</div>`}function showToast(e,t="info"){const a=document.getElementById("toast-host");if(!a)return;const n=document.createElement("div");n.className=`toast${t==="error"?" toast--error":t==="success"?" toast--success":""}`,n.textContent=e,a.appendChild(n),setTimeout(()=>n.remove(),4200)}function fmtDkk(e){return new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0))}function fmtRevenueDkk(e){const t=Math.round(Number(e)||0);if(t>=1e6){const a=t/1e6;return`${new Intl.NumberFormat("da-DK",{minimumFractionDigits:a%1===0?0:2,maximumFractionDigits:2}).format(a)}M kr`}return`${fmtDkk(t)} kr`}function clientNeedsAction(e){return!!(e&&e!=="ready"&&e!=="syncing")}function clientActionHint(e){return{syncing:"Sync in progress...",needs_token:"Action needed \u2014 add GHL token in Settings",needs_metrics_model:"Action needed \u2014 choose metrics model in Settings",needs_pipelines:"Action needed \u2014 map pipelines in Settings",needs_sync:"Action needed \u2014 sync data from Settings or click Sync",needs_review:"Action needed \u2014 review client setup in Settings",sync_error:"Sync failed \u2014 open Settings and try again"}[e]||"Action needed \u2014 open Settings to finish setup"}function requestGhlUserData(e=8e3){return new Promise(t=>{if(window.self===window.top){t(null);return}const a=setTimeout(()=>{window.removeEventListener("message",n),t(null)},e);function n(r){r.data?.message==="REQUEST_USER_DATA_RESPONSE"&&r.data.payload&&(clearTimeout(a),window.removeEventListener("message",n),t(r.data.payload))}window.addEventListener("message",n),window.parent.postMessage({message:"REQUEST_USER_DATA"},"*")})}async function resolveTenantParams(){const e=new URLSearchParams(window.location.search);if(IS_ADMIN_HUB)return{};if(IS_ADMIN_CLIENT||IS_CLIENT_VIEW)return{client:CLIENT_SLUG};if(e.get("client"))return{client:e.get("client")};const t=e.get("location_id")||e.get("locationId");return t?{location_id:t}:{client:CLIENT_SLUG}}let CLIENT_ACCESS_KEY=new URLSearchParams(window.location.search).get("key")||"";function appendTenantParams(e){tenantParams.location_id?e.set("location_id",tenantParams.location_id):tenantParams.client&&e.set("client",tenantParams.client),CLIENT_ACCESS_KEY&&e.set("key",CLIENT_ACCESS_KEY)}const ADMIN_API_KEY_STORAGE="cenhub_admin_api_key";let currentStaffUser=null;function getAdminApiKey(){return localStorage.getItem(ADMIN_API_KEY_STORAGE)||""}function redirectToLogin(){const e=`${window.location.pathname}${window.location.search}`;window.location.href=`/login?next=${encodeURIComponent(e)}`}async function fetchStaffMe(){const e=await fetch("/api/auth/me",{credentials:"include"}),t=await e.json().catch(()=>({}));return e.ok&&t.user||null}async function requireStaffAuth(){const e=await fetchStaffMe();return e?(currentStaffUser=e,e):(redirectToLogin(),null)}async function adminFetch(e,t={}){const a={"Content-Type":"application/json",...t.headers||{}},n=getAdminApiKey();n&&(a["x-api-key"]=n);let r;try{r=await fetch(e,{...t,headers:a,credentials:"include"})}catch(s){throw s}const o=await r.json().catch(()=>({}));if(r.status===401&&ADMIN_UI)throw redirectToLogin(),new Error(o.error||"Unauthorized.");if(!r.ok)throw new Error(o.error||`Request failed (${r.status})`);return o}function sleepMs(e){return new Promise(t=>setTimeout(t,e))}async function adminFetchWithRetry(e,t={},{retries:a=3,timeoutMs:n=13e4}={}){let r=null;for(let o=1;o<=a;o+=1){const s=new AbortController,i=setTimeout(()=>s.abort(),n);try{const l={"Content-Type":"application/json",...t.headers||{}},c=getAdminApiKey();c&&(l["x-api-key"]=c);const d=await fetch(e,{...t,headers:l,credentials:"include",signal:s.signal});clearTimeout(i);const u=await d.json().catch(()=>({}));if(d.status===401&&ADMIN_UI)throw redirectToLogin(),new Error(u.error||"Unauthorized.");if(!d.ok){const p=new Error(u.error||`Request failed (${d.status})`);if(d.status>=500&&o<a){r=p,await sleepMs(1200*o);continue}throw p}return u}catch(l){if(clearTimeout(i),r=l,(l.name==="AbortError"||/fetch failed|network|timeout|timed out|502|503|504/i.test(String(l.message||"")))&&o<a){await sleepMs(1200*o);continue}throw l.name==="AbortError"?new Error("Request timed out \u2014 the server may still be processing. Try Resume if a partial run exists."):l}}throw r||new Error("Request failed after retries.")}async function staffLogout(){try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"})}catch{}window.location.href="/login"}function isStaffAdmin(){return currentStaffUser?.role==="admin"}function renderStaffUserMenu(){const e=currentStaffUser;return e?`
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
      <div class="staff-nav-dropdown" data-staff-nav-dropdown="sync">
        <button type="button" class="staff-nav-link staff-nav-dropdown-trigger${e==="ghl-sync"||e==="meta-sync"||e==="fb-lead-sync"?" is-active":""}" aria-expanded="false" aria-haspopup="true" onclick="toggleStaffNavDropdown(this, event)">Sync</button>
        <div class="staff-nav-dropdown-menu" role="menu">
          <a href="/admin/sync-history/ghl" class="staff-nav-dropdown-item${e==="ghl-sync"?" is-active":""}" role="menuitem">GHL sync</a>
          <a href="/admin/sync-history/meta" class="staff-nav-dropdown-item${e==="meta-sync"?" is-active":""}" role="menuitem">Meta sync</a>
          <a href="/admin/fb-lead-sync" class="staff-nav-dropdown-item${e==="fb-lead-sync"?" is-active":""}" role="menuitem">FB lead sync</a>
        </div>
      </div>
      <div class="staff-nav-dropdown" data-staff-nav-dropdown="meta-reports">
        <button type="button" class="staff-nav-link staff-nav-dropdown-trigger${e==="meta-reports"||e==="meta-reports-custom"?" is-active":""}" aria-expanded="false" aria-haspopup="true" onclick="toggleStaffNavDropdown(this, event)">Meta reports</button>
        <div class="staff-nav-dropdown-menu" role="menu">
          <a href="/admin/meta-reports" class="staff-nav-dropdown-item${e==="meta-reports"?" is-active":""}" role="menuitem">All clients</a>
          <a href="/admin/meta-reports/custom-values" class="staff-nav-dropdown-item${e==="meta-reports-custom"?" is-active":""}" role="menuitem">Custom values</a>
        </div>
      </div>
      ${isStaffAdmin()?`<a href="/team" class="staff-nav-link${e==="team"?" is-active":""}">Team</a>`:""}
    </nav>
  `}
      ${renderStaffUserMenu()}
    </div>
  `:""}function isStaffNavMobilePanelOpen(){return!!(document.getElementById("staff-topbar-panel")?.classList.contains("is-open")&&window.matchMedia("(max-width: 1100px)").matches)}function resetStaffNavDropdownMenu(e){e&&(e.classList.remove("is-floating"),e.style.position="",e.style.left="",e.style.top="",e.style.right="",e.style.width="",e.style.minWidth="")}function restoreStaffNavDropdownMenu(e){const t=e._floatingMenu;t&&(resetStaffNavDropdownMenu(t),e._menuAnchor&&e._menuAnchor.parentNode?e._menuAnchor.parentNode.insertBefore(t,e._menuAnchor):e.appendChild(t),e._floatingMenu=null)}function floatStaffNavDropdownMenu(e,t){isStaffNavMobilePanelOpen()||e._floatingMenu!==t&&(e._menuAnchor=document.createComment("staff-nav-menu-anchor"),t.parentNode.insertBefore(e._menuAnchor,t),document.body.appendChild(t),t.classList.add("is-floating"),e._floatingMenu=t)}function positionStaffNavDropdown(e){const t=e.querySelector(".staff-nav-dropdown-trigger"),a=e._floatingMenu||e.querySelector(".staff-nav-dropdown-menu");if(!t||!a)return;if(isStaffNavMobilePanelOpen()){resetStaffNavDropdownMenu(a),a.style.position="static",a.style.width="100%";return}floatStaffNavDropdownMenu(e,a);const n=t.getBoundingClientRect(),r=Math.max(188,n.width);a.style.position="fixed",a.style.width="",a.style.minWidth=`${r}px`,a.style.left=`${Math.max(8,n.left)}px`,a.style.top=`${n.bottom+6}px`,a.style.right="auto";const o=a.getBoundingClientRect();if(o.right>window.innerWidth-8&&(a.style.left=`${Math.max(8,window.innerWidth-o.width-8)}px`),o.bottom>window.innerHeight-8){const s=n.top-o.height-6;s>=8&&(a.style.top=`${s}px`)}}function closeStaffNavDropdowns(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(e=>{e.classList.remove("is-open"),e.querySelector(".staff-nav-dropdown-trigger")?.setAttribute("aria-expanded","false"),restoreStaffNavDropdownMenu(e)})}function toggleStaffNavDropdown(e,t){t?.stopPropagation();const a=e?.closest(".staff-nav-dropdown");if(!a)return;const n=!a.classList.contains("is-open");if(closeStaffNavDropdowns(),closeStaffUserMenu(),!n){e.setAttribute("aria-expanded","false");return}a.classList.add("is-open"),e.setAttribute("aria-expanded","true"),positionStaffNavDropdown(a)}function toggleStaffUserMenu(e){e.stopPropagation();const t=document.getElementById("staff-user-dropdown"),a=e.currentTarget;if(!t)return;const n=t.hidden;closeStaffUserMenu(),n&&(t.hidden=!1,a?.setAttribute("aria-expanded","true"))}function closeStaffUserMenu(){const e=document.getElementById("staff-user-dropdown"),t=document.querySelector(".staff-user-trigger");e&&(e.hidden=!0),t&&t.setAttribute("aria-expanded","false")}function toggleStaffTopbarNav(e){const t=document.getElementById("staff-topbar-panel");if(!t)return;const a=!t.classList.contains("is-open");t.classList.toggle("is-open",a),e.setAttribute("aria-expanded",a?"true":"false"),e.setAttribute("aria-label",a?"Close menu":"Open menu"),e.classList.toggle("is-active",a),a&&closeStaffUserMenu()}function closeStaffTopbarNav(){const e=document.getElementById("staff-topbar-panel"),t=document.getElementById("staff-nav-toggle");e&&e.classList.remove("is-open"),t&&(t.setAttribute("aria-expanded","false"),t.setAttribute("aria-label","Open menu"),t.classList.remove("is-active"))}function formatStaffLastLogin(e){if(!e)return"Never";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}function renderStaffStatusBadge(e){return`<span class="staff-status-badge status-${e}">${e==="active"?"Active":e==="pending"?"Pending":"Disabled"}</span>`}async function copyTextToClipboard(e,t){try{await navigator.clipboard.writeText(e),showToast(t,"success")}catch{showToast("Could not copy to clipboard","error")}}function renderTeamPage(e){return`
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
    `)}`;try{const a=await adminFetch("/api/auth/users");e.innerHTML=renderTeamPage(a.users||[])}catch(a){e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("team"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(a.message)}</div>`)}
    `}}}async function reloadTeamUsersTable(){const e=document.getElementById("team-users-content");if(!e)return;const t=await adminFetch("/api/auth/users");e.innerHTML=renderStaffUsersTable(t.users||[])}function renderStaffUserActions(e){const t=currentStaffUser?.id===e.id,a=e.status==="disabled"?`<button class="admin-btn" type="button" onclick="updateStaffUser('${esc(e.id)}', { status: 'active' })">Enable</button>`:`<button class="admin-btn" type="button" ${t?'disabled title="You cannot disable your own account"':""} onclick="updateStaffUser('${esc(e.id)}', { status: 'disabled' })">Disable</button>`,n=e.status==="pending"||!e.hasPassword?`<button class="admin-btn" type="button" onclick="copyStaffInviteLink('${esc(e.id)}')">Copy invite link</button>`:`<button class="admin-btn" type="button" onclick="resetStaffUserPassword('${esc(e.id)}', true)">Reset password</button>`,r=t?"":`<button class="admin-btn card-menu-item--danger" type="button" onclick="deleteStaffUser('${esc(e.id)}')">Delete</button>`;return`
    <div class="staff-user-actions">
      ${a}
      ${n}
      ${r}
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
  `}function renderStaffUsersTable(e){const t=e.map(n=>`
      <tr>
        <td>${esc(n.name||"\u2014")}<div style="color:var(--text-soft);font-size:12px">${esc(n.email)}</div></td>
        <td>${renderStaffUserRoleSelect(n)}</td>
        <td>${renderStaffStatusBadge(n.status)}</td>
        <td>${esc(formatStaffLastLogin(n.lastLoginAt))}</td>
        <td>${renderStaffUserActions(n)}</td>
      </tr>
    `).join(""),a=e.map(n=>renderStaffUserCard(n)).join("");return`
    <div class="staff-users-table-wrap">
      <table class="staff-users-table staff-users-table--desktop">
        <thead>
          <tr><th>User</th><th>Role</th><th>Status</th><th>Last login</th><th>Actions</th></tr>
        </thead>
        <tbody>${t||'<tr><td colspan="5">No staff users yet.</td></tr>'}</tbody>
      </table>
    </div>
    <div class="staff-users-cards staff-users-cards--mobile">
      ${a||'<div class="note">No staff users yet.</div>'}
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
  `}async function createStaffUserFromForm(){const e=document.getElementById("new-staff-email")?.value?.trim(),t=document.getElementById("new-staff-name")?.value?.trim(),a=document.getElementById("new-staff-role")?.value==="admin"?"admin":"member";if(!e){showToast("Email is required.","error");return}try{const n=await adminFetch("/api/auth/users",{method:"POST",body:JSON.stringify({email:e,name:t,role:a})});n.setupUrl&&await copyTextToClipboard(n.setupUrl,"Invite link copied to clipboard."),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("Staff member invited.","success")}catch(n){showToast(n.message,"error")}}async function updateStaffUser(e,t){try{await adminFetch(`/api/auth/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("User updated.","success")}catch(a){showToast(a.message,"error"),IS_TEAM_PAGE&&await reloadTeamUsersTable()}}async function updateStaffUserRole(e,t){await updateStaffUser(e,{role:t==="admin"?"admin":"member"})}async function deleteStaffUser(e){if(window.confirm("Delete this staff member? This permanently removes their account and cannot be undone."))try{await adminFetch(`/api/auth/users/${encodeURIComponent(e)}`,{method:"DELETE"}),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("Staff member deleted.","success")}catch(t){showToast(t.message,"error")}}async function copyStaffInviteLink(e){try{const t=await adminFetch(`/api/auth/users/${encodeURIComponent(e)}/reset-password`,{method:"POST",body:"{}"});t.setupUrl&&await copyTextToClipboard(t.setupUrl,"Invite link copied to clipboard.")}catch(t){showToast(t.message,"error")}}async function resetStaffUserPassword(e,t=!1){try{const a=await adminFetch(`/api/auth/users/${encodeURIComponent(e)}/reset-password`,{method:"POST",body:"{}"});a.setupUrl&&await copyTextToClipboard(a.setupUrl,t?"Reset link copied to clipboard.":"Password reset link generated.")}catch(a){showToast(a.message,"error")}}function renderLoginPage(){const e=new URLSearchParams(window.location.search),t=e.get("token"),a=e.get("next")||"/admin",n=e.get("saved")==="1",r=document.getElementById("dashboard"),o='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',s='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a20.3 20.3 0 014.06-5.94M9.9 4.24A10.94 10.94 0 0112 5c6.5 0 10 7 10 7a20.3 20.3 0 01-3.17 4.49"/><path d="M1 1l22 22"/><path d="M14.12 14.12A3 3 0 009.88 9.88"/></svg>',i='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>';function l(c,d,u=""){return`
      <div class="auth-field">
        <label for="${c}">${d}</label>
        <div class="auth-password-wrap">
          <input id="${c}" type="password" ${u} />
          <button
            type="button"
            class="auth-password-toggle"
            aria-label="Show password"
            onclick="toggleAuthPassword('${c}', this)"
          >${o}</button>
        </div>
      </div>
    `}if(t){r.innerHTML=`
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
    `,initAuthPage("set-password");return}r.innerHTML=`
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
        ${n?'<div class="auth-success">Password saved. Sign in with your new password.</div>':""}
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <div id="auth-success" class="auth-success" style="display:none"></div>
        <div class="auth-field">
          <label for="login-email">Email</label>
          <input id="login-email" type="email" autocomplete="username" placeholder="you@company.dk" onkeydown="if(event.key==='Enter')document.getElementById('login-password')?.focus()" />
        </div>
        ${l("login-password","Password",`autocomplete="current-password" placeholder="Enter your password" onkeydown="if(event.key==='Enter')submitStaffLogin()"`)}
        <input id="login-next" type="hidden" value="${esc(a)}" />
        <button id="auth-submit-btn" class="admin-btn admin-btn--primary auth-submit" type="button" onclick="submitStaffLogin()">Sign in</button>
        <div class="auth-note">Forgot password? <a class="auth-help-link" href="mailto:?subject=Cenhub%20staff%20password%20reset">Contact your admin</a> for a new setup link.</div>
      </div>
    </div>
    `)}
  `,initAuthPage("login-email")}function initAuthPage(e){const t=document.getElementById(e);t&&requestAnimationFrame(()=>t.focus({preventScroll:!0}))}function toggleAuthPassword(e,t){const a=document.getElementById(e);if(!a||!t)return;const n=a.type==="password";a.type=n?"text":"password",t.setAttribute("aria-label",n?"Hide password":"Show password"),t.innerHTML=n?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a20.3 20.3 0 014.06-5.94M9.9 4.24A10.94 10.94 0 0112 5c6.5 0 10 7 10 7a20.3 20.3 0 01-3.17 4.49"/><path d="M1 1l22 22"/><path d="M14.12 14.12A3 3 0 009.88 9.88"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>'}function setAuthSubmitLoading(e,t,a){const n=document.getElementById("auth-submit-btn");n&&(n.disabled=e,n.classList.toggle("is-loading",e),n.textContent=e?t:a,document.querySelectorAll(".auth-card input").forEach(r=>{r.type!=="hidden"&&(r.disabled=e)}))}function updatePasswordStrength(){const e=document.getElementById("set-password")?.value||"",t=document.getElementById("password-strength");if(!t)return;if(!e){t.textContent="",t.className="password-strength";return}let a=0;e.length>=8&&(a+=1),e.length>=12&&(a+=1),/[A-Z]/.test(e)&&/[a-z]/.test(e)&&(a+=1),/\d/.test(e)&&(a+=1);const n=["Weak","Fair","Good","Strong"],r=["is-weak","is-fair","is-good","is-strong"],o=Math.min(Math.max(a-1,0),3);t.className=`password-strength ${r[o]}`,t.textContent=`Password strength: ${n[o]}`}function showAuthSuccess(e){const t=document.getElementById("auth-error"),a=document.getElementById("auth-success");t&&(t.style.display="none"),a&&(a.textContent=e,a.style.display=e?"block":"none")}function showAuthError(e){const t=document.getElementById("auth-error"),a=document.getElementById("auth-success");a&&e&&(a.style.display="none"),t&&(t.textContent=e,t.style.display=e?"block":"none")}async function submitStaffLogin(){showAuthError("");const e=document.getElementById("login-next")?.value||"/admin",t=document.getElementById("login-email")?.value?.trim(),a=document.getElementById("login-password")?.value||"";if(!t||!a){showAuthError("Email and password are required.");return}setAuthSubmitLoading(!0,"Signing in\u2026","Sign in");try{const n=await fetch("/api/auth/login",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,password:a})}),r=await n.json().catch(()=>({}));if(!n.ok){showAuthError(r.error||"Login failed."),setAuthSubmitLoading(!1,"Signing in\u2026","Sign in");return}showAuthSuccess("Signed in. Redirecting\u2026"),window.setTimeout(()=>{window.location.href=e||"/admin"},450)}catch(n){showAuthError(n.message||"Login failed."),setAuthSubmitLoading(!1,"Signing in\u2026","Sign in")}}async function submitSetPassword(){showAuthError("");const e=document.getElementById("password-token")?.value||"",t=document.getElementById("set-password")?.value||"",a=document.getElementById("set-password-confirm")?.value||"";if(t.length<8){showAuthError("Password must be at least 8 characters.");return}if(t!==a){showAuthError("Passwords do not match.");return}setAuthSubmitLoading(!0,"Saving\u2026","Save password");try{const n=await fetch("/api/auth/set-password",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:e,password:t,confirmPassword:a})}),r=await n.json().catch(()=>({}));if(!n.ok){showAuthError(r.error||"Could not set password."),setAuthSubmitLoading(!1,"Saving\u2026","Save password");return}showAuthSuccess("Password saved. Redirecting to sign in\u2026"),window.setTimeout(()=>{window.location.href="/login?saved=1&next=/admin"},1200)}catch(n){showAuthError(n.message||"Could not set password."),setAuthSubmitLoading(!1,"Saving\u2026","Save password")}}function statusLabel(e){return{ready:"Ready",syncing:"Syncing",needs_token:"Needs token",needs_metrics_model:"Needs metrics model",needs_pipelines:"Needs pipelines",needs_sync:"Needs sync",needs_review:"Needs review",sync_error:"Sync failed"}[e]||e}function formatRelativeSync(e,t){if(t==="syncing")return"Syncing now...";if(!e)return"Not synced yet";const a=Date.now()-new Date(e).getTime(),n=Math.round(a/6e4);if(n<2)return"Synced just now";if(n<60)return`Synced ${n} min ago`;const r=Math.round(n/60);return r<24?`Synced ${r} hr ago`:`Synced ${new Date(e).toLocaleString("en-GB")}`}const ICON_SEARCH='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',ICON_PLUS='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',ICON_CALENDAR='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/></svg>',ICON_CHEVRON_LEFT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',ICON_CHEVRON_RIGHT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',ICON_SYNC='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',ICON_CHEVRON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',ICON_CHART='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',ICON_CHECK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';function clientInitials(e){const t=String(e||"?").trim().split(/\s+/).filter(Boolean);return t.length?t.length===1?t[0].slice(0,2).toUpperCase():(t[0][0]+t[1][0]).toUpperCase():"?"}const SYNC_HISTORY_TIMEZONE="Europe/Copenhagen";function formatSyncHistoryTimestamp(e){if(!e)return"\u2014";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("da-DK",{timeZone:SYNC_HISTORY_TIMEZONE,day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})}function formatSyncHistoryDate(e){if(!e)return null;const t=new Date(e);return Number.isNaN(t.getTime())?null:t.toLocaleDateString("da-DK",{timeZone:SYNC_HISTORY_TIMEZONE,day:"numeric",month:"short",year:"numeric"})}function renderSyncStatusBadge(e){const t=String(e||"unknown").toLowerCase();let a="running",n=t;return t==="success"||t==="ok"||t==="cron_tick"?a="success":t==="error"||t==="failed"?a="error":t==="interrupted"?(a="running",n="Interrupted"):t==="skipped"?a="skipped":t==="applying"&&(a="running",n="Applying"),`<span class="sync-status-badge sync-status-badge--${a}">${esc(n)}</span>`}function formatSyncSource(e){return{cron:"Scheduled (cron)","github-actions":"Scheduled (GitHub Actions)","cron-job.org":"Scheduled (cron-job.org)","http-cron":"Scheduled (HTTP cron)","ghl-webhook":"GHL webhook (OpportunityCreate)","fb-lead-retry":"Auto retry (5m worker)","daily-reconcile":"Daily reconcile (01:00 UTC)",admin:"Manual (admin)","vercel-cron":"Scheduled (Vercel cron)",manual:"Manual (admin)",inngest:"Scheduled (legacy)","auto-refresh":"Dashboard auto-refresh",unknown:"Unknown"}[e]||e}function renderSyncHistorySummary(e,t){return`
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
        <div class="sync-history-stat-label">${t==="meta"?"Meta cron schedule":"GHL cron schedule"}</div>
        <div class="sync-history-stat-value" style="font-size:13px;font-family:monospace">${esc(e?.schedule||"\u2014")}</div>
      </div>
    </div>
  `}function renderSyncHistoryRows(e,t){if(!e.length)return'<div class="sync-history-empty">No sync runs logged yet.</div>';const a=t==="meta"?"Spend / details":"Details",n=e.map(r=>{let o="\u2014";if(t==="meta"){const s=[];if(r.thisMonthSpend!=null&&s.push(`${fmtDkk(r.thisMonthSpend)} DKK this month`),r.spendDateStop){const i=formatSyncHistoryDate(r.spendDateStop);i&&s.push(`through ${i}`)}r.errorMessage&&s.push(r.errorMessage),o=s.join(" \xB7 ")||"\u2014"}else r.opportunityCount!=null?(o=`${r.opportunityCount} opportunities`,r.errorMessage&&(o+=` \xB7 ${r.errorMessage}`)):r.errorMessage&&(o=r.errorMessage);return`
      <tr>
        <td>${esc(formatSyncHistoryTimestamp(r.startedAt))}</td>
        <td>${esc(r.accountName||r.clientId)}</td>
        <td>${renderSyncStatusBadge(r.status)}</td>
        <td>${esc(formatSyncSource(r.source))}</td>
        <td class="sync-history-detail">${esc(o)}</td>
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
            <th>${a}</th>
          </tr>
        </thead>
        <tbody>${n}</tbody>
      </table>
    </div>
  `}function renderSyncHistoryPage(e,t){const a=e==="meta"?"Meta ad spend sync history":"GHL / Cenhub sync history",n=e==="meta"?"Every Meta metrics sync \u2014 scheduled, manual, and dashboard auto-refresh. Logs older than 3 days are auto-deleted.":"Every GHL snapshot sync \u2014 scheduled Vercel cron and manual admin syncs. Logs older than 3 days are auto-deleted.",s=e==="ghl"?`<a class="admin-btn admin-btn--secondary" href="/admin/sync-history/${e==="meta"?"ghl":"meta"}">${esc(e==="meta"?"GHL sync log":"Meta sync log")}</a>`:"";return`
    ${renderBrandTopbar(renderStaffAdminChrome(e==="meta"?"meta-sync":"ghl-sync"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero">
      <div class="admin-breadcrumb">
        <a href="/admin">Clients</a>
        <span aria-hidden="true"> / </span>
        <span>${esc(a)}</span>
      </div>
      <h1>${esc(a)}</h1>
      <p>${esc(n)}${t.summary?.totalShown?` \xB7 ${t.summary.totalShown} run(s) shown`:""}</p>
    </div>
    <div class="sync-history-page">
      <div class="sync-history-toolbar">
        <div class="sync-history-toolbar-actions">
          <a class="admin-btn admin-btn--secondary" href="/admin">\u2190 Back to clients</a>
          ${s}
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
  `}let syncHistoryRefreshTimer=null;async function clearSyncHistoryLog(e){if(!isStaffAdmin())return;const t=e==="meta"?"Meta":"GHL",a=e==="meta"?"This only clears the history table. It does not change ad spend data or client sync status.":"This only clears the history table. It does not change GHL snapshot data or client sync status.";if(window.confirm(`Delete all ${t} sync log entries?

${a}`))try{const r=await adminFetch(`/api/sync-history?type=${encodeURIComponent(e)}`,{method:"DELETE"});showToast(`Cleared ${r.deleted||0} log entr${r.deleted===1?"y":"ies"}.`,"success"),await loadSyncHistoryPage(e)}catch(r){showToast(r.message||`Failed to clear ${t} sync log.`,"error")}}function renderSyncHistoryLoginPrompt(e){const t=e==="meta"?"Meta sync log":"GHL sync log";return`
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
  `}async function loadSyncHistoryPage(e,{silent:t=!1}={}){const a=document.getElementById("dashboard");if(!a)return;const n=await fetchStaffMe();if(!n){t||(a.innerHTML=renderSyncHistoryLoginPrompt(e));return}currentStaffUser=n,t||(a.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome(e==="meta"?"meta-sync":"ghl-sync"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading sync history...</p></div>')}
    `);try{const r=await adminFetch(`/api/sync-history?type=${encodeURIComponent(e)}&limit=150`);a.innerHTML=renderSyncHistoryPage(e,r);const o=document.getElementById("sync-history-refresh");o&&(o.onclick=()=>loadSyncHistoryPage(e));const s=document.getElementById("sync-history-clear-log");s&&(s.onclick=()=>clearSyncHistoryLog(e)),syncHistoryRefreshTimer&&(clearInterval(syncHistoryRefreshTimer),syncHistoryRefreshTimer=null),syncHistoryRefreshTimer=window.setInterval(()=>{loadSyncHistoryPage(e,{silent:!0}).catch(()=>{})},6e4)}catch(r){a.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome(e==="meta"?"meta-sync":"ghl-sync"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(r.message)}</div>`)}
    `}}const FB_LEAD_ROUTINE_HIDE_SOURCES=new Set(["cron-job.org","github-actions","vercel-cron","http-cron","daily-reconcile"]);let fbLeadSyncState={clients:[],preflightByClient:{},historyRuns:[],cronSummary24h:null,showRoutineCronRuns:!1,activeRun:null,previewOkByClient:{},applyingRunId:null,isApplying:!1,applyStartedAt:0,applyWaitTimer:null,applyProgress:null};function isRoutineSuccessfulCronRun(e){if(!e||e.dryRun||!FB_LEAD_ROUTINE_HIDE_SOURCES.has(String(e.source||"").trim()))return!1;const t=String(e.status||"").toLowerCase();return!(t==="interrupted"||t==="running"||t!=="success"&&t!=="ok"||(Number(e.updated)||0)>0||(Number(e.errors)||0)>0)}function getFbLeadHistoryRunsForDisplay(e=fbLeadSyncState.historyRuns){return fbLeadSyncState.showRoutineCronRuns?e||[]:(e||[]).filter(t=>!isRoutineSuccessfulCronRun(t))}function formatFbLeadCronLastRun(e){if(!e)return"\u2014";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("en-GB",{timeZone:"UTC",hour:"2-digit",minute:"2-digit",hour12:!1})+" UTC"}function renderFbLeadCronSummary24h(e){const t=e||{totalOpportunitiesCreated:0,totalWebhookSyncs:0,totalRetrySyncs:0,totalWorkerPolls:0,totalUpdated:0,legacyCronRuns:0,byClient:[]},a=(t.byClient||[]).map(n=>`
    <article class="fb-lead-cron-client">
      <h3 class="fb-lead-cron-client-name">${esc(n.accountName||n.clientId)}</h3>
      <dl class="fb-lead-cron-client-meta">
        <div>
          <dt>Opps created</dt>
          <dd>${esc(String(n.opportunitiesCreated||0))}</dd>
        </div>
        <div>
          <dt>Webhook syncs</dt>
          <dd>${esc(String(n.webhookSyncs||0))}</dd>
        </div>
        <div>
          <dt>Retry syncs</dt>
          <dd>${esc(String(n.retrySyncs||0))}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>${esc(String(n.updated||0))}</dd>
        </div>
        <div>
          <dt>Last activity</dt>
          <dd>${esc(formatFbLeadCronLastRun(n.lastActivityAt))}</dd>
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
      ${a?`<div class="fb-lead-cron-client-grid">${a}</div>`:""}
    </section>
  `}let fbLeadSyncRefreshTimer=null;function clientFbLeadFieldReady(e){const t=fbLeadSyncState.preflightByClient[e?.clientId];return!(t?.fbLeadFieldMissing===!0||t?.fbLeadFieldExists===!1)}function getClientFbLeadFieldHint(e){return(fbLeadSyncState.preflightByClient[e?.clientId]||{}).fbLeadFieldHint||'Create a contact custom field named "Fb Lead id" in GHL (Settings \u2192 Custom Fields \u2192 Contact), then click Refresh.'}function renderFbLeadFieldWarnings(e){const t=(e||[]).filter(a=>!clientFbLeadFieldReady(a));return t.length?t.map(a=>`
    <div class="fb-lead-field-warning" id="fb-lead-field-warning-${esc(a.clientId)}">
      <strong>${esc(a.accountName)} \u2014 Fb Lead id field missing in GHL</strong>
      <p>${esc(getClientFbLeadFieldHint(a))}</p>
      <div class="fb-lead-field-warning-actions">
        <a class="admin-btn admin-btn--secondary admin-btn--small" href="/admin/${encodeURIComponent(a.clientId)}">Open client setup</a>
        <button class="admin-btn admin-btn--ghost admin-btn--small" type="button" onclick="loadFbLeadSyncPage()">Refresh check</button>
      </div>
    </div>
  `).join(""):""}function renderFbLeadReadinessBadges(e){const t=fbLeadSyncState.preflightByClient[e.clientId]||{},a=clientFbLeadFieldReady(e)&&t.fbLeadFieldExists!==!1;return`<div class="fb-lead-readiness">${[{key:"metaPageId",label:"Page",ok:!!e.metaPageId},{key:"ghl",label:"GHL",ok:e.hasGhlToken&&e.locationId},{key:"metaToken",label:"Meta token",ok:e.hasMetaToken},{key:"field",label:"Fb Lead id",ok:a}].map(r=>`<span class="fb-lead-badge${r.ok?" is-ok":" is-missing"}">${esc(r.label)}</span>`).join("")}</div>`}function ghlContactUrl(e,t){return!e||!t?null:`https://app.gohighlevel.com/v2/location/${encodeURIComponent(e)}/contacts/detail/${encodeURIComponent(t)}`}function fbLeadRunHasLaterSuccessfulRun(e,t,{dryRunOnly:a=!1,applyOnly:n=!1}={}){const r=Date.parse(t.startedAt||"");return Number.isFinite(r)?(e||[]).some(o=>{if(o.id===t.id||o.clientId!==t.clientId||(o.mode||"recent")!==(t.mode||"recent")||a&&!o.dryRun||n&&o.dryRun)return!1;const s=String(o.status||"").toLowerCase();return s!=="success"&&s!=="ok"?!1:Date.parse(o.startedAt||"")>r}):!1}function fbLeadRunHasLaterApply(e,t){return fbLeadRunHasLaterSuccessfulRun(e,t,{applyOnly:!0})}function dryRunIsReadyForApply(e,t=fbLeadSyncState.historyRuns){return e?!!(e.dryRun&&String(e.status||"").toLowerCase()==="success"&&(e.updated||0)>0&&!fbLeadRunHasLaterApply(t,e)&&!fbLeadRunHasLaterSuccessfulRun(t,e,{dryRunOnly:!0})):!1}function findActionablePreviewRun(e,t="backfill",a=fbLeadSyncState.historyRuns){return(a||[]).filter(n=>n.clientId===e&&(n.mode||"backfill")===t&&dryRunIsReadyForApply(n,a)).sort((n,r)=>Date.parse(r.startedAt||"")-Date.parse(n.startedAt||""))[0]||null}function clientPreviewAllSynced(e){if(!e?.lastRun)return!1;const t=e.lastRun;return!!(t.dryRun&&(t.mode||"backfill")==="backfill"&&String(t.status||"").toLowerCase()==="success"&&(t.updated||0)===0&&!findActionablePreviewRun(e.clientId,"backfill"))}function clientHasReadyPreview(e){if(!e)return!1;const t=fbLeadSyncState.previewOkByClient[e.clientId];return t&&(t.updated||0)>0?!!findActionablePreviewRun(e.clientId,t.mode||"backfill"):!!findActionablePreviewRun(e.clientId,"backfill")}function clearFbLeadPreviewReady(e){delete fbLeadSyncState.previewOkByClient[e];try{const t=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");delete t[e],sessionStorage.setItem("fbLeadSyncPreviewOk",JSON.stringify(t))}catch{}}function markFbLeadPreviewReady(e,t,a){if((a||0)<=0){clearFbLeadPreviewReady(e);return}fbLeadSyncState.previewOkByClient[e]={mode:t,updated:a,at:Date.now()};try{const n=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");n[e]={mode:t,updated:a,at:Date.now()},sessionStorage.setItem("fbLeadSyncPreviewOk",JSON.stringify(n))}catch{}}function hydrateFbLeadPreviewState(e){try{const t=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");for(const[a,n]of Object.entries(t))(n?.updated||0)>0&&(fbLeadSyncState.previewOkByClient[a]=n)}catch{}for(const t of e||[]){const a=findActionablePreviewRun(t.clientId,"backfill");a?fbLeadSyncState.previewOkByClient[t.clientId]={mode:a.mode||"backfill",updated:a.updated||0,at:Date.parse(a.startedAt||"")||Date.now()}:clearFbLeadPreviewReady(t.clientId)}}function isPartialSyncRun(e){if(!e)return!1;const t=Number(e.batchOffset)||0,a=Number(e.inWindow)||0;if(a<=0||t<=0||t>=a)return!1;const n=String(e.status||"").toLowerCase();return n==="interrupted"||n==="error"||n==="running"}function findPartialSyncRun(e,t="backfill",a=!1){return(fbLeadSyncState.historyRuns||[]).find(n=>isPartialSyncRun(n)&&n.clientId===e&&!!n.dryRun==!!a&&(n.mode||"backfill")===t)||null}function partialSyncRemaining(e){return Math.max(0,(Number(e.inWindow)||0)-(Number(e.batchOffset)||0))}async function resumeFbLeadRunFromHistory(e){const t=fbLeadSyncState.historyRuns.find(s=>Number(s.id)===Number(e));if(!t||!isPartialSyncRun(t)){showToast("Nothing to resume for this run.","error");return}const a=fbLeadSyncState.clients.find(s=>s.clientId===t.clientId);if(!clientFbLeadFieldReady(a)){showToast(getClientFbLeadFieldHint(a),"error");return}const n=partialSyncRemaining(t),r=t.dryRun?"preview":"apply";window.confirm(`Resume interrupted ${r} for ${t.clientId}?

${t.updated||0} processed so far \xB7 ${n} lead(s) remaining.`)&&(fbLeadSyncState.activeRun={clientId:t.clientId,mode:t.mode||"backfill",runId:t.id,previewOk:!t.dryRun,previewRunId:t.dryRun?null:t.id},await runFbLeadSyncBatch({clientId:t.clientId,mode:t.mode||"backfill",dryRun:!!t.dryRun,resumeRunId:t.id}))}async function applyFbLeadSyncFromHistory(e){const t=fbLeadSyncState.historyRuns.find(n=>Number(n.id)===Number(e));if(!t){showToast("Run not found. Refresh the page.","error");return}const a=fbLeadSyncState.clients.find(n=>n.clientId===t.clientId);if(!clientFbLeadFieldReady(a)){showToast(getClientFbLeadFieldHint(a),"error");return}await applyFbLeadSync(t.clientId,t.mode||"backfill",{previewRunId:e})}async function applyFbLeadSync(e,t="backfill",{previewRunId:a=null}={}){if(fbLeadSyncState.applyingRunId!=null){showToast("An apply is already running. Wait for it to finish.","error");return}const n=fbLeadSyncState.clients.find(c=>c.clientId===e);if(!clientFbLeadFieldReady(n)){showToast(getClientFbLeadFieldHint(n),"error");return}const r=a!=null?fbLeadSyncState.historyRuns.find(c=>Number(c.id)===Number(a)):null,o=r?dryRunIsReadyForApply(r):clientHasReadyPreview(n);if(t==="backfill"&&!o){showToast("No completed preview found. Run Preview first.","error");return}const s=r?.updated??fbLeadSyncState.previewOkByClient[e]?.updated??n?.lastRun?.updated??0,i=findPartialSyncRun(e,t,!1);if(i){const c=partialSyncRemaining(i);if(!window.confirm(`An apply for ${e} was interrupted (${i.updated||0} already processed, ${c} remaining).

Resume the interrupted apply instead of starting over?`))return;fbLeadSyncState.activeRun={clientId:e,mode:t,runId:i.id,previewOk:!0,previewRunId:a},await runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!1,resumeRunId:i.id});return}window.confirm(`Apply ${t==="backfill"?"90-day backfill":"recent sync"} for ${e}?

${s} contact(s) will get Fb Lead id written in GHL. This writes live data.`)&&(fbLeadSyncState.activeRun={clientId:e,mode:t,runId:null,previewOk:!0,previewRunId:a},await runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!1}))}async function refreshFbLeadClientRowsUi(){const e=document.getElementById("fb-lead-clients-mount"),t=document.getElementById("fb-lead-field-warnings-mount");e&&(e.innerHTML=renderFbLeadClientRows(fbLeadSyncState.clients)),t&&(t.innerHTML=renderFbLeadFieldWarnings(fbLeadSyncState.clients)),bindFbLeadSyncToggles()}function renderFbLeadClientActions(e){const t=esc(e.clientId),a=e.metaPageId?"":`<a class="admin-btn admin-btn--ghost admin-btn--small" href="/admin/${encodeURIComponent(e.clientId)}">Setup</a>`;return`
    <div class="fb-lead-client-actions">
      <button class="admin-btn admin-btn--secondary admin-btn--small" type="button"
        onclick="openFbLeadRunPanel('${t}', 'recent')">Preview</button>
      <button class="admin-btn admin-btn--secondary admin-btn--small" type="button"
        onclick="openFbLeadRunPanel('${t}', 'backfill')">Backfill</button>
      <button class="admin-btn admin-btn--ghost admin-btn--small" type="button"
        onclick="viewFbLeadClientHistory('${t}')">View log</button>
      ${a}
    </div>
  `}function lastRunIsSuccessfulApply(e){if(!e||e.dryRun)return!1;const t=String(e.status||"").toLowerCase();return t==="success"||t==="ok"}function lastRunIsSuccessfulPreview(e){if(!e||!e.dryRun)return!1;const t=String(e.status||"").toLowerCase();return t==="success"||t==="ok"}function resolveFbLeadClientStats(e,t={}){const a=e?.displayStats||{},n=t.metaLeadCount90d??a.metaLeadCount90d??null,r=t.estimatedMissing??a.outstanding??null,o=t.estimatedMissing!=null?"Estimated contacts still missing Fb Lead id (from a Meta sample)":a.outstandingHint||"Estimated contacts still missing Fb Lead id (from a Meta sample)";return{metaLeads:n!=null?String(n):"\u2014",missing:r!=null?String(r):"\u2014",missingTitle:o}}function formatFbLeadLastRunLabel(e){if(!e)return"\u2014";const t=[e.dryRun?"preview":e.status,`${e.updated||0} ${e.dryRun?"would update":"updated"}`];return(e.skippedNoMatch??0)>0&&t.push(`${e.skippedNoMatch} no match`),t.join(" \xB7 ")}function renderFbLeadClientRows(e){return e.length?`
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
        <tbody>${e.map(a=>{const n=fbLeadSyncState.preflightByClient[a.clientId]||{},r=resolveFbLeadClientStats(a,n),o=formatFbLeadLastRunLabel(a.lastRun);return`
      <tr>
        <td>
          <strong>${esc(a.accountName)}</strong><br>
          <span style="color:var(--text-soft);font-size:12px">${esc(a.clientId)}</span>
        </td>
        <td>
          <input type="checkbox" class="fb-lead-toggle" data-fb-sync-toggle="${esc(a.clientId)}"
            ${a.fbLeadSyncEnabled?"checked":""} aria-label="Enable auto-sync for ${esc(a.accountName)}" />
        </td>
        <td>${renderFbLeadReadinessBadges(a)}</td>
        <td>${esc(r.metaLeads)}</td>
        <td title="${esc(r.missingTitle||"")}">${esc(r.missing)}</td>
        <td>${esc(o)}</td>
        <td class="fb-lead-client-actions-cell">${renderFbLeadClientActions(a)}</td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `:'<div class="sync-history-empty">No clients configured yet.</div>'}function renderFbLeadClientRowsWrapper(e){return`<div id="fb-lead-clients-mount">${renderFbLeadClientRows(e)}</div>`}function renderFbLeadHistoryRows(e,t={}){const a=getFbLeadHistoryRunsForDisplay(e);if(!a.length){const r=fbLeadSyncState.showRoutineCronRuns?0:(e||[]).filter(o=>isRoutineSuccessfulCronRun(o)).length;return r>0?`<div class="sync-history-empty">${r} routine auto-sync run(s) hidden \u2014 enable <strong>Show routine auto-sync runs</strong> above to view them.</div>`:'<div class="sync-history-empty">No FB lead sync runs logged yet.</div>'}return e=a,`
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
        <tbody>${e.map(r=>{const o=[r.mode,r.dryRun?"dry-run":"apply",r.dryRun?`${r.updated||0} would update`:`${r.updated||0} updated`,`${r.skippedNoMatch||0} no match`,r.errors?`${r.errors} errors`:null].filter(Boolean).join(" \xB7 "),s=dryRunIsReadyForApply(r,e)&&!fbLeadSyncState.isApplying,i=isPartialSyncRun(r)&&!fbLeadSyncState.isApplying,l=fbLeadSyncState.isApplying&&fbLeadSyncState.applyingRunId===r.id,c=renderSyncStatusBadge(l?"applying":r.status);return`
      <tr class="fb-lead-audit-row${l?" is-applying":""}">
        <td>${esc(formatSyncHistoryTimestamp(r.startedAt))}</td>
        <td>${esc(r.accountName||r.clientId)}</td>
        <td>${c}</td>
        <td>${esc(r.mode||"recent")}</td>
        <td>${esc(formatSyncSource(r.source))}</td>
        <td class="sync-history-detail">${esc(o)}</td>
        <td>
          <div class="fb-lead-history-actions">
            ${l?'<span class="fb-lead-history-status-note">In progress above</span>':i?`<button class="admin-btn admin-btn--primary admin-btn--small" type="button" onclick="resumeFbLeadRunFromHistory(${Number(r.id)})">Resume (${partialSyncRemaining(r)})</button>`:s?`<button class="admin-btn admin-btn--primary admin-btn--small" type="button" data-fb-apply-run="${Number(r.id)}" data-apply-count="${Number(r.updated||0)}" onclick="applyFbLeadSyncFromHistory(${Number(r.id)})">Apply (${r.updated})</button>`:""}
            <button class="admin-btn admin-btn--ghost admin-btn--small" type="button" onclick="expandFbLeadRun(${Number(r.id)})">Audit</button>
            ${isStaffAdmin()?`<button class="admin-btn admin-btn--ghost admin-btn--small" type="button" onclick="deleteFbLeadRun(${Number(r.id)})">Delete</button>`:""}
          </div>
        </td>
      </tr>
      <tr id="fb-lead-run-audit-${Number(r.id)}" hidden>
        <td colspan="7"><div class="fb-lead-audit-scroll" id="fb-lead-audit-scroll-${Number(r.id)}">${renderFbLeadAuditTable(r.rows||[],t[r.clientId])}</div></td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `}function renderFbLeadAuditTable(e,t){if(!e.length)return'<div class="sync-history-empty" style="padding:12px">No contact-level rows stored for this run.</div>';const a=e.map(r=>{const o=ghlContactUrl(t,r.contactId),s=o?`<a href="${esc(o)}" target="_blank" rel="noopener noreferrer">Open in GHL</a>`:"\u2014";return`
      <tr>
        <td>${esc(r.email||r.phone||"\u2014")}</td>
        <td><code>${esc(r.metaLeadId||"\u2014")}</code></td>
        <td>${esc(r.contactId||"\u2014")}</td>
        <td>${renderSyncStatusBadge(r.status)}</td>
        <td>${esc(r.error||"")}</td>
        <td>${s}</td>
      </tr>
    `}).join(""),n=e.length===1?"1 contact row":`${e.length} contact rows`;return`
    <div class="fb-lead-audit-scroll-inner">
      <p style="color:var(--text-soft);font-size:12px;margin:0 0 8px;padding:8px 8px 0">${esc(n)} \u2014 scroll inside panel</p>
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
        <tbody>${a}</tbody>
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
      <div class="fb-lead-banner">
        Meta only stores Lead Ads for roughly the last <strong>90 days</strong>. Backfill cannot match older GHL contacts to leads outside that window.
      </div>
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
  `}async function toggleFbLeadSyncEnabled(e,t){try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"PUT",body:JSON.stringify({fbLeadSyncEnabled:t})}),showToast(t?"Automatic FB lead sync enabled":"Automatic FB lead sync disabled","success");const a=fbLeadSyncState.clients.find(n=>n.clientId===e);a&&(a.fbLeadSyncEnabled=t)}catch(a){showToast(a.message||"Failed to update auto-sync setting.","error"),await loadFbLeadSyncPage({silent:!0})}}function bindFbLeadSyncToggles(){document.querySelectorAll("[data-fb-sync-toggle]").forEach(e=>{e.onchange=()=>toggleFbLeadSyncEnabled(e.dataset.fbSyncToggle,e.checked)})}async function loadFbLeadPreflightForClients(e,{quick:t=!1}={}){const a=t?"&quick=1":"";await Promise.all((e||[]).map(async n=>{const r=fbLeadSyncState.preflightByClient[n.clientId]||{};try{const o=await adminFetch(`/api/fb-lead-sync/preflight?client=${encodeURIComponent(n.clientId)}${a}`);fbLeadSyncState.preflightByClient[n.clientId]=t?{...o,metaLeadCount90d:o.metaLeadCount90d??r.metaLeadCount90d??null,estimatedMissing:o.estimatedMissing??r.estimatedMissing??null,sampleSize:o.sampleSize||r.sampleSize||0,sampleWouldUpdate:o.sampleWouldUpdate??r.sampleWouldUpdate??0}:o}catch(o){fbLeadSyncState.preflightByClient[n.clientId]={...r,preflightError:o.message}}}))}function scheduleFbLeadFullPreflight(e){e?.length&&loadFbLeadPreflightForClients(e,{quick:!1}).then(()=>refreshFbLeadClientRowsUi()).catch(()=>{})}async function loadFbLeadHistory(e=50){const t=await adminFetch(`/api/fb-lead-sync/history?limit=${e}`);return fbLeadSyncState.historyRuns=t.runs||[],t}function renderFbLeadRunPanel(e,t="recent"){const a=fbLeadSyncState.clients.find(o=>o.clientId===e),n=clientHasReadyPreview(a),r=t==="backfill"?"Backfill (90 days)":"Recent (2 days)";return`
    <div class="fb-lead-run-panel" id="fb-lead-run-panel">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <strong>${esc(a?.accountName||e)}</strong>
          <div style="color:var(--text-soft);font-size:13px;margin-top:4px">${esc(r)}</div>
        </div>
        <button class="admin-btn admin-btn--ghost" type="button" onclick="closeFbLeadRunPanel()">Close</button>
      </div>
      ${t==="backfill"&&n?'<div class="fb-lead-banner" style="margin-top:12px;margin-bottom:0;background:#e8f7ef;border-color:#b8e6cf;color:#138b53">Preview complete \u2014 use <strong>Apply</strong> on that run in <strong>Run history</strong> below.</div>':t==="backfill"&&clientPreviewAllSynced(a)?'<div class="fb-lead-banner" style="margin-top:12px;margin-bottom:0;background:#e8f7ef;border-color:#b8e6cf;color:#138b53">All contacts already have <strong>Fb Lead id</strong> \u2014 nothing to apply.</div>':t==="backfill"?'<div class="fb-lead-banner" style="margin-top:12px;margin-bottom:0">Run Preview first. Backfill only matches leads Meta still has (~90 days).</div>':""}
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
  `}function closeFbLeadRunPanel(){const e=document.getElementById("fb-lead-run-panel-mount");e&&(e.innerHTML=""),fbLeadSyncState.activeRun=null}function openFbLeadRunPanel(e,t){const a=fbLeadSyncState.clients.find(o=>o.clientId===e);if(!clientFbLeadFieldReady(a)){showToast(getClientFbLeadFieldHint(a),"error");return}const n=document.getElementById("fb-lead-run-panel-mount");if(!n)return;fbLeadSyncState.activeRun={clientId:e,mode:t,runId:null,previewOk:clientHasReadyPreview(fbLeadSyncState.clients.find(o=>o.clientId===e))},n.innerHTML=renderFbLeadRunPanel(e,t);const r=document.getElementById("fb-lead-preview-btn");r&&(r.onclick=()=>runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!0})),n.scrollIntoView({behavior:"smooth",block:"nearest"})}function renderFbLeadRunResults(e){const t=e.rows||[];if(!t.length)return'<div class="sync-history-empty" style="padding:12px">No rows in this batch.</div>';const a=t.map(o=>`
    <tr>
      <td>${esc(o.email||o.phone||"\u2014")}</td>
      <td><code>${esc(o.metaLeadId||"\u2014")}</code></td>
      <td>${esc(o.contactId||"\u2014")}</td>
      <td>${renderSyncStatusBadge(o.status)}</td>
    </tr>
  `).join(""),n=e.nextBatchOffset??(e.batchOffset||0)+(e.batchProcessed||0),r=e.inWindow||n;return`
    <div class="fb-lead-audit-scroll">
      <table class="sync-history-table">
        <thead><tr><th>Email / phone</th><th>Meta lead id</th><th>GHL contact</th><th>Status</th></tr></thead>
        <tbody>${a}</tbody>
      </table>
    </div>
    <p style="color:var(--text-soft);font-size:12px;margin-top:8px">
      ${n} / ${r} leads scanned \xB7 ${e.updated||0} would update/updated \xB7 ${e.errors||0} errors
    </p>
  `}function renderGlobalApplyProgress(e,t,a=0){const n=fbLeadSyncState.clients.find(s=>s.clientId===e),r=t==="backfill"?"90-day backfill":"recent sync",o=a>0?`${a} contact(s)`:"contacts";return`
    <div class="fb-lead-apply-progress-card" id="fb-lead-global-progress-card">
      <div class="fb-lead-apply-progress-header">
        <div>
          <strong>Writing to GHL \u2014 ${esc(r)}</strong>
          <div class="fb-lead-apply-progress-sub">${esc(n?.accountName||e)} \xB7 ${esc(o)}</div>
        </div>
        <span class="fb-lead-badge is-ok" id="fb-lead-apply-status-badge">Running</span>
      </div>
      <div class="fb-lead-apply-progress-stats" id="fb-lead-global-progress-stats">Preparing\u2026</div>
      <div class="fb-lead-progress is-visible is-indeterminate" id="fb-lead-global-progress">
        <div class="fb-lead-progress-bar" id="fb-lead-global-progress-bar"></div>
      </div>
      <div class="fb-lead-progress-label" id="fb-lead-global-progress-label">Starting apply \u2014 do not close this page</div>
    </div>
  `}function startGlobalApplyProgress(e,t,a=0){const n=document.getElementById("fb-lead-apply-progress-mount");n&&(fbLeadSyncState.isApplying=!0,fbLeadSyncState.applyStartedAt=Date.now(),fbLeadSyncState.applyProgress=null,n.innerHTML=renderGlobalApplyProgress(e,t,a),n.scrollIntoView({behavior:"smooth",block:"nearest"}),fbLeadSyncState.applyWaitTimer&&clearInterval(fbLeadSyncState.applyWaitTimer),fbLeadSyncState.applyWaitTimer=window.setInterval(()=>{if(!fbLeadSyncState.isApplying)return;const r=Math.floor((Date.now()-fbLeadSyncState.applyStartedAt)/1e3),o=fbLeadSyncState.applyProgress;o?.total>0?updateGlobalApplyProgress({...o,waiting:!0,elapsed:r}):updateGlobalApplyProgress({waiting:!0,elapsed:r})},1e3))}function updateGlobalApplyProgress({processed:e,total:t,written:a,waiting:n=!1,elapsed:r=0,complete:o=!1,error:s=""}={}){const i=document.getElementById("fb-lead-global-progress-card"),l=document.getElementById("fb-lead-global-progress"),c=document.getElementById("fb-lead-global-progress-bar"),d=document.getElementById("fb-lead-global-progress-label"),u=document.getElementById("fb-lead-global-progress-stats"),p=document.getElementById("fb-lead-apply-status-badge");if(!i||!l||!c||!d)return;const h=fbLeadSyncState.applyProgress||{},m=e??h.processed??0,g=t??h.total??0,b=a??h.written??0;!o&&!s&&(g>0||m>0)&&(fbLeadSyncState.applyProgress={processed:m,total:g,written:b});const f=g>0||m>0;if(n&&!f&&!o){l.classList.add("is-indeterminate"),c.style.width="35%",u&&(u.textContent="Contacting Meta and GHL\u2026"),d.textContent=`Writing to GHL\u2026 (${r}s \u2014 do not close this page)`;return}l.classList.remove("is-indeterminate");const v=g>0?Math.min(100,Math.round(m/g*100)):o?100:0;c.style.width=`${v}%`,u&&(u.textContent=o?`${b} written to GHL \xB7 ${m} / ${g} contacts processed`:`${b} written \xB7 ${m} / ${g} contacts (${v}%)`),o?(i.classList.add("is-complete"),i.classList.remove("is-error"),d.textContent=`Complete \u2014 ${b} contact(s) updated in GHL`,p&&(p.textContent="Complete",p.classList.add("is-ok"),p.classList.remove("is-missing"))):s?(i.classList.add("is-error"),i.classList.remove("is-complete"),d.textContent=s,p&&(p.textContent="Failed",p.classList.remove("is-ok"),p.classList.add("is-missing"))):n&&f?d.textContent=m>=g?`Finishing up\u2026 (${r}s)`:`Batch in progress \u2014 ${m} / ${g} leads (${v}%) \xB7 ${r}s`:d.textContent=`Writing to GHL \u2014 ${m} / ${g} leads (${v}%)`}function stopGlobalApplyProgress({success:e=!0,keepVisibleMs:t=6e3}={}){fbLeadSyncState.isApplying=!1,fbLeadSyncState.applyProgress=null,fbLeadSyncState.applyWaitTimer&&(clearInterval(fbLeadSyncState.applyWaitTimer),fbLeadSyncState.applyWaitTimer=null),window.setTimeout(()=>{const a=document.getElementById("fb-lead-apply-progress-mount");a&&!fbLeadSyncState.isApplying&&(a.innerHTML="")},t)}function setFbLeadProgress({processed:e=0,total:t=0,complete:a=!1,label:n=""}={}){const r=document.getElementById("fb-lead-progress-wrap"),o=document.getElementById("fb-lead-progress-bar"),s=document.getElementById("fb-lead-progress-label");if(!r||!o)return;r.hidden=!1,r.classList.toggle("is-complete",a);const i=t>0?Math.min(100,Math.round(e/t*100)):a?100:0;o.style.width=`${i}%`,s&&(s.textContent=n||(a?`Complete \u2014 ${e} / ${t} leads (${i}%)`:`Processing \u2014 ${e} / ${t} leads (${i}%)`))}function hideFbLeadProgress(e=!0){const t=document.getElementById("fb-lead-progress-wrap"),a=document.getElementById("fb-lead-progress-bar");t&&e&&(t.hidden=!0,t.classList.remove("is-complete"),a&&(a.style.width="0%"))}function updateFbLeadHistoryClearButton(){const e=document.getElementById("fb-lead-history-clear-all");if(!e)return;const t=(fbLeadSyncState.historyRuns||[]).length>0;e.disabled=!t}function updateFbLeadCronSummaryUi(){const e=document.getElementById("fb-lead-cron-summary-24h");!e||!fbLeadSyncState.cronSummary24h||(e.outerHTML=renderFbLeadCronSummary24h(fbLeadSyncState.cronSummary24h))}async function refreshFbLeadHistoryUi(){await loadFbLeadHistory();const e=document.getElementById("fb-lead-history-mount");if(!e)return;const t=Object.fromEntries(fbLeadSyncState.clients.map(a=>[a.clientId,a.locationId]));e.innerHTML=renderFbLeadHistoryRows(fbLeadSyncState.historyRuns,t),updateFbLeadHistoryClearButton()}function bindFbLeadHistoryClearButton(){const e=document.getElementById("fb-lead-history-clear-all");e&&(e.onclick=()=>clearFbLeadSyncHistory());const t=document.getElementById("fb-lead-show-routine-cron");t&&(t.checked=fbLeadSyncState.showRoutineCronRuns,t.onchange=()=>{fbLeadSyncState.showRoutineCronRuns=t.checked;const a=document.getElementById("fb-lead-history-mount");if(!a)return;const n=Object.fromEntries(fbLeadSyncState.clients.map(r=>[r.clientId,r.locationId]));a.innerHTML=renderFbLeadHistoryRows(fbLeadSyncState.historyRuns,n)}),updateFbLeadHistoryClearButton()}async function clearFbLeadSyncHistory(){if(!(!isStaffAdmin()||!window.confirm(`Delete all FB lead sync run history?

This only clears the log \u2014 it does not change GHL contacts or Meta data.`)))try{const t=await adminFetch("/api/fb-lead-sync/history",{method:"DELETE"});showToast(`Cleared ${t.deleted||0} run(s).`,"success"),await refreshFbLeadHistoryUi(),await loadFbLeadSyncPage({silent:!0})}catch(t){showToast(t.message||"Failed to clear FB lead sync log.","error")}}async function deleteFbLeadRun(e){if(!(!isStaffAdmin()||!window.confirm(`Delete run #${e} from history?`)))try{await adminFetch(`/api/fb-lead-sync/history/${e}`,{method:"DELETE"}),showToast("Run deleted.","success"),await refreshFbLeadHistoryUi(),await loadFbLeadSyncPage({silent:!0})}catch(a){showToast(a.message||"Failed to delete run.","error")}}async function runFbLeadSyncBatch({clientId:e,mode:t,dryRun:a,resumeRunId:n=null}){const r=document.getElementById("fb-lead-preview-btn"),o=document.getElementById("fb-lead-run-results");r&&(r.disabled=!0);const s=a?12:10,i=n!=null?fbLeadSyncState.historyRuns.find(b=>Number(b.id)===Number(n)):null;let l=i?.id||fbLeadSyncState.activeRun?.runId||null,c=i&&Number(i.batchOffset)||0,d=null,u=[],p=!1;const h=n??fbLeadSyncState.activeRun?.previewRunId??null,m=h!=null?fbLeadSyncState.historyRuns.find(b=>Number(b.id)===Number(h)):null,g=i?partialSyncRemaining(i):m?.updated??fbLeadSyncState.previewOkByClient[e]?.updated??0;a||(fbLeadSyncState.applyingRunId=h,startGlobalApplyProgress(e,t,g),await refreshFbLeadHistoryUi());try{if(!n){const $=findPartialSyncRun(e,t,a);if($){const w=partialSyncRemaining($),S=a?"preview":"apply";window.confirm(`A ${S} for ${e} was interrupted (${$.updated||0} processed, ${w} remaining).

Resume the interrupted ${S}?`)&&(l=$.id,c=Number($.batchOffset)||0)}}if(a?setFbLeadProgress({processed:c,total:0,label:c>0?"Resuming preview\u2026":"Fetching Meta leads\u2026"}):updateGlobalApplyProgress({waiting:!0,elapsed:0}),a&&c===0){const $=await adminFetchWithRetry("/api/fb-lead-sync/prepare",{method:"POST",body:JSON.stringify({clientId:e,mode:t,dryRun:a,runId:l})}),w=$.summary||$;l=w.runId,c=0,setFbLeadProgress({processed:0,total:w.inWindow||0,label:`Matching ${w.inWindow||0} Meta leads to GHL\u2026`})}else!a&&c===0&&updateGlobalApplyProgress({waiting:!1,processed:0,total:g||m?.updated||0});do{d=await adminFetchWithRetry("/api/fb-lead-sync/run",{method:"POST",body:JSON.stringify({clientId:e,mode:t,dryRun:a,runId:l,previewRunId:a?null:h,batchOffset:c,batchLimit:s})});const $=d.summary||d;l=$.runId,c=$.nextBatchOffset??$.batchOffset+($.batchProcessed||0),u=u.concat($.rows||[]),fbLeadSyncState.activeRun&&(fbLeadSyncState.activeRun.runId=l);const w=$.inWindow||c||g;a?(setFbLeadProgress({processed:c,total:w,complete:!$.hasMore}),o&&(o.innerHTML=renderFbLeadRunResults({...$,rows:u}))):updateGlobalApplyProgress({processed:c,total:w,written:$.updated||0,complete:!$.hasMore})}while((d.summary||d).hasMore);p=!0;const b=d.summary||d,f=b.inWindow||c||g,v=b.nextBatchOffset??c;if(a)setFbLeadProgress({processed:v,total:f,complete:!0}),markFbLeadPreviewReady(e,t,b.updated),fbLeadSyncState.activeRun&&(fbLeadSyncState.activeRun.previewOk=(b.updated||0)>0),showToast((b.updated||0)>0?"Preview complete \u2014 use Apply in Run history below.":"Preview complete \u2014 all contacts already have Fb Lead id. Nothing to apply.","success"),await refreshFbLeadHistoryUi(),document.getElementById("fb-lead-history-mount")?.scrollIntoView({behavior:"smooth",block:"nearest"});else{updateGlobalApplyProgress({processed:v,total:f,written:b.updated||0,complete:!0}),delete fbLeadSyncState.previewOkByClient[e];try{const $=JSON.parse(sessionStorage.getItem("fbLeadSyncPreviewOk")||"{}");delete $[e],sessionStorage.setItem("fbLeadSyncPreviewOk",JSON.stringify($))}catch{}showToast("FB lead sync complete \u2014 Fb Lead id written to GHL","success"),stopGlobalApplyProgress({success:!0})}await refreshFbLeadHistoryUi();const y=await adminFetch("/api/fb-lead-sync");fbLeadSyncState.clients=y.clients||[],hydrateFbLeadPreviewState(fbLeadSyncState.clients),await refreshFbLeadClientRowsUi()}catch(b){a?hideFbLeadProgress(!0):(updateGlobalApplyProgress({error:`Failed \u2014 ${b.message||"Apply failed"}`}),stopGlobalApplyProgress({success:!1,keepVisibleMs:12e3})),showToast((b.message||(a?"FB lead preview failed.":"FB lead apply failed."))+(a?" Partial progress is saved \u2014 use Resume in Run history or try Preview again.":" Partial progress is saved \u2014 use Resume in Run history."),"error"),await refreshFbLeadHistoryUi()}finally{r&&(r.disabled=!1),fbLeadSyncState.applyingRunId=null,!p&&a&&hideFbLeadProgress(!0),!a&&!p&&(fbLeadSyncState.isApplying=!1,await refreshFbLeadHistoryUi())}}async function expandFbLeadRun(e){const t=document.getElementById(`fb-lead-run-audit-${e}`);if(t){if(!t.hidden){t.hidden=!0;return}try{const a=await adminFetch(`/api/fb-lead-sync/history/${e}`),n=fbLeadSyncState.clients.find(o=>o.clientId===a.run.clientId);t.innerHTML=`<td colspan="7"><div class="fb-lead-audit-scroll" id="fb-lead-audit-scroll-${e}">${renderFbLeadAuditTable(a.run.rows||[],a.run.locationId||n?.locationId)}</div></td>`,t.hidden=!1;const r=document.getElementById(`fb-lead-audit-scroll-${e}`);r&&r.scrollIntoView({behavior:"smooth",block:"nearest"})}catch(a){showToast(a.message||"Failed to load run audit.","error")}}}function viewFbLeadClientHistory(e){const t=getFbLeadHistoryRunsForDisplay(fbLeadSyncState.historyRuns.filter(r=>r.clientId===e)),a=document.getElementById("fb-lead-history-mount");if(!a)return;const n=Object.fromEntries(fbLeadSyncState.clients.map(r=>[r.clientId,r.locationId]));a.innerHTML=t.length?renderFbLeadHistoryRows(t,n):`<div class="sync-history-empty">No runs for ${esc(e)} yet.</div>`,a.scrollIntoView({behavior:"smooth",block:"start"})}async function loadFbLeadSyncPage({silent:e=!1,fullPreflight:t=!1}={}){const a=document.getElementById("dashboard");if(!a)return;const n=await fetchStaffMe();if(!n){e||(a.innerHTML=`
        ${renderBrandTopbar("")}
        ${wrapDashboardShell(`
          <div class="page-hero admin-hub-hero"><h1>FB lead sync</h1><p>Sign in to manage FB lead ID sync.</p></div>
          <div class="sync-history-page">
            <div class="sync-history-empty" style="padding:24px;text-align:center">
              <a class="admin-btn admin-btn--primary" href="/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}">Sign in</a>
            </div>
          </div>
        `)}
      `);return}currentStaffUser=n,e||(a.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading FB lead sync...</p></div>')}
    `);try{if(e&&fbLeadSyncState.isApplying)return;const[r]=await Promise.all([adminFetch("/api/fb-lead-sync"),loadFbLeadHistory()]);if(fbLeadSyncState.clients=r.clients||[],fbLeadSyncState.cronSummary24h=r.summary?.cronSummary24h||null,hydrateFbLeadPreviewState(fbLeadSyncState.clients),!e){a.innerHTML=renderFbLeadSyncPage(r),bindFbLeadSyncToggles();const o=document.getElementById("fb-lead-sync-refresh");o&&(o.onclick=()=>loadFbLeadSyncPage({fullPreflight:!0})),bindFbLeadHistoryClearButton(),fbLeadSyncRefreshTimer&&(clearInterval(fbLeadSyncRefreshTimer),fbLeadSyncRefreshTimer=null),fbLeadSyncRefreshTimer=window.setInterval(()=>{loadFbLeadSyncPage({silent:!0}).catch(()=>{})},6e4)}(!e||t)&&await loadFbLeadPreflightForClients(fbLeadSyncState.clients,{quick:!t}),e?(updateFbLeadCronSummaryUi(),await refreshFbLeadHistoryUi(),await refreshFbLeadClientRowsUi()):await refreshFbLeadClientRowsUi(),t?(await loadFbLeadPreflightForClients(fbLeadSyncState.clients,{quick:!1}),await refreshFbLeadClientRowsUi()):e||scheduleFbLeadFullPreflight(fbLeadSyncState.clients)}catch(r){e||(a.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(r.message)}</div>`)}
      `)}}const metaReportsState={filter:"all",searchQuery:"",dashboardData:null,hubMounted:!1,clientPayload:null,clientPageMounted:!1,clientReportSettingsExpanded:!1,clientShareExpanded:!1,activeMonthKey:null,selectedYear:new Date().getFullYear(),publicPayload:null,publicPageMounted:!1,chartInstances:{roas:null,poas:null},chartScatterInstances:{roas:null,poas:null},chartTab:"trend",chartRoasMode:"kr",chartPoasMode:"kr",chartScatterRoasMode:"kr",chartScatterPoasMode:"kr",chartScenarioRoasMode:"x",chartScenarioPoasMode:"x",chartSeries:null,scenarioSeries:null,scenarioSourcePayload:null,chartDemo:!1,chartProjection:null,spendChartType:"area",scenarioChartInstances:{roas:null,poas:null},budgetMultiplier:2,budgetBaseline:"year",scenarioMonthWindow:"6",scenarioSmoothUneven:!0,scenarioBlendHistory:!1,scenarioIncludeTrend:!1,comparisonMode:"mom",comparisonPeriodA:{startDate:null,endDate:null},comparisonPeriodB:{startDate:null,endDate:null},comparisonChartMode:"kr",comparisonTab:"table",reportViewMode:"monthly",comparisonYearCache:{},comparisonResult:null,comparisonLoading:!1,comparisonDatePickers:[],comparisonMonthMenuListenerBound:!1,comparisonChartInstance:null,customValues:{mounted:!1,overview:null,searchQuery:"",selectedClientId:null,selectedMonthKey:null,editorPayload:null,draftInputs:null,loadingEditor:!1,saving:!1,settingsSaving:!1,settingsSavingScope:null}},META_HUB_FILTER_OPTIONS=[{value:"all",label:"All"},{value:"enabled",label:"Live reports"},{value:"meta-only",label:"Meta only"},{value:"needs-setup",label:"Needs setup"}];function metaHubClientInitial(e){const t=String(e||"?").trim();return esc(t.charAt(0).toUpperCase())}function filterMetaReportsClients(e,t,a=""){let n=e||[];t==="enabled"&&(n=n.filter(o=>o.metaReportEnabled)),t==="meta-only"&&(n=n.filter(o=>!o.hasGhl)),t==="needs-setup"&&(n=n.filter(o=>o.needsSetup));const r=String(a||"").trim().toLowerCase();return r&&(n=n.filter(o=>[o.accountName,o.metaAdAccountId,o.clientId,o.metaName].filter(Boolean).join(" ").toLowerCase().includes(r))),n}function getMetaReportsHubView(e,t,a=metaReportsState.searchQuery){const n=e?.clients||[],r=filterMetaReportsClients(n,t,a),o=e?.summary||{};return{clients:r,allClients:n,summary:{...o,totalListed:n.length},meta:e?.meta||{},filter:t,searchQuery:a}}function renderMetaHubSwitch({label:e,attr:t,value:a,checked:n,disabled:r=!1}){return a?`
    <label class="meta-hub-switch${r?" is-disabled":""}">
      <span class="meta-hub-switch-label">${esc(e)}</span>
      <span class="meta-hub-switch-track">
        <input type="checkbox" class="meta-hub-switch-input" ${t}="${esc(a)}" ${n?"checked":""} ${r?"disabled":""} aria-label="${esc(e)}" />
        <span class="meta-hub-switch-thumb"></span>
      </span>
    </label>
  `:`<div class="meta-hub-switch is-disabled"><span class="meta-hub-switch-label">${esc(e)}</span><span class="meta-report-muted">\u2014</span></div>`}function metaReportFullUrl(e){return e?`${window.location.origin}${e}`:""}function normalizeMetaReportSlugInput(e){return String(e||"").trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}function resolveMetaReportShareSlug(e){const t=e.settings||{};if(t.metaReportSlug)return t.metaReportSlug;const n=String(e.reportUrl||"").replace(/^\/report\//,"").match(/^(.+)-(\d{4})$/);return n?n[1]:""}function resolveMetaReportShareCode(e){const a=String(e.reportUrl||"").replace(/^\/report\//,"").match(/-(\d{4})$/);return a?a[1]:""}function renderMetaReportShareSummary(e,{hidden:t=!1}={}){const n=!!(e.settings||{}).metaReportEnabled,r=resolveMetaReportShareSlug(e),o=resolveMetaReportShareCode(e),s=r?`${r}-${o||"\xB7\xB7\xB7\xB7"}`:"Not set";return`
    <div class="meta-report-share-summary" id="meta-report-share-summary"${t?" hidden":""}>
      <div class="meta-report-share-summary-main">
        <div class="meta-report-share-summary-row">
          <span class="meta-report-share-summary-label">Preview</span>
          <span class="meta-report-share-summary-value${n?" is-on":" is-off"}">${n?"Enabled":"Disabled"}</span>
        </div>
        <div class="meta-report-share-summary-row">
          <span class="meta-report-share-summary-label">Slug</span>
          <span class="meta-report-share-summary-value" id="meta-report-share-slug-display">${esc(s)}</span>
        </div>
      </div>
      <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-share-edit">Edit</button>
    </div>
  `}function syncMetaReportToolbarCopy(e){const t=document.getElementById("meta-report-toolbar-copy-link");t&&(e.reportUrl?(t.setAttribute("data-copy-report-url",e.reportUrl),t.disabled=!e.settings?.metaReportEnabled,t.hidden=!1):t.hidden=!0)}function applyMetaReportEnabledUi(e,t){e.settings||(e.settings={}),e.settings.metaReportEnabled=t,document.getElementById("meta-report-control-panel")?.classList.toggle("is-share-disabled",!t);const a=document.getElementById("meta-report-share-summary");a&&a.querySelectorAll(".meta-report-share-summary-row").forEach(l=>{if(l.querySelector(".meta-report-share-summary-label")?.textContent!=="Preview")return;const c=l.querySelector(".meta-report-share-summary-value");c&&(c.textContent=t?"Enabled":"Disabled",c.classList.toggle("is-on",t),c.classList.toggle("is-off",!t))});const n=document.querySelector("[data-meta-client-preview]");n&&(n.checked=t);const r=n?.closest(".meta-hub-switch")?.querySelector(".meta-hub-switch-label");r&&(r.textContent=t?"Enabled":"Disabled");const o=document.getElementById("meta-report-rotate-token");o&&(o.disabled=!t);const s=document.querySelector(".meta-report-share-panel"),i=s?.querySelector(".meta-report-share-note");if(t)i&&i.remove();else if(!i&&s){const l=document.createElement("p");l.className="meta-report-share-note",l.textContent="Preview disabled \u2014 link won\u2019t load.",s.appendChild(l)}syncMetaReportToolbarCopy(e)}function updateMetaReportHubCardReportState(e,t){const a=document.querySelector(`[data-meta-hub-row="${e}"]`);if(!a)return;const n=a.querySelector(".meta-report-badge");n&&!n.classList.contains("meta-report-badge--setup")&&(n.className=t?"meta-report-badge meta-report-badge--on":"meta-report-badge meta-report-badge--off",n.textContent=t?"Report live":"Report off"),a.querySelectorAll("[data-meta-bottomline], [data-meta-fee]").forEach(r=>{r.disabled=!t,r.closest(".meta-hub-switch")?.classList.toggle("is-disabled",!t)})}function updateMetaReportShareSummary(e){const t=document.getElementById("meta-report-share-summary");if(!t)return;const a=document.createElement("div");a.innerHTML=renderMetaReportShareSummary(e).trim();const n=a.firstElementChild;if(!n)return;n.hidden=metaReportsState.clientShareExpanded,t.replaceWith(n);const r=document.getElementById("meta-report-share-edit");r&&(r.onclick=()=>setMetaReportShareExpanded(!0))}function syncMetaReportControlPanelUi(){const e=document.getElementById("meta-report-control-panel");if(!e)return;const t=metaReportsState.clientShareExpanded,a=metaReportsState.clientReportSettingsExpanded;e.classList.toggle("is-editing-share",t),e.classList.toggle("is-editing-report",a);const n=document.getElementById("meta-report-control-status");n&&(n.hidden=t||a)}function setMetaReportShareExpanded(e){metaReportsState.clientShareExpanded=!!e,e&&(metaReportsState.clientReportSettingsExpanded=!1);const t=document.getElementById("meta-report-share-summary"),a=document.getElementById("meta-report-share-editor");t&&(t.hidden=e),a&&(a.hidden=!e);const n=document.querySelector(".meta-report-bottomline-fee-settings--client"),r=document.getElementById("meta-report-fee-editor");n?.classList.toggle("is-editing",metaReportsState.clientReportSettingsExpanded),n?.classList.toggle("is-collapsed",!metaReportsState.clientReportSettingsExpanded),r&&r.classList.toggle("is-hidden",!metaReportsState.clientReportSettingsExpanded),syncMetaReportControlPanelUi()}function renderMetaReportShareEditor(e){const a=!!(e.settings||{}).metaReportEnabled,n=e.reportUrl||null;if(!n)return"";const r=metaReportFullUrl(n),o=resolveMetaReportShareSlug(e),s=resolveMetaReportShareCode(e);return`
    <div class="meta-report-control-editor meta-report-control-editor--share" id="meta-report-share-editor-wrap">
      <div class="meta-report-settings-card-head">
        <span class="meta-report-settings-card-title">Slug setting</span>
      </div>
      <div class="meta-report-share-editor" id="meta-report-share-editor"${metaReportsState.clientShareExpanded?"":" hidden"}>
        <div class="meta-report-share-panel">
          <div class="meta-report-share-preview-row">
            <span class="meta-report-share-preview-title">Preview</span>
            ${renderMetaHubSwitch({label:a?"Enabled":"Disabled",attr:"data-meta-client-preview",value:e.clientId,checked:a})}
          </div>
          <div class="meta-report-share-field">
            <div class="meta-report-share-slug-row">
              <span class="meta-report-share-slug-prefix">/report/</span>
              <input type="text" id="meta-report-share-slug" class="admin-input meta-report-share-slug-input" value="${esc(o)}" autocomplete="off" spellcheck="false" aria-label="Report slug" />
              <span class="meta-report-share-slug-suffix" id="meta-report-share-slug-suffix">-${esc(s||"\xB7\xB7\xB7\xB7")}</span>
            </div>
          </div>
          <code class="meta-report-share-url" id="meta-report-share-url">${esc(r)}</code>
          <div class="meta-report-share-editor-actions">
            <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="meta-report-rotate-token"${a?"":" disabled"}>Rotate link</button>
            <div class="meta-report-share-editor-actions-end">
              <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="meta-report-share-done">Done</button>
              <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="meta-report-share-save">Save slug</button>
            </div>
          </div>
          ${a?"":'<p class="meta-report-share-note">Preview disabled \u2014 link won\u2019t load.</p>'}
        </div>
      </div>
    </div>
  `}function renderMetaReportClientControlPanel(e){const t=e.settings||{},a=metaReportsState.clientShareExpanded,n=metaReportsState.clientReportSettingsExpanded,r=!!e.reportUrl,o=a||n,s=metaReportMonthsNeedingBackfill(e),i=s.length?`${ICON_SYNC} Backfill ${s.length} month${s.length===1?"":"s"} from Meta`:`${ICON_SYNC} Re-sync year from Meta`;return`
    <div class="meta-report-control-panel${a?" is-editing-share":""}${n?" is-editing-report":""}${t.metaReportEnabled?"":" is-share-disabled"}" id="meta-report-control-panel">
      <div class="meta-report-control-bar">
        <div class="meta-report-control-bar-left meta-report-toolbar-left">
          <label class="meta-report-year-field">Year
            <select id="meta-report-year" class="admin-select">
              ${renderMetaReportYearSelectOptions(e,{disableUnavailable:!0})}
            </select>
          </label>
          <div class="meta-report-backfill-wrap">
            <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-backfill">${i}</button>
            <span class="meta-report-backfill-progress" id="meta-report-backfill-progress"></span>
          </div>
        </div>
        <div class="meta-report-control-bar-actions meta-report-toolbar-actions">
          <span class="meta-report-save-indicator" id="meta-report-save-indicator"><span class="meta-report-save-indicator-spinner"></span> Saving\u2026</span>
          ${r?`<button type="button" class="admin-btn admin-btn--secondary" id="meta-report-toolbar-copy-link" data-copy-report-url="${esc(e.reportUrl)}"${t.metaReportEnabled?"":" disabled"}>Copy link</button>`:""}
        </div>
      </div>
      ${r?`
        <div class="meta-report-control-status"${o?" hidden":""} id="meta-report-control-status">
          <div class="meta-report-control-status-grid">
            ${renderMetaReportShareSummary(e)}
            ${renderMetaReportBottomlineFeeSummary(t,"meta-report")}
          </div>
        </div>
      `:`
        <p class="meta-report-share-empty">Share link will appear once this client has a Meta ad account configured.</p>
      `}
      <div class="meta-report-control-editors">
        ${r?renderMetaReportShareEditor(e):""}
        <div class="meta-report-control-editor meta-report-control-editor--report" id="meta-report-report-editor-wrap">
          <div class="meta-report-settings-card-head">
            <span class="meta-report-settings-card-title">Report settings</span>
          </div>
          <div class="meta-report-settings-group meta-report-settings-group--stacked">
            ${renderMetaReportBottomlineFeeSettings(t,"meta-report",{compact:!1,collapsible:!0,externalSummary:!0})}
          </div>
        </div>
      </div>
    </div>
  `}function refreshMetaReportClientShareUi(e){syncMetaReportToolbarCopy(e),updateMetaReportShareSummary(e),updateMetaReportBottomlineFeeSummary(e.settings||{},"meta-report"),document.getElementById("meta-report-control-panel")?.classList.toggle("is-share-disabled",!e.settings?.metaReportEnabled);const t=document.getElementById("meta-report-share-url");t&&e.reportUrl&&(t.textContent=metaReportFullUrl(e.reportUrl));const a=document.getElementById("meta-report-share-slug-suffix"),n=resolveMetaReportShareCode(e);a&&(a.textContent=`-${n||"\xB7\xB7\xB7\xB7"}`);const r=document.getElementById("meta-report-share-slug");r&&(r.value=resolveMetaReportShareSlug(e));const o=document.getElementById("meta-report-rotate-token");o&&(o.disabled=!e.settings?.metaReportEnabled);const s=document.querySelector("[data-meta-client-preview]");s&&(s.checked=!!e.settings?.metaReportEnabled),setMetaReportShareExpanded(metaReportsState.clientShareExpanded)}function syncMetaReportShareCard(e){const t=document.getElementById("meta-report-share-editor-wrap");if(!t)return;const a=t.parentElement;if(!a)return;const n=renderMetaReportShareEditor(e),r=document.createElement("div");r.innerHTML=n.trim();const o=r.firstElementChild;o&&(a.replaceChild(o,t),setMetaReportShareExpanded(metaReportsState.clientShareExpanded),bindMetaReportShareEvents(e),syncMetaReportToolbarCopy(e))}function bindMetaReportRotateButton(e){const t=document.getElementById("meta-report-rotate-token");t&&(t.onclick=async()=>{if(window.confirm("Rotate the share link? The old link will stop working.")){t.disabled=!0;try{const a=await patchMetaReportSettings(e,{rotateAccessToken:!0}),n=a.settings?.reportUrl||null,r=metaReportsState.clientPayload;r&&(r.reportUrl=n,a.settings&&(r.settings={...r.settings,...a.settings}));const o=r||{clientId:e,reportUrl:n,settings:a.settings||{}};metaReportsState.clientPayload=o,metaReportsState.clientShareExpanded?refreshMetaReportClientShareUi(o):syncMetaReportShareCard(o),showToast("Share link rotated","success")}catch(a){showToast(a.message||"Rotate failed","error")}finally{const a=document.getElementById("meta-report-rotate-token");a&&(a.disabled=!1)}}})}function bindMetaReportShareEvents(e){const t=e.clientId;bindMetaReportCopyButtons(),bindMetaReportRotateButton(t);const a=document.getElementById("meta-report-share-edit");a&&(a.onclick=()=>setMetaReportShareExpanded(!0));const n=document.getElementById("meta-report-share-done");n&&(n.onclick=()=>setMetaReportShareExpanded(!1));const r=document.getElementById("meta-report-share-save");r&&(r.onclick=async()=>{const i=document.getElementById("meta-report-share-slug"),l=normalizeMetaReportSlugInput(i?.value);if(!l||l.length<2){showToast("Enter a valid slug (at least 2 characters).","error");return}r.disabled=!0;try{const d=(await patchMetaReportSettings(t,{metaReportSlug:l})).settings||{},u=metaReportsState.clientPayload||e;u.settings={...u.settings,...d},u.reportUrl=d.reportUrl||null,metaReportsState.clientPayload=u,refreshMetaReportClientShareUi(u),setMetaReportShareExpanded(!1),showToast("Share link slug saved","success")}catch(c){showToast(c.message||"Save failed","error")}finally{const c=document.getElementById("meta-report-share-save");c&&(c.disabled=!1)}});const o=document.getElementById("meta-report-share-slug");o&&(o.oninput=()=>{o.value=normalizeMetaReportSlugInput(o.value)});const s=document.querySelector("[data-meta-client-preview]");if(s){let i=0;s.onchange=async()=>{const l=++i,c=s.checked,d=!c,u=metaReportsState.clientPayload||e;applyMetaReportEnabledUi(u,c);const p=s.closest(".meta-hub-switch");p?.classList.add("is-saving");try{const h=await patchMetaReportSettings(t,{metaReportEnabled:c},{fast:!0});if(l!==i)return;const m=h.settings||{};u.settings={...u.settings,...m},u.reportUrl=m.reportUrl??u.reportUrl,metaReportsState.clientPayload=u,applyMetaReportEnabledUi(u,!!m.metaReportEnabled),showToast(c?"Client preview enabled":"Client preview disabled","success")}catch(h){if(l!==i)return;applyMetaReportEnabledUi(u,d),s.checked=d,showToast(h.message||"Update failed","error")}finally{l===i&&p?.classList.remove("is-saving")}}}}function renderMetaReportHubCard(e){const t=!!e.clientId,a=e.clientId||e.metaAdAccountId||"",n=e.needsSetup?"is-setup":"",r=e.needsSetup?'<span class="meta-report-badge meta-report-badge--setup">Needs setup</span>':e.metaReportEnabled?'<span class="meta-report-badge meta-report-badge--on">Report live</span>':'<span class="meta-report-badge meta-report-badge--off">Report off</span>',o=e.hasGhl?"GHL + Meta":"Meta only",s=t?`<a href="/admin/meta-reports/${encodeURIComponent(e.clientId)}" class="meta-hub-card-name">${esc(e.accountName)}</a>`:`<span class="meta-hub-card-name">${esc(e.accountName)}</span>`,i=[];e.needsSetup?i.push(`<button type="button" class="admin-btn admin-btn--primary" data-meta-provision="${esc(e.metaAdAccountId)}" data-meta-provision-name="${esc(e.accountName)}">Add client</button>`):t&&(i.push(`<a class="admin-btn" href="/admin/meta-reports/${encodeURIComponent(e.clientId)}">Edit report</a>`),i.push(e.reportUrl?`<button type="button" class="admin-btn admin-btn--secondary" data-copy-report-url="${esc(e.reportUrl)}">Copy link</button>`:`<a class="admin-btn admin-btn--secondary" href="/admin/meta-reports/${encodeURIComponent(e.clientId)}">Enable report</a>`));const l=i.length===1?"meta-hub-card-actions meta-hub-card-actions--single":"meta-hub-card-actions";return`
    <article class="meta-hub-card ${n}" data-meta-hub-row="${esc(a)}">
      <div class="meta-hub-card-head">
        <span class="meta-hub-avatar" aria-hidden="true">${metaHubClientInitial(e.accountName)}</span>
        <div class="meta-hub-card-title">
          ${s}
          <div class="meta-hub-card-slug">act_${esc(e.metaAdAccountId||"\u2014")}</div>
        </div>
      </div>
      <div class="meta-hub-card-meta">
        ${r}
        <span class="meta-hub-card-meta-dot" aria-hidden="true">\xB7</span>
        <span>${esc(o)}</span>
      </div>
      <div class="meta-hub-card-toggles">
        ${renderMetaHubSwitch({label:"Report",attr:"data-meta-report-enabled",value:t?e.clientId:null,checked:e.metaReportEnabled})}
        ${renderMetaHubSwitch({label:"Bottomline",attr:"data-meta-bottomline",value:t?e.clientId:null,checked:e.metaReportShowBottomline,disabled:!e.metaReportEnabled})}
        ${renderMetaHubSwitch({label:"Censio fee",attr:"data-meta-fee",value:t?e.clientId:null,checked:e.metaReportFeeEnabled,disabled:!e.metaReportEnabled})}
      </div>
      ${i.length?`<div class="${l}">${i.join("")}</div>`:""}
    </article>
  `}function renderMetaReportsClientCards(e,t="all",a=""){if(!e.length){const n=a?`No clients match \u201C${a}\u201D.`:t==="all"?"No Meta ad accounts found. Check META_SYSTEM_USER_TOKEN and META_BUSINESS_ID, or add clients manually.":"No clients match this filter.";return`
      <div class="meta-hub-empty">
        <h3>No clients to show</h3>
        <p>${esc(n)}</p>
      </div>
    `}return e.map(n=>renderMetaReportHubCard(n)).join("")}function renderMetaReportsBannerHtml(e){return e?.partnerFetchError?`
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
  `).join("")}function recomputeMetaReportsSummaryCounts(){const e=metaReportsState.dashboardData?.clients||[],t=metaReportsState.dashboardData?.summary||{};metaReportsState.dashboardData.summary={...t,inAppCount:e.filter(a=>a.inApp).length,enabledCount:e.filter(a=>a.metaReportEnabled).length,needsSetupCount:e.filter(a=>a.needsSetup).length,totalListed:e.length}}function mergeHubClient(e,t){const a=metaReportsState.dashboardData?.clients;if(!a)return null;const n=a.findIndex(r=>r.clientId===e);return n<0?null:(a[n]={...a[n],...t},recomputeMetaReportsSummaryCounts(),a[n])}function updateMetaReportsHubDom(e){const t=document.getElementById("meta-reports-banner"),a=document.getElementById("meta-reports-cards"),n=document.getElementById("meta-reports-count");t&&(t.innerHTML=renderMetaReportsBannerHtml(e.meta)),n&&(n.textContent=`${e.clients.length} client${e.clients.length===1?"":"s"}`),a&&(a.innerHTML=renderMetaReportsClientCards(e.clients,e.filter,e.searchQuery),bindMetaReportsHubRowEvents(a))}function renderMetaReportsClientTabs(e){const t=e.monthKeys||[],a=metaReportsState.activeMonthKey||t[t.length-1]||"";return t.map(n=>`
    <button type="button" class="meta-report-tab${n===a?" is-active":""}" data-meta-month-tab="${esc(n)}">${esc(metaMonthLabel(n))}</button>
  `).join("")}function getMetaReportCalendarYear(e){const t=Number(e?.currentYear);return Number.isFinite(t)&&t>=2e3?t:new Date().getFullYear()}function getMetaReportYearOptions(e){const t=getMetaReportCalendarYear(e),a=t-1,n=new Map;Array.isArray(e?.years)&&e.years.forEach(o=>{const s=Number(o?.year);Number.isFinite(s)&&n.set(s,o.available!==!1)});const r=n.has(a)?n.get(a):e?.previousYearHasData===!0;return[{year:t,available:!0},{year:a,available:!!r}]}function renderMetaReportYearSelectOptions(e,{disableUnavailable:t=!1}={}){const a=Number(metaReportsState.selectedYear)||Number(e?.year);return getMetaReportYearOptions(e).map(({year:n,available:r})=>{const o=t&&!r;return`<option value="${n}"${Number(a)===n?" selected":""}${o?" disabled":""}>${n}${r?"":" (no data)"}</option>`}).join("")}function syncMetaReportSelectedYear(e,{disableUnavailable:t=!1}={}){const a=getMetaReportYearOptions(e),n=Number(metaReportsState.selectedYear),r=a.find(l=>l.year===n);if(r&&(!t||r.available)){metaReportsState.selectedYear=r.year;return}const o=Number(e?.year),s=a.find(l=>l.year===o);if(s&&(!t||s.available)){metaReportsState.selectedYear=s.year;return}const i=a.find(l=>l.available)||a[0];i&&(metaReportsState.selectedYear=i.year)}function refreshMetaReportMonthPanel(e){const t=metaReportsState.clientPayload;!t||!metaReportsState.activeMonthKey||(t.months=t.months||{},t.months[metaReportsState.activeMonthKey]=e,!document.getElementById("meta-report-month-panel"))||(syncMetaReportMonthPanelDom(e,getMetaReportMonthBodyOptions(t.settings,{editable:!0}),t),bindMetaReportsClientEditEvents(t.clientId,t),refreshMetaReportBackfillControl(t))}function refreshMetaReportBackfillControl(e){const t=document.querySelector(".meta-report-client-page .meta-report-toolbar-left"),a=document.querySelector(".meta-report-backfill-wrap"),n=metaReportMonthsNeedingBackfill(e),r=n.length?`${ICON_SYNC} Backfill ${n.length} month${n.length===1?"":"s"} from Meta`:`${ICON_SYNC} Re-sync year from Meta`,o=document.getElementById("meta-report-backfill");if(o)o.innerHTML=r,o.disabled=!1;else if(t){const s=document.createElement("div");s.className="meta-report-backfill-wrap",s.innerHTML=`
      <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="meta-report-backfill">${r}</button>
      <span class="meta-report-backfill-progress" id="meta-report-backfill-progress"></span>
    `,t.appendChild(s),bindMetaReportBackfillButton(e.clientId)}a&&!o&&!t&&a.remove()}function updateMetaReportsClientContent(e){metaReportsState.clientPayload=e;const t=e.monthKeys||[];metaReportsState.activeMonthKey&&t.includes(metaReportsState.activeMonthKey)||(metaReportsState.activeMonthKey=t[t.length-1]||null),syncMetaReportSelectedYear(e,{disableUnavailable:!0});const a=document.getElementById("meta-report-year");a&&(a.innerHTML=renderMetaReportYearSelectOptions(e,{disableUnavailable:!0})),syncMetaReportToolbarCopy(e),refreshMetaReportClientShareUi(e);const n=e.settings||{},r=e.months?.[metaReportsState.activeMonthKey]||null;syncMetaReportSettingsControls(n,r);const o=document.querySelector(".meta-report-tabs");o&&(o.innerHTML=renderMetaReportsClientTabs(e),bindMetaReportsClientTabEvents(e)),document.getElementById("meta-report-month-panel")&&(syncMetaReportMonthPanelDom(e.months?.[metaReportsState.activeMonthKey],getMetaReportMonthBodyOptions(n,{editable:!0}),e),bindMetaReportsClientEditEvents(e.clientId,e)),refreshMetaReportBackfillControl(e),metaReportsState.chartSeries?.length&&ensureMetaReportScenarioSource(e,{editable:!0}).then(()=>{const i=buildMetaReportScenarioProjection(resolveMetaReportScenarioSeries(e),e);metaReportsState.chartProjection=i,syncMetaReportBaselineUi(resolveMetaReportScenarioSeries(e),i,resolveMetaReportScenarioPayload(e)),syncMetaReportScenario(e)})}function updatePublicMetaReportContent(e){metaReportsState.publicPayload=e,syncMetaReportPublicBranding(e);const t=e.monthKeys||[];metaReportsState.activeMonthKey&&t.includes(metaReportsState.activeMonthKey)||(metaReportsState.activeMonthKey=t[t.length-1]||null),syncMetaReportSelectedYear(e,{disableUnavailable:!0});const a=document.getElementById("meta-report-year");a&&(a.innerHTML=renderMetaReportYearSelectOptions(e,{disableUnavailable:!0}));const n=document.querySelector(".meta-report-tabs");n&&(n.innerHTML=t.map(o=>`
      <button type="button" class="meta-report-tab${o===metaReportsState.activeMonthKey?" is-active":""}" data-meta-month-tab="${esc(o)}">${esc(metaMonthLabel(o))}</button>
    `).join(""),bindPublicMetaReportTabEvents(e)),document.getElementById("meta-report-month-panel")&&syncMetaReportMonthPanelDom(e.months?.[metaReportsState.activeMonthKey],getMetaReportMonthBodyOptions(e.settings,{editable:!1}),e)}const META_MONTH_LABELS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],META_MONTH_LABELS_FULL=["January","February","March","April","May","June","July","August","September","October","November","December"];function metaFmtKr(e){return`Dkr ${(Number(e)||0).toLocaleString("da-DK",{minimumFractionDigits:0,maximumFractionDigits:2})}`}function metaFmtNum(e,t=0){return(Number(e)||0).toLocaleString("da-DK",{minimumFractionDigits:t,maximumFractionDigits:t})}function metaReportFmtBaselineAmount(e){const t=Number(e)||0;return t<=0?"\u2014":metaFmtKr(t)}function metaFmtX(e){const t=Number(e);return Number.isFinite(t)?t===0?"0.00x":`${t.toFixed(2)}x`:"\u2014"}function metaMonthLabel(e){const t=Number(String(e||"").slice(5,7));return META_MONTH_LABELS[t-1]||e}function metaMonthLabelFull(e){const t=Number(String(e||"").slice(5,7));return META_MONTH_LABELS_FULL[t-1]||metaMonthLabel(e)}function metaReportMonthBounds(e){const t=String(e||"").trim();if(!/^\d{4}-\d{2}$/.test(t))return{start:"",end:""};const[a,n]=t.split("-").map(Number),r=new Date(a,n,0).getDate(),o=String(n).padStart(2,"0");return{start:`${a}-${o}-01`,end:`${a}-${o}-${String(r).padStart(2,"0")}`}}function metaReportMonthPeriodAligned(e){if(!e?.monthKey)return!0;const t=metaReportMonthBounds(e.monthKey),a=String(e.periodStart||"").slice(0,10),n=String(e.periodEnd||"").slice(0,10);return!!(a===t.start&&n===t.end||e.metaFetchedAt&&Number(e.meta?.spend)>0)}function resolveMetaReportActiveMonthPayload(e=null){const t=e||metaReportsState.clientPayload||metaReportsState.publicPayload,a=metaReportsState.activeMonthKey;return!t||!a?null:t.months?.[a]||null}function switchMetaReportMonthTab(e,{editable:t=!1}={}){if(!e)return;metaReportsState.reportViewMode==="comparison"&&(metaReportsState.reportViewMode="monthly"),metaReportsState.activeMonthKey=e;const a=metaReportsState.clientPayload||metaReportsState.publicPayload;if(!a)return;document.querySelectorAll("[data-meta-month-tab]").forEach(r=>{r.classList.toggle("is-active",r.getAttribute("data-meta-month-tab")===e)});const{series:n}=resolveMetaReportChartSeries(a);n.length&&(metaReportsState.chartSeries=n),(async()=>{const r=a.months?.[e];if(t&&a.clientId&&r&&!metaReportMonthPeriodAligned(r))try{const o=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(a.clientId)}/months/${encodeURIComponent(e)}`);o?.monthPayload&&(a.months[e]=o.monthPayload)}catch{}syncMetaReportMonthPanelDom(null,getMetaReportMonthBodyOptions(a.settings||{},{editable:t,yearPayload:a}),a),t&&a.clientId&&bindMetaReportsClientEditEvents(a.clientId,a),syncMetaReportSettingsControls(a.settings||{},resolveMetaReportActiveMonthPayload(a)),metaReportsState.chartSeries?.length&&ensureMetaReportScenarioSource(a,{editable:t}).then(()=>{const o=buildMetaReportScenarioProjection(resolveMetaReportScenarioSeries(a),a);metaReportsState.chartProjection=o,syncMetaReportBaselineUi(resolveMetaReportScenarioSeries(a),o,resolveMetaReportScenarioPayload(a)),syncMetaReportScenario(a)})})()}function metaReportMonthsNeedingBackfill(e){return(e?.monthKeys||[]).filter(a=>!e.months?.[a]?.metaFetchedAt)}function metaReportTone(e){const t=Number(e);return!Number.isFinite(t)||t===0?"neutral":t>0?"positive":"negative"}function renderMetaReportHighlightStrip(e){if(!e||e.meta?.emptyMonth)return"";const t=Number(e.topline?.roasX)||0,a=[{label:"Ad spend",value:metaFmtKr(e.meta?.spend),tone:"neutral"},{label:"Leads",value:metaFmtNum(e.topline?.leads),tone:"neutral"},{label:"Return on ad spend",value:metaFmtX(t),tone:metaReportTone(t)}];if(e.bottomline){const n=Number(e.bottomline.feePercent)>0,r=n?e.bottomline.poiKr:e.bottomline.poasKr;a.push({label:n?"Profit on investment":"Profit on ad spend",value:metaFmtKr(r),tone:metaReportTone(r)})}else a.push({label:"Won leads",value:metaFmtNum(e.topline?.wonLeads),tone:"neutral"});return`
    <div class="meta-report-highlight-strip">
      ${a.map(({label:n,value:r,tone:o})=>`
        <div class="meta-report-highlight-item${o&&o!=="neutral"?` is-${o}`:""}">
          <div class="meta-report-highlight-label">${esc(n)}</div>
          <div class="meta-report-highlight-value">${esc(r)}</div>
        </div>
      `).join("")}
    </div>
  `}function renderMetaReportMetricTable(e,t,a="meta",{badge:n="",highlightLastN:r=0}={}){const o=t.map(([s,i,l],c)=>`
      <tr class="${r>0&&c>=t.length-r?`is-highlight accent-${a}`:""}">
        <th scope="row">${esc(s)}</th>
        <td>${esc(String(i??"\u2014"))}${l?`<span class="meta-report-row-unit">${esc(l)}</span>`:""}</td>
      </tr>
    `).join("");return`
    <section class="meta-report-group">
      <div class="meta-report-group-head">
        <span class="meta-report-group-bar meta-report-group-bar--${a}" aria-hidden="true"></span>
        <h3 class="meta-report-group-title">${esc(e)}</h3>
        ${n?`<span class="meta-report-group-badge">${esc(n)}</span>`:""}
      </div>
      <div class="meta-report-group-table-wrap">
        <table class="meta-report-group-table">
          <tbody>${o}</tbody>
        </table>
      </div>
    </section>
  `}function getMetaReportMonthBodyOptions(e={},{editable:t=!1,yearPayload:a=null}={}){return{editable:t,yearPayload:a}}function shouldShowMetaReportYearVisuals(e,t,{editable:a=!1}={}){if(!e||e.meta?.emptyMonth||!t)return!1;const{series:n,demo:r}=resolveMetaReportChartSeries(t);return!(n.length<META_REPORT_CHART_MIN_POINTS||r&&!a)}const META_REPORT_CHART_MIN_POINTS=2,META_REPORT_SCENARIO_MAX_HISTORICAL=9,META_REPORT_SCENARIO_PROJECTED_MONTHS=4,META_REPORT_SPEND_CHART_TYPE_OPTIONS=[{value:"area",label:"Area"},{value:"bar",label:"Bar"}],META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS=[{value:"3",label:"Last 3 ad months"},{value:"6",label:"Last 6 ad months"},{value:"9",label:"Last 9 ad months"},{value:"12",label:"Last 12 ad months"},{value:"all",label:"All ad-active months"}],META_REPORT_SCENARIO_FIXED_ELASTICITY=.8,META_SCENARIO_TREND_R_THRESHOLD=.35,META_REPORT_SCENARIO_MODEL_PILLS=[{id:"scenarioSmoothUneven",label:"Remove uneven months",defaultOn:!0},{id:"scenarioBlendHistory",label:"Balance recent months",defaultOn:!1},{id:"scenarioIncludeTrend",label:"Follow trend",defaultOn:!1}];function normalizeMetaReportSpendChartType(e){const t=String(e||"area").trim().toLowerCase();return META_REPORT_SPEND_CHART_TYPE_OPTIONS.some(a=>a.value===t)?t:"area"}function hydrateMetaReportSpendChartType(e){metaReportsState.spendChartType=normalizeMetaReportSpendChartType(e?.settings?.metaReportSpendChartType)}function normalizeMetaReportScenarioPill(e,t=!1){if(typeof e=="boolean")return e;if(e==null)return t;const a=String(e).trim().toLowerCase();return a==="true"||a==="1"?!0:a==="false"||a==="0"?!1:t}function normalizeMetaReportScenarioMonthWindow(e){const t=String(e||"6").trim().toLowerCase();return META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS.some(a=>a.value===t)?t:"6"}function normalizeMetaReportBudgetBaseline(e){const t=String(e||"year").trim().toLowerCase();return t==="month"||t==="last"?t:"year"}function normalizeMetaReportBudgetMultiplier(e){const t=Number.parseFloat(e);return Number.isFinite(t)?Math.min(3,Math.max(.5,Math.round(t*10)/10)):2}function getMetaReportScenarioPillsFromState(){return{smoothUneven:!!metaReportsState.scenarioSmoothUneven,blendHistory:!!metaReportsState.scenarioBlendHistory,includeTrend:!!metaReportsState.scenarioIncludeTrend}}function applyMetaReportScenarioPillsToState(e={}){metaReportsState.scenarioSmoothUneven=!!e.smoothUneven,metaReportsState.scenarioBlendHistory=!!e.blendHistory,metaReportsState.scenarioIncludeTrend=!!e.includeTrend}function describeActiveMetaReportScenarioPills(){return META_REPORT_SCENARIO_MODEL_PILLS.filter(e=>!!metaReportsState[e.id]).map(e=>e.label)}function hydrateMetaReportScenarioSettings(e){const t=e?.settings||{};metaReportsState.budgetMultiplier=normalizeMetaReportBudgetMultiplier(t.metaReportBudgetMultiplier),metaReportsState.budgetBaseline=normalizeMetaReportBudgetBaseline(t.metaReportBudgetBaseline),metaReportsState.scenarioMonthWindow=normalizeMetaReportScenarioMonthWindow(t.metaReportScenarioMonthWindow),applyMetaReportScenarioPillsToState({smoothUneven:normalizeMetaReportScenarioPill(t.metaReportScenarioSmoothUneven,!0),blendHistory:normalizeMetaReportScenarioPill(t.metaReportScenarioBlendHistory,!1),includeTrend:normalizeMetaReportScenarioPill(t.metaReportScenarioIncludeTrend,!1)})}function renderMetaReportScenarioModelPills(){return`
    <div class="meta-report-scenario-pill-section" id="meta-report-scenario-pills-wrap">
      <div class="meta-report-scenario-pill-row" role="group" aria-label="Forecast options">
        ${META_REPORT_SCENARIO_MODEL_PILLS.map(({id:e,label:t})=>{const a=!!metaReportsState[e];return`
            <button type="button" class="meta-report-scenario-pill${a?" is-active":""}" data-scenario-pill="${esc(e)}" aria-pressed="${a}">${esc(t)}</button>
          `}).join("")}
      </div>
    </div>
  `}function renderMetaReportSpendChartTypePicker({editable:e=!1}={}){const t=metaReportsState.spendChartType||"area";return`
    <div class="meta-report-spend-chart-type" role="group" aria-label="Spend chart type">
      ${META_REPORT_SPEND_CHART_TYPE_OPTIONS.map(({value:a,label:n})=>`
        <button type="button" class="meta-report-chart-toggle-btn${a===t?" is-active":""}" data-spend-chart-type="${esc(a)}"${e?"":" disabled"}>${esc(n)}</button>
      `).join("")}
    </div>
  `}function isMetaReportCensioClient(e){const t=String(e?.clientId||"").toLowerCase(),a=String(e?.accountName||"");return t==="censio"||/censio/i.test(a)}function monthHasChartData(e){if(!e||e.meta?.emptyMonth)return!1;if(!metaReportMonthPeriodAligned(e))return(Number(e.topline?.leads)||0)>0;const t=Number(e.meta?.spend)||0,a=Number(e.topline?.leads)||0;return t>0||a>0}function buildMetaReportChartSeries(e){const t=e?.monthKeys||[],a=e?.months||{},n=[];for(const r of t){const o=a[r];if(!o||o.meta?.emptyMonth||!monthHasChartData(o))continue;const s=Number(o.topline?.roasKr)||0,i=Number(o.topline?.roasX)||0,l=!!o.bottomline,c=l?Number(o.bottomline.poasKr)||0:null,d=l?Number(o.bottomline.poasX)||0:null;n.push({monthKey:r,label:metaMonthLabel(r),periodEnd:o.periodEnd||null,roasKr:s,roasX:i,poasKr:c,poasX:d,spend:Number(o.meta?.spend)||0,leads:Number(o.topline?.leads)||0,wonLeads:Number(o.topline?.wonLeads)||0,avgLeadValue:Number(o.topline?.avgLeadValue)||0,avgProfitPerWon:Number(o.inputs?.avgProfitPerWon)||0,hasData:!0})}return n}function getMetaReportDemoSeries(e,t,a,n){if(!isMetaReportCensioClient({clientId:e,accountName:t}))return null;const o=new Date,s=o.getFullYear(),i=o.getMonth()+1,l=Number(a)||s;let c=(n||[]).filter(d=>{const u=Number(String(d).slice(0,4)),p=Number(String(d).slice(5,7));return!(u!==l||l===s&&p>i)});if(!c.length){const d=l===s?Math.min(8,i):8;c=Array.from({length:d},(u,p)=>`${l}-${String(p+1).padStart(2,"0")}`)}return c.map((d,u)=>{const p=c.length>1?u/(c.length-1):0,h=Math.round(8e3+p*1e4),m=Math.round(2e3+p*15e3),g=Number((.5+p*2.5).toFixed(2)),b=Math.round(1500+p*12e3),f=Number((.4+p*2.2).toFixed(2)),v=Math.round(20+p*80),y=Math.max(1,Math.round(v*(.08+p*.04)));return{monthKey:d,label:metaMonthLabel(d),roasKr:m,roasX:g,poasKr:b,poasX:f,spend:h,leads:v,wonLeads:y,avgLeadValue:85e3,avgProfitPerWon:42e3,hasData:!0,demo:!0}})}function resolveMetaReportChartSeries(e){const t=buildMetaReportChartSeries(e);if(t.length>=META_REPORT_CHART_MIN_POINTS)return{series:t,demo:!1};if(isMetaReportCensioClient(e)){const a=getMetaReportDemoSeries(e.clientId,e.accountName,e.year||metaReportsState.selectedYear,e.monthKeys);if(a&&a.length>=META_REPORT_CHART_MIN_POINTS)return{series:a,demo:!0}}return{series:t,demo:!1}}function metaReportParseAmount(e){const t=Number.parseFloat(e);return Number.isFinite(t)?t:0}function metaReportRoundMoney(e){return Math.round(metaReportParseAmount(e)*100)/100}function metaReportRoundRatio(e){return Math.round(metaReportParseAmount(e)*1e8)/1e8}function metaReportAggregateSeriesEfficiency(e=[]){let t=0,a=0,n=0,r=0,o=0;for(const i of e){const l=metaReportParseAmount(i.spend),c=metaReportParseAmount(i.leads),d=metaReportParseAmount(i.wonLeads);l<=0&&c<=0||(t+=l,a+=c,n+=d,r+=d*metaReportParseAmount(i.avgLeadValue),o+=d*metaReportParseAmount(i.avgProfitPerWon))}const s=e.filter(i=>metaReportParseAmount(i.spend)>0).length;return{avgCpl:a>0?metaReportRoundMoney(t/a):0,winRate:a>0?metaReportRoundRatio(n/a):0,avgLeadValue:n>0?metaReportRoundMoney(r/n):0,avgProfitPerWon:n>0?metaReportRoundMoney(o/n):0,avgMonthlySpend:s>0?metaReportRoundMoney(t/s):0}}const META_SCENARIO_MIN_EFFICIENCY_MONTHS=2,META_SCENARIO_MIN_TREND_MONTHS=4,META_SCENARIO_MAD_MULTIPLIER=2.5,META_SCENARIO_MAX_MONTHLY_TREND=.03;function metaReportScenarioParseDate(e){if(!e)return null;const t=String(e).slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(t))return null;const a=new Date(`${t}T12:00:00.000Z`);return Number.isNaN(a.getTime())?null:a}function metaReportScenarioIsIncompleteMonth(e,t=new Date){if(!metaReportScenarioParseDate(e.periodEnd))return!0;const n=t.toISOString().slice(0,10);return String(e.periodEnd).slice(0,10)>=n}function metaReportScenarioIsAdActive(e){return metaReportParseAmount(e.spend)>0&&metaReportParseAmount(e.leads)>0}function metaReportScenarioMedian(e=[]){const t=e.filter(n=>Number.isFinite(n)).slice().sort((n,r)=>n-r);if(!t.length)return 0;const a=Math.floor(t.length/2);return t.length%2===0?(t[a-1]+t[a])/2:t[a]}function metaReportScenarioMad(e=[]){const t=metaReportScenarioMedian(e);return metaReportScenarioMedian(e.map(a=>Math.abs(a-t)))}function metaReportScenarioLinearRegression(e=[]){const t=e.length;if(t<2)return{slope:0,intercept:0,r:0};let a=0,n=0,r=0,o=0,s=0;for(const p of e){const h=metaReportParseAmount(p.x),m=metaReportParseAmount(p.y);a+=h,n+=m,r+=h*m,o+=h*h,s+=m*m}const i=t*o-a*a;if(i===0)return{slope:0,intercept:n/t,r:0};const l=(t*r-a*n)/i,c=(n-l*a)/t,d=Math.sqrt((t*o-a*a)*(t*s-n*n)),u=d>0?(t*r-a*n)/d:0;return{slope:l,intercept:c,r:u}}function metaReportScenarioEnrichMonth(e){const t=metaReportParseAmount(e.spend),a=metaReportParseAmount(e.leads),n=metaReportParseAmount(e.wonLeads),r=metaReportParseAmount(e.avgLeadValue),o=metaReportParseAmount(e.avgProfitPerWon),s=metaReportRoundMoney(n*r);return{...e,spend:t,leads:a,wonLeads:n,avgLeadValue:r,avgProfitPerWon:o,cpl:a>0?metaReportRoundMoney(t/a):0,totalLeadValue:s,efficiencyIndex:t>0?s/t:0}}function metaReportPrepareScenarioSeries(e=[],{windowMonths:t="6",asOfDate:a=new Date,smoothOutliers:n=!0}={}){const r=normalizeMetaReportScenarioMonthWindow(t)==="all"?1/0:Number.parseInt(normalizeMetaReportScenarioMonthWindow(t),10)||6,o=e.filter(metaReportScenarioIsAdActive).filter(d=>!metaReportScenarioIsIncompleteMonth(d,a)).map(metaReportScenarioEnrichMonth),s=o.length,i=r===1/0?o:o.slice(-r);let l=0,c=i;if(n&&i.length>=3){const d=i.map(b=>metaReportParseAmount(b.cpl)),u=i.map(b=>metaReportParseAmount(b.leads)),p=metaReportScenarioMedian(d),h=metaReportScenarioMedian(u),m=metaReportScenarioMad(d),g=metaReportScenarioMad(u);c=i.map(b=>{const f={...b};let v=!1;const y=metaReportParseAmount(b.leads);if(m>0){const $=p-META_SCENARIO_MAD_MULTIPLIER*m,w=p+META_SCENARIO_MAD_MULTIPLIER*m,S=Math.min(w,Math.max($,metaReportParseAmount(b.cpl)));S!==metaReportParseAmount(b.cpl)&&(f.cpl=metaReportRoundMoney(S),f.leads=Math.max(1,Math.round(metaReportParseAmount(b.spend)/S)),v=!0)}if(g>0){const $=h-META_SCENARIO_MAD_MULTIPLIER*g,w=h+META_SCENARIO_MAD_MULTIPLIER*g,S=Math.min(w,Math.max($,metaReportParseAmount(b.leads)));Math.round(S)!==Math.round(y)&&(f.leads=Math.max(1,Math.round(S)),v=!0)}if(v){l+=1;const $=y>0?metaReportParseAmount(b.wonLeads)/y:0,w=metaReportParseAmount(f.leads);f.wonLeads=Math.max(0,Math.round(w*$)),f.totalLeadValue=metaReportRoundMoney(f.wonLeads*metaReportParseAmount(b.avgLeadValue));const S=metaReportParseAmount(f.spend);f.efficiencyIndex=S>0?f.totalLeadValue/S:0}return f})}return{months:c,monthsAvailable:s,monthsUsed:c.length,outliersAdjusted:l,confidence:metaReportResolveScenarioConfidence(c.length)}}function metaReportScenarioRecencyEfficiency(e=[]){if(e.length<META_SCENARIO_MIN_EFFICIENCY_MONTHS)return null;let t=0,a=0,n=0,r=0,o=0,s=0;return e.forEach((i,l)=>{const c=l+1;t+=metaReportParseAmount(i.spend)*c,a+=metaReportParseAmount(i.leads)*c,n+=metaReportParseAmount(i.wonLeads)*c,r+=metaReportParseAmount(i.wonLeads)*metaReportParseAmount(i.avgLeadValue)*c,o+=metaReportParseAmount(i.wonLeads)*metaReportParseAmount(i.avgProfitPerWon)*c,s+=metaReportParseAmount(i.spend)}),{avgCpl:a>0?metaReportRoundMoney(t/a):0,winRate:a>0?metaReportRoundRatio(n/a):0,avgLeadValue:n>0?metaReportRoundMoney(r/n):0,avgProfitPerWon:n>0?metaReportRoundMoney(o/n):0,avgMonthlySpend:e.length>0?metaReportRoundMoney(s/e.length):0}}function metaReportScenarioPooledEfficiency(e=[]){return metaReportAggregateSeriesEfficiency(e)}function metaReportScenarioBlendEfficiency(e,t,a=.5){if(!e||!t)return e||t;const n=1-a;return{avgCpl:metaReportRoundMoney(e.avgCpl*a+t.avgCpl*n),winRate:metaReportRoundRatio(e.winRate*a+t.winRate*n),avgLeadValue:metaReportRoundMoney(e.avgLeadValue*a+t.avgLeadValue*n),avgProfitPerWon:metaReportRoundMoney(e.avgProfitPerWon*a+t.avgProfitPerWon*n),avgMonthlySpend:metaReportRoundMoney(e.avgMonthlySpend*a+t.avgMonthlySpend*n)}}function metaReportScenarioMonthlyTrend(e=[],t=.75,{dampenHotStreak:a=!1}={}){if(e.length<META_SCENARIO_MIN_TREND_MONTHS)return{trendRate:0,trendDirection:"flat",trendRatePct:0,trendR:0};const n=e.map(d=>metaReportParseAmount(d.spend)).filter(d=>d>0),r=metaReportScenarioMedian(n)||1,o=e.map((d,u)=>{const p=metaReportParseAmount(d.spend),h=metaReportParseAmount(d.efficiencyIndex),m=h>0?h:1e-6,g=p>0?p:r;return{x:u,y:Math.log(m)-t*Math.log(g/r)}}),{slope:s,r:i}=metaReportScenarioLinearRegression(o);let l=Math.max(-META_SCENARIO_MAX_MONTHLY_TREND,Math.min(META_SCENARIO_MAX_MONTHLY_TREND,s));if(a){const d=e.map(h=>metaReportParseAmount(h.efficiencyIndex)).filter(h=>h>0),u=metaReportScenarioMedian(d),p=e.slice(-3).reduce((h,m)=>h+metaReportParseAmount(m.efficiencyIndex),0)/Math.min(3,e.length);u>0&&p>u*1.15&&l>0&&(l*=.5)}let c="flat";return Math.abs(l)>=.005&&(c=l>0?"up":"down"),{trendRate:l,trendDirection:c,trendRatePct:metaReportRoundRatio(l*100),trendR:metaReportRoundRatio(i)}}function metaReportScenarioCalibrateElasticity(){return META_REPORT_SCENARIO_FIXED_ELASTICITY}function metaReportResolveScenarioConfidence(e=0){const t=Number.parseInt(e,10)||0;return t<4?"low":t<7?"medium":"high"}function metaReportComputeScenarioEfficiency(e=[],{blendHistory:t=!1,includeTrend:a=!1,cautionStrongMonths:n=!1}={}){const r=META_REPORT_SCENARIO_FIXED_ELASTICITY,o=metaReportScenarioCalibrateElasticity(),s=metaReportScenarioRecencyEfficiency(e),i=metaReportScenarioPooledEfficiency(e);if(!s||s.avgCpl<=0)return{efficiency:null,elasticity:o,presetElasticity:r,trendRate:0,trendDirection:"flat",trendRatePct:0,trendR:0};const l=t?metaReportScenarioBlendEfficiency(i,s,.5):s;let c={trendRate:0,trendDirection:"flat",trendRatePct:0,trendR:0};if(a){const d=metaReportScenarioMonthlyTrend(e,o,{dampenHotStreak:n});Math.abs(d.trendR)>=META_SCENARIO_TREND_R_THRESHOLD&&(c=d)}return{efficiency:l,elasticity:o,presetElasticity:r,...c}}function metaReportProjectBudgetAtSpend({baselineSpend:e,spend:t,efficiency:a,elasticity:n=.75,trendAdj:r=1,hasBottomline:o=!1}={}){const s=metaReportParseAmount(e),i=metaReportParseAmount(t);if(i<=0||s<=0||!a||a.avgCpl<=0)return{spend:0,leads:0,wonLeads:0,totalLeadValue:0,roasKr:0,roasX:0,poasKr:null,poasX:null};const l=s/a.avgCpl,c=i/s,d=metaReportParseAmount(r)>0?metaReportParseAmount(r):1,u=Math.max(0,Math.round(l*c**n*d)),p=Math.round(u*a.winRate),h=metaReportRoundMoney(p*a.avgLeadValue),m=metaReportRoundMoney(h-i),g=i>0?metaReportRoundRatio(m/i):0;let b=null,f=null;if(o&&a.avgProfitPerWon>0){const v=metaReportRoundMoney(p*a.avgProfitPerWon);b=metaReportRoundMoney(v-i),f=i>0?metaReportRoundRatio(b/i):0}return{spend:i,leads:u,wonLeads:p,totalLeadValue:h,roasKr:m,roasX:g,poasKr:b,poasX:f}}function metaReportSpendFromMonthKey(e=[],t=null,a=null){if(!a)return 0;const n=t?.months?.[a];if(n&&!n.meta?.emptyMonth&&metaReportMonthPeriodAligned(n)){const o=metaReportParseAmount(n.meta?.spend);if(o>0)return o}const r=e.find(o=>o.monthKey===a);return r?metaReportParseAmount(r.spend):0}function buildMetaReportScenarioProjection(e,t){const a=getMetaReportScenarioPillsFromState(),n=resolveMetaReportScenarioPayload(t)||t;return metaReportProjectBudgetScenario({series:e,multiplier:metaReportsState.budgetMultiplier,hasBottomline:payloadHasMetaReportBottomline(n),blendHistory:a.blendHistory,includeTrend:a.includeTrend,monthWindow:metaReportsState.scenarioMonthWindow,baselineMode:metaReportsState.budgetBaseline,activeMonthKey:resolveMetaReportScenarioActiveMonthKey(n),smoothOutliers:a.smoothUneven})}function isMetaReportViewingPastYear(e){const t=Number(e?.year||metaReportsState.selectedYear),a=getMetaReportCalendarYear(e);return Number.isFinite(t)&&t<a}function updateMetaReportScenarioSource(e){if(!e)return;const t=getMetaReportCalendarYear(e);if(Number(e.year)!==t)return;const{series:a}=resolveMetaReportChartSeries(e);a.length&&(metaReportsState.scenarioSourcePayload=e,metaReportsState.scenarioSeries=a)}function resolveMetaReportScenarioPayload(e){return isMetaReportViewingPastYear(e)&&metaReportsState.scenarioSourcePayload?metaReportsState.scenarioSourcePayload:e}function resolveMetaReportScenarioSeries(e){return isMetaReportViewingPastYear(e)&&metaReportsState.scenarioSeries?.length?metaReportsState.scenarioSeries:metaReportsState.chartSeries||[]}function resolveMetaReportScenarioActiveMonthKey(e){return isMetaReportViewingPastYear(e)?metaReportMonthKeyFromDate(new Date):metaReportsState.activeMonthKey}async function ensureMetaReportScenarioSource(e,{editable:t=!1}={}){if(!e||!isMetaReportViewingPastYear(e)||metaReportsState.scenarioSeries?.length)return;const a=getMetaReportCalendarYear(e),n=e.clientId;try{if(t&&n){const r=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(n)}?year=${encodeURIComponent(a)}`);updateMetaReportScenarioSource(r);return}if(REPORT_TOKEN){const r=await fetch(`/api/meta-reports/public/${encodeURIComponent(REPORT_TOKEN)}?year=${encodeURIComponent(a)}`).then(async o=>{const s=await o.json();if(!o.ok)throw new Error(s.error||"Report not found");return s});updateMetaReportScenarioSource(r)}}catch{}}function resolveMetaReportLastMonthBaseline(e=[],{activeMonthKey:t=null,asOfDate:a=new Date,payload:n=null}={}){const r=e.filter(c=>metaReportParseAmount(c.spend)>0).sort((c,d)=>String(c.monthKey).localeCompare(String(d.monthKey)));if(!r.length)return null;const o=t||metaReportMonthKeyFromDate(a);if(!o)return null;const s=o?metaReportAddMonthsToMonthKey(o,-1):null;if(!s)return null;const i=r.find(c=>c.monthKey===s),l=metaReportSpendFromMonthKey(e,n,s);return!i&&l<=0?null:{monthKey:s,label:metaMonthLabel(s),spend:l>0?l:metaReportParseAmount(i.spend)}}function resolveMetaReportScenarioBaselineSpend(e,t,{baselineMode:a="year",activeMonthKey:n=null,asOfDate:r=new Date,payload:o=null}={}){const s=t?.months||[];if(a==="month"&&n){const i=metaReportSpendFromMonthKey(e,o,n);if(i>0)return i;const l=s.find(c=>c.monthKey===n);return l&&metaReportParseAmount(l.spend)>0?metaReportParseAmount(l.spend):0}if(a==="last"){const i=resolveMetaReportLastMonthBaseline(e,{activeMonthKey:n,asOfDate:r,payload:o});return i?.spend>0?i.spend:0}if(a==="year"&&s.length>0){const i=s.reduce((l,c)=>l+metaReportParseAmount(c.spend),0);return metaReportRoundMoney(i/s.length)}return 0}function metaReportProjectBudgetScenario({series:e=[],baselineSpend:t,multiplier:a=1,hasBottomline:n=!1,blendHistory:r=!1,includeTrend:o=!1,cautionStrongMonths:s=!1,monthWindow:i="6",baselineMode:l="year",activeMonthKey:c=null,asOfDate:d=new Date,smoothOutliers:u=!0}={}){const p=metaReportPrepareScenarioSeries(e,{windowMonths:i,asOfDate:d,smoothOutliers:u}),h=metaReportComputeScenarioEfficiency(p.months,{blendHistory:r,includeTrend:o,cautionStrongMonths:s});let m=metaReportParseAmount(t);m||(m=resolveMetaReportScenarioBaselineSpend(e,p,{baselineMode:l,activeMonthKey:c,asOfDate:d}));const g=metaReportParseAmount(a)||1,{efficiency:b,elasticity:f,trendRate:v}=h;if(!b||b.avgCpl<=0||m<=0||p.monthsUsed<META_SCENARIO_MIN_EFFICIENCY_MONTHS)return{...h,prepared:p,baseline:metaReportProjectBudgetAtSpend({baselineSpend:0,spend:0,efficiency:b}),projected:metaReportProjectBudgetAtSpend({baselineSpend:0,spend:0,efficiency:b}),projectedConservative:null,projectedOptimistic:null,multiplier:g,baselineSpend:m,hasBottomline:n,insufficientData:!0};const y=Math.exp(v*1),$=metaReportProjectBudgetAtSpend({baselineSpend:m,spend:m,efficiency:b,elasticity:f,trendAdj:1,hasBottomline:n}),w=metaReportProjectBudgetAtSpend({baselineSpend:m,spend:metaReportRoundMoney(m*g),efficiency:b,elasticity:f,trendAdj:y,hasBottomline:n}),S=metaReportProjectBudgetAtSpend({baselineSpend:m,spend:metaReportRoundMoney(m*g),efficiency:b,elasticity:f,trendAdj:Math.exp(Math.min(v,0)*1),hasBottomline:n}),L=metaReportProjectBudgetAtSpend({baselineSpend:m,spend:metaReportRoundMoney(m*g),efficiency:b,elasticity:f,trendAdj:Math.exp(Math.max(v,0)*1),hasBottomline:n});return{...h,prepared:p,baseline:$,projected:w,projectedConservative:S,projectedOptimistic:L,multiplier:g,baselineSpend:m,hasBottomline:n,insufficientData:!1}}function metaReportBuildScenarioProjectionMonthKeys(e=META_REPORT_SCENARIO_PROJECTED_MONTHS,t=new Date){const a=metaReportMonthKeyFromDate(t);if(!a||e<=0)return[];const n=[];for(let r=1;r<=e;r+=1)n.push(metaReportAddMonthsToMonthKey(a,r));return n}function buildMetaReportScenarioProjectionSteps(e,{months:t=META_REPORT_SCENARIO_PROJECTED_MONTHS,hasBottomline:a=!1,asOfDate:n=new Date,targetMultiplier:r=null}={}){if(!e||e.insufficientData)return[];const o=metaReportParseAmount(e.baselineSpend),s=metaReportParseAmount(r??e.multiplier)||1,i=e.efficiency,l=e.elasticity||.75,c=e.trendRate||0,d=metaReportBuildScenarioProjectionMonthKeys(t,n),u=[];for(let p=1;p<=t;p+=1){const h=s,m=metaReportRoundMoney(o*h),g=Math.exp(c*p),b=metaReportProjectBudgetAtSpend({baselineSpend:o,spend:m,efficiency:i,elasticity:l,trendAdj:g,hasBottomline:a}),f=d[p-1]||null;u.push({label:f?metaMonthLabel(f):`+${p} mo`,monthKey:f,spendMultiplier:metaReportRoundRatio(h),spend:b.spend,leads:b.leads,wonLeads:b.wonLeads,totalLeadValue:b.totalLeadValue,roasKr:b.roasKr,roasX:b.roasX,poasKr:b.poasKr,poasX:b.poasX})}return u}function metaReportSpendAxisTick(e){const t=Number(e)||0;return Math.abs(t)>=1e6?`${(t/1e6).toFixed(1)}M`:Math.abs(t)>=1e3?`${Math.round(t/1e3)}K`:t}function metaReportSpendMultiplierValue(e,t){const a=metaReportParseAmount(t),n=metaReportParseAmount(e);return a<=0?0:metaReportRoundRatio(n/a)}function resolveMetaReportSpendChartBaseline(e,t=null){const a=metaReportParseAmount(t?.baselineSpend);return a>0?a:metaReportAggregateSeriesEfficiency(e).avgMonthlySpend}function trimMetaReportScenarioSeries(e,t=META_REPORT_SCENARIO_MAX_HISTORICAL){const a=e.filter(n=>metaReportParseAmount(n.spend)>0);return a.length>t?a.slice(-t):a}function metaReportMonthKeyFromDate(e=new Date){const t=e instanceof Date?e:new Date(e);return Number.isNaN(t.getTime())?null:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`}function metaReportAddMonthsToMonthKey(e,t=0){const a=String(e||"").trim();if(!/^\d{4}-\d{2}$/.test(a))return null;const[n,r]=a.split("-").map(Number),o=new Date(n,r-1+t,1);return`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}`}function metaReportDeltaPct(e,t){const a=metaReportParseAmount(t),n=metaReportParseAmount(e);return a?metaReportRoundRatio((n-a)/Math.abs(a)*100):null}function metaReportResolveBaselineSpend(e,t,a=null){if(a?.baselineSpend>0)return metaReportParseAmount(a.baselineSpend);const n=getMetaReportScenarioPillsFromState(),r=a?.prepared||metaReportPrepareScenarioSeries(t,{windowMonths:metaReportsState.scenarioMonthWindow,smoothOutliers:n.smoothUneven});return resolveMetaReportScenarioBaselineSpend(t,r,{baselineMode:metaReportsState.budgetBaseline,activeMonthKey:resolveMetaReportScenarioActiveMonthKey(e)})}function resolveMetaReportScenarioChartSeries(e){const t=metaReportMonthKeyFromDate(new Date),a=e.filter(n=>!(metaReportParseAmount(n.spend)<=0||t&&n.monthKey&&n.monthKey>t));return trimMetaReportScenarioSeries(a)}function resolveMetaReportScenarioBaselineHints(e=[],t=null,a=null){const n=a||metaReportsState.clientPayload||null,r=getMetaReportScenarioPillsFromState(),o=t?.prepared||metaReportPrepareScenarioSeries(e,{windowMonths:metaReportsState.scenarioMonthWindow,smoothOutliers:r.smoothUneven}),s=resolveMetaReportScenarioActiveMonthKey(n),i=metaReportMonthKeyFromDate(new Date),l=getMetaReportCalendarYear(n)||n?.year||metaReportsState.selectedYear||(s?Number(String(s).slice(0,4)):null),c={activeMonthKey:s,asOfDate:new Date,payload:n},d=resolveMetaReportLastMonthBaseline(e,c),u=resolveMetaReportScenarioBaselineSpend(e,o,{baselineMode:"year",...c}),p=resolveMetaReportScenarioBaselineSpend(e,o,{baselineMode:"last",...c}),h=resolveMetaReportScenarioBaselineSpend(e,o,{baselineMode:"month",...c}),m=!!(i&&l&&String(i).startsWith(`${l}-`));return{windowAverage:u,windowMonthCount:o.monthsUsed||o.months.length||0,selectedMonthSpend:h,selectedMonthLabel:s?metaMonthLabel(s):"",activeKey:s,currentMonthSpend:m?metaReportSpendFromMonthKey(e,n,i):0,currentMonthLabel:m?metaMonthLabel(i):"",currentKey:m?i:null,lastMonthSpend:p,lastMonthLabel:d?.label||"",lastMonthKey:d?.monthKey||null}}function renderMetaReportBaselineSelectOptions(e=null,t="year"){const a=e?.windowAverage>0?metaReportFmtBaselineAmount(e.windowAverage):"\u2014",n=e?.lastMonthSpend>0?metaReportFmtBaselineAmount(e.lastMonthSpend):"\u2014",r=e?.selectedMonthSpend>0?metaReportFmtBaselineAmount(e.selectedMonthSpend):"\u2014",o=normalizeMetaReportBudgetBaseline(t),s=e?.lastMonthLabel?`Last month \xB7 ${e.lastMonthLabel}`:"Last month";return`
    <option value="year"${o==="year"?" selected":""}>Window average \xB7 ${esc(a)}</option>
    <option value="last"${o==="last"?" selected":""}>${esc(s)} \xB7 ${esc(n)}</option>
    <option value="month"${o==="month"?" selected":""}>Selected month \xB7 ${esc(r)}</option>
  `}function syncMetaReportBaselineUi(e=[],t=null,a=null){const n=resolveMetaReportScenarioBaselineHints(e,t,a),r=document.getElementById("meta-report-budget-baseline");if(r){const o=r.value||metaReportsState.budgetBaseline;r.innerHTML=renderMetaReportBaselineSelectOptions(n,o),r.value=normalizeMetaReportBudgetBaseline(o)}}function renderMetaReportScenarioContextStrip(e){if(!e||e.insufficientData)return'<p class="meta-report-scenario-context" id="meta-report-scenario-context">Add at least two completed ad months to model a budget scenario.</p>';const t=describeActiveMetaReportScenarioPills(),a=t.length?t.join(" \xB7 "):"Recent months only",n=e.trendDirection==="up"?`trend up ${Math.abs(e.trendRatePct||0).toFixed(1)}%/mo`:e.trendDirection==="down"?`trend down ${Math.abs(e.trendRatePct||0).toFixed(1)}%/mo`:"trend flat",r=e.prepared?.outliersAdjusted?` \xB7 ${e.prepared.outliersAdjusted} uneven month${e.prepared.outliersAdjusted===1?"":"s"} removed`:"",s={low:"Low confidence",medium:"Medium confidence",high:"High confidence"}[e.prepared?.confidence]||"",i=s?` \xB7 ${s} (${e.prepared?.monthsUsed||0} mo data)`:"";return`<p class="meta-report-scenario-context" id="meta-report-scenario-context"><strong>Active:</strong> ${esc(a)} \xB7 last ${e.prepared?.monthsUsed||0} ad months \xB7 ${esc(n)}${esc(r)}${esc(i)}</p>`}function payloadHasMetaReportBottomline(e){return e?.settings?.metaReportShowBottomline===!1?!1:seriesHasBottomline(metaReportsState.chartSeries||buildMetaReportChartSeries(e))}function seriesHasBottomline(e=[]){return e.some(t=>t.poasKr!=null&&t.poasX!=null)}function renderMetaReportChartsPanel({editable:e=!1}={}){const t=metaReportsState.chartTab||"trend";return`
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
  `}const META_REPORT_COMPARISON_PRESETS=[{id:"mom",label:"This month vs last month"},{id:"months",label:"Compare months"},{id:"custom",label:"Custom dates"},{id:"ytd",label:"This year vs last year"}],META_REPORT_COMPARISON_TABLE_GROUPS=[{title:"Meta ads",accent:"meta",rows:[{label:"Total spend",metricId:"spend",format:"kr",higherIsBetter:null},{label:"Cost Pr Mile (CPM)",metricId:"cpm",format:"kr",higherIsBetter:!1},{label:"Impressions",metricId:"impressions",format:"num",higherIsBetter:!0},{label:"Reach",metricId:"reach",format:"num",higherIsBetter:!0},{label:"Click",metricId:"clicks",format:"num",higherIsBetter:!0},{label:"CTR",metricId:"conversionRatePercent",format:"pct",higherIsBetter:!0}]},{title:"Topline KPI'er",accent:"topline",highlightLastN:2,rows:[{label:"Leads",metricId:"leads",format:"num",higherIsBetter:!0},{label:"Cost Per Lead (CPL)",metricId:"cpl",format:"kr",higherIsBetter:!1},{label:"Won leads",metricId:"wonLeads",format:"num",higherIsBetter:!0},{label:"Total Lead Value",metricId:"totalLeadValue",format:"kr",higherIsBetter:!0},{label:"Average Lead Value",metricId:"avgLeadValue",format:"kr",higherIsBetter:!0},{label:"Client acquisition cost (CAC)",metricId:"cac",format:"kr",higherIsBetter:!1},{label:"Return on Ads Spend (ROAS)",metricId:"roasKr",format:"kr",higherIsBetter:!0},{label:"Return on Ads Spend % (ROAS)",metricId:"roasX",format:"x",higherIsBetter:!0}]},{title:"Bottomline KPI'er",accent:"bottomline",highlightLastN:2,bottomlineOnly:!0,rows:[{label:"Leads",metricId:"leads",format:"num",higherIsBetter:!0},{label:"Won leads",metricId:"wonLeads",format:"num",higherIsBetter:!0},{label:"Total Lead Value",metricId:"totalLeadValue",format:"kr",higherIsBetter:!0},{label:"Average Lead Value",metricId:"avgLeadValue",format:"kr",higherIsBetter:!0},{label:"Client acquisition cost (CAC)",metricId:"cac",format:"kr",higherIsBetter:!1},{label:"Avg Total Profit",metricId:"totalProfit",format:"kr",higherIsBetter:!0},{label:"Avg Single Profit Order",metricId:"avgProfitPerWon",format:"kr",higherIsBetter:!0},{label:"Profit on Ads Spend (POAS)",metricId:"poasKr",format:"kr",higherIsBetter:!0},{label:"Profit on Ads Spend % (POAS)",metricId:"poasX",format:"x",higherIsBetter:!0},{label:"Censio fee",metricId:"censioFee",format:"kr",higherIsBetter:!1},{label:"Profit on Investment (POI)",metricId:"poiKr",format:"kr",higherIsBetter:!0},{label:"Profit on Investment % (POI)",metricId:"poiX",format:"x",higherIsBetter:!0}]}];function metaReportComparisonAddMonths(e,t=0){const a=String(e||"").trim();if(!/^\d{4}-\d{2}$/.test(a))return null;const[n,r]=a.split("-").map(Number),o=new Date(n,r-1+t,1);return`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}`}function metaReportComparisonMonthKeysInRange(e,t){if(!e||!t)return[];const[a,n]=e<=t?[e,t]:[t,e],r=[];let o=a;for(;o&&o<=n&&(r.push(o),o!==n);)o=metaReportComparisonAddMonths(o,1);return r}function metaReportComparisonParseDate(e){const t=String(e||"").trim().slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(t))return null;const[a,n,r]=t.split("-").map(Number),o=new Date(a,n-1,r);return o.getFullYear()!==a||o.getMonth()!==n-1||o.getDate()!==r?null:t}function metaReportComparisonDaysInclusive(e,t){const a=metaReportComparisonParseDate(e),n=metaReportComparisonParseDate(t);if(!a||!n||a>n)return 0;const[r,o,s]=a.split("-").map(Number),[i,l,c]=n.split("-").map(Number),d=Date.UTC(r,o-1,s),u=Date.UTC(i,l-1,c);return Math.floor((u-d)/864e5)+1}function metaReportComparisonOverlapDays(e,t,a,n){const r=e>a?e:a,o=t<n?t:n;return!r||!o||r>o?0:metaReportComparisonDaysInclusive(r,o)}function metaReportComparisonMonthKeyFromDate(e){const t=metaReportComparisonParseDate(e);return t?t.slice(0,7):null}function metaReportComparisonMonthKeysOverlappingDates(e,t){const a=metaReportComparisonParseDate(e),n=metaReportComparisonParseDate(t);if(!a||!n)return[];const[r,o]=a<=n?[a,n]:[n,a],s=[];let i=metaReportComparisonMonthKeyFromDate(r);const l=metaReportComparisonMonthKeyFromDate(o);for(;i&&i<=l&&(s.push(i),i!==l);)i=metaReportComparisonAddMonths(i,1);return s}function metaReportComparisonMonthEffectivePeriod(e,t){const a=metaReportMonthBounds(t||e?.monthKey),n=metaReportComparisonParseDate(e?.periodStart)||a.start,r=metaReportComparisonParseDate(e?.periodEnd)||a.end;return n&&r&&n<=r?{start:n,end:r}:a}function metaReportComparisonFormatDateLabel(e){const t=metaReportComparisonParseDate(e);if(!t)return"\u2014";const[a,n,r]=t.split("-").map(Number);return`${r} ${META_MONTH_LABELS[n-1]||n} ${a}`}function metaReportComparisonFormatDateRangeLabel(e,t){const a=metaReportComparisonParseDate(e),n=metaReportComparisonParseDate(t);if(!a||!n)return"\u2014";if(a===n)return metaReportComparisonFormatDateLabel(a);const r=a.slice(0,4),o=n.slice(0,4),s=a.slice(5,7),i=n.slice(5,7);if(r===o&&s===i){const[,l,c]=a.split("-").map(Number),[,,d]=n.split("-").map(Number);return`${c}\u2013${d} ${META_MONTH_LABELS[l-1]||l} ${r}`}return r===o?`${metaReportComparisonFormatDateLabel(a).replace(` ${r}`,"")}\u2013${metaReportComparisonFormatDateLabel(n)}`:`${metaReportComparisonFormatDateLabel(a)} \u2013 ${metaReportComparisonFormatDateLabel(n)}`}function metaReportComparisonMonthPayloadDates(e,t){const a=metaReportComparisonMonthEffectivePeriod(e,t);return{startDate:a.start,endDate:a.end,startMonthKey:t,endMonthKey:t}}function metaReportComparisonFullMonthDates(e){const t=metaReportMonthBounds(e);return{startDate:t.start,endDate:t.end,startMonthKey:e,endMonthKey:e}}function metaReportComparisonFormatDisplayLabel(e,t){const a=metaReportComparisonNormalizePeriod(t);return a?e==="mom"||e==="months"?metaReportComparisonPeriodLabel(a.startMonthKey,a.endMonthKey):e==="ytd"?a.startDate.slice(0,4):metaReportComparisonFormatDateRangeLabel(a.startDate,a.endDate):"\u2014"}function metaReportComparisonAggregateForMode(e,t,a){const n=metaReportComparisonNormalizePeriod(a);if(!n)return{label:"\u2014",monthKeys:[],monthCount:0,expectedMonthCount:0,partialData:!1,hasData:!1,hasBottomline:!1,metrics:metaReportComparisonAggregateDateRange({},null,null).metrics};let r;return e==="mom"||e==="months"?r=metaReportAggregateComparisonRange(t,n.startMonthKey,n.endMonthKey):r=metaReportComparisonAggregateDateRange(t,n.startDate,n.endDate),r.label=metaReportComparisonFormatDisplayLabel(e,n),r}function metaReportComparisonNormalizePeriod(e=null){if(!e)return null;const t=metaReportComparisonParseDate(e.startDate)||(e.startMonthKey?metaReportMonthBounds(e.startMonthKey).start:null),a=metaReportComparisonParseDate(e.endDate)||(e.endMonthKey?metaReportMonthBounds(e.endMonthKey).end:null);if(!t||!a)return null;const[n,r]=t<=a?[t,a]:[a,t];return{startDate:n,endDate:r,startMonthKey:metaReportComparisonMonthKeyFromDate(n),endMonthKey:metaReportComparisonMonthKeyFromDate(r)}}function metaReportComparisonPeriodLabel(e,t){if(!e||!t)return"\u2014";if(e===t)return`${metaMonthLabel(e)} ${String(e).slice(0,4)}`;const a=String(e).slice(0,4),n=String(t).slice(0,4);return a===n?`${metaMonthLabel(e)}\u2013${metaMonthLabel(t)} ${a}`:`${metaMonthLabel(e)} ${a}\u2013${metaMonthLabel(t)} ${n}`}function metaReportMonthHasComparisonData(e){return!e||e.meta?.emptyMonth?!1:metaReportParseAmount(e.meta?.spend)>0||metaReportParseAmount(e.topline?.leads)>0}function metaReportAggregateComparisonRange(e={},t,a){const n=metaReportComparisonMonthKeysInRange(t,a),r=[];let o=!1,s=0,i=0,l=0,c=0,d=0,u=0,p=0,h=0,m=0,g=0,b=0,f=0,v=0;for(const R of n){const A=e[R];if(!metaReportMonthHasComparisonData(A))continue;r.push(R),A.bottomline&&(o=!0);const k=metaReportParseAmount(A.meta?.spend),F=metaReportParseAmount(A.meta?.impressions),O=metaReportParseAmount(A.topline?.leads),x=metaReportParseAmount(A.topline?.wonLeads);s+=k,i+=F,l+=metaReportParseAmount(A.meta?.reach),c+=metaReportParseAmount(A.meta?.clicks),d+=O,u+=x,p+=metaReportParseAmount(A.topline?.totalLeadValue),x>0&&(g+=metaReportParseAmount(A.topline?.avgLeadValue)*x,A.bottomline&&(b+=metaReportParseAmount(A.bottomline.avgProfitPerWon)*x)),F>0&&(f+=metaReportParseAmount(A.meta?.cpm)*F,v+=F),A.bottomline&&(h+=metaReportParseAmount(A.bottomline.totalProfit),m+=metaReportParseAmount(A.bottomline.censioFee))}const y=d>0?Math.round(s/d*100)/100:0,$=u>0?Math.round(s/u*100)/100:0,w=u>0?Math.round(g/u*100)/100:0,S=u>0?Math.round(b/u*100)/100:0,L=v>0?Math.round(f/v*100)/100:0,B=i>0?Math.round(c/i*100*1e8)/1e8:0,P=Math.round((p-s)*100)/100,C=s>0?Math.round(P/s*1e8)/1e8:0,M=Math.round((h-s)*100)/100,E=s>0?Math.round(M/s*1e8)/1e8:0,I=o?Math.round((M-m)*100)/100:0,D=s>0&&o?Math.round(I/s*1e8)/1e8:0;return{startKey:t,endKey:a,label:metaReportComparisonPeriodLabel(t,a),monthKeys:r,monthCount:r.length,expectedMonthCount:n.length,partialData:r.length>0&&r.length<n.length,hasData:r.length>0,hasBottomline:o,metrics:{spend:s,cpm:L,impressions:i,reach:l,clicks:c,conversionRatePercent:B,leads:d,cpl:y,wonLeads:u,totalLeadValue:p,avgLeadValue:w,cac:$,roasKr:P,roasX:C,totalProfit:h,avgProfitPerWon:S,poasKr:M,poasX:E,censioFee:m,poiKr:I,poiX:D}}}function metaReportComparisonAggregateDateRange(e={},t,a){const n=metaReportComparisonParseDate(t),r=metaReportComparisonParseDate(a);if(!n||!r)return{startDate:t||null,endDate:a||null,label:"\u2014",monthKeys:[],monthCount:0,expectedMonthCount:0,partialData:!1,hasData:!1,hasBottomline:!1,metrics:metaReportAggregateComparisonRange({},"0000-00","0000-00").metrics};const[o,s]=n<=r?[n,r]:[r,n],i=metaReportComparisonMonthKeysOverlappingDates(o,s),l=[];let c=!1,d=0,u=0,p=0,h=0,m=0,g=0,b=0,f=0,v=0,y=0,$=0,w=0,S=0,L=0,B=0;for(const U of i){const T=e[U],H=metaReportComparisonMonthEffectivePeriod(T,U),_=metaReportComparisonOverlapDays(o,s,H.start,H.end);if(_<=0||(d+=_,!metaReportMonthHasComparisonData(T)))continue;l.push(U),u+=_,T.bottomline&&(c=!0);const W=metaReportComparisonDaysInclusive(H.start,H.end),N=W>0?_/W:0,j=metaReportParseAmount(T.meta?.spend)*N,V=metaReportParseAmount(T.meta?.impressions)*N,q=metaReportParseAmount(T.topline?.leads)*N,K=metaReportParseAmount(T.topline?.wonLeads)*N;p+=j,h+=V,m+=metaReportParseAmount(T.meta?.reach)*N,g+=metaReportParseAmount(T.meta?.clicks)*N,b+=q,f+=K,v+=metaReportParseAmount(T.topline?.totalLeadValue)*N,K>0&&(w+=metaReportParseAmount(T.topline?.avgLeadValue)*K,T.bottomline&&(S+=metaReportParseAmount(T.bottomline.avgProfitPerWon)*K)),V>0&&(L+=metaReportParseAmount(T.meta?.cpm)*V,B+=V),T.bottomline&&(y+=metaReportParseAmount(T.bottomline.totalProfit)*N,$+=metaReportParseAmount(T.bottomline.censioFee)*N)}const P=b>0?Math.round(p/b*100)/100:0,C=f>0?Math.round(p/f*100)/100:0,M=f>0?Math.round(w/f*100)/100:0,E=f>0?Math.round(S/f*100)/100:0,I=B>0?Math.round(L/B*100)/100:0,D=h>0?Math.round(g/h*100*1e8)/1e8:0,R=Math.round((v-p)*100)/100,A=p>0?Math.round(R/p*1e8)/1e8:0,k=Math.round((y-p)*100)/100,F=p>0?Math.round(k/p*1e8)/1e8:0,O=c?Math.round((k-$)*100)/100:0,x=p>0&&c?Math.round(O/p*1e8)/1e8:0;return{startDate:o,endDate:s,label:metaReportComparisonFormatDateRangeLabel(o,s),monthKeys:l,monthCount:l.length,expectedMonthCount:i.length,partialData:d>0&&u<d,hasData:l.length>0,hasBottomline:c,metrics:{spend:p,cpm:I,impressions:h,reach:m,clicks:g,conversionRatePercent:D,leads:b,cpl:P,wonLeads:f,totalLeadValue:v,avgLeadValue:M,cac:C,roasKr:R,roasX:A,totalProfit:y,avgProfitPerWon:E,poasKr:k,poasX:F,censioFee:$,poiKr:O,poiX:x}}}function metaReportComparisonMergedMonthsMap(e,t,a){const n=metaReportComparisonYearsNeeded(t,a),r={...e?.months||{}};return n.forEach(o=>{Number(e?.year)!==Number(o)&&Object.assign(r,metaReportComparisonMonthsForYear(e,o))}),r}function metaReportResolveComparisonPresetDates(e,t="mom"){const a=metaReportsState.activeMonthKey||null,n=metaReportComparisonMergedMonthsMap(e,null,null);if(t==="custom")return{mode:t,periodA:metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodA),periodB:metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodB)};if(t==="months"){const r=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodA),o=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodB),s=l=>l&&l.startMonthKey===l.endMonthKey;if(s(r)&&s(o))return{mode:t,periodA:r,periodB:o};if(!a)return{mode:t,periodA:null,periodB:null};const i=metaReportComparisonAddMonths(a,-1);return{mode:t,periodA:metaReportComparisonFullMonthDates(a),periodB:i?metaReportComparisonFullMonthDates(i):null}}if(!a)return{mode:t,periodA:null,periodB:null};if(t==="mom"){const r=metaReportComparisonAddMonths(a,-1);return{mode:t,periodA:metaReportComparisonFullMonthDates(a),periodB:r?metaReportComparisonFullMonthDates(r):null}}if(t==="ytd"){const r=String(a).slice(0,4),o=String(a).slice(5,7),s=String(Number(r)-1),i=metaReportMonthBounds(a),l=`${s}-${o}`,c=metaReportMonthBounds(l);return{mode:t,periodA:{startDate:`${r}-01-01`,endDate:i.end,startMonthKey:`${r}-01`,endMonthKey:a},periodB:{startDate:`${s}-01-01`,endDate:c.end,startMonthKey:`${s}-01`,endMonthKey:l}}}return{mode:t,periodA:null,periodB:null}}function metaReportApplyComparisonPresetDefaults(e,t=metaReportsState.comparisonMode){const a=metaReportResolveComparisonPresetDates(e,t);return a.periodA&&(metaReportsState.comparisonPeriodA={...a.periodA}),a.periodB&&(metaReportsState.comparisonPeriodB={...a.periodB}),a}function metaReportResolveComparisonPresets({activeMonthKey:e=null,mode:t="mom"}={}){const a=metaReportsState.clientPayload||metaReportsState.publicPayload;return metaReportResolveComparisonPresetDates(a,t)}function metaReportComparisonMetricDefs(e=!1){const t=[{id:"spend",label:"Ad spend",group:"meta",format:"kr",higherIsBetter:null},{id:"cpm",label:"CPM",group:"meta",format:"kr",higherIsBetter:!1},{id:"impressions",label:"Impressions",group:"meta",format:"num",higherIsBetter:!0},{id:"reach",label:"Reach",group:"meta",format:"num",higherIsBetter:!0},{id:"clicks",label:"Clicks",group:"meta",format:"num",higherIsBetter:!0},{id:"conversionRatePercent",label:"CTR",group:"meta",format:"pct",higherIsBetter:!0},{id:"leads",label:"Leads",group:"topline",format:"num",higherIsBetter:!0},{id:"cpl",label:"CPL",group:"topline",format:"kr",higherIsBetter:!1},{id:"wonLeads",label:"Won leads",group:"topline",format:"num",higherIsBetter:!0},{id:"totalLeadValue",label:"Total lead value",group:"topline",format:"kr",higherIsBetter:!0},{id:"avgLeadValue",label:"Average lead value",group:"topline",format:"kr",higherIsBetter:!0},{id:"cac",label:"CAC",group:"topline",format:"kr",higherIsBetter:!1},{id:"roasKr",label:"ROAS",group:"topline",format:"kr",higherIsBetter:!0},{id:"roasX",label:"ROAS %",group:"topline",format:"x",higherIsBetter:!0}];return e&&t.push({id:"totalProfit",label:"Total profit",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"avgProfitPerWon",label:"Avg profit per won",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"poasKr",label:"POAS",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"poasX",label:"POAS %",group:"bottomline",format:"x",higherIsBetter:!0},{id:"poiKr",label:"POI",group:"bottomline",format:"kr",higherIsBetter:!0},{id:"poiX",label:"POI %",group:"bottomline",format:"x",higherIsBetter:!0}),t}function metaReportComparisonHeroIds(e=!1){return e?["spend","leads","wonLeads","roasKr","totalLeadValue","poasKr"]:["spend","leads","wonLeads","roasKr","totalLeadValue"]}function metaReportComparisonChartIds(e=!1,t="kr"){const a=["spend","leads","totalLeadValue"];return t==="x"?[...a,"roasX",...e?["poasX"]:[]]:[...a,"roasKr",...e?["poasKr"]:[]]}function metaReportBuildYtdByMonthComparison(e,t,a,n){if(!a||!n)return[];const r=metaReportComparisonMonthKeysInRange(a.startMonthKey,a.endMonthKey),o=String(n.startMonthKey||"").slice(0,4);return r.map(s=>{const i=String(s).slice(5,7),l=`${o}-${i}`,c=metaReportAggregateComparisonRange(e,s,s),d=metaReportAggregateComparisonRange(t,l,l);return{monthKey:s,label:metaMonthLabel(s),periodA:c.hasData?c.metrics:null,periodB:d.hasData?d.metrics:null,hasDataA:c.hasData,hasDataB:d.hasData}})}function metaReportBuildComparison({monthsMap:e={},monthsMapA:t=null,monthsMapB:a=null,periodA:n=null,periodB:r=null,mode:o="mom"}={}){const s=t||a||e,i=metaReportComparisonNormalizePeriod(n),l=metaReportComparisonNormalizePeriod(r);if(!i?.startDate||!i?.endDate||!l?.startDate||!l?.endDate)return{mode:o,insufficientData:!0,samePeriod:!1,periodA:null,periodB:null,deltas:{},heroMetrics:[],detailRows:[],ytdByMonth:[],hasBottomline:!1};const c=i.startDate===l.startDate&&i.endDate===l.endDate,d=metaReportComparisonAggregateForMode(o,s,n),u=metaReportComparisonAggregateForMode(o,s,r),p=d.hasBottomline||u.hasBottomline,h=!d.hasData&&!u.hasData,m=metaReportComparisonMetricDefs(p),g={},b=m.map(y=>{const $=d.metrics[y.id],w=u.metrics[y.id],S=metaReportDeltaPct($,w);return g[y.id]={pct:S,abs:Math.round((metaReportParseAmount($)-metaReportParseAmount(w))*100)/100},{...y,valueA:$,valueB:w,deltaPct:S}}),f=metaReportComparisonHeroIds(p).map(y=>{const $=m.find(w=>w.id===y);return{id:y,label:$?.label||y,valueA:d.metrics[y],valueB:u.metrics[y],deltaPct:g[y]?.pct??null,format:$?.format||"num",higherIsBetter:$?.higherIsBetter??null}}),v=o==="ytd"?metaReportBuildYtdByMonthComparison(s,s,i,l):[];return{mode:o,insufficientData:h,samePeriod:c,hasBottomline:p,periodA:d,periodB:u,deltas:g,heroMetrics:f,detailRows:b,ytdByMonth:v}}function metaReportComparisonYearsNeeded(e,t){const a=new Set;for(const n of[e,t]){const r=metaReportComparisonNormalizePeriod(n);r&&(r.startDate&&a.add(r.startDate.slice(0,4)),r.endDate&&a.add(r.endDate.slice(0,4)))}return[...a].filter(Boolean)}function metaReportComparisonMonthsForYear(e,t){return!e||Number(e.year)===Number(t)?e?.months||{}:metaReportsState.comparisonYearCache?.[t]?.months||{}}function metaReportComparisonAvailableMonthKeys(e){const t=new Set,a=n=>{n&&Object.entries(n.months||{}).forEach(([r,o])=>{metaReportMonthHasComparisonData(o)&&t.add(r)})};return a(e),Object.values(metaReportsState.comparisonYearCache||{}).forEach(a),[...t].sort()}function metaReportComparisonPresetDisabled(e,t){const a=metaReportsState.activeMonthKey;return a?e==="mom"?!metaReportComparisonAddMonths(a,-1):!1:!0}function metaReportComparisonFmtValue(e,t="num",a=!0){return a?t==="kr"?metaFmtKr(e):t==="x"?metaFmtX(e):t==="pct"?`${metaFmtNum(e,2)}%`:metaFmtNum(e):"\u2014"}function metaReportComparisonDeltaTone(e,t=null){return e==null||!Number.isFinite(e)||e===0?"neutral":t===!1?e<0?"positive":"negative":e>0?"positive":"negative"}function metaReportComparisonPeriodsFromState(e){let t=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodA),a=metaReportComparisonNormalizePeriod(metaReportsState.comparisonPeriodB);if(!t||!a){const n=metaReportApplyComparisonPresetDefaults(e,metaReportsState.comparisonMode);t=n.periodA,a=n.periodB}return{periodA:t,periodB:a,mode:metaReportsState.comparisonMode}}function metaReportComparisonMaps(e,t,a){const n=metaReportComparisonMergedMonthsMap(e,t,a);return{monthsMapA:n,monthsMapB:n}}async function ensureMetaReportComparisonYears(e,{editable:t=!1}={}){const{periodA:a,periodB:n}=metaReportComparisonPeriodsFromState(e),r=metaReportComparisonYearsNeeded(a,n),o=String(e?.year||metaReportsState.selectedYear),s=r.filter(i=>i!==o&&!metaReportsState.comparisonYearCache[i]);if(s.length)for(const i of s)try{let l;t&&e?.clientId?l=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e.clientId)}?year=${encodeURIComponent(i)}`):REPORT_TOKEN&&(l=await fetch(`/api/meta-reports/public/${encodeURIComponent(REPORT_TOKEN)}?year=${encodeURIComponent(i)}`).then(async c=>{const d=await c.json();if(!c.ok)throw new Error(d.error||"Report not found");return d})),l&&(metaReportsState.comparisonYearCache[i]=l)}catch{}}function computeMetaReportComparison(e){const{periodA:t,periodB:a,mode:n}=metaReportComparisonPeriodsFromState(e),r=metaReportComparisonMergedMonthsMap(e,t,a);return metaReportBuildComparison({monthsMap:r,periodA:t,periodB:a,mode:n})}function metaReportComparisonDateInputBounds(e){const t=metaReportComparisonAvailableMonthKeys(e);if(!t.length)return{min:"",max:""};const a=metaReportComparisonMergedMonthsMap(e,null,null);let n="",r="";return t.forEach(o=>{const s=metaReportComparisonMonthEffectivePeriod(a[o],o);(!n||s.start<n)&&(n=s.start),(!r||s.end>r)&&(r=s.end)}),{min:n,max:r}}function metaReportComparisonMonthInputBounds(e){const t=new Set;if(e?.year&&t.add(String(e.year)),Object.keys(metaReportsState.comparisonYearCache||{}).forEach(n=>t.add(String(n))),metaReportComparisonAvailableMonthKeys(e).forEach(n=>t.add(String(n).slice(0,4))),!t.size){const n=metaReportsState.activeMonthKey;n&&t.add(String(n).slice(0,4))}if(!t.size){const n=String(new Date().getFullYear());return{min:`${n}-01`,max:`${n}-12`}}const a=[...t].sort((n,r)=>Number(n)-Number(r));return{min:`${a[0]}-01`,max:`${a[a.length-1]}-12`}}function metaReportComparisonReportYears(e){const t=new Set,a=i=>{i&&(i.year&&t.add(String(i.year)),Object.keys(i.months||{}).forEach(l=>{/^\d{4}-\d{2}$/.test(l)&&t.add(String(l).slice(0,4))}))};a(e),Object.values(metaReportsState.comparisonYearCache||{}).forEach(a),!t.size&&metaReportsState.activeMonthKey&&t.add(String(metaReportsState.activeMonthKey).slice(0,4)),t.size||t.add(String(new Date().getFullYear()));const n=[...t].sort((i,l)=>Number(i)-Number(l)),r=Number(n[0]),o=Number(n[n.length-1]),s=[];for(let i=r;i<=o;i+=1)s.push(String(i));return s}function metaReportComparisonMonthPickerYears(e){return metaReportComparisonReportYears(e)}function renderMetaReportComparisonMonthDropdown(e,t,a,n){const r=a.find(l=>l.value===t)||a[0],o=r?.value||t||"",s=r?.label||t||"\u2014",i=a.map(l=>`<button type="button" class="meta-report-comparison-month-option${l.value===o?" is-selected":""}" data-value="${esc(l.value)}" role="option" aria-selected="${l.value===o}">${esc(l.label)}</button>`).join("");return`
    <div class="meta-report-comparison-month-dropdown" data-comparison-month-part="${esc(e)}" data-selected-value="${esc(o)}">
      <button type="button" class="meta-report-comparison-month-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(n)}">
        <span class="meta-report-comparison-month-trigger-value">${esc(s)}</span>
        <span class="meta-report-comparison-month-trigger-icon" aria-hidden="true">\u25BE</span>
      </button>
      <div class="meta-report-comparison-month-menu meta-report-comparison-month-menu--${esc(e)}" data-comparison-menu-part="${esc(e)}" role="listbox" hidden>${i}</div>
    </div>
  `}function metaReportComparisonMonthKeyParts(e){if(!e||!/^\d{4}-\d{2}$/.test(e)){const t=metaReportsState.activeMonthKey;if(t&&/^\d{4}-\d{2}$/.test(t))return{month:t.slice(5,7),year:t.slice(0,4)};const a=new Date;return{month:String(a.getMonth()+1).padStart(2,"0"),year:String(a.getFullYear())}}return{month:e.slice(5,7),year:e.slice(0,4)}}function renderMetaReportComparisonMonthInput(e,t,a){const n=metaReportComparisonMonthPickerYears(a),{month:r,year:o}=metaReportComparisonMonthKeyParts(t),s=e==="b"?"Comparison month":"Current month",i=e==="b"?"Comparison year":"Current year",l=META_MONTH_LABELS.map((d,u)=>({value:String(u+1).padStart(2,"0"),label:d})),c=n.map(d=>({value:d,label:d}));return`
    <div class="meta-report-comparison-month-picker" data-comparison-month-side="${esc(e)}">
      ${renderMetaReportComparisonMonthDropdown("month",r,l,s)}
      ${renderMetaReportComparisonMonthDropdown("year",o,c,i)}
    </div>
  `}function renderMetaReportComparisonMonthPickerSide(e,t,a){return`
    <div class="meta-report-comparison-duel-side ${e==="b"?"is-b":"is-a"}">
      ${renderMetaReportComparisonMonthInput(e,t,a)}
    </div>
  `}function applyMetaReportComparisonMonthChange(e,t,a,{editable:n=!1}={}){if(!a||!/^\d{4}-\d{2}$/.test(a))return;const r=t==="b"?"comparisonPeriodB":"comparisonPeriodA";metaReportsState[r]=metaReportComparisonFullMonthDates(a),metaReportsState.comparisonMode="months",document.querySelectorAll("[data-comparison-preset]").forEach(o=>{const s=o.getAttribute("data-comparison-preset")==="months";o.classList.toggle("active",s),o.setAttribute("aria-pressed",s)}),refreshMetaReportComparison(e,{editable:n})}function positionMetaReportComparisonMonthMenu(e,t,a){const n=e.getBoundingClientRect(),o=(a?.getAttribute("data-comparison-month-part")||"month")==="year"?120:176;t.style.left=`${n.left+n.width/2}px`,t.style.top=`${n.bottom+6}px`,t.style.width=`${Math.max(o,n.width+28)}px`,t.style.minWidth=`${o}px`}function openMetaReportComparisonMonthMenu(e,t,a){closeMetaReportComparisonMonthMenus(t),t.parentElement!==document.body&&(t._metaComparisonOwner=a,document.body.appendChild(t)),t.hidden=!1,a.classList.add("is-open"),e.setAttribute("aria-expanded","true"),positionMetaReportComparisonMonthMenu(e,t,a)}function closeMetaReportComparisonMonthMenus(e=null){document.querySelectorAll(".meta-report-comparison-month-menu").forEach(t=>{if(t===e)return;t.hidden=!0;const a=t._metaComparisonOwner||t.closest(".meta-report-comparison-month-dropdown"),n=a?.querySelector(".meta-report-comparison-month-trigger");a?.classList.remove("is-open"),n?.setAttribute("aria-expanded","false"),t._metaComparisonOwner&&t.parentElement===document.body&&t._metaComparisonOwner.appendChild(t)})}function bindMetaReportComparisonMonthInputs(e,{editable:t=!1}={}){document.querySelectorAll("[data-comparison-month-side]").forEach(a=>{const n=a.getAttribute("data-comparison-month-side");if(!n)return;const r=a.querySelector('[data-comparison-month-part="month"]'),o=a.querySelector('[data-comparison-month-part="year"]'),s=()=>{const l=r?.getAttribute("data-selected-value")||"",c=o?.getAttribute("data-selected-value")||"";!l||!c||applyMetaReportComparisonMonthChange(e,n,`${c}-${l}`,{editable:t})};a.querySelectorAll(".meta-report-comparison-month-dropdown").forEach(l=>{const c=l.querySelector(".meta-report-comparison-month-trigger"),d=l.querySelector(".meta-report-comparison-month-menu");!c||!d||(c.onclick=u=>{if(u.preventDefault(),u.stopPropagation(),!d.hidden){closeMetaReportComparisonMonthMenus();return}openMetaReportComparisonMonthMenu(c,d,l)},l.querySelectorAll(".meta-report-comparison-month-option").forEach(u=>{u.onclick=p=>{p.preventDefault(),p.stopPropagation();const h=u.getAttribute("data-value")||"";l.setAttribute("data-selected-value",h);const m=c.querySelector(".meta-report-comparison-month-trigger-value");m&&(m.textContent=u.textContent||h),l.querySelectorAll(".meta-report-comparison-month-option").forEach(g=>{const b=g===u;g.classList.toggle("is-selected",b),g.setAttribute("aria-selected",String(b))}),closeMetaReportComparisonMonthMenus(),s()}}))});const i=a.closest(".meta-report-comparison-duel-side");i&&(i.onclick=l=>{if(l.target.closest(".meta-report-comparison-month-dropdown"))return;const c=a.getBoundingClientRect();(l.clientX<c.left+c.width/2?r:o)?.querySelector(".meta-report-comparison-month-trigger")?.click()})}),metaReportsState.comparisonMonthMenuListenerBound||(document.addEventListener("click",a=>{a.target.closest(".meta-report-comparison-month-menu")||a.target.closest(".meta-report-comparison-month-trigger")||closeMetaReportComparisonMonthMenus()}),window.addEventListener("resize",()=>closeMetaReportComparisonMonthMenus()),window.addEventListener("scroll",a=>{const n=a.target;n instanceof Element&&n.closest(".meta-report-comparison-month-menu")||closeMetaReportComparisonMonthMenus()},!0),metaReportsState.comparisonMonthMenuListenerBound=!0)}function renderMetaReportComparisonMonthPickersPanel(e,t,a){const n=metaReportComparisonMonthInputBounds(a),r=e?.startMonthKey||metaReportsState.activeMonthKey||n.min?.slice(0,7)||"",o=t?.startMonthKey||metaReportComparisonAddMonths(r,-1)||n.min?.slice(0,7)||"";return`
    <div class="meta-report-comparison-duel is-month-pickers" id="meta-report-comparison-range-panel" role="group" aria-label="Compare months">
      ${renderMetaReportComparisonMonthPickerSide("a",r,a)}
      <div class="meta-report-comparison-duel-divider" aria-hidden="true">vs</div>
      ${renderMetaReportComparisonMonthPickerSide("b",o,a)}
    </div>
  `}function renderMetaReportComparisonDateInput(e,t,a,n){const r=n.min?` data-min="${esc(n.min)}"`:"",o=n.max?` data-max="${esc(n.max)}"`:"";return`<input type="text" class="meta-report-comparison-date-input" data-comparison-date="${esc(e)}-${esc(t)}" value="${esc(a)}" placeholder="Select date" autocomplete="off" inputmode="none" readonly${r}${o} aria-label="${t==="start"?"From":"To"}" />`}function renderMetaReportComparisonCustomRangeSide(e,t,a,n){return`
    <div class="meta-report-comparison-duel-side ${e==="b"?"is-b":"is-a"}">
      <div class="meta-report-comparison-custom-range">
        <div class="meta-report-comparison-custom-range-field" data-comparison-range="${esc(e)}-start">
          ${renderMetaReportComparisonDateInput(e,"start",t,n)}
        </div>
        <span class="meta-report-comparison-custom-range-sep" aria-hidden="true">\u2013</span>
        <div class="meta-report-comparison-custom-range-field" data-comparison-range="${esc(e)}-end">
          ${renderMetaReportComparisonDateInput(e,"end",a,n)}
        </div>
        <span class="meta-report-comparison-date-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </span>
      </div>
    </div>
  `}function parseComparisonDateKey(e){const t=String(e||"").match(/^([ab])-(start|end)$/);return t?{side:t[1],bound:t[2],stateKey:t[1]==="b"?"comparisonPeriodB":"comparisonPeriodA"}:null}function metaReportComparisonSafePickerBounds(e,t){const a=e||void 0,n=t||void 0;return a&&n&&a>n?{min:n,max:a}:{min:a,max:n}}function applyMetaReportComparisonDateChange(e,t,{editable:a=!1,dateStr:n=null}={}){const r=parseComparisonDateKey(t.getAttribute("data-comparison-date")),o=n||t.value;if(!r||!o)return;const{side:s,bound:i,stateKey:l}=r;metaReportsState[l]||(metaReportsState[l]={startDate:null,endDate:null});const c=metaReportsState[l];if(c[`${i}Date`]=o,c.startDate&&c.endDate&&c.startDate>c.endDate){const d=c.startDate;c.startDate=c.endDate,c.endDate=d;const u=document.querySelector(`[data-comparison-date="${s}-start"]`),p=document.querySelector(`[data-comparison-date="${s}-end"]`);u?._metaComparisonDatePicker&&u._metaComparisonDatePicker.setDate(c.startDate,!1),p?._metaComparisonDatePicker&&p._metaComparisonDatePicker.setDate(c.endDate,!1)}metaReportsState.comparisonMode="custom",syncMetaReportComparisonPeriodPickerBounds(e),document.querySelectorAll("[data-comparison-preset]").forEach(d=>{const u=d.getAttribute("data-comparison-preset")==="custom";d.classList.toggle("active",u),d.setAttribute("aria-pressed",u)}),refreshMetaReportComparison(e,{editable:a})}function syncMetaReportComparisonPeriodPickerBounds(e){const t=metaReportComparisonDateInputBounds(e);["a","b"].forEach(a=>{const r=metaReportsState[a==="b"?"comparisonPeriodB":"comparisonPeriodA"]||{},o=document.querySelector(`[data-comparison-date="${a}-start"]`),s=document.querySelector(`[data-comparison-date="${a}-end"]`);if(o?._metaComparisonDatePicker){const{min:i,max:l}=metaReportComparisonSafePickerBounds(t.min||void 0,r.endDate||t.max||void 0);o._metaComparisonDatePicker.set("minDate",i),o._metaComparisonDatePicker.set("maxDate",l)}if(s?._metaComparisonDatePicker){const{min:i,max:l}=metaReportComparisonSafePickerBounds(r.startDate||t.min||void 0,t.max||void 0);s._metaComparisonDatePicker.set("minDate",i),s._metaComparisonDatePicker.set("maxDate",l)}})}function closeMetaReportComparisonDatePickers(e=null){(metaReportsState.comparisonDatePickers||[]).forEach(t=>{t!==e&&t.isOpen&&t.close()})}function destroyMetaReportComparisonDatePickers(){closeMetaReportComparisonDatePickers(),document.querySelectorAll("[data-comparison-date]").forEach(e=>{e._metaComparisonDatePicker&&(e._metaComparisonDatePicker.destroy(),e._metaComparisonDatePicker=null)}),metaReportsState.comparisonDatePickers=[]}function bindMetaReportComparisonDateInputs(e,{editable:t=!1}={}){if(destroyMetaReportComparisonDatePickers(),typeof flatpickr>"u")return;const a=metaReportComparisonDateInputBounds(e),{periodA:n,periodB:r}=metaReportComparisonPeriodsFromState(e);document.querySelectorAll("[data-comparison-date]").forEach(o=>{const s=parseComparisonDateKey(o.getAttribute("data-comparison-date"));if(!s)return;const{side:i,bound:l}=s,c=i==="b"?r:n,d=c?.[`${l}Date`]||o.value||"";let u=a.min||o.getAttribute("data-min")||void 0,p=a.max||o.getAttribute("data-max")||void 0;l==="start"&&c?.endDate&&(p=c.endDate),l==="end"&&c?.startDate&&(u=c.startDate),{min:u,max:p}=metaReportComparisonSafePickerBounds(u,p);const h=(b,f)=>{f&&(f.preventDefault(),f.stopPropagation()),closeMetaReportComparisonDatePickers(b),b.open()},m=flatpickr(o,{dateFormat:"Y-m-d",altInput:!0,altFormat:l==="end"?"j M Y":"j M",defaultDate:d||void 0,minDate:u,maxDate:p,disableMobile:!0,allowInput:!1,clickOpens:!0,animate:!0,static:!1,appendTo:document.body,className:"meta-report-flatpickr",onOpen:(b,f,v)=>{closeMetaReportComparisonDatePickers(v)},onChange:(b,f,v)=>{!f||v._metaComparisonApplying||applyMetaReportComparisonDateChange(e,v.input,{editable:t,dateStr:f})}});o._metaComparisonDatePicker=m,metaReportsState.comparisonDatePickers.push(m);const g=o.closest(".meta-report-comparison-custom-range-field");g&&(g.onclick=b=>h(m,b)),m.altInput&&(m.altInput.style.cursor="pointer",m.altInput.addEventListener("click",b=>h(m,b)))}),document.querySelectorAll(".meta-report-comparison-custom-range").forEach(o=>{o.onclick=s=>{if(s.target.closest(".meta-report-comparison-custom-range-field"))return;const i=o.querySelector('[data-comparison-range$="-start"]'),l=o.querySelector('[data-comparison-range$="-end"]'),c=i?.querySelector("[data-comparison-date]"),d=l?.querySelector("[data-comparison-date]"),u=c?._metaComparisonDatePicker,p=d?._metaComparisonDatePicker;if(!u&&!p)return;const h=o.getBoundingClientRect(),g=h.left+(h.width-18)/2,b=s.clientX<g?u:p;openPicker(b||u||p,s)}})}function metaReportComparisonYtdSpanLabel(e,t){const a=metaReportComparisonParseDate(e),n=metaReportComparisonParseDate(t);if(!a||!n)return"";const r=Number(a.slice(5,7)),o=Number(n.slice(5,7)),s=a.slice(0,4),i=n.slice(0,4);return s!==i?metaReportComparisonFormatDateRangeLabel(a,n):r===1&&o===12?"Full year":r===o?`Through ${META_MONTH_LABELS[r-1]}`:`${META_MONTH_LABELS[r-1]} \u2013 ${META_MONTH_LABELS[o-1]}`}function metaReportComparisonPresetPeriodDisplay(e,t){const a=metaReportComparisonNormalizePeriod(t);if(!a)return{value:"\u2014",hint:""};if(e==="mom"||e==="months"){const n=a.startMonthKey||a.endMonthKey,r=String(n||a.startDate).slice(0,4);return{value:`${metaMonthLabel(n)} ${r}`,hint:""}}if(e==="ytd"){const n=metaReportComparisonYtdSpanLabel(a.startDate,a.endDate);return{value:a.startDate.slice(0,4),hint:n&&n!=="Full year"?n:""}}return{value:metaReportComparisonFormatDateRangeLabel(a.startDate,a.endDate),hint:""}}function renderMetaReportComparisonDuelSide(e,t,a=!1){const n=t.hint?`<span class="meta-report-comparison-duel-hint">${esc(t.hint)}</span>`:"",r=a?" is-partial":"",o=a?' title="Partial data"':"";return`
    <div class="meta-report-comparison-duel-side is-${esc(e)}${r}"${o}>
      <span class="meta-report-comparison-duel-value">${esc(t.value)}</span>
      ${n}
    </div>
  `}function renderMetaReportComparisonSummaryBar(e,t,a=null){const n=a?.periodA?.partialData===!0,r=a?.periodB?.partialData===!0,o=metaReportComparisonPresetPeriodDisplay(metaReportsState.comparisonMode||"mom",e),s=metaReportComparisonPresetPeriodDisplay(metaReportsState.comparisonMode||"mom",t);return`
    <div class="meta-report-comparison-duel" id="meta-report-comparison-range-panel" role="group" aria-label="Compared periods">
      ${renderMetaReportComparisonDuelSide("a",o,n)}
      <div class="meta-report-comparison-duel-divider" aria-hidden="true">vs</div>
      ${renderMetaReportComparisonDuelSide("b",s,r)}
    </div>
  `}function renderMetaReportComparisonCustomDatesPanel(e,t,a){const n=metaReportComparisonDateInputBounds(a),r=e?.startDate||n.min||"",o=e?.endDate||r,s=t?.startDate||n.min||"",i=t?.endDate||s;return`
    <div class="meta-report-comparison-duel is-custom-dates" id="meta-report-comparison-range-panel" role="group" aria-label="Custom compared periods">
      ${renderMetaReportComparisonCustomRangeSide("a",r,o,n)}
      <div class="meta-report-comparison-duel-divider" aria-hidden="true">vs</div>
      ${renderMetaReportComparisonCustomRangeSide("b",s,i,n)}
    </div>
  `}function renderMetaReportComparisonPeriodControls(e,t,a,n=null){const r=metaReportsState.comparisonMode||"mom";return r==="custom"?renderMetaReportComparisonCustomDatesPanel(e,t,a):r==="months"?renderMetaReportComparisonMonthPickersPanel(e,t,a):renderMetaReportComparisonSummaryBar(e,t,n)}function renderMetaReportComparisonPeriodTiles(e,t,a,n=null){return renderMetaReportComparisonPeriodControls(e,t,a,n)}function renderMetaReportComparisonChangeCell(e,t,a=!0,n=!0){const r=metaReportComparisonDeltaTone(e,t);if(!a&&!n||!a||!n||e==null||!Number.isFinite(e))return'<span class="meta-report-comparison-change is-neutral">\u2014</span>';const o=e>0?"\u2191":e<0?"\u2193":"\u2014",s=metaReportFormatDeltaPct(e);return`<span class="meta-report-comparison-change is-${r}">${esc(o)} ${esc(s)}</span>`}function renderMetaReportComparisonGroupTable(e,t,a,n,{highlightLastN:r=0}={}){if(!n||n.insufficientData||n.samePeriod)return"";const o=n.periodA.label,s=n.periodB.label,i=n.periodA.hasData!==!1,l=n.periodB.hasData!==!1,c=t.map((d,u)=>{const p=n.periodA.metrics[d.metricId],h=n.periodB.metrics[d.metricId],m=i&&l?metaReportDeltaPct(p,h):null;return`
      <tr class="${r>0&&u>=t.length-r?`is-highlight accent-${a}`:""}">
        <th scope="row">${esc(d.label)}</th>
        <td class="meta-report-comparison-col-a">${esc(metaReportComparisonFmtValue(p,d.format,i))}</td>
        <td class="meta-report-comparison-col-b">${esc(metaReportComparisonFmtValue(h,d.format,l))}</td>
        <td class="meta-report-comparison-col-change">${renderMetaReportComparisonChangeCell(m,d.higherIsBetter,i,l)}</td>
      </tr>
    `}).join("");return`
    <section class="meta-report-group">
      <div class="meta-report-group-head">
        <span class="meta-report-group-bar meta-report-group-bar--${a}" aria-hidden="true"></span>
        <h3 class="meta-report-group-title">${esc(e)}</h3>
      </div>
      <div class="meta-report-group-table-wrap">
        <table class="meta-report-group-table meta-report-comparison-table">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col" class="meta-report-comparison-col-a">${esc(o)}</th>
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
  `}function renderMetaReportComparisonTables(e){return metaReportsState.comparisonLoading?renderMetaReportComparisonTableSkeleton():!e||e.insufficientData?'<p class="meta-report-comparison-empty">Select two periods with ad data to compare performance.</p>':e.samePeriod?'<p class="meta-report-comparison-warning">Both periods are the same. Choose different ranges to compare.</p>':`<div class="meta-report-groups-stack">${META_REPORT_COMPARISON_TABLE_GROUPS.filter(a=>!a.bottomlineOnly||e.hasBottomline).map(a=>renderMetaReportComparisonGroupTable(a.title,a.rows,a.accent,e,{highlightLastN:a.highlightLastN||0})).join("")}</div>`}const META_REPORT_COMPARISON_SUMMARY_LABELS={spend:"Ad spend",leads:"Leads",wonLeads:"Won leads",roasKr:"Return on ad spend",totalLeadValue:"Total lead value",poasKr:"Profit on ad spend"};function renderMetaReportComparisonSummarySkeleton(){return`
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
  `}function renderMetaReportComparisonSummaryBoxes(e){if(metaReportsState.comparisonLoading)return renderMetaReportComparisonSummarySkeleton();if(!e||e.insufficientData||e.samePeriod)return"";const t=e.periodA?.label||"Period A",a=e.periodB?.label||"Period B",n=e.periodA?.hasData!==!1,r=e.periodB?.hasData!==!1,s=(e.heroMetrics||[]).map(i=>{const l=META_REPORT_COMPARISON_SUMMARY_LABELS[i.id]||i.label||i.id,c=metaReportComparisonDeltaTone(i.deltaPct,i.higherIsBetter),d=esc(metaReportComparisonFmtValue(i.valueA,i.format,n));let u="\u2014";return n&&r&&i.deltaPct!=null&&Number.isFinite(i.deltaPct)&&(u=`${i.deltaPct>0?"\u2191":i.deltaPct<0?"\u2193":"\u2014"} ${esc(metaReportFormatDeltaPct(i.deltaPct))} vs ${esc(a)}`),`
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
  `}function renderMetaReportComparisonView(){const e=metaReportsState.clientPayload||metaReportsState.publicPayload,t=metaReportsState.comparisonResult||computeMetaReportComparison(e),{periodA:a,periodB:n}=metaReportComparisonPeriodsFromState(e),r=metaReportsState.comparisonTab||"table",o=metaReportsState.comparisonLoading;return`
    <section class="meta-report-comparison-view" id="meta-report-comparison-view">
      <div class="meta-report-comparison-controls">
        <div class="meta-report-comparison-presets" id="meta-report-comparison-presets">
          ${META_REPORT_COMPARISON_PRESETS.map(({id:s,label:i})=>{const l=metaReportComparisonPresetDisabled(s,e),c=l&&s==="mom"?"No previous month available":"";return`
              <button type="button" class="preset-btn${metaReportsState.comparisonMode===s?" active":""}${l?" is-disabled":""}" data-comparison-preset="${esc(s)}" aria-pressed="${metaReportsState.comparisonMode===s}"${l?" disabled":""}${c?` title="${esc(c)}"`:""}>${esc(i)}</button>
            `}).join("")}
        </div>
        <div class="meta-report-comparison-period-card">
          <div id="meta-report-comparison-range-wrap">
            ${renderMetaReportComparisonPeriodControls(a,n,e,t)}
          </div>
        </div>
      </div>
      <div class="meta-report-comparison-table-layout">
        <div class="meta-report-comparison-view-card meta-report-comparison-table-card${o?" is-loading":""}">
          <div class="meta-report-comparison-view-head">
            <div class="meta-report-comparison-tabs" role="tablist" aria-label="Comparison views">
              <button type="button" class="meta-report-chart-tab${r==="table"?" is-active":""}" data-comparison-tab="table" role="tab" aria-selected="${r==="table"}">Compare table</button>
              <button type="button" class="meta-report-chart-tab${r==="chart"?" is-active":""}" data-comparison-tab="chart" role="tab" aria-selected="${r==="chart"}">Show in chart</button>
            </div>
          </div>
          <div class="meta-report-comparison-tab-panel${r==="table"?" is-active":""}" data-comparison-panel="table" role="tabpanel"${r==="table"?"":" hidden"}>
            <div id="meta-report-comparison-table-wrap">${renderMetaReportComparisonTables(t)}</div>
          </div>
          <div class="meta-report-comparison-tab-panel${r==="chart"?" is-active":""}" data-comparison-panel="chart" role="tabpanel"${r==="chart"?"":" hidden"}>
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
        <div class="meta-report-comparison-view-card meta-report-comparison-summary-card${o?" is-loading":""}" id="meta-report-comparison-summary-card"${!o&&(!t||t.insufficientData||t.samePeriod)?" hidden":""}>
          <div id="meta-report-comparison-summary-wrap">${renderMetaReportComparisonSummaryBoxes(t)}</div>
        </div>
      </div>
    </section>
  `}function destroyMetaReportComparisonChart(){metaReportsState.comparisonChartInstance&&(metaReportsState.comparisonChartInstance.destroy(),metaReportsState.comparisonChartInstance=null)}function metaReportComparisonChartLabel(e,t){return t.find(a=>a.id===e)?.label||e}function buildMetaReportComparisonGroupedBarChart(e,t,a="kr"){const n=metaReportComparisonMetricDefs(t.hasBottomline),r=metaReportComparisonChartIds(t.hasBottomline,a),o=r.map(c=>metaReportComparisonChartLabel(c,n)),s=r.map(c=>metaReportParseAmount(t.periodA.metrics[c])),i=t.periodB.hasData!==!1,l=r.map(c=>i?metaReportParseAmount(t.periodB.metrics[c]):null);return new Chart(e,{type:"bar",data:{labels:o,datasets:[{label:t.periodA.label,data:s,backgroundColor:"rgba(255, 106, 0, 0.82)",borderColor:"#ff6a00",borderWidth:1,borderRadius:6,maxBarThickness:42},{label:t.periodB.label,data:l,backgroundColor:"rgba(148, 163, 184, 0.82)",borderColor:"#94a3b8",borderWidth:1,borderRadius:6,maxBarThickness:42}]},options:{responsive:!0,maintainAspectRatio:!1,layout:{padding:{left:8,right:12,top:0,bottom:0}},interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",labels:{boxWidth:12,font:{size:11}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,callbacks:{label(c){const d=c.parsed.y,u=r[c.dataIndex],p=n.find(h=>h.id===u);return`${c.dataset.label}: ${metaReportComparisonFmtValue(d,p?.format||"num")}`}}}},scales:{x:{grid:{display:!1},ticks:{color:"#6b5348",font:{size:11},maxRotation:45,minRotation:0}},y:{grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:c=>{const d=Number(c)||0;return Math.abs(d)>=1e6?`${(d/1e6).toFixed(1)}M`:Math.abs(d)>=1e3?`${Math.round(d/1e3)}K`:d}}}}}})}function metaReportComparisonYtdLineMetricId(e,t){return t==="x"?e?"poasX":"roasX":e?"poasKr":"totalLeadValue"}function buildMetaReportComparisonYtdLineChart(e,t,a="kr"){const n=t.ytdByMonth||[];if(!n.length)return null;const r=metaReportComparisonYtdLineMetricId(t.hasBottomline,a),s=metaReportComparisonMetricDefs(t.hasBottomline).find(u=>u.id===r),i=n.map(u=>u.label),l=n.map(u=>u.hasDataA&&u.periodA?metaReportParseAmount(u.periodA[r]):null),c=n.map(u=>u.hasDataB&&u.periodB?metaReportParseAmount(u.periodB[r]):null);return l.some(u=>u!=null)||c.some(u=>u!=null)?new Chart(e,{type:"line",data:{labels:i,datasets:[{label:t.periodA.label,data:l,borderColor:"#ff6a00",backgroundColor:"rgba(255, 106, 0, 0.08)",borderWidth:2,pointBackgroundColor:"#ff6a00",pointRadius:3,tension:.3,spanGaps:!1},{label:t.periodB.label,data:c,borderColor:"#94a3b8",backgroundColor:"rgba(148, 163, 184, 0.08)",borderWidth:2,pointBackgroundColor:"#94a3b8",pointRadius:3,tension:.3,spanGaps:!1}]},options:{responsive:!0,maintainAspectRatio:!1,layout:{padding:{left:8,right:12,top:0,bottom:0}},interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",labels:{boxWidth:12,font:{size:11}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,callbacks:{label(u){const p=u.parsed.y;return p==null?`${u.dataset.label}: \u2014`:`${u.dataset.label}: ${metaReportComparisonFmtValue(p,s?.format||"num")}`}}},title:{display:!0,text:s?.label||r,color:"#6b5348",font:{size:12,weight:"600"},padding:{bottom:8}}},scales:{x:{grid:{display:!1},ticks:{color:"#6b5348",font:{size:11}}},y:{grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:u=>{const p=Number(u)||0;return a==="x"?`${p.toFixed(2)}x`:Math.abs(p)>=1e6?`${(p/1e6).toFixed(1)}M`:Math.abs(p)>=1e3?`${Math.round(p/1e3)}K`:p}}}}}}):null}function buildMetaReportComparisonChart(e,t,a="kr"){const n=document.getElementById("meta-report-comparison-chart-empty");if(!t||t.insufficientData||t.samePeriod)return n&&(n.hidden=!1),null;let r=null;return t.mode==="ytd"?r=buildMetaReportComparisonYtdLineChart(e,t,a):r=buildMetaReportComparisonGroupedBarChart(e,t,a),n&&(n.hidden=!!r),r}function mountMetaReportComparisonChart(e){if(destroyMetaReportComparisonChart(),(metaReportsState.comparisonTab||"table")!=="chart")return;const t=document.getElementById("meta-report-comparison-chart");t&&(metaReportsState.comparisonChartInstance=buildMetaReportComparisonChart(t,e,metaReportsState.comparisonChartMode))}function setMetaReportComparisonTab(e){if(metaReportsState.comparisonTab=e==="chart"?"chart":"table",document.querySelectorAll("[data-comparison-tab]").forEach(t=>{const a=t.getAttribute("data-comparison-tab")===metaReportsState.comparisonTab;t.classList.toggle("is-active",a),t.setAttribute("aria-selected",a)}),document.querySelectorAll("[data-comparison-panel]").forEach(t=>{const a=t.getAttribute("data-comparison-panel")===metaReportsState.comparisonTab;t.classList.toggle("is-active",a),t.hidden=!a}),metaReportsState.comparisonTab==="chart"){const t=metaReportsState.clientPayload||metaReportsState.publicPayload;mountMetaReportComparisonChart(metaReportsState.comparisonResult||computeMetaReportComparison(t))}else destroyMetaReportComparisonChart()}function setMetaReportViewMode(e,t,{editable:a=!1}={}){if(metaReportsState.reportViewMode=e==="comparison"?"comparison":"monthly",document.querySelectorAll("[data-report-view-mode]").forEach(n=>{const r=n.getAttribute("data-report-view-mode")===metaReportsState.reportViewMode;n.classList.toggle("is-active",r),n.setAttribute("aria-selected",r)}),document.querySelectorAll("[data-report-view-panel]").forEach(n=>{const r=n.getAttribute("data-report-view-panel")===metaReportsState.reportViewMode;n.classList.toggle("is-active",r),n.hidden=!r}),metaReportsState.reportViewMode==="monthly")destroyMetaReportComparisonChart(),mountMetaReportTrendCharts(t,{editable:a,clientId:t?.clientId||null}),a&&syncMetaReportScenario(t);else if(destroyMetaReportTrendCharts(),t){const{series:n}=resolveMetaReportChartSeries(t);n.length&&(metaReportsState.chartSeries=n),bindMetaReportComparisonControls(t,{editable:a}),refreshMetaReportComparison(t,{editable:a}),a&&(bindMetaReportScenarioControls(t,{editable:!0}),syncMetaReportScenario(t))}}function bindMetaReportViewModeTabs(e,{editable:t=!1}={}){document.querySelectorAll("[data-report-view-mode]").forEach(a=>{a.onclick=()=>{const n=a.getAttribute("data-report-view-mode");!n||n===metaReportsState.reportViewMode||setMetaReportViewMode(n,e,{editable:t})}})}function syncMetaReportComparisonUi(e,{editable:t=!1}={}){const a=document.getElementById("meta-report-comparison-view");if(!a)return;const n=computeMetaReportComparison(e);metaReportsState.comparisonResult=n;const r=document.getElementById("meta-report-comparison-headline-wrap");r&&r.remove();const o=!!metaReportsState.comparisonLoading,s=a.querySelector(".meta-report-comparison-table-card"),i=document.getElementById("meta-report-comparison-summary-card");s&&s.classList.toggle("is-loading",o),i&&i.classList.toggle("is-loading",o);const l=document.getElementById("meta-report-comparison-table-wrap");l&&(l.innerHTML=renderMetaReportComparisonTables(n));const c=renderMetaReportComparisonSummaryBoxes(n),d=document.getElementById("meta-report-comparison-summary-wrap");d&&(d.innerHTML=c),i&&(i.hidden=!o&&!c);const u=document.getElementById("meta-report-comparison-chart-empty");u&&(u.hidden=!(n.insufficientData||n.samePeriod)),(metaReportsState.comparisonTab||"table")==="chart"&&mountMetaReportComparisonChart(n)}async function refreshMetaReportComparison(e,{editable:t=!1}={}){if(!e||!document.getElementById("meta-report-comparison-view"))return;const a=Date.now();metaReportsState.comparisonLoading=!0,syncMetaReportComparisonUi(e,{editable:t});try{await ensureMetaReportComparisonYears(e,{editable:t})}finally{const n=Date.now()-a;n<180&&await new Promise(r=>setTimeout(r,180-n)),metaReportsState.comparisonLoading=!1,syncMetaReportComparisonUi(e,{editable:t})}}function bindMetaReportComparisonControls(e,{editable:t=!1}={}){const a=()=>{document.querySelectorAll("[data-comparison-preset]").forEach(n=>{n.onclick=async()=>{if(n.disabled)return;const r=n.getAttribute("data-comparison-preset");if(!r)return;metaReportsState.comparisonMode=r,metaReportApplyComparisonPresetDefaults(e,r),metaReportsState.comparisonLoading=!0;const o=document.getElementById("meta-report-comparison-view");o&&(o.outerHTML=renderMetaReportComparisonView(),bindMetaReportComparisonControls(e,{editable:t})),await refreshMetaReportComparison(e,{editable:t})}})};document.querySelectorAll("[data-comparison-tab]").forEach(n=>{n.onclick=()=>{const r=n.getAttribute("data-comparison-tab");r&&setMetaReportComparisonTab(r)}}),document.querySelectorAll("#meta-report-comparison-chart-mode .meta-report-chart-toggle-btn").forEach(n=>{n.onclick=()=>{metaReportsState.comparisonChartMode=n.getAttribute("data-mode")||"kr",document.querySelectorAll("#meta-report-comparison-chart-mode .meta-report-chart-toggle-btn").forEach(r=>{r.classList.toggle("is-active",r===n)}),mountMetaReportComparisonChart(metaReportsState.comparisonResult||computeMetaReportComparison(e))}}),a(),bindMetaReportComparisonDateInputs(e,{editable:t}),bindMetaReportComparisonMonthInputs(e,{editable:t}),setMetaReportComparisonTab(metaReportsState.comparisonTab||"table")}function mountMetaReportComparison(e,{editable:t=!1}={}){document.getElementById("meta-report-comparison-view")&&(bindMetaReportComparisonControls(e,{editable:t}),refreshMetaReportComparison(e,{editable:t}))}function renderMetaReportScenarioCard(){return`
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
      <p class="meta-report-scenario-disclaimer">Projections use ad-active months only, exclude incomplete months, and apply diminishing returns when spend scales.</p>
    </section>
  `}function metaReportFormatDeltaPct(e){return e==null||!Number.isFinite(e)?"":`${e>0?"+":""}${e.toFixed(0)}%`}function metaReportScenarioDeltaTone(e=""){return String(e).startsWith("+")?"positive":String(e).startsWith("-")?"negative":"neutral"}function renderMetaReportScenarioOutcomeCard({label:e,projectedValue:t,projectedSub:a="",baselineValue:n="",delta:r=""}={}){const o=metaReportScenarioDeltaTone(r);return`
    <div class="meta-report-scenario-outcome-card ${o==="negative"?"is-negative":"is-positive"}">
      <div class="meta-report-scenario-outcome-label">${esc(e)}</div>
      <div class="meta-report-scenario-outcome-value">${esc(t)}</div>
      ${a?`<div class="meta-report-scenario-outcome-sub">${esc(a)}</div>`:""}
      ${r?`<div class="meta-report-scenario-outcome-delta is-${o}">${esc(r)}</div>`:""}
      ${n?`<div class="meta-report-scenario-outcome-baseline">Baseline ${esc(n)}</div>`:""}
    </div>
  `}function renderMetaReportScenarioDetailRow(e,t,a,n){const r=metaReportScenarioDeltaTone(n);return`
    <div class="meta-report-scenario-details-row">
      <span class="meta-report-scenario-label">${esc(e)}</span>
      <span class="meta-report-scenario-value">${esc(t)}</span>
      <span class="meta-report-scenario-value is-projected">${esc(a)}</span>
      <span class="meta-report-scenario-delta${r==="positive"?" is-positive":r==="negative"?" is-negative":""}">${esc(n||"\u2014")}</span>
    </div>
  `}function renderMetaReportScenarioMetrics(e){if(!e||e.insufficientData)return'<p class="meta-report-scenario-empty">Add months with ad spend and leads to model a budget scenario.</p>';const t=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.totalLeadValue,e.baseline.totalLeadValue)),a=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.roasKr,e.baseline.roasKr)),n=e.projectedConservative&&e.projectedOptimistic&&e.projectedConservative.totalLeadValue!==e.projectedOptimistic.totalLeadValue?`${metaFmtKr(e.projectedConservative.totalLeadValue)} \u2013 ${metaFmtKr(e.projectedOptimistic.totalLeadValue)}`:"",r=[renderMetaReportScenarioOutcomeCard({label:"Projected revenue",projectedValue:metaFmtKr(e.projected.totalLeadValue),projectedSub:n,baselineValue:metaFmtKr(e.baseline.totalLeadValue),delta:t}),renderMetaReportScenarioOutcomeCard({label:"Projected ROAS",projectedValue:metaFmtKr(e.projected.roasKr),projectedSub:metaFmtX(e.projected.roasX),baselineValue:`${metaFmtKr(e.baseline.roasKr)} \xB7 ${metaFmtX(e.baseline.roasX)}`,delta:a})];if(e.hasBottomline){const s=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.poasKr,e.baseline.poasKr));r.push(renderMetaReportScenarioOutcomeCard({label:"Projected profit",projectedValue:metaFmtKr(e.projected.poasKr),projectedSub:metaFmtX(e.projected.poasX),baselineValue:`${metaFmtKr(e.baseline.poasKr)} \xB7 ${metaFmtX(e.baseline.poasX)}`,delta:s}))}else{const s=metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.wonLeads,e.baseline.wonLeads));r.push(renderMetaReportScenarioOutcomeCard({label:"Projected won leads",projectedValue:metaFmtNum(e.projected.wonLeads),baselineValue:metaFmtNum(e.baseline.wonLeads),delta:s}))}const o=[renderMetaReportScenarioDetailRow("Ad spend",metaFmtKr(e.baseline.spend),metaFmtKr(e.projected.spend),metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.spend,e.baseline.spend))),renderMetaReportScenarioDetailRow("Leads",metaFmtNum(e.baseline.leads),metaFmtNum(e.projected.leads),metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.leads,e.baseline.leads)))];return e.hasBottomline&&o.push(renderMetaReportScenarioDetailRow("Won leads",metaFmtNum(e.baseline.wonLeads),metaFmtNum(e.projected.wonLeads),metaReportFormatDeltaPct(metaReportDeltaPct(e.projected.wonLeads,e.baseline.wonLeads)))),`
    <div class="meta-report-scenario-outcomes">
      ${r.join("")}
    </div>
    <div class="meta-report-scenario-details">
      <div class="meta-report-scenario-details-head">Investment & funnel</div>
      ${o.join("")}
    </div>
  `}function destroyMetaReportTrendCharts(){["roas","poas"].forEach(e=>{metaReportsState.chartInstances[e]&&(metaReportsState.chartInstances[e].destroy(),metaReportsState.chartInstances[e]=null),metaReportsState.chartScatterInstances[e]&&(metaReportsState.chartScatterInstances[e].destroy(),metaReportsState.chartScatterInstances[e]=null)})}function destroyMetaReportCharts(){destroyMetaReportTrendCharts(),destroyMetaReportScenarioCharts(),destroyMetaReportComparisonChart()}function destroyMetaReportScenarioCharts(){["roas","poas"].forEach(e=>{metaReportsState.scenarioChartInstances[e]&&(metaReportsState.scenarioChartInstances[e].destroy(),metaReportsState.scenarioChartInstances[e]=null)})}function metaReportChartValue(e,t,a,n){const r=t==="x"?e[n]:e[a];return Number(r)||0}function metaReportChartTooltipLabel(e,t){return t==="x"?metaFmtX(e):metaFmtKr(e)}function metaReportChartAxisTick(e,t){if(t==="x")return`${Number(e).toFixed(1)}x`;const a=Number(e)||0;return Math.abs(a)>=1e6?`${(a/1e6).toFixed(1)}M`:Math.abs(a)>=1e3?`${Math.round(a/1e3)}K`:a}function buildMetaReportLineChart(e,t,a,n,r){const o=t.map(i=>i.label),s=t.map(i=>metaReportChartValue(i,a,n,r));return new Chart(e,{type:"line",data:{labels:o,datasets:[{label:a==="x"?"Multiplier":"Dkr",data:s,borderColor:"#ff6a00",backgroundColor:"rgba(255, 106, 0, 0.12)",borderWidth:2.5,pointBackgroundColor:"#ff6a00",pointBorderColor:"#ffffff",pointBorderWidth:2,pointRadius:4,pointHoverRadius:5,fill:!0,tension:.3}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!1},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,callbacks:{label(i){return metaReportChartTooltipLabel(i.parsed.y,a)}}}},scales:{x:{grid:{color:"rgba(26, 18, 8, 0.06)"},ticks:{color:"#6b5348",font:{size:11}}},y:{grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:i=>metaReportChartAxisTick(i,a)}}}}})}function buildMetaReportDualMetricChart(e,{series:t,mode:a,krKey:n,xKey:r,returnLabel:o,chartType:s="area",projection:i=null,projectionLabel:l="Projected",showProjection:c=!1,baselineSpend:d=null}={}){const u=t.filter(C=>metaReportParseAmount(C.spend)>0),p=u.map(C=>C.label),h=metaReportParseAmount(d??i?.baselineSpend??0)||resolveMetaReportSpendChartBaseline(u,i),m=a==="x"&&h>0,g=u.map(C=>m?metaReportSpendMultiplierValue(C.spend,h):metaReportParseAmount(C.spend)),b=u.map(C=>metaReportChartValue(C,a,n,r)),f=normalizeMetaReportSpendChartType(s),v=a==="x",y=u.length-1;c&&i&&!i.insufficientData&&(p.push(l||`Projected (${Number(i.multiplier).toFixed(1)}\xD7)`),g.push(metaReportParseAmount(m?i.multiplier:i.projected.spend)),b.push(metaReportParseAmount(i.projected[a==="x"?r:n])));const $=p.length-1,w=c&&i&&!i.insufficientData&&$>y;function S(C,M){const E=w&&C===$;return{pointBackgroundColor:M,pointBorderColor:"#ffffff",pointBorderWidth:2,pointRadius:E?7:f==="scatter"?5:4,pointHoverRadius:E?8:f==="scatter"?6:5,pointStyle:E?"rectRot":"circle"}}function L(C,M,E,I,D){const R=M.map((k,F)=>S(F,E)),A={label:C,data:M,borderColor:E,yAxisID:D};return f==="bar"?{...A,type:"bar",backgroundColor:E==="#138b53"?"rgba(19, 139, 83, 0.72)":"rgba(255, 106, 0, 0.72)",borderRadius:4,borderWidth:0}:f==="scatter"?{...A,type:"line",backgroundColor:"transparent",borderWidth:0,showLine:!1,fill:!1,pointBackgroundColor:R.map(k=>k.pointBackgroundColor),pointBorderColor:R.map(k=>k.pointBorderColor),pointBorderWidth:R.map(k=>k.pointBorderWidth),pointRadius:R.map(k=>k.pointRadius),pointHoverRadius:R.map(k=>k.pointHoverRadius),pointStyle:R.map(k=>k.pointStyle)}:{...A,type:"line",backgroundColor:I,borderWidth:2.5,fill:f==="area",tension:.3,pointBackgroundColor:R.map(k=>k.pointBackgroundColor),pointBorderColor:R.map(k=>k.pointBorderColor),pointBorderWidth:R.map(k=>k.pointBorderWidth),pointRadius:R.map(k=>k.pointRadius),pointHoverRadius:R.map(k=>k.pointHoverRadius),pointStyle:R.map(k=>k.pointStyle)}}const B=[L("Ad spend",g,"#138b53","rgba(19, 139, 83, 0.16)","ySpend"),L(o,b,"#ff6a00","rgba(255, 106, 0, 0.12)",v?"yReturn":"ySpend")];if(w&&f!=="bar"){const C={type:"line",borderWidth:2,fill:!1,tension:0,pointRadius:0,pointHoverRadius:0,spanGaps:!0};B.push({...C,label:"",data:p.map((M,E)=>E===y||E===$?g[E]:null),borderColor:"rgba(19, 139, 83, 0.55)",borderDash:[5,4],yAxisID:"ySpend"}),B.push({...C,label:"",data:p.map((M,E)=>E===y||E===$?b[E]:null),borderColor:"rgba(255, 106, 0, 0.55)",borderDash:[5,4],yAxisID:v?"yReturn":"ySpend"})}const P={x:{grid:{color:"rgba(26, 18, 8, 0.06)"},ticks:{color:"#6b5348",font:{size:11},maxRotation:45,minRotation:0}},ySpend:{type:"linear",position:"left",title:{display:!0,text:m?"Ad spend (\xD7)":v?"Ad spend (Dkr)":"Dkr",color:v?"#138b53":"#6b5348",font:{size:11,weight:"600"}},grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:v?"#138b53":"#6b5348",font:{size:11},callback:C=>m?metaReportChartAxisTick(C,"x"):metaReportSpendAxisTick(C)}}};return v&&(P.yReturn={type:"linear",position:"right",title:{display:!0,text:"Multiplier",color:"#ff6a00",font:{size:11,weight:"600"}},grid:{drawOnChartArea:!1},ticks:{color:"#ff6a00",font:{size:11},callback:C=>metaReportChartAxisTick(C,"x")}}),new Chart(e,{type:f==="bar"?"bar":"line",data:{labels:p,datasets:B},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",align:"end",labels:{boxWidth:10,boxHeight:10,font:{size:11,weight:"600"},color:"#6b5348",filter(C){return!!C.text}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,filter(C){return!!C.dataset.label},callbacks:{label(C){const M=C.dataset.label||"";return C.dataset.yAxisID==="yReturn"?`${M}: ${metaReportChartTooltipLabel(C.parsed.y,"x")}`:m&&C.dataset.yAxisID==="ySpend"?`${M}: ${metaReportChartTooltipLabel(C.parsed.y,"x")}`:C.datasetIndex===1&&!v?`${M}: ${metaReportChartTooltipLabel(C.parsed.y,a)}`:`${M}: ${metaFmtKr(C.parsed.y)}`}}}},scales:P}})}function buildMetaReportScenarioExtrapolationChart(e,{series:t,mode:a,kind:n,projection:r,chartType:o="area",hasBottomline:s=!1}={}){const i=n==="roas"?"roasKr":"poasKr",l=n==="roas"?"roasX":"poasX",c=n==="roas"?"ROAS":"POAS",d=resolveMetaReportScenarioChartSeries(n==="poas"?t.filter(M=>M.poasKr!=null&&M.poasX!=null):t),u=resolveMetaReportSpendChartBaseline(d,r),p=a==="x"&&u>0,h=buildMetaReportScenarioProjectionSteps(r,{hasBottomline:s,targetMultiplier:metaReportsState.budgetMultiplier}),m=normalizeMetaReportSpendChartType(o),g=d.map(M=>M.label),b=d.map(M=>p?metaReportSpendMultiplierValue(M.spend,u):metaReportParseAmount(M.spend)),f=d.map(M=>metaReportChartValue(M,a,i,l)),v=d.length-1,y=g.length;for(const M of h)g.push(M.label),b.push(p?metaReportSpendMultiplierValue(M.spend,u):M.spend),f.push(metaReportParseAmount(M[a==="x"?l:i]));const $=new Set(h.map((M,E)=>y+E)),w=h.length>0;function S(M,E){const I=$.has(M);return{pointBackgroundColor:E,pointBorderColor:"#ffffff",pointBorderWidth:2,pointRadius:I?7:m==="scatter"?5:4,pointHoverRadius:I?8:m==="scatter"?6:5,pointStyle:I?"rectRot":"circle"}}function L(M,E,I,D){const R=E.map((k,F)=>S(F,I)),A={label:M,data:E,borderColor:I,yAxisID:"y"};return m==="bar"?{...A,type:"bar",backgroundColor:I==="#138b53"?"rgba(19, 139, 83, 0.72)":"rgba(255, 106, 0, 0.72)",borderRadius:4,borderWidth:0}:m==="scatter"?{...A,type:"line",backgroundColor:"transparent",borderWidth:0,showLine:!1,fill:!1,pointBackgroundColor:R.map(k=>k.pointBackgroundColor),pointBorderColor:R.map(k=>k.pointBorderColor),pointBorderWidth:R.map(k=>k.pointBorderWidth),pointRadius:R.map(k=>k.pointRadius),pointHoverRadius:R.map(k=>k.pointHoverRadius),pointStyle:R.map(k=>k.pointStyle)}:{...A,type:"line",backgroundColor:D,borderWidth:2.5,fill:m==="area",tension:.3,pointBackgroundColor:R.map(k=>k.pointBackgroundColor),pointBorderColor:R.map(k=>k.pointBorderColor),pointBorderWidth:R.map(k=>k.pointBorderWidth),pointRadius:R.map(k=>k.pointRadius),pointHoverRadius:R.map(k=>k.pointHoverRadius),pointStyle:R.map(k=>k.pointStyle)}}const B=[L("Ad spend",b,"#138b53","rgba(19, 139, 83, 0.16)"),L(c,f,"#ff6a00","rgba(255, 106, 0, 0.12)")];if(w&&m!=="bar"){const M={type:"line",borderWidth:2,fill:!1,tension:0,pointRadius:0,pointHoverRadius:0,spanGaps:!0,yAxisID:"y"},E=I=>g.map((D,R)=>R===v||$.has(R)?I[R]:null);B.push({...M,label:"",data:E(b),borderColor:"rgba(19, 139, 83, 0.55)",borderDash:[5,4]}),B.push({...M,label:"",data:E(f),borderColor:"rgba(255, 106, 0, 0.55)",borderDash:[5,4]})}const P=p?"Multiplier (\xD7)":"Dkr",C=M=>p?metaReportChartAxisTick(M,"x"):metaReportChartAxisTick(M,"kr");return new Chart(e,{type:m==="bar"?"bar":"line",data:{labels:g,datasets:B},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",align:"end",labels:{boxWidth:10,boxHeight:10,font:{size:11,weight:"600"},color:"#6b5348",filter(M){return!!M.text}}},tooltip:{backgroundColor:"#ffffff",borderColor:"#e8e0d8",borderWidth:1,titleColor:"#1a1208",bodyColor:"#1a1208",padding:10,filter(M){return!!M.dataset.label},callbacks:{label(M){return`${M.dataset.label||""}: ${metaReportChartTooltipLabel(M.parsed.y,a)}`}}}},scales:{x:{grid:{color:"rgba(26, 18, 8, 0.06)"},ticks:{color:"#6b5348",font:{size:11},maxRotation:45,minRotation:0}},y:{type:"linear",position:"left",title:{display:!0,text:P,color:"#6b5348",font:{size:11,weight:"600"}},grid:{color:"rgba(26, 18, 8, 0.08)"},ticks:{color:"#6b5348",font:{size:11},callback:C}}}}})}function updateMetaReportChart(e,t,a){const n=document.getElementById(`meta-report-chart-${e}`),r=document.getElementById(`meta-report-chart-${e}-empty`);if(!n||!r)return;const o=e==="roas"?"roasKr":"poasKr",s=e==="roas"?"roasX":"poasX",i=e==="poas"?t.filter(l=>l.poasKr!=null&&l.poasX!=null):t;if(metaReportsState.chartInstances[e]&&(metaReportsState.chartInstances[e].destroy(),metaReportsState.chartInstances[e]=null),i.length<META_REPORT_CHART_MIN_POINTS||typeof Chart>"u"){n.hidden=!0,r.hidden=!1;return}n.hidden=!1,r.hidden=!0,metaReportsState.chartInstances[e]=buildMetaReportLineChart(n,i,a,o,s)}function updateMetaReportSpendReturnChart(e,t,a,{projection:n=null,showProjection:r=!1,projectionLabel:o="Projected",chartType:s=metaReportsState.spendChartType,target:i="spend"}={}){const l=i==="scenario"?`meta-report-scenario-chart-${e}`:`meta-report-chart-scatter-${e}`,c=i==="scenario"?`meta-report-scenario-chart-${e}-empty`:`meta-report-chart-scatter-${e}-empty`,d=document.getElementById(l),u=document.getElementById(c);if(!d||!u)return;const p=e==="roas"?"roasKr":"poasKr",h=e==="roas"?"roasX":"poasX",m=e==="poas"?t.filter(f=>f.poasKr!=null&&f.poasX!=null):t.filter(f=>metaReportParseAmount(f.spend)>0),g=i==="scenario"?"scenarioChartInstances":"chartScatterInstances";if(metaReportsState[g][e]&&(metaReportsState[g][e].destroy(),metaReportsState[g][e]=null),m.length<META_REPORT_CHART_MIN_POINTS||typeof Chart>"u"){d.hidden=!0,u.hidden=!1;return}if(r&&n?.insufficientData){d.hidden=!0,u.hidden=!1;return}d.hidden=!1,u.hidden=!0;const b=a==="x"?resolveMetaReportSpendChartBaseline(m,n):null;metaReportsState[g][e]=buildMetaReportDualMetricChart(d,{series:m,mode:a,krKey:p,xKey:h,returnLabel:e==="roas"?"ROAS":"POAS",chartType:s,projection:n,projectionLabel:o,showProjection:r,baselineSpend:b})}function updateMetaReportScatterChart(e,t,a){updateMetaReportSpendReturnChart(e,t,a,{showProjection:!1,chartType:metaReportsState.spendChartType,target:"spend"})}function updateMetaReportScenarioChart(e,t,a,n){const r=document.getElementById(`meta-report-scenario-chart-${e}`),o=document.getElementById(`meta-report-scenario-chart-${e}-empty`);if(!r||!o)return;const s=e==="poas"?t.filter(l=>l.poasKr!=null&&l.poasX!=null):t.filter(l=>metaReportParseAmount(l.spend)>0),i=resolveMetaReportScenarioChartSeries(s);if(metaReportsState.scenarioChartInstances[e]&&(metaReportsState.scenarioChartInstances[e].destroy(),metaReportsState.scenarioChartInstances[e]=null),i.length<META_REPORT_CHART_MIN_POINTS||typeof Chart>"u"||a?.insufficientData){r.hidden=!0,o.hidden=!1;return}r.hidden=!1,o.hidden=!0,metaReportsState.scenarioChartInstances[e]=buildMetaReportScenarioExtrapolationChart(r,{series:s,mode:n,kind:e,projection:a,chartType:metaReportsState.spendChartType,hasBottomline:e==="poas"})}function mountMetaReportScenarioCharts(e){const t=resolveMetaReportScenarioPayload(e),a=resolveMetaReportScenarioSeries(e),n=payloadHasMetaReportBottomline(t),r=document.getElementById("meta-report-scenario-poas-wrap");r&&(r.hidden=!n);const o=metaReportsState.chartProjection;updateMetaReportScenarioChart("roas",a,o,metaReportsState.chartScenarioRoasMode),n?updateMetaReportScenarioChart("poas",a,o,metaReportsState.chartScenarioPoasMode):metaReportsState.scenarioChartInstances.poas&&(metaReportsState.scenarioChartInstances.poas.destroy(),metaReportsState.scenarioChartInstances.poas=null)}function syncMetaReportSpendChartTypeToolbar(e=metaReportsState.chartTab||"trend"){const t=document.getElementById("meta-report-spend-chart-type-wrap");t&&(t.hidden=e!=="spend")}function setMetaReportChartTab(e){metaReportsState.chartTab=e,document.querySelectorAll("[data-meta-chart-tab]").forEach(t=>{const a=t.getAttribute("data-meta-chart-tab")===e;t.classList.toggle("is-active",a),t.setAttribute("aria-selected",a?"true":"false")}),document.querySelectorAll("[data-meta-chart-panel]").forEach(t=>{const a=t.getAttribute("data-meta-chart-panel")===e;t.classList.toggle("is-active",a),t.hidden=!a}),syncMetaReportSpendChartTypeToolbar(e),mountActiveMetaReportCharts()}function mountActiveMetaReportCharts(){const e=metaReportsState.chartSeries||[];metaReportsState.chartTab==="spend"?(updateMetaReportScatterChart("roas",e,metaReportsState.chartScatterRoasMode),updateMetaReportScatterChart("poas",e,metaReportsState.chartScatterPoasMode)):(updateMetaReportChart("roas",e,metaReportsState.chartRoasMode),updateMetaReportChart("poas",e,metaReportsState.chartPoasMode))}function refreshMetaReportSpendAndScenarioCharts(e){mountActiveMetaReportCharts(),document.getElementById("meta-report-scenario-card")&&e?syncMetaReportScenario(e):mountMetaReportScenarioCharts(e)}function setMetaReportSpendChartType(e,{persist:t=!1,clientId:a=null,payload:n=null}={}){const r=normalizeMetaReportSpendChartType(e);metaReportsState.spendChartType=r,document.querySelectorAll("[data-spend-chart-type]").forEach(s=>{s.classList.toggle("is-active",s.getAttribute("data-spend-chart-type")===r)});const o=n||metaReportsState.clientPayload||metaReportsState.publicPayload;return refreshMetaReportSpendAndScenarioCharts(o),t&&a?patchMetaReportSettings(a,{metaReportSpendChartType:r}):Promise.resolve(null)}function bindMetaReportChartTabs(){document.querySelectorAll("[data-meta-chart-tab]").forEach(e=>{e.onclick=()=>{setMetaReportChartTab(e.getAttribute("data-meta-chart-tab"))}})}function bindMetaReportChartToggles(){const e=document.getElementById("meta-chart-roas-mode");e&&e.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartRoasMode=i,e.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportChart("roas",metaReportsState.chartSeries||[],i)}});const t=document.getElementById("meta-chart-poas-mode");t&&t.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartPoasMode=i,t.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportChart("poas",metaReportsState.chartSeries||[],i)}});const a=document.getElementById("meta-chart-scatter-roas-mode");a&&a.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScatterRoasMode=i,a.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScatterChart("roas",metaReportsState.chartSeries||[],i)}});const n=document.getElementById("meta-chart-scatter-poas-mode");n&&n.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScatterPoasMode=i,n.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScatterChart("poas",metaReportsState.chartSeries||[],i)}});const r=document.getElementById("meta-scenario-roas-mode");r&&r.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScenarioRoasMode=i,r.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScenarioChart("roas",metaReportsState.chartSeries||[],metaReportsState.chartProjection,i)}});const o=document.getElementById("meta-scenario-poas-mode");o&&o.querySelectorAll("[data-mode]").forEach(s=>{s.onclick=()=>{const i=s.getAttribute("data-mode");metaReportsState.chartScenarioPoasMode=i,o.querySelectorAll("[data-mode]").forEach(l=>{l.classList.toggle("is-active",l.getAttribute("data-mode")===i)}),updateMetaReportScenarioChart("poas",metaReportsState.chartSeries||[],metaReportsState.chartProjection,i)}})}function bindMetaReportSpendChartTypePicker(e,t){document.querySelectorAll("#meta-report-spend-chart-type-wrap [data-spend-chart-type]").forEach(a=>{a.onclick=async()=>{const n=a.getAttribute("data-spend-chart-type");if(!(!n||n===metaReportsState.spendChartType)&&(setMetaReportSpendChartType(n,{payload:t}),!!e))try{const r=await patchMetaReportSettings(e,{metaReportSpendChartType:normalizeMetaReportSpendChartType(n)});r?.settings&&t&&(t.settings={...t.settings,...r.settings},metaReportsState.clientPayload?.clientId===t.clientId&&(metaReportsState.clientPayload.settings=t.settings))}catch(r){showToast(r.message||"Could not save chart type default","error")}}})}function syncMetaReportChartToggleUi(){[["roas",metaReportsState.chartRoasMode,"meta-chart-roas-mode"],["poas",metaReportsState.chartPoasMode,"meta-chart-poas-mode"],["scatter-roas",metaReportsState.chartScatterRoasMode,"meta-chart-scatter-roas-mode"],["scatter-poas",metaReportsState.chartScatterPoasMode,"meta-chart-scatter-poas-mode"],["scenario-roas",metaReportsState.chartScenarioRoasMode,"meta-scenario-roas-mode"],["scenario-poas",metaReportsState.chartScenarioPoasMode,"meta-scenario-poas-mode"]].forEach(([,e,t])=>{const a=document.getElementById(t);a&&a.querySelectorAll("[data-mode]").forEach(n=>{n.classList.toggle("is-active",n.getAttribute("data-mode")===e)})})}function scheduleMetaReportScenarioSettingsPersist(e){e&&(clearTimeout(metaReportsState._scenarioSettingsTimer),metaReportsState._scenarioSettingsTimer=setTimeout(()=>{patchMetaReportSettings(e,{metaReportBudgetMultiplier:metaReportsState.budgetMultiplier,metaReportBudgetBaseline:metaReportsState.budgetBaseline,metaReportScenarioMonthWindow:metaReportsState.scenarioMonthWindow,metaReportScenarioSmoothUneven:metaReportsState.scenarioSmoothUneven,metaReportScenarioBlendHistory:metaReportsState.scenarioBlendHistory,metaReportScenarioIncludeTrend:metaReportsState.scenarioIncludeTrend},{fast:!0}).catch(()=>{})},350))}function bindMetaReportScenarioControls(e,{editable:t=!1}={}){if(!t)return;const a=e?.clientId||null,n=document.getElementById("meta-report-budget-multiplier"),r=document.getElementById("meta-report-budget-multiplier-value"),o=document.getElementById("meta-report-budget-baseline"),s=document.getElementById("meta-report-scenario-month-window"),i=()=>scheduleMetaReportScenarioSettingsPersist(a),l=()=>syncMetaReportScenario(e);n&&(n.oninput=()=>{metaReportsState.budgetMultiplier=normalizeMetaReportBudgetMultiplier(n.value),r&&(r.textContent=`${metaReportsState.budgetMultiplier.toFixed(1)}\xD7`),l(),i()}),o&&(o.onchange=()=>{metaReportsState.budgetBaseline=normalizeMetaReportBudgetBaseline(o.value),l(),i()}),s&&(s.onchange=()=>{metaReportsState.scenarioMonthWindow=normalizeMetaReportScenarioMonthWindow(s.value),l(),i()});const c=()=>{document.querySelectorAll("[data-scenario-pill]").forEach(d=>{d.onclick=()=>{const u=d.getAttribute("data-scenario-pill");if(!u||d.disabled)return;metaReportsState[u]=!metaReportsState[u],applyMetaReportScenarioPillsToState(getMetaReportScenarioPillsFromState());const p=document.getElementById("meta-report-scenario-pills-wrap");p&&(p.outerHTML=renderMetaReportScenarioModelPills(),c()),l(),i()}})};c()}function syncMetaReportScenario(e){const t=resolveMetaReportScenarioPayload(e),a=resolveMetaReportScenarioSeries(e),n=buildMetaReportScenarioProjection(a,e);if(metaReportsState.chartProjection=n,syncMetaReportBaselineUi(a,n,t),!document.getElementById("meta-report-scenario-card"))return;const o=document.getElementById("meta-report-scenario-context-wrap");o&&(o.innerHTML=renderMetaReportScenarioContextStrip(n));const s=document.getElementById("meta-report-scenario-grid");s&&(s.innerHTML=renderMetaReportScenarioMetrics(n)),mountMetaReportScenarioCharts(e)}function mountMetaReportTrendCharts(e,{editable:t=!1,clientId:a=null}={}){const n=document.getElementById("meta-report-charts-panel");if(!e||!n)return;hydrateMetaReportSpendChartType(e),hydrateMetaReportScenarioSettings(e);const{series:r,demo:o}=resolveMetaReportChartSeries(e);metaReportsState.chartSeries=r,metaReportsState.chartDemo=o,updateMetaReportScenarioSource(e);const s=document.getElementById("meta-report-chart-demo-badge");s&&(s.hidden=!(o&&t)),bindMetaReportChartTabs(),bindMetaReportChartToggles(),t&&(bindMetaReportScenarioControls(e,{editable:!0}),bindMetaReportSpendChartTypePicker(a,e)),syncMetaReportChartToggleUi(),syncMetaReportSpendChartTypeToolbar(metaReportsState.chartTab||"trend"),document.querySelectorAll("[data-spend-chart-type]").forEach(i=>{i.classList.toggle("is-active",i.getAttribute("data-spend-chart-type")===metaReportsState.spendChartType)}),setMetaReportChartTab(metaReportsState.chartTab||"trend"),t&&syncMetaReportScenario(e)}function mountMetaReportCharts(e,{editable:t=!1,clientId:a=null}={}){if(destroyMetaReportCharts(),destroyMetaReportComparisonChart(),!e)return;const n=metaReportsState.reportViewMode||"monthly";if(bindMetaReportViewModeTabs(e,{editable:t}),n==="monthly"){mountMetaReportTrendCharts(e,{editable:t,clientId:a});return}if(mountMetaReportComparison(e,{editable:t}),t){const{series:r}=resolveMetaReportChartSeries(e);r.length&&(metaReportsState.chartSeries=r),bindMetaReportScenarioControls(e,{editable:!0}),syncMetaReportScenario(e)}}function syncMetaReportMonthPanelDom(e,t={},a=null){const n=a||metaReportsState.clientPayload||metaReportsState.publicPayload,r=metaReportsState.activeMonthKey,o=resolveMetaReportActiveMonthPayload(n)||e,s=document.getElementById("meta-report-month-panel");s&&(s.innerHTML=renderMetaReportMonthBody(o,{...t,yearPayload:t.yearPayload||n,activeMonthKey:r||o?.monthKey||null}),requestAnimationFrame(()=>{mountMetaReportCharts(n,{editable:!!t.editable,clientId:n?.clientId||null})}))}function renderMetaReportEmptyMonthCard({editable:e=!1,synced:t=!1}={}){return t?`
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
  `}function renderMetaReportMonthTables(e,{editable:t=!1}={}){if(!e)return'<div class="meta-report-empty">No data for this month yet.</div>';if(e.meta?.emptyMonth)return renderMetaReportEmptyMonthCard({editable:t,synced:!!e.metaFetchedAt});const a=[["Total spend",metaFmtKr(e.meta?.spend),""],["Cost Pr Mile (CPM)",metaFmtKr(e.meta?.cpm),""],["Impressions",metaFmtNum(e.meta?.impressions),""],["Reach",metaFmtNum(e.meta?.reach),""],["Click",metaFmtNum(e.meta?.clicks),""],["CTR",metaFmtNum(e.meta?.conversionRatePercent,2),"%"]],n=[["Leads",metaFmtNum(e.topline?.leads),""],["Cost Per Lead (CPL)",metaFmtKr(e.topline?.cpl),""],["Won leads",metaFmtNum(e.topline?.wonLeads),""],["Total Lead Value",metaFmtKr(e.topline?.totalLeadValue),""],["Average Lead Value",metaFmtKr(e.topline?.avgLeadValue),""],["Client acquisition cost (CAC)",metaFmtKr(e.topline?.cac),""],["Return on Ads Spend (ROAS)",metaFmtKr(e.topline?.roasKr),""],["Return on Ads Spend % (ROAS)",metaFmtX(e.topline?.roasX),""]];let r="";if(r+=renderMetaReportMetricTable("Meta ads",a,"meta"),r+=renderMetaReportMetricTable("Topline KPI'er",n,"topline",{highlightLastN:2}),e.bottomline){const o=[["Leads",metaFmtNum(e.bottomline.leads),""],["Won leads",metaFmtNum(e.bottomline.wonLeads),""],["Total Lead Value",metaFmtKr(e.bottomline.totalLeadValue),""],["Average Lead Value",metaFmtKr(e.bottomline.avgLeadValue),""],["Client acquisition cost (CAC)",metaFmtKr(e.bottomline.cac),""],["Avg Total Profit",metaFmtKr(e.bottomline.totalProfit),""],["Avg Single Profit Order",metaFmtKr(e.bottomline.avgProfitPerWon),""],["Profit on Ads Spend (POAS)",metaFmtKr(e.bottomline.poasKr),""],["Profit on Ads Spend % (POAS)",metaFmtX(e.bottomline.poasX),""]];if(e.bottomline.feeMode){const s=e.bottomline.feeLabel||(e.bottomline.feeMode==="marketing"?"Censio marketing fee":`Censio performance fee (${metaFmtNum(e.bottomline.feePercent,0)}%)`);o.push([s,metaFmtKr(e.bottomline.censioFee),""]),o.push(["Profit on Investment (POI)",metaFmtKr(e.bottomline.poiKr),""]),o.push(["Profit on Investment % (POI)",metaFmtX(e.bottomline.poiX),""])}r+=renderMetaReportMetricTable("Bottomline KPI'er",o,"bottomline",{highlightLastN:2})}return r?`
    <div class="meta-report-tables-card">
      <div class="meta-report-tables-card-label">Details</div>
      <div class="meta-report-groups-stack">${r}</div>
    </div>
  `:""}function renderMetaReportMonthBody(e,{editable:t=!1,yearPayload:a=null,activeMonthKey:n=null}={}){const r=n||e?.monthKey||null,o=r?metaReportMonthBounds(r):null;let s="";t&&e&&!e.meta?.emptyMonth&&o&&(s=`
      <div class="meta-report-edit-panel" id="meta-report-edit-panel">
        <h3>Edit month inputs \xB7 ${esc(metaMonthLabel(r))}</h3>
        <div class="meta-report-edit-grid">
          <label>Period start<input type="date" id="meta-report-period-start" value="${esc(o.start)}" /></label>
          <label>Period end<input type="date" id="meta-report-period-end" value="${esc(o.end)}" /></label>
          <label>Won leads<input type="number" step="any" id="meta-report-won-leads" value="${esc(e.topline?.wonLeads??"")}" /></label>
          <label>Avg lead value<input type="number" step="any" id="meta-report-avg-lead-value" value="${esc(e.topline?.avgLeadValue??"")}" /></label>
          <label>Avg profit per won<input type="number" step="any" id="meta-report-avg-profit" value="${esc(e.inputs?.avgProfitPerWon??"")}" /></label>
        </div>
        <div class="meta-report-edit-actions">
          <button type="button" class="admin-btn admin-btn--ghost" id="meta-report-refresh-meta">${ICON_SYNC} Refresh from Meta</button>
          <button type="button" class="admin-btn admin-btn--primary" id="meta-report-save-month">Save month</button>
        </div>
      </div>
    `);const i=n||e?.monthKey||null,l=t?i?`Report preview \xB7 ${metaMonthLabel(i)}`:"Report preview":i?`Report \xB7 ${metaMonthLabel(i)}`:"Report",c=metaReportsState.reportViewMode||"monthly",d=shouldShowMetaReportYearVisuals(e,a,{editable:t}),u=e&&!e.meta?.emptyMonth?`
    <div class="meta-report-preview-card">
      <div class="meta-report-preview-card-label">${l}</div>
      ${renderMetaReportHighlightStrip(e)}
    </div>
  `:"",p=renderMetaReportMonthTables(e,{editable:t}),h=d?renderMetaReportChartsPanel({editable:t}):"",m=t&&d?renderMetaReportScenarioCard():"",g=d?renderMetaReportViewModeTabs():"";let b;return d?b=`
      <div class="meta-report-view-panel${c==="monthly"?" is-active":""}" data-report-view-panel="monthly" role="tabpanel"${c==="monthly"?"":" hidden"}>
        <div class="meta-report-content-layout">
          <div class="meta-report-content-main">${p}</div>
          ${h}
        </div>
      </div>
      <div class="meta-report-view-panel${c==="comparison"?" is-active":""}" data-report-view-panel="comparison" role="tabpanel"${c==="comparison"?"":" hidden"}>
        ${renderMetaReportComparisonView()}
      </div>
      ${m}
    `:b=`<div class="meta-report-content-main">${p}</div>`,`${s}${u}${g}${b}`}function renderMetaReportsHubPage(e){const t=e.clients||[],a=e.meta||{};return`
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
        <div id="meta-reports-banner">${renderMetaReportsBannerHtml(a)}</div>
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
  `}function renderMetaReportsClientPage(e){const t=e.monthKeys||[],a=metaReportsState.activeMonthKey||t[t.length-1]||"",n=e.months?.[a]||null,r=e.settings||{},o=t.map(s=>`
    <button type="button" class="meta-report-tab${s===a?" is-active":""}" data-meta-month-tab="${esc(s)}">${esc(metaMonthLabel(s))}</button>
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
      <div class="meta-report-tabs" role="tablist">${o}</div>
      <div class="meta-report-month-panel" id="meta-report-month-panel">
        ${renderMetaReportMonthBody(n,getMetaReportMonthBodyOptions(r,{editable:!0,yearPayload:e}))}
      </div>
    </div>
    `)}
  `}function metaReportClientDisplayName(e){return String(e?.accountName||e?.clientId||"").trim()||"Meta report"}function syncMetaReportPublicBranding(e){const t=metaReportClientDisplayName(e);document.title=`${t} \xB7 Censio Analytics`;const a=document.querySelector(".meta-report-public-hero h1");a&&(a.textContent=t)}function renderPublicMetaReportPage(e){const t=metaReportClientDisplayName(e),a=e.monthKeys||[],n=metaReportsState.activeMonthKey||a[a.length-1]||"",r=e.months?.[n]||null,o=a.map(s=>`
    <button type="button" class="meta-report-tab${s===n?" is-active":""}" data-meta-month-tab="${esc(s)}">${esc(metaMonthLabel(s))}</button>
  `).join("");return`
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
        <p class="meta-report-public-subtitle">Meta ads performance report</p>
      </div>
    </div>
    <div class="meta-reports-page meta-reports-page--public">
      <div class="meta-report-toolbar">
        <div class="meta-report-toolbar-left">
          <label class="meta-report-year-field">Year
            <select id="meta-report-year" class="admin-select">
              ${renderMetaReportYearSelectOptions(e,{disableUnavailable:!0})}
            </select>
          </label>
          <span class="meta-report-year-loading-banner" id="meta-report-public-year-loading-banner" hidden aria-live="polite"></span>
        </div>
      </div>
      <div class="meta-report-tabs" role="tablist">${o}</div>
      <div class="meta-report-month-panel" id="meta-report-month-panel">
        ${renderMetaReportMonthBody(r,getMetaReportMonthBodyOptions(e.settings,{editable:!1,yearPayload:e}))}
      </div>
    </div>
    <div class="brand-footer brand-footer--public-report">
      Report by <strong>Censio Analytics</strong>
    </div>
    `)}
  `}function bindMetaReportCopyButtons(e=document){e.querySelectorAll("[data-copy-report-url]").forEach(t=>{t.onclick=async()=>{const a=t.getAttribute("data-copy-report-url"),n=`${window.location.origin}${a}`;try{await navigator.clipboard.writeText(n),showToast("Share link copied","success")}catch{showToast(n,"info")}}})}async function patchMetaReportSettings(e,t,{fast:a=!1}={}){metaReportsState._settingsInflight=(metaReportsState._settingsInflight||0)+1;const n=`/api/meta-reports/clients/${encodeURIComponent(e)}/settings`,r={method:"PATCH",body:JSON.stringify(t)};try{return a?await adminFetch(n,r):await adminFetchWithRetry(n,r,{retries:2,timeoutMs:2e4})}finally{metaReportsState._settingsInflight=Math.max(0,(metaReportsState._settingsInflight||1)-1)}}async function refreshMetaReportsHubData({silent:e=!0}={}){const t=document.getElementById("meta-reports-refresh");t&&(t.disabled=!0);try{const a=await adminFetch("/api/meta-reports?filter=all");metaReportsState.dashboardData=a,updateMetaReportsHubDom(getMetaReportsHubView(a,metaReportsState.filter,metaReportsState.searchQuery)),e||showToast("Meta reports refreshed","success")}catch(a){showToast(a.message||"Refresh failed","error")}finally{t&&(t.disabled=!1)}}function bindMetaReportsHubChromeEvents(){document.querySelectorAll("[data-meta-filter]").forEach(a=>{a.onclick=()=>{metaReportsState.filter=a.getAttribute("data-meta-filter")||"all",document.querySelectorAll("[data-meta-filter]").forEach(n=>{n.classList.toggle("is-active",n.getAttribute("data-meta-filter")===metaReportsState.filter)}),metaReportsState.dashboardData&&updateMetaReportsHubDom(getMetaReportsHubView(metaReportsState.dashboardData,metaReportsState.filter,metaReportsState.searchQuery))}});const e=document.getElementById("meta-reports-search");if(e){let a=null;e.oninput=()=>{clearTimeout(a),a=setTimeout(()=>{metaReportsState.searchQuery=e.value||"",metaReportsState.dashboardData&&updateMetaReportsHubDom(getMetaReportsHubView(metaReportsState.dashboardData,metaReportsState.filter,metaReportsState.searchQuery))},180)}}const t=document.getElementById("meta-reports-refresh");t&&(t.onclick=()=>refreshMetaReportsHubData({silent:!1}))}function mergeHubClientFromSettings(e,t={}){return!t||typeof t!="object"?null:mergeHubClient(e,{metaReportEnabled:t.metaReportEnabled,metaReportShowBottomline:t.metaReportShowBottomline,metaReportFeeEnabled:t.metaReportFeeEnabled,metaReportFeeMode:t.metaReportFeeMode,metaReportFeePercent:t.metaReportFeePercent,metaReportMarketingFeeAmount:t.metaReportMarketingFeeAmount,metaReportSlug:t.metaReportSlug,reportUrl:t.reportUrl})}function refreshMetaReportsHubCards(){metaReportsState.dashboardData&&updateMetaReportsHubDom(getMetaReportsHubView(metaReportsState.dashboardData,metaReportsState.filter,metaReportsState.searchQuery))}function resolveMetaReportStoredFeeMode(e={}){return e.metaReportFeeMode?e.metaReportFeeMode:Number(e.metaReportMarketingFeeAmount)>0?"marketing":"performance"}function resolveMetaReportFeeModeToRestore(e){return e?resolveMetaReportStoredFeeMode(e):"performance"}function bindMetaReportsHubRowEvents(e=document){e.querySelectorAll("[data-meta-report-enabled]").forEach(t=>{let a=0;t.onchange=async()=>{const n=t.getAttribute("data-meta-report-enabled"),r=++a,o=t.checked,s=!o;mergeHubClientFromSettings(n,{metaReportEnabled:o}),updateMetaReportHubCardReportState(n,o);const i=t.closest(".meta-hub-switch");i?.classList.add("is-saving");try{const l=await patchMetaReportSettings(n,{metaReportEnabled:o},{fast:!0});if(r!==a)return;const c=l.settings||{};mergeHubClientFromSettings(n,c),updateMetaReportHubCardReportState(n,!!(c.metaReportEnabled??o)),showToast(o?"Report enabled":"Report disabled","success")}catch(l){if(r!==a)return;mergeHubClientFromSettings(n,{metaReportEnabled:s}),t.checked=s,updateMetaReportHubCardReportState(n,s),showToast(l.message||"Update failed","error")}finally{r===a&&i?.classList.remove("is-saving")}}}),e.querySelectorAll("[data-meta-bottomline]").forEach(t=>{t.onchange=async()=>{const a=t.getAttribute("data-meta-bottomline");t.disabled=!0;try{const n=await patchMetaReportSettings(a,{metaReportShowBottomline:t.checked});mergeHubClientFromSettings(a,n.settings||{}),showToast("Bottomline setting saved","success"),refreshMetaReportsHubCards()}catch(n){showToast(n.message||"Update failed","error"),t.checked=!t.checked}finally{t.disabled=!1}}}),e.querySelectorAll("[data-meta-fee]").forEach(t=>{t.onchange=async()=>{const a=t.getAttribute("data-meta-fee"),n=(metaReportsState.dashboardData?.clients||[]).find(r=>r.clientId===a);t.disabled=!0;try{const r=t.checked?{metaReportFeeEnabled:!0,metaReportFeeMode:resolveMetaReportFeeModeToRestore(n)}:{metaReportFeeEnabled:!1},o=await patchMetaReportSettings(a,r);mergeHubClientFromSettings(a,o.settings||{}),showToast("Fee setting saved","success"),refreshMetaReportsHubCards()}catch(r){showToast(r.message||"Update failed","error"),t.checked=!t.checked}finally{t.disabled=!1}}}),bindMetaReportCopyButtons(e),e.querySelectorAll("[data-meta-provision]").forEach(t=>{t.onclick=async()=>{t.disabled=!0;try{await adminFetch("/api/meta-reports/provision",{method:"POST",body:JSON.stringify({accountName:t.getAttribute("data-meta-provision-name"),metaAdAccountId:t.getAttribute("data-meta-provision"),metaReportEnabled:!0})}),showToast("Client added","success"),await refreshMetaReportsHubData({silent:!0})}catch(a){showToast(a.message||"Failed to add client","error"),t.disabled=!1}}})}function bindMetaReportsHubEvents(){bindMetaReportsHubChromeEvents(),bindMetaReportsHubRowEvents(document.getElementById("meta-reports-cards")||document)}function bindMetaReportsClientTabEvents(e){document.querySelectorAll("[data-meta-month-tab]").forEach(t=>{t.onclick=()=>{switchMetaReportMonthTab(t.getAttribute("data-meta-month-tab"),{editable:!0})}})}function setMetaReportSavingState(e){const t=document.getElementById("meta-report-month-panel"),a=document.getElementById("meta-report-save-indicator");t&&t.classList.toggle("is-loading",e),a&&a.classList.toggle("is-visible",e)}function syncMetaReportFeeFieldState(e,t="meta-report"){const a=document.getElementById(`${t}-fee-field`),n=document.getElementById(`${t}-setting-fee-percent`);a&&a.classList.toggle("is-disabled",!e),n&&(n.disabled=!e)}function syncMetaReportSettingsControls(e={},t=null){syncMetaReportBottomlineFeeDom(e,"meta-report")}function describeMetaReportSettingsChange(e,t){if(Object.prototype.hasOwnProperty.call(e,"metaReportFeeMode")){const a=t.metaReportFeeMode;return a?a==="marketing"?"Censio marketing fee enabled":"Censio performance fee enabled":"Censio fee disabled"}return Object.prototype.hasOwnProperty.call(e,"metaReportFeeEnabled")?t.metaReportFeeEnabled?"Censio fee enabled":"Censio fee disabled":Object.prototype.hasOwnProperty.call(e,"metaReportFeePercent")?`Performance fee set to ${t.metaReportFeePercent??20}% \u2014 report updated`:Object.prototype.hasOwnProperty.call(e,"metaReportMarketingFeeAmount")?`Marketing fee set to Dkr ${t.metaReportMarketingFeeAmount??0} \u2014 report updated`:Object.prototype.hasOwnProperty.call(e,"metaReportShowBottomline")?t.metaReportShowBottomline?"Bottomline shown on report":"Bottomline hidden from report":Object.prototype.hasOwnProperty.call(e,"metaReportSpendChartType")?`Default spend chart set to ${META_REPORT_SPEND_CHART_TYPE_OPTIONS.find(n=>n.value===t.metaReportSpendChartType)?.label||t.metaReportSpendChartType}`:"Settings saved"}async function saveMetaReportClientSettings(e,t,a){setMetaReportSavingState(!0);try{const n=await patchMetaReportSettings(e,{...t,monthKey:metaReportsState.activeMonthKey}),r=n.settings||{},o=metaReportsState.clientPayload;o&&(o.settings=r,n.monthPayload&&metaReportsState.activeMonthKey&&(o.months=o.months||{},o.months[metaReportsState.activeMonthKey]=n.monthPayload));const s=n.monthPayload||o?.months?.[metaReportsState.activeMonthKey]||null;syncMetaReportSettingsControls(r,s),Object.prototype.hasOwnProperty.call(t,"metaReportShowBottomline")?(r.metaReportShowBottomline?setMetaReportClientSettingsExpanded("meta-report",!0):setMetaReportClientSettingsExpanded("meta-report",!1),updateMetaReportBottomlineFeeSummary(r,"meta-report")):(Object.prototype.hasOwnProperty.call(t,"metaReportFeeMode")||Object.prototype.hasOwnProperty.call(t,"metaReportFeePercent")||Object.prototype.hasOwnProperty.call(t,"metaReportMarketingFeeAmount"))&&(setMetaReportClientSettingsExpanded("meta-report",!1),updateMetaReportBottomlineFeeSummary(r,"meta-report")),s&&document.getElementById("meta-report-month-panel")&&(syncMetaReportMonthPanelDom(s,getMetaReportMonthBodyOptions(r,{editable:!0}),o),bindMetaReportsClientEditEvents(e,o)),showToast(describeMetaReportSettingsChange(t,r),"success")}catch(n){showToast(n.message||"Update failed","error"),a&&a()}finally{setMetaReportSavingState(!1)}}function bindMetaReportBackfillButton(e){const t=document.getElementById("meta-report-backfill");t&&(t.onclick=async()=>{const a=metaReportsState.clientPayload,n=metaReportMonthsNeedingBackfill(a),r=n.length?n:a?.monthKeys||[];if(!r.length)return;t.disabled=!0;const o=document.getElementById("meta-report-backfill-progress");let s=0,i=0;for(const l of r){s+=1,o&&(o.textContent=`Fetching ${metaMonthLabel(l)} ${l.slice(0,4)}\u2026 (${s}/${r.length})`);try{await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(l)}/refresh`,{method:"POST"})}catch{i+=1}}o&&(o.textContent=""),i?showToast(`Synced ${s-i}/${r.length} months. ${i} failed (check Meta token access).`,"error"):showToast(`Synced ${r.length} month${r.length===1?"":"s"} from Meta`,"success"),await loadMetaReportsClientPage({silent:!0})})}function renderMetaReportTabsSkeleton(e=12){return Array.from({length:e}).map(()=>'<span class="meta-cv-skeleton-pill meta-report-tab-skeleton" aria-hidden="true"></span>').join("")}function renderMetaReportMonthPanelSkeleton(){return`
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
  `}function setMetaReportYearLoadingBanner(e,t,a){const n=document.querySelector(e);if(!n)return;let r=n.querySelector(".meta-report-year-loading-banner");a?(r||(r=document.createElement("span"),r.className="meta-report-year-loading-banner",r.setAttribute("aria-live","polite"),n.appendChild(r)),r.innerHTML=`<span class="meta-report-save-indicator-spinner"></span> Loading ${esc(t)}\u2026`,r.hidden=!1):r&&(r.hidden=!0)}function setMetaReportClientYearLoading(e,t){const a=document.querySelector(".meta-report-client-page"),n=document.getElementById("meta-report-year");if(t){n&&(n.disabled=!0),a&&a.classList.add("is-year-loading"),setMetaReportYearLoadingBanner(".meta-report-client-page .meta-report-toolbar-left",e,!0);const r=document.querySelector(".meta-report-tabs");r&&(r.innerHTML=renderMetaReportTabsSkeleton(),r.setAttribute("aria-busy","true"));const o=document.getElementById("meta-report-month-panel");o&&(o.innerHTML=renderMetaReportMonthPanelSkeleton(),o.classList.add("is-loading")),destroyMetaReportCharts()}else{n&&(n.disabled=!1),a&&a.classList.remove("is-year-loading"),setMetaReportYearLoadingBanner(".meta-report-client-page .meta-report-toolbar-left",e,!1);const r=document.querySelector(".meta-report-tabs");r&&r.removeAttribute("aria-busy");const o=document.getElementById("meta-report-month-panel");o&&o.classList.remove("is-loading")}}function setMetaCvYearLoading(e,t){const a=document.querySelector(".sync-history-page.meta-reports-page"),n=document.getElementById("meta-cv-year"),r=document.getElementById("meta-cv-search");if(t){n&&(n.disabled=!0),r&&(r.disabled=!0),a&&a.classList.add("is-year-loading"),setMetaReportYearLoadingBanner(".meta-cv-toolbar-left",e,!0);const o=document.querySelector(".meta-cv-summary");o&&(o.classList.add("is-skeleton"),o.innerHTML=renderMetaCvSummarySkeleton());const s=document.querySelector(".meta-cv-legend");s&&s.setAttribute("aria-hidden","true");const i=document.getElementById("meta-cv-client-list");i&&(i.innerHTML=renderMetaCvListSkeleton(),i.setAttribute("aria-busy","true"));const l=document.getElementById("meta-cv-editor");l&&(l.innerHTML=renderMetaCvEditorYearSkeleton(),l.setAttribute("aria-busy","true"))}else{n&&(n.disabled=!1),r&&(r.disabled=!1),a&&a.classList.remove("is-year-loading"),setMetaReportYearLoadingBanner(".meta-cv-toolbar-left",e,!1);const o=document.querySelector(".meta-cv-summary");o&&o.classList.remove("is-skeleton");const s=document.querySelector(".meta-cv-legend");s&&s.removeAttribute("aria-hidden");const i=document.getElementById("meta-cv-client-list");i&&i.removeAttribute("aria-busy");const l=document.getElementById("meta-cv-editor");l&&l.removeAttribute("aria-busy")}}function setMetaReportPublicYearLoading(e,t){const a=document.querySelector(".meta-reports-page--public"),n=document.getElementById("meta-report-year");if(t){n&&(n.disabled=!0),a&&a.classList.add("is-year-loading"),setMetaReportYearLoadingBanner(".meta-reports-page--public .meta-report-toolbar-left",e,!0);const r=document.querySelector(".meta-reports-page--public .meta-report-tabs");r&&(r.innerHTML=renderMetaReportTabsSkeleton(),r.setAttribute("aria-busy","true"));const o=document.getElementById("meta-report-month-panel");o&&(o.innerHTML=renderMetaReportMonthPanelSkeleton(),o.classList.add("is-loading")),destroyMetaReportCharts()}else{n&&(n.disabled=!1),a&&a.classList.remove("is-year-loading"),setMetaReportYearLoadingBanner(".meta-reports-page--public .meta-report-toolbar-left",e,!1);const r=document.querySelector(".meta-reports-page--public .meta-report-tabs");r&&r.removeAttribute("aria-busy");const o=document.getElementById("meta-report-month-panel");o&&o.classList.remove("is-loading")}}function bindMetaReportsClientChromeEvents(e){const t=e.clientId,a=document.getElementById("meta-report-year");a&&(a.onchange=async()=>{if(a.selectedOptions?.[0]?.disabled){a.value=String(metaReportsState.selectedYear);return}const r=metaReportsState.selectedYear,o=Number(a.value);if(o!==r){metaReportsState.selectedYear=o,metaReportsState.activeMonthKey=null,metaReportsState.comparisonYearCache={},setMetaReportClientYearLoading(o,!0);try{await loadMetaReportsClientPage({silent:!0})}catch(s){metaReportsState.selectedYear=r,a&&(a.value=String(r)),await loadMetaReportsClientPage({silent:!0}),showToast(s.message||"Load failed","error")}finally{setMetaReportClientYearLoading(o,!1)}}}),bindMetaReportCopyButtons(),bindMetaReportBackfillButton(t),bindMetaReportBottomlineFeeEvents(t,"meta-report"),bindMetaReportShareEvents(e)}function bindMetaReportsClientEvents(e){bindMetaReportsClientChromeEvents(e),bindMetaReportsClientTabEvents(e),bindMetaReportsClientEditEvents(e.clientId,e)}function bindMetaReportsClientEditEvents(e,t){const a=document.getElementById("meta-report-refresh-meta");a&&(a.onclick=async()=>{a.disabled=!0;try{const r=metaReportsState.activeMonthKey,o=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(r)}/refresh`,{method:"POST"});refreshMetaReportMonthPanel(o.monthPayload),showToast("Meta data refreshed","success")}catch(r){showToast(r.message||"Meta refresh failed","error")}finally{a.disabled=!1}});const n=document.getElementById("meta-report-save-month");n&&(n.onclick=async()=>{n.disabled=!0;try{const r=metaReportsState.activeMonthKey,o={periodStart:document.getElementById("meta-report-period-start")?.value,periodEnd:document.getElementById("meta-report-period-end")?.value,wonLeads:Number(document.getElementById("meta-report-won-leads")?.value),avgLeadValue:Number(document.getElementById("meta-report-avg-lead-value")?.value),avgProfitPerWon:Number(document.getElementById("meta-report-avg-profit")?.value)},s=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(r)}`,{method:"PUT",body:JSON.stringify(o)});refreshMetaReportMonthPanel(s.monthPayload),showToast("Month saved","success")}catch(r){showToast(r.message||"Save failed","error")}finally{n.disabled=!1}})}function bindPublicMetaReportTabEvents(e){document.querySelectorAll("[data-meta-month-tab]").forEach(t=>{t.onclick=()=>{switchMetaReportMonthTab(t.getAttribute("data-meta-month-tab"),{editable:!1})}})}function bindPublicMetaReportEvents(e){bindPublicMetaReportTabEvents(e);const t=document.getElementById("meta-report-year");t&&(t.onchange=async()=>{if(t.selectedOptions?.[0]?.disabled){t.value=String(metaReportsState.selectedYear);return}const n=metaReportsState.selectedYear,r=Number(t.value);if(r!==n){metaReportsState.selectedYear=r,metaReportsState.activeMonthKey=null,metaReportsState.comparisonYearCache={},setMetaReportPublicYearLoading(r,!0);try{await loadPublicMetaReportPage({silent:!0})}catch(o){metaReportsState.selectedYear=n,t&&(t.value=String(n)),await loadPublicMetaReportPage({silent:!0}),showToast(o.message||"Load failed","error")}finally{setMetaReportPublicYearLoading(r,!1)}}})}async function loadMetaReportsHubPage(){const e=document.getElementById("dashboard");if(!e)return;const t=await fetchStaffMe();if(!t){e.innerHTML=`
      ${renderBrandTopbar("")}
      ${wrapDashboardShell('<div class="sync-history-empty" style="padding:24px;text-align:center"><a class="admin-btn admin-btn--primary" href="/login?next='+encodeURIComponent(window.location.pathname)+'">Sign in</a></div>')}
    `;return}currentStaffUser=t,metaReportsState.hubMounted||(e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading Meta reports...</p></div>')}
    `);try{const a=await adminFetch("/api/meta-reports?filter=all");metaReportsState.dashboardData=a;const n=getMetaReportsHubView(a,metaReportsState.filter,metaReportsState.searchQuery);metaReportsState.hubMounted?updateMetaReportsHubDom(n):(e.innerHTML=renderMetaReportsHubPage(n),metaReportsState.hubMounted=!0,bindMetaReportsHubEvents())}catch(a){metaReportsState.hubMounted?showToast(a.message||"Load failed","error"):e.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(a.message)}</div>`)}
      `}}async function loadMetaReportsClientPage({silent:e=!1}={}){const t=document.getElementById("dashboard");if(!t)return;const a=await fetchStaffMe();if(!a){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}currentStaffUser=a;const n=CLIENT_SLUG;if(!metaReportsState.clientPageMounted)t.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading report editor...</p></div>')}
    `;else if(!e){const r=document.getElementById("meta-report-month-panel");r&&r.classList.add("is-loading")}try{const r=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(n)}?year=${encodeURIComponent(metaReportsState.selectedYear)}`);if(syncMetaReportSelectedYear(r,{disableUnavailable:!0}),Number(metaReportsState.selectedYear)!==Number(r.year))return loadMetaReportsClientPage({silent:!0});metaReportsState.activeMonthKey||(metaReportsState.activeMonthKey=r.monthKeys?.[r.monthKeys.length-1]||null),await ensureMetaReportScenarioSource(r,{editable:!0}),metaReportsState.clientPageMounted?updateMetaReportsClientContent(r):(metaReportsState.clientPayload=r,metaReportsState.clientReportSettingsExpanded=!1,metaReportsState.clientShareExpanded=!1,t.innerHTML=renderMetaReportsClientPage(r),metaReportsState.clientPageMounted=!0,bindMetaReportsClientEvents(r),mountMetaReportCharts(r,{editable:!0}))}catch(r){if(!metaReportsState.clientPageMounted)t.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("meta-reports"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(r.message)}</div>`)}
      `;else{if(e)throw r;showToast(r.message||"Load failed","error")}}finally{const r=document.getElementById("meta-report-month-panel");r&&r.classList.remove("is-loading")}}async function loadPublicMetaReportPage({silent:e=!1}={}){const t=document.getElementById("dashboard");if(!(!t||!REPORT_TOKEN)){if(!metaReportsState.publicPageMounted)t.innerHTML=wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading report...</p></div>');else if(!e){const a=document.getElementById("meta-report-month-panel");a&&a.classList.add("is-loading")}try{const a=await fetch(`/api/meta-reports/public/${encodeURIComponent(REPORT_TOKEN)}?year=${encodeURIComponent(metaReportsState.selectedYear)}`).then(async n=>{const r=await n.json();if(!n.ok)throw new Error(r.error||"Report not found");return r});if(syncMetaReportSelectedYear(a,{disableUnavailable:!0}),Number(metaReportsState.selectedYear)!==Number(a.year))return loadPublicMetaReportPage({silent:!0});metaReportsState.activeMonthKey||(metaReportsState.activeMonthKey=a.monthKeys?.[a.monthKeys.length-1]||null),await ensureMetaReportScenarioSource(a,{editable:!1}),metaReportsState.publicPageMounted?updatePublicMetaReportContent(a):(metaReportsState.publicPayload=a,t.innerHTML=renderPublicMetaReportPage(a),metaReportsState.publicPageMounted=!0,syncMetaReportPublicBranding(a),bindPublicMetaReportEvents(a),mountMetaReportCharts(a,{editable:!1}))}catch(a){if(!metaReportsState.publicPageMounted)t.innerHTML=wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(a.message||"Report not found")}</div>`);else{if(e)throw a;showToast(a.message||"Load failed","error")}}finally{const a=document.getElementById("meta-report-month-panel");a&&a.classList.remove("is-loading")}}}function metaCvShortMonth(e){const t=Number(String(e||"").slice(5,7));return["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][t-1]||e}function metaCvFormatUpdatedAt(e){if(!e)return"Not updated yet";const t=new Date(e);return Number.isNaN(t.getTime())?"Not updated yet":t.toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}function getMetaCvFilteredClients(e=metaReportsState.customValues.overview){const t=e?.clients||[],a=String(metaReportsState.customValues.searchQuery||"").trim().toLowerCase();return a?t.filter(n=>[n.accountName,n.clientId,n.metaAdAccountId].filter(Boolean).join(" ").toLowerCase().includes(a)):t}function renderMetaCvMonthPills(e,t=[]){const a=metaReportsState.customValues.selectedClientId,n=metaReportsState.customValues.selectedMonthKey;return t.map(r=>{const o=e.months?.[r]?.status||"empty",s=a===e.clientId&&n===r;return`
      <button
        type="button"
        class="meta-cv-month-pill is-${esc(o)}${s?" is-active":""}"
        data-meta-cv-client="${esc(e.clientId)}"
        data-meta-cv-month="${esc(r)}"
        title="${esc(metaCvShortMonth(r))} \xB7 ${esc(o)}"
      >${esc(metaCvShortMonth(r))}</button>
    `}).join("")}function renderMetaCvClientRows(e){const t=getMetaCvFilteredClients(e),a=e.monthKeys||[];return t.length?t.map(n=>`
      <article class="meta-cv-client${metaReportsState.customValues.selectedClientId===n.clientId?" is-selected":""}" data-meta-cv-client-card="${esc(n.clientId)}">
        <div class="meta-cv-client-head">
          <div>
            <h3>${esc(n.accountName)}</h3>
            <div class="meta-cv-client-meta">
              ${n.metaReportEnabled?"Live report":"Report off"}
              \xB7 Last update ${esc(metaCvFormatUpdatedAt(n.lastUpdatedAt))}
            </div>
          </div>
          <div class="meta-cv-client-stats">
            ${n.completeCount}/${a.length} done
            ${n.emptyCount?`<br>${n.emptyCount} remaining`:""}
          </div>
        </div>
        <div class="meta-cv-month-pills">${renderMetaCvMonthPills(n,a)}</div>
      </article>
    `).join(""):'<div class="meta-report-empty" style="padding:32px 12px">No matching clients.</div>'}function monthStatusIsEmpty(e,t={}){return e?(e.status??classifyMetaCvMonthStatus({wonLeads:e.inputs?.wonLeads??e.topline?.wonLeads??e.wonLeads,avgLeadValue:e.inputs?.avgLeadValue??e.topline?.avgLeadValue??e.avgLeadValue,avgProfitPerWon:e.inputs?.avgProfitPerWon??e.avgProfitPerWon},!!t.metaReportShowBottomline))==="empty":!0}function metaReportEffectiveFeeEnabled(e,t=null){if(!t)return!!e?.metaReportFeeEnabled;const a=!!e?.metaReportShowBottomline;return(t.status??classifyMetaCvMonthStatus({wonLeads:t.inputs?.wonLeads??t.topline?.wonLeads??t.wonLeads,avgLeadValue:t.inputs?.avgLeadValue??t.topline?.avgLeadValue??t.avgLeadValue,avgProfitPerWon:t.inputs?.avgProfitPerWon??t.avgProfitPerWon},a))==="empty"?!1:!!e?.metaReportFeeEnabled}function resolveMetaReportFeeMode(e={}){return e.metaReportFeeEnabled?resolveMetaReportStoredFeeMode(e):""}const META_REPORT_FEE_MODE_META=[{value:"",icon:"\u2013",title:"None",desc:"No Censio fee"},{value:"performance",icon:"%",title:"Performance fee",desc:"% of profit (POAS)"},{value:"marketing",icon:"Dkr",title:"Marketing fee",desc:"Fixed Dkr amount"}];function metaReportFeeValueBlockHtml(e,t,a,n,{inline:r=!1}={}){return r&&t==="performance"?`
      <label class="meta-cv-fee-inline-field">
        <span class="meta-cv-fee-inline-label">Performance fee</span>
        <span class="meta-report-fee-value-input-wrap meta-cv-fee-inline-input">
          <input type="number" step="any" min="0" max="100" id="${e}-setting-fee-percent" value="${esc(a)}" />
          <span class="meta-report-fee-value-input-suffix">%</span>
        </span>
      </label>`:r&&t==="marketing"?`
      <label class="meta-cv-fee-inline-field">
        <span class="meta-cv-fee-inline-label">Marketing fee</span>
        <span class="meta-report-fee-value-input-wrap meta-cv-fee-inline-input">
          <input type="number" step="any" min="0" id="${e}-setting-marketing-fee" value="${esc(n)}" />
          <span class="meta-report-fee-value-input-suffix">Dkr</span>
        </span>
      </label>`:r?'<span class="meta-cv-fee-inline-hint">No fee amount \u2014 save to apply.</span>':t==="performance"?`
      <label class="meta-report-fee-value-field">
        <span class="meta-report-fee-value-label">Performance fee percentage</span>
        <span class="meta-report-fee-value-input-wrap">
          <input type="number" step="any" min="0" max="100" id="${e}-setting-fee-percent" value="${esc(a)}" />
          <span class="meta-report-fee-value-input-suffix">%</span>
        </span>
      </label>`:t==="marketing"?`
      <label class="meta-report-fee-value-field">
        <span class="meta-report-fee-value-label">Marketing fee amount</span>
        <span class="meta-report-fee-value-input-wrap">
          <input type="number" step="any" min="0" id="${e}-setting-marketing-fee" value="${esc(n)}" />
          <span class="meta-report-fee-value-input-suffix">Dkr</span>
        </span>
      </label>`:'<p class="meta-report-fee-value-empty">No amount needed \u2014 just save your selection.</p>'}function metaReportUsesInlineFeeValue(e){return e==="meta-cv"}function describeMetaReportFeeModeLabel(e,t,a,{feeEnabled:n=!0}={}){if(!n||e===""||e==null)return"No Censio fee";if(e==="performance"){const r=Number(t);return`Performance fee \xB7 ${Number.isFinite(r)?r:20}%`}if(e==="marketing"){const r=Number(a);return`Marketing fee \xB7 Dkr ${Number.isFinite(r)?r:0}`}return"No Censio fee"}function readMetaReportFeeDraftState(e){const t=document.getElementById(`${e}-fee-nested`);if(!t)return null;const a=t.querySelector(`input[name="${e}-fee-mode"]:checked`),n=a?a.value||"":t.dataset.feeMode||"";let r=Number(t.dataset.feePercent),o=Number(t.dataset.marketingFee);if(n==="performance"){const u=document.getElementById(`${e}-setting-fee-percent`),p=Number(u?.value);Number.isFinite(p)&&(r=p)}else if(n==="marketing"){const u=document.getElementById(`${e}-setting-marketing-fee`),p=Number(u?.value);Number.isFinite(p)&&(o=p)}const s=t.dataset.feeEnabled==="true"?resolveMetaReportStoredFeeMode({metaReportFeeEnabled:!0,metaReportFeeMode:t.dataset.feeMode||null,metaReportMarketingFeeAmount:t.dataset.marketingFee}):"",i=Number(t.dataset.feePercent),l=Number(t.dataset.marketingFee);return{appliedMode:s,appliedPercent:i,appliedMarketing:l,selectedMode:n,selectedPercent:r,selectedMarketing:o,isDirty:n!==s||(n==="performance"?r!==i:n==="marketing"?o!==l:!1),appliedLabel:describeMetaReportFeeModeLabel(s,i,l),selectedLabel:describeMetaReportFeeModeLabel(n,r,o)}}function metaReportFeeStatusHtml(e){return e.isDirty?`
        <span class="meta-report-fee-status-value is-active">${esc(e.appliedLabel)}</span>
        <span class="meta-report-fee-status-arrow" aria-hidden="true">\u2192</span>
        <span class="meta-report-fee-status-pending">${esc(e.selectedLabel)}</span>`:`<span class="meta-report-fee-status-value is-active">${esc(e.appliedLabel)}</span>`}function syncMetaReportFeeSelectionState(e){const t=document.getElementById(`${e}-fee-nested`),a=readMetaReportFeeDraftState(e);if(!t||!a)return;const n=document.getElementById(`${e}-fee-status`);n&&(n.innerHTML=metaReportFeeStatusHtml(a));const r=document.getElementById(`${e}-fee-save`);r&&(r.classList.toggle("is-dirty",a.isDirty),e==="meta-cv"&&(r.disabled=!a.isDirty,r.textContent=a.isDirty?"Save changes":"Saved"))}function bindMetaReportFeeAmountInputs(e){const t=document.getElementById(`${e}-setting-fee-percent`),a=document.getElementById(`${e}-setting-marketing-fee`);t&&(t.oninput=()=>syncMetaReportFeeSelectionState(e)),a&&(a.oninput=()=>syncMetaReportFeeSelectionState(e))}function bindMetaReportFeeDraftTracking(e){bindMetaReportFeeAmountInputs(e),syncMetaReportFeeSelectionState(e)}function renderMetaReportBottomlineFeeSummary(e={},t="meta-report"){const a=!!e.metaReportShowBottomline,n=resolveMetaReportFeeMode(e)||"",r=e.metaReportFeePercent??20,o=e.metaReportMarketingFeeAmount??0,s=describeMetaReportFeeModeLabel(n,r,o);return`
    <div class="meta-report-bottomline-summary" id="${t}-fee-summary">
      <div class="meta-report-bottomline-summary-content">
        <div class="meta-report-bottomline-summary-row">
          <span class="meta-report-bottomline-summary-label">Bottomline</span>
          <span class="meta-report-bottomline-summary-value${a?" is-on":" is-off"}">${a?"Enabled":"Disabled"}</span>
        </div>
        ${a?`
        <div class="meta-report-bottomline-summary-row">
          <span class="meta-report-bottomline-summary-label">Censio fee</span>
          <span class="meta-report-bottomline-summary-value">${esc(s)}</span>
        </div>`:""}
      </div>
      <button type="button" class="admin-btn admin-btn--secondary admin-btn--small" id="${t}-fee-edit">Edit</button>
    </div>
  `}function setMetaReportClientSettingsExpanded(e,t){if(e!=="meta-report")return;metaReportsState.clientReportSettingsExpanded=!!t,t&&(metaReportsState.clientShareExpanded=!1);const a=document.querySelector(".meta-report-bottomline-fee-settings--client"),n=document.getElementById(`${e}-fee-editor`);a?.classList.toggle("is-editing",t),a?.classList.toggle("is-collapsed",!t),n&&n.classList.toggle("is-hidden",!t);const r=document.getElementById("meta-report-share-summary"),o=document.getElementById("meta-report-share-editor");r&&(r.hidden=metaReportsState.clientShareExpanded),o&&(o.hidden=!metaReportsState.clientShareExpanded),syncMetaReportControlPanelUi()}function updateMetaReportBottomlineFeeSummary(e={},t="meta-report"){const a=document.getElementById(`${t}-fee-summary`);if(!a)return;const n=document.createElement("div");n.innerHTML=renderMetaReportBottomlineFeeSummary(e,t);const r=n.firstElementChild;r&&a.replaceWith(r);const o=document.getElementById(`${t}-fee-edit`);o&&(o.onclick=()=>setMetaReportClientSettingsExpanded(t,!0))}function renderMetaReportBottomlineFeeSettings(e={},t="meta-report",{compact:a=!1,variant:n="default",collapsible:r=!1,externalSummary:o=!1}={}){const s=!!e.metaReportShowBottomline,i=!!e.metaReportFeeEnabled,l=e.metaReportFeeMode||"",c=resolveMetaReportFeeMode(e),d=e.metaReportFeePercent??20,u=e.metaReportMarketingFeeAmount??0,p=metaReportUsesInlineFeeValue(t),h=`data-fee-mode="${esc(l)}" data-fee-enabled="${i?"true":"false"}" data-fee-percent="${esc(d)}" data-marketing-fee="${esc(u)}"`;if(n==="cv"){const y=describeMetaReportFeeModeLabel(c,d,u),$=META_REPORT_FEE_MODE_META.map(({value:w,title:S})=>`
        <label class="meta-report-fee-mode-pill">
          <input type="radio" name="${t}-fee-mode" value="${esc(w)}"${c===w?" checked":""} />
          <span>${esc(S)}</span>
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
            <span class="meta-report-fee-status-value is-active">${esc(y)}</span>
          </div>
          <div class="meta-report-fee-mode-pills">${$}</div>
          <div class="meta-cv-fee-footer">
            <div class="meta-cv-fee-value-inline" id="${t}-fee-value">${metaReportFeeValueBlockHtml(t,c,d,u,{inline:!0})}</div>
            <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="${t}-fee-save" disabled>Saved</button>
          </div>
        </div>
      </div>
    </div>
  `}const m=describeMetaReportFeeModeLabel(c,d,u),g=META_REPORT_FEE_MODE_META.map(({value:y,icon:$,title:w,desc:S})=>`
        <label class="meta-report-fee-mode-card">
          <input type="radio" name="${t}-fee-mode" value="${esc(y)}"${c===y?" checked":""} />
          <span class="meta-report-fee-mode-card-icon" aria-hidden="true">${esc($)}</span>
          <span class="meta-report-fee-mode-card-text">
            <span class="meta-report-fee-mode-card-title">${esc(w)}</span>
            <small>${esc(S)}</small>
          </span>
          <span class="meta-report-fee-mode-card-radio" aria-hidden="true">${ICON_CHECK}</span>
        </label>`).join(""),b=r?metaReportsState.clientReportSettingsExpanded:!0,f=r?`
        <div class="meta-report-fee-editor-actions">
          <button type="button" class="admin-btn admin-btn--ghost admin-btn--small" id="${t}-fee-done">Done</button>
          <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="${t}-fee-save">Save fee settings</button>
        </div>`:`
        <div class="meta-report-fee-save-row">
          <button type="button" class="admin-btn admin-btn--primary admin-btn--small" id="${t}-fee-save">Save fee settings</button>
        </div>`,v=r&&!o?renderMetaReportBottomlineFeeSummary(e,t):"";return`
    <div class="meta-report-bottomline-fee-settings${r?" meta-report-bottomline-fee-settings--client":""}${r?b?" is-editing":" is-collapsed":""}">
      ${v}
      <div class="meta-report-bottomline-editor${r&&!b?" is-hidden":""}" id="${t}-fee-editor">
        <div class="meta-report-bottomline-row">
          <div class="meta-report-bottomline-row-text">
            <span class="meta-report-bottomline-row-title">Show bottomline</span>
            <span class="meta-report-bottomline-row-desc">Adds profit, ROAS and Censio fee breakdown to this report</span>
          </div>
          ${renderMetaReportSwitch(`${t}-setting-bottomline`,s,"Show bottomline",!1,{hideLabel:!0})}
        </div>
        <div class="meta-report-fee-nested${s?"":" is-hidden"}" id="${t}-fee-nested" ${h}>
          <div class="meta-report-fee-status" id="${t}-fee-status" aria-live="polite">
            <span class="meta-report-fee-status-value is-active">${esc(m)}</span>
          </div>
          <div class="meta-report-fee-mode-grid${a?" meta-report-fee-mode-grid--rows":""}">${g}
          </div>
          <div class="meta-report-fee-value" id="${t}-fee-value">${metaReportFeeValueBlockHtml(t,c,d,u,{inline:p})}</div>
          ${f}
        </div>
      </div>
    </div>
  `}function syncMetaReportBottomlineFeeDom(e={},t="meta-report"){const a=!!e.metaReportShowBottomline,n=!!e.metaReportFeeEnabled,r=e.metaReportFeeMode||"",o=resolveMetaReportFeeMode(e),s=e.metaReportFeePercent??20,i=e.metaReportMarketingFeeAmount??0,l=document.getElementById(`${t}-setting-bottomline`);l&&(l.checked=a);const c=document.getElementById(`${t}-fee-nested`);c?.classList.toggle("is-hidden",!a),c&&(c.dataset.feeMode=r,c.dataset.feeEnabled=n?"true":"false",c.dataset.feePercent=String(s),c.dataset.marketingFee=String(i)),document.querySelectorAll(`input[name="${t}-fee-mode"]`).forEach(p=>{p.checked=p.value===o});const d=metaReportUsesInlineFeeValue(t),u=document.getElementById(`${t}-fee-value`);u&&(u.innerHTML=metaReportFeeValueBlockHtml(t,o,s,i,{inline:d}),bindMetaReportFeeValueInputEnterKey(t)),syncMetaReportFeeSelectionState(t),t==="meta-report"&&updateMetaReportBottomlineFeeSummary(e,t)}function bindMetaReportFeeValueInputEnterKey(e){const t=document.getElementById(`${e}-setting-fee-percent`)||document.getElementById(`${e}-setting-marketing-fee`);t&&(t.onkeydown=a=>{a.key==="Enter"&&(a.preventDefault(),document.getElementById(`${e}-fee-save`)?.click())})}function bindMetaReportBottomlineFeeEvents(e,t,a){const n=a||((l,c)=>saveMetaReportClientSettings(e,l,c)),r=document.getElementById(`${t}-fee-edit`);r&&(r.onclick=()=>setMetaReportClientSettingsExpanded(t,!0));const o=document.getElementById(`${t}-fee-done`);o&&(o.onclick=()=>{const l=metaReportsState.clientPayload?.settings||{};syncMetaReportBottomlineFeeDom(l,t),setMetaReportClientSettingsExpanded(t,!1),updateMetaReportBottomlineFeeSummary(l,t)});const s=document.getElementById(`${t}-setting-bottomline`);s&&(s.onchange=()=>{const l=s.checked;n({metaReportShowBottomline:l},()=>{s.checked=!l})}),document.querySelectorAll(`input[name="${t}-fee-mode"]`).forEach(l=>{l.onchange=()=>{if(!l.checked)return;const c=document.getElementById(`${t}-fee-nested`),d=metaReportUsesInlineFeeValue(t),u=document.getElementById(`${t}-fee-value`);u&&c&&(u.innerHTML=metaReportFeeValueBlockHtml(t,l.value||"",c.dataset.feePercent??20,c.dataset.marketingFee??0,{inline:d}),bindMetaReportFeeValueInputEnterKey(t)),bindMetaReportFeeAmountInputs(t),syncMetaReportFeeSelectionState(t)}}),bindMetaReportFeeValueInputEnterKey(t),bindMetaReportFeeDraftTracking(t);const i=document.getElementById(`${t}-fee-save`);i&&(i.onclick=async()=>{if(i.disabled)return;const l=document.getElementById(`${t}-fee-nested`),c=l?.querySelector(`input[name="${t}-fee-mode"]:checked`),d=c&&c.value||null,u={metaReportFeeMode:d};if(d==="performance"){const h=document.getElementById(`${t}-setting-fee-percent`);let m=Number(h?.value);Number.isFinite(m)||(m=20),m=Math.min(100,Math.max(0,m)),h&&(h.value=String(m)),u.metaReportFeePercent=m}else if(d==="marketing"){const h=document.getElementById(`${t}-setting-marketing-fee`);let m=Number(h?.value);Number.isFinite(m)||(m=0),m=Math.max(0,m),h&&(h.value=String(m)),u.metaReportMarketingFeeAmount=m}const p=i.textContent;i.disabled=!0,i.textContent="Saving\u2026",i.classList.remove("is-dirty");try{await n(u,()=>syncMetaReportBottomlineFeeDom({metaReportShowBottomline:s?s.checked:!0,metaReportFeeMode:l?.dataset.feeMode||null,metaReportFeePercent:Number(l?.dataset.feePercent)||20,metaReportMarketingFeeAmount:Number(l?.dataset.marketingFee)||0},t)),syncMetaReportFeeSelectionState(t)}finally{i.disabled=!1,i.textContent=p,syncMetaReportFeeSelectionState(t)}})}function renderMetaReportSaveIndicator(e,t=!1){return`
    <span class="meta-report-save-indicator${t?" is-visible":""}" id="${esc(e)}" aria-live="polite">
      <span class="meta-report-save-indicator-spinner"></span> Saving\u2026
    </span>
  `}function renderMetaReportSwitch(e,t,a,n=!1,{hideLabel:r=!1}={}){return`
    <div class="meta-report-switch">
      <label class="meta-report-switch-track" for="${esc(e)}" aria-label="${esc(a)}">
        <input type="checkbox" class="meta-report-switch-input" id="${esc(e)}"${t?" checked":""}${n?" disabled":""} />
        <span class="meta-report-switch-thumb" aria-hidden="true"></span>
      </label>
      ${r?"":`<span class="meta-report-switch-label">${esc(a)}</span>`}
    </div>
  `}function renderMetaCvEditorSkeleton(e,t,a={}){return`
    <h3>${esc(e.accountName)}</h3>
    <p class="meta-cv-editor-sub">
      ${esc(metaMonthLabel(t))}
      \xB7 ${esc(a.status||"empty")}
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
  `}function renderMetaCvEditor(e){const t=metaReportsState.customValues,a=(e.clients||[]).find(g=>g.clientId===t.selectedClientId),n=t.selectedMonthKey;if(!a||!n)return`
      <div class="meta-cv-editor-empty">
        Select a client month pill to edit won leads, average lead value, and average profit.
      </div>
    `;const r=a.months?.[n]||{};if(t.loadingEditor)return renderMetaCvEditorSkeleton(a,n,r);const o=t.editorPayload?.months?.[n]||null,s=a.metaReportShowBottomline,i=r.wonLeads!=null?r.wonLeads:o?.inputs?.wonLeads??o?.topline?.wonLeads??"",l=r.avgLeadValue!=null?r.avgLeadValue:o?.inputs?.avgLeadValue??o?.topline?.avgLeadValue??"",c=r.avgProfitPerWon!=null?r.avgProfitPerWon:o?.inputs?.avgProfitPerWon??"",d=metaReportsState.customValues.draftInputs,u=d?.wonLeads??i,p=d?.avgLeadValue??l,h=d?.avgProfitPerWon??c,m=t.settingsSaving&&t.settingsSavingScope==="report";return`
    <h3>${esc(a.accountName)}</h3>
    <p class="meta-cv-editor-sub">
      ${esc(metaMonthLabel(n))}
      \xB7 ${esc(r.status||"empty")}
      \xB7 ${r.updatedAt?`Updated ${esc(metaCvFormatUpdatedAt(r.updatedAt))}`:"Not updated yet"}
    </p>
    <div class="meta-cv-editor-grid">
      <label>Client
        <select id="meta-cv-client-select" class="admin-select">
          ${(e.clients||[]).map(g=>`
            <option value="${esc(g.clientId)}"${g.clientId===a.clientId?" selected":""}>${esc(g.accountName)}</option>
          `).join("")}
        </select>
      </label>
      <label>Month
        <select id="meta-cv-month-select" class="admin-select">
          ${(e.monthKeys||[]).map(g=>`
            <option value="${esc(g)}"${g===n?" selected":""}>${esc(metaMonthLabel(g))}</option>
          `).join("")}
        </select>
      </label>
      <label>Won leads
        <input type="number" step="any" id="meta-cv-won-leads" value="${esc(u)}" />
      </label>
      <label>Avg lead value
        <input type="number" step="any" id="meta-cv-avg-lead-value" value="${esc(p)}" />
      </label>
      <label>Avg profit per won${s?"":" (optional)"}
        <input type="number" step="any" id="meta-cv-avg-profit" value="${esc(h)}" />
      </label>
    </div>
    <div class="meta-report-settings-group meta-report-settings-group--stacked meta-cv-client-settings${m?" is-saving":""}">
      ${renderMetaReportSaveIndicator("meta-cv-settings-status",m)}
      ${renderMetaReportBottomlineFeeSettings(a,"meta-cv",{variant:"cv"})}
    </div>
    <div class="meta-cv-editor-actions">
      <div class="meta-cv-editor-actions-left">
        <a class="admin-btn admin-btn--ghost" href="/admin/meta-reports/${encodeURIComponent(a.clientId)}">Open full editor</a>
        ${renderMetaReportSaveIndicator("meta-cv-save-indicator",t.saving)}
      </div>
      <button type="button" class="admin-btn admin-btn--primary" id="meta-cv-save"${t.saving||t.loadingEditor||t.settingsSaving?" disabled":""}>
        ${t.saving?"Saving\u2026":"Save values"}
      </button>
    </div>
  `}function renderMetaReportsCustomValuesPage(e){const t=e.summary||{},a=(e.years||[]).map(n=>`
    <option value="${esc(n.year)}"${Number(e.year)===Number(n.year)?" selected":""}>${esc(n.year)}</option>
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
            <select id="meta-cv-year" class="admin-select">${a}</select>
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
  `}function refreshMetaCvListAndEditor(){const e=metaReportsState.customValues.overview;if(!e)return;const t=document.getElementById("meta-cv-client-list");t&&(t.innerHTML=renderMetaCvClientRows(e));const a=document.getElementById("meta-cv-editor");a&&(a.innerHTML=renderMetaCvEditor(e)),metaReportsState.customValues.draftInputs=null,bindMetaCvEditorEvents(),bindMetaCvListEvents()}function setMetaCvSavePending(e){metaReportsState.customValues.saving=e;const t=document.getElementById("meta-cv-save"),a=document.getElementById("meta-cv-save-indicator");a&&a.classList.toggle("is-visible",e),t&&(t.disabled=e||metaReportsState.customValues.loadingEditor||metaReportsState.customValues.settingsSaving,t.textContent=e?"Saving\u2026":"Save values")}function setMetaCvSettingsSaving(e,t="report"){metaReportsState.customValues.settingsSaving=e,metaReportsState.customValues.settingsSavingScope=e?t:null;const a=e&&t==="report";document.getElementById("meta-cv-settings-status")?.classList.toggle("is-visible",a),document.querySelector(".meta-cv-client-settings")?.classList.toggle("is-saving",a),["meta-cv-setting-bottomline"].forEach(o=>{const s=document.getElementById(o);s&&(s.disabled=a)}),document.querySelectorAll('input[name="meta-cv-fee-mode"]').forEach(o=>{o.disabled=a}),["meta-cv-setting-fee-percent","meta-cv-setting-marketing-fee"].forEach(o=>{const s=document.getElementById(o);s&&(s.disabled=a||s.disabled)});const r=document.getElementById("meta-cv-save");r&&(r.disabled=e||metaReportsState.customValues.saving||metaReportsState.customValues.loadingEditor)}function classifyMetaCvMonthStatus(e,t=!1){if(!e)return"empty";const a=e.wonLeads!=null,n=e.avgLeadValue!=null,r=e.avgProfitPerWon!=null;return a&&n&&(!t||r)?"complete":a||n||r?"partial":"empty"}function applyMetaCvSaveResult(e,t,a,n){const o=metaReportsState.customValues.overview?.clients?.find(l=>l.clientId===e),s=o?.months?.[t],i=n?.month||{};s&&(s.wonLeads=i.wonLeads??a.wonLeads,s.avgLeadValue=i.avgLeadValue??a.avgLeadValue,s.avgProfitPerWon=i.avgProfitPerWon??a.avgProfitPerWon,s.status=classifyMetaCvMonthStatus(s,!!o.metaReportShowBottomline),s.updatedAt=s.status==="empty"?null:i.updatedAt||new Date().toISOString()),n?.monthPayload&&(metaReportsState.customValues.editorPayload={...metaReportsState.customValues.editorPayload||{},months:{...metaReportsState.customValues.editorPayload?.months||{},[t]:n.monthPayload}})}async function refreshMetaCvOverviewSilently(){const e=await adminFetch(`/api/meta-reports/custom-values?year=${encodeURIComponent(metaReportsState.selectedYear)}`);metaReportsState.selectedYear=Number(e.year)||metaReportsState.selectedYear,metaReportsState.customValues.overview=e;const t=document.getElementById("meta-cv-client-list");t&&(t.innerHTML=renderMetaCvClientRows(e),bindMetaCvListEvents());const a=document.querySelector(".meta-cv-summary");if(a&&e.summary){const n=e.summary;a.innerHTML=`
      <span class="meta-cv-summary-pill is-complete">${n.completeMonths||0} complete</span>
      <span class="meta-cv-summary-pill is-partial">${n.partialMonths||0} partial</span>
      <span class="meta-cv-summary-pill is-empty">${n.emptyMonths||0} remaining</span>
      <span class="meta-cv-summary-pill">${n.clientCount||0} clients \xB7 ${n.monthCount||0} months</span>
    `}}function collectMetaCvSaveBody(){return{wonLeads:document.getElementById("meta-cv-won-leads")?.value===""?null:Number(document.getElementById("meta-cv-won-leads")?.value),avgLeadValue:document.getElementById("meta-cv-avg-lead-value")?.value===""?null:Number(document.getElementById("meta-cv-avg-lead-value")?.value),avgProfitPerWon:document.getElementById("meta-cv-avg-profit")?.value===""?null:Number(document.getElementById("meta-cv-avg-profit")?.value)}}function syncMetaCvClientSettingsDom(e={}){syncMetaReportBottomlineFeeDom(e,"meta-cv")}async function saveMetaCvClientSettings(e,t,a){setMetaCvSettingsSaving(!0,"report");try{const n=metaReportsState.customValues.selectedMonthKey,r=await patchMetaReportSettings(e,{...t,monthKey:n||void 0}),s=metaReportsState.customValues.overview?.clients?.find(i=>i.clientId===e);s&&r.settings&&(s.metaReportShowBottomline=!!r.settings.metaReportShowBottomline,s.metaReportFeeEnabled=!!r.settings.metaReportFeeEnabled,s.metaReportFeeMode=r.settings.metaReportFeeMode||null,s.metaReportFeePercent=r.settings.metaReportFeePercent??20,s.metaReportMarketingFeeAmount=r.settings.metaReportMarketingFeeAmount??0),r.monthPayload&&n&&(metaReportsState.customValues.editorPayload={...metaReportsState.customValues.editorPayload||{},months:{...metaReportsState.customValues.editorPayload?.months||{},[n]:r.monthPayload}}),setMetaCvSettingsSaving(!1),syncMetaCvClientSettingsDom(r.settings||{}),showToast(describeMetaReportSettingsChange(t,r.settings||{}),"success")}catch(n){showToast(n.message||"Update failed","error"),a&&a(),setMetaCvSettingsSaving(!1)}}function bindMetaCvSettingsEvents(e){bindMetaReportBottomlineFeeEvents(e,"meta-cv",(t,a)=>saveMetaCvClientSettings(e,t,a))}async function selectMetaCvMonth(e,t,{reloadEditor:a=!0}={}){if(metaReportsState.customValues.selectedClientId=e,metaReportsState.customValues.selectedMonthKey=t,refreshMetaCvListAndEditor(),!!a){metaReportsState.customValues.loadingEditor=!0,refreshMetaCvListAndEditor();try{const n=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(e)}/months/${encodeURIComponent(t)}`);metaReportsState.customValues.selectedClientId===e&&metaReportsState.customValues.selectedMonthKey===t&&(metaReportsState.customValues.editorPayload={...metaReportsState.customValues.editorPayload||{},months:{...metaReportsState.customValues.editorPayload?.months||{},[t]:n.monthPayload}})}catch(n){showToast(n.message||"Failed to load month","error")}finally{metaReportsState.customValues.loadingEditor=!1,refreshMetaCvListAndEditor()}}}function bindMetaCvListEvents(){document.querySelectorAll("[data-meta-cv-month]").forEach(e=>{e.onclick=()=>{selectMetaCvMonth(e.getAttribute("data-meta-cv-client"),e.getAttribute("data-meta-cv-month"))}})}function bindMetaCvEditorEvents(){const e=metaReportsState.customValues.selectedClientId;e&&bindMetaCvSettingsEvents(e);const t=document.getElementById("meta-cv-client-select"),a=document.getElementById("meta-cv-month-select");t&&(t.onchange=()=>{const r=metaReportsState.customValues.selectedMonthKey||metaReportsState.customValues.overview?.monthKeys?.slice(-1)[0];r&&selectMetaCvMonth(t.value,r)}),a&&(a.onchange=()=>{const r=metaReportsState.customValues.selectedClientId;r&&selectMetaCvMonth(r,a.value)});const n=document.getElementById("meta-cv-save");n&&(n.onclick=async()=>{const r=metaReportsState.customValues.selectedClientId,o=metaReportsState.customValues.selectedMonthKey;if(!r||!o)return;const s=collectMetaCvSaveBody();setMetaCvSavePending(!0);try{const i=await adminFetch(`/api/meta-reports/clients/${encodeURIComponent(r)}/months/${encodeURIComponent(o)}`,{method:"PUT",body:JSON.stringify(s)});applyMetaCvSaveResult(r,o,s,i),metaReportsState.customValues.draftInputs=s,setMetaCvSavePending(!1),refreshMetaCvListAndEditor(),showToast("Custom values saved","success"),await refreshMetaCvOverviewSilently()}catch(i){showToast(i.message||"Save failed","error"),setMetaCvSavePending(!1)}})}function bindMetaReportsCustomValuesEvents(e){const t=document.getElementById("meta-cv-year");t&&(t.onchange=async()=>{const n=metaReportsState.selectedYear,r=Number(t.value);if(r!==n){metaReportsState.selectedYear=r,metaReportsState.customValues.selectedClientId=null,metaReportsState.customValues.selectedMonthKey=null,metaReportsState.customValues.editorPayload=null,setMetaCvYearLoading(r,!0);try{await loadMetaReportsCustomValuesPage({silent:!0})}catch(o){metaReportsState.selectedYear=n,t&&(t.value=String(n)),await loadMetaReportsCustomValuesPage({silent:!0,keepSelection:!0}),showToast(o.message||"Load failed","error")}finally{setMetaCvYearLoading(r,!1)}}});const a=document.getElementById("meta-cv-search");a&&(a.oninput=()=>{metaReportsState.customValues.searchQuery=a.value;const n=document.getElementById("meta-cv-client-list");n&&(n.innerHTML=renderMetaCvClientRows(e)),bindMetaCvListEvents()}),bindMetaCvListEvents(),bindMetaCvEditorEvents()}async function loadMetaReportsCustomValuesPage({silent:e=!1,keepSelection:t=!1}={}){const a=document.getElementById("dashboard");if(!a)return;const n=await fetchStaffMe();if(!n){window.location.href=`/login?next=${encodeURIComponent(window.location.pathname)}`;return}currentStaffUser=n,!metaReportsState.customValues.mounted&&!e&&(a.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-custom"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading custom values...</p></div>')}
    `);try{const r=await adminFetch(`/api/meta-reports/custom-values?year=${encodeURIComponent(metaReportsState.selectedYear)}`);metaReportsState.selectedYear=Number(r.year)||metaReportsState.selectedYear,metaReportsState.customValues.overview=r,t||(r.clients||[]).some(s=>s.clientId===metaReportsState.customValues.selectedClientId)||(metaReportsState.customValues.selectedClientId=null,metaReportsState.customValues.selectedMonthKey=null,metaReportsState.customValues.editorPayload=null),a.innerHTML=renderMetaReportsCustomValuesPage(r),metaReportsState.customValues.mounted=!0,metaReportsState.customValues.saving=!1,bindMetaReportsCustomValuesEvents(r)}catch(r){if(!metaReportsState.customValues.mounted)a.innerHTML=`
        ${renderBrandTopbar(renderStaffAdminChrome("meta-reports-custom"))}
        ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(r.message)}</div>`)}
      `;else{if(e)throw r;showToast(r.message||"Load failed","error")}}}function renderAdminHubPage(e){const t=e.length,a=currentStaffUser?`
          <a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta">Meta sync log</a>
  `:"",n=isStaffAdmin()?`
          ${a}
          <button class="admin-btn" type="button" onclick="syncAllClients(this)">${ICON_SYNC} Sync all</button>
          <button class="admin-btn admin-btn--primary" type="button" onclick="focusAddClient()">${ICON_PLUS} Add client</button>
  `:a;return`
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
          ${n}
        </div>
      </div>
      <div class="client-grid" id="client-grid">
        ${t?e.map(r=>renderClientCard(r)).join(""):`<div class="hub-empty">${isStaffAdmin()?"No clients yet. Create your first client below.":"No clients yet."}</div>`}
        <div class="hub-empty" id="hub-no-results" style="display:none">No clients match your search.</div>
      </div>
      ${isStaffAdmin()?renderAddClientPanel():""}
    </div>
    <div class="brand-footer">
      Dashboard by Cenhub \xB7 Holstebro
    </div>
    `)}
  `}function focusAddClient(){const e=document.getElementById("add-client-panel");e&&(e.open=!0);const t=document.getElementById("new-account-name");t&&(t.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>t.focus({preventScroll:!0}),350))}function copyAdminUrl(e){const t=`${window.location.origin}/admin/${e}`;navigator.clipboard.writeText(t).then(()=>showToast("Admin URL copied","success"),()=>showToast("Could not copy URL","error"))}function closeCardMenus(){document.querySelectorAll(".card-menu.open").forEach(e=>e.classList.remove("open"))}function toggleCardMenu(e,t){t.stopPropagation();const a=document.getElementById(`card-menu-${e}`);if(!a)return;const n=!a.classList.contains("open");closeCardMenus(),n&&a.classList.add("open")}function renderCardMenu(e,t){const a=t||e,n=isStaffAdmin()?`<button type="button" role="menuitem" class="card-menu-item--danger" onclick="closeCardMenus(); deleteClient('${e}');">Delete client</button>`:"";return`
    <div class="card-menu" id="card-menu-${e}" data-client-id="${e}">
      <button
        type="button"
        class="icon-btn card-menu-trigger"
        aria-label="More actions for ${esc(a)}"
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
        ${n}
      </div>
    </div>
  `}function renderClientCard(e){const t=e.previewKpis||{},a=e.pipelineMode==="3-pipeline"?"3 pipelines":"2 pipelines",n=clientNeedsAction(e.status);return`
    <article class="client-card${n?" client-card--needs-action":""}" data-client-id="${e.clientId}" data-search="${esc(`${e.accountName} ${e.clientId}`.toLowerCase())}">
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
        <span>${a}</span>
        <span class="client-card-meta-divider" aria-hidden="true">\xB7</span>
        <span data-sync-meta>${formatRelativeSync(e.lastSyncAt,e.status)}</span>
      </div>
      ${n?`<p class="client-card-action-hint">${esc(clientActionHint(e.status))}</p>`:""}
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
  `}function filterHubCards(){const e=(document.getElementById("hub-search")?.value||"").trim().toLowerCase();let t=0;document.querySelectorAll("#client-grid .client-card").forEach(n=>{const r=!e||(n.dataset.search||"").includes(e);n.style.display=r?"":"none",r&&(t+=1)});const a=document.getElementById("hub-no-results");a&&(a.style.display=e&&!t?"":"none")}function renderAddClientPanel(){return`
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
    `)}`;try{const a=await adminFetch("/api/clients");e.innerHTML=renderAdminHubPage(a.clients||[])}catch(a){e.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("clients"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(a.message)}</div>`)}
    `}}}let slugCheckTimer=null;function suggestNewClientSlug(){const e=document.getElementById("new-account-name")?.value||"",t=document.getElementById("new-client-slug");!t||t.dataset.userEdited==="true"||(t.value=e.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),checkNewClientSlug())}function checkNewClientSlug(){const e=document.getElementById("new-client-slug");e&&(e.dataset.userEdited="true"),clearTimeout(slugCheckTimer),slugCheckTimer=setTimeout(async()=>{const t=document.getElementById("new-client-slug")?.value||"",a=document.getElementById("slug-status");if(!a||!t){a&&(a.textContent="");return}try{const n=await adminFetch(`/api/clients/check-slug?slug=${encodeURIComponent(t)}`);a.className=`slug-status ${n.available?"ok":"bad"}`,a.textContent=n.available?`Available \xB7 ${n.adminUrl}`:`Unavailable (${n.reason||"taken"})`}catch(n){a.className="slug-status bad",a.textContent=n.message}},300)}async function createClient(){const e=document.getElementById("new-account-name")?.value?.trim(),t=document.getElementById("new-client-slug")?.value?.trim(),a=document.getElementById("new-location-id")?.value?.trim();if(!e||!t){window.alert("Account name and slug are required.");return}try{await adminFetch("/api/clients",{method:"POST",body:JSON.stringify({accountName:e,clientId:t,locationId:a||null})}),showToast("Client created","success"),window.location.href=`/admin/${encodeURIComponent(t)}`}catch(n){showToast(n.message,"error")}}let hubSyncPollTimer=null,hubSyncPendingIds=new Set,hubSyncPollStartedAt=0,hubSyncBaselineAt=new Map;function stopHubSyncPolling(){hubSyncPollTimer&&(clearInterval(hubSyncPollTimer),hubSyncPollTimer=null),hubSyncPendingIds=new Set,hubSyncPollStartedAt=0,hubSyncBaselineAt=new Map}function isClientSyncing(e){return e.status==="syncing"||e.lastSyncStatus==="syncing"}function hubBatchStillPending(e){if(!hubSyncPendingIds.size)return!1;const t=new Map((e||[]).map(a=>[a.clientId,a]));for(const a of hubSyncPendingIds){const n=t.get(a);if(!n)continue;if(isClientSyncing(n))return!0;if(n.lastSyncStatus==="error")continue;if(hubSyncBaselineAt.get(a)===n.lastSyncAt)return!0}return!1}async function pollHubSyncProgress(){if(!IS_ADMIN_HUB||!document.getElementById("client-grid")){stopHubSyncPolling();return}if(hubSyncPollStartedAt&&Date.now()-hubSyncPollStartedAt>900*1e3){stopHubSyncPolling(),showToast("Some sync jobs are still running. Refresh the page in a minute.","error");return}try{const t=(await adminFetch("/api/clients")).clients||[];if(updateHubCardsFromClients(t),hubBatchStillPending(t))return;const a=new Set(hubSyncPendingIds);stopHubSyncPolling();const n=document.getElementById("dashboard");n&&(n.innerHTML=renderAdminHubPage(t));const r=t.filter(o=>a.has(o.clientId)&&o.lastSyncStatus==="error");r.length?showToast(`${r.length} sync(s) failed`,"error"):showToast("All clients synced","success")}catch{}}function startHubSyncPolling(e=[],t=[]){stopHubSyncPolling(),hubSyncPendingIds=new Set(e),hubSyncPollStartedAt=Date.now(),hubSyncBaselineAt=new Map((t||[]).filter(a=>e.includes(a.clientId)).map(a=>[a.clientId,a.lastSyncAt])),markHubCardsSyncing(e),pollHubSyncProgress(),hubSyncPollTimer=setInterval(pollHubSyncProgress,3e3)}function markHubCardsSyncing(e=[]){e.forEach(t=>{const a=document.querySelector(`.client-card[data-client-id="${t}"]`);if(!a)return;const n=a.querySelector(".status-badge");n&&(n.className="status-badge status-syncing",n.textContent=statusLabel("syncing"));const r=a.querySelector("[data-sync-meta]");r&&(r.textContent="Syncing now...")})}function updateHubCardsFromClients(e){(e||[]).forEach(t=>{const a=document.querySelector(`.client-card[data-client-id="${t.clientId}"]`);if(!a)return;const n=a.querySelector(".status-badge");n&&(n.className=`status-badge status-${t.status}`,n.textContent=statusLabel(t.status));const r=a.querySelector("[data-sync-meta]");r&&(r.textContent=formatRelativeSync(t.lastSyncAt,t.status))})}async function syncAllClients(e){e&&(e.disabled=!0);try{showToast("Syncing all clients...");const t=await adminFetch("/api/clients",{method:"POST",body:JSON.stringify({action:"sync-all"})});if(t.queued){const n=t.count??(t.clientIds||[]).length;showToast(`Syncing ${n} client${n===1?"":"s"} in background`,"success");const r=await adminFetch("/api/clients");startHubSyncPolling(t.clientIds||[],r.clients||[]);return}const a=(t.results||[]).filter(n=>!n.success);a.length?showToast(`${a.length} sync(s) failed`,"error"):showToast("All clients synced","success"),await loadAdminHub()}catch(t){showToast(t.message,"error")}finally{e&&(e.disabled=!1)}}async function deleteClient(e){const t=e;if(!window.confirm(`Delete "${t}" permanently?

This removes the account, GHL token, and all synced snapshot data. This cannot be undone.`))return;if(window.prompt(`Type "${e}" to confirm deletion:`)!==e){showToast("Deletion cancelled \u2014 slug did not match.","error");return}try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"DELETE"}),showToast(`Deleted ${e}`,"success"),IS_ADMIN_HUB?await loadAdminHub():window.location.href="/admin"}catch(r){showToast(r.message,"error")}}async function syncClient(e,t){t&&(t.disabled=!0,t.textContent="Syncing...");try{await adminFetch(`/api/clients/${encodeURIComponent(e)}/sync`,{method:"POST",body:"{}"}),showToast("Sync completed","success"),IS_ADMIN_HUB?await loadAdminHub():IS_ADMIN_CLIENT?(await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0,{background:!0})):loadDashboard(!0,{background:!0})}catch(a){showToast(a.message,"error")}finally{if(t){t.disabled=!1;const a=t.dataset.syncLabel||"Sync";t.innerHTML=t.dataset.syncLabel?`${ICON_SYNC} ${a}`:a}}}function getMetricsModelLabels(e,t=setupPipelines){const a=new Map((t||[]).map(n=>[n.id,n.name]));return e.dedupeEnabled?{typeLabel:"Funnel + deduplication",winLabel:`Win pipeline: ${a.get(e.winPipelineId)||e.winPipelineId||"\u2014"}`}:e.winPipelineId?{typeLabel:"Simple (single win pipeline)",winLabel:`Win pipeline: ${a.get(e.winPipelineId)||e.winPipelineId}`}:{typeLabel:"Simple (no deduplication)",winLabel:"All won opportunities"}}const ICON_LAYER='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',ICON_MERGE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="15" r="2.4"/><path d="M6 8.4V15.6"/><path d="M8.2 6.4C14 6.4 14 12.6 15.8 13.4"/></svg>',ICON_TARGET='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',ICON_LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>',ICON_UNLOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 017.8-1.2"/></svg>',ICON_TAG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 12.7L12.7 20.6a2 2 0 01-2.8 0l-7-7a2 2 0 010-2.8L10.8 3H19a2 2 0 012 2v7.7z"/><circle cx="15" cy="8" r="1.2"/></svg>',ICON_HASH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/></svg>',ICON_EDIT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',ICON_WARNING='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.6 18a1.5 1.5 0 001.3 2.2h16.2a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-3.4 0z"/><path d="M12 9v4"/><path d="M12 16.5h.01"/></svg>';function renderMetricsModelPanel(e){const t=getMetricsModelLabels(e),a=!e.metricsModelSetAt||metricsModelChangeMode,n=a?" is-wizard":" is-locked",r=e.dedupeEnabled?"dedupe":e.winPipelineId?"pipeline":"simple",o=e.metricsModelLockedAt?`Locked since ${new Date(e.metricsModelLockedAt).toLocaleDateString("en-GB")}`:"Editable until first successful sync",s=e.metricsModelLockedAt?"metrics-model-badge is-locked":"metrics-model-badge";return a?`
    <div class="metrics-model-panel${n}">
      <div class="metrics-model-header">
        <div class="metrics-model-heading">
          <h3 class="metrics-model-title">${metricsModelChangeMode?"Change metrics model":"Metrics model"}</h3>
        </div>
      </div>
      <p class="metrics-model-copy">How should wins and revenue be counted for this client?</p>
      <div class="metrics-option-cards">
        <label class="metrics-option-card">
          <input type="radio" name="metrics-model-type" value="simple" ${r==="simple"?"checked":""} onchange="onMetricsModelTypeChange()" />
          <span class="metrics-option-card-top">
            <span class="metrics-option-card-icon">${ICON_LAYER}</span>
            <span class="metrics-option-card-title">Simple</span>
            <span class="metrics-option-card-radio">${ICON_CHECK}</span>
          </span>
          <span class="metrics-option-card-desc">Every won deal counts, from any pipeline. For clients without duplicate opportunities.</span>
        </label>
        <label class="metrics-option-card">
          <input type="radio" name="metrics-model-type" value="dedupe" ${r==="dedupe"?"checked":""} onchange="onMetricsModelTypeChange()" />
          <span class="metrics-option-card-top">
            <span class="metrics-option-card-icon">${ICON_MERGE}</span>
            <span class="metrics-option-card-title">Funnel + dedup</span>
            <span class="metrics-option-card-radio">${ICON_CHECK}</span>
          </span>
          <span class="metrics-option-card-desc">Wins count from one win pipeline only (e.g. Eftersalg). Duplicates are merged by contact.</span>
        </label>
      </div>
      <div class="metrics-model-win-select" id="metrics-win-pipeline-wrap" style="${r==="dedupe"?"":"display:none"}">
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
              <div class="metrics-model-fact-value">${o}</div>
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
    `}function updateMetricsApplyState(){const e=document.getElementById("metrics-apply-btn");if(!e||!metricsModelChangeMode)return;const t=!!document.getElementById("metrics-acknowledge-impact")?.checked,a=document.getElementById("metrics-confirm-slug")?.value?.trim()||"";e.disabled=!(t&&a===CLIENT_SLUG)}function onMetricsModelTypeChange(){const e=document.querySelector('input[name="metrics-model-type"]:checked')?.value,t=document.getElementById("metrics-win-pipeline-wrap");t&&(t.style.display=e==="dedupe"?"":"none")}async function saveMetricsModel(){const t=(document.querySelector('input[name="metrics-model-type"]:checked')?.value||"simple")==="dedupe",a=t&&document.getElementById("metrics-win-pipeline")?.value||null;if(t&&!a){showToast("Select a win pipeline for deduplication mode.","error");return}const n={dedupeEnabled:t,winPipelineId:a,afterSalesPipelineId:t?a:void 0};metricsModelChangeMode&&(n.confirmSlug=document.getElementById("metrics-confirm-slug")?.value?.trim()||"",n.acknowledgeImpact=!!document.getElementById("metrics-acknowledge-impact")?.checked);try{await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}/metrics-model`,{method:"POST",body:JSON.stringify(n)}),metricsModelChangeMode=!1,showToast("Metrics model saved","success"),await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0,{background:!0})}catch(r){showToast(r.message,"error")}}function startMetricsModelChange(){if(metricsModelChangeMode=!0,setupAccount){const e=document.getElementById("setup-panel-mount");e&&(e.innerHTML=renderClientSetupPanel(setupAccount))}}function cancelMetricsModelChange(){if(metricsModelChangeMode=!1,setupAccount){const e=document.getElementById("setup-panel-mount");e&&(e.innerHTML=renderClientSetupPanel(setupAccount))}}function renderPipelineSelect(e,t,a,n,r=""){return`
    <div class="field-group">
      <label for="${e}">${t}</label>
      <select id="${e}">
        <option value="">\u2014 Select pipeline \u2014</option>
        ${n.map(o=>`
          <option value="${esc(o.id)}" ${o.id===a?"selected":""}>${esc(o.name)}</option>
        `).join("")}
      </select>
      ${r?`<p class="field-hint">${esc(r)}</p>`:""}
    </div>
  `}function getSetupProgressSteps(e){return[{id:"metrics",label:"Metrics",done:!!e.metricsModelSetAt},{id:"ghl",label:"GHL",done:!!(e.hasGhlToken&&e.locationId)},{id:"pipelines",label:"Pipelines",done:!!(e.newLeadsPipelineId&&e.salesPipelineId)},{id:"meta",label:"Meta",done:e.metaSyncStatus==="ok",partial:!!(e.metaAdAccountId&&e.metaSyncStatus!=="ok")}]}function renderSetupProgressStrip(e){const t=getSetupProgressSteps(e),a='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';return`
    <nav class="setup-progress" aria-label="Setup progress">
      ${t.map((n,r)=>{const o=n.done?" is-done":n.partial?" is-partial":"",s=n.done?`<span class="setup-progress-mark">${a}</span>`:`<span class="setup-progress-mark">${r+1}</span>`;return`
          <button type="button" class="setup-progress-step${o}" onclick="scrollToSetupSection('${n.id}')">
            ${s}
            <span class="setup-progress-label">${n.label}</span>
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
  `}async function initAdminClientPage(){if(await requireStaffAuth()){renderAdminClientShell();try{await loadSetupAccount()}catch(t){const a=document.getElementById("setup-panel-mount");a&&(a.innerHTML=`<div class="note" style="padding:24px">${esc(t.message)}</div>`);return}accountCanPreviewDashboard(setupAccount)&&(ensureChartsVisible(),loadDashboard(!0))}}async function loadSetupAccount(){if(IS_ADMIN_CLIENT)try{setupAccount=(await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}`)).account,setupAccount.accessKey&&!CLIENT_ACCESS_KEY&&(CLIENT_ACCESS_KEY=setupAccount.accessKey),setupAccount.newLeadsPipelineId&&!setupPipelines.length&&await fetchSetupPipelines(!0);const t=document.getElementById("setup-panel-mount");t&&(t.innerHTML=renderClientSetupPanel(setupAccount))}catch(e){const t=document.getElementById("setup-panel-mount");throw t&&(t.innerHTML=`<div class="note" style="padding:24px">${esc(e.message)}</div>`),showToast(e.message,"error"),e}}async function fetchSetupPipelines(e=!1,t=null){t&&(t.disabled=!0,t.textContent="Fetching...");try{setupPipelines=(await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}/sync-pipelines`,{method:"POST",body:"{}"})).pipelines||[],e||showToast(`${setupPipelines.length} pipeline(s) loaded`,"success"),await loadSetupAccount()}catch(a){showToast(a.message,"error")}finally{if(t){t.disabled=!1;const a=t.dataset.syncLabel||"Fetch pipelines from GHL";t.innerHTML=`${ICON_SYNC} ${a}`}}}function collectMetaSetupPayload(){const e={metaAdAccountId:document.getElementById("setup-meta-ad-account-id")?.value?.trim()||null,metaPageId:document.getElementById("setup-meta-page-id")?.value?.trim()||null,metaPixelId:document.getElementById("setup-meta-pixel-id")?.value?.trim()||null,facebookClientId:document.getElementById("setup-facebook-client-id")?.value?.trim()||null,fbLeadSyncEnabled:!!document.getElementById("setup-fb-lead-sync-enabled")?.checked,ghlFbLeadFieldId:document.getElementById("setup-ghl-fb-lead-field-id")?.value?.trim()||null},t=document.getElementById("setup-meta-system-token")?.value?.trim();t&&(e.metaSystemUserToken=t);const a=document.getElementById("setup-meta-page-token")?.value?.trim();return a&&(e.metaPageAccessToken=a),e}async function clearMetaSystemUserToken(e){try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"PUT",body:JSON.stringify({clearMetaSystemUserToken:!0})}),showToast("Saved Meta token override cleared \u2014 using Vercel env token","success"),await loadSetupAccount()}catch(t){showToast(t.message,"error")}}async function saveSetupAccount(){try{const e=document.getElementById("setup-account-name")?.value?.trim();if(!e){showToast("Dashboard heading is required.","error");return}const t={accountName:e,locationId:document.getElementById("setup-location-id")?.value?.trim()||null,timezone:document.getElementById("setup-timezone")?.value?.trim()||"Europe/Copenhagen",newLeadsPipelineId:document.getElementById("setup-new-leads")?.value||null,salesPipelineId:document.getElementById("setup-sales")?.value||null,afterSalesPipelineId:document.getElementById("setup-after-sales")?.value||null,readyForGhl:!!document.getElementById("setup-ready-ghl")?.checked,...collectMetaSetupPayload()},a=document.getElementById("setup-ghl-token")?.value?.trim();a&&(t.ghlToken=a),await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}`,{method:"PUT",body:JSON.stringify(t)}),showToast("Account saved","success"),await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0)}catch(e){showToast(e.message,"error")}}async function syncMetaMetricsClient(e){try{const t=collectMetaSetupPayload();if(!t.metaAdAccountId){showToast("Enter a Meta Ad Account ID first.","error");return}showToast("Saving Meta settings and syncing\u2026","info"),document.getElementById("setup-meta-system-token")?.value?.trim()||(t.clearMetaSystemUserToken=!0);const n=await adminFetch(`/api/clients/${encodeURIComponent(e)}/sync-meta`,{method:"POST",body:JSON.stringify(t)});if(n.skipped)showToast(n.reason||"Meta sync skipped","error");else{let r="Meta metrics synced";n.tokenSource&&(r+=` (${n.tokenSource} token)`),n.ignoredAccountOverride&&(r+=" \u2014 cleared invalid saved token override"),showToast(r,"success")}await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0)}catch(t){showToast(t.message,"error"),await loadSetupAccount()}}(function(t){const a=["#ff6a00","#138b53","#0085f2","#dc640a","#833b08","#a07868","#ff9147","#6b5348"],n={open:"#0085f2",won:"#138b53",lost:"#dc640a",abandoned:"#a07868"};function r(f){const v=String(f).match(/^(\d{4})-W(\d{2})$/);if(!v)return null;const y=Number(v[1]),$=Number(v[2]),w=new Date(Date.UTC(y,0,4)),S=w.getUTCDay()||7,L=new Date(w);L.setUTCDate(w.getUTCDate()-S+1);const B=new Date(L);B.setUTCDate(L.getUTCDate()+($-1)*7);const P=new Date(B);return P.setUTCDate(B.getUTCDate()+3),{monday:new Date(B.getUTCFullYear(),B.getUTCMonth(),B.getUTCDate()),thursday:new Date(P.getUTCFullYear(),P.getUTCMonth(),P.getUTCDate())}}function o(f){let v=0;for(let y=1;y<=f.getDate();y+=1)new Date(f.getFullYear(),f.getMonth(),y).getDay()===1&&(v+=1);return v}function s(f){const v=r(f);if(!v)return String(f).replace("-W"," W");const y=v.monday,$=y.toLocaleDateString("da-DK",{month:"short"}).replace(".","").replace(/^\w/u,S=>S.toUpperCase()),w=o(y);return`${$} W${w}`}function i(f){const[v,y]=String(f).split("-");return new Date(Number(v),Number(y)-1,1).toLocaleDateString("da-DK",{month:"short",year:"2-digit"})}function l(f,v=18){const y=String(f);return y.length>v?`${y.slice(0,v-1)}\u2026`:y}function c(){return{text:"#1a1208",muted:"#6b5348",grid:"rgba(26, 18, 8, 0.1)",border:"#e8e0d8",tooltipBg:"#ffffff",tooltipBorder:"#e8e0d8",tooltipText:"#1a1208"}}function d(f,v,y,$){return{labels:f.map(w=>$(w[v])),values:f.map(w=>Number(w[y])||0)}}function u(f){const v=Number(f)||0;return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${Math.round(v/1e3)}K`:v}function p(f){const v=new Map((f.monthlyAdSpend||[]).map(w=>[w.month,Number(w.spend)||0])),y=new Map((f.monthlyRevenue||[]).map(w=>[w.month,Number(w.revenue)||0])),$=[...new Set([...v.keys(),...y.keys()])].sort();return{dualAxis:!0,labels:$.map(w=>i(w)),spendValues:$.map(w=>v.get(w)||0),revenueValues:$.map(w=>y.get(w)||0)}}function h(f,v,y){const $=v.spendValues.some(w=>w>0)||v.revenueValues.some(w=>w>0);return!v.labels.length||!$?null:{type:"bar",data:{labels:v.labels,datasets:[{type:"bar",label:"Ad Spend",data:v.spendValues,backgroundColor:"#ff6a00cc",borderColor:"#ff6a00",borderWidth:2,borderRadius:6,maxBarThickness:42,yAxisID:"y",order:2},{type:"line",label:"Won Revenue",data:v.revenueValues,backgroundColor:"#138b5333",borderColor:"#138b53",borderWidth:2.5,fill:!0,tension:.35,pointRadius:4,pointHoverRadius:6,yAxisID:"y1",order:1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"bottom",align:"center",labels:{color:y.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:y.tooltipBg,borderColor:y.tooltipBorder,borderWidth:1,titleColor:y.tooltipText,bodyColor:y.muted,padding:12,callbacks:{label(w){const S=w.parsed.y??0;return`${w.dataset.label}: Dkr ${Math.round(S).toLocaleString("da-DK")}`}}}},scales:{x:{ticks:{color:y.muted,maxRotation:45,minRotation:0},grid:{color:y.grid},border:{color:y.border}},y:{type:"linear",position:"left",title:{display:!0,text:"Ad Spend (Dkr)",color:"#ff6a00",font:{size:11,weight:"600"}},ticks:{color:"#ff6a00",callback:u},grid:{color:y.grid},border:{color:y.border},beginAtZero:!0},y1:{type:"linear",position:"right",title:{display:!0,text:"Won Revenue (Dkr)",color:"#138b53",font:{size:11,weight:"600"}},ticks:{color:"#138b53",callback:u},grid:{drawOnChartArea:!1},border:{color:y.border},beginAtZero:!0}}}}}const m={weeklyRevenue:{title:"Won Revenue (Weekly)",defaultType:"area",format:"currency",extract(f){return d(f.weeklyRevenue||[],"week","revenue",s)}},monthlyRevenue:{title:"Won Revenue (Monthly)",defaultType:"area",format:"currency",extract(f){return d(f.monthlyRevenue||[],"month","revenue",i)}},weeklyLeads:{title:"New Leads (Weekly)",defaultType:"area",format:"number",extract(f){return d(f.weeklyLeads||[],"week","count",s)}},monthlyLeads:{title:"New Leads (Monthly)",defaultType:"area",format:"number",extract(f){return d(f.monthlyLeads||[],"month","count",i)}},conversionTrend:{title:"Conversion Rate Trend",defaultType:"line",format:"percent",extract(f){return d(f.monthlyConversion||[],"month","rate",i)}},statusBreakdown:{title:"Opportunity Status",defaultType:"doughnut",format:"number",extract(f){const v=f.chartStatusBreakdown||f.statusBreakdown||{},y=["open","won","lost","abandoned"];return{labels:["Open","Won","Lost","Abandoned"],values:y.map($=>Number(v[$])||0),colors:y.map($=>n[$])}}},marketingSpendComparison:{title:"Facebook Ad Spend",defaultType:"area",format:"currency",extract(f){return d((f.monthlyAdSpend||[]).slice(-8),"month","spend",i)}},monthlyCostPerLead:{title:"Cost per Lead (Monthly)",defaultType:"area",format:"currency",extract(f){return d(f.monthlyCostPerLead||[],"month","cpl",i)}}};function g(f,v,y,$){const w=Number(f)||0,S=Array.isArray(y)?y[$]:v;return S==="ratio"?`${w.toFixed(2)}x`:S==="currency"||v==="currency"?`Dkr ${Math.round(w).toLocaleString("da-DK")}`:S==="percent"||v==="percent"?`${w.toFixed(1)}%`:Math.round(w).toLocaleString("da-DK")}function b(f,v,y){const $=m[f];if(!$)return null;const w=$.extract(v),S=c();if(w.dualAxis||y==="dualAxis")return h($,w,S);if(!w.labels?.length||w.values.every(I=>I===0))return null;const L=["pie","doughnut","polarArea"].includes(y),B=w.colors||w.labels.map((I,D)=>a[D%a.length]),P=y==="area"?"line":y==="horizontalBar"?"bar":y,C=`${a[0]}55`,M=y==="doughnut",E={label:$.title,data:w.values,backgroundColor:L?M?B:B.map(I=>`${I}cc`):w.colors?w.colors.map(I=>`${I}cc`):y==="area"?C:`${a[0]}cc`,borderColor:L?B:w.colors||a[0],borderWidth:L?M?0:1:2,fill:y==="area",tension:.35,borderRadius:L?0:6,maxBarThickness:42,...M?{cutout:"62%",borderAlign:"inner"}:{}};return{type:P,data:{labels:w.labels,datasets:[E]},options:{responsive:!0,maintainAspectRatio:M?!1:L,indexAxis:y==="horizontalBar"?"y":"x",plugins:{legend:{display:L,position:"bottom",align:"center",labels:{color:S.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:S.tooltipBg,borderColor:S.tooltipBorder,borderWidth:1,titleColor:S.tooltipText,bodyColor:S.muted,padding:12,callbacks:{label(I){const D=I.parsed,R=typeof D=="object"?D.y??D.x??0:D??0;return`${I.label}: ${g(R,$.format,w.valueFormats,I.dataIndex)}`}}}},...M?{layout:{padding:8},devicePixelRatio:typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1,elements:{arc:{borderAlign:"inner"}}}:{},scales:L?{}:{x:{ticks:{color:S.muted,maxRotation:45,minRotation:0},grid:{color:S.grid},border:{color:S.border}},y:{ticks:{color:S.muted,callback(I,D){return $.format==="mixed"&&w.valueFormats?.[D]==="ratio"?`${Number(I).toFixed(2)}x`:$.format==="currency"||w.valueFormats?.[D]==="currency"?I>=1e6?`${(I/1e6).toFixed(1)}M`:I>=1e3?`${Math.round(I/1e3)}K`:I:$.format==="percent"?`${I}%`:I}},grid:{color:S.grid},border:{color:S.border},beginAtZero:!0}}}}}t.DashboardCharts={CHART_DEFINITIONS:m,buildChartConfig:b,formatTooltipValue:g}})(window);const STORAGE_KEY=`cenhub_display_${CLIENT_SLUG}`,LEGACY_STORAGE_KEY="suntech-dashboard-display",PIPELINE_KEY="suntech-dashboard-pipelines",DISPLAY_OPTIONS={kpis:{totalRevenue:"Total Revenue",adSpend:"Ad Spend",roas:"ROAS",roasDk:"ROAS (DK)",poas:"POAS",poasDk:"POAS (DK)",costPerLead:"Cost per Lead",costPerWonClient:"Cost per Won Client",clientsWon:"Clients Won",totalLeads:"Total Leads",totalLeadsValue:"Total Leads Value",averageLeadValue:"Average Lead Value",conversionRate:"Conversion Rate",totalBundlinje:"Total Bundlinje",openLeads:"Open Leads",openPipelineValue:"Open Pipeline Value",averageWonDealSize:"Avg Won Deal Size"},sections:{statusBreakdown:"Opportunity Status (Cards)",sourceReport:"Lead Source Report",assigneeReport:"Leads Closed by Assignee",pipelineBreakdown:"Pipeline Breakdown"},charts:{weeklyRevenue:"Won Revenue (Weekly)",monthlyRevenue:"Won Revenue (Monthly)",marketingSpendComparison:"Facebook Ad Spend",monthlyCostPerLead:"Cost per Lead (Monthly)",weeklyLeads:"New Leads (Weekly)",monthlyLeads:"New Leads (Monthly)",conversionTrend:"Conversion Rate Trend",statusBreakdown:"Opportunity Status"},statusItems:{open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned"},columns:{sourceReport:{totalLeads:"Total leads",totalValue:"Total values",open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned",winPct:"Win %"},assigneeReport:{won:"Won",totalLeads:"Total leads",wonValue:"Won revenue",totalValue:"Total value"},pipelineBreakdown:{count:"Leads",won:"Won",monetary:"Value",profit:"Bundlinje",wonValue:"Won revenue"}}},state={pipelineIds:usesClientPipelineDefaults()?[]:loadPipelineSelection(),status:"all",source:"all",assignedTo:"all",dateField:"createdAt",dateFrom:"",dateTo:"",adSpend:"",preset:"all"};let cachedData=null,cachedFacebookMetrics=null,cachedMonthlyAdSpend=null,availablePipelines=[],display=loadDisplayPrefs(),pipelineDefaultsApplied=!1,chartInstances={},chartFieldsCache=null,chartFieldsCacheKey=null,lastFetchedAt=0;const DATA_REFRESH_MS=120*1e3,DATA_FRESH_MS=DATA_REFRESH_MS,CHART_FIELD_KEYS=["weeklyRevenue","monthlyRevenue","weeklyLeads","monthlyLeads","monthlyLeadsValue","monthlyConversion","chartStatusBreakdown"];function getChartCacheKey(){return[[...state.pipelineIds].sort().join(","),state.status,state.source,state.assignedTo,state.dateField,state.dateFrom||"",state.dateTo||""].join("|")}function cacheChartFields(e){chartFieldsCache={},CHART_FIELD_KEYS.forEach(t=>{e[t]!==void 0&&(chartFieldsCache[t]=e[t])}),chartFieldsCacheKey=getChartCacheKey()}function applyChartFieldsCache(e){if(!!!(state.dateFrom||state.dateTo))return cacheChartFields(e),e;if(chartFieldsCache&&chartFieldsCacheKey===getChartCacheKey()){const a={...e};return CHART_FIELD_KEYS.forEach(n=>{chartFieldsCache[n]!==void 0&&(a[n]=chartFieldsCache[n])}),a}return cacheChartFields(e),e}function getDefaultChartPrefs(){const e={};return(window.DashboardCharts?Object.keys(DashboardCharts.CHART_DEFINITIONS):Object.keys(DISPLAY_OPTIONS.charts)).forEach(a=>{e[a]=!0}),e}function destroyCharts(){Object.values(chartInstances).forEach(e=>e.destroy()),chartInstances={}}function mountCharts(e){typeof Chart>"u"||!window.DashboardCharts||(destroyCharts(),Object.keys(DashboardCharts.CHART_DEFINITIONS).forEach(t=>{if(!isVisible("charts",t))return;const a=DashboardCharts.CHART_DEFINITIONS[t],n=document.getElementById(`chart-${t}`);if(!n)return;const o=n.closest(".chart-card")?.querySelector(".chart-empty"),s=a?.defaultType||"bar",i=DashboardCharts.buildChartConfig(t,e,s);if(!i){n.style.display="none",o&&(o.style.display="block");return}n.style.display="block",o&&(o.style.display="none"),chartInstances[t]=new Chart(n,i)}))}function usesClientPipelineDefaults(){return IS_CLIENT_VIEW||IS_ADMIN}function getPipelineStorageKey(){return`cenhub_pipelines_${facebookClientId||CLIENT_SLUG}`}function loadPipelineSelection(){try{const e=JSON.parse(localStorage.getItem(getPipelineStorageKey())||"[]");return Array.isArray(e)?e:[]}catch{return[]}}function getAllPipelineIds(e){return e.map(t=>t.id)}function getDefaultPipelineIds(e,t=[]){const a=getAllPipelineIds(e),n=(t||[]).filter(r=>a.includes(r));return n.length?n:a.length?a:[]}function ensurePipelineDefaults(e,t=[]){if(!e.length)return;if(usesClientPipelineDefaults()){state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0;return}const a=getAllPipelineIds(e);let n=loadPipelineSelection();if(!n.length)try{n=JSON.parse(localStorage.getItem(PIPELINE_KEY)||"[]")}catch{n=[]}!n.length||!pipelineDefaultsApplied?(n.length?(state.pipelineIds=n.filter(r=>a.includes(r)),state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t))):state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0,savePipelineSelection()):state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t),savePipelineSelection())}function ensurePipelineSelectionBeforeFetch(){return state.pipelineIds.length?!0:availablePipelines.length?(state.pipelineIds=getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds),state.pipelineIds.length&&!usesClientPipelineDefaults()&&savePipelineSelection(),state.pipelineIds.length>0):!1}function savePipelineSelection(){localStorage.setItem(getPipelineStorageKey(),JSON.stringify(state.pipelineIds))}function isPipelineSelected(e){return state.pipelineIds.includes(e)}function isAllPipelinesSelected(e){const t=getAllPipelineIds(e);return t.length>0&&t.every(a=>state.pipelineIds.includes(a))}function selectAllPipelines(e){state.pipelineIds=getAllPipelineIds(e),savePipelineSelection()}function clearPipelineSelection(){state.pipelineIds=[],savePipelineSelection()}function setPipelineSelection(e){state.pipelineIds=[...new Set(e)],savePipelineSelection()}function togglePipelineSelection(e){isPipelineSelected(e)?state.pipelineIds=state.pipelineIds.filter(t=>t!==e):state.pipelineIds=[...state.pipelineIds,e],savePipelineSelection()}function formatSelectedPipelines(e){return state.pipelineIds.length?isAllPipelinesSelected(e)?"All pipelines":state.pipelineIds.map(t=>e.find(a=>a.id===t)?.name||t).join(", "):"None selected"}function renderPipelineChips(e){return state.pipelineIds.length?`
    <div class="pipeline-chips">
      ${state.pipelineIds.map(a=>e.find(n=>n.id===a)).filter(Boolean).map(a=>`
        <span class="pipeline-chip">${esc(a.name)}</span>
      `).join("")}
    </div>
  `:'<div class="pipeline-warning">Select at least one pipeline, then click Apply data filters.</div>'}function defaultDisplayPrefs(){const e={kpis:{},sections:{},charts:getDefaultChartPrefs(),statusItems:{},columns:{}};return Object.keys(DISPLAY_OPTIONS.kpis).forEach(t=>{e.kpis[t]=!0}),Object.keys(DISPLAY_OPTIONS.sections).forEach(t=>{e.sections[t]=!0}),Object.keys(DISPLAY_OPTIONS.charts).forEach(t=>{e.charts[t]=!0}),Object.keys(DISPLAY_OPTIONS.statusItems).forEach(t=>{e.statusItems[t]=!0}),Object.entries(DISPLAY_OPTIONS.columns).forEach(([t,a])=>{e.columns[t]={},Object.keys(a).forEach(n=>{e.columns[t][n]=!0})}),e}function loadDisplayPrefs(){if(IS_CLIENT_VIEW&&!IS_PREVIEW)return defaultDisplayPrefs();try{const e=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY)||"null");if(!e)return defaultDisplayPrefs();const t=defaultDisplayPrefs();return{kpis:{...t.kpis,...e.kpis},sections:{...t.sections,...e.sections},charts:{...t.charts,...e.charts},statusItems:{...t.statusItems,...e.statusItems},columns:{sourceReport:{...t.columns.sourceReport,...e.columns?.sourceReport||{}},assigneeReport:{...t.columns.assigneeReport,...e.columns?.assigneeReport||{}},pipelineBreakdown:{...t.columns.pipelineBreakdown,...e.columns?.pipelineBreakdown||{}}}}}catch{return defaultDisplayPrefs()}}function ensureChartsVisible(){const e=Object.keys(DISPLAY_OPTIONS.charts);e.some(a=>display.charts[a]!==!1)||(e.forEach(a=>{display.charts[a]=!0}),saveDisplayPrefs())}function saveDisplayPrefs(){localStorage.setItem(STORAGE_KEY,JSON.stringify(display))}function isVisible(e,t,a){return e==="columns"?display.columns[a]?.[t]!==!1:display[e]?.[t]!==!1}function toggleDisplay(e,t,a){e==="columns"?display.columns[a][t]=!display.columns[a][t]:display[e][t]=!display[e][t],saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}function setAllDisplay(e,t,a){e==="columns"?Object.keys(DISPLAY_OPTIONS.columns[a]).forEach(n=>{display.columns[a][n]=t}):Object.keys(DISPLAY_OPTIONS[e]).forEach(n=>{display[e][n]=t}),saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}const fmt=e=>new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0)),fmtCompact=e=>{const t=Number(e)||0;return t>=1e6?`${(t/1e6).toFixed(2)}M`:t>=1e3?`${(t/1e3).toFixed(2)}K`:fmt(t)},fmtPct=e=>`${(Number(e)||0).toFixed(2)}%`,fmtRoas=e=>{const t=Number(e)||0;return t>0?`${t.toFixed(2)}x`:"\u2014"};function formatActiveDateFilter(e){if(!e.dateFrom&&!e.dateTo)return"Till date";const t=getDashboardTimeZone();if(window.MarketingMetrics?.formatShortDateLabel){const a=window.MarketingMetrics.formatShortDateLabel(e.dateFrom,t),n=window.MarketingMetrics.formatShortDateLabel(e.dateTo,t);if(a&&n)return`${a} \u2013 ${n}`}return`${e.dateFrom||"start"} to ${e.dateTo||"now"}`}function showDateRangeError(e){document.querySelectorAll("#date-range-error").forEach(t=>{t.textContent=e,t.hidden=!e})}function clearDateRangeError(){showDateRangeError("")}function needsFreshData(){return!lastFetchedAt||Date.now()-lastFetchedAt>DATA_FRESH_MS}function buildQuery(e,t={}){const a=new URLSearchParams,n=getAllPipelineIds(e||[]),r=state.pipelineIds.filter(o=>n.includes(o));if(!r.length)throw new Error("Select at least one pipeline.");return a.set("pipelineIds",r.join(",")),state.dateField&&a.set("dateField",state.dateField),state.dateFrom&&a.set("dateFrom",state.dateFrom),state.dateTo&&a.set("dateTo",state.dateTo),["status","source","assignedTo","adSpend"].forEach(o=>{state[o]&&state[o]!=="all"&&a.set(o,state[o])}),appendTenantParams(a),t.forceFresh&&a.set("fresh","1"),a.toString()}function formatDateInput(e){const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${n}`}function getDashboardTimeZone(){return cachedData?.account?.timezone||"Europe/Copenhagen"}function getCalendarPartsInTimeZone(e,t=new Date){const a=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(t);return{year:Number(a.find(n=>n.type==="year")?.value),month:Number(a.find(n=>n.type==="month")?.value),day:Number(a.find(n=>n.type==="day")?.value)}}function formatMonthDateRange(e,t){const a=`${e}-${String(t).padStart(2,"0")}-01`,n=new Date(e,t,0).getDate(),r=`${e}-${String(t).padStart(2,"0")}-${String(n).padStart(2,"0")}`;return{start:a,end:r}}const datePickerState={inputId:null,anchorEl:null,viewYear:null,viewMonth:null};let datePickerListenersBound=!1;function isoFromParts(e,t,a){const n=Number(a);return!e||!t||!Number.isFinite(n)?"":`${e}-${String(t).padStart(2,"0")}-${String(n).padStart(2,"0")}`}function formatPickerDisplayLabel(e,t){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return t;const a=getDashboardTimeZone();return window.MarketingMetrics?.formatShortDateLabel&&window.MarketingMetrics.formatShortDateLabel(e,a)||e}function ensureDatePickerPopover(){if(document.getElementById("date-picker-popover"))return;const e=document.createElement("div");e.id="date-picker-backdrop",e.className="date-picker-backdrop",e.hidden=!0,e.addEventListener("click",closeDatePicker),document.body.appendChild(e);const t=document.createElement("div");t.id="date-picker-popover",t.className="date-picker-popover",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),document.body.appendChild(t)}function syncDatePickerDisplays(){[{id:"dateFrom",key:"dateFrom",placeholder:"Pick start date"},{id:"dateTo",key:"dateTo",placeholder:"Pick end date"}].forEach(({id:e,key:t,placeholder:a})=>{const n=document.getElementById(e),r=document.getElementById(`${e}-display`),o=document.getElementById(`${e}-trigger`),s=state[t]??"";n&&(n.value=s),r&&(r.textContent=formatPickerDisplayLabel(s,a)),o?.classList.toggle("is-empty",!s),o?.classList.toggle("has-value",!!s)})}function getStateDateValue(e){return state[e]??""}function getDatePickerViewMonth(e){const t=getStateDateValue(e);if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[a,n]=t.split("-").map(Number);return{year:a,month:n}}return getCalendarPartsInTimeZone(getDashboardTimeZone())}function getTodayIso(){const e=getCalendarPartsInTimeZone(getDashboardTimeZone());return isoFromParts(e.year,e.month,e.day)}function isStartDateDisabled(e){return e>=getTodayIso()}function isFutureDateDisabled(e){return e>getTodayIso()}function isFutureMonthView(e,t){const a=getCalendarPartsInTimeZone(getDashboardTimeZone());return e>a.year||e===a.year&&t>a.month}function isDatePickerDayDisabled(e,t){return t==="dateFrom"&&isStartDateDisabled(e)?!0:isFutureDateDisabled(e)}function renderDatePickerDayCell(e,t,a,n,r,o,s,i){const l=["date-picker-day"];if(a&&l.push("is-outside"),e===n&&l.push("is-today"),e===r&&l.push("is-selected"),o&&s){const c=o<=s?o:s,d=o<=s?s:o;e>=c&&e<=d&&l.push("is-in-range")}return e===o&&l.push("is-range-start"),e===s&&l.push("is-range-end"),isDatePickerDayDisabled(e,i)?(l.push("is-disabled"),`<button type="button" class="${l.join(" ")}" disabled aria-disabled="true">${t}</button>`):`<button type="button" class="${l.join(" ")}" onclick="selectDatePickerDay('${e}')">${t}</button>`}function renderDatePickerPopover(){const e=document.getElementById("date-picker-popover");if(!e||!datePickerState.inputId)return;const{viewYear:t,viewMonth:a,inputId:n}=datePickerState,r=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(t,a-1,1)),o=["Mo","Tu","We","Th","Fr","Sa","Su"],i=(new Date(t,a-1,1).getDay()+6)%7,l=new Date(t,a,0).getDate(),c=new Date(t,a-1,0).getDate(),d=getCalendarPartsInTimeZone(getDashboardTimeZone()),u=isoFromParts(d.year,d.month,d.day),p=getStateDateValue(n),h=getStateDateValue("dateFrom"),m=getStateDateValue("dateTo");let g="";for(let S=i-1;S>=0;S-=1){const L=c-S,B=a===1?12:a-1,P=a===1?t-1:t,C=isoFromParts(P,B,L);g+=renderDatePickerDayCell(C,L,!0,u,p,h,m,n)}for(let S=1;S<=l;S+=1){const L=isoFromParts(t,a,S);g+=renderDatePickerDayCell(L,S,!1,u,p,h,m,n)}const b=(7-(i+l)%7)%7;for(let S=1;S<=b;S+=1){const L=a===12?1:a+1,B=a===12?t+1:t,P=isoFromParts(B,L,S);g+=renderDatePickerDayCell(P,S,!0,u,p,h,m,n)}const f=n==="dateFrom"?'<span class="date-picker-hint">Start date must be before today</span>':"",v=n==="dateTo"?'<button type="button" class="date-picker-footer-btn primary" onclick="setDatePickerToday()">Today</button>':"",y=a===12?1:a+1,$=a===12?t+1:t,w=!isFutureMonthView($,y);e.innerHTML=`
    <div class="date-picker-panel">
      <div class="date-picker-header">
        <div class="date-picker-title">${esc(r)}</div>
        <div class="date-picker-nav">
          <button type="button" class="date-picker-nav-btn" aria-label="Previous month" onclick="shiftDatePickerMonth(-1)">${ICON_CHEVRON_LEFT}</button>
          <button type="button" class="date-picker-nav-btn" aria-label="Next month" onclick="shiftDatePickerMonth(1)" ${w?"":"disabled"}>${ICON_CHEVRON_RIGHT}</button>
        </div>
      </div>
      <div class="date-picker-weekdays">
        ${o.map(S=>`<div class="date-picker-weekday">${S}</div>`).join("")}
      </div>
      <div class="date-picker-grid">${g}</div>
      <div class="date-picker-footer">
        ${f}
        <button type="button" class="date-picker-footer-btn" onclick="clearDatePickerField()">Clear</button>
        ${v}
      </div>
    </div>
  `}function positionDatePickerPopover(){const e=document.getElementById("date-picker-popover"),t=datePickerState.anchorEl;if(!e||!t)return;e.hidden=!1,e.style.visibility="hidden",e.style.left="0",e.style.top="0",e.style.transform="";const a=t.getBoundingClientRect(),n=e.getBoundingClientRect(),r=8;let o=a.bottom+r,s=a.left;window.innerWidth<=640?(s=Math.max(16,(window.innerWidth-n.width)/2),o=Math.max(16,(window.innerHeight-n.height)/2),e.style.transform="none"):(s+n.width>window.innerWidth-16&&(s=window.innerWidth-n.width-16),s<16&&(s=16),o+n.height>window.innerHeight-16&&(o=Math.max(16,a.top-n.height-r))),e.style.top=`${o}px`,e.style.left=`${s}px`,e.style.visibility=""}function openDatePicker(e,t){ensureDatePickerPopover();const a=document.getElementById("date-picker-popover"),n=document.getElementById("date-picker-backdrop");if(!a||!n||!t)return;if(datePickerState.inputId===e&&!a.hidden){closeDatePicker();return}closeDatePicker(),datePickerState.inputId=e,datePickerState.anchorEl=t;const r=getDatePickerViewMonth(e);datePickerState.viewYear=r.year,datePickerState.viewMonth=r.month,renderDatePickerPopover(),n.hidden=!1,t.classList.add("is-active"),positionDatePickerPopover()}function closeDatePicker(){const e=document.getElementById("date-picker-popover"),t=document.getElementById("date-picker-backdrop");e&&(e.hidden=!0),t&&(t.hidden=!0),datePickerState.anchorEl?.classList.remove("is-active"),datePickerState.inputId=null,datePickerState.anchorEl=null}function shiftDatePickerMonth(e){let{viewYear:t,viewMonth:a}=datePickerState;a+=e,a<1?(a=12,t-=1):a>12&&(a=1,t+=1),!(e>0&&isFutureMonthView(t,a))&&(datePickerState.viewYear=t,datePickerState.viewMonth=a,renderDatePickerPopover(),positionDatePickerPopover())}function selectDatePickerDay(e){const t=datePickerState.inputId;if(!t||!/^\d{4}-\d{2}-\d{2}$/.test(e))return;if(isDatePickerDayDisabled(e,t)){showDateRangeError(t==="dateFrom"?"Start date must be before today.":"End date cannot be after today.");return}t==="dateFrom"&&(state.dateFrom=e),t==="dateTo"&&(state.dateTo=e);const a=document.getElementById(t);a&&(a.value=e),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function setDatePickerToday(){if(datePickerState.inputId==="dateFrom"){showDateRangeError("Start date must be before today.");return}const e=getCalendarPartsInTimeZone(getDashboardTimeZone());selectDatePickerDay(isoFromParts(e.year,e.month,e.day))}function clearDatePickerField(){const e=datePickerState.inputId;if(!e)return;state[e]="";const t=document.getElementById(e);t&&(t.value=""),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function handleDatePickerEscape(e){e.key==="Escape"&&closeDatePicker()}function initDatePickers(){ensureDatePickerPopover(),syncDatePickerDisplays(),datePickerListenersBound||(document.addEventListener("keydown",handleDatePickerEscape),window.addEventListener("resize",closeDatePicker),datePickerListenersBound=!0)}let lastCustomDateFrom="",lastCustomDateTo="";function getPresetDateRange(e){const t=getDashboardTimeZone(),{year:a,month:n}=getCalendarPartsInTimeZone(t);if(e==="month")return formatMonthDateRange(a,n);if(e==="lastMonth"){let r=a,o=n-1;return o<1&&(o=12,r-=1),formatMonthDateRange(r,o)}return e==="year"?{start:`${a}-01-01`,end:`${a}-12-31`}:null}function isPresetGeneratedRange(e,t){return!e||!t?!1:["month","lastMonth","year"].some(a=>{const n=getPresetDateRange(a);return n&&e===n.start&&t===n.end})}function saveCustomDateRange(){!state.dateFrom||!state.dateTo||isPresetGeneratedRange(state.dateFrom,state.dateTo)||(lastCustomDateFrom=state.dateFrom,lastCustomDateTo=state.dateTo)}function restoreCustomDateRange(){if(lastCustomDateFrom&&lastCustomDateTo&&!isPresetGeneratedRange(lastCustomDateFrom,lastCustomDateTo)){state.dateFrom=lastCustomDateFrom,state.dateTo=lastCustomDateTo;return}state.dateFrom="",state.dateTo=""}function setPreset(e){state.preset==="custom"&&e!=="custom"&&saveCustomDateRange(),state.preset=e;const t=getDashboardTimeZone(),{year:a,month:n}=getCalendarPartsInTimeZone(t);if(e==="all")state.dateFrom="",state.dateTo="",state.dateField="createdAt";else if(e==="month"){const r=formatMonthDateRange(a,n);state.dateFrom=r.start,state.dateTo=r.end,state.dateField="lastStatusChangeAt"}else if(e==="lastMonth"){let r=a,o=n-1;o<1&&(o=12,r-=1);const s=formatMonthDateRange(r,o);state.dateFrom=s.start,state.dateTo=s.end,state.dateField="lastStatusChangeAt"}else if(e==="year"){const r=getPresetDateRange("year");state.dateFrom=r.start,state.dateTo=r.end,state.dateField="lastStatusChangeAt"}else e==="custom"&&(state.dateField="createdAt",restoreCustomDateRange())}function updateCustomDateRowVisibility(){document.querySelectorAll("#custom-date-row").forEach(e=>{e.hidden=state.preset!=="custom"})}function updateFilterUi(){const e=document.getElementById("dateFrom"),t=document.getElementById("dateTo"),a=document.getElementById("adSpend");e&&(e.value=state.dateFrom||""),t&&(t.value=state.dateTo||""),a&&(a.value=state.adSpend||""),["status","source","assignedTo","dateField"].forEach(n=>{const r=document.getElementById(n);r&&(r.value=state[n])}),document.querySelectorAll("[data-preset]").forEach(n=>{n.classList.toggle("active",n.dataset.preset===state.preset)}),updateCustomDateRowVisibility(),syncDatePickerDisplays(),refreshPipelinePanel()}function onManualDateChange(){if(syncFiltersFromDom(),state.preset="custom",state.dateField="createdAt",state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date."),updateFilterUi();return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){state.dateFrom="";const e=document.getElementById("dateFrom");e&&(e.value=""),showDateRangeError("Start date must be before today."),updateFilterUi();return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){state.dateTo="";const e=document.getElementById("dateTo");e&&(e.value=""),showDateRangeError("End date cannot be after today."),updateFilterUi();return}clearDateRangeError(),updateFilterUi(),state.dateFrom&&state.dateTo&&(saveCustomDateRange(),applyDataFilters(!1))}function onFilterChange(e,t){state[e]=t,applyDataFilters(!1)}async function fetchJson(e,t){const a=new AbortController,n=setTimeout(()=>a.abort(),FETCH_TIMEOUT_MS),r=()=>a.abort();t?.addEventListener("abort",r);try{const o=await fetch(e,{signal:a.signal}),s=await o.json().catch(()=>({}));if(!o.ok)throw new Error(s.error||`Request failed (${o.status})`);return s}catch(o){throw o.name==="AbortError",o}finally{clearTimeout(n),t?.removeEventListener("abort",r)}}async function fetchFacebookMetrics(e){try{const t=new URLSearchParams({client:facebookClientId});return CLIENT_ACCESS_KEY&&t.set("key",CLIENT_ACCESS_KEY),await fetchJson(`/api/facebook-metrics?${t}`,e)}catch(t){if(t.name==="AbortError")throw t;return null}}function resolveMarketingPreset(){return["all","month","lastMonth","year"].includes(state.preset)?state.preset:state.preset==="custom"&&state.dateFrom&&state.dateTo?"custom":state.preset}function applyMarketingData(e,t){if(!window.MarketingMetrics)return e;const a=resolveMarketingPreset(),n=a==="custom",r=window.MarketingMetrics.applyMarketingToDashboard(e,t,a,{timeZone:e.account?.timezone||"Europe/Copenhagen",dateFrom:n?state.dateFrom:null,dateTo:n?state.dateTo:null});return r.monthlyAdSpend?.length&&(cachedMonthlyAdSpend=r.monthlyAdSpend),cachedMonthlyAdSpend?.length&&(r.monthlyAdSpend=cachedMonthlyAdSpend),window.MarketingMetrics?.buildMonthlyCostPerLead&&(r.monthlyCostPerLead=window.MarketingMetrics.buildMonthlyCostPerLead(r.monthlyAdSpend,r.monthlyLeads||e.monthlyLeads||[])),r}async function fetchDashboardData(e,t,a={}){const n=buildQuery(e,a),r=await fetchJson(`/api/dashboard${n?`?${n}`:""}`,t);return applyChartFieldsCache(r)}async function bootstrapDashboardData(e,t={}){const a=new URLSearchParams;appendTenantParams(a),t.forceFresh&&a.set("fresh","1");const n=a.toString(),r=await fetchJson(`/api/dashboard${n?`?${n}`:""}`,e);return r.account?.facebookClientId?facebookClientId=r.account.facebookClientId:r.account?.clientId&&(facebookClientId=r.account.clientId),applyChartFieldsCache(r)}function refreshPipelinePanel(){const e=document.getElementById("pipeline-panel");if(e){if(!availablePipelines.length){e.innerHTML='<div class="pipeline-note">Sync client data to load pipelines.</div>';return}e.innerHTML=renderPipelineSelector(availablePipelines)}}function selectAllPipelinesAction(){selectAllPipelines(availablePipelines),refreshPipelinePanel()}function clearPipelineSelectionAction(){clearPipelineSelection(),refreshPipelinePanel()}function togglePipelineSelectionAction(e){togglePipelineSelection(e),refreshPipelinePanel()}function selectCenhubPipelinesAction(){setPipelineSelection(getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds)),refreshPipelinePanel()}function renderPipelineSelector(e){return e.length?`
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
  `:'<div class="pipeline-note">No pipelines found.</div>'}function renderSelect(e,t,a,n){return`
    <div class="filter-group">
      <label for="${e}">${t}</label>
      <select id="${e}" onchange="onFilterChange('${e}', this.value)">
        ${a.map(r=>`
          <option value="${esc(r.id)}" ${r.id===n?"selected":""}>${esc(r.name)}</option>
        `).join("")}
      </select>
    </div>
  `}function renderCheckboxGroup(e,t,a,n){const r=Object.entries(a);return`
    <div class="display-group">
      <h3>${e}</h3>
      <div class="widget-actions" style="margin-bottom:10px">
        <button class="widget-btn" onclick="setAllDisplay('${t}', true${n?`, '${n}'`:""})">Select all</button>
        <button class="widget-btn" onclick="setAllDisplay('${t}', false${n?`, '${n}'`:""})">Clear all</button>
      </div>
      <div class="checkbox-list">
        ${r.map(([o,s])=>`
          <label class="checkbox-item">
            <input type="checkbox"
              ${isVisible(t,o,n)?"checked":""}
              onchange="toggleDisplay('${t}', '${o}'${n?`, '${n}'`:""})" />
            <span>${s}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `}function renderChartCard(e){const t=window.DashboardCharts?.CHART_DEFINITIONS?.[e];if(!t)return"";const a=["pie","doughnut","polarArea"].includes(t.defaultType);return`
    <div class="card chart-card">
      <div class="section-title">${t.title}</div>
      ${t.subtitle?`<div class="card-sub" style="margin-top:-4px;margin-bottom:12px">${t.subtitle}</div>`:""}
      <div class="chart-empty note" style="display:none">${ADMIN_UI?"No data for selected filters.":"Ingen data for den valgte periode."}</div>
      <div class="chart-canvas-wrap${a?" chart-canvas-wrap--circular":""}">
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
    `}function renderTable(e,t,a,n,r){const o=a.filter(s=>isVisible("columns",s.key,e));return o.length?`
    <div class="dashboard-table-wrap">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>${t}</th>
            ${o.map(s=>`<th class="${s.align||""}">${s.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${n.length?n.map(s=>`
            <tr>
              <td>${r(s,"label")}</td>
              ${o.map(i=>`<td class="${i.align||""}">${r(s,i.key)}</td>`).join("")}
            </tr>
          `).join(""):`<tr><td colspan="${o.length+1}">Ingen data for valgte filtre.</td></tr>`}
        </tbody>
      </table>
    </div>
  `:'<div class="empty-section">No columns selected for this table.</div>'}function renderDatePickerTrigger(e,t,a){const n=state[e]||"",r=formatPickerDisplayLabel(n,a);return`
    <div class="date-picker-field">
      <span class="date-picker-label">${t}</span>
      <button
        type="button"
        class="date-picker-trigger${n?"":" is-empty"}"
        id="${e}-trigger"
        aria-haspopup="dialog"
        aria-controls="date-picker-popover"
        onclick="openDatePicker('${e}', this)"
      >
        <span class="date-picker-icon" aria-hidden="true">${ICON_CALENDAR}</span>
        <span class="date-picker-value" id="${e}-display">${esc(r)}</span>
      </button>
      <input type="hidden" id="${e}" value="${esc(n)}" />
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
  `}function clientKpiCopy(e,t){return IS_CLIENT_VIEW&&!IS_PREVIEW?t:e}function getAdSpendSubtitle(e){if(e.adSpendSource!=="facebook")return"No ad spend data for this period";if(state.preset==="all")return"Ad spend";const t=e.adSpendLabel;if(!t||t==="Custom range"||t==="Till date")return"Ad spend";const a=e.adSpendShowAsAvg?"Avg ad spend":"Ad spend";return/^\d{4}$/.test(t)?`${a} year ${t}`:`${a} ${t.toLowerCase()}`}function renderKpiCards(e){const t=[];if(isVisible("kpis","totalRevenue")&&t.push(`
      <div class="card primary">
        <div class="card-label">Total Revenue</div>
        <div class="card-value">Dkr ${fmtCompact(e.totalRevenue)}</div>
        <div class="card-sub">${clientKpiCopy(e.hasDateFilter?`Won deal value in period (${fmt(e.wonOpportunityCount)} won deals)`:`Sum of won deal values (${fmt(e.wonOpportunityCount)} won deals)`,e.hasDateFilter?`Vundet oms\xE6tning i perioden (${fmt(e.wonOpportunityCount)} handler)`:`Samlet vundet oms\xE6tning (${fmt(e.wonOpportunityCount)} handler)`)}</div>
      </div>
    `),isVisible("kpis","adSpend")){const a=getAdSpendSubtitle(e);t.push(`
      <div class="card accent">
        <div class="card-label">Ad Spend</div>
        <div class="card-value">${e.adSpend>0?`Dkr ${fmtCompact(e.adSpend)}`:"\u2014"}</div>
        ${a?`<div class="card-sub">${a}</div>`:""}
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
    `),t.length?`<div class="kpi-grid">${t.join("")}</div>`:IS_ADMIN?'<div class="empty-section">No KPI cards selected. Use the display options below.</div>':'<div class="empty-section">No KPI data for selected period.</div>'}function renderStatusBreakdown(e){const t=Object.entries(DISPLAY_OPTIONS.statusItems).filter(([a])=>isVisible("statusItems",a)).map(([a,n])=>`
      <div class="status-item">
        <div class="name">${n}</div>
        <div class="value">${fmt(e[a])}</div>
      </div>
    `);return t.length?`<div class="status-grid">${t.join("")}</div>`:'<div class="empty-section">No status items selected.</div>'}function renderMetricsChangeBanner(e){const t=e.account?.metricsModel?.changedAt;if(!t||Date.now()-new Date(t).getTime()>10080*60*1e3)return"";const n=e.account?.metricsModel?.version||1;return`
    <div class="metrics-change-banner">
      Metrics model updated on ${new Date(t).toLocaleString("en-GB")} (v${n}).
      Revenue, clients won, and won-revenue charts now use: ${esc(e.account.metricsModel.winSourceLabel||e.account.metricsModel.label)}.
    </div>
  `}function renderDashboardContent(e){const{kpis:t,statusBreakdown:a,sourceReport:n,assigneeReport:r,pipelines:o,filters:s}=e,i=isVisible("sections","statusBreakdown");return`
    ${renderMetricsChangeBanner(e)}
    ${renderKpiCards(t)}

    ${renderChartsSection()}

    ${i?`
      <div class="card">
        <div class="section-title">Opportunity Status (Cards)</div>
        ${renderStatusBreakdown(a)}
      </div>
    `:""}

    ${isVisible("sections","sourceReport")?`
      <div class="card">
        <div class="section-title">Lead Source Report</div>
        ${renderTable("sourceReport","Source",[{key:"totalLeads",label:"Total leads",align:"num"},{key:"totalValue",label:"Total values",align:"num"},{key:"open",label:"Open",align:"num"},{key:"won",label:"Won",align:"num"},{key:"lost",label:"Lost",align:"num"},{key:"abandoned",label:"Abandoned",align:"num"},{key:"winPct",label:"Win %",align:"num"}],n,(l,c)=>c==="label"?esc(l.source):c==="totalValue"?`Dkr ${fmt(l.totalValue)}`:c==="winPct"?fmtPct(l.winPct):fmt(l[c]))}
      </div>
    `:""}

    ${isVisible("sections","assigneeReport")||isVisible("sections","pipelineBreakdown")?`
      <div class="section-grid">
        ${isVisible("sections","assigneeReport")?`
          <div class="card">
            <div class="section-title">Leads Closed by Assignee</div>
            ${renderTable("assigneeReport","Assignee",[{key:"won",label:"Won",align:"num"},{key:"totalLeads",label:"Total leads",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"},{key:"totalValue",label:"Total value",align:"num"}],r,(l,c)=>c==="label"?esc(l.assigneeName):c==="wonValue"||c==="totalValue"?`Dkr ${fmt(l[c])}`:fmt(l[c]))}
          </div>
        `:""}
        ${isVisible("sections","pipelineBreakdown")?`
          <div class="card">
            <div class="section-title">Pipeline Breakdown</div>
            ${renderTable("pipelineBreakdown","Pipeline",[{key:"count",label:"Leads",align:"num"},{key:"won",label:"Won",align:"num"},{key:"monetary",label:"Value",align:"num"},{key:"profit",label:"Bundlinje",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"}],o,(l,c)=>c==="label"?esc(l.name):c==="monetary"||c==="profit"||c==="wonValue"?`Dkr ${fmt(l[c])}`:fmt(l[c]))}
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
  `}function updateDashboardContent(e){if(IS_ADMIN){const a=document.getElementById("admin-filters-panel");a&&(a.outerHTML=renderAdminFiltersPanel(e.filterOptions||{pipelines:[],statuses:[],sources:[],assignees:[],dateFields:[]}));const n=document.getElementById("admin-display-panel");if(n){const r=!!n.open;n.outerHTML=renderAdminDisplayOptions(r)}}const t=document.getElementById("dashboard-content");t&&(t.innerHTML=renderDashboardContent(e),mountCharts(e))}function renderDashboard(e){const t=document.getElementById("dashboard"),{filterOptions:a,account:n={}}=e,r=document.querySelector("details.panel")?.open,o=n.accountName||"Dashboard";IS_CLIENT_VIEW&&n.accountName&&(document.title=`${n.accountName} \xB7 Cenhub Dashboard`),t.innerHTML=`
    ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
    ${wrapDashboardShell(`
    ${IS_ADMIN_CLIENT?`
    <div id="setup-panel-mount"></div>
    <details class="panel admin-preview-section"${document.querySelector(".admin-preview-section")?.open?" open":""}>
      <summary>${ICON_CHART} Dashboard preview <span style="color:var(--text-soft);font-weight:500">\xB7 advanced filters</span><span class="summary-chevron">${ICON_CHEVRON}</span></summary>
      ${renderAdminFiltersPanel(a)}
      ${renderAdminDisplayOptions(r)}
      <div class="content-area" id="dashboard-content">
        ${renderDashboardContent(e)}
      </div>
    </details>
    `:`
    <div class="page-hero">
      <div class="header">
        <div>
          <h1>${esc(o)}</h1>
          <p>Performance dashboard \xB7 Pipeline & oms\xE6tning</p>
        </div>
        ${IS_ADMIN?"":`
        <div class="header-actions header-actions--client">
          ${renderPresetControls(!0)}
        </div>
        `}
      </div>
    </div>
    ${IS_ADMIN?renderAdminFiltersPanel(a):""}
    ${IS_ADMIN?renderAdminDisplayOptions(r):""}
    <div class="content-area" id="dashboard-content">
      ${renderDashboardContent(e)}
    </div>
    `}
    `)}
  `,IS_ADMIN_CLIENT&&loadSetupAccount(),initDatePickers()}let isFetching=!1,pendingRefetch=!1,fetchGeneration=0,activeFetchController=null,fetchStartedAt=0;const FETCH_TIMEOUT_MS=9e4;function restoreDashboardContentAfterFailedFetch(e){!e||!cachedData||(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi())}function setPresetButtonsDisabled(e){document.querySelectorAll("[data-preset]").forEach(t=>{t.disabled=e})}function resetFetchUiState(){isFetching=!1,setPresetButtonsDisabled(!1);const e=document.getElementById("apply-filters-btn");e&&(e.disabled=!1,e.textContent="Apply data filters")}function cancelActiveFetch(){activeFetchController&&(activeFetchController.abort(),activeFetchController=null)}function canReuseBootstrapDashboard(e){return!!(e?.kpis&&usesClientPipelineDefaults()&&!state.dateFrom&&!state.dateTo&&state.status==="all"&&state.source==="all"&&state.assignedTo==="all")}async function loadDashboard(e=!0,t={}){const{background:a=!1,forceFresh:n=!1}=t,r=!!n,o=document.getElementById("dashboard");if(isFetching&&(e||!cachedData))cancelActiveFetch(),fetchGeneration+=1,pendingRefetch=!1,resetFetchUiState();else if(isFetching){e&&(pendingRefetch=!0);return}const s=!!document.getElementById("dashboard-content"),i=document.getElementById("apply-filters-btn");if(e||!cachedData){const l=++fetchGeneration;activeFetchController=new AbortController;const c=activeFetchController.signal;if(isFetching=!0,fetchStartedAt=Date.now(),!s)o.innerHTML=`
        ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
        ${wrapDashboardShell(`
          <div class="loading-state">
            <div class="spinner"></div>
            ${LOADING_MSG}
          </div>
        `)}`;else if(!a){const d=document.getElementById("dashboard-content");d&&(d.innerHTML=renderKpiSkeleton()),i&&(i.disabled=!0,i.textContent="Loading..."),setPresetButtonsDisabled(!0)}try{let d=null;if(!availablePipelines.length){if(d=await bootstrapDashboardData(c),l!==fetchGeneration)return;availablePipelines=d.filterOptions.pipelines||[],ensurePipelineDefaults(availablePipelines,d.account?.defaultPipelineIds)}if(!ensurePipelineSelectionBeforeFetch())throw new Error("Select at least one pipeline.");const p=canReuseBootstrapDashboard(d)&&!r;let h,m;if(p?[m,h]=await Promise.all([fetchFacebookMetrics(c),Promise.resolve(d)]):[h,m]=await Promise.all([fetchDashboardData(availablePipelines,c,{forceFresh:r}),fetchFacebookMetrics(c)]),l!==fetchGeneration)return;cachedFacebookMetrics=m,cachedData=applyMarketingData(h,m),cachedData.account?.facebookClientId?facebookClientId=cachedData.account.facebookClientId:cachedData.account?.clientId&&(facebookClientId=cachedData.account.clientId),availablePipelines=cachedData.filterOptions.pipelines||availablePipelines,ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),lastFetchedAt=cachedData.cachedAt?new Date(cachedData.cachedAt).getTime():Date.now()}catch(d){if(l!==fetchGeneration)return;if(d.name==="AbortError"){s?restoreDashboardContentAfterFailedFetch(s):o.innerHTML=`
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
            </div>`)}else s?s&&cachedData?(restoreDashboardContentAfterFailedFetch(s),showToast(d.message||"Failed to load filtered data.","error")):i&&(i.textContent="Apply failed - try again"):o.innerHTML=`
          ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
          ${wrapDashboardShell(`
            <div class="error-state">
              <div>Fejl ved hentning af data</div>
              <div style="margin-top:8px;font-size:12px;color:#666">${esc(d.message)}</div>
              <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
            </div>
          `)}`;return}finally{l===fetchGeneration&&(activeFetchController=null,resetFetchUiState()),pendingRefetch&&(pendingRefetch=!1,loadDashboard(!0))}if(l!==fetchGeneration)return}try{s?(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi()):(renderDashboard(cachedData),mountCharts(cachedData))}catch(l){resetFetchUiState(),o.innerHTML=`
      ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
      ${wrapDashboardShell(`
        <div class="error-state">
          <div>Fejl ved visning af dashboard</div>
          <div style="margin-top:8px;font-size:12px;color:#666">${esc(l.message)}</div>
          <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
        </div>
      `)}
    `}}function syncFiltersFromDom(){["status","source","assignedTo","dateField"].forEach(t=>{const a=document.getElementById(t);a&&(state[t]=a.value)});const e=document.getElementById("adSpend");if(e&&(state.adSpend=e.value),state.preset==="custom"){const t=document.getElementById("dateFrom"),a=document.getElementById("dateTo");t&&(state.dateFrom=t.value),a&&(state.dateTo=a.value),state.dateField="createdAt"}}function hasPartialDateRange(){return!!(state.dateFrom&&!state.dateTo||!state.dateFrom&&state.dateTo)}function applyPreset(e){if(clearDateRangeError(),closeDatePicker(),setPreset(e),updateFilterUi(),e==="custom"){const t=document.getElementById("dateFrom-trigger");t&&openDatePicker("dateFrom",t);return}applyDataFilters(!1)}function applyDataFilters(e=!0){if(e&&syncFiltersFromDom(),state.preset==="custom"){if(hasPartialDateRange()){showDateRangeError("Select both From and To dates.");return}if(state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date.");return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){showDateRangeError("Start date must be before today.");return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){showDateRangeError("End date cannot be after today.");return}}if(clearDateRangeError(),!state.pipelineIds.length&&availablePipelines.length&&ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),!state.pipelineIds.length){!availablePipelines.length&&isFetching&&loadDashboard(!0);return}loadDashboard(!0)}async function bootAdminApp(){if(IS_REPORT_VIEW){await loadPublicMetaReportPage();return}if(IS_LOGIN_PAGE){renderLoginPage();return}if(IS_ADMIN_HUB){loadAdminHub();return}if(IS_ADMIN_SYNC_HISTORY_GHL){await loadSyncHistoryPage("ghl");return}if(IS_ADMIN_SYNC_HISTORY_META){await loadSyncHistoryPage("meta");return}if(IS_ADMIN_FB_LEAD_SYNC){await loadFbLeadSyncPage();return}if(IS_ADMIN_META_REPORTS){await loadMetaReportsHubPage();return}if(IS_ADMIN_META_REPORTS_CUSTOM){await loadMetaReportsCustomValuesPage();return}if(IS_ADMIN_META_REPORTS_CLIENT){await loadMetaReportsClientPage();return}if(IS_TEAM_PAGE){loadTeamPage();return}try{tenantParams=await resolveTenantParams()}catch(e){document.getElementById("dashboard").innerHTML='<div class="error-state" style="padding:24px">'+esc(e.message)+"</div>";return}if(IS_ADMIN_CLIENT){await initAdminClientPage();return}ensureChartsVisible(),loadDashboard(!0),setInterval(function(){loadDashboard(!0,{background:!0})},120*1e3)}bootAdminApp(),document.addEventListener("click",function(e){const t=e.target.closest("#staff-nav-toggle");if(t){e.stopPropagation(),toggleStaffTopbarNav(t);return}if(e.target.closest(".staff-nav-dropdown-item")){closeStaffTopbarNav(),closeStaffNavDropdowns();return}(e.target.closest(".staff-nav-link")&&!e.target.closest(".staff-nav-dropdown-trigger")||!e.target.closest(".brand-topbar-right")&&!e.target.closest(".staff-nav-dropdown-menu"))&&closeStaffTopbarNav(),!e.target.closest(".staff-nav-dropdown")&&!e.target.closest(".staff-nav-dropdown-menu")&&closeStaffNavDropdowns(),closeCardMenus(),closeStaffUserMenu()}),window.addEventListener("resize",function(){document.querySelectorAll(".staff-nav-dropdown.is-open").forEach(function(e){positionStaffNavDropdown(e)})}),window.addEventListener("scroll",function(){document.querySelector(".staff-nav-dropdown.is-open")&&closeStaffNavDropdowns()},{passive:!0}),document.addEventListener("visibilitychange",function(){document.visibilityState==="visible"&&(isFetching&&Date.now()-fetchStartedAt>FETCH_TIMEOUT_MS&&(cancelActiveFetch(),fetchGeneration+=1,resetFetchUiState()),!IS_ADMIN_HUB&&cachedData&&needsFreshData()&&loadDashboard(!0,{background:!0}))});

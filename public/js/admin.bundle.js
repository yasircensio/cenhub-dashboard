(function(){const t=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);if(t[0]==="login"){document.body.dataset.dashboardMode="login",delete document.body.dataset.clientSlug;return}if(t[0]==="team"){document.body.dataset.dashboardMode="team",delete document.body.dataset.clientSlug;return}if(t[0]==="admin"){if(t[1]==="sync-history"&&(t[2]==="ghl"||t[2]==="meta")){document.body.dataset.dashboardMode=`sync-history-${t[2]}`,delete document.body.dataset.clientSlug;return}if(t[1]==="fb-lead-sync"){document.body.dataset.dashboardMode="fb-lead-sync",delete document.body.dataset.clientSlug;return}document.body.dataset.dashboardMode=t.length>=2?"admin":"hub",t.length>=2?document.body.dataset.clientSlug=t[1]:delete document.body.dataset.clientSlug;return}t[0]&&t[0]!=="index.html"&&(document.body.dataset.dashboardMode="client",document.body.dataset.clientSlug=t[0])})();const DASHBOARD_MODE=document.body.dataset.dashboardMode||"client",IS_LOGIN_PAGE=DASHBOARD_MODE==="login",IS_TEAM_PAGE=DASHBOARD_MODE==="team",IS_ADMIN_HUB=DASHBOARD_MODE==="hub",IS_ADMIN_CLIENT=DASHBOARD_MODE==="admin",IS_ADMIN_SYNC_HISTORY_GHL=DASHBOARD_MODE==="sync-history-ghl",IS_ADMIN_SYNC_HISTORY_META=DASHBOARD_MODE==="sync-history-meta",IS_ADMIN_FB_LEAD_SYNC=DASHBOARD_MODE==="fb-lead-sync",IS_ADMIN_SYNC_HISTORY=IS_ADMIN_SYNC_HISTORY_GHL||IS_ADMIN_SYNC_HISTORY_META,IS_CLIENT_VIEW=DASHBOARD_MODE==="client",IS_PREVIEW=IS_CLIENT_VIEW&&!!new URLSearchParams(window.location.search).get("client"),IS_ADMIN=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||new URLSearchParams(window.location.search).get("view")==="admin",ADMIN_UI=IS_ADMIN_HUB||IS_ADMIN_CLIENT||IS_TEAM_PAGE||IS_ADMIN_SYNC_HISTORY||IS_ADMIN_FB_LEAD_SYNC||IS_ADMIN,LOADING_MSG=ADMIN_UI?"Loading dashboard data...":"Henter dashboard data...",RETRY_MSG=ADMIN_UI?"Try again":"Pr\xF8v igen";(function(){const t=document.getElementById("initial-loading-msg");t&&(t.textContent=LOADING_MSG)})();function resolveClientSlug(){if(document.body.dataset.clientSlug)return document.body.dataset.clientSlug;const e=window.location.pathname.replace(/^\/+|\/+$/g,"").split("/").filter(Boolean);return e[0]==="admin"&&e[1]?e[1]:e[0]&&e[0]!=="admin"&&e[0]!=="index.html"?e[0]:new URLSearchParams(window.location.search).get("client")||"suntech-nordic"}const CLIENT_SLUG=resolveClientSlug();let tenantParams={},facebookClientId=CLIENT_SLUG,setupAccount=null,setupPipelines=[],metricsModelChangeMode=!1;function esc(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function renderBrandTopbar(e=""){return`
    <header class="brand-topbar">
      <div class="brand-topbar-left">
        <img class="brand-logo" src="/cenhub-logo-white.png" alt="Cenhub" width="167" height="41" />
      </div>
      ${e?`<div class="brand-topbar-right">${e}</div>`:""}
    </header>
  `}function wrapDashboardShell(e){return`<div class="dashboard-shell">${e}</div>`}function showToast(e,t="info"){const n=document.getElementById("toast-host");if(!n)return;const a=document.createElement("div");a.className=`toast${t==="error"?" toast--error":t==="success"?" toast--success":""}`,a.textContent=e,n.appendChild(a),setTimeout(()=>a.remove(),4200)}function fmtDkk(e){return new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0))}function fmtRevenueDkk(e){const t=Math.round(Number(e)||0);if(t>=1e6){const n=t/1e6;return`${new Intl.NumberFormat("da-DK",{minimumFractionDigits:n%1===0?0:2,maximumFractionDigits:2}).format(n)}M kr`}return`${fmtDkk(t)} kr`}function clientNeedsAction(e){return!!(e&&e!=="ready"&&e!=="syncing")}function clientActionHint(e){return{syncing:"Sync in progress...",needs_token:"Action needed \u2014 add GHL token in Settings",needs_metrics_model:"Action needed \u2014 choose metrics model in Settings",needs_pipelines:"Action needed \u2014 map pipelines in Settings",needs_sync:"Action needed \u2014 sync data from Settings or click Sync",needs_review:"Action needed \u2014 review client setup in Settings",sync_error:"Sync failed \u2014 open Settings and try again"}[e]||"Action needed \u2014 open Settings to finish setup"}function requestGhlUserData(e=8e3){return new Promise(t=>{if(window.self===window.top){t(null);return}const n=setTimeout(()=>{window.removeEventListener("message",a),t(null)},e);function a(s){s.data?.message==="REQUEST_USER_DATA_RESPONSE"&&s.data.payload&&(clearTimeout(n),window.removeEventListener("message",a),t(s.data.payload))}window.addEventListener("message",a),window.parent.postMessage({message:"REQUEST_USER_DATA"},"*")})}async function resolveTenantParams(){const e=new URLSearchParams(window.location.search);if(IS_ADMIN_HUB)return{};if(IS_ADMIN_CLIENT||IS_CLIENT_VIEW)return{client:CLIENT_SLUG};if(e.get("client"))return{client:e.get("client")};const t=e.get("location_id")||e.get("locationId");return t?{location_id:t}:{client:CLIENT_SLUG}}let CLIENT_ACCESS_KEY=new URLSearchParams(window.location.search).get("key")||"";function appendTenantParams(e){tenantParams.location_id?e.set("location_id",tenantParams.location_id):tenantParams.client&&e.set("client",tenantParams.client),CLIENT_ACCESS_KEY&&e.set("key",CLIENT_ACCESS_KEY)}const ADMIN_API_KEY_STORAGE="cenhub_admin_api_key";let currentStaffUser=null;function getAdminApiKey(){return localStorage.getItem(ADMIN_API_KEY_STORAGE)||""}function redirectToLogin(){const e=`${window.location.pathname}${window.location.search}`;window.location.href=`/login?next=${encodeURIComponent(e)}`}async function fetchStaffMe(){const e=await fetch("/api/auth/me",{credentials:"include"}),t=await e.json().catch(()=>({}));return e.ok&&t.user||null}async function requireStaffAuth(){const e=await fetchStaffMe();return e?(currentStaffUser=e,e):(redirectToLogin(),null)}async function adminFetch(e,t={}){const n={"Content-Type":"application/json",...t.headers||{}},a=getAdminApiKey();a&&(n["x-api-key"]=a);const s=await fetch(e,{...t,headers:n,credentials:"include"}),i=await s.json().catch(()=>({}));if(s.status===401&&ADMIN_UI)throw redirectToLogin(),new Error(i.error||"Unauthorized.");if(!s.ok)throw new Error(i.error||`Request failed (${s.status})`);return i}async function staffLogout(){try{await fetch("/api/auth/logout",{method:"POST",credentials:"include"})}catch{}window.location.href="/login"}function isStaffAdmin(){return currentStaffUser?.role==="admin"}function renderStaffUserMenu(){const e=currentStaffUser;return e?`
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
      <a href="/admin" class="staff-nav-link${e==="clients"?" is-active":""}">Clients</a>
      <a href="/admin/sync-history/ghl" class="staff-nav-link${e==="ghl-sync"?" is-active":""}">GHL sync</a>
      <a href="/admin/sync-history/meta" class="staff-nav-link${e==="meta-sync"?" is-active":""}">Meta sync</a>
      <a href="/admin/fb-lead-sync" class="staff-nav-link${e==="fb-lead-sync"?" is-active":""}">FB lead sync</a>
      ${isStaffAdmin()?`<a href="/team" class="staff-nav-link${e==="team"?" is-active":""}">Team</a>`:""}
    </nav>
  `}
      ${renderStaffUserMenu()}
    </div>
  `:""}function toggleStaffUserMenu(e){e.stopPropagation();const t=document.getElementById("staff-user-dropdown"),n=e.currentTarget;if(!t)return;const a=t.hidden;closeStaffUserMenu(),a&&(t.hidden=!1,n?.setAttribute("aria-expanded","true"))}function closeStaffUserMenu(){const e=document.getElementById("staff-user-dropdown"),t=document.querySelector(".staff-user-trigger");e&&(e.hidden=!0),t&&t.setAttribute("aria-expanded","false")}function formatStaffLastLogin(e){if(!e)return"Never";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}function renderStaffStatusBadge(e){return`<span class="staff-status-badge status-${e}">${e==="active"?"Active":e==="pending"?"Pending":"Disabled"}</span>`}async function copyTextToClipboard(e,t){try{await navigator.clipboard.writeText(e),showToast(t,"success")}catch{showToast("Could not copy to clipboard","error")}}function renderTeamPage(e){return`
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
    `}}}async function reloadTeamUsersTable(){const e=document.getElementById("team-users-content");if(!e)return;const t=await adminFetch("/api/auth/users");e.innerHTML=renderStaffUsersTable(t.users||[])}function renderStaffUserActions(e){const t=currentStaffUser?.id===e.id,n=e.status==="disabled"?`<button class="admin-btn" type="button" onclick="updateStaffUser('${esc(e.id)}', { status: 'active' })">Enable</button>`:`<button class="admin-btn" type="button" ${t?'disabled title="You cannot disable your own account"':""} onclick="updateStaffUser('${esc(e.id)}', { status: 'disabled' })">Disable</button>`,a=e.status==="pending"||!e.hasPassword?`<button class="admin-btn" type="button" onclick="copyStaffInviteLink('${esc(e.id)}')">Copy invite link</button>`:`<button class="admin-btn" type="button" onclick="resetStaffUserPassword('${esc(e.id)}', true)">Reset password</button>`,s=t?"":`<button class="admin-btn card-menu-item--danger" type="button" onclick="deleteStaffUser('${esc(e.id)}')">Delete</button>`;return`
    <div class="staff-user-actions">
      ${n}
      ${a}
      ${s}
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
  `}async function createStaffUserFromForm(){const e=document.getElementById("new-staff-email")?.value?.trim(),t=document.getElementById("new-staff-name")?.value?.trim(),n=document.getElementById("new-staff-role")?.value==="admin"?"admin":"member";if(!e){showToast("Email is required.","error");return}try{const a=await adminFetch("/api/auth/users",{method:"POST",body:JSON.stringify({email:e,name:t,role:n})});a.setupUrl&&await copyTextToClipboard(a.setupUrl,"Invite link copied to clipboard."),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("Staff member invited.","success")}catch(a){showToast(a.message,"error")}}async function updateStaffUser(e,t){try{await adminFetch(`/api/auth/users/${encodeURIComponent(e)}`,{method:"PATCH",body:JSON.stringify(t)}),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("User updated.","success")}catch(n){showToast(n.message,"error"),IS_TEAM_PAGE&&await reloadTeamUsersTable()}}async function updateStaffUserRole(e,t){await updateStaffUser(e,{role:t==="admin"?"admin":"member"})}async function deleteStaffUser(e){if(window.confirm("Delete this staff member? This permanently removes their account and cannot be undone."))try{await adminFetch(`/api/auth/users/${encodeURIComponent(e)}`,{method:"DELETE"}),IS_TEAM_PAGE&&await reloadTeamUsersTable(),showToast("Staff member deleted.","success")}catch(t){showToast(t.message,"error")}}async function copyStaffInviteLink(e){try{const t=await adminFetch(`/api/auth/users/${encodeURIComponent(e)}/reset-password`,{method:"POST",body:"{}"});t.setupUrl&&await copyTextToClipboard(t.setupUrl,"Invite link copied to clipboard.")}catch(t){showToast(t.message,"error")}}async function resetStaffUserPassword(e,t=!1){try{const n=await adminFetch(`/api/auth/users/${encodeURIComponent(e)}/reset-password`,{method:"POST",body:"{}"});n.setupUrl&&await copyTextToClipboard(n.setupUrl,t?"Reset link copied to clipboard.":"Password reset link generated.")}catch(n){showToast(n.message,"error")}}function renderLoginPage(){const e=new URLSearchParams(window.location.search),t=e.get("token"),n=e.get("next")||"/admin",a=e.get("saved")==="1",s=document.getElementById("dashboard"),i='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',o='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a20.3 20.3 0 014.06-5.94M9.9 4.24A10.94 10.94 0 0112 5c6.5 0 10 7 10 7a20.3 20.3 0 01-3.17 4.49"/><path d="M1 1l22 22"/><path d="M14.12 14.12A3 3 0 009.88 9.88"/></svg>',m='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>';function c(f,h,w=""){return`
      <div class="auth-field">
        <label for="${f}">${h}</label>
        <div class="auth-password-wrap">
          <input id="${f}" type="password" ${w} />
          <button
            type="button"
            class="auth-password-toggle"
            aria-label="Show password"
            onclick="toggleAuthPassword('${f}', this)"
          >${i}</button>
        </div>
      </div>
    `}if(t){s.innerHTML=`
      ${renderBrandTopbar()}
      ${wrapDashboardShell(`
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-card-header">
            <div class="auth-card-title-row">
              <div class="auth-card-icon" aria-hidden="true">${m}</div>
              <h1>Set your password</h1>
            </div>
            <p>Create a password for your Cenhub staff account. The link expires after 48 hours.</p>
          </div>
          <div id="auth-error" class="auth-error" style="display:none"></div>
          <div id="auth-success" class="auth-success" style="display:none"></div>
          ${c("set-password","New password",`autocomplete="new-password" minlength="8" placeholder="At least 8 characters" oninput="updatePasswordStrength()" onkeydown="if(event.key==='Enter')submitSetPassword()"`)}
          <div id="password-strength" class="password-strength" aria-live="polite"></div>
          ${c("set-password-confirm","Confirm password",`autocomplete="new-password" minlength="8" placeholder="Repeat your password" onkeydown="if(event.key==='Enter')submitSetPassword()"`)}
          <input id="password-token" type="hidden" value="${esc(t)}" />
          <button id="auth-submit-btn" class="admin-btn admin-btn--primary auth-submit" type="button" onclick="submitSetPassword()">Save password</button>
          <div class="auth-note"><a href="/login">Back to login</a></div>
        </div>
      </div>
      `)}
    `,initAuthPage("set-password");return}s.innerHTML=`
    ${renderBrandTopbar()}
    ${wrapDashboardShell(`
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-card-header">
          <div class="auth-card-title-row">
            <div class="auth-card-icon" aria-hidden="true">${m}</div>
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
        ${c("login-password","Password",`autocomplete="current-password" placeholder="Enter your password" onkeydown="if(event.key==='Enter')submitStaffLogin()"`)}
        <input id="login-next" type="hidden" value="${esc(n)}" />
        <button id="auth-submit-btn" class="admin-btn admin-btn--primary auth-submit" type="button" onclick="submitStaffLogin()">Sign in</button>
        <div class="auth-note">Forgot password? <a class="auth-help-link" href="mailto:?subject=Cenhub%20staff%20password%20reset">Contact your admin</a> for a new setup link.</div>
      </div>
    </div>
    `)}
  `,initAuthPage("login-email")}function initAuthPage(e){const t=document.getElementById(e);t&&requestAnimationFrame(()=>t.focus({preventScroll:!0}))}function toggleAuthPassword(e,t){const n=document.getElementById(e);if(!n||!t)return;const a=n.type==="password";n.type=a?"text":"password",t.setAttribute("aria-label",a?"Hide password":"Show password"),t.innerHTML=a?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-6.5 0-10-7-10-7a20.3 20.3 0 014.06-5.94M9.9 4.24A10.94 10.94 0 0112 5c6.5 0 10 7 10 7a20.3 20.3 0 01-3.17 4.49"/><path d="M1 1l22 22"/><path d="M14.12 14.12A3 3 0 009.88 9.88"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>'}function setAuthSubmitLoading(e,t,n){const a=document.getElementById("auth-submit-btn");a&&(a.disabled=e,a.classList.toggle("is-loading",e),a.textContent=e?t:n,document.querySelectorAll(".auth-card input").forEach(s=>{s.type!=="hidden"&&(s.disabled=e)}))}function updatePasswordStrength(){const e=document.getElementById("set-password")?.value||"",t=document.getElementById("password-strength");if(!t)return;if(!e){t.textContent="",t.className="password-strength";return}let n=0;e.length>=8&&(n+=1),e.length>=12&&(n+=1),/[A-Z]/.test(e)&&/[a-z]/.test(e)&&(n+=1),/\d/.test(e)&&(n+=1);const a=["Weak","Fair","Good","Strong"],s=["is-weak","is-fair","is-good","is-strong"],i=Math.min(Math.max(n-1,0),3);t.className=`password-strength ${s[i]}`,t.textContent=`Password strength: ${a[i]}`}function showAuthSuccess(e){const t=document.getElementById("auth-error"),n=document.getElementById("auth-success");t&&(t.style.display="none"),n&&(n.textContent=e,n.style.display=e?"block":"none")}function showAuthError(e){const t=document.getElementById("auth-error"),n=document.getElementById("auth-success");n&&e&&(n.style.display="none"),t&&(t.textContent=e,t.style.display=e?"block":"none")}async function submitStaffLogin(){showAuthError("");const e=document.getElementById("login-next")?.value||"/admin",t=document.getElementById("login-email")?.value?.trim(),n=document.getElementById("login-password")?.value||"";if(!t||!n){showAuthError("Email and password are required.");return}setAuthSubmitLoading(!0,"Signing in\u2026","Sign in");try{const a=await fetch("/api/auth/login",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,password:n})}),s=await a.json().catch(()=>({}));if(!a.ok){showAuthError(s.error||"Login failed."),setAuthSubmitLoading(!1,"Signing in\u2026","Sign in");return}showAuthSuccess("Signed in. Redirecting\u2026"),window.setTimeout(()=>{window.location.href=e||"/admin"},450)}catch(a){showAuthError(a.message||"Login failed."),setAuthSubmitLoading(!1,"Signing in\u2026","Sign in")}}async function submitSetPassword(){showAuthError("");const e=document.getElementById("password-token")?.value||"",t=document.getElementById("set-password")?.value||"",n=document.getElementById("set-password-confirm")?.value||"";if(t.length<8){showAuthError("Password must be at least 8 characters.");return}if(t!==n){showAuthError("Passwords do not match.");return}setAuthSubmitLoading(!0,"Saving\u2026","Save password");try{const a=await fetch("/api/auth/set-password",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:e,password:t,confirmPassword:n})}),s=await a.json().catch(()=>({}));if(!a.ok){showAuthError(s.error||"Could not set password."),setAuthSubmitLoading(!1,"Saving\u2026","Save password");return}showAuthSuccess("Password saved. Redirecting to sign in\u2026"),window.setTimeout(()=>{window.location.href="/login?saved=1&next=/admin"},1200)}catch(a){showAuthError(a.message||"Could not set password."),setAuthSubmitLoading(!1,"Saving\u2026","Save password")}}function statusLabel(e){return{ready:"Ready",syncing:"Syncing",needs_token:"Needs token",needs_metrics_model:"Needs metrics model",needs_pipelines:"Needs pipelines",needs_sync:"Needs sync",needs_review:"Needs review",sync_error:"Sync failed"}[e]||e}function formatRelativeSync(e,t){if(t==="syncing")return"Syncing now...";if(!e)return"Not synced yet";const n=Date.now()-new Date(e).getTime(),a=Math.round(n/6e4);if(a<2)return"Synced just now";if(a<60)return`Synced ${a} min ago`;const s=Math.round(a/60);return s<24?`Synced ${s} hr ago`:`Synced ${new Date(e).toLocaleString("en-GB")}`}const ICON_SEARCH='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',ICON_PLUS='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',ICON_CALENDAR='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17"/></svg>',ICON_CHEVRON_LEFT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',ICON_CHEVRON_RIGHT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',ICON_SYNC='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',ICON_CHEVRON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',ICON_CHART='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>';function clientInitials(e){const t=String(e||"?").trim().split(/\s+/).filter(Boolean);return t.length?t.length===1?t[0].slice(0,2).toUpperCase():(t[0][0]+t[1][0]).toUpperCase():"?"}const SYNC_HISTORY_TIMEZONE="Europe/Copenhagen";function formatSyncHistoryTimestamp(e){if(!e)return"\u2014";const t=new Date(e);return Number.isNaN(t.getTime())?"\u2014":t.toLocaleString("da-DK",{timeZone:SYNC_HISTORY_TIMEZONE,day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})}function formatSyncHistoryDate(e){if(!e)return null;const t=new Date(e);return Number.isNaN(t.getTime())?null:t.toLocaleDateString("da-DK",{timeZone:SYNC_HISTORY_TIMEZONE,day:"numeric",month:"short",year:"numeric"})}function renderSyncStatusBadge(e){const t=String(e||"unknown").toLowerCase();let n="running";return t==="success"||t==="ok"||t==="cron_tick"?n="success":t==="error"||t==="failed"?n="error":t==="skipped"&&(n="skipped"),`<span class="sync-status-badge sync-status-badge--${n}">${esc(t)}</span>`}function formatSyncSource(e){return{cron:"Scheduled (cron)","github-actions":"Scheduled (GitHub Actions)",admin:"Manual (admin)","vercel-cron":"Scheduled (Vercel cron)",manual:"Manual (admin)",inngest:"Scheduled (legacy)","auto-refresh":"Dashboard auto-refresh",unknown:"Unknown"}[e]||e}function renderSyncHistorySummary(e,t){return`
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
  `}function renderSyncHistoryRows(e,t){if(!e.length)return'<div class="sync-history-empty">No sync runs logged yet.</div>';const n=t==="meta"?"Spend / details":"Details",a=e.map(s=>{let i="\u2014";if(t==="meta"){const o=[];if(s.thisMonthSpend!=null&&o.push(`${fmtDkk(s.thisMonthSpend)} DKK this month`),s.spendDateStop){const m=formatSyncHistoryDate(s.spendDateStop);m&&o.push(`through ${m}`)}s.errorMessage&&o.push(s.errorMessage),i=o.join(" \xB7 ")||"\u2014"}else s.opportunityCount!=null?(i=`${s.opportunityCount} opportunities`,s.errorMessage&&(i+=` \xB7 ${s.errorMessage}`)):s.errorMessage&&(i=s.errorMessage);return`
      <tr>
        <td>${esc(formatSyncHistoryTimestamp(s.startedAt))}</td>
        <td>${esc(s.accountName||s.clientId)}</td>
        <td>${renderSyncStatusBadge(s.status)}</td>
        <td>${esc(formatSyncSource(s.source))}</td>
        <td class="sync-history-detail">${esc(i)}</td>
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
  `}function renderSyncHistoryPage(e,t){const n=e==="meta"?"Meta ad spend sync history":"GHL / Cenhub sync history",a=e==="meta"?"Every Meta metrics sync \u2014 scheduled, manual, and dashboard auto-refresh.":"Every GHL snapshot sync \u2014 scheduled Inngest jobs and manual admin syncs.",o=e==="ghl"?`<a class="admin-btn admin-btn--secondary" href="/admin/sync-history/${e==="meta"?"ghl":"meta"}">${esc(e==="meta"?"GHL sync log":"Meta sync log")}</a>`:"";return`
    ${renderBrandTopbar(renderStaffAdminChrome(e==="meta"?"meta-sync":"ghl-sync"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero">
      <div class="admin-breadcrumb">
        <a href="/admin">Clients</a>
        <span aria-hidden="true"> / </span>
        <span>${esc(n)}</span>
      </div>
      <h1>${esc(n)}</h1>
      <p>${esc(a)}${t.summary?.totalShown?` \xB7 ${t.summary.totalShown} run(s) shown`:""}</p>
    </div>
    <div class="sync-history-page">
      <div class="sync-history-toolbar">
        <div class="sync-history-toolbar-actions">
          <a class="admin-btn admin-btn--secondary" href="/admin">\u2190 Back to clients</a>
          ${o}
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
  `}let syncHistoryRefreshTimer=null;async function clearSyncHistoryLog(e){if(!isStaffAdmin())return;const t=e==="meta"?"Meta":"GHL",n=e==="meta"?"This only clears the history table. It does not change ad spend data or client sync status.":"This only clears the history table. It does not change GHL snapshot data or client sync status.";if(window.confirm(`Delete all ${t} sync log entries?

${n}`))try{const s=await adminFetch(`/api/sync-history?type=${encodeURIComponent(e)}`,{method:"DELETE"});showToast(`Cleared ${s.deleted||0} log entr${s.deleted===1?"y":"ies"}.`,"success"),await loadSyncHistoryPage(e)}catch(s){showToast(s.message||`Failed to clear ${t} sync log.`,"error")}}function renderSyncHistoryLoginPrompt(e){const t=e==="meta"?"Meta sync log":"GHL sync log";return`
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
      ${renderBrandTopbar(renderStaffAdminChrome(e==="meta"?"meta-sync":"ghl-sync"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading sync history...</p></div>')}
    `);try{const s=await adminFetch(`/api/sync-history?type=${encodeURIComponent(e)}&limit=150`);n.innerHTML=renderSyncHistoryPage(e,s);const i=document.getElementById("sync-history-refresh");i&&(i.onclick=()=>loadSyncHistoryPage(e));const o=document.getElementById("sync-history-clear-log");o&&(o.onclick=()=>clearSyncHistoryLog(e)),syncHistoryRefreshTimer&&(clearInterval(syncHistoryRefreshTimer),syncHistoryRefreshTimer=null),syncHistoryRefreshTimer=window.setInterval(()=>{loadSyncHistoryPage(e,{silent:!0}).catch(()=>{})},6e4)}catch(s){n.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome(e==="meta"?"meta-sync":"ghl-sync"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(s.message)}</div>`)}
    `}}let fbLeadSyncState={clients:[],preflightByClient:{},historyRuns:[],activeRun:null,previewOkByClient:{}},fbLeadSyncRefreshTimer=null;function renderFbLeadReadinessBadges(e){return`<div class="fb-lead-readiness">${[{key:"metaPageId",label:"Page",ok:!!e.metaPageId},{key:"ghl",label:"GHL",ok:e.hasGhlToken&&e.locationId},{key:"metaToken",label:"Meta token",ok:e.hasMetaToken},{key:"field",label:"Field id",ok:!0}].map(n=>`<span class="fb-lead-badge${n.ok?" is-ok":" is-missing"}">${esc(n.label)}</span>`).join("")}</div>`}function ghlContactUrl(e,t){return!e||!t?null:`https://app.gohighlevel.com/v2/location/${encodeURIComponent(e)}/contacts/detail/${encodeURIComponent(t)}`}function renderFbLeadClientRows(e){return e.length?`
    <div class="sync-history-table-wrap">
      <table class="sync-history-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Auto-sync</th>
            <th>Ready?</th>
            <th>Meta leads (90d)</th>
            <th>Missing (est.)</th>
            <th>Last run</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${e.map(n=>{const a=fbLeadSyncState.preflightByClient[n.clientId]||{},s=n.lastRun,i=s?`${s.status} \xB7 ${s.updated||0} updated`:"\u2014",o=a.estimatedMissing!=null?String(a.estimatedMissing):"\u2014",m=a.metaLeadCount90d!=null?String(a.metaLeadCount90d):"\u2014";return`
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
        <td>${esc(m)}</td>
        <td>${esc(o)}</td>
        <td>${esc(i)}</td>
        <td>
          <button class="admin-btn admin-btn--secondary admin-btn--small" type="button"
            onclick="openFbLeadRunPanel('${esc(n.clientId)}', 'recent')">Preview</button>
          <button class="admin-btn admin-btn--secondary admin-btn--small" type="button"
            onclick="openFbLeadRunPanel('${esc(n.clientId)}', 'backfill')">Backfill</button>
          <button class="admin-btn admin-btn--ghost admin-btn--small" type="button"
            onclick="viewFbLeadClientHistory('${esc(n.clientId)}')">View log</button>
          ${n.metaPageId?"":`<a class="admin-btn admin-btn--ghost admin-btn--small" href="/admin/${encodeURIComponent(n.clientId)}">Setup</a>`}
        </td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `:'<div class="sync-history-empty">No clients configured yet.</div>'}function renderFbLeadHistoryRows(e,t={}){return e.length?`
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
        <tbody>${e.map(a=>{const s=[a.mode,a.dryRun?"dry-run":"apply",`${a.updated||0} updated`,`${a.skippedNoMatch||0} no match`,a.errors?`${a.errors} errors`:null].filter(Boolean).join(" \xB7 ");return`
      <tr class="fb-lead-audit-row">
        <td>${esc(formatSyncHistoryTimestamp(a.startedAt))}</td>
        <td>${esc(a.accountName||a.clientId)}</td>
        <td>${renderSyncStatusBadge(a.status)}</td>
        <td>${esc(a.mode||"recent")}</td>
        <td>${esc(formatSyncSource(a.source))}</td>
        <td class="sync-history-detail">${esc(s)}</td>
        <td><button class="admin-btn admin-btn--ghost admin-btn--small" type="button" onclick="expandFbLeadRun(${Number(a.id)})">Audit</button></td>
      </tr>
      <tr id="fb-lead-run-audit-${Number(a.id)}" hidden>
        <td colspan="7">${renderFbLeadAuditTable(a.rows||[],t[a.clientId])}</td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `:'<div class="sync-history-empty">No FB lead sync runs logged yet.</div>'}function renderFbLeadAuditTable(e,t){return e.length?`
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
      <tbody>${e.map(a=>{const s=ghlContactUrl(t,a.contactId),i=s?`<a href="${esc(s)}" target="_blank" rel="noopener noreferrer">Open in GHL</a>`:"\u2014";return`
      <tr>
        <td>${esc(a.email||a.phone||"\u2014")}</td>
        <td><code>${esc(a.metaLeadId||"\u2014")}</code></td>
        <td>${esc(a.contactId||"\u2014")}</td>
        <td>${renderSyncStatusBadge(a.status)}</td>
        <td>${esc(a.error||"")}</td>
        <td>${i}</td>
      </tr>
    `}).join("")}</tbody>
    </table>
  `:'<div class="sync-history-empty" style="padding:12px">No contact-level rows stored for this run.</div>'}function renderFbLeadSyncPage(e){const t=e.summary||{};return`
    ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
    ${wrapDashboardShell(`
    <div class="page-hero admin-hub-hero">
      <div class="admin-breadcrumb">
        <a href="/admin">Clients</a>
        <span aria-hidden="true"> / </span>
        <span>FB lead sync</span>
      </div>
      <h1>Facebook Lead ID sync</h1>
      <p>Match Meta Lead Ads to GHL contacts and write the <code>Fb Lead id</code> custom field.</p>
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
          <div class="sync-history-stat-label">Last hourly run</div>
          <div class="sync-history-stat-value">${esc(formatSyncHistoryTimestamp(t.lastRunAt))}</div>
        </div>
        <div class="sync-history-stat">
          <div class="sync-history-stat-label">Updated last 24h</div>
          <div class="sync-history-stat-value">${esc(String(t.updatedLast24h??0))}</div>
        </div>
        <div class="sync-history-stat">
          <div class="sync-history-stat-label">Auto-sync enabled</div>
          <div class="sync-history-stat-value">${esc(String(t.enabledCount??0))} client(s)</div>
        </div>
        <div class="sync-history-stat">
          <div class="sync-history-stat-label">Schedule</div>
          <div class="sync-history-stat-value" style="font-size:13px;font-family:monospace">${esc(t.schedule||"\u2014")}</div>
        </div>
      </div>
      <h2 style="font-size:16px;margin:18px 0 10px">Clients</h2>
      ${renderFbLeadClientRows(e.clients||[])}
      <div id="fb-lead-run-panel-mount"></div>
      <h2 style="font-size:16px;margin:24px 0 10px">Run history</h2>
      <div id="fb-lead-history-mount">${renderFbLeadHistoryRows(fbLeadSyncState.historyRuns)}</div>
    </div>
    `)}
  `}async function toggleFbLeadSyncEnabled(e,t){try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"PUT",body:JSON.stringify({fbLeadSyncEnabled:t})}),showToast(t?"Hourly FB lead sync enabled":"Hourly FB lead sync disabled","success");const n=fbLeadSyncState.clients.find(a=>a.clientId===e);n&&(n.fbLeadSyncEnabled=t)}catch(n){showToast(n.message||"Failed to update auto-sync setting.","error"),await loadFbLeadSyncPage({silent:!0})}}function bindFbLeadSyncToggles(){document.querySelectorAll("[data-fb-sync-toggle]").forEach(e=>{e.onchange=()=>toggleFbLeadSyncEnabled(e.dataset.fbSyncToggle,e.checked)})}async function loadFbLeadPreflightForClients(e){const t={};await Promise.all(e.map(async n=>{try{t[n.clientId]=await adminFetch(`/api/fb-lead-sync/preflight?client=${encodeURIComponent(n.clientId)}`)}catch(a){t[n.clientId]={preflightError:a.message}}})),fbLeadSyncState.preflightByClient=t}async function loadFbLeadHistory(e=50){const t=await adminFetch(`/api/fb-lead-sync/history?limit=${e}`);return fbLeadSyncState.historyRuns=t.runs||[],t}function renderFbLeadRunPanel(e,t="recent"){const n=fbLeadSyncState.clients.find(s=>s.clientId===e),a=t==="backfill"?"Backfill (90 days)":"Recent (2 days)";return`
    <div class="fb-lead-run-panel" id="fb-lead-run-panel">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <strong>${esc(n?.accountName||e)}</strong>
          <div style="color:var(--text-soft);font-size:13px;margin-top:4px">${esc(a)}</div>
        </div>
        <button class="admin-btn admin-btn--ghost" type="button" onclick="closeFbLeadRunPanel()">Close</button>
      </div>
      ${t==="backfill"?'<div class="fb-lead-banner" style="margin-top:12px;margin-bottom:0">Run Preview first. Backfill only matches leads Meta still has (~90 days).</div>':""}
      <div class="fb-lead-run-actions">
        <button class="admin-btn admin-btn--secondary" type="button" id="fb-lead-preview-btn">Preview (dry run)</button>
        <button class="admin-btn admin-btn--primary" type="button" id="fb-lead-apply-btn" disabled>Apply sync</button>
      </div>
      <div class="fb-lead-progress" id="fb-lead-progress" hidden>
        <div class="fb-lead-progress-bar" id="fb-lead-progress-bar"></div>
      </div>
      <div id="fb-lead-run-results" style="margin-top:12px"></div>
    </div>
  `}function closeFbLeadRunPanel(){const e=document.getElementById("fb-lead-run-panel-mount");e&&(e.innerHTML=""),fbLeadSyncState.activeRun=null}function openFbLeadRunPanel(e,t){const n=document.getElementById("fb-lead-run-panel-mount");if(!n)return;fbLeadSyncState.activeRun={clientId:e,mode:t,runId:null,previewOk:!1},n.innerHTML=renderFbLeadRunPanel(e,t);const a=document.getElementById("fb-lead-preview-btn"),s=document.getElementById("fb-lead-apply-btn");a&&(a.onclick=()=>runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!0})),s&&(s.onclick=()=>{if(t==="backfill"&&!fbLeadSyncState.previewOkByClient[e]){showToast("Run Preview first before backfill.","error");return}window.confirm(`Apply ${t==="backfill"?"90-day backfill":"recent sync"} for ${e}?`)&&(fbLeadSyncState.activeRun&&(fbLeadSyncState.activeRun.runId=null),runFbLeadSyncBatch({clientId:e,mode:t,dryRun:!1}))}),n.scrollIntoView({behavior:"smooth",block:"nearest"})}function renderFbLeadRunResults(e){const t=(e.rows||[]).slice(0,100);return t.length?`
    <div class="sync-history-table-wrap">
      <table class="sync-history-table">
        <thead><tr><th>Email / phone</th><th>Meta lead id</th><th>GHL contact</th><th>Status</th></tr></thead>
        <tbody>${t.map(a=>`
    <tr>
      <td>${esc(a.email||a.phone||"\u2014")}</td>
      <td><code>${esc(a.metaLeadId||"\u2014")}</code></td>
      <td>${esc(a.contactId||"\u2014")}</td>
      <td>${renderSyncStatusBadge(a.status)}</td>
    </tr>
  `).join("")}</tbody>
      </table>
    </div>
    <p style="color:var(--text-soft);font-size:12px;margin-top:8px">
      Batch: ${e.batchProcessed||0} processed \xB7 ${e.updated||0} would update/updated \xB7 ${e.errors||0} errors
    </p>
  `:'<div class="sync-history-empty" style="padding:12px">No rows in this batch.</div>'}async function runFbLeadSyncBatch({clientId:e,mode:t,dryRun:n}){const a=document.getElementById("fb-lead-preview-btn"),s=document.getElementById("fb-lead-apply-btn"),i=document.getElementById("fb-lead-progress"),o=document.getElementById("fb-lead-progress-bar"),m=document.getElementById("fb-lead-run-results");a&&(a.disabled=!0),s&&(s.disabled=!0);let c=fbLeadSyncState.activeRun?.runId||null,f=0,h=null,w=[];try{i&&(i.hidden=!1);do{h=await adminFetch("/api/fb-lead-sync/run",{method:"POST",body:JSON.stringify({clientId:e,mode:t,dryRun:n,runId:c,batchOffset:f,batchLimit:25})});const v=h.summary||h;c=v.runId,f=v.batchOffset+(v.batchProcessed||0),w=w.concat(v.rows||[]),fbLeadSyncState.activeRun&&(fbLeadSyncState.activeRun.runId=c);const S=v.inWindow?Math.min(100,Math.round(f/v.inWindow*100)):100;o&&(o.style.width=`${S}%`),m&&(m.innerHTML=renderFbLeadRunResults({...v,rows:w}))}while(h.summary?.hasMore||h.hasMore);if(n)fbLeadSyncState.previewOkByClient[e]=!0,fbLeadSyncState.activeRun&&(fbLeadSyncState.activeRun.previewOk=!0),s&&(s.disabled=!1),showToast("Preview complete","success");else{showToast("FB lead sync complete","success"),await loadFbLeadHistory();const v=document.getElementById("fb-lead-history-mount");if(v){const S=Object.fromEntries(fbLeadSyncState.clients.map($=>[$.clientId,$.locationId]));v.innerHTML=renderFbLeadHistoryRows(fbLeadSyncState.historyRuns,S)}}}catch(v){showToast(v.message||"FB lead sync failed.","error")}finally{a&&(a.disabled=!1),s&&(s.disabled=t==="backfill"&&!fbLeadSyncState.previewOkByClient[e]),i&&(i.hidden=!0),o&&(o.style.width="0%")}}async function expandFbLeadRun(e){const t=document.getElementById(`fb-lead-run-audit-${e}`);if(t){if(!t.hidden){t.hidden=!0;return}try{const n=await adminFetch(`/api/fb-lead-sync/history/${e}`),a=fbLeadSyncState.clients.find(s=>s.clientId===n.run.clientId);t.innerHTML=`<td colspan="7">${renderFbLeadAuditTable(n.run.rows||[],n.run.locationId||a?.locationId)}</td>`,t.hidden=!1}catch(n){showToast(n.message||"Failed to load run audit.","error")}}}function viewFbLeadClientHistory(e){const t=fbLeadSyncState.historyRuns.filter(s=>s.clientId===e),n=document.getElementById("fb-lead-history-mount");if(!n)return;const a=Object.fromEntries(fbLeadSyncState.clients.map(s=>[s.clientId,s.locationId]));n.innerHTML=t.length?renderFbLeadHistoryRows(t,a):`<div class="sync-history-empty">No runs for ${esc(e)} yet.</div>`,n.scrollIntoView({behavior:"smooth",block:"start"})}async function loadFbLeadSyncPage({silent:e=!1}={}){const t=document.getElementById("dashboard");if(!t)return;const n=await fetchStaffMe();if(!n){e||(t.innerHTML=`
        ${renderBrandTopbar("")}
        ${wrapDashboardShell(`
          <div class="page-hero admin-hub-hero"><h1>FB lead sync</h1><p>Sign in to manage FB lead ID sync.</p></div>
          <div class="sync-history-page">
            <div class="sync-history-empty" style="padding:24px;text-align:center">
              <a class="admin-btn admin-btn--primary" href="/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}">Sign in</a>
            </div>
          </div>
        `)}
      `);return}currentStaffUser=n,e||(t.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
      ${wrapDashboardShell('<div class="loading-state"><div class="spinner"></div><p>Loading FB lead sync...</p></div>')}
    `);try{const a=await adminFetch("/api/fb-lead-sync");fbLeadSyncState.clients=a.clients||[],await Promise.all([loadFbLeadPreflightForClients(fbLeadSyncState.clients),loadFbLeadHistory()]),t.innerHTML=renderFbLeadSyncPage(a),bindFbLeadSyncToggles();const s=document.getElementById("fb-lead-sync-refresh");s&&(s.onclick=()=>loadFbLeadSyncPage()),fbLeadSyncRefreshTimer&&(clearInterval(fbLeadSyncRefreshTimer),fbLeadSyncRefreshTimer=null),fbLeadSyncRefreshTimer=window.setInterval(()=>{loadFbLeadSyncPage({silent:!0}).catch(()=>{})},6e4)}catch(a){t.innerHTML=`
      ${renderBrandTopbar(renderStaffAdminChrome("fb-lead-sync"))}
      ${wrapDashboardShell(`<div class="error-state" style="padding:24px">${esc(a.message)}</div>`)}
    `}}function renderAdminHubPage(e){const t=e.length,n=currentStaffUser?`
          <a class="admin-btn admin-btn--secondary" href="/admin/sync-history/meta">Meta sync log</a>
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
        ${t?e.map(s=>renderClientCard(s)).join(""):`<div class="hub-empty">${isStaffAdmin()?"No clients yet. Create your first client below.":"No clients yet."}</div>`}
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
  `}function filterHubCards(){const e=(document.getElementById("hub-search")?.value||"").trim().toLowerCase();let t=0;document.querySelectorAll("#client-grid .client-card").forEach(a=>{const s=!e||(a.dataset.search||"").includes(e);a.style.display=s?"":"none",s&&(t+=1)});const n=document.getElementById("hub-no-results");n&&(n.style.display=e&&!t?"":"none")}function renderAddClientPanel(){return`
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
    `}}}let slugCheckTimer=null;function suggestNewClientSlug(){const e=document.getElementById("new-account-name")?.value||"",t=document.getElementById("new-client-slug");!t||t.dataset.userEdited==="true"||(t.value=e.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),checkNewClientSlug())}function checkNewClientSlug(){const e=document.getElementById("new-client-slug");e&&(e.dataset.userEdited="true"),clearTimeout(slugCheckTimer),slugCheckTimer=setTimeout(async()=>{const t=document.getElementById("new-client-slug")?.value||"",n=document.getElementById("slug-status");if(!n||!t){n&&(n.textContent="");return}try{const a=await adminFetch(`/api/clients/check-slug?slug=${encodeURIComponent(t)}`);n.className=`slug-status ${a.available?"ok":"bad"}`,n.textContent=a.available?`Available \xB7 ${a.adminUrl}`:`Unavailable (${a.reason||"taken"})`}catch(a){n.className="slug-status bad",n.textContent=a.message}},300)}async function createClient(){const e=document.getElementById("new-account-name")?.value?.trim(),t=document.getElementById("new-client-slug")?.value?.trim(),n=document.getElementById("new-location-id")?.value?.trim();if(!e||!t){window.alert("Account name and slug are required.");return}try{await adminFetch("/api/clients",{method:"POST",body:JSON.stringify({accountName:e,clientId:t,locationId:n||null})}),showToast("Client created","success"),window.location.href=`/admin/${encodeURIComponent(t)}`}catch(a){showToast(a.message,"error")}}let hubSyncPollTimer=null,hubSyncPendingIds=new Set,hubSyncPollStartedAt=0,hubSyncBaselineAt=new Map;function stopHubSyncPolling(){hubSyncPollTimer&&(clearInterval(hubSyncPollTimer),hubSyncPollTimer=null),hubSyncPendingIds=new Set,hubSyncPollStartedAt=0,hubSyncBaselineAt=new Map}function isClientSyncing(e){return e.status==="syncing"||e.lastSyncStatus==="syncing"}function hubBatchStillPending(e){if(!hubSyncPendingIds.size)return!1;const t=new Map((e||[]).map(n=>[n.clientId,n]));for(const n of hubSyncPendingIds){const a=t.get(n);if(!a)continue;if(isClientSyncing(a))return!0;if(a.lastSyncStatus==="error")continue;if(hubSyncBaselineAt.get(n)===a.lastSyncAt)return!0}return!1}async function pollHubSyncProgress(){if(!IS_ADMIN_HUB||!document.getElementById("client-grid")){stopHubSyncPolling();return}if(hubSyncPollStartedAt&&Date.now()-hubSyncPollStartedAt>900*1e3){stopHubSyncPolling(),showToast("Some sync jobs are still running. Refresh the page in a minute.","error");return}try{const t=(await adminFetch("/api/clients")).clients||[];if(updateHubCardsFromClients(t),hubBatchStillPending(t))return;const n=new Set(hubSyncPendingIds);stopHubSyncPolling();const a=document.getElementById("dashboard");a&&(a.innerHTML=renderAdminHubPage(t));const s=t.filter(i=>n.has(i.clientId)&&i.lastSyncStatus==="error");s.length?showToast(`${s.length} sync(s) failed`,"error"):showToast("All clients synced","success")}catch{}}function startHubSyncPolling(e=[],t=[]){stopHubSyncPolling(),hubSyncPendingIds=new Set(e),hubSyncPollStartedAt=Date.now(),hubSyncBaselineAt=new Map((t||[]).filter(n=>e.includes(n.clientId)).map(n=>[n.clientId,n.lastSyncAt])),markHubCardsSyncing(e),pollHubSyncProgress(),hubSyncPollTimer=setInterval(pollHubSyncProgress,3e3)}function markHubCardsSyncing(e=[]){e.forEach(t=>{const n=document.querySelector(`.client-card[data-client-id="${t}"]`);if(!n)return;const a=n.querySelector(".status-badge");a&&(a.className="status-badge status-syncing",a.textContent=statusLabel("syncing"));const s=n.querySelector("[data-sync-meta]");s&&(s.textContent="Syncing now...")})}function updateHubCardsFromClients(e){(e||[]).forEach(t=>{const n=document.querySelector(`.client-card[data-client-id="${t.clientId}"]`);if(!n)return;const a=n.querySelector(".status-badge");a&&(a.className=`status-badge status-${t.status}`,a.textContent=statusLabel(t.status));const s=n.querySelector("[data-sync-meta]");s&&(s.textContent=formatRelativeSync(t.lastSyncAt,t.status))})}async function syncAllClients(e){e&&(e.disabled=!0);try{showToast("Syncing all clients...");const t=await adminFetch("/api/clients",{method:"POST",body:JSON.stringify({action:"sync-all"})});if(t.queued){const a=t.count??(t.clientIds||[]).length;showToast(`Syncing ${a} client${a===1?"":"s"} in background`,"success");const s=await adminFetch("/api/clients");startHubSyncPolling(t.clientIds||[],s.clients||[]);return}const n=(t.results||[]).filter(a=>!a.success);n.length?showToast(`${n.length} sync(s) failed`,"error"):showToast("All clients synced","success"),await loadAdminHub()}catch(t){showToast(t.message,"error")}finally{e&&(e.disabled=!1)}}async function deleteClient(e){const t=e;if(!window.confirm(`Delete "${t}" permanently?

This removes the account, GHL token, and all synced snapshot data. This cannot be undone.`))return;if(window.prompt(`Type "${e}" to confirm deletion:`)!==e){showToast("Deletion cancelled \u2014 slug did not match.","error");return}try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"DELETE"}),showToast(`Deleted ${e}`,"success"),IS_ADMIN_HUB?await loadAdminHub():window.location.href="/admin"}catch(s){showToast(s.message,"error")}}async function syncClient(e,t){t&&(t.disabled=!0,t.textContent="Syncing...");try{await adminFetch(`/api/clients/${encodeURIComponent(e)}/sync`,{method:"POST",body:"{}"}),showToast("Sync completed","success"),IS_ADMIN_HUB?await loadAdminHub():IS_ADMIN_CLIENT?(await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0,{background:!0})):loadDashboard(!0,{background:!0})}catch(n){showToast(n.message,"error")}finally{if(t){t.disabled=!1;const n=t.dataset.syncLabel||"Sync";t.innerHTML=t.dataset.syncLabel?`${ICON_SYNC} ${n}`:n}}}function getMetricsModelLabels(e,t=setupPipelines){const n=new Map((t||[]).map(a=>[a.id,a.name]));return e.dedupeEnabled?{typeLabel:"Funnel + deduplication",winLabel:`Win pipeline: ${n.get(e.winPipelineId)||e.winPipelineId||"\u2014"}`}:e.winPipelineId?{typeLabel:"Simple (single win pipeline)",winLabel:`Win pipeline: ${n.get(e.winPipelineId)||e.winPipelineId}`}:{typeLabel:"Simple (no deduplication)",winLabel:"All won opportunities"}}const ICON_CHECK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',ICON_LAYER='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',ICON_MERGE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="15" r="2.4"/><path d="M6 8.4V15.6"/><path d="M8.2 6.4C14 6.4 14 12.6 15.8 13.4"/></svg>',ICON_TARGET='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>',ICON_LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 018 0v3.5"/></svg>',ICON_UNLOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="2"/><path d="M8 10.5V7a4 4 0 017.8-1.2"/></svg>',ICON_TAG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 12.7L12.7 20.6a2 2 0 01-2.8 0l-7-7a2 2 0 010-2.8L10.8 3H19a2 2 0 012 2v7.7z"/><circle cx="15" cy="8" r="1.2"/></svg>',ICON_HASH='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M5 15h14M10 3L8 21M16 3l-2 18"/></svg>',ICON_EDIT='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',ICON_WARNING='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.6 18a1.5 1.5 0 001.3 2.2h16.2a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-3.4 0z"/><path d="M12 9v4"/><path d="M12 16.5h.01"/></svg>';function renderMetricsModelPanel(e){const t=getMetricsModelLabels(e),n=!e.metricsModelSetAt||metricsModelChangeMode,a=n?" is-wizard":" is-locked",s=e.dedupeEnabled?"dedupe":e.winPipelineId?"pipeline":"simple",i=e.metricsModelLockedAt?`Locked since ${new Date(e.metricsModelLockedAt).toLocaleDateString("en-GB")}`:"Editable until first successful sync",o=e.metricsModelLockedAt?"metrics-model-badge is-locked":"metrics-model-badge";return n?`
    <div class="metrics-model-panel${a}">
      <div class="metrics-model-header">
        <div class="metrics-model-heading">
          <h3 class="metrics-model-title">${metricsModelChangeMode?"Change metrics model":"Metrics model"}</h3>
        </div>
      </div>
      <p class="metrics-model-copy">How should wins and revenue be counted for this client?</p>
      <div class="metrics-option-cards">
        <label class="metrics-option-card">
          <input type="radio" name="metrics-model-type" value="simple" ${s==="simple"?"checked":""} onchange="onMetricsModelTypeChange()" />
          <span class="metrics-option-card-top">
            <span class="metrics-option-card-icon">${ICON_LAYER}</span>
            <span class="metrics-option-card-title">Simple</span>
            <span class="metrics-option-card-radio">${ICON_CHECK}</span>
          </span>
          <span class="metrics-option-card-desc">Every won deal counts, from any pipeline. For clients without duplicate opportunities.</span>
        </label>
        <label class="metrics-option-card">
          <input type="radio" name="metrics-model-type" value="dedupe" ${s==="dedupe"?"checked":""} onchange="onMetricsModelTypeChange()" />
          <span class="metrics-option-card-top">
            <span class="metrics-option-card-icon">${ICON_MERGE}</span>
            <span class="metrics-option-card-title">Funnel + dedup</span>
            <span class="metrics-option-card-radio">${ICON_CHECK}</span>
          </span>
          <span class="metrics-option-card-desc">Wins count from one win pipeline only (e.g. Eftersalg). Duplicates are merged by contact.</span>
        </label>
      </div>
      <div class="metrics-model-win-select" id="metrics-win-pipeline-wrap" style="${s==="dedupe"?"":"display:none"}">
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
          <span class="${o}">${e.metricsModelLockedAt?ICON_LOCK:ICON_UNLOCK} ${e.metricsModelLockedAt?"Locked":"Editable"}</span>
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
              <div class="metrics-model-fact-value">${i}</div>
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
    `}function updateMetricsApplyState(){const e=document.getElementById("metrics-apply-btn");if(!e||!metricsModelChangeMode)return;const t=!!document.getElementById("metrics-acknowledge-impact")?.checked,n=document.getElementById("metrics-confirm-slug")?.value?.trim()||"";e.disabled=!(t&&n===CLIENT_SLUG)}function onMetricsModelTypeChange(){const e=document.querySelector('input[name="metrics-model-type"]:checked')?.value,t=document.getElementById("metrics-win-pipeline-wrap");t&&(t.style.display=e==="dedupe"?"":"none")}async function saveMetricsModel(){const t=(document.querySelector('input[name="metrics-model-type"]:checked')?.value||"simple")==="dedupe",n=t&&document.getElementById("metrics-win-pipeline")?.value||null;if(t&&!n){showToast("Select a win pipeline for deduplication mode.","error");return}const a={dedupeEnabled:t,winPipelineId:n,afterSalesPipelineId:t?n:void 0};metricsModelChangeMode&&(a.confirmSlug=document.getElementById("metrics-confirm-slug")?.value?.trim()||"",a.acknowledgeImpact=!!document.getElementById("metrics-acknowledge-impact")?.checked);try{await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}/metrics-model`,{method:"POST",body:JSON.stringify(a)}),metricsModelChangeMode=!1,showToast("Metrics model saved","success"),await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0,{background:!0})}catch(s){showToast(s.message,"error")}}function startMetricsModelChange(){if(metricsModelChangeMode=!0,setupAccount){const e=document.getElementById("setup-panel-mount");e&&(e.innerHTML=renderClientSetupPanel(setupAccount))}}function cancelMetricsModelChange(){if(metricsModelChangeMode=!1,setupAccount){const e=document.getElementById("setup-panel-mount");e&&(e.innerHTML=renderClientSetupPanel(setupAccount))}}function renderPipelineSelect(e,t,n,a,s=""){return`
    <div class="field-group">
      <label for="${e}">${t}</label>
      <select id="${e}">
        <option value="">\u2014 Select pipeline \u2014</option>
        ${a.map(i=>`
          <option value="${esc(i.id)}" ${i.id===n?"selected":""}>${esc(i.name)}</option>
        `).join("")}
      </select>
      ${s?`<p class="field-hint">${esc(s)}</p>`:""}
    </div>
  `}function getSetupProgressSteps(e){return[{id:"metrics",label:"Metrics",done:!!e.metricsModelSetAt},{id:"ghl",label:"GHL",done:!!(e.hasGhlToken&&e.locationId)},{id:"pipelines",label:"Pipelines",done:!!(e.newLeadsPipelineId&&e.salesPipelineId)},{id:"meta",label:"Meta",done:e.metaSyncStatus==="ok",partial:!!(e.metaAdAccountId&&e.metaSyncStatus!=="ok")}]}function renderSetupProgressStrip(e){const t=getSetupProgressSteps(e),n='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';return`
    <nav class="setup-progress" aria-label="Setup progress">
      ${t.map((a,s)=>{const i=a.done?" is-done":a.partial?" is-partial":"",o=a.done?`<span class="setup-progress-mark">${n}</span>`:`<span class="setup-progress-mark">${s+1}</span>`;return`
          <button type="button" class="setup-progress-step${i}" onclick="scrollToSetupSection('${a.id}')">
            ${o}
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
                <span>Enable hourly FB lead ID sync</span>
              </label>
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label for="setup-ghl-fb-lead-field-id">GHL Fb Lead id field (optional override)</label>
              <input id="setup-ghl-fb-lead-field-id" type="text" value="${esc(e.ghlFbLeadFieldId||"")}" placeholder="Defaults to env GHL_FB_LEAD_FIELD_ID or Censio field" />
            </div>
          </div>
          <div class="setup-actions-inline">
            <button class="admin-btn admin-btn--secondary" type="button" onclick="syncMetaMetricsClient('${CLIENT_SLUG}')">${ICON_SYNC} Sync Meta metrics</button>
            ${e.hasSavedMetaSystemUserToken?`<button class="admin-btn admin-btn--ghost" type="button" onclick="clearMetaSystemUserToken('${CLIENT_SLUG}')">Clear saved token override</button>`:""}
            <a class="setup-section-sync-time" href="/admin/fb-lead-sync" style="margin-left:12px">Open FB lead sync dashboard \u2192</a>
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
  `}async function initAdminClientPage(){if(await requireStaffAuth()){renderAdminClientShell();try{await loadSetupAccount()}catch(t){const n=document.getElementById("setup-panel-mount");n&&(n.innerHTML=`<div class="note" style="padding:24px">${esc(t.message)}</div>`);return}accountCanPreviewDashboard(setupAccount)&&(ensureChartsVisible(),loadDashboard(!0))}}async function loadSetupAccount(){if(IS_ADMIN_CLIENT)try{setupAccount=(await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}`)).account,setupAccount.accessKey&&!CLIENT_ACCESS_KEY&&(CLIENT_ACCESS_KEY=setupAccount.accessKey),setupAccount.newLeadsPipelineId&&!setupPipelines.length&&await fetchSetupPipelines(!0);const t=document.getElementById("setup-panel-mount");t&&(t.innerHTML=renderClientSetupPanel(setupAccount))}catch(e){const t=document.getElementById("setup-panel-mount");throw t&&(t.innerHTML=`<div class="note" style="padding:24px">${esc(e.message)}</div>`),showToast(e.message,"error"),e}}async function fetchSetupPipelines(e=!1,t=null){t&&(t.disabled=!0,t.textContent="Fetching...");try{setupPipelines=(await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}/sync-pipelines`,{method:"POST",body:"{}"})).pipelines||[],e||showToast(`${setupPipelines.length} pipeline(s) loaded`,"success"),await loadSetupAccount()}catch(n){showToast(n.message,"error")}finally{if(t){t.disabled=!1;const n=t.dataset.syncLabel||"Fetch pipelines from GHL";t.innerHTML=`${ICON_SYNC} ${n}`}}}function collectMetaSetupPayload(){const e={metaAdAccountId:document.getElementById("setup-meta-ad-account-id")?.value?.trim()||null,metaPageId:document.getElementById("setup-meta-page-id")?.value?.trim()||null,metaPixelId:document.getElementById("setup-meta-pixel-id")?.value?.trim()||null,facebookClientId:document.getElementById("setup-facebook-client-id")?.value?.trim()||null,fbLeadSyncEnabled:!!document.getElementById("setup-fb-lead-sync-enabled")?.checked,ghlFbLeadFieldId:document.getElementById("setup-ghl-fb-lead-field-id")?.value?.trim()||null},t=document.getElementById("setup-meta-system-token")?.value?.trim();t&&(e.metaSystemUserToken=t);const n=document.getElementById("setup-meta-page-token")?.value?.trim();return n&&(e.metaPageAccessToken=n),e}async function clearMetaSystemUserToken(e){try{await adminFetch(`/api/clients/${encodeURIComponent(e)}`,{method:"PUT",body:JSON.stringify({clearMetaSystemUserToken:!0})}),showToast("Saved Meta token override cleared \u2014 using Vercel env token","success"),await loadSetupAccount()}catch(t){showToast(t.message,"error")}}async function saveSetupAccount(){try{const e=document.getElementById("setup-account-name")?.value?.trim();if(!e){showToast("Dashboard heading is required.","error");return}const t={accountName:e,locationId:document.getElementById("setup-location-id")?.value?.trim()||null,timezone:document.getElementById("setup-timezone")?.value?.trim()||"Europe/Copenhagen",newLeadsPipelineId:document.getElementById("setup-new-leads")?.value||null,salesPipelineId:document.getElementById("setup-sales")?.value||null,afterSalesPipelineId:document.getElementById("setup-after-sales")?.value||null,readyForGhl:!!document.getElementById("setup-ready-ghl")?.checked,...collectMetaSetupPayload()},n=document.getElementById("setup-ghl-token")?.value?.trim();n&&(t.ghlToken=n),await adminFetch(`/api/clients/${encodeURIComponent(CLIENT_SLUG)}`,{method:"PUT",body:JSON.stringify(t)}),showToast("Account saved","success"),await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0)}catch(e){showToast(e.message,"error")}}async function syncMetaMetricsClient(e){try{const t=collectMetaSetupPayload();if(!t.metaAdAccountId){showToast("Enter a Meta Ad Account ID first.","error");return}showToast("Saving Meta settings and syncing\u2026","info"),document.getElementById("setup-meta-system-token")?.value?.trim()||(t.clearMetaSystemUserToken=!0);const a=await adminFetch(`/api/clients/${encodeURIComponent(e)}/sync-meta`,{method:"POST",body:JSON.stringify(t)});if(a.skipped)showToast(a.reason||"Meta sync skipped","error");else{let s="Meta metrics synced";a.tokenSource&&(s+=` (${a.tokenSource} token)`),a.ignoredAccountOverride&&(s+=" \u2014 cleared invalid saved token override"),showToast(s,"success")}await loadSetupAccount(),accountCanPreviewDashboard(setupAccount)&&loadDashboard(!0)}catch(t){showToast(t.message,"error"),await loadSetupAccount()}}(function(t){const n=["#ff6a00","#138b53","#0085f2","#dc640a","#833b08","#a07868","#ff9147","#6b5348"],a={open:"#0085f2",won:"#138b53",lost:"#dc640a",abandoned:"#a07868"};function s(l){const u=String(l).match(/^(\d{4})-W(\d{2})$/);if(!u)return null;const d=Number(u[1]),y=Number(u[2]),r=new Date(Date.UTC(d,0,4)),p=r.getUTCDay()||7,g=new Date(r);g.setUTCDate(r.getUTCDate()-p+1);const k=new Date(g);k.setUTCDate(g.getUTCDate()+(y-1)*7);const I=new Date(k);return I.setUTCDate(k.getUTCDate()+3),{monday:new Date(k.getUTCFullYear(),k.getUTCMonth(),k.getUTCDate()),thursday:new Date(I.getUTCFullYear(),I.getUTCMonth(),I.getUTCDate())}}function i(l){let u=0;for(let d=1;d<=l.getDate();d+=1)new Date(l.getFullYear(),l.getMonth(),d).getDay()===1&&(u+=1);return u}function o(l){const u=s(l);if(!u)return String(l).replace("-W"," W");const d=u.monday,y=d.toLocaleDateString("da-DK",{month:"short"}).replace(".","").replace(/^\w/u,p=>p.toUpperCase()),r=i(d);return`${y} W${r}`}function m(l){const[u,d]=String(l).split("-");return new Date(Number(u),Number(d)-1,1).toLocaleDateString("da-DK",{month:"short",year:"2-digit"})}function c(l,u=18){const d=String(l);return d.length>u?`${d.slice(0,u-1)}\u2026`:d}function f(){return{text:"#1a1208",muted:"#6b5348",grid:"rgba(26, 18, 8, 0.1)",border:"#e8e0d8",tooltipBg:"#ffffff",tooltipBorder:"#e8e0d8",tooltipText:"#1a1208"}}function h(l,u,d,y){return{labels:l.map(r=>y(r[u])),values:l.map(r=>Number(r[d])||0)}}function w(l){const u=Number(l)||0;return u>=1e6?`${(u/1e6).toFixed(1)}M`:u>=1e3?`${Math.round(u/1e3)}K`:u}function v(l){const u=new Map((l.monthlyAdSpend||[]).map(r=>[r.month,Number(r.spend)||0])),d=new Map((l.monthlyRevenue||[]).map(r=>[r.month,Number(r.revenue)||0])),y=[...new Set([...u.keys(),...d.keys()])].sort();return{dualAxis:!0,labels:y.map(r=>m(r)),spendValues:y.map(r=>u.get(r)||0),revenueValues:y.map(r=>d.get(r)||0)}}function S(l,u,d){const y=u.spendValues.some(r=>r>0)||u.revenueValues.some(r=>r>0);return!u.labels.length||!y?null:{type:"bar",data:{labels:u.labels,datasets:[{type:"bar",label:"Ad Spend",data:u.spendValues,backgroundColor:"#ff6a00cc",borderColor:"#ff6a00",borderWidth:2,borderRadius:6,maxBarThickness:42,yAxisID:"y",order:2},{type:"line",label:"Won Revenue",data:u.revenueValues,backgroundColor:"#138b5333",borderColor:"#138b53",borderWidth:2.5,fill:!0,tension:.35,pointRadius:4,pointHoverRadius:6,yAxisID:"y1",order:1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"bottom",align:"center",labels:{color:d.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:d.tooltipBg,borderColor:d.tooltipBorder,borderWidth:1,titleColor:d.tooltipText,bodyColor:d.muted,padding:12,callbacks:{label(r){const p=r.parsed.y??0;return`${r.dataset.label}: Dkr ${Math.round(p).toLocaleString("da-DK")}`}}}},scales:{x:{ticks:{color:d.muted,maxRotation:45,minRotation:0},grid:{color:d.grid},border:{color:d.border}},y:{type:"linear",position:"left",title:{display:!0,text:"Ad Spend (Dkr)",color:"#ff6a00",font:{size:11,weight:"600"}},ticks:{color:"#ff6a00",callback:w},grid:{color:d.grid},border:{color:d.border},beginAtZero:!0},y1:{type:"linear",position:"right",title:{display:!0,text:"Won Revenue (Dkr)",color:"#138b53",font:{size:11,weight:"600"}},ticks:{color:"#138b53",callback:w},grid:{drawOnChartArea:!1},border:{color:d.border},beginAtZero:!0}}}}}const $={weeklyRevenue:{title:"Won Revenue (Weekly)",defaultType:"area",format:"currency",extract(l){return h(l.weeklyRevenue||[],"week","revenue",o)}},monthlyRevenue:{title:"Won Revenue (Monthly)",defaultType:"area",format:"currency",extract(l){return h(l.monthlyRevenue||[],"month","revenue",m)}},weeklyLeads:{title:"New Leads (Weekly)",defaultType:"area",format:"number",extract(l){return h(l.weeklyLeads||[],"week","count",o)}},monthlyLeads:{title:"New Leads (Monthly)",defaultType:"area",format:"number",extract(l){return h(l.monthlyLeads||[],"month","count",m)}},conversionTrend:{title:"Conversion Rate Trend",defaultType:"line",format:"percent",extract(l){return h(l.monthlyConversion||[],"month","rate",m)}},statusBreakdown:{title:"Opportunity Status",defaultType:"doughnut",format:"number",extract(l){const u=l.chartStatusBreakdown||l.statusBreakdown||{},d=["open","won","lost","abandoned"];return{labels:["Open","Won","Lost","Abandoned"],values:d.map(y=>Number(u[y])||0),colors:d.map(y=>a[y])}}},marketingSpendComparison:{title:"Facebook Ad Spend",defaultType:"area",format:"currency",extract(l){return h((l.monthlyAdSpend||[]).slice(-8),"month","spend",m)}},monthlyCostPerLead:{title:"Cost per Lead (Monthly)",defaultType:"area",format:"currency",extract(l){return h(l.monthlyCostPerLead||[],"month","cpl",m)}}};function M(l,u,d,y){const r=Number(l)||0,p=Array.isArray(d)?d[y]:u;return p==="ratio"?`${r.toFixed(2)}x`:p==="currency"||u==="currency"?`Dkr ${Math.round(r).toLocaleString("da-DK")}`:p==="percent"||u==="percent"?`${r.toFixed(1)}%`:Math.round(r).toLocaleString("da-DK")}function T(l,u,d){const y=$[l];if(!y)return null;const r=y.extract(u),p=f();if(r.dualAxis||d==="dualAxis")return S(y,r,p);if(!r.labels?.length||r.values.every(b=>b===0))return null;const g=["pie","doughnut","polarArea"].includes(d),k=r.colors||r.labels.map((b,C)=>n[C%n.length]),I=d==="area"?"line":d==="horizontalBar"?"bar":d,A=`${n[0]}55`,L=d==="doughnut",E={label:y.title,data:r.values,backgroundColor:g?L?k:k.map(b=>`${b}cc`):r.colors?r.colors.map(b=>`${b}cc`):d==="area"?A:`${n[0]}cc`,borderColor:g?k:r.colors||n[0],borderWidth:g?L?0:1:2,fill:d==="area",tension:.35,borderRadius:g?0:6,maxBarThickness:42,...L?{cutout:"62%",borderAlign:"inner"}:{}};return{type:I,data:{labels:r.labels,datasets:[E]},options:{responsive:!0,maintainAspectRatio:L?!1:g,indexAxis:d==="horizontalBar"?"y":"x",plugins:{legend:{display:g,position:"bottom",align:"center",labels:{color:p.text,boxWidth:12,boxHeight:12,padding:14}},tooltip:{backgroundColor:p.tooltipBg,borderColor:p.tooltipBorder,borderWidth:1,titleColor:p.tooltipText,bodyColor:p.muted,padding:12,callbacks:{label(b){const C=b.parsed,D=typeof C=="object"?C.y??C.x??0:C??0;return`${b.label}: ${M(D,y.format,r.valueFormats,b.dataIndex)}`}}}},...L?{layout:{padding:8},devicePixelRatio:typeof window<"u"?Math.min(window.devicePixelRatio||1,2):1,elements:{arc:{borderAlign:"inner"}}}:{},scales:g?{}:{x:{ticks:{color:p.muted,maxRotation:45,minRotation:0},grid:{color:p.grid},border:{color:p.border}},y:{ticks:{color:p.muted,callback(b,C){return y.format==="mixed"&&r.valueFormats?.[C]==="ratio"?`${Number(b).toFixed(2)}x`:y.format==="currency"||r.valueFormats?.[C]==="currency"?b>=1e6?`${(b/1e6).toFixed(1)}M`:b>=1e3?`${Math.round(b/1e3)}K`:b:y.format==="percent"?`${b}%`:b}},grid:{color:p.grid},border:{color:p.border},beginAtZero:!0}}}}}t.DashboardCharts={CHART_DEFINITIONS:$,buildChartConfig:T,formatTooltipValue:M}})(window);const STORAGE_KEY=`cenhub_display_${CLIENT_SLUG}`,LEGACY_STORAGE_KEY="suntech-dashboard-display",PIPELINE_KEY="suntech-dashboard-pipelines",DISPLAY_OPTIONS={kpis:{totalRevenue:"Total Revenue",adSpend:"Ad Spend",roas:"ROAS",roasDk:"ROAS (DK)",poas:"POAS",poasDk:"POAS (DK)",costPerLead:"Cost per Lead",costPerWonClient:"Cost per Won Client",clientsWon:"Clients Won",totalLeads:"Total Leads",totalLeadsValue:"Total Leads Value",averageLeadValue:"Average Lead Value",conversionRate:"Conversion Rate",totalBundlinje:"Total Bundlinje",openLeads:"Open Leads",openPipelineValue:"Open Pipeline Value",averageWonDealSize:"Avg Won Deal Size"},sections:{statusBreakdown:"Opportunity Status (Cards)",sourceReport:"Lead Source Report",assigneeReport:"Leads Closed by Assignee",pipelineBreakdown:"Pipeline Breakdown"},charts:{weeklyRevenue:"Won Revenue (Weekly)",monthlyRevenue:"Won Revenue (Monthly)",marketingSpendComparison:"Facebook Ad Spend",monthlyCostPerLead:"Cost per Lead (Monthly)",weeklyLeads:"New Leads (Weekly)",monthlyLeads:"New Leads (Monthly)",conversionTrend:"Conversion Rate Trend",statusBreakdown:"Opportunity Status"},statusItems:{open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned"},columns:{sourceReport:{totalLeads:"Total leads",totalValue:"Total values",open:"Open",won:"Won",lost:"Lost",abandoned:"Abandoned",winPct:"Win %"},assigneeReport:{won:"Won",totalLeads:"Total leads",wonValue:"Won revenue",totalValue:"Total value"},pipelineBreakdown:{count:"Leads",won:"Won",monetary:"Value",profit:"Bundlinje",wonValue:"Won revenue"}}},state={pipelineIds:usesClientPipelineDefaults()?[]:loadPipelineSelection(),status:"all",source:"all",assignedTo:"all",dateField:"createdAt",dateFrom:"",dateTo:"",adSpend:"",preset:"all"};let cachedData=null,cachedFacebookMetrics=null,cachedMonthlyAdSpend=null,availablePipelines=[],display=loadDisplayPrefs(),pipelineDefaultsApplied=!1,chartInstances={},chartFieldsCache=null,chartFieldsCacheKey=null,lastFetchedAt=0;const DATA_REFRESH_MS=120*1e3,DATA_FRESH_MS=DATA_REFRESH_MS,CHART_FIELD_KEYS=["weeklyRevenue","monthlyRevenue","weeklyLeads","monthlyLeads","monthlyLeadsValue","monthlyConversion","chartStatusBreakdown"];function getChartCacheKey(){return[[...state.pipelineIds].sort().join(","),state.status,state.source,state.assignedTo,state.dateField,state.dateFrom||"",state.dateTo||""].join("|")}function cacheChartFields(e){chartFieldsCache={},CHART_FIELD_KEYS.forEach(t=>{e[t]!==void 0&&(chartFieldsCache[t]=e[t])}),chartFieldsCacheKey=getChartCacheKey()}function applyChartFieldsCache(e){if(!!!(state.dateFrom||state.dateTo))return cacheChartFields(e),e;if(chartFieldsCache&&chartFieldsCacheKey===getChartCacheKey()){const n={...e};return CHART_FIELD_KEYS.forEach(a=>{chartFieldsCache[a]!==void 0&&(n[a]=chartFieldsCache[a])}),n}return cacheChartFields(e),e}function getDefaultChartPrefs(){const e={};return(window.DashboardCharts?Object.keys(DashboardCharts.CHART_DEFINITIONS):Object.keys(DISPLAY_OPTIONS.charts)).forEach(n=>{e[n]=!0}),e}function destroyCharts(){Object.values(chartInstances).forEach(e=>e.destroy()),chartInstances={}}function mountCharts(e){typeof Chart>"u"||!window.DashboardCharts||(destroyCharts(),Object.keys(DashboardCharts.CHART_DEFINITIONS).forEach(t=>{if(!isVisible("charts",t))return;const n=DashboardCharts.CHART_DEFINITIONS[t],a=document.getElementById(`chart-${t}`);if(!a)return;const i=a.closest(".chart-card")?.querySelector(".chart-empty"),o=n?.defaultType||"bar",m=DashboardCharts.buildChartConfig(t,e,o);if(!m){a.style.display="none",i&&(i.style.display="block");return}a.style.display="block",i&&(i.style.display="none"),chartInstances[t]=new Chart(a,m)}))}function usesClientPipelineDefaults(){return IS_CLIENT_VIEW||IS_ADMIN}function getPipelineStorageKey(){return`cenhub_pipelines_${facebookClientId||CLIENT_SLUG}`}function loadPipelineSelection(){try{const e=JSON.parse(localStorage.getItem(getPipelineStorageKey())||"[]");return Array.isArray(e)?e:[]}catch{return[]}}function getAllPipelineIds(e){return e.map(t=>t.id)}function getDefaultPipelineIds(e,t=[]){const n=getAllPipelineIds(e),a=(t||[]).filter(s=>n.includes(s));return a.length?a:n.length?n:[]}function ensurePipelineDefaults(e,t=[]){if(!e.length)return;if(usesClientPipelineDefaults()){state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0;return}const n=getAllPipelineIds(e);let a=loadPipelineSelection();if(!a.length)try{a=JSON.parse(localStorage.getItem(PIPELINE_KEY)||"[]")}catch{a=[]}!a.length||!pipelineDefaultsApplied?(a.length?(state.pipelineIds=a.filter(s=>n.includes(s)),state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t))):state.pipelineIds=getDefaultPipelineIds(e,t),pipelineDefaultsApplied=!0,savePipelineSelection()):state.pipelineIds.length||(state.pipelineIds=getDefaultPipelineIds(e,t),savePipelineSelection())}function ensurePipelineSelectionBeforeFetch(){return state.pipelineIds.length?!0:availablePipelines.length?(state.pipelineIds=getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds),state.pipelineIds.length&&!usesClientPipelineDefaults()&&savePipelineSelection(),state.pipelineIds.length>0):!1}function savePipelineSelection(){localStorage.setItem(getPipelineStorageKey(),JSON.stringify(state.pipelineIds))}function isPipelineSelected(e){return state.pipelineIds.includes(e)}function isAllPipelinesSelected(e){const t=getAllPipelineIds(e);return t.length>0&&t.every(n=>state.pipelineIds.includes(n))}function selectAllPipelines(e){state.pipelineIds=getAllPipelineIds(e),savePipelineSelection()}function clearPipelineSelection(){state.pipelineIds=[],savePipelineSelection()}function setPipelineSelection(e){state.pipelineIds=[...new Set(e)],savePipelineSelection()}function togglePipelineSelection(e){isPipelineSelected(e)?state.pipelineIds=state.pipelineIds.filter(t=>t!==e):state.pipelineIds=[...state.pipelineIds,e],savePipelineSelection()}function formatSelectedPipelines(e){return state.pipelineIds.length?isAllPipelinesSelected(e)?"All pipelines":state.pipelineIds.map(t=>e.find(n=>n.id===t)?.name||t).join(", "):"None selected"}function renderPipelineChips(e){return state.pipelineIds.length?`
    <div class="pipeline-chips">
      ${state.pipelineIds.map(n=>e.find(a=>a.id===n)).filter(Boolean).map(n=>`
        <span class="pipeline-chip">${esc(n.name)}</span>
      `).join("")}
    </div>
  `:'<div class="pipeline-warning">Select at least one pipeline, then click Apply data filters.</div>'}function defaultDisplayPrefs(){const e={kpis:{},sections:{},charts:getDefaultChartPrefs(),statusItems:{},columns:{}};return Object.keys(DISPLAY_OPTIONS.kpis).forEach(t=>{e.kpis[t]=!0}),Object.keys(DISPLAY_OPTIONS.sections).forEach(t=>{e.sections[t]=!0}),Object.keys(DISPLAY_OPTIONS.charts).forEach(t=>{e.charts[t]=!0}),Object.keys(DISPLAY_OPTIONS.statusItems).forEach(t=>{e.statusItems[t]=!0}),Object.entries(DISPLAY_OPTIONS.columns).forEach(([t,n])=>{e.columns[t]={},Object.keys(n).forEach(a=>{e.columns[t][a]=!0})}),e}function loadDisplayPrefs(){if(IS_CLIENT_VIEW&&!IS_PREVIEW)return defaultDisplayPrefs();try{const e=JSON.parse(localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_STORAGE_KEY)||"null");if(!e)return defaultDisplayPrefs();const t=defaultDisplayPrefs();return{kpis:{...t.kpis,...e.kpis},sections:{...t.sections,...e.sections},charts:{...t.charts,...e.charts},statusItems:{...t.statusItems,...e.statusItems},columns:{sourceReport:{...t.columns.sourceReport,...e.columns?.sourceReport||{}},assigneeReport:{...t.columns.assigneeReport,...e.columns?.assigneeReport||{}},pipelineBreakdown:{...t.columns.pipelineBreakdown,...e.columns?.pipelineBreakdown||{}}}}}catch{return defaultDisplayPrefs()}}function ensureChartsVisible(){const e=Object.keys(DISPLAY_OPTIONS.charts);e.some(n=>display.charts[n]!==!1)||(e.forEach(n=>{display.charts[n]=!0}),saveDisplayPrefs())}function saveDisplayPrefs(){localStorage.setItem(STORAGE_KEY,JSON.stringify(display))}function isVisible(e,t,n){return e==="columns"?display.columns[n]?.[t]!==!1:display[e]?.[t]!==!1}function toggleDisplay(e,t,n){e==="columns"?display.columns[n][t]=!display.columns[n][t]:display[e][t]=!display[e][t],saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}function setAllDisplay(e,t,n){e==="columns"?Object.keys(DISPLAY_OPTIONS.columns[n]).forEach(a=>{display.columns[n][a]=t}):Object.keys(DISPLAY_OPTIONS[e]).forEach(a=>{display[e][a]=t}),saveDisplayPrefs(),cachedData&&updateDashboardContent(cachedData)}const fmt=e=>new Intl.NumberFormat("da-DK",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(Number(e)||0)),fmtCompact=e=>{const t=Number(e)||0;return t>=1e6?`${(t/1e6).toFixed(2)}M`:t>=1e3?`${(t/1e3).toFixed(2)}K`:fmt(t)},fmtPct=e=>`${(Number(e)||0).toFixed(2)}%`,fmtRoas=e=>{const t=Number(e)||0;return t>0?`${t.toFixed(2)}x`:"\u2014"};function formatActiveDateFilter(e){if(!e.dateFrom&&!e.dateTo)return"Till date";const t=getDashboardTimeZone();if(window.MarketingMetrics?.formatShortDateLabel){const n=window.MarketingMetrics.formatShortDateLabel(e.dateFrom,t),a=window.MarketingMetrics.formatShortDateLabel(e.dateTo,t);if(n&&a)return`${n} \u2013 ${a}`}return`${e.dateFrom||"start"} to ${e.dateTo||"now"}`}function showDateRangeError(e){document.querySelectorAll("#date-range-error").forEach(t=>{t.textContent=e,t.hidden=!e})}function clearDateRangeError(){showDateRangeError("")}function needsFreshData(){return!lastFetchedAt||Date.now()-lastFetchedAt>DATA_FRESH_MS}function buildQuery(e,t={}){const n=new URLSearchParams,a=getAllPipelineIds(e||[]),s=state.pipelineIds.filter(i=>a.includes(i));if(!s.length)throw new Error("Select at least one pipeline.");return n.set("pipelineIds",s.join(",")),state.dateField&&n.set("dateField",state.dateField),state.dateFrom&&n.set("dateFrom",state.dateFrom),state.dateTo&&n.set("dateTo",state.dateTo),["status","source","assignedTo","adSpend"].forEach(i=>{state[i]&&state[i]!=="all"&&n.set(i,state[i])}),appendTenantParams(n),t.forceFresh&&n.set("fresh","1"),n.toString()}function formatDateInput(e){const t=e.getFullYear(),n=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${n}-${a}`}function getDashboardTimeZone(){return cachedData?.account?.timezone||"Europe/Copenhagen"}function getCalendarPartsInTimeZone(e,t=new Date){const n=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(t);return{year:Number(n.find(a=>a.type==="year")?.value),month:Number(n.find(a=>a.type==="month")?.value),day:Number(n.find(a=>a.type==="day")?.value)}}function formatMonthDateRange(e,t){const n=`${e}-${String(t).padStart(2,"0")}-01`,a=new Date(e,t,0).getDate(),s=`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`;return{start:n,end:s}}const datePickerState={inputId:null,anchorEl:null,viewYear:null,viewMonth:null};let datePickerListenersBound=!1;function isoFromParts(e,t,n){const a=Number(n);return!e||!t||!Number.isFinite(a)?"":`${e}-${String(t).padStart(2,"0")}-${String(a).padStart(2,"0")}`}function formatPickerDisplayLabel(e,t){if(!e||!/^\d{4}-\d{2}-\d{2}$/.test(e))return t;const n=getDashboardTimeZone();return window.MarketingMetrics?.formatShortDateLabel&&window.MarketingMetrics.formatShortDateLabel(e,n)||e}function ensureDatePickerPopover(){if(document.getElementById("date-picker-popover"))return;const e=document.createElement("div");e.id="date-picker-backdrop",e.className="date-picker-backdrop",e.hidden=!0,e.addEventListener("click",closeDatePicker),document.body.appendChild(e);const t=document.createElement("div");t.id="date-picker-popover",t.className="date-picker-popover",t.hidden=!0,t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),document.body.appendChild(t)}function syncDatePickerDisplays(){[{id:"dateFrom",key:"dateFrom",placeholder:"Pick start date"},{id:"dateTo",key:"dateTo",placeholder:"Pick end date"}].forEach(({id:e,key:t,placeholder:n})=>{const a=document.getElementById(e),s=document.getElementById(`${e}-display`),i=document.getElementById(`${e}-trigger`),o=state[t]??"";a&&(a.value=o),s&&(s.textContent=formatPickerDisplayLabel(o,n)),i?.classList.toggle("is-empty",!o),i?.classList.toggle("has-value",!!o)})}function getStateDateValue(e){return state[e]??""}function getDatePickerViewMonth(e){const t=getStateDateValue(e);if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[n,a]=t.split("-").map(Number);return{year:n,month:a}}return getCalendarPartsInTimeZone(getDashboardTimeZone())}function getTodayIso(){const e=getCalendarPartsInTimeZone(getDashboardTimeZone());return isoFromParts(e.year,e.month,e.day)}function isStartDateDisabled(e){return e>=getTodayIso()}function isFutureDateDisabled(e){return e>getTodayIso()}function isFutureMonthView(e,t){const n=getCalendarPartsInTimeZone(getDashboardTimeZone());return e>n.year||e===n.year&&t>n.month}function isDatePickerDayDisabled(e,t){return t==="dateFrom"&&isStartDateDisabled(e)?!0:isFutureDateDisabled(e)}function renderDatePickerDayCell(e,t,n,a,s,i,o,m){const c=["date-picker-day"];if(n&&c.push("is-outside"),e===a&&c.push("is-today"),e===s&&c.push("is-selected"),i&&o){const f=i<=o?i:o,h=i<=o?o:i;e>=f&&e<=h&&c.push("is-in-range")}return e===i&&c.push("is-range-start"),e===o&&c.push("is-range-end"),isDatePickerDayDisabled(e,m)?(c.push("is-disabled"),`<button type="button" class="${c.join(" ")}" disabled aria-disabled="true">${t}</button>`):`<button type="button" class="${c.join(" ")}" onclick="selectDatePickerDay('${e}')">${t}</button>`}function renderDatePickerPopover(){const e=document.getElementById("date-picker-popover");if(!e||!datePickerState.inputId)return;const{viewYear:t,viewMonth:n,inputId:a}=datePickerState,s=new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(new Date(t,n-1,1)),i=["Mo","Tu","We","Th","Fr","Sa","Su"],m=(new Date(t,n-1,1).getDay()+6)%7,c=new Date(t,n,0).getDate(),f=new Date(t,n-1,0).getDate(),h=getCalendarPartsInTimeZone(getDashboardTimeZone()),w=isoFromParts(h.year,h.month,h.day),v=getStateDateValue(a),S=getStateDateValue("dateFrom"),$=getStateDateValue("dateTo");let M="";for(let p=m-1;p>=0;p-=1){const g=f-p,k=n===1?12:n-1,I=n===1?t-1:t,A=isoFromParts(I,k,g);M+=renderDatePickerDayCell(A,g,!0,w,v,S,$,a)}for(let p=1;p<=c;p+=1){const g=isoFromParts(t,n,p);M+=renderDatePickerDayCell(g,p,!1,w,v,S,$,a)}const T=(7-(m+c)%7)%7;for(let p=1;p<=T;p+=1){const g=n===12?1:n+1,k=n===12?t+1:t,I=isoFromParts(k,g,p);M+=renderDatePickerDayCell(I,p,!0,w,v,S,$,a)}const l=a==="dateFrom"?'<span class="date-picker-hint">Start date must be before today</span>':"",u=a==="dateTo"?'<button type="button" class="date-picker-footer-btn primary" onclick="setDatePickerToday()">Today</button>':"",d=n===12?1:n+1,y=n===12?t+1:t,r=!isFutureMonthView(y,d);e.innerHTML=`
    <div class="date-picker-panel">
      <div class="date-picker-header">
        <div class="date-picker-title">${esc(s)}</div>
        <div class="date-picker-nav">
          <button type="button" class="date-picker-nav-btn" aria-label="Previous month" onclick="shiftDatePickerMonth(-1)">${ICON_CHEVRON_LEFT}</button>
          <button type="button" class="date-picker-nav-btn" aria-label="Next month" onclick="shiftDatePickerMonth(1)" ${r?"":"disabled"}>${ICON_CHEVRON_RIGHT}</button>
        </div>
      </div>
      <div class="date-picker-weekdays">
        ${i.map(p=>`<div class="date-picker-weekday">${p}</div>`).join("")}
      </div>
      <div class="date-picker-grid">${M}</div>
      <div class="date-picker-footer">
        ${l}
        <button type="button" class="date-picker-footer-btn" onclick="clearDatePickerField()">Clear</button>
        ${u}
      </div>
    </div>
  `}function positionDatePickerPopover(){const e=document.getElementById("date-picker-popover"),t=datePickerState.anchorEl;if(!e||!t)return;e.hidden=!1,e.style.visibility="hidden",e.style.left="0",e.style.top="0",e.style.transform="";const n=t.getBoundingClientRect(),a=e.getBoundingClientRect(),s=8;let i=n.bottom+s,o=n.left;window.innerWidth<=640?(o=Math.max(16,(window.innerWidth-a.width)/2),i=Math.max(16,(window.innerHeight-a.height)/2),e.style.transform="none"):(o+a.width>window.innerWidth-16&&(o=window.innerWidth-a.width-16),o<16&&(o=16),i+a.height>window.innerHeight-16&&(i=Math.max(16,n.top-a.height-s))),e.style.top=`${i}px`,e.style.left=`${o}px`,e.style.visibility=""}function openDatePicker(e,t){ensureDatePickerPopover();const n=document.getElementById("date-picker-popover"),a=document.getElementById("date-picker-backdrop");if(!n||!a||!t)return;if(datePickerState.inputId===e&&!n.hidden){closeDatePicker();return}closeDatePicker(),datePickerState.inputId=e,datePickerState.anchorEl=t;const s=getDatePickerViewMonth(e);datePickerState.viewYear=s.year,datePickerState.viewMonth=s.month,renderDatePickerPopover(),a.hidden=!1,t.classList.add("is-active"),positionDatePickerPopover()}function closeDatePicker(){const e=document.getElementById("date-picker-popover"),t=document.getElementById("date-picker-backdrop");e&&(e.hidden=!0),t&&(t.hidden=!0),datePickerState.anchorEl?.classList.remove("is-active"),datePickerState.inputId=null,datePickerState.anchorEl=null}function shiftDatePickerMonth(e){let{viewYear:t,viewMonth:n}=datePickerState;n+=e,n<1?(n=12,t-=1):n>12&&(n=1,t+=1),!(e>0&&isFutureMonthView(t,n))&&(datePickerState.viewYear=t,datePickerState.viewMonth=n,renderDatePickerPopover(),positionDatePickerPopover())}function selectDatePickerDay(e){const t=datePickerState.inputId;if(!t||!/^\d{4}-\d{2}-\d{2}$/.test(e))return;if(isDatePickerDayDisabled(e,t)){showDateRangeError(t==="dateFrom"?"Start date must be before today.":"End date cannot be after today.");return}t==="dateFrom"&&(state.dateFrom=e),t==="dateTo"&&(state.dateTo=e);const n=document.getElementById(t);n&&(n.value=e),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function setDatePickerToday(){if(datePickerState.inputId==="dateFrom"){showDateRangeError("Start date must be before today.");return}const e=getCalendarPartsInTimeZone(getDashboardTimeZone());selectDatePickerDay(isoFromParts(e.year,e.month,e.day))}function clearDatePickerField(){const e=datePickerState.inputId;if(!e)return;state[e]="";const t=document.getElementById(e);t&&(t.value=""),closeDatePicker(),syncDatePickerDisplays(),onManualDateChange()}function handleDatePickerEscape(e){e.key==="Escape"&&closeDatePicker()}function initDatePickers(){ensureDatePickerPopover(),syncDatePickerDisplays(),datePickerListenersBound||(document.addEventListener("keydown",handleDatePickerEscape),window.addEventListener("resize",closeDatePicker),datePickerListenersBound=!0)}let lastCustomDateFrom="",lastCustomDateTo="";function getPresetDateRange(e){const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="month")return formatMonthDateRange(n,a);if(e==="lastMonth"){let s=n,i=a-1;return i<1&&(i=12,s-=1),formatMonthDateRange(s,i)}return e==="year"?{start:`${n}-01-01`,end:`${n}-12-31`}:null}function isPresetGeneratedRange(e,t){return!e||!t?!1:["month","lastMonth","year"].some(n=>{const a=getPresetDateRange(n);return a&&e===a.start&&t===a.end})}function saveCustomDateRange(){!state.dateFrom||!state.dateTo||isPresetGeneratedRange(state.dateFrom,state.dateTo)||(lastCustomDateFrom=state.dateFrom,lastCustomDateTo=state.dateTo)}function restoreCustomDateRange(){if(lastCustomDateFrom&&lastCustomDateTo&&!isPresetGeneratedRange(lastCustomDateFrom,lastCustomDateTo)){state.dateFrom=lastCustomDateFrom,state.dateTo=lastCustomDateTo;return}state.dateFrom="",state.dateTo=""}function setPreset(e){state.preset==="custom"&&e!=="custom"&&saveCustomDateRange(),state.preset=e;const t=getDashboardTimeZone(),{year:n,month:a}=getCalendarPartsInTimeZone(t);if(e==="all")state.dateFrom="",state.dateTo="",state.dateField="createdAt";else if(e==="month"){const s=formatMonthDateRange(n,a);state.dateFrom=s.start,state.dateTo=s.end,state.dateField="lastStatusChangeAt"}else if(e==="lastMonth"){let s=n,i=a-1;i<1&&(i=12,s-=1);const o=formatMonthDateRange(s,i);state.dateFrom=o.start,state.dateTo=o.end,state.dateField="lastStatusChangeAt"}else if(e==="year"){const s=getPresetDateRange("year");state.dateFrom=s.start,state.dateTo=s.end,state.dateField="lastStatusChangeAt"}else e==="custom"&&(state.dateField="createdAt",restoreCustomDateRange())}function updateCustomDateRowVisibility(){document.querySelectorAll("#custom-date-row").forEach(e=>{e.hidden=state.preset!=="custom"})}function updateFilterUi(){const e=document.getElementById("dateFrom"),t=document.getElementById("dateTo"),n=document.getElementById("adSpend");e&&(e.value=state.dateFrom||""),t&&(t.value=state.dateTo||""),n&&(n.value=state.adSpend||""),["status","source","assignedTo","dateField"].forEach(a=>{const s=document.getElementById(a);s&&(s.value=state[a])}),document.querySelectorAll("[data-preset]").forEach(a=>{a.classList.toggle("active",a.dataset.preset===state.preset)}),updateCustomDateRowVisibility(),syncDatePickerDisplays(),refreshPipelinePanel()}function onManualDateChange(){if(syncFiltersFromDom(),state.preset="custom",state.dateField="createdAt",state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date."),updateFilterUi();return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){state.dateFrom="";const e=document.getElementById("dateFrom");e&&(e.value=""),showDateRangeError("Start date must be before today."),updateFilterUi();return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){state.dateTo="";const e=document.getElementById("dateTo");e&&(e.value=""),showDateRangeError("End date cannot be after today."),updateFilterUi();return}clearDateRangeError(),updateFilterUi(),state.dateFrom&&state.dateTo&&(saveCustomDateRange(),applyDataFilters(!1))}function onFilterChange(e,t){state[e]=t,applyDataFilters(!1)}async function fetchJson(e,t){const n=new AbortController,a=setTimeout(()=>n.abort(),FETCH_TIMEOUT_MS),s=()=>n.abort();t?.addEventListener("abort",s);try{const i=await fetch(e,{signal:n.signal}),o=await i.json().catch(()=>({}));if(!i.ok)throw new Error(o.error||`Request failed (${i.status})`);return o}catch(i){throw i.name==="AbortError",i}finally{clearTimeout(a),t?.removeEventListener("abort",s)}}async function fetchFacebookMetrics(e){try{const t=new URLSearchParams({client:facebookClientId});return CLIENT_ACCESS_KEY&&t.set("key",CLIENT_ACCESS_KEY),await fetchJson(`/api/facebook-metrics?${t}`,e)}catch(t){if(t.name==="AbortError")throw t;return null}}function resolveMarketingPreset(){return["all","month","lastMonth","year"].includes(state.preset)?state.preset:state.preset==="custom"&&state.dateFrom&&state.dateTo?"custom":state.preset}function applyMarketingData(e,t){if(!window.MarketingMetrics)return e;const n=resolveMarketingPreset(),a=n==="custom",s=window.MarketingMetrics.applyMarketingToDashboard(e,t,n,{timeZone:e.account?.timezone||"Europe/Copenhagen",dateFrom:a?state.dateFrom:null,dateTo:a?state.dateTo:null});return s.monthlyAdSpend?.length&&(cachedMonthlyAdSpend=s.monthlyAdSpend),cachedMonthlyAdSpend?.length&&(s.monthlyAdSpend=cachedMonthlyAdSpend),window.MarketingMetrics?.buildMonthlyCostPerLead&&(s.monthlyCostPerLead=window.MarketingMetrics.buildMonthlyCostPerLead(s.monthlyAdSpend,s.monthlyLeads||e.monthlyLeads||[])),s}async function fetchDashboardData(e,t,n={}){const a=buildQuery(e,n),s=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,t);return applyChartFieldsCache(s)}async function bootstrapDashboardData(e,t={}){const n=new URLSearchParams;appendTenantParams(n),t.forceFresh&&n.set("fresh","1");const a=n.toString(),s=await fetchJson(`/api/dashboard${a?`?${a}`:""}`,e);return s.account?.facebookClientId?facebookClientId=s.account.facebookClientId:s.account?.clientId&&(facebookClientId=s.account.clientId),applyChartFieldsCache(s)}function refreshPipelinePanel(){const e=document.getElementById("pipeline-panel");if(e){if(!availablePipelines.length){e.innerHTML='<div class="pipeline-note">Sync client data to load pipelines.</div>';return}e.innerHTML=renderPipelineSelector(availablePipelines)}}function selectAllPipelinesAction(){selectAllPipelines(availablePipelines),refreshPipelinePanel()}function clearPipelineSelectionAction(){clearPipelineSelection(),refreshPipelinePanel()}function togglePipelineSelectionAction(e){togglePipelineSelection(e),refreshPipelinePanel()}function selectCenhubPipelinesAction(){setPipelineSelection(getDefaultPipelineIds(availablePipelines,cachedData?.account?.defaultPipelineIds)),refreshPipelinePanel()}function renderPipelineSelector(e){return e.length?`
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
        ${n.map(s=>`
          <option value="${esc(s.id)}" ${s.id===a?"selected":""}>${esc(s.name)}</option>
        `).join("")}
      </select>
    </div>
  `}function renderCheckboxGroup(e,t,n,a){const s=Object.entries(n);return`
    <div class="display-group">
      <h3>${e}</h3>
      <div class="widget-actions" style="margin-bottom:10px">
        <button class="widget-btn" onclick="setAllDisplay('${t}', true${a?`, '${a}'`:""})">Select all</button>
        <button class="widget-btn" onclick="setAllDisplay('${t}', false${a?`, '${a}'`:""})">Clear all</button>
      </div>
      <div class="checkbox-list">
        ${s.map(([i,o])=>`
          <label class="checkbox-item">
            <input type="checkbox"
              ${isVisible(t,i,a)?"checked":""}
              onchange="toggleDisplay('${t}', '${i}'${a?`, '${a}'`:""})" />
            <span>${o}</span>
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
    `}function renderTable(e,t,n,a,s){const i=n.filter(o=>isVisible("columns",o.key,e));return i.length?`
    <table>
      <thead>
        <tr>
          <th>${t}</th>
          ${i.map(o=>`<th class="${o.align||""}">${o.label}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${a.length?a.map(o=>`
          <tr>
            <td>${s(o,"label")}</td>
            ${i.map(m=>`<td class="${m.align||""}">${s(o,m.key)}</td>`).join("")}
          </tr>
        `).join(""):`<tr><td colspan="${i.length+1}">Ingen data for valgte filtre.</td></tr>`}
      </tbody>
    </table>
  `:'<div class="empty-section">No columns selected for this table.</div>'}function renderDatePickerTrigger(e,t,n){const a=state[e]||"",s=formatPickerDisplayLabel(a,n);return`
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
        <span class="date-picker-value" id="${e}-display">${esc(s)}</span>
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
  `}function renderDashboardContent(e){const{kpis:t,statusBreakdown:n,sourceReport:a,assigneeReport:s,pipelines:i,filters:o}=e,m=isVisible("sections","statusBreakdown");return`
    ${renderMetricsChangeBanner(e)}
    ${renderKpiCards(t)}

    ${renderChartsSection()}

    ${m?`
      <div class="card">
        <div class="section-title">Opportunity Status (Cards)</div>
        ${renderStatusBreakdown(n)}
      </div>
    `:""}

    ${isVisible("sections","sourceReport")?`
      <div class="card">
        <div class="section-title">Lead Source Report</div>
        ${renderTable("sourceReport","Source",[{key:"totalLeads",label:"Total leads",align:"num"},{key:"totalValue",label:"Total values",align:"num"},{key:"open",label:"Open",align:"num"},{key:"won",label:"Won",align:"num"},{key:"lost",label:"Lost",align:"num"},{key:"abandoned",label:"Abandoned",align:"num"},{key:"winPct",label:"Win %",align:"num"}],a,(c,f)=>f==="label"?esc(c.source):f==="totalValue"?`Dkr ${fmt(c.totalValue)}`:f==="winPct"?fmtPct(c.winPct):fmt(c[f]))}
      </div>
    `:""}

    ${isVisible("sections","assigneeReport")||isVisible("sections","pipelineBreakdown")?`
      <div class="section-grid">
        ${isVisible("sections","assigneeReport")?`
          <div class="card">
            <div class="section-title">Leads Closed by Assignee</div>
            ${renderTable("assigneeReport","Assignee",[{key:"won",label:"Won",align:"num"},{key:"totalLeads",label:"Total leads",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"},{key:"totalValue",label:"Total value",align:"num"}],s,(c,f)=>f==="label"?esc(c.assigneeName):f==="wonValue"||f==="totalValue"?`Dkr ${fmt(c[f])}`:fmt(c[f]))}
          </div>
        `:""}
        ${isVisible("sections","pipelineBreakdown")?`
          <div class="card">
            <div class="section-title">Pipeline Breakdown</div>
            ${renderTable("pipelineBreakdown","Pipeline",[{key:"count",label:"Leads",align:"num"},{key:"won",label:"Won",align:"num"},{key:"monetary",label:"Value",align:"num"},{key:"profit",label:"Bundlinje",align:"num"},{key:"wonValue",label:"Won revenue",align:"num"}],i,(c,f)=>f==="label"?esc(c.name):f==="monetary"||f==="profit"||f==="wonValue"?`Dkr ${fmt(c[f])}`:fmt(c[f]))}
          </div>
        `:""}
      </div>
    `:""}

    ${IS_ADMIN?`
    <div class="note">
      ${t.usingCenhubDefaults?"Till-date Total Leads uses deduped opportunities from account pipeline defaults. ":""}
      Active filters: source=${o.source}, assignee=${o.assignedTo}, dates=${formatActiveDateFilter(o)}.
    </div>
    `:""}
    <div class="brand-footer">
      Dashboard by Cenhub
      \xB7 Holstebro
    </div>
  `}function updateDashboardContent(e){if(IS_ADMIN){const n=document.getElementById("admin-filters-panel");n&&(n.outerHTML=renderAdminFiltersPanel(e.filterOptions||{pipelines:[],statuses:[],sources:[],assignees:[],dateFields:[]}));const a=document.getElementById("admin-display-panel");if(a){const s=!!a.open;a.outerHTML=renderAdminDisplayOptions(s)}}const t=document.getElementById("dashboard-content");t&&(t.innerHTML=renderDashboardContent(e),mountCharts(e))}function renderDashboard(e){const t=document.getElementById("dashboard"),{filterOptions:n,account:a={}}=e,s=document.querySelector("details.panel")?.open,i=a.accountName||"Dashboard";IS_CLIENT_VIEW&&a.accountName&&(document.title=`${a.accountName} \xB7 Cenhub Dashboard`),t.innerHTML=`
    ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
    ${wrapDashboardShell(`
    ${IS_ADMIN_CLIENT?`
    <div id="setup-panel-mount"></div>
    <details class="panel admin-preview-section"${document.querySelector(".admin-preview-section")?.open?" open":""}>
      <summary>${ICON_CHART} Dashboard preview <span style="color:var(--text-soft);font-weight:500">\xB7 advanced filters</span><span class="summary-chevron">${ICON_CHEVRON}</span></summary>
      ${renderAdminFiltersPanel(n)}
      ${renderAdminDisplayOptions(s)}
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
    ${IS_ADMIN?renderAdminDisplayOptions(s):""}
    <div class="content-area" id="dashboard-content">
      ${renderDashboardContent(e)}
    </div>
    `}
    `)}
  `,IS_ADMIN_CLIENT&&loadSetupAccount(),initDatePickers()}let isFetching=!1,pendingRefetch=!1,fetchGeneration=0,activeFetchController=null,fetchStartedAt=0;const FETCH_TIMEOUT_MS=9e4;function restoreDashboardContentAfterFailedFetch(e){!e||!cachedData||(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi())}function setPresetButtonsDisabled(e){document.querySelectorAll("[data-preset]").forEach(t=>{t.disabled=e})}function resetFetchUiState(){isFetching=!1,setPresetButtonsDisabled(!1);const e=document.getElementById("apply-filters-btn");e&&(e.disabled=!1,e.textContent="Apply data filters")}function cancelActiveFetch(){activeFetchController&&(activeFetchController.abort(),activeFetchController=null)}function canReuseBootstrapDashboard(e){return!!(e?.kpis&&usesClientPipelineDefaults()&&!state.dateFrom&&!state.dateTo&&state.status==="all"&&state.source==="all"&&state.assignedTo==="all")}async function loadDashboard(e=!0,t={}){const{background:n=!1,forceFresh:a=!1}=t,s=!!a,i=document.getElementById("dashboard");if(isFetching&&(e||!cachedData))cancelActiveFetch(),fetchGeneration+=1,pendingRefetch=!1,resetFetchUiState();else if(isFetching){e&&(pendingRefetch=!0);return}const o=!!document.getElementById("dashboard-content"),m=document.getElementById("apply-filters-btn");if(e||!cachedData){const c=++fetchGeneration;activeFetchController=new AbortController;const f=activeFetchController.signal;if(isFetching=!0,fetchStartedAt=Date.now(),!o)i.innerHTML=`
        ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
        ${wrapDashboardShell(`
          <div class="loading-state">
            <div class="spinner"></div>
            ${LOADING_MSG}
          </div>
        `)}`;else if(!n){const h=document.getElementById("dashboard-content");h&&(h.innerHTML=renderKpiSkeleton()),m&&(m.disabled=!0,m.textContent="Loading..."),setPresetButtonsDisabled(!0)}try{let h=null;if(!availablePipelines.length){if(h=await bootstrapDashboardData(f),c!==fetchGeneration)return;availablePipelines=h.filterOptions.pipelines||[],ensurePipelineDefaults(availablePipelines,h.account?.defaultPipelineIds)}if(!ensurePipelineSelectionBeforeFetch())throw new Error("Select at least one pipeline.");const v=canReuseBootstrapDashboard(h)&&!s;let S,$;if(v?[$,S]=await Promise.all([fetchFacebookMetrics(f),Promise.resolve(h)]):[S,$]=await Promise.all([fetchDashboardData(availablePipelines,f,{forceFresh:s}),fetchFacebookMetrics(f)]),c!==fetchGeneration)return;cachedFacebookMetrics=$,cachedData=applyMarketingData(S,$),cachedData.account?.facebookClientId?facebookClientId=cachedData.account.facebookClientId:cachedData.account?.clientId&&(facebookClientId=cachedData.account.clientId),availablePipelines=cachedData.filterOptions.pipelines||availablePipelines,ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),lastFetchedAt=cachedData.cachedAt?new Date(cachedData.cachedAt).getTime():Date.now()}catch(h){if(c!==fetchGeneration)return;if(h.name==="AbortError"){o?restoreDashboardContentAfterFailedFetch(o):i.innerHTML=`
            ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
            ${wrapDashboardShell(`
              <div class="error-state">
                <div>Fejl ved hentning af data</div>
                <div style="margin-top:8px;font-size:12px;color:#666">Request timed out. Pr\xF8v igen.</div>
                <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            `)}`;return}if(IS_ADMIN_CLIENT&&o){const w=document.getElementById("dashboard-content");w&&(w.innerHTML=`
            <div class="note admin-setup-placeholder">
              ${esc(h.message)}
              <div style="margin-top:12px">
                <button type="button" class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
              </div>
            </div>`)}else o?o&&cachedData?(restoreDashboardContentAfterFailedFetch(o),showToast(h.message||"Failed to load filtered data.","error")):m&&(m.textContent="Apply failed - try again"):i.innerHTML=`
          ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
          ${wrapDashboardShell(`
            <div class="error-state">
              <div>Fejl ved hentning af data</div>
              <div style="margin-top:8px;font-size:12px;color:#666">${esc(h.message)}</div>
              <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
            </div>
          `)}`;return}finally{c===fetchGeneration&&(activeFetchController=null,resetFetchUiState()),pendingRefetch&&(pendingRefetch=!1,loadDashboard(!0))}if(c!==fetchGeneration)return}try{o?(cachedData=applyMarketingData(cachedData,cachedFacebookMetrics),updateDashboardContent(cachedData),updateFilterUi()):(renderDashboard(cachedData),mountCharts(cachedData))}catch(c){resetFetchUiState(),i.innerHTML=`
      ${renderBrandTopbar(IS_ADMIN?'<a class="admin-topbar-link" href="/admin">Admin hub</a>':"")}
      ${wrapDashboardShell(`
        <div class="error-state">
          <div>Fejl ved visning af dashboard</div>
          <div style="margin-top:8px;font-size:12px;color:#666">${esc(c.message)}</div>
          <button class="refresh-btn primary" onclick="loadDashboard(true)">${RETRY_MSG}</button>
        </div>
      `)}
    `}}function syncFiltersFromDom(){["status","source","assignedTo","dateField"].forEach(t=>{const n=document.getElementById(t);n&&(state[t]=n.value)});const e=document.getElementById("adSpend");if(e&&(state.adSpend=e.value),state.preset==="custom"){const t=document.getElementById("dateFrom"),n=document.getElementById("dateTo");t&&(state.dateFrom=t.value),n&&(state.dateTo=n.value),state.dateField="createdAt"}}function hasPartialDateRange(){return!!(state.dateFrom&&!state.dateTo||!state.dateFrom&&state.dateTo)}function applyPreset(e){if(clearDateRangeError(),closeDatePicker(),setPreset(e),updateFilterUi(),e==="custom"){const t=document.getElementById("dateFrom-trigger");t&&openDatePicker("dateFrom",t);return}applyDataFilters(!1)}function applyDataFilters(e=!0){if(e&&syncFiltersFromDom(),state.preset==="custom"){if(hasPartialDateRange()){showDateRangeError("Select both From and To dates.");return}if(state.dateFrom&&state.dateTo&&state.dateFrom>state.dateTo){showDateRangeError("From date must be on or before To date.");return}if(state.dateFrom&&isStartDateDisabled(state.dateFrom)){showDateRangeError("Start date must be before today.");return}if(state.dateTo&&isFutureDateDisabled(state.dateTo)){showDateRangeError("End date cannot be after today.");return}}if(clearDateRangeError(),!state.pipelineIds.length&&availablePipelines.length&&ensurePipelineDefaults(availablePipelines,cachedData?.account?.defaultPipelineIds),!state.pipelineIds.length){!availablePipelines.length&&isFetching&&loadDashboard(!0);return}loadDashboard(!0)}async function bootAdminApp(){if(IS_LOGIN_PAGE){renderLoginPage();return}if(IS_ADMIN_HUB){loadAdminHub();return}if(IS_ADMIN_SYNC_HISTORY_GHL){await loadSyncHistoryPage("ghl");return}if(IS_ADMIN_SYNC_HISTORY_META){await loadSyncHistoryPage("meta");return}if(IS_TEAM_PAGE){loadTeamPage();return}try{tenantParams=await resolveTenantParams()}catch(e){document.getElementById("dashboard").innerHTML='<div class="error-state" style="padding:24px">'+esc(e.message)+"</div>";return}if(IS_ADMIN_CLIENT){await initAdminClientPage();return}ensureChartsVisible(),loadDashboard(!0),setInterval(function(){loadDashboard(!0,{background:!0})},120*1e3)}bootAdminApp(),document.addEventListener("click",function(){closeCardMenus(),closeStaffUserMenu()}),document.addEventListener("visibilitychange",function(){document.visibilityState==="visible"&&(isFetching&&Date.now()-fetchStartedAt>FETCH_TIMEOUT_MS&&(cancelActiveFetch(),fetchGeneration+=1,resetFetchUiState()),!IS_ADMIN_HUB&&cachedData&&needsFreshData()&&loadDashboard(!0,{background:!0}))});

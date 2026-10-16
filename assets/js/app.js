/* ═══ Facecome — app shell: auth screen, sidebar, topbar, badges, routes ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, qs, qsa, toast } = FC.ui;

  const el = {};
  function me() { return FC.auth.me(); }

  /* ── auth screen (beauty theme) ── */
  function authHTML() {
    const db = FC.store.load();
    return (
      '<div class="auth-hero">' +
        '<h1 class="auth-logo gold-text">' + esc(db.site.name) + "</h1>" +
        '<p class="auth-tag">' + esc(db.site.tagline) + "</p>" +
        '<ul class="auth-points">' +
          '<li><span class="ic">🌀</span><span><b>Flow</b> — thoughts, images &amp; video in one living feed.</span></li>' +
          '<li><span class="ic">🔍</span><span><b>Magic Box</b> — find it, open it, win tokens &amp; mascots.</span></li>' +
          '<li><span class="ic">💛</span><span><b>Soulmate</b> — unlock with tokens, match, then talk.</span></li>' +
          '<li><span class="ic">📺</span><span><b>Live</b> — lively broadcasting with unique themes.</span></li>' +
          '<li><span class="ic">🛵</span><span><b>Our own business</b> — Delivery, Gaming Hub, Library, Love Zone.</span></li>' +
        "</ul>" +
      "</div>" +
      '<div class="auth-card">' +
        '<div class="auth-tabs chips">' +
          '<button class="chip on" data-atab="login">Log in</button>' +
          '<button class="chip" data-atab="reg">Register</button>' +
        "</div>" +
        '<form id="loginForm" autocomplete="on">' +
          '<label for="liUser">Username</label>' +
          '<input id="liUser" name="username" placeholder="afnana" autocomplete="username" required />' +
          '<label for="liPass">Password</label>' +
          '<input id="liPass" name="password" type="password" placeholder="••••••••" autocomplete="current-password" required />' +
          '<p class="err" id="loginErr"></p>' +
          '<button class="btn gold" type="submit">Enter the Flow</button>' +
        "</form>" +
        '<form id="regForm" hidden autocomplete="on">' +
          '<label for="rgName">Full name</label><input id="rgName" placeholder="Your name" required />' +
          '<label for="rgUser">Username</label><input id="rgUser" placeholder="3–18 chars, a-z 0-9 _" required />' +
          '<label for="rgMail">Email</label><input id="rgMail" type="email" placeholder="you@somewhere.com" required />' +
          '<label for="rgPass">Password</label><input id="rgPass" type="password" placeholder="6+ characters" required />' +
          '<label for="rgPass2">Confirm password</label><input id="rgPass2" type="password" placeholder="Repeat it" required />' +
          '<p class="err" id="regErr"></p>' +
          '<button class="btn gold" type="submit">Create my account</button>' +
        "</form>" +
        '<div class="auth-or">or visit a demo resident</div>' +
        '<div class="chips" style="margin-top:12px">' +
          ["afnana", "zara", "kai", "lina"].map((u) => '<button class="chip" data-demo="' + u + '">' + u + "</button>").join("") +
        "</div>" +
        '<p class="hint">Facecome stores everything in <b>this browser</b> — no external database. ' +
        'Site owner? <a href="admin/" style="color:var(--gold)">Open the admin panel →</a></p>' +
      "</div>"
    );
  }

  function renderAuth() {
    el.auth.innerHTML = authHTML();
    const tabs = qsa("[data-atab]", el.auth);
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("on", x === t));
      qs("#loginForm", el.auth).hidden = t.dataset.atab !== "login";
      qs("#regForm", el.auth).hidden = t.dataset.atab !== "reg";
    }));

    qs("#loginForm", el.auth).addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = qs("#loginErr", el.auth);
      err.textContent = "";
      const msg = await FC.auth.login(qs("#liUser", el.auth).value, qs("#liPass", el.auth).value);
      if (msg) { err.textContent = msg; return; }
      enterApp();
    });

    qs("#regForm", el.auth).addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = qs("#regErr", el.auth);
      err.textContent = "";
      const msg = await FC.auth.register({
        name: qs("#rgName", el.auth).value, username: qs("#rgUser", el.auth).value,
        email: qs("#rgMail", el.auth).value, password: qs("#rgPass", el.auth).value,
        confirm: qs("#rgPass2", el.auth).value,
      });
      if (msg) { err.textContent = msg; return; }
      toast("Welcome to Facecome ✦ 30 tokens added", "gold");
      enterApp();
    });

    qsa("[data-demo]", el.auth).forEach((b) => b.addEventListener("click", async () => {
      const msg = await FC.auth.loginDemo(b.dataset.demo);
      if (msg) { toast(msg, "gold"); return; }
      enterApp();
    }));
  }

  function showAuth() {
    renderAuth();
    el.auth.hidden = false;
    el.app.hidden = true;
    document.title = "Facecome — log in";
  }

  /* ── sidebar / topbar ── */
  function renderSidebar() {
    const u = me();
    if (!u) return;
    const nav = [
      ["feed", "🌀", "Flow"],
      ["messages", "🎵", "Message"],
      ["notifications", "🔔", "Notification"],
      ["magic", "🔍", "Magic Box"],
      ["pages", "📖", "Pages"],
      ["live", "📺", "Live"],
    ];
    el.sidebar.innerHTML =
      '<a class="brand gold-text" href="#/feed">Facecome<small>the narrative layer</small></a>' +
      '<a class="side-me" href="#/profile/' + esc(u.username) + '">' +
        '<span class="avatar sm" style="--uc:' + esc(u.color) + '"><img src="' + esc(u.photo) + '" alt="" /></span>' +
        "<span><b>" + esc(u.name) + "</b><small>Me · @" + esc(u.username) + "</small></span></a>" +
      '<nav class="nav">' +
        nav.map(([r, ic, lbl]) =>
          '<a class="nav-item" data-nav="' + r + '" href="#/' + r + '">' +
            '<span class="nav-ic">' + ic + '</span><span class="lbl">' + lbl + "</span>" +
            (r === "notifications" ? '<span class="glow-badge" id="navBadge" hidden>0</span>' : "") +
          "</a>").join("") +
      "</nav>" +
      '<div class="side-card">' +
        '<span class="token-pill">🪙 <b id="sideTokens">0</b> <span class="tk">tokens</span></span>' +
        "<small>Spend them on soulmates, games &amp; spins</small>" +
        '<div class="side-links"><a href="admin/">Admin</a><button id="logoutBtn" type="button">Log out</button></div>' +
      "</div>";

    qs("#logoutBtn", el.sidebar).addEventListener("click", () => {
      FC.auth.logout();
      toast("Logged out — see you in the Flow ✦");
      showAuth();
    });
    markActive();
  }

  function renderTopbar() {
    const u = me();
    if (!u) return;
    el.top.innerHTML =
      '<button class="btn ghost sm menu-btn" id="menuHome" type="button">☰</button>' +
      '<form class="top-search" id="topSearch">' +
        '<input id="topQ" placeholder="Search the magic box — find it & open it…" autocomplete="off" />' +
        '<button class="btn gold sm" type="submit">Find</button>' +
      "</form>" +
      '<div class="top-right">' +
        '<span class="token-pill" title="Your tokens">🪙 <b id="topTokens">0</b></span>' +
        '<a class="bell" href="#/notifications" title="Notifications">🔔<span class="glow-badge" id="topBadge" hidden>0</span></a>' +
        '<a class="top-ava avatar sm" style="--uc:' + esc(u.color) + '" href="#/profile/' + esc(u.username) + '" title="Me">' +
          '<img src="' + esc(u.photo) + '" alt="Me" /></a>' +
      "</div>";

    qs("#topSearch", el.top).addEventListener("submit", (e) => {
      e.preventDefault();
      const q = qs("#topQ", el.top).value.trim();
      location.hash = "#/magic" + (q ? "?q=" + encodeURIComponent(q) : "");
    });
    const mh = qs("#menuHome", el.top);
    if (mh) mh.addEventListener("click", () => FC.router.navigate("feed"));
    const ann = db().site.announcement;
    if (ann) { el.ann.hidden = false; el.ann.textContent = ann; }
    else el.ann.hidden = true;
  }

  function db() { return FC.store.load(); }

  function refreshBadges() {
    const u = me();
    if (!u) return;
    const n = FC.notify.unread(u.id);
    qsa("#navBadge, #topBadge").forEach((b) => {
      b.hidden = n === 0;
      b.textContent = n > 99 ? "99+" : n;
    });
    qsa("#sideTokens, #topTokens").forEach((t) => { t.textContent = u.tokens; });
  }

  function markActive() {
    const cur = FC.router.current().split("/")[0] || "feed";
    qsa(".nav-item", el.sidebar).forEach((a) => a.classList.toggle("on", a.dataset.nav === cur));
  }

  /* ── notifications view ── */
  function renderNotifications(view) {
    const u = me();
    if (!u) return;
    const items = FC.notify.list(u.id);
    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">Notification</h1><p class="muted">The glow tells you when the platform breathes back.</p></div>' +
      '<div class="section-head"><h2>' + (FC.notify.unread(u.id) || "No") + ' new</h2>' +
        (items.length ? '<button class="btn sm" id="readAll" type="button">Mark all read</button>' : "") + "</div>" +
      '<div class="notif-list">' +
        (items.length ? items.map((nt) =>
          '<div class="notif-item ' + (nt.read ? "" : "new") + '">' +
            '<span class="notif-ic">' + esc(nt.icon || "🔔") + "</span>" +
            "<div><p>" + esc(nt.text) + "</p><time>" + FC.ui.timeAgo(nt.at) + "</time></div>" +
          "</div>").join("")
          : '<p class="empty">Nothing yet — react, comment or open the Magic Box to wake this up.</p>') +
      "</div>";

    const btn = qs("#readAll", view);
    if (btn) btn.addEventListener("click", () => {
      FC.notify.markAllRead(u.id);
      refreshBadges();
      renderNotifications(view);
      toast("All caught up ✦");
    });
    refreshBadges();
  }

  /* ── routes ── */
  let routesReady = false;
  function registerRoutes() {
    if (routesReady) return;
    routesReady = true;
    const view = () => el.view;
    const guard = (fn) => (params) => { if (!me()) { showAuth(); return; } fn(params); markActive(); };

    FC.router.route("", guard(() => FC.feed.renderFeed(view())));
    FC.router.route("feed", guard(() => FC.feed.renderFeed(view())));
    FC.router.route("profile/:name", guard((p) => FC.profile.render(view(), p.name)));
    FC.router.route("pages", guard(() => FC.pages.renderList(view())));
    FC.router.route("page/:slug", guard((p) => FC.pages.renderPage(view(), p.slug)));
    FC.router.route("magic", guard(() => FC.magic.render(view())));
    FC.router.route("messages", guard(() => FC.messages.render(view())));
    FC.router.route("messages/:id", guard((p) => FC.messages.render(view(), p.id)));
    FC.router.route("live", guard(() => FC.live.renderStudio(view())));
    FC.router.route("live/:postId", guard((p) => FC.live.renderViewer(view(), p.postId)));
    FC.router.route("notifications", guard(() => renderNotifications(view())));
  }

  function enterApp() {
    el.auth.hidden = true;
    el.app.hidden = false;
    document.title = "Facecome — Flow";
    renderSidebar();
    renderTopbar();
    refreshBadges();
    FC.feed.bindPostEvents(el.view);
    registerRoutes();
    if (!FC.router.current()) FC.router.navigate("feed");
    else FC.router.resolve();
    markActive();
  }

  function busy() {
    const modal = qs("#modalWrap");
    if (modal && modal.classList.contains("open")) return true;
    const a = document.activeElement;
    if (!a || !el.view) return false;
    return ["INPUT", "TEXTAREA", "SELECT"].indexOf(a.tagName) >= 0 && el.view.contains(a);
  }

  function showBootError() {
    el.app.hidden = true;
    el.auth.hidden = false;
    document.title = "Facecome";
    el.auth.innerHTML =
      '<div class="auth-card">' +
        '<h2 class="gold-text">Facecome could not start</h2>' +
        '<p class="muted">This browser blocked or ran out of storage space, so your feed cannot be loaded. ' +
        "Try a normal window (not private/incognito), or reset the demo data below.</p>" +
        '<div class="form-row"><button class="btn gold" id="bootReset" type="button">Reset demo data</button>' +
        '<button class="btn" id="bootRetry" type="button">Try again</button></div>' +
      "</div>";
    qs("#bootReset", el.auth).addEventListener("click", () => { try { FC.store.reset(); } catch (e) {} location.reload(); });
    qs("#bootRetry", el.auth).addEventListener("click", () => location.reload());
  }

  /* ── boot ── */
  async function boot() {
    el.auth = qs("#authScreen");
    el.app = qs("#app");
    el.sidebar = qs("#sidebar");
    el.top = qs("#topbar");
    el.view = qs("#view");
    el.ann = qs("#announce");

    try {
      FC.store.load();
      await FC.auth.init();
      if (!me()) {
        await FC.auth.loginDemo("afnana");
        if (me()) toast("Browsing as demo resident @afnana — log out to switch accounts", "gold");
      }
      if (me()) enterApp();
      else showAuth();
    } catch (e) {
      console.error("Facecome boot failed:", e);
      showBootError();
    }
    FC.router.start();

    setInterval(() => {
      if (me() && !busy() && (FC.router.current().startsWith("feed") || FC.router.current() === "")) {
        FC.feed.renderFeed(el.view);
      }
    }, 45000);
  }

  FC.app = { boot, refreshBadges, renderSidebar, renderTopbar, showAuth, enterApp, markActive, busy };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

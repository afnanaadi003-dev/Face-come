/* ═══ Facecome — admin panel (route: /admin) ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, qs, qsa, toast, timeAgo, uid, coverArt, postArt } = FC.ui;
  const AKEY = "facecome_admin_session";
  let section = "dashboard";
  const el = {};

  const SECTIONS = [
    ["dashboard", "▦", "Dashboard"],
    ["users", "👥", "Users"],
    ["posts", "📝", "Posts"],
    ["pages", "📖", "Pages"],
    ["products", "🛵", "Products"],
    ["suggestions", "✨", "Suggestions"],
    ["site", "🎨", "Site settings"],
    ["data", "💾", "Data"],
  ];

  function db() { return FC.store.load(); }
  function isAdmin() { try { return sessionStorage.getItem(AKEY) === "1"; } catch (e) { return false; } }
  function setAdmin(v) { try { v ? sessionStorage.setItem(AKEY, "1") : sessionStorage.removeItem(AKEY); } catch (e) {} }

  async function ensureAuth() {
    const d = db();
    if (!d.adminAuth) {
      d.adminAuth = {
        user: "admin", salt: "facecomeadmin",
        passHash: await FC.auth.sha("facecomeadmin:admin123"),
        tries: 0, lockUntil: 0,
      };
      FC.store.save();
    }
  }

  /* ── login (beauty theme) ── */
  function showLogin() {
    el.login.hidden = false;
    el.app.hidden = true;
    document.title = "Facecome — admin";
    el.login.innerHTML =
      '<div class="auth-hero">' +
        '<h1 class="auth-logo gold-text">Facecome</h1>' +
        '<p class="auth-tag">The control room — manage the Flow, the people, the pages and the business.</p>' +
        '<ul class="auth-points">' +
          '<li><span class="ic">👥</span><span><b>Users &amp; posts</b> — review, ban, clean.</span></li>' +
          '<li><span class="ic">🛵</span><span><b>Business</b> — Delivery products, stock &amp; prices.</span></li>' +
          '<li><span class="ic">📖</span><span><b>Pages</b> — cover, bio &amp; schedule for every house.</span></li>' +
          '<li><span class="ic">💾</span><span><b>Data</b> — export, import, reset. No external database.</span></li>' +
        "</ul>" +
      "</div>" +
      '<div class="auth-card">' +
        '<div class="auth-tabs chips"><span class="chip on">Admin login</span></div>' +
        '<form id="aLogin">' +
          '<label for="aUser">Admin username</label><input id="aUser" autocomplete="username" value="admin" required />' +
          '<label for="aPass">Password</label><input id="aPass" type="password" autocomplete="current-password" required />' +
          '<p class="err" id="aErr"></p>' +
          '<button class="btn gold" type="submit">Enter the control room</button>' +
        "</form>" +
        '<p class="hint">Default access: <b>admin / admin123</b> — change it in Site settings. ' +
        '5 wrong tries locks the door for 5 minutes.<br /><a href="../" style="color:var(--gold)">← Back to Facecome</a></p>' +
      "</div>";

    qs("#aLogin").addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = db(), a = d.adminAuth;
      const err = qs("#aErr");
      err.textContent = "";
      if (a.lockUntil && Date.now() < a.lockUntil) {
        err.textContent = "Locked for " + Math.ceil((a.lockUntil - Date.now()) / 60000) + " more minute(s).";
        return;
      }
      const u = qs("#aUser").value.trim(), p = qs("#aPass").value;
      const hash = await FC.auth.sha(a.salt + ":" + p);
      if (u !== a.user || hash !== a.passHash) {
        a.tries = (a.tries || 0) + 1;
        if (a.tries >= 5) { a.tries = 0; a.lockUntil = Date.now() + 5 * 60000; err.textContent = "Too many tries — locked for 5 minutes."; }
        else err.textContent = "Wrong credentials. " + (5 - a.tries) + " tries left.";
        FC.store.save();
        return;
      }
      a.tries = 0; a.lockUntil = 0;
      FC.store.save();
      setAdmin(true);
      showApp();
      toast("Welcome back, admin ✦", "gold");
    });
  }

  /* ── shell ── */
  function showApp() {
    el.login.hidden = true;
    el.app.hidden = false;
    document.title = "Facecome — admin panel";
    el.nav.innerHTML =
      '<div class="admin-brand gold-text">Facecome<small>admin control room</small></div>' +
      SECTIONS.map(([id, ic, label]) =>
        '<button class="a-nav ' + (section === id ? "on" : "") + '" data-sec="' + id + '">' +
        "<span>" + ic + "</span>" + label + "</button>").join("") +
      '<div class="side-foot"><a class="btn sm" href="../" style="justify-content:center">← User site</a>' +
      '<button class="btn sm danger" id="aOut" style="justify-content:center">Log out</button></div>';
    qsa("[data-sec]", el.nav).forEach((b) => b.addEventListener("click", () => { section = b.dataset.sec; showApp(); }));
    qs("#aOut").addEventListener("click", () => { setAdmin(false); showLogin(); toast("Admin logged out."); });
    renderTop();
    renderSection();
  }

  function renderTop() {
    const d = db();
    const titles = { dashboard: "Dashboard", users: "Users", posts: "Posts", pages: "Pages", products: "Delivery products", suggestions: "Suggestions", site: "Site settings", data: "Data & backup" };
    el.top.innerHTML =
      "<div><h1>" + esc(titles[section]) + "</h1><span class='muted'>" + esc(d.site.name) + " · stored in this browser only</span></div>" +
      '<div class="right"><span class="token-pill">👥 ' + d.users.length + "</span>" +
      '<span class="token-pill">📝 ' + d.posts.length + "</span>" +
      '<button class="btn gold sm" id="quickExport">⤓ Export</button></div>';
    qs("#quickExport").addEventListener("click", () => { FC.store.exportJSON(); toast("Export downloaded ✦", "gold"); });
  }

  function renderSection() {
    const v = el.view;
    v.innerHTML = "";
    if (section === "dashboard") secDashboard(v);
    else if (section === "users") secUsers(v);
    else if (section === "posts") secPosts(v);
    else if (section === "pages") secPages(v);
    else if (section === "products") secProducts(v);
    else if (section === "suggestions") secSuggestions(v);
    else if (section === "site") secSite(v);
    else if (section === "data") secData(v);
  }

  /* ── dashboard ── */
  function secDashboard(v) {
    const d = db();
    const comments = d.posts.reduce((n, p) => n + p.comments.length, 0);
    const live = d.posts.filter((p) => p.live && p.live.active).length;
    const tokens = d.users.reduce((n, u) => n + (u.tokens || 0), 0);
    const revenue = d.orders.reduce((n, o) => n + o.total, 0);
    const recent = d.posts.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    v.innerHTML =
      '<div class="stat-grid">' +
        [["users", d.users.length], ["posts", d.posts.length], ["comments", comments], ["live now", live],
         ["tokens in play", tokens], ["revenue $", revenue]].map(([k, n]) =>
          '<div class="stat-box glass"><b>' + n + "</b><small>" + k + "</small></div>").join("") +
      "</div>" +
      '<div class="grid-2">' +
        '<section class="panel glass"><div class="panel-head"><h2>Latest in the Flow</h2><a class="btn sm" href="../#/feed">Open feed</a></div>' +
          '<table class="data"><thead><tr><th>Who</th><th>Post</th><th>When</th></tr></thead><tbody>' +
          recent.map((p) => {
            const u = FC.store.userById(p.userId) || { name: "?" };
            return "<tr><td>" + esc(u.name) + '</td><td class="snippet">' + esc((p.text || p.type).slice(0, 70)) + "</td><td>" + timeAgo(p.createdAt) + "</td></tr>";
          }).join("") + "</tbody></table></section>" +
        '<section class="panel glass"><div class="panel-head"><h2>Announcement banner</h2></div>' +
          '<textarea id="annBox" rows="3">' + esc(d.site.announcement || "") + "</textarea>" +
          '<div class="form-row"><button class="btn gold" id="annSave">Save banner</button>' +
          '<span class="muted" style="font-size:.75rem">shown at the top of every user page</span></div></section>' +
      "</div>";
    qs("#annSave").addEventListener("click", () => {
      db().site.announcement = qs("#annBox").value.trim();
      FC.store.save();
      toast("Announcement saved ✦", "gold");
    });
  }

  /* ── users ── */
  function secUsers(v) {
    const d = db();
    v.innerHTML =
      '<section class="panel glass"><div class="panel-head"><h2>All users (' + d.users.length + ")</h2>" +
        '<span class="muted" style="font-size:.75rem">ban hides them from logging in; delete is permanent</span></div>' +
        '<table class="data"><thead><tr><th>User</th><th>Email</th><th>Tokens</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead><tbody>' +
        d.users.map((u) =>
          "<tr><td><div style='display:flex;gap:9px;align-items:center'>" +
          '<img class="mini-img" src="' + esc(u.photo) + '" alt="" /><div><b>' + esc(u.name) + "</b><br><small class='muted'>@" + esc(u.username) + "</small></div></div></td>" +
          "<td>" + esc(u.email || "—") + "</td><td>" + u.tokens + "</td>" +
          "<td>" + (u.role === "admin" ? '<span class="pill adm">admin</span>' : '<span class="pill">user</span>') + "</td>" +
          "<td>" + (u.banned ? '<span class="pill bad">banned</span>' : '<span class="pill ok">active</span>') + "</td>" +
          "<td>" + new Date(u.createdAt).toLocaleDateString() + "</td>" +
          '<td><div class="row-acts">' +
            '<button class="btn sm" data-tok="' + u.id + '">+10 🪙</button>' +
            '<button class="btn sm" data-role="' + u.id + '">' + (u.role === "admin" ? "user" : "admin") + "</button>" +
            '<button class="btn sm" data-ban="' + u.id + '">' + (u.banned ? "unban" : "ban") + "</button>" +
            '<button class="btn sm danger" data-del="' + u.id + '">delete</button>' +
          "</div></td></tr>").join("") +
        "</tbody></table></section>";

    qsa("[data-tok]", v).forEach((b) => b.addEventListener("click", () => {
      const u = FC.store.userById(b.dataset.tok);
      u.tokens += 10;
      FC.store.notify(u.id, "🪙 Admin granted you 10 tokens.", "🪙");
      FC.store.save();
      secUsers(v); toast("+10 tokens → @" + u.username, "gold");
    }));
    qsa("[data-role]", v).forEach((b) => b.addEventListener("click", () => {
      const u = FC.store.userById(b.dataset.role);
      u.role = u.role === "admin" ? "user" : "admin";
      FC.store.save(); secUsers(v);
    }));
    qsa("[data-ban]", v).forEach((b) => b.addEventListener("click", () => {
      const u = FC.store.userById(b.dataset.ban);
      u.banned = !u.banned;
      if (u.banned && FC.store.session.get() === u.id) FC.store.session.clear();
      FC.store.save(); secUsers(v);
      toast(u.banned ? "@" + u.username + " banned" : "@" + u.username + " restored", "gold");
    }));
    qsa("[data-del]", v).forEach((b) => b.addEventListener("click", () => {
      const u = FC.store.userById(b.dataset.del);
      if (!confirm("Delete @" + u.username + " and all their posts?")) return;
      const d2 = db();
      d2.users = d2.users.filter((x) => x.id !== u.id);
      d2.posts = d2.posts.filter((p) => p.userId !== u.id);
      d2.threads = d2.threads.filter((t) => !t.participants.includes(u.id));
      if (FC.store.session.get() === u.id) FC.store.session.clear();
      FC.store.save(); secUsers(v);
      toast("User deleted.", "gold");
    }));
  }

  /* ── posts ── */
  function secPosts(v) {
    const d = db();
    const posts = d.posts.slice().sort((a, b) => b.createdAt - a.createdAt);
    v.innerHTML =
      '<section class="panel glass"><div class="panel-head"><h2>Posts (' + posts.length + ")</h2></div>" +
        '<table class="data"><thead><tr><th>Author</th><th>Content</th><th>Type</th><th>Reactions</th><th>When</th><th></th></tr></thead><tbody>' +
        posts.map((p) => {
          const u = FC.store.userById(p.userId) || { name: "deleted" };
          return "<tr><td>" + esc(u.name) + "</td>" +
            '<td class="snippet">' + esc((p.text || "").slice(0, 90) || "(" + p.type + " media)") + "</td>" +
            "<td>" + esc(p.type) + " · " + esc(p.category || "") + "</td>" +
            "<td>❤" + p.love.length + " 🙏" + p.respect.length + " 💬" + p.comments.length + "</td>" +
            "<td>" + timeAgo(p.createdAt) + "</td>" +
            '<td><div class="row-acts"><button class="btn sm danger" data-del="' + p.id + '">delete</button></div></td></tr>';
        }).join("") + "</tbody></table></section>";
    qsa("[data-del]", v).forEach((b) => b.addEventListener("click", () => {
      const d2 = db();
      d2.posts = d2.posts.filter((x) => x.id !== b.dataset.del);
      FC.store.save(); secPosts(v); toast("Post removed.");
    }));
  }

  /* ── pages ── */
  function secPages(v) {
    const d = db();
    v.innerHTML =
      '<section class="panel glass"><div class="panel-head"><h2>Page covers, bios &amp; schedules</h2>' +
        '<span class="muted" style="font-size:.75rem">schedule lines: <code>when | what</code></span></div>' +
        '<div class="grid-2">' +
        Object.values(d.pages).map((p) =>
          '<div class="glass" style="padding:16px"><div class="panel-head"><h2>' + esc(p.icon) + " " + esc(p.name) + "</h2></div>" +
            '<img src="' + esc(p.cover) + '" alt="" style="width:100%;aspect-ratio:3/1;object-fit:cover;border-radius:10px;margin:10px 0" />' +
            "<label>Cover image URL (blank = regenerate)</label>" +
            '<input data-cover="' + p.slug + '" value="' + esc(p.cover.startsWith("data:") ? "" : p.cover) + '" placeholder="https://…/cover.jpg" />' +
            "<label>Bio — the page's thoughts</label>" +
            '<textarea data-bio="' + p.slug + '" rows="3">' + esc(p.bio) + "</textarea>" +
            "<label>Schedule</label>" +
            '<textarea data-sched="' + p.slug + '" rows="4">' + esc(p.schedule.map((s) => s.when + " | " + s.what).join("\n")) + "</textarea>" +
            '<div class="form-row" style="margin-top:8px"><button class="btn gold sm" data-save="' + p.slug + '">Save ' + esc(p.name) + "</button>" +
            '<a class="btn sm" href="../#/page/' + p.slug + '">View</a></div></div>').join("") +
        "</div></section>";

    qsa("[data-save]", v).forEach((b) => b.addEventListener("click", () => {
      const slug = b.dataset.save, p = d.pages[slug];
      const cover = qs("[data-cover='" + slug + "']", v).value.trim();
      p.cover = cover || coverArt(p.name, slug);
      p.bio = qs("[data-bio='" + slug + "']", v).value.trim();
      p.schedule = qs("[data-sched='" + slug + "']", v).value.split("\n")
        .map((l) => l.split("|"))
        .filter((a) => a[0] && a[0].trim())
        .map((a) => ({ when: a[0].trim(), what: (a[1] || "to be announced").trim() }));
      FC.store.save();
      secPages(v);
      toast(p.name + " updated ✦", "gold");
    }));
  }

  /* ── products ── */
  function secProducts(v) {
    const d = db();
    v.innerHTML =
      '<section class="panel glass"><div class="panel-head"><h2>Delivery catalogue</h2>' +
        '<button class="btn gold sm" id="addProd">+ New product</button></div>' +
        '<table class="data"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Description</th><th></th></tr></thead><tbody>' +
        d.products.map((p) =>
          "<tr><td><div style='display:flex;gap:9px;align-items:center'>" +
          '<img class="mini-img" src="' + esc(p.image) + '" alt="" />' +
          '<input data-name="' + p.id + '" value="' + esc(p.name) + '" /></div></td>' +
          '<td style="width:110px"><input data-price="' + p.id + '" type="number" min="0" value="' + p.price + '" /></td>' +
          '<td style="width:100px"><input data-stock="' + p.id + '" type="number" min="0" value="' + p.stock + '" /></td>' +
          '<td><input data-desc="' + p.id + '" value="' + esc(p.desc) + '" /></td>' +
          '<td><div class="row-acts"><button class="btn sm" data-psave="' + p.id + '">save</button>' +
          '<button class="btn sm danger" data-pdel="' + p.id + '">delete</button></div></td></tr>').join("") +
        "</tbody></table></section>";

    qsa("[data-psave]", v).forEach((b) => b.addEventListener("click", () => {
      const p = d.products.find((x) => x.id === b.dataset.psave);
      p.name = qs("[data-name='" + p.id + "']", v).value.trim() || p.name;
      p.price = Math.max(0, +qs("[data-price='" + p.id + "']", v).value || 0);
      p.stock = Math.max(0, +qs("[data-stock='" + p.id + "']", v).value || 0);
      p.desc = qs("[data-desc='" + p.id + "']", v).value.trim();
      FC.store.save(); toast("Product saved ✦", "gold");
    }));
    qsa("[data-pdel]", v).forEach((b) => b.addEventListener("click", () => {
      if (!confirm("Delete this product?")) return;
      d.products = d.products.filter((x) => x.id !== b.dataset.pdel);
      FC.store.save(); secProducts(v); toast("Product deleted.");
    }));
    qs("#addProd", v).addEventListener("click", () => {
      const id = uid("pr");
      d.products.push({
        id, name: "New product", price: 10, stock: 10,
        desc: "Describe it for your customers.", image: postArt("New product", id, "image"), page: "delivery",
      });
      FC.store.save(); secProducts(v); toast("Product added ✦", "gold");
    });
  }

  /* ── suggestions ── */
  function secSuggestions(v) {
    const d = db();
    const list = (ids, arr, key) => ids.map((id) => {
      const it = arr.find((x) => x.id === id);
      return it ? esc(it[key]) : '<span class="pill bad">' + esc(id) + " missing</span>";
    }).join(", ") || '<span class="muted">none</span>';
    v.innerHTML =
      '<section class="panel glass"><div class="panel-head"><h2>Facecome suggested…</h2>' +
        '<span class="muted" style="font-size:.75rem">comma-separated ids from the store</span></div>' +
        '<div class="grid-2">' +
          "<div><label>Books</label><input id='sgBooks' value='" + esc(d.suggestions.books.join(", ")) + "' />" +
          "<p style='font-size:.8rem'>" + list(d.suggestions.books, d.books, "title") + "</p></div>" +
          "<div><label>Movies</label><input id='sgMovies' value='" + esc(d.suggestions.movies.join(", ")) + "' />" +
          "<p style='font-size:.8rem'>" + list(d.suggestions.movies, d.movies, "title") + "</p></div>" +
          "<div><label>Products</label><input id='sgProducts' value='" + esc(d.suggestions.products.join(", ")) + "' />" +
          "<p style='font-size:.8rem'>" + list(d.suggestions.products, d.products, "name") + "</p></div>" +
        "</div>" +
        '<button class="btn gold" id="sgSave" style="align-self:flex-start">Save suggestions</button>' +
      "</section>";
    qs("#sgSave").addEventListener("click", () => {
      const parse = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
      d.suggestions.books = parse(qs("#sgBooks").value);
      d.suggestions.movies = parse(qs("#sgMovies").value);
      d.suggestions.products = parse(qs("#sgProducts").value);
      FC.store.save(); toast("Suggestions saved ✦", "gold");
      secSuggestions(v);
    });
  }

  /* ── site settings ── */
  function secSite(v) {
    const d = db();
    v.innerHTML =
      '<div class="grid-2">' +
        '<section class="panel glass"><div class="panel-head"><h2>Identity</h2></div>' +
          "<label>Site name</label><input id='stName' value='" + esc(d.site.name) + "' />" +
          "<label>Tagline</label><input id='stTag' value='" + esc(d.site.tagline) + "' />" +
          "<label>Announcement banner</label><textarea id='stAnn' rows='3'>" + esc(d.site.announcement || "") + "</textarea>" +
          "<label>Accent colour</label><select id='stAccent'>" +
            ["gold", "blue", "teal", "rose"].map((a) => "<option value='" + a + "'" + (d.site.accent === a ? " selected" : "") + ">" + a + "</option>").join("") +
          "</select>" +
          '<button class="btn gold" id="stSave" style="margin-top:12px">Save settings</button>' +
        "</section>" +
        '<section class="panel glass"><div class="panel-head"><h2>Admin access</h2></div>' +
          "<label>Admin username</label><input id='adUser' value='" + esc(d.adminAuth.user) + "' />" +
          "<label>New password</label><input id='adPass' type='password' placeholder='leave blank to keep' />" +
          '<button class="btn gold" id="adSave" style="margin-top:12px">Update login</button>' +
          '<p class="muted" style="font-size:.76rem">Hashed with SHA-256 + salt. Default: admin / admin123.</p>' +
        "</section>" +
      "</div>";

    qs("#stSave").addEventListener("click", async () => {
      d.site.name = qs("#stName").value.trim() || "Facecome";
      d.site.tagline = qs("#stTag").value.trim();
      d.site.announcement = qs("#stAnn").value.trim();
      d.site.accent = qs("#stAccent").value;
      FC.store.save();
      renderTop();
      toast("Site settings saved ✦", "gold");
    });
    qs("#adSave").addEventListener("click", async () => {
      const a = d.adminAuth;
      const nu = qs("#adUser").value.trim();
      const np = qs("#adPass").value;
      if (!nu) { toast("Username can't be empty", "gold"); return; }
      a.user = nu;
      if (np) { a.salt = uid("s"); a.passHash = await FC.auth.sha(a.salt + ":" + np); }
      FC.store.save();
      qs("#adPass").value = "";
      toast("Admin login updated ✦", "gold");
    });
  }

  /* ── data ── */
  function secData(v) {
    const d = db();
    let size = 0;
    try { size = ((localStorage.getItem(FC.store.KEY) || "").length / 1024).toFixed(1); } catch (e) {}
    v.innerHTML =
      '<div class="grid-2">' +
        '<section class="panel glass"><div class="panel-head"><h2>Export</h2></div>' +
          '<p class="muted" style="font-size:.85rem">Everything — users, posts, pages, orders — as one JSON file. Move it between browsers; there is no server.</p>' +
          '<button class="btn gold" id="doExport" style="align-self:flex-start">⤓ Download facecome-export.json</button>' +
          '<p class="muted" style="font-size:.76rem">current size: ' + size + " KB · " + d.users.length + " users · " + d.posts.length + " posts</p></section>" +
        '<section class="panel glass"><div class="panel-head"><h2>Import</h2></div>' +
          '<input type="file" id="impFile" accept="application/json,.json" />' +
          '<p class="muted" style="font-size:.85rem">Replaces everything currently in this browser.</p>' +
          '<button class="btn blue" id="doImport" style="align-self:flex-start">⇪ Import JSON</button></section>' +
        '<section class="panel glass"><div class="panel-head"><h2>Reset</h2></div>' +
          '<p class="muted" style="font-size:.85rem">Wipe this browser and re-seed the demo platform (demo users, posts, products, pages).</p>' +
          '<button class="btn danger" id="doReset" style="align-self:flex-start">⚠ Reset everything</button></section>' +
      "</div>";

    qs("#doExport").addEventListener("click", () => { FC.store.exportJSON(); toast("Export downloaded ✦", "gold"); });
    qs("#doImport").addEventListener("click", () => {
      const f = qs("#impFile").files[0];
      if (!f) { toast("Choose a JSON file first", "gold"); return; }
      const r = new FileReader();
      r.onload = () => {
        try {
          FC.store.importJSON(r.result);
          toast("Imported ✦ reloading", "gold");
          setTimeout(() => location.reload(), 800);
        } catch (e) { toast("Import failed: " + e.message, "gold"); }
      };
      r.readAsText(f);
    });
    qs("#doReset").addEventListener("click", () => {
      if (!confirm("Reset this browser's Facecome data?")) return;
      FC.store.reset();
      location.reload();
    });
  }

  /* ── boot ── */
  async function boot() {
    el.login = qs("#adminLogin");
    el.app = qs("#adminApp");
    el.nav = qs("#adminNav");
    el.top = qs("#adminTop");
    el.view = qs("#adminView");
    FC.store.load();
    await ensureAuth();
    if (isAdmin()) showApp();
    else showLogin();
  }

  FC.admin = { boot };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

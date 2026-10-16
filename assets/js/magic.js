/* ═══ Facecome — magic box: search (find it & open it) + prizes ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, qs, qsa, toast, timeAgo } = FC.ui;
  const COOLDOWN = 25000;

  function me() { return FC.auth.me(); }
  function db() { return FC.store.load(); }

  function searchAll(q) {
    const d = db();
    const s = q.toLowerCase();
    const out = [];
    d.users.forEach((u) => {
      if ((u.name + " @" + u.username + " " + (u.vibe || "")).toLowerCase().includes(s))
        out.push({ kind: "person", title: u.name, sub: "@" + u.username + (u.vibe ? " · " + u.vibe : ""), img: u.photo, href: "#/profile/" + u.username });
    });
    d.posts.forEach((p) => {
      if ((p.text || "").toLowerCase().includes(s)) {
        const u = FC.store.userById(p.userId) || { name: "?" };
        out.push({ kind: "flow", title: (p.text || "").slice(0, 70), sub: u.name + " · " + timeAgo(p.createdAt), img: p.media && p.type === "image" ? p.media : null, href: "#/feed" });
      }
    });
    Object.values(d.pages).forEach((p) => {
      if ((p.name + " " + p.bio).toLowerCase().includes(s))
        out.push({ kind: "page", title: p.name, sub: p.bio.slice(0, 80), img: p.cover, href: "#/page/" + p.slug });
    });
    d.products.forEach((p) => {
      if ((p.name + " " + p.desc).toLowerCase().includes(s))
        out.push({ kind: "product", title: p.name, sub: "$" + p.price + " · " + p.desc.slice(0, 60), img: p.image, href: "#/page/delivery" });
    });
    d.books.forEach((b) => {
      if ((b.title + " " + b.author + " " + b.bio).toLowerCase().includes(s))
        out.push({ kind: "book", title: b.title, sub: b.author, img: b.cover, href: "#/page/library" });
    });
    d.movies.forEach((m) => {
      if ((m.title + " " + m.genre + " " + m.bio).toLowerCase().includes(s))
        out.push({ kind: "movie", title: m.title, sub: m.genre + " · " + m.bio.slice(0, 60), img: m.cover, href: "#/messages" });
    });
    return out.slice(0, 20);
  }

  function resultsHTML(list) {
    if (!list.length) return '<p class="muted" style="font-size:.85rem">Nothing found — the box keeps its secrets. Try “token”, “zara”, “library”.</p>';
    return '<div class="search-res">' + list.map((r, i) =>
      '<a class="res-item" href="' + r.href + '" data-i="' + i + '">' +
        (r.img ? '<img src="' + esc(r.img) + '" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover" />' : '<span class="nav-ic">✦</span>') +
        "<span><b>" + esc(r.title) + "</b><small>" + esc(r.sub) + "</small></span>" +
        '<span class="res-kind">' + r.kind + "</span></a>").join("") + "</div>";
  }

  function render(view) {
    const u = me(), d = db();
    const q = (location.hash.split("?")[1] || "").replace(/^q=/, "");
    const query = q ? decodeURIComponent(q) : "";
    const list = query ? searchAll(query) : [];
    const since = u.lastMagic ? Date.now() - u.lastMagic : COOLDOWN;
    const wait = Math.max(0, Math.ceil((COOLDOWN - since) / 1000));

    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">Magic Box</h1><p class="muted">Find it, open it — the prize is yours: tokens, or a mascot with its own pronoun.</p></div>' +
      '<div class="magic-hero">' +
        '<section class="magic-stage glass">' +
          '<div class="magic-box-art" id="magicBox" role="button" tabindex="0" aria-label="Open the magic box">🎁<span class="lock">' + (wait > 0 ? "⏳" : "🔓") + "</span></div>" +
          "<div><b class='gold-text' style='font-size:1.2rem'>" + (wait > 0 ? "Box seals for " + wait + "s" : "Tap the box — it's ready") + "</b>" +
          '<p class="muted" style="font-size:.82rem;margin:6px 0 0">Balance 🪙 ' + u.tokens + " · mascots " + u.mascots.length + "</p></div>" +
          '<button class="btn gold" id="openBox"' + (wait > 0 ? " disabled" : "") + ">Open it ✦</button>" +
          '<div id="prizeSlot"></div>' +
        "</section>" +
        '<div class="magic-side">' +
          '<section class="glass" style="padding:18px">' +
            '<div class="section-head"><h2>The search</h2></div>' +
            '<form id="magicForm" style="display:flex;gap:8px;margin-top:10px">' +
              '<input id="magicQ" placeholder="find it & open it…" value="' + esc(query) + '" autocomplete="off" />' +
              '<button class="btn gold sm" type="submit">Find</button>' +
            "</form>" +
            '<div id="magicRes" style="margin-top:12px">' + (query ? resultsHTML(list) : '<p class="muted" style="font-size:.83rem">Search people, flow posts, pages, products, books &amp; movies.</p>') + "</div>" +
          "</section>" +
          '<section class="glass" style="padding:18px">' +
            '<div class="section-head"><h2>Your mascots</h2></div>' +
            '<div class="mascot-row" style="margin-top:12px">' + mascotsHTML(u) + "</div>" +
          "</section>" +
          '<section class="glass" style="padding:18px">' +
            '<div class="section-head"><h2>Prizes inside</h2></div>' +
            '<div class="mascot-row" style="margin-top:12px">' +
              '<div class="mascot-card"><span class="m-ic">🪙</span><b>Tokens</b><small>3 – 20</small></div>' +
              FC.store.mascots.map((m) =>
                '<div class="mascot-card"><span class="m-ic">' + m.icon + "</span><b>" + m.name + "</b><small>“" + m.pronoun + "”</small></div>").join("") +
            "</div>" +
            '<p class="page-bio" style="font-size:.9rem">Each mascot speaks in its own pronoun — the <b>horse</b> is a gal, the <b>cat</b> is kits, the <b>dog</b> is a pup. Keep them all.</p>' +
          "</section>" +
        "</div>" +
      "</div>";

    const runSearch = () => {
      const val = qs("#magicQ", view).value.trim();
      qs("#magicRes", view).innerHTML = val
        ? resultsHTML(searchAll(val))
        : '<p class="muted" style="font-size:.83rem">Search people, flow posts, pages, products, books &amp; movies.</p>';
    };
    qs("#magicForm", view).addEventListener("submit", (e) => { e.preventDefault(); runSearch(); });
    qs("#magicQ", view).addEventListener("input", runSearch);

    const box = qs("#magicBox", view);
    const open = () => openBox(view, u, runSearch);
    box.addEventListener("click", open);
    box.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    qs("#openBox", view).addEventListener("click", open);
  }

  function mascotsHTML(u) {
    const counts = {};
    u.mascots.forEach((m) => { counts[m.type] = (counts[m.type] || 0) + 1; });
    const keys = Object.keys(counts);
    if (!keys.length) return '<p class="muted" style="font-size:.83rem">No mascots yet — the first box usually bites.</p>';
    return keys.map((t) => {
      const m = FC.store.mascots.find((x) => x.type === t);
      return '<div class="mascot-card"><span class="m-ic">' + m.icon + "</span><b>" + m.name + " ×" + counts[t] +
        '</b><small>pronoun “' + m.pronoun + "”</small></div>";
    }).join("");
  }

  function openBox(view, u) {
    if (u.lastMagic && Date.now() - u.lastMagic < COOLDOWN) {
      toast("The box is catching its breath — wait a moment ⏳", "gold");
      return;
    }
    const art = qs("#magicBox", view);
    art.classList.add("shake");
    setTimeout(() => art.classList.remove("shake"), 750);

    const roll = Math.random();
    let html;
    if (roll < 0.24) {
      const m = FC.store.mascots[Math.floor(Math.random() * FC.store.mascots.length)];
      u.mascots.push({ type: m.type, at: Date.now() });
      u.tokens += m.tokens;
      html = '<span class="p-ic">' + m.icon + "</span><h3>The " + m.name.toLowerCase() + " came home</h3>" +
        "<p>" + m.pronoun.charAt(0).toUpperCase() + m.pronoun.slice(1) + " " + m.line + " — +" + m.tokens + " tokens for both of you.</p>" +
        "<small>pronoun “" + m.pronoun + "” · balance " + u.tokens + "</small>";
      toast(m.icon + " " + m.name + " found — " + m.pronoun + " +" + m.tokens + " 🪙", "gold");
    } else {
      const gain = [3, 5, 6, 8, 12, 20][Math.floor(Math.random() * 6)];
      u.tokens += gain;
      html = '<span class="p-ic">🪙</span><h3>+' + gain + " tokens</h3>" +
        "<p>The box hummed gold and paid out — spend it on a soulmate or a spin.</p><small>balance " + u.tokens + "</small>";
      toast("🪙 +" + gain + " tokens — balance " + u.tokens, "gold");
    }

    u.lastMagic = Date.now();
    FC.store.save();
    qs("#prizeSlot", view).innerHTML = '<div class="prize">' + html + "</div>";
    FC.app.refreshBadges();

    const btn = qs("#openBox", view);
    btn.disabled = true;
    let left = Math.ceil(COOLDOWN / 1000);
    const tick = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(tick);
        btn.disabled = false;
        btn.textContent = "Open again ✦";
        const lock = qs(".lock", art);
        if (lock) lock.textContent = "🔓";
        const b = qs(".magic-stage b", view);
        if (b) b.textContent = "Tap the box — it's ready";
        return;
      }
      const b = qs(".magic-stage b", view);
      if (b) b.textContent = "Box seals for " + left + "s";
    }, 1000);
  }

  FC.magic = { render, searchAll };
})();

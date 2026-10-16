/* ═══ Facecome — pages: Gaming Hub, Delivery, Book Library, Love Zone ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, qs, qsa, toast, openModal, closeModal, uid } = FC.ui;
  let gameTimer = null;
  const ORDER = ["gaming", "delivery", "library", "love"];

  function me() { return FC.auth.me(); }
  function db() { return FC.store.load(); }

  /* ── index ── */
  function renderList(view) {
    const d = db();
    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">Pages</h1><p class="muted">Four houses of Facecome — each with a cover, a bio and a schedule.</p></div>' +
      '<div class="page-grid">' +
        ORDER.map((slug) => {
          const p = d.pages[slug];
          if (!p) return "";
          return '<a class="page-card glass" href="#/page/' + slug + '">' +
            '<img src="' + esc(p.cover) + '" alt="' + esc(p.name) + ' cover" />' +
            '<div class="pc-body"><h3>' + esc(p.icon) + " " + esc(p.name) + "</h3>" +
            "<p>" + esc(p.bio.slice(0, 120)) + (p.bio.length > 120 ? "…" : "") + "</p></div></a>";
        }).join("") +
      "</div>";
  }

  /* ── detail ── */
  function renderPage(view, slug) {
    if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
    const d = db();
    const p = d.pages[slug];
    if (!p) {
      view.innerHTML = '<p class="empty">That page doesn’t exist — <a href="#/pages" style="color:var(--gold)">see all pages</a></p>';
      return;
    }
    view.innerHTML =
      '<section class="page-hero glass">' +
        '<div class="ph-cover"><img src="' + esc(p.cover) + '" alt="' + esc(p.name) + '" /></div>' +
        '<div class="ph-body"><div class="section-head">' +
          "<div><h1>" + esc(p.icon) + " " + esc(p.name) + '</h1><p class="page-bio">' + esc(p.bio) + "</p></div>" +
          '<a class="btn sm" href="#/pages">← All pages</a>' +
        "</div></div>" +
      "</section>" +
      '<section><div class="section-head"><h2>Schedule</h2><span class="muted" style="font-size:.75rem">what happens, and when</span></div>' +
        '<div class="schedule"><table><thead><tr><th>When</th><th>What</th></tr></thead><tbody>' +
          p.schedule.map((s) => "<tr><td>" + esc(s.when) + "</td><td>" + esc(s.what) + "</td></tr>").join("") +
        "</tbody></table></div></section>" +
      '<div id="pageBody"></div>';

    const body = qs("#pageBody", view);
    if (slug === "gaming") renderGaming(body);
    else if (slug === "delivery") renderDelivery(body);
    else if (slug === "library") renderLibrary(body);
    else if (slug === "love") renderLove(body);
  }

  /* ── Gaming Hub ── */
  function renderGaming(body) {
    const d = db(), u = me();
    body.innerHTML =
      '<div class="section-head"><h2>Arcade</h2><span class="token-pill">🪙 <b>' + u.tokens + "</b> tokens</span></div>" +
      '<div class="game-grid">' +
        d.games.map((g) =>
          '<div class="game-card glass"><div class="g-ic">' + g.icon + "</div><h3>" + esc(g.name) + "</h3>" +
          "<p>" + esc(g.desc) + "</p>" +
          '<button class="btn gold sm" data-game="' + g.id + '">Play</button>' +
          '<div class="game-state" data-state="' + g.id + '"></div></div>').join("") +
      "</div>";

    qsa("[data-game]", body).forEach((b) => b.addEventListener("click", () => {
      const g = d.games.find((x) => x.id === b.dataset.game);
      if (g.id === "g1") auraTap(body, g);
      else if (g.id === "g2") tokenWheel(body, g);
      else respectRunner(body, g);
    }));
  }

  function auraTap(body, g) {
    const u = me(), box = qs('[data-state="g1"]', body);
    let left = 15, taps = 0;
    box.innerHTML =
      '<div class="prize" style="padding:14px"><b class="gold-text" id="auraLeft">15s</b>' +
      '<p style="margin:6px 0 10px;font-size:.85rem">Tap the aura — every tap is +' + g.tokensPerTap + " token.</p>" +
      '<button class="btn gold" id="auraOrb" style="width:100%;justify-content:center;font-size:1.2rem">✨ TAP</button>' +
      '<small id="auraTaps">0 taps</small></div>';
    const orb = qs("#auraOrb", box);
    orb.addEventListener("click", () => { taps++; u.tokens += g.tokensPerTap; FC.store.save(); qs("#auraTaps", box).textContent = taps + " taps"; });
    gameTimer = setInterval(() => {
      left--;
      const l = qs("#auraLeft", box);
      if (l) l.textContent = left + "s";
      if (left <= 0) {
        clearInterval(gameTimer); gameTimer = null;
        orb.disabled = true;
        qs(".prize", box).innerHTML = '<span class="p-ic">🎉</span><h3>+' + (taps * g.tokensPerTap) + ' tokens</h3>' +
          "<p>" + taps + " taps in 15 seconds — reflexes paid.</p><small>balance: " + u.tokens + "</small>";
        toast("Arcade pays out ✦ + " + taps * g.tokensPerTap + " tokens", "gold");
        FC.app.refreshBadges();
        renderPage(qs("#view"), "gaming");
      }
    }, 1000);
  }

  function tokenWheel(body, g) {
    const u = me(), box = qs('[data-state="g2"]', body);
    const prizes = [
      { w: 30, label: "+3 tokens", tokens: 3 },
      { w: 25, label: "+6 tokens", tokens: 6 },
      { w: 20, label: "+12 tokens", tokens: 12 },
      { w: 15, label: "+25 tokens", tokens: 25 },
      { w: 10, label: "mascot 🐎", mascot: "horse" },
    ];
    box.innerHTML = '<div class="prize" style="padding:14px"><h3 id="wheelOut">Spin for ' + g.cost + " 🪙</h3>" +
      "<p style=\"font-size:.85rem\">Tokens or a mascot — the wheel decides.</p></div>";
    if (u.tokens < g.cost) { box.innerHTML += '<p class="err">Not enough tokens — share a thought (+2) or tap the aura.</p>'; return; }
    u.tokens -= g.cost;
    const total = prizes.reduce((n, p) => n + p.w, 0);
    let r = Math.random() * total, pick = prizes[0];
    for (const p of prizes) { r -= p.w; if (r <= 0) { pick = p; break; } }
    if (pick.mascot) {
      const m = FC.store.mascots.find((x) => x.type === pick.mascot);
      u.mascots.push({ type: m.type, at: Date.now() });
      toast(m.icon + " The " + m.name.toLowerCase() + " came home — " + m.pronoun + " is yours!", "gold");
    } else {
      u.tokens += pick.tokens;
      toast("🎡 " + pick.label + " — balance " + u.tokens, "gold");
    }
    FC.store.save();
    qs("#wheelOut", box).textContent = pick.label;
    FC.app.refreshBadges();
    setTimeout(() => renderPage(qs("#view"), "gaming"), 1400);
  }

  function respectRunner(body, g) {
    const u = me(), box = qs('[data-state="g3"]', body);
    let dist = 0, claimed = false;
    box.innerHTML = '<div class="prize" style="padding:14px"><h3 id="runDist">0 / ' + g.goal + 'm</h3>' +
      '<div style="height:10px;border-radius:99px;background:rgba(255,255,255,.12);margin:10px 0;overflow:hidden">' +
      '<div id="runBar" style="height:100%;width:0;background:linear-gradient(90deg,var(--blue),var(--gold));transition:width .25s"></div></div>' +
      '<button class="btn gold" id="runStep" style="width:100%;justify-content:center">🏃 Stride</button>' +
      '<small id="runNote">reach ' + g.goal + "m for " + g.goal / 10 + " tokens</small></div>";
    qs("#runStep", box).addEventListener("click", () => {
      dist = Math.min(g.goal, dist + 6 + Math.floor(Math.random() * 16));
      qs("#runDist", box).textContent = dist + " / " + g.goal + "m";
      qs("#runBar", box).style.width = (dist / g.goal) * 100 + "%";
      if (dist >= g.goal && !claimed) {
        claimed = true;
        u.tokens += 10;
        FC.store.save();
        qs("#runNote", box).textContent = "finished — 10 tokens added, balance " + u.tokens;
        toast("🏃 Respect Runner cleared ✦ +10 tokens", "gold");
        FC.app.refreshBadges();
      }
      if (dist >= g.goal) setTimeout(() => renderPage(qs("#view"), "gaming"), 1500);
    });
  }

  /* ── Delivery ── */
  function cartOf(u) { const d = db(); return (d.carts[u.id] = d.carts[u.id] || []); }

  function cartTotals(u) {
    const d = db(), c = cartOf(u);
    let count = 0, total = 0;
    c.forEach((it) => {
      const p = d.products.find((x) => x.id === it.id);
      if (p) { count += it.qty; total += p.price * it.qty; }
    });
    return { count, total };
  }

  function renderDelivery(body) {
    const d = db(), u = me();
    const t = cartTotals(u);
    const mine = d.orders.filter((o) => o.userId === u.id).sort((a, b) => b.at - a.at);
    body.innerHTML =
      '<div class="cart-bar">🛒 <b id="cartCount">' + t.count + "</b> items · <b>$<span id=\"cartTotal\">" + t.total + "</span></b>" +
        '<button class="btn blue sm" id="openCart" type="button">Open cart</button>' +
        '<button class="btn gold" id="placeOrder" type="button">Place order 🛵</button></div>' +
      '<div class="section-head"><h2>Products</h2><span class="muted" style="font-size:.75rem">Facecome’s own business — ships same day before 16:00</span></div>' +
      '<div class="product-grid">' +
        d.products.map((p) =>
          '<div class="product-card glass"><div class="card-img"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" /></div>' +
          "<h3>" + esc(p.name) + '</h3><span class="stock">' + p.stock + " in stock</span>" +
          "<p>" + esc(p.desc) + "</p>" +
          '<div class="composer-foot"><span class="price">$' + p.price + "</span>" +
          '<button class="btn gold sm" data-add="' + p.id + '" style="margin-left:auto">Add</button></div></div>').join("") +
      "</div>" +
      '<div class="section-head"><h2>My orders</h2></div>' +
      (mine.length
        ? '<div class="schedule"><table><thead><tr><th>When</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>' +
          mine.map((o) => "<tr><td>" + new Date(o.at).toLocaleString() + "</td><td>" +
            esc(o.items.map((i) => i.qty + "× " + i.name).join(", ")) + "</td><td>$" + o.total +
            "</td><td>" + esc(o.status) + "</td></tr>").join("") + "</tbody></table></div>"
        : '<p class="empty">No orders yet — your cart is the first page of this story.</p>');

    qsa("[data-add]", body).forEach((b) => b.addEventListener("click", () => {
      const c = cartOf(u), id = b.dataset.add;
      const found = c.find((x) => x.id === id);
      if (found) found.qty++;
      else c.push({ id, qty: 1 });
      FC.store.save();
      const tt = cartTotals(u);
      qs("#cartCount", body).textContent = tt.count;
      qs("#cartTotal", body).textContent = tt.total;
      toast("Added to cart ✦", "gold");
    }));

    qs("#openCart", body).addEventListener("click", () => showCart(u, body));
    qs("#placeOrder", body).addEventListener("click", () => placeOrder(u, body));
  }

  function showCart(u, body) {
    const d = db(), c = cartOf(u);
    const t = cartTotals(u);
    openModal(
      "<h3>Your cart</h3>" +
      (c.length
        ? '<div class="schedule" style="margin-top:12px"><table><tbody>' +
          c.map((it) => {
            const p = d.products.find((x) => x.id === it.id);
            if (!p) return "";
            return "<tr><td>" + esc(p.name) + "</td><td>$" + p.price + " × " + it.qty + "</td>" +
              '<td style="text-align:right"><button class="btn sm" data-rm="' + p.id + '">Remove</button></td></tr>';
          }).join("") + "</tbody></table></div>" +
          '<p class="price" style="margin-top:12px">Total: $' + t.total + "</p>" +
          '<div class="vibe-actions"><button class="btn gold" id="modalOrder">Place order 🛵</button></div>'
        : '<p class="muted" style="margin-top:10px">The cart is empty — add something from the Delivery page.</p>')
    );
    qsa("[data-rm]").forEach((b) => b.addEventListener("click", () => {
      const c2 = cartOf(u);
      const i = c2.findIndex((x) => x.id === b.dataset.rm);
      if (i >= 0) c2.splice(i, 1);
      FC.store.save();
      closeModal();
      renderPage(qs("#view"), "delivery");
    }));
    const mo = qs("#modalOrder");
    if (mo) mo.addEventListener("click", () => { closeModal(); placeOrder(u, body); });
  }

  function placeOrder(u, body) {
    const d = db(), c = cartOf(u);
    if (!c.length) { toast("Add something to the cart first 🛍", "gold"); return; }
    const items = c.map((it) => {
      const p = d.products.find((x) => x.id === it.id);
      return { id: it.id, name: p ? p.name : it.id, price: p ? p.price : 0, qty: it.qty };
    });
    const total = items.reduce((n, i) => n + i.price * i.qty, 0);
    d.orders.unshift({ id: uid("o"), userId: u.id, items, total, at: Date.now(), status: "placed" });
    d.carts[u.id] = [];
    FC.store.save();
    FC.notify.push(u.id, "🛵 Order placed — $" + total + " is on its way.", "🛵");
    toast("Order placed ✦ $" + total, "gold");
    FC.app.refreshBadges();
    renderPage(body.closest("#view"), "delivery");
  }

  /* ── Book Library ── */
  function stars(n) {
    const full = Math.round(n);
    return '<span class="stars-row">' + "★".repeat(full) + "☆".repeat(5 - full) + "</span>";
  }
  function avgReviews(d, id) {
    const r = d.reviews[id] || [];
    if (!r.length) return null;
    return r.reduce((n, x) => n + x.stars, 0) / r.length;
  }

  function renderLibrary(body) {
    const d = db(), u = me();
    const borrowed = d.borrows[u.id] = d.borrows[u.id] || [];
    body.innerHTML =
      '<div class="section-head"><h2>Facecome suggested books</h2>' +
        '<span class="muted" style="font-size:.75rem">borrowed ' + borrowed.length + " / 3</span></div>" +
      '<div class="book-grid">' +
        d.books.map((b) => {
          const revs = d.reviews[b.id] || [];
          const avg = avgReviews(d, b.id);
          const has = borrowed.includes(b.id);
          return '<div class="book-card glass"><div class="card-img"><img src="' + esc(b.cover) + '" alt="' + esc(b.title) + '" /></div>' +
            "<h3>" + esc(b.title) + "</h3>" +
            '<span class="muted" style="font-size:.72rem">' + esc(b.author) + "</span>" +
            "<p>" + esc(b.bio) + "</p>" +
            "<div>" + stars(avg || b.rating) + ' <small class="muted">' + (avg ? avg.toFixed(1) : b.rating) + " · " + revs.length + " reviews</small></div>" +
            '<div class="vibe-actions">' +
              '<button class="btn ' + (has ? "" : "gold") + ' sm" data-borrow="' + b.id + '">' + (has ? "Return" : "Borrow") + "</button>" +
              '<button class="btn sm" data-review="' + b.id + '">Review</button>' +
            "</div>" +
            (revs.length ? '<div class="review"><b>' + esc((FC.store.userById(revs[revs.length - 1].userId) || { name: "Reader" }).name) + "</b> " +
              "★".repeat(revs[revs.length - 1].stars) + "<br>" + esc(revs[revs.length - 1].text) + "</div>" : "") +
            "</div>";
        }).join("") +
      "</div>";

    qsa("[data-borrow]", body).forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.borrow, i = borrowed.indexOf(id);
      if (i >= 0) { borrowed.splice(i, 1); toast("Returned — the shelf misses it."); }
      else {
        if (borrowed.length >= 3) { toast("Borrow limit reached (3) — return one first.", "gold"); return; }
        borrowed.push(id);
        const bk = d.books.find((x) => x.id === id);
        FC.notify.push(u.id, "📚 You borrowed “" + bk.title + "”.", "📚");
        toast("Borrowed ✦ happy reading", "gold");
      }
      FC.store.save();
      renderPage(qs("#view"), "library");
    }));

    qsa("[data-review]", body).forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.review, bk = d.books.find((x) => x.id === id);
      let picked = 4;
      openModal("<h3>Review</h3><p class='muted' style='margin:4px 0 10px'>" + esc(bk.title) + "</p>" +
        '<div class="chips" id="starPick">' + [1, 2, 3, 4, 5].map((n) => '<button class="chip ' + (n === 4 ? "on" : "") + '" data-star="' + n + '">' + "★".repeat(n) + "</button>").join("") + "</div>" +
        '<label>Your thoughts</label><textarea id="revText" placeholder="What stayed with you?"></textarea>' +
        '<p class="err" id="revErr"></p><button class="btn gold" id="revSave">Post review</button>');
      qsa("[data-star]").forEach((s) => s.addEventListener("click", () => {
        picked = +s.dataset.star;
        qsa("[data-star]").forEach((x) => x.classList.toggle("on", x === s));
      }));
      qs("#revSave").addEventListener("click", () => {
        const txt = qs("#revText").value.trim();
        if (!txt) { qs("#revErr").textContent = "Write a line or two first."; return; }
        d.reviews[id] = d.reviews[id] || [];
        d.reviews[id].push({ userId: u.id, stars: picked, text: txt, at: Date.now() });
        FC.store.save();
        closeModal();
        renderPage(qs("#view"), "library");
        toast("Review posted ✦", "gold");
      });
    }));
  }

  /* ── shared suggestion rail (Love Zone + Messages) ── */
  let suggPool = [];
  function suggestionsHTML(withTitle) {
    const d = db();
    suggPool = [];
    const rows = []
      .concat(d.suggestions.books.map((id) => [d.books.find((b) => b.id === id), "book", "#/page/library"]))
      .concat(d.suggestions.movies.map((id) => [d.movies.find((m) => m.id === id), "movie", null]))
      .concat(d.suggestions.products.map((id) => [d.products.find((p) => p.id === id), "product", "#/page/delivery"]))
      .filter((x) => x[0]);
    return (withTitle ? '<div class="section-head"><h2>' + withTitle + "</h2></div>" : "") +
      '<div class="search-res" style="max-height:none">' +
      rows.map(([item, kind, href]) => {
        suggPool.push({ item, kind, href });
        const img = item.cover || item.image;
        return '<button class="res-item" type="button" data-sg="' + (suggPool.length - 1) + '">' +
          '<img src="' + esc(img) + '" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover" />' +
          "<span><b>" + esc(item.title || item.name) + "</b><small>" +
          esc(item.author || item.genre || item.desc || item.bio || "") + "</small></span>" +
          '<span class="res-kind">' + kind + "</span></button>";
      }).join("") + "</div>";
  }

  function bindSuggestions(root) {
    qsa("[data-sg]", root).forEach((b) => b.addEventListener("click", () => {
      const e = suggPool[+b.dataset.sg];
      if (e) openSugg(e);
    }));
  }

  function openSugg(e) {
    const { item, kind, href } = e;
    const img = item.cover || item.image;
    openModal(
      '<div class="card-img" style="margin-top:6px"><img src="' + esc(img) + '" alt="" /></div>' +
      '<h3 style="margin-top:14px">' + esc(item.title || item.name) + "</h3>" +
      '<span class="res-kind" style="margin:0">' + kind + " · facecome suggests</span>" +
      '<p class="page-bio" style="font-size:.95rem">' + esc(item.bio || item.desc || item.genre || "") + "</p>" +
      (item.price ? '<p class="price">$' + item.price + "</p>" : "") +
      '<div class="vibe-actions" style="margin-top:14px">' +
        (kind === "product"
          ? '<button class="btn gold" id="sgAdd">Add to cart 🛒</button>'
          : '<button class="btn gold" id="sgGo">' + (kind === "book" ? "Open the library" : "Queue for tonight") + "</button>") +
      "</div>"
    );
    const add = qs("#sgAdd");
    if (add) add.addEventListener("click", () => {
      const u = me();
      if (!u) return;
      const c = cartOf(u), found = c.find((x) => x.id === item.id);
      if (found) found.qty++;
      else c.push({ id: item.id, qty: 1 });
      FC.store.save();
      closeModal();
      toast("Added to your Delivery cart ✦", "gold");
      FC.router.navigate("page/delivery");
    });
    const go = qs("#sgGo");
    if (go) go.addEventListener("click", () => {
      closeModal();
      if (href) FC.router.navigate(href.replace(/^#\//, ""));
      else toast("Queued ✦ movie night sorted 🎬", "gold");
    });
  }

  /* ── Love Zone ── */
  function renderLove(body) {
    const d = db(), u = me();
    const couples = [
      { a: "zara", b: "theo", note: "matched on “Yellow & Blue”" },
      { a: "nova", b: "milo", note: "matched on late-night music" },
      { a: "ivy", b: "kai", note: "matched on token tournaments" },
    ];
    const vibes = d.posts.filter((p) => p.category === "love").sort((a, b) => b.createdAt - a.createdAt);
    body.innerHTML =
      '<div class="two-col">' +
        '<div class="soul-card"><h3>' + (u.soulmate ? "💛 You are matched" : "🔓 Unlock your soulmate") + "</h3>" +
          "<p>" + (u.soulmate
            ? "Your match is waiting in messages. Keep the conversation alive."
            : "Costs 25 tokens. Matching reads your vibe, then opens texting.") + "</p>" +
          '<button class="btn gold" id="loveUnlock">' + (u.soulmate ? "Open messages" : "Unlock — 25 🪙") + "</button></div>" +
        '<div class="glass" style="padding:18px">' + suggestionsHTML("Suggested for you") + "</div>" +
      "</div>" +
      '<div class="section-head"><h2>Recently matched</h2></div>' +
      '<div class="couple-grid">' +
        couples.map((c) => {
          const a = d.users.find((x) => x.username === c.a), b = d.users.find((x) => x.username === c.b);
          if (!a || !b) return "";
          return '<div class="couple-card glass"><div class="couple-pair">' +
            '<span class="avatar lg" style="--uc:' + esc(a.color) + '"><img src="' + esc(a.photo) + '" alt=""/></span>' +
            '<span class="avatar lg" style="--uc:' + esc(b.color) + '"><img src="' + esc(b.photo) + '" alt=""/></span></div>' +
            "<b>" + esc(a.name.split(" ")[0]) + " 💛 " + esc(b.name.split(" ")[0]) + "</b>" +
            '<small class="muted" style="font-size:.72rem">' + esc(c.note) + "</small>" +
            '<button class="btn sm" data-talk="' + a.id + "," + b.id + '">Say hello</button></div>';
        }).join("") +
      "</div>" +
      '<div class="section-head"><h2>Vibes in the zone</h2></div>' +
      '<div class="post-list" id="loveList">' +
        (vibes.length ? vibes.map((p) => FC.feed.postCardHTML(p)).join("") : '<p class="empty">No love-zone posts yet — share the first vibe.</p>') +
      "</div>";

    bindSuggestions(body);

    qs("#loveUnlock", body).addEventListener("click", () => {
      if (u.soulmate) FC.router.navigate("messages");
      else FC.messages.soulmateFlow();
    });
    qsa("[data-talk]", body).forEach((b) => b.addEventListener("click", () => {
      const [a, bId] = b.dataset.talk.split(",");
      const target = a === u.id ? bId : a;
      if (target === u.id) { toast("Pick someone else to talk to 🙂"); return; }
      FC.messages.openWith(target);
    }));
  }

  FC.pages = { renderList, renderPage, suggestionsHTML, bindSuggestions };
})();

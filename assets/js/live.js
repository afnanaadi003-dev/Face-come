/* ═══ Facecome — live: studio with unique themes, broadcast, viewer room ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, qs, qsa, toast, timeAgo, startCam, stopCam } = FC.ui;
  let ticker = null;
  let camOn = false;

  const THEMES = [
    { id: "gold", name: "Golden Narrative", grad: "linear-gradient(140deg,#f0c94a,#7a4a05 70%)", live: "#f0c94a" },
    { id: "abyss", name: "Blue Abyss", grad: "linear-gradient(140deg,#4a7dff,#050a1c)", live: "#7ea6ff" },
    { id: "aurora", name: "Aurora Drift", grad: "linear-gradient(140deg,#12d8a0,#3b2f7a)", live: "#7ce7d2" },
    { id: "neon", name: "Neon Arcade", grad: "linear-gradient(140deg,#ff4fd8,#2b1b7a)", live: "#ff7fe4" },
    { id: "rose", name: "Midnight Rose", grad: "linear-gradient(140deg,#f29a9e,#2a0d1f)", live: "#f29a9e" },
    { id: "ember", name: "Ember Wave", grad: "linear-gradient(140deg,#ff8b3d,#4a1205)", live: "#ffb072" },
  ];
  const AUDIENCE = ["Nova", "Kai", "Lina", "Theo", "Ivy", "Milo", "Zara", "a night owl", "a dreamer", "the vibe layer"];
  const LINES = ["the theme is unreal 🔥", "joined from the Magic Box ✨", "respect 🙏", "this is so Facecome", "sound check?", "💛 love from the Flow", "who else got the notification?", "one more round!"];

  function me() { return FC.auth.me(); }
  function db() { return FC.store.load(); }
  function themeById(id) { return THEMES.find((t) => t.id === id) || THEMES[0]; }

  function myLivePost() {
    const u = me();
    return db().posts.find((p) => p.live && p.live.active && p.live.broadcasterId === u.id) || null;
  }

  /* ── studio ── */
  function renderStudio(view) {
    stopTicker();
    const u = me();
    const onAir = myLivePost();
    if (onAir) { renderOnAir(view, u, onAir); return; }

    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">Live studio</h1><p class="muted">Lively broadcasting — pick a unique theme, show your face, open the room.</p></div>' +
      '<div class="studio">' +
        '<section class="studio-form glass">' +
          '<div class="section-head"><h2>Broadcast</h2></div>' +
          '<label for="liveTitle">Title</label>' +
          '<input id="liveTitle" placeholder="e.g. Late-night thoughts &amp; playlists" />' +
          "<label>Theme</label>" +
          '<div class="theme-chips" id="themeChips">' +
            THEMES.map((t, i) => '<button class="theme-chip ' + (i === 0 ? "on" : "") + '" data-theme="' + t.id + '" style="background:' + t.grad + '">' + t.name + "</button>").join("") +
          "</div>" +
          '<label>Camera</label>' +
          '<div class="vibe-actions"><button class="btn blue sm" id="camBtn">📷 Start camera preview</button>' +
          '<span class="muted" style="font-size:.72rem" id="camState">camera off</span></div>' +
          '<button class="btn gold" id="goLive" style="justify-content:center;margin-top:8px">🔴 Go live</button>' +
          '<p class="err" id="liveErr"></p>' +
        "</section>" +
        '<section class="live-stage" id="previewStage">' +
          '<video id="studioCam" data-cam autoplay muted playsinline hidden></video>' +
          '<img class="stage-art" id="stageArt" src="' + esc(u.cover) + '" alt="" />' +
          '<div class="live-overlay"><span class="live-dot">PREVIEW</span>' +
            '<span class="lo-title" id="prevTitle">Your broadcast preview</span>' +
            '<span class="muted" id="prevTheme">' + THEMES[0].name + "</span></div>" +
        "</section>" +
      "</div>";

    let theme = THEMES[0];
    const stage = qs("#previewStage", view);
    const applyTheme = () => { stage.style.background = theme.grad; qs("#prevTheme", view).textContent = theme.name; };
    applyTheme();

    qsa("[data-theme]", view).forEach((b) => b.addEventListener("click", () => {
      theme = themeById(b.dataset.theme);
      qsa("[data-theme]", view).forEach((x) => x.classList.toggle("on", x === b));
      applyTheme();
    }));

    qs("#liveTitle", view).addEventListener("input", (e) => {
      qs("#prevTitle", view).textContent = e.target.value.trim() || "Your broadcast preview";
    });

    qs("#camBtn", view).addEventListener("click", async () => {
      const vid = qs("#studioCam", view);
      if (camOn) {
        stopCam(); camOn = false;
        vid.hidden = true; qs("#stageArt", view).style.opacity = "";
        qs("#camState", view).textContent = "camera off";
        qs("#camBtn", view).textContent = "📷 Start camera preview";
        return;
      }
      const s = await startCam(vid);
      if (s) {
        camOn = true;
        vid.hidden = false;
        qs("#stageArt", view).style.opacity = "0.25";
        qs("#camState", view).textContent = "camera live";
        qs("#camBtn", view).textContent = "⏹ Stop camera";
      }
    });

    qs("#goLive", view).addEventListener("click", () => {
      const title = qs("#liveTitle", view).value.trim() || "Live on Facecome";
      const d = db();
      const p = {
        id: FC.ui.uid("p"), userId: u.id, type: "text", category: "live",
        text: "🔴 LIVE — " + title, media: null, createdAt: Date.now(),
        comments: [], love: [], respect: [],
        live: { active: true, theme: theme.name, grad: theme.grad, title, viewers: 12 + Math.floor(Math.random() * 40), chat: [], broadcasterId: u.id },
      };
      d.posts.unshift(p);
      d.users.forEach((x) => { if (x.id !== u.id) FC.store.notify(x.id, "🔴 " + u.name.split(" ")[0] + " is live: “" + title + "”", "📺"); });
      FC.store.save();
      FC.app.refreshBadges();
      toast("You are LIVE ✦", "gold");
      renderStudio(view);
    });
  }

  /* ── broadcaster on air ── */
  function renderOnAir(view, u, post) {
    const L = post.live;
    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">On air</h1><p class="muted">Your broadcast is in the Flow — people are joining in live.</p></div>' +
      '<div class="studio">' +
        '<section class="studio-form glass">' +
          '<div class="section-head"><h2>' + esc(L.title) + "</h2></div>" +
          '<p class="page-bio">theme: ' + esc(L.theme) + "</p>" +
          '<div class="stat-grid"><div class="stat-box glass"><b id="vCount">' + L.viewers + "</b><small>watching</small></div>" +
          '<div class="stat-box glass"><b id="hCount">' + post.love.length + "</b><small>love</small></div></div>" +
          '<div class="live-tape glass" id="tape" style="margin-top:12px"></div>' +
          '<form id="bcForm" style="display:flex;gap:8px"><input id="bcInput" placeholder="Say something to your room…" autocomplete="off" />' +
          '<button class="btn gold sm" type="submit">Send</button></form>' +
          '<div class="live-react" style="padding:0">' +
            ["❤", "🙏", "😮", "✨"].map((r) => '<button class="act" data-react="' + r + '">' + r + "</button>").join("") +
          "</div>" +
          '<button class="btn danger" id="endLive" style="justify-content:center">⏹ End broadcast</button>' +
        "</section>" +
        '<section class="live-stage" style="background:' + esc(L.grad || "linear-gradient(140deg,#f0c94a,#7a4a05)") + '">' +
          '<video id="studioCam" data-cam autoplay muted playsinline' + (camOn ? "" : " hidden") + "></video>" +
          '<img class="stage-art" src="' + esc(u.photo) + '" alt="" style="opacity:.35" />' +
          '<div class="live-overlay"><span class="live-dot">LIVE</span>' +
            '<span class="lo-title">' + esc(L.title) + "</span>" +
            '<span class="muted" id="ovViewers">' + L.viewers + " watching · theme " + esc(L.theme) + "</span></div>" +
        "</section>" +
      "</div>";

    const tape = qs("#tape", view);
    const addLine = (who, line, mine) => {
      const div = document.createElement("div");
      div.className = "tape-line";
      div.innerHTML = (mine ? "<b>You:</b>" : "<b>" + esc(who) + ":</b>") + " " + esc(line);
      tape.appendChild(div);
      while (tape.children.length > 40) tape.removeChild(tape.firstChild);
      tape.scrollTop = tape.scrollHeight;
      L.chat.push({ who, line, at: Date.now() });
      if (L.chat.length > 60) L.chat.shift();
      FC.store.save();
    };
    (L.chat || []).slice(-12).forEach((c) => addLine(c.who, c.line));

    ticker = setInterval(() => {
      L.viewers += Math.random() < 0.6 ? 1 : -1;
      if (L.viewers < 3) L.viewers = 3;
      const vc = qs("#vCount", view), ov = qs("#ovViewers", view);
      if (vc) vc.textContent = L.viewers;
      if (ov) ov.textContent = L.viewers + " watching · theme " + L.theme;
      if (Math.random() < 0.7)
        addLine(AUDIENCE[Math.floor(Math.random() * AUDIENCE.length)], LINES[Math.floor(Math.random() * LINES.length)]);
    }, 3800);

    qs("#bcForm", view).addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = qs("#bcInput", view);
      const text = inp.value.trim();
      if (!text) return;
      addLine("You", text, true);
      inp.value = "";
    });
    qsa("[data-react]", view).forEach((b) => b.addEventListener("click", () => {
      toast(b.dataset.react + " sent to the room");
      if (b.dataset.react === "❤") { post.love.push(u.id); FC.store.save(); }
    }));
    qs("#endLive", view).addEventListener("click", () => {
      stopCam(); camOn = false; stopTicker();
      post.live.active = false;
      post.live.endedAt = Date.now();
      FC.store.save();
      toast("Broadcast ended — replay stays in the Flow.");
      FC.router.navigate("feed");
    });
  }

  /* ── viewer ── */
  function renderViewer(view, postId) {
    stopTicker();
    const u = me();
    const post = db().posts.find((p) => p.id === postId);
    if (!post || !post.live) {
      view.innerHTML = '<p class="empty">That broadcast is gone — <a href="#/feed" style="color:var(--gold)">back to the Flow</a></p>';
      return;
    }
    const L = post.live;
    const b = FC.store.userById(L.broadcasterId) || { name: "Someone", photo: "", color: "#f0c94a" };
    const joined = true;

    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">' + (L.active ? "Join in live" : "Replay") + "</h1>" +
        '<p class="muted">' + esc(b.name) + " · " + (L.active ? "on air now" : "broadcast ended " + timeAgo(L.endedAt || post.createdAt)) + "</p></div>" +
      '<div class="studio">' +
        '<section class="studio-form glass">' +
          '<div class="section-head"><h2>' + esc(L.title) + "</h2></div>" +
          '<div class="stat-grid"><div class="stat-box glass"><b id="vCount">' + L.viewers + "</b><small>were watching</small></div>" +
          '<div class="stat-box glass"><b>' + post.love.length + "</b><small>love</small></div></div>" +
          '<div class="live-tape glass" id="tape" style="margin-top:12px"></div>' +
          '<form id="chatForm" style="display:flex;gap:8px"><input id="chatInput" placeholder="Say hi in the room…" autocomplete="off" />' +
          '<button class="btn gold sm" type="submit">Send</button></form>' +
          '<div class="live-react" style="padding:0">' +
            ["❤", "🙏", "😮", "✨"].map((r) => '<button class="act" data-react="' + r + '">' + r + "</button>").join("") +
          "</div>" +
          '<div class="vibe-actions"><button class="btn blue sm" id="viewerCam">📷 Join with camera</button>' +
          '<a class="btn sm" href="#/feed">← Back to Flow</a></div>' +
        "</section>" +
        '<section class="live-stage" style="background:' + esc(L.grad || "linear-gradient(140deg,#4a7dff,#050a1c)") + '">' +
          '<video id="viewerCamEl" data-cam autoplay muted playsinline hidden></video>' +
          '<img class="stage-art" src="' + esc(b.photo) + '" alt="" style="opacity:.55" />' +
          '<div class="live-overlay">' +
            '<span class="live-dot' + (L.active ? "" : "") + '">' + (L.active ? "LIVE" : "OFF AIR") + "</span>" +
            '<span class="lo-title">' + esc(L.title) + "</span>" +
            '<span class="muted">' + esc(b.name) + " · theme " + esc(L.theme || "—") + (joined ? " · you joined" : "") + "</span></div>" +
        "</section>" +
      "</div>";

    const tape = qs("#tape", view);
    const addLine = (who, line, mine) => {
      const div = document.createElement("div");
      div.className = "tape-line";
      div.innerHTML = (mine ? "<b>You:</b>" : "<b>" + esc(who) + ":</b>") + " " + esc(line);
      tape.appendChild(div);
      while (tape.children.length > 40) tape.removeChild(tape.firstChild);
      tape.scrollTop = tape.scrollHeight;
    };
    (L.chat || []).slice(-14).forEach((c) => addLine(c.who, c.line));
    if (!(L.chat || []).length) addLine("Facecome", "welcome to the room — say something ✦");

    if (L.active) {
      ticker = setInterval(() => {
        if (Math.random() < 0.6)
          addLine(AUDIENCE[Math.floor(Math.random() * AUDIENCE.length)], LINES[Math.floor(Math.random() * LINES.length)]);
      }, 4200);
    }

    qs("#chatForm", view).addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = qs("#chatInput", view);
      const text = inp.value.trim();
      if (!text) return;
      addLine(u.name.split(" ")[0], text, true);
      inp.value = "";
      if (L.broadcasterId !== u.id)
        FC.notify.push(L.broadcasterId, "📺 " + u.name.split(" ")[0] + " in your room: “" + text.slice(0, 50) + "”", "📺");
      else FC.app.refreshBadges();
    });
    qsa("[data-react]", view).forEach((btn) => btn.addEventListener("click", () => {
      addLine(u.name.split(" ")[0], btn.dataset.react + " reacted");
      if (btn.dataset.react === "❤") { post.love.push(u.id); FC.store.save(); }
    }));
    qs("#viewerCam", view).addEventListener("click", async () => {
      const vid = qs("#viewerCamEl", view);
      const s = await startCam(vid);
      if (s) { vid.hidden = false; toast("You're on camera — joined in live ✦"); }
    });
  }

  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

  FC.live = { renderStudio, renderViewer, THEMES };
})();

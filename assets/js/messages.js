/* ═══ Facecome — messages: soulmate unlock/match, chat, suggestions, topic video rooms ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, qs, qsa, toast, timeAgo, uid, openModal, closeModal, startCam, stopCam } = FC.ui;
  const SOUL_COST = 25;
  let mode = "empty";
  let room = null;
  let roomLog = [];

  const ROOMS = [
    { id: "music", icon: "🎧", name: "Music", desc: "Boys & girls trading playlists", lines: ["Okay that bridge is everything 🎵", "Send me the track, I'll queue it", "This chorus feels like 2am city lights"] },
    { id: "books", icon: "📚", name: "Books", desc: "Readers talking chapters", lines: ["I'm 60 pages from the twist, no spoilers", "Facecome suggested this one to me too", "Your reading schedule is chaotic, I respect it"] },
    { id: "gaming", icon: "🎮", name: "Gaming", desc: "Arcade talk, token talk", lines: ["One more round, I mean it this time", "Aura Tap tournament tonight — bring reflexes", "You owe me a rematch 😄"] },
    { id: "movies", icon: "🎬", name: "Movies", desc: "Scenes, scores, endings", lines: ["The ending reframes everything", "Yellow & Blue is criminally underrated", "Movie night Friday? I'll bring popcorn"] },
    { id: "night", icon: "🌙", name: "Late night thoughts", desc: "The narrative room", lines: ["The city got quiet and my head got loud", "Some thoughts only make sense after midnight", "Tell me the unfiltered version"] },
  ];

  function me() { return FC.auth.me(); }
  function db() { return FC.store.load(); }

  function threadFor(a, b) {
    return db().threads.find((t) => t.participants.includes(a) && t.participants.includes(b)) || null;
  }
  function ensureThread(a, b) {
    const d = db();
    let t = threadFor(a, b);
    if (!t) {
      t = { id: uid("th"), participants: [a, b], soulmate: false, messages: [], read: {} };
      d.threads.push(t);
      FC.store.save();
    }
    return t;
  }
  function otherOf(t, u) {
    const id = t.participants.find((x) => x !== u.id);
    return FC.store.userById(id);
  }
  function unreadOf(t, u) {
    const last = t.messages[t.messages.length - 1];
    if (!last || last.from === u.id) return false;
    return !(t.read && t.read[u.id] >= last.at);
  }

  function openWith(userId) {
    const u = me();
    if (!u) return;
    if (userId === u.id) { toast("That's you 🙂"); return; }
    const t = ensureThread(u.id, userId);
    mode = "empty";
    FC.router.navigate("messages/" + t.id);
  }

  /* ── soulmate ── */
  function soulmateFlow() {
    const u = me();
    if (u.soulmate) {
      const t = threadFor(u.id, u.soulmate);
      if (t) { FC.router.navigate("messages/" + t.id); return; }
    }
    if (u.tokens < SOUL_COST) {
      openModal("<h3>Unlock your soulmate</h3>" +
        '<p class="page-bio">It costs ' + SOUL_COST + " tokens — you have " + u.tokens + ".</p>" +
        '<p class="muted" style="font-size:.86rem">Earn tokens by sharing thoughts (+2), opening the Magic Box, or playing the Gaming Hub.</p>' +
        '<div class="vibe-actions"><a class="btn gold" href="#/magic">Open Magic Box</a><a class="btn" href="#/page/gaming">Play games</a></div>');
      return;
    }
    openModal(
      "<h3>Unlock your soulmate</h3>" +
      '<p class="page-bio">' + SOUL_COST + " tokens → matching → texting unlocks.</p>" +
      '<label>Your vibe at midnight</label>' +
      '<div class="chips" id="vibePick">' +
        ["loud thoughts", "soft music", "one more chapter", "city lights", "pure silence"].map((v, i) =>
          '<button class="chip ' + (i === 0 ? "on" : "") + '" data-vibe="' + v + '">' + v + "</button>").join("") +
      "</div>" +
      '<label>Who should find you</label>' +
      '<div class="chips" id="whoPick">' +
        ["a reader", "a gamer", "a night thinker", "a dreamer"].map((v, i) =>
          '<button class="chip ' + (i === 0 ? "on" : "") + '" data-who="' + v + '">' + v + "</button>").join("") +
      "</div>" +
      '<p class="err" id="soulErr"></p>' +
      '<button class="btn gold" id="soulStart" style="width:100%;justify-content:center">Pay ' + SOUL_COST + " 🪙 & match me</button>"
    );
    let vibe = "loud thoughts", who = "a reader";
    qsa("[data-vibe]").forEach((b) => b.addEventListener("click", () => {
      vibe = b.dataset.vibe; qsa("[data-vibe]").forEach((x) => x.classList.toggle("on", x === b));
    }));
    qsa("[data-who]").forEach((b) => b.addEventListener("click", () => {
      who = b.dataset.who; qsa("[data-who]").forEach((x) => x.classList.toggle("on", x === b));
    }));
    qs("#soulStart").addEventListener("click", () => runMatching(u, vibe, who));
  }

  function runMatching(u, vibe, who) {
    const box = qs(".modal-box");
    box.innerHTML = "<h3>Matching…</h3>" +
      '<p class="page-bio">reading your vibe (“' + esc(vibe) + '”) and looking for ' + esc(who) + "…</p>" +
      '<div class="prize" style="margin-top:12px"><span class="p-ic">🔮</span><h3>the vibe layer is searching</h3><p>tokens held: ' + u.tokens + "</p></div>";
    setTimeout(() => {
      const d = db();
      const pool = d.users.filter((x) => x.id !== u.id && x.demo && !x.banned);
      const cand = pool[Math.floor(Math.random() * pool.length)] || pool[0];
      if (!cand) { closeModal(); toast("No one to match with right now.", "gold"); return; }
      u.tokens -= SOUL_COST;
      u.soulmate = cand.id;
      cand.soulmate = u.id;
      const t = ensureThread(u.id, cand.id);
      t.soulmate = true;
      t.messages.push({ id: uid("m"), from: cand.id, text: "We matched ✦ I'm " + cand.name.split(" ")[0] + " — your vibe said “" + vibe + "”. Talk to me.", at: Date.now() });
      t.read = {};
      FC.notify.push(cand.id, "💛 " + u.name.split(" ")[0] + " unlocked their soulmate — and it's you.", "💛");
      FC.store.save();
      FC.app.refreshBadges();
      box.innerHTML = "<h3>Match found</h3>" +
        '<div class="prize"><span class="p-ic">💛</span><h3>' + esc(cand.name) + "</h3>" +
        "<p>@" + esc(cand.username) + " — " + esc(cand.vibe || "quiet vibe") + "</p>" +
        "<small>−" + SOUL_COST + " tokens · texting unlocked</small></div>" +
        '<div class="vibe-actions" style="margin-top:14px"><button class="btn gold" id="goChat">Start talking</button>' +
        '<button class="btn" id="keepLooking">Keep looking</button></div>';
      qs("#goChat").addEventListener("click", () => { closeModal(); FC.router.navigate("messages/" + t.id); });
      qs("#keepLooking").addEventListener("click", closeModal);
    }, 1700);
  }

  function goRooms() {
    mode = "rooms";
    if (FC.router.current() !== "messages") FC.router.navigate("messages");
    else render(qs("#view"));
  }

  /* ── views ── */
  function render(view, threadId) {
    const u = me();
    if (!u) return;
    stopCam();
    const d = db();
    const threads = d.threads.filter((t) => t.participants.includes(u.id))
      .sort((a, b) => ((b.messages[b.messages.length - 1] || {}).at || 0) - ((a.messages[a.messages.length - 1] || {}).at || 0));

    if (threadId) mode = "chat";
    else if (mode === "chat") mode = "empty";

    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">Message</h1><p class="muted">Unlock a soulmate, keep the thread warm, or step into a topic room.</p></div>' +
      '<div class="msg-layout">' +
        '<div class="msg-col">' +
          (!u.soulmate
            ? '<div class="soul-card"><h3>🔓 Unlock your soulmate</h3><p>Matching costs ' + SOUL_COST + " tokens. You have " + u.tokens + ".</p>" +
              '<button class="btn gold sm" id="unlockSoul">Unlock — ' + SOUL_COST + " 🪙</button></div>"
            : '<div class="soul-card"><h3>💛 Matched</h3><p>Your soulmate is in your threads.</p></div>') +
          '<div class="msg-panel glass"><div class="section-head"><h2>Threads</h2></div>' +
            (threads.length ? threads.map((t) => {
              const o = otherOf(t, u);
              if (!o) return "";
              const last = t.messages[t.messages.length - 1];
              return '<a class="thread-item ' + (threadId === t.id ? "on" : "") + '" href="#/messages/' + t.id + '">' +
                '<span class="avatar sm" style="--uc:' + esc(o.color) + '"><img src="' + esc(o.photo) + '" alt=""/></span>' +
                '<span class="ti-main"><b>' + esc(o.name) + (t.soulmate ? " 💛" : "") + "</b>" +
                "<small>" + (last ? esc(last.text) : "no messages yet") + "</small></span>" +
                (unreadOf(t, u) ? '<span class="unread-dot"></span>' : "") + "</a>";
            }).join("") : '<p class="muted" style="font-size:.83rem">No threads yet — unlock a soulmate or say hello from a profile.</p>') +
          "</div>" +
          '<button class="btn blue" id="videoEntry" style="justify-content:center">🎥 Topic video chat</button>' +
        "</div>" +
        '<div class="msg-col msg-main" id="msgMain"></div>' +
        '<div class="msg-col msg-side"><div class="msg-panel glass">' + FC.pages.suggestionsHTML("Facecome suggests") + "</div></div>" +
      "</div>";

    const unlock = qs("#unlockSoul", view);
    if (unlock) unlock.addEventListener("click", soulmateFlow);
    qs("#videoEntry", view).addEventListener("click", goRooms);
    FC.pages.bindSuggestions(view);

    const main = qs("#msgMain", view);
    if (threadId) renderChat(main, u, threadId);
    else if (mode === "rooms") renderRooms(main);
    else if (mode === "room" && room) renderRoom(main, u);
    else renderEmpty(main, u, threads);
  }

  function renderEmpty(main, u, threads) {
    main.innerHTML = '<div class="msg-panel glass" style="min-height:460px;justify-content:center;text-align:center">' +
      '<div style="font-size:2.6rem">🎵</div>' +
      '<h2 class="narrative" style="color:var(--gold-soft);margin:8px 0">Tune in</h2>' +
      '<p class="muted" style="font-size:.9rem;max-width:420px;margin:0 auto">Pick a thread on the left, unlock your soulmate with tokens, ' +
      'or enter a topic video room — boys &amp; girls talking on the same wavelength.</p>' +
      (u.soulmate ? "" : '<div style="margin-top:16px"><button class="btn gold" id="emptyUnlock">Unlock soulmate — ' + SOUL_COST + " 🪙</button></div>") +
      (threads.length ? '<p class="muted" style="font-size:.78rem;margin-top:14px">' + threads.length + " active thread(s)</p>" : "") +
      "</div>";
    const b = qs("#emptyUnlock", main);
    if (b) b.addEventListener("click", soulmateFlow);
  }

  /* ── thread chat ── */
  function renderChat(main, u, threadId) {
    const d = db();
    const t = d.threads.find((x) => x.id === threadId);
    if (!t || !t.participants.includes(u.id)) {
      main.innerHTML = '<p class="empty">Thread not found.</p>';
      return;
    }
    const o = otherOf(t, u);
    t.read = t.read || {};
    t.read[u.id] = Date.now();
    FC.store.save();
    FC.app.refreshBadges();

    main.innerHTML =
      '<div class="chat-panel glass">' +
        '<div class="chat-head">' +
          '<span class="avatar sm" style="--uc:' + esc(o.color) + '"><img src="' + esc(o.photo) + '" alt=""/></span>' +
          "<span><b>" + esc(o.name) + "</b><small>" + (t.soulmate ? "soulmate thread" : "@" + esc(o.username)) + "</small></span>" +
          '<span class="ch-actions"><button class="btn blue sm" id="chatVideo">🎥 Video</button></span>' +
        "</div>" +
        '<div class="chat-body" id="chatBody">' +
          (t.messages.length ? t.messages.map((m) => {
            const mu = FC.store.userById(m.from) || { name: "?" };
            return '<div class="bubble ' + (m.from === u.id ? "mine" : "") + '">' + esc(m.text) +
              "<time>" + esc(mu.name.split(" ")[0]) + " · " + timeAgo(m.at) + "</time></div>";
          }).join("") : '<p class="muted" style="text-align:center;font-size:.85rem">No messages yet — break the silence ✦</p>') +
        "</div>" +
        '<form class="chat-form" id="chatForm"><input id="chatInput" placeholder="Write a message…" autocomplete="off" />' +
        '<button class="btn gold sm" type="submit">Send</button></form>' +
      "</div>";

    const body = qs("#chatBody", main);
    body.scrollTop = body.scrollHeight;

    qs("#chatVideo", main).addEventListener("click", goRooms);

    qs("#chatForm", main).addEventListener("submit", (e) => {
      e.preventDefault();
      const input = qs("#chatInput", main);
      const text = input.value.trim();
      if (!text) return;
      t.messages.push({ id: uid("m"), from: u.id, text, at: Date.now() });
      t.read = t.read || {};
      t.read[u.id] = Date.now();
      FC.store.save();
      input.value = "";
      appendBubble(body, u, text, "mine");
      if (o.demo) autoReply(t, o, body, u, text);
      else FC.notify.push(o.id, "🎵 " + u.name.split(" ")[0] + " messaged you.", "🎵");
    });
  }

  function appendBubble(body, u, text, cls, fromName) {
    const div = document.createElement("div");
    div.className = "bubble " + (cls || "");
    div.innerHTML = esc(text) + "<time>" + esc(fromName || "") + " · just now</time>";
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function autoReply(t, other, body, u, text) {
    const lines = [
      "Okay, you get me ✦",
      "Say more — I'm reading every word.",
      "Ha! Facecome matched us well 💛",
      "That reminds me of something I read in the Library...",
      "Honestly? Same energy as late-night Flow scrolling.",
    ];
    const pick = text.length > 40 ? lines[1] : lines[Math.floor(Math.random() * lines.length)];
    setTimeout(() => {
      const msg = { id: uid("m"), from: other.id, text: pick, at: Date.now() };
      t.messages.push(msg);
      t.read = t.read || {};
      if (!t.read[u.id]) delete t.read[u.id];
      FC.store.save();
      if (body && document.body.contains(body)) appendBubble(body, other, pick, "", other.name.split(" ")[0]);
      FC.notify.push(u.id, "💛 " + other.name.split(" ")[0] + " replied: “" + pick.slice(0, 50) + "”", "💛");
      FC.app.refreshBadges();
    }, 1400 + Math.random() * 1400);
  }

  /* ── video rooms ── */
  function renderRooms(main) {
    main.innerHTML =
      '<div class="msg-panel glass"><div class="section-head"><h2>Topic rooms</h2>' +
      '<span class="muted" style="font-size:.75rem">live camera · simulated partner</span></div>' +
      '<div class="room-grid" style="margin-top:12px">' +
        ROOMS.map((r) => '<button class="room-card glass" data-room="' + r.id + '">' +
          '<span class="r-ic">' + r.icon + "</span><b>" + r.name + "</b><small>" + r.desc + "</small></button>").join("") +
      "</div></div>";
    qsa("[data-room]", main).forEach((b) => b.addEventListener("click", () => {
      room = ROOMS.find((r) => r.id === b.dataset.room);
      roomLog = [];
      mode = "room";
      render(qs("#view"));
    }));
  }

  function renderRoom(main, u) {
    const d = db();
    const pool = d.users.filter((x) => x.demo && x.id !== u.id);
    const partner = pool[Math.floor(Math.random() * pool.length)] ||
      d.users.find((x) => x.id !== u.id) || u;
    main.innerHTML =
      '<div class="msg-panel glass">' +
        '<div class="section-head"><h2>' + room.icon + " " + room.name + " room</h2>" +
        '<button class="btn sm" id="leaveRoom">✕ Leave</button></div>' +
        '<div class="video-grid" style="margin-top:12px">' +
          '<div class="vtile"><video id="localCam" data-cam autoplay muted playsinline></video>' +
            '<span class="vlabel">You</span><span class="vtag">CAMERA</span></div>' +
          '<div class="vtile"><img src="' + esc(partner.photo) + '" alt="" />' +
            '<span class="vlabel">' + esc(partner.name) + "</span><span class=\"vtag\">SIMULATED</span></div>" +
        "</div>" +
        '<div class="chat-body" id="roomBody" style="margin-top:12px;min-height:180px;max-height:280px;border:1px solid var(--border-soft);border-radius:14px">' +
          '<div class="bubble"><b>' + esc(partner.name.split(" ")[0]) + "</b> joined the " + room.name.toLowerCase() + " room — topic is open.</div>" +
        "</div>" +
        '<form class="chat-form" id="roomForm" style="padding:0;border:0;margin-top:10px">' +
        '<input id="roomInput" placeholder="Talk about ' + esc(room.name.toLowerCase()) + '…" autocomplete="off" />' +
        '<button class="btn gold sm" type="submit">Send</button></form>' +
      "</div>";

    startCam(qs("#localCam", main));

    qs("#leaveRoom", main).addEventListener("click", () => {
      stopCam();
      goRooms();
    });

    qs("#roomForm", main).addEventListener("submit", (e) => {
      e.preventDefault();
      const input = qs("#roomInput", main);
      const text = input.value.trim();
      if (!text) return;
      const bodyEl = qs("#roomBody", main);
      appendBubble(bodyEl, u, text, "mine", "You");
      roomLog.push({ from: "me", text });
      input.value = "";
      setTimeout(() => {
        const line = room.lines[Math.floor(Math.random() * room.lines.length)];
        appendBubble(bodyEl, partner, line, "", partner.name.split(" ")[0]);
        roomLog.push({ from: partner.id, text: line });
      }, 1200 + Math.random() * 1200);
    });
  }

  FC.messages = { render, openWith, soulmateFlow };
})();

/* ═══ Facecome — feed (Flow): composer, categories, comments, love & respect, join live ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, timeAgo, toast, qs, qsa, fileToDataURL, postArt } = FC.ui;
  let filter = "all";
  let composerType = "text";

  function me() { return FC.auth.me(); }

  function avatarHTML(u, cls) {
    return '<span class="avatar ' + (cls || "") + '" style="--uc:' + esc(u.color) + '">' +
      '<img src="' + esc(u.photo) + '" alt="' + esc(u.name) + '" /></span>';
  }

  function actionBtn(kind, label, count, active, extra) {
    return '<button class="act ' + (active ? "on" : "") + '" data-act="' + kind + '" ' + (extra || "") + '>' +
      '<span class="act-ic">' + label + "</span><span class=\"act-n\">" + (count || "") + "</span></button>";
  }

  function postCardHTML(p, opts) {
    opts = opts || {};
    p.love = p.love || [];
    p.respect = p.respect || [];
    p.comments = p.comments || [];
    const u = FC.store.userById(p.userId) || {
      id: p.userId, name: "Former resident", username: "", color: "#9aa3b8",
      photo: FC.ui.photoArt("?", p.userId),
    };
    const viewer = me();
    const isMine = viewer && viewer.id === u.id;
    const loved = viewer && p.love.includes(viewer.id);
    const respected = viewer && p.respect.includes(viewer.id);
    const live = p.live;
    const media = p.media
      ? (p.type === "video"
        ? '<div class="post-media"><video src="' + esc(p.media) + '" controls playsinline preload="metadata"></video></div>'
        : '<div class="post-media"><img src="' + esc(p.media) + '" alt="post image" loading="lazy" /></div>')
      : "";
    const liveHTML = live
      ? '<div class="live-strip ' + (live.active ? "is-live" : "") + '" style="--lth:' + esc(live.theme || "gold") + '">' +
        '<span class="live-dot">' + (live.active ? "LIVE" : "OFF AIR") + "</span>" +
        '<b>' + esc(live.title || "Broadcast") + "</b>" +
        '<span class="muted">' + (live.active ? live.viewers + " watching" : "replay ready") + "</span>" +
        (live.active ? '<button class="btn gold sm" data-act="joinlive">Join in live</button>' : "") +
        "</div>"
      : "";
    const comments = p.comments.map((c) => {
      const cu = FC.store.userById(c.userId) || { name: "Ghost", photo: FC.ui.photoArt("?", c.userId), username: "" };
      return '<div class="comment">' + avatarHTML(cu, "xs") +
        '<div><b><a href="#/profile/' + esc(cu.username) + '">' + esc(cu.name) + "</a></b>" +
        '<p>' + esc(c.text) + "</p><time>" + timeAgo(c.at || c.createdAt) + "</time></div></div>";
    }).join("");

    return '<article class="post glass" data-post="' + esc(p.id) + '">' +
      '<header class="post-head">' +
        '<a class="post-who" href="#/profile/' + esc(u.username) + '">' + avatarHTML(u) +
          "<span><b>" + esc(u.name) + '</b><small>@' + esc(u.username) + " · " + timeAgo(p.createdAt) + "</small></span></a>" +
        '<span class="tag">' + esc(p.category || "thoughts") + "</span>" +
        (isMine ? '<button class="act" data-act="del" title="Delete">🗑</button>' : "") +
      "</header>" +
      (p.text ? '<div class="post-text ' + (p.type === "text" ? "narrative" : "") + '">' + esc(p.text) + "</div>" : "") +
      media + liveHTML +
      '<footer class="post-acts">' +
        actionBtn("love", "❤", p.love.length, loved) +
        actionBtn("respect", "🙏", p.respect.length, respected) +
        actionBtn("comment", "💬", p.comments.length, false) +
        (live && live.active ? actionBtn("joinlive", "📺", "join live", false) : "") +
      "</footer>" +
      '<section class="post-comments" hidden>' +
        '<div class="comment-list">' + (comments || '<p class="muted" style="font-size:.85rem">No comments yet — start the conversation.</p>') + "</div>" +
        '<form class="comment-form"><input name="c" placeholder="Write a comment…" autocomplete="off" required />' +
        '<button class="btn gold sm" type="submit">Send</button></form>' +
      "</section>" +
      "</article>";
  }

  /* ── interactions (delegated for feed + profile views) ── */
  function bindPostEvents(root) {
    if (!root || root.__fcPostBound) return;
    root.__fcPostBound = true;
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const card = btn.closest("[data-post]");
      if (!card && btn.dataset.act !== "del") return;
      const p = card ? FC.store.postById(card.dataset.post) : null;
      const act = btn.dataset.act;
      const viewer = me();
      if (!viewer) return;

      if (act === "love" || act === "respect") {
        if (!p) return;
        const arr = act === "love" ? p.love : p.respect;
        const i = arr.indexOf(viewer.id);
        if (i >= 0) arr.splice(i, 1);
        else {
          arr.push(viewer.id);
          if (p.userId !== viewer.id) FC.notify.push(p.userId, "❤ " + viewer.name.split(" ")[0] + " gave " + (act === "love" ? "love" : "respect") + " to your " + (p.type === "text" ? "thought" : p.type) + ".", act === "love" ? "❤" : "🙏");
        }
        FC.store.save();
        btn.classList.toggle("on", i < 0);
        qs(".act-n", btn).textContent = arr.length || "";
        if (FC.app) FC.app.refreshBadges();
        return;
      }
      if (act === "comment") {
        const sec = qs(".post-comments", card);
        sec.hidden = !sec.hidden;
        if (!sec.hidden) qs("input", sec).focus();
        return;
      }
      if (act === "joinlive") {
        if (p && p.live && p.live.active) FC.router.navigate("live/" + p.id);
        return;
      }
      if (act === "del") {
        if (!confirm("Delete this post?")) return;
        const db = FC.store.load();
        db.posts = db.posts.filter((x) => x.id !== card.dataset.post);
        FC.store.save();
        card.remove();
        toast("Post deleted.");
      }
    });

    root.addEventListener("submit", (e) => {
      const form = e.target.closest(".comment-form");
      if (!form) return;
      e.preventDefault();
      const card = form.closest("[data-post]");
      const p = FC.store.postById(card.dataset.post);
      const viewer = me();
      const input = qs("input", form);
      const text = input.value.trim();
      if (!p || !text) return;
      p.comments.push({ id: FC.ui.uid("c"), userId: viewer.id, text, at: Date.now() });
      FC.store.save();
      input.value = "";
      const sec = qs(".post-comments", card);
      const list = qs(".comment-list", sec);
      const u = viewer;
      list.insertAdjacentHTML("beforeend",
        '<div class="comment"><span class="avatar xs" style="--uc:' + esc(u.color) + '"><img src="' + esc(u.photo) + '" alt=""/></span>' +
        "<div><b>" + esc(u.name) + "</b><p>" + esc(text) + "</p><time>just now</time></div></div>");
      if (p.userId !== viewer.id) FC.notify.push(p.userId, "💬 " + viewer.name.split(" ")[0] + " commented: “" + text.slice(0, 60) + "”", "💬");
      qs('[data-act="comment"] .act-n', card).textContent = p.comments.length;
      if (FC.app) FC.app.refreshBadges();
    });
  }

  /* ── demo users react to your fresh posts (keeps the feed alive) ── */
  function demoReactTo(post) {
    const db = FC.store.load();
    const demos = db.users.filter((u) => u.demo && u.id !== post.userId);
    if (!demos.length) return;
    const a = demos[Math.floor(Math.random() * demos.length)];
    const lines = ["Love this energy ✨", "This is the Facecome vibe right here.", "Respect. 🙏", "Saving this to read twice.", "Okay this made my night 😄", "The narrative layer approves 💛"];
    setTimeout(() => {
      const p = FC.store.postById(post.id);
      if (!p) return;
      if (!p.love.includes(a.id)) p.love.push(a.id);
      p.comments.push({ id: FC.ui.uid("c"), userId: a.id, text: lines[Math.floor(Math.random() * lines.length)], at: Date.now() });
      FC.store.save();
      FC.notify.push(post.userId, "❤ " + a.name.split(" ")[0] + " loved and commented on your new post.", "❤");
      if (FC.router.current().startsWith("feed") || FC.router.current() === "")
        if (!(FC.app && FC.app.busy && FC.app.busy())) renderFeed(qs("#view"));
    }, 1600);
  }

  /* ── composer ── */
  function composerHTML() {
    const types = [["text", "Aa Text"], ["image", "🖼 Image"], ["video", "🎬 Video"]];
    return '<section class="composer glass">' +
      '<div class="composer-tabs chips">' +
        types.map(([t, l]) => '<button class="chip ' + (composerType === t ? "on" : "") + '" data-ctype="' + t + '">' + l + "</button>").join("") +
      "</div>" +
      '<textarea id="cpText" placeholder="Share a thought, a vibe, a narrative…"></textarea>' +
      '<div class="composer-media" id="cpMedia" ' + (composerType === "text" ? "hidden" : "") + '>' +
        (composerType === "video"
          ? '<label for="cpFile">File (small) or paste URL</label><input id="cpUrl" placeholder="https://…/video.mp4" /><input id="cpFile" type="file" accept="video/*" />'
          : '<label for="cpFile">Upload or paste URL</label><input id="cpUrl" placeholder="https://…/image.jpg" /><input id="cpFile" type="file" accept="image/*" />') +
      "</div>" +
      '<div class="composer-foot">' +
        '<select id="cpCat">' +
          [["thoughts", "Thoughts"], ["images", "Images"], ["videos", "Videos"], ["love", "Love Zone"], ["live", "Live"]].map(([v, l]) =>
            '<option value="' + v + '">' + l + "</option>").join("") +
        "</select>" +
        '<span class="muted" id="cpHint">Text posts earn +2 tokens</span>' +
        '<button class="btn gold" id="cpShare">Share ✦</button>' +
      "</div></section>";
  }

  function bindComposer(root) {
    qsa("[data-ctype]", root).forEach((b) =>
      b.addEventListener("click", () => {
        composerType = b.dataset.ctype;
        qsa("[data-ctype]", root).forEach((x) => x.classList.toggle("on", x === b));
        const media = qs("#cpMedia", root);
        media.hidden = composerType === "text";
        const hint = qs("#cpHint", root);
        hint.textContent = composerType === "text" ? "Text posts earn +2 tokens" : composerType === "image" ? "Images up to ~1.5MB" : "Videos: small files or URL";
        // rebuild media inputs for type
        media.innerHTML = composerType === "video"
          ? '<label for="cpFile">File (small) or paste URL</label><input id="cpUrl" placeholder="https://…/video.mp4" /><input id="cpFile" type="file" accept="video/*" />'
          : '<label for="cpFile">Upload or paste URL</label><input id="cpUrl" placeholder="https://…/image.jpg" /><input id="cpFile" type="file" accept="image/*" />';
      })
    );

    qs("#cpShare", root).addEventListener("click", async () => {
      const viewer = me();
      if (!viewer) return;
      const text = qs("#cpText", root).value.trim();
      const cat = qs("#cpCat", root).value;
      const url = qs("#cpUrl", root) ? qs("#cpUrl", root).value.trim() : "";
      const file = qs("#cpFile", root) && qs("#cpFile", root).files[0];
      if (!text && !file && !url) { toast("Write something first ✍️", "gold"); return; }
      let media = null;
      if (file) {
        const sizeMB = file.size / 1048576;
        const maxMB = composerType === "image" ? 1.5 : 2;
        if (sizeMB > maxMB) { toast("File too big for browser storage (" + sizeMB.toFixed(1) + "MB). Use a URL instead.", "gold"); return; }
        media = await fileToDataURL(file);
      } else if (url) media = url;

      const type = composerType;
      const p = {
        id: FC.ui.uid("p"), userId: viewer.id, type,
        text, media,
        category: type === "image" ? "images" : type === "video" ? "videos" : (cat === "images" || cat === "videos" ? "thoughts" : cat),
        createdAt: Date.now(), comments: [], love: [], respect: [],
        live: null,
      };
      const db = FC.store.load();
      db.posts.unshift(p);
      viewer.tokens += 2;
      FC.store.save();
      qs("#cpText", root).value = "";
      toast("Shared ✦ +2 tokens (balance: " + viewer.tokens + ")", "gold");
      if (FC.app) FC.app.refreshBadges();
      renderFeed(root.closest("#view") || qs("#view"));
      demoReactTo(p);
    });
  }

  /* ── feed view ── */
  function renderFeed(view) {
    const viewer = me();
    const db = FC.store.load();
    if (!viewer) {
      view.innerHTML =
        '<div class="view-head"><h1 class="gold-text">Flow</h1><p class="muted">' + esc(db.site.tagline) + "</p></div>" +
        '<section class="composer glass"><p>You are browsing Facecome as a guest — log in to share, react and comment.</p>' +
        '<div class="form-row"><button class="btn gold" id="guestLogin" type="button">Log in / Sign up</button>' +
        '<a class="btn" href="admin/">Admin</a></div></section>' +
        '<div class="post-list" id="postList">' + db.posts.slice().sort((a, b) => b.createdAt - a.createdAt)
          .map((p) => postCardHTML(p)).join("") + "</div>";
      const gl = qs("#guestLogin", view);
      if (gl) gl.addEventListener("click", () => FC.app.showAuth());
      bindPostEvents(view);
      return;
    }
    const chips = [["all", "All"], ["thoughts", "Thoughts"], ["images", "Images"], ["videos", "Videos"], ["live", "Live"], ["love", "Love Zone"]];
    const catMap = { thoughts: ["thoughts"], images: ["images"], videos: ["videos"], live: ["live"], love: ["love"] };
    let posts = db.posts.slice().sort((a, b) => b.createdAt - a.createdAt);
    if (filter !== "all") {
      const allow = catMap[filter] || [filter];
      posts = posts.filter((p) => allow.includes(p.category) || (filter === "live" && p.live));
    }
    view.innerHTML =
      '<div class="view-head"><h1 class="gold-text">Flow</h1><p class="muted">' + esc(db.site.tagline) + "</p></div>" +
      composerHTML() +
      '<div class="chips feed-chips">' + chips.map(([v, l]) =>
        '<button class="chip ' + (filter === v ? "on" : "") + '" data-f="' + v + '">' + l + "</button>").join("") + "</div>" +
      '<div class="post-list" id="postList">' +
      (posts.length ? posts.map((p) => postCardHTML(p)).join("") :
        '<p class="muted empty">' + (filter === "all"
          ? "The Flow is quiet — nothing is stored in this browser. "
            + '<button class="btn gold sm" id="restoreDemo" type="button">Restore demo posts</button>'
          : "Nothing in this category yet — share the first one.") + "</p>") +
      "</div>";

    const restore = qs("#restoreDemo", view);
    if (restore) restore.addEventListener("click", () => {
      if (!confirm("Restore the Facecome demo content in this browser? Your local changes will be replaced.")) return;
      FC.store.reset();
      location.reload();
    });
    qsa("[data-f]", view).forEach((c) => c.addEventListener("click", () => { filter = c.dataset.f; renderFeed(view); }));
    bindComposer(view);
    bindPostEvents(view);
  }

  FC.feed = { renderFeed, postCardHTML, bindPostEvents, demoReactTo, avatarHTML };
})();

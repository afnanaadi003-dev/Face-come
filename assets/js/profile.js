/* ═══ Facecome — profile: cover, photo, vibe → share thoughts, own feed ═══ */
window.FC = window.FC || {};
(function () {
  const { esc, qs, qsa, toast, timeAgo, fileToDataURL } = FC.ui;
  let vcType = "text";

  function me() { return FC.auth.me(); }

  function stats(u) {
    const posts = FC.store.db.posts.filter((p) => p.userId === u.id);
    const love = posts.reduce((n, p) => n + p.love.length, 0);
    const respect = posts.reduce((n, p) => n + p.respect.length, 0);
    return { posts: posts.length, love, respect };
  }

  function render(view, username) {
    const u = FC.store.userByName(username);
    const viewer = me();
    if (!u) {
      view.innerHTML = '<div class="view-head"><h1 class="gold-text">Profile</h1></div>' +
        '<p class="empty">No one lives at @' + esc(username) + ' — <a href="#/feed" style="color:var(--gold)">back to the Flow</a></p>';
      return;
    }
    const isMe = viewer && viewer.id === u.id;
    const s = stats(u);
    const mine = FC.store.db.posts.filter((p) => p.userId === u.id).sort((a, b) => b.createdAt - a.createdAt);
    const soul = u.soulmate ? FC.store.userById(u.soulmate) : null;

    view.innerHTML =
      '<section class="profile glass">' +
        '<div class="profile-cover">' +
          '<img src="' + esc(u.cover) + '" alt="cover" />' +
          (isMe ? '<button class="btn sm edit-cover" id="editCover" type="button">🖼 Change cover</button>' +
                  '<input type="file" id="coverFile" accept="image/*" hidden />' : "") +
        "</div>" +
        '<div class="profile-id">' +
          '<div class="profile-row">' +
            "<div>" +
              '<span class="avatar xl profile-photo" style="--uc:' + esc(u.color) + '"><img src="' + esc(u.photo) + '" alt="' + esc(u.name) + '" /></span>' +
              '<h1 class="profile-name narrative">' + esc(u.name) + "</h1>" +
              '<div class="profile-handle">@' + esc(u.username) + " · joined " + new Date(u.createdAt).toLocaleDateString() +
                (u.banned ? " · suspended" : "") + "</div>" +
            "</div>" +
            '<div class="profile-actions">' +
              (isMe
                ? '<button class="btn sm" id="editPhoto" type="button">📷 Change photo</button><input type="file" id="photoFile" accept="image/*" hidden />'
                : '<a class="btn gold sm" href="#/messages" id="msgThem">🎵 Message</a>' +
                  '<a class="btn blue sm" href="#/magic">🔍 Send a prize</a>') +
            "</div>" +
          "</div>" +
          '<div class="profile-stats">' +
            "<div><b>" + s.posts + "</b>posts</div>" +
            "<div><b>" + s.love + "</b>love</div>" +
            "<div><b>" + s.respect + "</b>respect</div>" +
            (isMe ? "<div><b>" + u.tokens + "</b>tokens</div>" : "") +
            "<div><b>" + (soul ? "1" : "0") + "</b>soulmate</div>" +
          "</div>" +
          '<p class="vibe-line">' + (u.vibe ? "“" + esc(u.vibe) + "”" : "<span class='muted'>no vibe shared yet</span>") + "</p>" +
          (isMe
            ? '<label for="vibeInput" style="margin-top:16px">Sharing vibe</label>' +
              '<input class="vibe-input" id="vibeInput" value="' + esc(u.vibe || "") + '" placeholder="✦ Sharing vibe — click to open share thoughts…" />' +
              '<div class="vibe-composer" id="vibeComposer" hidden>' +
                '<div class="chips" id="vcTabs">' +
                  '<button class="chip on" data-vt="text">Aa Text</button>' +
                  '<button class="chip" data-vt="image">🖼 Image</button>' +
                  '<button class="chip" data-vt="video">🎬 Video</button>' +
                "</div>" +
                '<textarea id="vcText" placeholder="Share thoughts — write the narrative…"></textarea>' +
                '<div id="vcMedia" hidden><input id="vcUrl" placeholder="https://… media URL (or use the Flow composer to upload)" /></div>' +
                '<div class="vibe-actions">' +
                  '<button class="btn sm" id="vcSaveVibe" type="button">💾 Save vibe</button>' +
                  '<button class="btn gold sm" id="vcShare" type="button">Share ✦</button>' +
                  '<span class="muted" style="font-size:.72rem">text shares earn +2 tokens</span>' +
                "</div>" +
              "</div>"
            : "") +
        "</div>" +
      "</section>" +
      '<div class="section-head"><h2>Flow by ' + esc(u.name.split(" ")[0]) + "</h2>" +
        '<span class="muted" style="font-size:.78rem">' + mine.length + " posts</span></div>" +
      '<div class="post-list" id="postList">' +
        (mine.length ? mine.map((p) => FC.feed.postCardHTML(p)).join("")
          : '<p class="empty">' + (isMe ? "You haven't shared yet — open the vibe composer above ✦" : "Quiet mind, empty page.") + "</p>") +
      "</div>";

    FC.feed.bindPostEvents(view);

    if (isMe) bindOwnProfile(view, u);
    const msgBtn = qs("#msgThem", view);
    if (msgBtn) msgBtn.addEventListener("click", (e) => {
      e.preventDefault();
      FC.messages.openWith(u.id);
    });
  }

  function bindOwnProfile(view, u) {
    const input = qs("#vibeInput", view);
    const composer = qs("#vibeComposer", view);

    input.addEventListener("focus", () => { composer.hidden = false; });
    input.addEventListener("click", () => { composer.hidden = false; qs("#vcText", view).focus(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); saveVibe(view, u); } });

    qs("#vcSaveVibe", view).addEventListener("click", () => saveVibe(view, u));

    qsa("[data-vt]", view).forEach((b) => b.addEventListener("click", () => {
      vcType = b.dataset.vt;
      qsa("[data-vt]", view).forEach((x) => x.classList.toggle("on", x === b));
      qs("#vcMedia", view).hidden = vcType === "text";
    }));

    qs("#vcShare", view).addEventListener("click", () => shareThought(view, u));

    const coverBtn = qs("#editCover", view), coverFile = qs("#coverFile", view);
    if (coverBtn) coverBtn.addEventListener("click", () => coverFile.click());
    if (coverFile) coverFile.addEventListener("change", async () => {
      const f = coverFile.files[0];
      if (!f) return;
      if (f.size > 900000) { toast("That cover is too big for browser storage — try a smaller image.", "gold"); return; }
      u.cover = await fileToDataURL(f);
      FC.store.save(); render(qs("#view"), u.username); toast("Cover updated ✦");
    });

    const photoBtn = qs("#editPhoto", view), photoFile = qs("#photoFile", view);
    if (photoBtn) photoBtn.addEventListener("click", () => photoFile.click());
    if (photoFile) photoFile.addEventListener("change", async () => {
      const f = photoFile.files[0];
      if (!f) return;
      if (f.size > 500000) { toast("That photo is too big — try a smaller one.", "gold"); return; }
      u.photo = await fileToDataURL(f);
      FC.store.save(); render(qs("#view"), u.username); toast("Profile photo updated ✦");
      FC.app.refreshBadges();
    });
  }

  function saveVibe(view, u) {
    const val = qs("#vibeInput", view).value.trim();
    u.vibe = val;
    FC.store.save();
    const line = qs(".vibe-line", view);
    line.innerHTML = val ? "“" + esc(val) + "”" : "<span class='muted'>no vibe shared yet</span>";
    toast("Vibe saved ✦", "gold");
  }

  function shareThought(view, u) {
    const text = qs("#vcText", view).value.trim();
    const urlEl = qs("#vcUrl", view);
    const media = urlEl && urlEl.value.trim();
    if (!text && !media) { toast("Write something first ✍️", "gold"); return; }
    const p = {
      id: FC.ui.uid("p"), userId: u.id, type: vcType,
      text, media: media || null,
      category: vcType === "image" ? "images" : vcType === "video" ? "videos" : "thoughts",
      createdAt: Date.now(), comments: [], love: [], respect: [], live: null,
    };
    const db = FC.store.load();
    db.posts.unshift(p);
    if (vcType === "text") u.tokens += 2;
    FC.store.save();
    qs("#vcText", view).value = "";
    if (urlEl) urlEl.value = "";
    toast("Shared ✦ +" + (vcType === "text" ? "2 tokens (balance " + u.tokens + ")" : "posted"), "gold");
    FC.app.refreshBadges();
    render(view, u.username);
    FC.feed.demoReactTo(p);
  }

  FC.profile = { render, stats };
})();

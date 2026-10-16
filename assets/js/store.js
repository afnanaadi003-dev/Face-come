/* ═══ Facecome — store: localStorage data layer + seed content (no database) ═══ */
window.FC = window.FC || {};
(function () {
  const KEY = "facecome_db_v1";
  const SESSION = "facecome_session_v1";
  const { uid, coverArt, photoArt, postArt } = FC.ui;

  let DB = null;

  /* ── seed content ── */
  function seed() {
    const now = Date.now(), H = 3600000, D = 86400000;
    const U = (id, name, username, color, emoji, vibe, tokens) => ({
      id, name, username, color, emoji, email: username + "@facecome.local",
      passHash: null, demo: true, role: "user", banned: false,
      cover: coverArt(name, id), photo: photoArt(name, id),
      vibe, tokens, soulmate: null, mascots: [], createdAt: now - 30 * D,
      lastBonus: null,
    });
    const users = [
      U("u_afnana", "Afnana Raees", "afnana", "#f0c94a", "🌟", "Building worlds out of words ✨", 120),
      U("u_zara", "Zara Noor", "zara", "#7ce7d2", "🦋", "Soft chaos, strong coffee ☕", 86),
      U("u_milo", "Milo Hart", "milo", "#4a7dff", "🎧", "Playlist for every feeling", 64),
      U("u_nova", "Nova Reyes", "nova", "#f29a9e", "🌙", "Night thinker, day dreamer", 143),
      U("u_kai", "Kai Ishida", "kai", "#7ee2a8", "🎮", "One more round, always", 51),
      U("u_lina", "Lina Amari", "lina", "#d4a017", "📚", "Fiction is my second address", 99),
      U("u_theo", "Theo Blake", "theo", "#9aa3b8", "🎬", "Scenes from an ordinary life", 40),
      U("u_ivy", "Ivy Sun", "ivy", "#b48cff", "🌸", "Growing slowly, glowing surely", 110),
    ];
    const byName = (n) => users.find((u) => u.username === n).id;
    const P = (o) => Object.assign({ comments: [], love: [], respect: [], category: "thoughts", media: null, live: null }, o);
    const posts = [
      P({ id: "p_1", userId: byName("afnana"), type: "text", category: "thoughts", text: "A platform should feel like a late-night café: everyone brings their own story, nobody orders the same thing. Welcome to Facecome 🌙", createdAt: now - 2 * H,
        love: ["u_zara", "u_milo", "u_nova"], respect: ["u_lina"],
        comments: [{ id: uid("c"), userId: "u_zara", text: "This is exactly the vibe ✨", createdAt: now - 1.5 * H }] }),
      P({ id: "p_2", userId: byName("zara"), type: "image", category: "images", media: postArt("Golden hour on the rooftop — the city looked like it was blushing.", "rooftop", "image"), text: "Golden hour on the rooftop. The city was blushing.", createdAt: now - 5 * H, love: ["u_afnana", "u_ivy"], respect: ["u_nova"], comments: [{ id: uid("c"), userId: "u_theo", text: "Cinematic 🎞️", createdAt: now - 4 * H }] }),
      P({ id: "p_3", userId: byName("milo"), type: "video", category: "videos", media: "https://www.w3schools.com/html/mov_bbb.mp4", text: "Cutting a little film for tonight's session — sound ON 🎧", createdAt: now - 8 * H, love: ["u_kai"], respect: ["u_afnana", "u_ivy"], comments: [] }),
      P({ id: "p_4", userId: byName("nova"), type: "text", category: "thoughts", text: "Reminder: you are allowed to outgrow the version of you that kept everyone comfortable.", createdAt: now - 12 * H, love: ["u_afnana", "u_zara", "u_lina", "u_theo"], respect: ["u_milo", "u_ivy"],
        comments: [{ id: uid("c"), userId: "u_lina", text: "Saving this one forever.", createdAt: now - 11 * H }] }),
      P({ id: "p_5", userId: byName("kai"), type: "image", category: "images", media: postArt("New level, new skin — finished the fan-art commission 🐉", "dragon", "image"), text: "Finished the commission — the dragon finally has scales 🔥", createdAt: now - 1 * D, love: ["u_milo"], respect: ["u_nova"], comments: [] }),
      P({ id: "p_6", userId: byName("lina"), type: "text", category: "thoughts", text: "Currently reading: three books at once, finishing none. It's called a system 📚", createdAt: now - 1.2 * D, love: ["u_afnana", "u_ivy"], respect: ["u_theo"], comments: [{ id: uid("c"), userId: "u_ivy", text: "Relatable library energy 📖", createdAt: now - 1.1 * D }] }),
      P({ id: "p_7", userId: byName("theo"), type: "video", category: "videos", media: "https://www.w3schools.com/html/mov_bbb.mp4", text: "Behind the scenes of my short film 'Ordinary Sunday' 🎬", createdAt: now - 1.6 * D, love: ["u_zara"], respect: ["u_kai"], comments: [] }),
      P({ id: "p_8", userId: byName("ivy"), type: "text", category: "love", text: "Soulmate unlock day 💛 Took 25 tokens and one brave tap. Matching is real here.", createdAt: now - 2 * D, love: ["u_afnana", "u_nova", "u_lina"], respect: ["u_zara"], comments: [] }),
      P({ id: "p_9", userId: byName("zara"), type: "text", category: "thoughts", text: "Late-night thought: yellow is just blue that decided to be happy.", createdAt: now - 2.4 * D, love: ["u_milo"], respect: ["u_afnana"], comments: [] }),
      P({ id: "p_10", userId: byName("kai"), type: "text", category: "live", text: "Going LIVE in the Gaming Hub tonight — aura tap tournament, winners take tokens 🪙", createdAt: now - 3 * D,
        live: { active: false, theme: "Neon Arcade", title: "Aura Tap Tournament", viewers: 0, chat: [], broadcasterId: "u_kai" },
        love: ["u_theo"], respect: ["u_milo"], comments: [] }),
    ];
    const books = [
      { id: "b1", title: "The Midnight Library of Words", author: "E. Marlowe", cover: coverArt("Midnight Library", "b1"), bio: "A quiet novel about a library that opens only to people who lost something.", rating: 4.7 },
      { id: "b2", title: "Golden Hour Protocol", author: "R. Okafor", cover: coverArt("Golden Hour", "b2"), bio: "Two strangers, one rooftop, and a city-wide blackout that changes everything.", rating: 4.5 },
      { id: "b3", title: "Blue Abyss Diaries", author: "S. Tanaka", cover: coverArt("Blue Abyss", "b3"), bio: "Deep-sea field notes written as letters to a surface nobody believes in.", rating: 4.8 },
      { id: "b4", title: "The Respect Economy", author: "A. Diallo", cover: coverArt("Respect Economy", "b4"), bio: "How attention became currency — a narrative non-fiction dive.", rating: 4.4 },
      { id: "b5", title: "Horse, Cat, Dog", author: "P. Lindqvist", cover: coverArt("Horse Cat Dog", "b5"), bio: "Fairy tale for adults about three mascots who grant very specific wishes.", rating: 4.6 },
      { id: "b6", title: "Notes from the Vibe Layer", author: "M. Costa", cover: coverArt("Vibe Layer", "b6"), bio: "Essays on why some rooms feel like home within ten seconds.", rating: 4.3 },
    ];
    const movies = [
      { id: "m1", title: "The Respect Frequency", genre: "Drama", cover: coverArt("Respect Frequency", "m1"), bio: "A radio host discovers her late father left her a frequency, not a station." },
      { id: "m2", title: "Yellow & Blue", genre: "Romance", cover: coverArt("Yellow and Blue", "m2"), bio: "Painters on opposite sides of a wall fall in love through colour." },
      { id: "m3", title: "Token", genre: "Thriller", cover: coverArt("Token", "m3"), bio: "A city runs on tokens — until someone finds a way to print them." },
      { id: "m4", title: "Live from Nowhere", genre: "Docu", cover: coverArt("Live Nowhere", "m4"), bio: "Inside the culture of streaming from places without addresses." },
    ];
    const products = [
      { id: "pr1", name: "Facecome Gold Mug", price: 18, stock: 40, desc: "Yellow narrative glaze, holds 350ml of late-night thoughts.", image: postArt("Gold Mug", "pr1", "image"), page: "delivery" },
      { id: "pr2", name: "Vibe Notebook", price: 9, stock: 120, desc: "Blue-black cover, 120 pages for vibes and schedules.", image: postArt("Vibe Notebook", "pr2", "image"), page: "delivery" },
      { id: "pr3", name: "Soulmate Token (metal)", price: 25, stock: 60, desc: "Engraved token, the real-world version of the unlock fee.", image: postArt("Soulmate Token", "pr3", "image"), page: "delivery" },
      { id: "pr4", name: "Mascot Plush — Horse", price: 32, stock: 15, desc: "The prize mascot. Pronoun: gal. Very huggable.", image: postArt("Horse Mascot", "pr4", "image"), page: "delivery" },
      { id: "pr5", name: "Mascot Plush — Cat", price: 30, stock: 22, desc: "The prize mascot. Pronoun: kits. Judges you silently.", image: postArt("Cat Mascot", "pr5", "image"), page: "delivery" },
      { id: "pr6", name: "Mascot Plush — Dog", price: 30, stock: 18, desc: "The prize mascot. Pronoun: pup. Loves everyone immediately.", image: postArt("Dog Mascot", "pr6", "image"), page: "delivery" },
      { id: "pr7", name: "Aurora Tote Bag", price: 14, stock: 80, desc: "Aurora print, carries books, groceries and secrets.", image: postArt("Aurora Tote", "pr7", "image"), page: "delivery" },
      { id: "pr8", name: "Live Studio Ring Light", price: 45, stock: 12, desc: "For lively broadcasting with unique themes.", image: postArt("Ring Light", "pr8", "image"), page: "delivery" },
    ];
    const games = [
      { id: "g1", name: "Aura Tap", desc: "15 seconds. Tap the aura orb. Earn tokens by your reflexes.", icon: "✨", tokensPerTap: 1 },
      { id: "g2", name: "Token Wheel", desc: "Spin the wheel — prizes include tokens and mascots.", icon: "🎡", cost: 5 },
      { id: "g3", name: "Respect Runner", desc: "Endless runner arcade — reach 100m for a 10 token prize.", icon: "🏃", goal: 100 },
    ];
    const pages = {
      gaming: { slug: "gaming", name: "Gaming Hub", icon: "🎮", cover: coverArt("Gaming Hub", "gaming"),
        bio: "Arcade of the brave: tap, spin, run. Every game pays out in Facecome tokens — the same tokens that unlock your soulmate.",
        schedule: [ { when: "Mon & Wed · 20:00", what: "Aura Tap tournament" }, { when: "Fri · 21:30", what: "Token Wheel jackpot hour" }, { when: "Sun · 18:00", what: "Respect Runner leaderboard" } ] },
      delivery: { slug: "delivery", name: "Delivery", icon: "🛵", cover: coverArt("Delivery", "delivery"),
        bio: "Facecome's own business — product-based, page-based, one tap. Order merch, mascot plushies and studio gear; checkout is stored right in your browser.",
        schedule: [ { when: "Every day", what: "Orders placed before 16:00 ship same day" }, { when: "Tue & Sat", what: "Restock day — new products appear" }, { when: "First of month", what: "Token holders get free delivery" } ] },
      library: { slug: "library", name: "Book Library", icon: "📚", cover: coverArt("Book Library", "library"),
        bio: "Facecome suggested books live here. Borrow, review, return — narrated in yellow and blue. Your reading schedule is part of your profile story.",
        schedule: [ { when: "Wed · 19:00", what: "Silent reading hour (live)" }, { when: "Sat · 17:00", what: "Author AMA — 'Golden Hour Protocol'" }, { when: "Monthly", what: "Borrow limit resets to 3 books" } ] },
      love: { slug: "love", name: "Love Zone", icon: "💛", cover: coverArt("Love Zone", "love"),
        bio: "Unlock your soulmate with tokens, match by vibe, then talk — text, topic video chats, and suggested books, movies & products to share.",
        schedule: [ { when: "Fri · 21:00", what: "Match Night — double match odds" }, { when: "Sun · 20:00", what: "Topic video rooms open" }, { when: "Daily", what: "Soulmate unlock costs 25 tokens" } ] },
    };
    const suggestions = {
      books: ["b1", "b2", "b5"],
      movies: ["m2", "m3"],
      products: ["pr3", "pr7"],
    };
    const threads = [
      { id: "th_seed1", participants: ["u_afnana", "u_zara"], soulmate: true, messages: [
        { id: uid("m"), from: "u_zara", text: "So… we matched. Hi you 👋", at: now - 20 * H },
        { id: uid("m"), from: "u_afnana", text: "Hi! The vibe layer never lies ✨", at: now - 19 * H },
        { id: uid("m"), from: "u_zara", text: "Have you read 'The Midnight Library of Words'? Facecome keeps suggesting it 😄", at: now - 18 * H },
      ] },
    ];
    return {
      version: 1,
      site: {
        name: "Facecome",
        tagline: "A new social platform — thoughts, vibes, live energy & soulmates.",
        announcement: "✨ Welcome to Facecome beta — open the Magic Box daily for tokens & mascots!",
        accent: "gold",
      },
      users, posts, threads, notifications: [],
      products, books, movies, games, pages, suggestions,
      orders: [], carts: {}, borrows: {}, reviews: {}, adminAuth: null,
      createdAt: now,
    };
  }

  function load() {
    if (DB) return DB;
    try {
      const raw = localStorage.getItem(KEY);
      DB = raw ? JSON.parse(raw) : null;
    } catch (e) { DB = null; }
    if (!DB || DB.version !== 1 || !Array.isArray(DB.users)) {
      DB = seed();
      save();
    }
    return DB;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(DB));
      return true;
    } catch (e) {
      FC.ui.toast("⚠ Browser storage is full — use image/video URLs instead of big files.", "gold");
      console.warn("Facecome save failed:", e);
      return false;
    }
  }

  function reset() {
    localStorage.removeItem(KEY);
    DB = null;
    load();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "facecome-export-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.users) || !Array.isArray(data.posts)) throw new Error("Not a Facecome export file.");
    DB = data;
    save();
  }

  /* ── session ── */
  const session = {
    get: () => { try { return localStorage.getItem(SESSION); } catch (e) { return null; } },
    set: (id) => localStorage.setItem(SESSION, id),
    clear: () => localStorage.removeItem(SESSION),
  };

  /* ── entity helpers ── */
  const userById = (id) => DB.users.find((u) => u.id === id) || null;
  const userByName = (n) => DB.users.find((u) => u.username.toLowerCase() === String(n || "").toLowerCase()) || null;
  const postById = (id) => DB.posts.find((p) => p.id === id) || null;
  const threadWith = (a, b) => DB.threads.find((t) => t.participants.includes(a) && t.participants.includes(b)) || null;

  function notify(userId, text, icon) {
    DB.notifications.unshift({ id: uid("n"), userId, text, icon: icon || "🔔", at: Date.now(), read: false });
    DB.notifications = DB.notifications.slice(0, 120);
  }

  function unreadCount(userId) {
    return DB.notifications.filter((n) => n.userId === userId && !n.read).length;
  }

  const MASCOTS = [
    { type: "horse", icon: "🐎", name: "Horse", pronoun: "gal", tokens: 12, line: "galloped straight out of the box" },
    { type: "cat", icon: "🐈", name: "Cat", pronoun: "kits", tokens: 9, line: "landed silently, judging, still generous" },
    { type: "dog", icon: "🐕", name: "Dog", pronoun: "pup", tokens: 7, line: "rushed in tail-first, already your friend" },
  ];

  FC.store = {
    load, save, reset, exportJSON, importJSON,
    get db() { return DB; },
    session,
    userById, userByName, postById, threadWith,
    notify, unreadCount,
    mascots: MASCOTS,
    KEY,
  };
})();

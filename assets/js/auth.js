/* ═══ Facecome — auth: register / login / logout (salted SHA-256, localStorage only) ═══ */
window.FC = window.FC || {};
(function () {
  const S = () => FC.store.load();

  async function sha(str) {
    try {
      if (window.crypto && crypto.subtle && crypto.subtle.digest) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    } catch (e) { /* insecure context — fall through */ }
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return "fnv-" + (h >>> 0).toString(16) + "-" + str.length;
  }

  function rndSalt() {
    const a = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /* seed demo users get a shared demo password on first boot */
  async function init() {
    const db = S();
    let changed = false;
    for (const u of db.users) {
      if (u.demo && !u.passHash) {
        u.salt = u.salt || "demofacecome";
        u.passHash = await sha(u.salt + ":demo123");
        changed = true;
      }
    }
    if (changed) FC.store.save();
  }

  function me() {
    const db = S();
    const id = FC.store.session.get();
    if (!id) return null;
    const u = FC.store.userById(id);
    return u && !u.banned ? u : null;
  }

  async function register({ name, username, email, password, confirm }) {
    const db = S();
    name = String(name || "").trim();
    username = String(username || "").trim().toLowerCase();
    email = String(email || "").trim();
    if (name.length < 2) return "Please enter your full name.";
    if (!/^[a-z0-9_]{3,18}$/.test(username)) return "Username: 3–18 chars, letters/numbers/underscore.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That email doesn't look right.";
    if (String(password || "").length < 6) return "Password needs at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    if (FC.store.userByName(username)) return "That username is already taken.";
    const salt = rndSalt();
    const hue = FC.ui.hueOf(username);
    const u = {
      id: FC.ui.uid("u"), name, username, email,
      color: "hsl(" + hue + ",70%,55%)",
      emoji: ["🌟", "🦋", "🌙", "🎧", "🌸", "🔥", "🐟", "🪐"][db.users.length % 8],
      salt, passHash: await sha(salt + ":" + password),
      demo: false, role: "user", banned: false,
      cover: FC.ui.coverArt(name, username),
      photo: FC.ui.photoArt(name, username),
      vibe: "", tokens: 30, soulmate: null, mascots: [],
      createdAt: Date.now(), lastBonus: null,
    };
    db.users.push(u);
    FC.store.notify(u.id, "🌟 Welcome to Facecome, " + name.split(" ")[0] + "! You got 30 tokens — try the Magic Box.", "🌟");
    FC.store.save();
    FC.store.session.set(u.id);
    return null;
  }

  async function login(username, password) {
    const db = S();
    const u = FC.store.userByName(String(username || "").trim());
    if (!u) return "No account with that username.";
    if (u.banned) return "This account has been suspended by the admin.";
    const hash = await sha((u.salt || "") + ":" + password);
    if (!u.passHash || hash !== u.passHash) return "Wrong username or password.";
    FC.store.session.set(u.id);
    return null;
  }

  async function loginDemo(username) {
    const db = S();
    const u = FC.store.userByName(username);
    if (!u) return "Demo account missing.";
    if (u.demo && !u.passHash) { u.salt = u.salt || "demofacecome"; u.passHash = await sha(u.salt + ":demo123"); FC.store.save(); }
    FC.store.session.set(u.id);
    return null;
  }

  function logout() { FC.store.session.clear(); }

  FC.auth = { sha, init, me, register, login, loginDemo, logout };
})();

# Facecome — Full Build Plan

A new social media platform (not a Facebook copy). Static, no build step, no external database — deploys to GitHub Pages as-is.

## Constraints & Decisions

| Topic | Decision |
|---|---|
| Tech | Vanilla HTML/CSS/JS, ES modules, no npm/build |
| Hosting | GitHub Pages (hash routing for SPA, `/admin/` folder route) |
| Data | `localStorage` only (users, posts, comments, messages, tokens, orders) |
| Accounts | Per-browser; admin can export/import JSON to move data |
| Media | Images/videos stored as data-URLs (warn on ~5MB localStorage cap; videos can also be added by URL) |
| Live video / video chat | `getUserMedia` local camera demo mode + simulated remote participants (no server signaling) |
| Theme reference | 100-Don beauty theme (aurora blobs, starfield, Playfair Display, gold gradients) |

## Theme

- Colors: black `#070b18`, gold/yellow `#f0c94a` + `#d4a017`, blue `#3b2f7a` / `#4a7dff`, narrative cream text `#f2ead8`, teal accent `#7ce7d2`, muted `#9aa3b8`.
- Fonts: Playfair Display (headings/narrative), Inter (UI) via Google Fonts.
- Glassy cards, glow borders, animated aurora backdrop, starfield, gold gradient buttons.
- Login/register page gets the full decorative treatment.

## File Structure

```
plan.md
index.html                  — user SPA shell (login, register, app layout)
admin/index.html            — admin panel (route .../admin)
assets/css/theme.css        — design tokens, backdrop, buttons, forms
assets/css/app.css          — sidebar, feed, profile, pages, messages, magic, live
assets/css/admin.css        — admin styles
assets/js/store.js          — localStorage data layer + seed data (demo users, pages, products, suggestions)
assets/js/auth.js           — register/login/logout, SHA-256 hashed passwords
assets/js/router.js         — hash router (#/feed, #/profile/:id, ...)
assets/js/ui.js             — toast, modal, helpers (esc, art generators)
assets/js/app.js            — shell: sidebar, topbar, notification glow, boot
assets/js/feed.js           — flow, composer (text/image/video), categories, comments, love & respect, join live
assets/js/profile.js        — cover, photo, name, vibe input → thought composer, user feed
assets/js/pages.js          — Gaming Hub, Delivery (products/cart/orders), Book Library, Love Zone
assets/js/magic.js          — magic box search → open → prize (token, 🐎 🐈 🐕 with unique pronouns)
assets/js/messages.js       — soulmate unlock/match (token cost), chat, suggestions, video-chat demo
assets/js/live.js           — live studio themes, camera preview, broadcast, viewers, join live
assets/js/notify.js         — notifications with glow count (1, 2, 3 …)
assets/js/admin.js          — admin auth, manage users/posts/pages/products, site settings, export/import/reset
```

## Feature Map

### 1. Shell & navigation (left sidebar)
- **Me** (profile image) → own profile
- **Flow** (feed) — main timeline
- **Message** (tune/bell icon) → messages
- **Notification** — glowing badge count 1, 2, 3 …
- Plus: Magic Box (search), Pages, Live, Logout in nav.

### 2. Auth
- Register (name, username, email, password, avatar color) + login/logout.
- Passwords SHA-256 hashed with salt (WebCrypto, fallback FNV).
- Seeded demo users + seeded posts so the feed feels alive on first run.

### 3. Feed (Flow)
- Post types: **text / image / video** (tabs in composer).
- Category filter chips below feed (All, Thoughts, Images, Videos, Live).
- Actions per post: **comment**, **love ❤**, **respect 🙏**, **join in live** (if broadcaster live).
- Comments expand inline; counts update; all persisted.

### 4. Profile
- Click a post's user name → profile route.
- Landscape **cover image**, **profile photo**, profile name, their vibe text.
- **"Sharing vibe" input** → opens share-thoughts composer (posts to feed).
- User's own feed listed below; cover/photo editable (upload or auto-generated art).

### 5. Pages (each: cover photo, bio/thoughts, schedule)
- **Gaming Hub** — game list, play token-awarding mini game (click/reaction game).
- **Delivery** — product-based business: product catalog, cart, place order (stored), order history.
- **Book Library** — book cards, borrow/read, reviews.
- **Love Zone** — vibe posts, couple cards, soulmate entry point.
- Schedule table shown on every page (upcoming slots).
- Admin can edit page cover/bio/schedule/products.

### 6. Magic Box
- Search bar ("find it & open it") searches users, posts, pages, products, books.
- Opening the magic box grants a prize: **token 🪙**, or mascot prizes **🐎 horse / 🐈 cat / 🐕 dog** each with a unique pronoun (e.g. horse → "gal", cat → "kits", dog → "paw") and a token value.
- Tokens balance shown in sidebar; used for soulmate unlock & gaming.

### 7. Messages
- **Unlock soulmate** option: costs tokens → matching (picks/quiz → match found) → text messaging unlocked.
- Chat threads stored locally, read/unread states.
- **Suggested** rail: Facecome-suggested books, movies, products.
- **Video chat**: topic-based rooms (boys/girls talking by topic), local camera + simulated partner tile, in-room text chat.

### 8. Live broadcasting
- "Go live" studio: pick a **unique theme** (name + color/gradient), camera preview via `getUserMedia`, title, start/stop.
- Live posts appear in feed with LIVE badge; others click **join in live** → viewer room (camera optional, chat, reactions).
- Simulated viewer count + chat ticker.

### 9. Admin (`/admin/`)
- Beautiful themed login (same beauty theme), default `admin / admin123`, changeable, lockout after 5 tries.
- Sections: Dashboard (stats), Users (view/edit/ban/delete), Posts (edit/delete), Pages (cover, bio, schedule), Products (Delivery CRUD), Suggestions (books/movies/products), Site settings (site name, announcement banner, colors), Data (export JSON / import / reset).
- Everything persists in `localStorage` — no database.

## Build Order

1. `plan.md` (this file)
2. `theme.css` + `index.html` shell + `router.js` + `ui.js`
3. `store.js` (data layer + seeds) + `auth.js` → login/register screens
4. `app.js` sidebar/topbar + `notify.js` glow
5. `feed.js` (composer, categories, comments, love/respect, join live)
6. `profile.js` (cover/photo/vibe → thoughts)
7. `pages.js` (Gaming, Delivery, Library, Love Zone + schedule)
8. `magic.js` (search + prizes)
9. `messages.js` (soulmate, chat, suggestions, video chat)
10. `live.js` (studio + viewer)
11. `admin/index.html` + `admin.css` + `admin.js`
12. Verify: serve locally, walk every flow, check console for errors, fix.

## Verification

- Serve with `python -m http.server` (or equivalent) from project root.
- Walk: register → feed → post (3 types) → comment/react → profile → vibe → pages (incl. delivery order) → magic box prize → soulmate unlock → chat → video chat → live → notifications → admin login → manage/export.
- Check browser console has no errors; check `plan.md` tasks checked off.

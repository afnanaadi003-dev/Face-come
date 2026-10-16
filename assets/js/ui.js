/* ═══ Facecome — ui helpers (no build, classic script) ═══ */
window.FC = window.FC || {};
(function () {
  const esc = (s) =>
    (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const uid = (p) => (p || "id") + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    const d = Math.floor(s / 86400);
    if (d < 30) return d + "d ago";
    return new Date(ts).toLocaleDateString();
  }

  let toastTimer;
  function toast(msg, kind) {
    let el = document.getElementById("fcToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "fcToast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = "toast show" + (kind === "gold" ? " gold" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  /* ── generated art (data-URI SVG) ── */
  function hueOf(id) {
    let h = 0;
    for (const c of String(id || "x")) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }
  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }
  const svgURI = (svg) => "data:image/svg+xml," + encodeURIComponent(svg);

  function coverArt(name, seed) {
    const h = hueOf(seed || name);
    const ini = initials(name);
    return svgURI(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 300'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='hsl(" + h + ",60%,26%)'/>" +
      "<stop offset='.55' stop-color='hsl(" + ((h + 40) % 360) + ",55%,15%)'/>" +
      "<stop offset='1' stop-color='hsl(" + ((h + 300) % 360) + ",60%,10%)'/></linearGradient>" +
      "<radialGradient id='r' cx='.15' cy='0' r='1.1'>" +
      "<stop offset='0' stop-color='hsla(" + ((h + 45) % 360) + ",90%,62%,.5)'/>" +
      "<stop offset='.6' stop-color='transparent'/></radialGradient></defs>" +
      "<rect width='900' height='300' fill='url(#g)'/><rect width='900' height='300' fill='url(#r)'/>" +
      "<text x='860' y='255' font-family='Georgia,serif' font-size='240' font-weight='700' text-anchor='end' fill='hsla(" + ((h + 20) % 360) + ",90%,75%,.14)'>" + ini + "</text>" +
      "<text x='44' y='175' font-family='Georgia,serif' font-size='56' font-weight='700' fill='#f6eedb'>" + esc(name) + "</text>" +
      "<rect x='44' y='196' width='120' height='4' rx='2' fill='hsl(" + ((h + 45) % 360) + ",85%,60%)'/></svg>"
    );
  }

  function photoArt(name, seed) {
    const h = hueOf(seed || name);
    const ini = initials(name);
    return svgURI(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'>" +
      "<defs><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='hsl(" + ((h + 45) % 360) + ",70%,38%)'/>" +
      "<stop offset='1' stop-color='hsl(" + ((h + 310) % 360) + ",60%,16%)'/></linearGradient></defs>" +
      "<rect width='240' height='240' fill='url(#p)'/>" +
      "<circle cx='120' cy='92' r='48' fill='hsla(" + ((h + 20) % 360) + ",90%,80%,.28)'/>" +
      "<text x='120' y='185' text-anchor='middle' font-family='Georgia,serif' font-size='80' font-weight='700' fill='#fff8e8'>" + ini + "</text></svg>"
    );
  }

  function postArt(text, seed, kind) {
    const h = hueOf(seed || text);
    const words = String(text || "Facecome").slice(0, 90);
    const lines = [];
    for (let i = 0; i < words.length; i += 30) lines.push(words.slice(i, i + 30));
    const tspans = lines
      .slice(0, 4)
      .map((l, i) => "<tspan x='50' dy=\"" + (i === 0 ? 0 : 44) + "'>" + esc(l) + "</tspan>")
      .join("");
    return svgURI(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 700 420'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='hsl(" + h + ",65%,30%)'/>" +
      "<stop offset='1' stop-color='hsl(" + ((h + 220) % 360) + ",60%,14%)'/></linearGradient></defs>" +
      "<rect width='700' height='420' fill='url(#g)'/>" +
      "<text x='46' y='120' font-family='Georgia,serif' font-size='90' fill='rgba(255,255,255,.18)'>“</text>" +
      "<text x='50' y='180' font-family='Georgia,serif' font-size='34' font-style='italic' fill='#fdf4dd'>" + tspans + "</text>" +
      "<text x='50' y='385' font-family='Arial' font-size='17' letter-spacing='5' fill='hsl(" + ((h + 45) % 360) + ",85%,70%)'>" +
      (kind === "video" ? "FACECOME · MOTION" : "FACECOME · FRAME") + "</text></svg>"
    );
  }

  function fileToDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let modalBound = false;
  function openModal(html, cls) {
    const wrap = qs("#modalWrap"), box = qs("#modalBox"), ov = qs("#overlay");
    if (!wrap || !box) { toast(html.replace(/<[^>]+>/g, ""), "gold"); return; }
    box.className = "modal-box" + (cls ? " " + cls : "");
    box.innerHTML = '<button class="modal-close" aria-label="Close">✕</button>' + html;
    wrap.classList.add("open");
    if (ov) ov.classList.add("show");
    if (!modalBound) {
      modalBound = true;
      document.addEventListener("click", (e) => {
        if (e.target.closest(".modal-close") || (e.target.id === "overlay")) closeModal();
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    }
    const first = qs("input, textarea, select", box);
    if (first) setTimeout(() => first.focus(), 60);
  }
  function closeModal() {
    const wrap = qs("#modalWrap"), ov = qs("#overlay");
    if (wrap) wrap.classList.remove("open");
    if (ov) ov.classList.remove("show");
    stopCam();
  }

  let camStream = null;
  function startCam(videoEl) {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((s) => {
          camStream = s;
          if (videoEl) { videoEl.srcObject = s; videoEl.play().catch(() => {}); }
          return s;
        })
        .catch(() => { toast("Camera unavailable — using the Facecome avatar instead.", "gold"); return null; })
      : Promise.resolve(null);
  }
  function stopCam() {
    if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; }
    qsa("video[data-cam]").forEach((v) => { try { v.srcObject = null; } catch (e) {} });
  }

  FC.ui = {
    esc, uid, timeAgo, toast, hueOf, initials, svgURI,
    coverArt, photoArt, postArt, fileToDataURL, qs, qsa,
    openModal, closeModal, startCam, stopCam,
  };
})();

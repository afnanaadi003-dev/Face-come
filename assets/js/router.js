/* ═══ Facecome — hash router ═══ */
window.FC = window.FC || {};
(function () {
  const routes = [];
  function route(pattern, handler) {
    const keys = [];
    const rx = new RegExp(
      "^" + pattern.replace(/:[a-zA-Z]+/g, (m) => { keys.push(m.slice(1)); return "([^/]+)"; }) + "$"
    );
    routes.push({ rx, keys, handler });
  }

  function current() {
    const raw = location.hash.replace(/^#\/?/, "");
    return raw.split("?")[0] || "";
  }

  function navigate(path) {
    location.hash = "#/" + String(path || "").replace(/^\/?/, "");
  }

  function resolve() {
    const path = current();
    for (const r of routes) {
      const m = path.match(r.rx);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
        r.handler(params);
        return true;
      }
    }
    if (routes.length) { routes[0].handler({}); return true; }
    return false;
  }

  function start() {
    window.addEventListener("hashchange", resolve);
    resolve();
  }

  FC.router = { route, start, resolve, navigate, current };
})();

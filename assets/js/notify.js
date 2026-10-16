/* ═══ Facecome — notifications with glow count ═══ */
window.FC = window.FC || {};
(function () {
  function list(userId) {
    FC.store.load();
    return FC.store.db.notifications.filter((n) => n.userId === userId);
  }
  function unread(userId) {
    FC.store.load();
    return FC.store.unreadCount(userId);
  }
  function markAllRead(userId) {
    const db = FC.store.load();
    db.notifications.forEach((n) => { if (n.userId === userId) n.read = true; });
    FC.store.save();
  }
  function push(userId, text, icon) {
    const db = FC.store.load();
    FC.store.notify(userId, text, icon);
    FC.store.save();
    if (FC.app && FC.app.refreshBadges) FC.app.refreshBadges();
  }

  FC.notify = { list, unread, markAllRead, push };
})();

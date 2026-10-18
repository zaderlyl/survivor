"use strict";

/* ---------- Entrées ---------- */
const KEYMAP = { KeyW: "u", KeyZ: "u", ArrowUp: "u", KeyS: "d", ArrowDown: "d", KeyA: "l", KeyQ: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r" };
// au niveau supérieur, les touches de déplacement parcourent les cartes ; Entrée ou Espace valide
const UP = { KeyW: 1, KeyZ: 1, ArrowUp: 1, KeyA: 1, KeyQ: 1, ArrowLeft: 1 };
const DOWN = { KeyS: 1, ArrowDown: 1, KeyD: 1, ArrowRight: 1 };
const moveCard = (e) => {
  const cards = [...pBody.querySelectorAll(".card")];
  if (!cards.length) return false;
  const dir = UP[e.code] ? -1 : DOWN[e.code] ? 1 : 0;
  if (!dir) return false;
  e.preventDefault();
  const i = cards.indexOf(document.activeElement);
  cards[(i < 0 ? (dir > 0 ? 0 : cards.length - 1) : (i + dir + cards.length) % cards.length)].focus();
  return true;
};
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (mode === "levelup" && (UP[e.code] || DOWN[e.code])) {
    if (!e.repeat) moveCard(e); else e.preventDefault();
    return;
  }
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; if (mode === "play") e.preventDefault(); }
  if (e.code === "Space" && mode === "play") { e.preventDefault(); dash(); }
  if (e.code === "KeyP" || e.code === "Escape") {
    if (mode === "play") showPause();
    else if (mode === "pause") resume();
  }
  if (mode === "levelup" && /^[1-3]$/.test(e.key) && pBody._picks && pBody._picks[+e.key - 1]) choose(pBody._picks[+e.key - 1]);
});
window.addEventListener("keyup", (e) => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
window.addEventListener("blur", () => { Object.keys(keys).forEach((k) => (keys[k] = false)); if (mode === "play") showPause(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && mode === "play") showPause(); });

// le joystick : il apparaît là où le doigt (ou la souris) se pose
cv.addEventListener("pointerdown", (e) => {
  if (mode !== "play" || joy) return;
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* identifiant inconnu */ }
  const r = cv.getBoundingClientRect();
  joy = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, x: e.clientX - r.left, y: e.clientY - r.top };
});
cv.addEventListener("pointermove", (e) => {
  if (!joy || e.pointerId !== joy.id) return;
  const r = cv.getBoundingClientRect();
  joy.x = e.clientX - r.left;
  joy.y = e.clientY - r.top;
});
const joyEnd = (e) => { if (joy && e.pointerId === joy.id) joy = null; };
cv.addEventListener("pointerup", joyEnd);
cv.addEventListener("pointercancel", joyEnd);

const input = () => {
  let x = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), y = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  if (joy) {
    const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy);
    if (d > 6) { x = dx / Math.max(d, 56); y = dy / Math.max(d, 56); }
  }
  const m = Math.hypot(x, y);
  return m > 1 ? [x / m, y / m] : [x, y];
};

// la glissade : brève, rapide, protégée
const dash = () => {
  if (mode !== "play" || P.dashCd > 0) return;
  const [ix, iy] = input();
  const m = Math.hypot(ix, iy);
  if (m > 0.1) { P.dx = ix / m; P.dy = iy / m; }
  P.dash = DASH_TIME;
  P.dashCd = DASH_CD * st.dashMul;
  P.dashMax = P.dashCd;
  // la glissade écarte les ennemis proches : on peut sortir d'un coin
  enemies.forEach((e) => {
    const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1;
    if (d < 90 && e.type !== "boss") { e.kx += (dx / d) * 380; e.ky += (dy / d) * 380; }
  });
  P.inv = Math.max(P.inv, DASH_TIME + 0.12);
  P.weapons.forEach((w) => { const od = WEAPONS[w.id].onDash; if (od) od(w); }); // les lames cachées jaillissent
  SFX.dash();
};


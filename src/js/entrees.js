"use strict";

/* ---------- Les entrées : clavier, souris, doigt ---------- */

// quelle touche fait aller où : u = haut, d = bas, l = gauche, r = droite (clavier azerty ET qwerty, et les flèches)
const KEYMAP = {
  KeyW: "u", KeyZ: "u", ArrowUp: "u",
  KeyS: "d", ArrowDown: "d",
  KeyA: "l", KeyQ: "l", ArrowLeft: "l",
  KeyD: "r", ArrowRight: "r",
};

// Pendant le choix d'une carte, les touches de déplacement parcourent les cartes ; Entrée ou Espace valide.
const UP = { KeyW: 1, KeyZ: 1, ArrowUp: 1, KeyA: 1, KeyQ: 1, ArrowLeft: 1 };
const DOWN = { KeyS: 1, ArrowDown: 1, KeyD: 1, ArrowRight: 1 };

// déplace le focus sur la carte précédente ou suivante ; renvoie true si la touche a été utilisée
const moveCard = (evenement) => {
  const cartes = [...pBody.querySelectorAll(".card")];
  if (!cartes.length) return false;
  const direction = UP[evenement.code] ? -1 : DOWN[evenement.code] ? 1 : 0;
  if (!direction) return false;
  evenement.preventDefault();
  const courante = cartes.indexOf(document.activeElement);
  // aucune carte active : on part de la première (vers le bas) ou de la dernière (vers le haut)
  const suivante = courante < 0 ? (direction > 0 ? 0 : cartes.length - 1) : (courante + direction + cartes.length) % cartes.length;
  cartes[suivante].focus();
  return true;
};

/* ---------- Le clavier ---------- */
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return; // on laisse les raccourcis du navigateur tranquilles

  // choix de carte : les flèches parcourent les cartes
  if (mode === "levelup" && (UP[e.code] || DOWN[e.code])) {
    if (!e.repeat) moveCard(e);
    else e.preventDefault();
    return;
  }
  // déplacement
  if (KEYMAP[e.code]) {
    keys[KEYMAP[e.code]] = true;
    if (mode === "play") e.preventDefault();
  }
  // dash
  if (e.code === "Space" && mode === "play") {
    e.preventDefault();
    dash();
  }
  // pause
  if (e.code === "KeyP" || e.code === "Escape") {
    if (mode === "play") showPause();
    else if (mode === "pause") resume();
  }
  // choix d'une carte avec 1, 2 ou 3
  if (mode === "levelup" && /^[1-3]$/.test(e.key) && pBody._picks && pBody._picks[+e.key - 1]) {
    choose(pBody._picks[+e.key - 1]);
  }
});
window.addEventListener("keyup", (e) => {
  if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false;
});
// si la fenêtre perd le focus, on lâche toutes les touches et on met en pause
window.addEventListener("blur", () => {
  Object.keys(keys).forEach((k) => (keys[k] = false));
  if (mode === "play") showPause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && mode === "play") showPause();
});

/* ---------- Le joystick tactile ---------- */
// il apparaît là où le doigt (ou la souris) se pose. joy = { id, ox, oy (départ), x, y (position actuelle) }
cv.addEventListener("pointerdown", (e) => {
  if (mode !== "play" || joy) return;
  try {
    cv.setPointerCapture(e.pointerId);
  } catch (err) {
    /* identifiant inconnu */
  }
  const r = cv.getBoundingClientRect();
  joy = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, x: e.clientX - r.left, y: e.clientY - r.top };
});
cv.addEventListener("pointermove", (e) => {
  if (!joy || e.pointerId !== joy.id) return;
  const r = cv.getBoundingClientRect();
  joy.x = e.clientX - r.left;
  joy.y = e.clientY - r.top;
});
const joyEnd = (e) => {
  if (joy && e.pointerId === joy.id) joy = null;
};
cv.addEventListener("pointerup", joyEnd);
cv.addEventListener("pointercancel", joyEnd);

/* ---------- La direction voulue ---------- */
// renvoie [x, y] : la direction du déplacement, de longueur 1 au maximum (clavier ou joystick)
const input = () => {
  let x = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  let y = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
  if (joy) {
    const dx = joy.x - joy.ox;
    const dy = joy.y - joy.oy;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      x = dx / Math.max(d, 56);
      y = dy / Math.max(d, 56);
    }
  }
  const longueur = Math.hypot(x, y);
  return longueur > 1 ? [x / longueur, y / longueur] : [x, y];
};

/* ---------- Le dash ---------- */
// la glissade : brève, rapide, protégée
const dash = () => {
  if (mode !== "play" || P.dashCd > 0) return;
  const [ix, iy] = input();
  const longueur = Math.hypot(ix, iy);
  if (longueur > 0.1) {
    P.dx = ix / longueur;
    P.dy = iy / longueur;
  }
  P.dash = DASH_TIME;
  P.dashCd = DASH_CD * st.dashMul;
  P.dashMax = P.dashCd;
  // la glissade écarte les ennemis proches : on peut sortir d'un coin
  enemies.forEach((e) => {
    const dx = e.x - P.x;
    const dy = e.y - P.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 90 && e.type !== "boss") {
      e.kx += (dx / d) * 380;
      e.ky += (dy / d) * 380;
    }
  });
  mutOnDash();
  P.inv = Math.max(P.inv, DASH_TIME + 0.12);
  // certaines armes réagissent au dash (les lames cachées jaillissent)
  P.weapons.forEach((w) => {
    const surDash = WEAPONS[w.id].onDash;
    if (surDash) surDash(w);
  });
  SFX.dash();
};

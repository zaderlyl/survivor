"use strict";

/* ---------- Les décors des mondes ---------- */
// cinq décors, dans l'ordre ; après le cinquième on recommence avec les teintes décalées de 40 degrés
// couleurs en [teinte, saturation %, luminosité %]
const THEMES = [
  { name: "rues néon", kind: "street", amb: "rain", bg: [235, 25, 5], a: [235, 22, 7], b: [235, 22, 9], mark: [235, 30, 14], glow: [185, 100, 50], edge: [320, 60, 30] },
  { name: "bas-fonds", kind: "sewer", amb: "bubbles", bg: [140, 30, 4], a: [140, 28, 6], b: [140, 28, 8], mark: [140, 35, 13], glow: [110, 90, 45], edge: [90, 60, 25] },
  { name: "zone industrielle", kind: "factory", amb: "sparks", bg: [25, 30, 5], a: [25, 28, 7], b: [25, 28, 9], mark: [25, 30, 15], glow: [28, 100, 50], edge: [28, 70, 28] },
  { name: "cyberespace", kind: "cyber", amb: "digits", bg: [255, 45, 5], a: [255, 40, 7], b: [255, 40, 9], mark: [255, 50, 16], glow: [270, 100, 62], edge: [220, 90, 40] },
  { name: "tour corpo", kind: "corp", amb: "motes", bg: [220, 8, 7], a: [220, 8, 9], b: [220, 8, 11], mark: [220, 10, 18], glow: [45, 90, 55], edge: [45, 70, 35] },
];

const hsl = (c, shift) => "hsl(" + ((c[0] + shift) % 360) + " " + c[1] + "% " + c[2] + "%)";
let themeKey = -1, theme = null;
// les couleurs du monde en cours, calculées une fois par monde
const worldTheme = () => {
  if (themeKey !== world) {
    themeKey = world;
    const base = THEMES[world % 5], shift = Math.floor(world / 5) * 40, o = { kind: base.kind, amb: base.amb, name: base.name };
    ["bg", "a", "b", "mark", "glow", "edge"].forEach((k) => { o[k] = hsl(base[k], shift); });
    theme = o;
  }
  return theme;
};

// les marques posées sur une dalle (x0, y0 : son coin), au hasard mais toujours les mêmes
const tileDetail = (th, h, x0, y0) => {
  const ox = x0 + 12 + (h % 70), oy = y0 + 12 + ((h >> 8) % 70), k = h % 9;
  g.fillStyle = th.mark;
  if (th.kind === "street") {
    if (k === 0) { // une flaque qui reflète un néon
      g.fillRect(ox - 12, oy - 4, 26, 8);
      g.globalAlpha = 0.45; g.fillStyle = th.glow; g.fillRect(ox - 8, oy - 1, 18, 2); g.globalAlpha = 1;
    } else if (k === 1) { g.fillRect(x0 + 10, y0 + 48, 24, 4); g.fillRect(x0 + 60, y0 + 48, 24, 4); } // marquage au sol
    else if (k === 2) { g.fillRect(ox - 7, oy - 7, 15, 15); g.fillStyle = th.a; g.fillRect(ox - 4, oy - 4, 9, 9); } // plaque d'égout
  } else if (th.kind === "sewer") {
    if (k === 0) { // une flaque toxique
      g.fillRect(ox - 12, oy - 5, 26, 10);
      g.globalAlpha = 0.5; g.fillStyle = th.glow; g.fillRect(ox - 7, oy - 2, 16, 4); g.globalAlpha = 1;
    } else if (k === 1) { g.fillRect(x0, y0 + 40 + (h % 20), 100, 5); g.fillRect(x0 + 30, y0 + 38 + (h % 20), 4, 9); } // tuyau
    else if (k === 2) { for (let q = 0; q < 4; q++) g.fillRect(ox - 8 + q * 5, oy - 6, 2, 13); } // grille
  } else if (th.kind === "factory") {
    if (k === 0) { // plaque rivetée
      g.fillRect(ox - 12, oy - 12, 26, 26); g.fillStyle = th.a;
      g.fillRect(ox - 10, oy - 10, 4, 4); g.fillRect(ox + 6, oy - 10, 4, 4); g.fillRect(ox - 10, oy + 6, 4, 4); g.fillRect(ox + 6, oy + 6, 4, 4);
    } else if (k === 1) { // bande de danger orange
      g.globalAlpha = 0.6; g.fillStyle = th.glow;
      for (let q = 0; q < 5; q++) g.fillRect(x0 + 8 + q * 16, y0 + 70, 8, 6);
      g.globalAlpha = 1;
    } else if (k === 2) { g.fillRect(ox - 9, oy - 2, 19, 5); g.fillRect(ox - 2, oy - 9, 5, 19); } // un engrenage vu de dessus
  } else if (th.kind === "cyber") {
    if (k === 0) { g.globalAlpha = 0.7; g.fillStyle = th.glow; g.fillRect(x0, y0, 100, 1); g.fillRect(x0, y0, 1, 100); g.globalAlpha = 1; } // une ligne de la grille
    else if (k === 1) { g.fillRect(ox, oy, 4, 4); g.fillRect(ox + 9, oy + 3, 4, 4); g.fillRect(ox + 3, oy + 11, 4, 4); }
    else if (k === 2) { g.globalAlpha = 0.5; g.fillStyle = th.glow; g.fillRect(ox - 8, oy, 18, 2); g.globalAlpha = 1; }
  } else {
    if (k === 0) { g.globalAlpha = 0.55; g.fillStyle = th.glow; g.fillRect(x0 + 6, y0 + 50 + (h % 20), 88, 2); g.globalAlpha = 1; } // un filet doré
    else if (k === 1) { g.globalAlpha = 0.5; g.fillRect(ox - 10, oy - 10, 4, 22); g.fillRect(ox - 4, oy - 8, 2, 18); g.globalAlpha = 1; } // un reflet sur le verre
    else if (k === 2) { g.fillRect(ox - 6, oy - 6, 13, 13); g.fillStyle = th.a; g.fillRect(ox - 3, oy - 3, 7, 7); }
  }
};

// ce qui flotte dans l'air du monde : pluie, bulles, étincelles, chiffres, poussières de lumière
const mod = (a, m) => ((a % m) + m) % m;
const ambient = (th, cx, cy, vw, vh) => {
  if (calm || mode === "menu") return;
  const tm = performance.now() / 1000, x0 = cx - vw / 2, y0 = cy - vh / 2;
  g.fillStyle = th.glow;
  g.strokeStyle = th.glow;
  if (th.amb === "rain") {
    g.globalAlpha = 0.22; g.lineWidth = 1;
    g.beginPath();
    for (let k = 0; k < 70; k++) { const x = x0 + mod(k * 137.5 + tm * 90, vw + 40), y = y0 + mod(k * 91.3 + tm * 420, vh + 40); g.moveTo(x, y); g.lineTo(x - 4, y + 14); }
    g.stroke();
  } else if (th.amb === "bubbles") {
    g.globalAlpha = 0.28;
    for (let k = 0; k < 40; k++) { const x = x0 + mod(k * 173.7, vw) + Math.sin(tm + k) * 8, y = y0 + vh - mod(k * 53 + tm * 22, vh + 20), r = 2 + (k % 3); g.fillRect(x, y, r, r); }
  } else if (th.amb === "sparks") {
    g.globalAlpha = 0.6;
    for (let k = 0; k < 40; k++) { const x = x0 + mod(k * 131 + tm * 55, vw + 40), y = y0 + vh - mod(k * 67 + tm * 38, vh + 20); g.fillRect(x, y, 2, 2); }
  } else if (th.amb === "digits") {
    g.globalAlpha = 0.28;
    for (let k = 0; k < 60; k++) { const x = x0 + mod(k * 97, vw), y = y0 + mod(k * 53 + tm * 90 + (k % 5) * 40, vh + 30); g.fillRect(x, y, 3, 6 + (k % 4) * 2); }
  } else {
    g.globalAlpha = 0.3;
    for (let k = 0; k < 30; k++) { const x = x0 + mod(k * 211 + tm * 8, vw), y = y0 + mod(k * 89 + Math.sin(tm * 0.5 + k) * 20 + tm * 5, vh); g.fillRect(x, y, 2, 2); }
  }
  g.globalAlpha = 1;
};

"use strict";

/* ---------- Les effets : particules, lueurs, traînées ---------- */
// les particules ont une couleur, une taille, une durée, et peuvent briller (glow : dessinées en addition de lumière)
const MAX_PARTS = 450;
// la couleur du personnage : celle de sa visière
const heroColor = () => {
  const a = ART[heroName()];
  return a && a.pal ? a.pal.t : LIGHT;
};
// la couleur d'un impact selon l'origine du coup
// chaque arme universelle a sa propre couleur
const WEAPON_COLOR = { orb: "#9fe9ff", wave: "#b58cff", mine: "#ffc83a", drone: "#4a8cff", flame: "#ff6a1f", storm: "#fff27a" };
const hitColor = (src) => ({ slash: "#ffffff", beam: "#ffffff", bolt: "#9fe9ff", blast: "#ffb02e", burn: "#ff8a1f", orb: WEAPON_COLOR.orb, wave: WEAPON_COLOR.wave, storm: WEAPON_COLOR.storm })[src] || heroColor();

// des étincelles qui jaillissent et ralentissent
const spark = (x, y, color, n, speed) => {
  if (calm) return;
  for (let i = 0; i < n && parts.length < MAX_PARTS; i++) {
    const a = Math.random() * 6.283, s = rnd(speed * 0.3, speed);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.22, 0.5), max: 0.5, color, size: Math.random() < 0.5 ? 4 : 3, glow: true, drag: 3.5 });
  }
};
// un point lumineux laissé derrière un tir, qui s'éteint vite
const trail = (x, y, color, size) => {
  if (calm || parts.length >= MAX_PARTS) return;
  parts.push({ x, y, vx: rnd(-12, 12), vy: rnd(-12, 12), life: 0.3, max: 0.3, color, size: (size || 2) + 1, glow: true });
};
// un anneau qui s'élargit
const ringFx = (x, y, color, r, life) => {
  if (waves.length < 24) waves.push({ x, y, r: 0, max: r, life: life || 0.25, t: life || 0.25, color });
};
// un éclair de lumière rond, très bref
const flashFx = (x, y, color, r) => {
  if (calm || parts.length >= MAX_PARTS) return;
  parts.push({ x, y, vx: 0, vy: 0, life: 0.14, max: 0.14, color, size: r, glow: true, round: true });
};
// une explosion : anneau, lueur et étincelles
const explodeFx = (x, y, color, r) => {
  ringFx(x, y, color, r);
  flashFx(x, y, color, r * 0.7);
  spark(x, y, color, Math.min(14, 6 + (r / 12) | 0), 90 + r * 2);
  if (r >= 45) smokeFx(x, y, 3);
};
// de la fumée grise qui monte et s'étale, après une explosion
const smokeFx = (x, y, n) => {
  if (calm) return;
  for (let i = 0; i < n && parts.length < MAX_PARTS; i++) {
    parts.push({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-18, 18), vy: rnd(-40, -12), life: rnd(0.45, 0.8), max: 0.8, color: "#4a4d5a", size: rnd(4, 7), drag: 1.5 });
  }
};
// une braise qui monte
const emberFx = (x, y, color) => {
  if (calm || parts.length >= MAX_PARTS) return;
  parts.push({ x, y, vx: rnd(-10, 10), vy: rnd(-55, -25), life: rnd(0.4, 0.8), max: 0.8, color, size: Math.random() < 0.5 ? 3 : 2, glow: true });
};

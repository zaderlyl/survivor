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
const hitColor = (src) => ({ slash: "#ffffff", beam: "#ffffff", bolt: "#9fe9ff", blast: "#ffb02e", burn: "#ff8a1f" })[src] || heroColor();

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
};

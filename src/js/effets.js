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
const WEAPON_COLOR = {
  orb: "#9fe9ff", wave: "#b58cff", mine: "#ffc83a", drone: "#4a8cff", flame: "#ff6a1f", storm: "#fff27a",
  // les armes uniques : Volt, Chrome, Rig, Ghost, Arc, Pulse, Zap
  turret: "#2ef2ff", burst: "#6ec6ff", mortar: "#ffb02e",
  dashcut: "#ff7ab8", boomerang: "#ffd0e4", whirl: "#ff3d7f",
  rail: "#ffb02e", barrage: "#ff8a1f", barrier: "#4af0ff",
  decoy: "#7dffb0", shuriken: "#b8ffd8", toxic: "#6dff5a",
  satellite: "#ff5fb0", rotbeam: "#35c8ff", cross: "#7ad6ff",
  sticky: "#ffb02e", napalm: "#ff6a1f", bombard: "#ff8a1f",
  thunder: "#7ad6ff", field: "#6fb8ff", tesla: "#b8e6ff",
  // les nouvelles armes uniques
  rainswords: "#ff9ccf", greatsword: "#ffd0e4", riposte: "#ff3d7f",
  cannon: "#ffd23f", raysalvo: "#ff9f2e", overload: "#ff5f2e",
  virus: "#6dff9a", firewall: "#ff7a3a", hack: "#ff3dd0",
  backstab: "#e6fff0", smoke: "#9aa0c8", mark: "#ff3d5f",
  prism: "#c8a8ff", mirror: "#e0f4ff", nova: "#35c8ff",
  rocket: "#ff8a1f", fragmine: "#ffb02e", molotov: "#ff5a2e",
  stormbarrage: "#8fd8ff", pylon: "#b8e6ff", thunderclap: "#fff27a",
  // le deuxième lot : Chrome et Rig
  spectral: "#ff9ccf", thrust: "#ffd0e4", bladedance: "#ff7ab8", execution: "#ff3d5f", flurry: "#ffb3d9",
  particlewave: "#ffd23f", pillar: "#ffe680", plasmawhip: "#ff7a3a", twincannon: "#ffb02e", particlerain: "#ffc95c",
  // le troisième lot : Volt, Ghost, Arc, Pulse, Zap
  logicbomb: "#8a7cff", worm: "#9dff6d", ddos: "#4fd8ff", pixelburst: "#c8f0ff", bsod: "#3a7bff",
  poisondarts: "#a8ff7a", illusions: "#7dffb0", beartrap: "#b8d86a", throwingdagger: "#e6fff0", shadow: "#5a6a66",
  railorbital: "#b0e8ff", refractor: "#a0f0ff", lasersentinel: "#7ad6ff", focalbeam: "#9bffd8", laserrain: "#7ad6ff",
  shellrain: "#ff9a3c", fusiongrenade: "#c46bff", reactivearmor: "#ffb02e", timebomb: "#ff5a2e", flamethrower: "#ff6a1f",
  ballightning: "#b0f0ff", staticstorm: "#9fd8ff", longchain: "#6fd0ff", mobilecoil: "#b8f0ff", arcvolt: "#9fe9ff",
};
const hitColor = (src) => ({ slash: "#ffffff", beam: "#ffffff", bolt: "#9fe9ff", blast: "#ffb02e", burn: "#ff8a1f", orb: WEAPON_COLOR.orb, wave: WEAPON_COLOR.wave, storm: WEAPON_COLOR.storm, virus: "#6dff9a", hack: "#ff3dd0", smoke: "#9aa0c8", poison: "#a8ff7a" })[src] || heroColor();

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
// des points de lumière qui convergent vers un point : la charge d'une arme
const chargeFx = (x, y, color) => {
  if (calm || parts.length >= MAX_PARTS) return;
  const a = Math.random() * 6.283, r = 30;
  parts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: -Math.cos(a) * r / 0.22, vy: -Math.sin(a) * r / 0.22, life: 0.22, max: 0.22, color, size: 3, glow: true });
};

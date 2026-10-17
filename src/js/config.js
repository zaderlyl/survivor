"use strict";

const $ = (s) => document.querySelector(s);

// true si la personne préfère éviter les animations : plus de tremblement, d'éclats ni de clignotement, le jeu reste le même
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const KEY = "devtober-swarm-7";

// pour essayer sans attendre, dans l'adresse : #temps=140 (départ à 2:20), #invincible, #perf (temps de calcul à l'écran)
const q = new URLSearchParams(location.hash.slice(1));
const dbg = { time: Number(q.get("temps")) || 0, god: q.has("invincible"), perf: q.has("perf"), test: q.has("perf") || q.has("test"), orbs: Number(q.get("lames")) || 0, world: (Number(q.get("monde")) || 1) - 1 };
const PINK = "#ff0055", LIGHT = "#e0e0e0", GREY = "#8c8c8c", DARK = "#5a5a5a", BG = "#0d0d0d";

const ARENA_W = 2200, ARENA_H = 1500; // en pixels du monde
const GAME_NAME = "Neon Horde"; // le nom du jeu (provisoire) : à changer ici seulement
const WORLD_WAVES = 240; // un monde : 4 minutes de vagues, puis le boss (environ 5 minutes en tout)
const MAX_ENEMIES = 320, MAX_GEMS = 500;
const DASH_TIME = 0.16, DASH_CD = 2.4;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- Le canevas ---------- */
const cv = $("#cv");
const g = cv.getContext("2d");
let cssW = 0, cssH = 0, dpr = 1, zoom = 1;
const fit = () => {
  const r = cv.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cssW = r.width;
  cssH = r.height;
  cv.width = Math.round(cssW * dpr);
  cv.height = Math.round(cssH * dpr);
  g.imageSmoothingEnabled = false; // les sprites restent des pixels nets
  // sur petit écran on voit moins de monde, mais pas moins de 0,9 fois sa taille
  zoom = clamp(Math.min(cssW, cssH) / 420, 0.9, 1.3);
};

/* ---------- Ce que la personne a enregistré ---------- */
const best = { t: { easy: 0, normal: 0, hard: 0 }, wins: { easy: 0, normal: 0, hard: 0 }, kills: 0, level: 1, score: 0, games: 0, world: 0, diff: "normal", sound: true };
try {
  const saved = JSON.parse(localStorage.getItem(KEY)) || {};
  if (typeof saved.time === "number") saved.t = { normal: saved.time }; // ancien format
  if (typeof saved.wins === "number") delete saved.wins;
  Object.assign(best, saved, { t: Object.assign(best.t, saved.t), wins: Object.assign(best.wins, saved.wins) });
} catch (e) { /* première partie */ }
const saveBest = () => {
  try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) { /* tant pis */ }
};

// trois niveaux de difficulté : vitesse d'arrivée, dégâts reçus, vie des ennemis
const DIFFS = {
  easy: { name: "facile", spawn: 0.75, dmg: 0.7, hp: 0.85 },
  normal: { name: "normal", spawn: 1, dmg: 1, hp: 1 },
  hard: { name: "difficile", spawn: 1.3, dmg: 1.3, hp: 1.2 },
};

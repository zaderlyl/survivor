"use strict";

/* ---------- Réglages généraux et petits outils ---------- */

// raccourci : $("#cv") = document.querySelector("#cv")
const $ = (s) => document.querySelector(s);

// true si la personne préfère éviter les animations : plus de tremblement, d'éclats ni de clignotement, le jeu reste le même
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// la clé sous laquelle la sauvegarde est rangée dans le navigateur
const KEY = "devtober-swarm-7";

// Pour essayer sans attendre, on ajoute dans l'adresse :
//   #temps=140   départ à 2:20        #invincible   ne meurt pas        #perf   affiche le temps de calcul
//   #test        permet de lire l'état du jeu depuis la console           #monde=3   départ au monde 3
const q = new URLSearchParams(location.hash.slice(1));
const dbg = {
  time: Number(q.get("temps")) || 0,
  god: q.has("invincible"),
  perf: q.has("perf"),
  test: q.has("perf") || q.has("test"),
  orbs: Number(q.get("lames")) || 0,
  world: (Number(q.get("monde")) || 1) - 1,
};

// les couleurs du jeu
const PINK = "#ff0055";
const LIGHT = "#e0e0e0";
const GREY = "#8c8c8c";
const DARK = "#5a5a5a";
const BG = "#0d0d0d";

const ARENA_W = 2200; // largeur de l'arène, en pixels du monde
const ARENA_H = 1500; // hauteur de l'arène
const GAME_NAME = "Neon Horde"; // le nom du jeu (provisoire) : à changer ici seulement
const WORLD_WAVES = 240; // un monde : 4 minutes de vagues, puis le boss (environ 5 minutes en tout)
const MAX_ENEMIES = 320; // nombre maximum d'ennemis à l'écran
const MAX_GEMS = 500; // nombre maximum de cristaux au sol
const DASH_TIME = 0.16; // durée d'un dash, en secondes
const DASH_CD = 2.4; // délai avant de pouvoir refaire un dash

// garde une valeur entre un minimum et un maximum : clamp(12, 0, 10) donne 10
const clamp = (valeur, mini, maxi) => Math.max(mini, Math.min(maxi, valeur));
// un nombre au hasard entre a et b : rnd(5, 10)
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- Le canevas ---------- */
const cv = $("#cv"); // l'élément <canvas> de la page
const g = cv.getContext("2d"); // le « pinceau » avec lequel tout est dessiné
let cssW = 0; // largeur du canevas à l'écran
let cssH = 0; // hauteur
let dpr = 1; // densité de pixels de l'écran (2 sur écran Retina)
let zoom = 1; // grossissement du monde

// ajuste le canevas à la taille de la fenêtre (appelée au démarrage et quand la fenêtre change de taille)
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
// meilleurs temps, victoires, record de score, héros choisi, difficulté, son...
const best = {
  t: { easy: 0, normal: 0, hard: 0 }, // meilleur temps par difficulté
  wins: { easy: 0, normal: 0, hard: 0 }, // victoires par difficulté
  kills: 0,
  level: 1,
  score: 0,
  games: 0,
  world: 0,
  diff: "normal", // difficulté choisie
  sound: true,
};
try {
  const saved = JSON.parse(localStorage.getItem(KEY)) || {};
  if (typeof saved.time === "number") saved.t = { normal: saved.time }; // ancien format
  if (typeof saved.wins === "number") delete saved.wins;
  Object.assign(best, saved, { t: Object.assign(best.t, saved.t), wins: Object.assign(best.wins, saved.wins) });
} catch (e) {
  /* première partie : rien d'enregistré */
}
const saveBest = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(best));
  } catch (e) {
    /* tant pis */
  }
};

// trois niveaux de difficulté : vitesse d'arrivée des ennemis (spawn), dégâts reçus (dmg), vie des ennemis (hp)
const DIFFS = {
  easy: { name: "facile", spawn: 0.75, dmg: 0.7, hp: 0.85 },
  normal: { name: "normal", spawn: 1, dmg: 1, hp: 1 },
  hard: { name: "difficile", spawn: 1.3, dmg: 1.3, hp: 1.2 },
};

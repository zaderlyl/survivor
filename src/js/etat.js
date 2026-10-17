"use strict";

/* ---------- Les ennemis ---------- */
// r : rayon, s : taille d'un pixel du dessin, hp : vie de départ, sp : vitesse, dmg : contact, xp : cristaux lâchés
const TYPES = {
  crawler: { r: 7, s: 2, hp: 2, sp: 66, dmg: 6, xp: 1 },
  brute: { r: 10, s: 2, hp: 10, sp: 42, dmg: 15, xp: 4 },
  shooter: { r: 8, s: 2, hp: 4, sp: 56, dmg: 6, xp: 3 },
  dasher: { r: 8, s: 2, hp: 5, sp: 60, dmg: 12, xp: 3 },
  splitter: { r: 10, s: 2, hp: 7, sp: 48, dmg: 10, xp: 3 },
  tank: { r: 12, s: 2, hp: 26, sp: 34, dmg: 18, xp: 6 },
  mage: { r: 8, s: 2, hp: 5, sp: 48, dmg: 6, xp: 4 },
  boss: { r: 25, s: 4, hp: 220, sp: 38, dmg: 25, xp: 30 },
};

/* ---------- L'état d'une partie ---------- */
let P, st, lv, enemies, bullets, ebullets, gems, drops, zones, parts, texts, waves, ghosts;
let freeze = 0; // pause d'image à la mort du boss
let t, kills, level, xp, need, spawnAcc, nextWave, bossAt, stormAt, cam, joy, orbAngle, pending, mode, fireCd, waveCd, combo, comboT, shake, score, dm;
const keys = {};
mode = "menu"; // menu, play, levelup, pause, over, win
const cells = [];
const CELL = 48;
const COLS = Math.ceil(ARENA_W / CELL) + 1, ROWS = Math.ceil(ARENA_H / CELL) + 1;
for (let i = 0; i < COLS * ROWS; i++) cells.push([]);

// la série de tués multiplie le score : x2 à 15, x3 à 30, pas plus
const comboMult = () => 1 + Math.min(2, Math.floor(combo / 15));
const liveScore = () => score + Math.floor(t) * 5 + level * 50;

const reset = () => {
  P = { x: ARENA_W / 2, y: ARENA_H / 2, r: 9, hp: 100, inv: 0, flash: 0, aim: 0, dash: 0, dashCd: 0, dashMax: DASH_CD, volley: 0, dx: 1, dy: 0, face: 1, walk: 0 };
  st = { cd: 0.42, dmg: 2, count: 1, pierce: 0, range: 440, speed: 170, magnet: 60, maxHp: 100, orbs: 0, crit: 0, wave: 0, regen: 0, armor: 0, blast: 0, steal: 0, dashMul: 1, orbR: 52, orbDmg: 0.6, waveMul: 1, ring: false };
  lv = {};
  enemies = []; bullets = []; ebullets = []; gems = []; drops = []; zones = []; parts = []; texts = []; waves = []; ghosts = [];
  t = 0; kills = 0; level = 1; xp = 0; need = 6; spawnAcc = 0; nextWave = 30;
  bossAt = [150, 255];
  stormAt = [105, 225];
  cam = { x: P.x, y: P.y };
  joy = null; orbAngle = 0; pending = 0; fireCd = 0; waveCd = 3; combo = 0; comboT = 0; shake = 0; score = 0;
  dm = DIFFS[best.diff] || DIFFS.normal;
};
reset();

let seedN = 0;
const spawn = (type, x, y, instant) => {
  const d = TYPES[type];
  const m = (1 + t / 260) * dm.hp; // la vie des ennemis monte avec le temps
  const hp = d.hp * (type === "boss" ? (1 + t / 150) * dm.hp : m);
  enemies.push({
    type, x, y, r: d.r, hp, max: hp, sp: d.sp * (type === "crawler" ? 1 + Math.min(t / 500, 0.6) : 1), dmg: d.dmg * dm.dmg, xp: d.xp,
    fire: rnd(0.5, 2), hit: 0, orbCd: 0, kx: 0, ky: 0, age: instant ? 1 : 0, seed: seedN++ % 7, st: 0, stT: rnd(0.5, 1.5), dirx: 0, diry: 0,
  });
};

// un point juste en dehors de l'écran, sur un des quatre bords, et dans l'arène
const edgePoint = (extra) => {
  const hw = cssW / zoom / 2 + extra, hh = cssH / zoom / 2 + extra;
  for (let k = 0; k < 8; k++) {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? P.x - hw : side === 1 ? P.x + hw : P.x + rnd(-hw, hw);
    const y = side === 2 ? P.y - hh : side === 3 ? P.y + hh : P.y + rnd(-hh, hh);
    if (x > 20 && x < ARENA_W - 20 && y > 20 && y < ARENA_H - 20) return [x, y];
  }
  return [clamp(P.x + (Math.random() < 0.5 ? -hw : hw), 20, ARENA_W - 20), clamp(P.y + rnd(-hh, hh), 20, ARENA_H - 20)];
};

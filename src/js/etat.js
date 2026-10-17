"use strict";

/* ---------- Les ennemis ---------- */
// r : rayon, s : taille d'un pixel du dessin, hp : vie de départ, sp : vitesse, dmg : contact, xp : cristaux lâchés
const TYPES = {
  crawler: { r: 7, s: 2, hp: 2, sp: 66, dmg: 6, xp: 1 },
  brute: { r: 10, s: 2, hp: 10, sp: 42, dmg: 15, xp: 5 },
  shooter: { r: 8, s: 2, hp: 4, sp: 56, dmg: 6, xp: 3 },
  dasher: { r: 8, s: 2, hp: 5, sp: 60, dmg: 12, xp: 4 },
  splitter: { r: 10, s: 2, hp: 7, sp: 48, dmg: 10, xp: 4 },
  tank: { r: 12, s: 2, hp: 26, sp: 34, dmg: 18, xp: 10 },
  mage: { r: 8, s: 2, hp: 5, sp: 48, dmg: 6, xp: 4 },
  boss: { r: 25, s: 4, hp: 220, sp: 38, dmg: 25, xp: 60 },
};

/* ---------- L'état d'une partie ---------- */
let P, st, lv, fx, enemies, bullets, ebullets, gems, drops, zones, parts, texts, waves, ghosts;
let freeze = 0; // pause d'image à la mort du boss
let t, kills, level, xp, need, spawnAcc, nextWave, stormAt, world, worldT, phase, phaseT, cam, joy, pending, mode, combo, comboT, shake, score, dm;
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
  P = { x: ARENA_W / 2, y: ARENA_H / 2, r: 9, hp: 100, inv: 0, flash: 0, aim: 0, dash: 0, dashCd: 0, dashMax: DASH_CD, volley: 0, dx: 1, dy: 0, face: 1, walk: 0, weapons: [] };
  addWeapon((CHARS[best.char] || CHARS.volt).weapon, 1);
  st = { cd: 0.42, dmg: 2, count: 1, pierce: 0, range: 440, speed: 170, magnet: 60, maxHp: 100, orbs: 0, crit: 0, wave: 0, regen: 0, armor: 0, blast: 0, steal: 0, dashMul: 1, orbR: 52, orbDmg: 0.6, waveMul: 1, ring: false, critMul: 2, deathBlast: false, autoPull: false, legends: 0 };
  lv = {};
  fx = []; enemies = []; bullets = []; ebullets = []; gems = []; drops = []; zones = []; parts = []; texts = []; waves = []; ghosts = [];
  t = 0; kills = 0; level = 1; xp = 0; need = 6; spawnAcc = 0; nextWave = 30;
  stormAt = [100, 200];
  world = 0; worldT = 0; phase = "waves"; phaseT = 0;
  cam = { x: P.x, y: P.y };
  joy = null; pending = 0; combo = 0; comboT = 0; shake = 0; score = 0;
  dm = DIFFS[best.diff] || DIFFS.normal;
};
reset();

// chaque monde est plus dur que le précédent : plus de vie, plus de dégâts, plus d'arrivées
const worldHp = () => 1 + 0.4 * world;
const worldDmg = () => 1 + 0.15 * world;
const worldSpawn = () => 1 + 0.2 * world;

let seedN = 0;
const spawn = (type, x, y, instant) => {
  const d = TYPES[type];
  const m = (1 + worldT / 260) * dm.hp * worldHp(); // la vie monte avec le temps du monde, puis avec le monde
  const hp = d.hp * (type === "boss" ? 2.2 * (1 + 0.5 * world) * dm.hp : m);
  enemies.push({
    type, x, y, r: d.r, hp, max: hp, skin: world % 5, sp: d.sp * (type === "crawler" ? 1 + Math.min(worldT / 500, 0.6) : 1), dmg: d.dmg * dm.dmg * worldDmg(), xp: Math.round(d.xp * Math.pow(hp / d.hp, 0.75) * 10) / 10, // plus il est costaud, plus il rapporte
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

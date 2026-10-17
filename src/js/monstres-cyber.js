"use strict";

/* ---------- Les monstres du monde 4 : cyberespace ---------- */
// même écriture que monstres-rues.js
// k contour · p rose · d violet sombre · m violet · l violet clair · b bleu vif · c cyan · g magenta · w blanc · n vide sombre
const CYBER = { p: PINK, k: "#07051a", d: "#1d1650", m: "#3d33a0", l: "#8a7cff", b: "#4a8cff", c: "#35f2ff", g: "#ff4fd8", w: "#eeeaff", n: "#0c0a2a" };
const cyberMonster = (rows, a, b, s) => ({ pal: CYBER, s: s || 1, frames: [mirrorRows(rows.concat(a)), mirrorRows(rows.concat(b))] });
// un glitch : certaines lignes de l'image sont décalées de quelques pixels
const shiftRow = (r, n) => (n > 0 ? ".".repeat(n) + r.slice(0, r.length - n) : r.slice(-n) + ".".repeat(-n));
const glitch = (rows, shifts) => rows.map((r, i) => (shifts[i] ? shiftRow(r, shifts[i]) : r));

const glitched = (art, shifts) => { art.frames[1] = glitch(art.frames[1], shifts); return art; };

const SWARM_ROWS = [
  "kkkkkk..kkkkkk",
  "kllllk..kllllk",
  "klcmmk..kmmclk",
  "kmmmmk..kmmmmk",
  "kkkkkk..kkkkkk",
  "......gg......",
  "kkkkkk..kkkkkk",
  "kllllk..kllllk",
  "klcmmk..kmmclk",
  "kmmmmk..kmmmmk",
  "kkkkkk..kkkkkk",
];

Object.assign(ART, {
  // Virus : un losange hérissé, un œil cyan
  crawler3: cyberMonster([
    ".....k",
    "....kl",
    "...klm",
    "..klcc",
    ".klmmm",
    "klmmmm",
    ".klmmm",
    "..klmm",
    "...klm",
  ], ["=.....kk.....", "=...k....k..."], ["=...k..k.....", "=..k......k.."]),

  // Pare-feu : des briques de code, une visière rose, un cœur magenta
  brute3: cyberMonster([
    "...kkkkk",
    "..kmmdmm",
    ".kmmdmmd",
    ".kmppppp",
    ".kmmdmmd",
    "kmmdmmdm",
    "kmdmmdmm",
    "kmmdmmgg",
    "kmdmmdgg",
    "kmmdmmmm",
    ".kmdmmdm",
    ".kdddkkk",
  ], ["=.kddk......kddk.", "=.kkkk......kkkk."], ["=..kddk....kddk..", "=..kkkk....kkkk.."]),

  // Sentinelle : un œil géant, une pupille rose, un petit satellite
  shooter3: cyberMonster([
    "...kkk",
    "..klll",
    ".klmmm",
    "klmwww",
    "klwwcc",
    "klwcgg",
    "klwwcc",
    "klmwww",
    ".klmmm",
    "..klll",
    "...kkk",
  ], ["....g."], [".....g"]),

  // Glitch : une silhouette dont des tranches se décalent
  dasher3: glitched(cyberMonster([
    "...kkk",
    "..klll",
    ".klccc",
    ".klmmm",
    "klmllm",
    "klmgmg",
    ".klmmm",
    ".klml.",
  ], ["=.klk..klk...", "=kllk..kllk.."], ["=...klk..klk.", "=..kllk.kllk."]), { 2: 2, 5: -2 }),

  // Essaim de données : quatre cubes liés par un fil magenta (la seconde pose est la première, décalée)
  splitter3: { pal: CYBER, s: 1, frames: [SWARM_ROWS, glitch(SWARM_ROWS, { 1: 1, 3: -1, 7: 1, 9: -1 })] },

  // Serveur : une tour de baies, des voyants cyan et magenta
  tank3: cyberMonster([
    "....kkkkk",
    "..kkllllm",
    ".klmmmmmm",
    ".klmbbbbb",
    "klmmmmmmm",
    "klmddddmm",
    "klmdcdcdc",
    "klmddddmm",
    "klmdgdgdg",
    "klmddddmm",
    "kmmmmmmmm",
    ".kkddkkkk",
  ], ["=..kdddk....kdddk..", "=..kkkkk....kkkkk.."], ["=.kdddk......kdddk.", "=.kkkkk......kkkkk."]),

  // Oracle : une auréole magenta, un visage vide aux yeux cyan, un flux de code sur la robe
  mage3: cyberMonster([
    "...kgg",
    "..klmm",
    ".klmmm",
    ".klnnn",
    ".klncc",
    ".klnnn",
    "..klmm",
    ".klmmm",
    "klmllm",
    "klmlmg",
    "klmmmm",
    "kldmmm",
  ], ["=.kddk...kddk", "=.kkkk...kkkk"], ["=..kddk..kddk", "=..kkkk..kkkk"]),

  // IA corrompue : un noyau à l'œil immense, des circuits, des filaments
  boss3: glitched(cyberMonster([
    "...........k",
    "..........kg",
    ".........kgg",
    "........klll",
    ".......klmmm",
    "......klmwww",
    ".....klmwccc",
    ".....klwcggg",
    ".....klmwccc",
    "......klmwww",
    ".......klmmm",
    "....kkklllbb",
    "..kklmmmmmmb",
    ".klmmmddddmm",
    "klmmdgdgdgdm",
    "klmmmddddmmm",
    ".klmmmmmmmmm",
    "..kllmmmmddd",
  ], ["=.....kdddk........kdddk.", "=.....kkkkk........kkkkk."], ["=....kdddk..........kdddk", "=....kkkkk..........kkkkk"], 2), { 5: 2, 9: -2, 14: 1 }),
});


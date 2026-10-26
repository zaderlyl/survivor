"use strict";

/* ---------- Les monstres du monde 1 : rues néon ---------- */
// chaque ligne décrit la moitié gauche du monstre, la droite en est le miroir ;
// une ligne qui commence par = est écrite en entier (pour les jambes, qui ne sont pas symétriques)
// k contour · d métal sombre · m métal · l métal clair · c néon cyan · p néon rose · y jaune · w blanc · n vide sombre
const mirrorRows = (rows) => rows.map((r) => (r[0] === "=" ? r.slice(1) : r + r.split("").reverse().join("")));
const STREET = { k: "#07070b", d: "#23263a", m: "#454a66", l: "#8d94b3", c: "#27e9ff", p: PINK, y: "#ffcf3a", w: "#eef2ff", n: "#0f101a" };
const monster = (rows, a, b, s) => ({ pal: STREET, s: s || 1, frames: [mirrorRows(rows.concat(a)), mirrorRows(rows.concat(b))] });

Object.assign(ART, {
  // Rôdeur : un voyou à capuche, la visière cyan
  crawler0: monster([
    "..kkkk",
    ".kddmm",
    "kdmmmm",
    "kdcccc",
    "kdmmmm",
    ".kdddl",
    ".kdddd",
    ".kdmmd",
  ], ["=..kdk..kdk..", "=..kk....kk.."], ["=.kdk....kdk.", "=.kk......kk."]),

  // Ganger cyborg : épaulettes, visière rose, cœur lumineux
  brute0: monster([
    "...kkkkk",
    "..kdmmmm",
    ".kdmllll",
    ".kdmpppp",
    ".kdmmmmm",
    "kddmmddd",
    "kmlddmmm",
    "kmldmllm",
    "kmldmmpp",
    "kdmddmmm",
    ".kddmmmm",
    ".kdddkkk",
  ], ["=.kddk......kddk.", "=.kkkk......kkkk."], ["=..kddk....kddk..", "=..kkkk....kkkk.."]),

  // Drone de rue : il flotte, un gros œil cyan, un feu rose dessous
  shooter0: monster([
    "kkk...",
    ".kdk..",
    "..kdkk",
    ".kddmm",
    "kdmmll",
    "kdmcww",
    "kdmccc",
    "kdmmll",
    ".kddmm",
    "..kkdd",
    "...kpp",
  ], ["....p."], [".....p"]),

  // Coureur à lames : penché en avant, des lames aux pieds
  dasher0: monster([
    "...kkk",
    "..kddm",
    ".kdmcc",
    ".kdmmm",
    "kdmllm",
    "kdmddp",
    ".kdmmd",
    ".kddd.",
  ], ["=.kdk..kdk...", "=kllk..kllk.."], ["=...kdk..kdk.", "=..kllk.kllk."]),

  // Nuée de pods : un gros module qui se brise en rôdeurs
  splitter0: monster([
    "..kkkkk",
    ".kdmmmm",
    "kdmllmm",
    "kdmcpmm",
    "kdmmmmm",
    "kdlldmm",
    "kdmcpdm",
    "kdmmmmd",
    ".kdddmm",
    "..kkddd",
  ], ["=..kdk....kdk..", "=..kk......kk.."], ["=.kdk......kdk.", "=.kk........kk."]),

  // Blindé de la police : large, une barre rose sur le torse
  tank0: monster([
    "....kkkkk",
    "..kkdddmm",
    ".kdmmmmll",
    ".kdmccccc",
    "kdmmmmmmm",
    "kmlllllmm",
    "kmldddddd",
    "kmldmmmmm",
    "kmldmpppp",
    "kmldmmmmm",
    "kddddddmm",
    ".kkddkkkk",
  ], ["=..kdddk....kdddk..", "=..kkkkk....kkkkk.."], ["=.kdddk......kdddk.", "=.kkkkk......kkkkk."]),

  // Hacker à capuche : un visage vide, deux yeux cyan, un glyphe rose sur la robe
  mage0: monster([
    "...kkk",
    "..kdmm",
    ".kdmmm",
    ".kdnnn",
    ".kdncc",
    ".kdnnn",
    "..kdmm",
    ".kdmmm",
    "kdmllm",
    "kdmlmp",
    "kdmmmm",
    "kddmmm",
  ], ["=.kddk...kddk", "=.kkkk...kkkk"], ["=..kddk..kddk", "=..kkkk..kkkk"]),

  // Chef de gang cyborg : crête rose, visière rose, épaules hérissées, cœur rose
  boss0: monster([
    "...........k",
    "..........kp",
    "..........kp",
    ".......kkkkd",
    "......kddmmm",
    ".....kdmmlll",
    ".....kdmmmmm",
    ".....kdmpppp",
    ".....kdmmmmm",
    "......kdwwww",
    ".....kkdmmmm",
    "..kkkkddmmmm",
    ".kddddmmllll",
    "kdmmmdmldddd",
    "kdlmmdmlmmpp",
    "kdlmmdmlmmpp",
    "kdmmmdmmmmmm",
    ".kdddkdmmmmm",
    "..kkkkkdddmm",
    ".....kdmmmdd",
  ], ["=.....kdddk........kdddk.", "=.....kkkkk........kkkkk."], ["=....kdddk..........kdddk", "=....kkkkk..........kkkkk"], 2),
});

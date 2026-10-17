"use strict";

/* ---------- Les monstres du monde 5 : tour corpo ---------- */
// même écriture que monstres-rues.js
// k contour · d acier sombre · m acier · l chrome · w blanc · y or · g or sombre · c cyan · p rose · n vide sombre
const CORP = { k: "#0b0b10", d: "#2a2c36", m: "#5b606f", l: "#b9bfcf", w: "#f4f6fb", y: "#e8b83a", g: "#9a7420", c: "#35f2ff", p: PINK, n: "#12131a" };
const corpMonster = (rows, a, b, s) => ({ pal: CORP, s: s || 1, frames: [mirrorRows(rows.concat(a)), mirrorRows(rows.concat(b))] });

Object.assign(ART, {
  // Garde de sécurité : un casque blanc à bande dorée, une visière sombre aux voyants roses
  crawler4: corpMonster([
    "..kkkk",
    ".kwwww",
    "kwwlll",
    "kwyyyy",
    "kdnnnn",
    "kdnnpp",
    ".kddmm",
    ".kdmmm",
  ], ["=..kdk..kdk..", "=..kk....kk.."], ["=.kdk....kdk.", "=.kk......kk."]),

  // Garde d'élite : une armure blanche, des épaulettes dorées, un cœur doré
  brute4: corpMonster([
    "...kkkkk",
    "..kwwwll",
    ".kwwlllm",
    ".kwdpppp",
    ".kwwwwww",
    "kyyywwll",
    "kmyydmmm",
    "kmlddmll",
    "kmlddmyy",
    "kdmddmmm",
    ".kddmmmm",
    ".kdddkkk",
  ], ["=.kddk......kddk.", "=.kkkk......kkkk."], ["=..kddk....kddk..", "=..kkkk....kkkk.."]),

  // Drone sniper : un long canon, une lunette rose, des tuyères cyan
  shooter4: corpMonster([
    "....kk",
    "....kp",
    "...kww",
    "..kwll",
    ".kwwll",
    "kwwdpp",
    "kdmmww",
    "kdmyyy",
    ".kdmmw",
    "..kkdd",
    "...kcc",
  ], ["....c."], [".....c"]),

  // Agent à lames : un casque blanc, des lames dorées aux pieds
  dasher4: corpMonster([
    "...kkk",
    "..kwwl",
    ".kwppp",
    ".kwwwl",
    "kwmllm",
    "kwmyyw",
    ".kwmmw",
    ".kwww.",
  ], ["=.kwk..kwk...", "=kyyk..kyyk.."], ["=...kwk..kwk.", "=..kyyk.kyyk."]),

  // Capsule VIP : des trappes dorées d'où sortent des gardes
  splitter4: corpMonster([
    "..kkkkk",
    ".kwwwww",
    "kwwlllw",
    "kwlyyyl",
    "kwlyccy",
    "kwlyyyl",
    "kwwlllw",
    "kdwwwww",
    ".kddmmm",
    "..kkddd",
  ], ["=..kmk....kmk..", "=..kk......kk.."], ["=.kmk......kmk.", "=.kk........kk."]),

  // Mécha de la corpo : large, une visière rose, un noyau doré
  tank4: corpMonster([
    "....kkkkk",
    "..kkwwwll",
    ".kwwlllll",
    ".kwdppppp",
    "kwwwwwwww",
    "kmlyyyyyy",
    "kmlwwwwww",
    "kmlwdmmmm",
    "kmlwdyyyy",
    "kmlwwwwww",
    "kddddddmm",
    ".kkddkkkk",
  ], ["=..kdddk....kdddk..", "=..kkkkk....kkkkk.."], ["=.kdddk......kdddk.", "=.kkkkk......kkkkk."]),

  // Cadre dirigeant : un masque pâle aux yeux cyan, une cravate dorée
  mage4: corpMonster([
    "..kkkk",
    ".kdddd",
    ".kdwww",
    ".kdwcc",
    ".kdwww",
    "..kdww",
    ".kdmmm",
    "kdmmlm",
    "kdmmwy",
    "kdmmmy",
    "kdmmmm",
    "kddmmm",
  ], ["=.kddk...kddk", "=.kkkk...kkkk"], ["=..kddk..kddk", "=..kkkk..kkkk"]),

  // PDG augmenté : une couronne dorée, une visière rose, des épaulettes d'or, un emblème sur le torse
  boss4: corpMonster([
    "........k..y",
    "........kyyy",
    ".......kyyyy",
    "......kkkkkk",
    ".....kwwwwww",
    ".....kwdpppp",
    ".....kwwwwww",
    "......kwlwlw",
    ".....kkwwwww",
    "..kkkkwwwwww",
    ".kyyyywwlllw",
    "kygggywlllww",
    "kyyyyywwwwww",
    "kmwwwwwwyyyy",
    "kmwwwwwwyggy",
    "kmwwwwwwyyyy",
    ".kmwwwwwwwww",
    "..kkmwwwwwww",
  ], ["=.....kdddk........kdddk.", "=.....kkkkk........kkkkk."], ["=....kdddk..........kdddk", "=....kkkkk..........kkkkk"], 2),
});

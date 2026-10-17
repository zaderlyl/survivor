"use strict";

/* ---------- Les monstres du monde 2 : bas-fonds ---------- */
// même écriture que monstres-rues.js
// k contour · d vert sombre · m vert · l vert clair · c turquoise · y vert acide · f chair · p rose · w os · n vide sombre
const SEWER = { k: "#050d08", d: "#12281a", m: "#2b6137", l: "#82c46b", c: "#35e0b6", y: "#c8ff3d", p: PINK, w: "#e9f7d6", n: "#08140c", f: "#8e4f5a" };
const sewerMonster = (rows, a, b, s) => ({ pal: SEWER, s: s || 1, frames: [mirrorRows(rows.concat(a)), mirrorRows(rows.concat(b))] });

Object.assign(ART, {
  // Rat-cyborg : des oreilles rondes, deux yeux roses, des dents
  crawler1: sewerMonster([
    "kkk...",
    "kfk.kk",
    ".kmmmm",
    "kmmmmm",
    "kmppmm",
    "kmmmmm",
    ".kmllw",
    ".kkwwk",
    "..kmmm",
  ], ["=..kmk..kmk..", "=..kk....kk.."], ["=.kmk....kmk.", "=.kk......kk."]),

  // Mutant massif : de la chair à vif, une gueule pleine de dents, des pustules acides
  brute1: sewerMonster([
    "...kkkkk",
    "..kdmmmm",
    ".kdmmffm",
    ".kdmppmm",
    ".kdmmmmm",
    "kddmwwww",
    "kmmddmmm",
    "kmfmdymm",
    "kmffmmmm",
    "kmmfmymm",
    "kdmmmmmm",
    ".kddmmmm",
  ], ["=.kddk......kddk.", "=.kkkk......kkkk."], ["=..kddk....kddk..", "=..kkkk....kkkk.."]),

  // Cracheur : une gorge gonflée d'acide
  shooter1: sewerMonster([
    "..kkkk",
    ".kmmmm",
    "kmmllm",
    "kmppmm",
    "kmmmmm",
    "kdyyyy",
    "kdnnyy",
    "kmmnnn",
    ".kmmmm",
    "..kdmm",
  ], ["=..kmk..kmk..", "=..kk....kk.."], ["=.kmk....kmk.", "=.kk......kk."]),

  // Chasseur : le museau en avant, des épines acides dans le dos
  dasher1: sewerMonster([
    "....ky",
    "..kkmm",
    ".kmmmm",
    ".kmpwm",
    "kmmmmm",
    "kdmwww",
    ".kddmm",
    ".kddd.",
  ], ["=.kmk..kmk...", "=kmmk..kmmk.."], ["=...kmk..kmk.", "=..kmmk.kmmk."]),

  // Sac à œufs : des embryons luisants sous la peau, il éclate en rampants
  splitter1: sewerMonster([
    "..kkkkk",
    ".kmmmmm",
    "kmmyymm",
    "kmyyyfm",
    "kmmyfmm",
    "kdmmmmm",
    "kdfmyym",
    "kdfmyym",
    "kdmmmmd",
    ".kddmmd",
    "..kkddd",
  ], ["=..kmk....kmk..", "=..kk......kk.."], ["=.kmk......kmk.", "=.kk........kk."]),

  // Colosse carapacé : des plaques, des évents d'acide
  tank1: sewerMonster([
    "....kkkkk",
    "..kkdddmm",
    ".kdmmmmll",
    ".kdmppmmm",
    "kdmmmmmmm",
    "kmlllllmm",
    "kmlmmmmmm",
    "kmlmdyyyy",
    "kmlmmmmmm",
    "kddddddmm",
    ".kkddkkkk",
  ], ["=..kmmmk....kmmmk..", "=..kkkkk....kkkkk.."], ["=.kmmmk......kmmmk.", "=.kkkkk......kkkkk."]),

  // Chaman : une capuche à cornes, des yeux roses, un glyphe acide
  mage1: sewerMonster([
    "..k.kk",
    "..kdmm",
    ".kdmmm",
    ".kdnnn",
    ".kdnpp",
    ".kdnnn",
    "..kdmm",
    ".kdmmm",
    "kdmllm",
    "kdmlmy",
    "kdmmmm",
    "kddmmm",
  ], ["=.kddk...kddk", "=.kkkk...kkkk"], ["=..kddk..kddk", "=..kkkk..kkkk"]),

  // Abomination : une gueule immense, des pustules, des tentacules
  boss1: sewerMonster([
    ".....kkkkkkk",
    "....kmmmmmmm",
    "...kmmlllmmm",
    "..kmmlfmmmmm",
    "..kmmppmmmmm",
    "..kmmmmmmmmm",
    "..kdmwkwkwkw",
    "..kdmkwkwkwk",
    "...kdnnnnnnn",
    "..kkdmmmmmmm",
    ".kmmmdmmfmmm",
    "kmmfmdmmmmyy",
    "kmfmmdmmfyyy",
    "kmmmmdmmmmyy",
    "kmmmfdmmmmmm",
    ".kmmmdmmmfmm",
    "..kmmdmmmmmm",
    "..kkmmmddddd",
    "...kmmmmmmdd",
  ], ["=.....kmmmk........kmmmk.", "=.....kkkkk........kkkkk."], ["=....kmmmk..........kmmmk", "=....kkkkk..........kkkkk"], 2),
});

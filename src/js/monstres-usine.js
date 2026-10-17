"use strict";

/* ---------- Les monstres du monde 3 : zone industrielle ---------- */
// même écriture que monstres-rues.js
// k contour · d brun sombre · m rouille · l rouille claire · g acier · h acier clair · c orange vif · y jaune de danger · w blanc · n vide sombre
const FACTORY = { k: "#0e0905", d: "#2a1d12", m: "#6b4a32", l: "#b88a5e", g: "#4f5766", h: "#9aa3b5", c: "#ff8a1f", y: "#ffd23f", w: "#f0e6d2", n: "#1a120a" };
const factoryMonster = (rows, a, b, s) => ({ pal: FACTORY, s: s || 1, frames: [mirrorRows(rows.concat(a)), mirrorRows(rows.concat(b))] });

Object.assign(ART, {
  // Robot de chaîne : une antenne, un œil orange, des chenilles
  crawler2: factoryMonster([
    "....ky",
    ".kkggg",
    "kgghhh",
    "kgcccc",
    "kggghh",
    "kykykg",
    ".kdddd",
    ".kdmmd",
  ], ["=kddk....kddk", "=kkkk....kkkk"], ["=.kddk..kddk.", "=.kkkk..kkkk."]),

  // Soudeur : un chalumeau orange, une visière en fente, des épaules à bandes de danger
  brute2: factoryMonster([
    "...kkkkk",
    "..kgghhh",
    ".kgghhhh",
    ".kgccccc",
    ".kgggggg",
    "kggmmgyk",
    "kgmlggmm",
    "kgmlgcmm",
    "kgmlgmmm",
    "kddmgmmm",
    ".kddgggg",
    ".kdddkkk",
  ], ["=.kddk......kddk.", "=.kkkk......kkkk."], ["=..kddk....kddk..", "=..kkkk....kkkk.."]),

  // Drone-tourelle : un canon, un œil orange, des tuyères
  shooter2: factoryMonster([
    "....kk",
    "....kc",
    "...kgg",
    "..kghh",
    ".kgghh",
    "kggcch",
    "kgmmgg",
    "kgmyky",
    ".kgmmg",
    "..kkdd",
    "...kcc",
  ], ["....c."], [".....c"]),

  // Bélier à pistons : penché en avant, des pistons aux pieds
  dasher2: factoryMonster([
    "...kkk",
    "..kggh",
    ".kgcch",
    ".kgggh",
    "kgmhhg",
    "kgmykg",
    ".kgmmg",
    ".kggg.",
  ], ["=.kgk..kgk...", "=khhk..khhk.."], ["=...kgk..kgk.", "=..khhk.khhk."]),

  // Conteneur à drones : des nervures, des trappes qui lâchent des rôdeurs
  splitter2: factoryMonster([
    "kkkkkkk",
    "kmlmlml",
    "kmlmlml",
    "kmcmmmm",
    "kmlmlml",
    "kmlmlmy",
    "kmlmlml",
    "kmcmmmm",
    "kmlmlml",
    "kdmdddd",
    "kkkkkkk",
  ], ["=..kgk....kgk.."], ["=.kgk......kgk."]),

  // Chariot : un blindé à chenilles, des évents orange
  tank2: factoryMonster([
    "....kkkkk",
    "..kkgggmm",
    ".kgmmmmll",
    ".kgmccccc",
    "kgmmmmmmm",
    "kmlllllmm",
    "kmlykykyk",
    "kmlmmmmmm",
    "kmlmdcccc",
    "kmlmmmmmm",
    "kddddddmm",
    ".kkddkkkk",
  ], ["=..kgggk....kgggk..", "=..kkkkk....kkkkk.."], ["=.kgggk......kgggk.", "=.kkkkk......kkkkk."]),

  // Contremaître : un casque jaune, un masque noir aux yeux orange, un plan lumineux sur la combinaison
  mage2: factoryMonster([
    "..kyyy",
    ".kyyyy",
    "kkkkkk",
    ".kdnnn",
    ".kdncc",
    ".kdnnn",
    "..kgmm",
    ".kgmmm",
    "kgmllm",
    "kgmlmc",
    "kgmmmm",
    "kddmmm",
  ], ["=.kddk...kddk", "=.kkkk...kkkk"], ["=..kddk..kddk", "=..kkkk..kkkk"]),

  // Presse géante : une cheminée, un four au torse, des bras hydrauliques
  boss2: factoryMonster([
    "..........kk",
    "..........kd",
    ".......kkkkd",
    "......kggggg",
    ".....kgmmmmm",
    ".....kgmcccc",
    ".....kgmmmmm",
    "......kgyyky",
    ".....kkgmmmm",
    "..kkkkggmmmm",
    ".kggggmmllll",
    "kgmmmgmldddd",
    "kgmyyggmlccc",
    "kgmykggmlccc",
    "kgmmmgmmmmmm",
    ".kgggkgmmmmm",
    "..kkkkkgggmm",
    ".....kgmmmgg",
  ], ["=.....kgggk........kgggk.", "=.....kkkkk........kkkkk."], ["=....kgggk..........kgggk", "=....kkkkk..........kkkkk"], 2),
});

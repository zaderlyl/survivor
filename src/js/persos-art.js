"use strict";

/* ---------- Les looks des sept personnages ---------- */
// un même corps pour tous (la moitié gauche, le miroir à droite), repeint et équipé de l'arme de chacun
// h armure · a armure claire · t lueur · v visière · s ombre · b ceinture · k contour · l clair · d sombre · y or · o orange
const HERO_BODY = [
  "....kkkk",
  "...khhhh",
  "..khhhaa",
  "..khvvvv",
  "..khhssh",
  "...kkhhh",
  "..khhhaa",
  ".khhaatt",
  ".khaattt",
  ".khsbbbb",
  ".khhsaaa",
  "..khh...",
];
const HERO_LEGS_A = ["...khhk..khhk...", "...khsk..khsk...", "...kssk..kssk...", "..kkssk..kkssk.."];
const HERO_LEGS_B = ["..khhk....khhk..", "..khsk....khsk..", "..kssk....kssk..", ".kkssk....kkssk."];

// pose des pixels à la main : [ligne, colonne, texte], le point ne change rien
const patchRows = (rows, patches) => rows.map((r, i) => {
  const cs = r.split("");
  patches.forEach((p) => { if (p[0] === i) p[2].split("").forEach((ch, j) => { if (ch !== ".") cs[p[1] + j] = ch; }); });
  return cs.join("");
});
const hero = (pal, patches) => {
  const upper = mirrorRows(HERO_BODY.map((r) => ".." + r));
  const legs = (L) => L.map((r) => ".." + r + "..");
  return { pal: Object.assign({ k: "#07070c" }, pal), s: 1, frames: [patchRows(upper.concat(legs(HERO_LEGS_A)), patches), patchRows(upper.concat(legs(HERO_LEGS_B)), patches)] };
};

Object.assign(ART, {
  // Volt, le hacker : une capuche indigo, une visière cyan, un petit pistolet
  hero_volt: hero(
    { h: "#222a52", a: "#3c4c90", t: "#2ef2ff", v: "#2ef2ff", s: "#0f1328", b: "#6ec6ff", l: "#8aa0ff", d: "#161a36", c: "#2ef2ff" },
    [[8, 16, "kccc"], [9, 16, "kdk."]]
  ),
  // Chrome, le samouraï cyborg : un corps chromé, une lueur rose, un katana dressé
  hero_chrome: hero(
    { h: "#aeb6c8", a: "#d9deea", t: "#ff3d7f", v: "#ff3d7f", s: "#4b5266", b: "#2c3140", l: "#f4f6ff", d: "#6b7288", y: "#e8b83a" },
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => [r, 18, "lk"]).concat([[10, 17, "kyk"]])
  ),
  // Rig, le mécano : une combinaison orange, des lunettes jaunes, un gros blaster
  hero_rig: hero(
    { h: "#b5651d", a: "#e08a2e", t: "#ffd23f", v: "#ffd23f", s: "#4a2c10", b: "#2c1c0c", o: "#ff8a1f", d: "#5a5f6e", l: "#cfd3dc" },
    [[7, 16, "kkkk"], [8, 15, "koook"], [9, 15, "koook"], [10, 16, "kkkk"]]
  ),
  // Ghost, l'infiltré : une cape vert sombre, une visière vert pâle, un fusil à pompe
  hero_ghost: hero(
    { h: "#2b3a36", a: "#41594f", t: "#7dffb0", v: "#7dffb0", s: "#141c1a", b: "#0c1210", d: "#1e2a27", l: "#6f8f83" },
    [[9, 15, "kdddk"], [10, 16, "kkkk"]]
  ),
  // Arc, le tireur d'élite : une armure blanche, une visière cyan, un long fusil laser
  hero_arc: hero(
    { h: "#dfe6f2", a: "#9db4d8", t: "#35c8ff", v: "#35c8ff", s: "#4a5a78", b: "#2a3550", l: "#ffffff", d: "#6a7a98" },
    [[8, 14, "kllllk"], [9, 16, "kttk"]]
  ),
  // Pulse, la pyromane : une armure rouge, une visière ambre, un lance-grenades
  hero_pulse: hero(
    { h: "#a3302a", a: "#d65a3a", t: "#ffb02e", v: "#ffb02e", s: "#4a1814", b: "#2a0e0c", y: "#ffd23f", o: "#ff8a1f", d: "#5a2a24", l: "#e8a08a" },
    [[7, 15, "kkkkk"], [8, 15, "kyyyk"], [9, 15, "kkkkk"]]
  ),
  // Zap, l'électricien : une combinaison jaune, une visière bleue, des bobines sur les épaules
  hero_zap: hero(
    { h: "#e0c020", a: "#f4e060", t: "#7ad6ff", v: "#7ad6ff", s: "#6a5a10", b: "#2a2410", d: "#3a3a4a", l: "#ffffff" },
    [[3, 15, "ktk"], [4, 15, "kdk"], [5, 15, "kdk"], [3, 2, "ktk"], [4, 2, "kdk"], [5, 2, "kdk"]]
  ),
});

// le dessin du personnage choisi (l'ancien, s'il n'existe pas)
const heroName = () => (ART["hero_" + best.char] ? "hero_" + best.char : "player");

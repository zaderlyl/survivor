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
// les paliers : l'armure, l'arme et les propulseurs évoluent avec les boosts (voir heroLook)
const lighten = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.min(255, Math.round(v + (255 - v) * k));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, "0")).join("");
};
const ARMOR_TIERS = [
  [[6, 2, "kh"], [6, 17, "hk"], [7, 1, "kha"]], // palier 1 : des épaulières
  [[0, 8, "tttt"], [9, 6, "yyyyyyyy"]], // palier 2 : une crête lumineuse, une ceinture dorée
  [[6, 1, "yk"], [6, 18, "ky"], [2, 3, "y"], [2, 16, "y"]], // palier 3 : de l'or sur les épaules et le casque
];
const SPEED_TIERS = [
  [[16, 6, "tt"], [16, 13, "tt"]],
  [[17, 6, "t"], [17, 14, "t"], [16, 5, "t"], [16, 15, "t"]],
  [[16, 4, "t"], [16, 16, "t"], [17, 5, "tt"], [17, 13, "tt"]],
];
const WEAPON_TIERS = [null, "#35c8ff", "#ffd23f", "#ff7ad9"]; // cyan, or, rose néon
const hero = (pal, patches, weaponLetters) => {
  const full = Object.assign({ k: "#07070c" }, pal);
  const upper = mirrorRows(HERO_BODY.map((r) => ".." + r));
  const legs = (L) => L.map((r) => ".." + r + "..");
  const blank = ["....................", "...................."]; // deux lignes libres sous les pieds, pour les propulseurs
  const frames = [HERO_LEGS_A, HERO_LEGS_B].map((L) => patchRows(upper.concat(legs(L)), patches).concat(blank));
  const art = { pal: full, s: 1, frames };
  // look : trois chiffres 0 à 3, armure, arme, propulseurs
  art.look = (frame, look) => {
    const [ar, we, sp] = look.split("").map(Number);
    const rows = patchRows(frames[frame], [].concat(...ARMOR_TIERS.slice(0, ar), ...SPEED_TIERS.slice(0, sp)));
    const p = Object.assign({}, full);
    if (ar) { p.h = lighten(full.h, 0.08 * ar); p.a = lighten(full.a, 0.08 * ar); }
    if (we) weaponLetters.forEach((ch) => { p[ch] = WEAPON_TIERS[we]; });
    return { rows, pal: p };
  };
  return art;
};

Object.assign(ART, {
  // Volt, le hacker : une capuche indigo, une visière cyan, un petit pistolet
  hero_volt: hero(
    { h: "#222a52", a: "#3c4c90", t: "#2ef2ff", v: "#2ef2ff", s: "#0f1328", b: "#6ec6ff", l: "#8aa0ff", d: "#161a36", c: "#2ef2ff" },
    [[8, 16, "kccc"], [9, 16, "kdk."]],
    ["c"]
  ),
  // Chrome, le samouraï cyborg : un corps chromé, une lueur rose, un katana dressé
  hero_chrome: hero(
    { h: "#aeb6c8", a: "#d9deea", t: "#ff3d7f", v: "#ff3d7f", s: "#4b5266", b: "#2c3140", l: "#f4f6ff", d: "#6b7288", y: "#e8b83a" },
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => [r, 18, "lk"]).concat([[10, 17, "kyk"]]),
    ["l"]
  ),
  // Rig, le mécano : une combinaison orange, des lunettes jaunes, un gros blaster
  hero_rig: hero(
    { h: "#b5651d", a: "#e08a2e", t: "#ffd23f", v: "#ffd23f", s: "#4a2c10", b: "#2c1c0c", o: "#ff8a1f", d: "#5a5f6e", l: "#cfd3dc" },
    [[7, 16, "kkkk"], [8, 15, "koook"], [9, 15, "koook"], [10, 16, "kkkk"]],
    ["o"]
  ),
  // Ghost, l'infiltré : une cape vert sombre, une visière vert pâle, un fusil à pompe
  hero_ghost: hero(
    { h: "#2b3a36", a: "#41594f", t: "#7dffb0", v: "#7dffb0", s: "#141c1a", b: "#0c1210", d: "#1e2a27", l: "#6f8f83" },
    [[9, 15, "klllk"], [10, 16, "kkkk"]],
    ["l"]
  ),
  // Arc, le tireur d'élite : une armure blanche, une visière cyan, un long fusil laser
  hero_arc: hero(
    { h: "#dfe6f2", a: "#9db4d8", t: "#35c8ff", v: "#35c8ff", s: "#4a5a78", b: "#2a3550", l: "#ffffff", d: "#6a7a98" },
    [[8, 14, "kllllk"], [9, 16, "kttk"]],
    ["l"]
  ),
  // Pulse, la pyromane : une armure rouge, une visière ambre, un lance-grenades
  hero_pulse: hero(
    { h: "#a3302a", a: "#d65a3a", t: "#ffb02e", v: "#ffb02e", s: "#4a1814", b: "#2a0e0c", y: "#ffd23f", o: "#ff8a1f", d: "#5a2a24", l: "#e8a08a" },
    [[7, 15, "kkkkk"], [8, 15, "kyyyk"], [9, 15, "kkkkk"]],
    ["y"]
  ),
  // Zap, l'électricien : une combinaison jaune, une visière bleue, des bobines sur les épaules
  hero_zap: hero(
    { h: "#e0c020", a: "#f4e060", t: "#7ad6ff", v: "#7ad6ff", s: "#6a5a10", b: "#2a2410", d: "#3a3a4a", l: "#ffffff" },
    [[3, 15, "ktk"], [4, 15, "kdk"], [5, 15, "kdk"], [3, 2, "ktk"], [4, 2, "kdk"], [5, 2, "kdk"]],
    ["t"]
  ),
});

// le dessin du personnage choisi (l'ancien, s'il n'existe pas)
const heroName = () => (ART["hero_" + best.char] ? "hero_" + best.char : "player");

// le look du moment, selon les boosts pris : armure (vie, armure, régénération), arme (puissance, cadence, portée, critique), propulseurs (vitesse)
const tierOf = (pts, th) => (pts >= th[2] ? 3 : pts >= th[1] ? 2 : pts >= th[0] ? 1 : 0);
const heroLook = () => {
  const l = (k) => lv[k] || 0;
  return "" + tierOf(l("heart") + l("armor") + l("regen"), [4, 10, 18]) + tierOf(l("dmg") + l("rate") + l("range") + l("crit"), [4, 10, 18]) + tierOf(l("speed"), [2, 5, 9]);
};

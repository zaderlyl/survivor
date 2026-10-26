"use strict";

/* ---------- Les looks des sept personnages ---------- */
// chaque personnage a son propre corps : la moitié gauche du haut du corps (le miroir à droite), puis les jambes en entier, deux poses
// h armure · a armure claire · t lueur · v visière · s ombre · b ceinture · k contour · d sombre · e lame ou canon clair · y or
// c, o, u : la couleur de l'arme du personnage

// pose des pixels à la main : [ligne, colonne, texte], le point ne change rien, ce qui sort du dessin est ignoré
const patchRows = (rows, patches) => rows.map((r, i) => {
  const cs = r.split("");
  patches.forEach((p) => { if (p[0] === i) p[2].split("").forEach((ch, j) => { const c = p[1] + j; if (ch !== "." && c >= 0 && c < cs.length) cs[c] = ch; }); });
  return cs.join("");
});

// les paliers : l'armure, l'arme et les propulseurs évoluent avec les boosts (voir heroLook)
const lighten = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.min(255, Math.round(v + (255 - v) * k));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, "0")).join("");
};
const WEAPON_TIERS = [null, "#35c8ff", "#ffd23f", "#ff7ad9"]; // cyan, or, rose néon
const firstDot = (r) => r.search(/[^.]/); // la première colonne dessinée d'une ligne

// def : pal, half (haut du corps), legsA, legsB, patches (arme), wl (lettres de l'arme), sh (ligne des épaules), hd (ligne de la tête)
const hero = (def) => {
  const full = Object.assign({ k: "#07070c", y: "#e8b83a", e: "#f4f6ff" }, def.pal);
  const upper = mirrorRows(def.half);
  const blank = [".".repeat(upper[0].length), ".".repeat(upper[0].length)]; // deux lignes libres sous les pieds, pour les propulseurs
  const frames = [def.legsA, def.legsB].map((L) => patchRows(upper.concat(L), def.patches || []).concat(blank));
  const art = { pal: full, s: 1, frames };
  // look : trois chiffres 0 à 3, armure, arme, propulseurs
  art.look = (frame, look) => {
    const [ar, we, sp] = look.split("").map(Number), rows = frames[frame], W = rows[0].length, H = rows.length - 2, patches = [];
    const p = Object.assign({}, full);
    if (ar >= 1) {
      // des épaulières, de chaque côté de l'épaule
      [def.sh, def.sh + 1].forEach((r) => { const c = firstDot(rows[r]); if (c >= 2) patches.push([r, c - 2, "kh"], [r, W - c, "hk"]); });
    }
    if (ar >= 2) {
      // une crête lumineuse au sommet du casque, une ceinture dorée
      const cr = rows.findIndex((r) => r[W / 2] !== ".");
      for (let c = W / 2 - 2; c < W / 2 + 2; c++) if (rows[cr][c] === "k") patches.push([cr, c, "t"]);
      p.b = "#e8b83a";
    }
    if (ar >= 3) {
      // de l'or aux épaules et sur les côtés du casque
      const c = firstDot(rows[def.sh]), hc = firstDot(rows[def.hd]);
      if (c >= 3) patches.push([def.sh, c - 3, "yk"], [def.sh, W - c + 1, "ky"]);
      if (hc >= 1) patches.push([def.hd, hc - 1, "y"], [def.hd, W - hc, "y"]);
    }
    if (ar) { p.h = lighten(full.h, 0.08 * ar); p.a = lighten(full.a, 0.08 * ar); }
    if (we) def.wl.forEach((ch) => { p[ch] = WEAPON_TIERS[we]; });
    if (sp) {
      // des lueurs sous chaque pied, de plus en plus grandes
      const last = rows[H - 1], runs = [];
      for (let i = 0; i < W; i++) if (last[i] !== "." && (i === 0 || last[i - 1] === ".")) { let j = i; while (j < W && last[j] !== ".") j++; runs.push((i + j - 1) / 2 | 0); }
      runs.forEach((m) => {
        patches.push([H, m - 1, sp === 1 ? "tt" : sp === 2 ? "tttt" : "tttttt"]);
        if (sp >= 2) patches.push([H + 1, m, "tt"]);
        if (sp >= 3) patches.push([H + 1, m - 1, "tttt"]);
      });
    }
    return { rows: patchRows(rows, patches), pal: p };
  };
  return art;
};

Object.assign(ART, {
  // Volt, le hacker : fin, une capuche pointue, une visière cyan, un petit pistolet
  hero_volt: hero({
    pal: { h: "#222a52", a: "#3c4c90", t: "#2ef2ff", v: "#2ef2ff", s: "#0f1328", b: "#6ec6ff", d: "#161a36", c: "#2ef2ff" },
    half: [
      "........kk",
      "......kkhh",
      ".....khhaa",
      "....khhaaa",
      "....khvvvv",
      "....khhssh",
      ".....kkhhh",
      "...kkhhhaa",
      "..khhhaatt",
      "..khhaattt",
      "..khhatttt",
      "..khhsbbbb",
      "...khhsaaa",
      "...kkhh...",
    ],
    legsA: ["....khhk....khhk....", "....khsk....khsk....", "....kssk....kssk....", "...kkssk....kkssk..."],
    legsB: [".....khhk..khhk.....", ".....khsk..khsk.....", ".....kssk..kssk.....", "....kkssk..kkssk...."],
    patches: [[10, 17, "kcc"], [11, 17, "kdk"]],
    wl: ["c"], sh: 7, hd: 4,
  }),
  // Chrome, le samouraï cyborg : large et blindé, un casque à crête, de grosses épaulières, un katana dressé
  hero_chrome: hero({
    pal: { h: "#aeb6c8", a: "#d9deea", t: "#ff3d7f", v: "#ff3d7f", s: "#4b5266", b: "#2c3140", l: "#f4f6ff", d: "#6b7288", e: "#f4f6ff" },
    half: [
      "..........kk",
      "..........kl",
      ".......kkkll",
      "......khhhaa",
      "......khhhaa",
      "......khvvvv",
      "......khhssh",
      ".......kkhhh",
      "..kkkkkhhhaa",
      ".kllllhhhhaa",
      "khhhhhhaaatt",
      "khhhhhaaaatt",
      ".khhhsattttt",
      ".khsbbbbbbbb",
      "..khhsaaaaaa",
      "...kkhhhhhhh",
    ],
    legsA: ["....khhhk......khhhk....", "....khhhk......khhhk....", "....kssk........kssk....", "...kkssk........kkssk..."],
    legsB: [".....khhhk....khhhk.....", ".....khhhk....khhhk.....", ".....kssk......kssk.....", "....kkssk......kkssk...."],
    patches: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((r) => [r, 22, "ek"]).concat([[9, 22, "yk"]]),
    wl: ["e"], sh: 8, hd: 5,
  }),
  // Rig, le mécano : trapu, une casquette, de gros bidons aux épaules, un énorme blaster
  hero_rig: hero({
    pal: { h: "#b5651d", a: "#e08a2e", t: "#ffd23f", v: "#ffd23f", s: "#4a2c10", b: "#2c1c0c", o: "#ff8a1f", d: "#5a5f6e" },
    half: [
      "....kkkkkkkk",
      "...khhhhhhhh",
      "..khhhhaaaaa",
      "..kkkkkkkkkk",
      "kkk.khvvvvvv",
      "kddkkhhsssss",
      "kddkkkhhhhhh",
      "kddkhhhhaaaa",
      "khhhhhhaaatt",
      "khhhhhaaattt",
      "khhhsaattttt",
      "khhsbbbbbbbb",
      "khhhhsaaaaaa",
      ".kkhhhhhhhhh",
    ],
    legsA: ["....khhhk......khhhk....", "....khssk......khssk....", "...kkssk........kkssk..."],
    legsB: [".....khhhk....khhhk.....", ".....khssk....khssk.....", "....kkssk......kkssk...."],
    patches: [[8, 19, "kkkkk"], [9, 18, "kooook"], [10, 18, "kooook"], [11, 19, "kkkkk"]],
    wl: ["o"], sh: 3, hd: 2,
  }),
  // Ghost, l'infiltré : tout en cape, une longue capuche, une visière vert pâle, un fusil à pompe
  hero_ghost: hero({
    pal: { h: "#2b3a36", a: "#41594f", t: "#7dffb0", v: "#7dffb0", s: "#141c1a", b: "#0c1210", d: "#1e2a27", e: "#a8c4b8" },
    half: [
      "......kkk",
      ".....khhh",
      "....khhaa",
      "...khhaaa",
      "...khssss",
      "...khsvvv",
      "...khssss",
      "....khhaa",
      "...khhhaa",
      "..khhhaaa",
      "..khhaaat",
      ".khhhaatt",
      ".khhaaatt",
      "khhhaaatt",
      "khhaaaaat",
      "khhhaaaaa",
      "kdhhhaaaa",
      "kkkkkkkkk",
    ],
    legsA: ["....kdk....kdk....", "....kkk....kkk...."],
    legsB: [".....kdk..kdk.....", ".....kkk..kkk....."],
    patches: [[10, 9, "keeeeeek"], [11, 11, "kek"]],
    wl: ["e"], sh: 9, hd: 5,
  }),
  // Arc, le tireur d'élite : grand et élancé, une antenne, une visière haute, un long fusil laser
  hero_arc: hero({
    pal: { h: "#dfe6f2", a: "#9db4d8", t: "#35c8ff", v: "#35c8ff", s: "#4a5a78", b: "#2a3550", d: "#6a7a98", e: "#ffffff" },
    half: [
      ".......k",
      ".......k",
      ".....khh",
      "....khaa",
      "....khvv",
      "....khvv",
      "....khhs",
      ".....khh",
      "....khaa",
      "...khhaa",
      "...khhat",
      "...khhat",
      "...khstt",
      "...khsbb",
      "...khhaa",
      "...khhaa",
      "....khhh",
      "....khss",
    ],
    legsA: ["....khk..khk....", "....khk..khk....", "....ksk..ksk....", "...kksk..kksk..."],
    legsB: ["...khk....khk...", "...khk....khk...", "...ksk....ksk...", "..kksk....kksk.."],
    patches: [[10, 9, "keeeeek"], [11, 12, "ktk"]],
    wl: ["e"], sh: 9, hd: 4,
  }),
  // Pulse, la pyromane : carrée, un casque plat à visière large, des épaules massives, un lance-grenades sur l'épaule
  hero_pulse: hero({
    pal: { h: "#a3302a", a: "#d65a3a", t: "#ffb02e", v: "#ffb02e", s: "#4a1814", b: "#2a0e0c", u: "#ffd23f", d: "#5a2a24" },
    half: [
      "......kkkkk",
      ".....khhhhh",
      ".....khaaaa",
      ".....khvvvv",
      ".....khhhhh",
      ".....kkkkkk",
      "..kkkhhhhhh",
      ".khhhhhaaaa",
      "khhhhhaaaaa",
      "khhhhaaattt",
      "khhsaattttt",
      "khhsbbbbbbb",
      "khhhhsaaaaa",
      ".kkhhhhhhhh",
    ],
    legsA: ["...khhhhk....khhhhk...", "...kssssk....kssssk...", "..kkssssk....kkssssk.."],
    legsB: ["....khhhhk..khhhhk....", "....kssssk..kssssk....", "...kkssssk..kkssssk..."],
    patches: [[4, 17, "kkkkk"], [5, 17, "kuuuk"], [6, 17, "kkkkk"]],
    wl: ["u"], sh: 6, hd: 3,
  }),
  // Zap, l'électricien : petit et carré, de hautes bobines de chaque côté de la tête
  hero_zap: hero({
    pal: { h: "#e0c020", a: "#f4e060", t: "#7ad6ff", v: "#7ad6ff", s: "#6a5a10", b: "#2a2410", d: "#3a3a4a" },
    half: [
      ".kt.....",
      ".kd.....",
      ".kd.kkkk",
      ".kd.khhh",
      ".kd.khaa",
      ".kdkkhvv",
      "..kkkhhs",
      "..khhhaa",
      ".khhhaat",
      ".khhaatt",
      ".khhsttt",
      ".khsbbbb",
      "..khhsaa",
      "...kkhhh",
    ],
    legsA: ["....khk..khk....", "....kdk..kdk....", "...kkdk..kkdk..."],
    legsB: ["...khk....khk...", "...kdk....kdk...", "..kkdk....kkdk.."],
    patches: [],
    wl: ["t"], sh: 7, hd: 4,
  }),
});

// le dessin du personnage choisi (l'ancien, s'il n'existe pas)
const heroName = () => (ART["hero_" + best.char] ? "hero_" + best.char : "player");

// le look du moment, selon les boosts pris : armure (vie, armure, régénération), arme (puissance, cadence, portée, critique), propulseurs (vitesse)
const tierOf = (pts, th) => (pts >= th[2] ? 3 : pts >= th[1] ? 2 : pts >= th[0] ? 1 : 0);
const heroLook = () => {
  const l = (k) => lv[k] || 0;
  return "" + tierOf(l("heart") + l("armor") + l("regen"), [4, 10, 18]) + tierOf(l("dmg") + l("rate") + l("range") + l("crit"), [4, 10, 18]) + tierOf(l("speed"), [2, 5, 9]);
};

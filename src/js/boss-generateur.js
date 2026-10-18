"use strict";

/* ---------- Le générateur de boss : à partir du monde 6, chaque boss est assemblé à partir d'une graine ---------- */
// la graine est le numéro du monde (ou du grand boss) : le boss d'un monde donné est toujours le même, dans le même ordre pour tout le monde.
// les règles de jouabilité sont dans genPlan : un plan qui les enfreint est refusé et regénéré avec la graine suivante.
const BRICK_COST = { ring: 2, fan: 2, burst: 2, pools: 2, summon: 2, charge: 2, teleport: 2, spiral: 3, follow: 3, mines: 3, shield: 3, laser: 4, wall: 4, clones: 4, sectors: 4, checker: 4, well: 4, echo: 4, pylons: 5 };
const isBig = (k) => BRICK_COST[k] >= 4;
const GEN_NOUNS = {
  laser: ["faucheur", "phare", "œil"], wall: ["rempart", "barrage"], follow: ["traqueur", "limier"], shield: ["bastion"], mines: ["démineur", "semeur"],
  clones: ["illusionniste", "mime"], sectors: ["découpeur", "juge"], pylons: ["réacteur", "nœud"], well: ["vortex", "gouffre"], echo: ["revenant", "écho"],
  checker: ["damier", "joueur"], ring: ["tourbillon"], spiral: ["hypnotiseur"], summon: ["essaim"], charge: ["bélier"], teleport: ["spectre"],
  burst: ["tireur"], fan: ["tireur"], pools: ["marteleur"],
};
const GEN_ADJ = ["rouillé", "spectral", "affamé", "glacial", "brûlant", "vorace", "sinistre", "fantôme", "cuivré", "fou", "hurlant", "silencieux", "ancien", "enragé", "cristallin", "maudit"];
const GEN_MINIONS = ["crawler", "brute", "shooter", "dasher", "splitter", "tank"];

const seedRng = (s) => {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let z = Math.imul(a ^ (a >>> 15), 1 | a);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
};

// les règles qu'un plan doit respecter pour rester jouable ; renvoie la liste des problèmes (vide si le plan est bon)
const planProblems = (plan, o) => {
  const bad = [];
  const dang = plan.phases.map((ph) => ph.atks.reduce((s, k) => s + BRICK_COST[k], 0));
  plan.phases.forEach((ph, i) => {
    if (ph.atks.length < 3 || ph.atks.length > 5) bad.push("phase " + i + " : " + ph.atks.length + " briques");
    if (!ph.atks.some((k) => BRICK_COST[k] <= 2)) bad.push("phase " + i + " : aucune brique de répit");
    for (let k = 1; k < ph.atks.length; k++) if (isBig(ph.atks[k]) && isBig(ph.atks[k - 1])) bad.push("phase " + i + " : deux grosses briques d'affilée");
    if (new Set(ph.atks).size !== ph.atks.length) bad.push("phase " + i + " : brique en double");
    if (i === 0 && !o.grand && ph.atks.some(isBig)) bad.push("phase 0 : grosse brique trop tôt");
    if (i > 0 && dang[i] < dang[i - 1] - 2) bad.push("phase " + i + " : plus facile que la précédente");
    if (ph.cd < 1.2 || ph.cd > 2.8) bad.push("phase " + i + " : rythme hors limites");
  });
  return bad;
};

const genPlan = (seed, o) => {
  let last = null;
  for (let tries = 0; tries < 40; tries++) {
    const r = seedRng(seed * 7919 + tries * 104729 + (o.grand ? 1 : 0));
    const pick = (a) => a[Math.floor(r() * a.length)];
    const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    const all = Object.keys(BRICK_COST).filter((k) => k !== "shield" && (o.grand || k !== "pylons"));
    const nPh = o.grand ? 4 + (r() < 0.5 ? 1 : 0) : o.w >= 15 ? 4 : 3;
    const ats = nPh === 3 ? [1, 0.66, 0.33] : nPh === 4 ? [1, 0.7, 0.4, 0.2] : [1, 0.75, 0.5, 0.3, 0.15];
    const sig = pick(all.filter(isBig)), rule = o.grand && r() < 0.3 ? "g3" : null, depth = Math.min(4, Math.floor(o.w / 10));
    let shielded = false;
    const phases = ats.map((at, p) => {
      const budget = 6 + 2.5 * p + depth, maxBig = p === 0 ? (o.grand ? 1 : 0) : 2, list = [];
      let cost = 0, bigs = 0;
      if (p > 0) { list.push(sig); cost += BRICK_COST[sig]; bigs++; }
      for (const k of shuffle(all)) {
        if (list.length >= 5 || (cost >= budget && list.length >= 3)) break;
        if (list.includes(k) || (isBig(k) && bigs >= maxBig)) continue;
        list.push(k); cost += BRICK_COST[k]; if (isBig(k)) bigs++;
      }
      if (p >= nPh - 2 && !shielded && list.length < 5) { list.push("shield"); shielded = true; }
      // les briques s'alternent : une petite entre deux grosses
      const S = list.filter((k) => !isBig(k)), B = list.filter(isBig), out = [];
      while (S.length || B.length) {
        const lastBig = out.length && isBig(out[out.length - 1]);
        if (B.length && !lastBig && out.length > 0) out.push(B.shift());
        else if (S.length) out.push(S.shift());
        else out.push(B.shift());
      }
      return { at, atks: out, cd: Math.max(1.2, Math.min(2.8, 2.6 - 0.22 * p - Math.min(0.5, o.w * 0.012))) };
    });
    const plan = {
      phases, sig, rule, gm: (o.grand ? 1 : 0.9) + r() * 0.3, minion: pick(GEN_MINIONS), base: Math.floor(r() * 5), hue: Math.round((seed * 137.5 + r() * 40) % 360),
      name: undefined,
    };
    const noun = pick(GEN_NOUNS[sig]);
    plan.name = (/^[aeiouhéèœ]/.test(noun) ? "l'" : "le ") + noun + " " + pick(GEN_ADJ);
    last = plan;
    if (!planProblems(plan, o).length) return plan;
  }
  return last;
};

// un boss de monde 6 et plus : un plan à graine, un dessin teinté, des briques assemblées
const genCache = {};
const makeGenerated = (e, grand) => {
  const g = (world + 1) / 5, seed = grand ? g : world, key = (grand ? "xg" : "xn") + seed;
  const plan = genCache[key] || (genCache[key] = genPlan(seed, { grand, w: world }));
  BOSS_PHASES[key] = plan.phases;
  const art = "boss" + key;
  if (!ART[art]) {
    const a = ART["boss" + plan.base], pal = {};
    for (const k in a.pal) pal[k] = hueShift(a.pal[k], plan.hue);
    ART[art] = { pal, s: grand ? 3 : a.s, frames: a.frames };
  }
  e.pk = key;
  e.art = art;
  e.gm = plan.gm;
  e.mi = plan.minion;
  e.gtick = plan.rule;
  if (grand) { e.grand = g; e.r = 40; e.hp = e.max = e.hp * 1.8; }
  return plan.name;
};

// appelé quand le boss d'un monde apparaît : renvoie le texte de la bannière, ou null pour le boss écrit à la main
const bossKind = (e) => {
  const grand = (world + 1) % 5 === 0;
  if (grand && (world + 1) / 5 <= 5) return "grand boss, " + makeGrand(e);
  if (grand) return "grand boss, " + makeGenerated(e, true);
  if (world >= 5) return "boss : " + makeGenerated(e, false);
  return null;
};

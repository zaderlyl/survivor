"use strict";

/* ---------- Le générateur de boss : à partir du monde 6, chaque boss est assemblé à partir d'une graine ---------- */
/*
  Principe :
  - la graine est le numéro du monde (ou du grand boss) : le boss d'un monde donné est toujours le même, pour tout le monde.
  - le générateur assemble des briques (voir boss.js, boss-briques.js, boss-grands.js) en phases, choisit un nom, une couleur,
    un type de renforts et une vitesse de tirs.
  - des règles de jouabilité (planProblems) vérifient chaque plan ; un plan refusé est regénéré avec une variante de la graine.
  Le résultat s'appelle un « plan » : { phases, sig, rule, gm, minion, base, hue, name }.
*/

// le « danger » de chaque brique : 2 = légère, 3 = moyenne, 4 et plus = grosse (voir isBig)
const BRICK_COST = {
  ring: 2, fan: 2, burst: 2, pools: 2, summon: 2, charge: 2, teleport: 2,
  spiral: 3, follow: 3, mines: 3, shield: 3,
  laser: 4, wall: 4, clones: 4, sectors: 4, checker: 4, well: 4, echo: 4,
  pylons: 5,
};
const isBig = (brique) => BRICK_COST[brique] >= 4;

// pour nommer le boss : un nom lié à sa brique « signature », puis un adjectif au hasard
const GEN_NOUNS = {
  laser: ["faucheur", "phare", "œil"],
  wall: ["rempart", "barrage"],
  follow: ["traqueur", "limier"],
  shield: ["bastion"],
  mines: ["démineur", "semeur"],
  clones: ["illusionniste", "mime"],
  sectors: ["découpeur", "juge"],
  pylons: ["réacteur", "nœud"],
  well: ["vortex", "gouffre"],
  echo: ["revenant", "écho"],
  checker: ["damier", "joueur"],
  ring: ["tourbillon"],
  spiral: ["hypnotiseur"],
  summon: ["essaim"],
  charge: ["bélier"],
  teleport: ["spectre"],
  burst: ["tireur"],
  fan: ["tireur"],
  pools: ["marteleur"],
};
const GEN_ADJ = ["rouillé", "spectral", "affamé", "glacial", "brûlant", "vorace", "sinistre", "fantôme", "cuivré", "fou", "hurlant", "silencieux", "ancien", "enragé", "cristallin", "maudit"];
const GEN_MINIONS = ["crawler", "brute", "shooter", "dasher", "splitter", "tank"];

/* ---------- Un hasard à graine ---------- */
// renvoie une fonction qui donne des nombres entre 0 et 1, toujours les mêmes pour une même graine
const seedRng = (graine) => {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let z = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
};

/* ---------- Les règles de jouabilité ---------- */
// vérifie qu'un plan est jouable ; renvoie la liste des problèmes (vide si le plan est bon)
// options.grand = est-ce un grand boss ?
const planProblems = (plan, options) => {
  const problemes = [];
  const dangerParPhase = plan.phases.map((phase) => phase.atks.reduce((somme, brique) => somme + BRICK_COST[brique], 0));
  plan.phases.forEach((phase, i) => {
    const briques = phase.atks;
    if (briques.length < 3 || briques.length > 5) problemes.push("phase " + i + " : " + briques.length + " briques");
    if (!briques.some((brique) => BRICK_COST[brique] <= 2)) problemes.push("phase " + i + " : aucune brique de répit");
    for (let k = 1; k < briques.length; k++) {
      if (isBig(briques[k]) && isBig(briques[k - 1])) problemes.push("phase " + i + " : deux grosses briques d'affilée");
    }
    if (new Set(briques).size !== briques.length) problemes.push("phase " + i + " : brique en double");
    if (i === 0 && !options.grand && briques.some(isBig)) problemes.push("phase 0 : grosse brique trop tôt");
    if (i > 0 && dangerParPhase[i] < dangerParPhase[i - 1] - 2) problemes.push("phase " + i + " : plus facile que la précédente");
    if (phase.cd < 1.2 || phase.cd > 2.8) problemes.push("phase " + i + " : rythme hors limites");
  });
  return problemes;
};

/* ---------- Fabriquer un plan ---------- */
// graine = numéro du monde (ou du grand boss) · options = { grand: bool, w: numéro du monde en partant de 0 }
const genPlan = (graine, options) => {
  let dernierPlan = null;

  // on essaie jusqu'à 40 variantes de la graine, et on garde la première qui respecte les règles
  for (let essai = 0; essai < 40; essai++) {
    const hasard = seedRng(graine * 7919 + essai * 104729 + (options.grand ? 1 : 0));
    const choisir = (liste) => liste[Math.floor(hasard() * liste.length)];
    const melanger = (liste) => {
      const copie = liste.slice();
      for (let i = copie.length - 1; i > 0; i--) {
        const j = Math.floor(hasard() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
      }
      return copie;
    };

    // les briques possibles (le bouclier est ajouté à part ; les pylônes sont réservés aux grands boss)
    const briquesPossibles = Object.keys(BRICK_COST).filter((brique) => brique !== "shield" && (options.grand || brique !== "pylons"));

    // combien de phases, et à quels seuils de vie
    let nbPhases;
    if (options.grand) nbPhases = 4 + (hasard() < 0.5 ? 1 : 0);
    else nbPhases = options.w >= 15 ? 4 : 3;
    let seuils;
    if (nbPhases === 3) seuils = [1, 0.66, 0.33];
    else if (nbPhases === 4) seuils = [1, 0.7, 0.4, 0.2];
    else seuils = [1, 0.75, 0.5, 0.3, 0.15];

    // la brique « signature » : une grosse brique présente dans toutes les phases sauf la première
    const signature = choisir(briquesPossibles.filter(isBig));
    // un grand boss a parfois la règle d'arène de la gravité en plus
    const regleArene = options.grand && hasard() < 0.3 ? "g3" : null;
    // plus on avance dans les mondes, plus le « budget de danger » de chaque phase augmente (jusqu'à +4)
    const profondeur = Math.min(4, Math.floor(options.w / 10));

    let bouclierPlace = false;
    const phases = seuils.map((seuil, numeroPhase) => {
      const budget = 6 + 2.5 * numeroPhase + profondeur;
      const maxGrosses = numeroPhase === 0 ? (options.grand ? 1 : 0) : 2;
      const liste = [];
      let cout = 0;
      let nbGrosses = 0;

      if (numeroPhase > 0) {
        liste.push(signature);
        cout += BRICK_COST[signature];
        nbGrosses++;
      }
      // on ajoute des briques au hasard jusqu'à atteindre le budget (3 briques au moins, 5 au plus)
      for (const brique of melanger(briquesPossibles)) {
        if (liste.length >= 5 || (cout >= budget && liste.length >= 3)) break;
        if (liste.includes(brique) || (isBig(brique) && nbGrosses >= maxGrosses)) continue;
        liste.push(brique);
        cout += BRICK_COST[brique];
        if (isBig(brique)) nbGrosses++;
      }
      // le bouclier arrive une seule fois, dans l'une des deux dernières phases
      if (numeroPhase >= nbPhases - 2 && !bouclierPlace && liste.length < 5) {
        liste.push("shield");
        bouclierPlace = true;
      }

      // on alterne : une petite brique entre deux grosses
      const petites = liste.filter((brique) => !isBig(brique));
      const grosses = liste.filter(isBig);
      const ordre = [];
      while (petites.length || grosses.length) {
        const derniereEstGrosse = ordre.length && isBig(ordre[ordre.length - 1]);
        if (grosses.length && !derniereEstGrosse && ordre.length > 0) ordre.push(grosses.shift());
        else if (petites.length) ordre.push(petites.shift());
        else ordre.push(grosses.shift());
      }

      // le repos entre deux briques raccourcit à chaque phase et à chaque tranche de mondes
      const repos = Math.max(1.2, Math.min(2.8, 2.6 - 0.22 * numeroPhase - Math.min(0.5, options.w * 0.012)));
      return { at: seuil, atks: ordre, cd: repos };
    });

    // le reste du plan : vitesse des tirs, renforts, dessin de base, teinte (les tirages se font dans cet ordre)
    const plan = {
      phases,
      sig: signature,
      rule: regleArene,
      gm: (options.grand ? 1 : 0.9) + hasard() * 0.3,
      minion: choisir(GEN_MINIONS),
      base: Math.floor(hasard() * 5),
      hue: Math.round((graine * 137.5 + hasard() * 40) % 360),
      name: undefined,
    };
    const nom = choisir(GEN_NOUNS[signature]);
    const article = /^[aeiouhéèœ]/.test(nom) ? "l'" : "le ";
    plan.name = article + nom + " " + choisir(GEN_ADJ);

    dernierPlan = plan;
    if (!planProblems(plan, options).length) return plan;
  }
  return dernierPlan; // aucune variante parfaite : on garde la dernière
};

/* ---------- Faire d'un boss un boss généré ---------- */
const genCache = {}; // les plans déjà fabriqués (inutile de les refaire)

// grand = true pour un grand boss (mondes 30, 35...), false pour un boss normal (monde 6 et plus). Renvoie son nom.
const makeGenerated = (boss, grand) => {
  const numeroGrand = (world + 1) / 5;
  const graine = grand ? numeroGrand : world;
  const cle = (grand ? "xg" : "xn") + graine; // la clé de ses phases dans BOSS_PHASES
  const plan = genCache[cle] || (genCache[cle] = genPlan(graine, { grand, w: world }));
  BOSS_PHASES[cle] = plan.phases;

  // son dessin : le dessin de base, avec la teinte du plan
  const nomDessin = "boss" + cle;
  if (!ART[nomDessin]) {
    const base = ART["boss" + plan.base];
    const palette = {};
    for (const lettre in base.pal) palette[lettre] = hueShift(base.pal[lettre], plan.hue);
    ART[nomDessin] = { pal: palette, s: grand ? 3 : base.s, frames: base.frames };
  }

  boss.pk = cle;
  boss.art = nomDessin;
  boss.gm = plan.gm;
  boss.mi = plan.minion;
  boss.gtick = plan.rule;
  if (grand) {
    boss.grand = numeroGrand;
    boss.r = 40;
    boss.hp = boss.max = boss.hp * 1.8;
  }
  return plan.name;
};

/* ---------- Quel boss pour ce monde ? ---------- */
// appelée quand le boss d'un monde apparaît. Renvoie le texte de la bannière, ou null pour un boss écrit à la main (mondes 1 à 4).
//   mondes 1 à 4 : boss écrits à la main · 5, 10, 15, 20, 25 : grands boss écrits à la main
//   mondes 6 et plus : boss générés · 30, 35... : grands boss générés
const bossKind = (boss) => {
  const estUnGrandBoss = (world + 1) % 5 === 0;
  if (estUnGrandBoss && (world + 1) / 5 <= 5) return "grand boss, " + makeGrand(boss);
  if (estUnGrandBoss) return "grand boss, " + makeGenerated(boss, true);
  if (world >= 5) return "boss : " + makeGenerated(boss, false);
  return null;
};

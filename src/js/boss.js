"use strict";

/* ---------- Les boss ---------- */
/*
  Comment ça marche, en bref :
  - un boss est une liste de PHASES ; chaque phase est une liste de BRIQUES (des attaques) qu'il enchaîne dans l'ordre.
  - les briques sont des fonctions rangées dans BOSS_BRICKS (ici les anciennes, dans boss-briques.js les nouvelles).
  - bossAI() est appelée à chaque image pour chaque boss : elle décide s'il bouge, s'il change de phase, s'il lance une brique.

  La fiche d'un boss (les champs de l'objet « boss » qu'on lit ou écrit ici et dans les autres fichiers) :
    bk        numéro du boss écrit à la main (0 à 4), utilisé pour ses renforts
    pk        clé de ses phases dans BOSS_PHASES (un nombre, ou "g1", "xn5"...)
    ph        phase en cours (0 = la première)
    ai        combien de briques il a déjà lancées (sert à choisir la suivante)
    cd        secondes avant sa prochaine brique
    mode      "walk" marche · "windup" prépare une charge · "dash" charge · "tp" se téléporte · "busy" occupé (ne bouge pas)
    mt        secondes restantes dans le mode en cours
    tele      signal visuel à dessiner : 0 rien, 1 ligne de charge, 2 cercle de téléportation
    invT      secondes d'invulnérabilité restantes (changement de phase)
    shield    points de bouclier restants (0 = pas de bouclier) · shT : secondes avant qu'il éclate
    spiral    secondes restantes d'une spirale de tirs · sc : délai entre deux tirs · sa : angle courant
    grand     numéro du grand boss (1 à 5 écrits à la main, 6 et plus générés), absent pour un boss normal
    gm        vitesse des tirs (1 = normale) · mi : type de renforts · gtick : règle d'arène du grand boss
    lastBrick nom de la dernière brique lancée (sert aux tests)
*/

const BOSS_NAMES = ["chef de gang", "abomination", "machine", "ia corrompue", "pdg augmenté"];

// les briques de chacun des 5 premiers boss, dans l'ordre (utilisé seulement si le boss n'a pas de phases à lui)
const BOSS_ATKS = [
  ["ring", "charge", "summon"],
  ["fan", "pools", "summon"],
  ["burst", "pound", "charge"],
  ["spiral", "teleport", "summon"],
  ["ring", "spiral", "charge", "pound"],
];

// Les phases : une seule barre de vie, mais à chaque seuil le boss change de briques.
//   at  = part de vie à partir de laquelle on entre dans la phase (1 = tout de suite, 0.5 = sous la moitié)
//   atks = les briques de la phase     cd = secondes de repos entre deux briques
// Sans entrée dans BOSS_PHASES, un boss a deux phases : ses briques, puis les mêmes plus vite sous la moitié de sa vie.
const BOSS_PHASES = {};
const bossPhases = (cle) => BOSS_PHASES[cle] || [
  { at: 1, atks: BOSS_ATKS[cle], cd: 2.6 },
  { at: 0.5, atks: BOSS_ATKS[cle], cd: 1.7 },
];

// le type de renforts que chaque boss appelle avec la brique « summon »
const BOSS_MINIONS = ["crawler", "crawler", "brute", "splitter", "brute"];

// vitesse des tirs du boss en cours (1 = normale ; un boss généré peut tirer plus ou moins vite)
let BOSS_GM = 1;

// un tir du boss : part de (x, y) dans la direction de l'angle, à la vitesse donnée
const bossBullet = (x, y, angle, vitesse) => {
  ebullets.push({
    x,
    y,
    vx: Math.cos(angle) * vitesse * BOSS_GM,
    vy: Math.sin(angle) * vitesse * BOSS_GM,
    life: 4,
    dmg: 10 * dm.dmg,
  });
};

// une zone rose au sol : elle se remplit pendant `delai` secondes puis claque
const bossZone = (x, y, delai) => {
  zones.push({
    x: clamp(x, 40, ARENA_W - 40),
    y: clamp(y, 40, ARENA_H - 40),
    r: 50,
    t: delai,
    max: delai,
    dmg: 14 * dm.dmg,
    fired: false,
    boom: 0,
  });
};

/* ---------- Les briques de départ ---------- */
// Chaque brique est une fonction (boss, ctx).
// ctx contient : dx, dy = direction vers le joueur · d = distance · enr = le boss est dans une phase avancée · lvl = niveau de la phase (0 à 3)
const BOSS_BRICKS = {
  // un anneau de tirs tout autour du boss
  ring(boss, ctx) {
    const nbTirs = ctx.enr ? 20 : 14;
    for (let k = 0; k < nbTirs; k++) {
      bossBullet(boss.x, boss.y, (k / nbTirs) * 6.283 + t, 170);
    }
  },

  // un éventail de tirs dans la direction du joueur
  fan(boss, ctx) {
    const nbTirs = ctx.enr ? 9 : 5;
    const angleVersJoueur = Math.atan2(ctx.dy, ctx.dx);
    for (let k = 0; k < nbTirs; k++) {
      const decalage = (k - (nbTirs - 1) / 2) * 0.22;
      bossBullet(boss.x, boss.y, angleVersJoueur + decalage, 230);
    }
  },

  // trois salves de trois tirs, l'une après l'autre (visées à chaque salve)
  burst(boss) {
    for (let salve = 0; salve < 3; salve++) {
      fx.push({
        k: "flash", x: boss.x, y: boss.y, life: salve * 0.25, t: 0.1,
        onEnd: () => {
          const angleVersJoueur = Math.atan2(P.y - boss.y, P.x - boss.x);
          for (let k = -1; k <= 1; k++) {
            bossBullet(boss.x, boss.y, angleVersJoueur + k * 0.18, 250);
          }
        },
      });
    }
  },

  // des zones qui claquent autour du joueur, une après l'autre
  pools(boss, ctx) {
    const nbZones = ctx.enr ? 11 : 7;
    for (let k = 0; k < nbZones; k++) {
      const angle = rnd(0, 6.283);
      const rayon = rnd(30, 220);
      bossZone(P.x + Math.cos(angle) * rayon, P.y + Math.sin(angle) * rayon, 1 + k * 0.14);
    }
  },

  // appelle des renforts autour du boss
  summon(boss, ctx) {
    const nbRenforts = ctx.enr ? 6 : 4;
    for (let k = 0; k < nbRenforts; k++) {
      spawn(boss.mi || BOSS_MINIONS[boss.bk], boss.x + rnd(-40, 40), boss.y + rnd(-40, 40));
    }
  },

  // se prépare 0,7 s (une ligne rose montre la direction), puis fonce
  charge(boss, ctx) {
    boss.dirx = ctx.dx / ctx.d;
    boss.diry = ctx.dy / ctx.d;
    boss.dashSp = boss.bk === 2 ? 330 : 480;
    boss.mode = "windup";
    boss.mt = 0.7;
  },

  // tire en spirale pendant quelques secondes (le tir lui-même est dans bossAI)
  spiral(boss, ctx) {
    boss.spiral = ctx.enr ? 4 : 3;
    boss.sc = 0;
    boss.sa = rnd(0, 6.283);
  },

  // disparaît 0,6 s (un cercle se resserre), puis réapparaît près du joueur
  teleport(boss) {
    boss.mode = "tp";
    boss.mt = 0.6;
  },
};
BOSS_BRICKS.pound = BOSS_BRICKS.pools; // « pound » est le même effet que « pools »

/* ---------- Le cerveau du boss ---------- */
// Appelée à chaque image pour chaque boss. dx, dy = direction vers le joueur · d = distance.
// Renvoie le mouvement voulu : { mx, my } = direction, { sp } = vitesse.
const bossAI = (boss, dt, dx, dy, d) => {
  // 1) première image : on remplit la fiche du boss
  if (boss.bk === undefined) {
    boss.bk = world % 5;
    boss.ai = 0;
    boss.cd = 2;
    boss.mode = "walk";
    boss.mt = 0;
    boss.spiral = 0;
    boss.sc = 0;
    boss.sa = 0;
    boss.tele = 0;
    boss.ph = 0;
    boss.invT = 0;
    if (boss.pk === undefined) boss.pk = boss.bk;
  }
  const phases = bossPhases(boss.pk);

  // 2) règles propres au grand boss : des pylônes vivants le rendent intouchable, et il peut avoir une règle d'arène permanente
  boss.bindN = boss.grand ? enemies.reduce((n, q) => n + (q.pylon && q.hp > 0 ? 1 : 0), 0) : 0;
  BOSS_GM = boss.gm || 1;
  const regleArene = GRAND_TICK[boss.gtick || boss.pk];
  if (boss.grand && regleArene) regleArene(boss, dt);

  // 3) par défaut le boss marche vers le joueur
  let mx = dx / d;
  let my = dy / d;
  let sp = boss.sp;
  boss.mt -= dt;
  boss.tele = 0;

  // 4) pendant un changement de phase il est invulnérable et ne fait rien
  if (boss.invT > 0) {
    boss.invT -= dt;
    return { mx: 0, my: 0, sp: 0 };
  }

  // 5) a-t-il assez perdu de vie pour entrer dans la phase suivante ?
  const phaseSuivante = phases[boss.ph + 1];
  if (phaseSuivante && boss.hp <= boss.max * phaseSuivante.at) {
    boss.ph++;
    boss.invT = 1.3;
    boss.mode = "walk";
    boss.spiral = 0;
    boss.ai = 0;
    boss.cd = 1.5;
    ebullets.length = 0; // les tirs en vol disparaissent
    shake = Math.max(shake, 14);
    SFX.boss();
    ringFx(boss.x, boss.y, PINK, 260, 0.6);
    ringFx(boss.x, boss.y, "#ffffff", 140, 0.4);
    burst(boss.x, boss.y, 30, PINK, 320);
    banner("phase " + (boss.ph + 1));
    return { mx: 0, my: 0, sp: 0 };
  }
  const phaseActuelle = phases[boss.ph];
  const briques = phaseActuelle.atks;
  const enr = boss.ph > 0; // « enragé » : dans une phase avancée, tout est plus intense

  // 6) la spirale de tirs, si elle est en cours
  if (boss.spiral > 0) {
    boss.spiral -= dt;
    boss.sc -= dt;
    if (boss.sc <= 0) {
      boss.sc = enr ? 0.07 : 0.1;
      boss.sa += 0.45;
      bossBullet(boss.x, boss.y, boss.sa, 190);
      bossBullet(boss.x, boss.y, boss.sa + Math.PI, 190);
    }
  }

  // 7) le bouclier tient 9 s, puis il éclate en un anneau de tirs
  if (boss.shield > 0) {
    boss.shT -= dt;
    if (boss.shT <= 0) {
      boss.shield = 0;
      for (let k = 0; k < 20; k++) bossBullet(boss.x, boss.y, (k / 20) * 6.283, 160);
    }
  }

  // 8) ce que fait le boss selon son mode
  if (boss.mode === "busy") {
    // occupé (laser, mur...) : il ne bouge pas jusqu'à la fin
    sp = 0;
    if (boss.mt <= 0) boss.mode = "walk";
  } else if (boss.mode === "windup") {
    // prépare sa charge : immobile, avec une ligne rose
    sp = 0;
    boss.tele = 1;
    if (boss.mt <= 0) {
      boss.mode = "dash";
      boss.mt = 0.5;
    }
  } else if (boss.mode === "dash") {
    // fonce tout droit
    mx = boss.dirx;
    my = boss.diry;
    sp = boss.dashSp;
    if (boss.mt <= 0) boss.mode = "walk";
  } else if (boss.mode === "tp") {
    // se téléporte : immobile avec un cercle, puis apparaît près du joueur en lâchant un anneau de tirs
    sp = 0;
    boss.tele = 2;
    if (boss.mt <= 0) {
      const angle = rnd(0, 6.283);
      boss.x = clamp(P.x + Math.cos(angle) * 170, boss.r, ARENA_W - boss.r);
      boss.y = clamp(P.y + Math.sin(angle) * 170, boss.r, ARENA_H - boss.r);
      boss.mode = "walk";
      for (let k = 0; k < 14; k++) bossBullet(boss.x, boss.y, (k / 14) * 6.283, 170);
    }
  } else {
    // marche : quand le repos est fini, il lance la brique suivante de sa phase
    boss.cd -= dt;
    if (boss.cd <= 0) {
      boss.cd = phaseActuelle.cd;
      boss.lastBrick = briques[boss.ai++ % briques.length];
      BOSS_BRICKS[boss.lastBrick](boss, { dx, dy, d, enr, lvl: Math.min(3, boss.ph) });
    }
  }
  return { mx, my, sp };
};

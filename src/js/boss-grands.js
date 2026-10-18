"use strict";

/* ---------- Les grands boss : un tous les 5 mondes, chacun avec sa règle d'arène ---------- */
/*
  Monde 5  : le PDG          (secteurs : le sol se découpe en parts mortelles)
  Monde 10 : le réacteur     (pylônes : intouchable tant qu'ils vivent)
  Monde 15 : la singularité  (gravité : elle t'attire sans cesse)
  Monde 20 : chronos         (échos : des zones claquent là où tu étais)
  Monde 25 : le rival        (damier : une couleur du sol claque, puis l'autre)
  Les grands boss suivants (mondes 30, 35...) sont créés par boss-generateur.js.
*/

const GRAND_NAMES = ["le pdg : licenciements", "le réacteur : pylônes", "la singularité : gravité", "chronos : échos", "le rival : damier"];

// pour chaque grand boss : le dessin de départ, et de combien on tourne sa teinte (en degrés) pour le distinguer
const GRAND_ART = [["boss4", 0], ["boss2", 120], ["boss3", 200], ["boss1", 270], ["boss0", 330]];

/* ---------- Changer la teinte d'une couleur ---------- */
// prend une couleur "#rrggbb" et tourne sa teinte de `degres` (0 = identique, 180 = couleur opposée)
const hueShift = (couleurHex, degres) => {
  if (!/^#[0-9a-f]{6}$/i.test(couleurHex)) return couleurHex; // autre format : on ne touche pas

  // 1) rouge, vert, bleu entre 0 et 1
  const rouge = parseInt(couleurHex.slice(1, 3), 16) / 255;
  const vert = parseInt(couleurHex.slice(3, 5), 16) / 255;
  const bleu = parseInt(couleurHex.slice(5, 7), 16) / 255;

  // 2) on passe en teinte / saturation / luminosité
  const maxi = Math.max(rouge, vert, bleu);
  const mini = Math.min(rouge, vert, bleu);
  const luminosite = (maxi + mini) / 2;
  const ecart = maxi - mini;
  let teinte = 0;
  let saturation = 0;
  if (ecart) {
    saturation = ecart / (1 - Math.abs(2 * luminosite - 1));
    if (maxi === rouge) teinte = ((vert - bleu) / ecart) % 6;
    else if (maxi === vert) teinte = (bleu - rouge) / ecart + 2;
    else teinte = (rouge - vert) / ecart + 4;
    teinte = ((teinte * 60 + degres) % 360 + 360) % 360; // on tourne la teinte
  }

  // 3) on revient en rouge / vert / bleu
  const chroma = (1 - Math.abs(2 * luminosite - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((teinte / 60) % 2) - 1));
  const decalage = luminosite - chroma / 2;
  let rgb;
  if (teinte < 60) rgb = [chroma, x, 0];
  else if (teinte < 120) rgb = [x, chroma, 0];
  else if (teinte < 180) rgb = [0, chroma, x];
  else if (teinte < 240) rgb = [0, x, chroma];
  else if (teinte < 300) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];
  const enHexa = (valeur) => Math.round((valeur + decalage) * 255).toString(16).padStart(2, "0");
  return "#" + enHexa(rgb[0]) + enHexa(rgb[1]) + enHexa(rgb[2]);
};

// crée les 5 dessins des grands boss (bossG1 à bossG5) : le dessin de base, teinte tournée, en plus grand (échelle 3)
GRAND_ART.forEach(([dessinDeBase, degres], i) => {
  const base = ART[dessinDeBase];
  const palette = {};
  for (const lettre in base.pal) palette[lettre] = hueShift(base.pal[lettre], degres);
  ART["bossG" + (i + 1)] = { pal: palette, s: 3, frames: base.frames };
});

/* ---------- Faire d'un boss un grand boss ---------- */
// appelée au monde 5, 10, 15, 20, 25 : plus gros, 1,8 fois plus de vie, un autre dessin. Renvoie son nom.
const makeGrand = (boss) => {
  const numero = (world + 1) / 5; // 1 pour le monde 5, 2 pour le monde 10...
  const index = (numero - 1) % 5;
  boss.grand = numero;
  boss.pk = "g" + (index + 1); // la clé de ses phases dans BOSS_PHASES
  boss.art = "bossG" + (index + 1);
  boss.r = 40;
  boss.hp = boss.max = boss.hp * 1.8;
  return GRAND_NAMES[index];
};

/* ---------- La règle d'arène permanente ---------- */
// Ce que fait un grand boss à chaque image, en plus de ses briques. La clé est celle de ses phases.
const GRAND_TICK = {
  // la singularité attire le joueur vers elle, de plus en plus fort selon la phase
  g3(boss, dt) {
    if (boss.invT > 0) return;
    const dx = boss.x - P.x;
    const dy = boss.y - P.y;
    const distance = Math.hypot(dx, dy) || 1;
    const force = 24 + 14 * boss.ph; // pixels par seconde
    if (distance > 70) {
      P.x = clamp(P.x + (dx / distance) * force * dt, 12, ARENA_W - 12);
      P.y = clamp(P.y + (dy / distance) * force * dt, 12, ARENA_H - 12);
    }
  },
};

/* ---------- Les briques propres aux grands boss ---------- */
Object.assign(BOSS_BRICKS, {
  // ---------- Secteurs (le PDG) ----------
  // Le sol autour du boss se découpe en 8 parts. Certaines deviennent mortelles après un signal jaune (≈ 2 s).
  // Il reste toujours une part saine voisine de la tienne, atteignable.
  sectors(boss, ctx) {
    const nbParts = 8;
    const centreX = boss.x;
    const centreY = boss.y;
    const angleDepart = rnd(0, 6.283);
    const largeurPart = 6.283 / nbParts;
    const nbMortelles = Math.min(6, 3 + ctx.lvl);
    const dureeSignal = 2.3 - 0.1 * ctx.lvl;

    // dans quelle part se trouve le point (x, y) ?
    const partDe = (x, y) => {
      const angle = Math.atan2(y - centreY, x - centreX) - angleDepart;
      return Math.floor((((angle % 6.283) + 6.283) % 6.283) / largeurPart);
    };

    // on tire au hasard quelles parts sont mortelles
    const ordre = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
    const mortelles = new Set(ordre.slice(0, nbMortelles));
    const partDuJoueur = partDe(P.x, P.y);

    // une part voisine est-elle atteignable (dans l'arène, à ta distance du boss) ?
    const atteignable = (part) => {
      const angleMilieu = angleDepart + (part + 0.5) * largeurPart;
      const distance = Math.max(60, Math.min(420, Math.hypot(P.x - centreX, P.y - centreY)));
      const x = centreX + Math.cos(angleMilieu) * distance;
      const y = centreY + Math.sin(angleMilieu) * distance;
      return x > 50 && y > 50 && x < ARENA_W - 50 && y < ARENA_H - 50;
    };
    const voisinesAuHasard = [(partDuJoueur + 1) % nbParts, (partDuJoueur + nbParts - 1) % nbParts].sort(() => Math.random() - 0.5);
    const voisineSaine = voisinesAuHasard.find(atteignable);
    if (voisineSaine !== undefined) mortelles.delete(voisineSaine);
    else mortelles.delete(partDuJoueur); // sinon c'est la part où tu te trouves qui reste saine

    boss.mode = "busy";
    boss.mt = dureeSignal + 0.3;

    hazard(dureeSignal + 0.5, {
      done: false, // les dégâts ont-ils déjà été infligés ?

      // pour le bot de test
      danger(effet, x, y) {
        return !effet.done && mortelles.has(partDe(x, y)) ? 1 : 0;
      },

      tick(effet) {
        if (effet.done || effet.t - effet.life < dureeSignal) return;
        effet.done = true;
        const dansUnePartMortelle = mortelles.has(partDe(P.x, P.y));
        if (dansUnePartMortelle && Math.hypot(P.x - centreX, P.y - centreY) < 1000) hurt(16 * dm.dmg);
        shake = Math.max(shake, 8);
        SFX.bomb();
      },

      draw(effet, toile) {
        const ecoule = effet.t - effet.life;
        const claque = ecoule >= dureeSignal;
        toile.fillStyle = claque ? PINK : WARN;
        toile.globalAlpha = claque ? 0.6 * Math.max(0, effet.life / 0.5) : 0.1 + 0.25 * (ecoule / dureeSignal);
        mortelles.forEach((part) => {
          toile.beginPath();
          toile.moveTo(centreX, centreY);
          toile.arc(centreX, centreY, 1000, angleDepart + part * largeurPart, angleDepart + (part + 1) * largeurPart);
          toile.closePath();
          toile.fill();
        });
        toile.globalAlpha = 1;
      },
    });
  },

  // ---------- Pylônes (le réacteur) ----------
  // Des pylônes apparaissent autour du boss, qui reste invulnérable tant qu'il en reste un (voir damage() dans partie.js).
  // Une seule fois par phase : sinon le boss resterait intouchable presque tout le combat.
  pylons(boss, ctx) {
    if (enemies.some((q) => q.pylon && q.hp > 0)) return; // il en reste déjà
    if (boss.pylPh === boss.ph) return BOSS_BRICKS.fan(boss, ctx); // déjà fait dans cette phase : un éventail à la place
    boss.pylPh = boss.ph;

    const nbPylones = Math.min(5, 2 + ctx.lvl);
    const angleDepart = rnd(0, 6.283);
    for (let k = 0; k < nbPylones; k++) {
      const angle = angleDepart + (k / nbPylones) * 6.283;
      const x = clamp(boss.x + Math.cos(angle) * 300, 40, ARENA_W - 40);
      const y = clamp(boss.y + Math.sin(angle) * 300, 40, ARENA_H - 40);
      spawn("tank", x, y, true);
      const pylone = enemies[enemies.length - 1];
      pylone.pylon = true; // le repère qui le distingue d'un ennemi normal
      pylone.sp = 0; // il ne bouge pas
      pylone.r = 14;
      pylone.hp = pylone.max = boss.max * 0.025;
    }
    banner("détruis les pylônes");
    ringFx(boss.x, boss.y, "#35f2ff", 160, 0.5);

    // l'effet qui dessine les liens boss-pylône tant qu'il en reste
    hazard(120, {
      tick(effet) {
        if (!enemies.some((q) => q.pylon && q.hp > 0)) effet.life = 0; // plus de pylône : l'effet s'arrête
      },
      draw(effet, toile) {
        toile.strokeStyle = "#35f2ff";
        toile.lineWidth = 2;
        enemies.forEach((pylone) => {
          if (!pylone.pylon || pylone.hp <= 0) return;
          toile.globalAlpha = 0.5 + 0.3 * Math.sin(t * 10);
          toile.beginPath();
          toile.moveTo(boss.x, boss.y);
          toile.lineTo(pylone.x, pylone.y);
          toile.stroke();
          toile.beginPath();
          toile.arc(pylone.x, pylone.y, pylone.r + 8, 0, 6.283);
          toile.stroke();
        });
        toile.globalAlpha = 1;
      },
    });
  },

  // ---------- Puits (la singularité) ----------
  // Un puits t'attire vers un cœur qui fait mal. Il n'attire qu'après 0,9 s (le temps de le voir).
  well(boss, ctx) {
    const angleDepart = rnd(0, 6.283);
    const nbPuits = ctx.lvl >= 2 ? 2 : 1;
    for (let k = 0; k < nbPuits; k++) {
      // le second puits se place de l'autre côté de toi
      const angle = angleDepart + k * (Math.PI + rnd(-0.5, 0.5));
      const distance = rnd(200, 320);
      const puitsX = clamp(P.x + Math.cos(angle) * distance, 80, ARENA_W - 80);
      const puitsY = clamp(P.y + Math.sin(angle) * distance, 80, ARENA_H - 80);
      const rayonAttraction = 260;

      hazard(7, {
        hc: 0, // délai avant de pouvoir blesser à nouveau

        // pour le bot de test : près du cœur, c'est dangereux
        danger(effet, x, y) {
          return Math.hypot(puitsX - x, puitsY - y) < 34 + P.r + 24 ? 1 : 0;
        },

        tick(effet, h) {
          if (effet.t - effet.life < 0.9) return; // pas encore actif
          effet.hc -= h;
          const distanceAuJoueur = Math.hypot(puitsX - P.x, puitsY - P.y);
          if (distanceAuJoueur < rayonAttraction && distanceAuJoueur > 4) {
            const force = 100 * (1 - distanceAuJoueur / rayonAttraction); // plus fort près du cœur
            P.x = clamp(P.x + ((puitsX - P.x) / distanceAuJoueur) * force * h, 12, ARENA_W - 12);
            P.y = clamp(P.y + ((puitsY - P.y) / distanceAuJoueur) * force * h, 12, ARENA_H - 12);
          }
          if (distanceAuJoueur < 34 + P.r && effet.hc <= 0) {
            hurt(12 * dm.dmg);
            effet.hc = 0.4;
          }
        },

        draw(effet, toile) {
          const actif = effet.t - effet.life >= 0.9;
          const fondu = Math.min(1, effet.life / 0.5); // il s'efface à la fin
          toile.globalAlpha = (actif ? 0.8 : 0.35) * fondu;
          toile.fillStyle = "#07051a";
          toile.beginPath();
          toile.arc(puitsX, puitsY, 34, 0, 6.283);
          toile.fill();
          // trois anneaux qui se resserrent vers le cœur
          toile.strokeStyle = actif ? PINK : WARN;
          toile.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            toile.beginPath();
            toile.arc(puitsX, puitsY, 50 + i * 60 - ((t * 60) % 60), 0, 6.283);
            toile.stroke();
          }
          toile.globalAlpha = 1;
        },
      });
    }
  },

  // ---------- Échos (chronos) ----------
  // Pendant quelques secondes, ta position est enregistrée ; 1,8 s plus tard une zone claque à l'endroit où tu étais.
  echo(boss, ctx) {
    const trace = []; // les positions passées du joueur
    hazard(5.5 + ctx.lvl, {
      rc: 0, // délai avant le prochain enregistrement
      tick(effet, h) {
        effet.rc -= h;
        if (effet.rc > 0) return;
        effet.rc = 0.12;
        trace.push({ x: P.x, y: P.y });
        if (trace.length > 15) {
          const ancienne = trace.shift(); // la position d'il y a 1,8 s
          bossZone(ancienne.x, ancienne.y, 0.55);
        }
      },
      draw(effet, toile) {
        // la traînée : des points jaunes qui s'effacent
        toile.fillStyle = WARN;
        trace.forEach((point, i) => {
          toile.globalAlpha = 0.5 * (1 - i / trace.length);
          toile.beginPath();
          toile.arc(point.x, point.y, 3, 0, 6.283);
          toile.fill();
        });
        toile.globalAlpha = 1;
      },
    });
  },

  // ---------- Damier (le rival) ----------
  // Le sol devient un damier. Une couleur (jaune d'abord) claque, puis l'autre, 3 ou 4 fois : il faut changer de case à chaque signal.
  checker(boss, ctx) {
    const tailleCase = 190;
    const nbChangements = ctx.lvl >= 2 ? 4 : 3;
    const dureeSignal = ctx.lvl >= 2 ? 1.1 : 1.3;
    const dureeEtape = dureeSignal + 0.45; // signal + claquement
    const couleurDepart = Math.random() < 0.5 ? 0 : 1; // 0 ou 1 : quelle couleur claque en premier
    const dejaClaque = {}; // étape -> true quand les dégâts ont été infligés

    boss.mode = "busy";
    boss.mt = dureeEtape;

    hazard(nbChangements * dureeEtape + 0.1, {
      // pour le bot de test : la couleur de la case est-elle celle qui claque ?
      danger(effet, x, y, dans) {
        const etape = Math.floor((effet.t - effet.life + dans) / dureeEtape);
        const couleurCase = (((Math.floor(x / tailleCase) + Math.floor(y / tailleCase)) % 2) + 2) % 2;
        return etape < nbChangements && couleurCase === (couleurDepart + etape) % 2 ? 1 : 0;
      },

      tick(effet) {
        const ecoule = effet.t - effet.life;
        const etape = Math.floor(ecoule / dureeEtape);
        if (etape >= nbChangements || ecoule - etape * dureeEtape < dureeSignal || dejaClaque[etape]) return;
        dejaClaque[etape] = true;
        const couleurQuiClaque = (couleurDepart + etape) % 2;
        const couleurDuJoueur = (Math.floor(P.x / tailleCase) + Math.floor(P.y / tailleCase)) % 2;
        if (couleurDuJoueur === couleurQuiClaque) hurt(15 * dm.dmg);
        SFX.bomb();
      },

      draw(effet, toile) {
        const ecoule = effet.t - effet.life;
        const etape = Math.floor(ecoule / dureeEtape);
        if (etape >= nbChangements) return;
        const dansEtape = ecoule - etape * dureeEtape;
        const claque = dansEtape >= dureeSignal;
        const couleurQuiClaque = (couleurDepart + etape) % 2;
        toile.fillStyle = claque ? PINK : WARN;
        toile.globalAlpha = claque ? 0.55 * Math.max(0, 1 - (dansEtape - dureeSignal) / 0.45) : 0.08 + 0.22 * (dansEtape / dureeSignal);
        // on ne dessine que les cases autour du joueur
        const caseMinX = Math.floor((P.x - 700) / tailleCase);
        const caseMaxX = Math.floor((P.x + 700) / tailleCase);
        const caseMinY = Math.floor((P.y - 500) / tailleCase);
        const caseMaxY = Math.floor((P.y + 500) / tailleCase);
        for (let cx = caseMinX; cx <= caseMaxX; cx++) {
          for (let cy = caseMinY; cy <= caseMaxY; cy++) {
            if ((((cx + cy) % 2) + 2) % 2 === couleurQuiClaque) {
              toile.fillRect(cx * tailleCase, cy * tailleCase, tailleCase, tailleCase);
            }
          }
        }
        toile.globalAlpha = 1;
      },
    });
  },
});

/* ---------- Les 4 phases de chaque grand boss ---------- */
// at = part de vie qui fait entrer dans la phase · atks = les briques, dans l'ordre · cd = repos entre deux attaques (secondes)
Object.assign(BOSS_PHASES, {
  g1: [
    { at: 1, atks: ["ring", "charge", "pound"], cd: 2.6 },
    { at: 0.75, atks: ["sectors", "summon", "spiral"], cd: 2.4 },
    { at: 0.5, atks: ["wall", "sectors", "laser"], cd: 2.2 },
    { at: 0.25, atks: ["shield", "sectors", "mines", "laser", "charge"], cd: 1.8 },
  ],
  g2: [
    { at: 1, atks: ["ring", "fan", "summon"], cd: 2.6 },
    { at: 0.7, atks: ["pylons", "spiral", "fan"], cd: 2.3 },
    { at: 0.4, atks: ["pylons", "laser", "mines", "ring"], cd: 2.0 },
    { at: 0.2, atks: ["pylons", "laser", "wall", "shield"], cd: 1.7 },
  ],
  g3: [
    { at: 1, atks: ["well", "ring", "charge"], cd: 2.6 },
    { at: 0.7, atks: ["well", "follow", "spiral"], cd: 2.3 },
    { at: 0.4, atks: ["well", "laser", "clones"], cd: 2.0 },
    { at: 0.2, atks: ["well", "mines", "wall", "shield"], cd: 1.7 },
  ],
  g4: [
    { at: 1, atks: ["echo", "burst", "pound"], cd: 2.6 },
    { at: 0.7, atks: ["echo", "clones", "wall"], cd: 2.3 },
    { at: 0.4, atks: ["echo", "laser", "follow"], cd: 2.0 },
    { at: 0.2, atks: ["echo", "shield", "mines", "spiral"], cd: 1.7 },
  ],
  g5: [
    { at: 1, atks: ["checker", "fan", "charge"], cd: 2.6 },
    { at: 0.7, atks: ["checker", "laser", "wall"], cd: 2.3 },
    { at: 0.4, atks: ["checker", "clones", "follow", "mines"], cd: 2.0 },
    { at: 0.2, atks: ["checker", "shield", "laser", "wall", "spiral"], cd: 1.7 },
  ],
});

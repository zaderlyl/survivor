"use strict";

/* ---------- Les briques de boss : laser, mur, zones qui suivent, bouclier, mines, clones ---------- */
/*
  Une brique = une fonction (boss, ctx), rangée dans BOSS_BRICKS (voir boss.js).
  Règle d'or : chaque brique ANNONCE son danger (ligne, marque, cercle) avant de faire mal,
  pour qu'on puisse toujours lire puis esquiver.

  Beaucoup de briques utilisent un « piège » (hazard) : un effet qui vit un moment et qui a quatre parties :
    tick(effet, h)     appelée à chaque image : fait avancer le piège et inflige les dégâts
    draw(effet, toile) dessine le piège (toile = le canvas du jeu)
    onEnd()            appelée à la toute fin du piège
    danger(...)        optionnelle : dit au bot de test si un point est dangereux (le jeu ne s'en sert jamais)
  Dans un piège, effet.t = sa durée totale, effet.life = ce qu'il lui reste ; le temps écoulé vaut donc effet.t - effet.life.
*/

// crée un piège qui dure `duree` secondes ; `parties` contient tick / draw / onEnd / danger
const hazard = (duree, parties) => {
  fx.push(Object.assign({ k: "bhaz", life: duree, t: duree }, parties));
};

// couleur des signaux d'avertissement (jaune)
const WARN = "#ffd23f";

Object.assign(BOSS_BRICKS, {
  // ---------- Laser ----------
  // Un laser verrouille ta direction (ligne jaune pointillée 1 s), puis balaie lentement l'écran.
  // À la phase 3, il y en a deux, opposés.
  laser(boss, ctx) {
    const angleDepart = Math.atan2(ctx.dy, ctx.dx);
    const sens = Math.random() < 0.5 ? 1 : -1;
    const dureeSignal = 1.0;
    const dureeBalayage = ctx.lvl >= 1 ? 2.2 : 2.6;
    const largeurBalayage = ctx.lvl >= 1 ? 1.3 : 1.0; // en radians
    const decalagesFaisceaux = ctx.lvl >= 2 ? [0, Math.PI] : [0]; // un faisceau, ou deux opposés
    const angleInitial = angleDepart - (sens * largeurBalayage) / 2;
    const vitesseAngulaire = sens * (largeurBalayage / dureeBalayage);

    boss.mode = "busy";
    boss.mt = dureeSignal + dureeBalayage;

    hazard(dureeSignal + dureeBalayage, {
      ox: boss.x, oy: boss.y, // d'où part le laser (le boss ne bouge plus)
      ang: angleInitial, // angle actuel
      ang0: angleInitial, // angle de départ (pour le bot de test)
      hc: 0, // délai avant de pouvoir blesser à nouveau

      // pour le bot de test : y aura-t-il le laser en (x, y) dans `dans` secondes ?
      danger(effet, x, y, dans) {
        const ecoule = effet.t - effet.life + dans;
        if (ecoule < dureeSignal - 0.3 || ecoule > dureeSignal + dureeBalayage) return 0;
        const angle = effet.ang0 + vitesseAngulaire * Math.max(0, ecoule - dureeSignal);
        const touche = decalagesFaisceaux.some((decalage) => {
          const cosA = Math.cos(angle + decalage);
          const sinA = Math.sin(angle + decalage);
          const dx = x - effet.ox;
          const dy = y - effet.oy;
          const devant = dx * cosA + dy * sinA > 0;
          const distanceALaLigne = Math.abs(-dx * sinA + dy * cosA);
          return devant && distanceALaLigne < 9 + P.r + 14;
        });
        return touche ? 1 : 0;
      },

      tick(effet, h) {
        const ecoule = effet.t - effet.life;
        effet.hc -= h;
        if (ecoule <= dureeSignal) return; // le signal : pas encore de dégâts
        effet.ang += vitesseAngulaire * h;
        decalagesFaisceaux.forEach((decalage) => {
          const cosA = Math.cos(effet.ang + decalage);
          const sinA = Math.sin(effet.ang + decalage);
          const dx = P.x - effet.ox;
          const dy = P.y - effet.oy;
          const devant = dx * cosA + dy * sinA > 0;
          const distanceALaLigne = Math.abs(-dx * sinA + dy * cosA);
          if (devant && distanceALaLigne < 9 + P.r && effet.hc <= 0) {
            hurt(12 * dm.dmg);
            effet.hc = 0.35;
          }
        });
      },

      draw(effet, toile) {
        const ecoule = effet.t - effet.life;
        decalagesFaisceaux.forEach((decalage) => {
          const cosA = Math.cos(effet.ang + decalage);
          const sinA = Math.sin(effet.ang + decalage);
          toile.beginPath();
          toile.moveTo(effet.ox, effet.oy);
          toile.lineTo(effet.ox + cosA * 1400, effet.oy + sinA * 1400);
          if (ecoule <= dureeSignal) {
            // le signal : une ligne jaune pointillée qui devient plus visible
            toile.strokeStyle = WARN;
            toile.globalAlpha = 0.3 + 0.5 * (ecoule / dureeSignal);
            toile.lineWidth = 2;
            toile.setLineDash([10, 8]);
            toile.stroke();
            toile.setLineDash([]);
          } else {
            // le laser : un trait rose épais avec un cœur blanc
            toile.globalCompositeOperation = "lighter";
            toile.strokeStyle = PINK;
            toile.lineWidth = 20;
            toile.stroke();
            toile.strokeStyle = "#ffffff";
            toile.lineWidth = 6;
            toile.stroke();
            toile.globalCompositeOperation = "source-over";
          }
        });
        toile.globalAlpha = 1;
      },
    });
  },

  // ---------- Mur de tirs ----------
  // Un mur de tirs avance vers toi, avec une brèche (en cyan, marquée 0,9 s avant le départ) : il faut se placer dans le trou.
  // À la phase 3, un second mur suit, une fois le premier passé.
  wall(boss, ctx) {
    const nbMurs = ctx.lvl >= 2 ? 2 : 1;

    // lance un mur ; numero = 0 pour le premier ; brecheMurPrecedent = position de la brèche du mur d'avant (sinon undefined)
    const lancerMur = (numero, brecheMurPrecedent) => {
      if (boss.hp <= 0) return;
      const angle = Math.atan2(P.y - boss.y, P.x - boss.x);
      const avantX = Math.cos(angle); // direction dans laquelle avance le mur
      const avantY = Math.sin(angle);
      const coteX = -avantY; // direction le long du mur
      const coteY = avantX;
      const positionLateraleJoueur = (P.x - boss.x) * coteX + (P.y - boss.y) * coteY;
      const demiBreche = ctx.lvl >= 1 ? 52 : 64;

      // où ouvrir la brèche : près de toi (au hasard), sans sortir du mur
      let centreBreche = clamp(positionLateraleJoueur + rnd(-140, 140), -300, 300);
      if (brecheMurPrecedent !== undefined) {
        // le second mur ouvre sa brèche tout près de toi, d'un côté ou de l'autre
        const cote = Math.random() < 0.5 ? -1 : 1;
        centreBreche = clamp(positionLateraleJoueur + cote * (demiBreche + 50), -300, 300);
      }

      const origineX = boss.x;
      const origineY = boss.y;
      const dureeSignal = 0.9;
      const vitesse = 150 + ctx.lvl * 15;

      hazard(dureeSignal, {
        // pour le bot de test : devant le mur et hors de la brèche, c'est dangereux
        danger(effet, x, y) {
          const devant = (x - origineX) * avantX + (y - origineY) * avantY;
          const lateral = (x - origineX) * coteX + (y - origineY) * coteY;
          const dansLaZone = devant > -20 && devant < 520 && Math.abs(lateral) < 470;
          return dansLaZone && Math.abs(lateral - centreBreche) > demiBreche - 12 ? 1 : 0;
        },

        draw(effet, toile) {
          const avancement = 1 - effet.life / effet.t;
          // le mur, en rose, de chaque côté de la brèche
          toile.lineWidth = 3;
          toile.globalAlpha = 0.3 + 0.4 * avancement;
          toile.strokeStyle = PINK;
          toile.beginPath();
          toile.moveTo(origineX - coteX * 460, origineY - coteY * 460);
          toile.lineTo(origineX + coteX * (centreBreche - demiBreche), origineY + coteY * (centreBreche - demiBreche));
          toile.moveTo(origineX + coteX * (centreBreche + demiBreche), origineY + coteY * (centreBreche + demiBreche));
          toile.lineTo(origineX + coteX * 460, origineY + coteY * 460);
          toile.stroke();
          // la brèche, en cyan
          toile.strokeStyle = "#35f2ff";
          toile.lineWidth = 5;
          toile.globalAlpha = 0.9;
          toile.beginPath();
          toile.moveTo(origineX + coteX * (centreBreche - demiBreche), origineY + coteY * (centreBreche - demiBreche));
          toile.lineTo(origineX + coteX * (centreBreche + demiBreche), origineY + coteY * (centreBreche + demiBreche));
          toile.stroke();
          toile.globalAlpha = 1;
        },

        // à la fin du signal, le mur part : un tir tous les 30 px, sauf dans la brèche
        onEnd() {
          for (let decalage = -460; decalage <= 460; decalage += 30) {
            const dansLaBreche = decalage >= centreBreche - demiBreche && decalage <= centreBreche + demiBreche;
            if (!dansLaBreche) {
              bossBullet(origineX + coteX * decalage, origineY + coteY * decalage, angle, vitesse);
            }
          }
          if (numero + 1 < nbMurs) {
            // le second mur ne s'annonce qu'une fois le premier passé devant toi
            const distanceAvant = clamp((P.x - origineX) * avantX + (P.y - origineY) * avantY, 0, 600);
            const attente = Math.max(0.8, distanceAvant / vitesse + 0.3);
            hazard(attente, { draw() {}, onEnd: () => lancerMur(numero + 1, centreBreche) });
          }
        },
      });
    };

    boss.mode = "busy";
    boss.mt = 0.9;
    lancerMur(0);
  },

  // ---------- Zones qui suivent ----------
  // Des cercles te suivent lentement (65 px/s), puis s'arrêtent 0,45 s avant de claquer : il faut les semer.
  follow(boss, ctx) {
    const nbZones = 2 + ctx.lvl;
    for (let k = 0; k < nbZones; k++) {
      const angle = (k / nbZones) * 6.283 + rnd(0, 1);
      const rayon = rnd(120, 220);
      zones.push({
        x: clamp(P.x + Math.cos(angle) * rayon, 40, ARENA_W - 40),
        y: clamp(P.y + Math.sin(angle) * rayon, 40, ARENA_H - 40),
        r: 55,
        t: 2.2,
        max: 2.2,
        dmg: 14 * dm.dmg,
        fired: false,
        boom: 0,
        follow: 65, // vitesse à laquelle la zone te suit (le déplacement est dans partie.js)
      });
    }
  },

  // ---------- Bouclier ----------
  // Le bouclier absorbe tous les dégâts tant qu'il n'est pas brisé (le calcul est dans damage(), partie.js).
  // Brisé : le boss est étourdi et subit plus de dégâts. Pas brisé en 9 s : il éclate en tirs (voir bossAI).
  shield(boss, ctx) {
    if (boss.shield > 0) return; // déjà un bouclier
    boss.shMax = boss.shield = boss.max * (0.05 + 0.02 * ctx.lvl);
    boss.shT = 9;
    boss.spiral = 6; // il tire en spirale pendant ce temps
    ringFx(boss.x, boss.y, "#35f2ff", 100, 0.4);
    floatText(boss.x, boss.y - boss.r - 16, "bouclier", "#35f2ff", 14);
  },

  // ---------- Mines ----------
  // Des mines posées autour de toi : en pointillé 0,9 s (pas encore armées), puis pleines. Elles explosent si tu marches dessus.
  mines(boss, ctx) {
    const nbMines = 5 + ctx.lvl * 2;
    const mines = [];
    for (let k = 0; k < nbMines; k++) {
      const angle = rnd(0, 6.283);
      const rayon = rnd(70, 260);
      mines.push({
        x: clamp(P.x + Math.cos(angle) * rayon, 40, ARENA_W - 40),
        y: clamp(P.y + Math.sin(angle) * rayon, 40, ARENA_H - 40),
        live: true,
      });
    }

    hazard(8, {
      // pour le bot de test : une mine en vie est dangereuse
      danger(effet, x, y) {
        return mines.some((mine) => mine.live && Math.hypot(mine.x - x, mine.y - y) < 26 + P.r + 14) ? 1 : 0;
      },

      tick(effet) {
        if (effet.t - effet.life < 0.9) return; // le temps de les voir poser
        mines.forEach((mine) => {
          if (mine.live && Math.hypot(mine.x - P.x, mine.y - P.y) < 26 + P.r) {
            mine.live = false;
            hurt(16 * dm.dmg);
            SFX.bomb();
            ringFx(mine.x, mine.y, PINK, 60, 0.3);
            burst(mine.x, mine.y, 10, PINK, 200);
          }
        });
      },

      draw(effet, toile) {
        const armees = effet.t - effet.life >= 0.9;
        mines.forEach((mine) => {
          if (!mine.live) return;
          // le cercle : pointillé jaune avant d'être armée, plein rose ensuite
          toile.globalAlpha = armees ? 0.9 : 0.4;
          toile.strokeStyle = armees ? PINK : WARN;
          toile.lineWidth = 2;
          toile.setLineDash(armees ? [] : [4, 4]);
          toile.beginPath();
          toile.arc(mine.x, mine.y, 20, 0, 6.283);
          toile.stroke();
          toile.setLineDash([]);
          // le cœur, qui clignote quand elle est armée
          toile.fillStyle = PINK;
          toile.globalAlpha = armees ? 0.5 + 0.4 * Math.sin(t * 10 + mine.x) : 0.2;
          toile.beginPath();
          toile.arc(mine.x, mine.y, 7, 0, 6.283);
          toile.fill();
        });
        toile.globalAlpha = 1;
      },
    });
  },

  // ---------- Clones ----------
  // Des clones apparaissent autour de toi (une ligne rose les relie à toi), puis tirent en éventail l'un après l'autre.
  clones(boss, ctx) {
    const nbClones = 2 + (ctx.lvl >= 2 ? 1 : 0);
    const clones = [];
    const angleDepart = rnd(0, 6.283);
    const dureeSignal = 1.1; // temps avant le premier tir
    const ecartEntreTirs = 0.5; // temps entre le tir d'un clone et celui du suivant

    for (let k = 0; k < nbClones; k++) {
      const angle = angleDepart + (k / nbClones) * 6.283;
      clones.push({
        x: clamp(P.x + Math.cos(angle) * 230, 40, ARENA_W - 40),
        y: clamp(P.y + Math.sin(angle) * 230, 40, ARENA_H - 40),
        shot: false, // a-t-il déjà tiré ?
      });
    }

    hazard(dureeSignal + ecartEntreTirs * (nbClones - 1) + 0.05, {
      tick(effet) {
        const ecoule = effet.t - effet.life;
        clones.forEach((clone, k) => {
          if (clone.shot || ecoule < dureeSignal + k * ecartEntreTirs) return;
          clone.shot = true;
          const nbTirs = ctx.enr ? 7 : 5;
          const angleVersJoueur = Math.atan2(P.y - clone.y, P.x - clone.x);
          for (let s = 0; s < nbTirs; s++) {
            bossBullet(clone.x, clone.y, angleVersJoueur + (s - (nbTirs - 1) / 2) * 0.26, 190);
          }
          burst(clone.x, clone.y, 8, PINK, 200);
        });
      },

      draw(effet, toile) {
        const ecoule = effet.t - effet.life;
        clones.forEach((clone, k) => {
          if (clone.shot) return;
          const avancement = Math.min(1, ecoule / (dureeSignal + k * ecartEntreTirs));
          // la ligne pointillée du clone vers toi
          toile.strokeStyle = PINK;
          toile.globalAlpha = 0.25 + 0.5 * avancement;
          toile.lineWidth = 2;
          toile.setLineDash([6, 6]);
          toile.beginPath();
          toile.moveTo(clone.x, clone.y);
          toile.lineTo(P.x, P.y);
          toile.stroke();
          toile.setLineDash([]);
          // le contour qui pulse, puis le disque rose
          toile.beginPath();
          toile.arc(clone.x, clone.y, boss.r + 4 + 6 * Math.sin(t * 12), 0, 6.283);
          toile.stroke();
          toile.fillStyle = PINK;
          toile.globalAlpha = 0.15 + 0.25 * avancement;
          toile.beginPath();
          toile.arc(clone.x, clone.y, boss.r, 0, 6.283);
          toile.fill();
        });
        toile.globalAlpha = 1;
      },
    });
  },
});

/* ---------- Les trois phases de chaque boss de monde (mondes 1 à 4) ---------- */
// at = part de vie qui fait entrer dans la phase · atks = les briques, dans l'ordre · cd = repos entre deux attaques (secondes)
Object.assign(BOSS_PHASES, {
  // chef de gang : charges et renforts, puis un mur de tirs
  0: [
    { at: 1, atks: ["ring", "charge", "summon"], cd: 2.6 },
    { at: 0.66, atks: ["fan", "wall", "charge"], cd: 2.3 },
    { at: 0.33, atks: ["ring", "wall", "summon", "charge"], cd: 1.8 },
  ],
  // abomination : des flaques, puis des zones qui te traquent, puis un bouclier de chair
  1: [
    { at: 1, atks: ["fan", "pools", "summon"], cd: 2.6 },
    { at: 0.66, atks: ["follow", "summon", "fan"], cd: 2.4 },
    { at: 0.33, atks: ["shield", "pools", "follow", "summon"], cd: 1.9 },
  ],
  // machine : rafales et coups de piston, puis un laser, puis des mines
  2: [
    { at: 1, atks: ["burst", "pound", "charge"], cd: 2.6 },
    { at: 0.66, atks: ["laser", "burst", "charge"], cd: 2.4 },
    { at: 0.33, atks: ["laser", "mines", "pound", "charge"], cd: 1.9 },
  ],
  // IA corrompue : spirales et téléportations, puis des clones, puis un bouclier de code
  3: [
    { at: 1, atks: ["spiral", "teleport", "summon"], cd: 2.6 },
    { at: 0.66, atks: ["clones", "spiral", "teleport"], cd: 2.3 },
    { at: 0.33, atks: ["shield", "clones", "teleport", "spiral"], cd: 1.9 },
  ],
  // pdg augmenté : tout ce qu'il a, en trois temps (le monde 5 utilise le grand boss, ces phases servent de secours)
  4: [
    { at: 1, atks: ["ring", "spiral", "charge", "pound"], cd: 2.6 },
    { at: 0.66, atks: ["wall", "laser", "summon"], cd: 2.3 },
    { at: 0.33, atks: ["shield", "laser", "wall", "mines", "charge"], cd: 1.8 },
  ],
});

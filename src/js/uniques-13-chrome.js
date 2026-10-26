"use strict";

/* ---------- Chrome : les Lames jumelles et Mille entailles ---------- */

// l'écart entre deux angles, ramené entre -π et π
const ecartAngle = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

Object.assign(WEAPONS, {
  // ---------- Lames jumelles ----------
  // Deux épées, une dans chaque main, frappent à tour de rôle devant toi en un grand balayage (la droite de droite à gauche,
  // la gauche de gauche à droite : les deux traits se croisent). Elles flottent à tes côtés entre deux coups.
  // Légendaire : une troisième lame frappe dans ton dos (et chaque reprise en ajoute une, qui se place autour).
  twinblades: {
    char: "chrome",
    name: "Lames jumelles",
    intro: "deux épées frappent en alternance devant toi",
    legendText: "une troisième lame frappe dans ton dos",
    legendStacks: true,
    cd0: 0.5,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lames", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "lames " + pct(v) + " plus longues", apply: bump("rng") },
      { id: "arc", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "balayage " + pct(v) + " plus large", apply: bump("arc") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "les lames frappent " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      const col = WEAPON_COLOR.twinblades;
      w.swings = w.swings || [];
      persistentFx(w, (f, toile) => drawTwinBlades(w, toile));

      const portee = 78 * (1 + (w.rng || 0)) * rngMul();
      const demiArc = Math.min(2.6, 0.95 * (1 + (w.arc || 0))); // demi-angle du balayage, en radians
      const nbLames = 2 + lg(w);

      // 1) on lance un nouveau coup quand le délai est écoulé et qu'un ennemi est à portée
      w.cd -= dt;
      if (w.cd <= 0) {
        const cible = nearest(portee + 30);
        if (cible) {
          w.step = (w.step || 0) + 1;
          const lame = (w.step - 1) % nbLames; // 0 = main droite, 1 = main gauche, 2 et + = dans le dos
          const versCible = Math.atan2(cible.y - P.y, cible.x - P.x);
          let centre = versCible;
          if (lame >= 2) {
            // les lames de dos : pile derrière, puis de plus en plus sur les côtés (0, +0,9, -0,9, +1,8...)
            const k = lame - 2;
            centre = versCible + Math.PI + ((k + 1) >> 1) * (k % 2 ? 0.9 : -0.9);
          }
          P.aim = versCible;
          P.muzzle = 0.06;
          SFX.dash();
          w.swings.push({ a0: centre, dir: lame % 2 === 0 ? -1 : 1, lame, u: 0, duree: 0.17, demi: demiArc, portee, touche: new Set() });
          w.cd = slow(w, 0.45) * cdMul();
        }
      }

      // 2) les coups en cours : la lame avance, et blesse tout ce qu'elle a déjà balayé
      const degats = st.dmg * 3 * (1 + (w.dm || 0));
      for (let i = w.swings.length - 1; i >= 0; i--) {
        const s = w.swings[i];
        s.u += dt / s.duree;
        const avance = -s.demi + 2 * s.demi * Math.min(1, s.u); // où en est la lame, dans le sens du coup
        enemies.forEach((e) => {
          if (e.hp <= 0 || s.touche.has(e)) return;
          const dx = e.x - P.x;
          const dy = e.y - P.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance > s.portee + e.r) return;
          const marge = Math.atan2(e.r, Math.max(distance, 10)); // un gros ennemi est touché un peu avant d'être exactement sur la lame
          const position = ecartAngle(Math.atan2(dy, dx), s.a0) * s.dir;
          if (Math.abs(position) > s.demi + marge || position - marge > avance) return;
          s.touche.add(e);
          strike(e, degats, (dx / distance) * 170, (dy / distance) * 170, "slash");
          spark(e.x, e.y, col, 5, 190);
        });
        if (s.u >= 1 && s.u < 1.05) {
          // à la fin du coup, une gerbe au bout de la lame
          const aFin = s.a0 + s.dir * s.demi;
          spark(P.x + Math.cos(aFin) * s.portee, P.y + Math.sin(aFin) * s.portee, col, 6, 220);
        }
        if (s.u > 1.5) w.swings.splice(i, 1); // le sillage lumineux s'efface pendant 0,5 durée de coup
      }
    },
  },

  // ---------- Mille entailles ----------
  // Une rafale de coups d'épée ultra rapides, de tous les angles, sur un seul ennemi proche (un réticule le marque).
  // Le dernier coup est une grande croix qui frappe bien plus fort.
  // Légendaire : les derniers coups (4 par reprise) frappent aussi les ennemis voisins de la cible.
  thousandcuts: {
    char: "chrome",
    name: "Mille entailles",
    intro: "une série de coups rapides frappe un ennemi proche",
    legendText: "les derniers coups touchent aussi les ennemis voisins",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [2, 4, 6], text: (v) => "+" + plural(v, "entaille") + " par série", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des entailles", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la série revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const portee = 230 * (1 + (w.rng || 0)) * rngMul();
      const cible = nearest(portee);
      if (!cible) return;

      const col = WEAPON_COLOR.thousandcuts;
      const nbCoups = 12 + (w.n || 0);
      const pas = 0.065; // secondes entre deux coups
      const degats = st.dmg * 2.2 * (1 + (w.dm || 0));
      const nbVoisins = 4 * lg(w); // combien de derniers coups blessent aussi les voisins
      const duree = nbCoups * pas;
      w.cd = slow(w, 6) * cdMul() + duree;
      SFX.wave();

      fx.push({
        k: "custom", life: duree + 0.35, t: duree + 0.35,
        cible, x: cible.x, y: cible.y, coup: 0,
        tick(f) {
          const ecoule = f.t - f.life;
          // la cible bouge : le réticule la suit ; si elle est morte, on passe à l'ennemi le plus proche de l'endroit
          if (f.cible.hp > 0) {
            f.x = f.cible.x;
            f.y = f.cible.y;
          }
          while (f.coup < nbCoups && ecoule >= f.coup * pas) {
            if (f.cible.hp <= 0) {
              const relais = nearest(110, f.x, f.y);
              if (!relais) {
                f.coup = nbCoups; // plus personne : la série s'arrête
                break;
              }
              f.cible = relais;
            }
            const dernier = f.coup === nbCoups - 1;
            const angle = rnd(0, 6.283);
            const e = f.cible;
            strike(e, dernier ? degats * 4 : degats, Math.cos(angle) * 35, Math.sin(angle) * 35, "slash");
            traitDEntaille(e.x, e.y, angle, dernier ? 170 : 70 + rnd(0, 40), col, dernier ? 0.3 : 0.14, dernier ? 5 : 3);
            if (dernier) {
              traitDEntaille(e.x, e.y, angle + Math.PI / 2, 170, col, 0.3, 5); // la croix
              ringFx(e.x, e.y, col, 46, 0.25);
              spark(e.x, e.y, col, 14, 280);
              shake = Math.max(shake, 5);
            } else {
              spark(e.x, e.y, col, 3, 170);
            }
            // légendaire : les derniers coups blessent aussi les voisins de la cible
            if (nbVoisins && f.coup >= nbCoups - nbVoisins) {
              enemies.forEach((o) => {
                if (o === e || o.hp <= 0 || Math.hypot(o.x - e.x, o.y - e.y) > 80 + o.r) return;
                strike(o, degats * 0.6, Math.cos(angle) * 30, Math.sin(angle) * 30, "slash");
                traitDEntaille(o.x, o.y, angle + 0.5, 60, col, 0.12, 2);
              });
            }
            SFX.hit();
            f.coup++;
          }
        },
        // le réticule : quatre coins qui se resserrent autour de la cible pendant la série
        draw(f, toile) {
          if (f.coup >= nbCoups) return;
          const e = f.cible;
          const taille = e.r + 8 + 6 * Math.sin(t * 30);
          toile.strokeStyle = col;
          toile.lineWidth = 2;
          toile.globalAlpha = 0.85;
          for (let k = 0; k < 4; k++) {
            const a = k * 1.5708 + t * 3;
            toile.beginPath();
            toile.arc(f.x, f.y, taille, a, a + 0.6);
            toile.stroke();
          }
          toile.globalAlpha = 1;
        },
      });
    },
  },
});

/* ---------- Un trait d'entaille ---------- */
// une ligne lumineuse qui traverse (x, y) selon l'angle, longue de `longueur`, qui s'efface en `vie` secondes
const traitDEntaille = (x, y, angle, longueur, col, vie, epaisseur) => {
  const dx = Math.cos(angle) * longueur / 2;
  const dy = Math.sin(angle) * longueur / 2;
  fx.push({
    k: "custom", life: vie, t: vie,
    draw(f, toile) {
      const u = f.life / f.t; // 1 au début, 0 à la fin
      toile.globalCompositeOperation = "lighter";
      toile.strokeStyle = col;
      toile.lineWidth = epaisseur * 3;
      toile.globalAlpha = 0.45 * u;
      toile.beginPath();
      toile.moveTo(x - dx, y - dy);
      toile.lineTo(x + dx, y + dy);
      toile.stroke();
      toile.globalCompositeOperation = "source-over";
      toile.strokeStyle = "#ffffff";
      toile.lineWidth = epaisseur;
      toile.globalAlpha = 0.95 * u;
      toile.beginPath();
      toile.moveTo(x - dx * u, y - dy * u); // le trait se rétrécit en s'éteignant
      toile.lineTo(x + dx * u, y + dy * u);
      toile.stroke();
      toile.globalAlpha = 1;
    },
  });
};

/* ---------- Dessin des Lames jumelles ---------- */
// les deux épées qui flottent à tes côtés, et le sillage et la lame de chaque coup en cours
const drawTwinBlades = (w, toile) => {
  const col = WEAPON_COLOR.twinblades;
  const face = P.aim || 0;
  const swings = w.swings || [];

  // 1) les épées au repos (celle qui frappe est dessinée avec son coup)
  for (let main = 0; main < 2; main++) {
    if (swings.some((s) => s.lame === main && s.u < 1)) continue;
    const cote = main === 0 ? 1 : -1;
    const flotte = Math.sin(t * 3 + main * 2) * 2;
    const posAngle = face + cote * 1.75;
    drawSword(P.x + Math.cos(posAngle) * (21 + flotte), P.y + Math.sin(posAngle) * (21 + flotte), face + cote * 0.4, col, 0.75);
  }

  // 2) les coups
  swings.forEach((s) => {
    const avance = -s.demi + 2 * s.demi * Math.min(1, s.u);
    const angleLame = s.a0 + s.dir * avance;
    const angleDepart = s.a0 - s.dir * s.demi;
    const fondu = s.u <= 1 ? 1 : Math.max(0, 1 - (s.u - 1) / 0.5); // le sillage s'éteint après le coup
    // le sillage : un arc lumineux de là où la lame est partie jusqu'où elle est
    const debut = Math.min(angleDepart, angleLame);
    const fin = Math.max(angleDepart, angleLame);
    toile.globalCompositeOperation = "lighter";
    toile.strokeStyle = col;
    toile.globalAlpha = 0.3 * fondu;
    toile.lineWidth = 16;
    toile.beginPath();
    toile.arc(P.x, P.y, s.portee * 0.82, debut, fin);
    toile.stroke();
    toile.globalAlpha = 0.6 * fondu;
    toile.lineWidth = 5;
    toile.beginPath();
    toile.arc(P.x, P.y, s.portee * 0.92, debut, fin);
    toile.stroke();
    // la lame : un trait du poing jusqu'au bout de la portée, avec un cœur blanc
    if (s.u < 1.2) {
      const bx = P.x + Math.cos(angleLame) * s.portee;
      const by = P.y + Math.sin(angleLame) * s.portee;
      const hx = P.x + Math.cos(angleLame) * 16;
      const hy = P.y + Math.sin(angleLame) * 16;
      toile.globalAlpha = 0.5 * fondu;
      toile.lineWidth = 12;
      toile.beginPath();
      toile.moveTo(hx, hy);
      toile.lineTo(bx, by);
      toile.stroke();
      toile.globalCompositeOperation = "source-over";
      toile.strokeStyle = "#ffffff";
      toile.globalAlpha = 0.95 * fondu;
      toile.lineWidth = 3;
      toile.beginPath();
      toile.moveTo(hx, hy);
      toile.lineTo(bx, by);
      toile.stroke();
    }
    toile.globalCompositeOperation = "source-over";
  });
  toile.globalAlpha = 1;
};

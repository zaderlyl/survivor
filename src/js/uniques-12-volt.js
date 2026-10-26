"use strict";

/* ---------- Volt : le Pare-feu mobile et le Fichier corrompu ---------- */

// Un effet qui reste pour toute la partie et se dessine lui-même (un mur qui tourne, des épées qui flottent...).
// Il est créé une seule fois par arme ; dessiner(effet, toile) est appelée à chaque image.
const persistentFx = (w, dessiner) => {
  if (w.fxo) return;
  w.fxo = { k: "custom", life: 1e9, t: 1e9, draw: dessiner };
  fx.push(w.fxo);
};

Object.assign(WEAPONS, {
  // ---------- Pare-feu mobile ----------
  // Des panneaux de code tournent autour de toi. Ils arrêtent tous les tirs ennemis qui les croisent,
  // repoussent et blessent les ennemis qui les touchent. Toujours actif (pas de recharge).
  mobilewall: {
    char: "volt",
    name: "Pare-feu mobile",
    intro: "un mur de code tourne autour de toi et bloque les tirs ennemis",
    legendText: "les tirs bloqués sont renvoyés",
    legendStacks: true, // chaque reprise renvoie un tir de plus
    cd0: 0,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "panneau"), apply: bump("n") },
      { id: "wid", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "panneaux " + pct(v) + " plus larges", apply: bump("wid") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts au contact", apply: bump("dm") },
      { id: "spin", max: 99, vals: [0.15, 0.3, 0.6], text: (v) => "tourne " + pct(v) + " plus vite", apply: bump("spin") },
    ],
    update(w, dt) {
      const col = WEAPON_COLOR.mobilewall;
      const nbPanneaux = 3 + (w.n || 0);
      // chaque panneau fait 0,7 rad de large (≈ 40°) ; s'ils sont trop nombreux, ils se serrent pour laisser des trous
      const largeur = Math.min(0.7 * (1 + (w.wid || 0)), (6.283 * 0.85) / nbPanneaux);
      const demiLargeur = largeur / 2;
      const rayon = 74;
      w.ang = (w.ang || 0) + dt * 1.5 * (1 + (w.spin || 0));
      w.flash = w.flash || [];

      // l'effet qui dessine le mur (créé une fois, il lit l'état de l'arme à chaque image)
      persistentFx(w, (f, toile) => drawMobileWall(w, toile));
      w.dessin = { n: nbPanneaux, demi: demiLargeur, rayon };

      // le panneau qui couvre cet angle, ou -1 (l'angle est mesuré depuis le joueur)
      const panneauA = (angle) => {
        for (let i = 0; i < nbPanneaux; i++) {
          const centre = w.ang + (i / nbPanneaux) * 6.283;
          const ecart = Math.atan2(Math.sin(angle - centre), Math.cos(angle - centre));
          if (Math.abs(ecart) < demiLargeur) return i;
        }
        return -1;
      };

      // 1) les tirs ennemis qui traversent un panneau sont arrêtés (et renvoyés avec le légendaire)
      for (let i = ebullets.length - 1; i >= 0; i--) {
        const b = ebullets[i];
        const dx = b.x - P.x;
        const dy = b.y - P.y;
        const distance = Math.hypot(dx, dy);
        if (Math.abs(distance - rayon) > 15) continue;
        const panneau = panneauA(Math.atan2(dy, dx));
        if (panneau < 0) continue;
        spark(b.x, b.y, col, 4, 150);
        ringFx(b.x, b.y, col, 14, 0.15);
        SFX.hit();
        w.flash[panneau] = 0.2;
        if (lg(w)) {
          // chaque reprise renvoie un tir de plus, en éventail, vers l'ennemi le plus proche
          const cible = nearest(520, b.x, b.y);
          if (cible) {
            const cap = Math.atan2(cible.y - b.y, cible.x - b.x);
            for (let k = 0; k < lg(w); k++) {
              fire(cap + (k - (lg(w) - 1) / 2) * 0.18, 430, 0.9, { x: b.x, y: b.y, dmg: st.dmg * 0.9 * (1 + (w.dm || 0)), color: col });
            }
          }
        }
        ebullets.splice(i, 1);
      }

      // 2) les ennemis qui touchent un panneau sont repoussés dehors et blessés
      w.touche = w.touche || new Map();
      const degats = st.dmg * 1.6 * (1 + (w.dm || 0));
      enemies.forEach((e) => {
        if (e.hp <= 0) return;
        const dx = e.x - P.x;
        const dy = e.y - P.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (Math.abs(distance - rayon) > 12 + e.r) return;
        const marge = Math.atan2(e.r, rayon); // un gros ennemi touche le panneau un peu avant d'être exactement dessus
        const centreEnnemi = Math.atan2(dy, dx);
        let panneau = -1;
        for (let i = 0; i < nbPanneaux; i++) {
          const centre = w.ang + (i / nbPanneaux) * 6.283;
          const ecart = Math.atan2(Math.sin(centreEnnemi - centre), Math.cos(centreEnnemi - centre));
          if (Math.abs(ecart) < demiLargeur + marge) { panneau = i; break; }
        }
        if (panneau < 0) return;
        // repoussé : il ne passe pas le mur (les boss sont seulement freinés)
        if (e.type === "boss") {
          e.kx += (dx / distance) * 60;
          e.ky += (dy / distance) * 60;
        } else if (distance < rayon + 12 + e.r) {
          const dehors = rayon + 12 + e.r;
          e.x = P.x + (dx / distance) * dehors;
          e.y = P.y + (dy / distance) * dehors;
        }
        if ((w.touche.get(e) || 0) > t) return;
        w.touche.set(e, t + 0.35);
        strike(e, degats, (dx / distance) * 180, (dy / distance) * 180, "beam");
        w.flash[panneau] = 0.15;
        spark(e.x, e.y, col, 3, 130);
      });

      // les temps d'éclat des panneaux
      for (let i = 0; i < w.flash.length; i++) if (w.flash[i] > 0) w.flash[i] -= dt;
    },
  },

  // ---------- Fichier corrompu ----------
  // Contamine un ennemi : il perd le contrôle, fonce dans tous les sens (de préférence sur ses alliés) et les blesse au contact.
  // Légendaire : chaque ennemi touché est contaminé à son tour, la corruption se propage de proche en proche.
  corruptfile: {
    char: "volt",
    name: "Fichier corrompu",
    intro: "contamine un ennemi : il perd le contrôle et attaque ses alliés",
    legendText: "la corruption se transmet à sa cible",
    legendStacks: true, // chaque reprise allonge la chaîne de contamination
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "ennemi") + " contaminé à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la corruption", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la corruption dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "contamine " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const candidats = enemies.filter((e) => e.hp > 0 && e.type !== "boss" && !e.corrupt && !(e.hacked > 0) && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (candidats.length < 2) return; // il faut au moins un allié à attaquer
      w.cd = slow(w, 8) * cdMul();
      const col = WEAPON_COLOR.corrupt;
      const duree = 5 * (1 + (w.dur || 0));
      SFX.wave();
      for (let k = 0, n = 1 + (w.n || 0); k < n && candidats.length; k++) {
        const e = candidats.splice((Math.random() * candidats.length) | 0, 1)[0];
        corruptEnemy(e, { duree, degats: st.dmg * 2.2 * (1 + (w.dm || 0)), generation: 0, maxGeneration: lg(w) ? 1 + lg(w) : 0 });
        fx.push({ k: "bolt", color: col, pts: [[P.x, P.y], [e.x, e.y]], life: 0.25, t: 0.25 });
      }
    },
  },
});

/* ---------- Dessin du Pare-feu mobile ---------- */
// des panneaux de code : un trait lumineux, des blocs qui clignotent comme des lignes de programme, un éclat quand quelque chose les frappe
const drawMobileWall = (w, toile) => {
  const d = w.dessin;
  if (!d) return;
  const col = WEAPON_COLOR.mobilewall;
  toile.save();
  toile.translate(P.x, P.y);
  for (let i = 0; i < d.n; i++) {
    const centre = w.ang + (i / d.n) * 6.283;
    const eclat = Math.max(0, (w.flash && w.flash[i]) || 0) / 0.2; // 1 juste après un impact, puis 0
    // 1) le halo et le trait du panneau
    toile.globalCompositeOperation = "lighter";
    toile.strokeStyle = col;
    toile.globalAlpha = 0.28 + 0.4 * eclat;
    toile.lineWidth = 12;
    toile.beginPath();
    toile.arc(0, 0, d.rayon, centre - d.demi, centre + d.demi);
    toile.stroke();
    toile.globalAlpha = 0.9;
    toile.lineWidth = 3;
    toile.beginPath();
    toile.arc(0, 0, d.rayon, centre - d.demi, centre + d.demi);
    toile.stroke();
    toile.globalCompositeOperation = "source-over";
    // 2) les blocs de code qui clignotent le long du panneau
    const nbBlocs = Math.max(3, Math.round((d.demi * 2 * d.rayon) / 8));
    for (let k = 0; k < nbBlocs; k++) {
      const a = centre - d.demi + ((k + 0.5) / nbBlocs) * d.demi * 2;
      const haut = 3 + 5 * (0.5 + 0.5 * Math.sin(t * 9 + k * 1.7 + i * 2.3)); // la hauteur varie : un défilement de code
      toile.fillStyle = k % 3 === 0 ? "#ffffff" : col;
      toile.globalAlpha = 0.55 + 0.35 * Math.sin(t * 13 + k * 2.1);
      toile.save();
      toile.rotate(a);
      toile.fillRect(d.rayon - haut / 2 - 6, -1.5, haut, 3);
      toile.restore();
    }
  }
  toile.restore();
  toile.globalAlpha = 1;
};

/* ---------- La corruption ---------- */
// Met un ennemi en état « corrompu ». opts : duree (s), degats (par contact), generation (0 = le premier contaminé), maxGeneration (jusqu'où ça se propage).
// Le comportement est dans la boucle des ennemis (partie.js), le dessin dans rendu.js.
const corruptEnemy = (e, opts) => {
  e.corrupt = {
    t: opts.duree,
    duree: opts.duree,
    degats: opts.degats,
    generation: opts.generation,
    maxGeneration: opts.maxGeneration,
    tourne: 0, // temps avant de changer de direction
    cx: 0, cy: 0, // direction actuelle
    touche: 0, // délai avant de pouvoir blesser à nouveau
  };
  e.fire = 5; // un tireur corrompu ne tire plus sur toi
  const col = WEAPON_COLOR.corrupt;
  ringFx(e.x, e.y, col, 30, 0.3);
  spark(e.x, e.y, col, 10, 200);
};

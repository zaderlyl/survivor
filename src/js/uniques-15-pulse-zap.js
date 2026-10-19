"use strict";

/* ---------- Pulse : la Boule de démolition et la Grenade rebondissante · Zap : le Nœud électrique et l'Orage magnétique ---------- */

// un point au hasard « rond » autour de (x, y)
const autour = (x, y, rayon) => {
  const a = rnd(0, 6.283);
  const r = Math.sqrt(Math.random()) * rayon;
  return [x + Math.cos(a) * r, y + Math.sin(a) * r];
};

// distance d'un point (px, py) au segment (ax, ay)-(bx, by)
const distanceSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const carre = dx * dx + dy * dy || 1;
  const u = clamp(((px - ax) * dx + (py - ay) * dy) / carre, 0, 1);
  return Math.hypot(px - (ax + dx * u), py - (ay + dy * u));
};

Object.assign(WEAPONS, {
  // ---------- Boule de démolition (Pulse) ----------
  // Une énorme bombe roule vers le plus gros groupe d'ennemis, balaie les petits (elle les écarte en les blessant) et explose
  // sur le premier costaud (brute, tank, boss...), au bout de sa course ou contre le bord de l'arène.
  // Légendaire : elle laisse une traînée de flammes derrière elle (chaque reprise : flammes plus brûlantes et plus durables).
  wreckingball: {
    char: "pulse",
    name: "Boule de démolition",
    intro: "lance une bombe lourde qui roule et explose au premier obstacle",
    legendText: "elle laisse une traînée de flammes",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "boule") + " lancée en éventail", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la boule", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la boule revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const amas = meilleurAmas(st.range, 100);
      if (!amas) return;
      w.cd = slow(w, 5.5) * cdMul();
      const angle = Math.atan2(amas.e.y - P.y, amas.e.x - P.x);
      P.aim = angle;
      SFX.shoot();
      const nb = 1 + (w.n || 0);
      for (let k = 0; k < nb; k++) lancerBoule(w, angle + (k - (nb - 1) / 2) * 0.32);
    },
  },

  // ---------- Grenade rebondissante (Pulse) ----------
  // Une grenade saute de groupe en groupe : à chaque rebond elle retombe sur l'ennemi le plus proche en repoussant ce qui est autour,
  // puis le dernier rebond explose en grand (3 rebonds de base).
  // Légendaire : chaque rebond libère une petite explosion (chaque reprise : plus grosse).
  bouncegrenade: {
    char: "pulse",
    name: "Grenade rebondissante",
    intro: "une grenade rebondit plusieurs fois avant d'exploser",
    legendText: "chaque rebond libère une petite explosion",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "rebond"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la grenade", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la grenade revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cible = nearest(st.range);
      if (!cible) return;
      w.cd = slow(w, 4) * cdMul();
      P.aim = Math.atan2(cible.y - P.y, cible.x - P.x);
      SFX.shoot();
      lancerGrenade(w, cible);
    },
  },

  // ---------- Nœud électrique (Zap) ----------
  // Des bornes s'accrochent sur trois ennemis éloignés les uns des autres et les relient par des arcs : c'est une toile vivante,
  // qui s'étire et se déforme quand les ennemis bougent. Les arcs blessent tout ce qu'ils frôlent, et chaque borne foudroie son hôte.
  // Légendaire : quand un hôte meurt, la borne saute sur un autre ennemi, et chaque arc lance un éclair sur un voisin
  // (chaque reprise : un éclair de plus par arc).
  elecnode: {
    char: "zap",
    name: "Nœud électrique",
    intro: "pose des bornes qui relient les ennemis pris entre elles par des arcs",
    legendText: "les arcs se propagent à d'autres cibles",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "borne"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des arcs", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le réseau tient " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const candidats = enemies.filter((e) => e.hp > 0 && e.type !== "boss" && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      const nb = 3 + (w.n || 0);
      if (candidats.length < 3) return;
      // on choisit des hôtes espacés : le plus proche, puis à chaque fois celui qui est le plus loin des déjà choisis
      candidats.sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y));
      const hotes = [candidats[0]];
      while (hotes.length < nb && hotes.length < candidats.length) {
        let meilleur = null;
        let meilleureDistance = -1;
        candidats.forEach((e) => {
          if (hotes.includes(e)) return;
          const proche = Math.min(...hotes.map((h) => Math.hypot(h.x - e.x, h.y - e.y)));
          if (proche > meilleureDistance && proche < 260) {
            meilleureDistance = proche;
            meilleur = e;
          }
        });
        if (!meilleur) break;
        hotes.push(meilleur);
      }
      if (hotes.length < 3) return;
      w.cd = slow(w, 8) * cdMul() + 3;
      SFX.wave();
      lancerReseau(w, hotes);
    },
  },

  // ---------- Orage magnétique (Zap) ----------
  // Un nuage d'orage se forme au-dessus du plus gros groupe d'ennemis, et un champ magnétique les attire tous vers lui (1,3 s).
  // Quand ils sont tassés, une salve d'éclairs s'abat (cinq coups), le dernier est énorme.
  // Légendaire : l'impact final déclenche une décharge en cercle qui s'élargit (chaque reprise : une onde de plus).
  magstorm: {
    char: "zap",
    name: "Orage magnétique",
    intro: "attire les ennemis vers un point, puis les foudroie",
    legendText: "l'impact déclenche une décharge en cercle",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "éclair") + " dans la salve", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des éclairs", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "champ magnétique " + pct(v) + " plus large", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const amas = meilleurAmas(st.range * 0.95, 110);
      if (!amas || amas.voisins < 3) return;
      w.cd = slow(w, 9) * cdMul() + 2;
      SFX.boss();
      lancerOrage(w, amas.e.x, amas.e.y);
    },
  },
});

/* ---------- La boule de démolition ---------- */
const lancerBoule = (w, angle) => {
  const col = WEAPON_COLOR.wreckingball;
  const vitesse = 270;
  const rayonExplosion = 105 * (1 + (w.rad || 0));
  const degats = st.dmg * 8 * (1 + (w.dm || 0));
  const degatsBalayage = st.dmg * 1.2 * (1 + (w.dm || 0));
  const niveauFlammes = lg(w);
  const dejaBalayes = new Set();
  let derniereFlamme = 0;

  fx.push({
    k: "custom", life: 2.4, t: 2.4, x: P.x + Math.cos(angle) * 18, y: P.y + Math.sin(angle) * 18, rot: 0, explose: false,
    tick(f, h) {
      f.x += Math.cos(angle) * vitesse * h;
      f.y += Math.sin(angle) * vitesse * h;
      f.rot += (vitesse / 13) * h; // elle roule : un tour de rayon 13
      if (Math.random() < 0.6) spark(f.x - Math.cos(angle) * 10, f.y - Math.sin(angle) * 10 + 8, "#ffb36b", 1, 90);
      // la traînée de flammes du légendaire : un foyer tous les 26 px
      if (niveauFlammes && Math.hypot(f.x - P.x, f.y - P.y) - derniereFlamme > 26) {
        derniereFlamme = Math.hypot(f.x - P.x, f.y - P.y);
        foyer(f.x, f.y, st.dmg * 0.6 * (1 + 0.4 * (niveauFlammes - 1)) * (1 + (w.dm || 0)), 2.6 + 0.6 * (niveauFlammes - 1));
      }
      // les ennemis sur sa route
      let touche = false;
      enemies.forEach((e) => {
        if (e.hp <= 0 || touche) return;
        const dx = e.x - f.x;
        const dy = e.y - f.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance > e.r + 14) return;
        if (e.type === "boss" || e.r >= 10) {
          touche = true; // un costaud : elle explose dessus
        } else if (!dejaBalayes.has(e)) {
          // un petit : balayé de côté, blessé au passage
          dejaBalayes.add(e);
          const cote = Math.sign(dx * -Math.sin(angle) + dy * Math.cos(angle)) || 1;
          strike(e, degatsBalayage, -Math.sin(angle) * cote * 260 + Math.cos(angle) * 60, Math.cos(angle) * cote * 260 + Math.sin(angle) * 60, "blast");
          spark(e.x, e.y, col, 4, 200);
        }
      });
      const dehors = f.x < 30 || f.y < 30 || f.x > ARENA_W - 30 || f.y > ARENA_H - 30;
      if (touche || dehors) f.life = 0; // l'explosion est dans onEnd
    },
    onEnd(f) {
      boom(f.x, f.y, rayonExplosion, degats, col);
      shake = Math.max(shake, 9);
      ringFx(f.x, f.y, "#ffffff", rayonExplosion * 0.5, 0.2);
      spark(f.x, f.y, col, 24, 340);
      if (niveauFlammes) {
        // quelques foyers à l'endroit de l'explosion
        for (let k = 0; k < 4 + niveauFlammes; k++) {
          const [fx0, fy0] = autour(f.x, f.y, rayonExplosion * 0.7);
          foyer(fx0, fy0, st.dmg * 0.6 * (1 + 0.4 * (niveauFlammes - 1)) * (1 + (w.dm || 0)), 2.6);
        }
      }
    },
    draw(f, toile) {
      // l'ombre, puis la sphère d'acier avec une bande qui tourne (elle roule), et une lueur de mèche
      toile.fillStyle = "#000000";
      toile.globalAlpha = 0.35;
      toile.beginPath();
      toile.ellipse(f.x, f.y + 11, 13, 5, 0, 0, 6.283);
      toile.fill();
      toile.globalAlpha = 1;
      toile.fillStyle = "#23252e";
      toile.beginPath();
      toile.arc(f.x, f.y, 13, 0, 6.283);
      toile.fill();
      toile.strokeStyle = "#6b7283";
      toile.lineWidth = 2;
      toile.stroke();
      // les bandes qui montrent la rotation
      toile.strokeStyle = col;
      toile.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const a = f.rot + (k * 6.283) / 3;
        toile.beginPath();
        toile.moveTo(f.x + Math.cos(a) * 3, f.y + Math.sin(a) * 3);
        toile.lineTo(f.x + Math.cos(a) * 11, f.y + Math.sin(a) * 11);
        toile.stroke();
      }
      // la mèche qui crépite au sommet
      toile.globalCompositeOperation = "lighter";
      toile.fillStyle = col;
      toile.globalAlpha = 0.55 + 0.3 * Math.sin(t * 40);
      toile.beginPath();
      toile.arc(f.x + Math.cos(f.rot) * 12, f.y + Math.sin(f.rot) * 12 - 3, 5, 0, 6.283);
      toile.fill();
      toile.globalCompositeOperation = "source-over";
      toile.globalAlpha = 1;
    },
  });
};

// un foyer d'incendie : brûle ce qui est dessus pendant quelques secondes
const foyer = (x, y, degats, duree) => {
  const col = "#ff8a3d";
  let prochain = 0;
  fx.push({
    k: "custom", life: duree, t: duree,
    tick(f) {
      prochain -= 1 / 30;
      if (prochain > 0) return;
      prochain = 0.4;
      enemies.forEach((e) => {
        if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) < 26 + e.r) strike(e, degats, 0, 0, "burn");
      });
    },
    draw(f, toile) {
      const u = Math.min(1, f.life / 0.5);
      toile.globalCompositeOperation = "lighter";
      toile.fillStyle = col;
      for (let k = 0; k < 3; k++) {
        const decal = Math.sin(t * 9 + k * 2.1 + x * 0.05);
        toile.globalAlpha = (0.28 + 0.18 * decal) * u;
        toile.beginPath();
        toile.arc(x + (k - 1) * 8, y - 3 - Math.abs(decal) * 5, 9 - k * 1.5, 0, 6.283);
        toile.fill();
      }
      toile.globalCompositeOperation = "source-over";
      toile.globalAlpha = 1;
    },
  });
};

/* ---------- La grenade rebondissante ---------- */
const lancerGrenade = (w, premiereCible) => {
  const col = WEAPON_COLOR.bouncegrenade;
  const nbRebonds = 3 + (w.n || 0);
  const degatsRebond = st.dmg * 1.4 * (1 + (w.dm || 0));
  const degatsPetite = st.dmg * 3.4 * (1 + (w.dm || 0)) * (1 + 0.5 * Math.max(0, lg(w) - 1));
  const degatsFinale = st.dmg * 8 * (1 + (w.dm || 0));
  const rayonFinal = 100 * (1 + (w.rad || 0));
  const rayonPetit = (60 + 10 * lg(w)) * (1 + (w.rad || 0));
  const dureeSaut = 0.34;

  fx.push({
    k: "custom", life: 99, t: 99, x: P.x, y: P.y, de: [P.x, P.y], vers: [premiereCible.x, premiereCible.y], u: 0, saut: 0, hauteur: 0,
    tick(f, h) {
      f.u += h / dureeSaut;
      const k = Math.min(1, f.u);
      f.x = f.de[0] + (f.vers[0] - f.de[0]) * k;
      f.y = f.de[1] + (f.vers[1] - f.de[1]) * k;
      f.hauteur = Math.sin(Math.PI * k) * (46 - 7 * f.saut); // le saut est de plus en plus bas
      if (Math.random() < 0.7) spark(f.x, f.y - f.hauteur, col, 1, 70);
      if (f.u < 1) return;
      // atterrissage
      f.saut++;
      const dernier = f.saut > nbRebonds;
      if (dernier) {
        boom(f.x, f.y, rayonFinal, degatsFinale, col);
        shake = Math.max(shake, 8);
        ringFx(f.x, f.y, "#ffffff", rayonFinal * 0.5, 0.2);
        spark(f.x, f.y, col, 20, 320);
        f.life = 0;
        return;
      }
      if (lg(w)) {
        boom(f.x, f.y, rayonPetit, degatsPetite, col); // légendaire : une vraie petite explosion
      } else {
        // un simple choc : il repousse et blesse un peu
        SFX.hit();
        ringFx(f.x, f.y, col, 40, 0.18);
        enemies.forEach((e) => {
          const dx = e.x - f.x;
          const dy = e.y - f.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (e.hp > 0 && distance < 42 + e.r) strike(e, degatsRebond, (dx / distance) * 200, (dy / distance) * 200, "blast");
        });
      }
      spark(f.x, f.y, col, 8, 200);
      // le prochain rebond : vers l'ennemi le plus proche de là où elle est (sinon elle continue tout droit)
      const prochain = nearest(180, f.x, f.y);
      let cx = f.x + Math.cos(P.aim) * 70;
      let cy = f.y + Math.sin(P.aim) * 70;
      if (prochain) {
        cx = prochain.x;
        cy = prochain.y;
      }
      f.de = [f.x, f.y];
      f.vers = [clamp(cx, 30, ARENA_W - 30), clamp(cy, 30, ARENA_H - 30)];
      f.u = 0;
    },
    draw(f, toile) {
      // l'ombre au sol (qui rétrécit quand la grenade monte), puis la grenade en l'air
      const echelle = 1 - f.hauteur / 90;
      toile.fillStyle = "#000000";
      toile.globalAlpha = 0.35;
      toile.beginPath();
      toile.ellipse(f.x, f.y + 4, 8 * echelle, 3 * echelle, 0, 0, 6.283);
      toile.fill();
      toile.globalAlpha = 1;
      const gy = f.y - f.hauteur;
      toile.fillStyle = "#243a1f";
      toile.beginPath();
      toile.arc(f.x, gy, 6, 0, 6.283);
      toile.fill();
      toile.strokeStyle = col;
      toile.lineWidth = 1.5;
      toile.stroke();
      toile.fillStyle = col; // la goupille
      toile.fillRect(f.x - 1, gy - 9, 2, 4);
      toile.globalCompositeOperation = "lighter";
      toile.globalAlpha = 0.5 + 0.3 * Math.sin(t * 30);
      toile.beginPath();
      toile.arc(f.x, gy - 9, 3, 0, 6.283);
      toile.fill();
      toile.globalCompositeOperation = "source-over";
      toile.globalAlpha = 1;
    },
  });
};

/* ---------- Le nœud électrique ---------- */
const lancerReseau = (w, hotes) => {
  const col = WEAPON_COLOR.elecnode;
  const duree = 6 * (1 + (w.dur || 0));
  const degatsArc = st.dmg * 1.4 * (1 + (w.dm || 0));
  const degatsHote = st.dmg * 2 * (1 + (w.dm || 0));
  const niveauPropagation = lg(w);
  const bornes = hotes.map((e) => ({ e }));
  let prochainArc = 0.15;
  let prochainHote = 0.4;
  let prochainEclair = 0.9;

  // les arcs : chaque borne est reliée à ses deux plus proches voisines
  const arcs = () => {
    const liste = [];
    bornes.forEach((a, i) => {
      const voisines = bornes
        .map((b, j) => ({ b, j, d: Math.hypot(a.e.x - b.e.x, a.e.y - b.e.y) }))
        .filter((o) => o.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2);
      voisines.forEach((o) => {
        if (!liste.some((l) => (l.a === o.b && l.b === a) || (l.a === a && l.b === o.b))) liste.push({ a, b: o.b });
      });
    });
    return liste;
  };

  fx.push({
    k: "custom", life: duree, t: duree,
    tick(f, h) {
      // un hôte mort : sans légendaire la borne disparaît ; avec, elle saute sur l'ennemi libre le plus proche
      for (let i = bornes.length - 1; i >= 0; i--) {
        const b = bornes[i];
        if (b.e.hp > 0) continue;
        let relais = null;
        if (niveauPropagation) {
          let meilleureDistance = 220;
          enemies.forEach((e) => {
            if (e.hp <= 0 || e.type === "boss" || bornes.some((o) => o.e === e)) return;
            const d = Math.hypot(e.x - b.e.x, e.y - b.e.y);
            if (d < meilleureDistance) {
              meilleureDistance = d;
              relais = e;
            }
          });
        }
        if (relais) {
          fx.push({ k: "bolt", color: col, pts: [[b.e.x, b.e.y], [relais.x, relais.y]], life: 0.15, t: 0.15 });
          b.e = relais;
        } else {
          bornes.splice(i, 1);
        }
      }
      if (bornes.length < 2) {
        f.life = 0; // plus assez de bornes : le réseau s'éteint
        return;
      }
      const liste = arcs();
      prochainArc -= h;
      prochainHote -= h;
      prochainEclair -= h;
      // les arcs blessent ce qui les frôle
      if (prochainArc <= 0) {
        prochainArc = 0.35;
        liste.forEach((arc) => {
          enemies.forEach((e) => {
            if (e.hp <= 0 || e === arc.a.e || e === arc.b.e) return;
            if (distanceSegment(e.x, e.y, arc.a.e.x, arc.a.e.y, arc.b.e.x, arc.b.e.y) < 14 + e.r) {
              strike(e, degatsArc, 0, 0, "bolt");
              spark(e.x, e.y, col, 3, 150);
            }
          });
        });
      }
      // chaque borne foudroie son hôte
      if (prochainHote <= 0) {
        prochainHote = 0.6;
        bornes.forEach((b) => {
          strike(b.e, degatsHote, 0, 0, "bolt");
          spark(b.e.x, b.e.y, col, 4, 170);
        });
      }
      // légendaire : le milieu de chaque arc lance un éclair sur un voisin (un par reprise)
      if (niveauPropagation && prochainEclair <= 0) {
        prochainEclair = 0.7;
        liste.forEach((arc) => {
          const mx = (arc.a.e.x + arc.b.e.x) / 2;
          const my = (arc.a.e.y + arc.b.e.y) / 2;
          const voisins = enemies
            .filter((e) => e.hp > 0 && e !== arc.a.e && e !== arc.b.e && Math.hypot(e.x - mx, e.y - my) < 110)
            .sort((p, q) => Math.hypot(p.x - mx, p.y - my) - Math.hypot(q.x - mx, q.y - my))
            .slice(0, niveauPropagation);
          voisins.forEach((e) => {
            strike(e, degatsArc * 1.2, 0, 0, "bolt");
            fx.push({ k: "bolt", color: col, pts: [[mx, my], [e.x, e.y]], life: 0.14, t: 0.14 });
          });
        });
      }
    },
    draw(f, toile) {
      const apparition = Math.min(1, (f.t - f.life) / 0.25);
      const fondu = f.life < 0.4 ? f.life / 0.4 : 1;
      const liste = arcs();
      toile.lineCap = "round";
      toile.lineJoin = "round";
      // les arcs : des lignes brisées qui frétillent (le bruit change 18 fois par seconde)
      liste.forEach((arc, n) => {
        const ax = arc.a.e.x;
        const ay = arc.a.e.y;
        const bx = ax + (arc.b.e.x - ax) * apparition;
        const by = ay + (arc.b.e.y - ay) * apparition;
        const longueur = Math.hypot(bx - ax, by - ay) || 1;
        const nx = -(by - ay) / longueur;
        const ny = (bx - ax) / longueur;
        const segments = Math.max(3, Math.round(longueur / 16));
        const graine = Math.floor(t * 18) * 7.3 + n * 3.1;
        const trace = () => {
          toile.beginPath();
          toile.moveTo(ax, ay);
          for (let i = 1; i < segments; i++) {
            const u = i / segments;
            const decal = Math.sin(graine + i * 12.9) * 6;
            toile.lineTo(ax + (bx - ax) * u + nx * decal, ay + (by - ay) * u + ny * decal);
          }
          toile.lineTo(bx, by);
          toile.stroke();
        };
        toile.globalCompositeOperation = "lighter";
        toile.strokeStyle = col;
        toile.globalAlpha = 0.45 * fondu;
        toile.lineWidth = 8;
        trace();
        toile.globalCompositeOperation = "source-over";
        toile.strokeStyle = "#ffffff";
        toile.globalAlpha = 0.9 * fondu;
        toile.lineWidth = 1.5;
        trace();
      });
      // les bornes : un losange lumineux au-dessus de chaque hôte, qui pulse
      bornes.forEach((b) => {
        const taille = 7 + Math.sin(t * 12 + b.e.x) * 1.5;
        const x = b.e.x;
        const y = b.e.y - b.e.r - 10;
        toile.globalAlpha = fondu;
        toile.fillStyle = col;
        toile.beginPath();
        toile.moveTo(x, y - taille);
        toile.lineTo(x + taille * 0.7, y);
        toile.lineTo(x, y + taille);
        toile.lineTo(x - taille * 0.7, y);
        toile.closePath();
        toile.fill();
        toile.fillStyle = "#ffffff";
        toile.beginPath();
        toile.arc(x, y, 2, 0, 6.283);
        toile.fill();
      });
      toile.lineCap = "butt";
      toile.globalAlpha = 1;
    },
  });
};

/* ---------- L'orage magnétique ---------- */
const lancerOrage = (w, x, y) => {
  const col = WEAPON_COLOR.magstorm;
  const rayonChamp = 170 * (1 + (w.rad || 0));
  const dureeAttraction = 1.3;
  const nbEclairs = 5 + (w.n || 0);
  const pasEclair = 0.17;
  const degats = st.dmg * 3.5 * (1 + (w.dm || 0));
  const degatsFinal = st.dmg * 8 * (1 + (w.dm || 0));
  const nbOndes = lg(w);
  const dureeTotale = dureeAttraction + nbEclairs * pasEclair + 0.5;
  const eclairs = []; // les éclairs en train de s'afficher : { px, py, decals, vie }
  let lances = 0;

  fx.push({
    k: "custom", life: dureeTotale, t: dureeTotale,
    tick(f, h) {
      const ecoule = f.t - f.life;
      // 1) le champ : tout est attiré vers le point (les boss à peine)
      if (ecoule < dureeAttraction + 0.1) {
        enemies.forEach((e) => {
          if (e.hp <= 0) return;
          const dx = x - e.x;
          const dy = y - e.y;
          const distance = Math.hypot(dx, dy);
          if (distance > rayonChamp || distance < 8) return;
          const force = (e.type === "boss" ? 40 : 230) * (0.4 + 0.6 * (1 - distance / rayonChamp));
          e.x += (dx / distance) * Math.min(distance, force * h);
          e.y += (dy / distance) * Math.min(distance, force * h);
        });
      }
      // 2) la salve : un éclair tous les 0,17 s, le dernier est énorme
      while (lances < nbEclairs && ecoule >= dureeAttraction + lances * pasEclair) {
        const dernier = lances === nbEclairs - 1;
        const [px, py] = dernier ? [x, y] : autour(x, y, 34);
        const rayon = dernier ? 80 : 42;
        const d = dernier ? degatsFinal : degats;
        enemies.forEach((e) => {
          const dx = e.x - px;
          const dy = e.y - py;
          const distance = Math.hypot(dx, dy) || 1;
          if (e.hp > 0 && distance < rayon + e.r) strike(e, d, (dx / distance) * 120, (dy / distance) * 120, "bolt");
        });
        const decals = [];
        for (let i = 0; i < 9; i++) decals.push(rnd(-14, 14));
        eclairs.push({ px, py, decals, vie: dernier ? 0.3 : 0.16, vieMax: dernier ? 0.3 : 0.16, gros: dernier });
        ringFx(px, py, col, rayon, 0.2);
        spark(px, py, col, dernier ? 18 : 8, dernier ? 320 : 220);
        SFX.hit();
        if (dernier) {
          SFX.bomb();
          shake = Math.max(shake, 8);
          // légendaire : une onde de choc électrique qui s'élargit (une de plus par reprise, décalées)
          for (let k = 0; k < nbOndes; k++) {
            fx.push({ k: "custom", life: 0.001 + k * 0.25, t: 0.001 + k * 0.25, onEnd: () => ondeDeChoc(x, y, 230 * (1 + 0.15 * k), degats * 1.2, 0.4, col), draw() {} });
          }
        }
        lances++;
      }
      for (let i = eclairs.length - 1; i >= 0; i--) {
        eclairs[i].vie -= h;
        if (eclairs[i].vie <= 0) eclairs.splice(i, 1);
      }
    },
    draw(f, toile) {
      const ecoule = f.t - f.life;
      const fondu = f.life < 0.4 ? f.life / 0.4 : 1;
      const apparition = Math.min(1, ecoule / 0.35);
      const eclatNuage = eclairs.length ? 1 : 0; // les nuages s'éclairent quand la foudre tombe
      // 1) les lignes du champ magnétique : des spirales qui convergent vers le point
      if (ecoule < dureeAttraction + 0.2) {
        toile.globalCompositeOperation = "lighter";
        toile.strokeStyle = col;
        toile.lineWidth = 1.5;
        toile.globalAlpha = 0.35 * apparition;
        for (let k = 0; k < 6; k++) {
          toile.beginPath();
          for (let i = 0; i <= 20; i++) {
            const u = i / 20;
            const r = rayonChamp * (1 - u);
            const a = (k * 6.283) / 6 + u * 2.4 + t * 1.4;
            const px = x + Math.cos(a) * r;
            const py = y + Math.sin(a) * r;
            if (i) toile.lineTo(px, py);
            else toile.moveTo(px, py);
          }
          toile.stroke();
        }
        toile.globalCompositeOperation = "source-over";
      }
      // 2) le nuage d'orage au-dessus du point : des disques sombres qui tournent lentement
      toile.fillStyle = eclatNuage ? "#b9a8ff" : "#2a2540";
      for (let k = 0; k < 6; k++) {
        const a = t * 0.8 + (k * 6.283) / 6;
        toile.globalAlpha = (0.5 + (eclatNuage ? 0.35 : 0)) * apparition * fondu;
        toile.beginPath();
        toile.arc(x + Math.cos(a) * 34, y - 96 + Math.sin(a) * 9, 22 + (k % 2) * 6, 0, 6.283);
        toile.fill();
      }
      // 3) les éclairs : un trait brisé qui tombe du nuage jusqu'au point d'impact
      eclairs.forEach((e) => {
        const u = e.vie / e.vieMax;
        const hauteur = 96;
        const points = [];
        for (let i = 0; i <= 8; i++) {
          const v = i / 8;
          points.push([e.px + e.decals[i] * (1 - v) * (e.gros ? 1.6 : 1), e.py - hauteur * (1 - v)]);
        }
        const tracer = () => {
          toile.beginPath();
          points.forEach((p, i) => (i ? toile.lineTo(p[0], p[1]) : toile.moveTo(p[0], p[1])));
          toile.stroke();
        };
        toile.lineJoin = "round";
        toile.globalCompositeOperation = "lighter";
        toile.strokeStyle = col;
        toile.globalAlpha = 0.5 * u;
        toile.lineWidth = e.gros ? 18 : 9;
        tracer();
        toile.globalCompositeOperation = "source-over";
        toile.strokeStyle = "#ffffff";
        toile.globalAlpha = u;
        toile.lineWidth = e.gros ? 4 : 2;
        tracer();
      });
      toile.globalAlpha = 1;
    },
  });
};

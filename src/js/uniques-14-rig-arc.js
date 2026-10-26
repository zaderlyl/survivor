"use strict";

/* ---------- Rig : le Marteau hydraulique · Arc : le Laser courbé et la Prison lumineuse ---------- */

// Le centre du plus gros amas d'ennemis à portée : on compte, pour chaque ennemi, ses voisins dans `rayon`.
// Renvoie { e, voisins } (l'ennemi au cœur de l'amas), ou null s'il n'y a personne. Le plus proche gagne les égalités.
const meilleurAmas = (portee, rayon) => {
  const candidats = [];
  for (let i = 0; i < enemies.length && candidats.length < 80; i++) {
    const e = enemies[i];
    if (e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < portee) candidats.push(e);
  }
  let meilleur = null;
  let meilleurScore = -1;
  let meilleureDistance = 1e9;
  candidats.forEach((e) => {
    let voisins = 0;
    for (let j = 0; j < enemies.length; j++) {
      const o = enemies[j];
      if (o.hp > 0 && Math.hypot(o.x - e.x, o.y - e.y) < rayon) voisins++;
    }
    const distance = Math.hypot(e.x - P.x, e.y - P.y);
    if (voisins > meilleurScore || (voisins === meilleurScore && distance < meilleureDistance)) {
      meilleur = e;
      meilleurScore = voisins;
      meilleureDistance = distance;
    }
  });
  return meilleur ? { e: meilleur, voisins: meilleurScore } : null;
};

Object.assign(WEAPONS, {
  // ---------- Marteau hydraulique (Rig) ----------
  // Un bras mécanique géant descend du ciel sur le plus gros groupe d'ennemis. Un cercle ambre annonce l'impact (0,55 s).
  // L'impact écrase le centre, laisse des fissures au sol et lance une onde de choc qui repousse et étourdit tout sur son passage.
  // Légendaire : l'impact provoque deux ondes supplémentaires (et chaque reprise en ajoute deux autres).
  hydrohammer: {
    char: "rig",
    name: "Marteau hydraulique",
    intro: "un bras mécanique frappe le sol et crée une onde de choc",
    legendText: "l'impact provoque deux ondes supplémentaires",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du marteau", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "onde de choc " + pct(v) + " plus large", apply: bump("rad") },
      { id: "stun", max: 99, vals: [0.3, 0.6, 1], text: (v) => "l'onde étourdit " + pct(v) + " plus longtemps", apply: bump("stun") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le marteau revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const amas = meilleurAmas(st.range * 0.95, 90);
      if (!amas) return;
      w.cd = slow(w, 6) * cdMul();
      lancerMarteau(w, amas.e.x, amas.e.y);
    },
  },

  // ---------- Laser courbé (Arc) ----------
  // Un faisceau part en courbe, du côté où il y a le moins d'ennemis, pour atteindre le plus costaud sans toucher les autres :
  // il les contourne. Il frappe fort la cible et elle seule.
  // Légendaire : il blesse aussi tous les ennemis sur son trajet (60 % des dégâts ; chaque reprise ajoute 40 %).
  curvedlaser: {
    char: "arc",
    name: "Laser courbé",
    intro: "un faisceau contourne les ennemis pour frapper sa cible",
    legendText: "il touche aussi les ennemis sur son trajet",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "faisceau") + " sur d'autres cibles", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du laser", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le laser revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const portee = st.range * 1.05 * (1 + (w.rng || 0));
      // les cibles : les ennemis à portée, les plus costauds d'abord (les boss en premier)
      const cibles = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < portee).sort((a, b) => (b.type === "boss") - (a.type === "boss") || b.hp - a.hp);
      if (!cibles.length) return;
      w.cd = slow(w, 3.4) * cdMul();
      SFX.wave();
      const nbFaisceaux = 1 + (w.n || 0);
      for (let k = 0; k < nbFaisceaux && k < cibles.length; k++) {
        const cote = tirerLaserCourbe(w, cibles[k], k);
        if (k === 0) P.aim = Math.atan2(cibles[0].y - P.y, cibles[0].x - P.x) + cote * 0.1;
      }
    },
  },

  // ---------- Prison lumineuse (Arc) ----------
  // Six pylônes de lumière se posent autour d'un groupe d'ennemis et se relient en faisceaux : ceux qui sont dedans ne peuvent plus
  // sortir, ceux qui sont dehors ne peuvent plus entrer. Les murs brûlent ce qui les touche.
  // Légendaire : la prison se referme peu à peu en écrasant ce qui est dedans, puis implose (chaque reprise : plus fort).
  lightprison: {
    char: "arc",
    name: "Prison lumineuse",
    intro: "des faisceaux enferment les ennemis dans une zone",
    legendText: "la prison se referme en infligeant des dégâts",
    legendStacks: true,
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des murs", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "prison " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la prison tient " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const amas = meilleurAmas(st.range, 110);
      if (!amas || amas.voisins < 3) return; // une prison pour un seul ennemi, ça ne sert à rien
      const duree = 4.5 * (1 + (w.dur || 0));
      w.cd = slow(w, 9) * cdMul() + duree * 0.5;
      SFX.boss();
      lancerPrison(w, amas.e.x, amas.e.y, duree);
    },
  },
});

/* ---------- Le marteau ---------- */
const lancerMarteau = (w, x, y) => {
  const col = WEAPON_COLOR.hydrohammer;
  const delaiChute = 0.55; // le temps que le bras descende (le cercle d'avertissement)
  const rayonOnde = 190 * (1 + (w.rad || 0));
  const degatsImpact = st.dmg * 7 * (1 + (w.dm || 0));
  const degatsOnde = st.dmg * 3.5 * (1 + (w.dm || 0));
  const etourdissement = 0.5 * (1 + (w.stun || 0));
  const nbOndes = 1 + 2 * lg(w);
  SFX.boss();

  fx.push({
    k: "custom", life: delaiChute + 0.7, t: delaiChute + 0.7, x, y, frappe: false,
    tick(f) {
      const ecoule = f.t - f.life;
      if (f.frappe || ecoule < delaiChute) return;
      f.frappe = true;
      // l'impact : tout ce qui est sous la tête du marteau est écrasé
      SFX.bomb();
      shake = Math.max(shake, 11);
      freeze = Math.max(freeze, 0.04); // un tout petit arrêt sur image, pour le poids
      enemies.forEach((e) => {
        const dx = e.x - x;
        const dy = e.y - y;
        const distance = Math.hypot(dx, dy) || 1;
        if (e.hp > 0 && distance < 50 + e.r) {
          strike(e, degatsImpact, (dx / distance) * 220, (dy / distance) * 220, "blast");
          if (e.type !== "boss") e.frozen = Math.max(e.frozen || 0, etourdissement * 1.5);
        }
      });
      ringFx(x, y, col, 70, 0.3);
      ringFx(x, y, "#ffffff", 36, 0.2);
      spark(x, y, col, 22, 340);
      fissuresAuSol(x, y, col);
      // les ondes de choc : une par « reprise légendaire » supplémentaire, un peu décalées et de plus en plus larges
      for (let k = 0; k < nbOndes; k++) {
        fx.push({ k: "custom", life: 0.001 + k * 0.28, t: 0.001 + k * 0.28, onEnd: () => ondeDeChoc(x, y, rayonOnde * (1 + 0.14 * k), degatsOnde, etourdissement, col), draw() {} });
      }
    },
    // le bras : une colonne d'acier à pistons qui tombe du haut, puis qui remonte
    draw(f, toile) {
      const ecoule = f.t - f.life;
      const chute = Math.min(1, ecoule / delaiChute); // 0 → 1 pendant la descente
      // le cercle d'avertissement, qui se resserre
      if (chute < 1) {
        toile.strokeStyle = col;
        toile.lineWidth = 2;
        toile.globalAlpha = 0.4 + 0.4 * chute;
        toile.setLineDash([6, 6]);
        toile.beginPath();
        toile.arc(x, y, 50 + 40 * (1 - chute), 0, 6.283);
        toile.stroke();
        toile.setLineDash([]);
        toile.fillStyle = col;
        toile.globalAlpha = 0.12 * chute;
        toile.beginPath();
        toile.arc(x, y, 50, 0, 6.283);
        toile.fill();
      }
      // la hauteur de la tête : elle accélère en tombant, puis remonte vite après l'impact
      let teteY;
      if (ecoule < delaiChute) teteY = y - 520 * (1 - chute * chute);
      else teteY = y - 520 * Math.min(1, Math.pow((ecoule - delaiChute) / 0.5, 2));
      const alpha = ecoule < delaiChute + 0.5 ? 1 : Math.max(0, 1 - (ecoule - delaiChute - 0.5) / 0.2);
      toile.globalAlpha = alpha;
      // la colonne : un vérin (rectangle sombre) avec des anneaux clairs
      toile.fillStyle = "#2a2f3a";
      toile.fillRect(x - 11, teteY - 560, 22, 560);
      toile.fillStyle = "#4a5263";
      toile.fillRect(x - 7, teteY - 560, 14, 560);
      toile.fillStyle = col;
      for (let k = 0; k < 14; k++) toile.fillRect(x - 12, teteY - 20 - k * 38, 24, 3);
      // la tête du marteau : un bloc massif avec des liserés ambre
      toile.fillStyle = "#171a21";
      toile.fillRect(x - 28, teteY - 24, 56, 30);
      toile.fillStyle = "#566074";
      toile.fillRect(x - 25, teteY - 21, 50, 8);
      toile.fillStyle = col;
      toile.fillRect(x - 28, teteY + 2, 56, 4);
      toile.fillRect(x - 28, teteY - 24, 56, 2);
      toile.globalAlpha = 1;
    },
  });
};

// une onde de choc qui s'élargit depuis (x, y) : repousse, blesse et étourdit ce qu'elle traverse (une fois par ennemi)
const ondeDeChoc = (x, y, rayonMax, degats, etourdissement, col) => {
  const vitesse = 430;
  const touches = new Set();
  const duree = rayonMax / vitesse + 0.15;
  SFX.wave();
  fx.push({
    k: "custom", life: duree, t: duree, r: 20,
    tick(f, h) {
      f.r = Math.min(rayonMax, f.r + vitesse * h);
      enemies.forEach((e) => {
        if (e.hp <= 0 || touches.has(e)) return;
        const dx = e.x - x;
        const dy = e.y - y;
        const distance = Math.hypot(dx, dy) || 1;
        if (Math.abs(distance - f.r) > 22 + e.r) return;
        touches.add(e);
        strike(e, degats, (dx / distance) * 280, (dy / distance) * 280, "blast");
        if (e.type !== "boss") e.frozen = Math.max(e.frozen || 0, etourdissement);
        spark(e.x, e.y, col, 4, 180);
      });
    },
    draw(f, toile) {
      const avancement = f.r / rayonMax;
      const fondu = f.r >= rayonMax ? Math.max(0, f.life / 0.15) : 1;
      toile.globalCompositeOperation = "lighter";
      toile.strokeStyle = col;
      toile.globalAlpha = (0.55 - 0.3 * avancement) * fondu;
      toile.lineWidth = 16 * (1 - 0.6 * avancement) + 3;
      toile.beginPath();
      toile.arc(x, y, f.r, 0, 6.283);
      toile.stroke();
      toile.globalCompositeOperation = "source-over";
      toile.strokeStyle = "#ffffff";
      toile.globalAlpha = (0.85 - 0.5 * avancement) * fondu;
      toile.lineWidth = 2;
      toile.beginPath();
      toile.arc(x, y, f.r, 0, 6.283);
      toile.stroke();
      toile.globalAlpha = 1;
    },
  });
};

// les fissures laissées au sol par l'impact : des traits qui rayonnent et s'effacent en 2 s
const fissuresAuSol = (x, y, col) => {
  const traits = [];
  for (let k = 0; k < 9; k++) {
    const angle = (k / 9) * 6.283 + rnd(-0.2, 0.2);
    traits.push({ a: angle, l: rnd(35, 78), tordu: rnd(-0.35, 0.35) });
  }
  fx.push({
    k: "custom", life: 2, t: 2,
    draw(f, toile) {
      const u = f.life / f.t;
      toile.lineCap = "round";
      traits.forEach((c) => {
        const milieuX = x + Math.cos(c.a) * c.l * 0.5;
        const milieuY = y + Math.sin(c.a) * c.l * 0.5;
        const boutX = milieuX + Math.cos(c.a + c.tordu) * c.l * 0.5;
        const boutY = milieuY + Math.sin(c.a + c.tordu) * c.l * 0.5;
        toile.strokeStyle = "#07070b";
        toile.globalAlpha = 0.8 * u;
        toile.lineWidth = 5;
        toile.beginPath();
        toile.moveTo(x, y);
        toile.lineTo(milieuX, milieuY);
        toile.lineTo(boutX, boutY);
        toile.stroke();
        toile.strokeStyle = col;
        toile.globalAlpha = 0.7 * u * u;
        toile.lineWidth = 1.5;
        toile.stroke();
      });
      toile.lineCap = "butt";
      toile.globalAlpha = 1;
    },
  });
};

/* ---------- Le laser courbé ---------- */
// Tire un faisceau en courbe (de Bézier) vers `cible`, du côté qui évite le plus d'ennemis. Renvoie le côté choisi (1 ou -1).
const tirerLaserCourbe = (w, cible, numero) => {
  const col = WEAPON_COLOR.curvedlaser;
  const x0 = P.x;
  const y0 = P.y;
  const x2 = cible.x;
  const y2 = cible.y;
  const dx = x2 - x0;
  const dy = y2 - y0;
  const longueur = Math.hypot(dx, dy) || 1;
  const nx = -dy / longueur; // le vecteur perpendiculaire
  const ny = dx / longueur;

  // les deux courbes possibles (bombée à gauche ou à droite) ; on compte les ennemis qu'elles frôleraient
  const courbe = (cote) => {
    const cx = (x0 + x2) / 2 + nx * cote * longueur * 0.5;
    const cy = (y0 + y2) / 2 + ny * cote * longueur * 0.5;
    const points = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const a = (1 - u) * (1 - u);
      const b = 2 * (1 - u) * u;
      const c = u * u;
      points.push({ x: a * x0 + b * cx + c * x2, y: a * y0 + b * cy + c * y2 });
    }
    let frolements = 0;
    enemies.forEach((e) => {
      if (e === cible || e.hp <= 0) return;
      for (let i = 0; i < points.length; i += 2) {
        if (Math.hypot(points[i].x - e.x, points[i].y - e.y) < 18 + e.r) {
          frolements++;
          break;
        }
      }
    });
    return { points, frolements };
  };
  const gauche = courbe(1);
  const droite = courbe(-1);
  w.cote = -(w.cote || 1); // à égalité, on alterne
  let cote = w.cote;
  if (gauche.frolements < droite.frolements) cote = 1;
  else if (droite.frolements < gauche.frolements) cote = -1;
  const points = cote === 1 ? gauche.points : droite.points;

  const degats = st.dmg * 9 * (1 + (w.dm || 0));
  const partDuTrajet = lg(w) ? 0.6 + 0.4 * (lg(w) - 1) : 0; // légendaire : le trajet blesse aussi
  const dureeTrace = 0.2; // le temps que la lumière parcoure la courbe

  fx.push({
    k: "custom", life: 0.55, t: 0.55, frappe: false,
    tick(f) {
      const ecoule = f.t - f.life;
      if (f.frappe || ecoule < dureeTrace) return;
      f.frappe = true;
      // l'impact sur la cible
      if (cible.hp > 0) {
        strike(cible, degats, (x2 - x0) / longueur * 90, (y2 - y0) / longueur * 90, "beam");
      }
      ringFx(x2, y2, col, 34, 0.22);
      spark(x2, y2, col, 12, 260);
      SFX.hit();
      // légendaire : tous les ennemis proches de la courbe sont blessés
      if (partDuTrajet) {
        enemies.forEach((e) => {
          if (e === cible || e.hp <= 0) return;
          for (let i = 0; i < points.length; i++) {
            if (Math.hypot(points[i].x - e.x, points[i].y - e.y) < 14 + e.r) {
              strike(e, degats * partDuTrajet, 0, 0, "beam");
              spark(e.x, e.y, col, 4, 170);
              break;
            }
          }
        });
      }
    },
    draw(f, toile) {
      const ecoule = f.t - f.life;
      const avance = Math.min(1, ecoule / dureeTrace); // jusqu'où la lumière est arrivée
      const fondu = ecoule < dureeTrace ? 1 : Math.max(0, 1 - (ecoule - dureeTrace) / (f.t - dureeTrace));
      const jusqua = Math.max(1, Math.round(avance * (points.length - 1)));
      const tracer = () => {
        toile.beginPath();
        toile.moveTo(points[0].x, points[0].y);
        for (let i = 1; i <= jusqua; i++) toile.lineTo(points[i].x, points[i].y);
        toile.stroke();
      };
      toile.lineCap = "round";
      toile.lineJoin = "round";
      toile.globalCompositeOperation = "lighter";
      toile.strokeStyle = col;
      toile.globalAlpha = 0.3 * fondu;
      toile.lineWidth = 16;
      tracer();
      toile.globalAlpha = 0.65 * fondu;
      toile.lineWidth = 6;
      tracer();
      toile.globalCompositeOperation = "source-over";
      toile.strokeStyle = "#ffffff";
      toile.globalAlpha = 0.95 * fondu;
      toile.lineWidth = 2;
      tracer();
      // la tête lumineuse qui court le long de la courbe
      if (avance < 1) {
        toile.fillStyle = "#ffffff";
        toile.globalAlpha = 1;
        toile.beginPath();
        toile.arc(points[jusqua].x, points[jusqua].y, 5, 0, 6.283);
        toile.fill();
      }
      toile.lineCap = "butt";
      toile.globalAlpha = 1;
    },
  });
  return cote;
};

/* ---------- La prison lumineuse ---------- */
const lancerPrison = (w, x, y, duree) => {
  const col = WEAPON_COLOR.lightprison;
  const rayon0 = 110 * (1 + (w.rad || 0)); // le rayon de la prison (de pylône à pylône)
  const degats = st.dmg * 1.6 * (1 + (w.dm || 0));
  const ferme = lg(w) > 0; // légendaire : la prison se resserre
  const rayonFinal = rayon0 * Math.max(0.15, 0.35 - 0.05 * (lg(w) - 1));
  const dureeApparition = 0.35;
  const dureeFin = 0.3;
  const murs = new Map(); // ennemi -> instant où le mur peut le brûler à nouveau
  const dedans = new Set(enemies.filter((e) => e.hp > 0 && e.type !== "boss" && Math.hypot(e.x - x, e.y - y) < rayon0 * 0.86).map((e) => e)); // ceux qui sont pris au piège

  // le rayon du moment : constant, ou qui diminue (légendaire) sur toute la durée
  const rayonA = (ecoule) => {
    if (!ferme) return rayon0;
    const u = Math.min(1, Math.max(0, (ecoule - dureeApparition) / (duree - dureeApparition - dureeFin)));
    return rayon0 - (rayon0 - rayonFinal) * u * u;
  };

  fx.push({
    k: "custom", life: duree, t: duree, implose: false, pulsation: 0.6, eclat: 0,
    tick(f, h) {
      const ecoule = f.t - f.life;
      if (ecoule < dureeApparition) return; // le temps que les faisceaux se dessinent
      const rayon = rayonA(ecoule);
      // toutes les secondes, les murs envoient une décharge qui brûle tous les prisonniers (moitié des dégâts d'un contact)
      f.eclat = Math.max(0, f.eclat - h);
      f.pulsation -= h;
      if (f.pulsation <= 0) {
        f.pulsation = 1;
        f.eclat = 0.25;
        dedans.forEach((e) => {
          if (e.hp > 0) {
            strike(e, degats * 0.5, 0, 0, "beam");
            fx.push({ k: "bolt", color: col, pts: [[x, y], [e.x, e.y]], life: 0.12, t: 0.12 });
          }
        });
      }
      const rayonPhysique = rayon * 0.86; // le cercle qui touche les côtés de l'hexagone
      const mult = 1 + (ferme ? 1.2 * (1 - rayon / rayon0) : 0); // les murs brûlent de plus en plus en se resserrant
      enemies.forEach((e) => {
        if (e.hp <= 0 || e.type === "boss") return;
        const dx = e.x - x;
        const dy = e.y - y;
        const distance = Math.hypot(dx, dy) || 1;
        let touche = false;
        if (dedans.has(e)) {
          // prisonnier : il ne sort pas
          const limite = rayonPhysique - e.r;
          if (distance > limite) {
            e.x = x + (dx / distance) * limite;
            e.y = y + (dy / distance) * limite;
            touche = true;
          }
        } else if (distance < rayonPhysique + e.r + 4) {
          // dehors : il n'entre pas
          const limite = rayonPhysique + e.r + 4;
          e.x = x + (dx / distance) * limite;
          e.y = y + (dy / distance) * limite;
          touche = true;
        }
        if (touche && (murs.get(e) || 0) <= t) {
          murs.set(e, t + 0.45);
          strike(e, degats * mult, 0, 0, "beam");
          spark(e.x, e.y, col, 4, 170);
        }
      });
    },
    onEnd() {
      const rayon = rayonA(duree);
      if (ferme) {
        // légendaire : la prison implose sur ce qui reste dedans
        boom(x, y, rayon0 * 0.55, st.dmg * 5 * (1 + (w.dm || 0)) * (1 + 0.5 * (lg(w) - 1)), col);
        shake = Math.max(shake, 8);
      } else {
        ringFx(x, y, col, rayon, 0.3);
      }
      spark(x, y, col, 16, 300);
    },
    draw(f, toile) {
      const ecoule = f.t - f.life;
      const apparition = Math.min(1, ecoule / dureeApparition);
      const fondu = f.life < dureeFin ? f.life / dureeFin : 1;
      const rayon = rayonA(ecoule);
      const rotation = t * 0.25;
      const sommets = [];
      for (let k = 0; k < 6; k++) {
        const a = rotation + (k / 6) * 6.283;
        sommets.push({ x: x + Math.cos(a) * rayon, y: y + Math.sin(a) * rayon });
      }
      // 1) un voile très léger à l'intérieur, avec une grille qui défile
      toile.globalAlpha = 0.07 * apparition * fondu;
      toile.fillStyle = col;
      toile.beginPath();
      sommets.forEach((s, k) => (k ? toile.lineTo(s.x, s.y) : toile.moveTo(s.x, s.y)));
      toile.closePath();
      toile.fill();
      // 2) les six faisceaux, qui se tracent d'un pylône au suivant pendant l'apparition
      toile.lineCap = "round";
      for (let k = 0; k < 6; k++) {
        const a = sommets[k];
        const b = sommets[(k + 1) % 6];
        const bx = a.x + (b.x - a.x) * apparition;
        const by = a.y + (b.y - a.y) * apparition;
        toile.globalCompositeOperation = "lighter";
        toile.strokeStyle = col;
        toile.globalAlpha = Math.min(1, 0.35 + 0.15 * Math.sin(t * 9 + k) + 1.4 * f.eclat) * fondu;
        toile.lineWidth = 12;
        toile.beginPath();
        toile.moveTo(a.x, a.y);
        toile.lineTo(bx, by);
        toile.stroke();
        toile.globalCompositeOperation = "source-over";
        toile.strokeStyle = "#ffffff";
        toile.globalAlpha = 0.9 * fondu;
        toile.lineWidth = 2;
        toile.beginPath();
        toile.moveTo(a.x, a.y);
        toile.lineTo(bx, by);
        toile.stroke();
      }
      // 3) les pylônes : un petit losange lumineux à chaque sommet
      toile.fillStyle = "#ffffff";
      sommets.forEach((s) => {
        toile.globalAlpha = fondu;
        toile.beginPath();
        toile.moveTo(s.x, s.y - 7);
        toile.lineTo(s.x + 5, s.y);
        toile.lineTo(s.x, s.y + 7);
        toile.lineTo(s.x - 5, s.y);
        toile.closePath();
        toile.fill();
      });
      toile.lineCap = "butt";
      toile.globalAlpha = 1;
    },
  });
};

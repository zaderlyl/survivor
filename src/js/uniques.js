"use strict";

/* ---------- Les armes uniques des personnages ---------- */
// même forme que les armes universelles (variantes, effet légendaire), mais `char` : elles ne sortent qu'avec leur personnage.

// un anneau de tirs autour de (x, y)
const ring = (x, y, n, off, spd, life, dmg) => {
  for (let k = 0; k < n; k++) fire(off + (k / n) * 6.283, spd, life, { x, y, dmg, color: WEAPON_COLOR.burst });
};

Object.assign(WEAPONS, {
  // ----- Volt -----

  // Tourelle : une mini-tourelle posée sur place, qui tire quelques secondes
  turret: {
    char: "volt",
    name: "Tourelle",
    intro: "pose une mini-tourelle qui tire quelques secondes",
    legendText: "la tourelle explose à la fin",
    cd0: 1,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "tourelle") + " posée à la fois", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des tourelles", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "les tourelles tirent " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "les tourelles durent " + pct(v) + " plus longtemps", apply: bump("dur") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = 5 * cdMul();
      const dur = 6 * (1 + (w.dur || 0)), d = st.dmg * 0.5 * (1 + (w.dm || 0));
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const a = rnd(0, 6.283);
        fx.push({ k: "turret", color: WEAPON_COLOR.turret, x: P.x + Math.cos(a) * 34, y: P.y + Math.sin(a) * 34, life: dur, t: dur, cd: 0.3,
          tick(f, h) {
            f.cd -= h;
            if (f.cd > 0) return;
            const tgt = nearest(260 * rngMul(), f.x, f.y);
            if (!tgt) return;
            f.cd = slow(w, 0.3) * cdMul();
            f.a = Math.atan2(tgt.y - f.y, tgt.x - f.x);
            fire(f.a, 520, 0.5, { x: f.x, y: f.y, dmg: d, color: WEAPON_COLOR.turret });
            spark(f.x + Math.cos(f.a) * 8, f.y + Math.sin(f.a) * 8, WEAPON_COLOR.turret, 2, 100);
          },
          onEnd(f) { if (w.legend) boom(f.x, f.y, 60, st.dmg * 3 * (1 + (w.dm || 0)), WEAPON_COLOR.turret); } });
      }
    },
  },

  // Rafale en cercle : un anneau de tirs tout autour de lui
  burst: {
    char: "volt",
    name: "Rafale en cercle",
    intro: "des tirs partent tout autour de toi, à intervalles réguliers",
    legendText: "une seconde rafale suit, décalée",
    cd0: 2,
    variants: [
      { id: "n", max: 6, vals: [2, 4, 6], text: (v) => "+" + plural(v, "tir") + " par rafale", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la rafale", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "la rafale revient " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée de la rafale +" + pct(v), apply: bump("rng") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = slow(w, 3) * cdMul();
      SFX.shoot();
      const n = 12 + (w.n || 0), life = 0.5 * (1 + (w.rng || 0)) * rngMul(), d = st.dmg * 0.7 * (1 + (w.dm || 0)), off = rnd(0, 6.283);
      ringFx(P.x, P.y, WEAPON_COLOR.burst, 30, 0.2);
      flashFx(P.x, P.y, WEAPON_COLOR.burst, 18);
      ring(P.x, P.y, n, off, 480, life, d);
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.3, t: 0.3, onEnd: (f) => ring(P.x, P.y, n, off + 3.1416 / n, 480, life, d) });
    },
  },

  // Mortier : un obus retombe sur un ennemi proche, grosse explosion
  mortar: {
    char: "volt",
    name: "Mortier",
    intro: "un obus retombe sur un ennemi proche et explose en grande zone",
    legendText: "l'explosion lâche 4 petites bombes",
    cd0: 1,
    variants: [
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du mortier", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le mortier tire " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "obus") + " à chaque tir", apply: bump("n") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 380 * rngMul());
      if (!cand.length) return;
      w.cd = slow(w, 2.6) * cdMul();
      const R = 70 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0));
      SFX.shoot();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const tg = cand[(Math.random() * cand.length) | 0];
        fx.push({ k: "shell", color: WEAPON_COLOR.mortar, tx: tg.x, ty: tg.y, R, life: 0.8, t: 0.8,
          onEnd(f) {
            boom(f.tx, f.ty, R, d, WEAPON_COLOR.mortar);
            if (w.legend) for (let j = 0; j < 4; j++) {
              const a = (j / 4) * 6.283 + 0.7;
              fx.push({ k: "flash", x: f.tx + Math.cos(a) * R * 0.7, y: f.ty + Math.sin(a) * R * 0.7, life: 0.2, t: 0.2, onEnd: (q) => boom(q.x, q.y, R * 0.45, d * 0.4, WEAPON_COLOR.mortar) });
            }
          } });
      }
    },
  },
});

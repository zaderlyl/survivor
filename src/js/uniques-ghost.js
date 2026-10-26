"use strict";

/* ---------- Les armes uniques de Ghost ---------- */

Object.assign(WEAPONS, {
  // Leurre : un clone qui attire les ennemis puis explose
  decoy: {
    char: "ghost",
    name: "Leurre",
    intro: "un clone attire les ennemis, puis explose",
    legendText: "une seconde explosion, plus grande, suit",
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du leurre", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le leurre tient " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "pose un leurre " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || enemies.length < 3) return;
      w.cd = slow(w, 8) * cdMul();
      const dur = 3.5 * (1 + (w.dur || 0)), R = 80 * (1 + (w.rad || 0)) * rngMul(), d = st.dmg * 6 * (1 + (w.dm || 0));
      fx.push({ k: "decoy", color: WEAPON_COLOR.decoy, spk: WEAPON_COLOR.decoy, x: P.x, y: P.y, life: dur, t: dur,
        onEnd(f) {
          boom(f.x, f.y, R, d, WEAPON_COLOR.decoy);
          if (w.legend) fx.push({ k: "flash", x: f.x, y: f.y, life: 0.35, t: 0.35, onEnd: (q) => boom(q.x, q.y, R * 1.5, d * 0.7, WEAPON_COLOR.decoy) });
        } });
    },
  },

  // Shurikens : un éventail de lames qui rebondissent d'un ennemi à l'autre
  shuriken: {
    char: "ghost",
    name: "Shurikens",
    intro: "un éventail de lames qui rebondissent d'un ennemi à l'autre",
    legendText: "les lames traversent un ennemi de plus",
    cd0: 1,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "shuriken") + " par lancer", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des shurikens", apply: bump("dm") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "lance les shurikens " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "bounce", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "rebond"), apply: bump("bounce") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 2.6) * cdMul();
      const base = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 4 + (w.n || 0), d = st.dmg * 1.3 * (1 + (w.dm || 0));
      P.aim = base;
      SFX.shoot();
      for (let k = 0; k < n; k++) fire(base + (k - (n - 1) / 2) * 0.28, 420, st.range / 420, { dmg: d, bounce: 2 + (w.bounce || 0), pierce: w.legend ? 1 : 0, star: true, size: 1.2, color: WEAPON_COLOR.shuriken });
    },
  },

  // Piège toxique : un nuage de poison posé au sol, qui ralentit et blesse
  toxic: {
    char: "ghost",
    name: "Piège toxique",
    intro: "un nuage de poison posé au sol ralentit et blesse",
    legendText: "les ennemis restent empoisonnés en sortant du nuage",
    cd0: 1,
    variants: [
      { id: "rad", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "nuage " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du poison", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le nuage dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "pose un nuage " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 260 * rngMul());
      if (!cand.length) return;
      w.cd = slow(w, 5) * cdMul();
      const tg = cand[(Math.random() * cand.length) | 0], R = 62 * (1 + (w.rad || 0)), dur = 5 * (1 + (w.dur || 0)), d = st.dmg * 0.6 * (1 + (w.dm || 0));
      fx.push({ k: "cloud", color: WEAPON_COLOR.toxic, emb: WEAPON_COLOR.toxic, x: tg.x, y: tg.y, R, life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.5;
          enemies.forEach((e) => {
            if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < R + e.r) {
              strike(e, d, 0, 0, "burn");
              e.slowed = 0.7;
              if (w.legend) { e.burn = 2; e.burnT = 0.5; }
            }
          });
        } });
    },
  },
});

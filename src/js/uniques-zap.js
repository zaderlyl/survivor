"use strict";

/* ---------- Les armes uniques de Zap ---------- */

// foudroie les `count` ennemis les plus proches de (x, y), dans un rayon
const zapAround = (x, y, range, count, d, color) => {
  const list = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - x, e.y - y) < range)
    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
    .slice(0, count);
  if (list.length) SFX.hit();
  list.forEach((e) => {
    strike(e, d, 0, 0, "bolt");
    fx.push({ k: "bolt", color, pts: [[x, y], [e.x, e.y]], life: 0.12, t: 0.12 });
    flashFx(e.x, e.y, color, 12);
  });
  return list;
};

Object.assign(WEAPONS, {
  // Orbe de tonnerre : une boule lente qui foudroie les ennemis proches
  thunder: {
    char: "zap",
    name: "Orbe de tonnerre",
    intro: "une boule d'énergie lente qui foudroie les ennemis qu'elle croise",
    legendText: "l'orbe foudroie 4 ennemis à la fois au lieu de 2",
    cd0: 2,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "orbe") + " lancé à la fois", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'orbe", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "l'orbe dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "lance l'orbe " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 6) * cdMul();
      const base = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 1 + (w.n || 0), dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 1.2 * (1 + (w.dm || 0)), hits = w.legend ? 4 : 2;
      SFX.shoot();
      for (let k = 0; k < n; k++) {
        const a = base + (k - (n - 1) / 2) * 0.7;
        fx.push({ k: "thunder", color: WEAPON_COLOR.thunder, spk: WEAPON_COLOR.thunder, x: P.x, y: P.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: dur, t: dur, cd: 0.3,
          tick(f, h) {
            f.x += f.vx * h;
            f.y += f.vy * h;
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.4;
            zapAround(f.x, f.y, 130, hits, d, WEAPON_COLOR.thunder);
          } });
      }
    },
  },

  // Champ électrique : une zone qui blesse et étourdit
  field: {
    char: "zap",
    name: "Champ électrique",
    intro: "une zone électrique blesse et étourdit les ennemis",
    legendText: "la zone te suit",
    cd0: 1,
    variants: [
      { id: "rad", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "zone " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du champ", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "le champ dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "pose un champ " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 260 * rngMul());
      if (!cand.length) return;
      w.cd = slow(w, 5) * cdMul();
      const tg = cand[(Math.random() * cand.length) | 0], R = 66 * (1 + (w.rad || 0)), dur = 3 * (1 + (w.dur || 0)), d = st.dmg * 0.5 * (1 + (w.dm || 0));
      SFX.wave();
      fx.push({ k: "cloud", color: WEAPON_COLOR.field, spk: WEAPON_COLOR.field, x: tg.x, y: tg.y, R, life: dur, t: dur, cd: 0,
        tick(f, h) {
          if (w.legend) { f.x = P.x; f.y = P.y; }
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.5;
          enemies.forEach((e) => {
            if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < R + e.r) { strike(e, d, 0, 0, "bolt"); e.frozen = 0.6; }
          });
        } });
    },
  },

  // Tesla : une bobine posée qui frappe autour d'elle
  tesla: {
    char: "zap",
    name: "Tesla",
    intro: "une bobine posée au sol frappe les ennemis autour d'elle",
    legendText: "la bobine foudroie deux fois plus d'ennemis",
    cd0: 1,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "bobine") + " posée à la fois", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la bobine", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "la bobine dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "pose une bobine " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = slow(w, 7) * cdMul();
      const dur = 6 * (1 + (w.dur || 0)), d = st.dmg * 1.5 * (1 + (w.dm || 0)), hits = w.legend ? 6 : 3;
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const a = rnd(0, 6.283);
        fx.push({ k: "tesla", color: WEAPON_COLOR.tesla, spk: WEAPON_COLOR.tesla, x: P.x + Math.cos(a) * 40, y: P.y + Math.sin(a) * 40, life: dur, t: dur, cd: 0.3,
          tick(f, h) {
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.6;
            zapAround(f.x, f.y, 140 * rngMul(), hits, d, WEAPON_COLOR.tesla);
          } });
      }
    },
  },
});

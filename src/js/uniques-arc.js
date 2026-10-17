"use strict";

/* ---------- Les armes uniques d'Arc ---------- */

// un laser tracé depuis toi : touche tout ce qui est sur la ligne
const lineHit = (a, L, d, wid) => {
  const ca = Math.cos(a), sa = Math.sin(a);
  fx.push({ k: "beam", x: P.x, y: P.y, a, len: L, w: wid, life: 0.18, t: 0.18 });
  enemies.forEach((e) => {
    const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
    if (along < 0 || along > L) return;
    if (Math.abs(-dx * sa + dy * ca) < wid + e.r) strike(e, d, ca * 60, sa * 60, "beam");
  });
};

Object.assign(WEAPONS, {
  // Satellite : une frappe orbitale sur une zone, après un délai
  satellite: {
    char: "arc",
    name: "Satellite",
    intro: "une frappe orbitale s'abat sur une zone, après un délai",
    legendText: "la frappe se répète une seconde fois au même endroit",
    cd0: 2,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "frappe") + " à chaque tir", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du satellite", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "zone " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le satellite tire " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 400 * rngMul());
      if (!cand.length) return;
      w.cd = slow(w, 4) * cdMul();
      const R = 68 * (1 + (w.rad || 0)), d = st.dmg * 7 * (1 + (w.dm || 0));
      const hit = (tx, ty) => {
        boom(tx, ty, R, d);
        fx.push({ k: "bolt", pts: [[tx, ty - 360], [tx, ty]], life: 0.2, t: 0.2 });
      };
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const tg = cand[(Math.random() * cand.length) | 0];
        fx.push({ k: "shell", tx: tg.x, ty: tg.y, R, life: 0.9, t: 0.9,
          onEnd(f) {
            hit(f.tx, f.ty);
            if (w.legend) fx.push({ k: "flash", x: f.tx, y: f.ty, life: 0.5, t: 0.5, onEnd: (q) => hit(q.x, q.y) });
          } });
      }
    },
  },

  // Faisceau tournant : un laser qui tourne autour de lui un moment
  rotbeam: {
    char: "arc",
    name: "Faisceau tournant",
    intro: "un laser tourne autour de toi pendant quelques secondes",
    legendText: "un second faisceau tourne à l'opposé",
    cd0: 1,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du faisceau", apply: bump("dm") },
      { id: "len", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "faisceau " + pct(v) + " plus long", apply: bump("len") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "le faisceau dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le faisceau revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = 190 * (1 + (w.len || 0)) * rngMul();
      if (!nearest(L + 60)) return;
      const dur = 3 * (1 + (w.dur || 0)), d = st.dmg * 0.9 * (1 + (w.dm || 0)), n = w.legend ? 2 : 1;
      w.cd = slow(w, 6) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "rotbeam", L, n, ang: rnd(0, 6.283), life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.ang += h * 3.2;
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.1;
          for (let b = 0; b < n; b++) {
            const a = f.ang + b * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
            enemies.forEach((e) => {
              const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
              if (e.hp > 0 && along > 0 && along < L && Math.abs(-dx * sa + dy * ca) < 8 + e.r) strike(e, d, ca * 40, sa * 40, "beam");
            });
          }
        } });
    },
  },

  // Laser en croix : quatre lasers en diagonale, après une courte charge
  cross: {
    char: "arc",
    name: "Laser en croix",
    intro: "quatre lasers en croix partent de toi, après une courte charge",
    legendText: "huit lasers au lieu de quatre",
    cd0: 2,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lasers", apply: bump("dm") },
      { id: "len", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "lasers " + pct(v) + " plus longs", apply: bump("len") },
      { id: "wid", max: 6, vals: [0.25, 0.5, 1], text: (v) => "lasers " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "la croix revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = 240 * (1 + (w.len || 0)) * rngMul();
      if (!nearest(L)) return;
      w.cd = slow(w, 5) * cdMul();
      const n = w.legend ? 8 : 4, base = rnd(0, 6.283), d = st.dmg * 3.5 * (1 + (w.dm || 0)), wid = 7 * (1 + (w.wid || 0));
      SFX.wave();
      for (let k = 0; k < n; k++) {
        const a = base + (k / n) * 6.283;
        fx.push({ k: "aim", a, len: L, life: 0.45, t: 0.45, onEnd: k === n - 1 ? () => { SFX.bomb(); for (let j = 0; j < n; j++) lineHit(base + (j / n) * 6.283, L, d, wid); } : null });
      }
    },
  },
});

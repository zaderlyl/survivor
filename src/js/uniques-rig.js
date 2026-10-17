"use strict";

/* ---------- Les armes uniques de Rig ---------- */

// un tir de rail : une ligne qui traverse tout, depuis sa position actuelle
const railShot = (w, a, L, d, wid) => {
  const ca = Math.cos(a), sa = Math.sin(a);
  SFX.bomb();
  shake = Math.max(shake, 4);
  fx.push({ k: "beam", x: P.x, y: P.y, a, len: L, w: wid * 1.6, life: 0.25, t: 0.25 });
  enemies.forEach((e) => {
    const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
    if (along < 0 || along > L) return;
    if (Math.abs(-dx * sa + dy * ca) < wid + e.r) strike(e, d, ca * 160, sa * 160, "beam");
  });
};

Object.assign(WEAPONS, {
  // Rail : un tir très puissant qui traverse tout, après un court temps de charge
  rail: {
    char: "rig",
    name: "Rail",
    intro: "un tir très puissant qui traverse tout, après une courte charge",
    legendText: "un second tir part dans la direction opposée",
    cd0: 2,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du rail", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le rail se recharge " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée du rail +" + pct(v), apply: bump("rng") },
      { id: "wid", max: 6, vals: [0.25, 0.5, 1], text: (v) => "tir " + pct(v) + " plus épais", apply: bump("wid") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.6 * (1 + (w.rng || 0)), tgt = nearest(L);
      if (!tgt) return;
      w.cd = slow(w, 4.5) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), d = st.dmg * 9 * (1 + (w.dm || 0)), wid = 7 * (1 + (w.wid || 0));
      P.aim = a;
      // la ligne de visée, pendant la charge
      fx.push({ k: "aim", a, len: L, life: 0.45, t: 0.45, onEnd: () => {
        railShot(w, a, L, d, wid);
        if (w.legend) railShot(w, a + Math.PI, L, d, wid);
      } });
    },
  },

  // Barrage : une salve de missiles à tête chercheuse
  barrage: {
    char: "rig",
    name: "Barrage",
    intro: "une salve de missiles à tête chercheuse",
    legendText: "une seconde salve suit",
    cd0: 2,
    variants: [
      { id: "n", max: 6, vals: [1, 2, 3], text: (v) => "+" + plural(v, "missile") + " par salve", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des missiles", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le barrage revient " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "rad", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const salvo = () => {
        const base = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 4 + (w.n || 0), d = st.dmg * 1.5 * (1 + (w.dm || 0)), R = 40 * (1 + (w.rad || 0));
        SFX.bomb();
        for (let k = 0; k < n; k++) fire(base + (k - (n - 1) / 2) * 0.35, 280, 2.5, { dmg: d, home: true, blast: R, bd: d * 0.8, size: 1.6 });
      };
      P.aim = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      salvo();
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.4, t: 0.4, onEnd: salvo });
    },
  },

  // Barrière plasma : un mur posé au sol qui blesse tout ce qui le touche
  barrier: {
    char: "rig",
    name: "Barrière plasma",
    intro: "pose un mur de plasma qui blesse tout ce qui le touche",
    legendText: "le mur étourdit les ennemis qu'il touche",
    cd0: 1,
    variants: [
      { id: "len", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "mur " + pct(v) + " plus long", apply: bump("len") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du mur", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "le mur dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "pose un mur " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(260 * rngMul());
      if (!tgt) return;
      w.cd = slow(w, 6) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), half = 60 * (1 + (w.len || 0)), dur = 5 * (1 + (w.dur || 0)), d = st.dmg * 0.8 * (1 + (w.dm || 0));
      const cx = P.x + Math.cos(a) * 80, cy = P.y + Math.sin(a) * 80, px = -Math.sin(a), py = Math.cos(a);
      const x1 = cx - px * half, y1 = cy - py * half, x2 = cx + px * half, y2 = cy + py * half;
      SFX.wave();
      fx.push({ k: "wall", x1, y1, x2, y2, life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.3;
          const vx = x2 - x1, vy = y2 - y1, ll = vx * vx + vy * vy;
          enemies.forEach((e) => {
            if (e.hp <= 0) return;
            const u = clamp(((e.x - x1) * vx + (e.y - y1) * vy) / ll, 0, 1);
            if (Math.hypot(e.x - (x1 + vx * u), e.y - (y1 + vy * u)) < 8 + e.r) {
              strike(e, d, 0, 0, "burn");
              if (w.legend) e.frozen = 0.6;
            }
          });
        } });
    },
  },
});

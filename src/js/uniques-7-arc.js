"use strict";

/* ---------- Encore des armes uniques : Arc (lasers) ---------- */

// un rayon qui s'arrête au premier ennemi touché, puis se courbe à angle droit de chaque côté
const refractBeam = (ox, oy, a, L, d, wid, depth) => {
  const ca = Math.cos(a), sa = Math.sin(a);
  let first = L, hit = null;
  enemies.forEach((e) => {
    const dx = e.x - ox, dy = e.y - oy, along = dx * ca + dy * sa;
    if (along > 0 && along < first && Math.abs(-dx * sa + dy * ca) < wid + e.r) { first = along; hit = e; }
  });
  thickBeam(ox, oy, a, first, d, wid, WEAPON_COLOR.refractor);
  if (!hit || depth <= 0) return;
  const px = ox + ca * first, py = oy + sa * first;
  flashFx(px, py, WEAPON_COLOR.refractor, 18);
  spark(px, py, WEAPON_COLOR.refractor, 8, 220);
  [a + Math.PI / 2, a - Math.PI / 2].forEach((b) => refractBeam(px, py, b, L * 0.7, d * 0.8, wid * 0.85, depth - 1));
};

Object.assign(WEAPONS, {
  // Rail orbital : de longues lignes de lumière tombent du ciel après une alerte
  railorbital: {
    char: "arc",
    name: "Rail orbital",
    intro: "une longue ligne de lumière tombe du ciel sur un ennemi, après une alerte",
    legendText: "une seconde ligne la croise à angle droit",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "ligne") + " à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lignes", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "lignes " + pct(v) + " plus épaisses", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le rail revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (!cand.length) return;
      w.cd = slow(w, 7) * cdMul();
      const d = st.dmg * 6 * (1 + (w.dm || 0)), wid = 9 * (1 + (w.wid || 0)), col = WEAPON_COLOR.railorbital;
      SFX.wave();
      const line = (cx, cy, al) => {
        const x1 = cx - Math.cos(al) * 350, y1 = cy - Math.sin(al) * 350, x2 = cx + Math.cos(al) * 350, y2 = cy + Math.sin(al) * 350;
        fx.push({ k: "tline", color: col, x1, y1, x2, y2, life: 0.6, t: 0.6, onEnd() { SFX.bomb(); thickBeam(x1, y1, al, 700, d, wid, col); flashFx(cx, cy, col, 28); } });
      };
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const e = cand[(Math.random() * cand.length) | 0], al = rnd(0, Math.PI);
        line(e.x, e.y, al);
        if (w.legend) line(e.x, e.y, al + Math.PI / 2);
      }
    },
  },

  // Réfracteur : le laser se courbe à angle droit au premier impact
  refractor: {
    char: "arc",
    name: "Réfracteur",
    intro: "un laser qui se courbe à angle droit, des deux côtés, au premier ennemi touché",
    legendText: "il se courbe encore au second impact",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du laser", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "laser " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "courbure"), apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le réfracteur revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.1, tgt = nearest(L);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      P.aim = a;
      SFX.wave();
      refractBeam(P.x, P.y, a, L, st.dmg * 3.5 * (1 + (w.dm || 0)), 7 * (1 + (w.wid || 0)), 1 + (w.n || 0) + (w.legend ? 1 : 0));
    },
  },

  // Sentinelle laser : une tourelle qui tire des lasers
  lasersentinel: {
    char: "arc",
    name: "Sentinelle laser",
    intro: "une tourelle posée au sol tire des lasers sur l'ennemi le plus proche",
    legendText: "la sentinelle tire deux faisceaux à la fois",
    cd0: 1,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "sentinelle") + " posée à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la sentinelle", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la sentinelle dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la sentinelle tire " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = slow(w, 8) * cdMul();
      const dur = 7 * (1 + (w.dur || 0)), d = st.dmg * 2 * (1 + (w.dm || 0)), col = WEAPON_COLOR.lasersentinel;
      SFX.wave();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const a = rnd(0, 6.283);
        fx.push({ k: "sentinel", color: col, x: P.x + Math.cos(a) * 50, y: P.y + Math.sin(a) * 50, life: dur, t: dur, cd: 0.4, a: 0,
          tick(f, h) {
            const tg = nearest(320 * rngMul(), f.x, f.y);
            if (tg) f.a = Math.atan2(tg.y - f.y, tg.x - f.x);
            f.cd -= h;
            if (f.cd > 0 || !tg) return;
            f.cd = slow(w, 0.8) * cdMul();
            thickBeam(f.x, f.y, f.a, 340, d, 4, col);
            if (w.legend) thickBeam(f.x, f.y, f.a + 0.14, 340, d, 4, col);
          } });
      }
    },
  },

  // Faisceau focal : un laser qui grossit et cogne de plus en plus fort tant qu'il reste sur sa cible
  focalbeam: {
    char: "arc",
    name: "Faisceau focal",
    intro: "un laser qui grossit et frappe de plus en plus fort tant qu'il reste sur sa cible",
    legendText: "il se termine par une grosse explosion",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du faisceau", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le faisceau dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "faisceau " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le faisceau revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.2, tgt = nearest(L);
      if (!tgt) return;
      const dur = 2.5 * (1 + (w.dur || 0)), base = st.dmg * 0.8 * (1 + (w.dm || 0)), wid0 = 5 * (1 + (w.wid || 0)), col = WEAPON_COLOR.focalbeam;
      w.cd = slow(w, 6) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "cbeam", color: col, x: P.x, y: P.y, a: Math.atan2(tgt.y - P.y, tgt.x - P.x), len: L, w: wid0, life: dur, t: dur, cd: 0,
        tick(f, h) {
          const u = 1 - f.life / f.t;
          f.w = wid0 * (1 + 2.5 * u); // il grossit
          const tg = nearest(L);
          if (tg) {
            let da = Math.atan2(tg.y - P.y, tg.x - P.x) - f.a;
            da = Math.atan2(Math.sin(da), Math.cos(da));
            f.a += clamp(da, -3 * h, 3 * h);
            f.last = tg;
          }
          f.x = P.x;
          f.y = P.y;
          P.aim = f.a;
          P.muzzle = 0.06;
          const ca = Math.cos(f.a), sa = Math.sin(f.a);
          f.cd -= h;
          if (f.cd <= 0) {
            f.cd = 0.1;
            enemies.forEach((e) => {
              const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
              if (e.hp > 0 && along > 0 && along < L && Math.abs(-dx * sa + dy * ca) < f.w + e.r) strike(e, base * (1 + 3 * u), ca * 30, sa * 30, "beam");
            });
          }
          if (f.life <= h && w.legend && f.last) boom(f.last.x, f.last.y, 90, st.dmg * 8, col); // la fin
        } });
    },
  },

  // Pluie de lasers : des lignes de lumière obliques croisent une zone
  laserrain: {
    char: "arc",
    name: "Pluie de lasers",
    intro: "des lignes de lumière obliques croisent une zone pendant quelques secondes",
    legendText: "les lignes se croisent dans les deux sens",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lasers", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la pluie dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rad", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "zone " + pct(v) + " plus large", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la pluie revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      const dur = 2.2 * (1 + (w.dur || 0)), R = 130 * (1 + (w.rad || 0)), d = st.dmg * 1.4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.laserrain, cx = tgt.x, cy = tgt.y;
      w.cd = slow(w, 6) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: cx, y: cy, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.1;
          for (let m = 1 + lg(w) * 0.5; m > 0; m--) { // chaque reprise ajoute une demi-ligne par tir, dans les deux sens
            if (m < 1 && Math.random() > m) break;
            const px = cx + rnd(-R, R), py = cy + rnd(-R, R), al = (lg(w) && Math.random() < 0.5 ? -1 : 1) * rnd(0.5, 1.1);
            thickBeam(px - Math.cos(al) * 150, py - Math.sin(al) * 150, al, 300, d, 5, col);
          }
        } });
    },
  },
});

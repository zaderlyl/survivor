"use strict";

/* ---------- Les armes uniques de Pulse ---------- */

// une grenade collée sur un ennemi : elle le suit et explose au bout d'un instant
const stickOn = (w, e, R, d, gen) => {
  const T = 1.5;
  fx.push({ k: "stick", color: WEAPON_COLOR.sticky, spk: WEAPON_COLOR.sticky, e, x: e.x, y: e.y, life: T, t: T,
    tick(f) { if (f.e.hp > 0) { f.x = f.e.x; f.y = f.e.y; } },
    onEnd(f) {
      boom(f.x, f.y, R, d, WEAPON_COLOR.sticky);
      if (w.legend && gen === 0) {
        // l'explosion colle une autre grenade sur l'ennemi le plus proche
        let nx = null, nd = 200 * 200;
        for (let i = 0; i < enemies.length; i++) {
          const o = enemies[i];
          if (o.hp <= 0 || o === f.e) continue;
          const dx = o.x - f.x, dy = o.y - f.y, dd = dx * dx + dy * dy;
          if (dd < nd) { nd = dd; nx = o; }
        }
        if (nx) stickOn(w, nx, R, d, 1);
      }
    } });
};

Object.assign(WEAPONS, {
  // Grenade collante : elle colle à un ennemi puis explose
  sticky: {
    char: "pulse",
    name: "Grenade collante",
    intro: "une grenade colle à un ennemi proche puis explose",
    legendText: "l'explosion colle une autre grenade sur un ennemi proche",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "grenade") + " par lancer", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des grenades", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "lance les grenades " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (!cand.length) return;
      w.cd = slow(w, 3) * cdMul();
      const R = 65 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0));
      SFX.shoot();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) stickOn(w, cand[(Math.random() * cand.length) | 0], R, d, 0);
    },
  },

  // Napalm : une flaque de feu lancée au sol
  napalm: {
    char: "pulse",
    name: "Napalm",
    intro: "une flaque de feu lancée au sol brûle tout ce qui s'y trouve",
    legendText: "la flaque s'étend avec le temps",
    cd0: 1,
    variants: [
      { id: "rad", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "flaque " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du feu", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la flaque dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "lance le napalm " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 4.5) * cdMul();
      const R0 = 55 * (1 + (w.rad || 0)), dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 0.6 * (1 + (w.dm || 0)), tx = tgt.x, ty = tgt.y;
      SFX.shoot();
      P.aim = Math.atan2(ty - P.y, tx - P.x);
      // le temps du vol, puis la flaque
      fx.push({ k: "flash", x: tx, y: ty, life: 0.4, t: 0.4, onEnd: () => {
        SFX.bomb();
        fx.push({ k: "cloud", color: WEAPON_COLOR.napalm, emb: WEAPON_COLOR.napalm, x: tx, y: ty, R: R0, life: dur, t: dur, cd: 0,
          tick(f, h) {
            if (w.legend) f.R += 14 * h;
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.4;
            enemies.forEach((e) => {
              if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < f.R + e.r) strike(e, d, 0, 0, "burn");
            });
          } });
      } });
    },
  },

  // Bombardement : une pluie de grenades sur une zone
  bombard: {
    char: "pulse",
    name: "Bombardement",
    intro: "une pluie de grenades s'abat sur une zone",
    legendText: "une seconde pluie suit",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [2, 3, 4], text: (v) => "+" + plural(v, "bombe") + " par pluie", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des bombes", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "bombes " + pct(v) + " plus grosses", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la pluie revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(380 * rngMul());
      if (!tgt) return;
      w.cd = slow(w, 6.5) * cdMul();
      const R = 42 * (1 + (w.rad || 0)), d = st.dmg * 2.5 * (1 + (w.dm || 0)), n = 8 + (w.n || 0), cx = tgt.x, cy = tgt.y;
      const rain = () => {
        for (let k = 0; k < n; k++) {
          const a = rnd(0, 6.283), r = rnd(0, 110), tx = cx + Math.cos(a) * r, ty = cy + Math.sin(a) * r;
          fx.push({ k: "flash", x: tx, y: ty, life: k * 0.13, t: 0.1, onEnd: () => {
            fx.push({ k: "shell", color: WEAPON_COLOR.bombard, tx, ty, R, life: 0.7, t: 0.7, onEnd: () => boom(tx, ty, R, d, WEAPON_COLOR.bombard) });
          } });
        }
      };
      SFX.shoot();
      rain();
      if (w.legend) fx.push({ k: "flash", x: cx, y: cy, life: n * 0.13 + 0.4, t: 0.1, onEnd: rain });
    },
  },
});

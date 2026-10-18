"use strict";

/* ---------- Les armes uniques de Chrome ---------- */

// un dash tranchant : il file vers l'ennemi, tranche tout sur sa ligne et se retrouve de l'autre côté
const dashCut = (w) => {
  const tgt = nearest(300 * (1 + (w.rng || 0)) * rngMul());
  if (!tgt) return false;
  const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), ca = Math.cos(a), sa = Math.sin(a);
  const len = Math.min(Math.hypot(tgt.x - P.x, tgt.y - P.y) + 50, 320 * (1 + (w.rng || 0))), d = st.dmg * 4 * (1 + (w.dm || 0)), wid = 16 * (1 + (w.wid || 0));
  SFX.dash();
  fx.push({ k: "beam", color: WEAPON_COLOR.dashcut, x: P.x, y: P.y, a, len, w: wid, life: 0.2, t: 0.2 });
  for (let i = 0; i < len; i += 26) ghosts.push({ x: P.x + ca * i, y: P.y + sa * i, life: 0.3, face: ca >= 0 ? 1 : -1 }); // des images rémanentes le long de la coupe
  spark(P.x + ca * len / 2, P.y + sa * len / 2, WEAPON_COLOR.dashcut, 10, 220);
  enemies.forEach((e) => {
    const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
    if (along < -10 || along > len) return;
    if (Math.abs(-dx * sa + dy * ca) < wid + e.r) strike(e, d, ca * 120, sa * 120, "slash");
  });
  P.x = clamp(P.x + ca * len, 20, ARENA_W - 20);
  P.y = clamp(P.y + sa * len, 20, ARENA_H - 20);
  P.inv = Math.max(P.inv, 0.3); // pas de dégâts pendant la coupe
  P.aim = a;
  return true;
};

// une lame de boomerang : part vers (a), revient vers toi
const throwBoomerang = (w, a, d, dist) => {
  const T = 1.1;
  fx.push({ k: "blade", color: WEAPON_COLOR.boomerang, a, x: P.x, y: P.y, life: T, t: T, hit: [], spin: 0,
    tick(f, h) {
      const u = 1 - f.life / T;
      f.spin += h * 22;
      trail(f.x, f.y, WEAPON_COLOR.boomerang, 3);
      if (u > 0.5 && !f.back) { f.back = true; f.hit = []; }
      f.x = P.x + Math.cos(a) * dist * Math.sin(Math.PI * u);
      f.y = P.y + Math.sin(a) * dist * Math.sin(Math.PI * u);
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.hp <= 0 || f.hit.indexOf(e) >= 0) continue;
        if (Math.hypot(e.x - f.x, e.y - f.y) < 14 + e.r) { f.hit.push(e); strike(e, d, Math.cos(a) * 80, Math.sin(a) * 80, "slash"); }
      }
    } });
};

Object.assign(WEAPONS, {
  // Dash tranchant : il fonce sur un ennemi en tranchant toute sa ligne
  dashcut: {
    char: "chrome",
    name: "Dash tranchant",
    intro: "il fonce sur un ennemi en tranchant tout sur son passage",
    legendText: "il enchaîne un second dash",
    cd0: 2,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du dash", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le dash revient " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée du dash +" + pct(v), apply: bump("rng") },
      { id: "wid", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "coupe " + pct(v) + " plus large", apply: bump("wid") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      if (!dashCut(w)) return;
      w.cd = slow(w, 4.2) * cdMul();
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.25, t: 0.25, onEnd: () => dashCut(w) });
    },
  },

  // Boomerang : une lame lancée qui revient
  boomerang: {
    char: "chrome",
    name: "Boomerang",
    intro: "une lame partie vers un ennemi puis revenue vers toi",
    legendText: "une seconde lame suit la première",
    cd0: 1,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "lame") + " lancée à la fois", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du boomerang", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le boomerang revient " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée du boomerang +" + pct(v), apply: bump("rng") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(340 * (1 + (w.rng || 0)) * rngMul());
      if (!tgt) return;
      w.cd = slow(w, 2.2) * cdMul();
      const base = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 1 + (w.n || 0), d = st.dmg * 3 * (1 + (w.dm || 0)), dist = 230 * (1 + (w.rng || 0)) * rngMul();
      SFX.dash();
      for (let k = 0; k < n; k++) {
        const a = base + (k - (n - 1) / 2) * 0.5;
        throwBoomerang(w, a, d, dist);
        if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.3, t: 0.3, onEnd: () => throwBoomerang(w, a, d, dist) });
      }
    },
  },

  // Tourbillon : un tournoiement à 360° tout autour de lui
  whirl: {
    char: "chrome",
    name: "Tourbillon",
    intro: "un tournoiement à 360° qui tranche tout autour de toi",
    legendText: "il finit par un souffle qui repousse tout",
    cd0: 1,
    variants: [
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "tourbillon " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du tourbillon", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le tourbillon revient " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "le tourbillon dure " + pct(v) + " plus longtemps", apply: bump("dur") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 72 * (1 + (w.rad || 0)) * rngMul();
      if (!nearest(R + 40)) return;
      w.cd = slow(w, 3.6) * cdMul();
      const dur = 0.6 * (1 + (w.dur || 0)), d = st.dmg * 1.6 * (1 + (w.dm || 0));
      SFX.wave();
      fx.push({ k: "spin", color: WEAPON_COLOR.whirl, R, life: dur, t: dur, pulse: 0,
        tick(f, h) {
          f.pulse -= h;
          if (f.pulse > 0) return;
          f.pulse = 0.12;
          { const sa2 = rnd(0, 6.283); spark(P.x + Math.cos(sa2) * R, P.y + Math.sin(sa2) * R, WEAPON_COLOR.whirl, 4, 140); }
          enemies.forEach((e) => {
            const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
            if (e.hp > 0 && dd < R + e.r) strike(e, d, (dx / dd) * 60, (dy / dd) * 60, "slash");
          });
        },
        onEnd(f) {
          if (!w.legend) return;
          ringFx(P.x, P.y, WEAPON_COLOR.whirl, R * 1.6, 0.3);
          flashFx(P.x, P.y, WEAPON_COLOR.whirl, R);
          enemies.forEach((e) => {
            const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
            if (e.hp > 0 && dd < R * 1.6 + e.r) damage(e, d * 0.5, false, (dx / dd) * (e.type === "boss" ? 120 : 520), (dy / dd) * (e.type === "boss" ? 120 : 520), "blast");
          });
        } });
    },
  },
});

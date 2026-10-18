"use strict";

/* ---------- Nouvelles armes uniques : Pulse (explosifs) et Zap (foudre) ---------- */

// une roquette légendaire se divise en trois petites à l'impact
const clusterBurst = (e) => {
  for (let k = 0; k < 3; k++) {
    fire(rnd(0, 6.283), 280, 0.6, { x: e.x, y: e.y, dmg: st.dmg * 2, blast: 44, bd: st.dmg * 3, size: 1.4, color: WEAPON_COLOR.rocket, smoke: true });
  }
};
let pylonId = 0;

Object.assign(WEAPONS, {
  // ===== Pulse =====

  // Roquette : un gros tir explosif, à grande zone
  rocket: {
    char: "pulse",
    name: "Roquette",
    intro: "un gros tir explosif, avec une grande zone d'explosion",
    legendText: "la roquette se divise en trois à l'impact",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la roquette", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "roquette") + " par tir", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "tire " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range * 1.1);
      if (!tgt) return;
      w.cd = slow(w, 3.5) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 1 + (w.n || 0), R = 70 * (1 + (w.rad || 0)), bd = st.dmg * 6 * (1 + (w.dm || 0));
      P.aim = a0;
      const launch = (a) => {
        SFX.bomb();
        P.muzzle = 0.1;
        fire(a, 300, st.range * 1.2 / 300, { dmg: st.dmg * 3 * (1 + (w.dm || 0)), blast: R, bd, size: 2.2, color: WEAPON_COLOR.rocket, smoke: true, cluster: !!w.legend });
        spark(P.x + Math.cos(a) * 14, P.y + Math.sin(a) * 14, WEAPON_COLOR.rocket, 6, 200);
      };
      for (let k = 0; k < n; k++) {
        const a = a0 + (k - (n - 1) / 2) * 0.2;
        if (k === 0) launch(a); else fx.push({ k: "flash", x: P.x, y: P.y, life: k * 0.15, t: 0.1, onEnd: () => launch(a) });
      }
    },
  },

  // Mine à fragmentation : elle éclate en éclats dans toutes les directions
  fragmine: {
    char: "pulse",
    name: "Mine à fragmentation",
    intro: "une mine qui éclate en éclats dans toutes les directions",
    legendText: "les éclats sont à tête chercheuse",
    cd0: 1,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "mine") + " posée à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la mine", apply: bump("dm") },
      { id: "frag", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 4, "éclat") + " par mine", apply: bump("frag") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "pose les mines " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = slow(w, 4) * cdMul();
      const d = st.dmg * 3 * (1 + (w.dm || 0)), n = 1 + (w.n || 0), frags = 8 + 4 * (w.frag || 0), col = WEAPON_COLOR.fragmine;
      for (let k = 0; k < n; k++) {
        const a = Math.atan2(-P.dy, -P.dx) + (k - (n - 1) / 2) * 0.8;
        fx.push({ k: "mine", color: col, x: P.x + Math.cos(a) * 20, y: P.y + Math.sin(a) * 20, life: 10, t: 10, arm: 0.4,
          tick(f, h) {
            f.arm -= h;
            if (f.arm > 0) return;
            for (let i = 0; i < enemies.length; i++) {
              const e = enemies[i];
              if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < 14 + e.r) { f.hit = true; f.life = 0; return; }
            }
          },
          onEnd(f) {
            if (!f.hit) return;
            boom(f.x, f.y, 55, d, col);
            const off = rnd(0, 6.283);
            for (let j = 0; j < frags; j++) fire(off + (j / frags) * 6.283, 420, 0.55, { x: f.x, y: f.y, dmg: st.dmg * 1.2 * (1 + (w.dm || 0)), color: col, pierce: 1, home: !!w.legend });
          } });
      }
    },
  },

  // Cocktail incendiaire : des bouteilles qui laissent des flammes qui s'étendent
  molotov: {
    char: "pulse",
    name: "Cocktail incendiaire",
    intro: "des bouteilles incendiaires laissent des flaques de feu qui s'étendent",
    legendText: "les flaques de feu en font naître d'autres",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "bouteille") + " par lancer", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du feu", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "les flammes durent " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "lance les bouteilles " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const col = WEAPON_COLOR.molotov, d = st.dmg * 0.6 * (1 + (w.dm || 0));
      P.aim = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      SFX.shoot();
      const patch = (x, y, gen) => {
        const dur = 3.5 * (1 + (w.dur || 0)) * (gen ? 0.6 : 1);
        fx.push({ k: "cloud", color: col, emb: col, x, y, R: 46, life: dur, t: dur, cd: 0, sp: 1.2,
          tick(f, h) {
            f.R += 10 * h; // la flaque s'étend
            f.cd -= h;
            if (w.legend && gen < 2) {
              f.sp -= h;
              if (f.sp <= 0) { f.sp = 1.4; const a = rnd(0, 6.283); patch(f.x + Math.cos(a) * f.R * 0.9, f.y + Math.sin(a) * f.R * 0.9, gen + 1); }
            }
            if (f.cd > 0) return;
            f.cd = 0.4;
            enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < f.R + e.r) strike(e, d, 0, 0, "burn"); });
          } });
      };
      for (let k = 0, n = 2 + (w.n || 0); k < n; k++) {
        const tx = tgt.x + rnd(-50, 50), ty = tgt.y + rnd(-50, 50);
        fx.push({ k: "nade", x0: P.x, y0: P.y, x: P.x, y: P.y, tx, ty, life: 0.5, t: 0.5, color: col, tick(f) { trail(f.x, f.y, col, 2); }, onEnd: () => { SFX.bomb(); explodeFx(tx, ty, col, 40); patch(tx, ty, 0); } });
      }
    },
  },

  // ===== Zap =====

  // Tempête : des éclairs en rafale autour de lui
  stormbarrage: {
    char: "zap",
    name: "Tempête",
    intro: "des éclairs en rafale s'abattent sur les ennemis autour de toi",
    legendText: "chaque éclair frappe en zone",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des éclairs", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la tempête dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "éclair") + " à chaque salve", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la tempête revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(280 * rngMul())) return;
      const dur = 2.5 * (1 + (w.dur || 0)), d = st.dmg * 2 * (1 + (w.dm || 0)), col = WEAPON_COLOR.stormbarrage;
      w.cd = slow(w, 7) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.15;
          const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 280 * rngMul());
          for (let k = 0, n = 1 + (w.n || 0); k < n && cand.length; k++) {
            const e = cand[(Math.random() * cand.length) | 0];
            fx.push({ k: "bolt", color: col, pts: [[e.x + rnd(-8, 8), e.y - 260], [e.x, e.y]], life: 0.15, t: 0.15 });
            strike(e, d, 0, 0, "storm");
            flashFx(e.x, e.y, col, 16);
            if (w.legend) splash(e, 50, d * 0.5);
          }
        } });
    },
  },

  // Pylône : une colonne qui relie les ennemis, et les autres pylônes, par des arcs
  pylon: {
    char: "zap",
    name: "Pylône",
    intro: "un pylône frappe les ennemis proches, et s'allie aux autres pylônes par des arcs",
    legendText: "les arcs entre pylônes étourdissent",
    cd0: 1,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "pylône") + " posé à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des arcs", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "les pylônes durent " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "pose un pylône " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = slow(w, 6) * cdMul();
      const dur = 6 * (1 + (w.dur || 0)), d = st.dmg * 1.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.pylon;
      SFX.wave();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const a = rnd(0, 6.283), r = 50 + k * 30;
        fx.push({ k: "pylon", id: pylonId++, color: col, spk: col, x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, life: dur, t: dur, cd: 0.3,
          tick(f, h) {
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.4;
            zapAround(f.x, f.y, 170, 3, d, col);
            // un arc vers le pylône le plus proche (une seule fois par paire)
            const other = fx.filter((o) => o.k === "pylon" && o !== f && o.id > f.id && Math.hypot(o.x - f.x, o.y - f.y) < 420).sort((a2, b2) => Math.hypot(a2.x - f.x, a2.y - f.y) - Math.hypot(b2.x - f.x, b2.y - f.y))[0];
            if (!other) return;
            fx.push({ k: "bolt", color: col, pts: [[f.x, f.y - 16], [other.x, other.y - 16]], life: 0.2, t: 0.2 });
            const vx = other.x - f.x, vy = other.y - f.y, ll = vx * vx + vy * vy || 1;
            enemies.forEach((e) => {
              if (e.hp <= 0) return;
              const u = clamp(((e.x - f.x) * vx + (e.y - f.y) * vy) / ll, 0, 1);
              if (Math.hypot(e.x - (f.x + vx * u), e.y - (f.y + vy * u)) < 14 + e.r) { strike(e, d * 1.5, 0, 0, "storm"); if (w.legend) e.frozen = 0.6; }
            });
          } });
      }
    },
  },

  // Coup de tonnerre : une onde électrique qui étourdit tout autour
  thunderclap: {
    char: "zap",
    name: "Coup de tonnerre",
    intro: "après une courte charge, une onde électrique étourdit tout autour de toi",
    legendText: "une seconde onde, plus grande, suit",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'onde", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "onde " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "stun", max: 99, vals: [0.3, 0.6, 1], text: (v) => "étourdit " + pct(v) + " plus longtemps", apply: bump("stun") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le tonnerre revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(220)) return;
      w.cd = slow(w, 6.5) * cdMul();
      const R = 220 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), stun = 1 * (1 + (w.stun || 0)), col = WEAPON_COLOR.thunderclap;
      SFX.wave();
      const wave = (RR, dm) => {
        SFX.bomb();
        shake = Math.max(shake, 6);
        const hit = new Set();
        fx.push({ k: "nova", color: col, x: P.x, y: P.y, r: 1, life: 0.55, t: 0.55,
          tick(f) {
            f.x = P.x;
            f.y = P.y;
            f.r = RR * (1 - f.life / f.t);
            enemies.forEach((e) => {
              const dx = e.x - f.x, dy = e.y - f.y, dd = Math.hypot(dx, dy) || 1;
              if (!hit.has(e) && e.hp > 0 && dd < f.r + e.r && dd > f.r - 40 - e.r) {
                hit.add(e);
                strike(e, d * dm, (dx / dd) * 300, (dy / dd) * 300, "storm");
                e.frozen = stun; // étourdi
                spark(e.x, e.y, col, 5, 160);
              }
            });
          } });
        flashFx(P.x, P.y, col, 40);
      };
      // une courte charge : des points de lumière convergent vers lui
      fx.push({ k: "flash", x: P.x, y: P.y, life: 0.5, t: 0.5, tick() { chargeFx(P.x, P.y, col); chargeFx(P.x, P.y, col); }, onEnd() {
        wave(R, 1);
        if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.35, t: 0.1, onEnd: () => wave(R * 1.35, 1.2) });
      } });
    },
  },
});

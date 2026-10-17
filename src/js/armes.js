"use strict";

/* ---------- Les armes ---------- */
// une arme possédée : { id, lvl, cd, angle }. Chacune se met à jour seule, à chaque image, tant que la partie tourne.
const weapon = (id) => P.weapons.find((w) => w.id === id);
const weaponLvl = (id) => { const w = weapon(id); return w ? w.lvl : 0; };
const addWeapon = (id, n) => {
  const w = weapon(id);
  if (w) w.lvl = Math.min(WEAPONS[id].cap || 99, w.lvl + n);
  else P.weapons.push({ id, lvl: Math.min(WEAPONS[id].cap || 99, n), cd: WEAPONS[id].cd0 || 0, angle: 0 });
};


// multiplicateurs issus des boosts : cadence, dégâts et portée, rapportés aux valeurs de départ
const cdMul = () => st.cd / 0.42;
const dmgMul = () => st.dmg / 2;
const rngMul = () => st.range / 440;
// l'ennemi vivant le plus proche dans un rayon
const nearest = (maxR, ox = P.x, oy = P.y) => {
  let near = null, nd = maxR * maxR;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.hp <= 0) continue;
    const dx = e.x - ox, dy = e.y - oy, dd = dx * dx + dy * dy;
    if (dd < nd) { nd = dd; near = e; }
  }
  return near;
};
// une explosion : onde visible et dégâts de zone
const boom = (x, y, r, d) => {
  SFX.bomb();
  if (waves.length < 14) waves.push({ x, y, r: 0, max: r, life: 0.25, t: 0.25 });
  enemies.forEach((e) => {
    const dx = e.x - x, dy = e.y - y, dd = Math.hypot(dx, dy) || 1;
    if (e.hp > 0 && dd < r + e.r) strike(e, d, (dx / dd) * 160, (dy / dd) * 160, "blast");
  });
};
// un coup avec chance de critique ; kx, ky : recul
const strike = (e, d, kx, ky, src) => {
  const crit = Math.random() < st.crit;
  damage(e, d * (crit ? st.critMul : 1), crit, e.type === "boss" ? kx * 0.2 : kx, e.type === "boss" ? ky * 0.2 : ky, src);
};
// un tir de joueur : dmg et rad écrasent les valeurs par défaut du tir de base
const fire = (a, spd, life, o) => bullets.push(Object.assign({ x: P.x, y: P.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life, pierce: 0, hit: [] }, o));

const WEAPONS = {
  // le tir automatique sur l'ennemi le plus proche
  shot: {
    name: "Tir",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      let near = null, nd = st.range * st.range;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i], dx = e.x - P.x, dy = e.y - P.y, dd = dx * dx + dy * dy;
        if (dd < nd) { nd = dd; near = e; }
      }
      if (!near) return;
      w.cd = st.cd;
      const base = Math.atan2(near.y - P.y, near.x - P.x);
      P.aim = base;
      P.muzzle = 0.06;
      SFX.shoot();
      P.volley++;
      if (st.ring && P.volley % 3 === 0) {
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * 6.283 + base;
          bullets.push({ x: P.x, y: P.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: st.range / 520, pierce: st.pierce, hit: [] });
        }
      }
      for (let k = 0; k < st.count; k++) {
        const a = base + (k - (st.count - 1) / 2) * 0.2;
        bullets.push({ x: P.x, y: P.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: st.range / 520, pierce: st.pierce, hit: [] });
      }
    },
  },

  // les lames en orbite : une lame par niveau
  orb: {
    name: "Lames",
    max: 8,
    cap: 12,
    vals: [1, 2, 3],
    text: (v) => "+" + plural(v, "lame") + " qui tourne autour de toi",
    legendText: "les lames lancent des éclats vers l'extérieur",
    update(w, dt) {
      w.angle += dt * 3.2;
      w.sh = (w.sh || 0) - dt;
      const shard = w.legend && w.sh <= 0;
      if (shard) w.sh = 1.2;
      for (let o = 0; o < w.lvl; o++) {
        const a = w.angle + (o / w.lvl) * 6.283;
        const ox = P.x + Math.cos(a) * st.orbR, oy = P.y + Math.sin(a) * st.orbR;
        if (shard) fire(a, 340, 0.6, { x: ox, y: oy, dmg: st.dmg * 0.8 });
        const cx = clamp((ox / CELL) | 0, 0, COLS - 1), cy = clamp((oy / CELL) | 0, 0, ROWS - 1);
        for (let yy = Math.max(0, cy - 1); yy <= Math.min(ROWS - 1, cy + 1); yy++) {
          for (let xx = Math.max(0, cx - 1); xx <= Math.min(COLS - 1, cx + 1); xx++) {
            const c = cells[yy * COLS + xx];
            for (let k = 0; k < c.length; k++) {
              const e = enemies[c[k]];
              if (!e || e.orbCd > 0) continue;
              const dx = e.x - ox, dy = e.y - oy;
              if (dx * dx + dy * dy < (e.r + 6) * (e.r + 6)) { damage(e, Math.max(1, st.dmg * st.orbDmg), false, (dx / (Math.hypot(dx, dy) || 1)) * 120, (dy / (Math.hypot(dx, dy) || 1)) * 120); e.orbCd = 0.3; }
            }
          }
        }
      }
    },
  },

  // l'onde : un coup qui repousse tout autour
  wave: {
    name: "Onde",
    max: 8,
    vals: [1, 2, 3],
    text: (v) => "l'onde qui repousse grandit et revient plus vite (+" + v + ")",
    legendText: "gèle les ennemis touchés 1 s",
    cd0: 3,
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      w.cd = Math.max(1.8, (5.5 - 0.3 * Math.min(w.lvl, 8)) * st.waveMul);
      const R = Math.min(280, 60 + 22 * w.lvl);
      SFX.wave();
      waves.push({ x: P.x, y: P.y, r: 0, max: R, life: 0.35, t: 0.35 });
      enemies.forEach((e) => {
        const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1;
        if (d < R + e.r) {
          damage(e, 3 + Math.min(w.lvl, 10) * 1.5, false, (dx / d) * (e.type === "boss" ? 120 : 420), (dy / d) * (e.type === "boss" ? 120 : 420));
          if (w.legend) e.frozen = 1;
        }
      });
    },
  },

  // ----- les attaques de base des personnages -----

  // Chrome : un coup d'épée en arc devant lui, courte portée, gros dégâts
  slash: {
    name: "Épée",
    cd0: 0.3,
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 80 * rngMul(), tgt = nearest(R + 30);
      if (!tgt) return;
      w.cd = 0.8 * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      P.aim = a;
      P.muzzle = 0.06;
      SFX.dash();
      fx.push({ k: "arc", x: P.x, y: P.y, a, r: R, spread: 1.1, life: 0.16, t: 0.16 });
      enemies.forEach((e) => {
        const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1;
        if (d > R + e.r) return;
        let da = Math.atan2(dy, dx) - a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < 1.1) strike(e, st.dmg * 3.2, (dx / d) * 200, (dy / d) * 200, "slash");
      });
    },
  },

  // Rig : un blaster, un gros tir lent qui traverse un ennemi, long cooldown
  blaster: {
    name: "Blaster",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = 1.7 * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      P.aim = a;
      P.muzzle = 0.1;
      SFX.bomb();
      fire(a, 380, st.range / 380, { dmg: st.dmg * 5, rad: 8, size: 2.4, pierce: 2 });
    },
  },

  // Ghost : un tir en éventail à courte portée
  shotgun: {
    name: "Fusil à pompe",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = st.range * 0.55, tgt = nearest(R);
      if (!tgt) return;
      w.cd = 0.85 * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      P.aim = a;
      P.muzzle = 0.08;
      SFX.shoot();
      for (let k = 0; k < 6; k++) fire(a + (k - 2.5) * 0.12 + rnd(-0.03, 0.03), 560, R / 560, { dmg: st.dmg * 0.9 });
    },
  },

  // Arc : un laser qui traverse toute la ligne d'ennemis
  laser: {
    name: "Laser",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.1, tgt = nearest(L);
      if (!tgt) return;
      w.cd = 1.7 * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), ca = Math.cos(a), sa = Math.sin(a);
      P.aim = a;
      P.muzzle = 0.1;
      SFX.wave();
      fx.push({ k: "beam", x: P.x, y: P.y, a, len: L, w: 9, life: 0.14, t: 0.14 });
      enemies.forEach((e) => {
        const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
        if (along < 0 || along > L) return;
        if (Math.abs(-dx * sa + dy * ca) < 9 + e.r) strike(e, st.dmg * 3, ca * 60, sa * 60, "beam");
      });
    },
  },

  // Pulse : une grenade lancée sur l'ennemi le plus proche, qui explose en petite zone
  grenade: {
    name: "Grenade",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = 1.4 * cdMul();
      P.aim = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      P.muzzle = 0.06;
      SFX.shoot();
      const R = 58 * rngMul(), d = st.dmg * 3;
      fx.push({ k: "nade", x0: P.x, y0: P.y, x: P.x, y: P.y, tx: tgt.x, ty: tgt.y, life: 0.5, t: 0.5, onEnd: (f) => {
        SFX.bomb();
        waves.push({ x: f.tx, y: f.ty, r: 0, max: R, life: 0.25, t: 0.25 });
        enemies.forEach((e) => {
          const dx = e.x - f.tx, dy = e.y - f.ty, dd = Math.hypot(dx, dy) || 1;
          if (dd < R + e.r) strike(e, d, (dx / dd) * 160, (dy / dd) * 160, "blast");
        });
      } });
    },
  },

  // Zap : un éclair qui saute sur trois ennemis proches
  chain: {
    name: "Éclair en chaîne",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      let cur = nearest(st.range * 0.8);
      if (!cur) return;
      w.cd = 0.95 * cdMul();
      P.aim = Math.atan2(cur.y - P.y, cur.x - P.x);
      P.muzzle = 0.06;
      SFX.hit();
      const pts = [[P.x, P.y]], done = [];
      for (let j = 0; j < 3 && cur; j++) {
        pts.push([cur.x, cur.y]);
        strike(cur, st.dmg * 1.5, 0, 0, "bolt");
        done.push(cur);
        let nx = null, nd = 150 * 150;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.hp <= 0 || done.indexOf(e) >= 0) continue;
          const dx = e.x - cur.x, dy = e.y - cur.y, dd = dx * dx + dy * dy;
          if (dd < nd) { nd = dd; nx = e; }
        }
        cur = nx;
      }
      fx.push({ k: "bolt", pts, life: 0.14, t: 0.14 });
    },
  },

  // ----- les armes universelles -----

  // Mines : une mine posée derrière toi, qui explose au contact
  mine: {
    name: "Mines",
    max: 8,
    vals: [1, 2, 3],
    text: (v) => "pose des mines plus souvent et plus puissantes (+" + v + ")",
    legendText: "les mines se divisent en deux explosions",
    cd0: 1,
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = Math.max(1, 3.2 - 0.25 * w.lvl) * cdMul();
      const R = 50 * rngMul(), d = st.dmg * (3 + 0.5 * w.lvl);
      fx.push({ k: "mine", x: P.x - P.dx * 18, y: P.y - P.dy * 18, life: 10, t: 10, arm: 0.4,
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
          boom(f.x, f.y, R, d);
          if (w.legend) [-1, 1].forEach((s) => fx.push({ k: "flash", x: f.x + s * 38, y: f.y, life: 0.25, t: 0.25, onEnd: (q) => boom(q.x, q.y, R * 0.7, d * 0.6) }));
        } });
    },
  },

  // Drone : des drones tournent autour de toi et tirent seuls
  drone: {
    name: "Drone",
    max: 8,
    cap: 6,
    vals: [1, 2, 3],
    text: (v) => "+" + plural(v, "drone") + " qui tire seul",
    legendText: "les drones lancent des missiles à tête chercheuse",
    update(w, dt) {
      w.angle += dt * 1.6;
      w.cds = w.cds || [];
      w.mis = (w.mis || 0) - dt;
      for (let o = 0; o < w.lvl; o++) {
        const a = w.angle + (o / w.lvl) * 6.283, x = P.x + Math.cos(a) * 38, y = P.y + Math.sin(a) * 38;
        w.cds[o] = (w.cds[o] || 0) - dt;
        if (w.cds[o] > 0) continue;
        const tgt = nearest(300 * rngMul(), x, y);
        if (!tgt) continue;
        w.cds[o] = 0.9 * cdMul();
        const ta = Math.atan2(tgt.y - y, tgt.x - x);
        fire(ta, 520, 0.6, { x, y, dmg: st.dmg * 0.6 });
        if (w.legend && w.mis <= 0) { w.mis = 2.5; fire(ta, 260, 2.5, { x, y, dmg: st.dmg * 2, home: true, blast: 45, size: 1.6 }); }
      }
    },
  },

  // Champ de feu : une zone qui brûle autour de toi
  flame: {
    name: "Champ de feu",
    max: 8,
    vals: [1, 2, 3],
    text: (v) => "zone qui brûle autour de toi, plus grande et plus forte (+" + v + ")",
    legendText: "les brûlures suivent les ennemis qui fuient",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      w.cd = 0.5;
      const R = (46 + 8 * w.lvl) * rngMul(), d = st.dmg * 0.45 * (1 + 0.2 * w.lvl);
      enemies.forEach((e) => {
        if (e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < R + e.r) {
          strike(e, d, 0, 0, "burn");
          if (w.legend) { e.burn = 2; e.burnT = 0.5; }
        }
      });
    },
  },

  // Éclair : la foudre tombe sur un ennemi au hasard
  storm: {
    name: "Éclair",
    max: 8,
    vals: [1, 2, 3],
    text: (v) => "la foudre frappe plus souvent et plus fort (+" + v + ")",
    legendText: "la foudre rebondit sur 3 ennemis",
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 360);
      if (!cand.length) return;
      w.cd = Math.max(0.9, 2.4 - 0.15 * w.lvl) * cdMul();
      SFX.hit();
      for (let k = 0, n = 1 + Math.floor((w.lvl - 1) / 2); k < n; k++) {
        let cur = cand[(Math.random() * cand.length) | 0];
        const pts = [[cur.x + rnd(-8, 8), cur.y - 220]], done = [];
        for (let j = 0; j < (w.legend ? 3 : 1) && cur; j++) {
          pts.push([cur.x, cur.y]);
          strike(cur, st.dmg * 4, 0, 0, "bolt");
          done.push(cur);
          let nx = null, nd = 150 * 150;
          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e.hp <= 0 || done.indexOf(e) >= 0) continue;
            const dx = e.x - cur.x, dy = e.y - cur.y, dd = dx * dx + dy * dy;
            if (dd < nd) { nd = dd; nx = e; }
          }
          cur = nx;
        }
        fx.push({ k: "bolt", pts, life: 0.18, t: 0.18 });
      }
    },
  },
};

// les armes qu'on peut gagner en carte : même forme qu'une amélioration, pour que le tirage reste le même
const WEAPON_CARDS = Object.keys(WEAPONS).filter((id) => WEAPONS[id].max).map((id) => {
  const d = WEAPONS[id];
  return {
    id, name: d.name, max: d.max, vals: d.vals,
    text: (v, r) => d.text(v) + (r === 2 ? " — " + d.legendText : ""),
    apply: (v, r) => { addWeapon(id, v); if (r === 2) weapon(id).legend = true; },
  };
});

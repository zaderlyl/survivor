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
const nearest = (maxR) => {
  let near = null, nd = maxR * maxR;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.hp <= 0) continue;
    const dx = e.x - P.x, dy = e.y - P.y, dd = dx * dx + dy * dy;
    if (dd < nd) { nd = dd; near = e; }
  }
  return near;
};
// un coup avec chance de critique ; kx, ky : recul
const strike = (e, d, kx, ky, src) => {
  const crit = Math.random() < st.crit;
  damage(e, d * (crit ? 2 : 1), crit, e.type === "boss" ? kx * 0.2 : kx, e.type === "boss" ? ky * 0.2 : ky, src);
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
    vals: [1, 1, 2, 3],
    text: (v) => "+" + plural(v, "lame") + " qui tourne autour de toi",
    update(w, dt) {
      w.angle += dt * 3.2;
      for (let o = 0; o < w.lvl; o++) {
        const a = w.angle + (o / w.lvl) * 6.283;
        const ox = P.x + Math.cos(a) * st.orbR, oy = P.y + Math.sin(a) * st.orbR;
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
    vals: [1, 1, 2, 3],
    text: (v) => "l'onde qui repousse grandit et revient plus vite (+" + v + ")",
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
        if (d < R + e.r) damage(e, 3 + Math.min(w.lvl, 10) * 1.5, false, (dx / d) * (e.type === "boss" ? 120 : 420), (dy / d) * (e.type === "boss" ? 120 : 420));
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
};

// les armes qu'on peut gagner en carte : même forme qu'une amélioration, pour que le tirage reste le même
const WEAPON_CARDS = Object.keys(WEAPONS).filter((id) => WEAPONS[id].max).map((id) => {
  const d = WEAPONS[id];
  return { id, name: d.name, max: d.max, vals: d.vals, text: d.text, apply: (v) => addWeapon(id, v) };
});

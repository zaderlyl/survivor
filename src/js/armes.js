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
};

// les armes qu'on peut gagner en carte : même forme qu'une amélioration, pour que le tirage reste le même
const WEAPON_CARDS = Object.keys(WEAPONS).filter((id) => WEAPONS[id].max).map((id) => {
  const d = WEAPONS[id];
  return { id, name: d.name, max: d.max, vals: d.vals, text: d.text, apply: (v) => addWeapon(id, v) };
});

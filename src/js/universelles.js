"use strict";

/* ---------- Les armes universelles ---------- */
// Chaque arme a des variantes : des cartes qui ne sortent que si on possède l'arme (sinon c'est la carte de l'arme elle-même qui sort).
// Une variante a ses 3 valeurs de rareté ; la rareté légendaire active en plus l'effet changé de l'arme (legendText).
const orbCount = (w) => Math.min(12, 1 + (w.n || 0));
const orbRadius = (w) => st.orbR * (1 + (w.rad || 0));
const flameRadius = (w) => 54 * (1 + (w.size || 0)) * rngMul();
const droneCount = (w) => Math.min(8, 1 + (w.n || 0));
const slow = (w, base) => Math.max(base * 0.4, base * (1 - (w.rate || 0))); // recharge raccourcie par la variante « rate »
const bump = (key) => (w, v) => { w[key] = (w[key] || 0) + v; };

Object.assign(WEAPONS, {
  // les lames en orbite
  orb: {
    name: "Lames",
    intro: "des lames tournent autour de toi",
    legendText: "les lames lancent des éclats vers l'extérieur",
    variants: [
      { id: "n", max: 8, vals: [1, 2, 3], text: (v) => "+" + plural(v, "lame") + " qui tourne autour de toi", apply: bump("n") },
      { id: "spin", max: 6, vals: [0.15, 0.3, 0.6], text: (v) => "les lames tournent " + pct(v) + " plus vite", apply: bump("spin") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lames", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.12, 0.25, 0.45], text: (v) => "cercle " + pct(v) + " plus large", apply: bump("rad") },
    ],
    update(w, dt) {
      w.angle += dt * 3.2 * (1 + (w.spin || 0));
      w.sh = (w.sh || 0) - dt;
      const shard = w.legend && w.sh <= 0, n = orbCount(w), R = orbRadius(w);
      if (shard) w.sh = 1.2;
      for (let o = 0; o < n; o++) {
        const a = w.angle + (o / n) * 6.283;
        const ox = P.x + Math.cos(a) * R, oy = P.y + Math.sin(a) * R;
        if (shard) fire(a, 340, 0.6, { x: ox, y: oy, dmg: st.dmg * 0.8, color: WEAPON_COLOR.orb });
        if (Math.random() < 0.5) trail(ox, oy, WEAPON_COLOR.orb, 2); // une traînée de lumière derrière chaque lame
        const cx = clamp((ox / CELL) | 0, 0, COLS - 1), cy = clamp((oy / CELL) | 0, 0, ROWS - 1);
        for (let yy = Math.max(0, cy - 1); yy <= Math.min(ROWS - 1, cy + 1); yy++) {
          for (let xx = Math.max(0, cx - 1); xx <= Math.min(COLS - 1, cx + 1); xx++) {
            const c = cells[yy * COLS + xx];
            for (let k = 0; k < c.length; k++) {
              const e = enemies[c[k]];
              if (!e || e.orbCd > 0) continue;
              const dx = e.x - ox, dy = e.y - oy;
              if (dx * dx + dy * dy < (e.r + 6) * (e.r + 6)) { damage(e, Math.max(1, st.dmg * st.orbDmg * (1 + (w.dm || 0))), false, (dx / (Math.hypot(dx, dy) || 1)) * 120, (dy / (Math.hypot(dx, dy) || 1)) * 120, "orb"); e.orbCd = 0.3; }
            }
          }
        }
      }
    },
  },

  // l'onde : un coup qui repousse tout autour
  wave: {
    name: "Onde",
    intro: "une onde repousse et blesse tout autour de toi",
    legendText: "gèle les ennemis touchés 1 s",
    cd0: 3,
    variants: [
      { id: "size", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "onde " + pct(v) + " plus large", apply: bump("size") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "l'onde revient " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'onde", apply: bump("dm") },
      { id: "knock", max: 6, vals: [0.25, 0.5, 1], text: (v) => "recul " + pct(v) + " plus fort", apply: bump("knock") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      w.cd = Math.max(1.2, slow(w, 5.2) * st.waveMul);
      const R = Math.min(330, 82 * (1 + (w.size || 0))), kn = 1 + (w.knock || 0);
      SFX.wave();
      ringFx(P.x, P.y, WEAPON_COLOR.wave, R, 0.35);
      ringFx(P.x, P.y, "#e6d6ff", R * 0.7, 0.3);
      flashFx(P.x, P.y, WEAPON_COLOR.wave, R * 0.55);
      spark(P.x, P.y, WEAPON_COLOR.wave, 16, R * 2.4);
      enemies.forEach((e) => {
        const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1;
        if (d < R + e.r) {
          const k = (e.type === "boss" ? 120 : 420) * kn;
          damage(e, 4.5 * (1 + (w.dm || 0)), false, (dx / d) * k, (dy / d) * k, "wave");
          if (w.legend) { e.frozen = 1; spark(e.x, e.y, "#8fe0ff", 6, 130); }
        }
      });
    },
  },

  // Mines : une mine posée derrière toi, qui explose au contact
  mine: {
    name: "Mines",
    intro: "pose des mines derrière toi, qui explosent au contact",
    legendText: "les mines se divisent en deux explosions",
    cd0: 1,
    variants: [
      { id: "n", max: 6, vals: [1, 2, 3], text: (v) => "+" + plural(v, "mine") + " posée à la fois", apply: bump("n") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des mines", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "pose les mines " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = Math.max(0.8, slow(w, 2.95)) * cdMul();
      const R = 50 * (1 + (w.rad || 0)) * rngMul(), d = st.dmg * 3.5 * (1 + (w.dm || 0)), n = 1 + (w.n || 0);
      for (let k = 0; k < n; k++) {
        const a = Math.atan2(-P.dy, -P.dx) + (k - (n - 1) / 2) * 0.8;
        spark(P.x + Math.cos(a) * 20, P.y + Math.sin(a) * 20, WEAPON_COLOR.mine, 3, 60); // un éclat quand elle est posée
        fx.push({ k: "mine", x: P.x + Math.cos(a) * 20, y: P.y + Math.sin(a) * 20, life: 10, t: 10, arm: 0.4,
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
            boom(f.x, f.y, R, d, WEAPON_COLOR.mine);
            if (w.legend) [-1, 1].forEach((s) => fx.push({ k: "flash", x: f.x + s * 38, y: f.y, life: 0.25, t: 0.25, onEnd: (q) => boom(q.x, q.y, R * 0.7, d * 0.6, WEAPON_COLOR.mine) }));
          } });
      }
    },
  },

  // Drone : des drones tournent autour de toi et tirent seuls
  drone: {
    name: "Drone",
    intro: "un drone tourne autour de toi et tire seul",
    legendText: "les drones lancent des missiles à tête chercheuse",
    variants: [
      { id: "n", max: 7, vals: [1, 2, 3], text: (v) => "+" + plural(v, "drone"), apply: bump("n") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "les drones tirent " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des drones", apply: bump("dm") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée des drones +" + pct(v), apply: bump("rng") },
    ],
    update(w, dt) {
      w.angle += dt * 1.6;
      w.cds = w.cds || [];
      w.mis = (w.mis || 0) - dt;
      const n = droneCount(w);
      for (let o = 0; o < n; o++) {
        const a = w.angle + (o / n) * 6.283, x = P.x + Math.cos(a) * 38, y = P.y + Math.sin(a) * 38;
        w.cds[o] = (w.cds[o] || 0) - dt;
        if (w.cds[o] > 0) continue;
        const tgt = nearest(300 * (1 + (w.rng || 0)) * rngMul(), x, y);
        if (!tgt) continue;
        w.cds[o] = slow(w, 0.9) * cdMul();
        const ta = Math.atan2(tgt.y - y, tgt.x - x);
        fire(ta, 520, 0.6 * (1 + (w.rng || 0)), { x, y, dmg: st.dmg * 0.6 * (1 + (w.dm || 0)), color: WEAPON_COLOR.drone });
        spark(x, y, WEAPON_COLOR.drone, 2, 80);
        if (w.legend && w.mis <= 0) { w.mis = 2.5; fire(ta, 260, 2.5, { x, y, dmg: st.dmg * 2, home: true, blast: 45, size: 1.6, color: "#ff8a1f" }); }
      }
    },
  },

  // Champ de feu : une zone qui brûle autour de toi
  flame: {
    name: "Champ de feu",
    intro: "une zone brûle les ennemis autour de toi",
    legendText: "les brûlures suivent les ennemis qui fuient",
    variants: [
      { id: "size", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "zone " + pct(v) + " plus large", apply: bump("size") },
      { id: "dm", max: 6, vals: [0.3, 0.6, 1.2], text: (v) => "brûlure " + pct(v) + " plus forte", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "la brûlure frappe " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.em = (w.em || 0) - dt;
      if (w.em <= 0) { // des braises montent dans la zone
        w.em = 0.05;
        const a = rnd(0, 6.283), rr = Math.sqrt(Math.random()) * flameRadius(w);
        emberFx(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr, Math.random() < 0.5 ? "#ff6a1f" : "#ffb02e");
      }
      w.cd -= dt;
      if (w.cd > 0) return;
      w.cd = slow(w, 0.5);
      const R = flameRadius(w), d = st.dmg * 0.55 * (1 + (w.dm || 0));
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
    intro: "la foudre tombe sur un ennemi au hasard",
    legendText: "la foudre rebondit sur 3 ennemis",
    variants: [
      { id: "n", max: 6, vals: [1, 2, 3], text: (v) => "+" + plural(v, "foudre") + " à chaque coup", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la foudre", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "la foudre tombe " + pct(v) + " plus souvent", apply: bump("rate") },
      { id: "blast", max: 6, vals: [24, 36, 55], text: (v) => "petite explosion de " + v + " px à l'impact", apply: (w, v) => { w.blast = Math.max(w.blast || 0, v); } },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 360);
      if (!cand.length) return;
      w.cd = Math.max(0.6, slow(w, 2.25)) * cdMul();
      SFX.hit();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        let cur = cand[(Math.random() * cand.length) | 0];
        const pts = [[cur.x + rnd(-8, 8), cur.y - 220]], done = [];
        for (let j = 0; j < (w.legend ? 3 : 1) && cur; j++) {
          pts.push([cur.x, cur.y]);
          strike(cur, st.dmg * 4 * (1 + (w.dm || 0)), 0, 0, "storm");
          flashFx(cur.x, cur.y, WEAPON_COLOR.storm, 22);
          if (w.blast) splash(cur, w.blast, st.dmg * 1.5);
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
        fx.push({ k: "bolt", pts, life: 0.18, t: 0.18, color: WEAPON_COLOR.storm });
      }
    },
  },
});

// les cartes d'armes, même forme qu'une amélioration : la carte de l'arme si on ne l'a pas, sinon ses variantes
const weaponPool = () => {
  const out = [];
  Object.keys(WEAPONS).forEach((id) => {
    const d = WEAPONS[id];
    if (!d.variants || (d.char && d.char !== best.char)) return; // les armes uniques ne sortent qu'avec leur personnage
    if (!weapon(id)) {
      out.push({ id, weight: d.char ? 2 : 0.7, name: d.name, max: 99, vals: [0, 0, 0], isNew: true, text: (v, r) => d.intro + (r === 2 ? " — " + d.legendText : ""), apply: (v, r) => { addWeapon(id, 1); if (r === 2) weapon(id).legend = true; } });
      return;
    }
    d.variants.forEach((va) => out.push({
      id: id + "." + va.id, weapon: id, weight: d.char ? 2 : 0.7, name: d.name, max: va.max, vals: va.vals,
      text: (v, r) => va.text(v) + (r === 2 ? " — " + d.legendText : ""),
      apply: (v, r) => { va.apply(weapon(id), v); if (r === 2) weapon(id).legend = true; },
    }));
  });
  return out;
};

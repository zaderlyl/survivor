"use strict";

/* ---------- Encore des armes uniques : Pulse (explosifs) et Zap (foudre) ---------- */

Object.assign(WEAPONS, {
  // ===== Pulse =====

  // Pluie d'obus : quelques gros obus lents retombent en cloche sur une zone
  shellrain: {
    char: "pulse",
    name: "Pluie d'obus",
    intro: "quelques gros obus lents retombent en cloche sur une zone",
    legendText: "chaque obus laisse un cratère de feu",
    cd0: 2,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "obus") + " par pluie", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des obus", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "la pluie revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 7) * cdMul();
      const R = 60 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.shellrain, cx = tgt.x, cy = tgt.y, n = 4 + (w.n || 0);
      SFX.shoot();
      for (let k = 0; k < n; k++) {
        const tx = cx + rnd(-130, 130), ty = cy + rnd(-130, 130);
        const drop = () => fx.push({ k: "shell", color: col, tx, ty, R, life: 1.2, t: 1.2,
          onEnd() {
            boom(tx, ty, R, d, col);
            if (w.legend) fx.push({ k: "cloud", color: "#ff6a1f", emb: "#ff6a1f", x: tx, y: ty, R: 32, life: 2, t: 2, cd: 0,
              tick(f, h) { f.cd -= h; if (f.cd > 0) return; f.cd = 0.4; enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < f.R + e.r) strike(e, st.dmg * 0.6, 0, 0, "burn"); }); } });
          } });
        if (k === 0) drop(); else fx.push({ k: "flash", x: cx, y: cy, life: k * 0.2, t: 0.1, onEnd: drop });
      }
    },
  },

  // Grenade à fusion : elle attire les ennemis avant d'exploser
  fusiongrenade: {
    char: "pulse",
    name: "Grenade à fusion",
    intro: "une grenade attire les ennemis vers elle, puis explose",
    legendText: "elle explose une seconde fois",
    cd0: 2,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la grenade", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "l'attraction dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "lance la grenade " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 6) * cdMul();
      const R = 80 * (1 + (w.rad || 0)), d = st.dmg * 7 * (1 + (w.dm || 0)), dur = 1.2 * (1 + (w.dur || 0)), col = WEAPON_COLOR.fusiongrenade, tx = tgt.x, ty = tgt.y;
      P.aim = Math.atan2(ty - P.y, tx - P.x);
      SFX.shoot();
      fx.push({ k: "nade", color: col, x0: P.x, y0: P.y, x: P.x, y: P.y, tx, ty, life: 0.5, t: 0.5, tick(f) { trail(f.x, f.y, col, 2); },
        onEnd() {
          SFX.wave();
          fx.push({ k: "singularity", color: col, x: tx, y: ty, R: 200, life: dur, t: dur,
            tick(f, h) {
              enemies.forEach((e) => {
                const dx = f.x - e.x, dy = f.y - e.y, dd = Math.hypot(dx, dy) || 1;
                if (e.hp > 0 && dd < 220 && dd > 6) { const k = e.type === "boss" ? 0.15 : 1; e.kx += (dx / dd) * 420 * h * k; e.ky += (dy / dd) * 420 * h * k; }
              });
              if (Math.random() < 0.6) spark(f.x + rnd(-30, 30), f.y + rnd(-30, 30), col, 1, 60);
            },
            onEnd(f) {
              boom(f.x, f.y, R, d, col);
              if (w.legend) fx.push({ k: "flash", x: f.x, y: f.y, life: 0.3, t: 0.1, onEnd: () => boom(f.x, f.y, R * 1.2, d * 0.7, col) });
            } });
        } });
    },
  },

  // Armure réactive : elle explose quand tu es touché
  reactivearmor: {
    char: "pulse",
    name: "Armure réactive",
    intro: "quand tu es touché, ton armure explose tout autour de toi",
    legendText: "l'explosion se répète trois fois",
    cd0: 0,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'explosion", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "echo", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "écho") + " d'explosion", apply: bump("echo") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "se recharge " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) { w.cd -= dt; },
    onHurt(w) {
      if (w.cd > 0) return;
      w.cd = slow(w, 1.8);
      const R = 100 * (1 + (w.rad || 0)), d = st.dmg * 6 * (1 + (w.dm || 0)), n = 1 + (w.echo || 0) + (w.legend ? 2 : 0);
      for (let k = 0; k < n; k++) {
        const go = () => boom(P.x, P.y, R * (1 + 0.15 * k), d * (1 - 0.1 * k), WEAPON_COLOR.reactivearmor);
        if (k === 0) go(); else fx.push({ k: "flash", x: P.x, y: P.y, life: k * 0.25, t: 0.1, onEnd: go });
      }
    },
  },

  // Bombe à retardement : une grosse bombe plantée qui explose après un compte à rebours
  timebomb: {
    char: "pulse",
    name: "Bombe à retardement",
    intro: "une grosse bombe plantée explose après un compte à rebours",
    legendText: "l'explosion se répète en trois vagues",
    cd0: 2,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la bombe", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "fast", max: 5, vals: [0.1, 0.2, 0.35], text: (v) => "mèche " + pct(v) + " plus courte", apply: bump("fast") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "pose les bombes " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(250)) return;
      w.cd = slow(w, 8) * cdMul();
      const R = 120 * (1 + (w.rad || 0)), d = st.dmg * 12 * (1 + (w.dm || 0)), fuse = 3 * (1 - Math.min(0.6, w.fast || 0)), col = WEAPON_COLOR.timebomb;
      SFX.shoot();
      fx.push({ k: "tbomb", color: col, x: P.x, y: P.y, R, life: fuse, t: fuse,
        onEnd(f) {
          boom(f.x, f.y, R, d, col);
          shake = Math.max(shake, 7);
          if (w.legend) [1, 2].forEach((k) => fx.push({ k: "flash", x: f.x, y: f.y, life: 0.3 * k, t: 0.1, onEnd: () => boom(f.x, f.y, R * (1 + 0.2 * k), d * 0.6, col) }));
        } });
    },
  },

  // Lance-flammes : un cône de feu soutenu quelques secondes
  flamethrower: {
    char: "pulse",
    name: "Lance-flammes",
    intro: "un cône de feu brûle tout devant toi pendant quelques secondes",
    legendText: "le cône est deux fois plus large",
    cd0: 2,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des flammes", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "il crache " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée des flammes +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = 140 * (1 + (w.rng || 0)) * rngMul(), tgt = nearest(L + 40);
      if (!tgt) return;
      const dur = 2 * (1 + (w.dur || 0)), d = st.dmg * 0.5 * (1 + (w.dm || 0)), cone = w.legend ? 0.7 : 0.35;
      w.cd = slow(w, 4) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0, a: Math.atan2(tgt.y - P.y, tgt.x - P.x),
        tick(f, h) {
          const tg = nearest(L + 40);
          if (tg) {
            let da = Math.atan2(tg.y - P.y, tg.x - P.x) - f.a;
            da = Math.atan2(Math.sin(da), Math.cos(da));
            f.a += clamp(da, -5 * h, 5 * h);
          }
          P.aim = f.a;
          P.muzzle = 0.06;
          if (!calm) for (let i = 0; i < 4 && parts.length < MAX_PARTS; i++) { // des flammes qui jaillissent
            const aa = f.a + rnd(-cone, cone), sp = rnd(200, 340);
            parts.push({ x: P.x + Math.cos(f.a) * 18, y: P.y + Math.sin(f.a) * 18, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: 0.4, max: 0.4, color: Math.random() < 0.5 ? "#ff6a1f" : "#ffd23f", size: 3 + (Math.random() < 0.4 ? 1 : 0), glow: true });
          }
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.12;
          enemies.forEach((e) => {
            const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy);
            if (e.hp <= 0 || dd > L + e.r) return;
            let da = Math.atan2(dy, dx) - f.a;
            da = Math.atan2(Math.sin(da), Math.cos(da));
            if (Math.abs(da) < cone + 0.15) { strike(e, d, 0, 0, "burn"); e.burn = 1.5; e.burnT = 0.5; }
          });
        } });
    },
  },

  // ===== Zap =====

  // Foudre globulaire : un globe de foudre flotte vers un ennemi et explose au contact
  ballightning: {
    char: "zap",
    name: "Foudre globulaire",
    intro: "un globe de foudre flotte vers un ennemi et explose au contact",
    legendText: "il se divise en trois petits globes",
    cd0: 2,
    variants: [
      { id: "n", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "globe") + " à la fois", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du globe", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "lance les globes " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const R = 60 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.ballightning;
      SFX.shoot();
      const orb = (x, y, a, small) => fx.push({ k: "orb2", color: col, spk: col, sz: small ? 4 : 7, x, y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, life: small ? 2.5 : 4, t: small ? 2.5 : 4,
        tick(f, h) {
          const tg = nearest(500, f.x, f.y);
          if (tg) {
            const dx = tg.x - f.x, dy = tg.y - f.y, dd = Math.hypot(dx, dy) || 1;
            f.vx += ((dx / dd) * 150 - f.vx) * Math.min(1, 3 * h);
            f.vy += ((dy / dd) * 150 - f.vy) * Math.min(1, 3 * h);
          }
          f.x += f.vx * h;
          f.y += f.vy * h;
          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e.hp <= 0 || Math.hypot(e.x - f.x, e.y - f.y) >= 14 + e.r) continue;
            f.life = 0;
            boom(f.x, f.y, small ? R * 0.6 : R, small ? d * 0.5 : d, col);
            zapAround(f.x, f.y, 150, 3, d * 0.5, col);
            if (w.legend && !small) for (let j = 0; j < 3; j++) orb(f.x, f.y, rnd(0, 6.283), true);
            return;
          }
        } });
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) orb(P.x, P.y, Math.atan2(tgt.y - P.y, tgt.x - P.x) + (k - (n - 1) / 2) * 0.5, false);
    },
  },

  // Orage statique : une zone qui crépite et foudroie au hasard
  staticstorm: {
    char: "zap",
    name: "Orage statique",
    intro: "une zone crépite et foudroie au hasard les ennemis qui s'y trouvent",
    legendText: "les foudroyés sont étourdis",
    cd0: 2,
    variants: [
      { id: "rad", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "zone " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'orage", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "l'orage dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "l'orage revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (!cand.length) return;
      w.cd = slow(w, 8) * cdMul();
      const tg = cand[(Math.random() * cand.length) | 0], R = 120 * (1 + (w.rad || 0)), dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 2.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.staticstorm;
      SFX.wave();
      fx.push({ k: "cloud", color: col, spk: col, x: tg.x, y: tg.y, R, life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.2;
          const inside = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < R + e.r);
          if (!inside.length) return;
          const e = inside[(Math.random() * inside.length) | 0];
          fx.push({ k: "bolt", color: col, pts: [[e.x + rnd(-8, 8), e.y - 240], [e.x, e.y]], life: 0.15, t: 0.15 });
          strike(e, d, 0, 0, "storm");
          flashFx(e.x, e.y, col, 14);
          if (w.legend) e.frozen = 0.6;
        } });
    },
  },

  // Chaîne longue : un éclair qui saute sur beaucoup de cibles
  longchain: {
    char: "zap",
    name: "Chaîne longue",
    intro: "un éclair qui saute d'ennemi en ennemi, bien plus loin qu'une chaîne ordinaire",
    legendText: "deux fois plus de sauts",
    cd0: 2,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v * 3, "saut"), apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la chaîne", apply: bump("dm") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "sauts " + pct(v) + " plus longs", apply: bump("rng") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "la chaîne revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      let cur = nearest(st.range);
      if (!cur) return;
      w.cd = slow(w, 4) * cdMul();
      const jumps = (8 + 3 * (w.n || 0)) * (w.legend ? 2 : 1), jr = 170 * (1 + (w.rng || 0)), d = st.dmg * 1.6 * (1 + (w.dm || 0)), col = WEAPON_COLOR.longchain, done = new Set();
      let fx0 = P.x, fy0 = P.y;
      SFX.hit();
      for (let j = 0; j < jumps && cur; j++) {
        fx.push({ k: "bolt", color: col, pts: [[fx0, fy0], [cur.x, cur.y]], life: 0.15 + j * 0.01, t: 0.15 + j * 0.01 });
        strike(cur, d, 0, 0, "bolt");
        flashFx(cur.x, cur.y, col, 11);
        done.add(cur);
        fx0 = cur.x;
        fy0 = cur.y;
        let nx = null, nd = jr * jr;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.hp <= 0 || done.has(e)) continue;
          const dx = e.x - fx0, dy = e.y - fy0, dd = dx * dx + dy * dy;
          if (dd < nd) { nd = dd; nx = e; }
        }
        cur = nx;
      }
    },
  },

  // Bobine mobile : une bobine qui te suit et foudroie les ennemis proches
  mobilecoil: {
    char: "zap",
    name: "Bobine mobile",
    intro: "une bobine te suit partout et foudroie les ennemis proches",
    legendText: "elle foudroie quatre cibles à la fois",
    cd0: 0,
    variants: [
      { id: "n", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "bobine"), apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des bobines", apply: bump("dm") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée des bobines +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "les bobines frappent " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      const n = 1 + (w.n || 0), d = st.dmg * 1.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.mobilecoil;
      w.co = w.co || [];
      w.ang = (w.ang || 0) + dt * 0.8;
      while (w.co.length < n) w.co.push({ cd: rnd(0.1, 0.5) });
      w.co.forEach((c, i) => {
        const a = w.ang + (i / n) * 6.283, tx = P.x + Math.cos(a) * 70, ty = P.y + Math.sin(a) * 70;
        if (c.x === undefined) { c.x = tx; c.y = ty; }
        c.x += (tx - c.x) * Math.min(1, 4 * dt);
        c.y += (ty - c.y) * Math.min(1, 4 * dt);
        c.cd -= dt;
        if (c.cd > 0) return;
        c.cd = slow(w, 0.5) * cdMul();
        zapAround(c.x, c.y - 10, 180 * (1 + (w.rng || 0)) * rngMul(), w.legend ? 4 : 2, d, col);
      });
    },
  },

  // Arc voltaïque : un arc continu qui saute de cible en cible
  arcvolt: {
    char: "zap",
    name: "Arc voltaïque",
    intro: "un arc électrique continu relie Zap à l'ennemi le plus proche, puis saute plus loin",
    legendText: "deux arcs en parallèle",
    cd0: 2,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "saut") + " de l'arc", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'arc", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "l'arc dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "l'arc revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const dur = 2.5 * (1 + (w.dur || 0)), d = st.dmg * 0.9 * (1 + (w.dm || 0)), col = WEAPON_COLOR.arcvolt;
      w.cd = slow(w, 5) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.1;
          const arcs = w.legend ? 2 : 1, done = new Set();
          for (let q = 0; q < arcs; q++) {
            let fromX = P.x, fromY = P.y, cur = null, bd = 260 * 260;
            for (let i = 0; i < enemies.length; i++) { const e = enemies[i]; if (e.hp <= 0 || done.has(e)) continue; const dx = e.x - fromX, dy = e.y - fromY, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; cur = e; } }
            for (let j = 0; j < 2 + (w.n || 0) && cur; j++) {
              fx.push({ k: "bolt", color: col, pts: [[fromX, fromY], [cur.x, cur.y]], life: 0.1, t: 0.1 });
              strike(cur, d, 0, 0, "bolt");
              done.add(cur);
              fromX = cur.x;
              fromY = cur.y;
              let nx = null, nd = 130 * 130;
              for (let i = 0; i < enemies.length; i++) { const e = enemies[i]; if (e.hp <= 0 || done.has(e)) continue; const dx = e.x - fromX, dy = e.y - fromY, dd = dx * dx + dy * dy; if (dd < nd) { nd = dd; nx = e; } }
              cur = nx;
            }
          }
        } });
    },
  },
});

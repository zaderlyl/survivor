"use strict";

/* ---------- Encore des armes uniques : Chrome (des épées) et Rig (de gros rayons) ---------- */

Object.assign(WEAPONS, {
  // ===== Chrome =====

  // Épée spectrale : une épée fantôme tourne autour de lui et se jette sur les ennemis
  spectral: {
    char: "chrome",
    name: "Épée spectrale",
    intro: "une épée fantôme t'accompagne et se jette sur les ennemis proches",
    legendText: "chaque coup projette une onde tranchante",
    cd0: 0,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "épée") + " spectrale", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des épées", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée des épées +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "les épées frappent " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.ang = (w.ang || 0) + dt * 2;
      const n = 1 + (w.n || 0), R = 160 * (1 + (w.rng || 0)) * rngMul(), d = st.dmg * 4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.spectral;
      w.sw = w.sw || [];
      while (w.sw.length < n) w.sw.push({ t: 0, cd: rnd(0.2, 0.8) });
      w.sw.forEach((s, i) => {
        const a = w.ang + (i / n) * 6.283, bx = P.x + Math.cos(a) * 46, by = P.y + Math.sin(a) * 46;
        if (s.t > 0) { // il se jette sur sa cible et revient
          s.t -= dt;
          const u = Math.min(1, 1 - s.t / 0.4), k = Math.sin(Math.PI * u);
          s.x = bx + (s.tx - bx) * k;
          s.y = by + (s.ty - by) * k;
          s.a = Math.atan2(s.ty - by, s.tx - bx);
          trail(s.x, s.y, col, 3);
          if (!s.hit && k > 0.85) {
            s.hit = true;
            enemies.forEach((e) => {
              const dx = e.x - s.x, dy = e.y - s.y, dd = Math.hypot(dx, dy) || 1;
              if (e.hp > 0 && dd < 28 + e.r) strike(e, d, (dx / dd) * 120, (dy / dd) * 120, "slash");
            });
            spark(s.x, s.y, col, 8, 230);
            SFX.dash();
            if (w.legend) fire(s.a, 460, 0.5, { x: s.x, y: s.y, dmg: d * 0.6, pierce: 3, color: col, size: 1.4 });
          }
          if (s.t <= 0) s.cd = slow(w, 0.8) * cdMul();
        } else {
          s.x = bx;
          s.y = by;
          s.a = a;
          s.cd -= dt;
          if (s.cd <= 0) {
            const tg = nearest(R, bx, by);
            if (tg) { s.t = 0.4; s.tx = tg.x; s.ty = tg.y; s.hit = false; } else s.cd = 0.2;
          }
        }
      });
    },
  },

  // Estoc : une rafale de coups d'estoc en ligne droite
  thrust: {
    char: "chrome",
    name: "Estoc",
    intro: "une rafale de coups d'estoc, en ligne droite, qui transpercent tout",
    legendText: "chaque estoc projette une lame d'énergie qui traverse",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "estoc") + " par rafale", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'estoc", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée de l'estoc +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "l'estoc revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = 260 * (1 + (w.rng || 0)) * rngMul(), tgt = nearest(L);
      if (!tgt) return;
      w.cd = slow(w, 3) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 3 + (w.n || 0), d = st.dmg * 3.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.thrust;
      P.aim = a;
      const stab = () => {
        SFX.dash();
        thickBeam(P.x, P.y, a, L, d, 6, col);
        P.x = clamp(P.x + Math.cos(a) * 16, 20, ARENA_W - 20); // il se fend en avant
        P.y = clamp(P.y + Math.sin(a) * 16, 20, ARENA_H - 20);
        if (w.legend) fire(a, 520, 0.5, { x: P.x, y: P.y, dmg: d * 0.6, pierce: 5, color: col, size: 1.5 });
      };
      for (let k = 0; k < n; k++) { if (k === 0) stab(); else fx.push({ k: "flash", x: P.x, y: P.y, life: k * 0.1, t: 0.1, onEnd: stab }); }
    },
  },

  // Danse des lames : une spirale de lames projetées autour de lui
  bladedance: {
    char: "chrome",
    name: "Danse des lames",
    intro: "des lames partent en spirale tout autour de toi",
    legendText: "la spirale tourne dans les deux sens",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "arms", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "bras") + " de spirale", apply: bump("arms") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lames", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la danse dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la danse revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const dur = 1.8 * (1 + (w.dur || 0)), d = st.dmg * 0.9 * (1 + (w.dm || 0)), arms = (1 + (w.arms || 0)) * (1 + lg(w)), col = WEAPON_COLOR.bladedance;
      w.cd = slow(w, 6) * cdMul() + dur;
      SFX.dash();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0, ang: rnd(0, 6.283),
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.06;
          f.ang += 0.5;
          for (let k = 0; k < arms; k++) fire(f.ang + (k / arms) * 6.283 * (w.legend && k % 2 ? -1 : 1), 420, 0.7, { x: P.x, y: P.y, dmg: d, pierce: 1, color: col });
        } });
    },
  },

  // Exécution : il tranche d'un coup les ennemis presque morts
  execution: {
    char: "chrome",
    name: "Exécution",
    intro: "tranche d'un coup les ennemis presque morts autour de toi",
    legendText: "chaque exécution te rend 5 PV",
    cd0: 1,
    variants: [
      { id: "thr", max: 99, vals: [0.08, 0.15, 0.25], text: (v) => "exécute jusqu'à +" + pct(v) + " de leur vie", apply: bump("thr") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "exécution") + " à la fois", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 260 * (1 + (w.rad || 0)) * rngMul(), thr = 0.25 + (w.thr || 0), col = WEAPON_COLOR.execution;
      const low = enemies.filter((e) => e.hp > 0 && e.type !== "boss" && e.hp < e.max * thr && Math.hypot(e.x - P.x, e.y - P.y) < R)
        .sort((a, b) => a.hp - b.hp).slice(0, 4 + 2 * (w.n || 0));
      if (!low.length) { w.cd = 0.5; return; }
      w.cd = slow(w, 7) * cdMul();
      SFX.dash();
      low.forEach((e) => {
        fx.push({ k: "arc", color: col, big: 1.4, x: e.x, y: e.y, a: -0.9, r: 30, spread: 1, life: 0.2, t: 0.2 });
        spark(e.x, e.y, col, 8, 240);
        damage(e, e.hp + 1, true, 0, 0, "slash");
        if (w.legend) P.hp = Math.min(st.maxHp, P.hp + 5);
      });
    },
  },

  // Tempête de lames : une rafale de coups rapides dans toutes les directions
  flurry: {
    char: "chrome",
    name: "Tempête de lames",
    intro: "une rafale de coups d'épée rapides, dans toutes les directions",
    legendText: "les coups sont deux fois plus larges",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la tempête", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la tempête dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "coups " + pct(v) + " plus longs", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la tempête revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(160)) return;
      const dur = 1.5 * (1 + (w.dur || 0)), R = 90 * (1 + (w.rad || 0)), d = st.dmg * 2.2 * (1 + (w.dm || 0)), col = WEAPON_COLOR.flurry;
      w.cd = slow(w, 6) * cdMul() + dur;
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.09;
          swordArc(rnd(0, 6.283), R, w.legend ? 1.6 : 0.9, d, 140, col, 1);
        } });
    },
  },

  // ===== Rig =====

  // Onde de particules : une large bande de lumière qui avance et balaie tout
  particlewave: {
    char: "rig",
    name: "Onde de particules",
    intro: "une large bande de lumière avance et balaie tout sur son passage",
    legendText: "la bande revient sur ses pas",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'onde", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "bande " + pct(v) + " plus large", apply: bump("wid") },
      { id: "rng", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "portée de l'onde +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "l'onde revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), W = 70 * (1 + (w.wid || 0)), dist = st.range * (1 + (w.rng || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.particlewave;
      const T = dist / 360, ca = Math.cos(a), sa = Math.sin(a);
      P.aim = a;
      SFX.bomb();
      let dir = 1, hit = new Set();
      fx.push({ k: "pwave", color: col, x: P.x + ca * 20, y: P.y + sa * 20, a, w: W, life: w.legend ? T * 2 : T, t: w.legend ? T * 2 : T,
        tick(f, h) {
          if (w.legend && dir === 1 && f.life < f.t / 2) { dir = -1; hit = new Set(); } // elle revient
          f.x += ca * 360 * h * dir;
          f.y += sa * 360 * h * dir;
          spark(f.x + (-sa) * rnd(-W, W), f.y + ca * rnd(-W, W), col, 1, 120);
          enemies.forEach((e) => {
            if (e.hp <= 0 || hit.has(e)) return;
            const dx = e.x - f.x, dy = e.y - f.y, along = dx * ca + dy * sa, perp = -dx * sa + dy * ca;
            if (Math.abs(along) < 16 + e.r && Math.abs(perp) < W + e.r) { hit.add(e); strike(e, d, ca * 200 * dir, sa * 200 * dir, "beam"); }
          });
        } });
    },
  },

  // Colonne de particules : un pilier de lumière qui tombe sur une cible et persiste
  pillar: {
    char: "rig",
    name: "Colonne de particules",
    intro: "un pilier de lumière tombe sur une cible et la brûle quelques secondes",
    legendText: "le pilier attire les ennemis vers lui",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "colonne") + " à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la colonne", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la colonne dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rad", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "colonne " + pct(v) + " plus large", apply: bump("rad") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (!cand.length) return;
      w.cd = slow(w, 6) * cdMul();
      const dur = 3 * (1 + (w.dur || 0)), R = 42 * (1 + (w.rad || 0)), d = st.dmg * 0.9 * (1 + (w.dm || 0)), col = WEAPON_COLOR.pillar;
      SFX.bomb();
      for (let k = 0, n = 1 + (w.n || 0); k < n && cand.length; k++) {
        const tg = cand.splice((Math.random() * cand.length) | 0, 1)[0];
        fx.push({ k: "pillar", color: col, x: tg.x, y: tg.y, R, life: dur, t: dur, cd: 0, spk: col,
          tick(f, h) {
            if (w.legend) { // il attire les ennemis
              enemies.forEach((e) => {
                const dx = f.x - e.x, dy = f.y - e.y, dd = Math.hypot(dx, dy) || 1;
                if (e.hp > 0 && dd < R * 4 && dd > 8 && e.type !== "boss") { e.kx += (dx / dd) * 200 * h; e.ky += (dy / dd) * 200 * h; }
              });
            }
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.2;
            enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < R + e.r) strike(e, d, 0, 0, "beam"); });
          } });
      }
    },
  },

  // Fouet de plasma : un gros rayon qui balaie un arc devant lui
  plasmawhip: {
    char: "rig",
    name: "Fouet de plasma",
    intro: "un gros rayon balaie un grand arc devant toi",
    legendText: "le fouet revient dans l'autre sens",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du fouet", apply: bump("dm") },
      { id: "len", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "fouet " + pct(v) + " plus long", apply: bump("len") },
      { id: "arc", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "balayage " + pct(v) + " plus large", apply: bump("arc") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le fouet revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = 220 * (1 + (w.len || 0)) * rngMul(), tgt = nearest(L + 40);
      if (!tgt) return;
      w.cd = slow(w, 3.5) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), arc = Math.min(2.4, 0.9 * (1 + (w.arc || 0))), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.plasmawhip;
      P.aim = a0;
      const sweep = (dir) => {
        SFX.bomb();
        const hit = new Set();
        fx.push({ k: "cbeam", color: col, x: P.x, y: P.y, a: a0 - arc * dir, len: L, w: 11, life: 0.4, t: 0.4,
          tick(f) {
            f.x = P.x;
            f.y = P.y;
            f.a = a0 + (-arc + 2 * arc * (1 - f.life / f.t)) * dir;
            const ca = Math.cos(f.a), sa = Math.sin(f.a);
            spark(P.x + ca * rnd(30, L), P.y + sa * rnd(30, L), col, 1, 120);
            enemies.forEach((e) => {
              if (e.hp <= 0 || hit.has(e)) return;
              const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
              if (along > 0 && along < L && Math.abs(-dx * sa + dy * ca) < 14 + e.r) { hit.add(e); strike(e, d, ca * 160, sa * 160, "beam"); }
            });
          } });
      };
      sweep(1);
      for (let k = 1; k <= lg(w); k++) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.45 * k, t: 0.1, onEnd: () => sweep(k % 2 ? -1 : 1) }); // un balayage de plus à chaque reprise
    },
  },

  // Canon double : deux gros rayons parallèles
  twincannon: {
    char: "rig",
    name: "Canon double",
    intro: "deux gros rayons parallèles partent côte à côte",
    legendText: "quatre rayons au lieu de deux",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "rayon") + " parallèle", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des rayons", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "rayons " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le canon revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.1, tgt = nearest(L);
      if (!tgt) return;
      w.cd = slow(w, 4) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = (2 + (w.n || 0)) * (w.legend ? 2 : 1), d = st.dmg * 5 * (1 + (w.dm || 0)), wid = 8 * (1 + (w.wid || 0)), px = -Math.sin(a), py = Math.cos(a);
      P.aim = a;
      SFX.bomb();
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * 26;
        thickBeam(P.x + px * off, P.y + py * off, a, L, d, wid, WEAPON_COLOR.twincannon);
      }
    },
  },

  // Pluie de particules : des traits de lumière tombent du ciel sur une zone
  particlerain: {
    char: "rig",
    name: "Pluie de particules",
    intro: "des traits de lumière tombent du ciel sur une zone pendant quelques secondes",
    legendText: "chaque impact explose en zone",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la pluie", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la pluie dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rad", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "zone " + pct(v) + " plus large", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la pluie revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      const dur = 2 * (1 + (w.dur || 0)), R = 130 * (1 + (w.rad || 0)), d = st.dmg * 1.6 * (1 + (w.dm || 0)), col = WEAPON_COLOR.particlerain, cx = tgt.x, cy = tgt.y;
      w.cd = slow(w, 6) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: cx, y: cy, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.07;
          const x = cx + rnd(-R, R), y = cy + rnd(-R, R);
          fx.push({ k: "bolt", color: col, pts: [[x, y - 300], [x, y]], life: 0.14, t: 0.14 });
          flashFx(x, y, col, 14);
          const rr = w.legend ? 55 : 26;
          if (w.legend) explodeFx(x, y, col, rr);
          enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) < rr + e.r) strike(e, d, 0, 0, "beam"); });
        } });
    },
  },
});

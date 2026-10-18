"use strict";

/* ---------- Nouvelles armes uniques : Chrome (des épées) et Rig (de gros rayons) ---------- */

// un gros rayon instantané depuis (ox, oy) : touche tout ce qui est sur la ligne
const thickBeam = (ox, oy, a, L, d, wid, color) => {
  const ca = Math.cos(a), sa = Math.sin(a);
  fx.push({ k: "beam", color, x: ox, y: oy, a, len: L, w: wid * 1.8, life: 0.3, t: 0.3 });
  enemies.forEach((e) => {
    const dx = e.x - ox, dy = e.y - oy, along = dx * ca + dy * sa;
    if (along < 0 || along > L) return;
    if (Math.abs(-dx * sa + dy * ca) < wid + e.r) strike(e, d, ca * 140, sa * 140, "beam");
  });
  spark(ox + ca * L * 0.4, oy + sa * L * 0.4, color, 6, 220);
};
// un coup d'épée en arc devant (a), qui touche tout ce qui est dans l'angle
const swordArc = (a, R, spread, d, kb, color, big) => {
  fx.push({ k: "arc", color, big, x: P.x, y: P.y, a, r: R, spread, life: 0.22, t: 0.22 });
  spark(P.x + Math.cos(a) * R * 0.8, P.y + Math.sin(a) * R * 0.8, color, 10, 240);
  enemies.forEach((e) => {
    const dx = e.x - P.x, dy = e.y - P.y, dist = Math.hypot(dx, dy) || 1;
    if (dist > R + e.r) return;
    let da = Math.atan2(dy, dx) - a;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) < spread) strike(e, d, (dx / dist) * kb, (dy / dist) * kb, "slash");
  });
};

Object.assign(WEAPONS, {
  // ----- Chrome : que des épées -----

  // Pluie d'épées : des lames tombent du ciel sur des ennemis
  rainswords: {
    char: "chrome",
    name: "Pluie d'épées",
    intro: "des épées tombent du ciel sur les ennemis",
    legendText: "chaque épée libère un arc tranchant autour d'elle",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "épée") + " par pluie", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des épées", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "zone d'impact " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la pluie revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 400 * rngMul());
      if (!cand.length) return;
      w.cd = slow(w, 4.5) * cdMul();
      const R = 46 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.rainswords;
      SFX.dash();
      for (let k = 0, n = 3 + (w.n || 0); k < n; k++) {
        const tg = cand[(Math.random() * cand.length) | 0];
        fx.push({ k: "sword", color: col, x: tg.x + rnd(-10, 10), y: tg.y, life: 1.5, t: 1.5,
          tick(f) {
            if (f.landed || f.life > 1.15) return;
            f.landed = true; // l'épée touche le sol
            const hit = (r, dm) => enemies.forEach((e) => {
              const dx = e.x - f.x, dy = e.y - f.y, dd = Math.hypot(dx, dy) || 1;
              if (e.hp > 0 && dd < r + e.r) strike(e, d * dm, (dx / dd) * 140, (dy / dd) * 140, "slash");
            });
            hit(R, 1);
            ringFx(f.x, f.y, col, R, 0.2);
            spark(f.x, f.y, col, 10, 230);
            if (w.legend) { hit(R * 1.7, 0.6); ringFx(f.x, f.y, "#ffffff", R * 1.7, 0.25); }
          } });
      }
    },
  },

  // Épée géante : un énorme coup de taille, lent, devant lui
  greatsword: {
    char: "chrome",
    name: "Épée géante",
    intro: "un énorme coup d'épée, lent et dévastateur, devant toi",
    legendText: "un second coup part dans ton dos",
    cd0: 1,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'épée", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée de l'épée +" + pct(v), apply: bump("rad") },
      { id: "arc", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "coup " + pct(v) + " plus large", apply: bump("arc") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "l'épée frappe " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 150 * (1 + (w.rad || 0)) * rngMul(), tgt = nearest(R + 40);
      if (!tgt) return;
      w.cd = slow(w, 3.4) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), d = st.dmg * 8 * (1 + (w.dm || 0)), spread = Math.min(3, 1.3 * (1 + (w.arc || 0)));
      P.aim = a;
      SFX.bomb();
      shake = Math.max(shake, 5);
      swordArc(a, R, spread, d, 320, WEAPON_COLOR.greatsword, 2.2);
      if (w.legend) swordArc(a + Math.PI, R, spread, d, 320, WEAPON_COLOR.greatsword, 2.2);
    },
  },

  // Riposte : quand il est touché, un cercle de coups d'épée part tout autour
  riposte: {
    char: "chrome",
    name: "Riposte",
    intro: "quand tu es touché, un cercle de coups d'épée part tout autour de toi",
    legendText: "la riposte se déclenche deux fois",
    cd0: 0,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la riposte", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "riposte " + pct(v) + " plus large", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la riposte se recharge " + pct(v) + " plus vite", apply: bump("rate") },
      { id: "drain", max: 99, vals: [1, 2, 4], text: (v) => "rend " + v + " PV par ennemi touché (5 au plus)", apply: bump("drain") },
    ],
    update(w, dt) { w.cd -= dt; },
    onHurt(w) {
      if (w.cd > 0) return;
      w.cd = slow(w, 1.4);
      const R = 110 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.riposte;
      const go = () => {
        fx.push({ k: "arc", color: col, big: 1.6, x: P.x, y: P.y, a: 0, r: R, spread: Math.PI, life: 0.2, t: 0.2 });
        spark(P.x, P.y, col, 16, 260);
        SFX.dash();
        let hits = 0;
        enemies.forEach((e) => {
          const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
          if (e.hp > 0 && dd < R + e.r) { strike(e, d, (dx / dd) * 260, (dy / dd) * 260, "slash"); hits++; }
        });
        if (w.drain) P.hp = Math.min(st.maxHp, P.hp + w.drain * Math.min(hits, 5));
      };
      go();
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.25, t: 0.25, onEnd: go });
    },
  },

  // ----- Rig : de gros rayons -----

  // Canon à particules : un faisceau épais tenu sur un ennemi quelques secondes
  cannon: {
    char: "rig",
    name: "Canon à particules",
    intro: "un faisceau épais est tenu sur un ennemi pendant quelques secondes",
    legendText: "le faisceau est bien plus large",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du faisceau", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le faisceau dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "faisceau " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le canon se recharge " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.2, tgt = nearest(L);
      if (!tgt) return;
      const dur = 2 * (1 + (w.dur || 0)), d = st.dmg * 0.9 * (1 + (w.dm || 0)), wid = 9 * (1 + (w.wid || 0)) * (w.legend ? 1.8 : 1), col = WEAPON_COLOR.cannon;
      w.cd = slow(w, 6) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "cbeam", color: col, x: P.x, y: P.y, a: Math.atan2(tgt.y - P.y, tgt.x - P.x), len: L, w: wid, life: dur, t: dur, cd: 0,
        tick(f, h) {
          const tg = nearest(L);
          if (tg) { // le faisceau suit l'ennemi le plus proche
            let da = Math.atan2(tg.y - P.y, tg.x - P.x) - f.a;
            da = Math.atan2(Math.sin(da), Math.cos(da));
            f.a += clamp(da, -4 * h, 4 * h);
          }
          f.x = P.x;
          f.y = P.y;
          P.aim = f.a;
          P.muzzle = 0.06;
          const ca = Math.cos(f.a), sa = Math.sin(f.a);
          spark(P.x + ca * (30 + Math.random() * L), P.y + sa * (30 + Math.random() * L), col, 1, 140);
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.1;
          enemies.forEach((e) => {
            const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
            if (e.hp > 0 && along > 0 && along < L && Math.abs(-dx * sa + dy * ca) < wid + e.r) strike(e, d, ca * 30, sa * 30, "beam");
          });
        } });
    },
  },

  // Salve de rayons : plusieurs gros rayons en éventail
  raysalvo: {
    char: "rig",
    name: "Salve de rayons",
    intro: "trois gros rayons partent en éventail",
    legendText: "une seconde salve suit",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "rayon") + " par salve", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des rayons", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "rayons " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la salve revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.1, tgt = nearest(L);
      if (!tgt) return;
      w.cd = slow(w, 4.5) * cdMul();
      const base = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 3 + (w.n || 0), d = st.dmg * 4 * (1 + (w.dm || 0)), wid = 8 * (1 + (w.wid || 0));
      P.aim = base;
      const salvo = () => {
        SFX.bomb();
        for (let k = 0; k < n; k++) thickBeam(P.x, P.y, base + (k - (n - 1) / 2) * 0.32, L, d, wid, WEAPON_COLOR.raysalvo);
      };
      salvo();
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.3, t: 0.3, onEnd: salvo });
    },
  },

  // Surcharge : il charge, puis de gros rayons partent dans toutes les directions
  overload: {
    char: "rig",
    name: "Surcharge",
    intro: "il charge un instant, puis 8 gros rayons partent dans toutes les directions",
    legendText: "deux fois plus de rayons",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "rayon") + " par surcharge", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la surcharge", apply: bump("dm") },
      { id: "len", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "rayons " + pct(v) + " plus longs", apply: bump("len") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la surcharge revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(300)) return;
      w.cd = slow(w, 8) * cdMul();
      const col = WEAPON_COLOR.overload, n = (8 + 2 * (w.n || 0)) * (w.legend ? 2 : 1), L = 260 * (1 + (w.len || 0)), d = st.dmg * 6 * (1 + (w.dm || 0));
      SFX.wave();
      fx.push({ k: "flash", x: P.x, y: P.y, life: 0.9, t: 0.9,
        tick() { chargeFx(P.x, P.y, col); chargeFx(P.x, P.y, col); },
        onEnd() {
          SFX.bomb();
          shake = Math.max(shake, 7);
          const off = rnd(0, 6.283);
          for (let k = 0; k < n; k++) thickBeam(P.x, P.y, off + (k / n) * 6.283, L, d, 10, col);
          ringFx(P.x, P.y, col, 60, 0.3);
          flashFx(P.x, P.y, col, 40);
        } });
    },
  },
});

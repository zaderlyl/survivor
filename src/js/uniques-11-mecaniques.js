"use strict";

/* ---------- Dix armes à mécanique nouvelle : défense, déplacement, combos, contrôle de foule ---------- */

// un ennemi chargé électrise ses voisins ; à sa mort, en légendaire, la charge saute à un autre
const chargeZap = (e) => {
  const c = e.charge, col = WEAPON_COLOR.livingbattery;
  enemies.filter((o) => o !== e && o.hp > 0 && Math.hypot(o.x - e.x, o.y - e.y) < 100).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y)).slice(0, c.n)
    .forEach((o) => { strike(o, c.d, 0, 0, "storm"); fx.push({ k: "bolt", color: col, pts: [[e.x, e.y], [o.x, o.y]], life: 0.12, t: 0.12 }); flashFx(o.x, o.y, col, 10); });
};
const chargeTransfer = (e) => {
  const nx = enemies.filter((o) => o !== e && o.hp > 0 && !o.charge && Math.hypot(o.x - e.x, o.y - e.y) < 260).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
  if (!nx) return;
  nx.charge = { t: e.charge.t, c: 0.3, d: e.charge.d, n: e.charge.n, legend: true };
  fx.push({ k: "bolt", color: WEAPON_COLOR.livingbattery, pts: [[e.x, e.y], [nx.x, nx.y]], life: 0.2, t: 0.2 });
};
// un point est-il touché par du feu ou une explosion ? (la poudre noire s'y enflamme)
const fireNear = (x, y, r) => {
  for (let i = 0; i < enemies.length; i++) { const e = enemies[i]; if (e.hp > 0 && e.burn > 0 && Math.hypot(e.x - x, e.y - y) < r + e.r) return true; }
  for (let i = 0; i < fx.length; i++) { const f = fx[i]; if (f.k === "cloud" && (f.color === "#ff6a1f" || f.color === "#ff5a2e" || f.color === "#ff8a1f") && Math.hypot(f.x - x, f.y - y) < (f.R || 30) + r) return true; }
  for (let i = 0; i < recentBooms.length; i++) { const b = recentBooms[i]; if (Math.hypot(b.x - x, b.y - y) < b.r + r) return true; }
  return false;
};

Object.assign(WEAPONS, {
  // ===== Volt =====

  // Téléchargement : aspire l'énergie des ennemis proches pour accélérer toutes tes armes
  download: {
    char: "volt",
    name: "Téléchargement",
    intro: "aspire l'énergie des ennemis proches pour accélérer toutes tes armes",
    legendText: "chaque ennemi vaincu prolonge l'effet",
    cd0: 2,
    variants: [
      { id: "haste", max: 99, vals: [0.08, 0.15, 0.25], text: (v) => "accélère jusqu'à +" + pct(v) + " de plus", apply: bump("haste") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'aspiration", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(220)) return;
      const R = 200 * (1 + (w.rad || 0)) * rngMul(), d = st.dmg * 0.8 * (1 + (w.dm || 0)), col = WEAPON_COLOR.download, cap = 0.6 + (w.haste || 0);
      w.cd = slow(w, 9) * cdMul() + 3;
      SFX.wave();
      st.hasteExt = w.legend ? 0.5 : 0;
      fx.push({ k: "flash", x: P.x, y: P.y, life: 3, t: 3, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.3;
          enemies.forEach((e) => {
            if (e.hp <= 0 || Math.hypot(e.x - P.x, e.y - P.y) >= R + e.r) return;
            strike(e, d, 0, 0, "bolt");
            fx.push({ k: "bolt", color: col, pts: [[e.x, e.y], [P.x, P.y]], life: 0.12, t: 0.12 });
            st.hasteV = Math.min(cap, (st.hasteT > 0 ? st.hasteV : 0) + 0.04); // chaque ennemi aspiré accélère
            st.hasteT = 4;
          });
        } });
    },
  },

  // ===== Chrome =====

  // Garde parfaite : elle réduit les dégâts reçus, puis riposte après quelques impacts
  perfectguard: {
    char: "chrome",
    name: "Garde parfaite",
    intro: "réduit les dégâts que tu reçois ; après quelques impacts, une riposte circulaire part tout autour",
    legendText: "la riposte te rend de la vie",
    cd0: 0,
    variants: [
      { id: "red", max: 99, vals: [0.05, 0.1, 0.18], text: (v) => "réduit les dégâts de " + pct(v) + " de plus", apply: bump("red") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la riposte", apply: bump("dm") },
      { id: "need", max: 99, vals: [1, 1, 1], text: () => "la riposte part un impact plus tôt", apply: bump("need") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "riposte " + pct(v) + " plus large", apply: bump("rad") },
    ],
    update() {},
    // les réductions se multiplient : jamais d'invulnérabilité
    reduce(w) { return 0.85 * Math.exp(-1.2 * (w.red || 0)); },
    onHurt(w) {
      w.hits = (w.hits || 0) + 1;
      if (w.hits < 4 - (w.need || 0)) return;
      w.hits = 0;
      const R = 120 * (1 + (w.rad || 0)), d = st.dmg * 6 * (1 + (w.dm || 0)), col = WEAPON_COLOR.perfectguard;
      fx.push({ k: "arc", color: col, big: 1.8, x: P.x, y: P.y, a: 0, r: R, spread: Math.PI, life: 0.22, t: 0.22 });
      spark(P.x, P.y, col, 18, 280);
      SFX.dash();
      let hits = 0;
      enemies.forEach((e) => {
        const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
        if (e.hp > 0 && dd < R + e.r) { strike(e, d, (dx / dd) * 260, (dy / dd) * 260, "slash"); hits++; }
      });
      if (w.legend && hits) P.hp = Math.min(st.maxHp, P.hp + st.maxHp * 0.05);
    },
  },

  // ===== Zap =====

  // Électro-bouclier : une barrière électrique absorbe des attaques et électrocute les assaillants
  elecshield: {
    char: "zap",
    name: "Électro-bouclier",
    intro: "une barrière électrique absorbe une partie des attaques et électrocute les assaillants",
    legendText: "elle libère une décharge quand elle disparaît",
    cd0: 0,
    variants: [
      { id: "cap", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "absorbe " + pct(v) + " de plus", apply: bump("cap") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la décharge", apply: bump("dm") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "électrocute +" + plural(v, "ennemi"), apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "se recharge " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cap = 30 * (1 + (w.cap2 || 0));
      if (w.sh === undefined) w.sh = w.cap;
      if (w.sh <= 0) { w.rc = (w.rc === undefined ? slow(w, 7) : w.rc) - dt; if (w.rc <= 0) { w.sh = w.cap; w.rc = undefined; } } // il se recharge quand il est tombé
    },
    absorb(w, dmg) {
      if (!(w.sh > 0)) return dmg;
      const take = Math.min(w.sh, dmg), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.elecshield;
      w.sh -= take;
      zapAround(P.x, P.y, 170, 2 + (w.n || 0), d, col);
      ringFx(P.x, P.y, col, 40, 0.2);
      if (w.sh <= 0 && w.legend) { boom(P.x, P.y, 110, d * 2, col); zapAround(P.x, P.y, 260, 6, d, col); }
      return dmg - take;
    },
  },

  // Batterie vivante : un ennemi devient chargé et électrise ceux qui l'approchent
  livingbattery: {
    char: "zap",
    name: "Batterie vivante",
    intro: "charge un ennemi : il électrise tous ceux qui l'approchent pendant quelques secondes",
    legendText: "la charge saute à un nouvel ennemi quand il est vaincu",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la charge", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la charge dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "électrise +" + plural(v, "ennemi") + " à la fois", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && !e.charge && Math.hypot(e.x - P.x, e.y - P.y) < st.range).sort((a, b) => b.hp - a.hp);
      if (cand.length < 2) return;
      w.cd = slow(w, 7) * cdMul();
      const e = cand[0];
      e.charge = { t: 6 * (1 + (w.dur || 0)), c: 0.2, d: st.dmg * 1.8 * (1 + (w.dm || 0)), n: 2 + (w.n || 0), legend: !!w.legend };
      SFX.wave();
      ringFx(e.x, e.y, WEAPON_COLOR.livingbattery, 40, 0.3);
      fx.push({ k: "bolt", color: WEAPON_COLOR.livingbattery, pts: [[P.x, P.y], [e.x, e.y]], life: 0.2, t: 0.2 });
    },
  },

  // ===== Ghost =====

  // Lames cachées : des lames jaillissent autour de toi quand tu fais un dash
  hiddenblades: {
    char: "ghost",
    name: "Lames cachées",
    intro: "des lames jaillissent autour de toi chaque fois que tu fais un dash (Espace)",
    legendText: "chaque dash laisse une lame plantée au sol qui blesse",
    cd0: 0,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lames", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "lames " + pct(v) + " plus longues", apply: bump("rad") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "salve") + " de lames par dash", apply: bump("n") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "les lames plantées durent " + pct(v) + " plus longtemps", apply: bump("dur") },
    ],
    update() {},
    onDash(w) {
      const R = 100 * (1 + (w.rad || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.hiddenblades;
      const burst = () => {
        fx.push({ k: "arc", color: col, big: 1.3, x: P.x, y: P.y, a: 0, r: R, spread: Math.PI, life: 0.2, t: 0.2 });
        spark(P.x, P.y, col, 12, 260);
        enemies.forEach((e) => {
          const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
          if (e.hp > 0 && dd < R + e.r) strike(e, d, (dx / dd) * 200, (dy / dd) * 200, "slash");
        });
      };
      burst();
      for (let k = 1; k <= (w.n || 0); k++) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.2 * k, t: 0.1, onEnd: burst });
      if (w.legend) {
        const dur = 4 * (1 + (w.dur || 0)), sx = P.x, sy = P.y; // une lame reste plantée, et blesse
        fx.push({ k: "sword", color: col, landed: true, x: sx, y: sy, life: dur, t: dur, cd: 0,
          tick(f, h) { f.cd -= h; if (f.cd > 0) return; f.cd = 0.4; enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - sx, e.y - sy) < 36 + e.r) strike(e, d * 0.4, 0, 0, "slash"); }); } });
      }
    },
  },

  // Crochet de l'ombre : un grappin qui traverse les ennemis et te tire jusqu'au plus éloigné
  grapple: {
    char: "ghost",
    name: "Crochet de l'ombre",
    intro: "lance un grappin qui blesse tout sur son passage et te tire jusqu'à l'ennemi le plus éloigné",
    legendText: "le trajet laisse une ombre qui blesse",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du grappin", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée +" + pct(v), apply: bump("rng") },
      { id: "stun", max: 99, vals: [0.3, 0.6, 1], text: (v) => "étourdit à l'arrivée " + pct(v) + " plus longtemps", apply: bump("stun") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 340 * (1 + (w.rng || 0)) * rngMul(), far = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < R).sort((a, b) => Math.hypot(b.x - P.x, b.y - P.y) - Math.hypot(a.x - P.x, a.y - P.y))[0];
      if (!far || Math.hypot(far.x - P.x, far.y - P.y) < 120) return;
      w.cd = slow(w, 6) * cdMul();
      const d = st.dmg * 4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.grapple, a = Math.atan2(far.y - P.y, far.x - P.x), L = Math.hypot(far.x - P.x, far.y - P.y), ca = Math.cos(a), sa = Math.sin(a);
      SFX.dash();
      thickBeam(P.x, P.y, a, L, d, 6, col); // le grappin blesse tout sur son passage
      for (let i = 0; i < L; i += 26) ghosts.push({ x: P.x + ca * i, y: P.y + sa * i, life: 0.3, face: ca >= 0 ? 1 : -1 });
      if (w.legend) for (let i = 1; i < 5; i++) { // une ombre blessante le long du trajet
        const sx = P.x + ca * L * (i / 5), sy = P.y + sa * L * (i / 5);
        fx.push({ k: "cloud", color: col, emb: col, x: sx, y: sy, R: 34, life: 2.5, t: 2.5, cd: 0,
          tick(f, h) { f.cd -= h; if (f.cd > 0) return; f.cd = 0.4; enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < f.R + e.r) strike(e, d * 0.25, 0, 0, "slash"); }); } });
      }
      P.x = clamp(far.x - ca * (far.r + 18), 20, ARENA_W - 20); // il est tiré jusqu'à l'ennemi
      P.y = clamp(far.y - sa * (far.r + 18), 20, ARENA_H - 20);
      P.inv = Math.max(P.inv, 0.35);
      P.aim = a;
      enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 70 + e.r) { e.frozen = (e.type === "boss" ? 0.3 : 0.8) * (1 + (w.stun || 0)); } });
      spark(P.x, P.y, col, 12, 240);
    },
  },

  // Silence radio : il étouffe les ennemis proches, qui cessent d'attaquer
  silence: {
    char: "ghost",
    name: "Silence radio",
    intro: "étouffe les ennemis proches : ils se figent et cessent d'attaquer un instant",
    legendText: "les ennemis étouffés subissent davantage de dégâts",
    cd0: 2,
    variants: [
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le silence dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts à l'impact", apply: bump("dm") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 180 * (1 + (w.rad || 0)) * rngMul(), cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < R + e.r);
      if (cand.length < 3) return;
      w.cd = slow(w, 8) * cdMul();
      const dur = 2.5 * (1 + (w.dur || 0)), d = st.dmg * 1.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.silence;
      SFX.wave();
      ringFx(P.x, P.y, col, R, 0.4);
      ringFx(P.x, P.y, "#ffffff", R * 0.6, 0.3);
      cand.forEach((e) => {
        e.frozen = e.type === "boss" ? dur * 0.3 : dur;
        if (w.legend) { e.vuln = dur; e.vuln2 = 1.5; }
        strike(e, d, 0, 0, "smoke");
      });
    },
  },

  // ===== Pulse =====

  // Poudre noire : une ligne de poudre qui explose au contact d'une flamme ou d'une explosion
  blackpowder: {
    char: "pulse",
    name: "Poudre noire",
    intro: "dépose une ligne de poudre qui explose au contact d'une flamme ou d'une explosion, même de tes autres armes",
    legendText: "l'explosion se propage le long de toute la ligne",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la poudre", apply: bump("dm") },
      { id: "len", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "ligne " + pct(v) + " plus longue", apply: bump("len") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "ligne") + " à la fois", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "dépose la poudre " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 6) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), L = 260 * (1 + (w.len || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.blackpowder;
      P.aim = a0;
      SFX.shoot();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const a = a0 + (k - (n - 1) / 2) * 0.5, pts = [];
        for (let i = 1; i * 22 <= L; i++) pts.push([P.x + Math.cos(a) * i * 22, P.y + Math.sin(a) * i * 22]);
        let lit = false;
        fx.push({ k: "powder", color: col, pts, life: 8, t: 8,
          tick(f) {
            if (lit) return;
            let at = -1;
            for (let i = 0; i < pts.length; i++) if (fireNear(pts[i][0], pts[i][1], 26)) { at = i; break; }
            if (at < 0) return;
            lit = true;
            f.life = 0.6; // la poudre est consumée
            pts.forEach((p, i) => {
              const dist = Math.abs(i - at);
              if (!w.legend && dist > 2) return; // sans le légendaire, seule la zone du contact explose
              const go = () => boom(p[0], p[1], 46, d, col);
              if (dist === 0) go(); else fx.push({ k: "flash", x: p[0], y: p[1], life: dist * 0.05, t: 0.1, onEnd: go });
            });
          } });
      }
    },
  },

  // ===== Rig =====

  // Rayon tracteur : un faisceau attire les ennemis vers toi, puis les repousse violemment
  tractor: {
    char: "rig",
    name: "Rayon tracteur",
    intro: "un faisceau attire les ennemis vers toi, puis les repousse violemment",
    legendText: "le faisceau les brûle pendant qu'il les attire",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la poussée", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "l'attraction dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "faisceau " + pct(v) + " plus large", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.1, tgt = nearest(L);
      if (!tgt) return;
      const dur = 2.2 * (1 + (w.dur || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), wid = 28 * (1 + (w.wid || 0)), col = WEAPON_COLOR.tractor, caught = new Set();
      w.cd = slow(w, 8) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "cbeam", color: col, x: P.x, y: P.y, a: Math.atan2(tgt.y - P.y, tgt.x - P.x), len: L, w: 9, life: dur, t: dur, cd: 0,
        tick(f, h) {
          const tg = nearest(L);
          if (tg) { let da = Math.atan2(tg.y - P.y, tg.x - P.x) - f.a; da = Math.atan2(Math.sin(da), Math.cos(da)); f.a += clamp(da, -3 * h, 3 * h); }
          f.x = P.x;
          f.y = P.y;
          P.aim = f.a;
          const ca = Math.cos(f.a), sa = Math.sin(f.a);
          f.cd -= h;
          const tick = f.cd <= 0;
          if (tick) f.cd = 0.15;
          enemies.forEach((e) => {
            const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa, dd = Math.hypot(dx, dy) || 1;
            if (e.hp <= 0 || along < 0 || along > L || Math.abs(-dx * sa + dy * ca) > wid + e.r) return;
            caught.add(e);
            const k = e.type === "boss" ? 0.15 : 1;
            e.kx -= (dx / dd) * 520 * h * k; // attirés vers toi
            e.ky -= (dy / dd) * 520 * h * k;
            if (tick && w.legend) strike(e, d * 0.3, 0, 0, "burn");
          });
          if (Math.random() < 0.5) spark(P.x + ca * rnd(30, L), P.y + sa * rnd(30, L), col, 1, 80);
        },
        onEnd() { // puis la poussée
          SFX.bomb();
          shake = Math.max(shake, 6);
          ringFx(P.x, P.y, col, 90, 0.3);
          caught.forEach((e) => {
            if (e.hp <= 0) return;
            const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1, k = e.type === "boss" ? 0.2 : 1;
            e.kx += (dx / dd) * 620 * k;
            e.ky += (dy / dd) * 620 * k;
            strike(e, d, 0, 0, "blast");
          });
        } });
    },
  },

  // ===== Arc =====

  // Tir fantôme : un laser traverse tout, puis revient vers toi
  ghostshot: {
    char: "arc",
    name: "Tir fantôme",
    intro: "un laser s'étire à travers les ennemis, puis revient vers toi en les traversant encore",
    legendText: "un second tir suit en diagonale",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du tir", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "laser " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.1 * (1 + (w.rng || 0)), tgt = nearest(L);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), d = st.dmg * 3 * (1 + (w.dm || 0)), wid = 7 * (1 + (w.wid || 0)), col = WEAPON_COLOR.ghostshot;
      P.aim = a0;
      SFX.wave();
      const shot = (a) => {
        const ca = Math.cos(a), sa = Math.sin(a);
        let head = 0, dir = 1, hit = new Set();
        fx.push({ k: "cbeam", color: col, x: P.x, y: P.y, a, len: 1, w: wid, life: 2 * L / 900, t: 2 * L / 900,
          tick(f, h) {
            const prev = head;
            head = clamp(head + dir * 900 * h, 0, L);
            if (dir === 1 && head >= L) { dir = -1; hit = new Set(); } // il revient
            f.x = P.x;
            f.y = P.y;
            f.len = Math.max(4, head);
            enemies.forEach((e) => {
              if (e.hp <= 0 || hit.has(e)) return;
              const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
              if (along >= Math.min(prev, head) - 10 && along <= Math.max(prev, head) + 10 && Math.abs(-dx * sa + dy * ca) < wid + e.r) { hit.add(e); strike(e, d, ca * 80 * dir, sa * 80 * dir, "beam"); }
            });
          } });
      };
      shot(a0);
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.25, t: 0.1, onEnd: () => shot(a0 + 0.6) });
    },
  },
});

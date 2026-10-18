"use strict";

/* ---------- Encore des armes uniques : Volt (hacker) et Ghost (infiltré) ---------- */

// ----- Volt -----

// une bombe logique qui explose, et se copie sur ses voisins
const lbombBlast = (e, lb) => {
  boom(e.x, e.y, lb.R, lb.d, WEAPON_COLOR.logicbomb);
  if (lb.gen >= lb.maxGen) return;
  enemies
    .filter((o) => o !== e && o.hp > 0 && !o.lbomb && Math.hypot(o.x - e.x, o.y - e.y) < 180)
    .sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))
    .slice(0, lb.n)
    .forEach((o) => {
      o.lbomb = { t: 1.5, R: lb.R, d: lb.d, gen: lb.gen + 1, maxGen: lb.maxGen, n: lb.n };
      fx.push({ k: "bolt", color: WEAPON_COLOR.logicbomb, pts: [[e.x, e.y], [o.x, o.y]], life: 0.2, t: 0.2 });
    });
};

// un ver de code : il rampe vers les ennemis et blesse tout ce qu'il touche
const spawnWorm = (w, x, y, a, life, canSplit) => {
  const col = WEAPON_COLOR.worm, d = st.dmg * 1.2 * (1 + (w.dm || 0));
  fx.push({ k: "worm", color: col, x, y, a, life, t: life, segs: [], ph: rnd(0, 6), hitAt: new Map(), split: false,
    tick(f, h) {
      const tg = nearest(400, f.x, f.y);
      if (tg) {
        let da = Math.atan2(tg.y - f.y, tg.x - f.x) - f.a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        f.a += clamp(da, -3 * h, 3 * h);
      }
      f.ph += h * 10;
      const aa = f.a + Math.sin(f.ph) * 0.5;
      f.x += Math.cos(aa) * 170 * h;
      f.y += Math.sin(aa) * 170 * h;
      f.segs.unshift([f.x, f.y]);
      if (f.segs.length > 14) f.segs.pop();
      enemies.forEach((e) => {
        if (e.hp <= 0 || (f.hitAt.get(e) || 0) > t) return;
        for (let i = 0; i < f.segs.length; i += 2) {
          if (Math.hypot(e.x - f.segs[i][0], e.y - f.segs[i][1]) < 10 + e.r) { strike(e, d, 0, 0, "bolt"); f.hitAt.set(e, t + 0.4); spark(e.x, e.y, col, 3, 120); break; }
        }
      });
      if (w.legend && canSplit && !f.split && f.life < f.t / 2) { // le ver se divise en deux
        f.split = true;
        spawnWorm(w, f.x, f.y, f.a + 0.7, f.life, false);
        spawnWorm(w, f.x, f.y, f.a - 0.7, f.life, false);
      }
    } });
};

// ----- Ghost -----

// le poison passe au voisin le plus proche
const poisonSpread = (e) => {
  const o = enemies.find((q) => q !== e && q.hp > 0 && !(q.poison > 0) && Math.hypot(q.x - e.x, q.y - e.y) < 70);
  if (o) { o.poison = 3; o.poisonT = 0.4; o.pd = e.pd; }
};

Object.assign(WEAPONS, {
  // ===== Volt =====

  // Bombe logique : explose après un délai, et se copie sur les voisins
  logicbomb: {
    char: "volt",
    name: "Bombe logique",
    intro: "une bombe explose après un délai, puis se copie sur les voisins",
    legendText: "la copie se copie encore une fois",
    cd0: 1,
    variants: [
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la bombe", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "n", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "copie") + " à chaque explosion", apply: bump("n") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "pose les bombes " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && !e.lbomb && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (!cand.length) return;
      w.cd = slow(w, 6) * cdMul();
      const e = cand[(Math.random() * cand.length) | 0];
      e.lbomb = { t: 2.5, R: 70 * (1 + (w.rad || 0)), d: st.dmg * 6 * (1 + (w.dm || 0)), gen: 0, maxGen: w.legend ? 2 : 1, n: 2 + (w.n || 0) };
      SFX.hit();
      fx.push({ k: "bolt", color: WEAPON_COLOR.logicbomb, pts: [[P.x, P.y], [e.x, e.y]], life: 0.2, t: 0.2 });
    },
  },

  // Ver : un serpent de code qui rampe et blesse tout sur sa trace
  worm: {
    char: "volt",
    name: "Ver",
    intro: "un serpent de code rampe vers les ennemis et blesse tout ce qu'il touche",
    legendText: "le ver se divise en deux à mi-parcours",
    cd0: 1,
    variants: [
      { id: "n", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "ver") + " lancé à la fois", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du ver", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "le ver vit " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "lance les vers " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 7) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), dur = 4 * (1 + (w.dur || 0));
      SFX.shoot();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) spawnWorm(w, P.x, P.y, a0 + (k - (n - 1) / 2) * 0.6, dur, true);
    },
  },

  // Déni de service : une zone où les ennemis ralentissent puis se figent
  ddos: {
    char: "volt",
    name: "Déni de service",
    intro: "une zone où les ennemis ralentissent, puis se figent",
    legendText: "la zone te suit",
    cd0: 1,
    variants: [
      { id: "rad", max: 6, vals: [0.2, 0.4, 0.7], text: (v) => "zone " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "la zone dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts dans la zone", apply: bump("dm") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "la zone revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (cand.length < 2) return;
      w.cd = slow(w, 8) * cdMul();
      const tg = cand[(Math.random() * cand.length) | 0], R = 110 * (1 + (w.rad || 0)), dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 0.4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.ddos;
      SFX.wave();
      fx.push({ k: "cloud", color: col, spk: col, x: tg.x, y: tg.y, R, life: dur, t: dur, cd: 0,
        tick(f, h) {
          if (w.legend) { f.x = P.x; f.y = P.y; }
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.3;
          enemies.forEach((e) => {
            if (e.hp <= 0 || Math.hypot(e.x - f.x, e.y - f.y) >= R + e.r) return;
            e.slowed = 0.5;
            e.dd = (e.dd || 0) + 0.3;
            if (e.dd >= 1.2) { e.dd = 0; e.frozen = e.type === "boss" ? 0.4 : 0.8; strike(e, d, 0, 0, "bolt"); }
          });
        } });
    },
  },

  // Rafale de pixels : une volée de minuscules tirs très rapides
  pixelburst: {
    char: "volt",
    name: "Rafale de pixels",
    intro: "une volée de minuscules tirs très rapides, dans un cône étroit",
    legendText: "les pixels traversent deux ennemis",
    cd0: 1,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v * 4, "pixel") + " par rafale", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des pixels", apply: bump("dm") },
      { id: "rng", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "la rafale revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 3) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 12 + 4 * (w.n || 0), d = st.dmg * 0.5 * (1 + (w.dm || 0));
      P.aim = a0;
      for (let k = 0; k < n; k++) {
        const shoot = () => fire(a0 + rnd(-0.12, 0.12), 620, 0.5 * (1 + (w.rng || 0)), { x: P.x, y: P.y, dmg: d, pierce: w.legend ? 2 : 0, size: 0.8, color: WEAPON_COLOR.pixelburst });
        if (k === 0) shoot(); else fx.push({ k: "flash", x: P.x, y: P.y, life: k * 0.03, t: 0.1, onEnd: shoot });
      }
    },
  },

  // Écran bleu : tous les ennemis de l'écran se figent un instant
  bsod: {
    char: "volt",
    name: "Écran bleu",
    intro: "tous les ennemis de l'écran se figent un instant",
    legendText: "le gel dure deux fois plus longtemps",
    cd0: 3,
    variants: [
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "le gel dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts à l'impact", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 420 * (1 + (w.rad || 0)), cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < R);
      if (cand.length < 4) return;
      w.cd = slow(w, 15) * cdMul();
      const dur = 1.5 * (1 + (w.dur || 0)) * (w.legend ? 2 : 1), d = st.dmg * 2 * (1 + (w.dm || 0));
      SFX.bomb();
      shake = Math.max(shake, 8);
      fx.push({ k: "screenflash", color: WEAPON_COLOR.bsod, life: 0.5, t: 0.5 });
      cand.forEach((e) => { e.frozen = e.type === "boss" ? dur * 0.4 : dur; strike(e, d, 0, 0, "bolt"); });
    },
  },

  // ===== Ghost =====

  // Dards empoisonnés : des fléchettes qui empoisonnent
  poisondarts: {
    char: "ghost",
    name: "Dards empoisonnés",
    intro: "un éventail de fléchettes qui empoisonnent les ennemis touchés",
    legendText: "le poison passe aux voisins",
    cd0: 1,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "dard") + " par volée", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du poison", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "poison " + pct(v) + " plus long", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "lance les dards " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 3) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 3 + (w.n || 0), pd = st.dmg * 0.4 * (1 + (w.dm || 0));
      P.aim = a0;
      SFX.shoot();
      for (let k = 0; k < n; k++) fire(a0 + (k - (n - 1) / 2) * 0.14, 520, st.range / 520, { dmg: st.dmg * 0.8 * (1 + (w.dm || 0)), poison: pd, pdur: 3 * (1 + (w.dur || 0)), pspread: !!w.legend, size: 1.1, color: WEAPON_COLOR.poisondarts });
    },
  },

  // Illusions : des clones qui attaquent à ta place
  illusions: {
    char: "ghost",
    name: "Illusions",
    intro: "des clones de toi attaquent les ennemis à ta place",
    legendText: "les clones explosent à la fin",
    cd0: 2,
    variants: [
      { id: "n", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "clone"), apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des clones", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "les clones durent " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "invoque les clones " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(300)) return;
      const dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 0.8 * (1 + (w.dm || 0)), col = WEAPON_COLOR.illusions, n = 2 + (w.n || 0);
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.wave();
      for (let k = 0; k < n; k++) {
        const oa = (k / n) * 6.283 + rnd(0, 1);
        fx.push({ k: "clone", color: col, x: P.x + Math.cos(oa) * 60, y: P.y + Math.sin(oa) * 60, oa, life: dur, t: dur, cd: 0.4,
          tick(f, h) {
            f.x += (P.x + Math.cos(f.oa) * 70 - f.x) * Math.min(1, 3 * h);
            f.y += (P.y + Math.sin(f.oa) * 70 - f.y) * Math.min(1, 3 * h);
            f.cd -= h;
            if (f.cd > 0) return;
            const tg = nearest(300 * rngMul(), f.x, f.y);
            if (!tg) return;
            f.cd = slow(w, 0.7) * cdMul();
            const a = Math.atan2(tg.y - f.y, tg.x - f.x);
            for (let j = 0; j < 3; j++) fire(a + (j - 1) * 0.15, 560, 0.5, { x: f.x, y: f.y, dmg: d, color: col });
            spark(f.x, f.y, col, 3, 100);
          },
          onEnd(f) { if (w.legend) boom(f.x, f.y, 70, st.dmg * 4, col); } });
      }
    },
  },

  // Piège à ours : des pièges au sol qui immobilisent
  beartrap: {
    char: "ghost",
    name: "Piège à ours",
    intro: "des pièges posés au sol immobilisent les ennemis qui marchent dessus",
    legendText: "le piège explose en refermant ses dents",
    cd0: 1,
    variants: [
      { id: "n", max: 5, vals: [1, 2, 3], text: (v) => "+" + plural(v, "piège") + " posé à la fois", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du piège", apply: bump("dm") },
      { id: "dur", max: 6, vals: [0.2, 0.4, 0.8], text: (v) => "immobilise " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "pose les pièges " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (!cand.length) return;
      w.cd = slow(w, 5) * cdMul();
      const d = st.dmg * 4 * (1 + (w.dm || 0)), stun = 2 * (1 + (w.dur || 0)), col = WEAPON_COLOR.beartrap;
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const e0 = cand[(Math.random() * cand.length) | 0];
        fx.push({ k: "trap", color: col, x: e0.x + rnd(-24, 24), y: e0.y + rnd(-24, 24), life: 12, t: 12, arm: 0.6,
          tick(f, h) {
            f.arm -= h;
            if (f.arm > 0) return;
            for (let i = 0; i < enemies.length; i++) {
              const e = enemies[i];
              if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < 16 + e.r) { f.hit = true; f.life = 0; return; }
            }
          },
          onEnd(f) {
            if (!f.hit) return;
            SFX.hit();
            spark(f.x, f.y, col, 10, 200);
            enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < 40 + e.r) { e.frozen = e.type === "boss" ? stun * 0.3 : stun; strike(e, d, 0, 0, "slash"); } });
            if (w.legend) boom(f.x, f.y, 70, d, col);
          } });
      }
    },
  },

  // Poignard lancé : un tir précis qui perce
  throwingdagger: {
    char: "ghost",
    name: "Poignard lancé",
    intro: "un poignard précis, rapide et très puissant, qui perce plusieurs ennemis",
    legendText: "les poignards traversent tout",
    cd0: 1,
    variants: [
      { id: "n", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "poignard") + " par lancer", apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des poignards", apply: bump("dm") },
      { id: "pierce", max: 5, vals: [1, 2, 3], text: (v) => "perce +" + plural(v, "ennemi"), apply: bump("pierce") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "lance " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 2) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 1 + (w.n || 0);
      P.aim = a0;
      SFX.shoot();
      for (let k = 0; k < n; k++) fire(a0 + (k - (n - 1) / 2) * 0.12, 760, st.range / 760, { dmg: st.dmg * 3 * (1 + (w.dm || 0)), pierce: 3 + (w.pierce || 0) + (w.legend ? 99 : 0), size: 1.2, color: WEAPON_COLOR.throwingdagger });
    },
  },

  // Ombre : un double sombre qui te suit et frappe autour de lui
  shadow: {
    char: "ghost",
    name: "Ombre",
    intro: "un double sombre te suit et frappe les ennemis qui l'approchent",
    legendText: "les ombres explosent quand tu es touché",
    cd0: 0,
    variants: [
      { id: "n", max: 4, vals: [1, 2, 3], text: (v) => "+" + plural(v, "ombre"), apply: bump("n") },
      { id: "dm", max: 6, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des ombres", apply: bump("dm") },
      { id: "rad", max: 6, vals: [0.15, 0.3, 0.5], text: (v) => "portée des ombres +" + pct(v), apply: bump("rad") },
      { id: "rate", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "les ombres frappent " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      const n = 1 + (w.n || 0), R = 70 * (1 + (w.rad || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.shadow;
      w.hcd = (w.hcd || 0) - dt;
      w.sh = w.sh || [];
      while (w.sh.length < n) w.sh.push({ cd: rnd(0.2, 0.6) });
      w.sh.forEach((s, i) => {
        const a = (i / n) * 6.283 + 2.4, tx = P.x + Math.cos(a) * 50, ty = P.y + Math.sin(a) * 50;
        if (s.x === undefined) { s.x = tx; s.y = ty; }
        s.x += (tx - s.x) * Math.min(1, 2 * dt);
        s.y += (ty - s.y) * Math.min(1, 2 * dt);
        s.cd -= dt;
        if (s.cd > 0) return;
        let any = false;
        enemies.forEach((e) => {
          const dx = e.x - s.x, dy = e.y - s.y, dd = Math.hypot(dx, dy) || 1;
          if (e.hp > 0 && dd < R + e.r) { strike(e, d, (dx / dd) * 140, (dy / dd) * 140, "slash"); any = true; }
        });
        s.cd = any ? slow(w, 0.6) * cdMul() : 0.15;
        if (any) { fx.push({ k: "arc", color: col, x: s.x, y: s.y, a: rnd(0, 6.283), r: R * 0.7, spread: 1.2, life: 0.15, t: 0.15 }); spark(s.x, s.y, col, 5, 160); }
      });
    },
    onHurt(w) {
      if (!w.legend || (w.hcd || 0) > 0 || !w.sh) return;
      w.hcd = 1.5;
      w.sh.forEach((s) => { if (s.x !== undefined) boom(s.x, s.y, 80, st.dmg * 5, WEAPON_COLOR.shadow); });
    },
  },
});

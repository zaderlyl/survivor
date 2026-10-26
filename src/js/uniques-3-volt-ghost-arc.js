"use strict";

/* ---------- Nouvelles armes uniques : Volt (hacker), Ghost (infiltré), Arc (lasers) ---------- */

// ----- Volt -----

// infecte un ennemi : il subit des dégâts dans le temps et contaminera les autres en mourant
const infect = (e, w) => {
  e.virus = 4 * (1 + (w.dur || 0));
  e.virusT = 0.3;
  e.vd = st.dmg * 0.6 * (1 + (w.dm || 0));
  e.vw = w;
  spark(e.x, e.y, WEAPON_COLOR.virus, 6, 160);
};
const virusSpread = (e) => {
  const w = e.vw;
  if (!w) return;
  const n = (2 + (w.n || 0)) * (w.legend ? 2 : 1), R = 160 * (w.legend ? 2 : 1);
  enemies
    .filter((o) => o !== e && o.hp > 0 && !(o.virus > 0) && Math.hypot(o.x - e.x, o.y - e.y) < R)
    .sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))
    .slice(0, n)
    .forEach((o) => {
      infect(o, w);
      fx.push({ k: "bolt", color: WEAPON_COLOR.virus, pts: [[e.x, e.y], [o.x, o.y]], life: 0.2, t: 0.2 });
    });
};

// ----- Ghost -----

// une marque qui détone : des dégâts de zone autour de l'ennemi marqué
const detonateMark = (e, mk, natural) => {
  boom(e.x, e.y, mk.R, mk.d, WEAPON_COLOR.mark);
  if (mk.spread) { // légendaire : la marque saute sur le plus proche
    const nx = enemies.filter((o) => o !== e && o.hp > 0 && !o.marked && Math.hypot(o.x - e.x, o.y - e.y) < 220).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
    if (nx) nx.marked = { t: mk.t0, t0: mk.t0, R: mk.R, d: mk.d, spread: true };
  }
};

// ----- Arc -----

// un rayon qui s'arrête au premier ennemi touché, puis se divise en plusieurs
const prismBeam = (ox, oy, a, L, d, wid, depth, nsplit) => {
  const ca = Math.cos(a), sa = Math.sin(a);
  let first = L, hit = null;
  enemies.forEach((e) => {
    const dx = e.x - ox, dy = e.y - oy, along = dx * ca + dy * sa;
    if (along > 0 && along < first && Math.abs(-dx * sa + dy * ca) < wid + e.r) { first = along; hit = e; }
  });
  thickBeam(ox, oy, a, first, d, wid, WEAPON_COLOR.prism);
  if (!hit || depth <= 0) return;
  const px = ox + ca * first, py = oy + sa * first;
  flashFx(px, py, WEAPON_COLOR.prism, 18);
  spark(px, py, WEAPON_COLOR.prism, 8, 220);
  for (let k = 0; k < nsplit; k++) prismBeam(px, py, a + (k - (nsplit - 1) / 2) * 0.45, L * 0.7, d * 0.8, wid * 0.8, depth - 1, 2);
};

Object.assign(WEAPONS, {
  // ===== Volt =====

  // Virus : infecte un ennemi, qui contamine les autres en mourant
  virus: {
    char: "volt",
    name: "Virus",
    intro: "infecte un ennemi : il souffre, et contamine les autres en mourant",
    legendText: "le virus se propage deux fois plus loin et à deux fois plus de cibles",
    cd0: 1,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du virus", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "infection " + pct(v) + " plus longue", apply: bump("dur") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "cible") + " contaminée à la mort", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "infecte " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && !(e.virus > 0) && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (!cand.length) return;
      w.cd = slow(w, 4.5) * cdMul();
      const tg = cand[(Math.random() * cand.length) | 0];
      SFX.hit();
      fx.push({ k: "bolt", color: WEAPON_COLOR.virus, pts: [[P.x, P.y], [tg.x, tg.y]], life: 0.2, t: 0.2 });
      infect(tg, w);
    },
  },

  // Pare-feu : une zone qui efface les tirs ennemis
  firewall: {
    char: "volt",
    name: "Pare-feu",
    intro: "une zone autour de toi efface les tirs ennemis et brûle ce qui y entre",
    legendText: "les tirs effacés sont renvoyés vers les ennemis",
    cd0: 1,
    variants: [
      { id: "rad", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "zone " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du pare-feu", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le pare-feu dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le pare-feu revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const dur = 4 * (1 + (w.dur || 0)), R = 90 * (1 + (w.rad || 0)), d = st.dmg * 0.4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.firewall;
      if (!enemies.length && !ebullets.length) return;
      w.cd = slow(w, 8) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "firewall", color: col, x: P.x, y: P.y, R, life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.x = P.x;
          f.y = P.y;
          for (let i = ebullets.length - 1; i >= 0; i--) {
            const b = ebullets[i];
            if (Math.hypot(b.x - f.x, b.y - f.y) >= R) continue;
            spark(b.x, b.y, col, 3, 130);
            if (w.legend) { // renvoyé vers l'ennemi le plus proche
              const tg = nearest(500, b.x, b.y);
              if (tg) fire(Math.atan2(tg.y - b.y, tg.x - b.x), 420, 0.9, { x: b.x, y: b.y, dmg: st.dmg * 0.8, color: col });
            }
            ebullets.splice(i, 1);
          }
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.4;
          enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < R + e.r) strike(e, d, 0, 0, "burn"); });
        } });
    },
  },

  // Piratage : un ennemi combat pour toi quelques secondes
  hack: {
    char: "volt",
    name: "Piratage",
    intro: "prend le contrôle d'un ennemi : il combat pour toi quelques secondes",
    legendText: "l'ennemi piraté explose à la fin",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "ennemi") + " piraté à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des pirates", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le piratage dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "pirate " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && e.type !== "boss" && !(e.hacked > 0) && Math.hypot(e.x - P.x, e.y - P.y) < st.range);
      if (cand.length < 2) return; // il faut une cible pour le pirate
      w.cd = slow(w, 9) * cdMul();
      SFX.wave();
      for (let k = 0, n = 1 + (w.n || 0); k < n && cand.length; k++) {
        const e = cand.splice((Math.random() * cand.length) | 0, 1)[0];
        e.hacked = 4 * (1 + (w.dur || 0));
        e.hdmg = st.dmg * 3 * (1 + (w.dm || 0));
        e.fire = 5;
        e.hk = 0;
        if (w.legend) e.hackEnd = (o) => boom(o.x, o.y, 70, st.dmg * 6, WEAPON_COLOR.hack);
        ringFx(e.x, e.y, WEAPON_COLOR.hack, 30, 0.3);
        spark(e.x, e.y, WEAPON_COLOR.hack, 10, 200);
        fx.push({ k: "bolt", color: WEAPON_COLOR.hack, pts: [[P.x, P.y], [e.x, e.y]], life: 0.25, t: 0.25 });
      }
    },
  },

  // ===== Ghost =====

  // Coup dans le dos : il apparaît derrière un ennemi et le poignarde
  backstab: {
    char: "ghost",
    name: "Coup dans le dos",
    intro: "il se glisse derrière un ennemi et le poignarde",
    legendText: "il enchaîne sur un second ennemi",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du coup", apply: bump("dm") },
      { id: "crit", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "+" + pct(v) + " de chances de critique", apply: bump("crit") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée du saut +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "frappe " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const stab = (excl) => {
        const tg = enemies.filter((e) => e.hp > 0 && e !== excl && Math.hypot(e.x - P.x, e.y - P.y) < 300 * (1 + (w.rng || 0)) * rngMul()).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
        if (!tg) return null;
        const dx = tg.x - P.x, dy = tg.y - P.y, dd = Math.hypot(dx, dy) || 1, ux = dx / dd, uy = dy / dd;
        for (let i = 0; i < dd; i += 24) ghosts.push({ x: P.x + ux * i, y: P.y + uy * i, life: 0.3, face: ux >= 0 ? 1 : -1 });
        P.x = clamp(tg.x + ux * (tg.r + 16), 20, ARENA_W - 20); // il atterrit dans le dos de l'ennemi
        P.y = clamp(tg.y + uy * (tg.r + 16), 20, ARENA_H - 20);
        P.inv = Math.max(P.inv, 0.3);
        P.aim = Math.atan2(uy, ux);
        const crit = Math.random() < 0.3 + (w.crit || 0), d = st.dmg * 7 * (1 + (w.dm || 0)) * (crit ? st.critMul : 1);
        damage(tg, d, crit, ux * 200, uy * 200, "slash");
        fx.push({ k: "arc", color: WEAPON_COLOR.backstab, x: P.x, y: P.y, a: P.aim + Math.PI, r: 34, spread: 0.9, life: 0.18, t: 0.18 });
        spark(tg.x, tg.y, WEAPON_COLOR.backstab, 10, 240);
        SFX.dash();
        return tg;
      };
      const first = stab(null);
      if (!first) return;
      w.cd = slow(w, 4) * cdMul();
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.3, t: 0.3, onEnd: () => stab(first) });
    },
  },

  // Bombe fumigène : un nuage qui ralentit et désoriente
  smokebomb: {
    char: "ghost",
    name: "Bombe fumigène",
    intro: "un nuage ralentit les ennemis et les désoriente",
    legendText: "le nuage explose à la fin",
    cd0: 1,
    variants: [
      { id: "rad", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "nuage " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le nuage dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du nuage", apply: bump("dm") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "lance les bombes " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 6.5) * cdMul();
      const R = 70 * (1 + (w.rad || 0)), dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 0.3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.smoke;
      SFX.shoot();
      P.aim = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      fx.push({ k: "cloud", color: col, emb: col, x: tgt.x, y: tgt.y, R, life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.3;
          enemies.forEach((e) => {
            if (e.hp <= 0 || Math.hypot(e.x - f.x, e.y - f.y) >= R + e.r) return;
            strike(e, d, 0, 0, "smoke");
            e.slowed = 0.5;
            e.blind = 0.4;
            e.ba = rnd(0, 6.283); // une direction au hasard : il ne sait plus où aller
          });
        },
        onEnd(f) { if (w.legend) boom(f.x, f.y, R * 1.4, st.dmg * 5, col); } });
    },
  },

  // Marque mortelle : un ennemi marqué subit plus de dégâts, puis explose
  deathmark: {
    char: "ghost",
    name: "Marque mortelle",
    intro: "marque l'ennemi le plus costaud : il subit plus de dégâts, puis explose",
    legendText: "la marque saute sur le voisin quand elle détone",
    cd0: 1,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'explosion", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosion " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "fast", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "détonation " + pct(v) + " plus rapide", apply: bump("fast") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "marque") + " à la fois", apply: bump("n") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && !e.marked && Math.hypot(e.x - P.x, e.y - P.y) < st.range).sort((a, b) => b.hp - a.hp);
      if (!cand.length) return;
      w.cd = slow(w, 6) * cdMul();
      const t0 = 3 * Math.exp(-1.15 * (w.fast || 0)), R = 70 * (1 + (w.rad || 0)), d = st.dmg * 10 * (1 + (w.dm || 0));
      SFX.hit();
      cand.slice(0, 1 + (w.n || 0)).forEach((e) => {
        e.marked = { t: t0, t0, R, d, spread: !!w.legend };
        ringFx(e.x, e.y, WEAPON_COLOR.mark, 36, 0.3);
      });
    },
  },

  // ===== Arc =====

  // Prisme : le laser se divise en plusieurs à l'impact
  prism: {
    char: "arc",
    name: "Prisme",
    intro: "un laser qui se divise en trois faisceaux au premier ennemi touché",
    legendText: "chaque faisceau se divise encore",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du prisme", apply: bump("dm") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "faisceau") + " à la division", apply: bump("n") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "faisceaux " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le prisme revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const L = st.range * 1.1, tgt = nearest(L);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x);
      P.aim = a;
      SFX.wave();
      prismBeam(P.x, P.y, a, L, st.dmg * 3 * (1 + (w.dm || 0)), 7 * (1 + (w.wid || 0)), w.legend ? 2 : 1, 3 + (w.n || 0));
    },
  },

  // Miroir : le laser rebondit d'un ennemi à l'autre
  mirror: {
    char: "arc",
    name: "Miroir",
    intro: "un laser qui rebondit d'un ennemi à l'autre",
    legendText: "quatre rebonds de plus",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du laser", apply: bump("dm") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "rebond"), apply: bump("n") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "laser " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le miroir revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range * 1.1);
      if (!tgt) return;
      w.cd = slow(w, 4.5) * cdMul();
      const bounces = 4 + (w.n || 0) + (w.legend ? 4 : 0), d = st.dmg * 3 * (1 + (w.dm || 0)), wid = 6 * (1 + (w.wid || 0)), done = new Set();
      let fromX = P.x, fromY = P.y, cur = tgt;
      SFX.wave();
      for (let j = 0; j < bounces && cur; j++) {
        thickBeam(fromX, fromY, Math.atan2(cur.y - fromY, cur.x - fromX), Math.hypot(cur.x - fromX, cur.y - fromY), d, wid, WEAPON_COLOR.mirror);
        flashFx(cur.x, cur.y, WEAPON_COLOR.mirror, 14);
        done.add(cur);
        fromX = cur.x;
        fromY = cur.y;
        let nx = null, nd = 260 * 260;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.hp <= 0 || done.has(e)) continue;
          const dx = e.x - fromX, dy = e.y - fromY, dd = dx * dx + dy * dy;
          if (dd < nd) { nd = dd; nx = e; }
        }
        cur = nx;
      }
    },
  },

  // Nova laser : un anneau de lumière qui s'étend autour de lui
  nova: {
    char: "arc",
    name: "Nova laser",
    intro: "un anneau de laser s'étend tout autour de toi",
    legendText: "un second anneau, plus grand, suit",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la nova", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "nova " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + v + (v > 1 ? " anneaux" : " anneau") + " à la suite", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la nova revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(200)) return;
      w.cd = slow(w, 6) * cdMul();
      const d = st.dmg * 4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.nova;
      const ring = (R, dm) => {
        SFX.wave();
        const hit = new Set();
        fx.push({ k: "nova", color: col, x: P.x, y: P.y, r: 1, life: 0.5, t: 0.5,
          tick(f) {
            f.x = P.x;
            f.y = P.y;
            f.r = R * (1 - f.life / f.t);
            enemies.forEach((e) => {
              const dx = e.x - f.x, dy = e.y - f.y, dd = Math.hypot(dx, dy) || 1;
              if (!hit.has(e) && e.hp > 0 && dd < f.r + e.r && dd > f.r - 36 - e.r) { hit.add(e); strike(e, d * dm, (dx / dd) * 180, (dy / dd) * 180, "beam"); }
            });
          } });
        flashFx(P.x, P.y, col, 30);
      };
      const R = 200 * (1 + (w.rad || 0));
      ring(R, 1);
      for (let k = 1; k <= (w.n || 0) + (w.legend ? 1 : 0); k++) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.3 * k, t: 0.1, onEnd: () => ring(R * (1 + 0.25 * k), 1 + 0.2 * k) });
    },
  },
});

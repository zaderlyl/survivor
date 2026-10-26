"use strict";

/* ---------- Les armes rares et légendaires : Volt, Ghost, Arc, Pulse, Zap ---------- */

// l'arme la plus puissante de chaque héros passe en rare
WEAPONS.bsod.tier = "rare";
WEAPONS.deathmark.tier = "rare";
WEAPONS.railorbital.tier = "rare";
WEAPONS.timebomb.tier = "rare";
WEAPONS.thunderclap.tier = "rare";

const onScreen = (e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 430;

// un petit projectile qui poursuit les ennemis : once = explose au premier contact, sinon frappe à intervalles
const chaser = (x, y, a, o) => {
  fx.push({ k: "orb2", color: o.color, spk: o.spk, sz: o.sz, x, y, vx: Math.cos(a) * o.sp, vy: Math.sin(a) * o.sp, life: o.life, t: o.life, hitAt: new Map(),
    tick(f, h) {
      const tg = nearest(600, f.x, f.y);
      if (tg) {
        const dx = tg.x - f.x, dy = tg.y - f.y, dd = Math.hypot(dx, dy) || 1;
        f.vx += ((dx / dd) * o.sp - f.vx) * Math.min(1, 4 * h);
        f.vy += ((dy / dd) * o.sp - f.vy) * Math.min(1, 4 * h);
      }
      f.x += f.vx * h;
      f.y += f.vy * h;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.hp <= 0 || Math.hypot(e.x - f.x, e.y - f.y) >= 12 + e.r) continue;
        if (o.once) { f.life = 0; o.onHit(f, e); return; }
        if ((f.hitAt.get(e) || 0) <= t) { f.hitAt.set(e, t + o.every); o.onHit(f, e); }
      }
    } });
};
// un robot de code : il explose au contact, et en légendaire en laisse trois plus petits
const spawnBot = (w, x, y, a, child) => {
  const R = 46 * (1 + (w.rad || 0)) * (child ? 0.6 : 1), d = st.dmg * 3 * (1 + (w.dm || 0)) * (child ? 0.5 : 1), col = WEAPON_COLOR.botnet;
  chaser(x, y, a, { color: col, spk: col, sz: child ? 3 : 4, sp: 260, life: child ? 2.5 : 5, once: true,
    onHit(f) { boom(f.x, f.y, R, d, col); if (w.legend && !child) for (let j = 0; j < 3; j++) spawnBot(w, f.x, f.y, rnd(0, 6.283), true); } });
};
// la rançon d'un ennemi chiffré : il perd une part de sa vie
const ransomPay = (e, rs) => {
  damage(e, e.max * rs.pc, true, 0, 0, "hack");
  spark(e.x, e.y, WEAPON_COLOR.ransom, 8, 220);
  if (rs.legend && e.hp <= 0) boom(e.x, e.y, 60, st.dmg * 3, WEAPON_COLOR.ransom);
};
// reviens au point de sauvegarde : un retour, de la vie en plus
const restoreTo = (w, f) => {
  if (f.done) return;
  f.done = true;
  const col = WEAPON_COLOR.restorepoint, d = st.dmg * 6 * (1 + (w.dm || 0)), R = 90 * (1 + (w.rad || 0));
  boom(P.x, P.y, R, d, col);
  P.x = f.x;
  P.y = f.y;
  P.hp = Math.min(st.maxHp, P.hp + st.maxHp * (0.2 + (w.heal || 0)));
  boom(P.x, P.y, R, d, col);
  spark(P.x, P.y, col, 14, 260);
  P.inv = Math.max(P.inv, 0.5);
  w.mk = null;
  w.cd = slow(w, 20) * cdMul();
};
// un coup d'arme sur tout le segment d'une constellation
const segHit = (ax, ay, bx, by, d, wid) => {
  const vx = bx - ax, vy = by - ay, ll = vx * vx + vy * vy || 1;
  enemies.forEach((e) => {
    if (e.hp <= 0) return;
    const u = clamp(((e.x - ax) * vx + (e.y - ay) * vy) / ll, 0, 1);
    if (Math.hypot(e.x - (ax + vx * u), e.y - (ay + vy * u)) < wid + e.r) strike(e, d, 0, 0, "beam");
  });
};

Object.assign(WEAPONS, {
  // ===================== VOLT =====================

  // Botnet : une nuée de petits robots de code poursuit les ennemis
  botnet: {
    char: "volt", tier: "rare", name: "Botnet",
    intro: "une nuée de petits robots de code poursuit les ennemis et explose à leur contact",
    legendText: "chaque robot libère trois petits robots en explosant",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 3, "robot"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des robots", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la nuée revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(st.range)) return;
      w.cd = slow(w, 9) * cdMul();
      SFX.wave();
      for (let k = 0, n = 8 + 3 * (w.n || 0); k < n; k++) spawnBot(w, P.x, P.y, rnd(0, 6.283), false);
    },
  },

  // Rançongiciel : il chiffre les ennemis proches
  ransom: {
    char: "volt", tier: "rare", name: "Rançongiciel",
    intro: "chiffre les ennemis proches : ils se figent, puis perdent une part de leur vie",
    legendText: "ceux qui n'y survivent pas explosent",
    cd0: 3,
    variants: [
      { id: "pc", max: 99, vals: [0.08, 0.15, 0.25], text: (v) => "perdent +" + pct(v) + " de leur vie", apply: bump("pc") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "gel " + pct(v) + " plus long", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 220 * (1 + (w.rad || 0)) * rngMul(), cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < R);
      if (cand.length < 3) return;
      w.cd = slow(w, 10) * cdMul();
      const dur = 2.5 * (1 + (w.dur || 0)), pc = 0.3 + (w.pc || 0);
      SFX.wave();
      ringFx(P.x, P.y, WEAPON_COLOR.ransom, R, 0.4);
      flashFx(P.x, P.y, WEAPON_COLOR.ransom, 40);
      cand.forEach((e) => { e.frozen = e.type === "boss" ? dur * 0.3 : dur; e.ransom = { t: dur, pc: e.type === "boss" ? pc * 0.15 : pc, legend: !!w.legend }; });
    },
  },

  // Cascade de code : des colonnes de code tombent sur tout l'écran
  codecascade: {
    char: "volt", tier: "rare", name: "Cascade de code",
    intro: "des colonnes de code tombent sur tout l'écran pendant quelques secondes",
    legendText: "deux fois plus de colonnes",
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du code", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la cascade dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "colonne") + " à chaque salve", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || enemies.filter(onScreen).length < 3) return;
      const dur = 3 * (1 + (w.dur || 0)), d = st.dmg * 2.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.codecascade;
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.08;
          for (let k = 0, n = (1 + (w.n || 0)) * (w.legend ? 2 : 1); k < n; k++) {
            const hit = new Set();
            fx.push({ k: "codecol", color: col, x: P.x + rnd(-420, 420), y: P.y - 340, life: 1.5, t: 1.5,
              tick(c2, h2) {
                c2.y += 520 * h2;
                enemies.forEach((e) => {
                  if (e.hp <= 0 || hit.has(e) || Math.abs(e.x - c2.x) > 12 + e.r || e.y < c2.y - 90 || e.y > c2.y + 10) return;
                  hit.add(e);
                  strike(e, d, 0, 0, "bolt");
                });
              } });
          }
        } });
    },
  },

  // Point de restauration : il pose une sauvegarde, puis y revient en récupérant de la vie
  restorepoint: {
    char: "volt", tier: "rare", name: "Point de restauration",
    intro: "pose un point de sauvegarde : quelques secondes plus tard, tu y reviens et tu récupères de la vie",
    legendText: "se déclenche aussi tout seul quand tu tombes sous 20 % de vie",
    cd0: 3,
    variants: [
      { id: "heal", max: 99, vals: [0.08, 0.15, 0.25], text: (v) => "rend +" + pct(v) + " de ta vie", apply: bump("heal") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des explosions", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || w.mk || !nearest(300)) return;
      const o = { k: "tbomb", color: WEAPON_COLOR.restorepoint, x: P.x, y: P.y, R: 70, life: 4, t: 4, onEnd(f) { if (w.mk === f) restoreTo(w, f); } };
      fx.push(o);
      w.mk = o;
      SFX.wave();
    },
    onHurt(w) { if (w.legend && w.mk && !w.mk.done && P.hp < st.maxHp * 0.2) restoreTo(w, w.mk); },
  },

  // Kernel panic (légendaire) : l'écran plante, des ennemis sont supprimés d'un coup
  kernelpanic: {
    char: "volt", tier: "epic", name: "Kernel panic",
    intro: "pendant quelques secondes, l'écran plante : de nombreux ennemis sont supprimés d'un coup",
    legendText: "même les boss perdent une grosse part de leur vie",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.15, 0.3, 0.6], text: (v) => "supprime +" + pct(v) + " de leur vie", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le plantage dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "cible") + " par salve", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || enemies.filter(onScreen).length < 5) return;
      const dur = 4 * (1 + (w.dur || 0)), pc = 0.3 + (w.dm || 0), col = WEAPON_COLOR.kernelpanic;
      w.cd = slow(w, 16) * cdMul() + dur;
      SFX.boss();
      shake = Math.max(shake, 6);
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.25;
          fx.push({ k: "screenflash", color: col, life: 0.15, t: 0.15 });
          const cand = enemies.filter(onScreen).sort(() => Math.random() - 0.5).slice(0, 6 + 2 * (w.n || 0));
          cand.forEach((e) => {
            damage(e, e.max * (e.type === "boss" ? pc * (w.legend ? 0.3 : 0.08) : pc), true, 0, 0, "bolt");
            fx.push({ k: "bolt", color: col, pts: [[e.x - 18, e.y - 6], [e.x + 18, e.y - 6], [e.x - 14, e.y + 6], [e.x + 14, e.y + 6]], life: 0.15, t: 0.15 });
            spark(e.x, e.y, col, 5, 200);
          });
        } });
    },
  },

  // Intelligence artificielle (légendaire) : une IA géante tire sur plusieurs ennemis à la fois
  aiassistant: {
    char: "volt", tier: "epic", name: "Intelligence artificielle",
    intro: "une IA géante flotte au-dessus de toi et tire des lasers sur plusieurs ennemis à la fois",
    legendText: "elle tire sur deux fois plus de cibles",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'IA", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "l'IA reste " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "cible") + " visée à la fois", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(320)) return;
      const dur = 10 * (1 + (w.dur || 0)), d = st.dmg * 2.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.aiassistant;
      w.cd = slow(w, 20) * cdMul() + dur;
      SFX.boss();
      fx.push({ k: "aiface", color: col, x: P.x, y: P.y - 70, life: dur, t: dur, cd: 0.3,
        tick(f, h) {
          f.x += (P.x - f.x) * Math.min(1, 3 * h);
          f.y += (P.y - 70 - f.y) * Math.min(1, 3 * h);
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = slow(w, 0.3) * cdMul();
          enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < 340).sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))
            .slice(0, (3 + (w.n || 0)) * (w.legend ? 2 : 1))
            .forEach((e) => thickBeam(f.x, f.y, Math.atan2(e.y - f.y, e.x - f.x), Math.hypot(e.x - f.x, e.y - f.y) + 30, d, 5, col));
        } });
    },
  },

  // ===================== GHOST =====================

  // Frappe de l'ombre : des coups fantômes tombent sur plusieurs ennemis, à la chaîne
  shadowflurry: {
    char: "ghost", tier: "rare", name: "Frappe de l'ombre",
    intro: "des coups fantômes tombent à la chaîne sur plusieurs ennemis de l'écran",
    legendText: "chaque coup frappe deux fois",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "coup") + " par rafale", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des coups", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la rafale revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 360 * (1 + (w.rng || 0)) * rngMul(), cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < R);
      if (cand.length < 2) return;
      w.cd = slow(w, 8) * cdMul();
      const n = 5 + 2 * (w.n || 0), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.shadowflurry;
      SFX.dash();
      for (let k = 0; k < n; k++) {
        const e = cand[(Math.random() * cand.length) | 0];
        const cut = () => {
          if (e.hp <= 0) return;
          fx.push({ k: "arc", color: col, big: 1.4, x: e.x, y: e.y, a: rnd(0, 6.283), r: 34, spread: 1.1, life: 0.18, t: 0.18 });
          ghosts.push({ x: e.x, y: e.y, life: 0.3, face: 1 });
          strike(e, d, 0, 0, "slash");
          spark(e.x, e.y, col, 6, 220);
        };
        if (k === 0) cut(); else fx.push({ k: "flash", x: e.x, y: e.y, life: k * 0.1, t: 0.1, onEnd: cut });
        if (w.legend) fx.push({ k: "flash", x: e.x, y: e.y, life: k * 0.1 + 0.15, t: 0.1, onEnd: cut });
      }
    },
  },

  // Brume mortelle : une brume géante empoisonne et ralentit tout autour de lui
  deadmist: {
    char: "ghost", tier: "rare", name: "Brume mortelle",
    intro: "une brume géante te suit : elle empoisonne et ralentit tout ce qu'elle touche",
    legendText: "les ennemis dans la brume sont aveuglés",
    cd0: 3,
    variants: [
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "brume " + pct(v) + " plus large", apply: bump("rad") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du poison", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la brume dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la brume revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const R = 200 * (1 + (w.rad || 0)), dur = 6 * (1 + (w.dur || 0)), d = st.dmg * 0.8 * (1 + (w.dm || 0)), col = WEAPON_COLOR.deadmist;
      w.cd = slow(w, 12) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "cloud", color: col, emb: col, x: P.x, y: P.y, R, life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.x = P.x;
          f.y = P.y;
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.4;
          enemies.forEach((e) => {
            if (e.hp <= 0 || Math.hypot(e.x - f.x, e.y - f.y) >= R + e.r) return;
            strike(e, d, 0, 0, "poison");
            e.poison = 3;
            e.poisonT = 0.4;
            e.pd = d * 0.5;
            e.slowed = 0.5;
            if (w.legend) { e.blind = 0.5; e.ba = rnd(0, 6.283); }
          });
        } });
    },
  },

  // Meute spectrale : des loups fantômes poursuivent et mordent les ennemis
  wolfpack: {
    char: "ghost", tier: "rare", name: "Meute spectrale",
    intro: "des loups fantômes poursuivent les ennemis et les mordent à répétition",
    legendText: "la meute est deux fois plus nombreuse",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "loup"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des morsures", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la meute reste " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la meute revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(st.range)) return;
      const dur = 5 * (1 + (w.dur || 0)), d = st.dmg * 2.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.wolfpack;
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.dash();
      for (let k = 0, n = (4 + (w.n || 0)) * (w.legend ? 2 : 1); k < n; k++) {
        chaser(P.x, P.y, rnd(0, 6.283), { color: col, spk: col, sz: 7, sp: 300, life: dur, once: false, every: 0.3,
          onHit(f, e) { strike(e, d, 0, 0, "slash"); spark(e.x, e.y, col, 4, 180); } });
      }
    },
  },

  // Cimetière : des pierres tombales se dressent et envoient des crânes à la poursuite des ennemis
  graveyard: {
    char: "ghost", tier: "rare", name: "Cimetière",
    intro: "des pierres tombales se dressent autour de toi et envoient des crânes à la poursuite des ennemis",
    legendText: "les tombes explosent à la fin",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "tombe"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des crânes", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le cimetière dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "les crânes partent " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      const dur = 8 * (1 + (w.dur || 0)), d = st.dmg * 1.8 * (1 + (w.dm || 0)), col = WEAPON_COLOR.graveyard, n = 5 + (w.n || 0);
      w.cd = slow(w, 12) * cdMul() + dur;
      SFX.wave();
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 6.283;
        fx.push({ k: "tomb", color: col, x: P.x + Math.cos(a) * 95, y: P.y + Math.sin(a) * 95, life: dur, t: dur, cd: rnd(0.2, 0.9),
          tick(f, h) {
            f.cd -= h;
            if (f.cd > 0) return;
            const tg = nearest(360, f.x, f.y);
            if (!tg) return;
            f.cd = slow(w, 0.9) * cdMul();
            fire(Math.atan2(tg.y - f.y, tg.x - f.x), 330, 1.6, { x: f.x, y: f.y, dmg: d, home: true, pierce: 1, size: 1.3, color: col });
            spark(f.x, f.y - 8, col, 3, 90);
          },
          onEnd(f) { if (w.legend) boom(f.x, f.y, 60, st.dmg * 4, col); } });
      }
    },
  },

  // Faucheuse (légendaire) : une faux géante balaie un grand cercle et exécute les ennemis affaiblis
  reaper: {
    char: "ghost", tier: "epic", name: "Faucheuse",
    intro: "une faux géante balaie un grand cercle autour de toi et exécute les ennemis affaiblis",
    legendText: "un troisième coup de faux suit",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la faux", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "faux " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "thr", max: 99, vals: [0.08, 0.15, 0.25], text: (v) => "exécute jusqu'à +" + pct(v) + " de leur vie", apply: bump("thr") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la faux revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const R = 240 * (1 + (w.rad || 0)) * rngMul(), tgt = nearest(R + 60);
      if (!tgt) return;
      w.cd = slow(w, 14) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), d = st.dmg * 10 * (1 + (w.dm || 0)), thr = 0.4 + (w.thr || 0), col = WEAPON_COLOR.reaper;
      P.aim = a0;
      const sweep = (a) => {
        SFX.boss();
        shake = Math.max(shake, 8);
        fx.push({ k: "arc", color: col, big: 3, x: P.x, y: P.y, a, r: R, spread: 2.4, life: 0.3, t: 0.3 });
        spark(P.x + Math.cos(a) * R * 0.8, P.y + Math.sin(a) * R * 0.8, col, 14, 280);
        enemies.forEach((e) => {
          const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
          if (e.hp <= 0 || dd > R + e.r) return;
          let da = Math.atan2(dy, dx) - a;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) >= 2.4) return;
          if (e.type !== "boss" && e.hp < e.max * thr) damage(e, e.hp + 1, true, 0, 0, "slash"); else strike(e, d, (dx / dd) * 260, (dy / dd) * 260, "slash");
        });
      };
      sweep(a0);
      fx.push({ k: "flash", x: P.x, y: P.y, life: 0.35, t: 0.1, onEnd: () => sweep(a0 + Math.PI) });
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.7, t: 0.1, onEnd: () => sweep(a0 + Math.PI / 2) });
    },
  },

  // Éclipse (légendaire) : l'écran s'assombrit, les ennemis perdent la tête et souffrent
  eclipse: {
    char: "ghost", tier: "epic", name: "Éclipse",
    intro: "l'écran s'assombrit : les ennemis perdent la tête, ralentissent et souffrent, et chaque coup te soigne un peu",
    legendText: "tu es invulnérable pendant l'éclipse",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'éclipse", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "l'éclipse dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "heal", max: 99, vals: [1, 2, 3], text: (v) => "rend +" + plural(v, "PV") + " par coup", apply: bump("heal") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "l'éclipse revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || enemies.filter(onScreen).length < 5) return;
      const dur = 5 * (1 + (w.dur || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.eclipse;
      w.cd = slow(w, 18) * cdMul() + dur;
      SFX.boss();
      fx.push({ k: "screendark", color: col, life: dur, t: dur });
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0, ba: 0,
        tick(f, h) {
          if (w.legend) P.inv = Math.max(P.inv, 0.2);
          f.ba -= h;
          const redirect = f.ba <= 0;
          if (redirect) f.ba = 0.5;
          enemies.forEach((e) => { if (!onScreen(e)) return; e.slowed = 0.5; e.blind = 0.4; if (redirect) e.ba = rnd(0, 6.283); });
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.3;
          let hits = 0;
          enemies.forEach((e) => { if (onScreen(e)) { strike(e, d, 0, 0, "smoke"); hits++; } });
          if (hits) P.hp = Math.min(st.maxHp, P.hp + (w.heal || 0) * Math.min(hits, 6) * 0.5);
        } });
    },
  },

  // ===================== ARC =====================

  // Constellation : des étoiles reliées par des lignes de lumière qui brûlent tout ce qu'elles touchent
  constellation: {
    char: "arc", tier: "rare", name: "Constellation",
    intro: "des étoiles reliées par des lignes de lumière apparaissent et blessent tout ce qu'elles touchent",
    legendText: "toutes les étoiles se relient entre elles",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "étoile"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lignes", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la constellation dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      const n = 5 + (w.n || 0), dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 1.4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.constellation;
      w.cd = slow(w, 9) * cdMul() + dur;
      SFX.wave();
      const pts = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + rnd(-0.2, 0.2), r = rnd(110, 170); pts.push([tgt.x + Math.cos(a) * r, tgt.y + Math.sin(a) * r]); }
      const lines = [];
      for (let i = 0; i < n; i++) lines.push([i, (i + 1) % n]);
      if (w.legend) for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (!(i === 0 && j === n - 1)) lines.push([i, j]);
      pts.forEach((p) => spark(p[0], p[1], col, 4, 120));
      fx.push({ k: "constellation", color: col, pts, lines, life: dur, t: dur, cd: 0,
        tick(f, h) {
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.2;
          lines.forEach((l) => segHit(pts[l[0]][0], pts[l[0]][1], pts[l[1]][0], pts[l[1]][1], d, 12));
        } });
    },
  },

  // Faisceau en spirale : des rayons qui s'allongent en tournant de plus en plus vite
  spiralbeam: {
    char: "arc", tier: "rare", name: "Faisceau en spirale",
    intro: "des rayons s'allongent en tournant de plus en plus vite autour de toi",
    legendText: "une seconde spirale tourne en sens inverse",
    legendStacks: true,
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "rayon"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des rayons", apply: bump("dm") },
      { id: "len", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "rayons " + pct(v) + " plus longs", apply: bump("len") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "reviennent " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const dur = 3, n = 3 + (w.n || 0), Lmax = 280 * (1 + (w.len || 0)), d = st.dmg * 2.2 * (1 + (w.dm || 0)), col = WEAPON_COLOR.spiralbeam;
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.wave();
      const spiral = (dir) => fx.push({ k: "multibeam", color: col, n, L: 20, r0: 0, bw: 9, ang: rnd(0, 6.283), life: dur, t: dur, cd: 0,
        tick(f, h) {
          const u = 1 - f.life / f.t;
          f.L = Lmax * Math.min(1, u * 1.6);
          f.ang += dir * (2 + 6 * u) * h;
          f.cd -= h;
          if (f.cd > 0) return;
          f.cd = 0.1;
          for (let b = 0; b < n; b++) {
            const a = f.ang + (b / n) * 6.283, ca = Math.cos(a), sa = Math.sin(a);
            spark(P.x + ca * f.L, P.y + sa * f.L, col, 1, 100);
            enemies.forEach((e) => { const dx = e.x - P.x, dy = e.y - P.y, al = dx * ca + dy * sa; if (e.hp > 0 && al > 0 && al < f.L && Math.abs(-dx * sa + dy * ca) < 14 + e.r) strike(e, d, ca * 40, sa * 40, "beam"); });
          }
        } });
      spiral(1);
      for (let k = 1; k <= lg(w); k++) spiral(k % 2 ? -1 : 1); // une spirale de plus à chaque reprise, en alternant les sens
    },
  },

  // Lasers chercheurs : des tirs rapides qui traversent tout et poursuivent les ennemis
  seekerlasers: {
    char: "arc", tier: "rare", name: "Lasers chercheurs",
    intro: "une volée de tirs rapides qui poursuivent les ennemis et en transpercent plusieurs",
    legendText: "ils restent deux fois plus longtemps",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "laser"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lasers", apply: bump("dm") },
      { id: "life", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "ils durent " + pct(v) + " plus longtemps", apply: bump("life") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la volée revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 8) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 5 + 2 * (w.n || 0), d = st.dmg * 2.5 * (1 + (w.dm || 0)), life = 2.2 * (1 + (w.life || 0)) * (w.legend ? 2 : 1);
      P.aim = a0;
      SFX.wave();
      for (let k = 0; k < n; k++) fire(a0 + (k - (n - 1) / 2) * 0.35, 500, life, { dmg: d, home: true, pierce: 99, size: 1.2, color: WEAPON_COLOR.seekerlasers });
    },
  },

  // Canon à ions : une charge, puis un seul tir gigantesque
  ioncannon: {
    char: "arc", tier: "rare", name: "Canon à ions",
    intro: "une longue charge, puis un seul tir gigantesque qui détruit tout sur sa ligne",
    legendText: "deux tirs successifs",
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du tir", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.25, 0.5, 1], text: (v) => "tir " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "fast", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "charge " + pct(v) + " plus rapide", apply: bump("fast") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le canon revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range * 1.2);
      if (!tgt) return;
      w.cd = slow(w, 9) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), d = st.dmg * 18 * (1 + (w.dm || 0)), wid = 40 * (1 + (w.wid || 0)), charge = 1.2 * (1 - Math.min(0.6, w.fast || 0)), col = WEAPON_COLOR.ioncannon;
      P.aim = a;
      SFX.wave();
      const fire1 = () => { SFX.boss(); shake = Math.max(shake, 10); thickBeam(P.x, P.y, a, 700, d, wid, col); flashFx(P.x + Math.cos(a) * 20, P.y + Math.sin(a) * 20, col, 40); };
      fx.push({ k: "tline", color: col, x1: P.x, y1: P.y, x2: P.x + Math.cos(a) * 700, y2: P.y + Math.sin(a) * 700, life: charge, t: charge,
        tick() { chargeFx(P.x + Math.cos(a) * 16, P.y + Math.sin(a) * 16, col); },
        onEnd() { fire1(); if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.4, t: 0.1, onEnd: fire1 }); } });
    },
  },

  // Soleil (légendaire) : un soleil grandit sur la cible et brûle tout, puis explose
  sun: {
    char: "arc", tier: "epic", name: "Soleil",
    intro: "un soleil grandit au-dessus d'un groupe d'ennemis, brûle tout, puis explose",
    legendText: "un second soleil apparaît sur un autre groupe",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du soleil", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "soleil " + pct(v) + " plus grand", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "il brille " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le soleil revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range * 1.2);
      if (cand.length < 3) return;
      w.cd = slow(w, 16) * cdMul();
      const R = 200 * (1 + (w.rad || 0)), dur = 3 * (1 + (w.dur || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.sun;
      const pick = (excl) => { let best = null, bn = -1; cand.forEach((e) => { if (excl && Math.hypot(e.x - excl.x, e.y - excl.y) < 200) return; const c = cand.filter((o) => Math.hypot(o.x - e.x, o.y - e.y) < 140).length; if (c > bn) { bn = c; best = e; } }); return best; };
      const sunAt = (tg) => {
        SFX.boss();
        fx.push({ k: "sun", color: col, x: tg.x, y: tg.y - 60, r: 10, life: dur, t: dur, cd: 0,
          tick(f, h) {
            f.r = 10 + (R - 10) * (1 - f.life / f.t);
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.15;
            enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < f.r + e.r) strike(e, d, 0, 0, "burn"); });
            spark(f.x + rnd(-f.r, f.r) * 0.6, f.y + rnd(-f.r, f.r) * 0.6, col, 1, 120);
          },
          onEnd(f) { boom(f.x, f.y, R * 1.3, st.dmg * 25 * (1 + (w.dm || 0)), col); shake = Math.max(shake, 12); } });
      };
      const first = pick(null);
      if (first) sunAt(first);
      if (w.legend) { const second = pick(first); if (second) sunAt(second); }
    },
  },

  // Tempête de lasers (légendaire) : des lasers géants croisent l'écran dans tous les sens
  laserstorm: {
    char: "arc", tier: "epic", name: "Tempête de lasers",
    intro: "des lasers géants croisent tout l'écran dans tous les sens pendant plusieurs secondes",
    legendText: "deux fois plus de lasers",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des lasers", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la tempête dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "wid", max: 99, vals: [0.2, 0.4, 0.7], text: (v) => "lasers " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || enemies.filter(onScreen).length < 4) return;
      const dur = 5 * (1 + (w.dur || 0)), d = st.dmg * 2.5 * (1 + (w.dm || 0)), wid = 12 * (1 + (w.wid || 0)), col = WEAPON_COLOR.laserstorm;
      w.cd = slow(w, 18) * cdMul() + dur;
      SFX.boss();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0, fl: 0,
        tick(f, h) {
          f.fl -= h;
          if (f.fl <= 0) { f.fl = 0.6; fx.push({ k: "screenflash", color: col, life: 0.1, t: 0.1 }); }
          f.c -= h;
          if (f.c > 0) return;
          f.c = w.legend ? 0.04 : 0.08;
          const px = P.x + rnd(-300, 300), py = P.y + rnd(-300, 300), al = rnd(0, Math.PI);
          thickBeam(px - Math.cos(al) * 350, py - Math.sin(al) * 350, al, 700, d, wid, col);
        } });
    },
  },

  // ===================== PULSE =====================

  // Chapelet de bombes : une traînée de bombes qui explosent à la chaîne
  bombstring: {
    char: "pulse", tier: "rare", name: "Chapelet de bombes",
    intro: "il sème des bombes derrière lui pendant quelques secondes, qui explosent à la chaîne",
    legendText: "chaque bombe explose deux fois",
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des bombes", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "il sème " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const dur = 2 * (1 + (w.dur || 0)), R = 70 * (1 + (w.rad || 0)), d = st.dmg * 4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.bombstring;
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.shoot();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.25;
          fx.push({ k: "tbomb", color: col, x: P.x, y: P.y, R, life: 1.2, t: 1.2, onEnd(b) { boom(b.x, b.y, R, d, col); if (w.legend) fx.push({ k: "flash", x: b.x, y: b.y, life: 0.25, t: 0.1, onEnd: () => boom(b.x, b.y, R, d * 0.6, col) }); } });
        } });
    },
  },

  // Frappe aérienne : un tapis de bombes tombe en ligne à travers tout l'écran
  airstrike: {
    char: "pulse", tier: "rare", name: "Frappe aérienne",
    intro: "un tapis de bombes tombe en ligne droite à travers tout l'écran, bombe après bombe",
    legendText: "une seconde ligne tombe en parallèle",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "bombe") + " par ligne", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des bombes", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 9) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 8 + 2 * (w.n || 0), R = 55 * (1 + (w.rad || 0)), d = st.dmg * 4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.airstrike;
      SFX.shoot();
      const line = (off) => {
        const px = -Math.sin(a) * off, py = Math.cos(a) * off;
        for (let k = 0; k < n; k++) {
          const dist = 40 + k * 70, x = P.x + Math.cos(a) * dist + px, y = P.y + Math.sin(a) * dist + py;
          const drop = () => fx.push({ k: "shell", color: col, tx: x, ty: y, R, life: 0.8, t: 0.8, onEnd: () => boom(x, y, R, d, col) });
          if (k === 0) drop(); else fx.push({ k: "flash", x, y, life: k * 0.1, t: 0.1, onEnd: drop });
        }
      };
      line(0);
      if (w.legend) line(90);
    },
  },

  // Fournaise : un anneau de feu s'étend et laisse des flammes au sol
  furnace: {
    char: "pulse", tier: "rare", name: "Fournaise",
    intro: "un anneau de feu s'étend autour de toi et laisse des flammes qui brûlent au sol",
    legendText: "un second anneau suit",
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du feu", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "anneau " + pct(v) + " plus grand", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "les flammes durent " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la fournaise revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(200)) return;
      w.cd = slow(w, 10) * cdMul();
      const R = 220 * (1 + (w.rad || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), dur = 4 * (1 + (w.dur || 0)), col = WEAPON_COLOR.furnace;
      SFX.bomb();
      const ring = (RR) => {
        const hit = new Set(), cx = P.x, cy = P.y;
        fx.push({ k: "nova", color: col, x: cx, y: cy, r: 1, life: 0.6, t: 0.6,
          tick(f) {
            f.r = RR * (1 - f.life / f.t);
            enemies.forEach((e) => {
              const dx = e.x - cx, dy = e.y - cy, dd = Math.hypot(dx, dy) || 1;
              if (!hit.has(e) && e.hp > 0 && dd < f.r + e.r && dd > f.r - 40 - e.r) { hit.add(e); strike(e, d, (dx / dd) * 160, (dy / dd) * 160, "burn"); e.burn = 2; e.burnT = 0.5; }
            });
          },
          onEnd() {
            for (let k = 0; k < 10; k++) {
              const a = (k / 10) * 6.283, x = cx + Math.cos(a) * RR * 0.9, y = cy + Math.sin(a) * RR * 0.9;
              fx.push({ k: "cloud", color: col, emb: col, x, y, R: 40, life: dur, t: dur, cd: 0,
                tick(c2, h) { c2.cd -= h; if (c2.cd > 0) return; c2.cd = 0.4; enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - c2.x, e.y - c2.y) < c2.R + e.r) strike(e, st.dmg * 0.6, 0, 0, "burn"); }); } });
            }
          } });
      };
      ring(R);
      if (w.legend) fx.push({ k: "flash", x: P.x, y: P.y, life: 0.4, t: 0.1, onEnd: () => ring(R * 1.3) });
    },
  },

  // Tir de barrage : une rafale d'obus explosifs
  barragefire: {
    char: "pulse", tier: "rare", name: "Tir de barrage",
    intro: "une rafale rapide d'obus explosifs part en éventail",
    legendText: "chaque obus se divise en trois à l'impact",
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des obus", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la rafale dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "explosions " + pct(v) + " plus grandes", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      const dur = 1.5 * (1 + (w.dur || 0)), bd = st.dmg * 2 * (1 + (w.dm || 0)), R = 40 * (1 + (w.rad || 0)), col = WEAPON_COLOR.barragefire;
      w.cd = slow(w, 9) * cdMul() + dur;
      SFX.bomb();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.07;
          const tg = nearest(st.range) || tgt, a = Math.atan2(tg.y - P.y, tg.x - P.x) + rnd(-0.5, 0.5);
          P.aim = a;
          P.muzzle = 0.06;
          fire(a, 380, st.range / 380, { dmg: bd, blast: R, bd, size: 1.4, color: col, cluster: !!w.legend });
        } });
    },
  },

  // Cataclysme (légendaire) : une pluie de météores s'abat sur tout l'écran
  cataclysm: {
    char: "pulse", tier: "epic", name: "Cataclysme",
    intro: "une pluie de météores s'abat sur tout l'écran et laisse des cratères de feu",
    legendText: "deux fois plus de météores",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des météores", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "impacts " + pct(v) + " plus grands", apply: bump("rad") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la pluie dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || enemies.filter(onScreen).length < 4) return;
      const dur = 5 * (1 + (w.dur || 0)), R = 90 * (1 + (w.rad || 0)), d = st.dmg * 8 * (1 + (w.dm || 0)), col = WEAPON_COLOR.cataclysm;
      w.cd = slow(w, 18) * cdMul() + dur;
      SFX.boss();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = w.legend ? 0.12 : 0.25;
          const tx = P.x + rnd(-380, 380), ty = P.y + rnd(-300, 300);
          fx.push({ k: "shell", color: col, tx, ty, R, life: 0.8, t: 0.8,
            onEnd() {
              boom(tx, ty, R, d, col);
              fx.push({ k: "cloud", color: "#ff6a1f", emb: "#ff6a1f", x: tx, y: ty, R: 40, life: 3, t: 3, cd: 0,
                tick(c2, h2) { c2.cd -= h2; if (c2.cd > 0) return; c2.cd = 0.4; enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - c2.x, e.y - c2.y) < c2.R + e.r) strike(e, st.dmg * 0.6, 0, 0, "burn"); }); } });
            } });
        } });
    },
  },

  // Fusion du réacteur (légendaire) : il devient un réacteur instable qui explose tout autour de lui
  meltdown: {
    char: "pulse", tier: "epic", name: "Fusion du réacteur",
    intro: "tu deviens un réacteur instable : des explosions éclatent sans cesse autour de toi, et tu es invulnérable",
    legendText: "les ennemis qui te touchent brûlent",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des explosions", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la fusion dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "zone " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const dur = 6 * (1 + (w.dur || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), Z = 140 * (1 + (w.rad || 0)), col = WEAPON_COLOR.meltdown;
      w.cd = slow(w, 20) * cdMul() + dur;
      SFX.boss();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          P.inv = Math.max(P.inv, 0.25); // invulnérable pendant la fusion
          if (Math.random() < 0.7) spark(P.x + rnd(-30, 30), P.y + rnd(-30, 30), col, 1, 160);
          if (w.legend) enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < 40 + e.r) { e.burn = 2; e.burnT = 0.5; } });
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.3;
          const a = rnd(0, 6.283), r = rnd(30, Z);
          boom(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, 70, d, col);
        } });
    },
  },

  // ===================== ZAP =====================

  // Paratonnerre : un paratonnerre attire les éclairs du ciel et les redistribue
  lightningrod: {
    char: "zap", tier: "rare", name: "Paratonnerre",
    intro: "un paratonnerre attire les éclairs du ciel, qui frappent ensuite les ennemis tout autour",
    legendText: "l'éclair frappe cinq cibles de plus",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "paratonnerre"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des éclairs", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "il dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = slow(w, 10) * cdMul();
      const dur = 6 * (1 + (w.dur || 0)), d = st.dmg * 2.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.lightningrod;
      SFX.wave();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const a = rnd(0, 6.283);
        fx.push({ k: "pylon", id: -1, color: col, spk: col, x: P.x + Math.cos(a) * 70, y: P.y + Math.sin(a) * 70, life: dur, t: dur, cd: 0.3,
          tick(f, h) {
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.4;
            fx.push({ k: "bolt", color: col, pts: [[f.x + rnd(-10, 10), f.y - 300], [f.x, f.y - 16]], life: 0.15, t: 0.15 });
            flashFx(f.x, f.y - 16, col, 24);
            zapAround(f.x, f.y - 16, 220, 5 + (w.legend ? 5 : 0), d, col);
          } });
      }
    },
  },

  // Aura statique : une aura qui foudroie tout ce qui s'approche
  staticaura: {
    char: "zap", tier: "rare", name: "Aura statique",
    intro: "une aura électrique autour de toi foudroie sans cesse les ennemis qui s'approchent",
    legendText: "les éclairs étourdissent",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "éclair") + " à chaque salve", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'aura", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "l'aura dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "l'aura revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(180)) return;
      const dur = 5 * (1 + (w.dur || 0)), d = st.dmg * 1.6 * (1 + (w.dm || 0)), col = WEAPON_COLOR.staticaura;
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          if (Math.random() < 0.5) { const a = rnd(0, 6.283); spark(P.x + Math.cos(a) * 60, P.y + Math.sin(a) * 60, col, 1, 100); }
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.2;
          const hit = zapAround(P.x, P.y, 150 * rngMul(), 3 + (w.n || 0), d, col);
          if (w.legend) hit.forEach((e) => { e.frozen = e.type === "boss" ? 0.2 : 0.5; });
          ringFx(P.x, P.y, col, 60, 0.2);
        } });
    },
  },

  // Marteau de Thor : un marteau qui tourne, part et revient en lâchant des éclairs
  mjolnir: {
    char: "zap", tier: "rare", name: "Marteau de Thor",
    intro: "un marteau tourbillonne, part et revient en lâchant des éclairs sur les ennemis proches",
    legendText: "il revient avec une explosion de foudre",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "marteau"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du marteau", apply: bump("dm") },
      { id: "rng", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "portée +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 5) * cdMul();
      const base = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 1 + (w.n || 0), d = st.dmg * 3 * (1 + (w.dm || 0)), dist = 250 * (1 + (w.rng || 0)) * rngMul(), col = WEAPON_COLOR.mjolnir, T = 1.2;
      SFX.dash();
      for (let k = 0; k < n; k++) {
        const a = base + (k - (n - 1) / 2) * 0.6, hit = new Set();
        fx.push({ k: "hammer", color: col, x: P.x, y: P.y, spin: 0, life: T, t: T, bz: 0,
          tick(f, h) {
            const u = 1 - f.life / T;
            f.spin += h * 18;
            f.x = P.x + Math.cos(a) * dist * Math.sin(Math.PI * u);
            f.y = P.y + Math.sin(a) * dist * Math.sin(Math.PI * u);
            trail(f.x, f.y, col, 3);
            f.bz -= h;
            if (f.bz <= 0) { f.bz = 0.15; zapAround(f.x, f.y, 130, 3, d * 0.5, col); }
            enemies.forEach((e) => { if (e.hp > 0 && !hit.has(e) && Math.hypot(e.x - f.x, e.y - f.y) < 18 + e.r) { hit.add(e); strike(e, d, Math.cos(a) * 120, Math.sin(a) * 120, "storm"); } });
          },
          onEnd(f) { if (w.legend) { boom(P.x, P.y, 90, d * 1.5, col); zapAround(P.x, P.y, 260, 8, d, col); } } });
      }
    },
  },

  // Déluge : une pluie d'éclairs s'abat sur une grande zone
  deluge: {
    char: "zap", tier: "rare", name: "Déluge",
    intro: "une pluie d'éclairs s'abat sur une grande zone autour de toi",
    legendText: "deux fois plus d'impacts",
    cd0: 3,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des éclairs", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le déluge dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "zone " + pct(v) + " plus large", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const dur = 3 * (1 + (w.dur || 0)), d = st.dmg * 2 * (1 + (w.dm || 0)), Z = 200 * (1 + (w.rad || 0)), col = WEAPON_COLOR.deluge;
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.wave();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0,
        tick(f, h) {
          f.c -= h;
          if (f.c > 0) return;
          f.c = w.legend ? 0.05 : 0.1;
          const x = P.x + rnd(-Z, Z), y = P.y + rnd(-Z, Z);
          fx.push({ k: "bolt", color: col, pts: [[x + rnd(-8, 8), y - 280], [x, y]], life: 0.14, t: 0.14 });
          flashFx(x, y, col, 14);
          enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - x, e.y - y) < 40 + e.r) strike(e, d, 0, 0, "storm"); });
        } });
    },
  },

  // Colère du ciel (légendaire) : un éclair gigantesque tombe sur l'ennemi le plus costaud
  skywrath: {
    char: "zap", tier: "epic", name: "Colère du ciel",
    intro: "un éclair gigantesque tombe sur l'ennemi le plus costaud, puis saute sur une douzaine d'autres",
    legendText: "il frappe aussi les deux ennemis suivants les plus costauds",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de l'éclair", apply: bump("dm") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 3, "saut") + " de la chaîne", apply: bump("n") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "impact " + pct(v) + " plus grand", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range * 1.3).sort((a, b) => b.hp - a.hp);
      if (!cand.length) return;
      w.cd = slow(w, 12) * cdMul();
      const d = st.dmg * 40 * (1 + (w.dm || 0)), R = 90 * (1 + (w.rad || 0)), col = WEAPON_COLOR.skywrath, chain = 12 + 3 * (w.n || 0);
      SFX.boss();
      cand.slice(0, w.legend ? 3 : 1).forEach((e, i) => {
        const hit = () => {
          if (e.hp <= 0) return;
          fx.push({ k: "screenflash", color: "#ffffff", life: 0.25, t: 0.25 });
          fx.push({ k: "bolt", color: col, pts: [[e.x + rnd(-20, 20), e.y - 420], [e.x, e.y]], life: 0.35, t: 0.35 });
          strike(e, d, 0, 0, "storm");
          boom(e.x, e.y, R, d * 0.3, col);
          shake = Math.max(shake, 12);
          zapAround(e.x, e.y, 240, chain, d * 0.08, col);
        };
        if (i === 0) hit(); else fx.push({ k: "flash", x: e.x, y: e.y, life: i * 0.3, t: 0.1, onEnd: hit });
      });
    },
  },

  // Dieu de l'orage (légendaire) : il devient l'orage lui-même
  stormgod: {
    char: "zap", tier: "epic", name: "Dieu de l'orage",
    intro: "tu deviens l'orage : des éclairs s'abattent sans cesse sur tout l'écran pendant plusieurs secondes",
    legendText: "tu es invulnérable pendant la transformation",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des éclairs", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "l'orage dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "éclair") + " à chaque salve", apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || enemies.filter(onScreen).length < 4) return;
      const dur = 8 * (1 + (w.dur || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.stormgod;
      w.cd = slow(w, 20) * cdMul() + dur;
      SFX.boss();
      fx.push({ k: "flash", x: P.x, y: P.y, life: dur, t: dur, c: 0, fl: 0,
        tick(f, h) {
          if (w.legend) P.inv = Math.max(P.inv, 0.2);
          if (Math.random() < 0.6) { const a = rnd(0, 6.283); spark(P.x + Math.cos(a) * 24, P.y + Math.sin(a) * 24, col, 1, 180); }
          f.fl -= h;
          if (f.fl <= 0) { f.fl = 1; fx.push({ k: "screenflash", color: col, life: 0.12, t: 0.12 }); }
          f.c -= h;
          if (f.c > 0) return;
          f.c = 0.15;
          enemies.filter(onScreen).sort(() => Math.random() - 0.5).slice(0, 3 + (w.n || 0)).forEach((e) => {
            fx.push({ k: "bolt", color: col, pts: [[e.x + rnd(-10, 10), e.y - 300], [e.x, e.y]], life: 0.15, t: 0.15 });
            strike(e, d, 0, 0, "storm");
            flashFx(e.x, e.y, col, 16);
          });
        } });
    },
  },
});

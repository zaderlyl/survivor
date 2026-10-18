"use strict";

/* ---------- Les armes rares et légendaires : Chrome (épées) et Rig (gros rayons) ---------- */
// tier : "rare" (à partir du niveau 6) ou "legend" (à partir du niveau 12, une seule par partie)

// l'arme la plus puissante de chaque héros passe en rare
WEAPONS.greatsword.tier = "rare";
WEAPONS.overload.tier = "rare";

// une épée qui tombe du ciel, se plante et frappe en zone (et étourdit si besoin)
const dropSword = (x, y, R, d, col, stun) => {
  fx.push({ k: "sword", color: col, x, y, life: 1.5, t: 1.5,
    tick(f) {
      if (f.landed || f.life > 1.15) return;
      f.landed = true;
      enemies.forEach((e) => {
        const dx = e.x - f.x, dy = e.y - f.y, dd = Math.hypot(dx, dy) || 1;
        if (e.hp > 0 && dd < R + e.r) { strike(e, d, (dx / dd) * 140, (dy / dd) * 140, "slash"); if (stun) e.frozen = e.type === "boss" ? stun * 0.3 : stun; }
      });
      ringFx(f.x, f.y, col, R, 0.2);
      spark(f.x, f.y, col, 10, 230);
    } });
};
// plusieurs gros rayons qui tournent autour de toi : chacun blesse tout ce qu'il croise
const spinBeams = (col, n, L, r0, bw, life, d, wid, speed) => {
  fx.push({ k: "multibeam", color: col, n, L, r0, bw, ang: rnd(0, 6.283), life, t: life, cd: 0,
    tick(f, h) {
      f.ang += speed * h;
      if (Math.random() < 0.5) { const a = f.ang + Math.floor(Math.random() * n) / n * 6.283; spark(P.x + Math.cos(a) * L, P.y + Math.sin(a) * L, col, 1, 100); }
      f.cd -= h;
      if (f.cd > 0) return;
      f.cd = 0.1;
      for (let b = 0; b < n; b++) {
        const a = f.ang + (b / n) * 6.283, ca = Math.cos(a), sa = Math.sin(a);
        enemies.forEach((e) => {
          const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
          if (e.hp > 0 && along > r0 - 10 && along < L && Math.abs(-dx * sa + dy * ca) < wid + e.r) strike(e, d, ca * 40, sa * 40, "beam");
        });
      }
    } });
};

Object.assign(WEAPONS, {
  // ===== Chrome : rares =====

  // Cercle de lames : un anneau de grandes épées s'ouvre autour de lui puis se referme
  swordring: {
    char: "chrome",
    tier: "rare",
    name: "Cercle de lames",
    intro: "un anneau de grandes épées s'ouvre autour de toi, puis se referme",
    legendText: "un second anneau tourne en sens inverse",
    legendStacks: true,
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "épée") + " dans l'anneau", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du cercle", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "cercle " + pct(v) + " plus grand", apply: bump("rad") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le cercle revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(220)) return;
      w.cd = slow(w, 8) * cdMul() + 2.5;
      const n = 8 + 2 * (w.n || 0), R = 170 * (1 + (w.rad || 0)) * rngMul(), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.swordring;
      SFX.dash();
      const ring = (dir) => {
        const hitAt = new Map();
        fx.push({ k: "swordring", color: col, x: P.x, y: P.y, sw: [], life: 2.5, t: 2.5, rot: rnd(0, 6.283),
          tick(f, h) {
            f.rot += dir * 3 * h;
            const rad = R * Math.sin(Math.PI * Math.min(1, 1 - f.life / f.t));
            f.sw = [];
            for (let i = 0; i < n; i++) { const a = f.rot + (i / n) * 6.283; f.sw.push({ x: P.x + Math.cos(a) * rad, y: P.y + Math.sin(a) * rad, a }); }
            enemies.forEach((e) => {
              if (e.hp <= 0 || (hitAt.get(e) || 0) > t) return;
              for (let i = 0; i < f.sw.length; i++) {
                if (Math.hypot(e.x - f.sw[i].x, e.y - f.sw[i].y) < 26 + e.r) {
                  const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
                  strike(e, d, (dx / dd) * 180, (dy / dd) * 180, "slash");
                  hitAt.set(e, t + 0.3);
                  spark(f.sw[i].x, f.sw[i].y, col, 4, 180);
                  break;
                }
              }
            });
          } });
      };
      ring(1);
      for (let k = 1; k <= lg(w); k++) ring(k % 2 ? -1 : 1);
    },
  },

  // Frappe sismique : il charge, puis frappe le sol : une fissure d'épées traverse l'écran devant lui
  quake: {
    char: "chrome",
    tier: "rare",
    name: "Frappe sismique",
    intro: "il charge, puis frappe le sol : une fissure d'épées s'ouvre devant lui",
    legendText: "une seconde fissure s'ouvre à angle droit",
    cd0: 2,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la fissure", apply: bump("dm") },
      { id: "len", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "épée") + " dans la fissure", apply: bump("len") },
      { id: "stun", max: 99, vals: [0.3, 0.6, 1], text: (v) => "étourdit " + pct(v) + " plus longtemps", apply: bump("stun") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(280);
      if (!tgt) return;
      w.cd = slow(w, 7) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), d = st.dmg * 5 * (1 + (w.dm || 0)), stun = 0.8 * (1 + (w.stun || 0)), col = WEAPON_COLOR.quake;
      P.aim = a;
      SFX.wave();
      const crack = (ang) => {
        const px = P.x, py = P.y, n = 7 + 2 * (w.len || 0);
        SFX.bomb();
        shake = Math.max(shake, 8);
        for (let i = 0; i < n; i++) {
          const x = px + Math.cos(ang) * 60 * (i + 1), y = py + Math.sin(ang) * 60 * (i + 1);
          if (i === 0) dropSword(x, y, 46, d, col, stun); else fx.push({ k: "flash", x, y, life: i * 0.06, t: 0.1, onEnd: () => dropSword(x, y, 46, d, col, stun) });
        }
      };
      fx.push({ k: "flash", x: P.x, y: P.y, life: 0.5, t: 0.5, tick() { chargeFx(P.x, P.y, col); }, onEnd() { crack(a); if (w.legend) crack(a + Math.PI / 2); } });
    },
  },

  // Mur d'épées : un arc d'épées se dresse devant lui, puis part en volée
  swordwall: {
    char: "chrome",
    tier: "rare",
    name: "Mur d'épées",
    intro: "un arc d'épées se dresse devant toi, repousse les ennemis, puis part en volée",
    legendText: "le mur tourne autour de toi",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 3, "épée") + " dans le mur", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du mur", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le mur dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le mur revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(260);
      if (!tgt) return;
      const dur = 3 * (1 + (w.dur || 0)), d = st.dmg * 3 * (1 + (w.dm || 0)), col = WEAPON_COLOR.swordwall, count = 9 + 3 * (w.n || 0);
      w.cd = slow(w, 6) * cdMul() + dur;
      SFX.bomb();
      const hitAt = new Map();
      fx.push({ k: "swordwall", color: col, sw: [], a: Math.atan2(tgt.y - P.y, tgt.x - P.x), life: dur, t: dur,
        tick(f, h) {
          if (w.legend) f.a += 1.2 * h;
          f.sw = [];
          for (let i = 0; i < count; i++) { const aa = f.a + (i - (count - 1) / 2) * 0.2; f.sw.push({ x: P.x + Math.cos(aa) * 95, y: P.y + Math.sin(aa) * 95, a: aa }); }
          enemies.forEach((e) => {
            if (e.hp <= 0 || (hitAt.get(e) || 0) > t) return;
            for (let i = 0; i < f.sw.length; i++) {
              if (Math.hypot(e.x - f.sw[i].x, e.y - f.sw[i].y) < 22 + e.r) {
                const dx = e.x - P.x, dy = e.y - P.y, dd = Math.hypot(dx, dy) || 1;
                strike(e, d, (dx / dd) * 220, (dy / dd) * 220, "slash");
                hitAt.set(e, t + 0.3);
                break;
              }
            }
          });
        },
        onEnd(f) { f.sw.forEach((s) => fire(s.a, 480, 0.7, { x: s.x, y: s.y, dmg: d * 0.8, pierce: 3, color: col, size: 1.4 })); } });
    },
  },

  // Ronde des spectres : des spectres de lui chargent en ligne droite à travers les ennemis
  spectreknights: {
    char: "chrome",
    tier: "rare",
    name: "Ronde des spectres",
    intro: "des spectres de toi chargent en ligne droite à travers les ennemis",
    legendText: "ils reviennent en sens inverse",
    legendStacks: true,
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "spectre"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des spectres", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "ils chargent " + pct(v) + " plus loin", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la ronde revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 8) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 4 + (w.n || 0), d = st.dmg * 3.5 * (1 + (w.dm || 0)), T = 0.7 * (1 + (w.dur || 0)) * (1 + lg(w)), col = WEAPON_COLOR.spectreknights;
      P.aim = a0;
      SFX.dash();
      for (let k = 0; k < n; k++) {
        const a = a0 + (k - (n - 1) / 2) * 0.25, ca = Math.cos(a), sa = Math.sin(a);
        let dir = 1, seg = 0, hit = new Set();
        fx.push({ k: "spectre", color: col, x: P.x, y: P.y, a, life: T, t: T,
          tick(f, h) {
            if (lg(w) && Math.floor((1 - f.life / f.t) * (1 + lg(w))) > seg) { seg++; dir = -dir; hit = new Set(); } // ils reviennent, autant de fois que de reprises
            f.x += ca * 520 * h * dir;
            f.y += sa * 520 * h * dir;
            trail(f.x, f.y, col, 3);
            enemies.forEach((e) => {
              if (e.hp <= 0 || hit.has(e) || Math.hypot(e.x - f.x, e.y - f.y) >= 28 + e.r) return;
              hit.add(e);
              strike(e, d, ca * 160 * dir, sa * 160 * dir, "slash");
              spark(e.x, e.y, col, 5, 200);
            });
          } });
      }
    },
  },

  // ===== Chrome : légendaires =====

  // Dragon d'acier : un dragon fait d'épées surgit et fonce à travers l'écran
  steeldragon: {
    char: "chrome",
    tier: "legend",
    name: "Dragon d'acier",
    intro: "un dragon fait d'épées surgit et fonce à travers l'écran en tranchant tout",
    legendText: "le dragon crache des épées devant lui",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du dragon", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le dragon vit " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "len", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 10, "segment") + " au dragon", apply: bump("len") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le dragon revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(320)) return;
      const dur = 6 * (1 + (w.dur || 0)), d = st.dmg * 4 * (1 + (w.dm || 0)), col = WEAPON_COLOR.steeldragon, maxSeg = 26 + 10 * (w.len || 0);
      w.cd = slow(w, 14) * cdMul() + dur;
      SFX.boss();
      shake = Math.max(shake, 6);
      const hitAt = new Map();
      fx.push({ k: "dragon", color: col, segs: [], life: dur, t: dur, th: rnd(0, 6.283), sp: 0,
        tick(f, h) {
          f.th += 2.4 * h;
          const u = 1 - f.life / f.t, rr = 120 + 90 * Math.sin(u * Math.PI * 3), hx = P.x + Math.cos(f.th) * rr, hy = P.y + Math.sin(f.th * 1.3) * rr * 0.8, last = f.segs[0];
          if (!last || Math.hypot(hx - last[0], hy - last[1]) >= 10) { f.segs.unshift([hx, hy]); if (f.segs.length > maxSeg) f.segs.pop(); }
          if (Math.random() < 0.5) spark(hx, hy, col, 1, 120);
          enemies.forEach((e) => {
            if (e.hp <= 0 || (hitAt.get(e) || 0) > t) return;
            for (let i = 0; i < f.segs.length; i += 2) {
              if (Math.hypot(e.x - f.segs[i][0], e.y - f.segs[i][1]) < 20 + e.r) { strike(e, d, 0, 0, "slash"); hitAt.set(e, t + 0.15); break; }
            }
          });
          if (w.legend) { // il crache des épées devant lui
            f.sp -= h;
            if (f.sp <= 0 && f.segs[1]) { f.sp = 0.4; fire(Math.atan2(f.segs[0][1] - f.segs[1][1], f.segs[0][0] - f.segs[1][0]), 520, 0.8, { x: hx, y: hy, dmg: d * 0.5, pierce: 4, color: col, size: 1.6 }); }
          }
        } });
    },
  },

  // Lame du jugement : une épée colossale tombe sur la plus grosse concentration d'ennemis
  judgment: {
    char: "chrome",
    tier: "legend",
    name: "Lame du jugement",
    intro: "une épée colossale tombe sur la plus grosse concentration d'ennemis et fend l'arène",
    legendText: "elle frappe trois fois d'affilée",
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du jugement", apply: bump("dm") },
      { id: "rad", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "zone " + pct(v) + " plus grande", apply: bump("rad") },
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "frappe"), apply: bump("n") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le jugement revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const cand = enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - P.x, e.y - P.y) < st.range * 1.2);
      if (cand.length < 3) return;
      w.cd = slow(w, 16) * cdMul();
      const R = 200 * (1 + (w.rad || 0)), d = st.dmg * 25 * (1 + (w.dm || 0)), col = WEAPON_COLOR.judgment;
      let best = cand[0], bn = -1;
      cand.forEach((e) => { const c = cand.filter((o) => Math.hypot(o.x - e.x, o.y - e.y) < 140).length; if (c > bn) { bn = c; best = e; } });
      const tx = best.x, ty = best.y, hits = 1 + (w.n || 0) + (w.legend ? 2 : 0);
      SFX.boss();
      for (let k = 0; k < hits; k++) {
        const strikeIt = () => fx.push({ k: "shell", color: col, tx, ty, R, life: 1.0, t: 1.0,
          onEnd() {
            boom(tx, ty, R, d, col);
            ringFx(tx, ty, "#ffffff", R * 1.2, 0.4);
            flashFx(tx, ty, col, R * 0.8);
            shake = Math.max(shake, 14);
            for (let j = 0; j < 8; j++) { const a = (j / 8) * 6.283; dropSword(tx + Math.cos(a) * R * 0.6, ty + Math.sin(a) * R * 0.6, 36, d * 0.08, col, 0); }
          } });
        if (k === 0) strikeIt(); else fx.push({ k: "flash", x: tx, y: ty, life: k * 0.7, t: 0.1, onEnd: strikeIt });
      }
    },
  },

  // ===== Rig : rares =====

  // Rayons prismatiques : plusieurs gros rayons tournent ensemble autour de lui
  prismrays: {
    char: "rig",
    tier: "rare",
    name: "Rayons prismatiques",
    intro: "trois gros rayons tournent ensemble autour de toi pendant quelques secondes",
    legendText: "les rayons tournent deux fois plus vite",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "rayon"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des rayons", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "les rayons durent " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "reviennent " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(260)) return;
      const dur = 3 * (1 + (w.dur || 0));
      w.cd = slow(w, 9) * cdMul() + dur;
      SFX.wave();
      spinBeams(WEAPON_COLOR.prismrays, 3 + (w.n || 0), 240 * rngMul(), 0, 12, dur, st.dmg * 2.5 * (1 + (w.dm || 0)), 14, w.legend ? 4 : 2);
    },
  },

  // Salve de colonnes : des colonnes de lumière jaillissent en ligne devant lui
  columnsalvo: {
    char: "rig",
    tier: "rare",
    name: "Salve de colonnes",
    intro: "des colonnes de lumière jaillissent en ligne droite, l'une après l'autre",
    legendText: "une seconde ligne part en V",
    cd0: 2,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "colonne") + " par ligne", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts des colonnes", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "les colonnes durent " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la salve revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 8) * cdMul();
      const a0 = Math.atan2(tgt.y - P.y, tgt.x - P.x), n = 6 + 2 * (w.n || 0), d = st.dmg * 1.4 * (1 + (w.dm || 0)), dur = 1.2 * (1 + (w.dur || 0)), col = WEAPON_COLOR.columnsalvo;
      P.aim = a0;
      SFX.bomb();
      const line = (a) => {
        const px = P.x, py = P.y;
        for (let i = 0; i < n; i++) {
          const x = px + Math.cos(a) * (60 + i * 55), y = py + Math.sin(a) * (60 + i * 55);
          const col2 = () => fx.push({ k: "pillar", color: col, x, y, R: 40, life: dur, t: dur, cd: 0,
            tick(f, h) { f.cd -= h; if (f.cd > 0) return; f.cd = 0.15; enemies.forEach((e) => { if (e.hp > 0 && Math.hypot(e.x - f.x, e.y - f.y) < f.R + e.r) strike(e, d, 0, 0, "beam"); }); } });
          if (i === 0) col2(); else fx.push({ k: "flash", x, y, life: i * 0.12, t: 0.1, onEnd: col2 });
        }
      };
      line(a0);
      if (w.legend) { line(a0 + 0.5); line(a0 - 0.5); }
    },
  },

  // Tourelle lourde : une grosse tourelle qui tire de gros rayons en rafale
  heavyturret: {
    char: "rig",
    tier: "rare",
    name: "Tourelle lourde",
    intro: "une grosse tourelle posée au sol tire de gros rayons en rafale",
    legendText: "la tourelle tire deux fois plus vite",
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v, "tourelle") + " posée à la fois", apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts de la tourelle", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "la tourelle dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "la tourelle revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !enemies.length) return;
      w.cd = slow(w, 12) * cdMul();
      const dur = 8 * (1 + (w.dur || 0)), d = st.dmg * 1.5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.heavyturret;
      SFX.bomb();
      for (let k = 0, n = 1 + (w.n || 0); k < n; k++) {
        const a = rnd(0, 6.283);
        fx.push({ k: "hturret", color: col, x: P.x + Math.cos(a) * 60, y: P.y + Math.sin(a) * 60, a: 0, life: dur, t: dur, cd: 0.3,
          tick(f, h) {
            const tg = nearest(300 * rngMul(), f.x, f.y);
            if (tg) f.a = Math.atan2(tg.y - (f.y - 7), tg.x - f.x);
            f.cd -= h;
            if (f.cd > 0 || !tg) return;
            f.cd = (w.legend ? 0.09 : 0.18) * cdMul();
            thickBeam(f.x, f.y - 7, f.a, 280, d, 8, col);
          } });
      }
    },
  },

  // Champ de particules : un anneau de rayons courts qui tourne autour de lui
  particlefield: {
    char: "rig",
    tier: "rare",
    name: "Champ de particules",
    intro: "un anneau de rayons courts tourne autour de toi et brûle tout ce qui s'approche",
    legendText: "un second anneau tourne en sens inverse",
    legendStacks: true,
    cd0: 3,
    variants: [
      { id: "n", max: 99, vals: [1, 2, 3], text: (v) => "+" + plural(v * 2, "rayon"), apply: bump("n") },
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du champ", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le champ dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le champ revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(200)) return;
      const dur = 5 * (1 + (w.dur || 0)), d = st.dmg * 2 * (1 + (w.dm || 0)), n = 6 + 2 * (w.n || 0), col = WEAPON_COLOR.particlefield;
      w.cd = slow(w, 10) * cdMul() + dur;
      SFX.wave();
      spinBeams(col, n, 150 * rngMul(), 40, 8, dur, d, 12, 2.6);
      for (let k = 1; k <= lg(w); k++) spinBeams(col, n, 150 * rngMul(), 40, 8, dur, d, 12, k % 2 ? -2.6 : 2.6);
    },
  },

  // ===== Rig : légendaires =====

  // Rayon destructeur : un faisceau gigantesque qui balaie tout à 360°
  destroyer: {
    char: "rig",
    tier: "legend",
    name: "Rayon destructeur",
    intro: "un faisceau gigantesque balaie tout autour de toi, deux tours complets",
    legendText: "un second faisceau tourne à l'opposé",
    legendStacks: true,
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du faisceau", apply: bump("dm") },
      { id: "dur", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "le faisceau dure " + pct(v) + " plus longtemps", apply: bump("dur") },
      { id: "wid", max: 99, vals: [0.15, 0.3, 0.6], text: (v) => "faisceau " + pct(v) + " plus épais", apply: bump("wid") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le faisceau revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0 || !nearest(300)) return;
      const dur = 4 * (1 + (w.dur || 0)), d = st.dmg * 2.2 * (1 + (w.dm || 0)), wid = 55 * (1 + (w.wid || 0)), col = WEAPON_COLOR.destroyer;
      w.cd = slow(w, 18) * cdMul() + dur;
      SFX.boss();
      const a0 = rnd(0, 6.283);
      for (let k = 0, cnt = 1 + lg(w); k < cnt; k++) {
        fx.push({ k: "cbeam", color: col, x: P.x, y: P.y, a: a0 + (k / cnt) * 6.283, len: 520, w: wid, life: dur, t: dur, cd: 0, k0: k,
          tick(f, h) {
            f.x = P.x;
            f.y = P.y;
            f.a += Math.PI * h; // un tour en deux secondes
            shake = Math.max(shake, 3);
            const ca = Math.cos(f.a), sa = Math.sin(f.a);
            spark(P.x + ca * rnd(60, 520), P.y + sa * rnd(60, 520), col, 2, 160);
            f.cd -= h;
            if (f.cd > 0) return;
            f.cd = 0.08;
            enemies.forEach((e) => {
              const dx = e.x - P.x, dy = e.y - P.y, along = dx * ca + dy * sa;
              if (e.hp > 0 && along > 0 && along < 520 && Math.abs(-dx * sa + dy * ca) < f.w * 0.5 + e.r) strike(e, d, ca * 60, sa * 60, "beam");
            });
          } });
      }
    },
  },

  // Mur de lumière : un mur de lumière immense traverse tout l'écran
  lightwall: {
    char: "rig",
    tier: "legend",
    name: "Mur de lumière",
    intro: "un mur de lumière immense traverse tout l'écran et balaie les ennemis devant lui",
    legendText: "le mur revient sur ses pas",
    legendStacks: true,
    cd0: 4,
    variants: [
      { id: "dm", max: 99, vals: [0.25, 0.5, 1], text: (v) => "+" + pct(v) + " de dégâts du mur", apply: bump("dm") },
      { id: "wid", max: 99, vals: [0.15, 0.3, 0.5], text: (v) => "mur " + pct(v) + " plus large", apply: bump("wid") },
      { id: "rng", max: 99, vals: [0.2, 0.4, 0.8], text: (v) => "portée du mur +" + pct(v), apply: bump("rng") },
      { id: "rate", max: 99, vals: [0.1, 0.2, 0.35], text: (v) => "le mur revient " + pct(v) + " plus vite", apply: bump("rate") },
    ],
    update(w, dt) {
      w.cd -= dt;
      if (w.cd > 0) return;
      const tgt = nearest(st.range);
      if (!tgt) return;
      w.cd = slow(w, 16) * cdMul();
      const a = Math.atan2(tgt.y - P.y, tgt.x - P.x), W = 220 * (1 + (w.wid || 0)), dist = 700 * (1 + (w.rng || 0)), d = st.dmg * 5 * (1 + (w.dm || 0)), col = WEAPON_COLOR.lightwall;
      const T = dist / 260, ca = Math.cos(a), sa = Math.sin(a);
      P.aim = a;
      SFX.boss();
      shake = Math.max(shake, 8);
      let dir = 1, seg = 0, hit = new Set();
      fx.push({ k: "pwave", color: col, x: P.x + ca * 30, y: P.y + sa * 30, a, w: W, life: T * (1 + lg(w)), t: T * (1 + lg(w)),
        tick(f, h) {
          if (lg(w) && Math.floor((1 - f.life / f.t) * (1 + lg(w))) > seg) { seg++; dir = -dir; hit = new Set(); }
          f.x += ca * 260 * h * dir;
          f.y += sa * 260 * h * dir;
          spark(f.x + -sa * rnd(-W, W), f.y + ca * rnd(-W, W), col, 2, 140);
          enemies.forEach((e) => {
            if (e.hp <= 0 || hit.has(e)) return;
            const dx = e.x - f.x, dy = e.y - f.y, along = dx * ca + dy * sa, perp = -dx * sa + dy * ca;
            if (Math.abs(along) < 30 + e.r && Math.abs(perp) < W + e.r) { hit.add(e); strike(e, d, ca * 420 * dir, sa * 420 * dir, "beam"); }
          });
        } });
    },
  },
});

"use strict";

/* ---------- Les briques de boss : laser, mur, zones qui suivent, bouclier, mines, clones ---------- */
// chaque brique annonce son danger (ligne, marque, cercle) avant de faire mal : on doit toujours pouvoir lire puis esquiver
const hazard = (life, o) => fx.push(Object.assign({ k: "bhaz", life, t: life }, o));
const WARN = "#ffd23f";

Object.assign(BOSS_BRICKS, {
  // un laser verrouille ta direction, puis balaie l'écran : il faut passer derrière lui ou s'éloigner de son axe
  laser(e, c) {
    const a0 = Math.atan2(c.dy, c.dx), dir = Math.random() < 0.5 ? 1 : -1;
    const tel = 1.0, sweep = c.lvl >= 1 ? 2.2 : 2.6, span = c.lvl >= 1 ? 1.3 : 1.0, offs = c.lvl >= 2 ? [0, Math.PI] : [0];
    e.mode = "busy";
    e.mt = tel + sweep;
    hazard(tel + sweep, {
      ox: e.x, oy: e.y, ang: a0 - (dir * span) / 2, hc: 0,
      tick(f, h) {
        const el = f.t - f.life;
        f.hc -= h;
        if (el <= tel) return;
        f.ang += dir * (span / sweep) * h;
        offs.forEach((o) => {
          const ca = Math.cos(f.ang + o), sa = Math.sin(f.ang + o), dx = P.x - f.ox, dy = P.y - f.oy;
          if (dx * ca + dy * sa > 0 && Math.abs(-dx * sa + dy * ca) < 9 + P.r && f.hc <= 0) { hurt(12 * dm.dmg); f.hc = 0.35; }
        });
      },
      draw(f, g) {
        const el = f.t - f.life;
        offs.forEach((o) => {
          const ca = Math.cos(f.ang + o), sa = Math.sin(f.ang + o);
          g.beginPath();
          g.moveTo(f.ox, f.oy);
          g.lineTo(f.ox + ca * 1400, f.oy + sa * 1400);
          if (el <= tel) {
            g.strokeStyle = WARN; g.globalAlpha = 0.3 + 0.5 * (el / tel); g.lineWidth = 2; g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]);
          } else {
            g.globalCompositeOperation = "lighter";
            g.strokeStyle = PINK; g.lineWidth = 20; g.stroke();
            g.strokeStyle = "#ffffff"; g.lineWidth = 6; g.stroke();
            g.globalCompositeOperation = "source-over";
          }
        });
        g.globalAlpha = 1;
      },
    });
  },

  // un mur de tirs avance vers toi, avec une brèche : on se place dans le trou (marqué avant le départ)
  wall(e, c) {
    const rounds = c.lvl >= 2 ? 2 : 1;
    const once = (n) => {
      if (e.hp <= 0) return;
      const a = Math.atan2(P.y - e.y, P.x - e.x), nx = Math.cos(a), ny = Math.sin(a), px = -ny, py = nx;
      const lp = (P.x - e.x) * px + (P.y - e.y) * py, half = c.lvl >= 1 ? 52 : 64, gc = clamp(lp + rnd(-140, 140), -300, 300);
      const ox = e.x, oy = e.y, tel = 0.9, sp = 150 + c.lvl * 15;
      hazard(tel, {
        draw(f, g) {
          const k = 1 - f.life / f.t;
          g.lineWidth = 3;
          g.globalAlpha = 0.3 + 0.4 * k;
          g.strokeStyle = PINK;
          g.beginPath(); g.moveTo(ox - px * 460, oy - py * 460); g.lineTo(ox + px * (gc - half), oy + py * (gc - half)); g.moveTo(ox + px * (gc + half), oy + py * (gc + half)); g.lineTo(ox + px * 460, oy + py * 460); g.stroke();
          g.strokeStyle = "#35f2ff"; g.lineWidth = 5; g.globalAlpha = 0.9;
          g.beginPath(); g.moveTo(ox + px * (gc - half), oy + py * (gc - half)); g.lineTo(ox + px * (gc + half), oy + py * (gc + half)); g.stroke(); // la brèche
          g.globalAlpha = 1;
        },
        onEnd() {
          for (let s = -460; s <= 460; s += 30) if (s < gc - half || s > gc + half) bossBullet(ox + px * s, oy + py * s, a, sp);
          if (n + 1 < rounds) hazard(0.7, { draw() {}, onEnd: () => once(n + 1) });
        },
      });
    };
    e.mode = "busy";
    e.mt = 0.9;
    once(0);
  },

  // des cercles te suivent lentement puis s'arrêtent et claquent : il faut les semer avant la fin
  follow(e, c) {
    const n = 2 + c.lvl;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * 6.283 + rnd(0, 1), r = rnd(120, 220);
      zones.push({ x: clamp(P.x + Math.cos(a) * r, 40, ARENA_W - 40), y: clamp(P.y + Math.sin(a) * r, 40, ARENA_H - 40), r: 55, t: 2.2, max: 2.2, dmg: 14 * dm.dmg, fired: false, boom: 0, follow: 65 });
    }
  },

  // un bouclier absorbe les dégâts tant qu'il n'est pas brisé ; il se brise en laissant le boss étourdi et vulnérable
  shield(e, c) {
    if (e.shield > 0) return;
    e.shMax = e.shield = e.max * (0.05 + 0.02 * c.lvl);
    e.shT = 9;
    e.spiral = 6;
    ringFx(e.x, e.y, "#35f2ff", 100, 0.4);
    floatText(e.x, e.y - e.r - 16, "bouclier", "#35f2ff", 14);
  },

  // des mines au sol : visibles, elles s'arment puis explosent si tu marches dessus
  mines(e, c) {
    const n = 5 + c.lvl * 2, list = [];
    for (let k = 0; k < n; k++) {
      const a = rnd(0, 6.283), r = rnd(70, 260);
      list.push({ x: clamp(P.x + Math.cos(a) * r, 40, ARENA_W - 40), y: clamp(P.y + Math.sin(a) * r, 40, ARENA_H - 40), live: true });
    }
    hazard(8, {
      tick(f) {
        if (f.t - f.life < 0.9) return; // le temps de les voir poser
        list.forEach((m) => {
          if (m.live && Math.hypot(m.x - P.x, m.y - P.y) < 26 + P.r) { m.live = false; hurt(16 * dm.dmg); SFX.bomb(); ringFx(m.x, m.y, PINK, 60, 0.3); burst(m.x, m.y, 10, PINK, 200); }
        });
      },
      draw(f, g) {
        const armed = f.t - f.life >= 0.9;
        list.forEach((m) => {
          if (!m.live) return;
          g.globalAlpha = armed ? 0.9 : 0.4;
          g.strokeStyle = armed ? PINK : WARN;
          g.lineWidth = 2;
          g.setLineDash(armed ? [] : [4, 4]);
          g.beginPath(); g.arc(m.x, m.y, 20, 0, 6.283); g.stroke();
          g.setLineDash([]);
          g.fillStyle = PINK;
          g.globalAlpha = armed ? 0.5 + 0.4 * Math.sin(t * 10 + m.x) : 0.2;
          g.beginPath(); g.arc(m.x, m.y, 7, 0, 6.283); g.fill();
        });
        g.globalAlpha = 1;
      },
    });
  },

  // des clones apparaissent autour de toi, se montrent, puis tirent en éventail : il faut sortir de leurs axes
  clones(e, c) {
    const n = 2 + (c.lvl >= 2 ? 1 : 0), list = [], a0 = rnd(0, 6.283);
    for (let k = 0; k < n; k++) { const a = a0 + (k / n) * 6.283; list.push({ x: clamp(P.x + Math.cos(a) * 230, 40, ARENA_W - 40), y: clamp(P.y + Math.sin(a) * 230, 40, ARENA_H - 40) }); }
    hazard(1.1, {
      draw(f, g) {
        const k = 1 - f.life / f.t;
        list.forEach((m) => {
          g.strokeStyle = PINK;
          g.globalAlpha = 0.25 + 0.5 * k;
          g.lineWidth = 2;
          g.setLineDash([6, 6]);
          g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(P.x, P.y); g.stroke();
          g.setLineDash([]);
          g.beginPath(); g.arc(m.x, m.y, e.r + 4 + 6 * Math.sin(t * 12), 0, 6.283); g.stroke();
          g.fillStyle = PINK;
          g.globalAlpha = 0.15 + 0.25 * k;
          g.beginPath(); g.arc(m.x, m.y, e.r, 0, 6.283); g.fill();
        });
        g.globalAlpha = 1;
      },
      onEnd() {
        const shots = c.enr ? 7 : 5;
        list.forEach((m) => {
          const a = Math.atan2(P.y - m.y, P.x - m.x);
          for (let s = 0; s < shots; s++) bossBullet(m.x, m.y, a + (s - (shots - 1) / 2) * 0.2, 230);
          burst(m.x, m.y, 8, PINK, 200);
        });
      },
    });
  },
});

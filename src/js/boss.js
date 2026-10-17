"use strict";

/* ---------- Les boss ---------- */
// un boss par monde, dans l'ordre ; après le cinquième, on recommence avec plus de vie
const BOSS_NAMES = ["chef de gang", "abomination", "machine", "ia corrompue", "pdg augmenté"];
// les attaques s'enchaînent dans cet ordre ; sous la moitié de sa vie, le boss les enchaîne plus vite et plus fort
const BOSS_ATKS = [
  ["ring", "charge", "summon"],
  ["fan", "pools", "summon"],
  ["burst", "pound", "charge"],
  ["spiral", "teleport", "summon"],
  ["ring", "spiral", "charge", "pound"],
];
const BOSS_MINIONS = ["crawler", "crawler", "brute", "splitter", "brute"];

const bossBullet = (x, y, a, sp) => ebullets.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 4, dmg: 10 * dm.dmg });
// une zone rose au sol : elle se remplit puis claque
const bossZone = (x, y, delay) => zones.push({ x: clamp(x, 40, ARENA_W - 40), y: clamp(y, 40, ARENA_H - 40), r: 50, t: delay, max: delay, dmg: 14 * dm.dmg, fired: false, boom: 0 });

// renvoie le mouvement du boss : { mx, my, sp }
const bossAI = (e, dt, dx, dy, d) => {
  if (e.bk === undefined) { e.bk = world % 5; e.ai = 0; e.cd = 2; e.mode = "walk"; e.mt = 0; e.spiral = 0; e.sc = 0; e.sa = 0; e.tele = 0; }
  const list = BOSS_ATKS[e.bk], enr = e.hp < e.max * 0.5;
  let mx = dx / d, my = dy / d, sp = e.sp;
  e.mt -= dt;
  e.tele = 0;
  if (e.spiral > 0) {
    e.spiral -= dt;
    e.sc -= dt;
    if (e.sc <= 0) { e.sc = enr ? 0.07 : 0.1; e.sa += 0.45; bossBullet(e.x, e.y, e.sa, 190); bossBullet(e.x, e.y, e.sa + Math.PI, 190); }
  }
  if (e.mode === "windup") {
    sp = 0;
    e.tele = 1;
    if (e.mt <= 0) { e.mode = "dash"; e.mt = 0.5; }
  } else if (e.mode === "dash") {
    mx = e.dirx; my = e.diry; sp = e.dashSp;
    if (e.mt <= 0) e.mode = "walk";
  } else if (e.mode === "tp") {
    sp = 0;
    e.tele = 2;
    if (e.mt <= 0) {
      const a = rnd(0, 6.283);
      e.x = clamp(P.x + Math.cos(a) * 170, e.r, ARENA_W - e.r);
      e.y = clamp(P.y + Math.sin(a) * 170, e.r, ARENA_H - e.r);
      e.mode = "walk";
      for (let k = 0; k < 14; k++) bossBullet(e.x, e.y, (k / 14) * 6.283, 170);
    }
  } else {
    e.cd -= dt;
    if (e.cd <= 0) {
      e.cd = enr ? 1.7 : 2.6;
      const atk = list[e.ai++ % list.length];
      if (atk === "ring") {
        const n = enr ? 20 : 14;
        for (let k = 0; k < n; k++) bossBullet(e.x, e.y, (k / n) * 6.283 + t, 170);
      } else if (atk === "fan") {
        const n = enr ? 9 : 5, a = Math.atan2(dy, dx);
        for (let k = 0; k < n; k++) bossBullet(e.x, e.y, a + (k - (n - 1) / 2) * 0.22, 230);
      } else if (atk === "burst") {
        for (let v = 0; v < 3; v++) fx.push({ k: "flash", x: e.x, y: e.y, life: v * 0.25, t: 0.1, onEnd: () => {
          const a = Math.atan2(P.y - e.y, P.x - e.x);
          for (let k = -1; k <= 1; k++) bossBullet(e.x, e.y, a + k * 0.18, 250);
        } });
      } else if (atk === "pools" || atk === "pound") {
        const n = enr ? 11 : 7;
        for (let k = 0; k < n; k++) { const a = rnd(0, 6.283), r = rnd(30, 220); bossZone(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, 1 + k * 0.14); }
      } else if (atk === "summon") {
        for (let k = 0, n = enr ? 6 : 4; k < n; k++) spawn(BOSS_MINIONS[e.bk], e.x + rnd(-40, 40), e.y + rnd(-40, 40));
      } else if (atk === "charge") {
        e.dirx = dx / d; e.diry = dy / d; e.dashSp = e.bk === 2 ? 330 : 480;
        e.mode = "windup"; e.mt = 0.7;
      } else if (atk === "spiral") {
        e.spiral = enr ? 4 : 3; e.sc = 0; e.sa = rnd(0, 6.283);
      } else if (atk === "teleport") {
        e.mode = "tp"; e.mt = 0.6;
      }
    }
  }
  return { mx, my, sp };
};

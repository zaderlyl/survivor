"use strict";

/* ---------- Les grands boss : un tous les 5 mondes, chacun avec sa règle d'arène ---------- */
// monde 5 le PDG (secteurs) · 10 le réacteur (pylônes) · 15 la singularité (gravité) · 20 chronos (échos) · 25 le rival (damier)
const GRAND_NAMES = ["le pdg : licenciements", "le réacteur : pylônes", "la singularité : gravité", "chronos : échos", "le rival : damier"];
const GRAND_ART = [["boss4", 0], ["boss2", 120], ["boss3", 200], ["boss1", 270], ["boss0", 330]]; // le dessin de base et la rotation de teinte

// change la teinte d'une couleur "#rrggbb"
const hueShift = (hex, deg) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16) / 255, gr = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b), l = (mx + mn) / 2, dl = mx - mn;
  let h = 0, s = 0;
  if (dl) {
    s = dl / (1 - Math.abs(2 * l - 1));
    h = mx === r ? ((gr - b) / dl) % 6 : mx === gr ? (b - r) / dl + 2 : (r - gr) / dl + 4;
    h = ((h * 60 + deg) % 360 + 360) % 360;
  }
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const hx = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return "#" + hx(r1) + hx(g1) + hx(b1);
};
GRAND_ART.forEach(([base, deg], i) => {
  const a = ART[base], pal = {};
  for (const k in a.pal) pal[k] = hueShift(a.pal[k], deg);
  ART["bossG" + (i + 1)] = { pal, s: 3, frames: a.frames };
});

// un boss de monde 5, 10, 15... devient un grand boss : plus gros, plus de vie, un autre dessin
const makeGrand = (e) => {
  const g = (world + 1) / 5, m = (g - 1) % 5;
  e.grand = g;
  e.pk = "g" + (m + 1);
  e.art = "bossG" + (m + 1);
  e.r = 40;
  e.hp = e.max = e.hp * 1.8;
  return GRAND_NAMES[m];
};

// ce que fait le grand boss en permanence (la règle d'arène qui lui est propre)
const GRAND_TICK = {
  // la singularité attire le joueur vers elle, de plus en plus fort selon la phase
  g3(e, dt) {
    if (e.invT > 0) return;
    const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1, pull = 30 + 18 * e.ph;
    if (d > 70) { P.x = clamp(P.x + (dx / d) * pull * dt, 12, ARENA_W - 12); P.y = clamp(P.y + (dy / d) * pull * dt, 12, ARENA_H - 12); }
  },
};

Object.assign(BOSS_BRICKS, {
  // le PDG : le sol se découpe en parts, certaines sont « licenciées » (mortelles) après un signal ; il reste toujours une part voisine saine
  sectors(e, c) {
    const n = 8, cx = e.x, cy = e.y, base = rnd(0, 6.283), W = 6.283 / n, L = Math.min(6, 3 + c.lvl), tel = 1.9 - 0.1 * c.lvl;
    const wedgeOf = (x, y) => Math.floor((((Math.atan2(y - cy, x - cx) - base) % 6.283) + 6.283) % 6.283 / W);
    const idx = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5), bad = new Set(idx.slice(0, L)), pw = wedgeOf(P.x, P.y);
    bad.delete((pw + (Math.random() < 0.5 ? 1 : n - 1)) % n);
    e.mode = "busy";
    e.mt = tel + 0.3;
    hazard(tel + 0.5, {
      done: false,
      tick(f) {
        if (f.done || f.t - f.life < tel) return;
        f.done = true;
        if (bad.has(wedgeOf(P.x, P.y)) && Math.hypot(P.x - cx, P.y - cy) < 1000) hurt(16 * dm.dmg);
        shake = Math.max(shake, 8);
        SFX.bomb();
      },
      draw(f, g) {
        const el = f.t - f.life, fired = el >= tel;
        g.fillStyle = fired ? PINK : WARN;
        g.globalAlpha = fired ? 0.6 * Math.max(0, f.life / 0.5) : 0.1 + 0.25 * (el / tel);
        bad.forEach((i) => { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 1000, base + i * W, base + (i + 1) * W); g.closePath(); g.fill(); });
        g.globalAlpha = 1;
      },
    });
  },

  // le réacteur : des pylônes relient le boss, qui reste invulnérable tant qu'il en reste un
  pylons(e, c) {
    if (enemies.some((q) => q.pylon && q.hp > 0)) return;
    const n = Math.min(5, 2 + c.lvl), a0 = rnd(0, 6.283);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * 6.283;
      spawn("tank", clamp(e.x + Math.cos(a) * 300, 40, ARENA_W - 40), clamp(e.y + Math.sin(a) * 300, 40, ARENA_H - 40), true);
      const q = enemies[enemies.length - 1];
      q.pylon = true;
      q.sp = 0;
      q.r = 14;
      q.hp = q.max = e.max * 0.025;
    }
    banner("détruis les pylônes");
    ringFx(e.x, e.y, "#35f2ff", 160, 0.5);
    hazard(120, {
      tick(f) { if (!enemies.some((q) => q.pylon && q.hp > 0)) f.life = 0; },
      draw(f, g) {
        g.strokeStyle = "#35f2ff";
        g.lineWidth = 2;
        enemies.forEach((q) => {
          if (!q.pylon || q.hp <= 0) return;
          g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 10);
          g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(q.x, q.y); g.stroke();
          g.beginPath(); g.arc(q.x, q.y, q.r + 8, 0, 6.283); g.stroke();
        });
        g.globalAlpha = 1;
      },
    });
  },

  // la singularité : un puits qui t'attire vers un cœur qui fait mal (il n'attire qu'après un instant)
  well(e, c) {
    for (let k = 0, n = c.lvl >= 2 ? 2 : 1; k < n; k++) {
      const a = rnd(0, 6.283), r = rnd(180, 320), wx = clamp(P.x + Math.cos(a) * r, 80, ARENA_W - 80), wy = clamp(P.y + Math.sin(a) * r, 80, ARENA_H - 80), R = 280;
      hazard(7, {
        hc: 0,
        tick(f, h) {
          if (f.t - f.life < 0.9) return;
          f.hc -= h;
          const d = Math.hypot(wx - P.x, wy - P.y);
          if (d < R && d > 4) { const pull = 130 * (1 - d / R); P.x = clamp(P.x + ((wx - P.x) / d) * pull * h, 12, ARENA_W - 12); P.y = clamp(P.y + ((wy - P.y) / d) * pull * h, 12, ARENA_H - 12); }
          if (d < 34 + P.r && f.hc <= 0) { hurt(12 * dm.dmg); f.hc = 0.4; }
        },
        draw(f, g) {
          const armed = f.t - f.life >= 0.9, fade = Math.min(1, f.life / 0.5);
          g.globalAlpha = (armed ? 0.8 : 0.35) * fade;
          g.fillStyle = "#07051a";
          g.beginPath(); g.arc(wx, wy, 34, 0, 6.283); g.fill();
          g.strokeStyle = armed ? PINK : WARN;
          g.lineWidth = 2;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(wx, wy, 50 + i * 60 - ((t * 60) % 60), 0, 6.283); g.stroke(); }
          g.globalAlpha = 1;
        },
      });
    }
  },

  // chronos : tu laisses une traînée, et deux secondes plus tard des zones claquent là où tu étais
  echo(e, c) {
    const trail = [];
    hazard(5.5 + c.lvl, {
      rc: 0,
      tick(f, h) {
        f.rc -= h;
        if (f.rc > 0) return;
        f.rc = 0.12;
        trail.push({ x: P.x, y: P.y });
        if (trail.length > 15) { const p = trail.shift(); bossZone(p.x, p.y, 0.55); }
      },
      draw(f, g) {
        g.fillStyle = WARN;
        trail.forEach((p, i) => { g.globalAlpha = 0.5 * (1 - i / trail.length); g.beginPath(); g.arc(p.x, p.y, 3, 0, 6.283); g.fill(); });
        g.globalAlpha = 1;
      },
    });
  },

  // le rival : le sol devient un damier ; une couleur claque, puis l'autre : il faut changer de case à chaque signal
  checker(e, c) {
    const S = 190, flips = c.lvl >= 2 ? 4 : 3, warn = c.lvl >= 2 ? 1.1 : 1.3, step = warn + 0.45, p0 = Math.random() < 0.5 ? 0 : 1, done = {};
    e.mode = "busy";
    e.mt = step;
    hazard(flips * step + 0.1, {
      tick(f) {
        const el = f.t - f.life, k = Math.floor(el / step);
        if (k >= flips || el - k * step < warn || done[k]) return;
        done[k] = true;
        const par = (p0 + k) % 2;
        if ((Math.floor(P.x / S) + Math.floor(P.y / S)) % 2 === par) hurt(15 * dm.dmg);
        SFX.bomb();
      },
      draw(f, g) {
        const el = f.t - f.life, k = Math.floor(el / step);
        if (k >= flips) return;
        const w = el - k * step, fired = w >= warn, par = (p0 + k) % 2;
        g.fillStyle = fired ? PINK : WARN;
        g.globalAlpha = fired ? 0.55 * Math.max(0, 1 - (w - warn) / 0.45) : 0.08 + 0.22 * (w / warn);
        const x0 = Math.floor((P.x - 700) / S), x1 = Math.floor((P.x + 700) / S), y0 = Math.floor((P.y - 500) / S), y1 = Math.floor((P.y + 500) / S);
        for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) if ((((cx + cy) % 2) + 2) % 2 === par) g.fillRect(cx * S, cy * S, S, S);
        g.globalAlpha = 1;
      },
    });
  },
});

Object.assign(BOSS_PHASES, {
  g1: [
    { at: 1, atks: ["ring", "charge", "pound"], cd: 2.6 },
    { at: 0.75, atks: ["sectors", "summon", "spiral"], cd: 2.4 },
    { at: 0.5, atks: ["wall", "sectors", "laser"], cd: 2.2 },
    { at: 0.25, atks: ["shield", "sectors", "mines", "laser", "charge"], cd: 1.8 },
  ],
  g2: [
    { at: 1, atks: ["ring", "fan", "summon"], cd: 2.6 },
    { at: 0.7, atks: ["pylons", "spiral", "fan"], cd: 2.3 },
    { at: 0.4, atks: ["pylons", "laser", "mines", "ring"], cd: 2.0 },
    { at: 0.2, atks: ["pylons", "laser", "wall", "shield"], cd: 1.7 },
  ],
  g3: [
    { at: 1, atks: ["well", "ring", "charge"], cd: 2.6 },
    { at: 0.7, atks: ["well", "follow", "spiral"], cd: 2.3 },
    { at: 0.4, atks: ["well", "laser", "clones"], cd: 2.0 },
    { at: 0.2, atks: ["well", "mines", "wall", "shield"], cd: 1.7 },
  ],
  g4: [
    { at: 1, atks: ["echo", "burst", "pound"], cd: 2.6 },
    { at: 0.7, atks: ["echo", "clones", "wall"], cd: 2.3 },
    { at: 0.4, atks: ["echo", "laser", "follow"], cd: 2.0 },
    { at: 0.2, atks: ["echo", "shield", "mines", "spiral"], cd: 1.7 },
  ],
  g5: [
    { at: 1, atks: ["checker", "fan", "charge"], cd: 2.6 },
    { at: 0.7, atks: ["checker", "laser", "wall"], cd: 2.3 },
    { at: 0.4, atks: ["checker", "clones", "follow", "mines"], cd: 2.0 },
    { at: 0.2, atks: ["checker", "shield", "laser", "wall", "spiral"], cd: 1.7 },
  ],
});

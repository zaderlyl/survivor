"use strict";

/* ---------- Rendu ---------- */
const hud = { time: "", level: "", kills: "", hp: -1, xp: -1, dash: -1, boss: -1 };
const drawHud = () => {
  const tm = fmt(t), lvl = "niv " + level, ks = kills + " tués";
  if (tm !== hud.time) { hud.time = tm; $("#sTime").textContent = tm; }
  if (lvl !== hud.level) { hud.level = lvl; $("#sLevel").textContent = lvl; }
  if (ks !== hud.kills) { hud.kills = ks; $("#sKills").textContent = ks; }
  const hp = Math.round((P.hp / st.maxHp) * 100), xpp = Math.round((xp / need) * 100), ds = Math.round((1 - P.dashCd / (P.dashMax || DASH_CD)) * 100);
  const hpt = Math.ceil(P.hp) + " / " + st.maxHp;
  if (hpt !== hud.hpt) { hud.hpt = hpt; $("#hpTxt").textContent = hpt; }
  const sc = liveScore() + " pts";
  if (sc !== hud.sc) { hud.sc = sc; $("#scoreTxt").textContent = sc; }
  if (hp !== hud.hp) {
    hud.hp = hp;
    $("#hpFill").style.width = hp + "%";
    $("#hpBar").classList.toggle("low", hp <= 30);
    $("#play").classList.toggle("low", hp <= 30 && mode !== "over" && mode !== "win");
  }
  if (xpp !== hud.xp) { hud.xp = xpp; $("#xpFill").style.width = xpp + "%"; }
  if (ds !== hud.dash) { hud.dash = ds; $("#dashFill").style.width = ds + "%"; $("#dashBtn").classList.toggle("ready", ds >= 100); }
  const boss = enemies.find((e) => e.type === "boss");
  const bp = boss ? Math.round((boss.hp / boss.max) * 100) : -1;
  if (bp !== hud.boss) {
    hud.boss = bp;
    $("#bossBar").hidden = bp < 0;
    if (bp >= 0) $("#bossFill").style.width = Math.max(0, bp) + "%";
  }
};

const camPos = () => {
  const vw = cssW / zoom, vh = cssH / zoom;
  const x = vw >= ARENA_W ? ARENA_W / 2 : clamp(cam.x, vw / 2, ARENA_W - vw / 2);
  const y = vh >= ARENA_H ? ARENA_H / 2 : clamp(cam.y, vh / 2, ARENA_H - vh / 2);
  return [x, y, vw, vh];
};

const hash = (i, j) => {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};

// une lame : un losange allongé, tourné dans le sens du mouvement, avec un petit fil gris au centre
const blade = (cx, cy, a, alpha, size) => {
  g.save();
  g.translate(cx + Math.cos(a) * st.orbR, cy + Math.sin(a) * st.orbR);
  g.rotate(a + Math.PI / 2);
  g.globalAlpha = alpha;
  g.fillStyle = LIGHT;
  g.beginPath();
  g.moveTo(0, -11 * size);
  g.lineTo(4.5 * size, 0);
  g.lineTo(0, 11 * size);
  g.lineTo(-4.5 * size, 0);
  g.closePath();
  g.fill();
  if (alpha === 1) {
    g.fillStyle = GREY;
    g.fillRect(-1, -6, 2, 12);
  }
  g.restore();
};

// le damier des bords : un motif dense, puis un motif clairsemé, chacun de pixels de 2 px
let vigA = null, vigB = null;
const dither = (cells) => {
  const c = document.createElement("canvas");
  c.width = c.height = 4;
  const x = c.getContext("2d");
  x.fillStyle = BG;
  cells.forEach((p) => x.fillRect(p[0], p[1], 1, 1));
  return g.createPattern(c, "repeat");
};
const vignette = () => {
  if (!vigA) {
    vigA = dither([[0, 0], [2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [1, 3], [3, 3]]);
    vigB = dither([[0, 0], [2, 2]]);
  }
  const m = new DOMMatrix().scale(2);
  vigA.setTransform(m);
  vigB.setTransform(m);
  const bands = [[0, 26, vigA], [26, 26, vigB]];
  bands.forEach((b) => {
    g.fillStyle = b[2];
    g.fillRect(b[0], b[0], cssW - b[0] * 2, b[1]);
    g.fillRect(b[0], cssH - b[0] - b[1], cssW - b[0] * 2, b[1]);
    g.fillRect(b[0], b[0] + b[1], b[1], cssH - (b[0] + b[1]) * 2);
    g.fillRect(cssW - b[0] - b[1], b[0] + b[1], b[1], cssH - (b[0] + b[1]) * 2);
  });
};

const render = () => {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = BG;
  g.fillRect(0, 0, cv.width, cv.height);
  let [cx, cy, vw, vh] = camPos();
  if (mode === "menu") { cx = ARENA_W / 2; cy = ARENA_H / 2; }
  const s = dpr * zoom;
  const sx = shake > 0 && !calm ? rnd(-shake, shake) : 0, sy = shake > 0 && !calm ? rnd(-shake, shake) : 0;
  g.setTransform(s, 0, 0, s, (cssW / 2 - cx * zoom + sx) * dpr, (cssH / 2 - cy * zoom + sy) * dpr);
  g.imageSmoothingEnabled = false;

  // le sol : dalles de 100 px, quelques marques posées au hasard pour sentir qu'on avance
  const i0 = Math.max(0, Math.floor((cx - vw / 2) / 100)), i1 = Math.min(ARENA_W / 100 - 1, Math.floor((cx + vw / 2) / 100));
  const j0 = Math.max(0, Math.floor((cy - vh / 2) / 100)), j1 = Math.min(ARENA_H / 100 - 1, Math.floor((cy + vh / 2) / 100));
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      g.fillStyle = (i + j) & 1 ? "#121212" : "#101010";
      g.fillRect(i * 100, j * 100, 100, 100);
      const h = hash(i, j), ox = i * 100 + 12 + (h % 70), oy = j * 100 + 12 + ((h >> 8) % 70);
      g.fillStyle = "#1c1c1c";
      if (h % 9 === 0) { g.fillRect(ox - 4, oy - 1, 9, 2); g.fillRect(ox - 1, oy - 4, 2, 9); }
      else if (h % 9 === 1) { g.fillRect(ox, oy, 3, 3); g.fillRect(ox + 10, oy + 4, 3, 3); g.fillRect(ox + 4, oy + 12, 3, 3); }
      else if (h % 9 === 2) { g.fillRect(ox - 5, oy, 11, 2); }
    }
  }
  g.strokeStyle = "#333333";
  g.lineWidth = 4;
  g.strokeRect(0, 0, ARENA_W, ARENA_H);
  g.strokeStyle = DARK;
  g.lineWidth = 6;
  [[0, 0, 1, 1], [ARENA_W, 0, -1, 1], [0, ARENA_H, 1, -1], [ARENA_W, ARENA_H, -1, -1]].forEach((c) => {
    g.beginPath();
    g.moveTo(c[0] + c[2] * 40, c[1]);
    g.lineTo(c[0], c[1]);
    g.lineTo(c[0], c[1] + c[3] * 40);
    g.stroke();
  });

  const inView = (x, y, m) => x > cx - vw / 2 - m && x < cx + vw / 2 + m && y > cy - vh / 2 - m && y < cy + vh / 2 + m;

  // les ondes
  waves.forEach((w) => {
    g.strokeStyle = LIGHT;
    g.lineWidth = 3;
    g.globalAlpha = Math.max(0, w.life / w.t);
    g.beginPath();
    g.arc(w.x, w.y, w.r, 0, 6.283);
    g.stroke();
    g.globalAlpha = 1;
  });

  // les cristaux : de petits losanges qui scintillent
  for (let i = 0; i < gems.length; i++) {
    const gm = gems[i];
    if (!inView(gm.x, gm.y, 10)) continue;
    const bob = calm || gm.pull ? 0 : Math.sin(t * 4 + gm.x * 0.05) * 1.5;
    if (gm.v > 3) blit("gemBig", gm.x, gm.y + bob, 1.4, 0, false, false);
    else blit("gem", gm.x, gm.y + bob, 1, calm ? 0 : Math.floor(t * 3 + gm.x * 0.1) & 1, false, false);
  }

  // les ombres : une fine bande sombre sous chaque personnage, pour poser les images au sol
  g.fillStyle = "#0a0a0a";
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (inView(e.x, e.y, 40)) g.fillRect(Math.round(e.x - e.r * 0.8), Math.round(e.y + e.r * 0.85), Math.round(e.r * 1.6), 3);
  }
  if (mode !== "menu") g.fillRect(Math.round(P.x - 8), Math.round(P.y + 8), 16, 3);

  // les bonus : ils clignotent avant de disparaître
  drops.forEach((d) => {
    if (d.life < 3 && !calm && Math.floor(d.life * 6) % 2) return;
    blit(d.type, d.x, d.y + (calm ? 0 : Math.sin(t * 5 + d.x) * 2), 2, 0, false, false);
  });

  // les zones au sol : un cercle rose pointillé qui se remplit, puis un éclair plein
  zones.forEach((z) => {
    if (!inView(z.x, z.y, z.r + 10)) return;
    g.fillStyle = PINK;
    g.strokeStyle = PINK;
    if (z.fired) {
      g.globalAlpha = 0.6 * Math.max(0, z.boom / 0.18);
      g.beginPath();
      g.arc(z.x, z.y, z.r, 0, 6.283);
      g.fill();
    } else {
      g.lineWidth = 2;
      g.setLineDash([6, 6]);
      g.beginPath();
      g.arc(z.x, z.y, z.r, 0, 6.283);
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 0.22;
      g.beginPath();
      g.arc(z.x, z.y, z.r * (1 - z.t / z.max), 0, 6.283);
      g.fill();
    }
    g.globalAlpha = 1;
  });

  // les lignes de visée des chargeurs : roses, juste avant la charge
  enemies.forEach((e) => {
    if (e.type === "dasher" && e.st === 1 && inView(e.x, e.y, 400)) {
      g.strokeStyle = PINK;
      g.lineWidth = 2;
      g.setLineDash([8, 8]);
      g.beginPath();
      g.moveTo(e.x, e.y);
      g.lineTo(e.x + e.dirx * 260, e.y + e.diry * 260);
      g.stroke();
      g.setLineDash([]);
    }
  });

  // les ennemis : de petites images, qui grandissent à leur apparition
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!inView(e.x, e.y, 60)) continue;
    const d = TYPES[e.type];
    const grow = Math.min(1, e.age / 0.25);
    const flip = e.x > P.x;
    const frame = Math.floor(t * 6 + e.seed) & 1;
    if (grow < 1) g.globalAlpha = 0.3 + 0.7 * grow;
    blit(e.type, e.x, e.y, d.s, mode === "menu" ? Math.floor(performance.now() / 250 + e.seed) & 1 : frame, flip, e.hit > 0);
    g.globalAlpha = 1;
    if (e.type === "boss") {
      g.fillStyle = "#333333";
      g.fillRect(e.x - 30, e.y - e.r - 16, 60, 5);
      g.fillStyle = PINK;
      g.fillRect(e.x - 30, e.y - e.r - 16, 60 * Math.max(0, e.hp / e.max), 5);
    }
  }

  // tes tirs sont blancs, ceux des ennemis roses : tout ce qui est rose te blesse
  g.fillStyle = LIGHT;
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    g.save();
    g.translate(b.x, b.y);
    g.rotate(Math.atan2(b.vy, b.vx));
    g.fillRect(-5, -1.5, 11, 3);
    g.globalAlpha = 0.4;
    g.fillRect(-15, -1, 9, 2);
    g.restore();
  }
  g.globalAlpha = 1;
  g.fillStyle = PINK;
  for (let i = 0; i < ebullets.length; i++) {
    const b = ebullets[i];
    g.beginPath();
    g.arc(b.x, b.y, 4, 0, 6.283);
    g.fill();
  }
  const orbW = weapon("orb");
  if (orbW) {
    // l'anneau que suivent les lames, puis chaque lame avec sa traînée
    g.strokeStyle = "#2a2a2a";
    g.lineWidth = 1;
    g.setLineDash([3, 7]);
    g.beginPath();
    g.arc(P.x, P.y, st.orbR, 0, 6.283);
    g.stroke();
    g.setLineDash([]);
    for (let o = 0; o < orbW.lvl; o++) {
      const a = orbW.angle + (o / orbW.lvl) * 6.283;
      if (!calm) for (let k = 3; k >= 1; k--) blade(P.x, P.y, a - k * 0.16, 0.5 / k, 0.7);
      blade(P.x, P.y, a, 1, 1);
    }
  }

  // les éclats
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    g.globalAlpha = Math.max(0, p.life / p.max);
    g.fillStyle = p.color;
    g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  g.globalAlpha = 1;

  // la personne : des images rémanentes pendant le dash, une pose de marche, rose un instant quand elle est touchée
  ghosts.forEach((q) => blit("player", q.x, q.y, 2, 0, q.face < 0, false, Math.max(0, q.life / 0.2) * 0.45));
  if (mode !== "menu" && !(P.inv > 0 && P.dash <= 0 && !calm && Math.floor(P.inv * 20) % 2 === 0)) {
    blit("player", P.x, P.y, 2, calm ? 0 : Math.floor(P.walk * 8) & 1, P.face < 0, P.flash > 0);
    g.fillStyle = BG;
    g.fillRect(Math.round(P.x - 4 + Math.cos(P.aim) * 2), Math.round(P.y - 5 + Math.sin(P.aim) * 2), 8, 3);
    if (P.muzzle > 0) {
      g.fillStyle = LIGHT;
      g.fillRect(Math.round(P.x + Math.cos(P.aim) * 14 - 2), Math.round(P.y + Math.sin(P.aim) * 14 - 2), 5, 5);
    }
  }

  // les nombres de dégâts
  g.textAlign = "center";
  texts.forEach((q) => {
    g.globalAlpha = Math.min(1, q.life / 0.3);
    g.font = "bold " + q.size + "px 'Courier New', monospace";
    g.fillStyle = BG;
    g.fillText(q.txt, q.x + 1, q.y + 1);
    g.fillStyle = q.color;
    g.fillText(q.txt, q.x, q.y);
  });
  g.globalAlpha = 1;

  // l'écran : bords assombris en damier (sans flou), joystick, série de tués
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  vignette();
  if (joy) {
    g.strokeStyle = "#333333";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(joy.ox, joy.oy, 56, 0, 6.283);
    g.stroke();
    const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy), k = d > 56 ? 56 / d : 1;
    g.globalAlpha = 0.4;
    g.fillStyle = GREY;
    g.beginPath();
    g.arc(joy.ox + dx * k, joy.oy + dy * k, 20, 0, 6.283);
    g.fill();
    g.globalAlpha = 1;
  }
  if (combo >= 5 && (mode === "play" || mode === "levelup" || mode === "pause")) {
    const mu = comboMult();
    g.font = "bold " + (mu >= 3 ? 20 : 16) + "px 'Courier New', monospace";
    g.fillStyle = mu >= 3 ? PINK : LIGHT;
    g.fillText("série " + combo + (mu > 1 ? "  score x" + mu : ""), cssW / 2, 96);
  }
};

// en test (#perf), une page masquée ne reçoit pas requestAnimationFrame : window.__swarmRaf le remplace
const schedule = (f) => (dbg.test && window.__swarmRaf ? window.__swarmRaf(f) : requestAnimationFrame(f));
let perfAcc = 0, perfN = 0, perfTxt = "";
const frame = (now) => {
  raf = schedule(frame);
  const c0 = dbg.perf ? performance.now() : 0;
  const dt = clamp((now - last) / 1000, 0, 1 / 30);
  last = now;
  if (mode === "play") {
    if (freeze > 0) freeze -= dt;
    else update(dt);
    drawHud();
  } else if (mode === "menu") drift(dt);
  render();
  if (dbg.perf) {
    perfAcc += performance.now() - c0;
    if (++perfN >= 30) {
      perfTxt = (perfAcc / perfN).toFixed(1) + " ms · " + enemies.length + " ennemis";
      cv.dataset.perf = perfTxt;
      perfAcc = perfN = 0;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = LIGHT;
    g.font = "12px 'Courier New', monospace";
    g.textAlign = "left";
    g.fillText(perfTxt, 14, cssH - 40);
  }
};

// avec #perf ou #test, l'état est lisible depuis la console : ça sert aux tests automatiques
if (dbg.test) {
  window.__swarm = {
    get P() { return P; }, get enemies() { return enemies; }, get ebullets() { return ebullets; }, get gems() { return gems; },
    get mode() { return mode; }, get t() { return t; }, get level() { return level; }, get kills() { return kills; },
    get st() { return st; }, get lv() { return lv; }, get score() { return liveScore(); }, sprite,
  };
}


"use strict";

/* ---------- Rendu ---------- */
const hud = { time: "", world: "", level: "", kills: "", hp: -1, xp: -1, dash: -1, boss: -1 };
const drawHud = () => {
  const tm = fmt(t), lvl = "niv " + level, ks = kills + " tués", wl = "monde " + (world + 1) + " · " + THEMES[world % 5].name;
  if (wl !== hud.world) { hud.world = wl; $("#sWorld").textContent = wl; }
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
  const oR = orbRadius(weapon("orb")); // le rayon du cercle suit les variantes
  g.translate(cx + Math.cos(a) * oR, cy + Math.sin(a) * oR);
  g.rotate(a + Math.PI / 2);
  g.globalAlpha = alpha;
  if (alpha === 1) { // un halo cyan autour de la lame
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 0.35;
    g.fillStyle = WEAPON_COLOR.orb;
    g.beginPath();
    g.arc(0, 0, 11, 0, 6.283);
    g.fill();
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  }
  g.fillStyle = alpha === 1 ? "#e6fbff" : WEAPON_COLOR.orb;
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
  const th = worldTheme();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = th.bg;
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
      g.fillStyle = (i + j) & 1 ? th.a : th.b;
      g.fillRect(i * 100, j * 100, 100, 100);
      tileDetail(th, hash(i, j), i * 100, j * 100);
    }
  }
  g.strokeStyle = th.edge;
  g.lineWidth = 4;
  g.strokeRect(0, 0, ARENA_W, ARENA_H);
  g.strokeStyle = th.glow;
  g.lineWidth = 6;
  [[0, 0, 1, 1], [ARENA_W, 0, -1, 1], [0, ARENA_H, 1, -1], [ARENA_W, ARENA_H, -1, -1]].forEach((c) => {
    g.beginPath();
    g.moveTo(c[0] + c[2] * 40, c[1]);
    g.lineTo(c[0], c[1]);
    g.lineTo(c[0], c[1] + c[3] * 40);
    g.stroke();
  });

  ambient(th, cx, cy, vw, vh);

  const inView = (x, y, m) => x > cx - vw / 2 - m && x < cx + vw / 2 + m && y > cy - vh / 2 - m && y < cy + vh / 2 + m;

  // les ondes
  waves.forEach((w) => {
    g.strokeStyle = w.color || LIGHT;
    g.lineWidth = w.color ? 4 : 3;
    if (w.color) g.globalCompositeOperation = "lighter"; // un anneau coloré brille
    g.globalAlpha = Math.max(0, w.life / w.t);
    g.beginPath();
    g.arc(w.x, w.y, w.r, 0, 6.283);
    g.stroke();
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  });

  // les coups des armes : arc d'épée, laser, éclair, grenade
  fx.forEach((f) => {
    const al = f.k === "cbeam" ? 1 : Math.max(0, f.life / f.t), col = f.color || heroColor();
    g.globalAlpha = al;
    g.strokeStyle = col;
    g.fillStyle = col;
    if (f.k === "arc") {
      // un arc de couleur qui brille, avec un cœur blanc
      g.globalCompositeOperation = "lighter";
      g.lineWidth = 9 * (f.big || 1);
      g.beginPath();
      g.arc(f.x, f.y, f.r, f.a - f.spread, f.a + f.spread);
      g.stroke();
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "#ffffff";
      g.lineWidth = 3 * (f.big || 1);
      g.beginPath();
      g.arc(f.x, f.y, f.r, f.a - f.spread, f.a + f.spread);
      g.stroke();
    } else if (f.k === "beam" || f.k === "cbeam") {
      g.globalCompositeOperation = "lighter";
      g.lineWidth = (f.w * al + 2) * 1.8;
      g.beginPath();
      g.moveTo(f.x, f.y);
      g.lineTo(f.x + Math.cos(f.a) * f.len, f.y + Math.sin(f.a) * f.len);
      g.stroke();
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "#ffffff";
      g.lineWidth = Math.max(1, (f.w * al + 2) * 0.4);
      g.beginPath();
      g.moveTo(f.x, f.y);
      g.lineTo(f.x + Math.cos(f.a) * f.len, f.y + Math.sin(f.a) * f.len);
      g.stroke();
    } else if (f.k === "bolt") {
      const pts = f.pts.map((p, i) => [p[0] + (i && !calm ? rnd(-3, 3) : 0), p[1] + (i && !calm ? rnd(-3, 3) : 0)]);
      [["lighter", col, 5], ["source-over", "#ffffff", 1.5]].forEach((m) => {
        g.globalCompositeOperation = m[0];
        g.strokeStyle = m[1];
        g.lineWidth = m[2];
        g.beginPath();
        pts.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
        g.stroke();
      });
      g.globalCompositeOperation = "source-over";
    } else if (f.k === "thunder") {
      // l'orbe : un disque entouré d'un anneau qui pulse
      g.globalAlpha = 1;
      g.beginPath();
      g.arc(f.x, f.y, 5, 0, 6.283);
      g.fill();
      g.globalAlpha = 0.5;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(f.x, f.y, calm ? 9 : 8 + 3 * Math.sin(t * 14), 0, 6.283);
      g.stroke();
    } else if (f.k === "tesla") {
      // la bobine : un petit carré surmonté d'un trait
      g.globalAlpha = f.life < 1 && !calm ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
      g.fillRect(f.x - 3, f.y - 2, 6, 6);
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(f.x, f.y - 2);
      g.lineTo(f.x, f.y - 9);
      g.stroke();
    } else if (f.k === "stick") {
      // la grenade collée : elle clignote de plus en plus vite avant d'exploser
      g.globalAlpha = calm || Math.floor(f.life * (4 + 8 * (1 - f.life / f.t)) * 2) % 2 ? 1 : 0.35;
      g.fillRect(f.x - 3, f.y - 3, 6, 6);
    } else if (f.k === "powder") {
      // une ligne de poudre : de petits grains sombres, quelques points qui brillent
      g.globalAlpha = Math.min(1, f.life / 0.5);
      f.pts.forEach((p, i) => {
        g.fillStyle = "#2a2118";
        g.fillRect(p[0] - 3, p[1] - 2, 6, 4);
        if (!calm && (Math.floor(t * 4 + i) % 5 === 0)) { g.fillStyle = col; g.fillRect(p[0] - 1, p[1] - 1, 2, 2); }
      });
    } else if (f.k === "codecol") {
      // une colonne de code qui tombe : une file de petits carrés
      for (let i = 0; i < 8; i++) {
        g.globalAlpha = Math.max(0, 1 - i / 8) * Math.min(1, f.life / 0.3);
        g.fillStyle = i === 0 ? "#ffffff" : col;
        g.fillRect(f.x - 2, f.y - i * 11, 4, 7);
      }
    } else if (f.k === "constellation") {
      // des étoiles reliées par des lignes de lumière
      g.globalCompositeOperation = "lighter";
      g.lineWidth = 4;
      g.beginPath();
      (f.lines || []).forEach((l) => { g.moveTo(f.pts[l[0]][0], f.pts[l[0]][1]); g.lineTo(f.pts[l[1]][0], f.pts[l[1]][1]); });
      g.stroke();
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "#ffffff";
      g.lineWidth = 1.5;
      g.beginPath();
      (f.lines || []).forEach((l) => { g.moveTo(f.pts[l[0]][0], f.pts[l[0]][1]); g.lineTo(f.pts[l[1]][0], f.pts[l[1]][1]); });
      g.stroke();
      g.fillStyle = "#ffffff";
      f.pts.forEach((p) => g.fillRect(p[0] - 3, p[1] - 3, 6, 6));
    } else if (f.k === "aiface") {
      // l'IA : un grand visage de lumière qui flotte
      const pulse = calm ? 0 : Math.sin(t * 6) * 2;
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.3;
      g.beginPath();
      g.arc(f.x, f.y, 26 + pulse, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 0.9;
      g.strokeStyle = col;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(f.x, f.y, 18, 0, 6.283);
      g.stroke();
      g.fillStyle = "#ffffff";
      g.fillRect(f.x - 9, f.y - 6, 5, 5);
      g.fillRect(f.x + 4, f.y - 6, 5, 5);
      g.fillRect(f.x - 7, f.y + 6, 14, 2);
    } else if (f.k === "screendark") {
      // l'écran qui s'assombrit
      g.fillStyle = "#000000";
      g.globalAlpha = Math.min(0.5, f.life * 0.6, (f.t - f.life) * 3);
      g.fillRect(cx - vw / 2, cy - vh / 2, vw, vh);
    } else if (f.k === "sun") {
      // un soleil : un grand disque de lumière et un cœur blanc
      const r = f.r || 10;
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.35;
      g.beginPath();
      g.arc(f.x, f.y, r, 0, 6.283);
      g.fill();
      g.globalAlpha = 0.5;
      g.beginPath();
      g.arc(f.x, f.y, r * 0.6, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 0.9;
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(f.x, f.y, r * 0.25, 0, 6.283);
      g.fill();
    } else if (f.k === "tomb") {
      // une pierre tombale
      g.globalAlpha = f.life < 1 && !calm ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
      g.fillRect(f.x - 5, f.y - 10, 10, 14);
      g.fillStyle = "#0b1410";
      g.fillRect(f.x - 1, f.y - 8, 2, 8);
      g.fillRect(f.x - 3, f.y - 5, 6, 2);
    } else if (f.k === "hammer") {
      // un marteau qui tourne : un bloc et un manche
      g.save();
      g.translate(f.x, f.y);
      g.rotate(f.spin || 0);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.4;
      g.beginPath();
      g.arc(0, 0, 14, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.fillRect(-9, -6, 18, 12);
      g.fillStyle = "#ffffff";
      g.fillRect(-1, 6, 2, 12);
      g.fillRect(-7, -4, 14, 3);
      g.restore();
    } else if (f.k === "swordring" || f.k === "swordwall") {
      // un cercle ou un mur d'épées géantes
      (f.sw || []).forEach((s) => drawSword(s.x, s.y, s.a, col, 1.3));
    } else if (f.k === "spectre") {
      blit(heroName(), f.x, f.y, ART[heroName()].s || 2, calm ? 0 : Math.floor(t * 10) & 1, Math.cos(f.a) < 0, false, 0.55, heroLook());
    } else if (f.k === "dragon") {
      // un dragon d'acier : une file d'épées qui suivent la tête, de plus en plus petites
      for (let i = f.segs.length - 1; i >= 0; i--) {
        const sg = f.segs[i], nx = f.segs[Math.max(0, i - 1)];
        drawSword(sg[0], sg[1], Math.atan2(nx[1] - sg[1], nx[0] - sg[0]) || 0, col, i === 0 ? 2.4 : Math.max(0.9, 1.9 - i * 0.025));
      }
      if (f.segs[0]) { g.fillStyle = "#ffffff"; g.fillRect(f.segs[0][0] - 3, f.segs[0][1] - 3, 3, 3); g.fillRect(f.segs[0][0] + 1, f.segs[0][1] - 3, 3, 3); }
    } else if (f.k === "multibeam") {
      // plusieurs rayons qui tournent autour de toi
      for (let b = 0; b < f.n; b++) {
        const a = f.ang + (b / f.n) * 6.283, ca = Math.cos(a), sa = Math.sin(a), x0 = P.x + ca * (f.r0 || 0), y0 = P.y + sa * (f.r0 || 0);
        g.globalCompositeOperation = "lighter";
        g.lineWidth = f.bw || 9;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(P.x + ca * f.L, P.y + sa * f.L);
        g.stroke();
        g.globalCompositeOperation = "source-over";
        g.strokeStyle = "#ffffff";
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(P.x + ca * f.L, P.y + sa * f.L);
        g.stroke();
        g.strokeStyle = col;
      }
    } else if (f.k === "hturret") {
      // une tourelle lourde : un gros socle et un gros canon
      g.globalAlpha = f.life < 1 && !calm ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
      g.fillRect(f.x - 11, f.y - 5, 22, 10);
      g.fillRect(f.x - 7, f.y - 10, 14, 6);
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(f.x, f.y - 7);
      g.lineTo(f.x + Math.cos(f.a || 0) * 20, f.y - 7 + Math.sin(f.a || 0) * 20);
      g.stroke();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.3;
      g.beginPath();
      g.arc(f.x, f.y - 6, 16, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
    } else if (f.k === "worm") {
      // un ver de code : une file de carrés qui s'estompent
      for (let i = f.segs.length - 1; i >= 0; i--) {
        g.globalAlpha = Math.max(0.15, 1 - i / f.segs.length) * Math.min(1, f.life / 0.4);
        g.fillStyle = i === 0 ? "#ffffff" : col;
        const s2 = i === 0 ? 6 : 5 - (i / f.segs.length) * 2;
        g.fillRect(f.segs[i][0] - s2 / 2, f.segs[i][1] - s2 / 2, s2, s2);
      }
    } else if (f.k === "tline") {
      // une ligne qui annonce un tir
      g.globalAlpha = 0.6;
      g.lineWidth = 2;
      g.setLineDash([6, 6]);
      g.beginPath();
      g.moveTo(f.x1, f.y1);
      g.lineTo(f.x2, f.y2);
      g.stroke();
      g.setLineDash([]);
    } else if (f.k === "sentinel") {
      // une sentinelle : un socle et un canon tourné vers la cible
      g.globalAlpha = f.life < 1 && !calm ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
      g.fillRect(f.x - 6, f.y - 3, 12, 6);
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(f.x, f.y - 2);
      g.lineTo(f.x + Math.cos(f.a || 0) * 12, f.y - 2 + Math.sin(f.a || 0) * 12);
      g.stroke();
    } else if (f.k === "bhaz") {
      g.globalAlpha = 1;
      f.draw(f, g);
    } else if (f.k === "screenflash") {
      // un éclair qui couvre tout l'écran
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = al * 0.4;
      g.fillRect(cx - vw / 2, cy - vh / 2, vw, vh);
      g.globalCompositeOperation = "source-over";
    } else if (f.k === "trap") {
      // un piège à ours : un socle hérissé de dents
      g.globalAlpha = f.arm > 0 ? 0.4 : 1;
      g.fillRect(f.x - 6, f.y - 1, 12, 3);
      for (let i = 0; i < 4; i++) g.fillRect(f.x - 6 + i * 4, f.y - 4, 2, 3);
    } else if (f.k === "clone") {
      blit(heroName(), f.x, f.y, ART[heroName()].s || 2, calm ? 0 : Math.floor(t * 8) & 1, false, false, 0.45 * Math.min(1, f.life / 0.4), heroLook());
    } else if (f.k === "singularity") {
      // une singularité : un noyau sombre, un anneau qui se resserre
      const k2 = f.life / f.t;
      g.fillStyle = "#14081f";
      g.beginPath();
      g.arc(f.x, f.y, 9, 0, 6.283);
      g.fill();
      g.globalAlpha = 0.8;
      g.lineWidth = 3;
      g.globalCompositeOperation = "lighter";
      g.beginPath();
      g.arc(f.x, f.y, 12 + f.R * 0.5 * k2, 0, 6.283);
      g.stroke();
      g.globalCompositeOperation = "source-over";
    } else if (f.k === "tbomb") {
      // une bombe à retardement : un cube qui clignote, un anneau qui se resserre
      const k2 = f.life / f.t;
      g.globalAlpha = calm ? 1 : (Math.floor(f.life * (2 + 10 * (1 - k2))) % 2 ? 1 : 0.35);
      g.fillRect(f.x - 5, f.y - 5, 10, 10);
      g.fillStyle = "#ffffff";
      g.fillRect(f.x - 2, f.y - 2, 4, 4);
      g.globalAlpha = 0.5;
      g.lineWidth = 2;
      g.setLineDash([5, 5]);
      g.beginPath();
      g.arc(f.x, f.y, f.R * (0.3 + 0.7 * k2), 0, 6.283);
      g.stroke();
      g.setLineDash([]);
    } else if (f.k === "orb2") {
      // un globe de foudre : un halo, un cœur blanc
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.45;
      g.beginPath();
      g.arc(f.x, f.y, (f.sz || 6) * 1.8, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(f.x, f.y, (f.sz || 6) * 0.6, 0, 6.283);
      g.fill();
    } else if (f.k === "pwave") {
      // une large bande de lumière qui avance
      const px = -Math.sin(f.a) * f.w, py = Math.cos(f.a) * f.w;
      g.globalCompositeOperation = "lighter";
      g.lineWidth = 18;
      g.beginPath();
      g.moveTo(f.x - px, f.y - py);
      g.lineTo(f.x + px, f.y + py);
      g.stroke();
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "#ffffff";
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(f.x - px, f.y - py);
      g.lineTo(f.x + px, f.y + py);
      g.stroke();
    } else if (f.k === "pillar") {
      // une colonne de lumière qui tombe du ciel
      const fade = Math.min(1, f.life / 0.4);
      g.globalAlpha = 0.35 * fade;
      g.globalCompositeOperation = "lighter";
      g.fillRect(f.x - f.R * 0.45, f.y - 320, f.R * 0.9, 320);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 0.9 * fade;
      g.fillStyle = "#ffffff";
      g.fillRect(f.x - 2, f.y - 320, 4, 320);
      g.strokeStyle = col;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(f.x, f.y, f.R, 0, 6.283);
      g.stroke();
    } else if (f.k === "pylon") {
      // un pylône : une colonne avec une lueur au sommet
      g.globalAlpha = f.life < 1 && !calm ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
      g.fillRect(f.x - 3, f.y - 14, 6, 16);
      g.fillRect(f.x - 6, f.y + 1, 12, 3);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.5;
      g.beginPath();
      g.arc(f.x, f.y - 16, calm ? 6 : 5 + 2 * Math.sin(t * 12), 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
    } else if (f.k === "firewall") {
      // le pare-feu : un disque et un anneau de flammes qui tourne
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.09;
      g.beginPath();
      g.arc(f.x, f.y, f.R, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = f.life < 0.6 && !calm ? 0.4 + 0.4 * Math.sin(t * 20) : 0.85;
      g.lineWidth = 3;
      g.setLineDash([8, 6]);
      g.lineDashOffset = calm ? 0 : -t * 40;
      g.beginPath();
      g.arc(f.x, f.y, f.R, 0, 6.283);
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
    } else if (f.k === "nova") {
      g.globalAlpha = Math.max(0, f.life / f.t);
      g.globalCompositeOperation = "lighter";
      g.lineWidth = 9;
      g.beginPath();
      g.arc(f.x, f.y, f.r || 1, 0, 6.283);
      g.stroke();
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "#ffffff";
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(f.x, f.y, f.r || 1, 0, 6.283);
      g.stroke();
    } else if (f.k === "sword") {
      // une épée qui tombe du ciel pointe en bas, puis reste plantée et s'efface
      const fall = f.landed ? 0 : Math.max(0, (f.life - 1.15) / 0.35), tip = f.y - 4 - 260 * fall;
      g.globalAlpha = f.landed ? Math.min(1, f.life / 0.5) : 1;
      g.strokeStyle = col;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(f.x, tip - 24);
      g.lineTo(f.x, tip);
      g.stroke();
      g.strokeStyle = "#ffffff";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(f.x, tip - 22);
      g.lineTo(f.x, tip - 2);
      g.stroke();
      g.fillStyle = "#ffffff";
      g.fillRect(f.x - 5, tip - 26, 10, 3);
    } else if (f.k === "rotbeam") {
      g.globalAlpha = 0.9;
      g.lineWidth = 5;
      for (let b = 0; b < f.n; b++) {
        const a = f.ang + b * Math.PI;
        g.beginPath();
        g.moveTo(P.x, P.y);
        g.lineTo(P.x + Math.cos(a) * f.L, P.y + Math.sin(a) * f.L);
        g.stroke();
      }
    } else if (f.k === "decoy") {
      blit(heroName(), f.x, f.y, ART[heroName()].s || 2, calm ? 0 : Math.floor(t * 8) & 1, false, false, 0.5, heroLook());
    } else if (f.k === "cloud") {
      g.globalAlpha = 0.12;
      g.beginPath();
      g.arc(f.x, f.y, f.R, 0, 6.283);
      g.fill();
      g.globalAlpha = f.life < 1 && !calm ? 0.3 + 0.3 * Math.sin(t * 20) : 0.45;
      g.lineWidth = 2;
      g.setLineDash([3, 6]);
      g.stroke();
      g.setLineDash([]);
    } else if (f.k === "aim") {
      // la ligne de visée du rail pendant sa charge
      g.globalAlpha = 0.5;
      g.lineWidth = 1;
      g.setLineDash([4, 6]);
      g.beginPath();
      g.moveTo(P.x, P.y);
      g.lineTo(P.x + Math.cos(f.a) * f.len, P.y + Math.sin(f.a) * f.len);
      g.stroke();
      g.setLineDash([]);
    } else if (f.k === "wall") {
      g.globalAlpha = f.life < 1 && !calm ? 0.4 + 0.4 * Math.sin(t * 20) : 0.9;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(f.x1, f.y1);
      g.lineTo(f.x2, f.y2);
      g.stroke();
    } else if (f.k === "blade") {
      g.globalAlpha = 1;
      g.save();
      g.translate(f.x, f.y);
      g.rotate(f.spin);
      g.fillRect(-7, -2, 14, 4);
      g.fillRect(-2, -7, 4, 14);
      g.restore();
    } else if (f.k === "spin") {
      // deux arcs qui tournent autour de toi
      g.globalAlpha = 0.9;
      g.lineWidth = 5;
      const a0 = t * 18;
      for (let k = 0; k < 2; k++) {
        g.beginPath();
        g.arc(P.x, P.y, f.R, a0 + k * 3.1416, a0 + k * 3.1416 + 1.6);
        g.stroke();
      }
    } else if (f.k === "turret") {
      g.globalAlpha = f.life < 1 && !calm ? 0.5 + 0.5 * Math.sin(t * 20) : 1;
      g.fillRect(f.x - 4, f.y - 4, 8, 8);
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(f.x, f.y);
      g.lineTo(f.x + Math.cos(f.a || 0) * 9, f.y + Math.sin(f.a || 0) * 9);
      g.stroke();
    } else if (f.k === "shell") {
      // le cercle où l'obus va retomber, qui se referme
      g.globalAlpha = 0.5;
      g.lineWidth = 2;
      g.setLineDash([3, 5]);
      g.beginPath();
      g.arc(f.tx, f.ty, f.R * (0.4 + 0.6 * (1 - al)), 0, 6.283);
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 1;
      g.fillRect(f.tx - 2, f.ty - 2 - 140 * al, 4, 4);
    } else if (f.k === "mine") {
      const mc = f.color || WEAPON_COLOR.mine;
      // une mine : un carré jaune, qui clignote une fois armée, avec un halo
      g.strokeStyle = mc;
      const on = f.arm > 0 ? 0.4 : (calm ? 1 : 0.6 + 0.4 * Math.sin(t * 8));
      g.globalAlpha = on;
      g.lineWidth = 2;
      g.strokeRect(f.x - 4, f.y - 4, 8, 8);
      if (f.arm <= 0) {
        g.fillStyle = mc;
        g.fillRect(f.x - 1.5, f.y - 1.5, 3, 3);
        g.globalCompositeOperation = "lighter";
        g.globalAlpha = on * 0.3;
        g.beginPath();
        g.arc(f.x, f.y, 9, 0, 6.283);
        g.fill();
        g.globalCompositeOperation = "source-over";
      }
    } else if (f.k === "nade") {
      g.globalAlpha = 1;
      g.fillRect(f.x - 3, f.y - 3, 6, 6);
    }
    g.globalAlpha = 1;
  });

  // les cristaux : de petits losanges qui scintillent
  for (let i = 0; i < gems.length; i++) {
    const gm = gems[i];
    if (!inView(gm.x, gm.y, 10)) continue;
    const bob = calm || gm.pull ? 0 : Math.sin(t * 4 + gm.x * 0.05) * 1.5;
    if (gm.v > 3) blit("gemBig", gm.x, gm.y + bob, gm.v >= 12 ? 2.2 : 1.4, 0, false, false);
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
    const art = e.art || (ART[e.type + e.skin] ? e.type + e.skin : e.type); // le dessin propre au monde, sinon l'ancien
    blit(art, e.x, e.y, ART[art].s || d.s, mode === "menu" ? Math.floor(performance.now() / 250 + e.seed) & 1 : frame, flip, e.hit > 0);
    g.globalAlpha = 1;
    if (e.type === "boss") {
      if (e.shield > 0) {
        g.strokeStyle = "#35f2ff";
        g.globalAlpha = 0.5 + 0.3 * Math.sin(t * 8);
        g.lineWidth = 3 + 5 * (e.shield / e.shMax);
        g.beginPath();
        g.arc(e.x, e.y, e.r + 10, 0, 6.283);
        g.stroke();
        g.globalAlpha = 1;
      }
      if (e.invT > 0) {
        g.strokeStyle = "#ffffff";
        g.globalAlpha = 0.5 + 0.4 * Math.sin(t * 30);
        g.lineWidth = 3;
        g.beginPath();
        g.arc(e.x, e.y, e.r + 14, 0, 6.283);
        g.stroke();
        g.globalAlpha = 1;
      }
      if (e.tele === 1) {
        // la charge : une ligne rose annonce la direction
        g.strokeStyle = PINK;
        g.globalAlpha = 0.6;
        g.lineWidth = 3;
        g.setLineDash([6, 6]);
        g.beginPath();
        g.moveTo(e.x, e.y);
        g.lineTo(e.x + e.dirx * 420, e.y + e.diry * 420);
        g.stroke();
        g.setLineDash([]);
        g.globalAlpha = 1;
      } else if (e.tele === 2) {
        // la téléportation : un cercle qui se resserre
        g.strokeStyle = PINK;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(e.x, e.y, e.r + 10 + 20 * Math.max(0, e.mt), 0, 6.283);
        g.stroke();
      }
      g.fillStyle = "#333333";
      g.fillRect(e.x - 30, e.y - e.r - 16, 60, 5);
      g.fillStyle = PINK;
      g.fillRect(e.x - 30, e.y - e.r - 16, 60 * Math.max(0, e.hp / e.max), 5);
    }
  }

  // les états posés sur les ennemis : infection (pixels verts), marque (réticule), piratage (anneau pulsant)
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.virus > 0 && !calm) {
      g.fillStyle = WEAPON_COLOR.virus;
      for (let k = 0; k < 3; k++) g.fillRect(Math.round(e.x + rnd(-e.r, e.r)), Math.round(e.y + rnd(-e.r, e.r)), 2, 2);
    }
    if (e.marked) {
      const pulse = calm ? 1 : 0.7 + 0.3 * Math.sin(t * 10);
      g.strokeStyle = WEAPON_COLOR.mark;
      g.lineWidth = 2;
      g.globalAlpha = pulse;
      g.beginPath();
      g.arc(e.x, e.y, e.r + 6, 0, 6.283);
      g.moveTo(e.x - e.r - 10, e.y); g.lineTo(e.x - e.r + 2, e.y);
      g.moveTo(e.x + e.r - 2, e.y); g.lineTo(e.x + e.r + 10, e.y);
      g.moveTo(e.x, e.y - e.r - 10); g.lineTo(e.x, e.y - e.r + 2);
      g.moveTo(e.x, e.y + e.r - 2); g.lineTo(e.x, e.y + e.r + 10);
      g.stroke();
      g.globalAlpha = 1;
    }
    if (e.charge) { // un ennemi chargé : un anneau électrique qui pulse
      g.strokeStyle = WEAPON_COLOR.livingbattery;
      g.lineWidth = 2;
      g.globalAlpha = calm ? 0.8 : 0.5 + 0.4 * Math.sin(t * 16);
      g.beginPath();
      g.arc(e.x, e.y, e.r + 5, 0, 6.283);
      g.stroke();
      g.globalAlpha = 1;
    }
    if (e.ransom) { // un cadenas rose au-dessus de l'ennemi chiffré
      g.strokeStyle = WEAPON_COLOR.ransom;
      g.fillStyle = WEAPON_COLOR.ransom;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(e.x, e.y - e.r - 10, 4, Math.PI, 0);
      g.stroke();
      g.fillRect(Math.round(e.x - 5), Math.round(e.y - e.r - 10), 10, 7);
    }
    if (e.lbomb) { // une bombe logique : un petit carré qui clignote de plus en plus vite
      g.fillStyle = WEAPON_COLOR.logicbomb;
      g.globalAlpha = calm ? 1 : (Math.floor(e.lbomb.t * (3 + 8 / Math.max(0.3, e.lbomb.t))) % 2 ? 1 : 0.3);
      g.fillRect(Math.round(e.x - 3), Math.round(e.y - e.r - 11), 6, 6);
      g.globalAlpha = 1;
    }
    if (e.poison > 0 && !calm) { // du poison qui goutte
      g.fillStyle = WEAPON_COLOR.poisondarts;
      g.fillRect(Math.round(e.x + rnd(-e.r, e.r)), Math.round(e.y + rnd(0, e.r + 3)), 2, 3);
    }
    if (e.hacked > 0) {
      g.strokeStyle = WEAPON_COLOR.hack;
      g.lineWidth = 2;
      g.globalAlpha = calm ? 0.8 : 0.5 + 0.4 * Math.sin(t * 14);
      g.setLineDash([3, 3]);
      g.beginPath();
      g.arc(e.x, e.y, e.r + 4, 0, 6.283);
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 1;
    }
  }

  // tes tirs sont blancs, ceux des ennemis roses : tout ce qui est rose te blesse
  const hc = heroColor();
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    g.fillStyle = b.color || hc;
    g.save();
    g.translate(b.x, b.y);
    g.rotate(Math.atan2(b.vy, b.vx));
    const sz = b.size || 1;
    if (b.star) { g.rotate(-Math.atan2(b.vy, b.vx) + t * 20); g.fillRect(-6, -1.5, 12, 3); g.fillRect(-1.5, -6, 3, 12); g.fillStyle = "#ffffff"; g.fillRect(-2, -0.7, 4, 1.4); g.restore(); continue; }
    g.fillRect(-5 * sz, -1.5 * sz, 11 * sz, 3 * sz);
    g.fillStyle = "#ffffff"; // le cœur du tir est blanc
    g.fillRect(-3 * sz, -0.6 * sz, 7 * sz, 1.2 * sz);
    g.fillStyle = b.color || hc;
    g.globalAlpha = 0.4;
    g.fillRect(-15 * sz, -1 * sz, 9 * sz, 2 * sz);
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
    g.arc(P.x, P.y, orbRadius(orbW), 0, 6.283);
    g.stroke();
    g.setLineDash([]);
    const orbN = orbCount(orbW);
    for (let o = 0; o < orbN; o++) {
      const a = orbW.angle + (o / orbN) * 6.283;
      if (!calm) for (let k = 3; k >= 1; k--) blade(P.x, P.y, a - k * 0.16, 0.5 / k, 0.7);
      blade(P.x, P.y, a, 1, 1);
    }
  }

  // le champ de feu : un cercle en pointillés autour de toi
  const flameW = weapon("flame");
  if (flameW) {
    // la zone de feu : un disque rougeoyant et un anneau de braises
    const fr = flameRadius(flameW);
    g.globalCompositeOperation = "lighter";
    g.fillStyle = WEAPON_COLOR.flame;
    g.globalAlpha = calm ? 0.07 : 0.05 + 0.025 * Math.sin(t * 6);
    g.beginPath();
    g.arc(P.x, P.y, fr, 0, 6.283);
    g.fill();
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = WEAPON_COLOR.flame;
    g.globalAlpha = 0.6;
    g.lineWidth = 2;
    g.setLineDash([2, 6]);
    g.beginPath();
    g.arc(P.x, P.y, fr, 0, 6.283);
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
  }
  // l'épée spectrale : une lame fantôme qui tourne autour de toi et se jette sur les ennemis
  const specW = weapon("spectral");
  if (specW && specW.sw) {
    specW.sw.forEach((s) => {
      if (s.x === undefined) return;
      g.save();
      g.translate(s.x, s.y);
      g.rotate(s.a + Math.PI / 2);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.4;
      g.fillStyle = WEAPON_COLOR.spectral;
      g.beginPath();
      g.arc(0, 0, 10, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 0.9;
      g.fillStyle = WEAPON_COLOR.spectral;
      g.fillRect(-2, -13, 4, 20);
      g.fillStyle = "#ffffff";
      g.fillRect(-1, -12, 2, 15);
      g.fillRect(-5, 5, 10, 2);
      g.restore();
    });
    g.globalAlpha = 1;
  }
  // l'ombre : un double sombre qui te suit et attaque
  const shW = weapon("shadow");
  if (shW && shW.sh) {
    shW.sh.forEach((s) => { if (s.x !== undefined) blit(heroName(), s.x, s.y, ART[heroName()].s || 2, calm ? 0 : Math.floor(t * 6) & 1, P.face < 0, false, 0.35, "000"); });
  }
  // la bobine mobile : une bobine qui te suit
  const mcW = weapon("mobilecoil");
  if (mcW && mcW.co) {
    mcW.co.forEach((c) => {
      if (c.x === undefined) return;
      g.fillStyle = WEAPON_COLOR.mobilecoil;
      g.fillRect(c.x - 3, c.y - 2, 6, 6);
      g.fillRect(c.x - 1, c.y - 10, 2, 8);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.5;
      g.beginPath();
      g.arc(c.x, c.y - 11, calm ? 5 : 4 + 2 * Math.sin(t * 12), 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
    });
  }
  // les drones : de petits carrés qui tournent autour de toi
  const droneW = weapon("drone");
  if (droneW) {
    const droneN = droneCount(droneW);
    for (let o = 0; o < droneN; o++) {
      const a = droneW.angle + (o / droneN) * 6.283, dx = P.x + Math.cos(a) * 38, dy = P.y + Math.sin(a) * 38;
      g.globalCompositeOperation = "lighter"; // un halo bleu
      g.globalAlpha = 0.4;
      g.fillStyle = WEAPON_COLOR.drone;
      g.beginPath();
      g.arc(dx, dy, 8, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.fillStyle = "#cfe3ff";
      g.fillRect(dx - 3, dy - 3, 6, 6);
      g.fillStyle = WEAPON_COLOR.drone;
      g.fillRect(dx - 1, dy - 1, 2, 2);
    }
  }

  // les éclats
  // deux passes : les éclats ordinaires, puis ceux qui brillent, en addition de lumière
  for (let pass = 0; pass < 2; pass++) {
    g.globalCompositeOperation = pass ? "lighter" : "source-over";
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!!p.glow !== !!pass) continue;
      g.globalAlpha = Math.max(0, p.life / p.max) * (p.round ? 0.55 : 1);
      g.fillStyle = p.color;
      if (p.round) { g.beginPath(); g.arc(p.x, p.y, p.size * (1.2 - p.life / p.max * 0.4), 0, 6.283); g.fill(); }
      else g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;

  // la personne : des images rémanentes pendant le dash, une pose de marche, rose un instant quand elle est touchée
  ghosts.forEach((q) => blit(heroName(), q.x, q.y, ART[heroName()].s || 2, 0, q.face < 0, false, Math.max(0, q.life / 0.2) * 0.45, heroLook()));
  if (mode !== "menu" && !(P.inv > 0 && P.dash <= 0 && !calm && Math.floor(P.inv * 20) % 2 === 0)) {
    blit(heroName(), P.x, P.y, ART[heroName()].s || 2, calm ? 0 : Math.floor(P.walk * 8) & 1, P.face < 0, P.flash > 0, undefined, heroLook());
    const shW = weapon("elecshield");
    if (shW && shW.sh > 0) { // le bouclier électrique
      g.strokeStyle = WEAPON_COLOR.elecshield;
      g.lineWidth = 3;
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = (calm ? 0.45 : 0.35 + 0.15 * Math.sin(t * 9)) * Math.min(1, shW.sh / shW.cap + 0.3);
      g.beginPath();
      g.arc(P.x, P.y, 24, 0, 6.283);
      g.stroke();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
    }
    if (st.hasteT > 0) { // le bonus de cadence : un anneau qui tourne
      g.strokeStyle = WEAPON_COLOR.download;
      g.lineWidth = 2;
      g.globalAlpha = 0.6;
      g.setLineDash([3, 5]);
      g.lineDashOffset = calm ? 0 : -t * 30;
      g.beginPath();
      g.arc(P.x, P.y, 20, 0, 6.283);
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      g.globalAlpha = 1;
    }
    if (st.legends > 0) {
      // l'aura : un anneau en pointillés par carte légendaire prise
      const gc = ART[heroName()].pal ? ART[heroName()].pal.t : LIGHT;
      g.strokeStyle = gc;
      g.lineWidth = 1.5;
      g.setLineDash([4, 6]);
      for (let i = 0; i < Math.min(st.legends, 6); i++) {
        g.globalAlpha = calm ? 0.35 : 0.25 + 0.15 * Math.sin(t * 3 + i);
        g.lineDashOffset = calm ? 0 : -t * 20 * (i % 2 ? 1 : -1);
        g.beginPath();
        g.arc(P.x, P.y, 15 + 4 * i, 0, 6.283);
        g.stroke();
      }
      g.setLineDash([]);
      g.lineDashOffset = 0;
      g.globalAlpha = 1;
    }
    if (heroName() === "player") { // l'ancien dessin avait sa visière peinte par-dessus
      g.fillStyle = BG;
      g.fillRect(Math.round(P.x - 4 + Math.cos(P.aim) * 2), Math.round(P.y - 5 + Math.sin(P.aim) * 2), 8, 3);
    }
    if (P.muzzle > 0) {
      const mx = P.x + Math.cos(P.aim) * 14, my = P.y + Math.sin(P.aim) * 14;
      g.fillStyle = heroColor();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.5;
      g.beginPath();
      g.arc(mx, my, 9, 0, 6.283);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.fillStyle = "#ffffff";
      g.fillRect(Math.round(mx - 2), Math.round(my - 2), 5, 5);
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


"use strict";

/* ---------- Le visuel des six armes universelles ---------- */
/*
  Lames, onde, mines, drone, champ de feu, éclair : ce fichier ne contient que ce qu'on voit, jamais les dégâts.
  - les fonctions « draw... » sont appelées par rendu.js à chaque image ;
  - les fonctions « ...Fx » créent un effet qui se dessine lui-même (voir le type "custom" dans rendu.js).
  Les boosts se voient : plus de lames = plus d'épées, plus de dégâts = épées plus grandes, plus de vitesse = traînée plus longue, etc.
*/

const lueur = (dessiner) => {
  g.globalCompositeOperation = "lighter";
  dessiner();
  g.globalCompositeOperation = "source-over";
};
// éclaircit (k > 0) ou assombrit (k < 0) une couleur « #rrggbb »
const teinte = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return "rgb(" + c.map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)).join(",") + ")";
};
// 0 → 1 → 1, mais qui ralentit en arrivant (pour une onde qui s'élargit vite puis s'apaise)
const ralenti = (p) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);

/* ---------- Lames : de vraies épées qui tournent, avec un arc de coupe lumineux ---------- */

// une épée, centrée sur sa poignée ; la pointe est vers le haut (-y) avant rotation
const dessinerEpee = (k, couleur, doree) => {
  const acier = doree ? "#fff3c4" : "#e6fbff", ombre = doree ? "#e0b050" : "#8fb4c6";
  // la lame
  g.fillStyle = acier;
  g.beginPath();
  g.moveTo(0, -17 * k);
  g.lineTo(3.2 * k, -12 * k);
  g.lineTo(3.2 * k, 5 * k);
  g.lineTo(-3.2 * k, 5 * k);
  g.lineTo(-3.2 * k, -12 * k);
  g.closePath();
  g.fill();
  // la moitié ombrée, la gorge au milieu, le fil coloré
  g.fillStyle = ombre;
  g.beginPath();
  g.moveTo(0, -17 * k);
  g.lineTo(3.2 * k, -12 * k);
  g.lineTo(3.2 * k, 5 * k);
  g.lineTo(0, 5 * k);
  g.closePath();
  g.fill();
  g.fillStyle = GREY;
  g.fillRect(-0.5 * k, -11 * k, k, 14 * k);
  g.strokeStyle = couleur;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-3.2 * k, 5 * k);
  g.lineTo(-3.2 * k, -12 * k);
  g.lineTo(0, -17 * k);
  g.stroke();
  // la garde, la poignée, le pommeau
  g.fillStyle = "#ffcf5a";
  g.fillRect(-6.5 * k, 5 * k, 13 * k, 2.6 * k);
  g.fillStyle = "#b8862a";
  g.fillRect(-6.5 * k, 5 * k, 2 * k, 2.6 * k);
  g.fillRect(4.5 * k, 5 * k, 2 * k, 2.6 * k);
  g.fillStyle = "#5a3a2a";
  g.fillRect(-1.3 * k, 7.6 * k, 2.6 * k, 5 * k);
  g.fillStyle = "#ffcf5a";
  g.fillRect(-2.2 * k, 12.6 * k, 4.4 * k, 2.4 * k);
};

// l'arc de coupe laissé derrière une épée : trois croissants pleins, du plus long (sombre) au plus court (clair)
const drawSwish = (a, R, longueur, couleur, k) => {
  const paliers = [[1, 0.45, 6], [0.62, 0.8, 5], [0.3, 1, 3]];
  paliers.forEach((p, i) => {
    g.globalAlpha = 1;
    g.fillStyle = i === 2 ? "#ffffff" : teinte(couleur, i === 0 ? -0.3 : 0);
    croissant(P.x, P.y, R, a - longueur * p[0], a, p[2] * k, 12);
    g.fill();
  });
};

const drawBlades = (w) => {
  const R = orbRadius(w), n = orbCount(w), legende = !!w.legend;
  const k = 1 + Math.min(0.5, (w.dm || 0) * 0.15); // plus de dégâts : des épées plus grandes
  const longueur = 0.4 + Math.min(0.5, (w.spin || 0) * 0.25); // plus de vitesse : une traînée plus longue
  const couleur = legende ? "#ffd86b" : WEAPON_COLOR.orb;
  // le cercle que suivent les épées : un sillon discret
  g.strokeStyle = "#2a2a2a";
  g.lineWidth = 1;
  g.setLineDash([3, 7]);
  g.beginPath();
  g.arc(P.x, P.y, R, 0, 6.283);
  g.stroke();
  g.setLineDash([]);
  // d'abord toutes les traînées, puis toutes les épées par-dessus
  for (let o = 0; o < n; o++) drawSwish(w.angle + (o / n) * 6.283, R, longueur, couleur, k);
  for (let o = 0; o < n; o++) {
    const a = w.angle + (o / n) * 6.283;
    g.save();
    g.translate(P.x + Math.cos(a) * R, P.y + Math.sin(a) * R);
    g.rotate(a + Math.PI); // la pointe va dans le sens du mouvement
    g.globalAlpha = 1;
    dessinerEpee(k, couleur, legende);
    g.restore();
  }
};

// la marque d'une coupe sur un ennemi touché : deux traits qui se croisent et s'effacent
const slashFx = (x, y, a, couleur) => {
  spark(x, y, couleur, 4, 150);
  const dir = a + 0.9;
  fx.push({ k: "custom", x, y, life: 0.22, t: 0.22,
    draw(f, c) {
      const p = 1 - f.life / f.t, l = 8 + 14 * ralenti(p * 2);
      c.globalAlpha = 1 - p;
      lueur(() => {
        c.strokeStyle = couleur;
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(f.x - Math.cos(dir) * l, f.y - Math.sin(dir) * l);
        c.lineTo(f.x + Math.cos(dir) * l, f.y + Math.sin(dir) * l);
        c.stroke();
      });
      c.strokeStyle = "#ffffff";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(f.x - Math.cos(dir) * l, f.y - Math.sin(dir) * l);
      c.lineTo(f.x + Math.cos(dir) * l, f.y + Math.sin(dir) * l);
      c.stroke();
      c.globalAlpha = 1;
    } });
};

/* ---------- Onde : une onde de choc qui fissure le sol ---------- */

// R : rayon ; fissures : nombre de fissures en plus (le recul, par exemple) ; glace : l'onde légendaire, qui gèle
const shockwaveFx = (x, y, R, couleur, fissures, glace) => {
  const nb = 8 + (fissures || 0);
  const cracks = [];
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * 6.283 + rnd(-0.2, 0.2), fin = R * rnd(0.6, 0.95), pts = [];
    for (let s = 0; s <= 4; s++) {
      const r = 8 + (fin - 8) * (s / 4), d = s && s < 4 ? rnd(-6, 6) : 0;
      pts.push([x + Math.cos(a) * r - Math.sin(a) * d, y + Math.sin(a) * r + Math.cos(a) * d, r]);
    }
    cracks.push(pts);
  }
  spark(x, y, glace ? "#cfeeff" : couleur, 10, R * 2);
  fx.push({ k: "custom", x, y, life: 0.9, t: 0.9,
    draw(f, c) {
      const p = 1 - f.life / f.t, front = R * ralenti(p * 2.2), fondu = 1 - p;
      // les fissures apparaissent là où le front est déjà passé
      c.lineJoin = "round";
      cracks.forEach((pts) => {
        c.beginPath();
        pts.forEach((q, i) => { if (q[2] <= front) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } });
        c.globalAlpha = Math.min(1, fondu * 1.6);
        c.strokeStyle = "#08060f";
        c.lineWidth = 3;
        c.stroke();
        c.globalAlpha = Math.min(1, fondu * 1.6) * 0.8;
        c.strokeStyle = couleur;
        c.lineWidth = 1;
        c.stroke();
      });
      // le front : un anneau épais, puis un second anneau blanc, plus fin, derrière
      lueur(() => {
        c.globalAlpha = Math.min(1, fondu * 1.4);
        c.strokeStyle = couleur;
        c.lineWidth = 3 + 11 * fondu;
        c.beginPath();
        c.arc(f.x, f.y, front, 0, 6.283);
        c.stroke();
      });
      c.globalAlpha = Math.min(1, fondu * 1.4);
      c.strokeStyle = glace ? "#e8f7ff" : "#ffffff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(f.x, f.y, front * 0.82, 0, 6.283);
      c.stroke();
      c.globalAlpha = 1;
    } });
};

/* ---------- Mines : une vraie mine qui clignote, une explosion qui laisse un cratère ---------- */

const drawMine = (f, couleur) => {
  const arme = f.arm <= 0, clin = arme && (calm || Math.floor(t * 6) % 2 === 0);
  // l'ombre, le corps, les piques, l'anneau
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath();
  g.ellipse(f.x, f.y + 4, 8, 3, 0, 0, 6.283);
  g.fill();
  g.fillStyle = "#1a1a24";
  g.beginPath();
  g.arc(f.x, f.y, 6.5, 0, 6.283);
  g.fill();
  g.fillStyle = "#3a3a4c";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283 + 0.3;
    g.fillRect(f.x + Math.cos(a) * 7 - 1.5, f.y + Math.sin(a) * 7 - 1.5, 3, 3);
  }
  g.strokeStyle = couleur;
  g.globalAlpha = arme ? 1 : 0.45;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(f.x, f.y, 4.5, 0, 6.283);
  g.stroke();
  // le voyant : éteint en attendant d'être armée, puis il clignote
  g.globalAlpha = 1;
  g.fillStyle = clin ? "#ff4040" : arme ? "#5a1a1a" : "#2a2a34";
  g.fillRect(f.x - 1.5, f.y - 1.5, 3, 3);
  if (clin) {
    lueur(() => {
      g.globalAlpha = 0.35;
      g.fillStyle = "#ff4040";
      g.beginPath();
      g.arc(f.x, f.y, 7, 0, 6.283);
      g.fill();
    });
    g.globalAlpha = 1;
  }
};

// le cratère noirci que laisse une mine qui explose (la boule de feu vient d'explodeFx, via boom)
const mineBlastFx = (x, y, R) => {
  // le cratère noirci reste un moment au sol
  fx.push({ k: "custom", x, y, life: 2, t: 2,
    draw(f, c) {
      c.globalAlpha = Math.min(1, f.life / f.t * 1.5) * 0.4;
      c.fillStyle = "#07050a";
      c.beginPath();
      c.ellipse(f.x, f.y, R * 0.45, R * 0.3, 0, 0, 6.283);
      c.fill();
      c.globalAlpha = 1;
    } });
};

/* ---------- Drone : une vraie petite machine, avec rotors et laser ---------- */

const drawDrones = (w) => {
  const n = droneCount(w), legende = !!w.legend, vit = 30 + (w.rate || 0) * 20;
  for (let o = 0; o < n; o++) {
    const a = w.angle + (o / n) * 6.283, flotte = calm ? 0 : Math.sin(t * 5 + o * 2) * 1.5;
    const x = P.x + Math.cos(a) * 38, y = P.y + Math.sin(a) * 38 + flotte;
    // la lueur des réacteurs sous la machine
    lueur(() => {
      g.globalAlpha = 0.35;
      g.fillStyle = WEAPON_COLOR.drone;
      g.beginPath();
      g.arc(x, y + 5, 7, 0, 6.283);
      g.fill();
    });
    g.globalAlpha = 1;
    // les bras et les rotors, qui tournent vite
    g.strokeStyle = "#5a6a8a";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x - 8, y - 4);
    g.lineTo(x + 8, y - 4);
    g.stroke();
    [-8, 8].forEach((dx, i) => {
      const ang = calm ? i : t * vit + o + i * 1.3;
      g.globalAlpha = 0.9;
      g.strokeStyle = "#cfe3ff";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x + dx - Math.cos(ang) * 5, y - 4 - Math.sin(ang) * 1.6);
      g.lineTo(x + dx + Math.cos(ang) * 5, y - 4 + Math.sin(ang) * 1.6);
      g.stroke();
      g.globalAlpha = 0.18;
      g.fillStyle = "#cfe3ff";
      g.beginPath();
      g.ellipse(x + dx, y - 4, 5, 1.8, 0, 0, 6.283);
      g.fill();
    });
    g.globalAlpha = 1;
    // le corps, la coque et l'œil (orange pour les drones qui lancent des missiles)
    g.fillStyle = "#22304d";
    g.fillRect(x - 5, y - 3, 10, 6);
    g.fillStyle = "#cfe3ff";
    g.fillRect(x - 3, y - 3, 6, 2);
    g.fillStyle = legende ? "#ff8a1f" : WEAPON_COLOR.drone;
    g.fillRect(x - 1.5, y, 3, 2);
    lueur(() => {
      g.globalAlpha = 0.5 + Math.min(0.4, (w.dm || 0) * 0.1);
      g.beginPath();
      g.arc(x, y + 1, 3.5 + Math.min(2, (w.dm || 0) * 0.5), 0, 6.283);
      g.fill();
    });
    g.globalAlpha = 1;
  }
};

// le laser bref qui relie un drone à sa cible quand il tire
const droneShotFx = (x, y, cible, couleur) => {
  const dx = cible.x - x, dy = cible.y - y;
  fx.push({ k: "beam", x, y, a: Math.atan2(dy, dx), len: Math.hypot(dx, dy), w: 1, life: 0.07, t: 0.07, color: couleur });
  flashFx(x, y, couleur, 7);
};

/* ---------- Champ de feu : des flammes qui lèchent le bord, un sol qui rougeoie ---------- */

// une flamme : une goutte dont la pointe vacille
const flamme = (x, y, h, l, pente, couleur) => {
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(x - l, y);
  g.quadraticCurveTo(x - l * 0.7, y - h * 0.55, x + pente, y - h);
  g.quadraticCurveTo(x + l * 0.7, y - h * 0.55, x + l, y);
  g.closePath();
  g.fill();
};

const drawFlameField = (w) => {
  const R = flameRadius(w), tt = calm ? 0 : t, vit = 7 + (w.rate || 0) * 6;
  const chaleur = Math.min(1, (w.dm || 0) / 2); // plus la brûlure est forte, plus le cœur des flammes est blanc
  const coeur = chaleur > 0.6 || w.legend ? "#fff6c8" : "#ffd84a";
  // le sol qui rougeoie : un disque en damier
  g.globalAlpha = 1;
  g.fillStyle = "rgba(255,110,30,0.4)";
  g.beginPath();
  g.arc(P.x, P.y, R, 0, 6.283);
  g.fill();
  // le bord : un cercle noirci, puis des langues de feu tout autour
  g.strokeStyle = "rgba(40,8,0,0.55)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(P.x, P.y, R, 0, 6.283);
  g.stroke();
  const nb = Math.min(72, Math.max(18, Math.round(R / 3)));
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * 6.283, bx = P.x + Math.cos(a) * R, by = P.y + Math.sin(a) * R;
    const h = 14 + 12 * (0.5 + 0.5 * Math.sin(tt * vit + i * 1.7)) + 5 * Math.sin(tt * vit * 0.6 + i * 0.9);
    const pente = Math.sin(tt * 4 + i) * 2.5;
    // les flammes montent vers le haut de l'écran, quel que soit l'endroit du cercle
    lueur(() => {
      g.globalAlpha = 0.8;
      flamme(bx, by, h, 6, pente, "#ff5a14");
    });
    g.globalAlpha = 0.95;
    flamme(bx, by, h * 0.62, 3.6, pente * 0.6, "#ffb02e");
    flamme(bx, by, h * 0.3, 2, 0, coeur);
  }
  // quelques flammes dans la zone, qui naissent et meurent chacune à son rythme
  const m = Math.min(22, Math.max(6, Math.round(R / 9)));
  for (let i = 0; i < m; i++) {
    const a = i * 2.399, d = R * Math.sqrt((i + 0.5) / m) * 0.85;
    const vie = 0.5 + 0.5 * Math.sin(tt * (3 + (i % 3)) + i * 2.1);
    if (vie < 0.15) continue;
    const bx = P.x + Math.cos(a) * d, by = P.y + Math.sin(a) * d;
    g.globalAlpha = 0.55 * vie;
    flamme(bx, by, 18 * vie, 5, Math.sin(tt * 5 + i) * 2, "#ff7a1a");
    flamme(bx, by, 9 * vie, 2.5, 0, coeur);
  }
  g.globalAlpha = 1;
};

/* ---------- Éclair : une foudre irrégulière et ramifiée, qui noircit le sol ---------- */

// découpe un trait en petits morceaux décalés au hasard : le zigzag d'un éclair
const zigzag = (de, vers, ecart) => {
  const dx = vers[0] - de[0], dy = vers[1] - de[1], len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, morceaux = Math.max(2, Math.round(len / 14)), pts = [de];
  for (let i = 1; i < morceaux; i++) {
    const d = rnd(-ecart, ecart);
    pts.push([de[0] + (dx * i) / morceaux + nx * d, de[1] + (dy * i) / morceaux + ny * d]);
  }
  pts.push(vers);
  return pts;
};

// pts : le point de départ (en haut), puis chaque ennemi touché
const boltFx = (pts, couleur) => {
  const branches = [];
  let chemin = [];
  for (let i = 1; i < pts.length; i++) {
    const seg = zigzag(pts[i - 1], pts[i], 9);
    chemin = chemin.concat(i === 1 ? seg : seg.slice(1));
  }
  // des branches : parfois un point du chemin lance un petit éclair sur le côté
  for (let i = 2; i < chemin.length - 2; i++) {
    if (Math.random() > 0.3) continue;
    const a = Math.atan2(chemin[i + 1][1] - chemin[i - 1][1], chemin[i + 1][0] - chemin[i - 1][0]) + rnd(-1, 1) * 0.9;
    const l = rnd(30, 55);
    branches.push(zigzag(chemin[i], [chemin[i][0] + Math.cos(a) * l, chemin[i][1] + Math.sin(a) * l], 5));
  }
  const trace = (c, liste) => { c.beginPath(); liste.forEach((p, i) => { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke(); };
  fx.push({ k: "custom", x: pts[0][0], y: pts[0][1], life: 0.22, t: 0.22,
    draw(f, c) {
      const al = Math.max(0, f.life / f.t), vacille = calm ? 1 : 0.7 + 0.3 * Math.random();
      c.lineJoin = "round";
      lueur(() => {
        c.strokeStyle = couleur;
        c.globalAlpha = al * 0.35 * vacille;
        c.lineWidth = 12;
        trace(c, chemin);
        c.globalAlpha = al * 0.7 * vacille;
        c.lineWidth = 5;
        trace(c, chemin);
        c.lineWidth = 2.5;
        branches.forEach((b) => trace(c, b));
      });
      c.globalAlpha = al;
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2;
      trace(c, chemin);
      c.lineWidth = 1;
      branches.forEach((b) => trace(c, b));
      c.globalAlpha = 1;
    } });
};

// l'endroit où la foudre est tombée : un sol noirci, avec un anneau rougeoyant qui s'éteint
const scorchFx = (x, y, rayon) => {
  const rais = [];
  for (let i = 0; i < 7; i++) rais.push(rnd(0, 6.283));
  fx.push({ k: "custom", x, y, life: 1.4, t: 1.4,
    draw(f, c) {
      const p = 1 - f.life / f.t, fondu = 1 - p;
      c.globalAlpha = fondu * 0.45;
      c.fillStyle = "#07050a";
      c.beginPath();
      c.ellipse(f.x, f.y, rayon, rayon * 0.7, 0, 0, 6.283);
      c.fill();
      c.strokeStyle = "#1a1208";
      c.lineWidth = 1.5;
      rais.forEach((a) => {
        c.beginPath();
        c.moveTo(f.x, f.y);
        c.lineTo(f.x + Math.cos(a) * rayon * 1.2, f.y + Math.sin(a) * rayon * 0.85);
        c.stroke();
      });
      lueur(() => {
        c.globalAlpha = Math.max(0, fondu - 0.4) * 0.8;
        c.strokeStyle = "#ff9a2e";
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(f.x, f.y, rayon * 0.8, rayon * 0.56, 0, 0, 6.283);
        c.stroke();
      });
      c.globalAlpha = 1;
    } });
};

/* ---------- Les formes partagées : tout ce que les autres armes dessinent ---------- */
/*
  rendu.js appelle ces fonctions pour les coups de toutes les armes : croissants de coupe, lasers, éclairs, tirs,
  explosions, tourelles, bobines, pièges, grenades, étoiles, piliers de lumière, murs de flammes.
*/

// le contour d'un croissant (un arc qui s'amincit aux deux bouts), prêt à être rempli
const croissant = (cx, cy, r, a0, a1, epaisseur, n) => {
  const dehors = [], dedans = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = a0 + (a1 - a0) * u, e = epaisseur * Math.pow(Math.sin(Math.PI * u), 0.7);
    dehors.push([cx + Math.cos(a) * (r + e * 0.5), cy + Math.sin(a) * (r + e * 0.5)]);
    dedans.push([cx + Math.cos(a) * (r - e * 0.5), cy + Math.sin(a) * (r - e * 0.5)]);
  }
  g.beginPath();
  dehors.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
  for (let i = dedans.length - 1; i >= 0; i--) g.lineTo(dedans[i][0], dedans[i][1]);
  g.closePath();
};

// un coup tranchant : un croissant lumineux qui balaie l'arc, avec un cœur blanc
const drawSlash = (f, col, al) => {
  const ep = 9 * (f.big || 1) * (0.4 + 0.6 * al), tete = Math.min(1, 0.3 + (1 - al) * 3.5);
  const a0 = f.a - f.spread, a1 = a0 + 2 * f.spread * tete;
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = al * 0.85;
  g.fillStyle = col;
  croissant(f.x, f.y, f.r, a0, a1, ep * 1.6, 18);
  g.fill();
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = al;
  g.fillStyle = "#ffffff";
  croissant(f.x, f.y, f.r, a0, a1, ep * 0.6, 18);
  g.fill();
};

// un laser : une bande de couleur, un cœur blanc, un rond de lumière aux deux bouts
const drawLaser = (f, col, al) => {
  const x2 = f.x + Math.cos(f.a) * f.len, y2 = f.y + Math.sin(f.a) * f.len;
  const w = f.w * al + 2;
  const trait = (largeur, couleur) => {
    g.globalAlpha = 1;
    g.strokeStyle = couleur;
    g.lineWidth = largeur;
    g.beginPath();
    g.moveTo(f.x, f.y);
    g.lineTo(x2, y2);
    g.stroke();
  };
  trait(w * 2.2, col);
  g.fillStyle = col;
  g.beginPath();
  g.arc(x2, y2, w * 1.7, 0, 6.283);
  g.fill();
  g.beginPath();
  g.arc(f.x, f.y, w * 1.4, 0, 6.283);
  g.fill();
  trait(Math.max(2, w * 0.7), "#ffffff");
  g.globalAlpha = 1;
};

// un éclair : un zigzag fixé à la première image, avec des branches, qui vacille
const drawBolt = (f, col) => {
  if (!f.jag) {
    f.jag = [];
    f.br = [];
    for (let i = 1; i < f.pts.length; i++) {
      const seg = zigzag(f.pts[i - 1], f.pts[i], 6);
      f.jag = f.jag.concat(i === 1 ? seg : seg.slice(1));
    }
    for (let i = 2; i < f.jag.length - 2; i++) {
      if (Math.random() > 0.2) continue;
      const a = Math.atan2(f.jag[i + 1][1] - f.jag[i - 1][1], f.jag[i + 1][0] - f.jag[i - 1][0]) + rnd(-1, 1) * 0.9, l = rnd(14, 30);
      f.br.push(zigzag(f.jag[i], [f.jag[i][0] + Math.cos(a) * l, f.jag[i][1] + Math.sin(a) * l], 3));
    }
  }
  const trace = (liste) => { g.beginPath(); liste.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke(); };
  const al = g.globalAlpha, vacille = calm ? 1 : 0.7 + 0.3 * Math.random();
  g.lineJoin = "round";
  g.globalCompositeOperation = "lighter";
  g.strokeStyle = col;
  g.globalAlpha = al * 0.25 * vacille;
  g.lineWidth = 5;
  trace(f.jag);
  g.globalAlpha = al * 0.6 * vacille;
  g.lineWidth = 2.5;
  trace(f.jag);
  g.lineWidth = 1.8;
  f.br.forEach(trace);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = al;
  g.strokeStyle = "#ffffff";
  g.lineWidth = 1.5;
  trace(f.jag);
  g.lineWidth = 0.8;
  f.br.forEach(trace);
};

// un tir : une comète avec une longue queue, un halo, un corps coloré et un cœur blanc
const drawBullet = (b, couleurHeros) => {
  const col = b.color || couleurHeros, sz = b.size || 1, a = Math.atan2(b.vy, b.vx);
  g.save();
  g.translate(b.x, b.y);
  if (b.star) { // un shuriken : une étoile qui tourne
    g.rotate(t * 20);
    g.fillStyle = col;
    g.fillRect(-6, -1.5, 12, 3);
    g.fillRect(-1.5, -6, 3, 12);
    g.fillStyle = "#ffffff";
    g.fillRect(-2, -0.7, 4, 1.4);
    g.restore();
    return;
  }
  g.rotate(a);
  g.globalCompositeOperation = "lighter";
  g.fillStyle = col;
  g.globalAlpha = 0.3;
  g.beginPath();
  g.moveTo(-20 * sz, 0);
  g.lineTo(-3 * sz, -2.4 * sz);
  g.lineTo(-3 * sz, 2.4 * sz);
  g.closePath();
  g.fill();
  g.globalAlpha = 0.35;
  g.beginPath();
  g.arc(0, 0, 5 * sz, 0, 6.283);
  g.fill();
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  g.beginPath();
  g.ellipse(0, 0, 6 * sz, 2.2 * sz, 0, 0, 6.283);
  g.fill();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(sz, 0, 3.6 * sz, 0.9 * sz, 0, 0, 6.283);
  g.fill();
  g.restore();
};

// une explosion : trois disques pleins (couleur, clair, blanc) qui gonflent puis s'éteignent, et de la fumée
const blastFx = (x, y, R, col) => {
  if (calm || fx.length > 90) return;
  const fumee = [];
  for (let i = 0; i < 4; i++) fumee.push({ a: rnd(0, 6.283), d: rnd(0.2, 0.6), r: rnd(0.25, 0.4) });
  fx.push({ k: "custom", x, y, life: 0.42, t: 0.42,
    draw(f, c) {
      const p = 1 - f.life / f.t, r = R * (0.3 + 0.7 * ralenti(p * 1.7)), reste = Math.max(0, 1 - p * 1.25);
      fumee.forEach((s) => {
        c.globalAlpha = Math.max(0, 0.9 - p) * 0.7;
        c.fillStyle = "#3a3640";
        c.beginPath();
        c.arc(f.x + Math.cos(s.a) * R * s.d, f.y + Math.sin(s.a) * R * s.d - 14 * p, R * s.r * (0.5 + p), 0, 6.283);
        c.fill();
      });
      c.globalAlpha = 1;
      [[1, col], [0.62, teinte(col, 0.5)], [0.3, "#ffffff"]].forEach((d) => {
        c.fillStyle = d[1];
        c.beginPath();
        c.arc(f.x, f.y, Math.max(0, r * d[0] * reste), 0, 6.283);
        c.fill();
      });
    } });
};

// une touche : un petit éclat propre à l'origine du coup (coupe, laser, éclair, explosion)
const hitFx = (e, src, couleur) => {
  if (calm || fx.length > 100) return;
  if (src === "slash") slashFx(e.x, e.y, rnd(0, 6.283), "#ffffff");
  else if (src === "beam") flashFx(e.x, e.y, couleur, 16);
  else if (src === "blast") ringFx(e.x, e.y, couleur, e.r + 14, 0.18);
};

// un marteau : une tête d'acier à bandes colorées au bout d'un manche, qui tourne
const drawHammer = (f, col) => {
  g.save();
  g.translate(f.x, f.y);
  g.rotate(f.spin || 0);
  lueur(() => {
    g.globalAlpha = 0.3;
    g.fillStyle = col;
    g.beginPath();
    g.arc(0, 0, 15, 0, 6.283);
    g.fill();
  });
  g.globalAlpha = 1;
  g.fillStyle = "#5a3a2a";
  g.fillRect(-1.5, 2, 3, 16);
  g.fillStyle = "#cfd6e6";
  g.fillRect(-10, -7, 20, 10);
  g.fillStyle = "#8a93aa";
  g.fillRect(-10, -1, 20, 4);
  g.fillStyle = col;
  g.fillRect(-10, -7, 3, 10);
  g.fillRect(7, -7, 3, 10);
  g.fillStyle = "#ffffff";
  g.fillRect(-6, -6, 10, 2);
  g.restore();
};

// une tourelle : un socle, un dôme et un canon tourné vers la cible ; s : l'échelle
const drawTurret = (x, y, a, col, s) => {
  g.fillStyle = "#171c2a";
  g.fillRect(x - 7 * s, y - 1 * s, 14 * s, 5 * s);
  g.fillStyle = "#2c3550";
  g.fillRect(x - 5 * s, y - 4 * s, 10 * s, 4 * s);
  g.save();
  g.translate(x, y - 3 * s);
  g.rotate(a);
  g.fillStyle = "#46506e";
  g.fillRect(0, -1.8 * s, 13 * s, 3.6 * s);
  g.fillStyle = col;
  g.fillRect(11 * s, -2.2 * s, 3 * s, 4.4 * s);
  g.restore();
  g.fillStyle = "#46506e";
  g.beginPath();
  g.arc(x, y - 3 * s, 4 * s, Math.PI, 0);
  g.fill();
  g.fillStyle = col;
  g.fillRect(x - 1 * s, y - 5.5 * s, 2 * s, 1.6 * s);
  lueur(() => {
    g.globalAlpha = 0.25;
    g.beginPath();
    g.arc(x + Math.cos(a) * 14 * s, y - 3 * s + Math.sin(a) * 14 * s, 4 * s, 0, 6.283);
    g.fill();
  });
};

// une bobine électrique : des anneaux empilés et un globe qui crépite au sommet
const drawCoil = (x, y, col, s) => {
  g.fillStyle = "#171c2a";
  g.fillRect(x - 6 * s, y, 12 * s, 3 * s);
  g.fillStyle = "#46506e";
  [[5, 0], [4, -4], [3, -8]].forEach((r) => g.fillRect(x - r[0] * s, y + r[1] * s - 3 * s, r[0] * 2 * s, 3 * s));
  g.fillStyle = col;
  g.fillRect(x - 1.5 * s, y - 14 * s, 3 * s, 3 * s);
  lueur(() => {
    g.globalAlpha = calm ? 0.5 : 0.4 + 0.2 * Math.sin(t * 16);
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y - 15 * s, 5 * s, 0, 6.283);
    g.fill();
  });
};

// un piège à ours : une plaque, des dents tout autour
const drawTrap = (f, col) => {
  g.fillStyle = "#2a2a22";
  g.beginPath();
  g.ellipse(f.x, f.y + 1, 8, 4, 0, 0, 6.283);
  g.fill();
  g.fillStyle = col;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283;
    g.beginPath();
    g.moveTo(f.x + Math.cos(a) * 8, f.y + 1 + Math.sin(a) * 4);
    g.lineTo(f.x + Math.cos(a + 0.25) * 5, f.y + 1 + Math.sin(a + 0.25) * 2.5);
    g.lineTo(f.x + Math.cos(a) * 3, f.y - 3 + Math.sin(a) * 1.5);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "#ffffff";
  g.fillRect(f.x - 1, f.y - 0.5, 2, 2);
};

// une grenade : un corps sombre, une bande colorée, une goupille ; led : un voyant qui clignote
const drawGrenade = (x, y, col, r, led) => {
  g.fillStyle = "#1c2028";
  g.beginPath();
  g.arc(x, y, r, 0, 6.283);
  g.fill();
  g.fillStyle = col;
  g.fillRect(x - r, y - 1, r * 2, 2);
  g.fillStyle = "#6b7288";
  g.fillRect(x - 1, y - r - 2, 2, 3);
  g.fillRect(x + 1, y - r - 2, 3, 1);
  g.fillStyle = "#ffffff";
  g.fillRect(x - r * 0.5, y - r * 0.6, 1.5, 1.5);
  if (led) {
    g.fillStyle = "#ff4040";
    g.fillRect(x - 1, y + 1.5, 2, 2);
    lueur(() => { g.globalAlpha = 0.5; g.beginPath(); g.arc(x, y + 2.5, 4, 0, 6.283); g.fill(); });
  }
};

// une étoile de lame, qui tourne : quatre pointes d'acier et un bord coloré
const drawStar = (f, col) => {
  g.save();
  g.translate(f.x, f.y);
  g.rotate(f.spin || 0);
  g.fillStyle = "#dfe8f0";
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283, r = i % 2 ? 3 : 9;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = col;
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = "#0a0a0a";
  g.fillRect(-1, -1, 2, 2);
  g.restore();
};

// un mur de flammes en anneau
const drawFireRing = (f, col) => {
  g.globalAlpha = 1;
  g.fillStyle = "rgba(255,100,20,0.32)";
  g.beginPath();
  g.arc(f.x, f.y, f.R, 0, 6.283);
  g.fill();
  const tt = calm ? 0 : t, n = Math.min(44, Math.max(12, Math.round(f.R / 5)));
  const fondu = f.life < 0.6 && !calm ? 0.5 + 0.4 * Math.sin(tt * 20) : 1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + tt * 0.4, bx = f.x + Math.cos(a) * f.R, by = f.y + Math.sin(a) * f.R;
    const h = 12 + 8 * (0.5 + 0.5 * Math.sin(tt * 8 + i * 1.7));
    g.globalAlpha = 0.85 * fondu;
    flamme(bx, by, h, 4.5, Math.sin(tt * 4 + i) * 2, col);
    g.globalAlpha = 0.9 * fondu;
    flamme(bx, by, h * 0.55, 2.4, 0, "#ffd84a");
  }
  g.globalAlpha = 1;
};

// un nuage de gaz : des bouffées qui dérivent
const drawGas = (f, col) => {
  const tt = calm ? 0 : t;
  g.fillStyle = col;
  for (let i = 0; i < 9; i++) {
    const a = i * 2.399 + tt * 0.25, d = f.R * (0.25 + 0.55 * ((i * 0.37) % 1));
    g.globalAlpha = 0.1 + 0.05 * Math.sin(tt * 2 + i);
    g.beginPath();
    g.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, f.R * (0.28 + 0.1 * Math.sin(tt + i)), 0, 6.283);
    g.fill();
  }
  g.globalAlpha = 0.4;
  g.strokeStyle = col;
  g.lineWidth = 1;
  g.setLineDash([3, 6]);
  g.beginPath();
  g.arc(f.x, f.y, f.R, 0, 6.283);
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;
};

// un globe d'énergie : un halo, un cœur blanc, trois étincelles qui tournent autour
const drawGlobe = (f, col, taille) => {
  const r = taille || 6, tt = calm ? 0 : t;
  lueur(() => {
    g.fillStyle = col;
    g.globalAlpha = 0.4;
    g.beginPath();
    g.arc(f.x, f.y, r * 2, 0, 6.283);
    g.fill();
    g.globalAlpha = 0.6;
    g.strokeStyle = col;
    g.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) {
      const a = tt * 9 + k * 2.09;
      g.beginPath();
      g.arc(f.x, f.y, r * 1.5, a, a + 0.9);
      g.stroke();
    }
  });
  g.globalAlpha = 1;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(f.x, f.y, r * 0.6, 0, 6.283);
  g.fill();
};

// un pilier de lumière qui tombe du ciel
const drawPillar = (f, col) => {
  const fondu = Math.min(1, f.life / 0.4), haut = f.y - 320;
  g.globalAlpha = fondu;
  g.fillStyle = teinte(col, -0.2);
  g.fillRect(f.x - f.R * 0.3, haut, f.R * 0.6, 320);
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.beginPath();
  g.ellipse(f.x, f.y, f.R, f.R * 0.45, 0, 0, 6.283);
  g.fill();
  g.globalAlpha = fondu;
  g.fillStyle = "#ffffff";
  g.fillRect(f.x - 2, haut, 4, 320);
  g.strokeStyle = col;
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(f.x, f.y, f.R, f.R * 0.45, 0, 0, 6.283);
  g.stroke();
  g.globalAlpha = 1;
};

// un obus de mortier qui tombe : le cercle de visée, l'obus et sa queue de feu
const drawShell = (f, col, al) => {
  g.globalAlpha = 0.5;
  g.strokeStyle = col;
  g.lineWidth = 2;
  g.setLineDash([3, 5]);
  g.beginPath();
  g.arc(f.tx, f.ty, f.R * (0.4 + 0.6 * (1 - al)), 0, 6.283);
  g.stroke();
  g.setLineDash([]);
  const hy = f.ty - 140 * al;
  lueur(() => {
    g.globalAlpha = 0.5;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(f.tx - 3, hy - 14);
    g.lineTo(f.tx + 3, hy - 14);
    g.lineTo(f.tx, hy - 2);
    g.closePath();
    g.fill();
  });
  g.globalAlpha = 1;
  g.fillStyle = "#2c3140";
  g.fillRect(f.tx - 2.5, hy - 5, 5, 9);
  g.fillStyle = col;
  g.fillRect(f.tx - 2.5, hy - 2, 5, 1.5);
  g.fillStyle = "#cfd6e6";
  g.fillRect(f.tx - 1, hy + 4, 2, 2);
};

/* ---------- La couche pixel : tout ce qui est dessiné par les armes reste en gros pixels ---------- */
/*
  Les effets sont dessinés sur une petite image (un pixel = 2 px du monde, comme les sprites), puis agrandie sans lissage :
  les arcs, les lasers et les lueurs deviennent des blocs nets, comme tout le reste du jeu.
*/
const PIX = 2;
let mainG = g; // le vrai pinceau, pendant que g désigne la petite image
const pixelLayer = document.createElement("canvas");
const pixelCtx = pixelLayer.getContext("2d");
let pxX0 = 0, pxY0 = 0, pxW = 0, pxH = 0;

// à appeler avant de dessiner : g dessine désormais sur la petite image, avec les mêmes coordonnées du monde
const pixelBegin = (cx, cy, vw, vh) => {
  pxX0 = Math.floor((cx - vw / 2) / PIX) * PIX - PIX * 3;
  pxY0 = Math.floor((cy - vh / 2) / PIX) * PIX - PIX * 3;
  pxW = Math.ceil(vw / PIX) + 8;
  pxH = Math.ceil(vh / PIX) + 8;
  if (pixelLayer.width !== pxW || pixelLayer.height !== pxH) { pixelLayer.width = pxW; pixelLayer.height = pxH; }
  pixelCtx.setTransform(1, 0, 0, 1, 0, 0);
  pixelCtx.clearRect(0, 0, pxW, pxH);
  pixelCtx.setTransform(1 / PIX, 0, 0, 1 / PIX, -pxX0 / PIX, -pxY0 / PIX);
  pixelCtx.imageSmoothingEnabled = false;
  mainG = g;
  g = pixelCtx;
};

// à appeler après : durcit les bords (on repose l'image sur elle-même : une transparence moyenne devient presque pleine),
// puis pose la petite image sur le canevas, agrandie sans lissage
const pixelEnd = () => {
  pixelCtx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 4; i++) pixelCtx.drawImage(pixelLayer, 0, 0);
  g = mainG;
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.imageSmoothingEnabled = false;
  g.drawImage(pixelLayer, pxX0, pxY0, pxW * PIX, pxH * PIX);
};

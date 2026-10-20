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

// l'arc de coupe laissé derrière une épée : de plus en plus fin et pâle en s'éloignant
const drawSwish = (a, R, longueur, couleur, k) => {
  const morceaux = 10;
  lueur(() => {
    g.lineCap = "round";
    for (let i = 0; i < morceaux; i++) {
      const p = (i + 1) / morceaux; // 0 : queue de la traînée, 1 : contre l'épée
      g.globalAlpha = 0.8 * p;
      g.strokeStyle = couleur;
      g.lineWidth = 1 + 11 * k * p;
      g.beginPath();
      g.arc(P.x, P.y, R, a - longueur * (1 - i / morceaux), a - longueur * (1 - p));
      g.stroke();
    }
    g.lineCap = "butt";
  });
  g.globalAlpha = 0.7;
  g.strokeStyle = "#ffffff";
  g.lineWidth = 1.5 * k;
  g.beginPath();
  g.arc(P.x, P.y, R, a - longueur * 0.55, a);
  g.stroke();
  g.globalAlpha = 1;
};

const drawBlades = (w) => {
  const R = orbRadius(w), n = orbCount(w), legende = !!w.legend;
  const k = 1 + Math.min(0.5, (w.dm || 0) * 0.15); // plus de dégâts : des épées plus grandes
  const longueur = 0.7 + Math.min(1.2, (w.spin || 0) * 0.5); // plus de vitesse : une traînée plus longue
  const couleur = legende ? "#ffd86b" : WEAPON_COLOR.orb;
  // le cercle que suivent les épées : un sillon discret
  g.strokeStyle = "#2a2a2a";
  g.lineWidth = 1;
  g.setLineDash([3, 7]);
  g.beginPath();
  g.arc(P.x, P.y, R, 0, 6.283);
  g.stroke();
  g.setLineDash([]);
  for (let o = 0; o < n; o++) {
    const a = w.angle + (o / n) * 6.283;
    drawSwish(a, R, longueur, couleur, k);
    g.save();
    g.translate(P.x + Math.cos(a) * R, P.y + Math.sin(a) * R);
    g.rotate(a + Math.PI); // la pointe va dans le sens du mouvement
    lueur(() => {
      g.globalAlpha = legende ? 0.22 : 0.12;
      g.fillStyle = couleur;
      g.beginPath();
      g.arc(0, 0, 11 * k, 0, 6.283);
      g.fill();
    });
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
      // la lueur du sol sous l'onde
      const gr = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(1, front));
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(1, couleur);
      c.globalAlpha = fondu * 0.18;
      c.fillStyle = gr;
      c.beginPath();
      c.arc(f.x, f.y, front, 0, 6.283);
      c.fill();
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

// la boule de feu, la fumée et le cratère d'une mine qui explose (les dégâts sont dans boom)
const mineBlastFx = (x, y, R, couleur) => {
  const fumee = [];
  for (let i = 0; i < 5; i++) fumee.push({ a: rnd(0, 6.283), d: rnd(0.2, 0.7), r: rnd(0.25, 0.45) });
  spark(x, y, "#ffffff", 6, 240);
  fx.push({ k: "custom", x, y, life: 0.55, t: 0.55,
    draw(f, c) {
      const p = 1 - f.life / f.t, r = R * (0.35 + 0.65 * ralenti(p * 1.6)), fondu = 1 - p;
      const gr = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      gr.addColorStop(0, "#ffffff");
      gr.addColorStop(0.35, couleur);
      gr.addColorStop(1, "rgba(255,90,0,0)");
      lueur(() => {
        c.globalAlpha = fondu;
        c.fillStyle = gr;
        c.beginPath();
        c.arc(f.x, f.y, r, 0, 6.283);
        c.fill();
      });
      // la fumée grise monte et s'étale
      fumee.forEach((s) => {
        c.globalAlpha = Math.max(0, fondu - 0.25) * 0.5;
        c.fillStyle = "#3a3640";
        c.beginPath();
        c.arc(f.x + Math.cos(s.a) * R * s.d, f.y + Math.sin(s.a) * R * s.d - 20 * p, R * s.r * (0.5 + p), 0, 6.283);
        c.fill();
      });
      c.globalAlpha = 1;
    } });
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
  // le sol qui rougeoie : plus clair au centre, éteint au bord
  const gr = g.createRadialGradient(P.x, P.y, 0, P.x, P.y, R);
  gr.addColorStop(0, "rgba(255,170,60,0.34)");
  gr.addColorStop(0.75, "rgba(255,100,20,0.22)");
  gr.addColorStop(1, "rgba(255,60,0,0)");
  lueur(() => {
    g.globalAlpha = calm ? 1 : 0.85 + 0.15 * Math.sin(tt * 5);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(P.x, P.y, R, 0, 6.283);
    g.fill();
  });
  g.globalAlpha = 1;
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

"use strict";

/* ---------- Écrans ---------- */
const panel = $("#panel"), pTitle = $("#pTitle"), pBody = $("#pBody");
const live = (txt) => { $("#live").textContent = txt; };
const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
};
const button = (label, fn, go) => {
  const b = el("button", "btn" + (go ? " go" : ""), label);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
};
panel.tabIndex = -1;
// noFocus : ne pas mettre le focus sur un bouton (au niveau supérieur, une touche encore enfoncée validerait la première carte)
const show = (title, build, clear, noFocus) => {
  pTitle.textContent = title;
  pBody.textContent = "";
  pBody._picks = null;
  panel.classList.toggle("clear", !!clear);
  build(pBody);
  panel.hidden = false;
  const first = pBody.querySelector("button");
  if (noFocus) panel.focus({ preventScroll: true });
  else if (first) first.focus({ preventScroll: true });
};
const hidePanel = () => { panel.hidden = true; };

const statsList = (rows) => {
  const dl = el("dl", "stats");
  rows.forEach((r) => { dl.appendChild(el("dt", "", r[0])); dl.appendChild(el("dd", "", r[1])); });
  return dl;
};

// le fond du menu : des ennemis qui dérivent, sans personne à poursuivre
const attractMode = () => {
  reset();
  for (let i = 0; i < 46; i++) {
    const type = i % 11 === 0 ? "brute" : i % 7 === 0 ? "shooter" : i % 13 === 0 ? "splitter" : "crawler";
    spawn(type, P.x + rnd(-420, 420), P.y + rnd(-260, 260), true);
    const e = enemies[enemies.length - 1];
    e.dirx = rnd(-30, 30);
    e.diry = rnd(-22, 22);
  }
};

// le titre en gros pixels : toutes les lettres, en 5 x 5, tracées ici
const LOGO = {
  A: [".###.", "#...#", "#####", "#...#", "#...#"],
  B: ["####.", "#...#", "####.", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "####.", "#....", "#####"],
  F: ["#####", "#....", "####.", "#....", "#...."],
  G: [".####", "#....", "#..##", "#...#", ".####"],
  H: ["#...#", "#...#", "#####", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "###..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "####.", "#....", "#...."],
  Q: [".###.", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "####.", "#.#..", "#..##"],
  S: [".####", "#....", ".###.", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  Y: ["#...#", ".#.#.", "..#..", "..#..", "..#.."],
  Z: ["#####", "...#.", "..#..", ".#...", "#####"],
};
const logo = () => {
  const word = GAME_NAME.toUpperCase().split("").filter((ch) => ch === " " || LOGO[ch]);
  const sc = word.length > 8 ? 4 : 6, adv = (ch) => (ch === " " ? 3 : 6);
  const total = word.reduce((n, ch) => n + adv(ch), -1);
  const c = document.createElement("canvas");
  c.width = total * sc;
  c.height = 5 * sc;
  c.className = "logo-px";
  c.setAttribute("role", "img");
  c.setAttribute("aria-label", GAME_NAME.toLowerCase());
  const x = c.getContext("2d");
  // la barre de la première lettre A, E ou O est rose : c'est le seul point actif du titre
  const accent = word.findIndex((ch) => "AEO".indexOf(ch) >= 0);
  let px = 0;
  word.forEach((ch, i) => {
    if (ch !== " ") {
      LOGO[ch].forEach((row, r) => {
        row.split("").forEach((cell, k) => {
          if (cell !== "#") return;
          x.fillStyle = i === accent && r === 2 ? PINK : LIGHT;
          x.fillRect((px + k) * sc, r * sc, sc, sc);
        });
      });
    }
    px += adv(ch);
  });
  return c;
};

// le personnage choisi, en grand, tel qu'il est au départ
const heroPreview = () => {
  const name = heroName(), c = document.createElement("canvas"), src = sprite(name, 0, false, false, "000");
  c.width = src.width;
  c.height = src.height;
  c.className = "hero-prev";
  c.setAttribute("role", "img");
  c.setAttribute("aria-label", CHARS[best.char].name);
  c.getContext("2d").drawImage(src, 0, 0);
  return c;
};

const showMenu = () => {
  mode = "menu";
  attractMode();
  document.body.classList.remove("playing");
  $("#pause").hidden = true;
  $("#dashBtn").hidden = true;
  $("#bars").hidden = true;
  $("#bossBar").hidden = true;
  $("#chips").textContent = "";
  show("survivor-like cyberpunk", (b) => {
    b.appendChild(logo());
    b.appendChild(el("p", "big", "Tiens le plus longtemps possible."));
    b.appendChild(el("p", "", "Tu te déplaces, ça tire tout seul. Chaque monstre tué lâche de l'XP : à chaque niveau, tu choisis tes améliorations. Tue le boss et tout ce qui reste pour passer au monde suivant."));
    const row0 = el("div", "row diff");
    row0.setAttribute("role", "group");
    row0.setAttribute("aria-label", "Difficulté");
    Object.keys(DIFFS).forEach((k) => {
      const d = button(DIFFS[k].name, () => { best.diff = k; saveBest(); showMenu(); });
      d.setAttribute("aria-pressed", best.diff === k ? "true" : "false");
      row0.appendChild(d);
    });
    b.appendChild(row0);
    const rowC = el("div", "row diff");
    rowC.setAttribute("role", "group");
    rowC.setAttribute("aria-label", "Personnage");
    Object.keys(CHARS).forEach((k) => {
      const c = button(CHARS[k].name, () => { best.char = k; saveBest(); showMenu(); });
      c.setAttribute("aria-pressed", best.char === k ? "true" : "false");
      rowC.appendChild(c);
    });
    b.appendChild(rowC);
    b.appendChild(heroPreview());
    b.appendChild(el("p", "small", CHARS[best.char].text));
    if (best.games) b.appendChild(statsList([["meilleur temps", fmt(best.t[best.diff] || 0)], ["meilleur monde", String(best.world || 1)], ["meilleur score", String(best.score)]]));
    const row = el("div", "row");
    row.appendChild(button("jouer", start, true));
    row.appendChild(button("comment jouer", () => showHow()));
    b.appendChild(row);
    b.appendChild(el("p", "small", "ZQSD ou flèches · Espace : dash · P : pause · au doigt : glisse n'importe où"));
    // le pied de page est caché sur téléphone : les crédits sont ici
    const cr = el("p", "small", "Basé sur ");
    const a0 = el("a", "", "Swarm de Lino Volle");
    a0.href = "https://github.com/Bebbou/devtober-2026/tree/main/07-Swarm";
    cr.appendChild(a0);
    b.appendChild(cr);
  }, true);
};

// les règles tiennent sur un seul écran
const HOW = [
  ["Bouger", "ZQSD, WASD ou les flèches. Au doigt ou à la souris : glisse n'importe où, un joystick apparaît."],
  ["Tirer", "Automatique, sur l'ennemi le plus proche."],
  ["Dash", "Espace, ou le bouton rond sur téléphone. Il te protège un instant, il revient en 2,4 s."],
  ["Grandir", "Les cristaux blancs remplissent la barre rose : à chaque niveau, trois cartes de rareté variable (commun, rare, légendaire), chacune une arme, une variante ou deux boosts. Deux améliorations montées ensemble débloquent une évolution."],
  ["Danger", "Tout ce qui est rose te blesse : tirs ennemis, ligne de charge, zones au sol qui se remplissent. Tes tirs sont blancs. Le blindé encaisse mal les tirs : utilise lames, onde et explosions."],
  ["Tenir", "Le plus longtemps possible. Chaque monde dure environ 5 minutes : des vagues, puis un boss. Tue-le, ainsi que tout ce qui reste, pour passer au monde suivant, de plus en plus dur. P : pause."],
];
// back : où revenir après « compris » (le menu, ou la pause quand on était en partie)
const showHow = (back) => {
  show("comment jouer", (b) => {
    const dl = el("dl", "how");
    HOW.forEach((r) => { dl.appendChild(el("dt", "", r[0])); dl.appendChild(el("dd", "", r[1])); });
    b.appendChild(dl);
    b.appendChild(button("compris", () => {
      try { localStorage.setItem(KEY + "-vu", "1"); } catch (e) { /* on s'en passe */ }
      if (back) back(); else showMenu();
    }, true));
  }, true);
};

// la rareté se tire selon le niveau : les légendaires arrivent à partir du niveau 6
const rollRarity = () => {
  const L = level;
  const w = [Math.max(20, 62 - L * 1.6), 36 + L * 1.1, L >= 6 ? 1.5 + L * 0.4 : 0];
  let r = Math.random() * (w[0] + w[1] + w[2]);
  for (let i = 0; i < 3; i++) {
    if (r < w[i]) return i;
    r -= w[i];
  }
  return 0;
};

const showLevelUp = () => {
  mode = "levelup";
  const pool = UPGRADES.concat(weaponPool()).filter((u) => (lv[u.id] || 0) < u.max && (!u.only || weaponLvl(u.only)));
  const picks = [];
  const usedWeapons = new Set();
  while (picks.length < 3 && pool.length) {
    // tirage pondéré : une arme unique du héros pèse 2, une arme universelle 0,7, le reste 1
    let r0 = Math.random() * pool.reduce((s, c) => s + (c.weight || 1), 0), at = pool.length - 1;
    for (let i = 0; i < pool.length; i++) { r0 -= pool[i].weight || 1; if (r0 <= 0) { at = i; break; } }
    const u = pool.splice(at, 1)[0];
    if (u.weapon && usedWeapons.has(u.weapon)) continue; // une seule carte par arme dans un tirage
    if (u.weapon) usedWeapons.add(u.weapon);
    picks.push({ u, r: rollRarity() });
  }
  while (picks.length < 3) picks.push({ u: HEAL, r: 0 });
  // une carte de boost en contient deux, de la même rareté
  const used = new Set(picks.map((p) => p.u));
  picks.forEach((p) => {
    if (UPGRADES.indexOf(p.u) < 0 || p.u.only) return;
    const rest = UPGRADES.filter((u) => !u.only && !used.has(u) && (lv[u.id] || 0) < u.max);
    if (!rest.length) return;
    p.u2 = rest[Math.floor(Math.random() * rest.length)];
    used.add(p.u2);
  });
  // une évolution disponible prend la dernière place
  const evo = EVOS.find((e) => !lv[e.id] && e.need.every((id) => (lv[id] || 0) >= 3));
  if (evo) picks[2] = { u: evo, r: 4, evo: true };
  live("Niveau " + level + " : choisis une amélioration");
  SFX.level();
  show("niveau " + level, (b) => {
    const cards = el("div", "cards");
    picks.forEach((p, i) => {
      const c = el("button", "card r" + (p.r === 2 ? 3 : p.r) + (p.u.tier ? " tier-" + p.u.tier : "")); // la classe r3 est le style légendaire, r4 celui des évolutions ; tier-* celui d'une arme rare ou légendaire
      c.type = "button";
      const tag = el("span", "lv", p.evo ? "évolution" : p.u === HEAL ? "" : (p.u.isNew ? (p.u.tier === "legend" ? "arme légendaire" : p.u.tier === "rare" ? "arme rare" : p.r === 2 ? "nouvelle arme · " + RARITY[2] : "nouvelle arme") : RARITY[p.r]));
      const name = el("b", "");
      name.appendChild(el("kbd", "", String(i + 1)));
      name.appendChild(document.createTextNode(p.u.name + (p.u2 ? " + " + p.u2.name : "")));
      c.appendChild(tag);
      c.appendChild(name);
      c.appendChild(el("span", "", p.evo ? p.u.text : p.u.text(p.u.vals[p.r], p.r)));
      if (p.u2) { c.appendChild(document.createElement("br")); c.appendChild(el("span", "", p.u2.text(p.u2.vals[p.r], p.r))); }
      c.addEventListener("click", () => choose(p));
      cards.appendChild(c);
    });
    b.appendChild(cards);
    b.appendChild(el("p", "small", "Z S ↑ ↓ puis Entrée, ou touches 1 2 3"));
  }, false, true);
  pBody._picks = picks;
};
const choose = (p) => {
  if (mode !== "levelup") return;
  if (p.evo) {
    p.u.apply();
    lv[p.u.id] = 1;
    banner("évolution : " + p.u.name);
  } else {
    p.u.apply(p.u.vals[p.r], p.r);
    lv[p.u.id] = (lv[p.u.id] || 0) + p.r + 1;
    if (p.r === 2 && p.u !== HEAL) st.legends++; // chaque carte légendaire ajoute un anneau d'aura
    if (p.u2) { p.u2.apply(p.u2.vals[p.r], p.r); lv[p.u2.id] = (lv[p.u2.id] || 0) + p.r + 1; }
      if (p.u.weapon) lv[p.u.weapon] = (lv[p.u.weapon] || 0) + p.r + 1; // le total de l'arme compte pour les évolutions
  }
  drawChips();
  if (pending > 0) { pending--; levelUpNext(); return; }
  hidePanel();
  mode = "play";
  last = performance.now();
};
const levelUpNext = () => {
  level++;
  need = Math.round(need * (level < 15 ? 1.25 : 1.1) + 3); // la courbe s'adoucit après le niveau 15, sinon on ne monte plus
  P.hp = Math.min(st.maxHp, P.hp + 12); // un niveau soigne un peu
  showLevelUp();
};

// les améliorations prises, en petites pastilles sous les jauges (le nombre est leur total de points)
const drawChips = () => {
  const box = $("#chips");
  box.textContent = "";
  UPGRADES.forEach((u) => { if (lv[u.id]) box.appendChild(el("span", "", u.name + " " + lv[u.id])); });
  P.weapons.forEach((w) => { if (WEAPONS[w.id].variants) box.appendChild(el("span", "", WEAPONS[w.id].name + " " + (lv[w.id] || 1))); });
  EVOS.forEach((e) => { if (lv[e.id]) box.appendChild(el("span", "evo", e.name)); });
};

const showPause = () => {
  if (mode !== "play") return;
  mode = "pause";
  show("pause", (b) => {
    b.appendChild(statsList([["temps", fmt(t)], ["monde", String(world + 1)], ["niveau", String(level)], ["ennemis tués", String(kills)]]));
    const row = el("div", "row");
    row.appendChild(button("reprendre", resume, true));
    row.appendChild(button("abandonner", () => end(false, true)));
    b.appendChild(row);
  });
};
const resume = () => {
  if (mode !== "pause") return;
  hidePanel();
  mode = "play";
  last = performance.now();
};

const end = (won, giveUp) => {
  mode = won ? "win" : "over";
  score = liveScore() + (won ? 1000 : 0);
  best.games++;
  if (won) best.wins[best.diff] = (best.wins[best.diff] || 0) + 1;
  const record = t > (best.t[best.diff] || 0);
  if (record) best.t[best.diff] = t;
  const recScore = score > best.score;
  if (recScore) best.score = score;
  best.kills = Math.max(best.kills, kills);
  best.level = Math.max(best.level, level);
  best.world = Math.max(best.world || 0, world + 1);
  saveBest();
  $("#pause").hidden = true;
  $("#dashBtn").hidden = true;
  $("#bossBar").hidden = true;
  $("#play").classList.remove("low");
  live(won ? "Tu as tenu 5 minutes" : "Perdu");
  if (won) SFX.win(); else if (!giveUp) SFX.lose();
  show(won ? "tenu" : giveUp ? "abandon" : "perdu", (b) => {
    b.appendChild(el("p", "big", won ? "Cinq minutes, tenues." : "Tu as tenu " + fmt(t) + "."));
    b.appendChild(statsList([
      ["score", score + (recScore ? " (record)" : "")],
      ["ennemis tués", String(kills)],
      ["monde atteint", String(world + 1)],
      ["niveau atteint", String(level)],
      ["meilleur temps (" + dm.name + ")", fmt(best.t[best.diff]) + (record && !won ? " (nouveau)" : "")],
    ]));
    const row = el("div", "row");
    row.appendChild(button("rejouer", start, true));
    row.appendChild(button("menu", showMenu));
    b.appendChild(row);
  });
};

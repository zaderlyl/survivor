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

// le titre en gros pixels : cinq lettres de 5 x 5, tracées ici
const LOGO = {
  S: [".####", "#....", ".###.", "....#", "####."],
  W: ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
  A: [".###.", "#...#", "#####", "#...#", "#...#"],
  R: ["####.", "#...#", "####.", "#.#..", "#..##"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
};
const logo = () => {
  const sc = 6, word = "SWARM";
  const c = document.createElement("canvas");
  c.width = (word.length * 6 - 1) * sc;
  c.height = 5 * sc;
  c.className = "logo-px";
  c.setAttribute("role", "img");
  c.setAttribute("aria-label", "swarm");
  const x = c.getContext("2d");
  word.split("").forEach((ch, i) => {
    LOGO[ch].forEach((row, r) => {
      row.split("").forEach((cell, k) => {
        if (cell !== "#") return;
        // la barre du A est rose : c'est le seul point actif du titre
        x.fillStyle = ch === "A" && r === 2 ? PINK : LIGHT;
        x.fillRect((i * 6 + k) * sc, r * sc, sc, sc);
      });
    });
  });
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
  show("jour 07", (b) => {
    b.appendChild(logo());
    b.appendChild(el("p", "big", "Tiens 5 minutes."));
    b.appendChild(el("p", "", "Tu te déplaces, ça tire tout seul. Chaque ennemi tué lâche un cristal : à chaque niveau, tu choisis une amélioration."));
    const row0 = el("div", "row diff");
    row0.setAttribute("role", "group");
    row0.setAttribute("aria-label", "Difficulté");
    Object.keys(DIFFS).forEach((k) => {
      const d = button(DIFFS[k].name, () => { best.diff = k; saveBest(); showMenu(); });
      d.setAttribute("aria-pressed", best.diff === k ? "true" : "false");
      row0.appendChild(d);
    });
    b.appendChild(row0);
    if (best.games) b.appendChild(statsList([["meilleur temps", fmt(best.t[best.diff] || 0)], ["victoires", String(best.wins[best.diff] || 0)], ["meilleur score", String(best.score)]]));
    const row = el("div", "row");
    row.appendChild(button("jouer", start, true));
    row.appendChild(button("comment jouer", () => showHow()));
    b.appendChild(row);
    b.appendChild(el("p", "small", "ZQSD ou flèches · Espace : dash · P : pause · au doigt : glisse n'importe où"));
    // le pied de page est caché sur téléphone : les crédits sont ici
    const cr = el("p", "small", "Conçu par ");
    [["Lino Volle", "https://github.com/Bebbou"], ["doc", "../docs/07-swarm.html"], ["code", "https://github.com/Bebbou/devtober-2026/tree/main/07-Swarm"]].forEach((l, i) => {
      const a = el("a", "", l[0]);
      a.href = l[1];
      if (i) cr.appendChild(document.createTextNode(" · "));
      cr.appendChild(a);
    });
    b.appendChild(cr);
  }, true);
};

// les règles tiennent sur un seul écran
const HOW = [
  ["Bouger", "ZQSD, WASD ou les flèches. Au doigt ou à la souris : glisse n'importe où, un joystick apparaît."],
  ["Tirer", "Automatique, sur l'ennemi le plus proche."],
  ["Dash", "Espace, ou le bouton rond sur téléphone. Il te protège un instant, il revient en 2,4 s."],
  ["Grandir", "Les cristaux blancs remplissent la barre rose : à chaque niveau, trois améliorations de rareté variable (commun, rare, épique, légendaire). Deux améliorations montées ensemble débloquent une évolution."],
  ["Danger", "Tout ce qui est rose te blesse : tirs ennemis, ligne de charge, zones au sol qui se remplissent. Tes tirs sont blancs. Le blindé encaisse mal les tirs : utilise lames, onde et explosions."],
  ["Tenir", "5 minutes. Deux boss arrivent à 2:30 et 4:15. P : pause."],
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

// la rareté se tire selon le niveau : les épiques arrivent à partir du niveau 3, les légendaires du niveau 6
const rollRarity = () => {
  const L = level;
  const w = [Math.max(20, 62 - L * 1.6), 28 + L * 0.5, L >= 3 ? 8 + L * 0.8 : 0, L >= 6 ? 1.5 + L * 0.35 : 0];
  let r = Math.random() * (w[0] + w[1] + w[2] + w[3]);
  for (let i = 0; i < 4; i++) {
    if (r < w[i]) return i;
    r -= w[i];
  }
  return 0;
};

const showLevelUp = () => {
  mode = "levelup";
  const pool = UPGRADES.filter((u) => (lv[u.id] || 0) < u.max);
  const picks = [];
  while (picks.length < 3 && pool.length) {
    const u = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    picks.push({ u, r: rollRarity() });
  }
  while (picks.length < 3) picks.push({ u: HEAL, r: 0 });
  // une évolution disponible prend la dernière place
  const evo = EVOS.find((e) => !lv[e.id] && e.need.every((id) => (lv[id] || 0) >= 3));
  if (evo) picks[2] = { u: evo, r: 4, evo: true };
  live("Niveau " + level + " : choisis une amélioration");
  SFX.level();
  show("niveau " + level, (b) => {
    const cards = el("div", "cards");
    picks.forEach((p, i) => {
      const c = el("button", "card r" + p.r);
      c.type = "button";
      const tag = el("span", "lv", p.evo ? "évolution" : p.u === HEAL ? "" : RARITY[p.r]);
      const name = el("b", "");
      name.appendChild(el("kbd", "", String(i + 1)));
      name.appendChild(document.createTextNode(p.u.name));
      c.appendChild(tag);
      c.appendChild(name);
      c.appendChild(el("span", "", p.evo ? p.u.text : p.u.text(p.u.vals[p.r])));
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
    p.u.apply(p.u.vals[p.r]);
    lv[p.u.id] = (lv[p.u.id] || 0) + p.r + 1;
  }
  drawChips();
  if (pending > 0) { pending--; levelUpNext(); return; }
  hidePanel();
  mode = "play";
  last = performance.now();
};
const levelUpNext = () => {
  level++;
  need = Math.round(need * 1.25 + 3);
  P.hp = Math.min(st.maxHp, P.hp + 12); // un niveau soigne un peu
  showLevelUp();
};

// les améliorations prises, en petites pastilles sous les jauges (le nombre est leur total de points)
const drawChips = () => {
  const box = $("#chips");
  box.textContent = "";
  UPGRADES.forEach((u) => { if (lv[u.id]) box.appendChild(el("span", "", u.name + " " + lv[u.id])); });
  EVOS.forEach((e) => { if (lv[e.id]) box.appendChild(el("span", "evo", e.name)); });
};

const showPause = () => {
  if (mode !== "play") return;
  mode = "pause";
  show("pause", (b) => {
    b.appendChild(statsList([["temps", fmt(t)], ["niveau", String(level)], ["ennemis tués", String(kills)]]));
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
      ["niveau atteint", String(level)],
      ["meilleur temps (" + dm.name + ")", fmt(best.t[best.diff]) + (record && !won ? " (nouveau)" : "")],
    ]));
    const row = el("div", "row");
    row.appendChild(button("rejouer", start, true));
    row.appendChild(button("menu", showMenu));
    b.appendChild(row);
  });
};

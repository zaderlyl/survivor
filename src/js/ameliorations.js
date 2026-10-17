"use strict";

/* ---------- Les améliorations ---------- */
// une fiche = un nom, une description du prochain niveau, un effet
// quatre raretés : chaque amélioration a une valeur par rareté. Une carte vaut 1 à 4 points, jusqu'à max points.
const RARITY = ["commun", "rare", "légendaire"];
const pct = (v) => Math.round(v * 100) + " %";
const plural = (v, w) => v + " " + w + (v > 1 ? "s" : "");
// text et apply reçoivent la valeur de la rareté, et la rareté (0 commun, 1 rare, 2 légendaire) pour les effets qui changent
const UPGRADES = [
  { id: "heart", name: "Vie", max: 8, vals: [20, 40, 80], text: (v) => "+" + v + " PV max et soigne autant", apply: (v) => { st.maxHp += v; P.hp = Math.min(st.maxHp, P.hp + v); } },
  { id: "dmg", name: "Puissance", max: 10, vals: [0.1, 0.2, 0.4], text: (v, r) => "+" + pct(v) + " de dégâts" + (r === 2 ? ", les ennemis tués explosent" : ""), apply: (v, r) => { st.dmg *= 1 + v; if (r === 2) st.deathBlast = true; } },
  { id: "rate", name: "Cadence", max: 10, vals: [0.08, 0.15, 0.3], text: (v) => "attaque " + pct(v) + " plus vite", apply: (v) => (st.cd *= 1 - v) },
  { id: "range", name: "Portée", max: 8, vals: [0.1, 0.2, 0.4], text: (v) => "+" + pct(v) + " de portée", apply: (v) => (st.range *= 1 + v) },
  { id: "speed", name: "Vitesse", max: 8, vals: [0.06, 0.12, 0.25], text: (v) => "+" + pct(v) + " de vitesse", apply: (v) => (st.speed *= 1 + v) },
  { id: "magnet", name: "Aimant", max: 8, vals: [40, 80, 200], text: (v, r) => "ramasse de +" + v + " px plus loin" + (r === 2 ? ", les cristaux viennent seuls" : ""), apply: (v, r) => { st.magnet += v; if (r === 2) st.autoPull = true; } },
  { id: "crit", name: "Critique", max: 8, vals: [0.08, 0.15, 0.3], text: (v, r) => "+" + pct(v) + " de chances de coup critique" + (r === 2 ? ", critiques x3" : ""), apply: (v, r) => { st.crit = Math.min(0.9, st.crit + v); if (r === 2) st.critMul = 3; } },
  { id: "regen", name: "Régénération", max: 6, vals: [0.5, 1.5, 3], text: (v) => "rend " + v + " PV par seconde", apply: (v) => (st.regen += v) },
  { id: "armor", name: "Armure", max: 6, vals: [0.06, 0.12, 0.25], text: (v) => "dégâts reçus -" + pct(v), apply: (v) => (st.armor = Math.min(0.6, st.armor + v)) },
  { id: "steal", name: "Vol de vie", max: 6, vals: [0.4, 1, 2.5], text: (v) => "rend " + v + " PV par ennemi tué", apply: (v) => (st.steal += v) },
  { id: "dash", name: "Glissade", max: 6, vals: [0.1, 0.2, 0.35], text: (v) => "le dash revient " + pct(v) + " plus vite", apply: (v) => (st.dashMul *= 1 - v) },
  // propres au tir de base de Volt, en attendant d'en faire des armes uniques
  { id: "multi", only: "shot", name: "Salve", max: 8, vals: [1, 2, 3], text: (v) => "+" + plural(v, "projectile"), apply: (v) => (st.count = Math.min(9, st.count + v)) },
  { id: "pierce", only: "shot", name: "Perforant", max: 8, vals: [1, 3, 5], text: (v) => "le tir traverse +" + plural(v, "ennemi"), apply: (v) => (st.pierce += v) },
  { id: "blast", only: "shot", name: "Éclat", max: 6, vals: [30, 45, 70], text: (v) => "tes tirs explosent : dégâts de zone sur " + v + " px", apply: (v) => (st.blast = Math.max(st.blast, v)) },
];
// une évolution se propose quand deux améliorations ont 3 points chacune ; elle remplace une carte et ne vient qu'une fois
const EVOS = [
  { id: "evoStorm", name: "Tempête", need: ["orb", "wave"], text: "+2 lames plus rapides et plus larges, l'onde revient 40 % plus vite", apply: () => { addWeapon("orb", 2); st.orbR = 78; st.orbDmg = 1.4; st.waveMul *= 0.6; } },
  { id: "evoRing", name: "Rafale", need: ["multi", "pierce"], text: "toutes les 3 salves, un cercle de 10 tirs part autour de toi", apply: () => { st.ring = true; } },
  { id: "evoVamp", name: "Vampire", need: ["heart", "steal"], text: "+40 PV max, vol de vie doublé, rend 1 PV par seconde", apply: () => { st.maxHp += 40; P.hp = Math.min(st.maxHp, P.hp + 40); st.steal *= 2; st.regen += 1; } },
];
const HEAL = { id: "heal", name: "Soin", max: 99, vals: [40, 40, 40], text: (v) => "rend " + v + " PV", apply: (v) => (P.hp = Math.min(st.maxHp, P.hp + v)) };

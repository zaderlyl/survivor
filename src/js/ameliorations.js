"use strict";

/* ---------- Les améliorations ---------- */
// une fiche = un nom, une description du prochain niveau, un effet
// quatre raretés : chaque amélioration a une valeur par rareté. Une carte vaut 1 à 4 points, jusqu'à max points.
const RARITY = ["commun", "rare", "épique", "légendaire"];
const pct = (v) => Math.round(v * 100) + " %";
const plural = (v, w) => v + " " + w + (v > 1 ? "s" : "");
const UPGRADES = [
  { id: "rate", name: "Cadence", max: 10, vals: [0.1, 0.16, 0.24, 0.36], text: (v) => "tire " + pct(v) + " plus vite", apply: (v) => (st.cd *= 1 - v) },
  { id: "dmg", name: "Dégâts", max: 10, vals: [1, 1.5, 2.5, 4], text: (v) => "+" + v + " de dégâts par tir", apply: (v) => (st.dmg += v) },
  { id: "multi", only: "shot", name: "Salve", max: 8, vals: [1, 1, 2, 3], text: (v) => "+" + plural(v, "projectile"), apply: (v) => (st.count = Math.min(9, st.count + v)) },
  { id: "pierce", only: "shot", name: "Perforant", max: 8, vals: [1, 2, 3, 5], text: (v) => "le tir traverse +" + plural(v, "ennemi"), apply: (v) => (st.pierce += v) },
  { id: "range", name: "Portée", max: 8, vals: [0.15, 0.25, 0.4, 0.6], text: (v) => "+" + pct(v) + " de portée", apply: (v) => (st.range *= 1 + v) },
  { id: "speed", name: "Vitesse", max: 8, vals: [0.08, 0.14, 0.22, 0.35], text: (v) => "+" + pct(v) + " de vitesse", apply: (v) => (st.speed *= 1 + v) },
  { id: "magnet", name: "Aimant", max: 8, vals: [45, 80, 130, 220], text: (v) => "ramasse de +" + v + " px plus loin", apply: (v) => (st.magnet += v) },
  { id: "heart", name: "Cœur", max: 8, vals: [20, 35, 55, 90], text: (v) => "+" + v + " PV max et soigne autant", apply: (v) => { st.maxHp += v; P.hp = Math.min(st.maxHp, P.hp + v); } },
  { id: "crit", name: "Critique", max: 8, vals: [0.1, 0.16, 0.24, 0.4], text: (v) => "+" + pct(v) + " de chances de tir double", apply: (v) => (st.crit = Math.min(0.9, st.crit + v)) },
  { id: "regen", name: "Régénération", max: 6, vals: [0.5, 1, 2, 3.5], text: (v) => "rend " + v + " PV par seconde", apply: (v) => (st.regen += v) },
  { id: "armor", name: "Armure", max: 6, vals: [0.08, 0.14, 0.22, 0.35], text: (v) => "dégâts reçus -" + pct(v), apply: (v) => (st.armor = Math.min(0.6, st.armor + v)) },
  { id: "blast", only: "shot", name: "Éclat", max: 6, vals: [30, 40, 52, 70], text: (v) => "tes tirs explosent : dégâts de zone sur " + v + " px", apply: (v) => (st.blast = Math.max(st.blast, v)) },
  { id: "steal", name: "Vol de vie", max: 6, vals: [0.4, 0.8, 1.5, 3], text: (v) => "rend " + v + " PV par ennemi tué", apply: (v) => (st.steal += v) },
  { id: "dash", name: "Glissade", max: 6, vals: [0.12, 0.2, 0.3, 0.45], text: (v) => "le dash revient " + pct(v) + " plus vite", apply: (v) => (st.dashMul *= 1 - v) },
];
// une évolution se propose quand deux améliorations ont 3 points chacune ; elle remplace une carte et ne vient qu'une fois
const EVOS = [
  { id: "evoStorm", name: "Tempête", need: ["orb", "wave"], text: "+2 lames plus rapides et plus larges, l'onde revient 40 % plus vite", apply: () => { addWeapon("orb", 2); st.orbR = 78; st.orbDmg = 1.4; st.waveMul *= 0.6; } },
  { id: "evoRing", name: "Rafale", need: ["multi", "pierce"], text: "toutes les 3 salves, un cercle de 10 tirs part autour de toi", apply: () => { st.ring = true; } },
  { id: "evoVamp", name: "Vampire", need: ["heart", "steal"], text: "+40 PV max, vol de vie doublé, rend 1 PV par seconde", apply: () => { st.maxHp += 40; P.hp = Math.min(st.maxHp, P.hp + 40); st.steal *= 2; st.regen += 1; } },
];
const HEAL = { id: "heal", name: "Soin", max: 99, vals: [40, 40, 40, 40], text: (v) => "rend " + v + " PV", apply: (v) => (P.hp = Math.min(st.maxHp, P.hp + v)) };

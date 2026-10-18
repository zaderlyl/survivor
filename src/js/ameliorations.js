"use strict";

/* ---------- Les améliorations (les cartes de boost) ---------- */
/*
  Une carte de boost a :
    id     son identifiant                    name   son nom affiché
    max    combien de fois on peut la prendre (99 = pratiquement sans limite)
    vals   sa valeur selon la rareté : [commun, rare, légendaire]
    text   (v, r) => la phrase affichée sur la carte ; v = la valeur, r = la rareté (0 commun, 1 rare, 2 légendaire)
    apply  (v, r) => ce que la carte fait quand on la prend
    only   (facultatif) la carte n'apparaît que si l'on possède cette arme
  Les raretés : une carte « légendaire » a une valeur plus forte ET parfois un effet en plus (r === 2).
*/
const RARITY = ["commun", "rare", "légendaire"];

// 0.25 -> "25 %"
const pct = (v) => Math.round(v * 100) + " %";
// plural(2, "lame") -> "2 lames"
const plural = (v, mot) => v + " " + mot + (v > 1 ? "s" : "");

const UPGRADES = [
  // +PV max, et soigne d'autant
  {
    id: "heart", name: "Vie", max: 99, vals: [20, 40, 80],
    text: (v) => "+" + v + " PV max et soigne autant",
    apply: (v) => {
      st.maxHp += v;
      P.hp = Math.min(st.maxHp, P.hp + v);
    },
  },
  // +dégâts ; légendaire : les ennemis tués explosent
  {
    id: "dmg", name: "Puissance", max: 99, vals: [0.1, 0.2, 0.4],
    text: (v, r) => "+" + pct(v) + " de dégâts" + (r === 2 && !st.deathBlast ? ", les ennemis tués explosent" : ""),
    apply: (v, r) => {
      st.dmg *= 1 + v;
      if (r === 2) st.deathBlast = true;
    },
  },
  // moins de délai entre deux tirs
  {
    id: "rate", name: "Cadence", max: 99, vals: [0.08, 0.15, 0.3],
    text: (v) => "attaque " + pct(v) + " plus vite",
    apply: (v) => (st.cd *= 1 - v),
  },
  {
    id: "range", name: "Portée", max: 99, vals: [0.1, 0.2, 0.4],
    text: (v) => "+" + pct(v) + " de portée",
    apply: (v) => (st.range *= 1 + v),
  },
  {
    id: "speed", name: "Vitesse", max: 99, vals: [0.06, 0.12, 0.25],
    text: (v) => "+" + pct(v) + " de vitesse",
    apply: (v) => (st.speed *= 1 + v),
  },
  // ramasse les cristaux de plus loin ; légendaire : ils viennent seuls
  {
    id: "magnet", name: "Aimant", max: 99, vals: [40, 80, 200],
    text: (v, r) => "ramasse de +" + v + " px plus loin" + (r === 2 && !st.autoPull ? ", les cristaux viennent seuls" : ""),
    apply: (v, r) => {
      st.magnet += v;
      if (r === 2) st.autoPull = true;
    },
  },
  // chances de coup critique (au-delà de 100 %, tout est critique) ; légendaire : critiques x3
  {
    id: "crit", name: "Critique", max: 99, vals: [0.08, 0.15, 0.3],
    text: (v, r) => "+" + pct(v) + " de chances de coup critique" + (r === 2 && st.critMul < 3 ? ", critiques x3" : ""),
    apply: (v, r) => {
      st.crit += v;
      if (r === 2) st.critMul = 3;
    },
  },
  {
    id: "regen", name: "Régénération", max: 99, vals: [0.5, 1.5, 3],
    text: (v) => "rend " + v + " PV par seconde",
    apply: (v) => (st.regen += v),
  },
  // les réductions se multiplient : on tend vers 100 % sans jamais y arriver
  {
    id: "armor", name: "Armure", max: 99, vals: [0.06, 0.12, 0.25],
    text: (v) => "dégâts reçus -" + pct(v),
    apply: (v) => (st.armor = 1 - (1 - st.armor) * (1 - v)),
  },
  {
    id: "steal", name: "Vol de vie", max: 99, vals: [0.4, 1, 2.5],
    text: (v) => "rend " + v + " PV par ennemi tué",
    apply: (v) => (st.steal += v),
  },
  // plus d'expérience par cristal
  {
    id: "xp", name: "Savoir", max: 99, vals: [0.1, 0.25, 0.6],
    text: (v) => "+" + pct(v) + " d'expérience gagnée",
    apply: (v) => (st.xpMul += v),
  },
  {
    id: "dash", name: "Glissade", max: 99, vals: [0.1, 0.2, 0.35],
    text: (v) => "le dash revient " + pct(v) + " plus vite",
    apply: (v) => (st.dashMul *= 1 - v),
  },

  // ---- propres au tir de base de Volt, en attendant d'en faire des armes uniques ----
  {
    id: "multi", only: "shot", name: "Salve", max: 99, vals: [1, 2, 3],
    text: (v) => "+" + plural(v, "projectile"),
    apply: (v) => (st.count += v),
  },
  {
    id: "pierce", only: "shot", name: "Perforant", max: 99, vals: [1, 3, 5],
    text: (v) => "le tir traverse +" + plural(v, "ennemi"),
    apply: (v) => (st.pierce += v),
  },
  {
    id: "blast", only: "shot", name: "Éclat", max: 99, vals: [30, 45, 70],
    text: (v) => "tes tirs explosent : +" + v + " px de zone d'explosion",
    apply: (v) => (st.blast += v),
  },
];

/* ---------- Les évolutions ---------- */
// Une évolution se propose quand deux améliorations (need) ont 3 points chacune ; elle remplace une carte et ne vient qu'une fois.
const EVOS = [
  {
    id: "evoStorm", name: "Tempête", need: ["orb", "wave"],
    text: "+2 lames plus rapides et plus larges, l'onde revient 40 % plus vite",
    apply: () => {
      weapon("orb").n = (weapon("orb").n || 0) + 2;
      st.orbR = 78;
      st.orbDmg = 1.4;
      st.waveMul *= 0.6;
    },
  },
  {
    id: "evoRing", name: "Rafale", need: ["multi", "pierce"],
    text: "toutes les 3 salves, un cercle de 10 tirs part autour de toi",
    apply: () => {
      st.ring = true;
    },
  },
  {
    id: "evoVamp", name: "Vampire", need: ["heart", "steal"],
    text: "+40 PV max, vol de vie doublé, rend 1 PV par seconde",
    apply: () => {
      st.maxHp += 40;
      P.hp = Math.min(st.maxHp, P.hp + 40);
      st.steal *= 2;
      st.regen += 1;
    },
  },
];

// la carte « soin », proposée quand il n'y a rien d'autre
const HEAL = {
  id: "heal", name: "Soin", max: 99, vals: [40, 40, 40],
  text: (v) => "rend " + v + " PV",
  apply: (v) => (P.hp = Math.min(st.maxHp, P.hp + v)),
};

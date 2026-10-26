"use strict";

/* ---------- Les personnages ---------- */
// chacun démarre avec une attaque de base simple, qui donne son style de jeu
const CHARS = {
  volt: { name: "Volt", weapon: "shot", text: "Petit tir rapide, peu de dégâts. Équilibré." },
  chrome: { name: "Chrome", weapon: "slash", text: "Coup d'épée en arc devant lui. Courte portée, gros dégâts." },
  rig: { name: "Rig", weapon: "blaster", text: "Blaster : gros tir lent qui traverse, long cooldown." },
  ghost: { name: "Ghost", weapon: "shotgun", text: "Tir en éventail à courte portée." },
  arc: { name: "Arc", weapon: "laser", text: "Laser qui traverse toute la ligne d'ennemis, lent." },
  pulse: { name: "Pulse", weapon: "grenade", text: "Grenade sur l'ennemi le plus proche, explosion en zone." },
  zap: { name: "Zap", weapon: "chain", text: "Éclair qui saute sur trois ennemis proches." },
};
if (!CHARS[best.char]) best.char = "volt";

"use strict";

/* ---------- Les mutations : des effets qui changent la façon de jouer d'une arme ---------- */
/*
  Une arme gagne des mutations par paliers (à 5, 15 et 30 points) : la carte suivante de cette arme devient une carte de mutation,
  et l'on choisit une mutation parmi trois. Chaque mutation donne un vrai bonus (environ +30 à +50 % d'efficacité dans son cas favorable).

  Comment ça marche :
  - CUR_W est « l'arme dont on traite le coup en ce moment ». On le règle pendant la mise à jour de l'arme, et on marque (champ mw)
    chaque effet et chaque tir qu'elle crée, pour retrouver d'où vient un coup, même quelques secondes plus tard.
  - damage() (partie.js) appelle mutMul() avant d'infliger un coup, et mutAfter() après.
  - w.muts est la liste des mutations de l'arme, w.mset la même chose sous forme { id: true } pour les tests rapides.
*/

let CUR_W = null; // l'arme dont on traite le coup
let MUT_BUSY = false; // vrai pendant un coup d'une mutation (écho, contagion) : il ne déclenche pas d'autres mutations

const MUT_TIERS = [5, 15, 30]; // les points à atteindre sur une arme pour gagner une mutation

const MUTATIONS = {
  echo: { name: "Écho", text: "chaque coup se répète une seconde plus tard, à moitié de puissance" },
  surge: { name: "Surcharge", text: "un coup sur quatre vaut triple" },
  giant: { name: "Gigantisme", text: "zones 60 % plus grandes et coups 30 % plus lourds, mais l'arme revient 20 % plus lentement" },
  frost: { name: "Givre", text: "les ennemis touchés ralentissent de 35 % et subissent 30 % de dégâts en plus pendant 3 s" },
  contagion: { name: "Contagion", text: "35 % des dégâts sautent sur l'ennemi voisin" },
  fission: { name: "Fission", text: "un ennemi tué par l'arme lâche cinq éclats en étoile" },
  magnet: { name: "Aimant", text: "chaque impact attire les ennemis autour de lui ; +15 % de dégâts" },
  blaze: { name: "Brasier", text: "les ennemis touchés brûlent 3 s" },
  leech: { name: "Sangsue", text: "une part des dégâts te soigne" },
  dash: { name: "Élan", text: "chaque dash raccourcit de 1 s la recharge de l'arme" },
  riposte: { name: "Riposte", text: "chaque coup reçu raccourcit de 1 s la recharge de l'arme (au plus toutes les 1,5 s)" },
  rebound: { name: "Rebond", text: "les tirs rebondissent sur un ennemi de plus" },
};

// une mutation convient-elle à cette arme ?
const mutationFits = (w, id) => {
  if (w.mset && w.mset[id]) return false; // déjà prise
  if (id === "dash" || id === "riposte") return (WEAPONS[w.id].cd0 || 0) > 0; // il faut une arme à recharge
  if (id === "rebound") return (w.nb || 0) > 0; // il faut une arme qui tire des projectiles
  return true;
};

// trois mutations tirées au hasard parmi celles qui conviennent
const mutationChoices = (w) => {
  const liste = Object.keys(MUTATIONS).filter((id) => mutationFits(w, id));
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste.slice(0, 3);
};

// combien de mutations l'arme peut-elle encore recevoir, d'après ses points ?
const mutationDue = (w) => {
  const points = lv[w.id] || 0;
  const paliers = MUT_TIERS.filter((p) => points >= p).length;
  return paliers - (w.muts ? w.muts.length : 0);
};

// donne la mutation à l'arme
const applyMutation = (w, id) => {
  w.muts = w.muts || [];
  w.mset = w.mset || {};
  w.muts.push(id);
  w.mset[id] = true;
  w.echoQ = w.echoQ || [];
  if (id === "giant") {
    // toutes les tailles de l'arme grandissent de 60 %
    (WEAPONS[w.id].variants || []).forEach((v) => {
      if (["rad", "wid", "size", "len", "rng"].indexOf(v.id) >= 0) w[v.id] = (w[v.id] || 0) + 0.6;
    });
  }
};

/* ---------- La mise à jour d'une arme ---------- */
// remplace l'appel direct à WEAPONS[id].update : une arme sans mutation est mise à jour exactement comme avant
const runWeapon = (w, dt) => {
  const def = WEAPONS[w.id];
  const nf0 = fx.length;
  const nb0 = bullets.length;
  if (!w.mset) {
    def.update(w, dt);
    if (bullets.length > nb0) w.nb = (w.nb || 0) + bullets.length - nb0; // on retient si l'arme tire des projectiles
    return;
  }
  CUR_W = w;
  const cd0 = w.cd;
  def.update(w, dt);
  CUR_W = null;
  // Gigantisme : la recharge qui vient d'être posée est 20 % plus longue
  if (w.mset.giant && w.cd > cd0 + 0.05) w.cd = cd0 + (w.cd - cd0) * 1.2;
  // on marque ce que l'arme vient de créer
  for (let i = nf0; i < fx.length; i++) if (!fx[i].mw) fx[i].mw = w;
  for (let i = nb0; i < bullets.length; i++) {
    const b = bullets[i];
    b.mw = w;
    if (w.mset.rebound) b.bounce = (b.bounce || 0) + 1; // Rebond : le tir repart vers un autre ennemi
  }
  if (bullets.length > nb0) w.nb = (w.nb || 0) + bullets.length - nb0;
  // Écho : les coups en attente qui arrivent à échéance
  if (w.echoQ.length) {
    CUR_W = w;
    MUT_BUSY = true;
    for (let i = w.echoQ.length - 1; i >= 0; i--) {
      const q = w.echoQ[i];
      if (q.at > t) continue;
      w.echoQ.splice(i, 1);
      if (q.e.hp > 0) {
        damage(q.e, q.d, false, 0, 0, q.src);
        ringFx(q.e.x, q.e.y, "#9ad8ff", 16, 0.18);
      }
    }
    MUT_BUSY = false;
    CUR_W = null;
  }
};

/* ---------- Avant et après un coup ---------- */
// le multiplicateur de dégâts des mutations (Surcharge, Aimant, Gigantisme)
const mutMul = (w, e) => {
  let m = 1;
  if (w.mset.surge) {
    w.hits = (w.hits || 0) + 1;
    if (w.hits % 4 === 0) {
      m *= 3;
      ringFx(e.x, e.y, "#ffffff", 26, 0.2); // le coup surchargé
    }
  }
  if (w.mset.magnet) m *= 1.15;
  if (w.mset.giant) m *= 1.3;
  return m;
};

// les effets d'une mutation après un coup : d = dégâts infligés
const mutAfter = (w, e, d, src) => {
  const m = w.mset;
  if (m.echo && w.echoQ.length < 80) w.echoQ.push({ e, d: d * 0.5, at: t + 1, src });
  if (m.frost) {
    e.gelT = 3;
    e.gelV = 0.35;
    if (!(e.vuln > 1.5)) { e.vuln = 3; e.vuln2 = 1.3; } // un ennemi ralenti subit 30 % de plus
  }
  if (m.blaze) {
    e.burn = Math.max(e.burn || 0, 3);
    if (!(e.burnT > 0)) e.burnT = 0.5;
    e.bd = Math.max(e.bd || 0, d * 0.1); // chaque tic de brûlure vaut 10 % du coup
  }
  if (m.leech) P.hp = Math.min(st.maxHp, P.hp + Math.min(d * 0.05, st.maxHp * 0.003));
  if (m.contagion) {
    let cible = null; // l'ennemi le plus proche de la victime (qui n'est pas elle)
    let meilleure = 130 * 130;
    for (let i = 0; i < enemies.length; i++) {
      const q = enemies[i];
      if (q === e || q.hp <= 0) continue;
      const dd = (q.x - e.x) * (q.x - e.x) + (q.y - e.y) * (q.y - e.y);
      if (dd < meilleure) {
        meilleure = dd;
        cible = q;
      }
    }
    if (cible) {
      MUT_BUSY = true;
      damage(cible, d * 0.35, false, 0, 0, src);
      MUT_BUSY = false;
      if ((w.visT || 0) < t) {
        w.visT = t + 0.1;
        fx.push({ k: "bolt", color: "#ff9ccf", pts: [[e.x, e.y], [cible.x, cible.y]], life: 0.12, t: 0.12 });
      }
    }
  }
  if (m.magnet && (w.magT || 0) < t) {
    w.magT = t + 0.2;
    for (let i = 0; i < enemies.length; i++) {
      const q = enemies[i];
      if (q === e || q.hp <= 0 || q.type === "boss") continue;
      const dx = e.x - q.x;
      const dy = e.y - q.y;
      const dd = Math.hypot(dx, dy) || 1;
      if (dd < 110) {
        q.kx += (dx / dd) * 130;
        q.ky += (dy / dd) * 130;
      }
    }
  }
};

// Fission : l'ennemi tué par l'arme lâche cinq éclats en étoile (ils ne déclenchent pas de mutation)
const fissionBurst = (e) => {
  const col = WEAPON_COLOR[e.lastMw.id] || heroColor();
  const base = rnd(0, 6.283);
  const degats = Math.max(st.dmg, (e.lastHit || st.dmg) * 0.5);
  for (let k = 0; k < 5; k++) fire(base + (k / 5) * 6.283, 380, 0.5, { x: e.x, y: e.y, dmg: degats, color: col, pierce: 0 });
  spark(e.x, e.y, col, 8, 240);
};

// Élan : chaque dash raccourcit d'une seconde la recharge des armes qui ont cette mutation
const mutOnDash = () => {
  P.weapons.forEach((w) => {
    if (w.mset && w.mset.dash && w.cd > 0) w.cd = Math.max(0, w.cd - 1);
  });
};

// Riposte : chaque coup reçu raccourcit d'une seconde la recharge (au plus toutes les 1,5 s pour chaque arme)
const mutOnHurt = () => {
  P.weapons.forEach((w) => {
    if (w.mset && w.mset.riposte && w.cd > 0 && (w.ripT || 0) < t) {
      w.ripT = t + 1.5;
      w.cd = Math.max(0, w.cd - 1);
    }
  });
};

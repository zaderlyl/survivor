"use strict";

/* ---------- Les ennemis ---------- */
// r : rayon, s : taille d'un pixel du dessin, hp : vie de départ, sp : vitesse, dmg : contact, xp : cristaux lâchés
const TYPES = {
  crawler: { r: 7, s: 2, hp: 2, sp: 66, dmg: 6, xp: 1 },
  brute: { r: 10, s: 2, hp: 10, sp: 42, dmg: 15, xp: 5 },
  shooter: { r: 8, s: 2, hp: 4, sp: 56, dmg: 6, xp: 3 },
  dasher: { r: 8, s: 2, hp: 5, sp: 60, dmg: 12, xp: 4 },
  splitter: { r: 10, s: 2, hp: 7, sp: 48, dmg: 10, xp: 4 },
  tank: { r: 12, s: 2, hp: 26, sp: 34, dmg: 18, xp: 10 },
  mage: { r: 8, s: 2, hp: 5, sp: 48, dmg: 6, xp: 4 },
  boss: { r: 25, s: 4, hp: 220, sp: 38, dmg: 25, xp: 60 },
};

/* ---------- L'état d'une partie ---------- */
// Toutes ces variables sont recréées par reset() au début de chaque partie.
let P; // le joueur : x, y, hp, r (rayon), inv (invincibilité), dash, weapons (ses armes)...
let st; // ses statistiques : dmg (dégâts), cd (délai entre deux tirs), range, speed, maxHp, crit, armor...
let lv; // combien de fois chaque carte a été prise : { "heart": 2, "orb.n": 3 }
let fx; // les effets des armes en cours (lames, éclairs, pièges de boss...)
let enemies; // les ennemis vivants (le boss en fait partie)
let bullets; // les tirs du joueur
let ebullets; // les tirs des ennemis
let gems; // les cristaux d'expérience au sol
let drops; // les objets au sol (soin, aimant, bombe)
let zones; // les zones roses au sol qui claquent
let parts; // les particules (étincelles, fumée)
let texts; // les chiffres de dégâts qui flottent
let waves; // les vagues annoncées
let ghosts; // les images rémanentes laissées par un dash
let freeze = 0; // pause d'image à la mort du boss
let t; // temps de la partie, en secondes
let kills; // ennemis tués
let level; // niveau du joueur
let xp; // expérience actuelle (la barre rose)
let need; // expérience nécessaire pour le prochain niveau
let spawnAcc; // compteur qui décide quand faire arriver un nouvel ennemi
let nextWave; // moment de la prochaine vague
let stormAt; // moments des prochains orages
let world; // numéro du monde en partant de 0 (monde 1 = 0)
let worldT; // temps passé dans ce monde
let phase; // "waves" (les vagues), "boss", "clear" (tuer le reste), "transition"
let phaseT; // temps passé dans la phase
let cam; // la caméra : le point du monde au centre de l'écran
let joy; // le joystick (null si on ne touche pas l'écran)
let pending; // niveaux gagnés en attente de choix de carte
let mode; // "menu", "play", "levelup", "pause", "over" (perdu), "win"
let combo; // série de tués en cours
let comboT; // temps avant que la série retombe
let shake; // force du tremblement d'écran
let score; // score de la partie
let dm; // les réglages de la difficulté choisie (voir DIFFS)
const keys = {}; // les touches du clavier actuellement enfoncées
mode = "menu";

// La grille qui range les ennemis par case : sert à ne tester que les voisins proches
const cells = [];
const CELL = 48; // côté d'une case, en pixels
const COLS = Math.ceil(ARENA_W / CELL) + 1;
const ROWS = Math.ceil(ARENA_H / CELL) + 1;
for (let i = 0; i < COLS * ROWS; i++) cells.push([]);

// la série de tués multiplie le score : x2 à 15, x3 à 30, pas plus
const comboMult = () => 1 + Math.min(2, Math.floor(combo / 15));
const liveScore = () => score + Math.floor(t) * 5 + level * 50;

// remet tout à zéro pour une nouvelle partie
const reset = () => {
  P = {
    x: ARENA_W / 2, y: ARENA_H / 2, // au milieu de l'arène
    r: 9, hp: 100,
    inv: 0, flash: 0, // invincibilité après un coup, et clignotement
    aim: 0, // direction de visée
    dash: 0, dashCd: 0, dashMax: DASH_CD,
    volley: 0, // compteur de salves du tir de base
    dx: 1, dy: 0, // dernière direction de déplacement
    face: 1, walk: 0, // pour dessiner le héros
    weapons: [],
  };
  addWeapon((CHARS[best.char] || CHARS.volt).weapon, 1);
  st = {
    cd: 0.42, dmg: 2, count: 1, pierce: 0, range: 440, speed: 170, magnet: 60, maxHp: 100,
    orbs: 0, crit: 0, wave: 0, regen: 0, armor: 0, blast: 0, steal: 0, dashMul: 1,
    orbR: 52, orbDmg: 0.6, waveMul: 1, ring: false, critMul: 2, deathBlast: false, autoPull: false,
    legends: 0, xpMul: 0, hasteV: 0, hasteT: 0, hasteExt: 0,
  };
  lv = {};
  fx = []; enemies = []; bullets = []; ebullets = []; gems = []; drops = [];
  zones = []; parts = []; texts = []; waves = []; ghosts = [];
  t = 0; kills = 0; level = 1; xp = 0; need = 6; spawnAcc = 0; nextWave = 30;
  stormAt = [100, 200];
  world = 0; worldT = 0; phase = "waves"; phaseT = 0;
  cam = { x: P.x, y: P.y };
  joy = null; pending = 0; combo = 0; comboT = 0; shake = 0; score = 0;
  dm = DIFFS[best.diff] || DIFFS.normal;
};
reset();

// chaque monde est plus dur que le précédent : plus de vie, plus de dégâts, plus d'arrivées
// jusqu'au monde 6 la montée est linéaire ; ensuite elle devient exponentielle pour suivre les builds sans limite
const LATE = 5;
const lateMul = (k) => Math.pow(k, Math.max(0, world - LATE));
const worldHp = () => (1 + 0.4 * Math.min(world, LATE)) * lateMul(1.15);
// les coups reçus montent avec le monde et avec la vie maximale du joueur : 320 PV ne doivent pas encaisser des coups à 6
const incoming = () => (1 + 0.5 * Math.min(world, LATE)) * lateMul(1.12) * Math.sqrt(st.maxHp / 100);
const worldSpawn = () => 1 + 0.2 * world;

// compteur qui donne à chaque ennemi un numéro de 0 à 6 (pour varier légèrement leur animation)
let seedN = 0;

// fait apparaître un ennemi de ce type en (x, y) ; instant = true : il est déjà pleinement formé
const spawn = (type, x, y, instant) => {
  const d = TYPES[type];

  // la vie des ennemis suit aussi ta puissance de feu (dégâts et cadence), pour que 50 de dégâts par coup ne vident pas tout en un coup
  const power = Math.pow(Math.max(1, (st.dmg / 2) / (st.cd / 0.42)), 0.8);
  // la vie monte avec le temps du monde, puis avec le monde
  const m = (1 + worldT / 260) * dm.hp * worldHp() * power;
  const bossHp = 2.2 * (1 + 0.5 * Math.min(world, LATE)) * lateMul(1.15) * dm.hp * power;
  const hp = d.hp * (type === "boss" ? bossHp : m);

  // le crawler accélère avec le temps du monde (jusqu'à +60 %)
  const vitesse = d.sp * (type === "crawler" ? 1 + Math.min(worldT / 500, 0.6) : 1);
  // plus il est costaud, plus il rapporte
  const xpLache = Math.round(d.xp * Math.pow(hp / d.hp, 0.75) * 10) / 10;

  enemies.push({
    type, x, y, r: d.r,
    hp, max: hp,
    skin: world % 5, // quel dessin (un par monde)
    sp: vitesse,
    dmg: d.dmg * dm.dmg,
    xp: xpLache,
    fire: rnd(0.5, 2), // délai avant son premier tir
    hit: 0, // clignotement quand il est touché
    orbCd: 0, // délai avant que les lames puissent le retoucher
    kx: 0, ky: 0, // recul
    age: instant ? 1 : 0, // 0 = vient d'apparaître (il grandit), 1 = adulte
    seed: seedN++ % 7,
    st: 0, // état du dasher (0 attend, 1 vise, 2 fonce, 3 repos)
    stT: rnd(0.5, 1.5), // temps restant dans cet état
    dirx: 0, diry: 0,
  });
};

// un point juste en dehors de l'écran, sur un des quatre bords, et dans l'arène
const edgePoint = (extra) => {
  const hw = cssW / zoom / 2 + extra, hh = cssH / zoom / 2 + extra;
  for (let k = 0; k < 8; k++) {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? P.x - hw : side === 1 ? P.x + hw : P.x + rnd(-hw, hw);
    const y = side === 2 ? P.y - hh : side === 3 ? P.y + hh : P.y + rnd(-hh, hh);
    if (x > 20 && x < ARENA_W - 20 && y > 20 && y < ARENA_H - 20) return [x, y];
  }
  return [clamp(P.x + (Math.random() < 0.5 ? -hw : hw), 20, ARENA_W - 20), clamp(P.y + rnd(-hh, hh), 20, ARENA_H - 20)];
};

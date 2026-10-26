"use strict";

/* ---------- Les images : du pixel art écrit en texte ---------- */
// # corps, o fond, p rose, m gris, w clair. Chaque image existe en 2 poses, tournée ou non, normale ou en éclair blanc.
const ART = {
  player: { pal: { "#": LIGHT, o: BG }, frames: [
    ["..#####..", ".#######.", "#########", "#########", "#########", "#########", ".#######.", "..#####..", ".##...##."],
    ["..#####..", ".#######.", "#########", "#########", "#########", "#########", ".#######.", "..#####..", "..##.##.."],
  ] },
  crawler: { pal: { "#": GREY, o: BG }, frames: [
    ["..#.#..", ".#####.", "#######", "##o#o##", ".#####.", ".#...#."],
    ["..#.#..", ".#####.", "#######", "##o#o##", ".#####.", "#.....#"],
  ] },
  brute: { pal: { "#": DARK, o: BG, m: GREY, p: PINK }, frames: [
    [".mmmmmmm.", "m#######m", "m#p###p#m", "m#######m", "m#ooooo#m", "m#######m", "m#######m", ".##...##.", "##.....##"],
    [".mmmmmmm.", "m#######m", "m#p###p#m", "m#######m", "m#ooooo#m", "m#######m", "m#######m", ".##...##.", ".#.....#."],
  ] },
  shooter: { pal: { "#": GREY, p: PINK }, frames: [
    ["...#...", "..###..", ".##p##.", "###p###", ".##p##.", "..###..", "...#..."],
    ["...#...", "..###..", ".#####.", "###p###", ".#####.", "..###..", "...#..."],
  ] },
  dasher: { pal: { "#": GREY, o: BG, p: PINK }, frames: [
    ["...#...", "..###..", ".#####.", "##o#o##", "#######", ".#...#.", "#.....#"],
    ["...#...", "..###..", ".#####.", "##o#o##", "#######", "..#.#..", ".#...#."],
  ] },
  splitter: { pal: { "#": LIGHT, o: BG, m: GREY }, frames: [
    [".mmmmmmm.", "m#######m", "m#o#o#o#m", "m#######m", "m#o#o#o#m", "m#######m", "m#######m", ".m#####m.", "..mmmmm.."],
    [".mmmmmmm.", "m#######m", "m#o#o#o#m", "m#######m", "m#o#o#o#m", "m#######m", ".m#####m.", ".m#####m.", "..mmmmm.."],
  ] },
  tank: { pal: { "#": DARK, o: BG, m: LIGHT, p: PINK }, frames: [
    ["mmmmmmmmm", "m#######m", "m#p###p#m", "mmmmmmmmm", "m#######m", "m#######m", "mmmmmmmmm", ".##...##.", "##.....##"],
    ["mmmmmmmmm", "m#######m", "m#p###p#m", "mmmmmmmmm", "m#######m", "m#######m", "mmmmmmmmm", ".##...##.", ".#.....#."],
  ] },
  mage: { pal: { "#": GREY, o: BG, p: PINK }, frames: [
    ["...#...", "..###..", ".#ooo#.", ".#pop#.", ".#####.", "#######", "#.#.#.#"],
    ["...#...", "..###..", ".#ooo#.", ".#pop#.", ".#####.", "#######", ".#.#.#."],
  ] },
  boss: { pal: { "#": "#1a1a1a", o: BG, p: PINK, m: DARK }, frames: [
    ["..ppppppppp..", ".p#########p.", "p###########p", "p#ooo###ooo#p", "p#opo###opo#p", "p#ooo###ooo#p", "p###########p", "p##o#o#o#o##p", ".p#########p.", ".p##.###.##p.", ".p##..#..##p.", "..p.......p..", "..p.......p.."],
    ["..ppppppppp..", ".p#########p.", "p###########p", "p#ooo###ooo#p", "p#opo###opo#p", "p#ooo###ooo#p", "p###########p", "p##o#o#o#o##p", ".p#########p.", ".p##.###.##p.", ".p#..###..#p.", "..p.......p..", "..p.......p.."],
  ] },
  gem: { pal: { "#": LIGHT, m: GREY }, frames: [["..#..", ".#m#.", "#mmm#", ".#m#.", "..#.."], ["..#..", ".###.", "#####", ".###.", "..#.."]] },
  gemBig: { pal: { "#": LIGHT, p: PINK }, frames: [["...#...", "..###..", ".##p##.", "###p###", ".##p##.", "..###..", "...#..."]] },
  heart: { pal: { "#": PINK }, frames: [[".#.#.", "#####", "#####", ".###.", "..#.."]] },
  magnet: { pal: { "#": LIGHT, p: PINK, o: BG }, frames: [["#.....#", "#.....#", "#.....#", "#.....#", "##...##", ".#####.", "..ppp.."]] },
  bomb: { pal: { "#": GREY, p: PINK, o: BG }, frames: [["....p..", "...p...", ".#####.", "#######", "#######", "#######", ".#####."]] },
};
/* ---------- Transformer le texte en image ---------- */
const spriteCache = {}; // les images déjà fabriquées (on ne les refait pas à chaque image)

// Fabrique (ou retrouve) l'image d'un dessin.
//   name = nom dans ART · frame = quelle pose · flip = retournée gauche-droite · hit = en éclair blanc (quand il est touché)
//   look = équipement du héros (ses lignes et ses couleurs viennent alors de ART[name].look)
const sprite = (name, frame, flip, hit, look) => {
  const key = name + "|" + frame + "|" + (flip ? 1 : 0) + "|" + (hit ? 1 : 0) + "|" + (look || "");
  let image = spriteCache[key];
  if (image) return image;

  const dessin = ART[name];
  const variante = look && dessin.look ? dessin.look(frame % dessin.frames.length, look) : null;
  const lignes = variante ? variante.rows : dessin.frames[frame % dessin.frames.length];
  const palette = variante ? variante.pal : dessin.pal;

  // une petite image d'un pixel par lettre du dessin
  image = document.createElement("canvas");
  image.width = lignes[0].length;
  image.height = lignes.length;
  const pinceau = image.getContext("2d");
  for (let ligne = 0; ligne < lignes.length; ligne++) {
    for (let colonne = 0; colonne < lignes[ligne].length; colonne++) {
      const lettre = lignes[ligne][flip ? lignes[ligne].length - 1 - colonne : colonne];
      if (lettre === ".") continue; // un point = transparent
      // en éclair blanc, tout devient clair (sauf les contours, qui prennent la couleur du fond)
      pinceau.fillStyle = hit ? (lettre === "o" || lettre === "k" ? BG : LIGHT) : (palette[lettre] || LIGHT);
      pinceau.fillRect(colonne, ligne, 1, 1);
    }
  }
  spriteCache[key] = image;
  return image;
};

// pose une image centrée en (x, y), chaque pixel du dessin valant `s` pixels du monde ; alpha < 1 = semi-transparente
const blit = (name, x, y, s, frame, flip, hit, alpha, look) => {
  const image = sprite(name, frame, flip, hit, look);
  if (alpha !== undefined && alpha < 1) g.globalAlpha = alpha;
  g.drawImage(image, Math.round(x - (image.width * s) / 2), Math.round(y - (image.height * s) / 2), image.width * s, image.height * s);
  if (alpha !== undefined && alpha < 1) g.globalAlpha = 1;
};

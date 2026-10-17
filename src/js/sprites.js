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
const spriteCache = {};
const sprite = (name, frame, flip, hit) => {
  const key = name + "|" + frame + "|" + (flip ? 1 : 0) + "|" + (hit ? 1 : 0);
  let c = spriteCache[key];
  if (c) return c;
  const a = ART[name], rows = a.frames[frame % a.frames.length];
  c = document.createElement("canvas");
  c.width = rows[0].length;
  c.height = rows.length;
  const x = c.getContext("2d");
  for (let r = 0; r < rows.length; r++) {
    for (let k = 0; k < rows[r].length; k++) {
      const ch = rows[r][flip ? rows[r].length - 1 - k : k];
      if (ch === ".") continue;
      x.fillStyle = hit ? (ch === "o" ? BG : LIGHT) : (a.pal[ch] || LIGHT);
      x.fillRect(k, r, 1, 1);
    }
  }
  spriteCache[key] = c;
  return c;
};
// pose une image centrée en (x, y), chaque pixel du dessin valant `s` pixels du monde
const blit = (name, x, y, s, frame, flip, hit, alpha) => {
  const c = sprite(name, frame, flip, hit);
  if (alpha !== undefined && alpha < 1) g.globalAlpha = alpha;
  g.drawImage(c, Math.round(x - (c.width * s) / 2), Math.round(y - (c.height * s) / 2), c.width * s, c.height * s);
  if (alpha !== undefined && alpha < 1) g.globalAlpha = 1;
};

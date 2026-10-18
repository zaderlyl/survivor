"use strict";

/* ---------- Une partie ---------- */
let last = 0, raf = 0;
const start = () => {
  soundOn();
  reset();
  freeze = 0;
  world = dbg.world; // #monde=3 : démarrer directement dans un monde plus avancé
  if (dbg.orbs) { addWeapon("orb", 1); weapon("orb").n = dbg.orbs - 1; lv.orb = dbg.orbs; } // #lames=3 : essayer les lames tout de suite
  if (dbg.time) {
    t = dbg.time;
    worldT = dbg.time;
    stormAt = stormAt.filter((b) => b > worldT);
    nextWave = (Math.floor(worldT / 30) + 1) * 30;
  }
  hud.hp = hud.xp = hud.dash = hud.boss = -1; // les jauges se redessinent
  $("#play").classList.remove("low");
  hidePanel();
  drawChips();
  document.body.classList.add("playing");
  $("#bars").hidden = false;
  $("#pause").hidden = false;
  $("#dashBtn").hidden = false;
  mode = "play";
  last = performance.now();
  live("C'est parti");
  if (dbg.test && window.__swarmRaf) schedule(frame); // test : une boucle pilotée de l'extérieur
  else if (!raf) raf = requestAnimationFrame(frame);
};

const banner = (txt) => {
  const b = $("#banner");
  b.textContent = txt;
  b.hidden = false;
  live(txt);
  setTimeout(() => { b.hidden = true; }, 2600);
};

const burst = (x, y, n, color, speed) => {
  if (calm) return;
  for (let i = 0; i < n && parts.length < MAX_PARTS; i++) {
    const a = Math.random() * 6.28, s = rnd(40, speed || 140);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.25, 0.45), max: 0.45, color, size: Math.random() < 0.3 ? 5 : 3 });
  }
};
const floatText = (x, y, txt, color, size) => {
  if (texts.length > 40) texts.shift();
  texts.push({ x, y, txt, color, size, life: 0.6 });
};

const dropGem = (x, y, v) => {
  if (gems.length >= MAX_GEMS) { gainXp(v); return; }
  gems.push({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), v, pull: false });
};
const XP_MUL = 1.6; // les cristaux rapportent plus : monter de niveau doit être rapide
const gainXp = (v) => {
  xp += v * XP_MUL;
  while (xp >= need) { xp -= need; if (mode === "levelup") pending++; else levelUpNext(); }
};

const kill = (i) => {
  const e = enemies[i];
  kills++;
  combo++;
  comboT = 2;
  score += 10 * comboMult();
  SFX.kill();
  if (st.steal > 0) P.hp = Math.min(st.maxHp, P.hp + st.steal);
  if (st.deathBlast) splash(e, 45, st.dmg * 0.8);
  burst(e.x, e.y, e.type === "boss" ? 40 : 6, e.type === "boss" ? PINK : GREY, e.type === "boss" ? 300 : 140);
  spark(e.x, e.y, worldTheme().glow, e.type === "boss" ? 30 : 9, e.type === "boss" ? 320 : 200); // et des étincelles aux couleurs du monde
  flashFx(e.x, e.y, worldTheme().glow, e.type === "boss" ? 40 : 14);
  if (e.type === "boss") {
    for (let k = 0; k < 8; k++) dropGem(e.x, e.y, 4);
    drops.push({ type: "heart", x: e.x, y: e.y, life: 20 });
    shake = Math.max(shake, 12);
    freeze = calm ? 0 : 0.45;
    banner("boss vaincu");
    SFX.win();
  } else {
    dropGem(e.x, e.y, e.xp);
    const r = Math.random();
    if (r < 0.03) drops.push({ type: "heart", x: e.x, y: e.y, life: 14 });
    else if (r < 0.045) drops.push({ type: "magnet", x: e.x, y: e.y, life: 14 });
    else if (r < 0.055) drops.push({ type: "bomb", x: e.x, y: e.y, life: 14 });
  }
  if (e.type === "splitter") for (let k = 0; k < 3; k++) { spawn("crawler", e.x + rnd(-12, 12), e.y + rnd(-12, 12), true); enemies[enemies.length - 1].age = 0.1; }
  enemies[i] = enemies[enemies.length - 1];
  enemies.pop();
};

const hurt = (dmg) => {
  if (P.inv > 0 || dbg.god) return;
  dmg *= incoming() * (1 - st.armor);
  P.hp -= dmg;
  P.weapons.forEach((w) => { const od = WEAPONS[w.id].onHurt; if (od) od(w, dmg); }); // les armes qui réagissent aux coups reçus
  P.inv = 0.8;
  P.flash = 0.2;
  shake = Math.max(shake, 6);
  SFX.hurt();
  floatText(P.x, P.y - 14, "-" + Math.round(dmg), PINK, 14);
  if (P.hp <= 0) { P.hp = 0; end(false); }
};

const damage = (e, d, crit, kx, ky, src) => {
  if (e.type === "tank" && src === "bullet") d *= 0.5; // le blindé encaisse mal les tirs, mieux les lames, l'onde et les explosions
  e.hp -= d;
  e.hit = 0.06;
  e.kx += kx;
  e.ky += ky;
  floatText(e.x + rnd(-4, 4), e.y - e.r - 4, String(Math.round(d)), crit ? PINK : LIGHT, crit ? 14 : 11);
  const hc = hitColor(src);
  spark(e.x, e.y, hc, crit ? 12 : 6, crit ? 260 : 180); // une gerbe à la couleur du coup
  flashFx(e.x, e.y, hc, crit ? 16 : 10);
  if (crit) ringFx(e.x, e.y, "#ffffff", 22, 0.2);
  SFX.hit();
};

// l'explosion d'un tir : des dégâts de zone autour de l'ennemi touché
const splash = (src, r, d) => {
  for (let i = 0; i < enemies.length; i++) {
    const o = enemies[i];
    if (o !== src && o.hp > 0 && Math.hypot(o.x - src.x, o.y - src.y) < r + o.r) damage(o, d, false, 0, 0, "blast");
  }
  if (waves.length < 14) { waves.push({ x: src.x, y: src.y, r: 0, max: r, life: 0.18, t: 0.18, color: heroColor() }); spark(src.x, src.y, heroColor(), 6, 150); }
};

const pickup = (d) => {
  SFX.pick();
  if (d.type === "heart") { P.hp = Math.min(st.maxHp, P.hp + 25); floatText(P.x, P.y - 16, "+25", PINK, 14); }
  else if (d.type === "magnet") { gems.forEach((q) => (q.pull = true)); floatText(P.x, P.y - 16, "aimant", LIGHT, 12); }
  else {
    SFX.bomb();
    shake = Math.max(shake, 10);
    waves.push({ x: P.x, y: P.y, r: 0, max: 320, life: 0.4, t: 0.4 });
    enemies.forEach((e) => { if (Math.hypot(e.x - P.x, e.y - P.y) < 320) damage(e, e.type === "boss" ? 30 : 12, false, 0, 0); });
  }
};

// le monde suivant : on garde tout, mais tout est plus dur
const nextWorld = () => {
  world++;
  worldT = 0;
  phase = "waves";
  phaseT = 0;
  stormAt = [100, 200];
  nextWave = 30;
  spawnAcc = 0;
  ebullets.length = 0;
  zones.length = 0;
  P.hp = Math.min(st.maxHp, P.hp + st.maxHp * 0.4); // le passage soigne un peu
  hud.hp = -1;
};

const update = (dt) => {
  t += dt;
  worldT += dt;

  // la personne bouge, ou glisse
  const [ix, iy] = input();
  if (Math.hypot(ix, iy) > 0.1) { P.dx = ix; P.dy = iy; if (Math.abs(ix) > 0.2) P.face = ix > 0 ? 1 : -1; P.walk += dt; }
  if (P.dash > 0) {
    const dl = Math.hypot(P.dx, P.dy) || 1;
    P.x = clamp(P.x + (P.dx / dl) * 620 * dt, P.r, ARENA_W - P.r);
    P.y = clamp(P.y + (P.dy / dl) * 620 * dt, P.r, ARENA_H - P.r);
    P.dash -= dt;
    if (!calm) ghosts.push({ x: P.x, y: P.y, life: 0.2, face: P.face });
  } else {
    P.x = clamp(P.x + ix * st.speed * dt, P.r, ARENA_W - P.r);
    P.y = clamp(P.y + iy * st.speed * dt, P.r, ARENA_H - P.r);
  }
  P.dashCd = Math.max(0, P.dashCd - dt);
  if (st.regen > 0) P.hp = Math.min(st.maxHp, P.hp + st.regen * dt);
  P.inv = Math.max(0, P.inv - dt);
  P.flash = Math.max(0, P.flash - dt);
  P.muzzle = Math.max(0, (P.muzzle || 0) - dt);
  comboT -= dt;
  if (comboT <= 0) combo = 0;
  shake = Math.max(0, shake - 40 * dt);

  if (phase === "waves") {
    // les ennemis arrivent : plus vite à mesure que le temps passe, et de nouvelles sortes au fil des minutes
    spawnAcc += (1.1 + worldT * 0.04) * dm.spawn * worldSpawn() * dt;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      if (enemies.length >= MAX_ENEMIES) continue;
      const r = Math.random();
      const pBrute = worldT > 35 ? Math.min(0.12 + (worldT - 35) / 900, 0.26) : 0;
      const pShoot = worldT > 70 ? Math.min(0.08 + (worldT - 70) / 1500, 0.16) : 0;
      const pDash = worldT > 100 ? Math.min(0.06 + (worldT - 100) / 1600, 0.14) : 0;
      const pSplit = worldT > 150 ? Math.min(0.05 + (worldT - 150) / 1800, 0.12) : 0;
      const pMage = worldT > 90 ? Math.min(0.04 + (worldT - 90) / 2000, 0.09) : 0;
      const pTank = worldT > 120 ? Math.min(0.04 + (worldT - 120) / 2000, 0.1) : 0;
      let type = "crawler", c = pBrute;
      if (r < c) type = "brute";
      else if (r < (c += pShoot)) type = "shooter";
      else if (r < (c += pDash)) type = "dasher";
      else if (r < (c += pSplit)) type = "splitter";
      else if (r < (c += pMage)) type = "mage";
      else if (r < (c += pTank)) type = "tank";
      const [x, y] = edgePoint(40);
      spawn(type, x, y);
    }
    if (worldT >= nextWave) {
      nextWave += 30;
      const n = Math.min(14 + Math.floor(worldT / 10), 40);
      for (let i = 0; i < n && enemies.length < MAX_ENEMIES; i++) {
        const [x, y] = edgePoint(30 + (i % 3) * 14);
        spawn("crawler", x, y);
      }
      banner("vague");
    }
    // l'orage : des zones roses tombent autour de toi, l'une après l'autre
    if (stormAt.length && worldT >= stormAt[0]) {
      stormAt.shift();
      banner("orage");
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * 6.283, d = rnd(40, 260);
        zones.push({ x: clamp(P.x + Math.cos(a) * d, 40, ARENA_W - 40), y: clamp(P.y + Math.sin(a) * d, 40, ARENA_H - 40), r: 50, t: 1.1 + i * 0.4, max: 1.1 + i * 0.4, dmg: 14 * dm.dmg, fired: false, boom: 0 });
      }
    }
    if (worldT >= WORLD_WAVES) {
      // les vagues s'arrêtent : le boss arrive
      phase = "boss";
      const [x, y] = edgePoint(80);
      spawn("boss", x, y);
      banner("boss : " + BOSS_NAMES[world % 5]);
      SFX.boss();
      shake = Math.max(shake, 8);
    }
  } else if (phase === "boss") {
    if (!enemies.some((e) => e.type === "boss")) { phase = "clear"; banner("tue tout ce qui reste"); }
  } else if (phase === "clear") {
    if (enemies.length === 0) { phase = "absorb"; phaseT = 0; banner("l'xp est à toi"); }
  } else if (phase === "absorb") {
    // toute l'xp de la carte file vers toi
    phaseT += dt;
    gems.forEach((q) => { q.pull = true; });
    if (!gems.length || phaseT > 7) { phase = "transition"; phaseT = 0; banner("monde " + (world + 2) + " : " + THEMES[(world + 1) % 5].name); }
  } else if (phase === "transition") {
    phaseT += dt;
    if (phaseT > 2.5) nextWorld();
  }

  // la grille : retrouver les voisins sans comparer tout le monde
  for (let i = 0; i < cells.length; i++) cells[i].length = 0;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const cx = clamp((e.x / CELL) | 0, 0, COLS - 1), cy = clamp((e.y / CELL) | 0, 0, ROWS - 1);
    cells[cy * COLS + cx].push(i);
  }

  // les ennemis avancent, se repoussent, touchent
  const decoys = fx.filter((f) => f.k === "decoy");
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    e.age += dt;
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
    let mx = dx / d, my = dy / d, sp = e.sp;
    if (decoys.length) {
      // un leurre à moins de 360 px attire l'ennemi à la place de toi
      let dec = null, bd = 360 * 360;
      for (let k = 0; k < decoys.length; k++) {
        const ex = decoys[k].x - e.x, ey = decoys[k].y - e.y, dd = ex * ex + ey * ey;
        if (dd < bd) { bd = dd; dec = decoys[k]; }
      }
      if (dec) { const dl = Math.sqrt(bd) || 1; mx = (dec.x - e.x) / dl; my = (dec.y - e.y) / dl; }
    }
    if (e.slowed > 0) { e.slowed -= dt; sp *= 0.5; }
    if (e.type === "shooter") {
      if (phase === "clear") { /* une fois le boss tombé, les tireurs foncent sur toi : le nettoyage doit finir */ } else if (d < 240) { mx = -mx; my = -my; } else if (d < 300) sp = 0;
      e.fire -= dt;
      if (e.fire <= 0 && d < 520 && e.age > 0.3) {
        e.fire = 2.2;
        ebullets.push({ x: e.x, y: e.y, vx: (dx / d) * 210, vy: (dy / d) * 210, life: 4, dmg: 10 * dm.dmg });
      }
    } else if (e.type === "mage") {
      // il garde ses distances et marque le sol où tu te trouves : il faut bouger avant que la zone claque
      if (phase === "clear") { /* même chose : il s'approche */ } else if (d < 280) { mx = -mx; my = -my; } else if (d < 340) sp = 0;
      e.fire -= dt;
      if (e.fire <= 0 && d < 560 && e.age > 0.3) {
        e.fire = 3.6;
        zones.push({ x: P.x + ix * 40, y: P.y + iy * 40, r: 48, t: 1, max: 1, dmg: 14 * dm.dmg, fired: false, boom: 0 });
      }
    } else if (e.type === "dasher") {
      // il avance, vise (ligne rose), puis fonce tout droit et se repose
      e.stT -= dt;
      if (e.st === 0) {
        if (d < 300 && e.stT <= 0) { e.st = 1; e.stT = 0.6; e.dirx = dx / d; e.diry = dy / d; }
      } else if (e.st === 1) { sp = 0; if (e.stT <= 0) { e.st = 2; e.stT = 0.45; } }
      else if (e.st === 2) { mx = e.dirx; my = e.diry; sp = 400; if (e.stT <= 0) { e.st = 3; e.stT = 1.2; } }
      else { sp = 0; if (e.stT <= 0) { e.st = 0; e.stT = rnd(0.5, 1.5); } }
    } else if (e.type === "boss") {
      const r = bossAI(e, dt, dx, dy, d);
      mx = r.mx; my = r.my; sp = r.sp;
    }
    if (mode === "menu") { mx = 0; my = 0; sp = 0; }
    let px = 0, py = 0;
    const cx = clamp((e.x / CELL) | 0, 0, COLS - 1), cy = clamp((e.y / CELL) | 0, 0, ROWS - 1);
    for (let yy = Math.max(0, cy - 1); yy <= Math.min(ROWS - 1, cy + 1); yy++) {
      for (let xx = Math.max(0, cx - 1); xx <= Math.min(COLS - 1, cx + 1); xx++) {
        const c = cells[yy * COLS + xx];
        for (let k = 0; k < c.length; k++) {
          const o = enemies[c[k]];
          if (o === e) continue;
          const ox = e.x - o.x, oy = e.y - o.y, min = e.r + o.r, dd = ox * ox + oy * oy;
          if (dd < min * min && dd > 0.01) { const s = Math.sqrt(dd); px += (ox / s) * (min - s); py += (oy / s) * (min - s); }
        }
      }
    }
    if (e.frozen > 0) { e.frozen -= dt; sp = 0; }
    e.x = clamp(e.x + mx * sp * dt + px * 10 * dt + e.kx * dt, e.r, ARENA_W - e.r);
    e.y = clamp(e.y + my * sp * dt + py * 10 * dt + e.ky * dt, e.r, ARENA_H - e.r);
    e.kx *= Math.max(0, 1 - 9 * dt);
    e.ky *= Math.max(0, 1 - 9 * dt);
    e.hit = Math.max(0, e.hit - dt);
    e.orbCd = Math.max(0, e.orbCd - dt);
    if (e.burn > 0) {
      e.burn -= dt;
      e.burnT -= dt;
      if (e.burnT <= 0) { e.burnT = 0.5; damage(e, st.dmg * 0.4, false, 0, 0, "burn"); }
    }
    if (d < e.r + P.r && e.age > 0.25) hurt(e.dmg);
  }
  if (mode !== "play") return;

  // les zones au sol : elles claquent une fois leur délai écoulé
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    if (!z.fired) {
      z.t -= dt;
      if (z.t <= 0) {
        z.fired = true;
        z.boom = 0.18;
        if (Math.hypot(z.x - P.x, z.y - P.y) < z.r + P.r) hurt(z.dmg);
      }
    } else {
      z.boom -= dt;
      if (z.boom <= 0) zones.splice(i, 1);
    }
  }
  if (mode !== "play") return;

  // chaque arme se met à jour seule (tir, onde...)
  P.weapons.forEach((w) => WEAPONS[w.id].update(w, dt));

  // les tirs touchent : trois petits pas par image, pour qu'un tir rapide ne traverse pas un ennemi sans le toucher
  for (let b = bullets.length - 1; b >= 0; b--) {
    const bl = bullets[b];
    let gone = false;
    if (bl.home) {
      const n = nearest(400, bl.x, bl.y);
      if (n) {
        const sp = Math.hypot(bl.vx, bl.vy), a = Math.atan2(bl.vy, bl.vx), ta = Math.atan2(n.y - bl.y, n.x - bl.x);
        const na = a + clamp(Math.atan2(Math.sin(ta - a), Math.cos(ta - a)), -6 * dt, 6 * dt);
        bl.vx = Math.cos(na) * sp;
        bl.vy = Math.sin(na) * sp;
      }
    }
    for (let sub = 0; sub < 3 && !gone; sub++) {
      const h = dt / 3;
      bl.x += bl.vx * h;
      bl.y += bl.vy * h;
      bl.life -= h;
      if (sub === 0 && Math.random() < 0.7) trail(bl.x, bl.y, bl.color || heroColor(), bl.size ? 3 : 2); // la traînée du tir
      if (bl.smoke && sub === 0 && Math.random() < 0.4) smokeFx(bl.x, bl.y, 1); // et la fumée des missiles
      if (bl.life <= 0 || bl.x < 0 || bl.y < 0 || bl.x > ARENA_W || bl.y > ARENA_H) { gone = true; break; }
      const cx = clamp((bl.x / CELL) | 0, 0, COLS - 1), cy = clamp((bl.y / CELL) | 0, 0, ROWS - 1);
      for (let yy = Math.max(0, cy - 1); yy <= Math.min(ROWS - 1, cy + 1) && !gone; yy++) {
        for (let xx = Math.max(0, cx - 1); xx <= Math.min(COLS - 1, cx + 1) && !gone; xx++) {
          const c = cells[yy * COLS + xx];
          for (let k = 0; k < c.length; k++) {
            const e = enemies[c[k]];
            if (!e || e.hp <= 0 || bl.hit.indexOf(e) >= 0) continue;
            const dx = e.x - bl.x, dy = e.y - bl.y;
            if (dx * dx + dy * dy < (e.r + (bl.rad || 3)) * (e.r + (bl.rad || 3))) {
              const crit = Math.random() < st.crit;
              const kb = e.type === "boss" ? 15 : 90;
              damage(e, (bl.dmg !== undefined ? bl.dmg : st.dmg) * (crit ? st.critMul : 1), crit, (bl.vx / 520) * kb, (bl.vy / 520) * kb, "bullet");
              if (st.blast > 0 && !bl.dmg) splash(e, st.blast, st.dmg * 0.5);
              if (bl.blast) splash(e, bl.blast, bl.bd !== undefined ? bl.bd : st.dmg);
              bl.hit.push(e);
              if (bl.bounce > 0) {
                // le tir repart vers l'ennemi le plus proche qu'il n'a pas encore touché
                let nx = null, nd = 240 * 240;
                for (let q = 0; q < enemies.length; q++) {
                  const o = enemies[q];
                  if (o.hp <= 0 || bl.hit.indexOf(o) >= 0) continue;
                  const ex = o.x - bl.x, ey = o.y - bl.y, dd = ex * ex + ey * ey;
                  if (dd < nd) { nd = dd; nx = o; }
                }
                if (nx) {
                  const sp = Math.hypot(bl.vx, bl.vy), a = Math.atan2(nx.y - bl.y, nx.x - bl.x);
                  bl.vx = Math.cos(a) * sp;
                  bl.vy = Math.sin(a) * sp;
                  bl.life = Math.max(bl.life, 0.5);
                  bl.bounce--;
                  continue;
                }
              }
              if (bl.pierce > 0) bl.pierce--; else { gone = true; break; }
            }
          }
        }
      }
    }
    if (gone) { bullets[b] = bullets[bullets.length - 1]; bullets.pop(); }
  }

  // les effets : coups d'épée, lasers, éclairs, grenades en vol
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.life -= dt;
    if (f.tick) f.tick(f, dt);
    // ambiance d'un effet : des braises qui montent (emb), des étincelles qui crépitent (spk)
    if (f.emb && Math.random() < 0.5) { const aa = rnd(0, 6.283), rr = Math.sqrt(Math.random()) * (f.R || 20); emberFx(f.x + Math.cos(aa) * rr, f.y + Math.sin(aa) * rr, f.emb); }
    if (f.spk && Math.random() < 0.4) { const aa = rnd(0, 6.283), rr = Math.sqrt(Math.random()) * (f.R || 14); spark(f.x + Math.cos(aa) * rr, f.y + Math.sin(aa) * rr, f.spk, 1, 90); }
    if (f.k === "nade") {
      const u = 1 - Math.max(0, f.life) / f.t;
      f.x = f.x0 + (f.tx - f.x0) * u;
      f.y = f.y0 + (f.ty - f.y0) * u;
    }
    if (f.life <= 0) { if (f.onEnd) f.onEnd(f); fx.splice(i, 1); }
  }

  // les ennemis morts
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].hp <= 0) kill(i);

  // les projectiles ennemis
  for (let b = ebullets.length - 1; b >= 0; b--) {
    const bl = ebullets[b];
    bl.x += bl.vx * dt;
    bl.y += bl.vy * dt;
    bl.life -= dt;
    let gone = bl.life <= 0 || bl.x < 0 || bl.y < 0 || bl.x > ARENA_W || bl.y > ARENA_H;
    if (!gone && Math.hypot(bl.x - P.x, bl.y - P.y) < P.r + 4) { hurt(bl.dmg); gone = true; }
    if (gone) { ebullets[b] = ebullets[ebullets.length - 1]; ebullets.pop(); }
  }
  if (mode !== "play") return;

  // les cristaux : l'aimant les tire vers toi
  for (let i = gems.length - 1; i >= 0; i--) {
    const gm = gems[i];
    const dx = P.x - gm.x, dy = P.y - gm.y, d = Math.hypot(dx, dy);
    if (d < st.magnet || st.autoPull) gm.pull = true;
    if (gm.pull) {
      const pullSp = phase === "absorb" ? 1100 : 420;
      gm.x += (dx / (d || 1)) * pullSp * dt;
      gm.y += (dy / (d || 1)) * pullSp * dt;
    }
    if (d < P.r + 6) { gems[i] = gems[gems.length - 1]; gems.pop(); SFX.gem(combo); gainXp(gm.v); if (mode === "levelup") return; }
  }

  // les bonus au sol : cœur, aimant, bombe
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.life -= dt;
    if (d.life <= 0) { drops[i] = drops[drops.length - 1]; drops.pop(); continue; }
    if (Math.hypot(d.x - P.x, d.y - P.y) < P.r + 10) { drops[i] = drops[drops.length - 1]; drops.pop(); pickup(d); }
  }

  // éclats, nombres, ondes, images rémanentes
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
    p.life -= dt;
    if (p.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); }
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const q = texts[i];
    q.life -= dt;
    if (!calm) q.y -= 36 * dt;
    if (q.life <= 0) texts.splice(i, 1);
  }
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.life -= dt;
    w.r = w.max * (1 - w.life / w.t);
    if (w.life <= 0) waves.splice(i, 1);
  }
  for (let i = ghosts.length - 1; i >= 0; i--) {
    ghosts[i].life -= dt;
    if (ghosts[i].life <= 0) ghosts.splice(i, 1);
  }

  // la caméra suit, sans sortir de l'arène quand l'écran est plus petit qu'elle
  cam.x += (P.x - cam.x) * Math.min(1, dt * 8);
  cam.y += (P.y - cam.y) * Math.min(1, dt * 8);
};

// le menu : les ennemis dérivent et rebondissent sur un cadre autour du centre
const drift = (dt) => {
  enemies.forEach((e) => {
    e.x += e.dirx * dt;
    e.y += e.diry * dt;
    if (Math.abs(e.x - ARENA_W / 2) > 460) e.dirx = -e.dirx;
    if (Math.abs(e.y - ARENA_H / 2) > 300) e.diry = -e.diry;
    e.age += dt;
  });
};


"use strict";

/* ---------- Le son : des bips synthétisés, rien à télécharger ---------- */
let actx = null;
const sfxAt = {};
const tone = (name, f0, f1, dur, type, vol, gap) => {
  if (!best.sound || !actx) return;
  const now = actx.currentTime;
  if (gap && now - (sfxAt[name] || 0) < gap) return;
  sfxAt[name] = now;
  const o = actx.createOscillator(), a = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, now);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
  a.gain.setValueAtTime(vol, now);
  a.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(a);
  a.connect(actx.destination);
  o.start(now);
  o.stop(now + dur + 0.02);
};
const SFX = {
  shoot: () => tone("shoot", 640, 320, 0.05, "square", 0.025, 0.07),
  hit: () => tone("hit", 220, 120, 0.04, "square", 0.03, 0.05),
  kill: () => tone("kill", 330, 110, 0.09, "square", 0.045, 0.04),
  gem: (n) => tone("gem", 700 + Math.min(n, 12) * 45, 900 + Math.min(n, 12) * 45, 0.04, "triangle", 0.04, 0.03),
  hurt: () => tone("hurt", 140, 60, 0.18, "sawtooth", 0.09),
  dash: () => tone("dash", 200, 700, 0.12, "triangle", 0.06),
  pick: () => tone("pick", 500, 1000, 0.15, "triangle", 0.07),
  boss: () => tone("boss", 90, 45, 0.6, "sawtooth", 0.1),
  wave: () => tone("wave", 160, 360, 0.2, "triangle", 0.05),
  bomb: () => tone("bomb", 120, 30, 0.35, "sawtooth", 0.1),
  level: () => { [520, 660, 880].forEach((f, i) => setTimeout(() => tone("lv" + i, f, f * 1.02, 0.12, "square", 0.05), i * 90)); },
  win: () => { [520, 660, 880, 1040].forEach((f, i) => setTimeout(() => tone("w" + i, f, f * 1.02, 0.18, "square", 0.06), i * 120)); },
  lose: () => { [330, 262, 196].forEach((f, i) => setTimeout(() => tone("l" + i, f, f * 0.9, 0.22, "square", 0.06), i * 150)); },
};
const soundOn = () => {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
  }
  if (actx && actx.state === "suspended") actx.resume();
};
const syncSoundBtn = () => {
  const b = $("#sound");
  b.setAttribute("aria-pressed", best.sound ? "true" : "false");
  b.textContent = best.sound ? "son" : "muet";
};

"use strict";

/* ---------- Départ ---------- */
$("#pause").addEventListener("click", showPause);
$("#sound").addEventListener("click", () => {
  best.sound = !best.sound;
  soundOn();
  saveBest();
  syncSoundBtn();
});
const dashBtn = $("#dashBtn");
dashBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); dash(); });
$("#help").addEventListener("click", () => {
  if (mode === "play") showPause();
  else if (mode === "pause") showHow(() => { mode = "play"; showPause(); });
  else if (mode === "menu" || mode === "over" || mode === "win") showHow();
});
document.title = GAME_NAME;
$(".logo").lastChild.textContent = GAME_NAME.toLowerCase();
window.addEventListener("resize", () => { fit(); render(); });
fit();
syncSoundBtn();

let seen = false;
try { seen = !!localStorage.getItem(KEY + "-vu"); } catch (e) { /* visite proposée à chaque fois */ }
if (seen) showMenu(); else showHow();
last = performance.now();
raf = requestAnimationFrame(frame);

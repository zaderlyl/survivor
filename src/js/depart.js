"use strict";

/* ---------- Départ : on branche les boutons et on lance la boucle du jeu ---------- */

// boutons de la barre du haut
$("#pause").addEventListener("click", showPause);
$("#sound").addEventListener("click", () => {
  best.sound = !best.sound;
  soundOn();
  saveBest();
  syncSoundBtn();
});
const dashBtn = $("#dashBtn");
dashBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  dash();
});
$("#help").addEventListener("click", () => {
  if (mode === "play") showPause();
  else if (mode === "pause") showHow(() => { mode = "play"; showPause(); });
  else if (mode === "menu" || mode === "over" || mode === "win") showHow();
});

// le nom du jeu, dans l'onglet et sur le logo
document.title = GAME_NAME;
$(".logo").lastChild.textContent = GAME_NAME.toLowerCase();

// quand la fenêtre change de taille, on ajuste le canevas
window.addEventListener("resize", () => {
  fit();
  render();
});
fit();
syncSoundBtn();

// la première fois, on montre « comment jouer » ; ensuite directement le menu
let seen = false;
try {
  seen = !!localStorage.getItem(KEY + "-vu");
} catch (e) {
  /* visite proposée à chaque fois */
}
if (seen) showMenu();
else showHow();

// c'est parti : la boucle du jeu (frame, dans rendu.js) tourne à chaque image
last = performance.now();
raf = requestAnimationFrame(frame);

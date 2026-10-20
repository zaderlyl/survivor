# Survivor

Survivor-like cyberpunk en navigateur (HTML/CSS/JS sans dépendance, sans build), basé sur Swarm de Lino Volle. Nom provisoire du jeu : Neon Horde (`GAME_NAME` dans `src/js/config.js`, seul endroit à changer).

Ce fichier est lu par les Claude de tous les contributeurs : il fixe ce qui doit être pareil quel que soit celui qui travaille.

## Lancer le projet
Le jeu est statique : n'importe quel serveur de fichiers sur `src/` convient.
```bash
cd src && python3 -m http.server 5173
```
Sous Windows, si `python3` n'existe pas : `py -m http.server 5173`, ou `npx http-server -p 5173` (Node installé). URL : http://localhost:5173

Il n'y a ni build, ni test automatisé, ni linter. Vérifier un changement, c'est lancer le jeu et l'essayer.

Options de debug, à ajouter à l'adresse (voir `src/js/config.js`) :
`#temps=140` (départ à 2:20), `#monde=3`, `#invincible`, `#perf` (temps de calcul), `#test` (état du jeu lisible depuis la console), `#lames=N`.

## Structure
```
src/
  index.html      page unique ; liste TOUS les scripts, dans l'ordre de chargement
  style.css       styles de l'interface (menu, cartes, jauges)
  js/             un fichier par sujet, scripts classiques (pas de modules)
docs/
  conception.md       principes du jeu (raretés, persos, boosts, mutations)
  armes-et-boosts.md  liste complète des armes et boosts, tirée du code
  audit-armes.md      audit d'équilibrage des armes (19 octobre 2026)
  plan-ui-ux.md       plan d'amélioration de l'interface
assets/           images, sons, polices (vide pour l'instant : les sprites sont dessinés en code)
```
Fichiers clés dans `src/js/` : `config.js` (réglages, couleurs, debug), `ecrans.js` (menu, cartes de niveau, pause, fin, scores), `entrees.js` (clavier, joystick tactile), `partie.js` (boucle de jeu), `rendu.js` (dessin), `armes.js` et `uniques-*.js` (armes), `mutations.js`, `boss*.js`, `monstres-*.js`.

Les scripts partagent l'espace global. Un nouveau fichier JS doit être ajouté dans `index.html`, après ceux dont il dépend. Les `uniques-*.js` se suivent par numéro : prolonger la série plutôt que de grossir un fichier existant.

## Conventions du code
- Fichiers en kebab-case, commentaires en français, `"use strict";` en tête de chaque fichier JS.
- Réutiliser les aides existantes avant d'en écrire : `$`, `el`, `button`, `show`, `hidePanel` (`config.js`, `ecrans.js`). L'interface est construite en JS avec `textContent`, pas avec `innerHTML`.
- Respecter `prefers-reduced-motion` : tout effet qui tremble, clignote ou éclate se coupe avec la constante `calm`.
- Direction artistique : fond `#0d0d0d`, texte `#e0e0e0`, rose `#ff0055` réservé à ce qui est actif ou dangereux ("tout ce qui est rose te blesse"), traits de 1 px, police Courier New. Raretés : commun gris, rare bleu, épique violet, légendaire or, évolution rose. Utiliser les variables CSS de `:root`, pas des couleurs en dur.
- Quatre raretés (commun, rare, épique, légendaire) plus l'évolution. Ne pas écrire "trois raretés" dans un texte ou une doc.
- Après un changement de contenu (armes, boosts), mettre à jour `docs/armes-et-boosts.md` dans le même changement.

## Règles de travail communes
- **Comprendre avant d'agir** : lire le code concerné avant de proposer une modification ; ne pas deviner un nom de fichier, une fonction ou une convention.
- **Plan avant code** pour toute tâche qui touche plus de 2 fichiers, ou qui change une règle du jeu ou la direction artistique : proposer un plan court et attendre la validation de la personne.
- **Périmètre minimal** : ne modifier que ce qui est demandé. Pas de refactor, de renommage ni de "petite amélioration" non sollicités ; les signaler sans les faire.
- **Pas de commit ni de push sans demande explicite** de la personne, même pour une correction minuscule.
- **Une branche par sujet** (`feature/...`, `refactor/...`), jamais de travail direct sur `main`. Avant de modifier un fichier, vérifier que l'autre contributeur n'est pas déjà dessus (branches ouvertes, `git log`).
- **Vérifier avant de dire "terminé"** : lancer le jeu et essayer le changement ; si ce n'est pas possible, le dire au lieu d'affirmer que ça marche.
- **Honnêteté** : un échec, une étape sautée ou un doute se disent avec la sortie réelle.
- **Expliquer le pourquoi** : choix retenu, alternatives écartées, compromis, pour que la personne puisse défendre et refaire le travail.
- **Ton sobre**, pas d'emoji dans le code, les docs ni les messages.
- **Sécurité** : pas de secret dans le dépôt ; signaler toute entrée utilisateur injectée dans la page sans échappement.
- Une erreur corrigée plusieurs fois par la personne devient une règle : proposer de l'ajouter ici.

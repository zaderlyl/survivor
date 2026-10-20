# Plan d'amélioration UI / UX

Branche : `feature/ui-ux-amelioration`, créée depuis `feature/scoreboard` (la branche la plus récente, 2026-10-20).

Ce plan vient d'une lecture du code (`src/index.html`, `src/style.css`, `src/js/ecrans.js`, `src/js/entrees.js`). Rien n'a encore été testé dans le navigateur, ni sur téléphone : les points marqués "à vérifier" demandent un essai réel avant de décider.

Périmètre : l'interface autour du jeu (menu, cartes de niveau, pause, fin, scores, jauges, aide). Le gameplay, l'équilibrage et le contenu des armes restent à Lilian, pour éviter les conflits de fusion.

Fichiers touchés par ce plan : `src/style.css`, `src/js/ecrans.js`, `src/index.html`. Pas de modification de `partie.js`, `rendu.js`, ni des fichiers d'armes, de monstres et de boss.

Les règles de travail (plan avant code, périmètre minimal, pas de commit sans demande) et les conventions de code sont dans `CLAUDE.md` à la racine : ce plan les suit.

## 1. Ce qui fonctionne déjà (à ne pas casser)

- Direction artistique tenue : fond sombre, rose uniquement sur ce qui est actif ou dangereux.
- Clavier complet dans les cartes (touches 1 2 3, flèches, Entrée), `aria-live`, `prefers-reduced-motion`, `role="dialog"`.
- Joystick tactile sans zone fixe, bouton dash réservé au tactile, viewport `dvh`.
- Le texte "tout ce qui est rose te blesse" donne une règle de lecture simple du jeu.

## 2. Problèmes repérés

### Lisibilité et contraste
- `--dim` (#5a5a5a) sur #0d0d0d fait environ 2,7:1, sous le seuil WCAG AA (4,5:1). Il sert pour `.small` (aide des touches, crédits), le niveau des cartes (`.lv`) et le bouton dash inactif.
- Texte très petit dans le jeu : pastilles d'améliorations à 11px, score et vie à 12px.
- La barre de dash fait 3px de haut : presque invisible, alors que c'est une information vitale.

### Cohérence du contenu
- L'aide (`HOW`, "Grandir") cite trois raretés (commun, rare, légendaire) alors que le jeu en a quatre plus l'évolution. L'épique est absent.
- Le commentaire de `style.css` annonce "pas de flou ni de lueur", mais les cartes épique, légendaire et mutation ont un `box-shadow` lumineux. La mutation est en turquoise, hors de la palette définie.
- Les rangs `.r1` et `.tier-rare` sont presque identiques visuellement : "rare tiré au hasard" et "arme rare" se confondent.

### Parcours
- Écran de menu chargé : un paragraphe d'explication, deux rangées de boutons à bascule (difficulté, personnage) sans libellé visible (seulement un `aria-label`), un aperçu, des stats, trois boutons, deux lignes d'aide. Le bouton "jouer" est loin d'être dominant.
- "abandonner" est à côté de "reprendre" dans la pause, sans confirmation : un clic de travers fait perdre la partie.
- Aux cartes de niveau (`noFocus`), aucune carte n'est visiblement sélectionnée tant qu'on n'a pas touché une touche : un joueur clavier ne sait pas quoi faire.
- Le tableau des scores a six colonnes sans légende ; sur petit écran, à vérifier.
- Sur téléphone, le pied de page est caché et la touche "pause" n'existe pas : seul le bouton en en-tête la remplace (à vérifier qu'il reste facile à atteindre).

## 3. Propositions, par priorité

### Priorité 1 : rapide, faible risque (CSS et textes)
1. Relever `--dim` à environ #7a7a7a, et ne plus l'utiliser pour du texte utile. Pourquoi : corriger le contraste sans changer la DA (le gris reste un gris).
2. Corriger `HOW` pour citer les quatre raretés. Pourquoi : une règle fausse dans l'aide est un bug de contenu, pas de style.
3. Épaissir la barre de dash (6px) et la rapprocher visuellement de la vie.
4. Passer les pastilles et les chiffres de jeu à 12-13px minimum.
5. Ajouter un sélecteur de survol et de focus plus net sur les cartes (aujourd'hui : seulement la bordure rose).
6. Alternative écartée : changer toute la palette. Trop invasif, la DA actuelle est cohérente avec le Devtober.

### Priorité 2 : parcours (JS d'écrans, `ecrans.js`)
1. Menu : un titre, un seul bouton "jouer" dominant, la difficulté et le personnage regroupés sous un libellé visible ("difficulté", "personnage"). Les stats et les crédits passent en bas, plus discrets.
2. Pause : confirmation en deux temps pour "abandonner" (le bouton devient "confirmer ?" pendant 3 secondes), plutôt qu'une boîte de dialogue bloquante. Pourquoi : un `confirm()` natif casse l'ambiance et pose problème sur mobile.
3. Cartes de niveau : mettre le focus visuel sur la première carte sans la valider (le focus peut être posé sans activer ; le risque d'une touche encore enfoncée est traité par un court délai d'activation).
4. Tableau des scores : en-têtes explicites, colonnes `monde` et `niveau` masquées sous 420px.
5. Ajouter un bref rappel des touches à l'écran de pause, avec accès direct à "comment jouer".

### Priorité 3 : retours visuels et ressenti
1. Dégâts reçus : un bref éclat sur le cadre du jeu (le cadre rose `low` existe déjà pour la vie basse). Désactivé avec `prefers-reduced-motion`.
2. Jauge d'XP : un court flash au passage de niveau.
3. Cartes de niveau : une courte apparition (fondu de 120 ms) plutôt qu'une coupure sèche.
4. Indiquer l'évolution possible sur les pastilles (deux améliorations qui se complètent), pour que le système d'évolutions soit découvrable sans lire l'aide.

### Priorité 4 : décisions de DA à prendre avec Lilian
1. Garder ou retirer les lueurs (`box-shadow`) des cartes épique, légendaire et mutation : elles contredisent le commentaire de la DA.
2. Garder la couleur turquoise des mutations ou la ramener dans la palette.
3. Distinguer visuellement `.r1` et `.tier-rare` (par exemple, l'arme rare gagne une bordure double).

## 4. Méthode et vérification

- Un commit par priorité, pour que Lilian puisse relire et refuser l'un sans perdre les autres.
- Test à faire à chaque étape : navigateur de bureau, puis émulation mobile (375 px de large), puis clavier seul, puis lecteur d'écran sur le menu.
- Contraste : vérifier chaque couleur modifiée avec un outil de ratio (cible 4,5:1 pour le texte).
- Aucune dépendance ajoutée : le projet reste en HTML/CSS/JS pur.

## 5. Questions ouvertes

- Qui possède quoi côté fichiers ? Pour éviter les conflits : je propose de me limiter à `style.css`, `ecrans.js` et `index.html`, et de ne pas toucher à `partie.js`, `rendu.js` ni aux fichiers d'armes.
- Faut-il garder le thème Courier New ? C'est un choix de la base Swarm ; le changer serait un gros effet visuel pour peu de gain d'usage.
- Lilian a-t-elle déjà des retours de joueurs sur l'interface ? Ils vaudraient mieux que mes hypothèses.

# Survivor

Survivor-like cyberpunk en navigateur : tenir le plus longtemps possible face à des vagues d'ennemis, gagner de l'XP et choisir ses pouvoirs à chaque niveau. HTML, CSS et JavaScript, sans dépendance ni build.

Base : [07-Swarm](https://github.com/Bebbou/devtober-2026/tree/main/07-Swarm) de Lino Volle, que l'on améliore (armes, synergies, évolutions, mutations, interface). Inspiré du mode Swarm de League of Legends ; aucun élément de Riot Games n'est utilisé.

## Lancer

Le jeu est statique, il suffit de servir le dossier `src/` :

```bash
cd src && python3 -m http.server 5173
```

Sous Windows, `py -m http.server 5173` ou `npx http-server -p 5173` conviennent aussi. Puis ouvrir http://localhost:5173.

Pour essayer vite, ajouter à l'adresse par exemple `#temps=140`, `#monde=3` ou `#invincible` (liste complète dans `src/js/config.js`).

## Jouer

Déplacement : ZQSD, WASD ou flèches (au doigt : glisser n'importe où). Les armes tirent toutes seules. Espace : dash. P ou Échap : pause. À chaque niveau, trois cartes à choisir (touches 1 2 3).

## Contenu du dépôt

- `src/` : le jeu (`index.html`, `style.css`, `js/`).
- `docs/` : conception du jeu, liste des armes et boosts, audit d'équilibrage, plan d'amélioration de l'interface.
- `assets/` : réservé aux images, sons et polices (vide pour l'instant).
- `CLAUDE.md` : conventions et règles de travail communes, lues par les assistants de chaque contributeur.

## Contribuer

Une branche par sujet (`feature/...`, `refactor/...`), jamais directement sur `main`. Lire `CLAUDE.md` avant de commencer : il décrit la structure, les conventions du code et la direction artistique à respecter. Se mettre d'accord sur les fichiers touchés avant un gros changement, pour limiter les conflits.

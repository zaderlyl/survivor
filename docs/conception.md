# Conception du jeu

Survivor-like cyberpunk en navigateur : tenir le plus longtemps possible face à des vagues d'ennemis, gagner de l'XP, choisir ses améliorations.

## Principes
- On choisit un personnage au départ. Il a une **attaque de base simple** qui définit son style.
- À chaque niveau, **3 cartes** sont tirées au hasard parmi **toutes** les améliorations disponibles (par exemple 2 armes et 1 boost). Les armes du personnage sortent plus souvent.
- **Pas de limite** d'armes en même temps ; chaque arme a un niveau maximum.
- **3 raretés** : commun, rare, légendaire. Une carte plus rare est toujours plus puissante, soit par un effet amélioré, soit par un effet changé (surtout au légendaire).

## Personnages (attaque de base)
| Perso | Attaque de base | Sensation |
|---|---|---|
| Volt | Petit tir rapide, peu de dégâts | Équilibré |
| Chrome | Coup d'épée en arc, courte portée | Mêlée, risqué |
| Rig | Blaster : gros tir lent, long cooldown | Précis, puissant |
| Ghost | Tir en éventail à courte portée | Dégâts de zone proche |
| Arc | Laser qui traverse la ligne d'ennemis, lent | Alignement |
| Pulse | Grenade sur l'ennemi le plus proche | Zone moyenne distance |
| Zap | Éclair qui saute sur 3 ennemis | Efficace contre les groupes |

Les pouvoirs actifs et passifs des persos restent à définir.

## Boosts (commun / rare / légendaire)
| Boost | Effet | Commun | Rare | Légendaire |
|---|---|---|---|---|
| Vie | PV max, soigne autant | +20 | +40 | +80 |
| Puissance | Dégâts de toutes les armes | +10 % | +20 % | +40 %, les tués explosent |
| Cadence | Vitesse d'attaque | +8 % | +15 % | +30 % |
| Portée | Portée des attaques | +10 % | +20 % | +40 % |
| Vitesse | Déplacement | +6 % | +12 % | +25 % |
| Aimant | Rayon de ramassage de l'XP | +40 px | +80 px | +200 px, l'XP vient seule |
| Critique | Chances de coup critique | +8 % | +15 % | +30 %, critiques x3 |
| Régénération | PV par seconde | +0,5 | +1,5 | +3 |
| Armure | Dégâts reçus | -6 % | -12 % | -25 % |
| Vol de vie | PV rendus par ennemi tué | +0,4 | +1 | +2,5 |
| Glissade | Recharge du pouvoir actif | -10 % | -20 % | -35 % |

Chaque boost a un niveau maximum de 6 à 10.

## Armes universelles (tous les persos, niveau 8 max)
| Arme | Fonctionnement | Commun / rare | Légendaire |
|---|---|---|---|
| Lames orbitales | Lames qui tournent autour de toi | +1 / +2 lames, plus rapides | Les lames lancent des éclats |
| Onde de choc | Pulsation qui repousse et blesse | Plus large / plus rapide | Gèle les ennemis 1 s |
| Mines | Mine posée derrière toi | Plus de mines / plus de dégâts | Les mines se divisent en deux |
| Drone | Drone qui tire seul | +1 drone / tir plus rapide | Missile à tête chercheuse |
| Champ de feu | Zone brûlante autour de toi | Plus grande / plus de dégâts | La zone suit les ennemis qui fuient |
| Éclair | Foudre sur un ennemi au hasard | Plus de foudres / plus de dégâts | La foudre rebondit sur 3 ennemis |

## Armes uniques (3 par personnage)
| Perso | Arme 1 | Arme 2 | Arme 3 |
|---|---|---|---|
| Volt | Salve : +1 projectile | Perforant : le tir traverse | Tir explosif |
| Chrome | Arc plus large | Second coup dans le dos | Onde tranchante à distance |
| Rig | Charge : plus gros, plus lent | Recharge rapide | Tir qui explose à l'impact |
| Ghost | Plus de plombs | Plombs qui rebondissent | Double tir à bout portant |
| Arc | Laser plus épais | Laser plus durable | Second laser en croix |
| Pulse | Plus de grenades | Explosion plus grande | Grenade collante à retardement |
| Zap | +1 rebond | Étourdit les touchés | Champ électrique laissé au sol |

## Plan d'attaque
1. Base Swarm copiée (fait).
2. Découpage de `script.js` en modules (fait).
3. Système d'armes : plusieurs armes, niveaux, tirs automatiques.
4. Personnages et attaques de base.
5. Boosts avec 3 raretés.
6. Armes universelles, puis armes uniques.
7. Équilibrage et retours visuels.

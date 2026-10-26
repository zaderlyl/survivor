# Audit du design des armes

Fait le 19 octobre 2026, sur les **146 armes** du jeu (universelles, armes des héros, rares, épiques, et les 21 armes ajoutées récemment).

## Méthode

Chaque arme est jouée seule (sans l'attaque de base), avec les mêmes dégâts de joueur, pendant 18 s dans trois situations : **une cible seule**, **un amas** de 14 ennemis, et **16 ennemis étalés** autour du joueur. Les ennemis sont immobiles et indestructibles, ce qui permet de comparer les dégâts. On mesure aussi la **part de l'écran** couverte par les effets de l'arme (pixels avec et sans ses effets), et on lit les textes des effets légendaires et des variantes.

Limites : les armes utilitaires (contrôle, défense, déplacement : Piratage, Garde parfaite, Crochet de l'ombre…) ne se jugent pas aux dégâts ; les armes à pourcentage de vie (Kernel panic, Rançongiciel) donnent des chiffres hors échelle sur des cibles indestructibles ; les lames et drones, dessinés à part, sont un peu sous-estimés côté écran.

## Les cinq constats

### 1. Les variantes ne changent pas la façon de jouer

**121 armes sur 146** n'ont que des variantes de chiffres. Sur 584 variantes : dégâts (144 armes), cadence (140), nombre (86), durée (70), taille (61). Deux builds différents finissent donc par se jouer pareil : c'est la cause principale de l'impression que les parties se ressemblent.

### 2. Beaucoup de légendaires sont « juste plus »

**63 effets légendaires sur 146** sont quantitatifs : « deux fois plus », « un second », « plus longtemps », « +2 cibles ». Ils renforcent l'arme sans en changer le rôle.

### 3. Les armes prennent peu de place à l'écran

La moitié des armes (**78**) couvrent en moyenne **moins de 0,3 %** de l'écran ; le pic médian est de 2,3 %. Seules une dizaine dépassent 2 % en moyenne :

| Arme | Héros | Écran moyen | Pic |
|---|---|---|---|
| Brume mortelle | Ghost | 12.07 % | 36.53 % |
| Kernel panic | Volt | 10.16 % | 89.7 % |
| Déni de service | Volt | 4.77 % | 10.18 % |
| Orage statique | Zap | 3.97 % | 12.48 % |
| Fournaise | Pulse | 3.48 % | 9.36 % |
| Écran bleu | Volt | 3.44 % | 90.68 % |
| Bombe fumigène | Ghost | 3.05 % | 4.87 % |
| Piège toxique | Ghost | 2.99 % | 4.18 % |
| Tempête de lasers | Arc | 2.63 % | 12.6 % |
| Soleil | Arc | 2.54 % | 25.74 % |

### 4. Des familles trop chargées

- **« Autour de toi »** (orbites, auras, anneaux) : 29 armes.
- **Lasers et faisceaux** : 24 armes, dont 10 chez Rig et 13 chez Arc : les deux héros se marchent dessus.
- **Explosions** : 22 armes, dont 14 chez Pulse.
- Projectiles : 23 · zones au sol : 23 · pluies venues du ciel : 17 · contrôle : 16 · pièges posés : 13 · chaînes et rebonds : 8 seulement.

### 5. Un équilibre très étiré

Force relative (1 = l'arme médiane, moyenne des trois situations) :

- **Trop faibles** (moins de 0,4) : Mine à fragmentation (Pulse, 0.1), Tourelle (Volt, 0.21), Danse des lames (Chrome, 0.23), Dash tranchant (Chrome, 0.24), Lames (Universelles, 0.25), Rafale en cercle (Volt, 0.27), Onde (Universelles, 0.28), Drone (Universelles, 0.31), Pluie de particules (Rig, 0.33), Poignard lancé (Ghost, 0.35), Rafale de pixels (Volt, 0.38), Tir fantôme (Arc, 0.39).
- **Trop fortes pour leur rareté** : Éclipse (Ghost, épique, 11.24), Dieu de l'orage (Zap, épique, 10.62), Meute spectrale (Ghost, rare, 7.3), Paratonnerre (Zap, rare, 4.38), Rayons prismatiques (Rig, rare, 4.03), Champ de particules (Rig, rare, 3.67), Pylône (Zap, commun, 3.15), Grenade rebondissante (Pulse, commun, 3.09), Orage magnétique (Zap, commun, 2.85), Nœud électrique (Zap, commun, 2.72), Faisceau focal (Arc, commun, 2.57), Lames jumelles (Chrome, commun, 2.41), Marteau hydraulique (Rig, commun, 2.35), Laser courbé (Arc, commun, 2.07).
- Les **armes récentes** (Grenade rebondissante, Orage magnétique, Nœud électrique, Lames jumelles, Marteau hydraulique, Laser courbé) sont 2 à 3 fois au-dessus des communes : à recalibrer.
- **Kernel panic** et **Rançongiciel** retirent un pourcentage de la vie : comme la vie des ennemis devient exponentielle après le monde 6, ces deux armes deviennent les meilleures du jeu en fin de partie. Il faut plafonner leur effet sur les boss.

## Ce que je recommande, dans l'ordre

1. **Des variantes de comportement (« mutations »).** Chaque arme garde 2 ou 3 variantes de chiffres et gagne 1 ou 2 mutations qui changent sa façon de jouer, tirées d'une bibliothèque commune d'une douzaine : *Rebond*, *Traînée* (laisse une trace qui blesse), *Aimant* (attire), *Écho* (se répète une seconde plus tard), *Fission* (se divise quand elle tue), *Givre* (ralentit), *Surcharge* (une activation sur cinq vaut triple), *Escorte* (l'effet te suit), *Riposte* (se déclenche quand tu es touché), *Élan* (se déclenche au dash), *Contagion* (passe aux voisins), *Gigantisme* (deux fois plus gros, plus lent). Codées une seule fois, elles s'appliquent à beaucoup d'armes : c'est ce qui rend deux parties vraiment différentes.
2. **Réécrire les 63 légendaires « juste plus »** en effets qui changent une règle de l'arme, héros par héros.
3. **Une passe « spectacle »** sur les 78 armes discrètes : lueurs plus grandes, traces au sol, éclairs plein écran pour les grosses recharges, gerbes de particules, sans toucher aux dégâts.
4. **Rééquilibrer** : remonter les 12 communes trop faibles vers 0,7, baisser les rares et épiques hors norme, recalibrer les armes récentes, plafonner les pourcentages de vie sur les boss.
5. **Séparer Rig et Arc** : Rig = mécanique lourde (bras, pistons, plasma, impacts) ; Arc = optique (réfraction, miroirs, précision). Les lasers de Rig qui doublonnent avec Arc changent de nature.

## Annexes

### Armes discrètes (moins de 0,3 % de l'écran en moyenne), par héros

- **Universelles** (6) : Éclair, Onde, Drone, Lames, Champ de feu, Mines.
- **Volt** (9) : Piratage, Rafale de pixels, Botnet, Tourelle, Ver, Rafale en cercle, Fichier corrompu, Cascade de code, Virus.
- **Chrome** (13) : Riposte, Boomerang, Garde parfaite, Exécution, Dash tranchant, Ronde des spectres, Danse des lames, Tourbillon, Tempête de lames, Pluie d'épées, Mille entailles, Frappe sismique, Épée spectrale.
- **Rig** (4) : Barrage, Rail, Canon double, Onde de particules.
- **Ghost** (15) : Coup dans le dos, Silence radio, Lames cachées, Leurre, Dards empoisonnés, Meute spectrale, Frappe de l'ombre, Piège à ours, Shurikens, Marque mortelle, Crochet de l'ombre, Cimetière, Poignard lancé, Ombre, Illusions.
- **Arc** (8) : Miroir, Lasers chercheurs, Réfracteur, Laser en croix, Faisceau tournant, Prisme, Rail orbital, Laser courbé.
- **Pulse** (11) : Poudre noire, Armure réactive, Mine à fragmentation, Roquette, Tir de barrage, Grenade collante, Grenade rebondissante, Pluie d'obus, Lance-flammes, Frappe aérienne, Grenade à fusion.
- **Zap** (12) : Électro-bouclier, Chaîne longue, Batterie vivante, Colère du ciel, Foudre globulaire, Marteau de Thor, Bobine mobile, Arc voltaïque, Aura statique, Coup de tonnerre, Tesla, Orbe de tonnerre.

### Légendaires « juste plus », par héros

- **Volt** (7) : Rafale en cercle, Virus, Écran bleu, Cascade de code, Bombe logique, Botnet, Intelligence artificielle.
- **Chrome** (9) : Dash tranchant, Tempête de lames, Frappe sismique, Riposte, Boomerang, Cercle de lames, Lames jumelles, Épée géante, Lame du jugement.
- **Rig** (11) : Barrage, Salve de rayons, Rail, Canon à particules, Canon double, Surcharge, Salve de colonnes, Tourelle lourde, Rayon destructeur, Champ de particules, Rayons prismatiques.
- **Ghost** (6) : Leurre, Coup dans le dos, Silence radio, Frappe de l'ombre, Faucheuse, Meute spectrale.
- **Arc** (13) : Tir fantôme, Faisceau tournant, Prisme, Réfracteur, Laser en croix, Rail orbital, Miroir, Lasers chercheurs, Satellite, Nova laser, Tempête de lasers, Faisceau en spirale, Soleil.
- **Pulse** (11) : Roquette, Frappe aérienne, Lance-flammes, Bombardement, Armure réactive, Chapelet de bombes, Bombe à retardement, Tir de barrage, Fournaise, Grenade à fusion, Cataclysme.
- **Zap** (6) : Déluge, Chaîne longue, Foudre globulaire, Coup de tonnerre, Tesla, Bobine mobile.


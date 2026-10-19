# Boosts et armes

Liste complète, mise à jour à partir du code. Chaque arme a **4 variantes** et 4 raretés (commun, rare, épique, légendaire) ; la rareté légendaire d'une carte active en plus l'effet « légendaire » indiqué.

## Les raretés

Une seule échelle, pour les cartes de boost **et** pour les armes :

| Rareté | Couleur | Cartes de boost | Armes |
|---|---|---|---|
| Commun | gris | valeur de base | armes communes |
| Rare | bleu | valeur plus forte | 35 armes rares (dès le niveau 6) |
| Épique | violet | valeur intermédiaire, calculée (≈ 60 % du chemin entre rare et légendaire) | 14 armes épiques (dès le niveau 10, une seule par partie) |
| Légendaire | or | valeur maximale **et** effet bonus | aucune pour l'instant (à créer ; dès le niveau 20, une seule par partie) |

Le tirage de la rareté d'une carte dépend du niveau : jusqu'au niveau 9 il n'y a que du commun et du rare ; l'épique arrive au niveau 10, le légendaire au niveau 20. Au niveau 50 : environ 14 % de commun, 65 % de rare, 15 % d'épique, 6 % de légendaire.

**Aucune limite** : on peut reprendre un boost autant de fois qu'on veut. Les réductions (Armure, Garde parfaite, recharges) se multiplient, donc elles tendent vers 100 % sans l'atteindre. Seule limite technique : une arme ne se lance pas plus de 16 fois par seconde.

L'effet légendaire d'une arme ne se cumule pas, sauf pour 10 armes dont l'effet est un retour ou un sens inverse (spirale, pluie de lasers, faisceau rotatif, danse des lames, fouet plasma, anneau d'épées, chevaliers spectres, champ de particules, destructeur, mur de lumière) : chaque reprise en ajoute un exemplaire.

## Boosts (tous les personnages)

Une carte de boost en contient **deux**, de même rareté. Valeurs : commun / rare / épique / légendaire.

| Boost | Effet | Commun | Rare | Épique | Légendaire |
|---|---|---|---|---|---|
| Vie | PV max, et soigne autant | +20 | +40 | +64 | +80 |
| Puissance | Dégâts de toutes les armes | +10 % | +20 % | +32 % | +40 %, les ennemis tués explosent |
| Cadence | Vitesse d'attaque | +8 % | +15 % | +24 % | +30 % |
| Portée | Portée des attaques | +10 % | +20 % | +32 % | +40 % |
| Vitesse | Déplacement | +6 % | +12 % | +20 % | +25 % |
| Aimant | Rayon de ramassage de l'XP | +40 px | +80 px | +152 px | +200 px, les cristaux viennent seuls |
| Critique | Chances de coup critique (au-delà de 100 %, tout est critique) | +8 % | +15 % | +24 % | +30 %, critiques ×3 |
| Régénération | PV par seconde | +0,5 | +1,5 | +2,4 | +3 |
| Armure | Dégâts reçus (les réductions se multiplient) | −6 % | −12 % | −20 % | −25 % |
| Vol de vie | PV rendus par ennemi tué | +0,4 | +1 | +1,9 | +2,5 |
| Savoir | Expérience gagnée | +10 % | +25 % | +46 % | +60 % |
| Glissade | Recharge du dash | −10 % | −20 % | −29 % | −35 % |

En plus, **pour Volt seulement** : Salve (+projectiles), Perforant (le tir traverse) et Éclat (tirs explosifs), qui améliorent son tir de base.

Les paliers visuels du personnage évoluent avec ces boosts : armure (Vie, Armure, Régénération), arme (Puissance, Cadence, Portée, Critique), propulseurs (Vitesse), et un anneau d'aura par carte légendaire.

## Armes universelles (tous les personnages, communes)

- **Lames** — des lames tournent autour de toi. *Légendaire :* les lames lancent des éclats vers l'extérieur.
- **Onde** — une onde repousse et blesse tout autour de toi. *Légendaire :* gèle les ennemis touchés 1 s.
- **Mines** — pose des mines derrière toi, qui explosent au contact. *Légendaire :* les mines se divisent en deux explosions.
- **Drone** — un drone tourne autour de toi et tire seul. *Légendaire :* les drones lancent des missiles à tête chercheuse.
- **Champ de feu** — une zone brûle les ennemis autour de toi. *Légendaire :* les brûlures suivent les ennemis qui fuient.
- **Éclair** — la foudre tombe sur un ennemi au hasard. *Légendaire :* la foudre rebondit sur 3 ennemis.

## Armes par héros

Chaque héros a : 1 attaque de base, 10 armes uniques **communes**, 5 **rares** (dès le niveau 6) et 2 **épiques** (dès le niveau 10, une seule par partie). Les armes du héros sortent 2 fois plus souvent que les universelles.

### Volt, le hacker

**Attaque de base : Tir** — un petit tir rapide, peu de dégâts, équilibré.

**Communes (10)**

- **Virus** — infecte un ennemi : il souffre, et contamine les autres en mourant. *Légendaire :* le virus se propage deux fois plus loin et à deux fois plus de cibles.
- **Pare-feu** — une zone autour de toi efface les tirs ennemis et brûle ce qui y entre. *Légendaire :* les tirs effacés sont renvoyés vers les ennemis.
- **Piratage** — prend le contrôle d'un ennemi : il combat pour toi quelques secondes. *Légendaire :* l'ennemi piraté explose à la fin.
- **Bombe logique** — une bombe explose après un délai, puis se copie sur les voisins. *Légendaire :* la copie se copie encore une fois.
- **Ver** — un serpent de code rampe vers les ennemis et blesse tout ce qu'il touche. *Légendaire :* le ver se divise en deux à mi-parcours.
- **Déni de service** — une zone où les ennemis ralentissent, puis se figent. *Légendaire :* la zone te suit.
- **Rafale de pixels** — une volée de minuscules tirs très rapides, dans un cône étroit. *Légendaire :* les pixels traversent deux ennemis.
- **Tourelle** — pose une mini-tourelle qui tire quelques secondes. *Légendaire :* la tourelle explose à la fin.
- **Rafale en cercle** — des tirs partent tout autour de toi, à intervalles réguliers. *Légendaire :* une seconde rafale suit, décalée.
- **Mortier** — un obus retombe sur un ennemi proche et explose en grande zone. *Légendaire :* l'explosion lâche 4 petites bombes.

**Rares (5)**

- **Botnet** — une nuée de petits robots de code poursuit les ennemis et explose à leur contact. *Légendaire :* chaque robot libère trois petits robots en explosant.
- **Rançongiciel** — chiffre les ennemis proches : ils se figent, puis perdent une part de leur vie. *Légendaire :* ceux qui n'y survivent pas explosent.
- **Cascade de code** — des colonnes de code tombent sur tout l'écran pendant quelques secondes. *Légendaire :* deux fois plus de colonnes.
- **Point de restauration** — pose un point de sauvegarde : quelques secondes plus tard, tu y reviens et tu récupères de la vie. *Légendaire :* se déclenche aussi tout seul quand tu tombes sous 20 % de vie.
- **Écran bleu** — tous les ennemis de l'écran se figent un instant. *Légendaire :* le gel dure deux fois plus longtemps.

**Épiques (2)**

- **Kernel panic** — pendant quelques secondes, l'écran plante : de nombreux ennemis sont supprimés d'un coup. *Légendaire :* même les boss perdent une grosse part de leur vie.
- **Intelligence artificielle** — une IA géante flotte au-dessus de toi et tire des lasers sur plusieurs ennemis à la fois. *Légendaire :* elle tire sur deux fois plus de cibles.

### Chrome, le samouraï cyborg (épées)

**Attaque de base : Coup d'épée** — un coup d'épée en arc devant lui, courte portée, gros dégâts.

**Communes (10)**

- **Pluie d'épées** — des épées tombent du ciel sur les ennemis. *Légendaire :* chaque épée libère un arc tranchant autour d'elle.
- **Riposte** — quand tu es touché, un cercle de coups d'épée part tout autour de toi. *Légendaire :* la riposte se déclenche deux fois.
- **Épée spectrale** — une épée fantôme t'accompagne et se jette sur les ennemis proches. *Légendaire :* chaque coup projette une onde tranchante.
- **Estoc** — une rafale de coups d'estoc, en ligne droite, qui transpercent tout. *Légendaire :* chaque estoc projette une lame d'énergie qui traverse.
- **Danse des lames** — des lames partent en spirale tout autour de toi. *Légendaire :* la spirale tourne dans les deux sens.
- **Exécution** — tranche d'un coup les ennemis presque morts autour de toi. *Légendaire :* chaque exécution te rend 5 PV.
- **Tempête de lames** — une rafale de coups d'épée rapides, dans toutes les directions. *Légendaire :* les coups sont deux fois plus larges.
- **Dash tranchant** — il fonce sur un ennemi en tranchant tout sur son passage. *Légendaire :* il enchaîne un second dash.
- **Boomerang** — une lame partie vers un ennemi puis revenue vers toi. *Légendaire :* une seconde lame suit la première.
- **Tourbillon** — un tournoiement à 360° qui tranche tout autour de toi. *Légendaire :* il finit par un souffle qui repousse tout.

**Rares (5)**

- **Épée géante** — un énorme coup d'épée, lent et dévastateur, devant toi. *Légendaire :* un second coup part dans ton dos.
- **Cercle de lames** — un anneau de grandes épées s'ouvre autour de toi, puis se referme. *Légendaire :* un second anneau tourne en sens inverse.
- **Frappe sismique** — il charge, puis frappe le sol : une fissure d'épées s'ouvre devant lui. *Légendaire :* une seconde fissure s'ouvre à angle droit.
- **Mur d'épées** — un arc d'épées se dresse devant toi, repousse les ennemis, puis part en volée. *Légendaire :* le mur tourne autour de toi.
- **Ronde des spectres** — des spectres de toi chargent en ligne droite à travers les ennemis. *Légendaire :* ils reviennent en sens inverse.

**Épiques (2)**

- **Dragon d'acier** — un dragon fait d'épées surgit et fonce à travers l'écran en tranchant tout. *Légendaire :* le dragon crache des épées devant lui.
- **Lame du jugement** — une épée colossale tombe sur la plus grosse concentration d'ennemis et fend l'arène. *Légendaire :* elle frappe trois fois d'affilée.

### Rig, le mécano (gros rayons)

**Attaque de base : Blaster** — un gros tir lent qui traverse plusieurs ennemis, long cooldown.

**Communes (10)**

- **Canon à particules** — un faisceau épais est tenu sur un ennemi pendant quelques secondes. *Légendaire :* le faisceau est bien plus large.
- **Salve de rayons** — trois gros rayons partent en éventail. *Légendaire :* une seconde salve suit.
- **Onde de particules** — une large bande de lumière avance et balaie tout sur son passage. *Légendaire :* la bande revient sur ses pas.
- **Colonne de particules** — un pilier de lumière tombe sur une cible et la brûle quelques secondes. *Légendaire :* le pilier attire les ennemis vers lui.
- **Fouet de plasma** — un gros rayon balaie un grand arc devant toi. *Légendaire :* le fouet revient dans l'autre sens.
- **Canon double** — deux gros rayons parallèles partent côte à côte. *Légendaire :* quatre rayons au lieu de deux.
- **Pluie de particules** — des traits de lumière tombent du ciel sur une zone pendant quelques secondes. *Légendaire :* chaque impact explose en zone.
- **Rail** — un tir très puissant qui traverse tout, après une courte charge. *Légendaire :* un second tir part dans la direction opposée.
- **Barrage** — une salve de missiles à tête chercheuse. *Légendaire :* une seconde salve suit.
- **Barrière plasma** — pose un mur de plasma qui blesse tout ce qui le touche. *Légendaire :* le mur étourdit les ennemis qu'il touche.

**Rares (5)**

- **Surcharge** — il charge un instant, puis 8 gros rayons partent dans toutes les directions. *Légendaire :* deux fois plus de rayons.
- **Rayons prismatiques** — trois gros rayons tournent ensemble autour de toi pendant quelques secondes. *Légendaire :* les rayons tournent deux fois plus vite.
- **Salve de colonnes** — des colonnes de lumière jaillissent en ligne droite, l'une après l'autre. *Légendaire :* une seconde ligne part en V.
- **Tourelle lourde** — une grosse tourelle posée au sol tire de gros rayons en rafale. *Légendaire :* la tourelle tire deux fois plus vite.
- **Champ de particules** — un anneau de rayons courts tourne autour de toi et brûle tout ce qui s'approche. *Légendaire :* un second anneau tourne en sens inverse.

**Épiques (2)**

- **Rayon destructeur** — un faisceau gigantesque balaie tout autour de toi, deux tours complets. *Légendaire :* un second faisceau tourne à l'opposé.
- **Mur de lumière** — un mur de lumière immense traverse tout l'écran et balaie les ennemis devant lui. *Légendaire :* le mur revient sur ses pas.

### Ghost, l'infiltré

**Attaque de base : Fusil à pompe** — un tir en éventail à courte portée.

**Communes (10)**

- **Coup dans le dos** — il se glisse derrière un ennemi et le poignarde. *Légendaire :* il enchaîne sur un second ennemi.
- **Bombe fumigène** — un nuage ralentit les ennemis et les désoriente. *Légendaire :* le nuage explose à la fin.
- **Dards empoisonnés** — un éventail de fléchettes qui empoisonnent les ennemis touchés. *Légendaire :* le poison passe aux voisins.
- **Illusions** — des clones de toi attaquent les ennemis à ta place. *Légendaire :* les clones explosent à la fin.
- **Piège à ours** — des pièges posés au sol immobilisent les ennemis qui marchent dessus. *Légendaire :* le piège explose en refermant ses dents.
- **Poignard lancé** — un poignard précis, rapide et très puissant, qui perce plusieurs ennemis. *Légendaire :* les poignards traversent tout.
- **Ombre** — un double sombre te suit et frappe les ennemis qui l'approchent. *Légendaire :* les ombres explosent quand tu es touché.
- **Leurre** — un clone attire les ennemis, puis explose. *Légendaire :* une seconde explosion, plus grande, suit.
- **Shurikens** — un éventail de lames qui rebondissent d'un ennemi à l'autre. *Légendaire :* les lames traversent un ennemi de plus.
- **Piège toxique** — un nuage de poison posé au sol ralentit et blesse. *Légendaire :* les ennemis restent empoisonnés en sortant du nuage.

**Rares (5)**

- **Frappe de l'ombre** — des coups fantômes tombent à la chaîne sur plusieurs ennemis de l'écran. *Légendaire :* chaque coup frappe deux fois.
- **Brume mortelle** — une brume géante te suit : elle empoisonne et ralentit tout ce qu'elle touche. *Légendaire :* les ennemis dans la brume sont aveuglés.
- **Meute spectrale** — des loups fantômes poursuivent les ennemis et les mordent à répétition. *Légendaire :* la meute est deux fois plus nombreuse.
- **Cimetière** — des pierres tombales se dressent autour de toi et envoient des crânes à la poursuite des ennemis. *Légendaire :* les tombes explosent à la fin.
- **Marque mortelle** — marque l'ennemi le plus costaud : il subit plus de dégâts, puis explose. *Légendaire :* la marque saute sur le voisin quand elle détone.

**Épiques (2)**

- **Faucheuse** — une faux géante balaie un grand cercle autour de toi et exécute les ennemis affaiblis. *Légendaire :* un troisième coup de faux suit.
- **Éclipse** — l'écran s'assombrit : les ennemis perdent la tête, ralentissent et souffrent, et chaque coup te soigne un peu. *Légendaire :* tu es invulnérable pendant l'éclipse.

### Arc, le tireur d'élite (lasers)

**Attaque de base : Laser** — un laser qui traverse toute la ligne d'ennemis, lent.

**Communes (10)**

- **Prisme** — un laser qui se divise en trois faisceaux au premier ennemi touché. *Légendaire :* chaque faisceau se divise encore.
- **Miroir** — un laser qui rebondit d'un ennemi à l'autre. *Légendaire :* quatre rebonds de plus.
- **Nova laser** — un anneau de laser s'étend tout autour de toi. *Légendaire :* un second anneau, plus grand, suit.
- **Réfracteur** — un laser qui se courbe à angle droit, des deux côtés, au premier ennemi touché. *Légendaire :* il se courbe encore au second impact.
- **Sentinelle laser** — une tourelle posée au sol tire des lasers sur l'ennemi le plus proche. *Légendaire :* la sentinelle tire deux faisceaux à la fois.
- **Faisceau focal** — un laser qui grossit et frappe de plus en plus fort tant qu'il reste sur sa cible. *Légendaire :* il se termine par une grosse explosion.
- **Pluie de lasers** — des lignes de lumière obliques croisent une zone pendant quelques secondes. *Légendaire :* les lignes se croisent dans les deux sens.
- **Satellite** — une frappe orbitale s'abat sur une zone, après un délai. *Légendaire :* la frappe se répète une seconde fois au même endroit.
- **Faisceau tournant** — un laser tourne autour de toi pendant quelques secondes. *Légendaire :* un second faisceau tourne à l'opposé.
- **Laser en croix** — quatre lasers en croix partent de toi, après une courte charge. *Légendaire :* huit lasers au lieu de quatre.

**Rares (5)**

- **Constellation** — des étoiles reliées par des lignes de lumière apparaissent et blessent tout ce qu'elles touchent. *Légendaire :* toutes les étoiles se relient entre elles.
- **Faisceau en spirale** — des rayons s'allongent en tournant de plus en plus vite autour de toi. *Légendaire :* une seconde spirale tourne en sens inverse.
- **Lasers chercheurs** — une volée de tirs rapides qui poursuivent les ennemis et en transpercent plusieurs. *Légendaire :* ils restent deux fois plus longtemps.
- **Canon à ions** — une longue charge, puis un seul tir gigantesque qui détruit tout sur sa ligne. *Légendaire :* deux tirs successifs.
- **Rail orbital** — une longue ligne de lumière tombe du ciel sur un ennemi, après une alerte. *Légendaire :* une seconde ligne la croise à angle droit.

**Épiques (2)**

- **Soleil** — un soleil grandit au-dessus d'un groupe d'ennemis, brûle tout, puis explose. *Légendaire :* un second soleil apparaît sur un autre groupe.
- **Tempête de lasers** — des lasers géants croisent tout l'écran dans tous les sens pendant plusieurs secondes. *Légendaire :* deux fois plus de lasers.

### Pulse, la pyromane (explosifs)

**Attaque de base : Grenade** — une grenade sur l'ennemi le plus proche, explosion en zone.

**Communes (10)**

- **Roquette** — un gros tir explosif, avec une grande zone d'explosion. *Légendaire :* la roquette se divise en trois à l'impact.
- **Mine à fragmentation** — une mine qui éclate en éclats dans toutes les directions. *Légendaire :* les éclats sont à tête chercheuse.
- **Cocktail incendiaire** — des bouteilles incendiaires laissent des flaques de feu qui s'étendent. *Légendaire :* les flaques de feu en font naître d'autres.
- **Pluie d'obus** — quelques gros obus lents retombent en cloche sur une zone. *Légendaire :* chaque obus laisse un cratère de feu.
- **Grenade à fusion** — une grenade attire les ennemis vers elle, puis explose. *Légendaire :* elle explose une seconde fois.
- **Armure réactive** — quand tu es touché, ton armure explose tout autour de toi. *Légendaire :* l'explosion se répète trois fois.
- **Lance-flammes** — un cône de feu brûle tout devant toi pendant quelques secondes. *Légendaire :* le cône est deux fois plus large.
- **Grenade collante** — une grenade colle à un ennemi proche puis explose. *Légendaire :* l'explosion colle une autre grenade sur un ennemi proche.
- **Napalm** — une flaque de feu lancée au sol brûle tout ce qui s'y trouve. *Légendaire :* la flaque s'étend avec le temps.
- **Bombardement** — une pluie de grenades s'abat sur une zone. *Légendaire :* une seconde pluie suit.

**Rares (5)**

- **Chapelet de bombes** — il sème des bombes derrière lui pendant quelques secondes, qui explosent à la chaîne. *Légendaire :* chaque bombe explose deux fois.
- **Frappe aérienne** — un tapis de bombes tombe en ligne droite à travers tout l'écran, bombe après bombe. *Légendaire :* une seconde ligne tombe en parallèle.
- **Fournaise** — un anneau de feu s'étend autour de toi et laisse des flammes qui brûlent au sol. *Légendaire :* un second anneau suit.
- **Tir de barrage** — une rafale rapide d'obus explosifs part en éventail. *Légendaire :* chaque obus se divise en trois à l'impact.
- **Bombe à retardement** — une grosse bombe plantée explose après un compte à rebours. *Légendaire :* l'explosion se répète en trois vagues.

**Épiques (2)**

- **Cataclysme** — une pluie de météores s'abat sur tout l'écran et laisse des cratères de feu. *Légendaire :* deux fois plus de météores.
- **Fusion du réacteur** — tu deviens un réacteur instable : des explosions éclatent sans cesse autour de toi, et tu es invulnérable. *Légendaire :* les ennemis qui te touchent brûlent.

### Zap, l'électricien (foudre)

**Attaque de base : Éclair en chaîne** — un éclair qui saute sur trois ennemis proches.

**Communes (10)**

- **Tempête** — des éclairs en rafale s'abattent sur les ennemis autour de toi. *Légendaire :* chaque éclair frappe en zone.
- **Pylône** — un pylône frappe les ennemis proches, et s'allie aux autres pylônes par des arcs. *Légendaire :* les arcs entre pylônes étourdissent.
- **Foudre globulaire** — un globe de foudre flotte vers un ennemi et explose au contact. *Légendaire :* il se divise en trois petits globes.
- **Orage statique** — une zone crépite et foudroie au hasard les ennemis qui s'y trouvent. *Légendaire :* les foudroyés sont étourdis.
- **Chaîne longue** — un éclair qui saute d'ennemi en ennemi, bien plus loin qu'une chaîne ordinaire. *Légendaire :* deux fois plus de sauts.
- **Bobine mobile** — une bobine te suit partout et foudroie les ennemis proches. *Légendaire :* elle foudroie quatre cibles à la fois.
- **Arc voltaïque** — un arc électrique continu relie Zap à l'ennemi le plus proche, puis saute plus loin. *Légendaire :* deux arcs en parallèle.
- **Orbe de tonnerre** — une boule d'énergie lente qui foudroie les ennemis qu'elle croise. *Légendaire :* l'orbe foudroie 4 ennemis à la fois au lieu de 2.
- **Champ électrique** — une zone électrique blesse et étourdit les ennemis. *Légendaire :* la zone te suit.
- **Tesla** — une bobine posée au sol frappe les ennemis autour d'elle. *Légendaire :* la bobine foudroie deux fois plus d'ennemis.

**Rares (5)**

- **Paratonnerre** — un paratonnerre attire les éclairs du ciel, qui frappent ensuite les ennemis tout autour. *Légendaire :* l'éclair frappe cinq cibles de plus.
- **Aura statique** — une aura électrique autour de toi foudroie sans cesse les ennemis qui s'approchent. *Légendaire :* les éclairs étourdissent.
- **Marteau de Thor** — un marteau tourbillonne, part et revient en lâchant des éclairs sur les ennemis proches. *Légendaire :* il revient avec une explosion de foudre.
- **Déluge** — une pluie d'éclairs s'abat sur une grande zone autour de toi. *Légendaire :* deux fois plus d'impacts.
- **Coup de tonnerre** — après une courte charge, une onde électrique étourdit tout autour de toi. *Légendaire :* une seconde onde, plus grande, suit.

**Épiques (2)**

- **Colère du ciel** — un éclair gigantesque tombe sur l'ennemi le plus costaud, puis saute sur une douzaine d'autres. *Légendaire :* il frappe aussi les deux ennemis suivants les plus costauds.
- **Dieu de l'orage** — tu deviens l'orage : des éclairs s'abattent sans cesse sur tout l'écran pendant plusieurs secondes. *Légendaire :* tu es invulnérable pendant la transformation.

## Totaux

- 7 attaques de base, 6 armes universelles, 12 boosts.
- 70 armes uniques communes, 35 rares, 14 épiques (et 0 légendaire, à créer).

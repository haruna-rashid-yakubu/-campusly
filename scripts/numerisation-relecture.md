# Relecture d'une extraction

DeepSeek fait une première lecture de chaque page. Avant publication, chaque Sujet
est relu **page par page contre sa photo** par Claude. La Version reconstituée doit
contenir **tout** ce qui est écrit par l'enseignant, **mot pour mot et chiffre pour
chiffre**, et rien d'autre.

Le dossier d'un Sujet contient `page-01.jpg`, `page-02.jpg`… et `extraction.json`.
On modifie uniquement `extraction.json`.

## Pour chaque page

1. Ouvrir la photo et le tableau `pages[i].blocs` correspondant.
2. Lire la photo **ligne par ligne, de haut en bas**, et vérifier que chaque ligne
   se retrouve dans les blocs, dans le même ordre :
   - **ajouter** tout ce qui manque (une phrase, une question, une ligne de tableau,
     une note « N.B », une consigne, une formule) ;
   - **corriger** chaque mot, nombre, date, montant, unité, signe et indice mal lu ;
   - **retirer** ce qui n'est pas sur la feuille ou n'appartient pas au Sujet
     (notes d'étudiant, numéros griffonnés, texte inventé).
3. Ne **jamais** corriger l'enseignant : une faute d'orthographe ou une erreur
   d'énoncé sur la feuille reste telle quelle.
4. Les formules en LaTeX (`$…$` dans le texte, bloc `formule` pour une formule
   centrée) : vérifier symbole par symbole (indices, exposants, barres, sommes,
   bornes, signes ≤ ≥).
5. Les tableaux : même nombre de colonnes et de lignes que sur la feuille, chaque
   cellule vérifiée.
6. Un schéma, un graphique ou un dessin impossible à retranscrire : un bloc
   `figure` dont `boite` (millièmes de la largeur et de la hauteur de la photo)
   encadre exactement la figure.
7. Si un passage reste illisible même à l'œil : le retranscrire au mieux avec
   `[illisible]` à l'endroit exact, et mettre dans `pages[i].aRelire` une phrase
   qui dit quoi et où.
8. Si la photo n'est pas droite, mettre dans `pages[i].rotation` le nombre de
   degrés (90, 180 ou 270) dont il faut la tourner **dans le sens des aiguilles
   d'une montre** pour qu'elle se lise normalement ; 0 sinon. Les boîtes des
   figures se mesurent sur la page remise droite.
9. Mettre `pages[i].verifiee` à `true` et `pages[i].confiance` à ta propre
   certitude après relecture.

## Mise en forme du texte

Reproduire l'emphase de la feuille quand elle a un sens (mots soulignés à définir,
termes en gras) :
- gras : `**mot**` ;
- souligné : `__mot__` ;
- italique : `$\textit{mot}$`.

Rien d'autre (pas de `*mot*`, pas de balises HTML).

## Structure

- `exercice` : uniquement les grandes divisions (Exercice, Cas, Partie, Problème,
  Section), avec leur barème global, sans « : » final.
- `question` : tout point qui demande quelque chose et tout ce qui porte un barème.
  `numero` tel qu'écrit sur la feuille (`1-`, `a)`, `II`), vide s'il n'y en a pas.
  Le barème va dans `points`, jamais dans le texte. Un texte avec barème n'est
  jamais un `paragraphe` (son barème ne s'afficherait pas).
- `paragraphe` : énoncé, mise en situation, consigne générale, N.B.
- L'en-tête (établissement, classe, durée, enseignant, session, année académique)
  va dans `meta` et `pages[0].entete`, **pas** dans les blocs. Une ligne coupée
  par le bord de la photo est retirée, sauf si elle est évidente (« UCAC »).

## Contrôles finaux

- **Barèmes** : pour chaque exercice qui annonce un total, la somme de ses
  questions doit tomber juste. Un écart signale presque toujours une question
  manquée.
- **Numérotation** : aucune question sautée (1, 2, 3… ; a, b, c…).
- **Ordre et complétude des feuilles** : si les feuilles portent « Page n sur m »
  (ou une numérotation équivalente), vérifier que les photos sont dans l'ordre et
  qu'aucune feuille ne manque. Ne pas renommer les photos : écrire en première
  ligne de `verification.corrections` « ORDRE : photo 8 = feuille 7, … » et/ou
  « MANQUE : feuille 8 sur 10 », la coordination remet en ordre.
- **Fiche** (`meta`) : `type` dans la liste Partiel, CC, Examen, Rattrapage, TD,
  Concours (devoir surveillé = CC, mid-term = Partiel) ; `enseignant`, `duree`,
  `session` tels qu'écrits ; `langue` juste ; `etablissement` sans lignes coupées.
- **Thèmes** (`themes`) : 3 à 6 notions précises, en français, sans doublon.

## Pour finir

Écrire `verification` :

```json
{ "par": "Claude (relecture page par page contre la photo)", "le": "AAAA-MM-JJ",
  "corrections": ["une ligne par correction, assez précise pour être vérifiée"] }
```

Dernière ligne des corrections : le contrôle des barèmes et de la numérotation
(« barèmes conformes », ou ce qui ne tombe pas juste sur la feuille elle-même).

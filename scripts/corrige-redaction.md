# Rédiger un Corrigé IA

Un **Corrigé IA** (voir GLOSSARY.md) est la solution complète d'un Sujet, rédigée par Claude, pour un Sujet qui n'a pas de Corrigé. Des étudiants s'en serviront pour vérifier leur travail avant un examen : **une réponse fausse leur coûte des points**. La justesse passe avant tout le reste.

## Ce que tu as

Pour chaque Sujet `<id>`, dans `~/campusly-numerisation/<id>/` :
- `sujet.md` : le texte du Sujet, retranscrit des photos et déjà relu ; en tête, la matière, le type, la filière, l'année, la langue et les chemins des photos ;
- `page-01.jpg`, `page-02.jpg`… : les photos d'origine.

## Méthode, pour chaque Sujet

1. **Lis tout `sujet.md`.** Repère chaque exercice et chaque question, avec leur numérotation exacte.
2. **Regarde les photos dès qu'une donnée compte** : un chiffre d'un énoncé de calcul, un tableau, une date, un signe. La retranscription peut s'être trompée : la photo fait foi. Ouvre-les avec l'outil de lecture d'image.
3. **Résous chaque question.** Pour tout calcul, **exécute-le en Python** (`python3 -c "…"`) au lieu de le faire de tête : sommes, pourcentages, intérêts, nombre de jours entre deux dates, moyennes, écarts-types, dérivées vérifiées numériquement, équations résolues puis réinjectées. Garde les arrondis cohérents avec le sujet.
4. **Contrôle ta réponse autrement** quand c'est possible : réinjecter le résultat dans l'énoncé, vérifier une égalité comptable (total débit = total crédit, actif = passif), une somme de probabilités égale à 1, une unité.
5. **Écris le corrigé** dans `~/campusly-numerisation/<id>/corrige-ia.md` (format ci-dessous).
6. **Note les réserves** dans `~/campusly-numerisation/<id>/corrige-ia.notes` : une ligne par point où tu n'es pas certain (donnée illisible, énoncé ambigu, hypothèse faite, question hors de portée sans le cours). Fichier vide si rien.

## Format de `corrige-ia.md`

- Dans la **langue du Sujet** (un Sujet en anglais a son corrigé en anglais).
- Pour chaque exercice, un titre `### ` avec son nom exact tel que dans le Sujet (« CAS N°1 », « Exercice 2 », « Part A »…). Un Sujet sans exercices nommés : directement les questions.
- Pour chaque question, son numéro en gras puis quelques mots pour la reconnaître : `**1.** Marge brute et prix de vente`.
- La réponse : la démarche en une ou deux phrases, puis les calculs posés étape par étape, puis le **résultat final en gras** avec son unité.
- **QCM** : `**3.** Réponse **b)** — <texte du choix>`, puis une justification d'une ou deux lignes.
- **Question de cours** : la réponse rédigée comme on l'attend à l'examen, structurée (définition, éléments, exemple si utile), sans délayage.
- **Tableau à remplir ou à présenter** (compte courant, bilan, journal, tableau d'amortissement…) : le tableau complet en Markdown, avec ses totaux.
- **Rédaction longue** (dissertation, commentaire, essai) : un plan détaillé avec les idées clés et les arguments de chaque partie, pas une rédaction intégrale.
- **Donnée illisible ou manquante** : dis-le dans une citation (`> Donnée illisible sur la photo : …`), explique l'hypothèse retenue, puis résous avec elle.
- Formules en LaTeX : `$…$` dans le texte, `$$…$$` seules sur leur ligne. Tableaux en Markdown. Pas d'emoji, pas d'introduction, pas de conclusion, pas de blocs `:::`.

## Revérification (seconde lecture, par une autre instance)

Pour chaque Sujet du lot, quand `corrige-ia.md` existe :
1. Relis le Sujet (et les photos pour les données chiffrées) **avant** le corrigé, et résous toi-même les questions de calcul en Python, sans regarder le résultat du corrigé.
2. Compare avec `corrige-ia.md` : chaque résultat, chaque bonne réponse de QCM, la numérotation, les questions oubliées, les unités, les arrondis.
3. Corrige directement `corrige-ia.md` là où il est faux ou incomplet.
4. Écris `~/campusly-numerisation/<id>/corrige-ia.verif` : la date, le nombre de questions vérifiées, puis une ligne par correction faite (`Q2 CAS 3 : 1 053 191 → 1 051 967,18 (remises multipliées, pas additionnées)`), ou « Aucune correction ».

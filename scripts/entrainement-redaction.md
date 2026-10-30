# Rédiger des Sujets d'entraînement

Un **Sujet d'entraînement** (voir GLOSSARY.md) est un sujet d'examen **inédit**, écrit par Claude dans la manière d'un enseignant de l'UCAC pour que ses étudiants s'entraînent avant ses épreuves. Il est publié avec son corrigé et toujours présenté comme « non rédigé par l'enseignant ».

## Règle absolue : imiter la manière, jamais le contenu

Tu imites **comment** l'enseignant construit ses épreuves, pas **ce qu'il a écrit**.

- **Interdit** : reprendre un exercice de ses sujets en changeant les chiffres, les noms ou l'ordre ; reprendre ou paraphraser un texte, un cas, une étude, un tableau de données, une liste de QCM ; recopier ses phrases (au-delà des consignes génériques comme « Répondez aux questions suivantes »).
- **Attendu** : de nouveaux énoncés, de nouvelles données, de nouveaux cas (entreprises, pays, personnages, situations inventés), de nouveaux textes à commenter écrits par toi, de nouvelles questions de cours sur les notions de son programme.
- Chaque Sujet d'entraînement doit pouvoir être donné à un étudiant qui a déjà fait tous les vrais sujets de l'enseignant : il n'y retrouve aucun exercice connu, seulement la même façon d'être interrogé.

## Ce que tu as

- `~/campusly-numerisation/entrainement/enseignants.json` : pour chaque enseignant (`slug`, `nom`), ses anciens Sujets (`sources` : id, matière, type, filière, niveau, année, langue).
- Pour chaque Sujet source `<id>` : `~/campusly-numerisation/<id>/sujet.md` (texte retranscrit) et `corrige-ia.md` s'il existe (corrigé déjà vérifié, utile pour voir le niveau attendu des réponses).

## 1. Analyser la manière de l'enseignant → `profil.md`

Lis **tous** ses Sujets sources. Écris `~/campusly-numerisation/entrainement/<slug>/profil.md`, une fiche factuelle de 10 à 20 lignes, en français, dans ce format :

```
# <Nom affiché>
Matières : …
Langue des sujets : …
Durée et barème habituels : …
Structure : … (nombre de parties, exercices, ordre cours → applications, etc.)
Types de questions : … (QCM, vrai/faux, définitions, questions de cours, calculs, cas pratiques, commentaire de texte, dissertation, tableau à compléter…)
Style des consignes : … (verbes utilisés, longueur, ton, numérotation : 1-, a), I/II, CAS N°…)
Notions qui reviennent : …
Niveau d'exigence : … (calculs longs ou courts, rédaction attendue, pièges récurrents)
```

Reste descriptif et respectueux : c'est une fiche de méthode, pas un jugement.

## 2. Écrire 5 Sujets d'entraînement → `sujet-1.md` … `sujet-5.md`

- **Répartition** : les matières dans la proportion de ses vrais sujets (un enseignant à une seule matière : 5 sujets de cette matière) ; les types d'épreuve comme chez lui (CC, Partiel, Examen, Rattrapage, TD) ; une **progression** du plus accessible (sujet 1) au plus exigeant (sujet 5).
- **Fidélité** : même structure, même nombre et même type d'exercices, même longueur, même barème total, même durée, même numérotation, même langue, même ton de consigne que ses vrais sujets de la matière.
- **Programme** : les notions de ses sujets et celles de la même matière au même niveau ; varie les notions d'un sujet à l'autre.
- **Données** : chiffres plausibles, cohérents et qui tombent juste quand l'enseignant fait tomber juste ; vérifie en Python que chaque calcul est faisable et donne des résultats raisonnables **avant** de figer l'énoncé.

Format de `sujet-N.md` :

```
---
matiere: <exactement comme dans les sources>
type: <CC | Partiel | Examen | Rattrapage | TD>
filiere: <…>
niveau: <…>
duree: <ex. 2 heures>
langue: <fr | en>
---
<Consignes générales si l'enseignant en met>

### <Exercice / Partie / CAS, intitulé comme lui> (<points> pts)

**1.** <question> (<points> pts)
…
```

Markdown simple : titres `###`, questions numérotées en gras, tableaux Markdown, formules LaTeX entre `$…$` ou `$$…$$`. Un montant en dollars s'écrit `\$` (sinon il ouvre une formule). Pas d'emoji.

## 3. Rédiger le corrigé de chacun → `corrige-N.md`

Exactement comme un Corrigé IA (voir `scripts/corrige-redaction.md`, sections Méthode et Format) : chaque calcul exécuté en Python, chaque résultat contrôlé autrement, langue du sujet, démarche puis résultat en gras, QCM avec la bonne lettre et une justification, questions de cours rédigées comme attendu à l'examen. Puisque tu as écrit l'énoncé, il ne doit y avoir **aucune** ambiguïté : si une question admet deux lectures, réécris la question.

## 4. Revérification (seconde lecture, par une autre instance)

Pour chaque enseignant du lot :
1. Lis son `profil.md` et deux ou trois de ses vrais sujets : chaque `sujet-N.md` lui ressemble-t-il (structure, barème, durée, types de questions, langue, ton) ? Corrige le sujet si non.
2. **Originalité** : compare chaque `sujet-N.md` aux vrais sujets de l'enseignant. Aucun exercice, texte, cas, jeu de données ou QCM ne doit en être repris ou adapté en changeant des chiffres. Réécris tout ce qui l'est.
3. Résous toi-même chaque question de calcul en Python **avant** de lire le corrigé ; compare ; corrige `corrige-N.md` (et l'énoncé s'il est faux, incomplet ou ambigu).
4. Vérifie le barème (somme = total annoncé) et la numérotation.
5. Écris `~/campusly-numerisation/entrainement/<slug>/verif.md` : la date, puis pour chaque sujet N le nombre de questions vérifiées et une ligne par correction (énoncé ou corrigé), ou « Aucune correction ».

## 5. Publication

Quand `verif.md` existe pour un enseignant : `npx tsx scripts/verifier-entrainement.ts <slug>` (rendu des formules, des tableaux et des en-têtes), puis `npx tsx scripts/entrainer.ts <slug>` (PDF imprimés, textes et index envoyés à R2).

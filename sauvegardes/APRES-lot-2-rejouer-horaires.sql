-- A REJOUER UNIQUEMENT APRES LE DEPLOIEMENT DU LOT 2.
--
-- Pourquoi ce fichier existe : j'ai migre ces 16 lignes avant de deployer le
-- code qui lit `creneau.horaire`, dans le mauvais ordre. L'ancien code
-- n'affiche que `matiere` et les heures du creneau, donc sortir l'heure du
-- titre l'a fait disparaitre de l'ecran : "14h-18h : Welcome day" au lieu de
-- "14h-18h : Welcome day a 12H00". Contradictoire avant, incomplet apres.
--
-- La semaine 2026-10-05 est la semaine EN COURS, donc c'etait visible
-- immediatement. Les lignes ont ete remises a leur etat d'origine.
--
-- Le bon ordre est : deployer le lot 2 (le code tolere les deux formes,
-- `horaire` NULL garde le comportement actuel), VERIFIER sur /programme,
-- puis rejouer ce fichier.

UPDATE creneau SET matiere = 'Welcome day', horaire = '11h00'
  WHERE matiere = 'Welcome day à 11H00';

UPDATE creneau SET matiere = 'Welcome day', horaire = '12h00'
  WHERE matiere = 'Welcome day à 12H00';

UPDATE creneau SET matiere = 'Introduction à la Sociologie générale', horaire = '15h–17h'
  WHERE matiere = 'Introduction à la Sociologie générale — 15h à 17h';

UPDATE creneau SET matiere = 'Introduction à la GRH (GRH-SS, tronc commun avec LEG 2)', horaire = '15h–18h'
  WHERE matiere = 'Introduction à la GRH (GRH-SS, tronc commun avec LEG 2) — 15h à 18h';

UPDATE creneau SET matiere = 'Introduction à la GRH (GRH-SS, tronc commun LGRH-LSSD-LQSSE)', horaire = '15h–18h'
  WHERE matiere = 'Introduction à la GRH (GRH-SS, tronc commun LGRH-LSSD-LQSSE) — 15h à 18h';

-- Controle attendu : 16 lignes avec un horaire.
-- SELECT count(*) FILTER (WHERE horaire IS NOT NULL) FROM creneau;

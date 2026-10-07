-- Etat des lignes de `subject` avant les decisions D-1, D-2 et D-4,
-- releve le 2026-10-07. Rejouer ce fichier annule exactement ces trois
-- corrections. Aucune donnee personnelle : intitules de cours et URL publiques.
--
-- Sauvegarde complete : snapshot Neon « avant-revue-complete-2026-10-07 »
-- (snap-purple-darkness-akq70lxh), branche main.

-- D-1 : les deux GIM (aucune annee lisible sur les documents, verifie par OCR)
UPDATE subject SET variante = NULL WHERE id = 54;
UPDATE subject SET variante = NULL WHERE id = 61;

-- D-2 : fusion Econometrie 2025. Remet la photo seule sur l'id 120 ...
UPDATE subject SET
  file_url = 'https://smp2uiacevm3zokj.public.blob.vercel-storage.com/submissions/1791308229261-IMG-20260928-WA0048-hi9xSgGJAbvSg795udheHXanpXXRmN.jpg',
  file_name = 'IMG-20260928-WA0048.jpg'
WHERE id = 120;
-- ... et recree l'id 126 supprime
INSERT INTO subject (id,matiere,filiere,niveau,annee,type,corrige,reserve_filiere,enseignant,file_url,file_name,downloads,created_at)
VALUES (126,'Econométrie','LEG','L3','2025','Examen',false,false,'Dr Ngouana',
 'https://smp2uiacevm3zokj.public.blob.vercel-storage.com/sujets/1791320607864-UCAC-LEG3-Econometrie-Examen-2025-rowqWm3X0OiG9JCaw1HStbCKsCQ3DF.pdf',
 'UCAC-LEG3-Econometrie-Examen-2025.pdf',1,'2026-10-06 21:03:27.951815');
SELECT setval(pg_get_serial_sequence('subject','id'), (SELECT max(id) FROM subject));

-- D-4 : orthographe de l'enseignant dans l'emploi du temps
UPDATE creneau SET enseignant = 'M. AYENKENG' WHERE enseignant = 'M. AYANKENG';

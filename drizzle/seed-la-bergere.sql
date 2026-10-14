-- La Bergère, yaourt vendu par une étudiante. Inserted inactive: visible to
-- admins only until it is switched on from /admin/vendeurs.
-- On commission: 50 F a bottle, 2 500 F minimum paid at the start of the month.
-- Loyalty: one bottle of the student's choice on the 4th delivered order.
-- TODO before applying: horaires and livraison (meeting point and times).
INSERT INTO "vendeur" ("slug","nom","categorie","accroche","whatsapp","livraison","frais_livraison","horaires","actif","ordre",
  "unite","fidelite","fidelite_regle","facturation","commission_par_article","minimum_mensuel","token_espace")
VALUES ('la-bergere','La Bergère','manger','Yaourt fait maison : fraise, menthe ou cacao','237699440929',
  'Remise en main propre sur le campus',0,'Tous les jours sur le campus',false,1,
  'bouteille',true,
  '{"cycle":4,"icone":"🥛","paliers":[{"rang":4,"cle":"bouteille","libelle":"1 bouteille au choix offerte","icone":"🥛"}]}'::jsonb,
  'commission',50,2500,replace(gen_random_uuid()::text,'-',''))
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vendeur_formule" ("vendeur_id","nom","taille","prix","prix_barre","badge","ordre")
SELECT v.id, '1 bouteille', 1, 500, NULL, NULL, 1 FROM "vendeur" v
WHERE v.slug='la-bergere' AND NOT EXISTS (SELECT 1 FROM "vendeur_formule" x WHERE x.vendeur_id=v.id);

INSERT INTO "vendeur_article" ("vendeur_id","nom","description","photo_url","ordre")
SELECT v.id, a.nom, a.description, NULL, a.ordre FROM "vendeur" v,
(VALUES ('Fraise','Yaourt à la fraise',1),('Menthe','Yaourt à la menthe',2),('Cacao','Yaourt au cacao',3)) AS a(nom,description,ordre)
WHERE v.slug='la-bergere' AND NOT EXISTS (SELECT 1 FROM "vendeur_article" x WHERE x.vendeur_id=v.id);

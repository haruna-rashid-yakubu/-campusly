-- La Bergère, sold by a student: bottled bergère in three flavours. Inserted inactive: visible to
-- admins only until it is switched on from /admin/vendeurs.
-- On commission: 50 F a bottle, 2 500 F minimum paid at the start of the month.
-- Loyalty: one bottle of the student's choice on the 4th delivered order.
-- Delivery free on campus (living there or ordering from there); off campus the
-- vendor sets the fee on WhatsApp. Free delivery is the shop's Campusly offer.
INSERT INTO "vendeur" ("slug","nom","categorie","accroche","logo_url","logo_carre_url","logo_fond","video_url","video_poster_url","whatsapp","livraison","frais_livraison","horaires","actif","ordre",
  "unite","fidelite","fidelite_regle","facturation","commission_par_article","minimum_mensuel","token_espace")
VALUES ('la-bergere','La Bergère','manger','Bergère fraise, menthe ou cacao, sans conservateurs artificiels',
  '/vendeurs/la-bergere/logo-large.png','/vendeurs/la-bergere/logo-carre.jpg','#faf9ef',
  '/vendeurs/la-bergere/video-la-bergere.mp4','/vendeurs/la-bergere/video-la-bergere-poster.jpg','237699440929',
  'Livraison gratuite sur le campus · hors campus, frais de livraison à voir avec La Bergère',0,'Livraison tous les jours : à la pause de 12h à 14h, et de 18h à 20h',false,1,
  'bouteille',true,
  '{"cycle":4,"icone":"🥛","paliers":[{"rang":4,"cle":"bouteille","libelle":"1 bouteille au choix offerte","icone":"🥛"}]}'::jsonb,
  'commission',50,2500,replace(gen_random_uuid()::text,'-',''))
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vendeur_formule" ("vendeur_id","nom","taille","prix","prix_barre","badge","ordre")
SELECT v.id, '1 bouteille', 1, 500, NULL, NULL, 1 FROM "vendeur" v
WHERE v.slug='la-bergere' AND NOT EXISTS (SELECT 1 FROM "vendeur_formule" x WHERE x.vendeur_id=v.id);

INSERT INTO "vendeur_article" ("vendeur_id","nom","description","photo_url","ordre")
SELECT v.id, a.nom, a.description, a.photo, a.ordre FROM "vendeur" v,
(VALUES ('Fraise','Douceur fruitée','/vendeurs/la-bergere/fraise.jpg',1),
        ('Menthe','Fraîcheur intense','/vendeurs/la-bergere/menthe.jpg',2),
        ('Cacao','Richesse chocolatée','/vendeurs/la-bergere/cacao.jpg',3)) AS a(nom,description,photo,ordre)
WHERE v.slug='la-bergere' AND NOT EXISTS (SELECT 1 FROM "vendeur_article" x WHERE x.vendeur_id=v.id);

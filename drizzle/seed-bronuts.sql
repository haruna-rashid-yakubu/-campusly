-- Bronuts, the first vendor. Inserted inactive: visible to admins only until
-- it is switched on from /admin/vendeurs.
INSERT INTO "vendeur" ("slug","nom","categorie","accroche","logo_url","logo_carre_url","whatsapp","livraison","frais_livraison","horaires","video_url","video_poster_url","actif","ordre")
VALUES ('bronuts','Bronuts','manger','Donuts gourmands, en packs à composer toi-même','/vendeurs/bronuts/logo-large.jpg','/vendeurs/bronuts/logo-carre.jpg','237656845289','Livraison sur le campus, chaque vendredi',2000,'Commande jusqu''au jeudi 17h pour être livré le vendredi','/vendeurs/bronuts/video-bronuts.mp4','/vendeurs/bronuts/video-bronuts-poster.jpg',false,0)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "vendeur_formule" ("vendeur_id","nom","taille","prix","prix_barre","badge","ordre")
SELECT v.id, f.nom, f.taille, f.prix, f.prix_barre, f.badge, f.ordre FROM "vendeur" v,
(VALUES ('Pack de 4',4,4000,NULL::int,NULL,1),('Pack de 6',6,6000,NULL::int,NULL,2),('Pack de 12',12,10000,11000,'Offre Campusly',3)) AS f(nom,taille,prix,prix_barre,badge,ordre)
WHERE v.slug='bronuts' AND NOT EXISTS (SELECT 1 FROM "vendeur_formule" x WHERE x.vendeur_id=v.id);

INSERT INTO "vendeur_article" ("vendeur_id","nom","description","photo_url","ordre")
SELECT v.id, a.nom, a.description, a.photo, a.ordre FROM "vendeur" v,
(VALUES
 ('Choco Classic','Nappage chocolat au lait, filets de chocolat blanc, pépites de chocolat','/vendeurs/bronuts/choco-classic.jpg',1),
 ('The Broculos','Glaçage blanc, éclats de biscuit spéculoos, filet de chocolat','/vendeurs/bronuts/broculos.jpg',2),
 ('Broreo Dark','Nappage chocolat, éclats d''Oreo, filets chocolat et blanc','/vendeurs/bronuts/broreo-dark.jpg',3),
 ('Broreo White','Glaçage blanc, éclats d''Oreo, filets caramel et blanc','/vendeurs/bronuts/broreo-white.jpg',4),
 ('The Brostachio','Glaçage blanc, filets et éclats de pistache','/vendeurs/bronuts/brostachio.jpg',5),
 ('The Broconut','Glaçage blanc, noix de coco râpée, filet de chocolat','/vendeurs/bronuts/broconut.jpg',6)
) AS a(nom,description,photo,ordre)
WHERE v.slug='bronuts' AND NOT EXISTS (SELECT 1 FROM "vendeur_article" x WHERE x.vendeur_id=v.id);

-- The pressing joins the vendor table as an internal service, so its orders
-- are counted and confirmed like a shop's. Not listed as a shop (categorie
-- "interne"); the WhatsApp number stays in the environment, as before.
INSERT INTO "vendeur" ("slug","nom","categorie","accroche","whatsapp","actif","fidelite","token_espace","ordre")
VALUES ('pressing','Pressing Campusly','interne','Récupération, lavage et livraison sur le campus','',true,false,replace(gen_random_uuid()::text,'-',''),99)
ON CONFLICT ("slug") DO NOTHING;

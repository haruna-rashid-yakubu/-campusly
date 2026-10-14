-- G-riche, a restaurant across the road from campus: breaded chicken, fried
-- rice and ice cream, from a menu (sizes and prices per item). Inserted
-- inactive: visible to admins only until it is switched on from /admin/vendeurs.
-- Weekly loyalty: 15 dishes delivered Monday to Saturday earn a gift on the
-- next order. Billing to be set once the vendor chooses a plan.
INSERT INTO "vendeur" ("slug","nom","categorie","accroche","banniere","whatsapp","livraison","frais_livraison","horaires","actif","ordre",
  "unite","fidelite","fidelite_regle","menu","token_espace")
VALUES ('g-riche','G-riche','manger','Poulet pané, fried rice et glaces, en face du campus',
  'radial-gradient(circle at 8% 16%, rgba(245,158,11,.55) 0 42px, transparent 43px), radial-gradient(circle at 94% 14%, rgba(220,38,38,.45) 0 36px, transparent 37px), radial-gradient(circle at 90% 90%, rgba(245,158,11,.5) 0 50px, transparent 51px), radial-gradient(circle at 6% 92%, rgba(220,38,38,.35) 0 28px, transparent 29px), linear-gradient(150deg, #fff7e6 0%, #ffe3c2 100%)',
  '237699375600','Retrait en face du campus · livraison dans les cités : 500 F',0,'Du lundi au samedi, de 7h à 22h30',false,2,
  'plat',true,
  '{"type": "hebdo", "seuil": 15, "libelle": "1 plat de 1 500 F + 1 glace ou 1 boisson offerts", "icone": "🍗"}'::jsonb,
  '{"gamelle": 200, "modes": [{"id": "retrait", "libelle": "Je passe la chercher", "prix": 0, "detail": "Au restaurant, en face du campus"}, {"id": "cite", "libelle": "Livraison dans ma cité", "prix": 500, "detail": "Précise ta cité et ta chambre"}], "sections": [{"titre": "Plats", "items": [{"id": "poulet-pane", "nom": "Poulet pané", "description": "Servi avec des frites au choix", "tailles": [{"id": "p", "nom": "Petit", "prix": 1000}, {"id": "m", "nom": "Moyen", "prix": 1500}, {"id": "g", "nom": "Grand", "prix": 2000}], "choix": {"titre": "Accompagnement", "options": ["Frites de pomme", "Frites de plantain"]}, "plat": true}, {"id": "fried-rice", "nom": "Fried rice", "description": "Servi avec des frites au choix", "tailles": [{"id": "p", "nom": "Petit", "prix": 1000}, {"id": "m", "nom": "Moyen", "prix": 1500}, {"id": "g", "nom": "Grand", "prix": 2000}], "choix": {"titre": "Accompagnement", "options": ["Frites de pomme", "Frites de plantain"]}, "plat": true}]}, {"titre": "Glaces", "items": [{"id": "glace", "nom": "Glace", "description": "Cinq parfums", "tailles": [{"id": "p", "nom": "Petite", "prix": 300}, {"id": "m", "nom": "Moyenne", "prix": 500}, {"id": "g", "nom": "Grande", "prix": 1000}], "choix": {"titre": "Parfum", "options": ["Chocolat", "Vanille", "Menthe", "Fraise", "Café"]}}]}]}'::jsonb,
  replace(gen_random_uuid()::text,'-',''))
ON CONFLICT ("slug") DO NOTHING;

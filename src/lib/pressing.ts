/*
 * The service's own terms, kept as one string so there is exactly one copy.
 * They are a commitment to students — what is washed, what is owed, what is
 * refunded — so they are not paraphrased anywhere: the summary above the
 * button repeats three lines of them, and this is what someone reads when
 * they open the panel.
 */
export const PRESSING_CONDITIONS = `🧺 PRESSING CAMPUSLY — Conditions du service

💰 Tarifs
• Habits normaux (couleurs) : 500 F / kg
• Habits blancs : 800 F / kg
Le linge est pesé au moment de la récupération, devant vous.

👕 Ce qui est inclus
Vos habits sont lavés, essorés et livrés. Ils ne sont NI séchés NI repassés.
Étendez-les dès la livraison : nous ne sommes pas responsables des mauvaises odeurs ou de l'humidité si le linge reste mouillé trop longtemps.

💳 Paiement
Le paiement se fait après la pesée, avant la prise en charge du linge (Mobile Money, Orange Money ou espèces). Pas de paiement = pas de prise en charge.

📋 Liste des articles (obligatoire)
Avant la récupération, envoyez la liste de vos articles (ex. : 3 jeans, 5 t-shirts, 2 draps). Nous la vérifions ensemble et vous envoyons une confirmation sur WhatsApp.
Seuls les articles déclarés et confirmés peuvent faire l'objet d'une réclamation.

🔁 Perte d'article
Si un article déclaré et confirmé est perdu par notre faute, il vous est remboursé jusqu'à 3 000 F par article.
Les articles non déclarés ne sont pas remboursés.

⚪ Blancs et couleurs
Séparez vos blancs de vos couleurs. Les vêtements qui déteignent doivent être signalés. Sans signalement, nous ne sommes pas responsables en cas de décoloration.

🧼 Taches
Nous faisons le maximum, mais certaines taches anciennes ou tenaces ne partent pas. Aucun remboursement dans ce cas.

⚠️ Poches
Videz vos poches. Nous ne sommes pas responsables des objets oubliés (argent, téléphone, clés…).

📣 Réclamations
À faire dans les 24 h suivant la livraison, avec photo.

📦 Livraison et linge non récupéré
Au moment de la récupération, nous fixons ensemble un créneau de livraison. Le linge est lavé pour être livré à ce créneau.
Si vous êtes absent ou injoignable :
• Le linge est étendu pour éviter qu'il s'abîme, avec des frais de séchage et de garde de 500 F / kg.
• Au-delà de 24 h après le créneau prévu, nous ne sommes plus responsables des odeurs, de l'humidité ou des moisissures.
• Le linge est gardé 10 jours maximum. Passé ce délai, il n'est plus sous notre responsabilité.

En commandant, vous acceptez ces conditions.`;

/** The three lines worth seeing without opening anything. */
export const PRESSING_RESUME = [
  "500 F le kilo pour les couleurs, 800 F pour les blancs",
  "Lavé et essoré — ni séché, ni repassé",
  "Paiement après la pesée, avant la prise en charge",
];

/*
 * Read from the environment rather than written here, so the number can be
 * changed without a deployment — and so an unset value is visible as such
 * instead of shipping a button that opens a conversation with nobody.
 */
export const PRESSING_WHATSAPP = process.env.NEXT_PUBLIC_PRESSING_WHATSAPP ?? "";

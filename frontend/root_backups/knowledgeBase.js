/* Base de connaissance pour le chatbot Afritana */

const knowledge = [
  {
    keywords: ['vendre', 'vendeur', 'publier', 'ajouter', 'produit'],
    response: "Pour vendre sur Afritana, c'est simple ! \n1. Créez un compte ou connectez-vous. \n2. Cliquez sur [Vendre](/register) dans le menu. \n3. Remplissez le formulaire avec les détails de votre produit, de belles photos et un prix. \nVotre produit sera visible immédiatement par les acheteurs proches de vous !"
  },
  {
    keywords: ['acheter', 'achat', 'panier', 'commande'],
    response: "Pour acheter : \n1. Parcourez les [produits](/products). \n2. Ajoutez ce qui vous plaît au panier. \n3. Validez votre panier en remplissant vos informations. \nLe vendeur vous contactera ensuite pour finaliser la livraison."
  },
  {
    keywords: ['payer', 'paiement', 'argent', 'sous', 'fedapay', 'mobile money'],
    response: "Le paiement se fait principalement **à la livraison**, directement au vendeur. \nPour les services de promotion de produits (mise en avant), nous acceptons le paiement par Mobile Money via notre partenaire sécurisé FedaPay."
  },
  {
    keywords: ['promo', 'vedette', 'avant', 'visibilité', 'pub', 'booster'],
    response: "Boostez vos ventes en mettant vos produits en vedette ! \n- **3 jours** : 1 000 FCFA \n- **1 semaine** : 2 500 FCFA \n- **1 mois** : 9 000 FCFA \nVotre produit apparaîtra en haut des recherches et sur la page d'accueil. Vous pouvez le faire depuis la page [Mes produits](/my-products)."
  },
  {
    keywords: ['près', 'proche', 'localisation', 'ville', 'zone', 'distance', 'géolocalisation'],
    response: "Afritana est conçu pour la proximité ! Nous utilisons votre position pour vous montrer les produits vendus dans votre quartier ou votre ville. Vous pouvez activer la localisation ou filtrer par ville sur la page [Produits](/products)."
  },
  {
    keywords: ['passe', 'compte', 'connecter', 'inscrire', 'profil'],
    response: "Pour tout ce qui concerne votre compte : \n- **Mot de passe oublié ?** Utilisez le lien sur la [page de connexion](/login). \n- **Créer un compte ?** Cliquez sur [Devenir vendeur](/register). \n- **Modifier votre profil ?** Allez sur la page [Mon Profil](/profile) une fois connecté."
  },
  {
    keywords: ['livraison', 'livrer'],
    response: "La livraison est gérée **directement entre l'acheteur et le vendeur**. Une fois la commande passée, le vendeur vous contacte pour convenir d'un point de rencontre ou d'une livraison. C'est ça, *'la livraison en moins'* : pas d'intermédiaire coûteux !"
  },
  {
    keywords: ['signaler', 'arnaque', 'problème', 'faux'],
    response: "Si vous voyez un produit ou un vendeur suspect, vous pouvez le signaler. Sur la page du produit, cherchez le bouton 'Signaler le produit'. Notre équipe examinera le signalement rapidement pour garantir la sécurité de la plateforme."
  },
  {
    keywords: ['humain', 'téléphone', 'contact', 'support', 'whatsapp'],
    response: "Besoin de parler à un humain ? Pas de problème. \n- **Email :** contact@afritana.com \n- **WhatsApp :** +229 01 40 57 13 73. \nNous sommes là pour vous aider."
  },
  {
    keywords: ['bonjour', 'salut', 'hello', 'ça va', 'cc', 'yo'],
    response: "Bonjour ! Je suis l'assistant intelligent d'Afritana. Comment puis-je rendre votre expérience sur notre marché plus simple aujourd'hui ?"
  },
];

export const findResponse = (input) => {
  const text = input.toLowerCase().trim();

  for (const rule of knowledge) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        return rule.response;
      }
    }
  }

  // Réponse par défaut
  return "Je ne suis pas sûr de comprendre. Essayez de reformuler avec des mots-clés comme 'vendre', 'livraison', 'paiement', 'compte'... Ou demandez à parler à un 'humain'.";
};

export const initialMessage = {
  id: 1,
  text: "Bonjour ! 👋 Je suis l'assistant Afritana. Je peux répondre à toutes vos questions sur le site.",
  sender: 'bot',
  timestamp: new Date()
};

export const quickReplies = [
  { id: 'qr1', text: 'Comment vendre ?' },
  { id: 'qr2', text: 'Comment se passe la livraison ?' },
  { id: 'qr3', text: 'Quels sont les tarifs de promotion ?' },
];
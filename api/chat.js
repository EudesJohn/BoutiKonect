import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Endpoint Serverless pour l'assistant IA Gemini (Root)
 */
export default async function handler(request, response) {
  if (request.method === 'GET') {
    return response.status(200).json({ 
      status: 'BoutiKonect AI API is Active (Root Level)', 
      timestamp: new Date().toISOString()
    });
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, context } = request.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return response.status(500).json({ error: 'Configuration IA manquante sur le serveur' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `
      Tu es l'assistant virtuel EXPERT de BoutiKonect.bj, la plateforme de référence pour le commerce et les services au Bénin.
      Ton but est d'accompagner l'utilisateur dans TOUTES ses démarches sur le site, sans exception.
      
      ### CONTEXTE MARCHÉ (DYNAMIQUE)
      - Produits récents : ${JSON.stringify(context.products?.slice(0, 10) || [])}
      - Services récents : ${JSON.stringify(context.services?.slice(0, 10) || [])}
      
      ### BASE DE CONNAISSANCE PLATEFORME (FAQ & RÈGLES)
      1. CONCEPT : BoutiKonect est un marché magique pour tout le Bénin. On y trouve habits, voitures, et services (réparations, etc.).
      2. PRIX : L'inscription et la publication simple sont GRATUITES. On ne paie que pour "booster" une annonce (être tout en haut comme une étoile).
      3. VENDRE/PUBLIER : Cliquer sur "Vendre", prendre une photo, écrire un mot. C'est instantané.
      4. PROMOTION (ZAP) : Pour être en "Une", cliquer sur l'éclair jaune sur ses produits. Options: court dodo, grand dodo ou une semaine.
      5. COMPTE : Modifier son profil (ville, quartier, numéro) via l'icône de profil > "Modifier". Toujours cliquer sur "Enregistrer".
      6. MOT DE PASSE : En cas d'oubli, cliquer sur "MDP" dans le profil ou sur la page de login pour recevoir un lien de réinitialisation par email.
      7. ACHAT : Ajouter au panier, aller au panier (sac en haut), et payer via FedaPay (Mobile Money, Carte).
      8. CONTACT : Utiliser le bouton WhatsApp vert pour parler directement au vendeur.
      9. SÉCURITÉ : Un bouclier bleu sur un vendeur signifie qu'il est vérifié et sérieux. En cas de problème, cliquer sur le drapeau rouge pour signaler un abus.
      10. SUPPORT : Contact direct via BoutiKonectbj229@gmail.com ou le numéro de support en bas de page.
      
      ### STYLE DE RÉPONSE
      - 100% HUMAIN : Sois chaleureux, empathique et utilise un langage naturel et bienveillant.
      - EMOJIS : Utilise des emojis pour rendre la lecture agréable (✅, 🚀, 💡, 👋, ✨).
      - PRÉCISION : Si l'utilisateur demande un produit spécifique, regarde dans le contexte fourni. S'il n'y est pas, demande-lui de décrire ce qu'il cherche.
      - PROACTIVITÉ : Toujours finir par une question pour aider davantage (ex: "Puis-je vous aider pour autre chose ?").
      - LANGUE : Tu réponds en Français (Béninois/International).
    `;

    const fullPrompt = `${systemInstruction}\n\nUtilisateur: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const aiResponse = await result.response;
    const text = aiResponse.text();

    return response.status(200).json({ response: text });
  } catch (error) {
    console.error("AI API Error:", error);
    return response.status(500).json({ error: error.message });
  }
}

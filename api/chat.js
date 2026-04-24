import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Endpoint Serverless pour l'assistant IA Gemini (Root v2.0)
 */
export default async function handler(request, response) {
  // CORS Headers — restreint au domaine de production
  const allowedOrigins = ['https://bouti-konect.vercel.app'];
  const origin = request.headers.origin || request.headers.referer || '';
  const isAllowed = allowedOrigins.some(o => origin.startsWith(o));
  
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowedOrigins[0]);
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

   // Gestion du CORS Preflight
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method === 'GET') {
    return response.status(200).json({ 
      status: 'BoutiKonect AI API is Active (v2.3)', 
      timestamp: new Date().toISOString()
    });
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Robust parsing for various environments
    let body = request.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("[AI ERROR] Échec du parsing JSON manuel.");
      }
    }

    if (!body) {
      console.error("[AI ERROR] Corps de la requête (body) manquant. Vérifiez le parsing JSON.");
      return response.status(400).json({ error: 'Corps de la requête manquant' });
    }

    const { prompt, context = {} } = body;
    
    // Forcer la fermeture de connexion pour éviter les NetworkErrors intermittents sur certains proxys
    response.setHeader('Connection', 'close');
    
    if (!prompt || typeof prompt !== 'string') {
      return response.status(400).json({ error: 'Le message est vide ou invalide' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
...
    // Sécurisation du contexte pour éviter les injections ou les erreurs de parse
    const safeProducts = Array.isArray(context.products) ? context.products.slice(0, 10).map(p => ({ title: p.title, category: p.category, price: p.price })) : [];
    const safeServices = Array.isArray(context.services) ? context.services.slice(0, 10).map(s => ({ title: s.title, category: s.category, price: s.price })) : [];

    console.log(`[AI INFO] Requête reçue pour prompt: "${prompt.substring(0, 50)}..."`);
    
    if (!apiKey) {
      console.error("[AI ERROR] Clé API GEMINI_API_KEY manquante dans l'environnement.");
      return response.status(503).json({ error: "L'assistant est en maintenance (Configuration API manquante)." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `
      Tu es l'assistant virtuel EXPERT de BoutiKonect.bj, la plateforme de référence pour le commerce et les services au Bénin.
      Ton but est d'accompagner l'utilisateur dans TOUTES ses démarches sur le site, sans exception.
      
      ### CONTEXTE MARCHÉ (DYNAMIQUE)
      - Produits récents : ${JSON.stringify(safeProducts)}
      - Services récents : ${JSON.stringify(safeServices)}
      
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
    
    // Appel à l'API Gemini
    const result = await model.generateContent(fullPrompt);
    const aiResponse = await result.response;
    
    console.log(`[AI INFO] Réponse reçue de Gemini`);

    // Vérifier si la réponse a été bloquée par les filtres de sécurité ou est vide
    if (!aiResponse || !aiResponse.candidates || aiResponse.candidates.length === 0) {
       throw new Error("Gemini a renvoyé une réponse vide.");
    }

    if (aiResponse.candidates[0].finishReason === 'SAFETY') {
      return response.status(200).json({ response: "Désolé, je ne peux pas répondre à cette demande pour des raisons de sécurité. Veuillez poser une question sur les services de BoutiKonect." });
    }

    try {
      const text = aiResponse.text();
      if (!text) throw new Error("Texte de réponse vide");
      return response.status(200).json({ response: text });
    } catch (textError) {
      console.error("[AI ERROR] Erreur lors de l'extraction du texte:", textError);
      // Fallback: essayer d'extraire via les parts si text() échoue
      const fallbackText = aiResponse.candidates[0]?.content?.parts?.[0]?.text;
      if (fallbackText) {
        return response.status(200).json({ response: fallbackText });
      }
      throw new Error("Impossible d'extraire le texte de la réponse Gemini.");
    }
  } catch (error) {
    console.error("[AI CRITICAL ERROR]:", error);
    let errorMessage = "Désolé, je rencontre une petite difficulté technique.";
    
    if (error.message.includes("API key")) {
      errorMessage = "La clé API de l'assistant est invalide ou manquante.";
    } else if (error.message.includes("safety")) {
      errorMessage = "La réponse a été bloquée par les filtres de sécurité.";
    } else if (error.message.includes("quota")) {
      errorMessage = "L'assistant a atteint sa limite de messages pour l'instant.";
    }

    return response.status(500).json({ error: errorMessage, details: error.message });
  }
}

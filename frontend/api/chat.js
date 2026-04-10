import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Endpoint Serverless pour l'assistant IA Gemini
 */
export default async function handler(request, response) {
  // Sécurité: Vérifier la méthode
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
      Tu es l'assistant virtuel de BoutiKonect.bj, une plateforme de commerce en ligne et de services au Bénin.
      Ton but est d'aider les utilisateurs à trouver des produits, des services ou à répondre à leurs questions sur la plateforme.
      
      Contexte actuel :
      - Produits disponibles : ${JSON.stringify(context.products?.slice(0, 10) || [])}
      - Services disponibles : ${JSON.stringify(context.services?.slice(0, 10) || [])}
      
      Instructions :
      1. Sois poli, utile et professionnel.
      2. Utilise le contexte fourni pour répondre avec précision sur les produits et services.
      3. Si tu ne connais pas la réponse, suggère à l'utilisateur de contacter le support ou de consulter la FAQ.
      5. Travaille avec un style 100% humain : sois chaleureux, empathique et utilise des expressions naturelles.
      6. Utilise des emojis professionnels pour ponctuer tes réponses (ex: ✅, 🚀, 💡, 👋, ✨).
      7. Ton but est de donner l'impression d'une interaction humaine réelle et bienveillante.
      8. Favorise les produits et services qui sont dans la ville ou le quartier de l'utilisateur s'ils sont précisés.
    `;

    const fullPrompt = `${systemInstruction}\n\nUtilisateur: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const aiResponse = await result.response;
    const text = aiResponse.text();

    return response.status(200).json({ response: text });
  } catch (error) {
    console.error("AI API Error:", error);
    return response.status(500).json({ 
      error: "Erreur lors de la génération de la réponse IA",
      details: error.message 
    });
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service pour interagir avec les modèles d'IA de Google (Gemini)
 * Utilise le SDK standard @google/generative-ai pour une compatibilité maximale.
 */
class AIService {
  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error("Clé API Gemini/Google AI manquante dans les variables d'environnement.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = "gemini-1.5-flash";
  }

  /**
   * Génère une réponse textuelle à partir d'un prompt et d'un contexte
   * @param {string} prompt - La question de l'utilisateur
   * @param {Object} context - Données contextuelles (produits, services, etc.)
   * @returns {Promise<string>} - La réponse générée
   */
  async generateResponse(prompt, context = {}) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      
      // Préparer le message système avec le contexte
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
        6. Utilise des emojis professionnels pour ponctuer tes réponses (ex: ✅, 🚀, 💡, 👋, ✨) mais n'en abuse pas.
        7. Ton but est de donner l'impression d'une interaction humaine réelle et bienveillante.
      `;

      const fullPrompt = `${systemInstruction}\n\nUtilisateur: ${prompt}`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Erreur détaillée Gemini AI:", error);
      
      // Message d'erreur pédagogique
      let userFriendlyMessage = "Désolé, je rencontre une petite difficulté technique.";
      
      if (error.message?.includes('API_KEY_INVALID')) {
        userFriendlyMessage = "Erreur de clé API. Veuillez vérifier votre configuration dans .env.local.";
      } else if (error.message?.includes('quota')) {
        userFriendlyMessage = "Quota d'utilisation de l'IA dépassé pour le moment. Réessayez plus tard.";
      }
      
      throw new Error(userFriendlyMessage);
    }
  }

  /**
   * Génère une image à partir d'une description (Placeholder pour extension future)
   */
  async generateImage(prompt) {
    try {
      // Imagen nécessite généralement une configuration spécifique ou un service cloud séparé
      throw new Error("La génération d'image n'est pas encore supportée sur ce plan.");
    } catch (error) {
      console.error("Erreur Imagen AI:", error);
      throw new Error("Impossible de générer l'image pour le moment.");
    }
  }
}

export const aiService = new AIService();

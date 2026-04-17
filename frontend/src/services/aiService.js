import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service pour interagir avec les modèles d'IA de Google (Gemini)
 * Utilise le SDK standard @google/generative-ai pour une compatibilité maximale.
 */
/**
 * Service pour interagir avec l'assistant IA de BoutiKonect via l'API interne
 */
class AIService {
  /**
   * Génère une réponse textuelle à partir d'un prompt et d'un contexte
   * @param {string} prompt - La question de l'utilisateur
   * @param {Object} context - Données contextuelles (produits, services, etc.)
   * @returns {Promise<string>} - La réponse générée
   */
  async generateResponse(prompt, context = {}) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context: {
            products: context.products || [],
            services: context.services || []
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("L'assistant est actuellement en maintenance (Configuration API manquante). Veuillez contacter l'administrateur.");
        }
        throw new Error(data.error || "Erreur serveur");
      }

      return data.response;
    } catch (error) {
      console.error("AI Assistant Critical Error:", error);
      
      let userFriendlyMessage = error.message || "Désolé, je rencontre une petite difficulté technique.";
      
      if (userFriendlyMessage.includes('Failed to fetch')) {
        userFriendlyMessage = "Erreur de connexion : Impossible de joindre le serveur de l'assistant.";
      }
      
      throw new Error(userFriendlyMessage);
    }
  }
}

export const aiService = new AIService();

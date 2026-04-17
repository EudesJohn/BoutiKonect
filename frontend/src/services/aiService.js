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

      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("L'assistant est actuellement en maintenance (Configuration API manquante). Veuillez contacter l'administrateur.");
        }
        const errorData = await response.json().catch(() => ({ error: "Erreur serveur inconnue" }));
        throw new Error(errorData.error || `Erreur serveur (${response.status})`);
      }

      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        return data.response;
      } else {
        // Si on reçoit de l'HTML, c'est probablement une redirection SPA (Vercel rewrite fail)
        const text = await response.text();
        console.error("AI Assistant received non-JSON response:", text.substring(0, 100));
        throw new Error("Erreur de routage : Le serveur a renvoyé une page HTML au lieu d'une réponse IA. Vérifiez la configuration Vercel.");
      }
    } catch (error) {
      console.error("AI Assistant Failure:", error);
      
      let userFriendlyMessage = error.message || "Désolé, je rencontre une petite difficulté technique.";
      
      if (userFriendlyMessage.includes('Failed to fetch')) {
        userFriendlyMessage = "Erreur de connexion : Impossible de joindre le serveur de l'assistant.";
      }
      
      throw new Error(userFriendlyMessage);
    }
  }
}

export const aiService = new AIService();

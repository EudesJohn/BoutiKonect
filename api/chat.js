import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60; // Autoriser jusqu'à 60 secondes d'exécution pour Gemini

// Initialisation du client Supabase pour le cache
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
  console.error('[SECURITY] SUPABASE_SERVICE_ROLE_KEY manquante — cache IA désactivé. Ne jamais utiliser ANON_KEY comme fallback.');
}
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Endpoint Serverless pour l'assistant IA Gemini (Root v2.4 - Caching Enabled)
 */
export default async function handler(request, response) {
  // CORS Headers
  const allowedOrigins = [
    'https://bouti-konect.vercel.app', 
    'https://boutikonect.vercel.app',
    'https://maboutiquebj-85bf3.web.app',
    'http://localhost:5173'
  ];
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
      status: 'BoutiKonect AI API is Active (v2.4)', 
      cache_enabled: !!supabase,
      timestamp: new Date().toISOString()
    });
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = request.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    if (!body) return response.status(400).json({ error: 'Corps de la requête manquant' });

    const { prompt, context = {} } = body;
    response.setHeader('Connection', 'close');
    
    if (!prompt || typeof prompt !== 'string') {
      return response.status(400).json({ error: 'Le message est vide ou invalide' });
    }

    // --- LOGIQUE DE CACHE ---
    const normalizedPrompt = prompt.trim().toLowerCase().replace(/[?.,!]/g, '');
    const queryHash = normalizedPrompt; // Utiliser le texte normalisé comme clé unique simple

    if (supabase) {
      try {
        const { data: cachedData, error: cacheError } = await supabase
          .from('ai_chat_cache')
          .select('response, hit_count')
          .eq('query_hash', queryHash)
          .maybeSingle();

        if (cachedData && !cacheError) {
          console.log(`[AI CACHE] Hit pour: "${queryHash}"`);
          // Incrémenter le compteur de hits en arrière-plan
          supabase.from('ai_chat_cache')
            .update({ hit_count: (cachedData.hit_count || 1) + 1, last_hit_at: new Date().toISOString() })
            .eq('query_hash', queryHash)
            .then();
            
          return response.status(200).json({ response: cachedData.response, cached: true });
        }
      } catch (err) {
        console.warn("[AI CACHE] Erreur lors de la lecture du cache:", err.message);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return response.status(503).json({ error: "L'assistant est en maintenance (Configuration API manquante)." });
    }

    // Sécurisation du contexte
    const safeProducts = Array.isArray(context.products) ? context.products.slice(0, 10).map(p => ({ title: p.title, category: p.category, price: p.price })) : [];
    const safeServices = Array.isArray(context.services) ? context.services.slice(0, 10).map(s => ({ title: s.title, category: s.category, price: s.price })) : [];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const systemInstruction = `
      Tu es l'assistant virtuel EXPERT de BoutiKonect.bj.
      Produits récents : ${JSON.stringify(safeProducts)}
      Services récents : ${JSON.stringify(safeServices)}
      Règles : Inscription gratuite, Booster/Vedette payant, Paiement Mobile Money via FedaPay.
      Style : Chaleureux, emojis, proactif, 100% humain.
    `;

    const fullPrompt = `${systemInstruction}\n\nUtilisateur: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const aiResponse = await result.response;
    const text = aiResponse.text();

    if (!text) throw new Error("Réponse vide de l'IA");

    // --- ENREGISTREMENT DANS LE CACHE ---
    if (supabase && text && !text.startsWith('[DIAGNOSTIC]')) {
      supabase.from('ai_chat_cache').insert([{
        query_hash: queryHash,
        question: prompt,
        response: text
      }]).then(({ error }) => {
        if (error) console.warn("[AI CACHE] Erreur lors de l'enregistrement:", error.message);
        else console.log("[AI CACHE] Nouvelle réponse mémorisée.");
      });
    }

    return response.status(200).json({ response: text, cached: false });

  } catch (error) {
    // Log the full error details for debugging in Vercel logs
    console.error("[AI CRITICAL ERROR] Type:", error.constructor?.name);
    console.error("[AI CRITICAL ERROR] Message:", error.message);
    console.error("[AI CRITICAL ERROR] Status:", error.status || error.statusCode || 'N/A');
    console.error("[AI CRITICAL ERROR] Stack:", error.stack);

    // Expose specific error info to help diagnose production issues
    let clientMessage = "Erreur technique, veuillez réessayer plus tard.";
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
      clientMessage = "Clé API Gemini invalide ou expirée. Vérifiez GEMINI_API_KEY dans les variables Vercel.";
    } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
      clientMessage = "Quota API Gemini épuisé. Veuillez patienter ou vérifier votre plan Google AI.";
    } else if (error.message?.includes('PERMISSION_DENIED') || error.status === 403) {
      clientMessage = "Accès refusé à l'API Gemini. Vérifiez les permissions de votre clé API.";
    } else if (error.message?.includes('not found') || error.message?.includes('404')) {
      clientMessage = "Modèle IA introuvable. Le modèle gemini-2.0-flash-lite est peut-être indisponible dans votre région.";
    }

    return response.status(500).json({
      error: clientMessage,
      debug: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}

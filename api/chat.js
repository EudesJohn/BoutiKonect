import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60; // Autoriser jusqu'à 60 secondes d'exécution pour l'IA

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

    // Récupération de la clé API (OpenRouter ou Gemini legacy)
    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      return response.status(503).json({ error: "L'assistant est en maintenance (Configuration API manquante)." });
    }

    // Support de la rotation de clés (séparées par des virgules)
    const apiKeys = rawApiKey.split(',').map(k => k.trim()).filter(Boolean);
    if (apiKeys.length === 0) {
      return response.status(503).json({ error: "L'assistant est en maintenance (Configuration API manquante)." });
    }

    // Sécurisation du contexte
    const safeProducts = Array.isArray(context.products) ? context.products.slice(0, 10).map(p => ({ title: p.title, category: p.category, price: p.price })) : [];
    const safeServices = Array.isArray(context.services) ? context.services.slice(0, 10).map(s => ({ title: s.title, category: s.category, price: s.price })) : [];

    const systemContent = `
      Tu es l'assistant virtuel EXPERT de BoutiKonect.bj.
      Produits récents : ${JSON.stringify(safeProducts)}
      Services récents : ${JSON.stringify(safeServices)}
      Règles : Inscription gratuite, Booster/Vedette payant, Paiement Mobile Money via FedaPay.
      Style : Chaleureux, emojis, proactif, 100% humain.
    `;

    // Détection automatique du type de clé (OpenRouter vs Google Gemini direct)
    const isOpenRouterKey = (key) => key.startsWith('sk-or-v1-') || key.startsWith('sk-or-');
    const isGeminiKey = (key) => key.startsWith('AIzaSy') || key.startsWith('AQ.');

    let text = null;
    let lastError = null;

    // Essayer chaque clé en rotation
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      try {
        const keyPrefix = apiKey.substring(0, Math.min(12, apiKey.length));
        console.log(`[AI] Tentative de génération avec clé ${i} (${keyPrefix}...)`);

        if (isOpenRouterKey(apiKey)) {
          // --- OpenRouter API ---
          const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://bouti-konect.vercel.app',
              'X-Title': 'BoutiKonect'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: prompt }
              ],
              max_tokens: 1024
            })
          });

          if (!orResponse.ok) {
            const orError = await orResponse.text();
            throw new Error(`OpenRouter ${orResponse.status}: ${orError}`);
          }

          const orData = await orResponse.json();
          text = orData.choices?.[0]?.message?.content || null;
          if (text) {
            console.log(`[AI] Succès OpenRouter avec clé ${i}.`);
            break;
          }
        } else {
          // --- Gemini API directe (fallback pour clés AIzaSy / AQ.) ---
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
          const result = await model.generateContent(`${systemContent}\n\nUtilisateur: ${prompt}`);
          const aiResponse = await result.response;
          text = aiResponse.text();
          if (text) {
            console.log(`[AI] Succès Gemini direct avec clé ${i}.`);
            break;
          }
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AI Warning] Échec clé ${i} :`, err.message);
        if (apiKeys.length === 1) break;
      }
    }

    if (!text) {
      if (lastError) {
        throw lastError;
      }
      throw new Error("Réponse vide de l'IA");
    }

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
    if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
      clientMessage = "Clé API invalide ou expirée. Vérifiez la variable GEMINI_API_KEY dans les paramètres Vercel.";
    } else if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      clientMessage = "Limite de l'API IA atteinte pour aujourd'hui. Veuillez patienter ou ajouter plusieurs clés API séparées par des virgules dans GEMINI_API_KEY.";
    } else if (error.message?.includes('402') || error.message?.includes('insufficient_credits')) {
      clientMessage = "Crédits IA insuffisants. Veuillez ajouter des fonds sur votre compte OpenRouter ou ajouter une clé API alternative.";
    } else if (error.message?.includes('not found') || error.message?.includes('404')) {
      clientMessage = "Modèle IA introuvable. Vérifiez la configuration du modèle.";
    }

    return response.status(500).json({
      error: clientMessage,
      debug: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}

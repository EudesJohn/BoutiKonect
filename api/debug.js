export default async function handler(request, response) {
  try {
    const hasKey = !!process.env.GEMINI_API_KEY;
    const keyPrefix = hasKey ? process.env.GEMINI_API_KEY.substring(0, 5) + "..." : "MISSING";
    
    // Test import dynamic
    let aiModuleLoaded = false;
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      aiModuleLoaded = !!GoogleGenerativeAI;
    } catch (e) {
      aiModuleLoaded = "Error: " + e.message;
    }

    return response.status(200).json({
      status: 'debug_info',
      env: {
        GEMINI_API_KEY_PRESENT: hasKey,
        GEMINI_API_KEY_PREFIX: keyPrefix,
        NODE_VERSION: process.version,
        VERCEL_REGION: process.env.VERCEL_REGION || 'local'
      },
      dependencies: {
        google_generative_ai_loaded: aiModuleLoaded
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}

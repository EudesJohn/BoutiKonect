const { withLogging } = require('../utils/withLogging');

export default async function handler(request, response) {
  // ⛔ DÉSACTIVÉ EN PRODUCTION — Ce endpoint expose des informations système sensibles
  // Il ne doit être accessible qu'en développement local
  if (process.env.NODE_ENV !== 'development' && process.env.VERCEL_ENV !== 'development') {
    return response.status(404).json({ error: 'Not found' });
  }

  return withLogging(async (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    // En développement, on peut afficher le statut des clés (sans les valeurs)
    return res.status(200).json({
      status: 'debug_info (dev only)',
      env: {
        GEMINI_API_KEY_PRESENT: hasKey,
        NODE_VERSION: process.version,
        VERCEL_REGION: process.env.VERCEL_REGION || 'local'
      },
      timestamp: new Date().toISOString()
    });
  })(request, response);
}


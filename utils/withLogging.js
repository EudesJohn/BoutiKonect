/**
 * Higher‑order wrapper for request handlers.
 * Logs basic request metadata and catches unexpected errors.
 * Sensitive fields (e.g., passwords, tokens) are omitted from logs.
 */
export const withLogging = (handler) => {
    return async (req, res) => {
      try {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const method = req.method;
        const path = req.url;
        console.log(`[REQ] ${method} ${path} - IP: ${ip}`);
        // Execute the original handler
        return await handler(req, res);
      } catch (err) {
        console.error('[HANDLER ERROR]', err);
        // Generic error response without leaking details
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur interne du serveur' });
        }
      }
    };
  },
};
const { rateLimiter } = require('../utils/rateLimit');
const { withLogging } = require('../utils/withLogging');

export default async function handler(request, response) {
  return withLogging(async (req, res) => {
    // Rate limit for health endpoint
    if (!rateLimiter(req, res)) return; // response handled inside
    // Existing logic (none needed)
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  })(request, response);
  return response.status(200).json({
    status: 'BoutiKonect API is Healthy (Root v2.0)',
    timestamp: new Date().toISOString()
  });
}

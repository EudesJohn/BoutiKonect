/**
 * Simple rate limiting helper.
 * Uses an in‑memory store for local development.
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
 * it will use Upstash Redis (via fetch) for a distributed store.
 */

const inMemoryStore = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export async function rateLimiter(req, res) {
  const limit = 5; // requests per minute
  const windowMs = 60 * 1000;
  const ip = getClientIp(req);

  // If Upstash env vars are present, use Redis via HTTP API
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    const key = `rate:${ip}`;
    const now = Date.now();
    // Increment counter atomically with expiry (using Lua script via REST is complex, so simple GET/INCR/EXPIRE sequence)
    const incResp = await fetch(`${redisUrl}?key=${key}&increment=1`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    // If key did not exist, set expiry
    const count = await incResp.text();
    if (parseInt(count, 10) === 1) {
      await fetch(`${redisUrl}?key=${key}&expire=${Math.ceil(windowMs / 1000)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redisToken}` },
      });
    }
    if (parseInt(count, 10) > limit) {
      res.status(429).json({ error: 'Too many requests' });
      return false;
    }
    return true;
  }

  // In‑memory fallback
  const now = Date.now();
  const record = inMemoryStore.get(ip) || { count: 0, reset: now + windowMs };
  if (now > record.reset) {
    record.count = 0;
    record.reset = now + windowMs;
  }
  record.count += 1;
  inMemoryStore.set(ip, record);
  if (record.count > limit) {
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }
  return true;
}


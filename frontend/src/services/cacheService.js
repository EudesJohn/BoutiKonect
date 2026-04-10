
/**
 * Service de cache avec TTL (Time To Live) et éviction LRU pour le frontend
 */
const CACHE_PREFIX = 'BK_cache_'; // Format: BK_cache_EXPIRY_KEYNAME

/**
 * Eviction LRU : supprime l'entrée la plus proche de l'expiration sans parser JSON.
 */
const evictOldestEntry = () => {
  const cacheKeys = Object.keys(localStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .sort((a, b) => {
      // Extraire l'expiration du nom de la clé (ex: BK_cache_1710000_myKey)
      const expA = parseInt(a.split('_')[2]) || 0;
      const expB = parseInt(b.split('_')[2]) || 0;
      return expA - expB;
    });

  if (cacheKeys.length > 0) {
    const oldestKey = cacheKeys[0];
    localStorage.removeItem(oldestKey);
    console.warn(`Cache LRU: evicted ${oldestKey}`);
    return true;
  }
  return false;
}

export const cacheService = {
  set: (key, data, ttlHours = 24) => {
    const expires = Date.now() + ttlHours * 60 * 60 * 1000;
    const cacheKey = `${CACHE_PREFIX}${expires}_${key}`;
    const stringified = JSON.stringify({ data });

    // Nettoyer les anciennes versions de cette même clé sémantique
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(CACHE_PREFIX) && k.endsWith(`_${key}`)) {
        localStorage.removeItem(k);
      }
    });

    let success = false;
    let attempts = 0;
    while (!success && attempts < 5) {
      try {
        localStorage.setItem(cacheKey, stringified);
        success = true;
      } catch (e) {
        evictOldestEntry();
        attempts++;
      }
    }
  },

  get: (key) => {
    const fullKey = Object.keys(localStorage).find(k => k.startsWith(CACHE_PREFIX) && k.endsWith(`_${key}`));
    if (!fullKey) return null;

    try {
      const expires = parseInt(fullKey.split('_')[2]);
      if (Date.now() > expires) {
        localStorage.removeItem(fullKey);
        return null;
      }
      const { data } = JSON.parse(localStorage.getItem(fullKey));
      return data;
    } catch (e) {
      return null;
    }
  },

  remove: (key) => {
    const fullKey = Object.keys(localStorage).find(k => k.startsWith(CACHE_PREFIX) && k.endsWith(`_${key}`));
    if (fullKey) localStorage.removeItem(fullKey);
  },

  clearAll: () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    });
  }
};

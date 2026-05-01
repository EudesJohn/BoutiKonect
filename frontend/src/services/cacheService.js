/**
 * Service de cache utilisant sessionStorage.
 * Les données sont conservées tant que l'onglet/navigateur est ouvert.
 * Tout est effacé automatiquement à la fermeture du navigateur.
 */
const CACHE_PREFIX = 'BK_session_';

export const cacheService = {
  set: (key, data, ttlHours = 24) => {
    const expires = Date.now() + ttlHours * 60 * 60 * 1000;
    const cacheKey = `${CACHE_PREFIX}${key}`;
    
    // Supprimer l'ancienne version de la même clé
    sessionStorage.removeItem(cacheKey);

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ data, expires }));
    } catch (e) {
      // sessionStorage plein : vider les vieux caches et réessayer
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
      });
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, expires }));
      } catch {
        console.warn('Cache session plein, impossible de stocker:', key);
      }
    }
  },

  get: (key) => {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const { data, expires } = JSON.parse(raw);
      if (Date.now() > expires) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  remove: (key) => {
    sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
  },

  clearAll: () => {
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
    });
  }
};

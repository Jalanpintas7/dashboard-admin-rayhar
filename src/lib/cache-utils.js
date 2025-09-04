// Cache utility functions untuk optimasi performa
// File: src/lib/cache-utils.js

// Konfigurasi cache
const CACHE_PREFIX = 'rayhar_cache_';
const DEFAULT_EXPIRY = 10 * 60 * 1000; // 10 menit default
const SESSION_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 jam untuk session cache

/**
 * Generate cache key yang unik
 * @param {string} prefix - Prefix untuk cache key
 * @param {string} identifier - Identifier unik (biasanya nama fungsi + parameter)
 * @returns {string} Cache key yang unik
 */
export function generateCacheKey(prefix, identifier) {
  return `${CACHE_PREFIX}${prefix}_${identifier}`;
}

/**
 * Save data ke local storage dengan expiry time
 * @param {string} key - Cache key
 * @param {any} data - Data yang akan di-cache
 * @param {number} expiryMs - Expiry time dalam milliseconds
 */
export function saveToLocalStorage(key, data, expiryMs = DEFAULT_EXPIRY) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      expiry: expiryMs
    };
    
    localStorage.setItem(key, JSON.stringify(cacheData));
    console.log(`✅ Data cached successfully: ${key}`);
    
    // Log cache info untuk debugging
    const dataSize = JSON.stringify(data).length;
    console.log(`📊 Cache info: ${key} - Size: ${(dataSize / 1024).toFixed(2)}KB, Expiry: ${expiryMs / 1000}s`);
    
  } catch (error) {
    console.error(`❌ Error saving to cache: ${key}`, error);
    // Jika local storage penuh, clear old cache
    clearExpiredCache();
  }
}

/**
 * Save data ke session storage (dengan opsi expiry khusus)
 * @param {string} key - Cache key
 * @param {any} data - Data yang akan di-cache
 * @param {number} [expiryMs=SESSION_CACHE_EXPIRY] - Expiry time dalam milliseconds untuk session cache
 */
export function saveToSessionStorage(key, data, expiryMs = SESSION_CACHE_EXPIRY) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      pageLoadId: getCurrentPageLoadId(),
      expiry: expiryMs
    };
    
    sessionStorage.setItem(key, JSON.stringify(cacheData));
    console.log(`✅ Data cached in session: ${key}`);
    
    // Log cache info untuk debugging
    const dataSize = JSON.stringify(data).length;
    console.log(`📊 Session cache info: ${key} - Size: ${(dataSize / 1024).toFixed(2)}KB, Expiry: ${(expiryMs / 1000).toFixed(0)}s`);
    
  } catch (error) {
    console.error(`❌ Error saving to session cache: ${key}`, error);
  }
}

/**
 * Get data dari session storage
 * @param {string} key - Cache key
 * @returns {any|null} Data dari cache atau null jika tidak ditemukan
 */
export function getFromSessionStorage(key) {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) {
      return null;
    }
    
    const cacheData = JSON.parse(cached);
    
    // Check if session is still valid (persisted across reload via sessionStorage)
    if (cacheData.sessionId !== getSessionId()) {
      console.log(`⏰ Session changed: ${key}`);
      sessionStorage.removeItem(key);
      return null;
    }

    // Enforce TTL for session cache
    const now = Date.now();
    const expiryMs = cacheData.expiry || SESSION_CACHE_EXPIRY;
    if (now - cacheData.timestamp > expiryMs) {
      console.log(`⏰ Session cache expired: ${key}`);
      sessionStorage.removeItem(key);
      return null;
    }
    
    // Cache masih valid
    console.log(`✅ Session cache hit: ${key}`);
    return cacheData.data;
    
  } catch (error) {
    console.error(`❌ Error reading from session cache: ${key}`, error);
    sessionStorage.removeItem(key); // Remove corrupted cache
    return null;
  }
}

/**
 * Generate unique session ID
 * @returns {string} Session ID
 */
function getSessionId() {
  try {
    // Persist session id per-tab di sessionStorage agar konsisten melewati reload
    if (window.__RAYHAR_SESSION_ID__) {
      return window.__RAYHAR_SESSION_ID__;
    }
    const KEY = '__RAYHAR_SESSION_ID__';
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      sessionStorage.setItem(KEY, id);
    }
    window.__RAYHAR_SESSION_ID__ = id;
    return id;
  } catch (e) {
    // Fallback jika sessionStorage tidak tersedia
    if (!window.__RAYHAR_SESSION_ID__) {
      window.__RAYHAR_SESSION_ID__ = Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    return window.__RAYHAR_SESSION_ID__;
  }
}

/**
 * Generate unique page load ID (berubah setiap page refresh)
 * @returns {string} Page load ID
 */
function getCurrentPageLoadId() {
  if (!window.__RAYHAR_PAGE_LOAD_ID__) {
    window.__RAYHAR_PAGE_LOAD_ID__ = Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  return window.__RAYHAR_PAGE_LOAD_ID__;
}

/**
 * Get data dari local storage cache
 * @param {string} key - Cache key
 * @returns {any|null} Data dari cache atau null jika expired/not found
 */
export function getFromLocalStorage(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }
    
    const cacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - cacheData.timestamp > cacheData.expiry) {
      console.log(`⏰ Cache expired: ${key}`);
      localStorage.removeItem(key);
      return null;
    }
    
    // Cache masih fresh
    const timeLeft = Math.ceil((cacheData.expiry - (now - cacheData.timestamp)) / 1000);
    console.log(`✅ Cache hit: ${key} - Time left: ${timeLeft}s`);
    
    return cacheData.data;
    
  } catch (error) {
    console.error(`❌ Error reading from cache: ${key}`, error);
    localStorage.removeItem(key); // Remove corrupted cache
    return null;
  }
}

/**
 * Remove specific cache entry
 * @param {string} key - Cache key yang akan dihapus
 */
export function removeFromCache(key) {
  try {
    localStorage.removeItem(key);
    console.log(`🗑️ Cache removed: ${key}`);
  } catch (error) {
    console.error(`❌ Error removing cache: ${key}`, error);
  }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache() {
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (Date.now() - cacheData.timestamp > cacheData.expiry) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch (error) {
          // Remove corrupted cache
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
    });
    
    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} expired cache entries`);
    }
    
  } catch (error) {
    console.error('❌ Error clearing expired cache:', error);
  }
}

/**
 * Clear all cache entries (force clear)
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage);
    let clearedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        clearedCount++;
      }
    });

    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} cache entries`);
    }
  } catch (error) {
    console.error('❌ Error clearing all cache:', error);
  }
}

/**
 * Get cache statistics (debug helper)
 */
export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage);
    const stats = [];

    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            stats.push({ key, ageMs: age, ageSec: Math.round(age / 1000), size: (JSON.stringify(cacheData.data).length / 1024).toFixed(2) + 'KB' });
          }
        } catch (error) {
          // ignore corrupted entries here
        }
      }
    });

    return {
      total: stats.length,
      entries: stats
    };
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    return { total: 0, entries: [] };
  }
}

/**
 * Smart cache helper untuk membungkus fetch function dengan local storage cache
 */
export async function smartCache(cacheKey, fetchFunction, expiryMs = DEFAULT_EXPIRY) {
  // Cek di localStorage terlebih dahulu
  const cached = getFromLocalStorage(cacheKey);
  if (cached) {
    return cached;
  }

  // Jika tidak ada di cache, fetch dan simpan
  const data = await fetchFunction();
  saveToLocalStorage(cacheKey, data, expiryMs);
  return data;
}

/**
 * Invalidate cache berdasarkan pattern
 */
export function invalidateCachePattern(pattern) {
  try {
    const keys = Object.keys(localStorage);
    const sessionKeys = Object.keys(sessionStorage);
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
    
    sessionKeys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log(`🧹 Invalidated cache entries with pattern: ${pattern}`);
  } catch (error) {
    console.error('❌ Error invalidating cache:', error);
  }
}

// Auto-clear expired cache secara berkala dan saat visibility change
if (typeof window !== 'undefined') {
  const w = window;

  // Hindari setup ganda
  if (!w.__RAYHAR_CACHE_CLEANER_SETUP__) {
    w.__RAYHAR_CACHE_CLEANER_SETUP__ = true;

    // Interval pembersihan
    if (w.__RAYHAR_CACHE_CLEANER_INTERVAL__) {
      try { clearInterval(w.__RAYHAR_CACHE_CLEANER_INTERVAL__); } catch (_) {}
    }
    const INTERVAL_MS = 5 * 60 * 1000; // 5 menit
    w.__RAYHAR_CACHE_CLEANER_INTERVAL__ = setInterval(() => {
      try { clearExpiredCache(); } catch (_) {}
    }, INTERVAL_MS);

    // Debounce helper
    const debounce = (fn, wait = 800) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    };

    // Event listeners
    const onLoad = () => {
      try { clearExpiredCache(); } catch (_) {}
    };
    const onVisibility = debounce(() => {
      try { clearExpiredCache(); } catch (_) {}
    }, 800);

    w.addEventListener('load', onLoad);
    document.addEventListener('visibilitychange', onVisibility);

    // Expose disposer (opsional)
    w.__RAYHAR_CACHE_CLEANER_DISPOSE__ = () => {
      try { w.removeEventListener('load', onLoad); } catch (_) {}
      try { document.removeEventListener('visibilitychange', onVisibility); } catch (_) {}
      try { clearInterval(w.__RAYHAR_CACHE_CLEANER_INTERVAL__); } catch (_) {}
    };
  }
}

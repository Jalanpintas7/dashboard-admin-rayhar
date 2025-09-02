// Cache utility functions untuk optimasi performa
// File: src/lib/cache-utils.js

// Konfigurasi cache
const CACHE_PREFIX = 'rayhar_cache_';
const DEFAULT_EXPIRY = 10 * 60 * 1000; // 10 menit default

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
    
    console.log(`🧹 Cleared all ${clearedCount} cache entries`);
    
  } catch (error) {
    console.error('❌ Error clearing all cache:', error);
  }
}

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    let expiredCount = 0;
    let validCount = 0;
    
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheData = JSON.parse(cached);
          totalSize += JSON.stringify(cacheData.data).length;
          
          if (Date.now() - cacheData.timestamp > cacheData.expiry) {
            expiredCount++;
          } else {
            validCount++;
          }
        }
      } catch (error) {
        expiredCount++;
      }
    });
    
    return {
      totalEntries: cacheKeys.length,
      validEntries: validCount,
      expiredEntries: expiredCount,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      cachePrefix: CACHE_PREFIX
    };
    
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    return null;
  }
}

/**
 * Smart cache function wrapper
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFunction - Function untuk fetch data jika cache miss
 * @param {number} expiryMs - Expiry time dalam milliseconds
 * @returns {Promise<any>} Data dari cache atau hasil fetch function
 */
export async function smartCache(cacheKey, fetchFunction, expiryMs = DEFAULT_EXPIRY) {
  // Check cache first
  const cachedData = getFromLocalStorage(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Cache miss, fetch data
  console.log(`🔄 Cache miss: ${cacheKey}, fetching data...`);
  const data = await fetchFunction();
  
  // Save to cache
  saveToLocalStorage(cacheKey, data, expiryMs);
  
  return data;
}

/**
 * Invalidate cache berdasarkan pattern
 * @param {string} pattern - Pattern untuk invalidate cache (e.g., 'customers', 'umrah')
 */
export function invalidateCachePattern(pattern) {
  try {
    const keys = Object.keys(localStorage);
    let invalidatedCount = 0;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        localStorage.removeItem(key);
        invalidatedCount++;
      }
    });
    
    if (invalidatedCount > 0) {
      console.log(`🔄 Invalidated ${invalidatedCount} cache entries for pattern: ${pattern}`);
    }
    
  } catch (error) {
    console.error(`❌ Error invalidating cache pattern: ${pattern}`, error);
  }
}

// Auto-cleanup expired cache setiap 5 menit
if (typeof window !== 'undefined') {
  setInterval(clearExpiredCache, 5 * 60 * 1000);
  
  // Clear expired cache saat page load
  window.addEventListener('load', clearExpiredCache);
  
  // Clear expired cache saat page visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      clearExpiredCache();
    }
  });
}

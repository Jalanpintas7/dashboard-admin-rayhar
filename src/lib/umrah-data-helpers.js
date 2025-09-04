import { 
  generateCacheKey, 
  saveToSessionStorage, 
  getFromSessionStorage, 
  invalidateCachePattern 
} from './cache-utils.js';
import { getUmrahSeasons, getUmrahCategories, getAirlines } from './supabase-helpers.js';
import { supabase } from './supabase.js';

// ==================== UMRAH DATA CACHE HELPERS ====================

/**
 * Fetch umrah seasons with cache system
 */
export async function fetchUmrahSeasons() {
  const cacheKey = generateCacheKey('umrah', 'seasons');
  
  // Try to get from cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log(`✅ Umrah seasons loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log('🔄 Fetching umrah seasons from database...');
  
  try {
    const seasons = await getUmrahSeasons();
    
    if (seasons && seasons.length > 0) {
      saveToSessionStorage(cacheKey, seasons);
      console.log(`✅ Umrah seasons cached in session (${seasons.length} items)`);
    } else {
      console.log('⚠️ No umrah seasons found, not caching empty result');
    }
    
    return seasons || [];
  } catch (error) {
    console.error('Error fetching umrah seasons:', error);
    return [];
  }
}

/**
 * Fetch umrah categories with cache system
 */
export async function fetchUmrahCategories() {
  const cacheKey = generateCacheKey('umrah', 'categories');
  
  // Try to get from cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log(`✅ Umrah categories loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log('🔄 Fetching umrah categories from database...');
  
  try {
    const categories = await getUmrahCategories();
    
    if (categories && categories.length > 0) {
      saveToSessionStorage(cacheKey, categories);
      console.log(`✅ Umrah categories cached in session (${categories.length} items)`);
    } else {
      console.log('⚠️ No umrah categories found, not caching empty result');
    }
    
    return categories || [];
  } catch (error) {
    console.error('Error fetching umrah categories:', error);
    return [];
  }
}

/**
 * Fetch airlines with cache system
 */
export async function fetchAirlines() {
  const cacheKey = generateCacheKey('umrah', 'airlines');
  
  // Try to get from cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log(`✅ Airlines loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log('🔄 Fetching airlines from database...');
  
  try {
    const airlines = await getAirlines();
    
    if (airlines && airlines.length > 0) {
      saveToSessionStorage(cacheKey, airlines);
      console.log(`✅ Airlines cached in session (${airlines.length} items)`);
    } else {
      console.log('⚠️ No airlines found, not caching empty result');
    }
    
    return airlines || [];
  } catch (error) {
    console.error('Error fetching airlines:', error);
    return [];
  }
}

/**
 * Fetch all umrah data (seasons, categories, airlines) with cache system
 */
export async function fetchAllUmrahData() {
  console.log('🔄 Loading all umrah data with cache system...');
  
  try {
    // Load all data in parallel
    const [seasons, categories, airlines] = await Promise.all([
      fetchUmrahSeasons(),
      fetchUmrahCategories(),
      fetchAirlines()
    ]);
    
    console.log(`✅ All umrah data loaded: ${seasons.length} seasons, ${categories.length} categories, ${airlines.length} airlines`);
    
    return {
      seasons,
      categories,
      airlines
    };
  } catch (error) {
    console.error('Error loading all umrah data:', error);
    return {
      seasons: [],
      categories: [],
      airlines: []
    };
  }
}

/**
 * Clear umrah data cache
 */
export function clearUmrahCache() {
  console.log('🧹 Clearing umrah data cache...');
  invalidateCachePattern('umrah');
}

/**
 * Force refresh umrah data (clear cache and reload)
 */
export async function refreshUmrahData() {
  console.log('🔄 Force refreshing umrah data...');
  clearUmrahCache();
  return await fetchAllUmrahData();
}

// ==================== DESTINATION DATA CACHE HELPERS ====================

/**
 * Fetch destinations with cache system
 */
export async function fetchDestinations() {
  const cacheKey = generateCacheKey('destination', 'list');
  
  // Try to get from cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log(`✅ Destinations loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log('🔄 Fetching destinations from database...');
  
  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('id, name, created_at')
      .order('name');
    
    if (error) throw error;
    
    const destinations = data || [];
    
    if (destinations.length > 0) {
      saveToSessionStorage(cacheKey, destinations);
      console.log(`✅ Destinations cached in session (${destinations.length} items)`);
    } else {
      console.log('⚠️ No destinations found, not caching empty result');
    }
    
    return destinations;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
}

/**
 * Clear destination cache
 */
export function clearDestinationCache() {
  console.log('🧹 Clearing destination cache...');
  invalidateCachePattern('destination');
}

/**
 * Force refresh destinations (clear cache and reload)
 */
export async function refreshDestinations() {
  console.log('🔄 Force refreshing destinations...');
  clearDestinationCache();
  return await fetchDestinations();
}

// ==================== AIRLINE DATA CACHE HELPERS ====================

/**
 * Fetch airlines with cache system (for airline management page)
 */
export async function fetchAirlinesForManagement() {
  const cacheKey = generateCacheKey('airline', 'management');
  
  // Try to get from cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log(`✅ Airlines (management) loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log('🔄 Fetching airlines (management) from database...');
  
  try {
    const { data, error } = await supabase
      .from('airlines')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    const airlines = data || [];
    
    if (airlines.length > 0) {
      saveToSessionStorage(cacheKey, airlines);
      console.log(`✅ Airlines (management) cached in session (${airlines.length} items)`);
    } else {
      console.log('⚠️ No airlines found, not caching empty result');
    }
    
    return airlines;
  } catch (error) {
    console.error('Error fetching airlines (management):', error);
    return [];
  }
}

/**
 * Clear airline cache
 */
export function clearAirlineCache() {
  console.log('🧹 Clearing airline cache...');
  invalidateCachePattern('airline');
}

/**
 * Force refresh airlines (clear cache and reload)
 */
export async function refreshAirlines() {
  console.log('🔄 Force refreshing airlines...');
  clearAirlineCache();
  return await fetchAirlinesForManagement();
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format currency to Malaysian Ringgit format
 */
export function formatCurrency(amount) {
  if (!amount) return 'RM 0.00';

  // Format Malaysia: titik untuk ribuan, koma untuk desimal dengan 2 digit desimal
  return 'RM ' + new Intl.NumberFormat('ms-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date to Malaysian format
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  
  const monthNames = [
    'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
  ];
  
  return `${day} ${monthNames[month]} ${year}`;
}

// ==================== MISSING EXPORTS FOR COMPATIBILITY ====================

/**
 * Alias for clearDestinationCache (for backward compatibility)
 */
export const clearDestinasiCache = clearDestinationCache;

/**
 * Fetch outbound packages with cache system
 */
export async function fetchOutboundPackages() {
  const cacheKey = generateCacheKey('outbound', 'packages');
  
  // Try to get from cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log(`✅ Outbound packages loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log('🔄 Fetching outbound packages from database...');
  
  try {
    const { data, error } = await supabase
      .from('outbound_dates')
      .select(`
        *,
        destinations (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const packages = data || [];
    
    if (packages.length > 0) {
      saveToSessionStorage(cacheKey, packages);
      console.log(`✅ Outbound packages cached in session (${packages.length} items)`);
    } else {
      console.log('⚠️ No outbound packages found, not caching empty result');
    }
    
    return packages;
  } catch (error) {
    console.error('Error fetching outbound packages:', error);
    return [];
  }
}

/**
 * Fetch umrah packages with cache system
 */
export async function fetchUmrahPackages() {
  const cacheKey = generateCacheKey('umrah', 'packages');
  
  // Try to get from cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log(`✅ Umrah packages loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log('🔄 Fetching umrah packages from database...');
  
  try {
    const { data, error } = await supabase
      .from('umrah_dates')
      .select(`
        *,
        umrah_seasons (
          id,
          name
        ),
        umrah_categories (
          id,
          name
        ),
        airlines (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const packages = data || [];
    
    if (packages.length > 0) {
      saveToSessionStorage(cacheKey, packages);
      console.log(`✅ Umrah packages cached in session (${packages.length} items)`);
    } else {
      console.log('⚠️ No umrah packages found, not caching empty result');
    }
    
    return packages;
  } catch (error) {
    console.error('Error fetching umrah packages:', error);
    return [];
  }
}
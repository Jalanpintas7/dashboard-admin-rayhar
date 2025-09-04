import { supabase } from './supabase.js';
import { 
  generateCacheKey, 
  saveToSessionStorage, 
  getFromSessionStorage, 
  invalidateCachePattern 
} from './cache-utils.js';

// Fungsi untuk mengambil data musim umrah dengan session cache (tidak expired selama tab terbuka)
export async function fetchUmrahSeasons() {
  const cacheKey = generateCacheKey('umrah_seasons', 'all');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Umrah seasons loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching umrah seasons from database...');
  
  try {
    const { data, error } = await supabase
      .from('umrah_seasons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching umrah seasons:', error);
      return [];
    }

    const result = data || [];
    
    // Save to session cache hanya jika ada data
    if (result.length > 0) {
      saveToSessionStorage(cacheKey, result);
      console.log(`✅ Umrah seasons cached in session (${result.length} items)`);
    } else {
      console.log('⚠️ No umrah seasons found, not caching empty result');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching umrah seasons:', error);
    return [];
  }
}

// Fungsi untuk mengambil data kategori umrah dengan cache
export async function fetchUmrahCategories() {
  const cacheKey = generateCacheKey('umrah_categories', 'all');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Umrah categories loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching umrah categories from database...');
  
  try {
    const { data, error } = await supabase
      .from('umrah_categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching umrah categories:', error);
      return [];
    }

    const result = data || [];
    
    // Save to session cache hanya jika ada data
    if (result.length > 0) {
      saveToSessionStorage(cacheKey, result);
      console.log(`✅ Umrah categories cached in session (${result.length} items)`);
    } else {
      console.log('⚠️ No umrah categories found, not caching empty result');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching umrah categories:', error);
    return [];
  }
}

// Fungsi untuk mengambil data pakej umrah (umrah_dates) dengan cache
export async function fetchUmrahPackages() {
  const cacheKey = generateCacheKey('umrah_packages', 'all');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Umrah packages loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching umrah packages from database...');
  
  try {
    const { data, error } = await supabase
      .from('umrah_dates')
      .select(`
        *,
        umrah_seasons(name),
        umrah_categories(name),
        airlines(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching umrah packages:', error);
      return [];
    }

    const result = data || [];
    
    // Save to session cache hanya jika ada data
    if (result.length > 0) {
      saveToSessionStorage(cacheKey, result);
      console.log(`✅ Umrah packages cached in session (${result.length} items)`);
    } else {
      console.log('⚠️ No umrah packages found, not caching empty result');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching umrah packages:', error);
    return [];
  }
}

// Fungsi untuk menghitung jumlah pakej per musim dengan cache
export async function getPackageCountBySeason() {
  const cacheKey = generateCacheKey('umrah_package_counts', 'by_season');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Package counts by season loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching package counts by season from database...');
  
  try {
    const { data, error } = await supabase
      .from('umrah_dates')
      .select('umrah_season_id');

    if (error) {
      console.error('Error counting packages by season:', error);
      return {};
    }

    const countMap = {};
    data.forEach(item => {
      if (item.umrah_season_id) {
        countMap[item.umrah_season_id] = (countMap[item.umrah_season_id] || 0) + 1;
      }
    });

    // Save to session cache
    saveToSessionStorage(cacheKey, countMap);
    console.log('✅ Package counts by season cached in session');
    
    return countMap;
  } catch (error) {
    console.error('Error counting packages by season:', error);
    return {};
  }
}

// Fungsi untuk menghitung jumlah pakej per kategori dengan cache
export async function getPackageCountByCategory() {
  const cacheKey = generateCacheKey('umrah_package_counts', 'by_category');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && typeof cachedData === 'object' && Object.keys(cachedData).length > 0) {
    console.log('✅ Package counts by category loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching package counts by category from database...');
  
  try {
    const { data, error } = await supabase
      .from('umrah_dates')
      .select('umrah_category_id');

    if (error) {
      console.error('Error counting packages by category:', error);
      return {};
    }

    const countMap = {};
    data.forEach(item => {
      if (item.umrah_category_id) {
        countMap[item.umrah_category_id] = (countMap[item.umrah_category_id] || 0) + 1;
      }
    });

    // Save to session cache
    saveToSessionStorage(cacheKey, countMap);
    console.log('✅ Package counts by category cached in session');
    
    return countMap;
  } catch (error) {
    console.error('Error counting packages by category:', error);
    return {};
  }
}

// Fungsi untuk invalidate cache umrah data
export function invalidateUmrahCache() {
  console.log('🔄 Invalidating umrah data cache...');
  invalidateCachePattern('umrah');
}

// Fungsi untuk clear semua cache umrah
export function clearUmrahCache() {
  console.log('🧹 Clearing all umrah data cache...');
  invalidateCachePattern('umrah');
  invalidateCachePattern('umrah_seasons');
  invalidateCachePattern('umrah_categories');
  invalidateCachePattern('umrah_packages');
  invalidateCachePattern('umrah_package_counts');
}

// ===== DESTINASI DATA CACHING =====

// Cache expiry untuk data destinasi (20 menit karena data destinasi jarang berubah)
const DESTINASI_CACHE_EXPIRY = 20 * 60 * 1000;

// Fungsi untuk mengambil data destinasi dengan cache
export async function fetchDestinations() {
  const cacheKey = generateCacheKey('destinations', 'all');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Destinations loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching destinations from database...');
  
  try {
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching destinations:', error);
      return [];
    }

    const result = data || [];
    
    // Save to session cache
    saveToSessionStorage(cacheKey, result);
    console.log(`✅ Destinations cached in session (${result.length} items)`);
    
    return result;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
}

// Fungsi untuk mengambil data outbound packages dengan cache
export async function fetchOutboundPackages() {
  const cacheKey = generateCacheKey('outbound_packages', 'all');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Outbound packages loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching outbound packages from database...');
  
  try {
    const { data, error } = await supabase
      .from('outbound_dates')
      .select(`
        *,
        destinations(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching outbound packages:', error);
      return [];
    }

    const result = data || [];
    
    // Save to session cache
    saveToSessionStorage(cacheKey, result);
    console.log(`✅ Outbound packages cached in session (${result.length} items)`);
    
    return result;
  } catch (error) {
    console.error('Error fetching outbound packages:', error);
    return [];
  }
}

// Fungsi untuk clear semua cache destinasi
export function clearDestinasiCache() {
  console.log('🧹 Clearing all destinasi data cache...');
  invalidateCachePattern('destinations');
  invalidateCachePattern('outbound_packages');
}

// Fungsi untuk format currency (format Malaysia)
export function formatCurrency(amount) {
  if (!amount) return 'RM 0.00';

  // Format Malaysia: titik untuk ribuan, koma untuk desimal dengan 2 digit desimal
  return 'RM ' + new Intl.NumberFormat('ms-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Fungsi untuk format tanggal
export function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const monthNames = [
    'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
  ];
  
  return `${day} ${monthNames[month]} ${year}`;
}

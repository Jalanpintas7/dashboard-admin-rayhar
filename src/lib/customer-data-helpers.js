import { supabase } from './supabase.js';
import { 
  generateCacheKey, 
  saveToSessionStorage, 
  getFromSessionStorage, 
  invalidateCachePattern 
} from './cache-utils.js';

// Fungsi untuk mengambil data customer dengan session cache (tidak expired selama tab terbuka)
export async function fetchCustomers() {
  const cacheKey = generateCacheKey('customers', 'all');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Customer data loaded from session cache');
    return cachedData;
  }
  
  // Cache miss atau cache kosong, fetch from database
  console.log('🔄 Fetching customer data from database...');
  
  try {
    const { data, error } = await supabase
      .from('customer_data_view')
      .select(`
        id,
        branch_id,
        consultant_id,
        gelaran,
        nama,
        nokp,
        telefon,
        email,
        alamat,
        poskod,
        negeri,
        bandar,
        bilangan,
        total_price,
        age,
        gender,
        birth_date,
        created_at,
        is_from_inquiry,
        branch_name,
        consultant_name,
        destination_name,
        umrah_season_name,
        umrah_category_name,
        package_type,
        season_destination,
        full_name,
        full_address,
        avatar_initials,
        formatted_date,
        formatted_birth_date,
        from_inquiry_status
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer data:', error);
      return [];
    }

    const result = data || [];
    
    // Save to session cache hanya jika ada data
    if (result.length > 0) {
      saveToSessionStorage(cacheKey, result);
      console.log(`✅ Customer data cached in session (${result.length} items)`);
    } else {
      console.log('⚠️ No customer data found, not caching empty result');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching customer data:', error);
    return [];
  }
}

// Fungsi untuk mengambil data customer dengan anggota tambahan
export async function fetchCustomerWithMembers(customerId) {
  const cacheKey = generateCacheKey('customer_members', customerId);
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData)) {
    console.log('✅ Customer members loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching customer members from database...');
  
  try {
    const { data, error } = await supabase
      .from('members_booking')
      .select(`
        id,
        nama,
        nokp,
        age,
        gender,
        birth_date,
        cwb,
        cnb,
        infant
      `)
      .eq('booking_id', customerId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching customer members:', error);
      return [];
    }

    const result = data || [];
    
    // Save to session cache
    saveToSessionStorage(cacheKey, result);
    console.log(`✅ Customer members cached in session (${result.length} items)`);
    
    return result;
  } catch (error) {
    console.error('Error fetching customer members:', error);
    return [];
  }
}

// Fungsi untuk clear cache customer data
export function clearCustomerCache() {
  console.log('🧹 Clearing customer data cache...');
  invalidateCachePattern('customers');
  invalidateCachePattern('customer_members');
}

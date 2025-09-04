import { supabase } from './supabase.js';
import { 
  generateCacheKey, 
  saveToSessionStorage, 
  getFromSessionStorage, 
  invalidateCachePattern 
} from './cache-utils.js';

// Fungsi untuk mengambil data leads dengan session cache (tidak expired selama tab terbuka)
export async function fetchLeads() {
  const cacheKey = generateCacheKey('leads', 'all');
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('✅ Leads data loaded from session cache');
    return cachedData;
  }
  
  // Cache miss atau cache kosong, fetch from database
  console.log('🔄 Fetching leads data from database...');
  
  try {
    // Try to use the optimized view first, fallback to complex query if view doesn't exist
    let query = supabase
      .from('leads_data_view')
      .select(`
        id,
        title,
        full_name,
        phone,
        created_at,
        updated_at,
        branch_id,
        branch_name,
        branch_whatsapp,
        branch_email,
        branch_state,
        branch_region,
        consultant_id,
        consultant_name,
        consultant_whatsapp,
        consultant_email,
        sales_consultant_number,
        package_type_id,
        package_type,
        destination_id,
        destination_name,
        outbound_date_id,
        outbound_start_date,
        outbound_end_date,
        outbound_cwb,
        outbound_cnb,
        outbound_infant,
        outbound_triple,
        outbound_double,
        outbound_single,
        umrah_season_id,
        umrah_season_name,
        umrah_season_brochure,
        umrah_category_id,
        umrah_category_name,
        umrah_category_brochure,
        interest,
        package_category,
        outbound_date_range,
        formatted_date,
        formatted_updated_date,
        avatar_initials,
        display_name
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads data:', error);
      return [];
    }

    const result = data || [];
    
    // Transform data untuk kompatibilitas dengan komponen yang ada
    const transformedData = result.map(lead => {
      // Tentukan interest berdasarkan data yang tersedia
      let interest = 'N/A';
      if (lead.season_id && lead.umrah_seasons) {
        interest = lead.umrah_seasons.name;
      } else if (lead.category_id && lead.umrah_categories) {
        interest = lead.umrah_categories.name;
      } else if (lead.destination_id && lead.destinations) {
        interest = lead.destinations.name;
      } else if (lead.package_type_id && lead.package_types) {
        interest = lead.package_types.name;
      }

      // Get outbound date info
      let outboundDate = 'N/A';
      if (lead.outbound_date_id && lead.outbound_dates) {
        const outboundDateData = lead.outbound_dates;
        outboundDate = `${outboundDateData.start_date} - ${outboundDateData.end_date}`;
      }

      // Generate avatar initials
      const generateAvatar = (name) => {
        if (!name) return 'NA';
        const words = name.split(' ');
        return words.map(word => word[0]).join('').substring(0, 2).toUpperCase();
      };

      // Format date
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthNames = [
          'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
          'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
        ];
        
        return `${day} ${monthNames[month]} ${year}`;
      };

      return {
        id: lead.id,
        name: lead.full_name || lead.title || 'Nama tidak tersedia',
        email: '-', // Email tidak ada di tabel leads
        phone: lead.phone || '-',
        branch: lead.branches?.name || '-',
        interest: interest,
        date: formatDate(lead.created_at),
        avatar: generateAvatar(lead.full_name || lead.title || 'NA'),
        address: '-', // Address tidak ada di tabel leads
        source: '-',
        budget: '-', // Budget tidak ada di tabel leads
        timeline: '-', // Timeline tidak ada di tabel leads
        consultant: lead.sales_consultant?.name || '-',
        notes: '-', // Notes tidak ada di tabel leads
        
        // Tambahan field untuk detail
        seasonDestination: interest,
        packageType: lead.package_types?.name || '-',
        destination: lead.destinations?.name || '-',
        outboundDate: outboundDate,
        
        // Raw data untuk detail modal
        rawData: {
          title: lead.title,
          full_name: lead.full_name,
          phone: lead.phone,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          branch: lead.branches,
          consultant: lead.sales_consultant,
          package_type: lead.package_types,
          destination: lead.destinations,
          outbound_date: lead.outbound_dates,
          umrah_season: lead.umrah_seasons,
          umrah_category: lead.umrah_categories
        }
      };
    });
    
    // Save to session cache hanya jika ada data
    if (transformedData.length > 0) {
      saveToSessionStorage(cacheKey, transformedData);
      console.log(`✅ Leads data cached in session (${transformedData.length} items)`);
    } else {
      console.log('⚠️ No leads data found, not caching empty result');
    }
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching leads data:', error);
    return [];
  }
}

// Fungsi untuk mengambil data leads dengan pagination
export async function fetchLeadsPaginated(page = 1, limit = 10, filters = {}) {
  const cacheKey = generateCacheKey('leads', `${page}_${limit}_${JSON.stringify(filters)}`);
  
  // Check session cache first
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && cachedData.data && Array.isArray(cachedData.data) && cachedData.data.length > 0) {
    console.log('✅ Leads paginated data loaded from session cache');
    return cachedData;
  }
  
  // Cache miss, fetch from database
  console.log('🔄 Fetching leads paginated data from database...');
  
  try {
    // Hitung offset untuk pagination
    const offset = (page - 1) * limit;
    
    // Query yang efisien dengan join ke semua tabel terkait
    let query = supabase
      .from('leads')
      .select(`
        id,
        title,
        full_name,
        phone,
        created_at,
        updated_at,
        branch_id,
        season_id,
        category_id,
        package_type_id,
        destination_id,
        outbound_date_id,
        sales_consultant_id,
        branches!inner(
          id,
          name,
          whatsapp_number,
          email,
          state,
          region
        ),
        sales_consultant!inner(
          id,
          name,
          whatsapp_number,
          email,
          sales_consultant_number
        ),
        package_types!inner(
          id,
          name
        ),
        destinations!inner(
          id,
          name
        ),
        outbound_dates!inner(
          id,
          start_date,
          end_date,
          cwb,
          cnb,
          infant,
          triple,
          double,
          single
        ),
        umrah_seasons!inner(
          id,
          name,
          brochure
        ),
        umrah_categories!inner(
          id,
          name,
          brochure
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    
    // Apply pagination dan ordering
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads paginated data:', error);
      return {
        data: [],
        totalCount: 0
      };
    }

    const result = data || [];
    
    // Transform data untuk kompatibilitas dengan komponen yang ada
    const transformedData = result.map(lead => {
      // Tentukan interest berdasarkan data yang tersedia
      let interest = 'N/A';
      if (lead.season_id && lead.umrah_seasons) {
        interest = lead.umrah_seasons.name;
      } else if (lead.category_id && lead.umrah_categories) {
        interest = lead.umrah_categories.name;
      } else if (lead.destination_id && lead.destinations) {
        interest = lead.destinations.name;
      } else if (lead.package_type_id && lead.package_types) {
        interest = lead.package_types.name;
      }

      // Get outbound date info
      let outboundDate = 'N/A';
      if (lead.outbound_date_id && lead.outbound_dates) {
        const outboundDateData = lead.outbound_dates;
        outboundDate = `${outboundDateData.start_date} - ${outboundDateData.end_date}`;
      }

      // Generate avatar initials
      const generateAvatar = (name) => {
        if (!name) return 'NA';
        const words = name.split(' ');
        return words.map(word => word[0]).join('').substring(0, 2).toUpperCase();
      };

      // Format date
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthNames = [
          'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
          'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
        ];
        
        return `${day} ${monthNames[month]} ${year}`;
      };

      return {
        id: lead.id,
        name: lead.full_name || lead.title || 'Nama tidak tersedia',
        email: '-', // Email tidak ada di tabel leads
        phone: lead.phone || '-',
        branch: lead.branches?.name || '-',
        interest: interest,
        date: formatDate(lead.created_at),
        avatar: generateAvatar(lead.full_name || lead.title || 'NA'),
        address: '-', // Address tidak ada di tabel leads
        source: '-',
        budget: '-', // Budget tidak ada di tabel leads
        timeline: '-', // Timeline tidak ada di tabel leads
        consultant: lead.sales_consultant?.name || '-',
        notes: '-', // Notes tidak ada di tabel leads
        
        // Tambahan field untuk detail
        seasonDestination: interest,
        packageType: lead.package_types?.name || '-',
        destination: lead.destinations?.name || '-',
        outboundDate: outboundDate,
        
        // Raw data untuk detail modal
        rawData: {
          title: lead.title,
          full_name: lead.full_name,
          phone: lead.phone,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          branch: lead.branches,
          consultant: lead.sales_consultant,
          package_type: lead.package_types,
          destination: lead.destinations,
          outbound_date: lead.outbound_dates,
          umrah_season: lead.umrah_seasons,
          umrah_category: lead.umrah_categories
        }
      };
    });
    
    const resultData = {
      data: transformedData,
      totalCount: count || 0
    };
    
    // Save to session cache
    saveToSessionStorage(cacheKey, resultData);
    console.log(`✅ Leads paginated data cached in session (${transformedData.length} items)`);
    
    return resultData;
  } catch (error) {
    console.error('Error fetching leads paginated data:', error);
    return {
      data: [],
      totalCount: 0
    };
  }
}

// Fungsi untuk clear cache leads data
export function clearLeadsCache() {
  console.log('🧹 Clearing leads data cache...');
  invalidateCachePattern('leads');
}

// Fungsi untuk refresh leads data
export async function refreshLeads() {
  clearLeadsCache();
  return await fetchLeads();
}

// Fungsi untuk refresh leads paginated data
export async function refreshLeadsPaginated(page = 1, limit = 10, filters = {}) {
  const cacheKey = generateCacheKey('leads', `${page}_${limit}_${JSON.stringify(filters)}`);
  invalidateCachePattern(cacheKey);
  return await fetchLeadsPaginated(page, limit, filters);
}

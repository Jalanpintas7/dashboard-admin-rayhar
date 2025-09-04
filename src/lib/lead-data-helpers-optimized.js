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
        branch_id,
        branch_name,
        consultant_id,
        consultant_name,
        package_type_id,
        package_type,
        destination_id,
        destination_name,
        outbound_date_id,
        outbound_start_date,
        outbound_end_date,
        umrah_season_id,
        umrah_season_name,
        umrah_category_id,
        umrah_category_name,
        interest,
        formatted_date,
        avatar_initials,
        display_name,
        outbound_date_range
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads data from view:', error);
      console.log('Falling back to complex query...');
      
      // Fallback to complex query if view doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
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
        `)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('Error fetching leads data:', fallbackError);
        return [];
      }

      // Transform fallback data
      const transformedFallbackData = fallbackData.map(lead => {
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
          email: '-',
          phone: lead.phone || '-',
          branch: lead.branches?.name || '-',
          interest: interest,
          date: formatDate(lead.created_at),
          avatar: generateAvatar(lead.full_name || lead.title || 'NA'),
          address: '-',
          source: '-',
          budget: '-',
          timeline: '-',
          consultant: lead.sales_consultant?.name || '-',
          notes: '-',
          seasonDestination: interest,
          packageType: lead.package_types?.name || '-',
          destination: lead.destinations?.name || '-',
          outboundDate: outboundDate,
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

      // Save to session cache
      if (transformedFallbackData.length > 0) {
        saveToSessionStorage(cacheKey, transformedFallbackData);
        console.log(`✅ Leads fallback data cached in session (${transformedFallbackData.length} items)`);
      }

      return transformedFallbackData;
    }

    const result = data || [];
    
    // Transform data untuk kompatibilitas dengan LeadTable component
    const transformedData = result.map(lead => {
      return {
        id: lead.id,
        name: lead.title && lead.full_name ? `${lead.title} ${lead.full_name}` : lead.display_name || 'Nama tidak tersedia',
        email: '-', // Email tidak ada di tabel leads (sesuai LeadTable)
        phone: lead.phone || '-',
        branch: lead.branch_name || '-',
        interest: lead.interest || '-',
        date: lead.formatted_date || '-',
        avatar: lead.avatar_initials || 'NA',
        address: '-', // Address tidak ada di tabel leads (sesuai LeadTable)
        source: '-',
        budget: '-', // Budget tidak ada di tabel leads (sesuai LeadTable)
        timeline: '-', // Timeline tidak ada di tabel leads (sesuai LeadTable)
        consultant: lead.consultant_name || '-',
        notes: '-', // Notes tidak ada di tabel leads (sesuai LeadTable)
        
        // Tambahan field untuk detail modal (sesuai LeadTable)
        seasonDestination: lead.interest || '-',
        packageType: lead.package_type || '-',
        destination: lead.destination_name || '-',
        outboundDate: lead.outbound_date_range || '-',
        
        // Raw data untuk detail modal
        rawData: {
          title: lead.title,
          full_name: lead.full_name,
          phone: lead.phone,
          created_at: lead.created_at,
          branch: {
            id: lead.branch_id,
            name: lead.branch_name
          },
          consultant: {
            id: lead.consultant_id,
            name: lead.consultant_name
          },
          package_type: {
            id: lead.package_type_id,
            name: lead.package_type
          },
          destination: {
            id: lead.destination_id,
            name: lead.destination_name
          },
          outbound_date: {
            id: lead.outbound_date_id,
            start_date: lead.outbound_start_date,
            end_date: lead.outbound_end_date
          },
          umrah_season: {
            id: lead.umrah_season_id,
            name: lead.umrah_season_name
          },
          umrah_category: {
            id: lead.umrah_category_id,
            name: lead.umrah_category_name
          }
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
    
    // Try to use the optimized view first
    let query = supabase
      .from('leads_data_view')
      .select(`
        id,
        title,
        full_name,
        phone,
        created_at,
        branch_id,
        branch_name,
        consultant_id,
        consultant_name,
        package_type_id,
        package_type,
        destination_id,
        destination_name,
        outbound_date_id,
        outbound_start_date,
        outbound_end_date,
        umrah_season_id,
        umrah_season_name,
        umrah_category_id,
        umrah_category_name,
        interest,
        formatted_date,
        avatar_initials,
        display_name,
        outbound_date_range
      `, { count: 'exact' });
    
    // Apply filters
    if (filters.search) {
      query = query.or(`display_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,branch_name.ilike.%${filters.search}%,interest.ilike.%${filters.search}%`);
    }
    
    // Apply pagination dan ordering
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads paginated data from view:', error);
      console.log('Falling back to complex query...');
      
      // Fallback to complex query
      let fallbackQuery = supabase
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
        fallbackQuery = fallbackQuery.or(`full_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }
      
      // Apply pagination dan ordering
      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('Error fetching leads paginated data:', fallbackError);
        return {
          data: [],
          totalCount: 0
        };
      }

      // Transform fallback data (same logic as above)
      const transformedFallbackData = fallbackData.map(lead => {
        // ... same transformation logic as above
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

        let outboundDate = 'N/A';
        if (lead.outbound_date_id && lead.outbound_dates) {
          const outboundDateData = lead.outbound_dates;
          outboundDate = `${outboundDateData.start_date} - ${outboundDateData.end_date}`;
        }

        const generateAvatar = (name) => {
          if (!name) return 'NA';
          const words = name.split(' ');
          return words.map(word => word[0]).join('').substring(0, 2).toUpperCase();
        };

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
          email: '-',
          phone: lead.phone || '-',
          branch: lead.branches?.name || '-',
          interest: interest,
          date: formatDate(lead.created_at),
          avatar: generateAvatar(lead.full_name || lead.title || 'NA'),
          address: '-',
          source: '-',
          budget: '-',
          timeline: '-',
          consultant: lead.sales_consultant?.name || '-',
          notes: '-',
          seasonDestination: interest,
          packageType: lead.package_types?.name || '-',
          destination: lead.destinations?.name || '-',
          outboundDate: outboundDate,
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
        data: transformedFallbackData,
        totalCount: fallbackCount || 0
      };
      
      // Save to session cache
      saveToSessionStorage(cacheKey, resultData);
      console.log(`✅ Leads fallback paginated data cached in session (${transformedFallbackData.length} items)`);
      
      return resultData;
    }

    const result = data || [];
    
    // Transform data untuk kompatibilitas dengan LeadTable component
    const transformedData = result.map(lead => {
      return {
        id: lead.id,
        name: lead.title && lead.full_name ? `${lead.title} ${lead.full_name}` : lead.display_name || 'Nama tidak tersedia',
        email: '-', // Email tidak ada di tabel leads (sesuai LeadTable)
        phone: lead.phone || '-',
        branch: lead.branch_name || '-',
        interest: lead.interest || '-',
        date: lead.formatted_date || '-',
        avatar: lead.avatar_initials || 'NA',
        address: '-', // Address tidak ada di tabel leads (sesuai LeadTable)
        source: '-',
        budget: '-', // Budget tidak ada di tabel leads (sesuai LeadTable)
        timeline: '-', // Timeline tidak ada di tabel leads (sesuai LeadTable)
        consultant: lead.consultant_name || '-',
        notes: '-', // Notes tidak ada di tabel leads (sesuai LeadTable)
        
        // Tambahan field untuk detail modal (sesuai LeadTable)
        seasonDestination: lead.interest || '-',
        packageType: lead.package_type || '-',
        destination: lead.destination_name || '-',
        outboundDate: lead.outbound_date_range || '-',
        
        // Raw data untuk detail modal
        rawData: {
          title: lead.title,
          full_name: lead.full_name,
          phone: lead.phone,
          created_at: lead.created_at,
          branch: {
            id: lead.branch_id,
            name: lead.branch_name
          },
          consultant: {
            id: lead.consultant_id,
            name: lead.consultant_name
          },
          package_type: {
            id: lead.package_type_id,
            name: lead.package_type
          },
          destination: {
            id: lead.destination_id,
            name: lead.destination_name
          },
          outbound_date: {
            id: lead.outbound_date_id,
            start_date: lead.outbound_start_date,
            end_date: lead.outbound_end_date
          },
          umrah_season: {
            id: lead.umrah_season_id,
            name: lead.umrah_season_name
          },
          umrah_category: {
            id: lead.umrah_category_id,
            name: lead.umrah_category_name
          }
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

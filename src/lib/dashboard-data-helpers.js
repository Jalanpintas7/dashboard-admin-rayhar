import { supabase } from './supabase.js';
import { 
  generateCacheKey, 
  saveToSessionStorage, 
  getFromSessionStorage, 
  invalidateCachePattern 
} from './cache-utils.js';
import { getDashboardStatsByBranch, getDashboardStatsForSuperAdmin, getBranchIdByUser } from './supabase-helpers.js';
import { getTopSalesConsultantsByCategory } from './supabase-helpers.js';
import { getTopPackagesByBranch, getTopPackagesForSuperAdmin } from './supabase-helpers.js';
import { getTopInquiriesByBranch, getTopInquiriesForSuperAdmin } from './supabase-helpers.js';

// ==================== DASHBOARD STATS ====================

export async function fetchDashboardStats() {
  const cacheKey = generateCacheKey('dashboard', 'stats');
  
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && typeof cachedData === 'object' && Object.keys(cachedData).length > 0) {
    console.log('✅ Dashboard stats loaded from session cache');
    return cachedData;
  }
  
  console.log('🔄 Fetching dashboard stats from database...');
  
  try {
    // Get user role to determine which stats to fetch
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Try to get user role from auth metadata first, then fallback to database
    let userRole = user.user_metadata?.role || user.app_metadata?.role;
    
    if (!userRole) {
      // Skip database query to avoid 404 errors, use default role directly
      console.log('No user role found in auth metadata, using default role');
      userRole = 'super_admin'; // Default fallback
    }
    let stats;

    try {
      if (userRole === 'super_admin') {
        stats = await getDashboardStatsForSuperAdmin();
      } else {
        const branchId = await getBranchIdByUser(user.id);
        if (!branchId) {
          console.log('Branch ID not found, using super admin stats as fallback');
          stats = await getDashboardStatsForSuperAdmin();
        } else {
          stats = await getDashboardStatsByBranch(branchId);
        }
      }
    } catch (statsError) {
      console.log('Error fetching dashboard stats, using fallback data:', statsError);
      // Fallback stats jika ada error
      stats = {
        totalBookings: 0,
        totalLeads: 0,
        recentBookings: 0,
        recentLeads: 0,
        totalUmrahBookings: 0,
        totalOutboundBookings: 0
      };
    }

    const result = {
      stats,
      userRole,
      timestamp: Date.now()
    };
    
    saveToSessionStorage(cacheKey, result);
    console.log('✅ Dashboard stats cached in session');
    
    return result;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      stats: {
        totalBookings: 0,
        totalLeads: 0,
        recentBookings: 0,
        recentLeads: 0,
        totalUmrahBookings: 0,
        totalOutboundBookings: 0
      },
      userRole: null,
      timestamp: Date.now()
    };
  }
}

// ==================== TOP SALES CONSULTANTS ====================

export async function fetchTopSalesConsultants(category = 'umrah', limit = 5) {
  const cacheKey = generateCacheKey('dashboard', `top_sales_${category}_${limit}`);
  
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData)) {
    console.log(`✅ Top sales consultants (${category}) loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log(`🔄 Fetching top sales consultants (${category}) from database...`);
  
  try {
    const TIMEOUT_MS = 5000;
    let consultants = await Promise.race([
      getTopSalesConsultantsByCategory(category, limit),
      new Promise((resolve) => setTimeout(() => resolve('__TIMEOUT__'), TIMEOUT_MS))
    ]);

    if (consultants === '__TIMEOUT__') {
      console.warn(`⏱️ Request timeout after ${TIMEOUT_MS / 1000} seconds for top sales (${category}). Using empty result.`);
      consultants = [];
    }
    
    const result = consultants.map(consultant => ({
      id: consultant.id,
      name: consultant.name,
      total: consultant.totalRevenue,
      recent: consultant.recentRevenue,
      totalBookings: consultant.totalBookings,
      recentBookings: consultant.recentBookings,
      email: consultant.email,
      whatsapp: consultant.whatsapp,
      salesConsultantNumber: consultant.salesConsultantNumber,
      branches: consultant.branches,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(consultant.name)}&background=10b981&color=fff&size=40`,
      categoryBookings: consultant.categoryBookings
    }));
    
    // Cache hasil query, termasuk hasil kosong untuk menghindari fetch berulang
    saveToSessionStorage(cacheKey, result);
    console.log(`✅ Top sales consultants (${category}) cached in session (${result.length} items)`);
    
    return result;
  } catch (error) {
    console.error('Error fetching top sales consultants:', error);
    const fallback = [];
    // Cache-kan juga hasil kosong saat error untuk mencegah refetch loop
    saveToSessionStorage(cacheKey, fallback);
    return fallback;
  }
}

// ==================== TOP PACKAGES ====================

export async function fetchTopPackages(filter = 'umrah', limit = 5) {
  const cacheKey = generateCacheKey('dashboard', `top_packages_${filter}_${limit}`);
  
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData)) {
    console.log(`✅ Top packages (${filter}) loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log(`🔄 Fetching top packages (${filter}) from database...`);
  
  try {
    const TIMEOUT_MS = 5000;

    const fetchPackagesInner = async () => {
      // Get user role to determine which packages to fetch
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      // Try to get user role from auth metadata first, then fallback to database
      let userRole = user.user_metadata?.role || user.app_metadata?.role;
      
      if (!userRole) {
        // Skip database query to avoid 404 errors, use default role directly
        console.log('No user role found in auth metadata, using default role');
        userRole = 'super_admin'; // Default fallback
      }
      
      let packages;
  
      try {
        if (userRole === 'super_admin') {
          packages = await getTopPackagesForSuperAdmin(filter, limit);
        } else {
          const branchId = await getBranchIdByUser(user.id);
          if (!branchId) {
            console.log('Branch ID not found, using super admin packages as fallback');
            packages = await getTopPackagesForSuperAdmin(filter, limit);
          } else {
            packages = await getTopPackagesByBranch(branchId, filter, limit);
          }
        }
      } catch (packagesError) {
        console.log('Error fetching top packages, using empty array as fallback:', packagesError);
        packages = [];
      }
      return packages;
    };

    let packages = await Promise.race([
      fetchPackagesInner(),
      new Promise((resolve) => setTimeout(() => resolve('__TIMEOUT__'), TIMEOUT_MS))
    ]);

    if (packages === '__TIMEOUT__') {
      console.warn(`⏱️ Request timeout after ${TIMEOUT_MS / 1000} seconds for top packages (${filter}). Using empty result.`);
      packages = [];
    }
    
    // Cache hasil query, termasuk hasil kosong untuk menghindari fetch berulang
    saveToSessionStorage(cacheKey, packages);
    console.log(`✅ Top packages (${filter}) cached in session (${packages.length} items)`);
    
    return packages;
  } catch (error) {
    console.error('Error fetching top packages:', error);
    const fallback = [];
    saveToSessionStorage(cacheKey, fallback);
    return fallback;
  }
}

// ==================== TOP INQUIRIES ====================

export async function fetchTopInquiries(filter = 'umrah', limit = 5) {
  const cacheKey = generateCacheKey('dashboard', `top_inquiries_${filter}_${limit}`);
  
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData)) {
    console.log(`✅ Top inquiries (${filter}) loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log(`🔄 Fetching top inquiries (${filter}) from database...`);
  
  try {
    const TIMEOUT_MS = 5000;

    const fetchInquiriesInner = async () => {
      // Get user role to determine which inquiries to fetch
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      // Try to get user role from auth metadata first, then fallback to database
      let userRole = user.user_metadata?.role || user.app_metadata?.role;
      
      if (!userRole) {
        // Skip database query to avoid 404 errors, use default role directly
        console.log('No user role found in auth metadata, using default role');
        userRole = 'super_admin'; // Default fallback
      }
      
      let inquiries;
  
      try {
        if (userRole === 'super_admin') {
          inquiries = await getTopInquiriesForSuperAdmin(filter, limit);
        } else {
          const branchId = await getBranchIdByUser(user.id);
          if (!branchId) {
            console.log('Branch ID not found, using super admin inquiries as fallback');
            inquiries = await getTopInquiriesForSuperAdmin(filter, limit);
          } else {
            inquiries = await getTopInquiriesByBranch(branchId, filter, limit);
          }
        }
      } catch (inquiriesError) {
        console.log('Error fetching top inquiries, using empty array as fallback:', inquiriesError);
        inquiries = [];
      }
      return inquiries;
    };

    let inquiries = await Promise.race([
      fetchInquiriesInner(),
      new Promise((resolve) => setTimeout(() => resolve('__TIMEOUT__'), TIMEOUT_MS))
    ]);

    if (inquiries === '__TIMEOUT__') {
      console.warn(`⏱️ Request timeout after ${TIMEOUT_MS / 1000} seconds for top inquiries (${filter}). Using empty result.`);
      inquiries = [];
    }
  
    // Cache hasil query, termasuk hasil kosong untuk menghindari fetch berulang
    saveToSessionStorage(cacheKey, inquiries);
    console.log(`✅ Top inquiries (${filter}) cached in session (${inquiries.length} items)`);
    
    return inquiries;
  } catch (error) {
    console.error('Error fetching top inquiries:', error);
    const fallback = [];
    saveToSessionStorage(cacheKey, fallback);
    return fallback;
  }
}

// ==================== SALES INQUIRY OVERVIEW ====================

export async function fetchSalesInquiryData(filter = 'Total Sales') {
  const cacheKey = generateCacheKey('dashboard', `sales_inquiry_${filter}`);
  
  const cachedData = getFromSessionStorage(cacheKey);
  if (cachedData && Array.isArray(cachedData)) {
    console.log(`✅ Sales inquiry data (${filter}) loaded from session cache (${cachedData.length} items)`);
    return cachedData;
  }
  
  console.log(`🔄 Fetching sales inquiry data (${filter}) from database...`);
  
  try {
    let data, error;

    if (filter === 'Total Sales') {
      // Query untuk data bookings dengan total_price dan bilangan (jumlah peserta)
      const result = await supabase
        .from('bookings')
        .select('created_at, umrah_category_id, total_price, bilangan')
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
      data = result.data;
      error = result.error;
    } else {
      // Query untuk data leads
      const result = await supabase
        .from('leads')
        .select('created_at, category_id')
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    // Proses data untuk mendapatkan statistik harian
    const dailyStats = processSalesInquiryData(data, filter);
    
    // Cache hasil query, termasuk hasil kosong untuk menghindari fetch berulang
    saveToSessionStorage(cacheKey, dailyStats);
    console.log(`✅ Sales inquiry data (${filter}) cached in session (${dailyStats.length} items)`);
    
    return dailyStats;
  } catch (error) {
    console.error('Error fetching sales inquiry data:', error);
    return [];
  }
}

// Helper function untuk memproses data sales inquiry
function processSalesInquiryData(data, filter) {
  const today = new Date();
  const stats = [];

  // Loop untuk 3 hari terakhir
  for (let i = 0; i < 3; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Filter data untuk tanggal tertentu
    const dayData = data.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0];
      return itemDate === dateStr;
    });

    let pelanconganCount = 0;
    let umrahCount = 0;
    let pelanconganRevenue = 0;
    let umrahRevenue = 0;

    dayData.forEach(item => {
      if (filter === 'Total Sales') {
        // Untuk bookings, cek umrah_category_id
        if (item.umrah_category_id) {
          umrahCount += item.bilangan || 1;
          umrahRevenue += item.total_price || 0;
        } else {
          pelanconganCount += item.bilangan || 1;
          pelanconganRevenue += item.total_price || 0;
        }
      } else {
        // Untuk leads, cek category_id
        if (item.category_id) {
          // Ada category_id = Umrah
          umrahCount++;
        } else {
          // Tidak ada category_id = Pelancongan
          pelanconganCount++;
        }
      }
    });

    const totalCount = pelanconganCount + umrahCount;
    const pelanconganPercentage = totalCount > 0 ? Math.round((pelanconganCount / totalCount) * 100) : 0;
    const umrahPercentage = totalCount > 0 ? Math.round((umrahCount / totalCount) * 100) : 0;

    stats.push({
      pelanconganPercentage,
      umrahPercentage,
      date: formatDate(targetDate),
      pelanconganCount,
      umrahCount,
      totalCount,
      pelanconganRevenue,
      umrahRevenue
    });
  }

  return stats.reverse(); // Reverse agar urutan dari lama ke baru
}

// Helper function untuk format tanggal
function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const monthNames = [
    'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
  ];
  
  return `${day} ${monthNames[month]} ${year}`;
}

// ==================== CACHE MANAGEMENT ====================

export function clearDashboardCache() {
  console.log('🧹 Clearing dashboard data cache...');
  invalidateCachePattern('dashboard');
}

export function clearAllDashboardCache() {
  console.log('🧹 Clearing all dashboard cache...');
  clearDashboardCache();
}

export async function warmCacheDashboardData() {
  try {
    console.log('🔥 Warming dashboard caches in background...');

    // Ambil user dan role untuk menentukan scope data (super_admin vs branch)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⏭️ Skip warming cache: user not authenticated yet');
      return;
    }
    let userRole = user?.user_metadata?.role || user?.app_metadata?.role || 'super_admin';

    let branchId = null;
    if (user && userRole !== 'super_admin') {
      try {
        branchId = await getBranchIdByUser(user.id);
      } catch (_) {
        branchId = null;
      }
    }

    const pkgFilters = ['keseluruhan', 'Umrah', 'Pelancongan'];
    const inqFilters = ['keseluruhan', 'Umrah', 'Pelancongan'];
    const consultantCats = ['umrah', 'pelancongan'];
    const salesFilters = ['Total Sales', 'Total Inquiry'];
    const limit = 5;

    const tasks = [];

    // Warm cache: Dashboard Stats
    tasks.push((async () => {
      const cacheKey = generateCacheKey('dashboard', 'stats');
      const cached = getFromSessionStorage(cacheKey);
      if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) return;
      try {
        let stats;
        if (userRole === 'super_admin') {
          stats = await getDashboardStatsForSuperAdmin();
        } else if (branchId) {
          stats = await getDashboardStatsByBranch(branchId);
        } else {
          stats = await getDashboardStatsForSuperAdmin();
        }
        saveToSessionStorage(cacheKey, stats || {});
        console.log('🔥 Warmed cache: dashboard stats');
      } catch (_) {
        // Do not cache empty object here to allow retry later
      }
    })());

    // Warm cache: Top Packages
    for (const filter of pkgFilters) {
      tasks.push((async () => {
        const cacheKey = generateCacheKey('dashboard', `top_packages_${filter}_${limit}`);
        const cached = getFromSessionStorage(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) return; // sudah ada data
        let packages = [];
        try {
          if (userRole === 'super_admin' || !branchId) {
            packages = await getTopPackagesForSuperAdmin(filter, limit);
          } else {
            packages = await getTopPackagesByBranch(branchId, filter, limit);
          }
        } catch (_) {
          packages = [];
        }
        saveToSessionStorage(cacheKey, packages || []);
        console.log(`🔥 Warmed cache: ${cacheKey} (${packages?.length || 0} items)`);
      })());
    }

    // Warm cache: Top Inquiries
    for (const filter of inqFilters) {
      tasks.push((async () => {
        const cacheKey = generateCacheKey('dashboard', `top_inquiries_${filter}_${limit}`);
        const cached = getFromSessionStorage(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) return;
        let inquiries = [];
        try {
          if (userRole === 'super_admin' || !branchId) {
            inquiries = await getTopInquiriesForSuperAdmin(filter, limit);
          } else {
            inquiries = await getTopInquiriesByBranch(branchId, filter, limit);
          }
        } catch (_) {
          inquiries = [];
        }
        saveToSessionStorage(cacheKey, inquiries || []);
        console.log(`🔥 Warmed cache: ${cacheKey} (${inquiries?.length || 0} items)`);
      })());
    }

    // Warm cache: Top Sales Consultants
    for (const category of consultantCats) {
      tasks.push((async () => {
        const cacheKey = generateCacheKey('dashboard', `top_sales_${category}_${limit}`);
        const cached = getFromSessionStorage(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) return;
        let consultants = [];
        try {
          const raw = await getTopSalesConsultantsByCategory(category, limit);
          consultants = (raw || []).map(consultant => ({
            id: consultant.id,
            name: consultant.name,
            total: consultant.totalRevenue,
            recent: consultant.recentRevenue,
            totalBookings: consultant.totalBookings,
            recentBookings: consultant.recentBookings,
            email: consultant.email,
            whatsapp: consultant.whatsapp,
            salesConsultantNumber: consultant.salesConsultantNumber,
            branches: consultant.branches,
            profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(consultant.name)}&background=10b981&color=fff&size=40`,
            categoryBookings: consultant.categoryBookings
          }));
        } catch (_) {
          consultants = [];
        }
        saveToSessionStorage(cacheKey, consultants || []);
        console.log(`🔥 Warmed cache: ${cacheKey} (${consultants?.length || 0} items)`);
      })());
    }

    // Warm cache: Sales Inquiry Overview
    for (const filter of salesFilters) {
      tasks.push((async () => {
        const cacheKey = generateCacheKey('dashboard', `sales_inquiry_${filter}`);
        const cached = getFromSessionStorage(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) return;
        try {
          let data, error;
          if (filter === 'Total Sales') {
            const result = await supabase
              .from('bookings')
              .select('created_at, umrah_category_id, total_price, bilangan')
              .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
            data = result.data;
            error = result.error;
          } else {
            const result = await supabase
              .from('leads')
              .select('created_at, category_id')
              .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
            data = result.data;
            error = result.error;
          }
          if (error) throw error;
          const dailyStats = processSalesInquiryData(data, filter);
          saveToSessionStorage(cacheKey, dailyStats || []);
          console.log(`🔥 Warmed cache: ${cacheKey} (${dailyStats?.length || 0} items)`);
        } catch (_) {
          // Do not cache empty array here so the component can still retry with timeout logic
        }
      })());
    }

    await Promise.allSettled(tasks);
    console.log('✅ Dashboard caches warmed');
  } catch (e) {
    console.warn('⚠️ Failed to warm dashboard cache:', e);
  }
}

import { supabase } from './supabase.js'

// Helper functions untuk operasi database

// ===== BRANCHES =====
export const getBranches = async () => {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

// ===== DESTINATIONS =====
export const getDestinations = async () => {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export const createDestination = async (destinationData) => {
  const { data, error } = await supabase
    .from('destinations')
    .insert([destinationData])
    .select()
  
  if (error) throw error
  return data[0]
}

// ===== UMRAH SEASONS =====
export const getUmrahSeasons = async () => {
  const { data, error } = await supabase
    .from('umrah_seasons')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export const createUmrahSeason = async (seasonData) => {
  const { data, error } = await supabase
    .from('umrah_seasons')
    .insert([seasonData])
    .select()
  
  if (error) throw error
  return data[0]
}

// ===== UMRAH CATEGORIES =====
export const getUmrahCategories = async () => {
  const { data, error } = await supabase
    .from('umrah_categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export const createUmrahCategory = async (categoryData) => {
  const { data, error } = await supabase
    .from('umrah_categories')
    .insert([categoryData])
    .select()
  
  if (error) throw error
  return data[0]
}

// ===== LEADS =====
export const getLeads = async (limit = 50) => {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      branches(name),
      destinations(name),
      umrah_seasons(name),
      umrah_categories(name),
      package_types(name),
      outbound_dates(start_date, end_date)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// ===== BOOKINGS =====
export const getBookings = async (limit = 50) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      branches(name),
      destinations(name),
      umrah_seasons(name),
      umrah_categories(name),
      package_types(name),
      outbound_dates(start_date, end_date),
      umrah_dates(start_date, end_date),
      airlines(name),
      sales_consultant(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// ===== SALES CONSULTANTS =====
export const getSalesConsultants = async () => {
  const { data, error } = await supabase
    .from('sales_consultant')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

// ===== PACKAGE TYPES =====
export const getPackageTypes = async () => {
  const { data, error } = await supabase
    .from('package_types')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

// ===== AIRLINES =====
export const getAirlines = async () => {
  const { data, error } = await supabase
    .from('airlines')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export const createAirline = async (airlineData) => {
  const { data, error } = await supabase
    .from('airlines')
    .insert([airlineData])
    .select()

  if (error) throw error
  return data[0]
}

export const createUmrahPackage = async (packageData) => {
  const { data, error } = await supabase
    .from('umrah_dates')
    .insert([packageData])
    .select()

  if (error) throw error
  return data[0]
}

// ===== STATISTICS =====
export const getDashboardStats = async () => {
  // Get total leads
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
  
  // Get total participants: count bookings + sum bilangan (consistent with Umrah/Outbound logic)
  const { count: totalBookingRecords } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('bilangan')
  
  const totalParticipants = (totalBookingRecords || 0) + bookings.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)
  
  // Get recent leads (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { count: recentLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())
  
  // Get recent participants (last 30 days) from members_booking
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: recentBookings } = await supabase
    .from('members_booking')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  return {
    totalLeads: totalLeads || 0,
    totalBookings: totalParticipants, // Total participants (count + sum bilangan)
    recentLeads: recentLeads || 0,
    recentBookings: recentBookings || 0 // Recent booking records (not participants)
  }
}

// ===== BRANCH-SPECIFIC STATISTICS =====
export const getDashboardStatsByBranch = async (branchId) => {
  if (!branchId) {
    throw new Error('Branch ID is required')
  }

  // Get total leads for specific branch
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)
  
  // Get total participants for specific branch: count bookings + sum bilangan (consistent logic)
  const { count: totalBookingRecords } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('bilangan')
    .eq('branch_id', branchId)
  
  const totalParticipants = (totalBookingRecords || 0) + bookings.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)
  
  // Get recent leads for specific branch (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { count: recentLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)
    .gte('created_at', sevenDaysAgo.toISOString())
  
  // Get recent participants for specific branch (last 30 days) from members_booking
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Get branch booking IDs first
  const { data: branchBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('branch_id', branchId)
  
  const branchBookingIds = branchBookings?.map(b => b.id) || []
  let recentBookings = 0
  
  if (branchBookingIds.length > 0) {
    const { count } = await supabase
      .from('members_booking')
      .select('*', { count: 'exact', head: true })
      .in('booking_id', branchBookingIds)
      .gte('created_at', thirtyDaysAgo.toISOString())
    recentBookings = count || 0
  }

  // Get total Umrah participants for specific branch: count bookings + sum bilangan
  const { count: umrahBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)
    .or('umrah_season_id.not.is.null,umrah_category_id.not.is.null')
  
  const { data: umrahBilangan } = await supabase
    .from('bookings')
    .select('bilangan')
    .eq('branch_id', branchId)
    .or('umrah_season_id.not.is.null,umrah_category_id.not.is.null')
  
  const totalUmrahBookings = (umrahBookings || 0) + umrahBilangan.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)
  
  // Get total Outbound participants for specific branch: count bookings + sum bilangan
  const { count: outboundBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', branchId)
    .or('destination_id.not.is.null,outbound_date_id.not.is.null')
  
  const { data: outboundBilangan } = await supabase
    .from('bookings')
    .select('bilangan')
    .eq('branch_id', branchId)
    .or('destination_id.not.is.null,outbound_date_id.not.is.null')
  
  const totalOutboundBookings = (outboundBookings || 0) + outboundBilangan.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)
  
  return {
    totalLeads: totalLeads || 0,
    totalBookings: totalParticipants, // Total participants (count + sum bilangan)
    recentLeads: recentLeads || 0,
    recentBookings: recentBookings || 0, // Recent booking records (not participants)
    totalUmrahBookings: totalUmrahBookings || 0,
    totalOutboundBookings: totalOutboundBookings || 0
  }
}

// ===== TOP SALES CONSULTANT STATISTICS =====
export const getTopSalesConsultants = async (limit = 5) => {
  let query = supabase
    .from('bookings')
    .select(`
      consultant_id,
      total_price,
      created_at,
      bilangan
    `)
    .not('consultant_id', 'is', null)
    .order('created_at', { ascending: false });

  const { data: bookings, error } = await query;

  if (error) throw error;

  // Get unique consultant IDs
  const consultantIds = [...new Set(bookings.map(b => b.consultant_id))];
  
  // Get consultant details with branch information
  const { data: consultants, error: consultantError } = await supabase
    .from('sales_consultant')
    .select('id, name, email, whatsapp_number, sales_consultant_number')
    .in('id', consultantIds);

  if (consultantError) throw consultantError;

  // Create consultant lookup
  const consultantLookup = {};
  consultants.forEach(consultant => {
    consultantLookup[consultant.id] = consultant;
  });

  // Group by sales consultant and calculate statistics
  const consultantStats = {};
  
  // Get branch information for each consultant
  const branchStats = {};
  bookings.forEach(booking => {
    const consultantId = booking.consultant_id;
    const branchId = booking.branch_id;
    
    if (!branchStats[consultantId]) {
      branchStats[consultantId] = new Set();
    }
    branchStats[consultantId].add(branchId);
  });
  
  // Get branch names
  const branchIds = [...new Set(bookings.map(b => b.branch_id).filter(id => id))];
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('id, name')
    .in('id', branchIds);
  
  if (branchError) throw branchError;
  
  const branchLookup = {};
  branches.forEach(branch => {
    branchLookup[branch.id] = branch.name;
  });
  
  bookings.forEach(booking => {
    const consultantId = booking.consultant_id;
    const consultant = consultantLookup[consultantId];
    
    if (!consultant) return; // Skip if consultant not found
    
    if (!consultantStats[consultantId]) {
      consultantStats[consultantId] = {
        id: consultantId,
        name: consultant.name || 'Unknown',
        email: consultant.email || '',
        whatsapp: consultant.whatsapp_number || '',
        salesConsultantNumber: consultant.sales_consultant_number || '',
        totalBookings: 0,
        recentBookings: 0,
        totalRevenue: 0,
        recentRevenue: 0,
        branches: new Set()
      };
    }
    
    // Calculate total participants: 1 (pendaftar) + bilangan
    const participants = 1 + (parseInt(booking.bilangan) || 0);
    
    consultantStats[consultantId].totalBookings += participants;
    
    // Add revenue calculation
    const bookingPrice = parseFloat(booking.total_price) || 0;
    consultantStats[consultantId].totalRevenue += bookingPrice;
    
    // Add branch information
    if (booking.branch_id && branchLookup[booking.branch_id]) {
      consultantStats[consultantId].branches.add(branchLookup[booking.branch_id]);
    }
    
    // Check if booking is recent (last 30 days)
    const bookingDate = new Date(booking.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (bookingDate >= thirtyDaysAgo) {
      consultantStats[consultantId].recentBookings += participants;
      consultantStats[consultantId].recentRevenue += bookingPrice;
    }
  });

  // Convert to array and sort by total revenue
  const topConsultants = Object.values(consultantStats)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit)
    .map(consultant => ({
      ...consultant,
      // Convert branches Set to array and join with comma
      branches: Array.from(consultant.branches).join(', ')
    }));

  return topConsultants;
};

// ===== TOP SALES CONSULTANT BY CATEGORY =====
export const getTopSalesConsultantsByCategory = async (category = 'umrah', limit = 5) => {
  let query = supabase
    .from('bookings')
    .select(`
      consultant_id,
      total_price,
      created_at,
      umrah_season_id,
      umrah_category_id,
      destination_id,
      outbound_date_id,
      bilangan
    `)
    .not('consultant_id', 'is', null);

  // Filter berdasarkan kategori paket
  if (category === 'umrah') {
    // Filter untuk paket umrah (yang memiliki umrah_season_id atau umrah_category_id)
    query = query.or('umrah_season_id.not.is.null,umrah_category_id.not.is.null');
  } else if (category === 'pelancongan') {
    // Filter untuk paket pelancongan (yang memiliki destination_id atau outbound_date_id)
    query = query.or('destination_id.not.is.null,outbound_date_id.not.is.null');
  }

  const { data: bookings, error } = await query;

  if (error) throw error;

  // Get unique consultant IDs
  const consultantIds = [...new Set(bookings.map(b => b.consultant_id))];
  
  // Get consultant details with branch information
  const { data: consultants, error: consultantError } = await supabase
    .from('sales_consultant')
    .select('id, name, email, whatsapp_number, sales_consultant_number')
    .in('id', consultantIds);

  if (consultantError) throw consultantError;

  // Create consultant lookup
  const consultantLookup = {};
  consultants.forEach(consultant => {
    consultantLookup[consultant.id] = consultant;
  });

  // Group by sales consultant and calculate statistics
  const consultantStats = {};
  
  // Get branch information for each consultant
  const branchStats = {};
  bookings.forEach(booking => {
    const consultantId = booking.consultant_id;
    const branchId = booking.branch_id;
    
    if (!branchStats[consultantId]) {
      branchStats[consultantId] = new Set();
    }
    branchStats[consultantId].add(branchId);
  });
  
  // Get branch names
  const branchIds = [...new Set(bookings.map(b => b.branch_id).filter(id => id))];
  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('id, name')
    .in('id', branchIds);
  
  if (branchError) throw branchError;
  
  const branchLookup = {};
  branches.forEach(branch => {
    branchLookup[branch.id] = branch.name;
  });
  
  bookings.forEach(booking => {
    const consultantId = booking.consultant_id;
    const consultant = consultantLookup[consultantId];
    
    if (!consultant) return; // Skip if consultant not found
    
    if (!consultantStats[consultantId]) {
      consultantStats[consultantId] = {
        id: consultantId,
        name: consultant.name || 'Unknown',
        email: consultant.email || '',
        whatsapp: consultant.whatsapp_number || '',
        salesConsultantNumber: consultant.sales_consultant_number || '',
        totalBookings: 0,
        recentBookings: 0,
        totalRevenue: 0,
        recentRevenue: 0,
        branches: new Set(),
        categoryBookings: 0
      };
    }
    
    // Calculate total participants: 1 (pendaftar) + bilangan
    const participants = 1 + (parseInt(booking.bilangan) || 0);
    
    consultantStats[consultantId].totalBookings += participants;
    consultantStats[consultantId].categoryBookings += participants;
    
    // Add revenue calculation
    const bookingPrice = parseFloat(booking.total_price) || 0;
    consultantStats[consultantId].totalRevenue += bookingPrice;
    
    // Add branch information
    if (booking.branch_id && branchLookup[booking.branch_id]) {
      consultantStats[consultantId].branches.add(branchLookup[booking.branch_id]);
    }
    
    // Check if booking is recent (last 30 days)
    const bookingDate = new Date(booking.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (bookingDate >= thirtyDaysAgo) {
      consultantStats[consultantId].recentBookings += participants;
      consultantStats[consultantId].recentRevenue += bookingPrice;
    }
  });

  // Convert to array and sort by category bookings
  const topConsultants = Object.values(consultantStats)
    .sort((a, b) => b.categoryBookings - a.categoryBookings)
    .slice(0, limit)
    .map(consultant => ({
      ...consultant,
      // Convert branches Set to array and join with comma
      branches: Array.from(consultant.branches).join(', ')
    }));

  return topConsultants;
};

// ===== TOP PACKAGES BY BRANCH =====
export const getTopPackagesByBranch = async (branchId, filter = 'keseluruhan', limit = 5) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      umrah_seasons(name),
      destinations(name)
    `)
    .not('branch_id', 'is', null);

  // Filter berdasarkan branch jika ada
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  // Filter berdasarkan jenis pelancongan berdasarkan data yang ada
  if (filter === 'Umrah') {
    query = query.or('umrah_season_id.not.is.null,umrah_category_id.not.is.null');
  } else if (filter === 'Pelancongan') {
    query = query.or('destination_id.not.is.null,outbound_date_id.not.is.null');
  }

  const { data: bookings, error } = await query;

  if (error) throw error;

  // Group by package dan hitung total peserta (booking + bilangan)
  const packageStats = {};

  bookings.forEach(booking => {
    let packageName = '';
    let packageId = '';
    let packageType = '';

    // Tentukan jenis pelancongan berdasarkan data yang ada
    if (booking.umrah_season_id || booking.umrah_category_id) {
      // Umrah: ada umrah_season_id atau umrah_category_id
      packageId = booking.umrah_season_id || booking.umrah_category_id;
      packageName = booking.umrah_seasons?.name || 'Umrah Package';
      packageType = 'umrah';
    } else if (booking.destination_id || booking.outbound_date_id) {
      // Outbound: ada destination_id atau outbound_date_id
      packageId = booking.destination_id || booking.outbound_date_id;
      packageName = booking.destinations?.name || 'Tour Package';
      packageType = 'outbound';
    }

    if (!packageId) return; // Skip jika tidak ada package ID

    if (!packageStats[packageId]) {
      packageStats[packageId] = {
        id: packageId,
        name: packageName,
        totalSales: 0,
        type: packageType
      };
    }

    // Perhitungan baru: Total peserta = 1 booking + bilangan
    // Formula: total peserta = 1 (booking) + bilangan (jumlah peserta dalam booking)
    const pesertaCount = 1 + (booking.bilangan || 0);
    packageStats[packageId].totalSales += pesertaCount;
  });

  // Convert to array dan sort by total peserta
  const topPackages = Object.values(packageStats)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, limit)
    .map((pkg, index) => ({
      ...pkg,
      rank: index + 1
    }));

  return topPackages;
};

// ===== TOP INQUIRIES BY BRANCH =====
export const getTopInquiriesByBranch = async (branchId, filter = 'keseluruhan', limit = 5) => {
  let query = supabase
    .from('leads')
    .select(`
      *,
      umrah_seasons(name),
      destinations(name)
    `)
    .not('branch_id', 'is', null);

  // Filter berdasarkan branch jika ada
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  // Filter berdasarkan jenis pelancongan
  if (filter === 'Umrah') {
    query = query.not('season_id', 'is', null).not('category_id', 'is', null);
  } else if (filter === 'Pelancongan') {
    query = query.not('destination_id', 'is', null).not('outbound_date_id', 'is', null);
  }

  const { data: leads, error } = await query;

  if (error) throw error;

  // Group by package dan hitung total inquiry
  const inquiryStats = {};

  leads.forEach(lead => {
    let packageName = '';
    let packageId = '';
    let packageType = '';

    // Tentukan jenis pelancongan berdasarkan data yang ada
    if (lead.season_id && lead.category_id) {
      // Umrah: ada season_id dan category_id - grouping berdasarkan kombinasi keduanya
      packageId = `${lead.season_id}_${lead.category_id}`;
      packageName = lead.umrah_seasons?.name || 'Umrah Package';
      packageType = 'umrah';
    } else if (lead.destination_id && lead.outbound_date_id) {
      // Pelancongan: ada destination_id dan outbound_date_id - grouping berdasarkan kombinasi keduanya
      packageId = `${lead.destination_id}_${lead.outbound_date_id}`;
      packageName = lead.destinations?.name || 'Tour Package';
      packageType = 'outbound';
    }

    if (!packageId) return; // Skip jika tidak ada package ID

    if (!inquiryStats[packageId]) {
      inquiryStats[packageId] = {
        id: packageId,
        name: packageName,
        totalInquiries: 0,
        totalBookings: 0,
        type: packageType
      };
    }

    inquiryStats[packageId].totalInquiries += 1;
  });

  // Hitung conversion rate dengan mengambil data booking
  const packageIds = Object.keys(inquiryStats);
  
  if (packageIds.length > 0) {
    // Get booking data untuk menghitung conversion
    let bookingQuery = supabase
      .from('bookings')
      .select('umrah_season_id, umrah_category_id, destination_id, outbound_date_id')
      .not('branch_id', 'is', null);

    if (branchId) {
      bookingQuery = bookingQuery.eq('branch_id', branchId);
    }

    if (filter === 'Umrah') {
      bookingQuery = bookingQuery.or('umrah_season_id.not.is.null,umrah_category_id.not.is.null');
    } else if (filter === 'Pelancongan') {
      bookingQuery = bookingQuery.or('destination_id.not.is.null,outbound_date_id.not.is.null');
    }

    const { data: bookings, error: bookingError } = await bookingQuery;

    if (!bookingError && bookings) {
      // Hitung booking untuk setiap package
      bookings.forEach(booking => {
        let packageId = '';
        
        if (booking.umrah_season_id && booking.umrah_category_id) {
          packageId = `${booking.umrah_season_id}_${booking.umrah_category_id}`;
        } else if (booking.destination_id && booking.outbound_date_id) {
          packageId = `${booking.destination_id}_${booking.outbound_date_id}`;
        }

        if (packageId && inquiryStats[packageId]) {
          inquiryStats[packageId].totalBookings += 1;
        }
      });
    }
  }

  // Convert to array, hitung conversion rate, dan sort by total inquiries
  const topInquiries = Object.values(inquiryStats)
    .map(pkg => {
      const conversionRate = pkg.totalInquiries > 0 
        ? ((pkg.totalBookings / pkg.totalInquiries) * 100).toFixed(1)
        : '0.0';
      
      return {
        ...pkg,
        conversion: `${conversionRate}%`
      };
    })
    .sort((a, b) => b.totalInquiries - a.totalInquiries)
    .slice(0, limit)
    .map((pkg, index) => ({
      ...pkg,
      rank: index + 1
    }));

  return topInquiries;
};

// ===== GET BRANCH ID BY USER =====
export const getBranchIdByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('admin_role')
      .select('branch_id')
      .eq('user_id', userId)
      .eq('role', 'admin_branch')
      .maybeSingle() // Use maybeSingle to handle 0 rows
    
    if (error) {
      console.log('Error getting branch ID:', error);
      return null;
    }
    
    return data?.branch_id || null;
  } catch (err) {
    console.log('Table admin_role not found or accessible:', err);
    return null;
  }
}

// ===== AUTH HELPERS =====
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// ===== SUPER ADMIN DASHBOARD STATISTICS =====
export const getDashboardStatsForSuperAdmin = async () => {
  // Get total leads from all branches
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
  
  // Get total participants from all branches: count bookings + sum bilangan (consistent logic)
  const { count: totalBookingRecords } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('bilangan')
  
  const totalParticipants = (totalBookingRecords || 0) + bookings.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)
  
  // Get recent leads (last 7 days) from all branches
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { count: recentLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())
  
  // Get recent participants (last 30 days) from all branches via members_booking
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: recentBookings } = await supabase
    .from('members_booking')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get total Umrah participants from all branches: count bookings + sum bilangan
  const { count: umrahBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .or('umrah_season_id.not.is.null,umrah_category_id.not.is.null')
  
  const { data: umrahBilangan } = await supabase
    .from('bookings')
    .select('bilangan')
    .or('umrah_season_id.not.is.null,umrah_category_id.not.is.null')
  
  const totalUmrahBookings = (umrahBookings || 0) + umrahBilangan.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)
  
  // Get total Outbound participants from all branches: count bookings + sum bilangan
  const { count: outboundBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .or('destination_id.not.is.null,outbound_date_id.not.is.null')
  
  const { data: outboundBilangan } = await supabase
    .from('bookings')
    .select('bilangan')
    .or('destination_id.not.is.null,outbound_date_id.not.is.null')
  
  const totalOutboundBookings = (outboundBookings || 0) + outboundBilangan.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)
  
  return {
    totalLeads: totalLeads || 0,
    totalBookings: totalParticipants, // Total participants (count + sum bilangan)
    recentLeads: recentLeads || 0,
    recentBookings: recentBookings || 0, // Recent booking records (not participants)
    totalUmrahBookings: totalUmrahBookings || 0,
    totalOutboundBookings: totalOutboundBookings || 0
  }
}

// ===== TOP PACKAGES FOR SUPER ADMIN =====
export const getTopPackagesForSuperAdmin = async (filter = 'keseluruhan', limit = 5) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      umrah_seasons(name),
      destinations(name)
    `)
    .not('branch_id', 'is', null);

  // Filter berdasarkan jenis pelancongan berdasarkan data yang ada
  if (filter === 'Umrah') {
    query = query.or('umrah_season_id.not.is.null,umrah_category_id.not.is.null');
  } else if (filter === 'Pelancongan') {
    query = query.or('destination_id.not.is.null,outbound_date_id.not.is.null');
  }

  const { data: bookings, error } = await query;

  if (error) throw error;

  // Group by package dan hitung total peserta (booking + bilangan)
  const packageStats = {};

  bookings.forEach(booking => {
    let packageName = '';
    let packageId = '';
    let packageType = '';

    // Tentukan jenis pelancongan berdasarkan data yang ada
    if (booking.umrah_season_id || booking.umrah_category_id) {
      // Umrah: ada umrah_season_id atau umrah_category_id
      packageId = booking.umrah_season_id || booking.umrah_category_id;
      packageName = booking.umrah_seasons?.name || 'Umrah Package';
      packageType = 'umrah';
    } else if (booking.destination_id || booking.outbound_date_id) {
      // Outbound: ada destination_id atau outbound_date_id
      packageId = booking.destination_id || booking.outbound_date_id;
      packageName = booking.destinations?.name || 'Tour Package';
      packageType = 'outbound';
    }

    if (!packageId) return; // Skip jika tidak ada package ID

    if (!packageStats[packageId]) {
      packageStats[packageId] = {
        id: packageId,
        name: packageName,
        totalSales: 0,
        type: packageType
      };
    }

    // Perhitungan baru: Total peserta = 1 booking + bilangan
    // Formula: total peserta = 1 (booking) + bilangan (jumlah peserta dalam booking)
    const pesertaCount = 1 + (booking.bilangan || 0);
    packageStats[packageId].totalSales += pesertaCount;
  });

  // Convert to array dan sort by total peserta
  const topPackages = Object.values(packageStats)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, limit)
    .map((pkg, index) => ({
      ...pkg,
      rank: index + 1
    }));

  return topPackages;
};

// ===== TOP INQUIRIES FOR SUPER ADMIN =====
export const getTopInquiriesForSuperAdmin = async (filter = 'keseluruhan', limit = 5) => {
  let query = supabase
    .from('leads')
    .select(`
      *,
      umrah_seasons(name),
      destinations(name)
    `)
    .not('branch_id', 'is', null);

  // Filter berdasarkan jenis pelancongan
  if (filter === 'Umrah') {
    query = query.not('season_id', 'is', null).not('category_id', 'is', null);
  } else if (filter === 'Pelancongan') {
    query = query.not('destination_id', 'is', null).not('outbound_date_id', 'is', null);
  }

  const { data: leads, error } = await query;

  if (error) throw error;

  // Group by package dan hitung total inquiry
  const inquiryStats = {};

  leads.forEach(lead => {
    let packageName = '';
    let packageId = '';
    let packageType = '';

    // Tentukan jenis pelancongan berdasarkan data yang ada
    if (lead.season_id && lead.category_id) {
      // Umrah: ada season_id dan category_id - grouping berdasarkan kombinasi keduanya
      packageId = `${lead.season_id}_${lead.category_id}`;
      packageName = lead.umrah_seasons?.name || 'Umrah Package';
      packageType = 'umrah';
    } else if (lead.destination_id && lead.outbound_date_id) {
      // Pelancongan: ada destination_id dan outbound_date_id - grouping berdasarkan kombinasi keduanya
      packageId = `${lead.destination_id}_${lead.outbound_date_id}`;
      packageName = lead.destinations?.name || 'Tour Package';
      packageType = 'outbound';
    }

    if (!packageId) return; // Skip jika tidak ada package ID

    if (!inquiryStats[packageId]) {
      inquiryStats[packageId] = {
        id: packageId,
        name: packageName,
        totalInquiries: 0,
        totalBookings: 0,
        type: packageType
      };
    }

    inquiryStats[packageId].totalInquiries += 1;
  });

  // Hitung conversion rate dengan mengambil data booking
  const packageIds = Object.keys(inquiryStats);
  
  if (packageIds.length > 0) {
    // Get booking data untuk menghitung conversion
    let bookingQuery = supabase
      .from('bookings')
      .select('umrah_season_id, umrah_category_id, destination_id, outbound_date_id')
      .not('branch_id', 'is', null);

    if (filter === 'Umrah') {
      bookingQuery = bookingQuery.or('umrah_season_id.not.is.null,umrah_category_id.not.is.null');
    } else if (filter === 'Pelancongan') {
      bookingQuery = bookingQuery.eq('destination_id.not.is.null,outbound_date_id.not.is.null');
    }

    const { data: bookings, error: bookingError } = await bookingQuery;

    if (!bookingError && bookings) {
      // Hitung booking untuk setiap package
      bookings.forEach(booking => {
        let packageId = '';
        
        if (booking.umrah_season_id && booking.umrah_category_id) {
          packageId = `${booking.umrah_season_id}_${booking.umrah_category_id}`;
        } else if (booking.destination_id && booking.outbound_date_id) {
          packageId = `${booking.destination_id}_${booking.outbound_date_id}`;
        }

        if (packageId && inquiryStats[packageId]) {
          inquiryStats[packageId].totalBookings += 1;
        }
      });
    }
  }

  // Convert to array, hitung conversion rate, dan sort by total inquiries
  const topInquiries = Object.values(inquiryStats)
    .map(pkg => {
      const conversionRate = pkg.totalInquiries > 0 
        ? ((pkg.totalBookings / pkg.totalInquiries) * 100).toFixed(1)
        : '0.0';
      
      return {
        ...pkg,
        conversion: `${conversionRate}%`
      };
    })
    .sort((a, b) => b.totalInquiries - a.totalInquiries)
    .slice(0, limit)
    .map((pkg, index) => ({
      ...pkg,
      rank: index + 1
    }));

  return topInquiries;
};

// ===== SALES INQUIRY OVERVIEW FOR SUPER ADMIN =====
export const getSalesInquiryOverviewForSuperAdmin = async (type = 'sales') => {
  if (type === 'sales') {
    // Get booking data for last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('umrah_season_id, umrah_category_id, destination_id, outbound_date_id, created_at')
      .gte('created_at', threeMonthsAgo.toISOString());

    if (error) throw error;

    // Group by month and calculate percentages
    const monthlyStats = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          umrah: 0,
          outbound: 0,
          total: 0
        };
      }
      
      // Tentukan jenis pelancongan berdasarkan data yang ada
      if (booking.umrah_season_id || booking.umrah_category_id) {
        monthlyStats[monthKey].umrah += 1;
      } else if (booking.destination_id || booking.outbound_date_id) {
        monthlyStats[monthKey].outbound += 1;
      }
      
      monthlyStats[monthKey].total += 1;
    });

    // Convert to array and calculate percentages
    const overviewData = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-3) // Get last 3 months
      .map(([month, stats]) => {
        const umrahPercentage = stats.total > 0 ? Math.round((stats.umrah / stats.total) * 100) : 0;
        const outboundPercentage = stats.total > 0 ? Math.round((stats.outbound / stats.total) * 100) : 0;
        
        return {
          pelancongan: { percentage: outboundPercentage },
          umrah: { percentage: umrahPercentage },
          month: month
        };
      });

    return overviewData;
  } else {
    // Get leads data for last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data: leads, error } = await supabase
      .from('leads')
      .select('season_id, destination_id, created_at')
      .gte('created_at', threeMonthsAgo.toISOString());

    if (error) throw error;

    // Group by month and calculate percentages
    const monthlyStats = {};
    
    leads.forEach(lead => {
      const date = new Date(lead.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          umrah: 0,
          outbound: 0,
          total: 0
        };
      }
      
      // Determine type based on data
      if (lead.season_id && lead.category_id) {
        monthlyStats[monthKey].umrah += 1;
      } else if (lead.destination_id && lead.outbound_date_id) {
        monthlyStats[monthKey].outbound += 1;
      }
      
      monthlyStats[monthKey].total += 1;
    });

    // Convert to array and calculate percentages
    const overviewData = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-3) // Get last 3 months
      .map(([month, stats]) => {
        const umrahPercentage = stats.total > 0 ? Math.round((stats.umrah / stats.total) * 100) : 0;
        const outboundPercentage = stats.total > 0 ? Math.round((stats.outbound / stats.total) * 100) : 0;
        
        return {
          pelancongan: { percentage: outboundPercentage },
          umrah: { percentage: umrahPercentage },
          month: month
        };
      });

    return overviewData;
  }
};



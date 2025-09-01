// Data sample lead untuk Rayhar Admin Dashboard (fallback jika Supabase tidak tersedia)
export const leadsData = [
  {
    id: 1,
    name: 'Ahmad Zulkarnain bin Razak',
    email: 'ahmad.zulkarnain@contoh.my',
    phone: '+60123456789',
    address: 'No. 123, Jalan Tun Razak, 50000 Kuala Lumpur',
    branch: 'Kuala Lumpur',
    interest: 'Umrah Premium',
    date: '20 Ogos 2025',
    avatar: 'AZ',
    source: 'Website',
    budget: 'RM 8,000 - 10,000',
    timeline: 'Q1 2025',
    consultant: 'Ahmad bin Ismail',
    notes: 'Sangat tertarik dengan pakej Umrah Premium, sudah siap dengan dokumen'
  },
  {
    id: 2,
    name: 'Siti Nur Aminah binti Salleh',
    email: 'siti.nur.aminah@contoh.my',
    phone: '+60198765432',
    address: 'No. 45, Taman Johor Jaya, 81100 Johor Bahru',
    branch: 'Johor Bahru',
    interest: 'Turkey Explorer',
    date: '19 Ogos 2025',
    avatar: 'SA',
    source: 'Referral',
    budget: 'RM 4,000 - 6,000',
    timeline: 'Q2 2025',
    consultant: 'Siti Aminah binti Omar',
    notes: 'Minat dengan budaya Turki, perlu follow up minggu depan'
  },
  {
    id: 3,
    name: 'Muhammad Aiman bin Ali',
    email: 'muhammad.aiman@contoh.my',
    phone: '+60187654321',
    address: 'No. 78, Taman Sri Nibong, 11900 Bayan Lepas',
    branch: 'Penang',
    interest: 'Umrah Ekonomi',
    date: '18 Ogos 2025',
    avatar: 'MA',
    source: 'Social Media',
    budget: 'RM 5,000 - 7,000',
    timeline: 'Q3 2025',
    consultant: 'Muhammad bin Hassan',
    notes: 'Masih dalam tahap pertimbangan, perlu nurturing'
  },
  {
    id: 4,
    name: 'Fatimah Zahra binti Ismail',
    email: 'fatimah.zahra@contoh.my',
    phone: '+60176543210',
    address: 'No. 12, Taman Sri Petaling, 57000 Kuala Lumpur',
    branch: 'Kuala Lumpur',
    interest: 'UAE Luxury',
    date: '17 Ogos 2025',
    avatar: 'FZ',
    source: 'Exhibition',
    budget: 'RM 3,000 - 5,000',
    timeline: 'Q4 2025',
    consultant: 'Fatimah binti Ahmad',
    notes: 'Sudah siap booking, menunggu konfirmasi pembayaran'
  },
  {
    id: 5,
    name: 'Hasan bin Ibrahim',
    email: 'hasan.ibrahim@contoh.my',
    phone: '+60165432109',
    address: 'No. 56, Taman Likas, 88400 Kota Kinabalu',
    branch: 'Kota Kinabalu',
    interest: 'Umrah Plus',
    date: '16 Ogos 2025',
    avatar: 'HI',
    source: 'Website',
    budget: 'RM 7,000 - 9,000',
    timeline: 'Q1 2025',
    consultant: 'Hasan bin Omar',
    notes: 'Sangat antusias, sudah ada pengalaman umrah sebelumnya'
  },
  {
    id: 6,
    name: 'Nurul Ain binti Mohd',
    email: 'nurul.ain@contoh.my',
    phone: '+60154321098',
    address: 'No. 89, Taman Sri Muda, 40000 Shah Alam',
    branch: 'Shah Alam',
    interest: 'Japan Cherry Blossom',
    date: '15 Ogos 2025',
    avatar: 'NA',
    source: 'Referral',
    budget: 'RM 5,000 - 8,000',
    timeline: 'Q2 2025',
    consultant: 'Nurul Ain binti Hassan',
    notes: 'Minat dengan musim sakura, perlu info lebih detail'
  },
  {
    id: 7,
    name: 'Khairul Anwar bin Ahmad',
    email: 'khairul.anwar@contoh.my',
    phone: '+60143210987',
    address: 'No. 34, Taman Malim Jaya, 75250 Melaka',
    branch: 'Melaka',
    interest: 'Umrah Standard',
    date: '14 Ogos 2025',
    avatar: 'KA',
    source: 'Social Media',
    budget: 'RM 4,000 - 6,000',
    timeline: 'Q3 2025',
    consultant: 'Khairul bin Ahmad',
    notes: 'Masih dalam tahap riset, perlu follow up berkala'
  },
  {
    id: 8,
    name: 'Aisyah binti Kamal',
    email: 'aisyah.kamal@contoh.my',
    phone: '+60132109876',
    address: 'No. 67, Taman Ipoh Jaya, 31400 Ipoh',
    branch: 'Ipoh',
    interest: 'Singapore-Malaysia',
    date: '13 Ogos 2025',
    avatar: 'AK',
    source: 'Exhibition',
    budget: 'RM 2,000 - 4,000',
    timeline: 'Q4 2025',
    consultant: 'Aisyah binti Kamal',
    notes: 'Sudah siap booking, menunggu konfirmasi jadwal'
  }
];

// Fungsi helper untuk mendapatkan inisial nama
export function getInitials(name) {
  if (!name) return 'NA';
  return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

// Fungsi untuk filter data lead
export function filterLeads(leads, filters) {
  return leads.filter(lead => {
    if (filters.branch && lead.branch !== filters.branch) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        lead.name.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        lead.phone.includes(searchTerm)
      );
    }
    return true;
  });
}

// Fungsi untuk mengambil data lead dari Supabase (implementasi dinamis)
export async function fetchLeadsData() {
  try {
    // Import supabase client secara dinamis
    const { supabase } = await import('$lib/supabase.js');
    
    console.log('Fetching all leads from Supabase...');
    
    // Query yang efisien dengan join ke semua tabel terkait
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        title,
        full_name,
        phone,
        branch_id,
        season_id,
        category_id,
        created_at,
        package_type_id,
        destination_id,
        outbound_date_id,
        category,
        branches(name),
        umrah_seasons(name),
        umrah_categories(name),
        package_types(name),
        destinations(name),
        outbound_dates(start_date, end_date)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads from Supabase:', error);
      console.log('Falling back to sample data...');
      return leadsData; // Fallback ke data sample
    }

    console.log('Raw data from Supabase:', data);
    console.log('Number of leads found:', data?.length || 0);

    // Transform data untuk kompatibilitas dengan komponen yang ada
    return data.map(lead => {
      // Tentukan interest berdasarkan data yang tersedia
      let interest = '-';
      if (lead.umrah_seasons?.name) {
        interest = lead.umrah_seasons.name;
      } else if (lead.umrah_categories?.name) {
        interest = lead.umrah_categories.name;
      } else if (lead.destinations?.name) {
        interest = lead.destinations.name;
      } else if (lead.package_types?.name) {
        interest = lead.package_types.name;
      }

      return {
        id: lead.id,
        name: lead.full_name || lead.title || 'Nama tidak tersedia',
        email: '-', // Email tidak ada di tabel leads
        phone: lead.phone || '-',
        branch: lead.branches?.name || '-',
        interest: interest,
        date: new Date(lead.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        avatar: getInitials(lead.full_name || lead.title || 'NA'),
        address: '-', // Address tidak ada di tabel leads
        source: lead.category || '-',
        budget: '-', // Budget tidak ada di tabel leads
        timeline: '-', // Timeline tidak ada di tabel leads
        consultant: '-', // Consultant tidak ada di tabel leads
        notes: '-', // Notes tidak ada di tabel leads
        // Tambahan field untuk detail
        seasonDestination: interest,
        packageType: lead.package_types?.name || '-',
        destination: lead.destinations?.name || '-',
        outboundDate: lead.outbound_dates ? 
          `${lead.outbound_dates.start_date} - ${lead.outbound_dates.end_date}` : '-'
      };
    });
  } catch (error) {
    console.error('Error in fetchLeadsData:', error);
    console.log('Falling back to sample data...');
    return leadsData; // Fallback ke data sample jika ada error
  }
}

// Fungsi untuk mengambil data lead berdasarkan branch tertentu dari Supabase
export async function fetchLeadsDataByBranch(branchName) {
  try {
    // Import supabase client secara dinamis
    const { supabase } = await import('$lib/supabase.js');
    
    console.log('Fetching leads for branch:', branchName);
    
    // Query yang efisien dengan join langsung ke branches
    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        title,
        full_name,
        phone,
        branch_id,
        season_id,
        category_id,
        created_at,
        package_type_id,
        destination_id,
        outbound_date_id,
        category,
        branches!inner(name),
        umrah_seasons(name),
        umrah_categories(name),
        package_types(name),
        destinations(name),
        outbound_dates(start_date, end_date)
      `)
      .eq('branches.name', branchName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads by branch:', error);
      return [];
    }

    console.log('Raw data from Supabase for branch:', branchName, data);
    console.log('Number of leads found:', data?.length || 0);

    // Transform data untuk kompatibilitas dengan komponen yang ada
    return data.map(lead => {
      // Tentukan interest berdasarkan data yang tersedia
      let interest = '-';
      if (lead.umrah_seasons?.name) {
        interest = lead.umrah_seasons.name;
      } else if (lead.umrah_categories?.name) {
        interest = lead.umrah_categories.name;
      } else if (lead.destinations?.name) {
        interest = lead.destinations.name;
      } else if (lead.package_types?.name) {
        interest = lead.package_types.name;
      }

      return {
        id: lead.id,
        name: lead.full_name || lead.title || 'Nama tidak tersedia',
        email: '-', // Email tidak ada di tabel leads
        phone: lead.phone || '-',
        branch: lead.branches?.name || '-',
        interest: interest,
        date: new Date(lead.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        avatar: getInitials(lead.full_name || lead.title || 'NA'),
        address: '-', // Address tidak ada di tabel leads
        source: lead.category || '-',
        budget: '-', // Budget tidak ada di tabel leads
        timeline: '-', // Timeline tidak ada di tabel leads
        consultant: '-', // Consultant tidak ada di tabel leads
        notes: '-', // Notes tidak ada di tabel leads
        // Tambahan field untuk detail
        seasonDestination: interest,
        packageType: lead.package_types?.name || '-',
        destination: lead.destinations?.name || '-',
        outboundDate: lead.outbound_dates ? 
          `${lead.outbound_dates.start_date} - ${lead.outbound_dates.end_date}` : '-'
      };
    });
  } catch (error) {
    console.error('Error in fetchLeadsDataByBranch:', error);
    return [];
  }
}

// Fungsi untuk mengambil data lead dari Supabase dengan pagination
export async function fetchLeadsDataPaginated(page = 1, limit = 10, filters = {}) {
  try {
    // Import supabase client secara dinamis
    const { supabase } = await import('$lib/supabase.js');
    
    console.log(`Fetching leads page ${page} with limit ${limit} and filters:`, filters);
    
    // Hitung offset untuk pagination
    const offset = (page - 1) * limit;
    
    // Base query
    let query = supabase
      .from('leads')
      .select(`
        id,
        title,
        full_name,
        phone,
        branch_id,
        season_id,
        category_id,
        created_at,
        package_type_id,
        destination_id,
        outbound_date_id,
        category,
        branches(name),
        umrah_seasons(name),
        umrah_categories(name),
        package_types(name),
        destinations(name),
        outbound_dates(start_date, end_date)
      `, { count: 'exact' }); // Dapatkan total count
    
    // Apply filters
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,title.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    
    if (filters.branch) {
      query = query.eq('branches.name', filters.branch);
    }
    
    if (filters.interest) {
      query = query.or(`umrah_seasons.name.ilike.%${filters.interest}%,umrah_categories.name.ilike.%${filters.interest}%,destinations.name.ilike.%${filters.interest}%,package_types.name.ilike.%${filters.interest}%`);
    }
    
    // Apply pagination dan ordering
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads from Supabase:', error);
      console.log('Falling back to sample data...');
      return {
        data: leadsData.slice(offset, offset + limit),
        totalCount: leadsData.length
      };
    }

    console.log(`Raw data from Supabase page ${page}:`, data);
    console.log(`Total count: ${count}, Page data: ${data?.length || 0}`);

    // Transform data untuk kompatibilitas dengan komponen yang ada
    const transformedData = data.map(lead => {
      // Tentukan interest berdasarkan data yang tersedia
      let interest = '-';
      if (lead.umrah_seasons?.name) {
        interest = lead.umrah_seasons.name;
      } else if (lead.umrah_categories?.name) {
        interest = lead.umrah_categories.name;
      } else if (lead.destinations?.name) {
        interest = lead.destinations.name;
      } else if (lead.package_types?.name) {
        interest = lead.package_types.name;
      }

      return {
        id: lead.id,
        name: lead.full_name || lead.title || 'Nama tidak tersedia',
        email: '-', // Email tidak ada di tabel leads
        phone: lead.phone || '-',
        branch: lead.branches?.name || '-',
        interest: interest,
        date: new Date(lead.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        avatar: getInitials(lead.full_name || lead.title || 'NA'),
        address: '-', // Address tidak ada di tabel leads
        source: lead.category || '-',
        budget: '-', // Budget tidak ada di tabel leads
        timeline: '-', // Timeline tidak ada di tabel leads
        consultant: '-', // Consultant tidak ada di tabel leads
        notes: '-', // Notes tidak ada di tabel leads
        // Tambahan field untuk detail
        seasonDestination: interest,
        packageType: lead.package_types?.name || '-',
        destination: lead.destinations?.name || '-',
        outboundDate: lead.outbound_dates ? 
          `${lead.outbound_dates.start_date} - ${lead.outbound_dates.end_date}` : '-'
      };
    });

    return {
      data: transformedData,
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error in fetchLeadsDataPaginated:', error);
    console.log('Falling back to sample data...');
    const offset = (page - 1) * limit;
    return {
      data: leadsData.slice(offset, offset + limit),
      totalCount: leadsData.length
    };
  }
}

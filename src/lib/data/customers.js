import { supabase } from '$lib/supabase.js';

// Fungsi helper untuk mendapatkan inisial nama
export function getInitials(name) {
  if (!name) return 'NA';
  return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

// Fungsi untuk mendapatkan warna package
export function getPackageColor(packageType) {
  switch (packageType?.toLowerCase()) {
    case 'umrah':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'pelancongan':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Fungsi untuk filter data
export function filterCustomers(customers, filters) {
  return customers.filter(customer => {
    if (filters.package && customer.package !== filters.package) return false;
    if (filters.branch && customer.branch !== filters.branch) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm)
      );
    }
    return true;
  });
}

// Fungsi untuk mengambil data pelanggan dari Supabase
export async function fetchCustomersData() {
  try {
    // Ambil data bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
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
        jenis_pelancongan,
        age,
        birth_date,
        created_at,
        branch_id,
        destination_id,
        package_id,
        consultant_id,
        umrah_season_id,
        umrah_category_id,
        is_from_inquiry
      `)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return [];
    }

    // Ambil data branches
    const { data: branchesData, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');

    if (branchesError) {
      console.error('Error fetching branches:', branchesError);
    }

    // Ambil data package types
    const { data: packageTypesData, error: packageTypesError } = await supabase
      .from('package_types')
      .select('id, name');

    if (packageTypesError) {
      console.error('Error fetching package types:', packageTypesError);
    }

    // Ambil data destinations
    const { data: destinationsData, error: destinationsError } = await supabase
      .from('destinations')
      .select('id, name');

    if (destinationsError) {
      console.error('Error fetching destinations:', destinationsError);
    }

    // Ambil data umrah seasons
    const { data: umrahSeasonsData, error: umrahSeasonsError } = await supabase
      .from('umrah_seasons')
      .select('id, name');

    if (umrahSeasonsError) {
      console.error('Error fetching umrah seasons:', umrahSeasonsError);
    }

    // Ambil data umrah categories
    const { data: umrahCategoriesData, error: umrahCategoriesError } = await supabase
      .from('umrah_categories')
      .select('id, name');

    if (umrahCategoriesError) {
      console.error('Error fetching umrah categories:', umrahCategoriesError);
    }

    // Ambil data sales consultant
    const { data: salesConsultantData, error: salesConsultantError } = await supabase
      .from('sales_consultant')
      .select('id, name');

    if (salesConsultantError) {
      console.error('Error fetching sales consultant:', salesConsultantError);
    }

    // Buat map untuk lookup yang lebih cepat
    const branchesMap = new Map(branchesData?.map(b => [b.id, b.name]) || []);
    const packageTypesMap = new Map(packageTypesData?.map(p => [p.id, p.name]) || []);
    const destinationsMap = new Map(destinationsData?.map(d => [d.id, d.name]) || []);
    const umrahSeasonsMap = new Map(umrahSeasonsData?.map(u => [u.id, u.name]) || []);
    const umrahCategoriesMap = new Map(umrahCategoriesData?.map(u => [u.id, u.name]) || []);
    const salesConsultantMap = new Map(salesConsultantData?.map(s => [s.id, s.name]) || []);

    // Transform data untuk kompatibilitas dengan komponen yang ada
    return bookingsData.map(booking => {
      // Tentukan apakah ini pakej Umrah atau Pelancongan
      const packageName = packageTypesMap.get(booking.package_id);
      const destinationName = destinationsMap.get(booking.destination_id);
      const isUmrah = packageName === 'Umrah' || 
                     (destinationName && (destinationName.toLowerCase().includes('makkah') || destinationName.toLowerCase().includes('madinah')));
      
      // Tampilkan musim umrah jika pakej umrah, destinasi jika pakej pelancongan
      let seasonDestination = '-';
      if (isUmrah) {
        const umrahSeasonName = umrahSeasonsMap.get(booking.umrah_season_id);
        const umrahCategoryName = umrahCategoriesMap.get(booking.umrah_category_id);
        if (umrahSeasonName) {
          seasonDestination = umrahSeasonName;
        } else if (umrahCategoryName) {
          seasonDestination = umrahCategoryName;
        } else {
          seasonDestination = 'Umrah Standard';
        }
      } else {
        seasonDestination = destinationName || '-';
      }

      // Format tanggal lahir
      let formattedBirthDate = '-';
      if (booking.birth_date) {
        formattedBirthDate = new Date(booking.birth_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      return {
        id: booking.id,
        name: `${booking.gelaran || ''} ${booking.nama}`.trim(),
        email: booking.email,
        phone: booking.telefon,
        branch: branchesMap.get(booking.branch_id) || '-',
        package: packageName || (isUmrah ? 'Umrah' : 'Pelancongan'),
        category: seasonDestination,
        price: booking.bilangan ? `${booking.bilangan} pax` : '-',
        total_price: booking.total_price || '-',
        date: new Date(booking.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        avatar: getInitials(booking.nama),
        consultant: salesConsultantMap.get(booking.consultant_id) || '-',
        address: `${booking.alamat || ''}, ${booking.poskod || ''} ${booking.bandar || ''}, ${booking.negeri || ''}`.replace(/^[, ]+|[, ]+$/g, ''),
        nokp: booking.nokp,
        jenis_pelancongan: booking.jenis_pelancongan,
        age: booking.age || '-',
        birth_date: formattedBirthDate,
        from_inquiry: booking.is_from_inquiry || false,
        // Tambahkan field khusus untuk musim/destinasi
        seasonDestination: seasonDestination
      };
    });
  } catch (error) {
    console.error('Error in fetchCustomersData:', error);
    return [];
  }
}

// Fungsi untuk mengambil data pelanggan berdasarkan branch tertentu
export async function fetchCustomersDataByBranch(branchName) {
  try {
    console.log('Fetching customers for branch:', branchName);
    
    // Ambil data branches dulu untuk mendapatkan branch_id
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('name', branchName)
      .single();

    if (branchError || !branchData) {
      console.error('Error fetching branch:', branchError);
      return [];
    }

    // Ambil data bookings berdasarkan branch_id
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
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
        jenis_pelancongan,
        age,
        birth_date,
        created_at,
        branch_id,
        destination_id,
        package_id,
        consultant_id,
        umrah_season_id,
        umrah_category_id,
        is_from_inquiry
      `)
      .eq('branch_id', branchData.id)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching customers by branch:', bookingsError);
      return [];
    }

    console.log('Raw data from Supabase for branch:', branchName, bookingsData);
    console.log('Number of bookings found:', bookingsData?.length || 0);

    // Ambil data untuk join
    const { data: packageTypesData } = await supabase
      .from('package_types')
      .select('id, name');

    const { data: destinationsData } = await supabase
      .from('destinations')
      .select('id, name');

    const { data: umrahSeasonsData } = await supabase
      .from('umrah_seasons')
      .select('id, name');

    const { data: umrahCategoriesData } = await supabase
      .from('umrah_categories')
      .select('id, name');

    const { data: salesConsultantData } = await supabase
      .from('sales_consultant')
      .select('id, name');

    // Buat map untuk lookup yang lebih cepat
    const packageTypesMap = new Map(packageTypesData?.map(p => [p.id, p.name]) || []);
    const destinationsMap = new Map(destinationsData?.map(d => [d.id, d.name]) || []);
    const umrahSeasonsMap = new Map(umrahSeasonsData?.map(u => [u.id, u.name]) || []);
    const umrahCategoriesMap = new Map(umrahCategoriesData?.map(u => [u.id, u.name]) || []);
    const salesConsultantMap = new Map(salesConsultantData?.map(s => [s.id, s.name]) || []);

    // Transform data untuk kompatibilitas dengan komponen yang ada
    return bookingsData.map(booking => {
      // Tentukan apakah ini pakej Umrah atau Pelancongan
      const packageName = packageTypesMap.get(booking.package_id);
      const destinationName = destinationsMap.get(booking.destination_id);
      const isUmrah = packageName === 'Umrah' || 
                     (destinationName && (destinationName.toLowerCase().includes('makkah') || destinationName.toLowerCase().includes('madinah')));
      
      // Tampilkan musim umrah jika paket umrah, destinasi jika paket pelancongan
      let seasonDestination = '-';
      if (isUmrah) {
        const umrahSeasonName = umrahSeasonsMap.get(booking.umrah_season_id);
        const umrahCategoryName = umrahCategoriesMap.get(booking.umrah_category_id);
        if (umrahSeasonName) {
          seasonDestination = umrahSeasonName;
        } else if (umrahCategoryName) {
          seasonDestination = umrahCategoryName;
        } else {
          seasonDestination = 'Umrah Standard';
        }
      } else {
        seasonDestination = destinationName || '-';
      }

      // Format tanggal lahir
      let formattedBirthDate = '-';
      if (booking.birth_date) {
        formattedBirthDate = new Date(booking.birth_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      return {
        id: booking.id,
        name: `${booking.gelaran || ''} ${booking.nama}`.trim(),
        email: booking.email,
        phone: booking.telefon,
        branch: branchData.name,
        package: packageName || (isUmrah ? 'Umrah' : 'Pelancongan'),
        category: seasonDestination,
        price: booking.bilangan ? `${booking.bilangan} pax` : '-',
        total_price: booking.total_price || '-',
        date: new Date(booking.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        avatar: getInitials(booking.nama),
        consultant: salesConsultantMap.get(booking.consultant_id) || '-',
        address: `${booking.alamat || ''}, ${booking.poskod || ''} ${booking.bandar || ''}, ${booking.negeri || ''}`.replace(/^[, ]+|[, ]+$/g, ''),
        nokp: booking.nokp,
        jenis_pelancongan: booking.jenis_pelancongan,
        age: booking.age || '-',
        birth_date: formattedBirthDate,
        from_inquiry: booking.is_from_inquiry || false,
        // Tambahkan field khusus untuk musim/destinasi
        seasonDestination: seasonDestination
      };
    });
  } catch (error) {
    console.error('Error in fetchCustomersDataByBranch:', error);
    return [];
  }
}

// Fungsi untuk mengambil data pelanggan dari Supabase dengan pagination
export async function fetchCustomersDataPaginated(page = 1, limit = 10, filters = {}) {
  try {
    console.log(`Fetching customers page ${page} with limit ${limit} and filters:`, filters);
    
    // Hitung offset untuk pagination
    const offset = (page - 1) * limit;
    
    // Base query dengan join yang tepat
    let query = supabase
      .from('bookings')
      .select(`
        id,
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
        jenis_pelancongan,
        age,
        birth_date,
        created_at,
        updated_at,
        is_from_inquiry,
        branch_id,
        package_id,
        destination_id,
        umrah_season_id,
        umrah_category_id,
        consultant_id,
        branches(name),
        package_types(name),
        destinations(name),
        umrah_seasons(name),
        umrah_categories(name),
        sales_consultant(name)
      `, { count: 'exact' });
    
    // Apply filters
    if (filters.search) {
      query = query.or(`nama.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    if (filters.package) {
      query = query.eq('package_types.name', filters.package);
    }
    
    if (filters.branch) {
      query = query.eq('branches.name', filters.branch);
    }
    
    if (filters.inquiry !== '') {
      const isFromInquiry = filters.inquiry === 'true';
      query = query.eq('is_from_inquiry', isFromInquiry);
    }
    
    // Apply pagination dan ordering
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers from Supabase:', error);
      throw error;
    }

    console.log(`Raw data from Supabase page ${page}:`, data);
    console.log(`Total count: ${count}, Page data: ${data?.length || 0}`);

    // Transform data untuk kompatibilitas dengan komponen yang ada
    const transformedData = data.map(booking => {
      // Tentukan package type
      const packageName = booking.package_types?.name || 'Tidak Diketahui';
      
      // Tentukan musim/destinasi berdasarkan jenis package
      let seasonDestination = '-';
      if (packageName === 'Umrah') {
        // Untuk Umrah, gunakan musim umrah atau kategori umrah
        seasonDestination = booking.umrah_seasons?.name || 
                          booking.umrah_categories?.name || 
                          'Umrah Standard';
      } else {
        // Untuk Pelancongan, gunakan nama destinasi
        seasonDestination = booking.destinations?.name || '-';
      }

      // Format tanggal lahir
      let formattedBirthDate = '-';
      if (booking.birth_date) {
        formattedBirthDate = new Date(booking.birth_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      return {
        id: booking.id,
        name: `${booking.gelaran || ''} ${booking.nama}`.trim(),
        email: booking.email || '-',
        phone: booking.telefon || '-',
        address: `${booking.alamat || ''}, ${booking.poskod || ''} ${booking.bandar || ''}, ${booking.negeri || ''}`.replace(/^[, ]+|[, ]+$/g, '') || '-',
        branch: booking.branches?.name || 'Tidak Diketahui',
        package: packageName,
        seasonDestination: seasonDestination,
        category: seasonDestination, // Untuk backward compatibility
        price: booking.bilangan ? `${booking.bilangan} pax` : '-',
        total_price: booking.total_price || '-',
        date: new Date(booking.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        avatar: getInitials(booking.nama || 'NA'),
        consultant: booking.sales_consultant?.name || '-',
        nokp: booking.nokp || '-',
        jenis_pelancongan: booking.jenis_pelancongan || '-',
        age: booking.age || '-',
        birth_date: formattedBirthDate,
        from_inquiry: booking.is_from_inquiry || false
      };
    });

    return {
      data: transformedData,
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error in fetchCustomersDataPaginated:', error);
    throw error;
  }
}

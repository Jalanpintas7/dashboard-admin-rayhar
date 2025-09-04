import { supabase } from '$lib/supabase.js';
import { formatDateMalaysia } from '$lib/date-helpers.js';

// Fungsi helper untuk mendapatkan inisial nama
export function getInitials(name) {
  if (!name) return 'NA';
  return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

// Fungsi untuk mendapatkan warna package dengan opacity dari primary color
export function getPackageColor(packageType) {
  switch (packageType?.toLowerCase()) {
    case 'umrah':
      return 'bg-[rgba(148,35,146,0.1)] text-[rgb(148,35,146)] border-[rgba(148,35,146,0.2)]';
    case 'pelancongan':
    case 'outbound':
      return 'bg-[rgba(148,35,146,0.15)] text-[rgb(148,35,146)] border-[rgba(148,35,146,0.25)]';
    default:
      return 'bg-[rgba(148,35,146,0.08)] text-[rgb(148,35,146)] border-[rgba(148,35,146,0.15)]';
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
        // jenis_pelancongan field tidak ada di tabel, akan dihitung berdasarkan data yang ada
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
      // Tentukan apakah ini pakej Umrah atau Pelancongan berdasarkan data yang ada
      const isUmrah = booking.umrah_season_id !== null || booking.umrah_category_id !== null;
      const isOutbound = booking.destination_id !== null || booking.outbound_date_id !== null;
      
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
      } else if (isOutbound) {
        seasonDestination = destinationsMap.get(booking.destination_id) || '-';
      }

      // Format tanggal lahir
      let formattedBirthDate = '-';
      if (booking.birth_date) {
        formattedBirthDate = formatDateMalaysia(booking.birth_date);
      }

      return {
        id: booking.id,
        name: `${booking.gelaran || ''} ${booking.nama}`.trim(),
        email: booking.email,
        phone: booking.telefon,
        branch: branchesMap.get(booking.branch_id) || '-',
        package: isUmrah ? 'Umrah' : (isOutbound ? 'Outbound' : 'Tidak Diketahui'),
        category: seasonDestination,
        price: booking.bilangan ? `${booking.bilangan} pax` : '-',
        total_price: booking.total_price || '-',
        date: formatDateMalaysia(booking.created_at),
        avatar: getInitials(booking.nama),
        consultant: salesConsultantMap.get(booking.consultant_id) || '-',
        address: `${booking.alamat || ''}, ${booking.poskod || ''} ${booking.bandar || ''}, ${booking.negeri || ''}`.replace(/^[, ]+|[, ]+$/g, ''),
        nokp: booking.nokp,
        jenis_pelancongan: isUmrah ? 'Umrah' : (isOutbound ? 'Outbound' : '-'),
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
    console.log('=== fetchCustomersDataByBranch START ===');
    console.log('Fetching customers for branch:', branchName);
    
    // Ambil data branches dulu untuk mendapatkan branch_id
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .eq('name', branchName)
      .single();

    console.log('Branch query result:', { branchData, branchError });

    if (branchError || !branchData) {
      console.error('Error fetching branch:', branchError);
      console.error('Branch data:', branchData);
      return [];
    }

    console.log('Branch found:', branchData);

    // Gunakan single query dengan JOIN untuk menghindari multiple database calls
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
        age,
        birth_date,
        created_at,
        branch_id,
        destination_id,
        package_id,
        consultant_id,
        umrah_season_id,
        umrah_category_id,
        is_from_inquiry,
        branches(name),
        package_types(name),
        destinations(name),
        umrah_seasons(name),
        umrah_categories(name),
        sales_consultant(name)
      `)
      .eq('branch_id', branchData.id)
      .order('created_at', { ascending: false });

    console.log('Bookings query result:', { bookingsData, bookingsError });
    console.log('Number of bookings found:', bookingsData?.length || 0);

    if (bookingsError) {
      console.error('Error fetching customers by branch:', bookingsError);
      return [];
    }

    if (!bookingsData || bookingsData.length === 0) {
      console.log('No bookings found for this branch');
      return [];
    }

    console.log('Raw data from Supabase for branch:', branchName, bookingsData);
    console.log('Number of bookings found:', bookingsData?.length || 0);

    // Transform data menggunakan data yang sudah di-JOIN
    const transformedData = bookingsData.map(booking => {
      // Tentukan package type berdasarkan data yang ada
      const isUmrah = booking.umrah_season_id !== null || booking.umrah_category_id !== null;
      const isOutbound = booking.destination_id !== null;
      const packageName = isUmrah ? 'Umrah' : (isOutbound ? 'Outbound' : 'Tidak Diketahui');
      
      // Tentukan musim/destinasi berdasarkan jenis package
      let seasonDestination = '-';
      if (isUmrah) {
        // Untuk Umrah, gunakan musim umrah atau kategori umrah
        seasonDestination = booking.umrah_seasons?.name || 
                          booking.umrah_categories?.name || 
                          'Umrah Standard';
      } else if (isOutbound) {
        // Untuk Outbound, gunakan nama destinasi
        seasonDestination = booking.destinations?.name || '-';
      }

      // Format tanggal lahir
      let formattedBirthDate = '-';
      if (booking.birth_date) {
        formattedBirthDate = formatDateMalaysia(booking.birth_date);
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
        date: formatDateMalaysia(booking.created_at),
        avatar: getInitials(booking.nama || 'NA'),
        consultant: booking.sales_consultant?.name || '-',
        nokp: booking.nokp || '-',
        jenis_pelancongan: (booking.umrah_season_id || booking.umrah_category_id) ? 'Umrah' : (booking.destination_id ? 'Outbound' : '-'),
        age: booking.age || '-',
        birth_date: formattedBirthDate,
        from_inquiry: booking.is_from_inquiry || false
      };
    });

    console.log('Transformed data for branch:', branchName, transformedData);
    console.log('Final transformed data count:', transformedData.length);

    return transformedData;
  } catch (error) {
    console.error('Error in fetchCustomersDataByBranch:', error);
    return [];
  }
}

// Fungsi untuk mengambil data pelanggan dari Supabase dengan pagination menggunakan VIEW
export async function fetchCustomersDataPaginated(page = 1, limit = 10, filters = {}) {
  try {
    console.log(`🚀 Fetching customers page ${page} with limit ${limit} and filters:`, filters);
    console.log('📊 Using customer_data_view for optimized performance');
    
    // Hitung offset untuk pagination
    const offset = (page - 1) * limit;
    
    // Gunakan VIEW customer_data_view untuk performa yang optimal
    let query = supabase
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
      `, { count: 'exact' });
    
    // Apply filters di level database (lebih efisien)
    if (filters.search && filters.search.trim()) {
      query = query.or(`nama.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    if (filters.inquiry !== '' && filters.inquiry !== undefined) {
      const isFromInquiry = filters.inquiry === 'true';
      query = query.eq('is_from_inquiry', isFromInquiry);
    }
    
    if (filters.branch && filters.branch.trim()) {
      query = query.eq('branch_name', filters.branch);
    }
    
    if (filters.package && filters.package.trim()) {
      query = query.eq('package_type', filters.package);
    }
    
    if (filters.consultant && filters.consultant.trim()) {
      query = query.eq('consultant_name', filters.consultant);
    }
    
    // Apply pagination dan ordering
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customers from view:', error);
      throw error;
    }

    console.log(`✅ Raw data from customer_data_view page ${page}:`, data);
    console.log(`📈 Total count: ${count}, Page data: ${data?.length || 0}`);

    // Transform data dari view (sudah ter-optimasi)
    const transformedData = data.map(customer => {
      return {
        id: customer.id,
        name: customer.full_name,
        email: customer.email || '-',
        phone: customer.telefon || '-',
        address: customer.full_address || '-',
        branch: customer.branch_name || 'Tidak Diketahui',
        package: customer.package_type,
        seasonDestination: customer.season_destination,
        category: customer.season_destination, // Untuk backward compatibility
        price: customer.bilangan ? `${customer.bilangan} pax` : '-',
        total_price: customer.total_price || '-',
        date: customer.formatted_date,
        avatar: customer.avatar_initials,
        consultant: customer.consultant_name || '-',
        nokp: customer.nokp || '-',
        jenis_pelancongan: customer.package_type,
        age: customer.age || '-',
        birth_date: customer.formatted_birth_date || '-',
        from_inquiry: customer.is_from_inquiry || false
      };
    });

    // console.log('🎯 Transformed data from view:', transformedData);
    // console.log('📊 Final data count:', transformedData.length);

    return {
      data: transformedData,
      totalCount: count || 0
    };
  } catch (error) {
    console.error('❌ Error in fetchCustomersDataPaginated:', error);
    throw error;
  }
}

// Fungsi test untuk memverifikasi koneksi Supabase
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabase.supabaseUrl);
    console.log('Supabase client:', supabase);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('id, nama')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful:', data);
    return true;
  } catch (err) {
    console.error('Supabase connection test error:', err);
    return false;
  }
}

// Fungsi test untuk memverifikasi fetchCustomersDataPaginated
export async function testFetchCustomersDataPaginated() {
  try {
    console.log('Testing fetchCustomersDataPaginated...');
    
    const result = await fetchCustomersDataPaginated(1, 5, {});
    
    console.log('Test result:', result);
    console.log('Data count:', result.data?.length || 0);
    console.log('Total count:', result.totalCount);
    
    if (result.data && result.data.length > 0) {
      console.log('First customer:', result.data[0]);
      return true;
    } else {
      console.log('No data returned');
      return false;
    }
  } catch (err) {
    console.error('Test failed:', err);
    return false;
  }
}

// Fungsi test untuk memeriksa data umrah
export async function testUmrahData() {
  try {
    console.log('Testing Umrah data...');
    
    // Test 1: Cek data bookings dengan umrah_season_id
    const { data: umrahSeasonBookings, error: umrahSeasonError } = await supabase
      .from('bookings')
      .select('id, nama, umrah_season_id, umrah_category_id, destination_id')
      .not('umrah_season_id', 'is', null)
      .limit(5);
    
    if (umrahSeasonError) {
      console.error('Error fetching umrah season bookings:', umrahSeasonError);
    } else {
      console.log('Bookings with umrah_season_id:', umrahSeasonBookings);
    }
    
    // Test 2: Cek data bookings dengan umrah_category_id
    const { data: umrahCategoryBookings, error: umrahCategoryError } = await supabase
      .from('bookings')
      .select('id, nama, umrah_season_id, umrah_category_id, destination_id')
      .not('umrah_category_id', 'is', null)
      .limit(5);
    
    if (umrahCategoryError) {
      console.error('Error fetching umrah category bookings:', umrahCategoryError);
    } else {
      console.log('Bookings with umrah_category_id:', umrahCategoryBookings);
    }
    
    // Test 3: Cek semua data bookings
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select('id, nama, umrah_season_id, umrah_category_id, destination_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allBookingsError) {
      console.error('Error fetching all bookings:', allBookingsError);
    } else {
      console.log('All bookings sample:', allBookings);
      
      // Analisis data
      const umrahCount = allBookings.filter(b => b.umrah_season_id || b.umrah_category_id).length;
      const outboundCount = allBookings.filter(b => b.destination_id).length;
      const unknownCount = allBookings.filter(b => !b.umrah_season_id && !b.umrah_category_id && !b.destination_id).length;
      
      console.log('Data analysis:');
      console.log('- Umrah bookings:', umrahCount);
      console.log('- Outbound bookings:', outboundCount);
      console.log('- Unknown type:', unknownCount);
      console.log('- Total sample:', allBookings.length);
    }
    
    // Test 4: Cek tabel umrah_seasons
    const { data: umrahSeasons, error: umrahSeasonsError } = await supabase
      .from('umrah_seasons')
      .select('id, name')
      .limit(5);
    
    if (umrahSeasonsError) {
      console.error('Error fetching umrah seasons:', umrahSeasonsError);
    } else {
      console.log('Umrah seasons:', umrahSeasons);
    }
    
    // Test 5: Cek tabel umrah_categories
    const { data: umrahCategories, error: umrahCategoriesError } = await supabase
      .from('umrah_categories')
      .select('id, name')
      .limit(5);
    
    if (umrahCategoriesError) {
      console.error('Error fetching umrah categories:', umrahCategoriesError);
    } else {
      console.log('Umrah categories:', umrahCategories);
    }
    
    return true;
  } catch (err) {
    console.error('Test Umrah data failed:', err);
    return false;
  }
}

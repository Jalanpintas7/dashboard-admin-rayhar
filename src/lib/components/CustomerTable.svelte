<script>
  import { onMount } from 'svelte';
  import { fetchCustomersDataPaginated, getInitials, getPackageColor } from '$lib/data/customers.js';
  import { supabase } from '$lib/supabase.js';
  import { Loader2, AlertTriangle, Users, X, Phone, Mail, MapPin, Calendar, User, Building, Package, Globe, Hash, FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-svelte';
  import { 
    generateCacheKey, 
    saveToLocalStorage, 
    getFromLocalStorage, 
    invalidateCachePattern,
    getCacheStats 
  } from '$lib/cache-utils.js';
  
  // State untuk data
  let customersData = [];
  let loading = true;
  let error = null;
  
  // State untuk pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalCount = 0; // Total data dari Supabase
  
  // State untuk filter
  let searchTerm = '';
  let packageFilter = '';
  let branchFilter = '';
  let inquiryFilter = '';
  let consultantFilter = '';
  
  // State untuk modal detail
  let selectedCustomer = null;
  let showDetailModal = false;
  
  // State untuk filter options (tidak terpengaruh oleh filter yang aktif)
  let allPackages = [];
  let allBranches = [];
  let allConsultants = [];
  
  // Cache system untuk mengoptimalkan fetch
  let dataCache = new Map(); // Cache untuk data per halaman (memory cache)
  let filterCache = new Map(); // Cache untuk hasil filter
  let lastFetchTime = 0;
  let isInitialLoad = true;
  let cacheExpiryTime = 10 * 60 * 1000; // 10 menit cache expiry
  
  // Cache statistics
  let cacheStats = null;
  
  // Debounce untuk filter
  let filterTimeout;
  let refreshInterval;
  
  // Load data saat komponen dimount
  onMount(async () => {
    console.log('CustomerTable component mounted');
    
    // Initialize cache statistics
    updateCacheStats();
    
    // Test koneksi Supabase
    try {
      const { data, error: supabaseError } = await supabase
        .from('bookings')
        .select('id, nama')
        .limit(1);
      
      if (supabaseError) {
        console.error('Supabase connection test failed:', supabaseError);
        error = 'Gagal terhubung ke database';
      } else {
        console.log('Supabase connection test successful:', data);
        
        // Load filter options terlebih dahulu
        await loadFilterOptions();
        
        // Load data dengan cache system
        await loadPageData(1);
        
        // Setup auto-refresh yang lebih smart (setiap 10 menit, bukan 5 menit)
        setupAutoRefresh();
        
        // Log cache performance
        console.log('🚀 Cache system initialized successfully');
        console.log('📊 Initial cache stats:', cacheStats);
      }
    } catch (err) {
      console.error('Error testing Supabase connection:', err);
      error = 'Gagal terhubung ke database';
    }
    
    // Cleanup saat komponen unmount
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (filterTimeout) clearTimeout(filterTimeout);
    };
  });
  
  // Load filter options secara terpisah (tidak terpengaruh oleh filter yang aktif)
  async function loadFilterOptions() {
    try {
      console.log('🔍 Loading filter options...');
      
      // Ambil semua package types yang tersedia
      const { data: packageTypes, error: packageError } = await supabase
        .from('package_types')
        .select('name')
        .order('name');
      
      if (packageError) {
        console.error('Error fetching package types:', packageError);
      } else {
        allPackages = packageTypes.map(p => p.name).filter(Boolean);
        console.log('📦 Available packages:', allPackages);
      }
      
      // Ambil semua branches yang tersedia
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('name')
        .order('name');
      
      if (branchError) {
        console.error('Error fetching branches:', branchError);
      } else {
        allBranches = branches.map(b => b.name).filter(Boolean);
      }
      
      // Tambahkan opsi "Umrah" dan "Outbound" jika tidak ada di package_types
      if (!allPackages.includes('Umrah')) {
        allPackages.unshift('Umrah');
      }
      if (!allPackages.includes('Outbound')) {
        allPackages.push('Outbound');
      }
      
      // Hapus pilihan "Haji" dan "Pelancongan" jika ada
      allPackages = allPackages.filter(pkg => !['Haji', 'Pelancongan'].includes(pkg));
      
      // Ambil semua sales consultant yang tersedia
      const { data: consultants, error: consultantError } = await supabase
        .from('sales_consultant')
        .select('name')
        .order('name');
      
      if (consultantError) {
        console.error('Error fetching sales consultants:', consultantError);
      } else {
        allConsultants = consultants.map(c => c.name).filter(Boolean);
        console.log('👨‍💼 Available consultants:', allConsultants);
      }
      
      console.log('✅ Filter options loaded successfully');
      console.log('📦 Final allPackages:', allPackages);
      console.log('🏢 Final allBranches:', allBranches);
      
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  }
  
  // Setup auto-refresh yang smart dengan cache validation
  function setupAutoRefresh() {
    refreshInterval = setInterval(async () => {
      // Hanya refresh jika cache sudah expired atau ada perubahan data
      if (Date.now() - lastFetchTime > cacheExpiryTime) {
        await checkForDataChanges();
      }
    }, 10 * 60 * 1000); // 10 menit
  }
  
  // Update cache statistics
  function updateCacheStats() {
    cacheStats = getCacheStats();
    console.log('📊 Cache Statistics:', cacheStats);
  }
  
  // Clear cache untuk data tertentu
  async function clearCustomerCache() {
    // Clear memory cache
    dataCache.clear();
    filterCache.clear();
    
    // Clear local storage cache untuk customers
    invalidateCachePattern('customers');
    
    console.log('🧹 Customer cache cleared');
    updateCacheStats();
    
    // Reload current page
    await loadPageData(currentPage, {
      search: searchTerm,
      package: packageFilter,
      branch: branchFilter,
      inquiry: inquiryFilter,
      consultant: consultantFilter
    });
  }
  
  // Force refresh data (bypass cache)
  async function forceRefreshData() {
    console.log('🔄 Force refreshing data...');
    
    // Clear cache untuk current page
    const filterString = JSON.stringify({
      search: searchTerm,
      package: packageFilter,
      branch: branchFilter,
      inquiry: inquiryFilter,
      consultant: consultantFilter
    });
    
    const localCacheKey = generateCacheKey('customers', `page_${currentPage}_filters_${filterString}`);
    const memoryCacheKey = `${currentPage}_${filterString}`;
    
    // Remove from both caches
    dataCache.delete(memoryCacheKey);
    removeFromCache(localCacheKey);
    
    // Reload data
    await loadPageData(currentPage, {
      search: searchTerm,
      package: packageFilter,
      branch: branchFilter,
      inquiry: inquiryFilter,
      consultant: consultantFilter
    });
  }
  
  // Check apakah ada perubahan data baru dengan lebih efisien
  async function checkForDataChanges() {
    try {
      // Hanya cek timestamp terakhir, tidak perlu fetch semua data
      const { data, error } = await supabase
        .from('bookings')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (!error && data.length > 0) {
        const latestUpdate = new Date(data[0].updated_at).getTime();
        if (latestUpdate > lastFetchTime) {
          console.log('Data baru terdeteksi, refreshing...');
          await refreshData();
        }
      }
    } catch (err) {
      console.error('Error checking for data changes:', err);
    }
  }
  
  // Refresh data dengan cache invalidation yang lebih smart
  async function refreshData() {
    // Clear cache yang expired
    const now = Date.now();
    for (const [key, value] of dataCache.entries()) {
      if (now - value.timestamp > cacheExpiryTime) {
        dataCache.delete(key);
      }
    }
    
    // Reload current page
    await loadPageData(currentPage, {
      search: searchTerm,
      package: packageFilter,
      branch: branchFilter,
      inquiry: inquiryFilter,
      consultant: consultantFilter
    });
    
    lastFetchTime = Date.now();
  }
  
  // Fungsi untuk load data per halaman dengan local storage cache
  async function loadPageData(page, filters = {}) {
    const filterString = JSON.stringify(filters);
    const localCacheKey = generateCacheKey('customers', `page_${page}_filters_${filterString}`);
    const memoryCacheKey = `${page}_${filterString}`;
    
    console.log(`🔍 Loading data for page ${page} with filters:`, filters);
    
    // 1. Check local storage cache first (persistent cache)
    const localCachedData = getFromLocalStorage(localCacheKey);
    if (localCachedData && !isInitialLoad) {
      console.log(`✅ Data loaded from LOCAL STORAGE cache for page: ${page}`);
      customersData = localCachedData.data;
      totalCount = localCachedData.totalCount;
      currentPage = page;
      loading = false;
      
      // Update memory cache juga
      dataCache.set(memoryCacheKey, {
        ...localCachedData,
        timestamp: Date.now()
      });
      
      return;
    }
    
    // 2. Check memory cache (temporary cache)
    if (dataCache.has(memoryCacheKey) && !isInitialLoad) {
      const memoryCachedData = dataCache.get(memoryCacheKey);
      const now = Date.now();
      
      if (now - memoryCachedData.timestamp < cacheExpiryTime) {
        console.log(`✅ Data loaded from MEMORY cache for page: ${page}`);
        customersData = memoryCachedData.data;
        totalCount = memoryCachedData.totalCount;
        currentPage = page;
        loading = false;
        return;
      } else {
        // Remove expired memory cache
        dataCache.delete(memoryCacheKey);
      }
    }
    
    // 3. Cache miss - fetch dari database
    console.log(`🔄 Cache miss for page ${page}, fetching from database...`);
    
    try {
      loading = true;
      const startTime = Date.now();
      
      const result = await fetchCustomersDataPaginated(page, itemsPerPage, filters);
      
      const fetchTime = Date.now() - startTime;
      console.log(`⚡ Database fetch completed in ${fetchTime}ms`);
      
      // Store in both caches
      const cacheData = {
        ...result,
        timestamp: Date.now()
      };
      
      // Memory cache (fast access)
      dataCache.set(memoryCacheKey, cacheData);
      
      // Local storage cache (persistent)
      saveToLocalStorage(localCacheKey, cacheData, cacheExpiryTime);
      
      // Update component state
      customersData = result.data;
      totalCount = result.totalCount;
      currentPage = page;
      lastFetchTime = Date.now();
      
      // Mark as not initial load after first successful fetch
      if (isInitialLoad) isInitialLoad = false;
      
      // Update cache statistics
      updateCacheStats();
      
    } catch (err) {
      error = 'Gagal memuat data pelanggan';
      console.error('Error loading customers:', err);
    } finally {
      loading = false;
    }
  }
  
  // Load data dengan filter yang di-debounce
  async function loadDataWithFilters() {
    const filters = {
      search: searchTerm,
      package: packageFilter,
      branch: branchFilter,
      inquiry: inquiryFilter,
      consultant: consultantFilter
    };
    
    // Clear cache untuk filter baru
    filterCache.clear();
    
    await loadPageData(1, filters);
  }
  
  // Data yang sudah difilter (server-side filtering sudah diterapkan)
  $: filteredCustomers = customersData;
  
  // Pagination
  $: totalPages = Math.ceil(totalCount / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  
  // Fungsi untuk halaman berikutnya
  async function nextPage() {
    if (currentPage < totalPages) {
      await loadPageData(currentPage + 1, {
        search: searchTerm,
        package: packageFilter,
        branch: branchFilter,
        inquiry: inquiryFilter,
        consultant: consultantFilter
      });
    }
  }
  
  // Fungsi untuk halaman sebelumnya
  async function prevPage() {
    if (currentPage > 1) {
      await loadPageData(currentPage - 1, {
        search: searchTerm,
        package: packageFilter,
        branch: branchFilter,
        inquiry: inquiryFilter,
        consultant: consultantFilter
      });
    }
  }

  // Fungsi untuk pergi ke halaman tertentu
  async function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      await loadPageData(page, {
        search: searchTerm,
        package: packageFilter,
        branch: branchFilter,
        inquiry: inquiryFilter,
        consultant: consultantFilter
      });
    }
  }

  // Generate page numbers for pagination
  function getPageNumbers() {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }
  
  // Fungsi untuk reset filter
  async function resetFilters() {
    searchTerm = '';
    packageFilter = '';
    branchFilter = '';
    inquiryFilter = '';
    consultantFilter = '';
    
    // Clear cache
    dataCache.clear();
    filterCache.clear();
    
    await loadPageData(1);
  }
  
  // Fungsi untuk test data umrah
  async function testUmrahData() {
    try {
      console.log('=== TESTING UMRAH DATA ===');
      
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
      
      console.log('=== END TEST ===');
      
    } catch (err) {
      console.error('Test Umrah data failed:', err);
    }
  }
  
  // Fungsi untuk menampilkan modal detail
  function showCustomerDetail(customer) {
    selectedCustomer = customer;
    showDetailModal = true;
  }
  
  // Fungsi untuk menutup modal
  function closeDetailModal() {
    showDetailModal = false;
    selectedCustomer = null;
  }
  
  // Dapatkan daftar unik untuk filter (dari data yang sudah di-load)
  $: uniquePackages = allPackages.length > 0 ? allPackages : [...new Set(customersData.map(c => c.package).filter(Boolean))];
  $: uniqueBranches = allBranches.length > 0 ? allBranches : [...new Set(customersData.map(c => c.branch).filter(Boolean))];
  
  // Debug logging untuk filter options
  $: {
    console.log('🔍 Filter options update:');
    console.log('  - allPackages:', allPackages);
    console.log('  - allBranches:', allBranches);
    console.log('  - allConsultants:', allConsultants);
    console.log('  - uniquePackages:', uniquePackages);
    console.log('  - uniqueBranches:', uniqueBranches);
  }
  
  // Watch filter changes dan reload data dengan debounce yang dioptimalkan
  $: {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      if (searchTerm || packageFilter || branchFilter || inquiryFilter || consultantFilter) {
        loadDataWithFilters();
      }
    }, 500); // Increased debounce time for better performance
  }
</script>

<div class="bg-white rounded-xl shadow-soft border border-white/60 overflow-hidden">
  <!-- Header Tabel -->
  <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
    <div class="flex items-center justify-between mb-3 sm:mb-4">
      <!-- Refresh Button -->
      <button
        on:click={refreshData}
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        title="Refresh data"
      >
        <RefreshCw class="w-4 h-4 mr-2" />
        Refresh
      </button>
    </div>
    
    <!-- Filter Bar -->
    <div class="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 sm:items-center">
      <!-- Search Input -->
      <div class="flex-1 min-w-0">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari nama..."
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      
      <!-- Package Filter -->
      <select
        bind:value={packageFilter}
        class="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Semua Pakej</option>
        {#each uniquePackages as packageType}
          <option value={packageType}>{packageType}</option>
        {/each}
      </select>
      
      <!-- Branch Filter -->
      <select
        bind:value={branchFilter}
        class="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Semua Cawangan</option>
        {#each uniqueBranches as branch}
          <option value={branch}>{branch}</option>
        {/each}
      </select>

      <!-- Inquiry Filter -->
      <select
        bind:value={inquiryFilter}
        class="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Semua Dari Inquiry</option>
        <option value="true">Ya</option>
        <option value="false">Tidak</option>
      </select>
      
      <!-- Sales Consultant Filter -->
      <select
        bind:value={consultantFilter}
        class="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Semua Consultant</option>
        {#each allConsultants as consultant}
          <option value={consultant}>{consultant}</option>
        {/each}
      </select>
      
      <!-- Reset Button -->
      <button
        on:click={resetFilters}
        class="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Reset
      </button>
    </div>
    
    <!-- Cache Control Section - Hidden from UI but functionality preserved -->
    <!-- 
    <div class="flex flex-wrap items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center gap-2 text-sm text-blue-700">
        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span class="font-medium">Cache System:</span>
      </div>
      
      <div class="text-xs text-blue-600">
        {#if cacheStats}
          <span class="font-medium">{cacheStats.validEntries}</span> valid, 
          <span class="font-medium">{cacheStats.totalSizeKB}KB</span> used
        {:else}
          Initializing...
        {/if}
      </div>
      
      <div class="flex items-center gap-2 ml-auto">
        <button
          on:click={forceRefreshData}
          class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
          title="Force refresh data (bypass cache)"
        >
          <RefreshCw class="w-3 h-3" />
          Refresh
        </button>
        
        <button
          on:click={clearCustomerCache}
          class="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center gap-1"
          title="Clear all customer data cache"
        >
          <X class="w-3 h-3" />
          Clear Cache
        </button>
      </div>
    </div>
    -->
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="p-8 text-center">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-purple-500 hover:bg-purple-400 transition ease-in-out duration-150 cursor-not-allowed">
        <Loader2 class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
        Memuat data pelanggan...
      </div>
    </div>
  {:else if error}
    <div class="p-8 text-center">
      <div class="text-red-600 mb-4">
        <AlertTriangle class="mx-auto h-12 w-12 text-red-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Gagal memuat data</h3>
      <p class="text-gray-500 mb-4">{error}</p>
      <button 
        on:click={() => window.location.reload()}
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  {:else if customersData.length === 0}
    <div class="p-8 text-center">
      <div class="text-gray-400 mb-4">
        <Users class="mx-auto h-12 w-12" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Tidak ada data pelanggan</h3>
      <p class="text-gray-500">Belum ada data pelanggan yang tersedia.</p>
    </div>
  {:else}
    <!-- Tabel -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PELANGGAN
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SALES CONSULTANT
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CAWANGAN
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PAKEJ
            </th>
                        <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              MUSIM/DESTINASI
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DARI INQUIRY
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TOTAL HARGA
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TARIKH
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          {#each filteredCustomers as customer}
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer" on:click={() => showCustomerDetail(customer)}>
              <!-- Kolom PELANGGAN -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                    <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span class="text-xs sm:text-sm font-medium text-purple-600">
                        {customer.avatar}
                      </span>
                    </div>
                  </div>
                  <div class="ml-2 sm:ml-4">
                    <div class="text-xs sm:text-sm font-medium text-gray-900">{customer.name}</div>
                  </div>
                </div>
              </td>
              
              <!-- Kolom SALES CONSULTANT -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">
                  {#if customer.consultant && customer.consultant !== '-'}
                    {customer.consultant}
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </div>
              </td>
              
              <!-- Kolom CAWANGAN -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.branch}</div>
              </td>
              
              <!-- Kolom PAKEJ -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border {getPackageColor(customer.package)}">
                  {customer.package}
                </span>
              </td>
              
              <!-- Kolom MUSIM/DESTINASI -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.seasonDestination || '-'}</div>
              </td>
              
              <!-- Kolom DARI INQUIRY -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">
                  {#if customer.from_inquiry}
                    <span class="text-green-600">✓ Ya</span>
                  {:else}
                    <span class="text-red-600">✗ Tidak</span>
                  {/if}
                </div>
              </td>
              
              <!-- Kolom TOTAL HARGA -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">
                  {#if customer.total_price && customer.total_price !== '-'}
                    <span class="font-semibold text-green-600">RM {parseFloat(customer.total_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </div>
              </td>
              
              <!-- Kolom TARIKH -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.date}</div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
                   <!-- Pagination -->
      {#if totalPages > 1}
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center text-xs sm:text-sm text-gray-700">
              <span>Menampilkan {startIndex + 1} - {Math.min(endIndex, totalCount)} dari {totalCount} data</span>
            </div>
            <div class="flex items-center justify-center sm:justify-end space-x-2">
              <button
                on:click={prevPage}
                disabled={currentPage === 1}
                class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft class="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              
              {#each getPageNumbers() as page}
                {#if page === '...'}
                  <span class="px-2 sm:px-3 py-2 text-gray-400 text-xs sm:text-sm">...</span>
                {:else}
                  <button
                    on:click={() => goToPage(page)}
                    class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}"
                  >
                    {page}
                  </button>
                {/if}
              {/each}
              
              <button
                on:click={nextPage}
                disabled={currentPage === totalPages}
                class="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      {/if}
  {/if}
</div>

<!-- Modal Detail Pelanggan -->
{#if showDetailModal && selectedCustomer}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span class="text-base sm:text-lg font-bold text-purple-600">
              {selectedCustomer.avatar}
            </span>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
            <p class="text-xs sm:text-sm text-gray-500">Detail Lengkap Pelanggan</p>
          </div>
        </div>
        <button
          on:click={closeDetailModal}
          class="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
        </button>
      </div>

      <!-- Content Modal -->
      <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <!-- Informasi Pribadi -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div class="space-y-3 sm:space-y-4">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              Informasi Pribadi
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 sm:gap-3">
                <Mail class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Email</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.email || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 sm:gap-3">
                <Phone class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Telepon</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.phone || '-'}</p>
                </div>
              </div>
              
              {#if selectedCustomer.nokp}
                <div class="flex items-center gap-2 sm:gap-3">
                  <Hash class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">No. KP</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.nokp}</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedCustomer.age && selectedCustomer.age !== '-'}
                <div class="flex items-center gap-2 sm:gap-3">
                  <User class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">Umur</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.age} tahun</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedCustomer.birth_date && selectedCustomer.birth_date !== '-'}
                <div class="flex items-center gap-2 sm:gap-3">
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">Tanggal Lahir</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.birth_date}</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedCustomer.address && selectedCustomer.address !== '-'}
                <div class="flex items-start gap-2 sm:gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">Alamat</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.address}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Informasi Perjalanan -->
          <div class="space-y-3 sm:space-y-4">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Globe class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Informasi Perjalanan
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 sm:gap-3">
                <Building class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Cawangan</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.branch}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 sm:gap-3">
                <Package class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Jenis Pakej</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border {getPackageColor(selectedCustomer.package)}">
                    {selectedCustomer.package}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center gap-2 sm:gap-3">
                <Globe class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Musim/Destinasi</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.seasonDestination || '-'}</p>
                </div>
              </div>
              
                             <div class="flex items-center gap-2 sm:gap-3">
                 <Calendar class="w-4 h-4 text-gray-400" />
                 <div>
                   <p class="text-xs sm:text-sm text-gray-500">Tarikh Daftar</p>
                   <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.date}</p>
                 </div>
               </div>
               
               <div class="flex items-center gap-2 sm:gap-3">
                 <Hash class="w-4 h-4 text-gray-400" />
                 <div>
                   <p class="text-xs sm:text-sm text-gray-500">Dari Inquiry</p>
                   <span class="text-xs sm:text-sm font-medium">
                     {#if selectedCustomer.from_inquiry}
                       <span class="text-green-600">✓ Ya</span>
                     {:else}
                       <span class="text-red-600">✗ Tidak</span>
                     {/if}
                   </span>
                 </div>
               </div>
             </div>
           </div>
         </div>

        <!-- Harga dan Informasi Tambahan -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div class="space-y-3 sm:space-y-4">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText class="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Harga
            </h3>
            
            <div class="space-y-3">
              {#if selectedCustomer.price && selectedCustomer.price !== '-'}
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Bilangan</p>
                  <p class="text-base sm:text-lg font-semibold text-gray-900">{selectedCustomer.price}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.total_price && selectedCustomer.total_price !== '-'}
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Total Harga</p>
                  <p class="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">RM {parseFloat(selectedCustomer.total_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- Informasi Tambahan -->
          <div class="space-y-3 sm:space-y-4">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              Informasi Tambahan
            </h3>
            
            <div class="space-y-3">
              {#if selectedCustomer.consultant && selectedCustomer.consultant !== '-'}
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Sales Consultant</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.consultant}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.jenis_pelancongan && selectedCustomer.jenis_pelancongan !== '-'}
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Jenis Pelancongan</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedCustomer.jenis_pelancongan}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.package}
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Jenis Pakej</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border {getPackageColor(selectedCustomer.package)}">
                    {selectedCustomer.package}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Modal -->
      <div class="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200">
        <button
          on:click={closeDetailModal}
          class="px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

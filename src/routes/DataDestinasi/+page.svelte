<script>
  import RoleGuard from '$lib/components/RoleGuard.svelte';
  import { MapPin, X, Trash2, Edit, Search, ChevronLeft, ChevronRight, Eye, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-svelte';
  import { supabase } from '$lib/supabase.js';
  import { onMount } from 'svelte';
  import { 
    fetchDestinations, 
    fetchOutboundPackages, 
    clearDestinasiCache 
  } from '$lib/umrah-data-helpers.js';
  import { getCacheStats } from '$lib/cache-utils.js';
  
  // State untuk tab yang aktif
  let activeTab = 'destinations';
  
  // State untuk data
  let destinations = [];
  let outboundPackages = [];
  
  // State untuk pencarian
  let searchTerm = '';
  
  // State untuk pagination
  let currentPage = 1;
  const itemsPerPage = 10;
  
  // Loading states
  let isLoading = false;
  let isLoadingMore = false;
  let hasMoreData = true;
  let isInitialLoad = true;
  
  // Error handling
  let error = null;
  
  // Cache system untuk optimasi performa
  let dataCache = new Map(); // Memory cache untuk data yang sedang aktif
  let cacheExpiryTime = 20 * 60 * 1000; // 20 menit untuk data destinasi
  let lastFetchTime = 0;
  
  // Cache statistics
  let cacheStats = null;
  
  // Modal states
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedItem = null;
  let modalType = '';
  
  // Form states
  let addForm = {
    name: '',
    description: '',
    price: ''
  };
  
  let editForm = {
    name: '',
    description: '',
    price: ''
  };
  
  // Computed values untuk pagination dengan lazy loading
  $: totalDestinations = destinations.length;
  $: totalOutboundPackages = outboundPackages.length;
  
  $: totalPagesDestinations = Math.ceil(totalDestinations / itemsPerPage);
  $: totalPagesOutboundPackages = Math.ceil(totalOutboundPackages / itemsPerPage);
  
  $: startIndexDestinations = (currentPage - 1) * itemsPerPage;
  $: endIndexDestinations = startIndexDestinations + itemsPerPage;
  $: startIndexOutboundPackages = (currentPage - 1) * itemsPerPage;
  $: endIndexOutboundPackages = startIndexOutboundPackages + itemsPerPage;
  
  // Lazy loading untuk data yang ditampilkan dengan cache
  $: paginatedDestinations = getPaginatedData('destinations', destinations, startIndexDestinations, endIndexDestinations);
  $: paginatedOutboundPackages = getPaginatedData('outbound_packages', outboundPackages, startIndexOutboundPackages, endIndexOutboundPackages);
  
  // Fallback: jika cache system gagal, gunakan data langsung
  $: fallbackDestinations = paginatedDestinations?.length > 0 ? paginatedDestinations : (destinations?.slice(startIndexDestinations, endIndexDestinations) || []);
  $: fallbackOutboundPackages = paginatedOutboundPackages?.length > 0 ? paginatedOutboundPackages : (outboundPackages?.slice(startIndexOutboundPackages, endIndexOutboundPackages) || []);
  
  // Use fallback data for display
  $: displayDestinations = fallbackDestinations;
  $: displayOutboundPackages = fallbackOutboundPackages;
  
  // Reset pagination when tab changes
  $: if (activeTab) {
    currentPage = 1;
    hasMoreData = true;
  }
  
  // Get current total pages based on active tab
  $: currentTotalPages = activeTab === 'destinations' ? totalPagesDestinations : totalPagesOutboundPackages;
  
  // Cache management functions
  function getPaginatedData(type, data, startIndex, endIndex) {
    // Safety check - jika data kosong atau undefined, return empty array
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`⚠️ ${type}: Data kosong atau undefined`);
      return [];
    }
    
    // Safety check - jika index tidak valid, return empty array
    if (startIndex < 0 || endIndex < 0 || startIndex >= data.length) {
      console.log(`⚠️ ${type}: Index tidak valid - startIndex: ${startIndex}, endIndex: ${endIndex}, dataLength: ${data.length}`);
      return [];
    }
    
    const cacheKey = `${type}_${startIndex}_${endIndex}`;
    
    // Check memory cache first
    if (dataCache.has(cacheKey)) {
      const cached = dataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheExpiryTime) {
        console.log(`✅ ${type}: Cache hit for ${startIndex}-${endIndex}`);
        return cached.data;
      } else {
        console.log(`⏰ ${type}: Cache expired for ${startIndex}-${endIndex}`);
        dataCache.delete(cacheKey);
      }
    }
    
    // Get data and cache it
    const paginatedData = data.slice(startIndex, endIndex);
    console.log(`🔄 ${type}: Cache miss, slicing data ${startIndex}-${endIndex}, result: ${paginatedData.length} items`);
    
    dataCache.set(cacheKey, {
      data: paginatedData,
      timestamp: Date.now()
    });
    
    return paginatedData;
  }
  
  // Update cache statistics
  function updateCacheStats() {
    cacheStats = getCacheStats();
    console.log('📊 Destinasi Data Cache Statistics:', cacheStats);
  }
  
  // Clear cache untuk data tertentu
  async function clearDestinasiDataCache() {
    // Clear memory cache
    dataCache.clear();
    
    // Clear local storage cache untuk destinasi data
    clearDestinasiCache();
    
    console.log('🧹 Destinasi data cache cleared');
    updateCacheStats();
    
    // Force refresh data
    await loadData();
  }
  
  // Force refresh data (bypass cache)
  async function forceRefreshDestinasiData() {
    console.log('🔄 Force refreshing destinasi data...');
    
    // Clear cache untuk current tab
    const cacheKey = `${activeTab}_${startIndexDestinations}_${endIndexDestinations}`;
    dataCache.delete(cacheKey);
    
    // Clear local storage cache
    clearDestinasiCache();
    
    // Refresh data
    await loadData();
  }

  // Load destinations dengan server-side pagination
  async function loadDestinations(page = 1, search = '') {
    try {
      isLoading = true;
      error = null;
      console.log(`🔄 Loading destinations page ${page} with search: "${search}"`);
      
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      let query = supabase
        .from('destinations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      // Tambahkan filter search jika ada
      if (search.trim()) {
        query = query.ilike('name', `%${search}%`);
        console.log(`🔍 Applied search filter: ${search}`);
      }
      
      const { data, error: queryError, count } = await query;
      
      console.log('📊 Destinations query result:', { data, error: queryError, count });
      
      if (queryError) {
        throw queryError;
      }

      destinations = data || [];
      currentPage = page;
      
      console.log(`✅ Destinations loaded: ${destinations.length} items, total count: ${count || 0}`);
    } catch (err) {
      error = err.message;
      console.error('❌ Error loading destinations:', err);
      
      // Fallback: set empty array jika error
      destinations = [];
    } finally {
      isLoading = false;
      console.log('�� Loading completed. Loading state:', isLoading);
    }
  }

  // Load outbound packages dengan server-side pagination
  async function loadOutboundPackages(page = 1, search = '') {
    try {
      isLoading = true;
      error = null;
      console.log(`🔄 Loading outbound packages page ${page} with search: "${search}"`);
      
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      let query = supabase
        .from('outbound_dates')
        .select(`
          *,
          destinations (
            name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      // Tambahkan filter search jika ada
      if (search.trim()) {
        query = query.or(`destinations.name.ilike.%${search}%,price.ilike.%${search}%`);
        console.log(`🔍 Applied search filter: ${search}`);
      }
      
      const { data, error: queryError, count } = await query;
      
      console.log('📊 Outbound packages query result:', { data, error: queryError, count });
      
      if (queryError) {
        throw queryError;
      }

      outboundPackages = data || [];
      currentPage = page;
      
      console.log(`✅ Outbound packages loaded: ${outboundPackages.length} items, total count: ${count || 0}`);
    } catch (err) {
      error = err.message;
      console.error('❌ Error loading outbound packages:', err);
      
      // Fallback: set empty array jika error
      outboundPackages = [];
    } finally {
      isLoading = false;
      console.log('🏁 Loading completed. Loading state:', isLoading);
    }
  }

  // Load data dengan cache system
  async function loadData(page = 1, search = '') {
    console.log(`🔄 Loading data for tab: ${activeTab}, page: ${page}, search: "${search}"`);
    
    // Jika ini adalah initial load, gunakan cache system
    if (isInitialLoad) {
      isLoading = true;
      error = null;
      try {
        console.log('🔄 Loading destinasi data with cache system...');
        const startTime = Date.now();
        
        const [destinationsData, outboundData] = await Promise.all([
          fetchDestinations(),
          fetchOutboundPackages()
        ]);

        const loadTime = Date.now() - startTime;
        console.log(`⚡ Data loaded in ${loadTime}ms`);

        // Simpan data
        destinations = destinationsData || [];
        outboundPackages = outboundData || [];
        
        // Update cache statistics
        updateCacheStats();
        
        console.log('📊 Data loaded successfully:', {
          destinations: destinations?.length || 0,
          outboundPackages: outboundPackages?.length || 0,
          destinationsSample: destinations?.slice(0, 2),
          outboundSample: outboundPackages?.slice(0, 2)
        });
        
        isInitialLoad = false;
        
      } catch (err) {
        error = err.message;
        console.error('Error loading data:', err);
        
        // Fallback: set empty arrays jika error
        destinations = [];
        outboundPackages = [];
      } finally {
        isLoading = false;
      }
    } else {
      // Untuk pagination dan search, gunakan fungsi yang sudah ada
      if (activeTab === 'destinations') {
        await loadDestinations(page, search);
      } else {
        await loadOutboundPackages(page, search);
      }
    }
  }

  // Hapus destinasi
  async function deleteDestination(id) {
    try {
      const { error: deleteError } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Reload data setelah delete
      await loadData(currentPage, searchTerm);
      
      // Show success snackbar
      showSnackbarNotification('success', 'Destinasi berhasil dihapus!');
    } catch (err) {
      error = err.message;
      console.error('Error deleting destination:', err);
      
      // Show error snackbar
      showSnackbarNotification('error', 'Gagal menghapus destinasi!');
    }
  }

  // Hapus pakej outbound
  async function deleteOutboundPackage(id) {
    try {
      const { error: deleteError } = await supabase
        .from('outbound_dates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Reload data setelah delete
      await loadData(currentPage, searchTerm);
      
      // Show success snackbar
      showSnackbarNotification('success', 'Pakej outbound berhasil dihapus!');
    } catch (err) {
      error = err.message;
      console.error('Error deleting outbound package:', err);
      
      // Show error snackbar
      showSnackbarNotification('error', 'Gagal menghapus pakej outbound!');
    }
  }

  // Buka modal edit
  function openEditModal(destination) {
    selectedItem = destination;
    editForm.name = destination.name;
    showEditModal = true;
  }

  // Tutup modal edit
  function closeEditModal() {
    showEditModal = false;
    selectedItem = null;
    editForm.name = '';
  }

  // Show delete confirmation modal
  function showDeleteConfirmation(type, item) {
    modalType = type;
    selectedItem = item;
    showDeleteModal = true;
  }

  // Confirm delete action
  async function confirmDelete() {
    try {
      if (modalType === 'destination') {
        await deleteDestination(selectedItem.id);
      } else if (modalType === 'outbound') {
        await deleteOutboundPackage(selectedItem.id);
      }
      
      // Close modal after delete
      closeDeleteModal();
    } catch (err) {
      console.error('Error in confirmDelete:', err);
    }
  }

  // Close delete modal
  function closeDeleteModal() {
    showDeleteModal = false;
    selectedItem = null;
    modalType = '';
  }

  // Update destinasi
  async function updateDestination() {
    try {
      const { error: updateError } = await supabase
        .from('destinations')
        .update({ name: editForm.name })
        .eq('id', selectedItem.id);

      if (updateError) {
        throw updateError;
      }

      // Reload data setelah update
      await loadData(currentPage, searchTerm);

      closeEditModal();
      
      // Show success snackbar
      showSnackbarNotification('success', 'Destinasi berhasil diperbarui!');
    } catch (err) {
      error = err.message;
      console.error('Error updating destination:', err);
      
      // Show error snackbar
      showSnackbarNotification('error', 'Gagal memperbarui destinasi!');
    }
  }

  // Buka modal edit outbound package
  function openEditOutboundModal(outboundPackage) {
    selectedItem = outboundPackage;
    editForm.start_date = outboundPackage.start_date || '';
    editForm.end_date = outboundPackage.end_date || '';
    editForm.price = outboundPackage.price || '';
    showEditModal = true;
  }

  // Tutup modal edit outbound package
  function closeEditOutboundModal() {
    showEditModal = false;
    selectedItem = null;
    editForm.start_date = '';
    editForm.end_date = '';
    editForm.price = '';
  }

  // Update outbound package
  async function updateOutboundPackage() {
    try {
      const { error: updateError } = await supabase
        .from('outbound_dates')
        .update({
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          price: editForm.price
        })
        .eq('id', selectedItem.id);

      if (updateError) {
        throw updateError;
      }

      // Reload data setelah update
      await loadData(currentPage, searchTerm);

      closeEditOutboundModal();
      
      // Show success snackbar
      showSnackbarNotification('success', 'Pakej outbound berhasil diperbarui!');
    } catch (err) {
      error = err.message;
      console.error('Error updating outbound package:', err);
      
      // Show error snackbar
      showSnackbarNotification('error', 'Gagal memperbarui pakej outbound!');
    }
  }

  // Load data saat komponen mount
  onMount(async () => {
    console.log('🚀 DataDestinasi component mounted with cache system');
    
    // Load data dengan cache system
    await loadData();
    
    // Log cache performance
    console.log('📊 Initial cache stats:', cacheStats);
    console.log('⚡ Cache expiry time:', cacheExpiryTime / 1000, 'seconds');
  });
  
  // Debug data loading
  $: {
    console.log('🔍 Destinasi Data Debug:', {
      destinationsLength: destinations?.length || 0,
      outboundPackagesLength: outboundPackages?.length || 0,
      displayDestinationsLength: displayDestinations?.length || 0,
      displayOutboundPackagesLength: displayOutboundPackages?.length || 0,
      isInitialLoad,
      isLoading,
      error
    });
  }

  // Handle search dengan debounce
  let searchTimeout;
  
  // Manual search handler
  function handleSearch() {
    if (isInitialLoad && searchTerm.trim() !== '') {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadData(1, searchTerm);
      }, 500);
    }
  }

  // Handle tab change - hapus reactive statement
  // Tab change akan handle manual saat user klik tab
  
  // Manual handler untuk tab change
  function handleTabChange(tab) {
    if (tab !== activeTab && !isInitialLoad) {
      activeTab = tab;
      currentPage = 1;
      loadData(1, searchTerm);
    }
  }

  // Hitung statistik
  // $: totalDestinations = totalDestinationsCount; // Removed as per new_code
  // $: totalOutboundPackages = totalOutboundPackagesCount; // Removed as per new_code

  // Computed values untuk pagination
  // $: totalPagesDestinations = Math.ceil(totalDestinationsCount / itemsPerPage); // Removed as per new_code
  // $: totalPagesOutboundPackages = Math.ceil(totalOutboundPackagesCount / itemsPerPage); // Removed as per new_code
  
  // Get current total pages berdasarkan active tab
  // $: currentTotalPages = activeTab === 'destinations' ? totalPagesDestinations : totalPagesOutboundPackages; // Removed as per new_code

  // Pagination functions
  async function goToPage(page) {
    if (page >= 1 && page <= currentTotalPages) {
      await loadData(page, searchTerm);
    }
  }

  async function goToPreviousPage() {
    if (currentPage > 1) {
      await loadData(currentPage - 1, searchTerm);
    }
  }

  async function goToNextPage() {
    if (currentPage < currentTotalPages) {
      await loadData(currentPage + 1, searchTerm);
    }
  }

  // Generate page numbers untuk pagination
  function getPageNumbers() {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (currentTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= currentTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(currentTotalPages);
      } else if (currentPage >= currentTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = currentTotalPages - 3; i <= currentTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(currentTotalPages);
      }
    }
    
    return pages;
  }

  // Format date function
  function formatDate(dateString) {
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

  // Snackbar notification system
  let snackbarMessage = '';
  let snackbarType = 'success';
  let showSnackbar = false;

  function showSnackbarNotification(type, message) {
    snackbarType = type;
    snackbarMessage = message;
    showSnackbar = true;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      showSnackbar = false;
    }, 3000);
  }
</script>

<RoleGuard allowedRoles={['super_admin']} redirectTo="/login">
  <div class="p-2 sm:p-3 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
    <div>
      <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Data Destinasi</h1>
      <p class="text-sm sm:text-base text-slate-600 leading-relaxed">Kelola dan lihat semua data destinasi pelancongan</p>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
        <p class="text-red-700 text-xs sm:text-sm">Error: {error}</p>
      </div>
    {/if}

    <!-- Statistik Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
      <!-- Total Destinasi -->
      <div class="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-white/60">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs sm:text-sm font-medium text-slate-600">Total Destinasi</p>
            <p class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{totalDestinations}</p>
          </div>
          <div class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MapPin class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600" />
          </div>
        </div>
      </div>

              <!-- Total Pakej Outbound -->
      <div class="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-white/60">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs sm:text-sm font-medium text-slate-600">Total Pakej Outbound</p>
            <p class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{totalOutboundPackages}</p>
          </div>
          <div class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <MapPin class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table dengan Pencarian -->
    <div class="bg-white rounded-2xl shadow-soft border border-white/60 overflow-hidden">
     
      <!-- Menu Pencarian dan Filter -->
      <div class="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50">
        <div class="grid grid-cols-1 gap-3 sm:gap-4">
          <!-- Search Input -->
          <div>
            <label for="searchTerm" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">Cari Data</label>
            <div class="relative">
              <Search class="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
              <input
                id="searchTerm"
                type="text"
                bind:value={searchTerm}
                placeholder="Cari destinasi atau pakej outbound..."
                class="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                on:input={handleSearch}
              />
            </div>
          </div>
          
          <!-- Cache Control Section - Hidden from UI but functionality preserved -->
          <!-- 
          <div class="flex flex-wrap items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center gap-2 text-sm text-blue-700">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span class="font-medium">Destinasi Cache:</span>
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
                on:click={forceRefreshDestinasiData}
                class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                title="Force refresh all data (bypass cache)"
              >
                <RefreshCw class="w-3 h-3" />
                Refresh All
              </button>
              
              <button
                on:click={clearDestinasiDataCache}
                class="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center gap-1"
                title="Clear all cache"
              >
                <X class="w-3 h-3" />
                Clear Cache
              </button>
            </div>
          </div>
          -->
        </div>

        <!-- Hasil Pencarian -->
        {#if isLoading}
          <div class="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <div class="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-blue-800 text-xs sm:text-sm">Memuat data...</p>
            </div>
          </div>
        {:else if error}
          <div class="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <AlertTriangle class="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              <p class="text-red-800 text-xs sm:text-sm">Error: {error}</p>
            </div>
          </div>
        {:else if (activeTab === 'destinations' && paginatedDestinations.length === 0) || (activeTab === 'outbound' && paginatedOutboundPackages.length === 0)}
          <div class="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <svg class="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <p class="text-yellow-800 text-xs sm:text-sm">Tidak ada data yang ditemukan dengan filter yang dipilih</p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-slate-100">
        <nav class="flex space-x-4 sm:space-x-8 px-3 sm:px-6">
          <button
            class="py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 {activeTab === 'destinations' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            on:click={() => handleTabChange('destinations')}
          >
            Destinasi ({totalDestinations})
          </button>
          <button
            class="py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 {activeTab === 'outbound' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            on:click={() => handleTabChange('outbound')}
          >
            Pakej Outbound ({totalOutboundPackages})
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-3 sm:p-6">
        {#if isLoading}
          <div class="flex items-center justify-center py-6 sm:py-8 lg:py-12">
            <div class="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 border-b-2 border-yellow-500"></div>
            <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Memuat data...</span>
          </div>
        {:else if activeTab === 'destinations' && displayDestinations.length === 0}
          <div class="text-center py-6 sm:py-8 lg:py-12">
            <div class="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
              <MapPin class="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-slate-400" />
            </div>
            <h3 class="text-sm sm:text-base lg:text-lg font-medium text-slate-900 mb-1 sm:mb-2">Tidak ada data destinasi</h3>
            <p class="text-xs sm:text-sm text-slate-500">Coba ubah filter pencarian Anda</p>
          </div>
        {:else if activeTab === 'outbound' && displayOutboundPackages.length === 0}
          <div class="text-center py-6 sm:py-8 lg:py-12">
            <div class="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
              <MapPin class="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-slate-400" />
            </div>
            <h3 class="text-sm sm:text-base lg:text-lg font-medium text-slate-900 mb-1 sm:mb-2">Tidak ada data pakej outbound</h3>
            <p class="text-xs sm:text-sm text-slate-500">Coba ubah filter pencarian Anda</p>
          </div>
        {:else}
          <!-- Destinations Table -->
          {#if activeTab === 'destinations'}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Destinasi</th>
                    <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dibuat</th>
                    <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-200">
                                      {#each displayDestinations as destination}
                    <tr class="hover:bg-slate-50">
                      <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                            <MapPin class="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                          </div>
                          <div>
                            <div class="text-xs sm:text-sm font-medium text-slate-900">{destination.name}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                        {formatDate(destination.created_at)}
                      </td>
                      <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div class="flex space-x-1.5 sm:space-x-2">
                          <button
                            on:click={() => openEditModal(destination)}
                            class="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit class="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            on:click={() => showDeleteConfirmation('destination', destination)}
                            class="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            <Trash2 class="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <!-- Pagination for Destinations -->
            {#if totalPagesDestinations > 1}
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-4 border-t border-slate-200">
                <div class="flex items-center text-xs sm:text-sm text-slate-700">
                  <span>Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalDestinations)} dari {totalDestinations} data</span>
                </div>
                <div class="flex items-center justify-center sm:justify-end space-x-1.5 sm:space-x-2">
                  <button
                    on:click={goToPreviousPage}
                    disabled={currentPage === 1}
                    class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  
                  {#each getPageNumbers() as page}
                    {#if page === '...'}
                      <span class="px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-400">...</span>
                    {:else}
                      <button
                        on:click={() => goToPage(page)}
                        class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-green-600 text-white' : 'text-slate-700 hover:bg-slate-100'}"
                      >
                        {page}
                      </button>
                    {/if}
                  {/each}
                  
                  <button
                    on:click={goToNextPage}
                    disabled={currentPage === totalPagesDestinations}
                    class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            {/if}
          {/if}

          <!-- Outbound Packages Table -->
          {#if activeTab === 'outbound'}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Destinasi</th>
                    <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Periode</th>
                    <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Harga</th>
                    <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-200">
                                      {#each displayOutboundPackages as outboundPackage}
                    <tr class="hover:bg-slate-50">
                      <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                            <MapPin class="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                          </div>
                          <div>
                            <div class="text-xs sm:text-sm font-medium text-slate-900">
                              {outboundPackage.destinations?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                        <div>
                          <div>{formatDate(outboundPackage.start_date)}</div>
                          <div class="text-xs text-slate-400">s/d {formatDate(outboundPackage.end_date)}</div>
                        </div>
                      </td>
                      <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                        {outboundPackage.price || '-'}
                      </td>
                      <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div class="flex space-x-1.5 sm:space-x-2">
                          <button
                            on:click={() => openEditOutboundModal(outboundPackage)}
                            class="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit class="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            on:click={() => showDeleteConfirmation('outbound', outboundPackage)}
                            class="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            <Trash2 class="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <!-- Pagination for Outbound Packages -->
            {#if totalPagesOutboundPackages > 1}
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-4 border-t border-slate-200">
                <div class="flex items-center text-xs sm:text-sm text-slate-700">
                  <span>Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalOutboundPackages)} dari {totalOutboundPackages} data</span>
                </div>
                <div class="flex items-center justify-center sm:justify-end space-x-1.5 sm:space-x-2">
                  <button
                    on:click={goToPreviousPage}
                    disabled={currentPage === 1}
                    class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  
                  {#each getPageNumbers() as page}
                    {#if page === '...'}
                      <span class="px-2 sm:px-3 py-2 text-xs sm:text-sm text-slate-400">...</span>
                    {:else}
                      <button
                        on:click={() => goToPage(page)}
                        class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}"
                      >
                        {page}
                      </button>
                    {/if}
                  {/each}
                  
                  <button
                    on:click={goToNextPage}
                    disabled={currentPage === totalPagesOutboundPackages}
                    class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            {/if}
          {/if}
        {/if}
      </div>
    </div>
  </div>

  <!-- Modal Edit Destinasi -->
  {#if showEditModal}
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">Edit Destinasi</h3>
          <button
            on:click={closeEditModal}
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          >
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <!-- Content -->
        <div class="p-6 space-y-4">
          <div>
            <label for="editName" class="block text-sm font-medium text-slate-700 mb-2">
              Nama Destinasi
            </label>
            <input
              id="editName"
              type="text"
              bind:value={editForm.name}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors duration-200"
              placeholder="Masukkan nama destinasi"
            />
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t border-slate-200">
          <button
            on:click={closeEditModal}
            class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
          >
            Batal
          </button>
          <button
            on:click={updateDestination}
            class="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal Edit Outbound Package -->
  {#if showEditModal}
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">Edit Pakej Outbound</h3>
          <button
            on:click={closeEditOutboundModal}
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
          >
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <!-- Content -->
        <div class="p-6 space-y-4">
          <div>
            <label for="editStartDate" class="block text-sm font-medium text-slate-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              id="editStartDate"
              type="date"
              bind:value={editForm.start_date}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          
          <div>
            <label for="editEndDate" class="block text-sm font-medium text-slate-700 mb-2">
              Tanggal Selesai
            </label>
            <input
              id="editEndDate"
              type="date"
              bind:value={editForm.end_date}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          
          <div>
            <label for="editPrice" class="block text-sm font-medium text-slate-700 mb-2">
              Harga
            </label>
            <input
              id="editPrice"
              type="text"
              bind:value={editForm.price}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              placeholder="Masukkan harga pakej"
            />
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t border-slate-200">
          <button
            on:click={closeEditOutboundModal}
            class="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
          >
            Batal
          </button>
          <button
            on:click={updateOutboundPackage}
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
              Simpan
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal Konfirmasi Hapus -->
  {#if showDeleteModal && selectedItem}
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-white/50">
        <!-- Header Modal -->
        <div class="flex items-center justify-center p-6 border-b border-gray-200">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
        </div>

        <!-- Content Modal -->
        <div class="p-6 text-center">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Konfirmasi Hapus
          </h3>
          <p class="text-gray-500 mb-6">
            Apakah Anda yakin ingin menghapus {modalType === 'destination' ? 'destinasi' : 'pakej outbound'} 
            <span class="font-semibold text-gray-900">
              "{modalType === 'destination' ? selectedItem.name : `${selectedItem.destinations?.name || 'N/A'} - ${formatDate(selectedItem.start_date)}`}"
            </span>?
          </p>
          <p class="text-sm text-red-600 mb-6">
            Tindakan ini tidak dapat dibatalkan dan akan menghapus data secara permanen.
          </p>
        </div>

        <!-- Footer Modal -->
        <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            on:click={closeDeleteModal}
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            on:click={confirmDelete}
            class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Snackbar Notification -->
  {#if showSnackbar}
    <div class="fixed top-4 right-4 z-[60] transition-all duration-300 ease-in-out">
      <div class="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg shadow-lg border max-w-sm {snackbarType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}">
        {#if snackbarType === 'success'}
          <svg class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        {:else}
          <svg class="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        {/if}
        <span class="font-medium text-xs sm:text-sm">{snackbarMessage}</span>
        <button
          on:click={() => showSnackbar = false}
          class="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
        >
          <X class="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  {/if}
</RoleGuard>

<script>
  import { onMount } from 'svelte';
  import CustomerDataTable from '$lib/components/CustomerDataTable.svelte';
  import RoleGuard from '$lib/components/RoleGuard.svelte';
  import { user, loading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { Search, RefreshCw, X } from 'lucide-svelte';
  import { 
    fetchCustomers, 
    clearCustomerCache
  } from '$lib/customer-data-helpers.js';
  import { getCacheStats } from '$lib/cache-utils.js';
  
  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto('/login');
  }

  // State untuk pencarian
  let searchTerm = '';
  
  // State untuk data asli (tidak difilter)
  let allCustomers = [];
  
  // State untuk data yang difilter (realtime)
  let filteredCustomers = [];
  
  // Loading state
  let isLoading = true;
  let error = null;
  
  // Cache statistics
  let cacheStats = null;
  
  // Load data awal dengan cache system
  async function loadData() {
    isLoading = true;
    try {
      console.log('🔄 Loading customer data with cache system...');
      const startTime = Date.now();
      
      const customersData = await fetchCustomers();

      const loadTime = Date.now() - startTime;
      console.log(`⚡ Data loaded in ${loadTime}ms`);

      // Simpan data asli
      allCustomers = customersData;
      
      // Debug data loading
      console.log('📊 Data loaded successfully:', {
        customers: allCustomers?.length || 0,
        customersSample: allCustomers?.slice(0, 2)
      });
      
      // Update cache statistics
      updateCacheStats();
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      isLoading = false;
    }
  }
  
  // Update cache statistics
  function updateCacheStats() {
    cacheStats = getCacheStats();
    console.log('📊 Customer page cache stats:', cacheStats);
  }
  
  // Force refresh all data (bypass cache)
  async function forceRefreshAllData() {
    console.log('🔄 Force refreshing all customer data...');
    
    // Clear all customer cache
    clearCustomerCache();
    
    // Reload data
    await loadData();
  }
  
  // Clear all cache
  function clearAllCache() {
    console.log('🧹 Clearing all cache...');
    clearCustomerCache();
    updateCacheStats();
  }

  // Reactive filtering - data akan difilter secara otomatis saat searchTerm berubah
  $: {
    // Filter customers
    filteredCustomers = allCustomers.filter(customer => {
      const matchesSearch = !searchTerm || 
        customer.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.package_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    // Debug filtering
    console.log('🔍 Filtering results:', {
      searchTerm,
      allCustomersLength: allCustomers?.length || 0,
      filteredCustomersLength: filteredCustomers?.length || 0
    });
  }

  // Load data on mount
  loadData();
</script>

<RoleGuard allowedRoles={['super_admin']} redirectTo="/login">
  <div class="p-2 sm:p-3 lg:p-4 bg-gray-50 min-h-full rounded-xl mr-1 sm:mr-2 lg:mr-4">
    <!-- Page Header -->
    <div class="mb-3 sm:mb-4 lg:mb-6">
      <div class="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Pelanggan</h1>
          <p class="text-sm sm:text-base text-gray-600">Kelola data pelanggan dan pemesanan pakej</p>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            on:click={forceRefreshAllData}
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
      
      <!-- Search Bar -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari pelanggan..."
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
        />
      </div>
    </div>

    <!-- Customer Data Table -->
    <div class="mb-6">
      <CustomerDataTable customers={filteredCustomers} {isLoading} />
    </div>
  </div>
</RoleGuard>

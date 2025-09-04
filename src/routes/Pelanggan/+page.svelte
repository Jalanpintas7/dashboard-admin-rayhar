<script>
  import { onMount } from 'svelte';
  import CustomerDataTable from '$lib/components/CustomerDataTable.svelte';
  import LeadDataTable from '$lib/components/LeadDataTable.svelte';
  import RoleGuard from '$lib/components/RoleGuard.svelte';
  import { user, loading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { Search, RefreshCw, X } from 'lucide-svelte';
  import { 
    fetchCustomers, 
    clearCustomerCache
  } from '$lib/customer-data-helpers.js';
  import { 
    fetchLeads, 
    clearLeadsCache
  } from '$lib/lead-data-helpers-optimized.js';
  import { getCacheStats } from '$lib/cache-utils.js';
  
  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto('/login');
  }

  // State untuk pencarian
  let searchTerm = '';
  let leadsSearchTerm = '';
  
  // State untuk filter
  let selectedBranch = '';
  let selectedPackage = '';
  
  // State untuk data asli (tidak difilter)
  let allCustomers = [];
  let allLeads = [];
  
  // State untuk data yang difilter (realtime)
  let filteredCustomers = [];
  let filteredLeads = [];
  
  // Loading state
  let isLoading = true;
  let isLeadsLoading = true;
  let error = null;
  
  // Cache statistics
  let cacheStats = null;
  
  // Get unique values for filters - selalu dari data asli (tidak terpengaruh filter)
  // Menggunakan computed values yang stabil
  $: uniqueBranches = allCustomers.length > 0 ? [...new Set(allCustomers.map(c => c.branch_name).filter(Boolean))] : [];
  $: uniquePackages = allCustomers.length > 0 ? [...new Set(allCustomers.map(c => c.package_type).filter(Boolean))] : [];
  
  
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
  
  // Load leads data dengan cache system
  async function loadLeadsData() {
    isLeadsLoading = true;
    try {
      console.log('🔄 Loading leads data with cache system...');
      const startTime = Date.now();
      
      const leadsData = await fetchLeads();

      const loadTime = Date.now() - startTime;
      console.log(`⚡ Leads data loaded in ${loadTime}ms`);

      // Simpan data asli
      allLeads = leadsData;
      
      // Debug data loading
      console.log('📊 Leads data loaded successfully:', {
        leads: allLeads?.length || 0,
        leadsSample: allLeads?.slice(0, 2)
      });
      
    } catch (error) {
      console.error('Error loading leads data:', error);
    } finally {
      isLeadsLoading = false;
    }
  }
  
  // Update cache statistics
  function updateCacheStats() {
    cacheStats = getCacheStats();
    console.log('📊 Customer page cache stats:', cacheStats);
  }
  
  // Force refresh all data (bypass cache)
  async function forceRefreshAllData() {
    console.log('🔄 Force refreshing all data...');
    
    // Clear all cache
    clearCustomerCache();
    clearLeadsCache();
    
    // Reload data
    await Promise.all([loadData(), loadLeadsData()]);
  }
  
  // Clear all cache
  function clearAllCache() {
    console.log('🧹 Clearing all cache...');
    clearCustomerCache();
    clearLeadsCache();
    updateCacheStats();
  }
  
  // Clear all filters
  function clearAllFilters() {
    searchTerm = '';
    selectedBranch = '';
    selectedPackage = '';
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
      
      const matchesBranch = !selectedBranch || customer.branch_name === selectedBranch;
      const matchesPackage = !selectedPackage || customer.package_type === selectedPackage;
      
      return matchesSearch && matchesBranch && matchesPackage;
    });
    
    // Filter leads
    filteredLeads = allLeads.filter(lead => {
      const matchesSearch = !leadsSearchTerm || 
        lead.name?.toLowerCase().includes(leadsSearchTerm.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(leadsSearchTerm.toLowerCase()) ||
        lead.branch?.toLowerCase().includes(leadsSearchTerm.toLowerCase()) ||
        lead.interest?.toLowerCase().includes(leadsSearchTerm.toLowerCase()) ||
        lead.consultant?.toLowerCase().includes(leadsSearchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    // Debug filtering
    console.log('🔍 Filtering results:', {
      searchTerm,
      selectedBranch,
      selectedPackage,
      leadsSearchTerm,
      allCustomersLength: allCustomers?.length || 0,
      filteredCustomersLength: filteredCustomers?.length || 0,
      allLeadsLength: allLeads?.length || 0,
      filteredLeadsLength: filteredLeads?.length || 0
    });
  }

  // Load data on mount
  onMount(async () => {
    await Promise.all([loadData(), loadLeadsData()]);
  });
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
          <!-- Refresh button removed -->
        </div>
      </div>
      
      <!-- Search Bar -->
      <div class="relative mb-4">
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
    <div class="mb-8">
      <CustomerDataTable 
        customers={filteredCustomers} 
        {isLoading} 
        totalCustomers={allCustomers.length}
        bind:selectedBranch
        bind:selectedPackage
        {uniqueBranches}
        {uniquePackages}
        {clearAllFilters}
      />
    </div>

    <!-- Leads Data Table -->
    <div class="mt-8 mb-6">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Data Lead</h2>
        <p class="text-sm text-gray-600 mb-4">Kelola data lead dan prospek pelanggan</p>
        
        <!-- Search Bar for Leads -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            bind:value={leadsSearchTerm}
            placeholder="Cari lead..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>
      </div>
      
      <LeadDataTable leads={filteredLeads} isLoading={isLeadsLoading} />
    </div>
  </div>
</RoleGuard>

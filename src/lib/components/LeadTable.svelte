<script>
  import { onMount } from 'svelte';
  import { getInitials, fetchLeadsDataWithCache, clearLeadsCache } from '$lib/data/leads.js';
  import { Loader2, AlertTriangle, Users, X, Phone, Mail, MapPin, Calendar, User, Building, Package, Globe, Hash, FileText, TrendingUp, Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-svelte';
  import { user } from '$lib/stores/auth.js';
  import { supabase } from '$lib/supabase.js';
  import { getCacheStats } from '$lib/cache-utils.js';
  
  let leadsData = [];
  let loading = true;
  let error = null;
  let searchTerm = '';
  let selectedLead = null;
  let showDetailModal = false;
  
  // State untuk pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalCount = 0; // Total data dari Supabase
  
  // Cache system untuk mengoptimalkan fetch
  let dataCache = new Map(); // Memory cache untuk data per halaman
  let filterCache = new Map(); // Memory cache untuk hasil filter
  let lastFetchTime = 0;
  let isInitialLoad = true;
  
  // Cache statistics
  let cacheStats = null;
  
  // Debounce untuk filter
  let filterTimeout;
  let refreshInterval;
  
  onMount(async () => {
    console.log('🚀 LeadTable component mounted with advanced cache system');
    
    await loadPageData(1);
    
    // Setup auto-refresh setiap 5 menit (hanya jika ada perubahan)
    setupAutoRefresh();
    
    // Log cache performance
    console.log('📊 Initial cache stats:', cacheStats);
    
    // Cleanup saat komponen unmount
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (filterTimeout) clearTimeout(filterTimeout);
    };
  });
  
  // Setup auto-refresh yang smart
  function setupAutoRefresh() {
    refreshInterval = setInterval(async () => {
      // Hanya refresh jika ada perubahan data
      await checkForDataChanges();
    }, 5 * 60 * 1000); // 5 menit
  }
  
  // Check apakah ada perubahan data baru
  async function checkForDataChanges() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, updated_at')
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
  
  // Update cache statistics
  function updateCacheStats() {
    cacheStats = getCacheStats();
    console.log('📊 Leads Data Cache Statistics:', cacheStats);
  }
  
  // Clear leads cache
  async function clearLeadsDataCache() {
    // Clear memory cache
    dataCache.clear();
    filterCache.clear();
    
    // Clear local storage cache untuk leads data
    clearLeadsCache();
    
    console.log('🧹 Leads data cache cleared');
    updateCacheStats();
    
    // Force refresh data
    await loadPageData(currentPage, {
      search: searchTerm
    });
  }
  
  // Force refresh data (bypass cache)
  async function forceRefreshLeadsData() {
    console.log('🔄 Force refreshing leads data...');
    
    // Clear cache untuk current page
    const cacheKey = `${currentPage}_${JSON.stringify({ search: searchTerm })}`;
    dataCache.delete(cacheKey);
    
    // Clear local storage cache
    clearLeadsCache();
    
    // Refresh data
    await loadPageData(currentPage, {
      search: searchTerm
    });
  }
  
  // Refresh data dengan cache invalidation
  async function refreshData() {
    // Clear cache
    dataCache.clear();
    filterCache.clear();
    
    // Reload current page
    await loadPageData(currentPage, {
      search: searchTerm
    });
    
    lastFetchTime = Date.now();
  }
  
  // Fungsi untuk load data per halaman dengan cache
  async function loadPageData(page, filters = {}) {
    const cacheKey = `${page}_${JSON.stringify(filters)}`;
    
    // Check memory cache terlebih dahulu
    if (dataCache.has(cacheKey) && !isInitialLoad) {
      const cachedData = dataCache.get(cacheKey);
      leadsData = cachedData.data;
      totalCount = cachedData.totalCount;
      currentPage = page;
      loading = false;
      console.log('✅ Data loaded from memory cache for page:', page);
      return;
    }
    
    try {
      loading = true;
      error = null;
      
      console.log('🔄 Loading leads data with cache system...');
      const startTime = Date.now();
      
      const result = await fetchLeadsDataWithCache(page, itemsPerPage, filters);

      const loadTime = Date.now() - startTime;
      console.log(`⚡ Data loaded in ${loadTime}ms`);

      leadsData = result.data;
      totalCount = result.totalCount;
      currentPage = page;
      
      // Cache data untuk halaman ini di memory
      dataCache.set(cacheKey, {
        data: result.data,
        totalCount: result.totalCount,
        timestamp: Date.now()
      });
      
      lastFetchTime = Date.now();
      
      // Update cache statistics
      updateCacheStats();
      
      console.log(`✅ Data loaded for page ${page}:`, result.data.length, 'items');
    } catch (err) {
      error = err.message || 'Gagal memuat data lead';
      console.error('Error loading leads:', err);
    } finally {
      loading = false;
      if (isInitialLoad) isInitialLoad = false;
    }
  }
  
  // Load data dengan filter yang di-debounce
  async function loadDataWithFilters() {
    const filters = {
      search: searchTerm
    };
    
    // Clear cache untuk filter baru
    filterCache.clear();
    
    await loadPageData(1, filters);
  }
  
  function showLeadDetail(lead) {
    selectedLead = lead;
    showDetailModal = true;
  }
  
  function closeDetailModal() {
    showDetailModal = false;
    selectedLead = null;
  }
  
  // Data yang sudah difilter (client-side filtering untuk data yang sudah di-load)
  $: filteredLeads = leadsData.filter(lead => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      lead.phone.includes(term) ||
      lead.branch.toLowerCase().includes(term) ||
      lead.interest.toLowerCase().includes(term)
    );
  });
  
  // Pagination
  $: totalPages = Math.ceil(totalCount / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  
  // Fungsi untuk halaman berikutnya
  async function nextPage() {
    if (currentPage < totalPages) {
      await loadPageData(currentPage + 1, {
        search: searchTerm
      });
    }
  }
  
  // Fungsi untuk halaman sebelumnya
  async function prevPage() {
    if (currentPage > 1) {
      await loadPageData(currentPage - 1, {
        search: searchTerm
      });
    }
  }

  // Fungsi untuk pergi ke halaman tertentu
  async function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      await loadPageData(page, {
        search: searchTerm
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
  
  // Reset filter dan clear cache
  async function resetFilters() {
    searchTerm = '';
    
    // Clear cache
    dataCache.clear();
    filterCache.clear();
    
    await loadPageData(1);
  }
  
  // Watch filter changes dan reload data dengan debounce yang dioptimalkan
  $: {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      if (searchTerm) {
        loadDataWithFilters();
      }
    }, 500); // Increased debounce time for better performance
  }
</script>

<div class="bg-white rounded-xl shadow-soft border border-white/60 overflow-hidden">
  <!-- Header dengan search -->
  <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Data Lead</h3>
        <p class="text-sm text-gray-600">Kelola data lead dan prospek pelanggan</p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Refresh Button -->
        <button
          on:click={refreshData}
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          title="Refresh data"
        >
          <RefreshCw class="w-4 h-4 mr-2" />
          Refresh
        </button>
        
        <!-- Search Bar -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari lead..."
            bind:value={searchTerm}
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
          />
        </div>
      </div>
    </div>
    
    <!-- Cache Control Section - Hidden from UI but functionality preserved -->
    <!-- 
    <div class="px-4 sm:px-6 py-2 border-b border-gray-100 bg-blue-50">
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-2 text-sm text-blue-700">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span class="font-medium">Leads Cache:</span>
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
            on:click={forceRefreshLeadsData}
            class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
            title="Force refresh all data (bypass cache)"
          >
            <RefreshCw class="w-3 h-3" />
            Refresh All
          </button>
          
          <button
            on:click={clearLeadsDataCache}
            class="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center gap-1"
            title="Clear all cache"
          >
            <X class="w-3 h-3" />
            Clear Cache
          </button>
        </div>
      </div>
    </div>
    -->
  </div>

  {#if loading}
    <div class="p-8 text-center">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-purple-500 hover:bg-purple-400 transition ease-in-out duration-150 cursor-not-allowed">
        <Loader2 class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
        Memuat data lead...
      </div>
    </div>
  {:else if error}
    <div class="p-8 text-center">
      <div class="text-red-600 mb-4">
        <AlertTriangle class="mx-auto h-12 w-12 text-red-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Gagal memuat data</h3>
      <p class="text-gray-500 mb-4">{error}</p>
    </div>
  {:else if filteredLeads.length === 0}
    <div class="p-8 text-center">
      <div class="text-gray-400 mb-4">
        <TrendingUp class="mx-auto h-12 w-12" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? 'Tidak ada hasil pencarian' : 'Tidak ada data lead'}
      </h3>
      <p class="text-gray-500">
        {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Belum ada data lead yang tersedia.'}
      </p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              LEAD
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CAWANGAN
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              MINAT
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TARIKH
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          {#each filteredLeads as lead}
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer" on:click={() => showLeadDetail(lead)}>
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                    <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-xs sm:text-sm font-medium text-blue-600">
                        {lead.avatar}
                      </span>
                    </div>
                  </div>
                  <div class="ml-2 sm:ml-4">
                    <div class="text-xs sm:text-sm font-medium text-gray-900">{lead.name}</div>
                    <div class="text-xs text-gray-500">{lead.email}</div>
                  </div>
                </div>
              </td>
              
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{lead.branch}</div>
              </td>
              
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{lead.interest || '-'}</div>
              </td>
              
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{lead.date}</div>
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
                  class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}"
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

<!-- Detail Modal -->
{#if showDetailModal && selectedLead}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span class="text-base sm:text-lg font-bold text-blue-600">
              {selectedLead.avatar}
            </span>
          </div>
          <div>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{selectedLead.name}</h2>
            <p class="text-xs sm:text-sm text-gray-500">Detail Lengkap Lead</p>
          </div>
        </div>
        <button
          on:click={closeDetailModal}
          class="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
        </button>
      </div>

      <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div class="space-y-3 sm:space-y-4">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Informasi Pribadi
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 sm:gap-3">
                <Mail class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Email</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedLead.email || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 sm:gap-3">
                <Phone class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Telepon</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedLead.phone || '-'}</p>
                </div>
              </div>
              
              {#if selectedLead.address && selectedLead.address !== '-'}
                <div class="flex items-start gap-2 sm:gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">Alamat</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedLead.address}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <div class="space-y-3 sm:space-y-4">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Informasi Lead
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 sm:gap-3">
                <Building class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Cawangan</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedLead.branch}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 sm:gap-3">
                <Package class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Minat</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedLead.interest || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 sm:gap-3">
                <Calendar class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-xs sm:text-sm text-gray-500">Tarikh</p>
                  <p class="text-sm sm:text-base text-gray-900">{selectedLead.date}</p>
                </div>
              </div>
              
              {#if selectedLead.packageType && selectedLead.packageType !== '-'}
                <div class="flex items-center gap-2 sm:gap-3">
                  <Package class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">Jenis Paket</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedLead.packageType}</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedLead.destination && selectedLead.destination !== '-'}
                <div class="flex items-center gap-2 sm:gap-3">
                  <Globe class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">Destinasi</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedLead.destination}</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedLead.outboundDate && selectedLead.outboundDate !== '-'}
                <div class="flex items-center gap-2 sm:gap-3">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-xs sm:text-sm text-gray-500">Tarikh Perjalanan</p>
                    <p class="text-sm sm:text-base text-gray-900">{selectedLead.outboundDate}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

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

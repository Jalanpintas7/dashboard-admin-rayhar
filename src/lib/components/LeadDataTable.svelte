<script>
  import { onMount } from 'svelte';
  import { Eye, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle, Calendar, Package, Globe, RefreshCw, User, Phone, TrendingUp, Building } from 'lucide-svelte';
  import { supabase } from '$lib/supabase.js';
  import { 
    generateCacheKey, 
    saveToSessionStorage, 
    getFromSessionStorage, 
    invalidateCachePattern,
    getCacheStats 
  } from '$lib/cache-utils.js';
  import { fetchLeads, fetchLeadsPaginated, clearLeadsCache } from '$lib/lead-data-helpers-optimized.js';

  // Data state - menerima dari parent
  export let leads = [];
  export let isLoading = false;

  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 10;
  
  // Cache system untuk optimasi performa
  let dataCache = new Map(); // Memory cache untuk data yang sedang aktif
  let cacheExpiryTime = 15 * 60 * 1000; // 15 menit untuk data leads
  let lastFetchTime = 0;
  
  // Cache statistics
  let cacheStats = null;
  
  // Loading states
  let isLoadingMore = false;
  let hasMoreData = true;
  let isInitialLoad = true;

  // Modal state
  let showDetailModal = false;
  let showDeleteModal = false;
  let selectedItem = null;
  
  // Delete state
  let isDeleting = false;
  let deleteError = null;

  // Computed values for pagination dengan lazy loading
  $: totalLeads = leads.length;
  $: totalPages = Math.ceil(totalLeads / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  
  // Lazy loading untuk data yang ditampilkan dengan cache
  const USE_CACHE = false; // Set false untuk disable cache sementara
  
  $: paginatedLeads = USE_CACHE ? getPaginatedData('leads', leads, startIndex, endIndex) : [];
  
  // Fallback: jika cache system gagal, gunakan data langsung
  $: fallbackLeads = paginatedLeads?.length > 0 ? paginatedLeads : (leads?.slice(startIndex, endIndex) || []);
  
  // Use fallback data for display
  $: displayLeads = fallbackLeads;

  // Get unique values for filters
  $: uniqueBranches = [...new Set(leads.map(l => l.branch).filter(Boolean))];
  $: uniqueInterests = [...new Set(leads.map(l => l.interest).filter(Boolean))];

  // Reset pagination when data changes
  $: if (leads) {
    currentPage = 1;
    hasMoreData = true;
  }

  // Debug data received from parent
  $: {
    console.log('📥 Lead data received from parent:', {
      leadsCount: leads?.length || 0,
      isLoading,
      leads: leads?.slice(0, 3) // Show first 3 items
    });
  }

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
    console.log('📊 Lead Data Cache Statistics:', cacheStats);
  }
  
  // Clear cache untuk data tertentu
  async function clearLeadDataCache() {
    // Clear memory cache
    dataCache.clear();
    
    // Clear local storage cache untuk lead data
    invalidateCachePattern('leads');
    
    console.log('🧹 Lead data cache cleared');
    updateCacheStats();
    
    // Force refresh data
    await refreshLeadData();
  }
  
  // Force refresh data (bypass cache)
  async function forceRefreshLeadData() {
    console.log('🔄 Force refreshing lead data...');
    
    // Clear cache untuk current page
    const cacheKey = `leads_${startIndex}_${endIndex}`;
    dataCache.delete(cacheKey);
    
    // Clear local storage cache
    invalidateCachePattern('leads');
    
    // Refresh data
    await refreshLeadData();
  }
  
  // Refresh lead data (dispatch event ke parent)
  async function refreshLeadData() {
    // Dispatch custom event untuk refresh data dari parent component
    window.dispatchEvent(new CustomEvent('refreshLeadData'));
  }

  // Initialize cache system on mount
  onMount(() => {
    console.log('🚀 LeadDataTable component mounted with cache system');
    
    // Initialize cache statistics
    updateCacheStats();
    
    // Mark as not initial load after first render
    setTimeout(() => {
      isInitialLoad = false;
    }, 100);
  });

  // Pagination functions
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function goToNextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  // Modal functions
  function openDetailModal(lead) {
    selectedItem = lead;
    showDetailModal = true;
  }

  function openDeleteModal(lead) {
    selectedItem = lead;
    showDeleteModal = true;
  }

  function closeModals() {
    showDetailModal = false;
    showDeleteModal = false;
    selectedItem = null;
    deleteError = null;
    isDeleting = false;
  }

  // Format date
  function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const monthNames = [
      'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
      'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
    ];
    
    return `${day} ${monthNames[month]} ${year}`;
  }

  // Delete lead function
  async function deleteLead() {
    if (!selectedItem || !selectedItem.id) {
      deleteError = 'Data lead tidak valid';
      return;
    }

    isDeleting = true;
    deleteError = null;

    try {
      console.log('🗑️ Deleting lead:', selectedItem.id);
      
      // Delete from leads table
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', selectedItem.id);

      if (leadError) {
        throw leadError;
      }

      console.log('✅ Lead deleted successfully');
      
      // Close modal
      closeModals();
      
      // Show success notification
      showNotification('Data lead berhasil dihapus', 'success');
      
      // Refresh data
      await refreshLeadData();
      
    } catch (error) {
      console.error('❌ Error deleting lead:', error);
      deleteError = error.message || 'Gagal menghapus data lead';
    } finally {
      isDeleting = false;
    }
  }

  // Show notification function
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
</script>

<div class="bg-white rounded-xl shadow-soft border border-white/60 overflow-hidden">
  <!-- Header -->
  <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
    <div class="flex items-center justify-between mb-3 sm:mb-4">
      <!-- Title -->
      <div>
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900">Data Lead</h2>
        <p class="text-sm text-gray-600">Kelola data lead dan prospek pelanggan</p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Refresh button removed -->
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="overflow-x-auto">
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-sm text-gray-600">Memuat data lead...</p>
        </div>
      </div>
    {:else if displayLeads.length === 0}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <TrendingUp class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-sm text-gray-600">Tidak ada data lead</p>
        </div>
      </div>
    {:else}
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Consultant</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cawangan</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minat</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each displayLeads as lead (lead.id)}
            <tr class="hover:bg-gray-50">
              <!-- Lead -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-600">{lead.avatar || 'N/A'}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{lead.name || 'N/A'}</div>
                    <div class="text-sm text-gray-500">{lead.phone || 'N/A'}</div>
                  </div>
                </div>
              </td>
              
              <!-- Sales Consultant -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{lead.consultant || 'N/A'}</div>
              </td>
              
              <!-- Cawangan -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{lead.branch || 'N/A'}</div>
              </td>
              
              <!-- Minat -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{lead.interest || 'N/A'}</div>
              </td>
              
              <!-- Tanggal -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{formatDate(lead.date)}</div>
              </td>
              
              <!-- Aksi -->
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    on:click={() => openDetailModal(lead)}
                    class="text-blue-600 hover:text-blue-900 transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => openDeleteModal(lead)}
                    class="text-red-600 hover:text-red-900 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Menampilkan {startIndex + 1} sampai {Math.min(endIndex, leads.length)} dari {leads.length} hasil
        </div>
        <div class="flex items-center space-x-2">
          <button
            on:click={goToPreviousPage}
            disabled={currentPage === 1}
            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          
          {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
            const start = Math.max(1, currentPage - 2);
            return start + i;
          }) as page}
            {#if page <= totalPages}
              <button
                on:click={() => goToPage(page)}
                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 {currentPage === page ? 'bg-blue-600 text-white border-blue-600' : ''}"
              >
                {page}
              </button>
            {/if}
          {/each}
          
          <button
            on:click={goToNextPage}
            disabled={currentPage === totalPages}
            class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedItem}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span class="text-lg font-bold text-blue-600">
              {selectedItem.avatar || (selectedItem.name || 'N/A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{selectedItem.name || 'N/A'}</h2>
            <p class="text-gray-500">Detail Lengkap Lead</p>
          </div>
        </div>
        <button
          on:click={closeModals}
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <!-- Content Modal -->
      <div class="p-6 space-y-6">
        <!-- Informasi Pribadi -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-5 h-5 text-blue-600" />
              Informasi Pribadi
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Phone class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Telepon</p>
                  <p class="text-gray-900">{selectedItem.phone || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Informasi Lead -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-[rgb(148,35,146)]" />
              Informasi Lead
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Building class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Cawangan</p>
                  <p class="text-gray-900">{selectedItem.branch || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <User class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Sales Consultant</p>
                  <p class="text-gray-900">{selectedItem.consultant || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Globe class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Minat</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                    {selectedItem.interest || '-'}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Calendar class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Tarikh Daftar</p>
                  <p class="text-gray-900">{formatDate(selectedItem.date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Informasi Perjalanan -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package class="w-5 h-5 text-green-600" />
            Informasi Perjalanan
          </h3>
          
          <div class="space-y-3">
            {#if selectedItem.packageType}
              <div class="flex items-center gap-3">
                <Package class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Jenis Pakej</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                    {selectedItem.packageType}
                  </span>
                </div>
              </div>
            {/if}
            
            {#if selectedItem.outboundDate}
              <div class="flex items-center gap-3">
                <Calendar class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Tarikh Perjalanan</p>
                  <p class="text-gray-900">{selectedItem.outboundDate}</p>
                </div>
              </div>
            {/if}
            
            {#if selectedItem.destination}
              <div class="flex items-center gap-3">
                <Globe class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Destinasi</p>
                  <p class="text-gray-900">{selectedItem.destination}</p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Footer Modal -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button
          on:click={closeModals}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal && selectedItem}
  <div class="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
    <div class="bg-white/90 backdrop-blur-lg rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Hapus Lead</h3>
          <button
            on:click={closeModals}
            class="text-gray-400 hover:text-gray-600"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
        
        <div class="text-center py-4">
          <AlertTriangle class="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p class="text-sm text-gray-600 mb-2">Apakah Anda yakin ingin menghapus data lead ini?</p>
          <p class="text-sm font-medium text-gray-900">{selectedItem.name}</p>
          
          {#if deleteError}
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{deleteError}</p>
            </div>
          {/if}
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
          <button
            on:click={closeModals}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            on:click={deleteLead}
            disabled={isDeleting}
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {#if isDeleting}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Menghapus...
            {:else}
              Hapus
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

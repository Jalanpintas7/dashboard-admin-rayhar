<script>
  import { onMount } from 'svelte';
  import { Eye, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle, Calendar, Package, Globe, FileText, DollarSign, CheckCircle, RefreshCw, User, MapPin, Phone, Mail, Hash, Building } from 'lucide-svelte';
  import { supabase } from '$lib/supabase.js';
  import { 
    generateCacheKey, 
    saveToSessionStorage, 
    getFromSessionStorage, 
    invalidateCachePattern,
    getCacheStats 
  } from '$lib/cache-utils.js';

  // Data state - menerima dari parent
  export let customers = [];
  export let isLoading = false;
  export let totalCustomers = 0;
  
  // Filter props
  export let selectedBranch = '';
  export let selectedPackage = '';
  export let uniqueBranches = [];
  export let uniquePackages = [];
  export let clearAllFilters = () => {};

  // Tab state
  let activeTab = 'all';

  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 10;
  
  // Cache system untuk optimasi performa
  let dataCache = new Map(); // Memory cache untuk data yang sedang aktif
  let cacheExpiryTime = 15 * 60 * 1000; // 15 menit untuk data customer
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
  $: displayTotalCustomers = totalCustomers || customers.length;
  $: totalPages = Math.ceil(totalCustomers / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  
  // Lazy loading untuk data yang ditampilkan dengan cache
  const USE_CACHE = false; // Set false untuk disable cache sementara
  
  $: paginatedCustomers = USE_CACHE ? getPaginatedData('customers', customers, startIndex, endIndex) : [];
  
  // Fallback: jika cache system gagal, gunakan data langsung
  $: fallbackCustomers = paginatedCustomers?.length > 0 ? paginatedCustomers : (customers?.slice(startIndex, endIndex) || []);
  
  // Use fallback data for display
  $: displayCustomers = fallbackCustomers;


  // Reset pagination when tab changes
  $: if (activeTab) {
    currentPage = 1;
    hasMoreData = true;
  }

  // Debug data received from parent
  $: {
    console.log('📥 Customer data received from parent:', {
      customersCount: customers?.length || 0,
      isLoading,
      customers: customers?.slice(0, 3) // Show first 3 items
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
    console.log('📊 Customer Data Cache Statistics:', cacheStats);
  }
  
  // Clear cache untuk data tertentu
  async function clearCustomerDataCache() {
    // Clear memory cache
    dataCache.clear();
    
    // Clear local storage cache untuk customer data
    invalidateCachePattern('customer');
    
    console.log('🧹 Customer data cache cleared');
    updateCacheStats();
    
    // Force refresh data
    await refreshCustomerData();
  }
  
  // Force refresh data (bypass cache)
  async function forceRefreshCustomerData() {
    console.log('🔄 Force refreshing customer data...');
    
    // Clear cache untuk current tab
    const cacheKey = `customers_${filteredStartIndex}_${filteredEndIndex}`;
    dataCache.delete(cacheKey);
    
    // Clear local storage cache
    invalidateCachePattern('customer');
    
    // Refresh data
    await refreshCustomerData();
  }
  
  // Refresh customer data (dispatch event ke parent)
  async function refreshCustomerData() {
    // Dispatch custom event untuk refresh data dari parent component
    window.dispatchEvent(new CustomEvent('refreshCustomerData'));
  }

  // Initialize cache system on mount
  onMount(() => {
    console.log('🚀 CustomerDataTable component mounted with cache system');
    
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
  function openDetailModal(customer) {
    selectedItem = customer;
    showDetailModal = true;
  }


  function openDeleteModal(customer) {
    selectedItem = customer;
    showDeleteModal = true;
  }

  function closeModals() {
    showDetailModal = false;
    showDeleteModal = false;
    selectedItem = null;
    deleteError = null;
    isDeleting = false;
  }

  // Format currency
  function formatCurrency(amount) {
    if (!amount) return 'RM 0.00';
    return 'RM ' + new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  // Delete customer function
  async function deleteCustomer() {
    if (!selectedItem || !selectedItem.id) {
      deleteError = 'Data pelanggan tidak valid';
      return;
    }

    isDeleting = true;
    deleteError = null;

    try {
      console.log('🗑️ Deleting customer booking:', selectedItem.id);
      
      // Delete from bookings table (customer data is stored in bookings table)
      const { error: bookingError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedItem.id);

      if (bookingError) {
        throw bookingError;
      }

      console.log('✅ Customer booking deleted successfully');
      
      // Close modal
      closeModals();
      
      // Show success notification
      showNotification('Data pelanggan berhasil dihapus', 'success');
      
      // Refresh data
      await refreshCustomerData();
      
    } catch (error) {
      console.error('❌ Error deleting customer booking:', error);
      deleteError = error.message || 'Gagal menghapus data pelanggan';
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
    <!-- Title and Filter Row -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 sm:mb-4 gap-4">
      <!-- Title -->
      <div class="flex-1">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900">Data Pelanggan</h2>
        <p class="text-sm text-gray-600">
          Menampilkan {customers.length} dari {displayTotalCustomers} pelanggan
          {#if customers.length !== displayTotalCustomers}
            <span class="text-purple-600 font-medium">(difilter)</span>
          {/if}
        </p>
      </div>
      
      <!-- Filter Controls -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <!-- Branch Filter -->
        <div class="min-w-48">
          <select
            bind:value={selectedBranch}
            class="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Semua Cawangan</option>
            {#each uniqueBranches as branch}
              <option value={branch}>{branch}</option>
            {/each}
          </select>
        </div>
        
        <!-- Package Filter -->
        <div class="min-w-48">
          <select
            bind:value={selectedPackage}
            class="block w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Semua Pakej</option>
            {#each uniquePackages as pkg}
              <option value={pkg}>{pkg}</option>
            {/each}
          </select>
        </div>
        
        <!-- Clear Filters Button -->
        <button
          on:click={clearAllFilters}
          class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors flex items-center justify-center"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <!-- Active Filters Display -->
    {#if selectedBranch || selectedPackage}
      <div class="flex flex-wrap gap-2">
        <span class="text-sm text-gray-600">Filter aktif:</span>
        {#if selectedBranch}
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Cawangan: {selectedBranch}
            <button
              on:click={() => selectedBranch = ''}
              class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none"
            >
              <X class="w-3 h-3" />
            </button>
          </span>
        {/if}
        {#if selectedPackage}
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Pakej: {selectedPackage}
            <button
              on:click={() => selectedPackage = ''}
              class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
            >
              <X class="w-3 h-3" />
            </button>
          </span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="overflow-x-auto">
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-sm text-gray-600">Memuat data pelanggan...</p>
        </div>
      </div>
    {:else if displayCustomers.length === 0}
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <User class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-sm text-gray-600">Tidak ada data pelanggan</p>
        </div>
      </div>
    {:else}
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Consultant</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pakej</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cawangan</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each displayCustomers as customer (customer.id)}
            <tr class="hover:bg-gray-50">
              <!-- Pelanggan -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-purple-600">{customer.avatar_initials || 'N/A'}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{customer.full_name || customer.nama || 'N/A'}</div>
                    <div class="text-sm text-gray-500">No. KP: {customer.nokp || 'N/A'}</div>
                  </div>
                </div>
              </td>
              
              <!-- Sales Consultant -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{customer.consultant_name || 'N/A'}</div>
                {#if customer.consultant_whatsapp}
                  <div class="text-sm text-gray-500">{customer.consultant_whatsapp}</div>
                {/if}
              </td>
              
              <!-- Kontak -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {#if customer.telefon}
                    <div class="flex items-center mb-1">
                      <Phone class="w-3 h-3 mr-1 text-gray-400" />
                      {customer.telefon}
                    </div>
                  {/if}
                  {#if customer.email}
                    <div class="flex items-center">
                      <Mail class="w-3 h-3 mr-1 text-gray-400" />
                      <span class="truncate max-w-32">{customer.email}</span>
                    </div>
                  {/if}
                </div>
              </td>
              
              <!-- Pakej -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{customer.package_type || 'N/A'}</div>
                <div class="text-sm text-gray-500">{customer.season_destination || 'N/A'}</div>
              </td>
              
              <!-- Cawangan -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{customer.branch_name || 'N/A'}</div>
              </td>
              
              <!-- Harga -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{formatCurrency(customer.total_price)}</div>
                <div class="text-sm text-gray-500">{(customer.bilangan || 0) + 1} pax</div>
              </td>
              
              <!-- Tanggal -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{formatDate(customer.created_at)}</div>
              </td>
              
              <!-- Aksi -->
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                  <button
                    on:click={() => openDetailModal(customer)}
                    class="text-purple-600 hover:text-purple-900 transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    on:click={() => openDeleteModal(customer)}
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
          Menampilkan {startIndex + 1} sampai {Math.min(endIndex, customers.length)} dari {customers.length} hasil
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
                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 {currentPage === page ? 'bg-purple-600 text-white border-purple-600' : ''}"
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
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span class="text-lg font-bold text-purple-600">
              {selectedItem.avatar_initials || (selectedItem.full_name || selectedItem.nama || 'N/A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{selectedItem.full_name || selectedItem.nama || 'N/A'}</h2>
            <p class="text-gray-500">Detail Lengkap Pelanggan</p>
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
              <User class="w-5 h-5 text-purple-600" />
              Informasi Pribadi
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Mail class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="text-gray-900">{selectedItem.email || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Phone class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Telepon</p>
                  <p class="text-gray-900">{selectedItem.telefon || '-'}</p>
                </div>
              </div>
              
              {#if selectedItem.nokp}
                <div class="flex items-center gap-3">
                  <Hash class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-sm text-gray-500">No. KP</p>
                    <p class="text-gray-900">{selectedItem.nokp}</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedItem.full_address}
                <div class="flex items-start gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p class="text-sm text-gray-500">Alamat Lengkap</p>
                    <p class="text-gray-900">{selectedItem.full_address}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Informasi Perjalanan -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Globe class="w-5 h-5 text-[rgb(148,35,146)]" />
              Informasi Perjalanan
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Building class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Cawangan</p>
                  <p class="text-gray-900">{selectedItem.branch_name || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Package class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Jenis Pakej</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                    {selectedItem.package_type || '-'}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Globe class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Musim/Destinasi</p>
                  <p class="text-gray-900">{selectedItem.season_destination || selectedItem.umrah_category_name || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Calendar class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Tarikh Daftar</p>
                  <p class="text-gray-900">{formatDate(selectedItem.created_at)}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Hash class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Dari Inquiry</p>
                  <span class="text-sm font-medium">
                    {#if selectedItem.from_inquiry_status === 'Ya' || selectedItem.from_inquiry_status === 'yes'}
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText class="w-5 h-5 text-green-600" />
              Harga dan Pembayaran
            </h3>
            
            <div class="space-y-3">
              {#if selectedItem.total_price}
                <div>
                  <p class="text-sm text-gray-500">Total Harga</p>
                  <p class="text-2xl font-bold text-green-600">{formatCurrency(selectedItem.total_price)}</p>
                </div>
              {/if}
              
              <div>
                <p class="text-sm text-gray-500">Jumlah Pax</p>
                <p class="text-lg font-semibold text-gray-900">{(selectedItem.bilangan || 0) + 1} orang</p>
              </div>
            </div>
          </div>

          <!-- Informasi Tambahan -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-5 h-5 text-orange-600" />
              Informasi Tambahan
            </h3>
            
            <div class="space-y-3">
              {#if selectedItem.consultant_name}
                <div>
                  <p class="text-sm text-gray-500">Sales Consultant</p>
                  <p class="text-gray-900">{selectedItem.consultant_name}</p>
                </div>
              {/if}
              
              {#if selectedItem.consultant_whatsapp}
                <div class="flex items-center gap-3">
                  <Phone class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-sm text-gray-500">WhatsApp Consultant</p>
                    <p class="text-gray-900">{selectedItem.consultant_whatsapp}</p>
                  </div>
                </div>
              {/if}
            </div>
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
          <h3 class="text-lg font-semibold text-gray-900">Hapus Pelanggan</h3>
          <button
            on:click={closeModals}
            class="text-gray-400 hover:text-gray-600"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
        
        <div class="text-center py-4">
          <AlertTriangle class="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p class="text-sm text-gray-600 mb-2">Apakah Anda yakin ingin menghapus data pelanggan ini?</p>
          <p class="text-sm font-medium text-gray-900">{selectedItem.full_name || selectedItem.nama}</p>
          
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
            on:click={deleteCustomer}
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

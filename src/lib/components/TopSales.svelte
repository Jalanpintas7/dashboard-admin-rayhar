<script>
  import { onMount } from 'svelte';
  import { fetchTopSalesConsultants } from '$lib/dashboard-data-helpers.js';
  import { user } from '$lib/stores/auth.js';
  
  let topSalesData = [];
  let loading = true;
  let error = null;
  let selectedConsultant = null;
  let showDetailModal = false;
  let activeTab = 'umrah'; // 'umrah' atau 'pelancongan'
  
  const loadTopSalesData = async () => {
    try {
      loading = true;
      error = null;
      
      console.log(`🔄 Loading top sales data (${activeTab}) with cache system...`);
      const startTime = Date.now();
      
      // Get top sales consultants data dengan cache system
      topSalesData = await fetchTopSalesConsultants(activeTab, 5);
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ Top sales data loaded in ${loadTime}ms`);
      
      // Fallback ke data dummy jika tidak ada data
      if (topSalesData.length === 0) {
        topSalesData = [
          { 
            name: 'Data tidak tersedia', 
            total: 0,
            recent: 0,
            profileImage: '/api/placeholder/40/40'
          }
        ];
      }
      
      console.log(`📊 Top sales data loaded successfully: ${topSalesData.length} items`);
      
    } catch (err) {
      console.error('Error loading top sales data:', err);
      error = err.message;
      // Fallback ke data dummy jika ada error
      topSalesData = [
        { 
          name: 'Data tidak tersedia', 
          total: 0,
          recent: 0,
          profileImage: '/api/placeholder/40/40'
        }
      ];
    } finally {
      loading = false;
    }
  };
  
  const showConsultantDetail = (consultant) => {
    selectedConsultant = consultant;
    showDetailModal = true;
  };
  
  const closeDetailModal = () => {
    showDetailModal = false;
    selectedConsultant = null;
  };
  
  const switchTab = async (tab) => {
    activeTab = tab;
    // Reload data berdasarkan tab yang dipilih
    await loadTopSalesData();
  };
  
  // Refresh data setiap 5 menit
  let refreshInterval;
  onMount(() => {
    if ($user) {
      loadTopSalesData();
    }
    
    refreshInterval = setInterval(() => {
      if ($user) {
        loadTopSalesData();
      }
    }, 5 * 60 * 1000); // 5 menit
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });
</script>

<!-- Container utama dengan responsive design yang lebih baik -->
<div class="
  bg-white/95 backdrop-blur-sm 
  rounded-card shadow-soft 
  border border-white/80 
  p-3 sm:p-4 lg:p-5 xl:p-5 2xl:p-7
  min-w-0
  overflow-hidden
  flex flex-col
">
  <!-- Header dengan Tab Navigation -->
  <div class="mb-2 sm:mb-3">
    <h2 class="text-base sm:text-lg lg:text-lg xl:text-lg font-bold text-slate-900 truncate mb-2">Top Sales Consultant</h2>
    
    <!-- Tab Navigation -->
    <div class="flex bg-gray-100 rounded-lg p-0.5">
      <button
        class="flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200 {activeTab === 'umrah' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
        on:click={() => switchTab('umrah')}
      >
        Top Sales Umrah
      </button>
      <button
        class="flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200 {activeTab === 'pelancongan' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
        on:click={() => switchTab('pelancongan')}
      >
        Top Sales Pelancongan
      </button>
    </div>
  </div>
  
  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center h-24 sm:h-32">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-500"></div>
    </div>
  {:else if error}
    <div class="text-center p-3 sm:p-4">
      <p class="text-red-500 text-xs sm:text-sm">{error}</p>
      <button 
        on:click={loadTopSalesData}
        class="mt-2 px-2 py-1 sm:px-3 sm:py-1 bg-red-100 text-red-700 rounded-md text-xs sm:text-sm hover:bg-red-200"
      >
        Coba Lagi
      </button>
    </div>
  {:else}
    <!-- Content dengan responsive design yang lebih baik -->
    <div class="flex flex-col space-y-1.5 lg:space-y-2">
      {#each topSalesData as item, index}
        <div
          class="
            bg-white
            p-2 lg:p-3 xl:p-4
            py-3 lg:py-4 xl:py-5
            transition-all duration-200
            rounded-xl
            hover:shadow-md
            cursor-pointer
            border border-gray-100
            shadow-sm
            min-w-0
          "
          style="background-color: #ffffff !important;"
          role="button"
          tabindex="0"
          on:click={() => showConsultantDetail(item)}
          on:keydown={(e) => e.key === 'Enter' && showConsultantDetail(item)}
        >
          <div class="flex items-center justify-between min-w-0 h-full">
            <div class="flex items-center space-x-1.5 lg:space-x-2 min-w-0 flex-1">
              <!-- Profile Picture - Circular -->
              <div class="
                w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8
                bg-gradient-to-br from-green-400 to-green-600
                rounded-full
                flex items-center justify-center
                text-white
                font-semibold
                text-xs
                shadow-md
                overflow-hidden
                flex-shrink-0
              ">
                <img 
                  src={item.profileImage}
                  alt="{item.name}"
                  class="w-full h-full object-cover"
                  on:error={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div class="w-full h-full flex items-center justify-center" style="display: none;">
                  {item.salesConsultantNumber || item.name.charAt(0)}
                </div>
              </div>
              
              <!-- Name and Category Bookings -->
              <div class="min-w-0 flex-1 overflow-hidden">
                <h3 class="text-slate-900 font-bold text-xs lg:text-sm truncate">{item.name}</h3>
                <p class="text-slate-500 text-[10px] lg:text-xs truncate">
                  {item.categoryBookings} pax {activeTab === 'umrah' ? 'umrah' : 'pelancongan'}
                </p>
              </div>
            </div>
            
            <!-- Total Revenue -->
            <div class="text-right flex-shrink-0 ml-2">
              <p class="text-slate-900 font-bold text-xs lg:text-sm">
                RM {item.total.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p class="text-slate-500 text-[10px] lg:text-xs truncate">Total Revenue</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Detail Modal dengan responsive design yang lebih baik -->
{#if showDetailModal && selectedConsultant}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="
      bg-white/95 backdrop-blur-md 
      rounded-xl p-4 sm:p-6 
      max-w-md w-full max-h-[80vh] 
      overflow-y-auto shadow-2xl 
      border border-white/50
      mx-4
    ">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-slate-900 truncate">Detail Sales Consultant</h3>
        <button 
          on:click={closeDetailModal}
          class="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0"
          aria-label="Tutup modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Consultant Info -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4">
          <img 
            src={selectedConsultant.profileImage}
            alt={selectedConsultant.name}
            class="w-full h-full rounded-full object-cover"
          />
        </div>
        <h4 class="text-lg sm:text-xl font-bold text-slate-900 mb-2 truncate">{selectedConsultant.name}</h4>
        
        <!-- Sales Consultant Number -->
        {#if selectedConsultant.salesConsultantNumber}
          <p class="text-slate-500 text-sm mb-3">#{selectedConsultant.salesConsultantNumber}</p>
        {/if}
        
        <!-- Contact Information -->
        <div class="space-y-2 mb-4">
          {#if selectedConsultant.email}
            <p class="text-slate-600 text-xs sm:text-sm flex items-center justify-center break-words">
              <svg class="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span class="truncate">{selectedConsultant.email}</span>
            </p>
          {/if}
          
          {#if selectedConsultant.whatsapp}
            <p class="text-slate-600 text-xs sm:text-sm flex items-center justify-center break-words">
              <svg class="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span class="truncate">{selectedConsultant.whatsapp}</span>
            </p>
          {/if}
          
          {#if selectedConsultant.branches}
            <p class="text-slate-600 text-xs sm:text-sm flex items-center justify-center break-words">
              <svg class="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <span class="truncate">{selectedConsultant.branches}</span>
            </p>
          {/if}
        </div>
      </div>
      
      <!-- Statistics -->
      <div class="space-y-3 mb-6">
        <!-- Total Revenue -->
        <div class="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
          <p class="text-xl sm:text-2xl font-bold text-green-600">
            RM {selectedConsultant.total.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p class="text-xs sm:text-sm text-green-700">Total Revenue</p>
        </div>
        
        <!-- Category Specific Bookings -->
        <div class="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
          <p class="text-lg sm:text-xl font-bold text-blue-600">
            {selectedConsultant.categoryBookings}
          </p>
          <p class="text-xs sm:text-sm text-blue-700">pax {activeTab === 'umrah' ? 'umrah' : 'pelancongan'}</p>
        </div>
      </div>
      
      <!-- Close Button -->
      <div class="mt-6 text-center">
        <button 
          on:click={closeDetailModal}
          class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm sm:text-base"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

<script>
  import { onMount } from 'svelte';
  import { fetchTopPackages } from '$lib/dashboard-data-helpers.js';
  import { user, userRole } from '../stores/auth.js';

  let isMenuOpen = false;
  let selectedFilter = 'keseluruhan';
  let topPackages = [];
  let loading = true;
  let error = null;
  let branchId = null;
  let isSuperAdmin = false;

  // Load data berdasarkan filter yang dipilih dengan cache system
  async function loadTopPackages() {
    try {
      loading = true;
      error = null;
      
      console.log(`🔄 Loading top packages (${selectedFilter}) with cache system...`);
      const startTime = Date.now();
      
      // Get data dengan cache system
      topPackages = await fetchTopPackages(selectedFilter, 5);
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ Top packages loaded in ${loadTime}ms`);
      
      console.log(`📊 Top packages loaded successfully: ${topPackages.length} items`);
      
    } catch (err) {
      console.error('Error loading top packages:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function selectFilter(filter) {
    selectedFilter = filter;
    isMenuOpen = false;
    loadTopPackages(); // Reload data ketika filter berubah
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  // Close menu when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.relative')) {
      isMenuOpen = false;
    }
  }

  // Load data saat komponen mount
  onMount(() => {
    loadTopPackages();
  });
</script>

<svelte:window on:click={handleClickOutside} />

<div class="bg-white/90 backdrop-blur-sm rounded-card shadow-soft border border-white/80 p-3 sm:p-4 lg:p-5 xl:p-5 2xl:p-7 h-[440px] sm:h-[550px] lg:h-[620px] xl:h-[540px] 2xl:h-[650px] overflow-hidden flex flex-col min-w-0">
  <!-- Header -->
  <div class="flex flex-row items-center justify-between mb-3 sm:mb-4 lg:mb-5 gap-2 sm:gap-3 lg:gap-4">
    <h2 class="text-base sm:text-lg lg:text-lg xl:text-lg font-bold text-slate-900 truncate flex-1">Package Top Peserta</h2>
    
    <!-- Dropdown (custom styled) -->
    <div class="relative flex-shrink-0">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-slate-200 px-2 py-1 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 active:scale-[0.99] transition min-w-0"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        on:click={toggleMenu}
      >
        <span class="truncate max-w-[70px] sm:max-w-none">{selectedFilter}</span>
        <svg class="size-3 text-slate-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
        </svg>
      </button>

      <div
        class="absolute right-0 z-10 mt-2 w-28 sm:w-40 origin-top-right rounded-lg sm:rounded-xl border border-slate-200 bg-white p-1 sm:p-1.5 shadow-lg ring-1 ring-black/5 transition {isMenuOpen ? 'visible opacity-100 scale-100' : 'invisible opacity-0 scale-95'}"
        role="menu"
      >
        <!-- menu item -->
        <button 
          class="w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
          on:click={() => selectFilter('keseluruhan')}
        >
          keseluruhan
        </button>
        <button 
          class="w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
          on:click={() => selectFilter('Umrah')}
        >
          Umrah
        </button>
        <button 
          class="w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400/50"
          on:click={() => selectFilter('Pelancongan')}
        >
          Pelancongan
        </button>
        
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto pr-1 space-y-2 lg:space-y-2.5 xl:space-y-3">
    {#if loading}
      <!-- Loading state -->
      <div class="flex items-center justify-center py-6 sm:py-8">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600"></div>
        <span class="ml-2 sm:ml-3 text-slate-600 text-sm">Loading...</span>
      </div>
    {:else if error}
      <!-- Error state -->
      <div class="text-center py-6 sm:py-8">
        <p class="text-red-600 text-xs sm:text-sm">Error: {error}</p>
        <button 
          class="mt-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm hover:bg-indigo-700"
          on:click={loadTopPackages}
        >
          Coba Lagi
        </button>
      </div>
    {:else if topPackages.length === 0}
      <!-- Empty state -->
      <div class="text-center py-6 sm:py-8">
        <p class="text-slate-500 text-xs sm:text-sm">Tidak ada data package peserta untuk ditampilkan</p>
      </div>
    {:else}
      <!-- Package list -->
      {#each topPackages as pkg}
        <div class="
          bg-white
          p-2 lg:p-2.5 xl:p-3 
          transition-all duration-200
          rounded-xl
          hover:shadow-md
          cursor-pointer
          border border-gray-100
          shadow-sm
          min-w-0
        ">
          <div class="flex items-center justify-between min-w-0">
            <div class="flex items-center space-x-2 lg:space-x-2.5 xl:space-x-3 min-w-0 flex-1">
              <div class="
                w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9
                bg-indigo-100 
                rounded-full 
                flex items-center justify-center
                text-indigo-700
                font-semibold
                text-xs lg:text-xs
                flex-shrink-0
              ">
                {pkg.rank}
              </div>
              <div class="min-w-0 flex-1 overflow-hidden">
                <h3 class="text-slate-900 font-bold text-xs sm:text-sm lg:text-sm xl:text-sm truncate">{pkg.name}</h3>
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-2">
              <p class="text-slate-900 font-bold text-sm sm:text-base lg:text-base xl:text-base">{pkg.totalSales}</p>
              <p class="text-slate-500 text-xs sm:text-sm truncate">peserta</p>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<script>
  import { MapPin, Search, ChevronDown } from 'lucide-svelte';
  import { supabase } from '$lib/supabase.js';
  import { onMount } from 'svelte';
  
  // State untuk form input pakej destinasi
  let packageData = {
    destination_id: null,
    start_date: '',
    end_date: '',
    single: '',
    double: '',
    triple: '',
    cwb: '',
    cnb: '',
    infant: ''
  };

  let loading = false;
  let message = '';
  
  // State untuk dropdown destinasi
  let destinations = [];
  let filteredDestinations = [];
  let searchQuery = '';
  let isDropdownOpen = false;
  let selectedDestination = null;

  // Load destinations saat komponen mount
  onMount(async () => {
    await loadDestinations();
  });

  // Load data destinations dari database
  async function loadDestinations() {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, name, created_at')
        .order('name');

      if (error) {
        console.error('Error loading destinations:', error);
        return;
      }

      destinations = data || [];
      filteredDestinations = [...destinations];
    } catch (error) {
      console.error('Error loading destinations:', error);
    }
  }

  // Filter destinations berdasarkan search query
  function filterDestinations() {
    if (!searchQuery.trim()) {
      filteredDestinations = [...destinations];
    } else {
      filteredDestinations = destinations.filter(destination =>
        destination.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }

  // Handle search input
  function handleSearchInput(event) {
    searchQuery = event.target.value;
    filterDestinations();
  }

  // Select destination
  function selectDestination(destination) {
    selectedDestination = destination;
    packageData.destination_id = destination.id;
    searchQuery = destination.name;
    isDropdownOpen = false;
  }

  // Toggle dropdown
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    if (isDropdownOpen) {
      filterDestinations();
    }
  }

  // Handle form submission
  async function handleSubmit() {
    loading = true;
    message = '';
    
    try {
      // Validasi data
      if (!packageData.destination_id) {
        throw new Error('Pilih destinasi terlebih dahulu');
      }
      
      if (!packageData.start_date || !packageData.end_date) {
        throw new Error('Tanggal mulai dan selesai harus diisi');
      }
      
      if (!packageData.single || !packageData.double || !packageData.triple || 
          !packageData.cwb || !packageData.cnb || !packageData.infant) {
        throw new Error('Semua field harga harus diisi');
      }

      // Insert data ke tabel outbound_dates
      const { data, error } = await supabase
        .from('outbound_dates')
        .insert([
          {
            destination_id: packageData.destination_id,
            start_date: packageData.start_date,
            end_date: packageData.end_date,
            single: packageData.single.toString(),
            double: packageData.double.toString(),
            triple: packageData.triple.toString(),
            cwb: packageData.cwb.toString(),
            cnb: packageData.cnb.toString(),
            infant: packageData.infant.toString()
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      message = 'Pakej destinasi berhasil dibuat!';
      
      // Reset form setelah submit
      packageData = {
        destination_id: null,
        start_date: '',
        end_date: '',
        single: '',
        double: '',
        triple: '',
        cwb: '',
        cnb: '',
        infant: ''
      };
      selectedDestination = null;
      searchQuery = '';
      
    } catch (error) {
      console.error('Error membuat pakej destinasi:', error);
      message = 'Gagal membuat pakej destinasi: ' + error.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-white/60">
  <!-- Header dengan ikon -->
  <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
    <div class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
      <MapPin class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-yellow-600" />
    </div>
            <h2 class="text-base sm:text-lg lg:text-xl font-bold text-slate-800">Tambah Pakej Destinasi</h2>
  </div>

  <!-- Message -->
  {#if message}
    <div class="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm {message.includes('berhasil') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
      {message}
    </div>
  {/if}

  <!-- Warning jika tidak ada destinasi -->
  {#if destinations.length === 0}
    <div class="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200">
      <div class="flex items-center gap-1.5 sm:gap-2">
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-xs sm:text-sm font-medium">
          Belum ada destinasi tersedia. Silakan tambahkan destinasi terlebih dahulu di card sebelah kiri.
        </span>
      </div>
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-3 sm:space-y-4 lg:space-y-6">
    <!-- Tujuan Destinasi Dropdown -->
    <div class="relative">
      <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
        Tujuan Destinasi
      </label>
      <div class="relative">
        <div class="flex items-center border border-slate-200 rounded-lg sm:rounded-xl focus-within:ring-2 focus-within:ring-yellow-500 focus-within:border-transparent transition-all duration-200">
          <div class="flex items-center px-3">
            <Search class="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <input
            type="text"
            bind:value={searchQuery}
            on:input={handleSearchInput}
            on:focus={() => {
              isDropdownOpen = true;
              filterDestinations();
            }}
            on:click={() => {
              isDropdownOpen = true;
              filterDestinations();
            }}
            placeholder="Cari destinasi..."
            class="flex-1 px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border-none outline-none bg-transparent cursor-pointer"
            required
          />
          <button
            type="button"
            on:click={toggleDropdown}
            class="px-3 py-2 sm:py-2.5 lg:py-3 hover:bg-slate-50 transition-colors"
          >
            <ChevronDown class="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 {isDropdownOpen ? 'rotate-180' : ''}" />
          </button>
        </div>
        
        <!-- Dropdown Menu -->
        {#if isDropdownOpen}
          <div class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-lg max-h-60 overflow-y-auto">
            
            {#if destinations.length === 0}
              <div class="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-500 text-xs sm:text-sm">
                Belum ada destinasi tersedia. Silakan tambahkan destinasi terlebih dahulu.
              </div>
            {:else if filteredDestinations.length === 0}
              <div class="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-500 text-xs sm:text-sm">
                Tidak ada destinasi yang cocok dengan pencarian
              </div>
            {:else}
              {#each filteredDestinations as destination}
                <button
                  type="button"
                  on:click={() => selectDestination(destination)}
                  class="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                >
                  <div class="font-medium text-slate-800 text-xs sm:text-sm">{destination.name}</div>
                </button>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
      
      <!-- Selected Destination Display -->
      {#if selectedDestination}
        <div class="mt-2 p-2 bg-yellow-50 rounded-lg">
          <div class="text-xs sm:text-sm text-yellow-800">
            <span class="font-medium">Dipilih:</span> {selectedDestination.name}
          </div>
        </div>
      {/if}
    </div>

    <!-- Start Date dan End Date -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label for="startDate" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          Tanggal Mulai
        </label>
        <input
          id="startDate"
          type="date"
          bind:value={packageData.start_date}
          required
          class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <div>
        <label for="endDate" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          Tanggal Selesai
        </label>
        <input
          id="endDate"
          type="date"
          bind:value={packageData.end_date}
          required
          class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
    </div>

    <!-- Harga Fields -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div>
        <label for="singlePrice" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          Single RM
        </label>
        <input
          id="singlePrice"
          type="number"
          bind:value={packageData.single}
          required
          placeholder="0"
          min="0"
          class="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      
      <div>
        <label for="doublePrice" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          Double RM
        </label>
        <input
          id="doublePrice"
          type="number"
          bind:value={packageData.double}
          required
          placeholder="0"
          min="0"
          class="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      
      <div>
        <label for="triplePrice" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          Triple RM
        </label>
        <input
          id="triplePrice"
          type="number"
          bind:value={packageData.triple}
          required
          placeholder="0"
          min="0"
          class="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      
      <div>
        <label for="cwbPrice" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          CWB RM
        </label>
        <input
          id="cwbPrice"
          type="number"
          bind:value={packageData.cwb}
          required
          placeholder="0"
          min="0"
          class="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      
      <div>
        <label for="cnbPrice" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          CNB RM
        </label>
        <input
          id="cnbPrice"
          type="number"
          bind:value={packageData.cnb}
          required
          placeholder="0"
          min="0"
          class="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      
      <div>
        <label for="infantPrice" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          Infant RM
        </label>
        <input
          id="infantPrice"
          type="number"
          bind:value={packageData.infant}
          required
          placeholder="0"
          min="0"
          class="w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>
    </div>

    <!-- Tombol Submit -->
    <button
      type="submit"
      disabled={loading}
      class="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg sm:rounded-xl transition-colors duration-200 shadow-soft hover:shadow-lg"
    >
      {#if loading}
        <div class="flex items-center justify-center gap-1.5 sm:gap-2">
          <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span class="text-xs sm:text-sm">Membuat Pakej...</span>
        </div>
      {:else}
                    <span class="text-xs sm:text-sm">Buat Pakej Destinasi</span>
      {/if}
    </button>
  </form>
</div>

<!-- Click outside to close dropdown -->
{#if isDropdownOpen}
  <div class="fixed inset-0 z-40" on:click={() => isDropdownOpen = false}></div>
{/if}

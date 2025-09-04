<script>
  import { createUmrahPackage } from '../supabase-helpers.js';
  import { fetchAllUmrahData, clearUmrahCache } from '../umrah-data-helpers.js';
  import { onMount } from 'svelte';
  import { Building2, Loader2, RefreshCw } from 'lucide-svelte';

  // Data dari database
  let seasons = [];
  let categories = [];
  let airlines = [];
  let isLoading = true;
  let error = '';

  let packageData = {
    namaPaket: '',
    musimId: '',
    kategoriId: '',
    tanggalBerangkat: '',
    tanggalKembali: '',
    airline: '',
    flightName: '',
    deskripsi: '',
    // Harga berdasarkan tipe bilik (untuk pakej non-cruise)
    hargaDouble: 0,
    hargaTriple: 0,
    hargaQuadruple: 0,
    hargaQuintuple: 0,
    // Harga untuk anak dan infant (untuk pakej non-cruise)
    hargaCNB: 0,    // Child No Bed
    hargaInfant: 0,  // Infant
    // Harga berdasarkan deck (untuk pakej cruise)
    lowDeckInterior: 0,
    lowDeckSeaview: 0,
    lowDeckBalcony: 0,
    highDeckInterior: 0,
    highDeckSeaview: 0,
    highDeckBalcony: 0
  };

  // Load data dari database dengan cache system
  async function loadData() {
    try {
      isLoading = true;
      error = '';
      
      const data = await fetchAllUmrahData();
      
      seasons = data.seasons;
      categories = data.categories;
      airlines = data.airlines;
      
    } catch (err) {
      console.error('Error loading UmrahPackageCreator data:', err);
      error = 'Gagal memuat data musim, kategori, dan airlines. Silakan coba lagi.';
      
      // Set default empty arrays jika error
      seasons = [];
      categories = [];
      airlines = [];
    } finally {
      isLoading = false;
    }
  }

  // Force refresh data (clear cache and reload)
  async function refreshData() {
    try {
      isLoading = true;
      error = '';
      
      console.log('🔄 Force refreshing UmrahPackageCreator data...');
      clearUmrahCache();
      
      const data = await fetchAllUmrahData();
      
      seasons = data.seasons;
      categories = data.categories;
      airlines = data.airlines;
      
    } catch (err) {
      console.error('Error refreshing UmrahPackageCreator data:', err);
      error = 'Gagal memuat data musim, kategori, dan airlines. Silakan coba lagi.';
      
      // Set default empty arrays jika error
      seasons = [];
      categories = [];
      airlines = [];
    } finally {
      isLoading = false;
    }
  }

  // Get selected musim, kategori, dan airline data
  $: selectedMusim = seasons.find(s => s.id === packageData.musimId);
  $: selectedKategori = categories.find(c => c.id === packageData.kategoriId);
  $: selectedAirline = airlines.find(a => a.id === packageData.airline);

  // Check if this is a cruise pakej
  $: isCruisePackage = selectedMusim?.name === 'Umrah Cruise' && 
    (selectedKategori?.name === 'Pelayaran' || selectedKategori?.name === 'Umrah + Pelayaran');

  // Check if this is a pelayaran category (cruise only)
  $: isPelayaranCategory = selectedKategori?.name === 'Pelayaran';

  // Check if this is a Umrah + Pelayaran category (has flight but uses deck pricing)
  $: isUmrahPelayaranCategory = selectedKategori?.name === 'Umrah + Pelayaran';

  let isSubmitting = false;
  let submitMessage = '';
  let submitMessageType = '';

  async function handleSubmit() {
    if (!packageData.namaPaket.trim()) {
      showMessage('Nama pakej harus diisi', 'error');
      return;
    }

    if (!packageData.musimId) {
      showMessage('Pilih musim umrah', 'error');
      return;
    }

    if (!packageData.kategoriId) {
      showMessage('Pilih kategori umrah', 'error');
      return;
    }

    if (!packageData.tanggalBerangkat) {
      showMessage('Tanggal berangkat harus diisi', 'error');
      return;
    }

    if (!packageData.tanggalKembali) {
      showMessage('Tanggal kembali harus diisi', 'error');
      return;
    }

    // Validasi airline untuk pakej non-cruise dan Umrah + Pelayaran
    if ((!isCruisePackage && !isUmrahPelayaranCategory) && !packageData.airline) {
      showMessage('Pilih maskapai penerbangan', 'error');
      return;
    }

    isSubmitting = true;
    submitMessage = '';

    try {
      // Persiapkan data untuk database
      let packageDataForDB = {
        start_date: packageData.tanggalBerangkat,
        end_date: packageData.tanggalKembali,
        umrah_season_id: packageData.musimId,
        umrah_category_id: packageData.kategoriId,
        flight_name: packageData.flightName.trim() || null,
      };

      if (isCruisePackage || isUmrahPelayaranCategory) {
        // Untuk pakej cruise dan Umrah + Pelayaran, gunakan harga berdasarkan deck
        packageDataForDB = {
          ...packageDataForDB,
          low_deck_interior: packageData.lowDeckInterior || 0,
          low_deck_seaview: packageData.lowDeckSeaview || 0,
          low_deck_balcony: packageData.lowDeckBalcony || 0,
          high_deck_interior: packageData.highDeckInterior || 0,
          high_deck_seaview: packageData.highDeckSeaview || 0,
          high_deck_balcony: packageData.highDeckBalcony || 0
        };
        
        // Tambahkan airline_id untuk Umrah + Pelayaran
        if (isUmrahPelayaranCategory) {
          packageDataForDB.airline_id = packageData.airline;
        }
      } else {
        // Untuk pakej non-cruise, gunakan harga berdasarkan tipe bilik dan anak/infant
        packageDataForDB = {
          ...packageDataForDB,
          airline_id: packageData.airline,
          // Harga berdasarkan tipe bilik
          double: packageData.hargaDouble || 0,
          triple: packageData.hargaTriple || 0,
          quadruple: packageData.hargaQuadruple || 0,
          quintuple: packageData.hargaQuintuple || 0,
          // Harga untuk anak dan infant
          cnb: packageData.hargaCNB || 0,
          infant: packageData.hargaInfant || 0
        };
      }

      // Simpan ke database menggunakan Supabase
      const result = await createUmrahPackage(packageDataForDB);

      console.log('Pakej umrah berhasil dibuat:', result);
      showMessage('Pakej umrah berhasil dibuat!', 'success');

      // Reset form setelah submit berhasil
      packageData = {
        namaPaket: '',
        musimId: '',
        kategoriId: '',
        tanggalBerangkat: '',
        tanggalKembali: '',
        airline: '',
        flightName: '',
        deskripsi: '',
        // Reset harga bilik
        hargaDouble: 0,
        hargaTriple: 0,
        hargaQuadruple: 0,
        hargaQuintuple: 0,
        // Reset harga anak dan infant
        hargaCNB: 0,
        hargaInfant: 0,
        // Reset harga deck
        lowDeckInterior: 0,
        lowDeckSeaview: 0,
        lowDeckBalcony: 0,
        highDeckInterior: 0,
        highDeckSeaview: 0,
        highDeckBalcony: 0
      };

    } catch (error) {
      console.error('Error saat membuat pakej umrah:', error);
      showMessage('Gagal membuat pakej umrah. Silakan coba lagi.', 'error');
    } finally {
      isSubmitting = false;
    }
  }

  function showMessage(text, type) {
    submitMessage = text;
    submitMessageType = type;

    // Auto hide message setelah 5 detik
    setTimeout(() => {
      submitMessage = '';
      submitMessageType = '';
    }, 5000);
  }

  function formatCurrency(amount) {
    if (!amount) return 'RM 0.00';

    // Format Malaysia: titik untuk ribuan, koma untuk desimal dengan 2 digit desimal
    return 'RM ' + new Intl.NumberFormat('ms-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-white/60">
  <div class="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
    <div class="flex items-center gap-2 sm:gap-3">
      <div class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-green-100 rounded-xl flex items-center justify-center">
        <Building2 class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600" />
      </div>
      <h2 class="text-base sm:text-lg lg:text-xl font-bold text-slate-800">Buat Pakej Umrah</h2>
    </div>
    
    <!-- Refresh Button -->
    <button
      type="button"
      on:click={refreshData}
      disabled={isLoading}
      class="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Refresh data"
    >
      <RefreshCw class="w-4 h-4 sm:w-5 sm:h-5 {isLoading ? 'animate-spin' : ''}" />
    </button>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-100 text-red-800 border border-red-200 rounded-lg text-xs sm:text-sm">
      <div class="flex items-center justify-between">
        <span>{error}</span>
        <button
          type="button"
          on:click={refreshData}
          class="ml-2 px-2 py-1 bg-red-200 hover:bg-red-300 text-red-800 rounded text-xs font-medium transition-colors flex items-center gap-1"
        >
          <RefreshCw class="w-3 h-3" />
          Retry
        </button>
      </div>
    </div>
  {/if}

  <!-- Submit Message Display -->
  {#if submitMessage}
    <div class="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm {submitMessageType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}">
      {submitMessage}
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="flex items-center justify-center py-6 sm:py-8">
      <div class="flex items-center gap-1.5 sm:gap-2 text-slate-600">
        <Loader2 class="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
        <span class="text-xs sm:text-sm">Memuat data musim, kategori, dan airlines...</span>
      </div>
    </div>
  {:else}
    <form on:submit|preventDefault={handleSubmit} class="space-y-3 sm:space-y-4 lg:space-y-6">
      <!-- Nama Pakej -->
      <div>
        <label for="namaPaket" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
          Nama Pakej *
        </label>
        <input
          id="namaPaket"
          type="text"
          bind:value={packageData.namaPaket}
          required
                      placeholder="Contoh: Pakej Umrah Ramadhan Premium 2024"
          class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      <!-- Musim dan Kategori -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label for="musimId" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
            Pilih Musim *
          </label>
          <select
            id="musimId"
            bind:value={packageData.musimId}
            required
            class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Pilih Musim</option>
            {#each seasons as season}
              <option value={season.id}>
                {season.name}
              </option>
            {/each}
          </select>
        </div>

        <div>
          <label for="kategoriId" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
            Pilih Kategori *
          </label>
          <select
            id="kategoriId"
            bind:value={packageData.kategoriId}
            required
            class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Pilih Kategori</option>
            {#each categories as category}
              <option value={category.id}>
                {category.name}
              </option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Tanggal Berangkat dan Kembali -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label for="tanggalBerangkat" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
            Tanggal Berangkat *
          </label>
          <input
            id="tanggalBerangkat"
            type="date"
            bind:value={packageData.tanggalBerangkat}
            required
            class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label for="tanggalKembali" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
            Tanggal Kembali *
          </label>
          <input
            id="tanggalKembali"
            type="date"
            bind:value={packageData.tanggalKembali}
            required
            class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

              <!-- Airline dan Flight Name (hanya untuk pakej non-cruise, non-pelayaran, tapi termasuk Umrah + Pelayaran) -->
      {#if (!isCruisePackage && !isPelayaranCategory) || isUmrahPelayaranCategory}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label for="airline" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
              Pilih Penerbangan *
            </label>
            <select
              id="airline"
              bind:value={packageData.airline}
              required
              class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Pilih Penerbangan</option>
              {#each airlines as airline}
                <option value={airline.id}>
                  {airline.name}
                </option>
              {/each}
            </select>
          </div>

          <div>
            <label for="flightName" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
              Nama Penerbangan
            </label>
            <input
              id="flightName"
              type="text"
              bind:value={packageData.flightName}
              placeholder="Contoh: MH1234"
              class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      {/if}

              <!-- Harga berdasarkan deck (untuk pakej cruise, kategori Pelayaran, dan Umrah + Pelayaran) -->
      {#if isCruisePackage || isPelayaranCategory || isUmrahPelayaranCategory}
        <div>
          <h4 class="font-medium text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Harga Berdasarkan Deck dan Tipe Bilik:</h4>
          
          <!-- Low Deck -->
          <div class="mb-4">
            <h5 class="font-medium text-slate-700 mb-3 text-sm">Low Deck</h5>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label for="lowDeckInterior" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Interior
                </label>
                <input
                  id="lowDeckInterior"
                  type="number"
                  bind:value={packageData.lowDeckInterior}
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                {#if packageData.lowDeckInterior > 0}
                  <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.lowDeckInterior)}</p>
                {/if}
              </div>

              <div>
                <label for="lowDeckSeaview" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Sea View
                </label>
                <input
                  id="lowDeckSeaview"
                  type="number"
                  bind:value={packageData.lowDeckSeaview}
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                {#if packageData.lowDeckSeaview > 0}
                  <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.lowDeckSeaview)}</p>
                {/if}
              </div>

              <div>
                <label for="lowDeckBalcony" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Balcony
                </label>
                <input
                  id="lowDeckBalcony"
                  type="number"
                  bind:value={packageData.lowDeckBalcony}
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                {#if packageData.lowDeckBalcony > 0}
                  <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.lowDeckBalcony)}</p>
                {/if}
              </div>
            </div>
          </div>

          <!-- High Deck -->
          <div>
            <h5 class="font-medium text-slate-700 mb-3 text-sm">High Deck</h5>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label for="highDeckInterior" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Interior
                </label>
                <input
                  id="highDeckInterior"
                  type="number"
                  bind:value={packageData.highDeckInterior}
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                {#if packageData.highDeckInterior > 0}
                  <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.highDeckInterior)}</p>
                {/if}
              </div>

              <div>
                <label for="highDeckSeaview" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Sea View
                </label>
                <input
                  id="highDeckSeaview"
                  type="number"
                  bind:value={packageData.highDeckSeaview}
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                {#if packageData.highDeckSeaview > 0}
                  <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.highDeckSeaview)}</p>
                {/if}
              </div>

              <div>
                <label for="highDeckBalcony" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                  Balcony
                </label>
                <input
                  id="highDeckBalcony"
                  type="number"
                  bind:value={packageData.highDeckBalcony}
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                {#if packageData.highDeckBalcony > 0}
                  <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.highDeckBalcony)}</p>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- Harga Bilik (untuk pakej non-cruise) -->
        <div>
          <h4 class="font-medium text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Harga Berdasarkan Tipe Bilik:</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label for="hargaDouble" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Harga Double Room
              </label>
              <input
                id="hargaDouble"
                type="number"
                bind:value={packageData.hargaDouble}
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
              {#if packageData.hargaDouble > 0}
                <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.hargaDouble)}</p>
              {/if}
            </div>

            <div>
              <label for="hargaTriple" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Harga Triple Room
              </label>
              <input
                id="hargaTriple"
                type="number"
                bind:value={packageData.hargaTriple}
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
              {#if packageData.hargaTriple > 0}
                <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.hargaTriple)}</p>
              {/if}
            </div>

            <div>
              <label for="hargaQuadruple" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Harga Quadruple Room
              </label>
              <input
                id="hargaQuadruple"
                type="number"
                bind:value={packageData.hargaQuadruple}
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
              {#if packageData.hargaQuadruple > 0}
                <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.hargaQuadruple)}</p>
              {/if}
            </div>

            <div>
              <label for="hargaQuintuple" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Harga Quintuple Room
              </label>
              <input
                id="hargaQuintuple"
                type="number"
                bind:value={packageData.hargaQuintuple}
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
              {#if packageData.hargaQuintuple > 0}
                <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.hargaQuintuple)}</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Harga Anak dan Infant (untuk pakej non-cruise) -->
        <div>
          <h4 class="font-medium text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Harga Anak dan Infant:</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label for="hargaCNB" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Harga CNB (Child No Bed)
              </label>
              <input
                id="hargaCNB"
                type="number"
                bind:value={packageData.hargaCNB}
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
              {#if packageData.hargaCNB > 0}
                <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.hargaCNB)}</p>
              {/if}
            </div>

            <div>
              <label for="hargaInfant" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                Harga Infant
              </label>
              <input
                id="hargaInfant"
                type="number"
                bind:value={packageData.hargaInfant}
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
              {#if packageData.hargaInfant > 0}
                <p class="text-xs text-slate-500 mt-1">{formatCurrency(packageData.hargaInfant)}</p>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Tombol Submit -->
      <button
        type="submit"
        disabled={isSubmitting}
        class="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg sm:rounded-xl transition-colors duration-200 shadow-soft hover:shadow-lg disabled:cursor-not-allowed"
      >
        {#if isSubmitting}
          <div class="flex items-center justify-center gap-1.5 sm:gap-2">
            <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs sm:text-sm">Menyimpan...</span>
          </div>
        {:else}
          <span class="text-xs sm:text-sm">Buat Pakej Umrah</span>
        {/if}
      </button>
    </form>
  {/if}
</div>

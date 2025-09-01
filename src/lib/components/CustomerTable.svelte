<script>
  import { onMount } from 'svelte';
  import { fetchCustomersDataPaginated, getInitials, getPackageColor } from '$lib/data/customers.js';
  import { Loader2, AlertTriangle, Users, X, Phone, Mail, MapPin, Calendar, User, Building, Package, Globe, Hash, FileText, ChevronLeft, ChevronRight } from 'lucide-svelte';
  
  // State untuk data
  let customersData = [];
  let loading = true;
  let error = null;
  
  // State untuk pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalCount = 0; // Total data dari Supabase
  
  // State untuk filter
  let searchTerm = '';
  let packageFilter = '';
  let branchFilter = '';
  let inquiryFilter = '';
  
  // State untuk modal detail
  let selectedCustomer = null;
  let showDetailModal = false;
  
  // Load data saat komponen dimount
  onMount(async () => {
    await loadPageData(1);
  });
  
  // Fungsi untuk load data per halaman
  async function loadPageData(page, filters = {}) {
    try {
      loading = true;
      const result = await fetchCustomersDataPaginated(page, itemsPerPage, filters);
      customersData = result.data;
      totalCount = result.totalCount;
      currentPage = page;
    } catch (err) {
      error = 'Gagal memuat data pelanggan';
      console.error('Error loading customers:', err);
    } finally {
      loading = false;
    }
  }
  
  // Load data dengan filter
  async function loadDataWithFilters() {
    const filters = {
      search: searchTerm,
      package: packageFilter,
      branch: branchFilter,
      inquiry: inquiryFilter
    };
    await loadPageData(1, filters);
  }
  
  // Data yang sudah difilter (server-side filtering sudah diterapkan)
  $: filteredCustomers = customersData;
  
  // Pagination
  $: totalPages = Math.ceil(totalCount / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  
  // Fungsi untuk halaman berikutnya
  async function nextPage() {
    if (currentPage < totalPages) {
      await loadPageData(currentPage + 1);
    }
  }
  
  // Fungsi untuk halaman sebelumnya
  async function prevPage() {
    if (currentPage > 1) {
      await loadPageData(currentPage - 1);
    }
  }

  // Fungsi untuk pergi ke halaman tertentu
  async function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      await loadPageData(page);
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
  
  // Fungsi untuk reset filter
  async function resetFilters() {
    searchTerm = '';
    packageFilter = '';
    branchFilter = '';
    inquiryFilter = '';
    await loadPageData(1);
  }
  
  // Fungsi untuk menampilkan modal detail
  function showCustomerDetail(customer) {
    selectedCustomer = customer;
    showDetailModal = true;
  }
  
  // Fungsi untuk menutup modal
  function closeDetailModal() {
    showDetailModal = false;
    selectedCustomer = null;
  }
  
  // Dapatkan daftar unik untuk filter (dari data yang sudah di-load)
  $: uniquePackages = [...new Set(customersData.map(c => c.package).filter(Boolean))];
  $: uniqueBranches = [...new Set(customersData.map(c => c.branch).filter(Boolean))];
  
  // Watch filter changes dan reload data dengan debounce
  let filterTimeout;
  $: {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      if (searchTerm || packageFilter || branchFilter || inquiryFilter) {
        loadDataWithFilters();
      }
    }, 300);
  }
</script>

<div class="bg-white rounded-xl shadow-soft border border-white/60 overflow-hidden">
  <!-- Header Tabel -->
  <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
    <div class="flex items-center justify-between mb-3 sm:mb-4">
    </div>
    
    <!-- Filter Bar -->
    <div class="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 sm:items-center">
      <!-- Search Input -->
      <div class="flex-1 min-w-0">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Cari nama..."
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      
      <!-- Package Filter -->
      <select
        bind:value={packageFilter}
        class="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Semua Pakej</option>
        {#each uniquePackages as packageType}
          <option value={packageType}>{packageType}</option>
        {/each}
      </select>
      
      <!-- Branch Filter -->
      <select
        bind:value={branchFilter}
        class="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Semua Cawangan</option>
        {#each uniqueBranches as branch}
          <option value={branch}>{branch}</option>
        {/each}
      </select>

      <!-- Inquiry Filter -->
      <select
        bind:value={inquiryFilter}
        class="w-full sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Semua Dari Inquiry</option>
        <option value="true">Ya</option>
        <option value="false">Tidak</option>
      </select>
      
      <!-- Reset Button -->
      <button
        on:click={resetFilters}
        class="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Reset
      </button>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="p-8 text-center">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-purple-500 hover:bg-purple-400 transition ease-in-out duration-150 cursor-not-allowed">
        <Loader2 class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
        Memuat data pelanggan...
      </div>
    </div>
  {:else if error}
    <div class="p-8 text-center">
      <div class="text-red-600 mb-4">
        <AlertTriangle class="mx-auto h-12 w-12 text-red-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Gagal memuat data</h3>
      <p class="text-gray-500 mb-4">{error}</p>
      <button 
        on:click={() => window.location.reload()}
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  {:else if customersData.length === 0}
    <div class="p-8 text-center">
      <div class="text-gray-400 mb-4">
        <Users class="mx-auto h-12 w-12" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Tidak ada data pelanggan</h3>
      <p class="text-gray-500">Belum ada data pelanggan yang tersedia.</p>
    </div>
  {:else}
    <!-- Tabel -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PELANGGAN
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CAWANGAN
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PAKEJ
            </th>
                        <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              MUSIM/DESTINASI
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DARI INQUIRY
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TOTAL HARGA
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TARIKH
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          {#each filteredCustomers as customer}
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer" on:click={() => showCustomerDetail(customer)}>
              <!-- Kolom PELANGGAN -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                    <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span class="text-xs sm:text-sm font-medium text-purple-600">
                        {customer.avatar}
                      </span>
                    </div>
                  </div>
                  <div class="ml-2 sm:ml-4">
                    <div class="text-xs sm:text-sm font-medium text-gray-900">{customer.name}</div>
                  </div>
                </div>
              </td>
              
              <!-- Kolom CAWANGAN -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.branch}</div>
              </td>
              
              <!-- Kolom PAKEJ -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border {getPackageColor(customer.package)}">
                  {customer.package}
                </span>
              </td>
              
              <!-- Kolom MUSIM/DESTINASI -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.seasonDestination || '-'}</div>
              </td>
              
              <!-- Kolom DARI INQUIRY -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">
                  {#if customer.from_inquiry}
                    <span class="text-green-600">✓ Ya</span>
                  {:else}
                    <span class="text-red-600">✗ Tidak</span>
                  {/if}
                </div>
              </td>
              
              <!-- Kolom TOTAL HARGA -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">
                  {#if customer.total_price && customer.total_price !== '-'}
                    <span class="font-semibold text-green-600">RM {parseFloat(customer.total_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </div>
              </td>
              
              <!-- Kolom TARIKH -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.date}</div>
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
                    class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'}"
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

<!-- Modal Detail Pelanggan -->
{#if showDetailModal && selectedCustomer}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span class="text-lg font-bold text-purple-600">
              {selectedCustomer.avatar}
            </span>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
            <p class="text-gray-500">Detail Lengkap Pelanggan</p>
          </div>
        </div>
        <button
          on:click={closeDetailModal}
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
                  <p class="text-gray-900">{selectedCustomer.email || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Phone class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Telepon</p>
                  <p class="text-gray-900">{selectedCustomer.phone || '-'}</p>
                </div>
              </div>
              
              {#if selectedCustomer.nokp}
                <div class="flex items-center gap-3">
                  <Hash class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-sm text-gray-500">No. KP</p>
                    <p class="text-gray-900">{selectedCustomer.nokp}</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedCustomer.age && selectedCustomer.age !== '-'}
                <div class="flex items-center gap-3">
                  <User class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-sm text-gray-500">Umur</p>
                    <p class="text-gray-900">{selectedCustomer.age} tahun</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedCustomer.birth_date && selectedCustomer.birth_date !== '-'}
                <div class="flex items-center gap-3">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  <div>
                    <p class="text-sm text-gray-500">Tanggal Lahir</p>
                    <p class="text-gray-900">{selectedCustomer.birth_date}</p>
                  </div>
                </div>
              {/if}
              
              {#if selectedCustomer.address && selectedCustomer.address !== '-'}
                <div class="flex items-start gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p class="text-sm text-gray-500">Alamat</p>
                    <p class="text-gray-900">{selectedCustomer.address}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Informasi Perjalanan -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Globe class="w-5 h-5 text-blue-600" />
              Informasi Perjalanan
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Building class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Cawangan</p>
                  <p class="text-gray-900">{selectedCustomer.branch}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Package class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Jenis Pakej</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border {getPackageColor(selectedCustomer.package)}">
                    {selectedCustomer.package}
                  </span>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Globe class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Musim/Destinasi</p>
                  <p class="text-gray-900">{selectedCustomer.seasonDestination || '-'}</p>
                </div>
              </div>
              
                             <div class="flex items-center gap-3">
                 <Calendar class="w-4 h-4 text-gray-400" />
                 <div>
                   <p class="text-sm text-gray-500">Tarikh Daftar</p>
                   <p class="text-gray-900">{selectedCustomer.date}</p>
                 </div>
               </div>
               
               <div class="flex items-center gap-3">
                 <Hash class="w-4 h-4 text-gray-400" />
                 <div>
                   <p class="text-sm text-gray-500">Dari Inquiry</p>
                   <span class="text-sm font-medium">
                     {#if selectedCustomer.from_inquiry}
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
              Harga
            </h3>
            
            <div class="space-y-3">
              {#if selectedCustomer.price && selectedCustomer.price !== '-'}
                <div>
                  <p class="text-sm text-gray-500">Bilangan</p>
                  <p class="text-lg font-semibold text-gray-900">{selectedCustomer.price}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.total_price && selectedCustomer.total_price !== '-'}
                <div>
                  <p class="text-sm text-gray-500">Total Harga</p>
                  <p class="text-2xl font-bold text-green-600">RM {parseFloat(selectedCustomer.total_price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              {/if}
            </div>
          </div>

          <!-- Informasi Tambahan -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-5 h-5 text-orange-600" />
              Informasi Tambahan
            </h3>
            
            <div class="space-y-3">
              {#if selectedCustomer.consultant && selectedCustomer.consultant !== '-'}
                <div>
                  <p class="text-sm text-gray-500">Sales Consultant</p>
                  <p class="text-gray-900">{selectedCustomer.consultant}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.jenis_pelancongan && selectedCustomer.jenis_pelancongan !== '-'}
                <div>
                  <p class="text-sm text-gray-500">Jenis Pelancongan</p>
                  <p class="text-gray-900">{selectedCustomer.jenis_pelancongan}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.package}
                <div>
                  <p class="text-sm text-gray-500">Jenis Pakej</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border {getPackageColor(selectedCustomer.package)}">
                    {selectedCustomer.package}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Modal -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button
          on:click={closeDetailModal}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

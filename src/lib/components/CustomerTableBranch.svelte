<script>
  import { onMount } from 'svelte';
  import { fetchCustomersDataByBranch, getInitials, getPackageColor } from '$lib/data/customers.js';
  import { Loader2, AlertTriangle, Users, X, Phone, Mail, MapPin, Calendar, User, Building, Package, Globe, Hash, FileText, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { user } from '$lib/stores/auth.js';
  import { supabase } from '$lib/supabase.js';
  
  let customersData = [];
  let loading = true;
  let error = null;
  let userBranch = null;
  
  // State untuk modal detail
  let selectedCustomer = null;
  let showDetailModal = false;
  
  // State untuk pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  
  onMount(async () => {
    try {
      loading = true;
      
      if ($user) {
        // Ambil informasi branch dari user yang login
        const { data: userProfile, error: profileError } = await supabase
          .from('admin_role')
          .select('branch_id, branches(name)')
          .eq('user_id', $user.id)
          .single();
        
        if (profileError || !userProfile?.branches?.name) {
          console.error('Error fetching user branch:', profileError);
          error = 'Gagal memuat informasi branch';
          return;
        }
        
        userBranch = userProfile.branches.name;
        
                  if (userBranch) {
            // Gunakan fungsi fetchCustomersDataByBranch untuk mengambil data real-time
            const branchData = await fetchCustomersDataByBranch(userBranch);
            
            if (branchData && branchData.length > 0) {
              customersData = branchData;
            } else {
              // Jika tidak ada data, set array kosong
              customersData = [];
              console.log(`Tidak ada data pelanggan untuk branch: ${userBranch}`);
            }
          } else {
          error = 'Branch tidak ditemukan';
        }
      }
    } catch (err) {
      error = 'Gagal memuat data pelanggan';
      console.error('Error loading customers:', err);
    } finally {
      loading = false;
    }
  });
  
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
  
  // Pagination
  $: totalPages = Math.ceil(customersData.length / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  $: paginatedCustomers = customersData.slice(startIndex, endIndex);
  
  // Fungsi untuk halaman berikutnya
  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }
  
  // Fungsi untuk halaman sebelumnya
  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  // Fungsi untuk pergi ke halaman tertentu
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
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
</script>

<div class="bg-white rounded-xl shadow-soft border border-white/60 overflow-hidden">
  <!-- Header Tabel -->
  <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
    <div class="mb-3 sm:mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Data Pelanggan Branch</h3>
      <p class="text-sm text-gray-600">Branch: {userBranch || 'Loading...'}</p>
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
    </div>
  {:else if customersData.length === 0}
    <div class="p-8 text-center">
      <div class="text-gray-400 mb-4">
        <Users class="mx-auto h-12 w-12" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Tidak ada data pelanggan</h3>
      <p class="text-gray-500 mb-4">Belum ada data pelanggan untuk branch <strong>{userBranch}</strong>.</p>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <p class="text-sm text-blue-800">
          <strong>Tips:</strong> Data pelanggan akan muncul setelah ada booking yang dibuat untuk branch ini.
        </p>
      </div>
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
              PAKEJ
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
             MUSIM/DESTINASI
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              DARI INQUIRY
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TARIKH
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              HARGA
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          {#each paginatedCustomers as customer}
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
              
              <!-- Kolom PAKEJ -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border {getPackageColor(customer.package)}">
                  {customer.package}
                </span>
              </td>
              
              <!-- Kolom DESTINASI -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.seasonDestination || customer.category || '-'}</div>
              </td>
              
              <!-- Kolom DARI INQUIRY -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">
                  {#if customer.from_inquiry}
                    <span class="text-green-600">✓</span>
                  {:else}
                    <span class="text-red-600">✗</span>
                  {/if}
                </div>
              </td>
              
              <!-- Kolom TARIKH -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">{customer.date}</div>
              </td>
              
              <!-- Kolom HARGA -->
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="text-xs sm:text-sm text-gray-900">
                  {#if customer.total_price && customer.total_price !== '-'}
                    <div class="font-medium text-green-600">RM {parseFloat(customer.total_price).toLocaleString('id-ID')}</div>
                    <div class="text-xs text-gray-500">{customer.price || '-'}</div>
                  {:else}
                    <div class="text-gray-500">{customer.price || '-'}</div>
                  {/if}
                </div>
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
            <span>Menampilkan {startIndex + 1} - {Math.min(endIndex, customersData.length)} dari {customersData.length} data</span>
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
                    <p class="text-sm text-gray-500">Alamat Lengkap</p>
                    <div class="space-y-1">
                      <p class="text-gray-900">{selectedCustomer.address}</p>
                      {#if selectedCustomer.poskod || selectedCustomer.bandar || selectedCustomer.negeri}
                        <div class="text-sm text-gray-600">
                          {#if selectedCustomer.poskod}{selectedCustomer.poskod}{/if}
                          {#if selectedCustomer.bandar}, {selectedCustomer.bandar}{/if}
                          {#if selectedCustomer.negeri}, {selectedCustomer.negeri}{/if}
                        </div>
                      {/if}
                    </div>
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
                  <p class="text-gray-900">{selectedCustomer.seasonDestination || selectedCustomer.category || '-'}</p>
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
              Harga dan Pembayaran
            </h3>
            
            <div class="space-y-3">
              {#if selectedCustomer.total_price && selectedCustomer.total_price !== '-'}
                <div>
                  <p class="text-sm text-gray-500">Total Harga</p>
                  <p class="text-2xl font-bold text-green-600">RM {parseFloat(selectedCustomer.total_price).toLocaleString('id-ID')}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.price && selectedCustomer.price !== '-'}
                <div>
                  <p class="text-sm text-gray-500">Jumlah Pax</p>
                  <p class="text-lg font-semibold text-gray-900">{selectedCustomer.price}</p>
                </div>
              {/if}
              
              {#if selectedCustomer.total_price && selectedCustomer.price && selectedCustomer.total_price !== '-' && selectedCustomer.price !== '-'}
                <div>
                  <p class="text-sm text-gray-500">Harga per Pax</p>
                  <p class="text-lg font-semibold text-gray-700">
                    RM {(parseFloat(selectedCustomer.total_price) / parseInt(selectedCustomer.price.split(' ')[0])).toLocaleString('id-ID')}
                  </p>
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
              
              {#if selectedCustomer.jenis_pelancongan}
                <div>
                  <p class="text-sm text-gray-500">Jenis Pelancongan</p>
                  <p class="text-gray-900">{selectedCustomer.jenis_pelancongan}</p>
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

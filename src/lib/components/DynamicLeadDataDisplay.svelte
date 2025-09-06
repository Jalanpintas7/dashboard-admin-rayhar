<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { formatDateMalaysia } from '$lib/date-helpers.js';
  import { Loader2, AlertTriangle, Users, TrendingUp, X, Phone, Mail, MapPin, Calendar, User, Building, Package, Globe, Hash, FileText, ChevronLeft, ChevronRight } from 'lucide-svelte';
  
  // Props untuk menerima nama branch
  export let branchName = '';
  
  let leadData = [];
  let loading = true;
  let error = null;

  // State untuk modal detail
  let selectedLead = null;
  let showDetailModal = false;
  
  // State untuk paginasi
  let currentPage = 1;
  const itemsPerPage = 10;
  
  // Reactive statement untuk reload data ketika branch berubah
  $: if (branchName) {
    loadLeadData();
  }
  
  // Computed values untuk paginasi
  $: totalPages = Math.ceil(leadData.length / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  $: paginatedLeads = leadData.slice(startIndex, endIndex);

  // Fungsi untuk menampilkan modal detail
  function showLeadDetail(lead) {
    selectedLead = lead;
    showDetailModal = true;
  }

  // Fungsi untuk menutup modal
  function closeDetailModal() {
    showDetailModal = false;
    selectedLead = null;
  }
  
  // Fungsi navigasi paginasi
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
  
  async function loadLeadData() {
    if (!branchName) return;
    
    try {
      loading = true;
      error = null;
      currentPage = 1; // Reset ke halaman pertama saat data dimuat ulang
      
      console.log('Loading leads for branch:', branchName);
      
      // Pertama, ambil branch ID berdasarkan nama branch
      const { data: branchInfo, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('name', branchName)
        .single();
      
      if (branchError || !branchInfo) {
        console.error('Error fetching branch info:', branchError);
        error = 'Gagal memuat informasi branch: ' + (branchError?.message || 'Branch tidak ditemukan');
        return;
      }
      
      console.log('Branch info:', branchInfo);
      
      // Kemudian, ambil leads berdasarkan branch_id dengan JOIN untuk mendapatkan nama interest
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          umrah_categories(name),
          destinations(name),
          package_types(name),
          umrah_seasons(name),
          sales_consultant(name)
        `)
        .eq('branch_id', branchInfo.id)
        .order('created_at', { ascending: false });
      
      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        error = 'Gagal memuat data leads: ' + leadsError.message;
        return;
      }
      
      console.log('Leads fetched for branch:', leadsData?.length || 0);
      
      // Transform data untuk display
      leadData = leadsData.map(lead => {
        // Tentukan interest berdasarkan data yang tersedia
        let interest = '-';
        if (lead.umrah_categories?.name) {
          interest = lead.umrah_categories.name;
        } else if (lead.destinations?.name) {
          interest = lead.destinations.name;
        } else if (lead.package_types?.name) {
          interest = lead.package_types.name;
        } else if (lead.umrah_seasons?.name) {
          interest = lead.umrah_seasons.name;
        }

        return {
          id: lead.id,
          name: lead.full_name || lead.title || 'Nama tidak tersedia',
          email: '-', // Email tidak ada di tabel leads
          phone: lead.phone || '-',
          branch: branchName, // Gunakan branch name yang diberikan
          interest: interest,
          date: formatDateMalaysia(lead.created_at),
          avatar: (lead.full_name || lead.title || 'NA').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
          address: '-', // Address tidak ada di tabel leads
          source: interest,
          budget: '-', // Budget tidak ada di tabel leads
          timeline: '-', // Timeline tidak ada di tabel leads
          consultant: lead.sales_consultant?.name || '-', // Ambil dari JOIN
          notes: '-', // Notes tidak ada di tabel leads
          // Tambahan field untuk detail
          seasonDestination: interest,
          packageType: lead.package_types?.name || '-',
          destination: lead.destinations?.name || '-',
          outboundDate: '-'
        };
      });
      
      console.log(`Loaded ${leadData.length} leads for branch: ${branchName}`);
      
    } catch (err) {
      console.error('Error loading lead data:', err);
      error = 'Gagal memuat data leads: ' + (err.message || 'Unknown error');
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-4">
  {#if loading}
    <div class="text-center py-8">
      <Loader2 class="mx-auto h-8 w-8 animate-spin text-[rgb(148,35,146)]" />
      <p class="mt-2 text-sm text-gray-600">Memuat data leads...</p>
    </div>
  {:else if error}
    <div class="text-center py-8">
      <AlertTriangle class="mx-auto h-8 w-8 text-red-600" />
      <p class="mt-2 text-sm text-red-600">{error}</p>
      <button
        on:click={loadLeadData}
        class="mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
        style="background-color: rgb(148, 35, 146);"
      >
        Coba Lagi
      </button>
    </div>
  {:else if leadData.length === 0}
    <div class="text-center py-8">
      <TrendingUp class="mx-auto h-8 w-8 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data lead</h3>
      <p class="mt-1 text-sm text-gray-500">Belum ada data lead untuk branch <strong>{branchName}</strong>.</p>
      <div class="mt-4 bg-[rgba(148,35,146,0.05)] border border-[rgba(148,35,146,0.15)] rounded-lg p-4 max-w-md mx-auto">
        <p class="text-sm text-[rgb(148,35,146)]">
          <strong>Tips:</strong> Data lead akan muncul setelah ada inquiry yang dibuat untuk branch ini.
        </p>
      </div>
    </div>
  {:else}
    <!-- Tabel Leads -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              LEAD
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              INTEREST
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TARIKH
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          {#each paginatedLeads as lead}
            <tr class="hover:bg-[rgba(148,35,146,0.02)] transition-colors cursor-pointer" on:click={() => showLeadDetail(lead)}>
              <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                    <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[rgba(148,35,146,0.1)] flex items-center justify-center">
                      <span class="text-xs sm:text-sm font-medium text-[rgb(148,35,146)]">
                        {lead.avatar}
                      </span>
                    </div>
                  </div>
                  <div class="ml-2 sm:ml-4">
                    <div class="text-xs sm:text-sm font-medium text-gray-900">{lead.name}</div>
                    <div class="text-xs text-gray-500">{lead.phone}</div>
                  </div>
                </div>
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
      <div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Menampilkan {startIndex + 1} sampai {Math.min(endIndex, leadData.length)} dari {leadData.length} hasil
          </div>
          <div class="flex items-center space-x-2">
            <button
              on:click={goToPreviousPage}
              disabled={currentPage === 1}
              class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                  class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 {currentPage === page ? 'bg-[rgb(148,35,146)] text-white border-[rgb(148,35,146)]' : ''}"
                >
                  {page}
                </button>
              {/if}
            {/each}
            
            <button
              on:click={goToNextPage}
              disabled={currentPage === totalPages}
              class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Summary -->
    <div class="bg-[rgba(148,35,146,0.05)] border border-[rgba(148,35,146,0.15)] rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <h5 class="text-sm font-medium text-[rgb(148,35,146)]">Total Leads {branchName}</h5>
          <p class="text-2xl font-bold text-[rgb(148,35,146)]">{leadData.length}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-[rgb(148,35,146)]">Branch: {branchName}</p>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Modal Detail Lead -->
{#if showDetailModal && selectedLead}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-[rgba(148,35,146,0.1)] rounded-xl flex items-center justify-center">
            <span class="text-lg font-bold text-[rgb(148,35,146)]">
              {selectedLead.avatar}
            </span>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{selectedLead.name}</h2>
            <p class="text-gray-500">Detail Lead</p>
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
        <!-- Informasi Utama -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-5 h-5 text-[rgb(148,35,146)]" />
              Informasi Lead
            </h3>

            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Phone class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Telepon</p>
                  <p class="text-gray-900 break-words">{selectedLead.phone || '-'}</p>
                </div>
              </div>


              <div class="flex items-center gap-3">
                <Building class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Cawangan</p>
                  <p class="text-gray-900 break-words">{selectedLead.branch || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Informasi Tambahan -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-green-600" />
              Informasi Tambahan
            </h3>

            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Globe class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Interest</p>
                  <p class="text-gray-900 break-words">{selectedLead.interest || selectedLead.seasonDestination || '-'}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Calendar class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Tarikh Daftar</p>
                  <p class="text-gray-900 break-words">{selectedLead.date || '-'}</p>
                </div>
              </div>

              {#if selectedLead.source && selectedLead.source !== '-'}
                <div class="flex items-center gap-3">
                  <Hash class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Interest/Sumber</p>
                    <p class="text-gray-900 break-words">{selectedLead.source}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Informasi Tambahan lainnya -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText class="w-5 h-5 text-purple-600" />
              Detail Tambahan
            </h3>

            <div class="space-y-3">
              {#if selectedLead.packageType && selectedLead.packageType !== '-'}
                <div class="flex items-center gap-3">
                  <Package class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Jenis Pakej</p>
                    <p class="text-gray-900 break-words">{selectedLead.packageType}</p>
                  </div>
                </div>
              {/if}

              {#if selectedLead.destination && selectedLead.destination !== '-'}
                <div class="flex items-center gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Destinasi</p>
                    <p class="text-gray-900 break-words">{selectedLead.destination}</p>
                  </div>
                </div>
              {/if}

              {#if selectedLead.consultant && selectedLead.consultant !== '-'}
                <div class="flex items-center gap-3">
                  <User class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Sales Consultant</p>
                    <p class="text-gray-900 break-words">{selectedLead.consultant}</p>
                  </div>
                </div>
              {/if}

              {#if selectedLead.outboundDate && selectedLead.outboundDate !== '-'}
                <div class="flex items-center gap-3">
                  <Calendar class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Tarikh Outbound</p>
                    <p class="text-gray-900 break-words">{selectedLead.outboundDate}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-5 h-5 text-orange-600" />
              Informasi Lainnya
            </h3>

            <div class="space-y-3">
              {#if selectedLead.budget && selectedLead.budget !== '-'}
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Budget</p>
                  <p class="text-gray-900 break-words">{selectedLead.budget}</p>
                </div>
              {/if}

              {#if selectedLead.timeline && selectedLead.timeline !== '-'}
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Timeline</p>
                  <p class="text-gray-900 break-words">{selectedLead.timeline}</p>
                </div>
              {/if}



              {#if selectedLead.notes && selectedLead.notes !== '-'}
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Catatan</p>
                  <p class="text-gray-900 break-words">{selectedLead.notes}</p>
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

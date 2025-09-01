<script>
  import { onMount } from 'svelte';
  import { getInitials } from '$lib/data/customers.js';
  import { Loader2, AlertTriangle, Users, X, Phone, Mail, MapPin, Calendar, User, Building, Package, Globe, Hash, FileText, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { user } from '$lib/stores/auth.js';
  import { supabase } from '$lib/supabase.js';
  import { formatDateMalaysia } from '$lib/date-helpers.js';
  
  let leadsData = [];
  let loading = true;
  let error = null;
  let userBranch = null;
  
  let selectedLead = null;
  let showDetailModal = false;
  
  // State untuk pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  
  onMount(async () => {
    try {
      loading = true;
      
      if ($user) {
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
          // Gunakan fungsi fetchLeadsDataByBranch untuk mengambil data real-time
          const branchData = await fetchLeadsDataByBranch(userBranch);
          
          if (branchData && branchData.length > 0) {
            leadsData = branchData;
          } else {
            // Jika tidak ada data, set array kosong
            leadsData = [];
            console.log(`Tidak ada data lead untuk branch: ${userBranch}`);
          }
        } else {
          error = 'Branch tidak ditemukan';
        }
      }
    } catch (err) {
      error = 'Gagal memuat data lead';
      console.error('Error loading leads:', err);
    } finally {
      loading = false;
    }
  });
  
  // Fungsi untuk mengambil data lead berdasarkan branch tertentu
  async function fetchLeadsDataByBranch(branchName) {
    try {
      console.log('Fetching leads for branch:', branchName);
      
      // Query yang efisien dengan join langsung ke branches
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          title,
          full_name,
          phone,
          branch_id,
          season_id,
          category_id,
          created_at,
          package_type_id,
          destination_id,
          outbound_date_id,
          category,
          branches!inner(name),
          umrah_seasons(name),
          umrah_categories(name),
          package_types(name),
          destinations(name),
          outbound_dates(start_date, end_date)
        `)
        .eq('branches.name', branchName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads by branch:', error);
        return [];
      }

      console.log('Raw data from Supabase for branch:', branchName, data);
      console.log('Number of leads found:', data?.length || 0);

      // Transform data untuk kompatibilitas dengan komponen yang ada
      return data.map(lead => {
        // Tentukan interest berdasarkan data yang tersedia
        let interest = '-';
        if (lead.umrah_seasons?.name) {
          interest = lead.umrah_seasons.name;
        } else if (lead.umrah_categories?.name) {
          interest = lead.umrah_categories.name;
        } else if (lead.destinations?.name) {
          interest = lead.destinations.name;
        } else if (lead.package_types?.name) {
          interest = lead.package_types.name;
        }

        return {
          id: lead.id,
          name: lead.full_name || lead.title || 'Nama tidak tersedia',
          email: '-', // Email tidak ada di tabel leads
          phone: lead.phone || '-',
          branch: lead.branches?.name || '-',
          interest: interest,
          date: formatDateMalaysia(lead.created_at),
          avatar: getInitials(lead.full_name || lead.title || 'NA'),
          address: '-', // Address tidak ada di tabel leads
          source: lead.category || '-',
          budget: '-', // Budget tidak ada di tabel leads
          timeline: '-', // Timeline tidak ada di tabel leads
          consultant: '-', // Consultant tidak ada di tabel leads
          notes: '-', // Notes tidak ada di tabel leads
          // Tambahan field untuk detail
          seasonDestination: interest,
          packageType: lead.package_types?.name || '-',
          destination: lead.destinations?.name || '-',
          outboundDate: lead.outbound_dates ? 
            `${lead.outbound_dates.start_date} - ${lead.outbound_dates.end_date}` : '-'
        };
      });
    } catch (error) {
      console.error('Error in fetchLeadsDataByBranch:', error);
      return [];
    }
  }
  
  function showLeadDetail(lead) {
    selectedLead = lead;
    showDetailModal = true;
  }
  
  function closeDetailModal() {
    showDetailModal = false;
    selectedLead = null;
  }
  
  // Pagination
  $: totalPages = Math.ceil(leadsData.length / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = startIndex + itemsPerPage;
  $: paginatedLeads = leadsData.slice(startIndex, endIndex);
  
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
  <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
    <div class="mb-3 sm:mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Data Lead Branch</h3>
      <p class="text-sm text-gray-600">Branch: {userBranch || 'Loading...'}</p>
    </div>
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
  {:else if leadsData.length === 0}
    <div class="p-8 text-center">
      <div class="text-gray-400 mb-4">
        <TrendingUp class="mx-auto h-12 w-12" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Tidak ada data lead</h3>
      <p class="text-gray-500 mb-4">Belum ada data lead untuk branch <strong>{userBranch}</strong>.</p>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <p class="text-sm text-blue-800">
          <strong>Tips:</strong> Data lead akan muncul setelah ada inquiry yang dibuat untuk branch ini.
        </p>
      </div>
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
              INTEREST
            </th>
            <th class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              TARIKH
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          {#each paginatedLeads as lead}
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
            <span>Menampilkan {startIndex + 1} - {Math.min(endIndex, leadsData.length)} dari {leadsData.length} data</span>
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

{#if showDetailModal && selectedLead}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span class="text-lg font-bold text-blue-600">
              {selectedLead.avatar}
            </span>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">{selectedLead.name}</h2>
            <p class="text-gray-500">Detail Lengkap Lead</p>
          </div>
        </div>
        <button
          on:click={closeDetailModal}
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User class="w-5 h-5 text-blue-600" />
              Informasi Pribadi
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Mail class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="text-gray-900">{selectedLead.email || '-'}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <Phone class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Telepon</p>
                  <p class="text-gray-900">{selectedLead.phone || '-'}</p>
                </div>
              </div>
              
              {#if selectedLead.address && selectedLead.address !== '-'}
                <div class="flex items-start gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p class="text-sm text-gray-500">Alamat</p>
                    <p class="text-gray-900">{selectedLead.address}</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-green-600" />
              Informasi Lead
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Building class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Cawangan</p>
                  <p class="text-gray-900">{selectedLead.branch}</p>
                </div>
              </div>
              

              
              <div class="flex items-center gap-3">
                <Package class="w-4 h-4 text-gray-400" />
                <div>
                  <p class="text-sm text-gray-500">Minat</p>
                  <p class="text-gray-900">{selectedLead.interest || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

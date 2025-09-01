<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { formatDateMalaysia } from '$lib/date-helpers.js';
  import { Loader2, AlertTriangle, Users, TrendingUp } from 'lucide-svelte';
  
  // Props untuk menerima nama branch
  export let branchName = '';
  
  let leadData = [];
  let loading = true;
  let error = null;
  
  // Reactive statement untuk reload data ketika branch berubah
  $: if (branchName) {
    loadLeadData();
  }
  
  async function loadLeadData() {
    if (!branchName) return;
    
    try {
      loading = true;
      error = null;
      
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
      
      // Kemudian, ambil leads berdasarkan branch_id
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
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
        return {
          id: lead.id,
          name: lead.full_name || lead.title || 'Nama tidak tersedia',
          email: '-', // Email tidak ada di tabel leads
          phone: lead.phone || '-',
          branch: branchName, // Gunakan branch name yang diberikan
          interest: lead.category || '-',
          date: formatDateMalaysia(lead.created_at),
          avatar: (lead.full_name || lead.title || 'NA').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
          address: '-', // Address tidak ada di tabel leads
          source: lead.category || '-',
          budget: '-', // Budget tidak ada di tabel leads
          timeline: '-', // Timeline tidak ada di tabel leads
          consultant: '-', // Consultant tidak ada di tabel leads
          notes: '-', // Notes tidak ada di tabel leads
          // Tambahan field untuk detail
          seasonDestination: lead.category || '-',
          packageType: '-',
          destination: '-',
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
      <Loader2 class="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p class="mt-2 text-sm text-gray-600">Memuat data leads...</p>
    </div>
  {:else if error}
    <div class="text-center py-8">
      <AlertTriangle class="mx-auto h-8 w-8 text-red-600" />
      <p class="mt-2 text-sm text-red-600">{error}</p>
      <button 
        on:click={loadLeadData}
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Coba Lagi
      </button>
    </div>
  {:else if leadData.length === 0}
    <div class="text-center py-8">
      <TrendingUp class="mx-auto h-8 w-8 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data lead</h3>
      <p class="mt-1 text-sm text-gray-500">Belum ada data lead untuk branch <strong>{branchName}</strong>.</p>
      <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <p class="text-sm text-blue-800">
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
          {#each leadData as lead}
            <tr class="hover:bg-gray-50 transition-colors">
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
    
    <!-- Summary -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <h5 class="text-sm font-medium text-blue-800">Total Leads {branchName}</h5>
          <p class="text-2xl font-bold text-blue-600">{leadData.length}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-blue-600">Branch: {branchName}</p>
        </div>
      </div>
    </div>
  {/if}
</div>

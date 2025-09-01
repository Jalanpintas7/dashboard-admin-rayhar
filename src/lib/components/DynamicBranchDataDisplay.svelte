<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { formatDateMalaysia } from '$lib/date-helpers.js';
  import { Loader2, AlertTriangle, Users } from 'lucide-svelte';
  
  // Props untuk menerima nama branch
  export let branchName = '';
  
  let branchData = [];
  let loading = true;
  let error = null;
  
  // Reactive statement untuk reload data ketika branch berubah
  $: if (branchName) {
    loadBranchData();
  }
  
  async function loadBranchData() {
    if (!branchName) return;
    
    try {
      loading = true;
      error = null;
      
      // Ambil data branch berdasarkan nama
      const { data: branchInfo, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('name', branchName)
        .single();
      
      if (branchError || !branchInfo) {
        console.error('Error fetching branch:', branchError);
        error = `Gagal memuat data branch ${branchName}`;
        return;
      }
      
      // Ambil data bookings untuk branch tersebut
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          gelaran,
          nama,
          nokp,
          telefon,
          email,
          alamat,
          poskod,
          negeri,
          bandar,
          bilangan,
          total_price,
          age,
          birth_date,
          created_at,
          branch_id,
          destination_id,
          package_id,
          consultant_id,
          umrah_season_id,
          umrah_category_id,
          is_from_inquiry
        `)
        .eq('branch_id', branchInfo.id)
        .order('created_at', { ascending: false });
      
      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        error = `Gagal memuat data bookings untuk ${branchName}`;
        return;
      }
      
      // Ambil data untuk join
      const { data: packageTypesData } = await supabase
        .from('package_types')
        .select('id, name');
      
      const { data: destinationsData } = await supabase
        .from('destinations')
        .select('id, name');
      
      const { data: umrahSeasonsData } = await supabase
        .from('umrah_seasons')
        .select('id, name');
      
      const { data: umrahCategoriesData } = await supabase
        .from('umrah_categories')
        .select('id, name');
      
      const { data: salesConsultantData } = await supabase
        .from('sales_consultant')
        .select('id, name');
      
      // Buat map untuk lookup
      const packageTypesMap = new Map(packageTypesData?.map(p => [p.id, p.name]) || []);
      const destinationsMap = new Map(destinationsData?.map(d => [d.id, d.name]) || []);
      const umrahSeasonsMap = new Map(umrahSeasonsData?.map(u => [u.id, u.name]) || []);
      const umrahCategoriesMap = new Map(umrahCategoriesData?.map(u => [u.id, u.name]) || []);
      const salesConsultantMap = new Map(salesConsultantData?.map(s => [s.id, s.name]) || []);
      
      // Transform data
      branchData = bookingsData.map(booking => {
        const isUmrah = booking.umrah_season_id !== null || booking.umrah_category_id !== null;
        const isOutbound = booking.destination_id !== null;
        
        let seasonDestination = '-';
        if (isUmrah) {
          const umrahSeasonName = umrahSeasonsMap.get(booking.umrah_season_id);
          const umrahCategoryName = umrahCategoriesMap.get(booking.umrah_category_id);
          if (umrahSeasonName) {
            seasonDestination = umrahSeasonName;
          } else if (umrahCategoryName) {
            seasonDestination = umrahCategoryName;
          } else {
            seasonDestination = 'Umrah Standard';
          }
        } else if (isOutbound) {
          seasonDestination = destinationsMap.get(booking.destination_id) || '-';
        }
        
        return {
          id: booking.id,
          name: `${booking.gelaran || ''} ${booking.nama}`.trim(),
          email: booking.email,
          phone: booking.telefon,
          branch: branchInfo.name,
          package: isUmrah ? 'Umrah' : (isOutbound ? 'Outbound' : 'Tidak Diketahui'),
          category: seasonDestination,
          price: booking.bilangan ? `${booking.bilangan} pax` : '-',
          total_price: booking.total_price || '-',
          date: formatDateMalaysia(booking.created_at),
          consultant: salesConsultantMap.get(booking.consultant_id) || '-',
          from_inquiry: booking.is_from_inquiry || false,
          seasonDestination: seasonDestination
        };
      });
      
    } catch (err) {
      error = `Gagal memuat data untuk branch ${branchName}`;
      console.error('Error in DynamicBranchDataDisplay:', err);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    if (branchName) {
      loadBranchData();
    }
  });
</script>

<div class="space-y-4">
  {#if loading}
    <div class="text-center py-4">
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
        <Loader2 class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
        Memuat data {branchName}...
      </div>
    </div>
  {:else if error}
    <div class="text-center py-4">
      <div class="text-red-600 mb-4">
        <AlertTriangle class="mx-auto h-12 w-12 text-red-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Gagal memuat data</h3>
      <p class="text-gray-500">{error}</p>
    </div>
  {:else if branchData.length === 0}
    <div class="text-center py-4">
      <div class="text-gray-400 mb-4">
        <Users class="mx-auto h-12 w-12" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
      <p class="text-gray-500">Tidak ada bookings untuk branch <strong>{branchName}</strong>.</p>
    </div>
  {:else}
    <!-- Data Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-blue-50 border-b border-blue-100">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
              PELANGGAN
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
              PAKEJ
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
              MUSIM/DESTINASI
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
              DARI INQUIRY
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
              TARIKH
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
              HARGA
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-blue-100">
          {#each branchData as customer}
            <tr class="hover:bg-blue-50 transition-colors">
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-600">
                        {customer.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div class="text-sm text-gray-500">{customer.email}</div>
                  </div>
                </div>
              </td>
              
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                  {customer.package}
                </span>
              </td>
              
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm text-gray-900">{customer.seasonDestination}</div>
              </td>
              
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {#if customer.from_inquiry}
                    <span class="text-green-600">✓</span>
                  {:else}
                    <span class="text-red-600">✗</span>
                  {/if}
                </div>
              </td>
              
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm text-gray-900">{customer.date}</div>
              </td>
              
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {#if customer.total_price && customer.total_price !== '-'}
                    <div class="font-medium text-green-600">RM {parseFloat(customer.total_price).toLocaleString('id-ID')}</div>
                    <div class="text-xs text-gray-500">{customer.price}</div>
                  {:else}
                    <div class="text-gray-500">{customer.price}</div>
                  {/if}
                </div>
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
          <h5 class="text-sm font-medium text-blue-800">Total Bookings {branchName}</h5>
          <p class="text-2xl font-bold text-blue-600">{branchData.length}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-blue-600">Branch: {branchName}</p>
        </div>
      </div>
    </div>
  {/if}
</div>

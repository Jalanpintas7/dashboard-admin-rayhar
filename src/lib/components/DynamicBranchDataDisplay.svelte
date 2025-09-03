<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';
  import { formatDateMalaysia } from '$lib/date-helpers.js';
  import { Loader2, AlertTriangle, Users, X, Phone, Mail, MapPin, Calendar, User, Building, Package, Globe, Hash, FileText } from 'lucide-svelte';
  
  // Props untuk menerima nama branch
  export let branchName = '';
  
  let branchData = [];
  let loading = true;
  let error = null;

  // State untuk modal detail
  let selectedCustomer = null;
  let showDetailModal = false;
  
  // Reactive statement untuk reload data ketika branch berubah
  $: if (branchName) {
    loadBranchData();
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

        // Generate avatar initials
        const fullName = `${booking.gelaran || ''} ${booking.nama}`.trim();
        const avatar = fullName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();

        // Hitung jenis_pelancongan secara dinamis (tidak ada di tabel)
        const jenis_pelancongan = isUmrah ? 'Umrah' : (isOutbound ? 'Outbound' : '-');

        return {
          id: booking.id,
          name: fullName,
          avatar: avatar,
          email: booking.email || '-',
          phone: booking.telefon || '-',
          nokp: booking.nokp || '-',
          age: booking.age || '-',
          birth_date: booking.birth_date || '-',
          address: booking.alamat || '-',
          poskod: booking.poskod || '-',
          bandar: booking.bandar || '-',
          negeri: booking.negeri || '-',
          branch: branchInfo.name,
          package: isUmrah ? 'Umrah' : (isOutbound ? 'Outbound' : 'Tidak Diketahui'),
          category: seasonDestination,
          price: booking.bilangan ? `${booking.bilangan} pax` : '-',
          total_price: booking.total_price || '-',
          date: formatDateMalaysia(booking.created_at),
          consultant: salesConsultantMap.get(booking.consultant_id) || '-',
          from_inquiry: booking.is_from_inquiry || false,
          seasonDestination: seasonDestination,
          jenis_pelancongan: jenis_pelancongan
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
      <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white" style="background-color: rgb(148, 35, 146);">
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
        <thead class="bg-[rgba(148,35,146,0.05)] border-b border-[rgba(148,35,146,0.1)]">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-[rgb(148,35,146)] uppercase tracking-wider">
              PELANGGAN
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-[rgb(148,35,146)] uppercase tracking-wider">
              PAKEJ
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-[rgb(148,35,146)] uppercase tracking-wider">
              MUSIM/DESTINASI
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-[rgb(148,35,146)] uppercase tracking-wider">
              DARI INQUIRY
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-[rgb(148,35,146)] uppercase tracking-wider">
              TARIKH
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-[rgb(148,35,146)] uppercase tracking-wider">
              HARGA
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-[rgba(148,35,146,0.1)]">
          {#each branchData as customer}
            <tr class="hover:bg-[rgba(148,35,146,0.02)] transition-colors cursor-pointer" on:click={() => showCustomerDetail(customer)}>
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-[rgba(148,35,146,0.1)] flex items-center justify-center">
                      <span class="text-sm font-medium text-[rgb(148,35,146)]">
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
                <span class="inline-flex px-2 py-1 rounded-full text-xs font-medium border bg-[rgba(148,35,146,0.1)] text-[rgb(148,35,146)] border-[rgba(148,35,146,0.2)]">
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
                    <div class="font-medium text-green-600">RM {parseFloat(customer.total_price).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
    <div class="bg-[rgba(148,35,146,0.05)] border border-[rgba(148,35,146,0.15)] rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div>
          <h5 class="text-sm font-medium text-[rgb(148,35,146)]">Total Bookings {branchName}</h5>
          <p class="text-2xl font-bold text-[rgb(148,35,146)]">{branchData.length}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-[rgb(148,35,146)]">Branch: {branchName}</p>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Modal Detail Pelanggan -->
{#if showDetailModal && selectedCustomer}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-[rgba(148,35,146,0.1)] rounded-xl flex items-center justify-center">
            <span class="text-lg font-bold text-[rgb(148,35,146)]">
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
              <User class="w-5 h-5 text-blue-600" />
              Informasi Pribadi
            </h3>

            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Mail class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="text-gray-900 break-words">{selectedCustomer.email || '-'}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Phone class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Telepon</p>
                  <p class="text-gray-900 break-words">{selectedCustomer.phone || '-'}</p>
                </div>
              </div>

              {#if selectedCustomer.nokp && selectedCustomer.nokp !== '-'}
                <div class="flex items-center gap-3">
                  <Hash class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">No. KP</p>
                    <p class="text-gray-900 break-words">{selectedCustomer.nokp}</p>
                  </div>
                </div>
              {/if}

              {#if selectedCustomer.age && selectedCustomer.age !== '-'}
                <div class="flex items-center gap-3">
                  <User class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Umur</p>
                    <p class="text-gray-900 break-words">{selectedCustomer.age} tahun</p>
                  </div>
                </div>
              {/if}

              {#if selectedCustomer.birth_date && selectedCustomer.birth_date !== '-'}
                <div class="flex items-center gap-3">
                  <Calendar class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Tanggal Lahir</p>
                    <p class="text-gray-900 break-words">{selectedCustomer.birth_date}</p>
                  </div>
                </div>
              {/if}

              {#if selectedCustomer.address && selectedCustomer.address !== '-'}
                <div class="flex items-start gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-500">Alamat Lengkap</p>
                    <div class="space-y-1">
                      <p class="text-gray-900 break-words">{selectedCustomer.address}</p>
                      {#if selectedCustomer.poskod || selectedCustomer.bandar || selectedCustomer.negeri}
                        <div class="text-sm text-gray-600 break-words">
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
              <Globe class="w-5 h-5 text-green-600" />
              Informasi Perjalanan
            </h3>

                        <div class="space-y-3">
              <div class="flex items-center gap-3">
                <Building class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Cawangan</p>
                  <p class="text-gray-900 break-words">{selectedCustomer.branch}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Package class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Jenis Pakej</p>
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[rgba(148,35,146,0.1)] text-[rgb(148,35,146)] border-[rgba(148,35,146,0.2)]">
                    {selectedCustomer.package}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Globe class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Musim/Destinasi</p>
                  <p class="text-gray-900 break-words">{selectedCustomer.seasonDestination || selectedCustomer.category || '-'}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Calendar class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Tarikh Daftar</p>
                  <p class="text-gray-900 break-words">{selectedCustomer.date}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Hash class="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div class="min-w-0">
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
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Total Harga</p>
                  <p class="text-2xl font-bold text-green-600 break-words">RM {parseFloat(selectedCustomer.total_price).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              {/if}

              {#if selectedCustomer.price && selectedCustomer.price !== '-'}
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Jumlah Pax</p>
                  <p class="text-lg font-semibold text-gray-900 break-words">{selectedCustomer.price}</p>
                </div>
              {/if}

              {#if selectedCustomer.total_price && selectedCustomer.price && selectedCustomer.total_price !== '-' && selectedCustomer.price !== '-'}
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Harga per Pax</p>
                  <p class="text-lg font-semibold text-gray-700 break-words">
                    RM {(parseFloat(selectedCustomer.total_price) / parseInt(selectedCustomer.price.split(' ')[0])).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Sales Consultant</p>
                  <p class="text-gray-900 break-words">{selectedCustomer.consultant}</p>
                </div>
              {/if}

              {#if selectedCustomer.jenis_pelancongan && selectedCustomer.jenis_pelancongan !== '-'}
                <div class="min-w-0">
                  <p class="text-sm text-gray-500">Jenis Pelancongan</p>
                  <p class="text-gray-900 break-words">{selectedCustomer.jenis_pelancongan}</p>
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

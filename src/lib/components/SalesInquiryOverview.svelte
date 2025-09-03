<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase.js';

  // Data untuk diagram batang - akan diisi dari Supabase
  let barChartData = [];
  let isLoading = true;
  let totalRevenue = 0; // Total pendapatan RM

  // Filter options
  let isMenuOpen = false;
  let selectedFilter = 'Total Sales';

  // Fungsi untuk mendapatkan tanggal dinamis
  function getDateLabels() {
    const today = new Date();
    const dates = [];
    
    // Hari ini
    dates.push(formatDate(today));
    
    // 1 hari yang lalu
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    dates.push(formatDate(yesterday));
    
    // 2 hari yang lalu
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    dates.push(formatDate(twoDaysAgo));
    
    return dates;
  }

  // Fungsi untuk format tanggal
  function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const monthNames = [
      'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
      'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
    ];
    
    return `${day} ${monthNames[month]} ${year}`;
  }

  // Fungsi untuk mengambil data dari Supabase
  async function fetchData() {
    try {
      isLoading = true;

      let data, error;

      if (selectedFilter === 'Total Sales') {
        // Query untuk data bookings dengan total_price dan bilangan (jumlah peserta)
        // Menghitung total peserta = jumlah booking records + sum(bilangan) per booking
        const result = await supabase
          .from('bookings')
          .select('created_at, umrah_category_id, total_price, bilangan')
          .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
        data = result.data;
        error = result.error;
      } else {
        // Query untuk data leads
        const result = await supabase
          .from('leads')
          .select('created_at, category_id')
          .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      // Proses data untuk mendapatkan statistik harian
      const dailyStats = processData(data);
      
      // Hitung total pendapatan jika Total Sales
      if (selectedFilter === 'Total Sales') {
        totalRevenue = data.reduce((sum, item) => {
          return sum + (item.total_price || 0);
        }, 0);
      } else {
        totalRevenue = 0; // Reset untuk leads
      }
      
      // Buat data untuk chart
      barChartData = dailyStats.map(stat => ({
        pelancongan: { percentage: stat.pelanconganPercentage },
        umrah: { percentage: stat.umrahPercentage },
        date: stat.date,
        pelanconganCount: stat.pelanconganCount,
        umrahCount: stat.umrahCount,
        totalCount: stat.totalCount,
        pelanconganRevenue: stat.pelanconganRevenue,
        umrahRevenue: stat.umrahRevenue
      }));

    } catch (error) {
      console.error('Error:', error);
      // Jika error, gunakan data test 50%
      barChartData = getTestData();
      totalRevenue = 15000; // Test revenue
    } finally {
      isLoading = false;
    }
  }

  // Fungsi untuk data test 50%
  function getTestData() {
    const today = new Date();
    const testData = [];
    
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      
      testData.push({
        pelancongan: { percentage: 50 },
        umrah: { percentage: 50 },
        date: formatDate(targetDate),
        pelanconganCount: 5,
        umrahCount: 5,
        totalCount: 10,
        pelanconganRevenue: 5000 + (i * 1000),
        umrahRevenue: 6000 + (i * 1000)
      });
    }
    
    return testData.reverse();
  }

  // Fungsi untuk memproses data
  function processData(data) {
    const today = new Date();
    const stats = [];

    // Loop untuk 3 hari terakhir
    for (let i = 0; i < 3; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Filter data untuk tanggal tertentu
      const dayData = data.filter(item => {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0];
        return itemDate === dateStr;
      });

      let pelanconganCount, umrahCount, pelanconganRevenue, umrahRevenue;
      
      if (selectedFilter === 'Total Sales') {
        // Untuk bookings: umrah_category_id ada = umrah, null = pelancongan
        const pelanconganData = dayData.filter(item => !item.umrah_category_id);
        const umrahData = dayData.filter(item => item.umrah_category_id);

        // Hitung total peserta (jumlah booking records + sum bilangan per booking)
        // Formula: total peserta = jumlah booking + sum(bilangan dari setiap booking)
        // Contoh: 2 booking dengan bilangan [3,5] = 2 + (3+5) = 10 peserta
        pelanconganCount = pelanconganData.length + pelanconganData.reduce((sum, item) => {
          return sum + (item.bilangan || 0);
        }, 0);
        umrahCount = umrahData.length + umrahData.reduce((sum, item) => {
          return sum + (item.bilangan || 0);
        }, 0);

        // Hitung revenue per jenis paket
        pelanconganRevenue = pelanconganData.reduce((sum, item) => {
          return sum + (item.total_price || 0);
        }, 0);
        umrahRevenue = umrahData.reduce((sum, item) => {
          return sum + (item.total_price || 0);
        }, 0);
      } else {
        // Untuk leads: category_id ada = umrah, null = pelancongan
        pelanconganCount = dayData.filter(item => !item.category_id).length;
        umrahCount = dayData.filter(item => item.category_id).length;
        pelanconganRevenue = 0; // Tidak ada revenue untuk leads
        umrahRevenue = 0;
      }

      const totalCount = pelanconganCount + umrahCount;

      // Hitung persentase
      const pelanconganPercentage = totalCount > 0 ? Math.round((pelanconganCount / totalCount) * 100) : 0;
      const umrahPercentage = totalCount > 0 ? Math.round((umrahCount / totalCount) * 100) : 0;

      stats.push({
        date: formatDate(targetDate),
        pelanconganCount,
        umrahCount,
        pelanconganPercentage,
        umrahPercentage,
        totalCount,
        pelanconganRevenue,
        umrahRevenue
      });
    }

    return stats.reverse(); // Reverse agar urutan dari lama ke baru
  }

  const dateLabels = getDateLabels();

  // Reactive statement untuk memantau perubahan filter
  $: if (selectedFilter) {
    fetchData();
  }

  // Load data saat component mount
  onMount(() => {
    fetchData();
  });

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function selectFilter(filter) {
    selectedFilter = filter;
    isMenuOpen = false;
    // Refresh data berdasarkan filter yang dipilih
    fetchData();
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

  // Format currency RM (format Malaysia: titik ribuan, koma desimal)
  function formatCurrency(amount) {
    if (!amount) return 'RM 0.00';

    return 'RM ' + new Intl.NumberFormat('ms-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
</script>

<svelte:window on:click={handleClickOutside} />

<!-- CARD WRAPPER -->
<section class="rounded-2xl sm:rounded-3xl bg-white/90 border border-white shadow-card p-4 sm:p-6 xl:p-5 2xl:p-6 h-[440px] sm:h-[550px] lg:h-[620px] xl:h-[540px] 2xl:h-[650px] overflow-hidden">
  <div class="flex flex-col gap-3 sm:gap-4">
    <div class="flex flex-row items-center justify-between gap-2 sm:gap-3 lg:gap-4">
      <div class="flex-1">
        <h2 class="text-base sm:text-lg lg:text-lg xl:text-lg font-bold text-slate-900 truncate">Sales & Inquiry Overview</h2>
      </div>

      <!-- Dropdown (custom styled) -->
      <div class="relative flex-shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-slate-200 px-2 py-1 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 active:scale-[0.99] transition min-w-0"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          on:click={toggleMenu}
        >
          <span class="truncate max-w-[90px] sm:max-w-none">{selectedFilter}</span>
          <svg class="size-3 text-slate-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
          </svg>
        </button>

        <div
          class="absolute right-0 z-10 mt-2 w-32 sm:w-44 origin-top-right rounded-lg sm:rounded-xl border border-slate-200 bg-white p-1 sm:p-1.5 shadow-lg ring-1 ring-black/5 transition {isMenuOpen ? 'visible opacity-100 scale-100' : 'invisible opacity-0 scale-95'}"
          role="menu"
        >
          <!-- menu item -->
          <button
            class="w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            on:click={() => selectFilter('Total Sales')}
          >
            Total Sales
          </button>
          <button
            class="w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            on:click={() => selectFilter('Total Inquiry')}
          >
            Total Inquiry
          </button>
        </div>
      </div>
    </div>

    <!-- Legend and Revenue Section -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
      <!-- Legend -->
      <div class="flex items-center gap-3 sm:gap-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style="background: linear-gradient(to bottom, var(--color-primary), rgba(148, 35, 146, 0.8));"></div>
          <span class="text-xs sm:text-sm font-medium text-slate-700">Pelancongan</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#FFF212]"></div>
          <span class="text-xs sm:text-sm font-medium text-slate-700">Umrah</span>
        </div>
      </div>

      <!-- Revenue Display -->
      {#if selectedFilter === 'Total Sales' && totalRevenue > 0}
        <div class="flex items-center gap-2">
          <span class="text-xs sm:text-sm text-slate-600">Total Revenue:</span>
          <span class="text-sm sm:text-base font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if isLoading}
    <div class="mt-6 sm:mt-10 flex justify-center items-center h-[230px] sm:h-[380px]">
      <div class="text-slate-500 text-sm sm:text-base">Loading data...</div>
    </div>
  {:else}
    <!-- UNIFIED CHART AREA -->
    <div class="mt-6 sm:mt-10 flex justify-center w-full overflow-hidden">
      <div class="flex gap-3 sm:gap-6 lg:gap-8 xl:gap-10 items-end flex-wrap">
        {#each barChartData as bar, index}
          <!-- BAR {index + 1} -->
          <div class="flex flex-col items-center">
            <div class="w-16 sm:w-24 lg:w-28 xl:w-32 2xl:w-40 h-[230px] sm:h-[300px] lg:h-[340px] xl:h-[330px] 2xl:h-[400px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md flex flex-col">
              {#if bar.pelancongan.percentage > 0}
                <div 
                  class="flex items-center justify-center"
                  style="height: {(bar.pelancongan.percentage / 100) * (window.innerWidth < 640 ? 230 : window.innerWidth < 1024 ? 300 : window.innerWidth < 1280 ? 340 : window.innerWidth < 1536 ? 330 : 400)}px; background: linear-gradient(to bottom, var(--color-primary), rgba(148, 35, 146, 0.8));"
                >
                  <div class="text-center text-white">
                    {#if selectedFilter === 'Total Sales' && bar.pelanconganRevenue > 0}
                      <div class="text-[8px] sm:text-[10px] md:text-xs font-bold">{formatCurrency(bar.pelanconganRevenue)}</div>
                      <div class="text-[8px] sm:text-[10px] md:text-xs mt-1">{bar.pelanconganCount} <span class="font-normal opacity-80">Pax</span></div>
                    {:else}
                      <div class="text-[8px] sm:text-[10px] md:text-xs">{bar.pelanconganCount} <span class="font-normal opacity-80">Pax</span></div>
                    {/if}
                  </div>
                </div>
              {/if}
              {#if bar.umrah.percentage > 0}
                <div 
                  class="bg-gradient-to-t from-[#FFF212] to-[#FFF212]/80 flex items-center justify-center"
                  style="height: {(bar.umrah.percentage / 100) * (window.innerWidth < 640 ? 230 : window.innerWidth < 1024 ? 300 : window.innerWidth < 1280 ? 340 : window.innerWidth < 1536 ? 330 : 400)}px;"
                >
                  <div class="text-center text-black">
                    {#if selectedFilter === 'Total Sales' && bar.umrahRevenue > 0}
                      <div class="text-[8px] sm:text-[10px] md:text-xs font-bold">{formatCurrency(bar.umrahRevenue)}</div>
                      <div class="text-[8px] sm:text-[10px] md:text-xs mt-1">{bar.umrahCount} <span class="font-normal opacity-80">Pax</span></div>
                    {:else}
                      <div class="text-[8px] sm:text-[10px] md:text-xs">{bar.umrahCount} <span class="font-normal opacity-80">Pax</span></div>
                    {/if}
                  </div>
                </div>
              {/if}
              {#if bar.pelancongan.percentage === 0 && bar.umrah.percentage === 0}
                <div class="flex-1 flex items-center justify-center bg-gray-100">
                  <span class="text-gray-400 text-xs sm:text-sm">No Data</span>
                </div>
              {/if}
            </div>
            
            <!-- Percentage and Date Display -->
            <div class="mt-2 sm:mt-3 flex gap-2 sm:gap-3">
              <span class="rounded-full text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1 shadow-sm" style="background-color: rgba(148, 35, 146, 0.2); color: var(--color-primary);">{bar.pelancongan.percentage}%</span>
              <span class="text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1 shadow-sm rounded-full bg-[#FFF212]/20 text-black">{bar.umrah.percentage}%</span>
            </div>
            <span class="mt-1 sm:mt-2 rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 sm:px-3 sm:py-1">{bar.date}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

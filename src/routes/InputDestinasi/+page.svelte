<script>
  import DestinationInputCard from "$lib/components/DestinationInputCard.svelte";
  import AddDestinationCard from "$lib/components/AddDestinationCard.svelte";
  import DestinationList from "$lib/components/DestinationList.svelte";
  import RoleGuard from "$lib/components/RoleGuard.svelte";
  import { user, loading } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { Heart, RefreshCw } from "lucide-svelte";
  import { clearDestinasiCache } from "$lib/umrah-data-helpers.js";

  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto("/login");
  }

  // Force refresh destinasi data
  function forceRefreshDestinasiData() {
    console.log('🔄 Force refreshing destinasi data...');
    clearDestinasiCache();
    
    // Dispatch event to refresh child components
    window.dispatchEvent(new CustomEvent('refreshDestinasiData'));
  }
</script>

<RoleGuard allowedRoles={["super_admin"]} redirectTo="/login">
  <div class="p-2 sm:p-3 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
    <!-- Header Halaman -->
    <div class="mb-4 sm:mb-6">
      <div class="flex items-center justify-between mb-1 sm:mb-2">
        <div>
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
            Manajemen Destinasi
          </h1>
          <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
            Kelola destinasi pelancongan untuk pakej perjalanan Anda
          </p>
        </div>
        
        <!-- Refresh Button -->
        <button
          on:click={forceRefreshDestinasiData}
          class="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh data destinasi"
        >
          <RefreshCw class="w-4 h-4 sm:w-5 sm:h-5" />
          <span class="text-sm font-medium">Refresh</span>
        </button>
      </div>
    </div>

    <!-- Layout Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-8">
            <!-- Add Destination Card -->
            <AddDestinationCard />
      <!-- Form Input Destinasi -->
      <DestinationInputCard />
      

    </div>
  </div>
</RoleGuard>

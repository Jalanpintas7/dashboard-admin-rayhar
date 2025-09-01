<script>
  import DestinationInputCard from "$lib/components/DestinationInputCard.svelte";
  import AddDestinationCard from "$lib/components/AddDestinationCard.svelte";
  import DestinationList from "$lib/components/DestinationList.svelte";
  import RoleGuard from "$lib/components/RoleGuard.svelte";
  import { user, loading } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { Heart } from "lucide-svelte";

  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto("/login");
  }
</script>

<RoleGuard allowedRoles={["super_admin"]} redirectTo="/login">
  <div class="p-2 sm:p-3 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
    <!-- Header Halaman -->
    <div class="mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
        Manajemen Destinasi
      </h1>
      <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
        Kelola destinasi pelancongan untuk pakej perjalanan Anda
      </p>
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

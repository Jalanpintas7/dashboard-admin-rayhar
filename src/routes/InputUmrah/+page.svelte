<script>
  import UmrahSeasonInput from "$lib/components/UmrahSeasonInput.svelte";
  import UmrahCategoryInput from "$lib/components/UmrahCategoryInput.svelte";
  import UmrahPackageCreator from "$lib/components/UmrahPackageCreator.svelte";
  import AirlineInput from "$lib/components/AirlineInput.svelte";
  import RoleGuard from "$lib/components/RoleGuard.svelte";
  import { user, loading } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";

  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto("/login");
  }
</script>

<RoleGuard allowedRoles={["super_admin"]} redirectTo="/login">
  <div class="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
    <!-- Header Halaman -->
    <div class="mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-2 sm:mb-3">
        Input Umrah
      </h1>
      <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
        Kelola musim, kategori, penerbangan, dan buat pakej umrah baru untuk
        pelanggan Anda
      </p>
    </div>

    <!-- Grid 2 Kolom untuk Card Musim dan Kategori -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6">
      <!-- Form Input Musim -->
      <div class="w-full">
        <UmrahSeasonInput />
      </div>

      <!-- Form Input Kategori -->
      <div class="w-full">
        <UmrahCategoryInput />
      </div>
    </div>

          <!-- Section: Buat Pakej Umrah Baru -->
    <UmrahPackageCreator />
  </div>
</RoleGuard>

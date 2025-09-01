<script>
  import CustomerTable from '$lib/components/CustomerTable.svelte';
  import LeadTable from '$lib/components/LeadTable.svelte';
  import RoleGuard from '$lib/components/RoleGuard.svelte';
  import { user, loading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  
  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto('/login');
  }
</script>

<RoleGuard allowedRoles={['super_admin']} redirectTo="/login">
  <div class="p-2 sm:p-3 lg:p-4 bg-gray-50 min-h-full rounded-xl mr-1 sm:mr-2 lg:mr-4">
    <!-- Page Header -->
    <div class="mb-3 sm:mb-4 lg:mb-6">
      <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Pelanggan</h1>
              <p class="text-sm sm:text-base text-gray-600">Kelola data pelanggan dan pemesanan pakej</p>
    </div>

    <!-- Customer Table -->
    <div class="mb-6">
      <CustomerTable />
    </div>

    <!-- Lead Table -->
    <div class="mb-6">
      <LeadTable />
    </div>
  </div>
</RoleGuard>

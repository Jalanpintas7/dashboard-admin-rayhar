<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import SummaryCards from '$lib/components/SummaryCards.svelte';
  import SalesInquiryOverview from '$lib/components/SalesInquiryOverview.svelte';
  import TopSales from '$lib/components/TopSales.svelte';
  import PackageTopSales from '$lib/components/PackageTopSales.svelte';
  import TopInquiry from '$lib/components/TopInquiry.svelte';
  import RoleGuard from '$lib/components/RoleGuard.svelte';
  import ProfileDropdown from '$lib/components/ProfileDropdown.svelte';
  import { user, userRole, loading } from '$lib/stores/auth.js';
  import { warmCacheDashboardData } from '$lib/dashboard-data-helpers.js';
  
  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto('/login');
  }
  
  // Redirect admin branch ke dashboard mereka sendiri
  $: if ($userRole === 'admin_branch' && $page?.url?.pathname === '/') {
    goto('/DashboardBranch');
  }

  onMount(() => {
    // Prefetch semua data dashboard di background
    // Dibiarkan non-blocking agar UI tidak delay
    warmCacheDashboardData().catch(() => {});
  });
</script>

<RoleGuard allowedRoles={['super_admin']} redirectTo="/login">
  <div class="pt-2 pb-2 px-2 sm:pt-3 sm:pb-3 sm:px-3 lg:pt-4 lg:pb-4 lg:px-4 bg-gray-50 min-h-full rounded-xl mr-1 sm:mr-2 lg:mr-4">
    <!-- Page Header -->
    <div class="mb-4 lg:mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p class="text-base text-gray-600">Welcome to your admin dashboard</p>
        </div>
        
        <!-- Profile Dropdown - Hanya tampil di desktop | Mobile dropdown fixed -->
        <div class="hidden lg:flex">
          <ProfileDropdown />
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <SummaryCards />
    
    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
      <!-- Sales & Inquiry Overview - Lebih besar (2 kolom) -->
      <div class="lg:col-span-2 xl:col-span-7">
        <SalesInquiryOverview />
      </div>
      
      <!-- Top Sales - Lebih kecil (1 kolom) -->
      <div class="lg:col-span-1 xl:col-span-5">
        <TopSales />
      </div>
    </div>
    
    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 mt-2 sm:mt-3 lg:mt-4">
      <!-- Package Top Sales -->
      <PackageTopSales />
      
      <!-- Top Inquiry -->
      <TopInquiry />
    </div>
  </div>
</RoleGuard>

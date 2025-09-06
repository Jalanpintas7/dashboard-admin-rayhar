<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import SummaryCardsBranch from '$lib/components/SummaryCardsBranch.svelte';
  import SalesInquiryOverviewBranch from '$lib/components/SalesInquiryOverviewBranch.svelte';
  import TopSales from '$lib/components/TopSales.svelte';
  import PackageTopSalesBranch from '$lib/components/PackageTopSalesBranch.svelte';
import TopInquiryBranch from '$lib/components/TopInquiryBranch.svelte';
import CustomerTableBranch from '$lib/components/CustomerTableBranch.svelte';
import LeadTableBranch from '$lib/components/LeadTableBranch.svelte';
import RoleGuard from '$lib/components/RoleGuard.svelte';
import ProfileDropdown from '$lib/components/ProfileDropdown.svelte';
  import { user, loading } from '$lib/stores/auth.js';
  
  // Redirect ke login jika tidak ada user
  $: if (!$loading && !$user) {
    goto('/login');
  }
</script>

<RoleGuard allowedRoles={['admin_branch']} redirectTo="/login">
  <!-- Layout untuk dashboard branch (tanpa sidebar) -->
  <div class="min-h-screen bg-white p-2 lg:p-4">
    <!-- Main Application Card -->
    <div class="
      w-full
      min-h-[calc(100vh-1rem)] lg:min-h-[calc(100vh-2rem)]
      rounded-xl
      bg-gray-50
      shadow-sm
      overflow-hidden
    ">
      <!-- Dashboard Content -->
      <div class="p-3 lg:p-4 min-h-full">
        <!-- Page Header -->
        <div class="mb-4 lg:mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dashboard Branch</h1>
              <p class="text-gray-600">Welcome to your branch dashboard</p>
            </div>
            
            <!-- Profile Dropdown -->
            <ProfileDropdown />
          </div>
        </div>

        <!-- Summary Cards -->
        <SummaryCardsBranch />
        
        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-10">
          <!-- Sales & Inquiry Overview - Lebih besar (2 kolom) -->
          <div class="xl:col-span-2">
            <SalesInquiryOverviewBranch />
          </div>
          
          <!-- Top Sales - Lebih kecil (1 kolom) -->
          <div class="xl:col-span-1">
            <TopSales />
          </div>
        </div>
        
        <!-- Bottom Row -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-10">
          <!-- Package Top Sales -->
          <PackageTopSalesBranch />
          
          <!-- Top Inquiry -->
          <TopInquiryBranch />
        </div>
        
                    <!-- Customer Table Section -->
            <div class="mb-10">
              <CustomerTableBranch />
            </div>
            
            <!-- Lead Table Section -->
            <div class="mb-10">
              <LeadTableBranch />
            </div>
        
      </div>
    </div>
  </div>
</RoleGuard>

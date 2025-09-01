<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { initializeAuth, user, userRole, redirectPath, loading, error } from '$lib/stores/auth.js';
  
  // Daftar halaman yang tidak perlu sidebar (halaman auth dan dashboard branch)
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const noSidebarPages = ['/login', '/register', '/forgot-password', '/reset-password', '/DashboardBranch', '/DashboardBranch/'];
  
  $: isAuthPage = authPages.includes($page.url.pathname);
  $: isNoSidebarPage = noSidebarPages.includes($page.url.pathname);
  
  // Watch untuk redirect ke login jika tidak ada user
  $: if (!$loading && !$user && !isAuthPage) {
    // Jika tidak ada user dan tidak di halaman auth, redirect ke login
    goto('/login');
  }
  
  // Watch untuk redirect otomatis setelah login berhasil (hanya jika di halaman login)
  $: if ($user && $userRole && $redirectPath && isAuthPage) {
    // Redirect ke halaman yang sesuai dengan role hanya jika sedang di halaman login
    goto($redirectPath);
  }
  
  // Redirect admin branch ke dashboard mereka jika mencoba akses halaman dengan sidebar
  $: if ($user && $userRole === 'admin_branch' && !isNoSidebarPage && !isAuthPage) {
    goto('/DashboardBranch');
  }
  
  // Initialize Supabase auth on mount
  onMount(() => {
    initializeAuth();
  });
</script>

{#if $loading}
  <!-- Loading state -->
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading...</p>
    </div>
  </div>
{:else if $error}
  <!-- Error state -->
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="text-red-600 text-lg mb-2">Error</div>
      <p class="text-gray-600">{$error}</p>
    </div>
  </div>
{:else if isNoSidebarPage}
  <!-- Layout untuk halaman tanpa sidebar (auth dan dashboard branch) -->
  <slot />
{:else}
  <!-- Layout untuk dashboard (dengan sidebar) -->
  <div class="min-h-screen bg-gray-50 pt-1 pb-2 px-2 lg:pt-2 lg:pb-4 lg:px-4">
    <!-- Main Application Card -->
    <div class="
      w-full
      min-h-[calc(100vh-1rem)] lg:min-h-[calc(100vh-2rem)]
      flex
    ">
      <!-- Sidebar - Fixed/Sticky -->
      <div class="hidden lg:block lg:w-[280px] xl:w-[280px] 2xl:w-[320px] flex-shrink-0">
        <Sidebar />
      </div>
      
      <!-- Main Content Area - Scrollable -->
      <main class="flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
  
  <!-- Mobile Sidebar Container - Selalu di-render tapi hidden di desktop -->
  <div class="lg:hidden">
    <Sidebar />
  </div>
{/if}

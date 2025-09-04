<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { initializeAuth, user, userRole, redirectPath, loading, error } from '$lib/stores/auth.js';
  import { invalidateCachePattern, clearExpiredCache } from '$lib/cache-utils.js';
  import { RefreshCw } from 'lucide-svelte';
  
  // Daftar halaman yang tidak perlu sidebar (halaman auth dan dashboard branch)
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const noSidebarPages = ['/login', '/register', '/forgot-password', '/reset-password', '/DashboardBranch', '/DashboardBranch/'];
  
  $: isAuthPage = authPages.includes($page?.url?.pathname);
  $: isNoSidebarPage = noSidebarPages.includes($page?.url?.pathname);
  $: isDashboardRoot = $page?.url?.pathname === '/';
  
  // Refresh button state
  let isRefreshing = false;
  
  function getRefreshPatterns(pathname = '/') {
    const p = pathname || '/';
    const patterns = new Set();
    const starts = (prefix) => p.startsWith(prefix);

    if (starts('/Pelanggan')) {
      patterns.add('customers');
    }
    if (starts('/DataLead')) {
      patterns.add('leads');
    }
    if (starts('/DataUmrah') || starts('/InputUmrah')) {
      patterns.add('umrah');
      patterns.add('destination');
      patterns.add('airline');
      patterns.add('outbound');
    }
    if (starts('/DataDestinasi') || starts('/InputDestinasi')) {
      patterns.add('destination');
    }
    if (starts('/InputAirline') || starts('/InputAirline&SalesConsultant')) {
      patterns.add('airline');
    }

    // Default fallback: refresh cache umum (kecuali dashboard)
    if (patterns.size === 0) {
      ['customers', 'leads', 'umrah', 'destination', 'airline', 'outbound'].forEach(k => patterns.add(k));
    }
    return Array.from(patterns);
  }

  async function handleGlobalRefresh() {
    if (isRefreshing) return;
    try {
      isRefreshing = true;
      const currentPath = $page?.url?.pathname || '/';
      const patterns = getRefreshPatterns(currentPath);
      patterns.forEach((pat) => invalidateCachePattern(pat));
      clearExpiredCache();
      // Beri sedikit jeda agar storage update tersinkron
      await new Promise(r => setTimeout(r, 200));
      // Reload halaman untuk memicu fetch ulang berbasis cache yang sudah invalid
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      isRefreshing = false;
    }
  }
  
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
    
    // Handle routing errors untuk Netlify
    window.addEventListener('error', (e) => {
      if (e.message.includes('not found') || e.message.includes('404')) {
        goto('/login');
      }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      if (e.reason && e.reason.message && e.reason.message.includes('not found')) {
        goto('/login');
      }
    });
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

  {#if $user && !isAuthPage}
    <!-- Floating Refresh Button on pages without sidebar (exclude auth pages) -->
    <div class="fixed bottom-4 right-4 z-[60]">
      <button
        class="inline-flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.98] transition disabled:opacity-60"
        on:click={handleGlobalRefresh}
        disabled={isRefreshing}
        aria-label="Refresh data"
      >
        {#if isRefreshing}
          <span class="relative inline-block w-5 h-5">
            <span class="absolute inset-0 rounded-full border-2 border-white/30"></span>
            <span class="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></span>
          </span>
          <span>Refreshing...</span>
        {:else}
          <RefreshCw class="w-5 h-5 text-white" />
          <span>Refresh</span>
        {/if}
      </button>
    </div>
  {/if}
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

  {#if $user && !isDashboardRoot}
    <!-- Floating Refresh Button (hidden on dashboard root) -->
    <div class="fixed bottom-4 right-4 z-[60]">
      <button
        class="inline-flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white bg-primary-600 hover:bg-primary-700 active:scale-[0.98] transition disabled:opacity-60"
        on:click={handleGlobalRefresh}
        disabled={isRefreshing}
        aria-label="Refresh data"
      >
        {#if isRefreshing}
          <span class="relative inline-block w-5 h-5">
            <span class="absolute inset-0 rounded-full border-2 border-white/30"></span>
            <span class="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></span>
          </span>
          <span>Refreshing...</span>
        {:else}
          <RefreshCw class="w-5 h-5 text-white" />
          <span>Refresh</span>
        {/if}
      </button>
    </div>
  {/if}
{/if}

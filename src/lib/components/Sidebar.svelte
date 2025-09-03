<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user, userRole, signOut } from '$lib/stores/auth.js';
  import logoSrc from '$lib/assets/logorayharsvg.svg';
  
  // Import Lucide icons
  import { 
    Home, 
    Users, 
    Calendar, 
    Building2, 
    MapPin, 
    Database, 
    Settings, 
    User, 
    LogOut, 
    Menu,
    Plane,
    UserCheck
  } from 'lucide-svelte';
  
  // Props untuk sidebar
  export const isCollapsed = false;
  
  // Menu items dengan ikon yang tepat sesuai gambar
  const menuItemsData = [
    { name: 'Dashboard', icon: 'home', href: '/', isActive: false },
    { name: 'Pelanggan', icon: 'users', href: '/Pelanggan', isActive: false },
    { name: 'Input Umrah', icon: 'calendar', href: '/InputUmrah', isActive: false },
    { name: 'Data Umrah', icon: 'mosque', href: '/DataUmrah', isActive: false },
    { name: 'Input Destinasi', icon: 'map-pin', href: '/InputDestinasi', isActive: false },
    { name: 'Data Destinasi', icon: 'database', href: '/DataDestinasi', isActive: false },
    { name: 'Input Penerbangan', icon: 'plane', href: '/InputAirline', isActive: false }

  ];
  
  // Reactive statement untuk menu items dengan status aktif berdasarkan URL
  $: menuItems = menuItemsData.map(item => ({
    ...item,
    isActive: $page?.url?.pathname === item.href
  }));
  
  // Toggle sidebar untuk mobile
  let isMobileOpen = false;
  
  function toggleMobile() {
    isMobileOpen = !isMobileOpen;
  }

  function closeMobile() {
    isMobileOpen = false;
  }
  
  // Handle logout
  async function handleLogout() {
    try {
      await signOut();
      goto('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  // Get role display name
  $: roleDisplayName = $userRole === 'super_admin' ? 'Super Admin' : 
                       $userRole === 'admin_branch' ? 'Admin Branch' : 'User';
</script>

<!-- Mobile Toggle Button -->
<div class="lg:hidden fixed top-4 right-4 z-50">
  <button 
    on:click={toggleMobile}
    class="p-2 bg-[#942392] text-white rounded-lg shadow-lg hover:bg-[#7a1d7a] transition-colors"
    aria-label="Toggle mobile menu"
  >
    <Menu class="w-6 h-6" />
  </button>
</div>

<!-- Mobile Sidebar Overlay -->
{#if isMobileOpen}
  <div 
    class="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
    on:click={closeMobile}
    on:keydown={(e) => e.key === 'Escape' && closeMobile()}
    role="button"
    tabindex="0"
    aria-label="Close mobile menu"
  ></div>
{/if}

<!-- Mobile Sidebar -->
<aside class="
  lg:hidden fixed right-0 top-0 h-full w-72 max-w-[70vw]
  bg-white/95 backdrop-blur-md border-l border-white/50
  shadow-2xl z-50 transform transition-transform duration-300 ease-in-out
  {isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
">
  <!-- Mobile Sidebar Header -->
  <div class="bg-gradient-to-b from-white/80 to-white/40 p-4 border-b border-white/50">
    <div class="flex items-center justify-between">
      <!-- Close Button -->
      <button
        on:click={closeMobile}
        class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Close mobile menu"
      >
        <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      
      <!-- Logo + Brand -->
      <div class="flex items-center gap-3">
        <img src={logoSrc} alt="Rayhar Logo" class="w-16 h-16" />
        <div>
          <div class="text-2xl font-extrabold tracking-tight text-slate-800">Rayhar</div>
          <div class="text-xs text-slate-500">Admin Dashboard</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile Navigation Menu -->
  <div class="flex-1 overflow-y-auto p-4">
    <nav class="space-y-2">
      {#each menuItems as item}
        <a 
          href={item.href}
          on:click={closeMobile}
          class="
            group flex items-center gap-3 rounded-xl px-4 py-3
            {item.isActive 
              ? 'border border-purple-200 bg-purple-100/70 shadow-innerSoft' 
              : 'text-slate-600 hover:bg-slate-50'
            }
            transition-all duration-200
          "
        >
          <span class="
            grid h-7 w-7 place-items-center rounded-full shadow-soft
            {item.isActive 
              ? 'bg-white text-purple-600' 
              : 'border border-slate-200 bg-white'
            }
          ">
            {#if item.icon === 'home'}
              <Home class="h-4 w-4" />
            {:else if item.icon === 'users'}
              <Users class="h-4 w-4" />
            {:else if item.icon === 'settings'}
              <Settings class="h-4 w-4" />
            {:else if item.icon === 'calendar'}
              <Calendar class="h-4 w-4" />
            {:else if item.icon === 'mosque'}
              <Building2 class="h-4 w-4" />
            {:else if item.icon === 'map-pin'}
              <MapPin class="h-4 w-4" />
            {:else if item.icon === 'database'}
              <Database class="h-4 w-4" />
            {:else if item.icon === 'plane'}
              <Plane class="h-4 w-4" />
            {/if}
          </span>
          <span class="
            text-sm font-medium
            {item.isActive ? 'text-purple-700' : ''}
          ">{item.name}</span>
        </a>
      {/each}
    </nav>
  </div>

  <!-- Mobile User Info & Logout -->
  {#if $user}
    <div class="border-t border-slate-200 p-4 bg-slate-50/50">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <User class="w-4 h-4 text-purple-600" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-700 truncate">{$user.email}</div>
          <div class="text-xs text-slate-500">{roleDisplayName}</div>
        </div>
      </div>
      <button
        on:click={handleLogout}
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
      >
        <LogOut class="w-4 h-4" />
        Logout
      </button>
    </div>
  {/if}
</aside>

<!-- Desktop Sidebar -->
<aside class="
  hidden lg:block
  w-full lg:max-w-[280px] 2xl:max-w-[300px]
  bg-white/80 border border-white 
  rounded-[28px] shadow-soft
  overflow-hidden
  sticky top-4
  max-h-[calc(100vh-2rem)]
  flex flex-col
">
  <!-- Inner background dengan gradient halus -->
  <div class="bg-gradient-to-b from-white/60 to-white/30 lg:p-4 xl:p-6 flex flex-col flex-1">
    <!-- Logo + Brand -->
    <div class="flex items-center lg:gap-3 xl:gap-4 lg:mb-6 xl:mb-8">
      <!-- Logo Rayhar -->
      <img src={logoSrc} alt="Rayhar Logo" class="lg:w-20 xl:w-[100px]" />
      <div>
        <div class="lg:text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-800">Rayhar</div>
        <div class="lg:text-xs xl:text-sm -mt-0.5 text-slate-400">Admin Dashboard</div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="lg:space-y-2 xl:space-y-3 flex-1">
      {#each menuItems as item}
        <a 
          href={item.href}
          class="
            group flex items-center lg:gap-3 xl:gap-4 rounded-2xl lg:px-3 lg:py-3 xl:px-5 xl:py-4
            {item.isActive 
              ? 'border border-purple-200 bg-purple-100/70 shadow-innerSoft' 
              : 'text-slate-500 hover:bg-slate-50'
            }
          "
        >
          <span class="
            grid lg:h-7 lg:w-7 xl:h-8 xl:w-8 place-items-center rounded-full shadow-soft
            {item.isActive 
              ? 'bg-white text-purple-600' 
              : 'border border-slate-200 bg-white'
            }
          ">
            {#if item.icon === 'home'}
              <Home class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {:else if item.icon === 'users'}
              <Users class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {:else if item.icon === 'settings'}
              <Settings class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {:else if item.icon === 'calendar'}
              <Calendar class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {:else if item.icon === 'mosque'}
              <Building2 class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {:else if item.icon === 'map-pin'}
              <MapPin class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {:else if item.icon === 'database'}
              <Database class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {:else if item.icon === 'plane'}
              <Plane class="lg:h-3 lg:w-3 xl:h-4 xl:w-4" />
            {/if}
          </span>
          <span class="
            lg:text-sm xl:text-base font-medium
            {item.isActive ? 'text-purple-700' : ''}
          ">{item.name}</span>
        </a>
      {/each}
    </nav>

    <!-- Spacer untuk footer -->
    <div class="flex-1"></div>

    <!-- Footer -->
    <footer class="pt-3 pb-2">
      <div class="lg:text-xs xl:text-sm font-semibold text-slate-700">Rayhar Admin Dashboard</div>
      <div class="lg:text-[10px] xl:text-xs text-slate-400">© 2024 All Rights Reserved</div>
    </footer>
  </div>
</aside>

<style>
  /* Custom shadow untuk sidebar */
  :global(.shadow-soft) {
    box-shadow: 0 1px 0 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(15,23,42,0.04);
  }
  
  :global(.shadow-innerSoft) {
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
  }
  

</style>

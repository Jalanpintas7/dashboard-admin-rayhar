<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { signOut, user, userRole } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { getBranchIdByUser } from '$lib/supabase-helpers.js';
  import { supabase } from '$lib/supabase.js';
  import { themeColors } from '$lib/theme/colors.js';
  
  // Import Lucide icons
  import { 
    User, 
    Settings, 
    CreditCard, 
    Activity, 
    HelpCircle, 
    LogOut 
  } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  let isOpen = false;
  let currentBranch = null;
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }
  
  function closeDropdown() {
    isOpen = false;
  }
  
  async function handleLogout() {
    try {
      await signOut();
      goto('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  
  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.profile-dropdown')) {
      closeDropdown();
    }
  }
  
  // Load branch info when component mounts
  async function loadBranchInfo() {
    try {
      if ($user && $userRole === 'admin_branch') {
        const branchId = await getBranchIdByUser($user.id);
        if (branchId) {
          const { data: branchData, error: branchError } = await supabase
            .from('branches')
            .select('name, state, region')
            .eq('id', branchId)
            .single();
          
          if (!branchError && branchData) {
            currentBranch = branchData;
          }
        }
      }
    } catch (error) {
      console.error('Error loading branch info:', error);
    }
  }
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClickOutside);
    }
    loadBranchInfo();
  });
  
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="profile-dropdown relative">
  <!-- Profile Button -->
  <button
    onclick={toggleDropdown}
    class="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
    style="background-color: {themeColors.primary};"
    onmouseenter={(e) => e.target.style.backgroundColor = '#7C3AED'}
    onmouseleave={(e) => e.target.style.backgroundColor = themeColors.primary}
    aria-label="Profile menu"
  >
    <User class="w-5 h-5 text-white" />
  </button>
  
  <!-- Dropdown Menu -->
  {#if isOpen}
    <div class="absolute right-0 mt-2 w-48 sm:w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
      <!-- Profile Header -->
      <div class="p-4 rounded-t-xl" style="background-color: {themeColors.primary};">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: rgba(255, 255, 255, 0.2);">
            <User class="w-5 h-5 text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-white">
              {$user?.email || 'User'}
            </p>
            <p class="text-xs text-white/80">
              {$userRole === 'super_admin' ? 'Super Admin' : $userRole === 'admin_branch' ? (currentBranch ? currentBranch.name : 'Admin Branch') : 'User'}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Logout Button -->
      <div class="p-4">
        <button
          onclick={handleLogout}
          class="w-full flex items-center justify-center px-4 py-3 text-white rounded-lg transition-colors duration-150 text-sm font-medium"
          style="background-color: {themeColors.primary};"
          onmouseenter={(e) => e.target.style.backgroundColor = '#7C3AED'}
          onmouseleave={(e) => e.target.style.backgroundColor = themeColors.primary}
        >
          <LogOut class="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-dropdown {
    position: relative;
  }
</style>

<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth.js';
  import { supabase } from '$lib/supabase.js';
  import DynamicLeadDataDisplay from './DynamicLeadDataDisplay.svelte';
  
  let userBranch = null;
  
  onMount(async () => {
    try {
      if ($user) {
        // Ambil informasi branch dari user yang login
        const { data: userProfile, error: profileError } = await supabase
          .from('admin_role')
          .select('branch_id, branches(name)')
          .eq('user_id', $user.id)
          .single();
        
        if (profileError || !userProfile?.branches?.name) {
          console.error('Error fetching user branch:', profileError);
          return;
        }
        
        userBranch = userProfile.branches.name;
      }
    } catch (err) {
      console.error('Error loading user branch:', err);
    }
  });
</script>

<!-- Lead Data Display -->
<div class="bg-white rounded-xl shadow-soft border border-white/60 overflow-hidden">
  <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
    <div class="mb-3 sm:mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Data Lead Branch</h3>
      <p class="text-sm text-gray-600">Branch: {userBranch || 'Loading...'}</p>
    </div>
  </div>
  
  <div class="p-4">
    {#if userBranch}
      <DynamicLeadDataDisplay branchName={userBranch} />
    {:else}
      <div class="text-center py-4 text-gray-500">
        Loading branch information...
      </div>
    {/if}
  </div>
</div>

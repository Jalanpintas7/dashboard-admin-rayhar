<script>
  import { onMount } from 'svelte';
  import LeadDataTable from '$lib/components/LeadDataTable.svelte';
  import { fetchLeads, clearLeadsCache } from '$lib/lead-data-helpers-optimized.js';
  import { Search, RefreshCw } from 'lucide-svelte';

  // Data state
  let leads = [];
  let isLoading = false;
  let searchTerm = '';

  // Load data function
  async function loadData() {
    try {
      isLoading = true;
      console.log('🔄 Loading leads data...');
      
      const data = await fetchLeads();
      leads = data || [];
      
      console.log('✅ Leads data loaded:', leads.length, 'items');
    } catch (error) {
      console.error('Error loading leads data:', error);
      leads = [];
    } finally {
      isLoading = false;
    }
  }

  // Filtered leads based on search term
  $: filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(term) ||
      lead.phone.includes(term) ||
      lead.branch.toLowerCase().includes(term) ||
      lead.interest.toLowerCase().includes(term) ||
      lead.consultant.toLowerCase().includes(term)
    );
  });

  // Force refresh all data
  async function forceRefreshAllData() {
    console.log('🔄 Force refreshing all leads data...');
    clearLeadsCache();
    await loadData();
  }

  // Clear all cache
  function clearAllCache() {
    console.log('🧹 Clearing all leads cache...');
    clearLeadsCache();
  }

  // Handle refresh event from child component
  function handleRefreshLeadData() {
    console.log('🔄 Refresh event received from LeadDataTable');
    loadData();
  }

  // Initialize data on mount
  onMount(() => {
    console.log('🚀 DataLead page mounted');
    loadData();
    
    // Listen for refresh events from child component
    window.addEventListener('refreshLeadData', handleRefreshLeadData);
    
    // Cleanup
    return () => {
      window.removeEventListener('refreshLeadData', handleRefreshLeadData);
    };
  });
</script>

<svelte:head>
  <title>Data Lead - Rayhar Admin Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <h1 class="text-xl font-semibold text-gray-900">Data Lead</h1>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Search Bar -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari lead..."
              bind:value={searchTerm}
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <!-- Refresh Button -->
          <button
            on:click={forceRefreshAllData}
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-blue-600 font-semibold text-sm">L</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Leads</p>
            <p class="text-2xl font-semibold text-gray-900">{leads.length}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-green-600 font-semibold text-sm">U</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Umrah Leads</p>
            <p class="text-2xl font-semibold text-gray-900">
              {leads.filter(lead => lead.interest && lead.interest.toLowerCase().includes('umrah')).length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-purple-600 font-semibold text-sm">P</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Pelancongan Leads</p>
            <p class="text-2xl font-semibold text-gray-900">
              {leads.filter(lead => lead.interest && !lead.interest.toLowerCase().includes('umrah')).length}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span class="text-orange-600 font-semibold text-sm">B</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Branches</p>
            <p class="text-2xl font-semibold text-gray-900">
              {[...new Set(leads.map(lead => lead.branch).filter(Boolean))].length}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <LeadDataTable 
      leads={filteredLeads} 
      isLoading={isLoading}
    />
  </div>
</div>

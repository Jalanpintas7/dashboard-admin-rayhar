<script>
  import { onMount } from 'svelte';
  import { formatCurrency, formatDate } from '$lib/umrah-data-helpers.js';
  import { Edit, Eye, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle, Calendar, Package, Globe, FileText, DollarSign, CheckCircle } from 'lucide-svelte';
  import { supabase } from '$lib/supabase.js';

  export let seasons = [];
  export let categories = [];
  export let packages = [];
  export let isLoading = false;

  // Tab state
  let activeTab = 'seasons';

  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 10;

  // Modal state
  let showDetailModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedItem = null;
  let modalType = ''; // 'season', 'category', 'package'

  // Edit form state
  let editForm = {
    name: '',
    start_date: '',
    end_date: '',
    quintuple: '',
    quadruple: '',
    triple: '',
    double: '',
    cwb: '',
    cnb: '',
    infant: '',
    airline_id: '',
    umrah_season_id: '',
    umrah_category_id: ''
  };

  // Computed values for pagination
  $: totalSeasons = seasons.length;
  $: totalCategories = categories.length;
  $: totalPackages = packages.length;
  
  $: totalPagesSeasons = Math.ceil(totalSeasons / itemsPerPage);
  $: totalPagesCategories = Math.ceil(totalCategories / itemsPerPage);
  $: totalPagesPackages = Math.ceil(totalPackages / itemsPerPage);
  
  $: startIndexSeasons = (currentPage - 1) * itemsPerPage;
  $: endIndexSeasons = startIndexSeasons + itemsPerPage;
  $: startIndexCategories = (currentPage - 1) * itemsPerPage;
  $: endIndexCategories = startIndexCategories + itemsPerPage;
  $: startIndexPackages = (currentPage - 1) * itemsPerPage;
  $: endIndexPackages = startIndexPackages + itemsPerPage;
  
  $: paginatedSeasons = seasons.slice(startIndexSeasons, endIndexSeasons);
  $: paginatedCategories = categories.slice(startIndexCategories, endIndexCategories);
  $: paginatedPackages = packages.slice(startIndexPackages, endIndexPackages);

  // Reset pagination when tab changes
  $: if (activeTab) {
    currentPage = 1;
  }

  // Get current total pages based on active tab
  $: currentTotalPages = activeTab === 'seasons' ? totalPagesSeasons : 
                        activeTab === 'categories' ? totalPagesCategories : 
                        totalPagesPackages;

  // Function to handle edit
  function handleEdit(type, id) {
    modalType = type;
    if (type === 'season') {
      selectedItem = seasons.find(s => s.id === id);
      editForm = {
        name: selectedItem.name
      };
    } else if (type === 'category') {
      selectedItem = categories.find(c => c.id === id);
      editForm = {
        name: selectedItem.name
      };
         } else if (type === 'package') {
       selectedItem = packages.find(p => p.id === id);
       editForm = {
         name: `${selectedItem.umrah_seasons?.name || ''} - ${selectedItem.umrah_categories?.name || ''}`,
         start_date: selectedItem.start_date,
         end_date: selectedItem.end_date,
         quintuple: selectedItem.quintuple || '',
         quadruple: selectedItem.quadruple || '',
         triple: selectedItem.triple || '',
         double: selectedItem.double || '',
         cwb: selectedItem.cwb || '',
         cnb: selectedItem.cnb || '',
         infant: selectedItem.infant || '',
         airline_id: selectedItem.airline_id || '',
         umrah_season_id: selectedItem.umrah_season_id || '',
         umrah_category_id: selectedItem.umrah_category_id || ''
       };
     }
    showEditModal = true;
  }

  // Function to handle view
  function handleView(type, id) {
    modalType = type;
    if (type === 'season') {
      selectedItem = seasons.find(s => s.id === id);
    } else if (type === 'category') {
      selectedItem = categories.find(c => c.id === id);
    } else if (type === 'package') {
      selectedItem = packages.find(p => p.id === id);
    }
    showDetailModal = true;
  }

  // Function to handle delete
  function handleDelete(type, id) {
    modalType = type;
    if (type === 'season') {
      selectedItem = seasons.find(s => s.id === id);
    } else if (type === 'category') {
      selectedItem = categories.find(c => c.id === id);
    } else if (type === 'package') {
      selectedItem = packages.find(p => p.id === id);
    }
    showDeleteModal = true;
  }

  // Pagination functions
  function goToPage(page) {
    if (page >= 1 && page <= currentTotalPages) {
      currentPage = page;
    }
  }

  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function goToNextPage() {
    if (currentPage < currentTotalPages) {
      currentPage++;
    }
  }

  // Generate page numbers for pagination
  function getPageNumbers() {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (currentTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= currentTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(currentTotalPages);
      } else if (currentPage >= currentTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = currentTotalPages - 3; i <= currentTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(currentTotalPages);
      }
    }
    
    return pages;
  }

  // Function to close modals
  function closeModals() {
    showDetailModal = false;
    showEditModal = false;
    showDeleteModal = false;
    selectedItem = null;
    modalType = '';
         editForm = {
       name: '',
       is_active: true,
       start_date: '',
       end_date: '',
       quintuple: '',
       quadruple: '',
       triple: '',
       double: '',
       cwb: '',
       cnb: '',
       infant: '',
       airline_id: '',
       umrah_season_id: '',
       umrah_category_id: ''
     };
  }

  // Function to save edit
  async function saveEdit() {
    try {
      // Set loading state
      isLoading = true;
      
      let result;
      
      if (modalType === 'season') {
        // Update umrah_seasons table
        result = await supabase
          .from('umrah_seasons')
          .update({
            name: editForm.name
          })
          .eq('id', selectedItem.id)
          .select();
          
      } else if (modalType === 'category') {
        // Update umrah_categories table
        result = await supabase
          .from('umrah_categories')
          .update({
            name: editForm.name
          })
          .eq('id', selectedItem.id)
          .select();
          
             } else if (modalType === 'package') {
         // Update umrah_dates table
         result = await supabase
           .from('umrah_dates')
           .update({
             start_date: editForm.start_date,
             end_date: editForm.end_date,
             quintuple: editForm.quintuple ? parseFloat(editForm.quintuple) : null,
             quadruple: editForm.quadruple ? parseFloat(editForm.quadruple) : null,
             triple: editForm.triple ? parseFloat(editForm.triple) : null,
             double: editForm.double ? parseFloat(editForm.double) : null,
             cwb: editForm.cwb ? parseFloat(editForm.cwb) : null,
             cnb: editForm.cnb ? parseFloat(editForm.cnb) : null,
             infant: editForm.infant ? parseFloat(editForm.infant) : null
           })
           .eq('id', selectedItem.id)
           .select();
       }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Show success message
              showToast('success', `${modalType === 'season' ? 'Musim' : modalType === 'category' ? 'Kategori' : 'Pakej'} berhasil diperbarui!`);
      
      // Close modal after save
      closeModals();
      
      // Refresh data by triggering a custom event
      window.dispatchEvent(new CustomEvent('refreshUmrahData'));
      
    } catch (error) {
      console.error('Error saving edit:', error);
      showToast('error', `Gagal memperbarui data: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  // Function to confirm delete
  async function confirmDelete() {
    try {
      // Set loading state
      isLoading = true;
      
      let result;
      
      if (modalType === 'season') {
        // Check if season is used in other tables
        const seasonUsage = await supabase
          .from('umrah_dates')
          .select('id')
          .eq('umrah_season_id', selectedItem.id)
          .limit(1);
          
        if (seasonUsage.data && seasonUsage.data.length > 0) {
          throw new Error('Musim ini tidak dapat dihapus karena masih digunakan dalam pakej umrah');
        }
        
        // Delete from umrah_seasons table
        result = await supabase
          .from('umrah_seasons')
          .delete()
          .eq('id', selectedItem.id);
          
      } else if (modalType === 'category') {
        // Check if category is used in other tables
        const categoryUsage = await supabase
          .from('umrah_dates')
          .select('id')
          .eq('umrah_category_id', selectedItem.id)
          .limit(1);
          
        if (categoryUsage.data && categoryUsage.data.length > 0) {
          throw new Error('Kategori ini tidak dapat dihapus karena masih digunakan dalam pakej umrah');
        }
        
        // Delete from umrah_categories table
        result = await supabase
          .from('umrah_categories')
          .delete()
          .eq('id', selectedItem.id);
          
      } else if (modalType === 'package') {
        // Check if package is used in bookings
        const packageUsage = await supabase
          .from('bookings')
          .select('id')
          .eq('umrah_date_id', selectedItem.id)
          .limit(1);
          
        if (packageUsage.data && packageUsage.data.length > 0) {
          throw new Error('Pakej ini tidak dapat dihapus karena masih digunakan dalam booking');
        }
        
        // Delete from umrah_dates table
        result = await supabase
          .from('umrah_dates')
          .delete()
          .eq('id', selectedItem.id);
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Show success message
              showToast('success', `${modalType === 'season' ? 'Musim' : modalType === 'category' ? 'Kategori' : 'Pakej'} berhasil dihapus!`);
      
      // Close modal after delete
      closeModals();
      
      // Refresh data by triggering a custom event
      window.dispatchEvent(new CustomEvent('refreshUmrahData'));
      
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('error', `Gagal menghapus data: ${error.message}`);
    } finally {
      isLoading = false;
    }
  }

  // Toast notification system
  let toastMessage = '';
  let toastType = 'success';
  let showToastNotification = false;

  function showToast(type, message) {
    toastType = type;
    toastMessage = message;
    showToastNotification = true;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      showToastNotification = false;
    }, 3000);
  }

  // Event listener for refresh data
  onMount(() => {
    const handleRefresh = () => {
      // Trigger parent component to refresh data
      window.dispatchEvent(new CustomEvent('refreshUmrahData'));
    };
    
    window.addEventListener('refreshUmrahData', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshUmrahData', handleRefresh);
    };
  });
</script>

<div class="bg-white rounded-2xl shadow-soft border border-white/60 overflow-hidden">
  <!-- Tab Navigation -->
  <div class="border-b border-slate-100">
    <nav class="flex space-x-4 sm:space-x-8 px-3 sm:px-6">
      <button
        class="py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 {activeTab === 'seasons' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
        on:click={() => activeTab = 'seasons'}
      >
        Musim ({seasons.length})
      </button>
      <button
        class="py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 {activeTab === 'categories' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
        on:click={() => activeTab = 'categories'}
      >
        Kategori ({categories.length})
      </button>
      <button
        class="py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 {activeTab === 'packages' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
        on:click={() => activeTab = 'packages'}
      >
        Pakej ({packages.length})
      </button>
    </nav>
  </div>

  <!-- Tab Content -->
  <div class="p-3 sm:p-6">
    {#if isLoading}
      <div class="flex items-center justify-center py-8 sm:py-12">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Memuat data...</span>
      </div>
    {:else if activeTab === 'seasons' && seasons.length === 0}
      <div class="text-center py-8 sm:py-12">
        <div class="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-medium text-slate-900 mb-1 sm:mb-2">Tidak ada data musim</h3>
        <p class="text-xs sm:text-sm text-slate-500">Coba ubah filter pencarian Anda</p>
      </div>
    {:else if activeTab === 'categories' && categories.length === 0}
      <div class="text-center py-8 sm:py-12">
        <div class="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-medium text-slate-900 mb-1 sm:mb-2">Tidak ada data kategori</h3>
        <p class="text-xs sm:text-sm text-slate-500">Coba ubah filter pencarian Anda</p>
      </div>
    {:else if activeTab === 'packages' && packages.length === 0}
      <div class="text-center py-8 sm:py-12">
        <div class="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21v-4a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v4"/>
          </svg>
        </div>
                  <h3 class="text-base sm:text-lg font-medium text-slate-900 mb-1 sm:mb-2">Tidak ada data pakej</h3>
        <p class="text-xs sm:text-sm text-slate-500">Coba ubah filter pencarian Anda</p>
      </div>
    {:else}
      <!-- Seasons Table -->
      {#if activeTab === 'seasons'}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Musim</th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dibuat</th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              {#each paginatedSeasons as season}
                <tr class="hover:bg-slate-50">
                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <svg class="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="text-xs sm:text-sm font-medium text-slate-900">{season.name}</div>
                      </div>
                    </div>
                  </td>

                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                    {formatDate(season.created_at)}
                  </td>
                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div class="flex space-x-1.5 sm:space-x-2">
                      <button
                        on:click={() => handleView('season', season.id)}
                        class="text-blue-600 hover:text-blue-900"
                      >
                        <Eye class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        on:click={() => handleEdit('season', season.id)}
                        class="text-green-600 hover:text-green-900"
                      >
                        <Edit class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        on:click={() => handleDelete('season', season.id)}
                        class="text-red-600 hover:text-red-900"
                      >
                        <Trash2 class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination for Seasons -->
        {#if totalPagesSeasons > 1}
          <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center text-xs sm:text-sm text-slate-700">
                <span>Menampilkan {startIndexSeasons + 1} - {Math.min(endIndexSeasons, totalSeasons)} dari {totalSeasons} data</span>
              </div>
              <div class="flex items-center justify-center sm:justify-end space-x-2">
                <button
                  on:click={goToPreviousPage}
                  disabled={currentPage === 1}
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                {#each getPageNumbers() as page}
                  {#if page === '...'}
                    <span class="px-2 sm:px-3 py-2 text-slate-400 text-xs sm:text-sm">...</span>
                  {:else}
                    <button
                      on:click={() => goToPage(page)}
                      class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-purple-600 text-white' : 'text-slate-700 hover:bg-slate-100'}"
                    >
                      {page}
                    </button>
                  {/if}
                {/each}
                
                <button
                  on:click={goToNextPage}
                  disabled={currentPage === totalPagesSeasons}
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Categories Table -->
      {#if activeTab === 'categories'}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Kategori</th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dibuat</th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              {#each paginatedCategories as category}
                <tr class="hover:bg-slate-50">
                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <svg class="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="text-xs sm:text-sm font-medium text-slate-900">{category.name}</div>
                      </div>
                    </div>
                  </td>

                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                    {formatDate(category.created_at)}
                  </td>
                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div class="flex space-x-1.5 sm:space-x-2">
                      <button
                        on:click={() => handleView('category', category.id)}
                        class="text-blue-600 hover:text-blue-900"
                      >
                        <Eye class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        on:click={() => handleEdit('category', category.id)}
                        class="text-green-600 hover:text-green-900"
                      >
                        <Edit class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        on:click={() => handleDelete('category', category.id)}
                        class="text-red-600 hover:text-red-900"
                      >
                        <Trash2 class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination for Categories -->
        {#if totalPagesCategories > 1}
          <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center text-xs sm:text-sm text-slate-700">
                <span>Menampilkan {startIndexCategories + 1} - {Math.min(endIndexCategories, totalCategories)} dari {totalCategories} data</span>
              </div>
              <div class="flex items-center justify-center sm:justify-end space-x-2">
                <button
                  on:click={goToPreviousPage}
                  disabled={currentPage === 1}
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                {#each getPageNumbers() as page}
                  {#if page === '...'}
                    <span class="px-2 sm:px-3 py-2 text-slate-400 text-xs sm:text-sm">...</span>
                  {:else}
                    <button
                      on:click={() => goToPage(page)}
                      class="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-yellow-600 text-white' : 'text-slate-700 hover:bg-slate-100'}"
                    >
                      {page}
                    </button>
                  {/if}
                {/each}
                
                <button
                  on:click={goToNextPage}
                  disabled={currentPage === totalPagesCategories}
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Packages Table -->
      {#if activeTab === 'packages'}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pakej</th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Periode</th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
              {#each paginatedPackages as umrahPackage}
                <tr class="hover:bg-slate-50">
                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <svg class="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21v-4a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v4"/>
                        </svg>
                      </div>
                      <div>
                        <div class="text-xs sm:text-sm font-medium text-slate-900">
                          {umrahPackage.umrah_seasons?.name || 'N/A'} - {umrahPackage.umrah_categories?.name || 'N/A'}
                        </div>
                        <div class="text-xs sm:text-sm text-slate-500">
                          {umrahPackage.airlines?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-500">
                    <div>
                      <div>{formatDate(umrahPackage.start_date)}</div>
                      <div class="text-xs text-slate-400">s/d {formatDate(umrahPackage.end_date)}</div>
                    </div>
                  </td>

                  <td class="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div class="flex space-x-1.5 sm:space-x-2">
                      <button
                        on:click={() => handleView('package', umrahPackage.id)}
                        class="text-blue-600 hover:text-blue-900"
                      >
                        <Eye class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        on:click={() => handleEdit('package', umrahPackage.id)}
                        class="text-green-600 hover:text-green-900"
                      >
                        <Edit class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        on:click={() => handleDelete('package', umrahPackage.id)}
                        class="text-red-600 hover:text-red-900"
                      >
                        <Trash2 class="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination for Packages -->
        {#if totalPagesPackages > 1}
          <div class="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex items-center text-xs sm:text-sm text-slate-700">
                <span>Menampilkan {startIndexPackages + 1} - {Math.min(endIndexPackages, totalPackages)} dari {totalPackages} data</span>
              </div>
              <div class="flex items-center justify-center sm:justify-end space-x-2">
                <button
                  on:click={goToPreviousPage}
                  disabled={currentPage === 1}
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                {#each getPageNumbers() as page}
                  {#if page === '...'}
                    <span class="px-2 sm:px-3 py-2 text-slate-400 text-xs sm:text-sm">...</span>
                  {:else}
                    <button
                      on:click={() => goToPage(page)}
                      class="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 {currentPage === page ? 'bg-green-600 text-white' : 'text-slate-700 hover:bg-slate-100'}"
                    >
                      {page}
                    </button>
                  {/if}
                {/each}
                
                <button
                  on:click={goToNextPage}
                  disabled={currentPage === totalPagesPackages}
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight class="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</div>

<!-- Modal Detail Data Umrah -->
{#if showDetailModal && selectedItem}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center {modalType === 'season' ? 'bg-purple-100' : modalType === 'category' ? 'bg-yellow-100' : 'bg-green-100'}">
            {#if modalType === 'season'}
              <Calendar class="w-6 h-6 text-purple-600" />
            {:else if modalType === 'category'}
              <Package class="w-6 h-6 text-yellow-600" />
            {:else}
              <Globe class="w-6 h-6 text-green-600" />
            {/if}
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              {#if modalType === 'season'}
                {selectedItem.name}
              {:else if modalType === 'category'}
                {selectedItem.name}
              {:else}
                {selectedItem.umrah_seasons?.name || 'N/A'} - {selectedItem.umrah_categories?.name || 'N/A'}
              {/if}
            </h2>
            <p class="text-gray-500">
              Detail {modalType === 'season' ? 'Musim' : modalType === 'category' ? 'Kategori' : 'Pakej'} Umrah
            </p>
          </div>
        </div>
        <button
          on:click={closeModals}
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <!-- Content Modal -->
      <div class="p-6 space-y-6">
        {#if modalType === 'season'}
          <!-- Detail Musim -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar class="w-5 h-5 text-purple-600" />
                Informasi Musim
              </h3>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-500">Nama Musim</p>
                  <p class="text-lg font-semibold text-gray-900">{selectedItem.name}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText class="w-5 h-5 text-blue-600" />
                Informasi Sistem
              </h3>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-500">Dibuat Pada</p>
                  <p class="text-gray-900">{formatDate(selectedItem.created_at)}</p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-500">Diperbarui Pada</p>
                  <p class="text-gray-900">Belum pernah diperbarui</p>
                </div>
              </div>
            </div>
          </div>

        {:else if modalType === 'category'}
          <!-- Detail Kategori -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package class="w-5 h-5 text-yellow-600" />
                Informasi Kategori
              </h3>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-500">Nama Kategori</p>
                  <p class="text-lg font-semibold text-gray-900">{selectedItem.name}</p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-500">ID</p>
                  <p class="text-gray-900 font-mono">{selectedItem.id}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText class="w-5 h-5 text-blue-600" />
                Informasi Sistem
              </h3>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-500">Dibuat Pada</p>
                  <p class="text-gray-900">{formatDate(selectedItem.created_at)}</p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-500">Diperbarui Pada</p>
                  <p class="text-gray-900">Belum pernah diperbarui</p>
                </div>
              </div>
            </div>
          </div>

        {:else}
          <!-- Detail Pakej -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe class="w-5 h-5 text-green-600" />
                Informasi Pakej
              </h3>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-500">Nama Pakej</p>
                  <p class="text-lg font-semibold text-gray-900">
                    {selectedItem.umrah_seasons?.name || 'N/A'} - {selectedItem.umrah_categories?.name || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-500">Maskapai</p>
                  <p class="text-gray-900">{selectedItem.airlines?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar class="w-5 h-5 text-blue-600" />
                Periode Perjalanan
              </h3>
              
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-500">Tanggal Mulai</p>
                  <p class="text-gray-900">{formatDate(selectedItem.start_date)}</p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-500">Tanggal Selesai</p>
                  <p class="text-gray-900">{formatDate(selectedItem.end_date)}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Harga Pakej - dengan pengkondisian untuk cruise -->
          {#if selectedItem.umrah_categories?.name === 'PELAYARAN' || selectedItem.umrah_categories?.name === 'UMRAH + PELAYARAN'}
            <!-- Harga Deck untuk Cruise -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign class="w-5 h-5 text-blue-600" />
                Harga Deck Cruise
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Low Deck -->
                <div class="space-y-4">
                  <h4 class="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">Low Deck</h4>
                  <div class="grid grid-cols-1 gap-3">
                    {#if selectedItem.low_deck_interior}
                      <div class="bg-blue-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-600">Interior</p>
                        <p class="text-lg font-semibold text-blue-700">{formatCurrency(selectedItem.low_deck_interior)}</p>
                      </div>
                    {/if}
                    
                    {#if selectedItem.low_deck_seaview}
                      <div class="bg-green-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-600">Sea View</p>
                        <p class="text-lg font-semibold text-green-700">{formatCurrency(selectedItem.low_deck_seaview)}</p>
                      </div>
                    {/if}
                    
                    {#if selectedItem.low_deck_balcony}
                      <div class="bg-purple-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-600">Balcony</p>
                        <p class="text-lg font-semibold text-purple-700">{formatCurrency(selectedItem.low_deck_balcony)}</p>
                      </div>
                    {/if}
                  </div>
                </div>
                
                <!-- High Deck -->
                <div class="space-y-4">
                  <h4 class="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2">High Deck</h4>
                  <div class="grid grid-cols-1 gap-3">
                    {#if selectedItem.high_deck_interior}
                      <div class="bg-blue-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-600">Interior</p>
                        <p class="text-lg font-semibold text-blue-700">{formatCurrency(selectedItem.high_deck_interior)}</p>
                      </div>
                    {/if}
                    
                    {#if selectedItem.high_deck_seaview}
                      <div class="bg-green-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-600">Sea View</p>
                        <p class="text-lg font-semibold text-green-700">{formatCurrency(selectedItem.high_deck_seaview)}</p>
                      </div>
                    {/if}
                    
                    {#if selectedItem.high_deck_balcony}
                      <div class="bg-purple-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-600">Balcony</p>
                        <p class="text-lg font-semibold text-purple-700">{formatCurrency(selectedItem.high_deck_balcony)}</p>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <!-- Harga Bilik untuk Pakej Umrah Biasa -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign class="w-5 h-5 text-green-600" />
                Harga Pakej
              </h3>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                {#if selectedItem.quintuple}
                  <div class="bg-green-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-500">Quintuple</p>
                    <p class="text-lg font-semibold text-green-700">{formatCurrency(selectedItem.quintuple)}</p>
                  </div>
                {/if}
                
                {#if selectedItem.quadruple}
                  <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-500">Quadruple</p>
                    <p class="text-lg font-semibold text-blue-700">{formatCurrency(selectedItem.quadruple)}</p>
                  </div>
                {/if}
                
                {#if selectedItem.triple}
                  <div class="bg-yellow-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-500">Triple</p>
                    <p class="text-lg font-semibold text-yellow-700">{formatCurrency(selectedItem.triple)}</p>
                  </div>
                {/if}
                
                {#if selectedItem.double}
                  <div class="bg-purple-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-500">Double</p>
                    <p class="text-lg font-semibold text-purple-700">{formatCurrency(selectedItem.double)}</p>
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Harga Kategori Khusus -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign class="w-5 h-5 text-orange-600" />
              Harga Kategori Khusus
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {#if selectedItem.cwb}
                <div class="bg-orange-50 p-4 rounded-lg">
                  <p class="text-sm text-gray-500">CWB (Child With Bed)</p>
                  <p class="text-lg font-semibold text-orange-700">{formatCurrency(selectedItem.cwb)}</p>
                </div>
              {/if}
              
              {#if selectedItem.cnb}
                <div class="bg-red-50 p-4 rounded-lg">
                  <p class="text-sm text-gray-500">CNB (Child No Bed)</p>
                  <p class="text-lg font-semibold text-red-700">{formatCurrency(selectedItem.cnb)}</p>
                </div>
              {/if}
              
              {#if selectedItem.infant}
                <div class="bg-pink-50 p-4 rounded-lg">
                  <p class="text-sm text-gray-500">Infant</p>
                  <p class="text-lg font-semibold text-pink-700">{formatCurrency(selectedItem.infant)}</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer Modal -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button
          on:click={closeModals}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Toast Notification -->
{#if showToastNotification}
  <div class="fixed top-4 right-4 z-[60] transition-all duration-300 ease-in-out">
    <div class="flex items-center gap-3 p-4 rounded-lg shadow-lg border {toastType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}">
      {#if toastType === 'success'}
        <CheckCircle class="w-5 h-5 text-green-600" />
      {:else}
        <AlertTriangle class="w-5 h-5 text-red-600" />
      {/if}
      <span class="font-medium">{toastMessage}</span>
      <button
        on:click={() => showToastNotification = false}
        class="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
{/if}

<!-- Modal Edit Data Umrah -->
{#if showEditModal && selectedItem}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center {modalType === 'season' ? 'bg-purple-100' : modalType === 'category' ? 'bg-yellow-100' : 'bg-green-100'}">
            {#if modalType === 'season'}
              <Calendar class="w-6 h-6 text-purple-600" />
            {:else if modalType === 'category'}
              <Package class="w-6 h-6 text-yellow-600" />
            {:else}
              <Globe class="w-6 h-6 text-green-600" />
            {/if}
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              Edit {modalType === 'season' ? 'Musim' : modalType === 'category' ? 'Kategori' : 'Pakej'} Umrah
            </h2>
            <p class="text-gray-500">
              Perbarui informasi {modalType === 'season' ? 'musim' : modalType === 'category' ? 'kategori' : 'pakej'}
            </p>
          </div>
        </div>
        <button
          on:click={closeModals}
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <!-- Content Modal -->
      <div class="p-6 space-y-6">
        <form on:submit|preventDefault={saveEdit} class="space-y-6">
          {#if modalType === 'season' || modalType === 'category'}
            <!-- Form untuk Musim dan Kategori -->
            <div class="space-y-4">
              <div>
                <label for="editName" class="block text-sm font-medium text-gray-700 mb-2">
                  Nama {modalType === 'season' ? 'Musim' : 'Kategori'}
                </label>
                <input
                  id="editName"
                  type="text"
                  bind:value={editForm.name}
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Masukkan nama ${modalType === 'season' ? 'musim' : 'kategori'}`}
                />
              </div>
              

            </div>

          {:else}
            <!-- Form untuk Pakej -->
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="editStartDate" class="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    id="editStartDate"
                    type="date"
                    bind:value={editForm.start_date}
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label for="editEndDate" class="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Selesai
                  </label>
                  <input
                    id="editEndDate"
                    type="date"
                    bind:value={editForm.end_date}
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div>
                   <label for="editQuintuple" class="block text-sm font-medium text-gray-700 mb-2">
                     Harga Quintuple
                   </label>
                   <input
                     id="editQuintuple"
                     type="number"
                     bind:value={editForm.quintuple}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="0"
                   />
                 </div>
                 
                 <div>
                   <label for="editQuadruple" class="block text-sm font-medium text-gray-700 mb-2">
                     Harga Quadruple
                   </label>
                   <input
                     id="editQuadruple"
                     type="number"
                     bind:value={editForm.quadruple}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="0"
                   />
                 </div>
                 
                 <div>
                   <label for="editTriple" class="block text-sm font-medium text-gray-700 mb-2">
                     Harga Triple
                   </label>
                   <input
                     id="editTriple"
                     type="number"
                     bind:value={editForm.triple}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="0"
                   />
                 </div>
                 
                 <div>
                   <label for="editDouble" class="block text-sm font-medium text-gray-700 mb-2">
                     Harga Double
                   </label>
                   <input
                     id="editDouble"
                     type="number"
                     bind:value={editForm.double}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="0"
                   />
                 </div>
               </div>

               <!-- Harga Kategori Khusus -->
               <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <label for="editCwb" class="block text-sm font-medium text-gray-700 mb-2">
                     Harga CWB (Child With Bed)
                   </label>
                   <input
                     id="editCwb"
                     type="number"
                     bind:value={editForm.cwb}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="0"
                   />
                 </div>
                 
                 <div>
                   <label for="editCnb" class="block text-sm font-medium text-gray-700 mb-2">
                     Harga CNB (Child No Bed)
                   </label>
                   <input
                     id="editCnb"
                     type="number"
                     bind:value={editForm.cnb}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="0"
                   />
                 </div>
                 
                 <div>
                   <label for="editInfant" class="block text-sm font-medium text-gray-700 mb-2">
                     Harga Infant
                   </label>
                   <input
                     id="editInfant"
                     type="number"
                     bind:value={editForm.infant}
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     placeholder="0"
                   />
                 </div>
               </div>
              

            </div>
          {/if}
        </form>
      </div>

      <!-- Footer Modal -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button
          on:click={closeModals}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          on:click={saveEdit}
          disabled={isLoading}
          class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if isLoading}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Menyimpan...
          {:else}
            Simpan Perubahan
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modal Konfirmasi Hapus -->
{#if showDeleteModal && selectedItem}
  <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-white/50">
      <!-- Header Modal -->
      <div class="flex items-center justify-center p-6 border-b border-gray-200">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle class="w-8 h-8 text-red-600" />
        </div>
      </div>

      <!-- Content Modal -->
      <div class="p-6 text-center">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Konfirmasi Hapus
        </h3>
        <p class="text-gray-500 mb-6">
          Apakah Anda yakin ingin menghapus {modalType === 'season' ? 'musim' : modalType === 'category' ? 'kategori' : 'pakej'} 
          <span class="font-semibold text-gray-900">
            "{#if modalType === 'season' || modalType === 'category'}{selectedItem.name}{:else}{selectedItem.umrah_seasons?.name || 'N/A'} - {selectedItem.umrah_categories?.name || 'N/A'}{/if}"
          </span>?
        </p>
        <p class="text-sm text-red-600 mb-6">
          Tindakan ini tidak dapat dibatalkan dan akan menghapus data secara permanen.
        </p>
      </div>

      <!-- Footer Modal -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button
          on:click={closeModals}
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          on:click={confirmDelete}
          disabled={isLoading}
          class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if isLoading}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Menghapus...
          {:else}
            Hapus
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

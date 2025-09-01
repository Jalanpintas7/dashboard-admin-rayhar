<script>
  import AirlineInputCard from "$lib/components/AirlineInputCard.svelte";
  import SalesConsultantInputCard from "$lib/components/SalesConsultantInputCard.svelte";
  import RoleGuard from "$lib/components/RoleGuard.svelte";
  import { user, loading } from "$lib/stores/auth.js";
  import { goto } from "$app/navigation";
  import { supabase } from "$lib/supabase.js";
  import { onMount } from "svelte";

  // Redirect ke login jika tidak ada user (hanya jika di halaman ini)
  $: if (!$loading && !$user) {
    goto("/login");
  }

  let airlines = [];
  let loadingAirlines = false;
  let error = null;
  
  // State untuk edit dan delete
  let editingAirline = null;
  let showEditModal = false;
  let showDeleteModal = false;
  let deletingAirline = null;
  let editForm = { name: '' };
  let editLoading = false;
  let deleteLoading = false;

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

  async function fetchAirlines() {
    loadingAirlines = true;
    error = null;
    try {
      const { data, error: supabaseError } = await supabase
        .from('airlines')
        .select('*')
        .order('name', { ascending: true });
      
      if (supabaseError) throw supabaseError;
      airlines = data || [];
    } catch (err) {
      console.error('Error fetching airlines:', err);
      error = 'Gagal memuat data penerbangan';
      airlines = [];
    } finally {
      loadingAirlines = false;
    }
  }

  onMount(() => {
    fetchAirlines();
  });

  function handleAirlineAdded() {
    fetchAirlines(); // Refresh data setelah airline ditambahkan
  }

  // Fungsi untuk membuka modal edit
  function openEditModal(airline) {
    editingAirline = airline;
    editForm = {
      name: airline.name
    };
    showEditModal = true;
  }

  // Fungsi untuk menutup modal edit
  function closeEditModal() {
    showEditModal = false;
    editingAirline = null;
    editForm = { name: '' };
  }

  // Fungsi untuk menyimpan perubahan edit
  async function handleEditSubmit() {
    if (!editForm.name.trim()) {
      return;
    }

    editLoading = true;
    try {
      const { error } = await supabase
        .from('airlines')
        .update({
          name: editForm.name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAirline.id);

      if (error) throw error;

      // Refresh data
      await fetchAirlines();
      closeEditModal();
      showToast('success', 'Penerbangan berhasil diperbarui!');
    } catch (err) {
      console.error('Error updating airline:', err);
      error = 'Gagal mengupdate penerbangan';
      showToast('error', 'Gagal memperbarui penerbangan');
    } finally {
      editLoading = false;
    }
  }

  // Fungsi untuk membuka modal delete
  function openDeleteModal(airline) {
    deletingAirline = airline;
    showDeleteModal = true;
  }

  // Fungsi untuk menutup modal delete
  function closeDeleteModal() {
    showDeleteModal = false;
    deletingAirline = null;
  }

  // Fungsi untuk menghapus airline
  async function handleDelete() {
    if (!deletingAirline) return;

    deleteLoading = true;
    try {
      const { error } = await supabase
        .from('airlines')
        .delete()
        .eq('id', deletingAirline.id);

      if (error) throw error;

      // Refresh data
      await fetchAirlines();
      closeDeleteModal();
      showToast('success', 'Penerbangan berhasil dihapus!');
    } catch (err) {
      console.error('Error deleting airline:', err);
      error = 'Gagal menghapus penerbangan';
      showToast('error', 'Gagal menghapus penerbangan');
    } finally {
      deleteLoading = false;
    }
  }
</script>

<RoleGuard allowedRoles={["super_admin"]} redirectTo="/login">
  <div class="p-2 sm:p-3 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
    <!-- Header Halaman -->
    <div class="mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
        Manajemen Penerbangan
      </h1>
      <p class="text-sm sm:text-base text-slate-600 leading-relaxed">
        Kelola data penerbangan
      </p>
    </div>

    <!-- Layout Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-8">
      <!-- Form Input Airline -->
      <div>
        <AirlineInputCard on:airlineAdded={handleAirlineAdded} />
      </div>
      
      <!-- Data Table List Airline -->
      <div>
        <div class="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-white/60">
          <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
            <div class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600">
                <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
              </svg>
            </div>
            <h2 class="text-base sm:text-lg lg:text-xl font-bold text-slate-800">Daftar Penerbangan</h2>
          </div>

          {#if error}
            <div class="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-red-100 text-red-800 border border-red-200 text-xs sm:text-sm">
              {error}
              <button 
                on:click={fetchAirlines}
                class="ml-2 underline hover:no-underline"
              >
                Coba lagi
              </button>
            </div>
          {/if}

          {#if loadingAirlines}
            <div class="flex items-center justify-center py-6 sm:py-8">
              <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          {:else if airlines.length === 0}
            <div class="text-center py-6 sm:py-8 text-slate-500">
              <p class="text-xs sm:text-sm">Belum ada data penerbangan</p>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="text-left py-2 sm:py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm text-slate-700">No</th>
                    <th class="text-left py-2 sm:py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm text-slate-700">Nama Penerbangan</th>
                    <th class="text-left py-2 sm:py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm text-slate-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {#each airlines as airline, index}
                    <tr class="border-b border-slate-100 hover:bg-slate-50">
                      <td class="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-slate-600">{index + 1}</td>
                      <td class="py-2 sm:py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm text-slate-800">{airline.name}</td>
                      <td class="py-2 sm:py-3 px-3 sm:px-4">
                        <div class="flex items-center gap-1.5 sm:gap-2">
                          <button
                            on:click={() => openEditModal(airline)}
                            class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span class="text-xs">Edit</span>
                          </button>
                          <button
                            on:click={() => openDeleteModal(airline)}
                            class="inline-flex items-center px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1">
                              <path d="M3 6h18"/>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            <span class="text-xs">Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Edit Airline -->
  {#if showEditModal}
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-white/50">
        <div class="flex items-center justify-between mb-4 p-6 border-b border-gray-200">
          <h3 class="text-lg font-bold text-slate-800">Edit Penerbangan</h3>
          <button
            on:click={closeEditModal}
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form on:submit|preventDefault={handleEditSubmit} class="space-y-4 p-6">
          <div>
            <label for="editName" class="block text-sm font-medium text-slate-700 mb-2">
              Nama Penerbangan *
            </label>
            <input
              id="editName"
              type="text"
              bind:value={editForm.name}
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              on:click={closeEditModal}
              class="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editLoading}
              class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            >
              {editLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Modal Delete Confirmation -->
  {#if showDeleteModal}
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-white/50">
        <div class="text-center p-6">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6 text-red-600">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
          </div>
          
          <h3 class="text-lg font-bold text-slate-800 mb-2">Konfirmasi Hapus</h3>
          <p class="text-slate-600 mb-6">
            Apakah Anda yakin ingin menghapus penerbangan <strong>"{deletingAirline?.name}"</strong>? 
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <div class="flex gap-3">
            <button
              on:click={closeDeleteModal}
              class="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              on:click={handleDelete}
              disabled={deleteLoading}
              class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors"
            >
              {deleteLoading ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Toast Notification -->
  {#if showToastNotification}
    <div class="fixed top-4 right-4 z-[60] transition-all duration-300 ease-in-out">
      <div class="flex items-center gap-3 p-4 rounded-lg shadow-lg border {toastType === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}">
        {#if toastType === 'success'}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-green-600">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-red-600">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        {/if}
        <span class="font-medium">{toastMessage}</span>
        <button
          on:click={() => showToastNotification = false}
          class="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  {/if}
</RoleGuard>

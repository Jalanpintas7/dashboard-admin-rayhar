<script>
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase.js';

  const dispatch = createEventDispatcher();

  let airlineName = '';
  let loading = false;
  let message = '';
  let messageType = '';

  async function handleSubmit() {
    if (!airlineName.trim()) {
      message = 'Mohon isi nama penerbangan';
      messageType = 'error';
      return;
    }

    loading = true;
    message = '';

    try {
      const { data, error } = await supabase
        .from('airlines')
        .insert([
          {
            name: airlineName.trim()
          }
        ])
        .select();

      if (error) throw error;

      message = 'Penerbangan berhasil ditambahkan!';
      messageType = 'success';
      
      // Reset form
      airlineName = '';
      
      // Dispatch event untuk refresh data
      dispatch('airlineAdded', data[0]);

    } catch (error) {
      console.error('Error adding airline:', error);
      message = 'Gagal menambahkan penerbangan. Silakan coba lagi.';
      messageType = 'error';
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-4 lg:p-6 border border-white/60">
  <!-- Header dengan ikon -->
  <div class="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
    <div class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1.5 0-2 1-2 1l-3.5 3.5L7.2 6.2C6.4 6 6 6.6 6.8 7.4L11 12l-7.8 1.8c-.8.2-.4.8.4.6L12 13l3.5 3.5c.8.8 1.4.4 1.2-.4L17.8 19.2Z"/>
      </svg>
    </div>
    <h2 class="text-base sm:text-lg lg:text-xl font-bold text-slate-800">Input Penerbangan</h2>
  </div>

  <!-- Message -->
  {#if message}
    <div class="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm {messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
      {message}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-3 sm:space-y-4 lg:space-y-6">
    <div>
      <label for="airlineName" class="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-2">
        Nama Penerbangan *
      </label>
      <input
        id="airlineName"
        type="text"
        bind:value={airlineName}
        placeholder="Contoh: Garuda Indonesia, Saudi Airlines, Emirates"
        class="w-full px-3 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        required
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg sm:rounded-xl transition-colors duration-200 shadow-soft hover:shadow-lg"
    >
      {#if loading}
        <div class="flex items-center justify-center gap-1.5 sm:gap-2">
          <div class="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs sm:text-sm">Menambahkan...</span>
        </div>
      {:else}
        <span class="text-xs sm:text-sm">Tambah Penerbangan</span>
      {/if}
    </button>
  </form>
</div>

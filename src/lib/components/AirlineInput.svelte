<script>
  import { createAirline } from '../supabase-helpers.js';

  let airlineData = {
    namaPenerbangan: '',
    status: 'aktif'
  };

  let isLoading = false;
  let message = '';
  let messageType = '';

  async function handleSubmit() {
    if (!airlineData.namaPenerbangan.trim()) {
      showMessage('Nama penerbangan harus diisi', 'error');
      return;
    }

    isLoading = true;
    message = '';
    
    try {
      // Persiapkan data untuk database
      const airlineDataForDB = {
        name: airlineData.namaPenerbangan.trim(),
        is_active: airlineData.status === 'aktif'
      };

      // Simpan ke database menggunakan Supabase
      const result = await createAirline(airlineDataForDB);
      
      console.log('Penerbangan berhasil ditambahkan:', result);
      showMessage('Penerbangan berhasil ditambahkan!', 'success');
      
      // Reset form setelah submit berhasil
      airlineData = {
        namaPenerbangan: '',
        status: 'aktif'
      };
      
    } catch (error) {
      console.error('Error saat menambahkan penerbangan:', error);
      showMessage('Gagal menambahkan penerbangan. Silakan coba lagi.', 'error');
    } finally {
      isLoading = false;
    }
  }

  function showMessage(text, type) {
    message = text;
    messageType = type;
    
    // Auto hide message setelah 5 detik
    setTimeout(() => {
      message = '';
      messageType = '';
    }, 5000);
  }
</script>

<div class="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 border border-white/60">
  <div class="flex items-center gap-3 mb-4 sm:mb-6">
    <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1.5 0-2 1-2 1l-3.5 3.5L7.2 6.2C6.4 6 6 6.6 6.8 7.4L11 12l-7.8 1.8c-.8.2-.4.8.4.6L12 13l3.5 3.5c.8.8 1.4.4 1.2-.4L17.8 19.2Z"/>
      </svg>
    </div>
    <h2 class="text-lg sm:text-xl font-bold text-slate-800">Input Penerbangan Baru</h2>
  </div>

  <!-- Message Display -->
  {#if message}
    <div class="mb-4 p-3 rounded-lg {messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}">
      {message}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-4 sm:space-y-6">
    <div>
      <label for="namaPenerbangan" class="block text-sm font-medium text-slate-700 mb-2">
        Nama Penerbangan *
      </label>
      <input
        id="namaPenerbangan"
        type="text"
        bind:value={airlineData.namaPenerbangan}
        required
        placeholder="Contoh: Saudi Airlines, Emirates, Qatar Airways"
        class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        disabled={isLoading}
      />
    </div>

    <div>
      <label for="status" class="block text-sm font-medium text-slate-700 mb-2">
        Status
      </label>
      <select
        id="status"
        bind:value={airlineData.status}
        class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        disabled={isLoading}
      >
        <option value="aktif">Aktif</option>
        <option value="nonaktif">Non-Aktif</option>
      </select>
    </div>

    <button
      type="submit"
      disabled={isLoading}
      class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-soft hover:shadow-lg disabled:cursor-not-allowed"
    >
      {#if isLoading}
        <div class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Menyimpan...
        </div>
      {:else}
        Tambah Penerbangan
      {/if}
    </button>
  </form>
</div>

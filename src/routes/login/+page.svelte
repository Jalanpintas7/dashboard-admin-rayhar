<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { signIn, user, loading } from '$lib/stores/auth.js';
  import EmailInput from '$lib/components/EmailInput.svelte';
  import PasswordInput from '$lib/components/PasswordInput.svelte';
  import { Loader2, LogIn } from 'lucide-svelte';
  import { themeColors } from '$lib/theme/colors.js';
  import logoSrc from '$lib/assets/logorayharsvg.svg';

  let email = '';
  let password = '';
  let rememberMe = false;
  let isLoading = false;
  let loginError = '';

  // Redirect jika sudah login
  $: if ($user && !$loading) {
    goto('/');
  }

  function handleInputChange() {
    // Clear error when user starts typing
    if (loginError) {
      loginError = '';
    }
  }

  async function handleSubmit() {
    if (!email || !password) {
      loginError = 'Email dan password harus diisi';
      return;
    }

    try {
      isLoading = true;
      loginError = '';
      
      await signIn(email, password);
      
      // Redirect akan ditangani oleh reactive statement di atas
    } catch (error) {
      console.error('Login error:', error);
      loginError = error.message || 'Gagal masuk. Silakan coba lagi.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    // Focus pada email input saat halaman dimuat
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  });
</script>

<svelte:head>
  <title>Login - Dashboard Admin Rayhar</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center p-4">
  <div class="max-w-md w-full space-y-8">
    <!-- Logo dan Header -->
    <div class="text-center">
      <div class="mx-auto w-40 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center mb-4" style="--tw-gradient-from: {themeColors.primary}; --tw-gradient-to: {themeColors.primary}88;">
        <img src={logoSrc} alt="Logo Rayhar"  />
      </div>
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Selamat Datang</h2>
      <p class="text-gray-600">Masuk ke dashboard admin Rayhar</p>
    </div>

    <!-- Form Login -->
    <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <!-- Error Message -->
      {#if loginError}
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-600 text-sm">{loginError}</p>
        </div>
      {/if}
      
      <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
        <!-- Email Input -->
        <EmailInput
          bind:value={email}
          id="email"
          label="Email"
          placeholder="Masukkan email Anda"
          required={true}
          on:input={handleInputChange}
        />

        <!-- Password Input -->
        <PasswordInput
          bind:value={password}
          id="password"
          label="Password"
          placeholder="Masukkan password Anda"
          required={true}
          on:input={handleInputChange}
        />

       

        <!-- Login Button -->
        <div>
          <button
            type="submit"
            disabled={isLoading || $loading}
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform"
            style="background-color: {themeColors.primary}; --tw-ring-color: {themeColors.primary};"
          >
            {#if isLoading || $loading}
              <!-- Circular Progress Indicator -->
              <div class="flex items-center space-x-3">
                <div class="relative">
                  <div class="w-5 h-5 border-2 border-white border-opacity-30 rounded-full"></div>
                  <div class="absolute top-0 left-0 w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                </div>
                <span class="text-white font-medium">Memproses...</span>
              </div>
            {:else}
              <span class="absolute left-0 inset-y-0 flex items-center pl-3 transition-transform duration-200 group-hover:translate-x-1">
                <LogIn class="h-5 w-5 text-white group-hover:text-white" />
              </span>
              <span class="transition-all duration-200 group-hover:translate-x-1">Masuk</span>
            {/if}
          </button>
        </div>
      </form>

      
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar untuk webkit browsers */
  ::-webkit-scrollbar {
    width: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
</style>

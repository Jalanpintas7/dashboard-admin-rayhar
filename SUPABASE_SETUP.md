# Setup Supabase untuk Rayhar Admin Dashboard

## 📋 Overview

Project ini sudah terintegrasi dengan Supabase untuk backend database dan authentication. Setup ini menggunakan MCP (Model Context Protocol) untuk koneksi langsung ke database.

## 🔧 Konfigurasi yang Sudah Dibuat

### 1. Dependencies
- `@supabase/supabase-js` - Client library untuk Supabase

### 2. File Konfigurasi
- `src/lib/supabase.js` - Konfigurasi client Supabase
- `src/lib/supabase-helpers.js` - Helper functions untuk operasi database
- `src/lib/stores/supabase.js` - Svelte stores untuk state management

### 3. Environment Variables
Untuk menggunakan environment variables, buat file `.env` di root project dengan format berikut:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://lrpsrlmlrgqivfczbzqp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycHNybG1scmdxaXZmY3pienFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjAxOTYsImV4cCI6MjA3MDc5NjE5Nn0.6FuahA3i5mZZHjLmOHnZdLn_g09fgfkmL9cPPyuOeJo

# Service Role Key (untuk server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Environment
NODE_ENV=development
```

## 🗄️ Database Schema

Project ini terhubung ke database dengan tabel-tabel berikut:

### Core Tables
- `branches` - Data cabang
- `destinations` - Data destinasi
- `outbound_dates` - Tanggal keberangkatan
- `package_types` - Jenis pakej
- `umrah_seasons` - Musim umrah
- `umrah_categories` - Kategori umrah
- `leads` - Data leads
- `sales_consultant` - Konsultan penjualan
- `umrah_dates` - Tanggal umrah
- `bookings` - Data pemesanan
- `members_booking` - Anggota pemesanan
- `airlines` - Data maskapai
- `postcode` - Data kode pos
- `user_branches` - Relasi user-cabang

## 🚀 Cara Penggunaan

### 1. Import Client
```javascript
import { supabase } from '$lib/supabase.js'
```

### 2. Import Helpers
```javascript
import { getBranches, getDestinations, getLeads } from '$lib/supabase-helpers.js'
```

### 3. Import Stores
```javascript
import { user, loading, signIn, signOut } from '$lib/stores/supabase.js'
```

### 4. Contoh Penggunaan di Komponen
```svelte
<script>
  import { onMount } from 'svelte'
  import { getBranches } from '$lib/supabase-helpers.js'
  
  let branches = []
  let loading = true
  
  onMount(async () => {
    try {
      branches = await getBranches()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <p>Loading...</p>
{:else}
  {#each branches as branch}
    <div>{branch.name}</div>
  {/each}
{/if}
```

## 🔐 Authentication

### Sign In
```javascript
import { signIn } from '$lib/stores/supabase.js'

try {
  await signIn(email, password)
  // Redirect atau update UI
} catch (error) {
  console.error('Login failed:', error.message)
}
```

### Sign Out
```javascript
import { signOut } from '$lib/stores/supabase.js'

await signOut()
```

### Check User Status
```svelte
<script>
  import { user } from '$lib/stores/supabase.js'
</script>

{#if $user}
  <p>Welcome, {$user.email}</p>
{:else}
  <p>Please sign in</p>
{/if}
```

## 📊 Helper Functions

### Data Fetching
- `getBranches()` - Ambil semua cabang aktif
- `getDestinations()` - Ambil semua destinasi
- `getLeads(limit)` - Ambil data leads
- `getBookings(limit)` - Ambil data bookings
- `getUmrahSeasons()` - Ambil musim umrah
- `getUmrahCategories()` - Ambil kategori umrah
- `getSalesConsultants()` - Ambil konsultan penjualan
- `getPackageTypes()` - Ambil jenis pakej
- `getAirlines()` - Ambil data maskapai

### Data Creation
- `createDestination(data)` - Buat destinasi baru
- `createUmrahSeason(data)` - Buat musim umrah baru
- `createUmrahCategory(data)` - Buat kategori umrah baru

### Statistics
- `getDashboardStats()` - Ambil statistik dashboard

## 🛠️ MCP Integration

Project ini menggunakan MCP Supabase untuk:
- Akses langsung ke database
- Eksekusi query SQL
- Manajemen migrasi
- Monitoring dan debugging

### MCP Configuration
File `mcp.json` sudah dikonfigurasi dengan:
- Project Reference: `lrpsrlmlrgqivfczbzqp`
- Access Token: Terkonfigurasi
- URL: `https://lrpsrlmlrgqivfczbzqp.supabase.co`

## 🔍 Troubleshooting

### 1. Connection Issues
- Pastikan URL dan anon key benar
- Cek koneksi internet
- Verifikasi project reference

### 2. Authentication Issues
- Pastikan user sudah terdaftar di Supabase Auth
- Cek email verification
- Verifikasi password

### 3. Data Loading Issues
- Cek RLS (Row Level Security) policies
- Verifikasi permissions
- Cek struktur tabel

## 📝 Notes

- Semua environment variables harus diawali dengan `VITE_` untuk client-side access
- Service role key hanya untuk server-side operations
- Gunakan anon key untuk client-side operations
- Pastikan RLS policies sudah dikonfigurasi dengan benar

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [SvelteKit Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-sveltekit)

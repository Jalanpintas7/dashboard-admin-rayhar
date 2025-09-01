# Data Umrah - Integrasi Supabase

## Overview
Halaman Data Umrah telah berhasil diintegrasikan dengan database Supabase untuk menampilkan data real dari tabel `umrah_seasons`, `umrah_categories`, dan `umrah_dates`.

## Fitur yang Tersedia

### 1. Data Overview
- **Statistik Cards**: Menampilkan total musim, kategori, dan pakej umrah
- **Daftar Musim**: Menampilkan semua musim umrah dengan status aktif/non-aktif
- **Daftar Kategori**: Menampilkan semua kategori umrah dengan level layanan
- **Daftar Pakej**: Menampilkan pakej umrah terbaru dengan informasi lengkap

### 2. Pencarian dan Filter
- **Pencarian Musim**: Mencari musim berdasarkan nama
- **Pencarian Kategori**: Mencari kategori berdasarkan nama
- **Filter Status**: Filter berdasarkan status aktif/non-aktif
- **Filter Periode**: Filter berdasarkan periode musim (Ramadhan, Syawal, dll)

### 3. Data Terfilter
- **Tab Navigation**: Navigasi antara musim, kategori, dan pakej
- **Tabel Detail**: Menampilkan data dalam format tabel dengan aksi edit/view/delete
- **Loading States**: Indikator loading saat memuat data
- **Empty States**: Pesan ketika tidak ada data yang ditemukan

## Struktur Database

### Tabel yang Digunakan

#### 1. `umrah_seasons`
```sql
- id (uuid, primary key)
- name (text)
- is_active (boolean)
- created_at (timestamp)
```

#### 2. `umrah_categories`
```sql
- id (uuid, primary key)
- name (text)
- is_active (boolean)
- created_at (timestamp)
- brochure (text, nullable)
```

#### 3. `umrah_dates`
```sql
- id (uuid, primary key)
- start_date (date)
- end_date (date)
- sektor (text)
- quintuple (double precision)
- quadruple (double precision)
- triple (double precision)
- double (double precision)
- umrah_season_id (uuid, foreign key)
- umrah_category_id (uuid, foreign key)
- airline_id (uuid, foreign key)
- is_active (boolean)
- flight_name (text)
- infant (double precision)
- cnb (double precision)
- cwb (double precision)
- created_at (timestamp)
```

## File yang Dibuat/Dimodifikasi

### 1. `src/lib/umrah-data-helpers.js` (Baru)
Fungsi helper untuk mengambil data dari Supabase:
- `fetchUmrahSeasons()` - Mengambil data musim umrah
- `fetchUmrahCategories()` - Mengambil data kategori umrah
- `fetchUmrahPackages()` - Mengambil data pakej umrah
- `getPackageCountBySeason()` - Menghitung jumlah pakej per musim
- `getPackageCountByCategory()` - Menghitung jumlah pakej per kategori
- `formatCurrency()` - Format currency ke format Indonesia
- `formatDate()` - Format tanggal ke format Indonesia

### 2. `src/lib/components/UmrahDataOverview.svelte` (Dimodifikasi)
- Menggunakan data real dari Supabase
- Menambahkan loading states dan error handling
- Menampilkan data dengan format yang sesuai

### 3. `src/lib/components/FilteredUmrahData.svelte` (Baru)
- Komponen tabel untuk menampilkan data terfilter
- Tab navigation untuk musim, kategori, dan pakej
- Aksi edit, view, dan delete (placeholder)

### 4. `src/routes/DataUmrah/+page.svelte` (Dimodifikasi)
- Menambahkan fungsi pencarian dan filter
- Mengintegrasikan dengan komponen FilteredUmrahData
- Menambahkan loading states dan feedback

## Cara Penggunaan

### 1. Akses Halaman
- Login sebagai super_admin
- Navigasi ke menu "Data Umrah"

### 2. Pencarian Data
- Masukkan kata kunci di field pencarian musim atau kategori
- Pilih filter status (Aktif/Non-Aktif)
- Pilih filter periode (Ramadhan/Syawal/dll)
- Klik tombol "Cari Data"

### 3. Reset Filter
- Klik tombol "Reset Filter" untuk menghapus semua filter
- Data akan kembali ke tampilan awal

### 4. Lihat Data Detail
- Gunakan tab navigation untuk melihat data musim, kategori, atau pakej
- Data ditampilkan dalam format tabel dengan informasi lengkap

## Error Handling

### 1. Loading States
- Menampilkan skeleton loading saat memuat data
- Disabled state pada tombol saat loading

### 2. Error States
- Pesan error jika gagal memuat data
- Tombol "Coba lagi" untuk retry

### 3. Empty States
- Pesan ketika tidak ada data yang ditemukan
- Saran untuk mengubah filter pencarian

## Performance Optimizations

### 1. Parallel Data Loading
- Menggunakan `Promise.all()` untuk memuat data secara parallel
- Mengurangi waktu loading

### 2. Efficient Filtering
- Filter dilakukan di client-side untuk responsivitas
- Tidak perlu request ulang ke server

### 3. Pagination Ready
- Struktur sudah siap untuk implementasi pagination
- Dapat menangani data dalam jumlah besar

## Future Enhancements

### 1. CRUD Operations
- Implementasi fungsi edit, view, dan delete
- Modal atau halaman terpisah untuk form

### 2. Advanced Filtering
- Filter berdasarkan range tanggal
- Filter berdasarkan range harga
- Filter berdasarkan maskapai

### 3. Export Data
- Export ke Excel/CSV
- Print friendly view

### 4. Real-time Updates
- Menggunakan Supabase Realtime
- Auto-refresh saat ada perubahan data

## Troubleshooting

### 1. Data Tidak Muncul
- Periksa koneksi internet
- Periksa konfigurasi Supabase
- Periksa console browser untuk error

### 2. Loading Terlalu Lama
- Periksa query database
- Pertimbangkan implementasi pagination
- Optimasi query dengan indexing

### 3. Error Supabase
- Periksa API key dan URL
- Periksa RLS policies
- Periksa struktur tabel

## Dependencies

### Required Packages
- `@supabase/supabase-js` - Client Supabase
- `lucide-svelte` - Icons
- `svelte` - Framework

### Environment Variables
```env
VITE_SUPABASE_URL=https://lrpsrlmlrgqivfczbzqp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Security Considerations

### 1. Row Level Security (RLS)
- Pastikan RLS policies sudah dikonfigurasi dengan benar
- Hanya user yang berhak yang dapat mengakses data

### 2. Input Validation
- Validasi input pencarian untuk mencegah injection
- Sanitasi data sebelum ditampilkan

### 3. Error Messages
- Jangan tampilkan error detail ke user
- Log error untuk debugging

## Testing

### 1. Unit Tests
- Test fungsi helper
- Test komponen Svelte
- Test error handling

### 2. Integration Tests
- Test integrasi dengan Supabase
- Test flow pencarian dan filter

### 3. E2E Tests
- Test user journey lengkap
- Test responsive design

## Deployment

### 1. Build
```bash
npm run build
```

### 2. Environment Setup
- Set environment variables di production
- Konfigurasi Supabase untuk production

### 3. Monitoring
- Monitor error rates
- Monitor performance metrics
- Monitor database usage

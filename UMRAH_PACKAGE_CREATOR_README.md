# Fitur Buat Pakej Umrah Baru

## Deskripsi
Fitur ini memungkinkan admin untuk membuat pakej umrah baru dengan memilih musim dan kategori yang sudah ada di database. Data musim diambil dari tabel `umrah_seasons` dan data kategori diambil dari tabel `umrah_categories`.

## Komponen yang Diupdate

### UmrahPackageCreator.svelte
Komponen form untuk membuat pakej umrah baru dengan integrasi database.

**Fitur:**
- **Data Dinamis**: Musim dan kategori diambil dari database Supabase
- **Form Lengkap**: Input semua detail pakej umrah
- **Preview Pakej**: Tampilkan detail musim dan kategori yang dipilih
- **Validasi**: Form validation yang komprehensif
- **Loading State**: Loading saat memuat data dari database
- **Error Handling**: Error handling yang user-friendly

## Integrasi dengan Supabase

### Data Source
- **Musim**: Menggunakan `getUmrahSeasons()` dari `supabase-helpers.js`
- **Kategori**: Menggunakan `getUmrahCategories()` dari `supabase-helpers.js`
- **Airlines**: Menggunakan `getAirlines()` dari `supabase-helpers.js`

### Database Table
- **Tabel**: `umrah_dates` - Menyimpan data paket umrah dengan harga dan detail perjalanan

### Struktur Data yang Diambil

#### Musim (umrah_seasons)
```javascript
{
  id: string,           // UUID musim
  name: string,         // Nama musim (contoh: "Ramadhan", "Syawal")
  is_active: boolean,   // Status aktif
  created_at: timestamp // Tanggal pembuatan
}
```

#### Kategori (umrah_categories)
```javascript
{
  id: string,           // UUID kategori
  name: string,         // Nama kategori (contoh: "Premium", "Standard")
  is_active: boolean,   // Status aktif
  created_at: timestamp // Tanggal pembuatan
  brochure: string      // Link brochure (opsional)
}
```

#### Airlines
```javascript
{
  id: string,           // UUID airline
  name: string,         // Nama airline (contoh: "Saudi Airlines", "Emirates")
  is_active: boolean,   // Status aktif
  created_at: timestamp // Tanggal pembuatan
  updated_at: timestamp // Tanggal update
}
```

#### Pakej Umrah (umrah_dates)
```javascript
{
  id: string,                    // UUID pakej
  start_date: date,              // Tanggal berangkat
  end_date: date,                // Tanggal kembali
  umrah_season_id: string,       // Foreign key ke umrah_seasons
  umrah_category_id: string,     // Foreign key ke umrah_categories
  airline_id: string,            // Foreign key ke airlines
  flight_name: string,           // Nama penerbangan (opsional)
  is_active: boolean,            // Status aktif
  // Harga berdasarkan tipe bilik
  double: number,                // Harga double room
  triple: number,                // Harga triple room
  quadruple: number,             // Harga quadruple room
  quintuple: number,             // Harga quintuple room
  // Harga untuk anak dan infant
  cwb: number,                   // Child with bed
  cnb: number,                   // Child no bed
  infant: number,                // Infant
  created_at: timestamp          // Tanggal pembuatan
}
```

## Form Fields

### 1. Nama Pakej
- **Type**: Text input
- **Required**: Ya
- **Placeholder**: "Contoh: Pakej Umrah Ramadhan Premium 2024"

### 2. Pilih Musim
- **Type**: Dropdown select
- **Required**: Ya
- **Data Source**: `umrah_seasons` (hanya yang aktif)
- **Filter**: `is_active = true`

### 3. Pilih Kategori
- **Type**: Dropdown select
- **Required**: Ya
- **Data Source**: `umrah_categories` (hanya yang aktif)
- **Filter**: `is_active = true`

### 4. Tanggal Perjalanan
- **Tanggal Berangkat**: Date input (required)
- **Tanggal Kembali**: Date input (required, min = tanggal berangkat)

### 5. Maskapai Penerbangan
- **Type**: Dropdown select
- **Required**: Ya
- **Data Source**: `airlines` (hanya yang aktif)
- **Filter**: `is_active = true`
- **Options**: Saudi Airlines, Emirates, Qatar Airways, dll.

### 6. Harga Berdasarkan Tipe Bilik
- **Type**: 4 Number inputs (grid layout)
- **Required**: Ya
- **Format**: Currency Malaysia (RM)
- **Step**: 100,000
- **Options**:
  - **Double Room (2 Orang)**: Harga per kamar untuk 2 orang
  - **Triple Room (3 Orang)**: Harga per kamar untuk 3 orang
  - **Quadruple Room (4 Orang)**: Harga per kamar untuk 4 orang
  - **Quintuple Room (5 Orang)**: Harga per kamar untuk 5 orang

### 7. Harga Anak dan Infant
- **Type**: 3 Number inputs (grid layout)
- **Required**: Tidak
- **Format**: Currency Malaysia (RM)
- **Options**:
  - **CWB (Child With Bed)**: Harga untuk anak dengan tempat tidur
  - **CNB (Child No Bed)**: Harga untuk anak tanpa tempat tidur
  - **Infant**: Harga untuk bayi/infant

### 8. Flight Name
- **Type**: Text input
- **Required**: Ya
- **Placeholder**: "Contoh: SV 123, EK 456, QR 789"

### 9. Status Pakej
- **Type**: Dropdown select
- **Options**: Aktif, Non-Aktif, Draft

### 10. Deskripsi Pakej
- **Type**: Textarea
- **Required**: Tidak
- **Rows**: 4

## Overview Pakej

### Lokasi dan Tampilan
Overview pakej ditampilkan di bagian bawah form, sebelum tombol submit, dengan design yang menarik menggunakan gradient background.

### Kondisi Tampilan
Overview akan muncul ketika ada data yang diisi:
- Nama pakej
- Musim yang dipilih
- Kategori yang dipilih
- Maskapai yang dipilih
- Tanggal berangkat/kembali
- Harga bilik (Double, Triple, Quadruple, Quintuple)
- Harga anak dan infant (CWB, CNB, Infant)

### Detail yang Ditampilkan

#### 1. Informasi Dasar
- **Nama Pakej**: Nama pakej yang diinput
- **Musim**: Nama musim + status badge (Aktif/Non-Aktif)
- **Kategori**: Nama kategori + status badge (Aktif/Non-Aktif)
- **Maskapai**: Nama maskapai + status badge (Aktif/Non-Aktif)
- **Flight Name**: Nama penerbangan (jika diisi)

#### 2. Tanggal Perjalanan
- **Tanggal Berangkat**: Format lengkap (hari, tanggal, bulan, tahun)
- **Tanggal Kembali**: Format lengkap (hari, tanggal, bulan, tahun)
- **Durasi**: Perhitungan otomatis jumlah hari perjalanan

#### 3. Harga Berdasarkan Tipe Bilik
- **Double Room**: Harga per kamar (2 orang) dengan format currency RM
- **Triple Room**: Harga per kamar (3 orang) dengan format currency RM
- **Quadruple Room**: Harga per kamar (4 orang) dengan format currency RM
- **Quintuple Room**: Harga per kamar (5 orang) dengan format currency RM

#### 4. Harga Anak dan Infant
- **CWB (Child With Bed)**: Harga anak dengan tempat tidur
- **CNB (Child No Bed)**: Harga anak tanpa tempat tidur
- **Infant**: Harga bayi/infant

#### 5. Status Pakej
- **Status**: Badge berwarna (Aktif/Non-Aktif) sesuai checkbox

### Design Features
- **Gradient Background**: Dari hijau ke biru (`from-green-50 to-blue-50`)
- **Card Layout**: Setiap section harga menggunakan card putih dengan shadow
- **Color Coding**: 
  - Harga bilik: Warna hijau (`text-green-600`)
  - Harga anak/infant: Warna biru (`text-blue-600`)
  - Status aktif: Badge hijau
  - Status non-aktif: Badge merah
- **Responsive Grid**: Layout yang responsive untuk berbagai ukuran layar
- **Icon**: Checkmark icon di header overview

## State Management

### Local State
- `seasons` - Array data musim dari database
- `categories` - Array data kategori dari database
- `airlines` - Array data airlines dari database
- `isLoading` - Status loading saat memuat data
- `error` - Pesan error jika ada masalah
- `packageData` - Data form input pakej

### Reactive Updates
- `selectedMusim` - Musim yang dipilih (reactive)
- `selectedKategori` - Kategori yang dipilih (reactive)
- `selectedAirline` - Airline yang dipilih (reactive)

## Loading dan Error Handling

### Loading State
- **Spinner**: Icon loading dengan animasi
- **Message**: "Memuat data musim dan kategori..."
- **Form**: Disembunyikan sampai data selesai dimuat

### Error Handling
- **Error Display**: Pesan error dengan styling merah
- **Console Log**: Error detail untuk debugging
- **User Message**: Pesan error yang user-friendly

## Data Loading Strategy

### Parallel Loading
```javascript
const [seasonsData, categoriesData, airlinesData] = await Promise.all([
  getUmrahSeasons(),
  getUmrahCategories(),
  getAirlines()
]);
```

### Filtering
- **Musim**: Hanya tampilkan yang `is_active = true`
- **Kategori**: Hanya tampilkan yang `is_active = true`
- **Airlines**: Hanya tampilkan yang `is_active = true`

## UI/UX Features

### Design System
- **Color Scheme**: Green theme (`bg-green-600`, `focus:ring-green-500`)
- **Consistency**: Konsisten dengan komponen lain
- **Responsive**: Grid layout yang responsive

### Interactive Elements
- **Hover Effects**: Transisi warna pada button
- **Focus States**: Ring focus yang jelas
- **Disabled States**: Styling untuk loading state

## Data yang Tersedia

### Musim Aktif (6 data)
- Umrah Ziarah Istanbul
- Umrah Kembara 5 Kota
- Umrah Musim Biasa
- Umrah Cuti Sekolah
- Umrah Ramadhan
- Dan lainnya...

### Kategori Aktif (9 data)
- Ekonomi
- Standard Dallah
- Premium Selesa
- Promosi Olayan
- Safwah Jimat
- Dan lainnya...

## Cara Penggunaan

### 1. Load Data
1. Komponen otomatis memuat data saat mount
2. Loading state ditampilkan selama proses
3. Error ditampilkan jika ada masalah

### 2. Pilih Musim dan Kategori
1. Pilih musim dari dropdown (hanya yang aktif)
2. Pilih kategori dari dropdown (hanya yang aktif)
3. Preview detail akan muncul otomatis

### 3. Isi Detail Pakej
1. Isi nama pakej yang deskriptif
2. Pilih tanggal berangkat dan kembali
3. Pilih maskapai penerbangan
4. Input harga untuk setiap tipe bilik (Double, Triple, Quadruple, Quintuple)
5. Input harga untuk anak dan infant (CWB, CNB, Infant)
6. Input flight name
7. Pilih status pakej
8. Tambah deskripsi (opsional)

### 4. Submit
1. Klik "Buat Pakej Umrah"
2. Validasi form akan dijalankan
3. Data akan disimpan ke database Supabase
4. Pesan sukses/error akan ditampilkan
5. Form akan reset setelah berhasil

## Validasi Form

### Client-side Validation
- **Nama Pakej**: Wajib diisi
- **Musim**: Wajib dipilih
- **Kategori**: Wajib dipilih
- **Tanggal Berangkat**: Wajib diisi
- **Tanggal Kembali**: Wajib diisi
- **Maskapai**: Wajib dipilih

### Error Handling
- **Loading State**: Tombol submit menampilkan spinner saat menyimpan
- **Success Message**: Pesan hijau saat berhasil menyimpan
- **Error Message**: Pesan merah dengan detail error
- **Auto Hide**: Pesan otomatis hilang setelah 5 detik

## Future Enhancements

### Fitur yang Bisa Ditambahkan
1. **Image Upload**: Upload gambar pakej
2. **Price Calculator**: Kalkulator harga otomatis
3. **Validation Rules**: Validasi tanggal berdasarkan musim
4. **Bulk Import**: Import pakej dari Excel/CSV
5. **Package Management**: Edit dan hapus pakej yang sudah dibuat

### Database Integration
1. **Tabel Pakej**: Menggunakan tabel `umrah_dates` yang sudah ada
2. **Foreign Keys**: Relasi dengan musim, kategori, dan airlines
3. **Audit Trail**: Tracking perubahan pakej

## Dependencies

### Frontend
- Svelte 5
- Tailwind CSS
- Supabase JS Client

### Backend
- Supabase (PostgreSQL)
- Helper functions dari `supabase-helpers.js`

## File Locations

```
src/lib/components/
└── UmrahPackageCreator.svelte    # Form buat pakej umrah

src/lib/
├── supabase.js                   # Supabase client
└── supabase-helpers.js           # Helper functions
```

## Support

Jika ada masalah atau pertanyaan tentang fitur ini, silakan:
1. Cek console browser untuk error
2. Verifikasi koneksi Supabase
3. Cek data musim dan kategori di database
4. Hubungi developer team

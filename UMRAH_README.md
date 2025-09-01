# Fitur Manajemen Musim & Kategori Umrah - Dashboard Admin Rayhar

## Overview
Fitur manajemen musim dan kategori umrah memungkinkan admin untuk mengelola komponen-komponen dasar pakej umrah dan membuat pakej baru yang menarik. Fitur ini terdiri dari dua halaman utama:

1. **Input Musim & Kategori** (`/InputMusim&Kategori`) - Untuk menambah musim dan kategori umrah baru, serta membuat pakej umrah
2. **Data Umrah** (`/DataUmrah`) - Untuk melihat dan mengelola semua data musim, kategori, dan pakej umrah yang tersedia

## Struktur File

### Komponen
- `src/lib/components/UmrahSeasonInput.svelte` - Form input musim umrah
- `src/lib/components/UmrahCategoryInput.svelte` - Form input kategori umrah
- `src/lib/components/UmrahPackageCreator.svelte` - Form pembuatan pakej umrah baru
- `src/lib/components/UmrahDataOverview.svelte` - Overview data musim, kategori, dan pakej

### Halaman
- `src/routes/InputMusim&Kategori/+page.svelte` - Halaman input musim, kategori, dan pembuatan pakej umrah
- `src/routes/DataUmrah/+page.svelte` - Halaman data overview dan manajemen data umrah

## Fitur yang Tersedia

### 1. Input Musim Umrah
- **Form Input:**
  - Nama Musim (wajib) - Contoh: Ramadhan, Syawal, Dzulhijjah
  - Deskripsi Musim (opsional)
  - Periode Awal dan Akhir (wajib) - Tanggal musim berlangsung
  - Status Aktif/Non-Aktif

- **Validasi:**
  - Field wajib tidak boleh kosong
  - Periode akhir harus setelah periode awal
  - Format tanggal yang konsisten

### 2. Input Kategori Umrah
- **Form Input:**
  - Nama Kategori (wajib) - Contoh: Premium, Standard, Ekonomi, VIP
  - Deskripsi Kategori (opsional)
  - Level Layanan - Standard, Premium, VIP, Ekonomi, Luxury
  - Fasilitas yang Tersedia (multi-select):
    - Hotel (3, 4, 5 Bintang)
    - Makanan (2x atau 3x sehari)
    - Transport (AC/Non-AC)
    - Guide (Bahasa Indonesia/Arab)
    - Layanan tambahan (Visa, Asuransi, dll)
  - Status Aktif/Non-Aktif

### 3. Pembuatan Paket Umrah Baru
- **Form Input:**
  - Nama Paket (wajib)
  - Pilih Musim (dropdown dari data yang tersedia)
  - Pilih Kategori (dropdown dari data yang tersedia)
  - Tanggal Berangkat dan Kembali (dalam periode musim)
  - Maskapai Penerbangan (dropdown pilihan airline)
  - Harga per Pax (dengan format currency Malaysia)
- Harga Anak dan Infant (CWB, CNB, Infant)
- Kuota Tersedia
- Deskripsi Paket
- Status Paket (Aktif/Non-Aktif/Draft)

- **Fitur Khusus:**
  - Preview detail paket yang dipilih
  - Validasi tanggal sesuai periode musim
  - Format harga otomatis dalam Ringgit Malaysia
  - Dropdown yang terintegrasi dengan data musim dan kategori

### 4. Data Overview (Halaman Data Umrah)
- **Quick Actions:**
  - Tombol akses cepat untuk Tambah Musim, Tambah Kategori, dan Buat Paket
  - Link langsung ke halaman Input Musim & Kategori

- **Statistik Cards:**
  - Total Musim (dengan jumlah yang aktif)
  - Total Kategori (dengan jumlah yang aktif)
  - Total Pakej (dengan jumlah yang aktif)

- **Daftar Data:**
  - Daftar Musim Umrah dengan periode dan jumlah pakej
  - Daftar Kategori Umrah dengan level layanan
  - Pakej Umrah Terbaru dengan detail lengkap

## Cara Penggunaan

### Menambah Musim Umrah Baru
1. Klik menu "Input Musim & Kategori" di sidebar
2. Isi form musim dengan informasi lengkap
3. Set periode awal dan akhir musim
4. Pilih status aktif/non-aktif
5. Klik "Tambah Musim Umrah"

### Menambah Kategori Umrah Baru
1. Di halaman yang sama, isi form kategori
2. Pilih level layanan yang sesuai
3. Centang fasilitas yang tersedia
4. Set status aktif/non-aktif
5. Klik "Tambah Kategori Umrah"

### Membuat Pakej Umrah Baru
1. Scroll ke section "Buat Pakej Umrah Baru"
2. Pilih musim dan kategori yang sudah dibuat
3. Set tanggal berangkat dan kembali
4. Pilih maskapai penerbangan
5. Tentukan harga dan kuota
6. Klik "Buat Pakej Umrah"

### Melihat Data Overview
1. Klik menu "Data Umrah" di sidebar
2. Lihat statistik di cards bagian atas
3. Review daftar musim, kategori, dan pakej yang tersedia
4. Gunakan Quick Actions untuk akses cepat ke fitur manajemen

## Integrasi dengan Sidebar

Sidebar sudah terintegrasi dengan fitur umrah melalui menu:
- **Input Musim & Kategori** - Icon calendar, href: `/InputMusim&Kategori`
- **Data Umrah** - Icon mosque, href: `/DataUmrah`

## Styling dan UI

- **Design System:**
  - Musim: Warna ungu (purple) untuk identitas
  - Kategori: Warna kuning (yellow) untuk identitas
  - Pakej: Warna hijau (green) untuk identitas
  - Overview: Warna biru (blue) untuk identitas

- **Layout:**
  - Grid responsive untuk form input
  - Gradient background untuk section yang berbeda
  - Cards dengan shadow dan border yang konsisten
  - Tab navigation untuk organisasi konten

## Data Structure

### Musim Umrah
```javascript
{
  id: Number,
  nama: String,
  deskripsi: String,
  periodeAwal: String (YYYY-MM-DD),
  periodeAkhir: String (YYYY-MM-DD),
  status: 'aktif' | 'nonaktif',
  jumlahPakej: Number
}
```

### Kategori Umrah
```javascript
{
  id: Number,
  nama: String,
  deskripsi: String,
  levelLayanan: 'standard' | 'premium' | 'vip' | 'ekonomi' | 'luxury',
  fasilitas: Array<String>,
  status: 'aktif' | 'nonaktif',
  jumlahPakej: Number
}
```

### Pakej Umrah
```javascript
{
  id: Number,
  namaPaket: String,
  musimId: Number,
  kategoriId: Number,
  tanggalBerangkat: String (YYYY-MM-DD),
  tanggalKembali: String (YYYY-MM-DD),
  airline: String,
  hargaPerPax: Number,
  kuota: Number,
  deskripsi: String,
  status: 'aktif' | 'nonaktif' | 'draft'
}
```

## Validasi dan Business Logic

### Validasi Musim
- Periode akhir harus setelah periode awal
- Nama musim harus unik
- Status default: aktif

### Validasi Kategori
- Nama kategori harus unik
- Level layanan harus valid
- Fasilitas bisa dipilih multiple

### Validasi Pakej
- Tanggal berangkat harus dalam periode musim
- Tanggal kembali harus setelah tanggal berangkat
- Musim dan kategori harus aktif
- Harga harus positif
- Kuota harus minimal 1

## Future Enhancements

- **Integrasi Database:**
  - Supabase/PostgreSQL untuk data persistence
  - Real-time updates untuk status pakej
  - Audit trail untuk perubahan data

- **Fitur Advanced:**
  - Bulk import/export data
  - Template pakej untuk musim tertentu
  - Pricing calculator otomatis
  - Integration dengan sistem booking
  - Notifikasi untuk pakej yang akan berakhir

- **Analytics:**
  - Dashboard performance pakej
  - Trend booking per musim
  - Revenue analysis per kategori
  - Customer preference tracking

## Technical Notes

- **Svelte 5 Features:**
  - Reactive statements untuk computed values
  - Event handling untuk form submission
  - Component composition untuk modularitas

- **State Management:**
  - Local state untuk form data
  - Reactive binding untuk form validation
  - Data flow yang jelas antar komponen

- **Responsive Design:**
  - Grid layout yang adaptif
  - Mobile-first approach
  - Touch-friendly form elements

## Troubleshooting

### Common Issues:
1. **Form tidak submit:** Pastikan semua field wajib terisi
2. **Tanggal tidak valid:** Pastikan tanggal dalam periode musim yang dipilih
3. **Dropdown kosong:** Pastikan ada data musim dan kategori yang aktif
4. **Harga tidak format:** Pastikan input berupa angka positif

### Debug Tips:
- Buka browser console untuk melihat log data
- Periksa validasi form di browser developer tools
- Pastikan semua dependencies terinstall dengan benar

## Support

Untuk bantuan teknis atau pertanyaan tentang fitur umrah, silakan hubungi tim development.

---

**Catatan:** Fitur ini dirancang untuk memberikan fleksibilitas maksimal dalam pengelolaan paket umrah, memungkinkan admin untuk membuat variasi paket yang menarik sesuai dengan kebutuhan pasar dan preferensi pelanggan.

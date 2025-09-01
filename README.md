# Rayhar Admin Dashboard

Dashboard admin modern untuk mengelola bisnis travel dan umrah dengan antarmuka yang elegan dan responsif.

## Fitur Utama

### 🏠 Dashboard
- Ringkasan data penjualan dan inquiry
- Grafik performa bisnis
- Top sales dan inquiry
- Package top sales

### 👥 Pelanggan
- Tabel data pelanggan lengkap
- Informasi detail: nama, email, telepon, cabang
- Data pakej dan kategori perjalanan
- Status pemesanan (Confirmed, Pending, Cancelled)
- Harga dan tanggal pemesanan
- Pagination dan fitur pencarian

### ⚙️ Fitur Lainnya
- Pengaturan sistem
- Input musim & kategori
- Data umrah
- Manajemen destinasi
- Data destinasi

## Teknologi

- **Frontend**: SvelteKit
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Responsive**: Mobile-first design

## Struktur Proyek

```
src/
├── lib/
│   ├── components/
│   │   ├── CustomerTable.svelte    # Tabel pelanggan
│   │   ├── Sidebar.svelte          # Navigasi sidebar
│   │   ├── SummaryCards.svelte     # Kartu ringkasan
│   │   └── ...
│   ├── assets/                     # Gambar dan ikon
│   └── theme/                      # Konfigurasi tema
├── routes/
│   ├── +layout.svelte              # Layout utama
│   ├── +page.svelte                # Halaman dashboard
│   └── Pelanggan/
│       └── +page.svelte            # Halaman pelanggan
└── app.css                         # Styles global
```

## Cara Menjalankan

1. Install dependencies:
   ```bash
   npm install
   ```

2. Jalankan development server:
   ```bash
   npm run dev
   ```

3. Buka browser dan akses `http://localhost:5173`

## Navigasi

- **Dashboard**: Halaman utama dengan ringkasan data
- **Pelanggan**: Kelola data pelanggan dan pemesanan
- **Pengaturan**: Konfigurasi sistem
- **Input Musim & Kategori**: Manajemen kategori pakej
- **Data Umrah**: Data khusus pakej umrah
- **Destinasi**: Manajemen lokasi tujuan
- **Data Destinasi**: Detail informasi destinasi

## Fitur Tabel Pelanggan

Tabel pelanggan menampilkan informasi lengkap tentang:

- **PELANGGAN**: Nama, email, dan nomor telepon dengan avatar inisial
- **CAWANGAN**: Cabang kantor
- **PAKEJ**: Jenis pakej (Umrah/Pelancongan) dengan warna yang berbeda
- **KATEGORI**: Detail pakej perjalanan
- **STATUS**: Status pemesanan dengan indikator warna
- **HARGA**: Harga pakej dalam RM
- **TARIKH**: Tanggal pemesanan

## Responsivitas

Dashboard dirancang responsif untuk berbagai ukuran layar:
- **Mobile**: Sidebar collapsible dengan overlay
- **Tablet**: Layout adaptif
- **Desktop**: Sidebar tetap dengan navigasi lengkap

## Pengembangan

Proyek menggunakan SvelteKit dengan fitur:
- File-based routing
- Component-based architecture
- Reactive state management
- Modern CSS dengan Tailwind

---

© 2024 Rayhar Admin Dashboard. Made with ❤️ by pixeluniverce

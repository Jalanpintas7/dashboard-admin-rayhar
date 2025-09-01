# Fitur Filter "Dari Inquiry" pada CustomerTable

## Deskripsi
Fitur filter baru telah ditambahkan ke komponen `CustomerTable.svelte` untuk memungkinkan pengguna memfilter data pelanggan berdasarkan apakah data tersebut berasal dari inquiry atau tidak.

## Fitur yang Ditambahkan

### 1. Filter Dropdown "Dari Inquiry"
- **Lokasi**: Berada di bar filter bersama dengan filter Pakej dan Cawangan
- **Opsi**: 
  - "Semua Dari Inquiry" (default)
  - "Ya" (untuk data yang berasal dari inquiry)
  - "Tidak" (untuk data yang tidak berasal dari inquiry)

### 2. State Management
- Variabel `inquiryFilter` ditambahkan untuk menyimpan nilai filter yang dipilih
- Filter ini terintegrasi dengan sistem pagination dan reset filter yang sudah ada

### 3. Logika Filtering
- Filter bekerja berdasarkan kolom `from_inquiry` dari data customer
- Data yang difilter sesuai dengan pilihan user:
  - Jika memilih "Ya": hanya menampilkan customer dengan `from_inquiry = true`
  - Jika memilih "Tidak": hanya menampilkan customer dengan `from_inquiry = false`
  - Jika memilih "Semua": menampilkan semua customer

### 4. Integrasi dengan Supabase
- Data diambil dari kolom `is_from_inquiry` pada tabel `bookings`
- Field ini bertipe boolean (true/false)
- Data ditransform menjadi `from_inquiry` dalam komponen

## Struktur Kode

### State Variables
```javascript
let inquiryFilter = '';
```

### Filter Logic
```javascript
if (inquiryFilter !== '') {
  const isFromInquiry = customer.from_inquiry === true;
  if (inquiryFilter === 'true' && !isFromInquiry) return false;
  if (inquiryFilter === 'false' && isFromInquiry) return false;
}
```

### UI Filter
```svelte
<select bind:value={inquiryFilter}>
  <option value="">Semua Dari Inquiry</option>
  <option value="true">Ya</option>
  <option value="false">Tidak</option>
</select>
```

### Reset Function
```javascript
function resetFilters() {
  searchTerm = '';
  packageFilter = '';
  branchFilter = '';
  inquiryFilter = ''; // Reset inquiry filter juga
  currentPage = 1;
}
```

## Cara Penggunaan

1. **Pilih Filter**: Klik dropdown "Dari Inquiry" dan pilih salah satu opsi
2. **Lihat Hasil**: Tabel akan otomatis memfilter data sesuai pilihan
3. **Reset Filter**: Klik tombol "Reset" untuk menghapus semua filter
4. **Kombinasi Filter**: Filter ini dapat dikombinasikan dengan filter lain (nama, pakej, cawangan)

## Tampilan Data

### Di Tabel
- Kolom "DARI INQUIRY" menampilkan:
  - ✓ (hijau) untuk data yang berasal dari inquiry
  - ✗ (merah) untuk data yang tidak berasal dari inquiry

### Di Modal Detail
- Informasi "Dari Inquiry" ditampilkan dengan format yang sama
- Memberikan konteks lengkap tentang asal data customer

## Kompatibilitas

- **Framework**: SvelteKit
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Svelte

## Dependencies

- `$lib/data/customers.js` - untuk fungsi `fetchCustomersData`
- `$lib/supabase.js` - untuk koneksi database

## Catatan Teknis

- Filter ini menggunakan reactive statement (`$:`) untuk update otomatis
- Pagination otomatis reset ke halaman 1 ketika filter berubah
- Filter ini terintegrasi dengan sistem filter yang sudah ada
- Tidak ada perubahan pada struktur database yang diperlukan

## Testing

Untuk memastikan filter berfungsi dengan baik:

1. **Test Filter "Ya"**: Pastikan hanya data dengan `from_inquiry = true` yang ditampilkan
2. **Test Filter "Tidak"**: Pastikan hanya data dengan `from_inquiry = false` yang ditampilkan
3. **Test Kombinasi**: Pastikan filter dapat dikombinasikan dengan filter lain
4. **Test Reset**: Pastikan tombol reset berfungsi untuk semua filter

## Maintenance

- Filter ini menggunakan field `from_inquiry` yang sudah ada
- Tidak ada perubahan pada struktur data yang diperlukan
- Mudah untuk dimodifikasi atau diperluas di masa depan

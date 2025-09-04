# Fitur Filter Data Pelanggan

## Deskripsi
Fitur ini menambahkan kemampuan untuk memfilter data pelanggan berdasarkan cawangan dan pakej di halaman Pelanggan.

## Fitur yang Ditambahkan

### 1. Filter Dropdown
- **Filter Cawangan**: Dropdown untuk memilih cawangan tertentu
- **Filter Pakej**: Dropdown untuk memilih jenis pakej tertentu
- **Semua Cawangan/Pakej**: Opsi untuk menampilkan semua data

### 2. UI Components
- **Search Bar**: Tetap berfungsi untuk pencarian teks di halaman utama
- **Filter Controls**: Dropdown filter yang sejajar dengan title "Data Pelanggan" di header tabel
- **Clear Filter Button**: Tombol untuk menghapus semua filter (ikon X)
- **Active Filter Badges**: Badge yang menampilkan filter yang sedang aktif dengan tombol hapus individual
- **Responsive Layout**: Filter controls menyesuaikan dengan ukuran layar (stack di mobile, inline di desktop)

### 3. Informasi Filter
- **Header Table**: Menampilkan jumlah data yang difilter vs total data
- **Real-time Updates**: Filter bekerja secara real-time tanpa perlu refresh

## Implementasi Teknis

### File yang Dimodifikasi
1. `src/routes/Pelanggan/+page.svelte`
   - Menambahkan state untuk filter (selectedBranch, selectedPackage)
   - Menambahkan computed values untuk unique values
   - Mengupdate logika filtering
   - Menambahkan UI components untuk filter

2. `src/lib/components/CustomerDataTable.svelte`
   - Menambahkan prop totalCustomers
   - Menampilkan informasi jumlah data yang difilter

### Logika Filtering
```javascript
// Filter customers dengan multiple criteria
filteredCustomers = allCustomers.filter(customer => {
  const matchesSearch = !searchTerm || 
    customer.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.package_type?.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesBranch = !selectedBranch || customer.branch_name === selectedBranch;
  const matchesPackage = !selectedPackage || customer.package_type === selectedPackage;
  
  return matchesSearch && matchesBranch && matchesPackage;
});
```

## Cara Penggunaan

1. **Filter Cawangan**: Pilih cawangan dari dropdown di header tabel (sejajar dengan title "Data Pelanggan")
2. **Filter Pakej**: Pilih pakej dari dropdown di header tabel
3. **Kombinasi Filter**: Filter dapat dikombinasikan dengan pencarian teks di halaman utama
4. **Hapus Filter**: Klik tombol X di header tabel atau klik X pada badge filter aktif
5. **Responsive**: Di layar kecil, filter controls akan stack vertikal; di layar besar akan inline horizontal

## Keunggulan

- **User-friendly**: Interface yang intuitif dan mudah digunakan
- **Real-time**: Filter bekerja secara real-time tanpa delay
- **Responsive**: Tampilan yang responsif di berbagai ukuran layar
- **Informative**: Menampilkan informasi lengkap tentang hasil filter
- **Flexible**: Dapat dikombinasikan dengan pencarian teks

## Testing

Untuk menguji fitur ini:
1. Buka halaman Pelanggan
2. Coba filter berdasarkan cawangan
3. Coba filter berdasarkan pakej
4. Kombinasikan dengan pencarian teks
5. Verifikasi bahwa jumlah data di header tabel berubah sesuai filter
6. Test tombol clear filter

## Catatan

- Filter bekerja pada data yang sudah dimuat (client-side filtering)
- Data unik untuk dropdown diambil dari data asli (allCustomers) sehingga dropdown options tetap tersedia meskipun filter diterapkan
- Filter dapat dikombinasikan dengan pencarian teks yang sudah ada
- UI menggunakan design system yang konsisten dengan aplikasi
- Dropdown options tidak akan hilang ketika filter diterapkan karena menggunakan data asli yang tidak terpengaruh filter

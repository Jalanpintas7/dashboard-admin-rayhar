# Filter Branch untuk Package Top Sales di Dashboard Branch

## Permintaan User

### **Masalah:**
- Package Top Sales di dashboard branch menampilkan data dari semua branch
- Admin branch tidak bisa melihat package terpopuler di branch mereka
- Perlu filter berdasarkan branch yang login

### **Solusi:**
- Membuat komponen `PackageTopSalesBranch` yang terfilter berdasarkan branch
- Menampilkan top packages hanya untuk branch yang login
- Memungkinkan admin branch melihat package terpopuler di branch mereka

## 🔧 Perubahan yang Diterapkan

### **1. Membuat Komponen Baru:**
- **File**: `src/lib/components/PackageTopSalesBranch.svelte`
- **Pendekatan**: Sama dengan komponen branch lainnya
- **Filter**: Menggunakan `branch_id` untuk filter data

### **2. Implementasi Filter Branch:**

#### **Ambil Branch Info:**
```javascript
// Ambil informasi branch dari user yang login
const { data: userProfile, error: profileError } = await supabase
  .from('admin_role')
  .select('branch_id, branches(name)')
  .eq('user_id', $user.id)
  .single();

userBranch = userProfile.branches.name;
branchId = userProfile.branch_id;
```

#### **Filter Data Packages:**
```javascript
// Query untuk mendapatkan top packages berdasarkan branch
let query = supabase
  .from('bookings')
  .select(`
    umrah_category_id,
    category_id,
    bilangan,
    umrah_categories(name),
    categories(name)
  `)
  .eq('branch_id', branchId); // Filter berdasarkan branch
```

### **3. Update Dashboard Branch:**
- **File**: `src/routes/DashboardBranch/+page.svelte`
- **Perubahan**: Menggunakan `PackageTopSalesBranch` instead of `PackageTopSales`

## 📊 Perbedaan Implementasi

### **Sebelum (SALAH):**
```javascript
// PackageTopSales.svelte
topPackages = await fetchTopPackages(selectedFilter, 5);
// Menggunakan fetchTopPackages yang tidak terfilter
// Menampilkan data dari semua branch
```

### **Sesudah (BENAR):**
```javascript
// PackageTopSalesBranch.svelte
const packages = await getTopPackagesByBranch(branchId, selectedFilter, 5);
// Data sudah terfilter berdasarkan branch yang login
```

## ✅ Fitur yang Dipertahankan

### **1. Filter Dropdown:**
- **keseluruhan** - Semua package (Umrah + Pelancongan)
- **Umrah** - Hanya package Umrah
- **Pelancongan** - Hanya package Pelancongan

### **2. Data Processing:**
- Perhitungan total peserta (booking + bilangan)
- Ranking berdasarkan total peserta
- Grouping berdasarkan package name
- Limit 5 top packages

### **3. UI Components:**
- Loading state dengan spinner
- Error state dengan retry button
- Empty state untuk data kosong
- Responsive design

## 🎯 Hasil Akhir

### **Package Top Sales di Dashboard Branch:**
- ✅ **Data Packages** - Hanya dari branch yang login
- ✅ **Ranking** - Berdasarkan total peserta di branch
- ✅ **Filter Options** - Keseluruhan, Umrah, Pelancongan
- ✅ **Real-time Data** - Update otomatis saat data berubah

### **Contoh Tampilan:**
```
Package Top Peserta - Shah Alam
1. Umrah Premium 2024 - 25 peserta
2. Turkey 8D7N - 18 peserta
3. Umrah Reguler - 15 peserta
4. Japan Cherry Blossom - 12 peserta
5. Umrah VIP - 10 peserta
```

## 🔍 Detail Implementasi

### **1. Branch Detection:**
```javascript
// Deteksi branch saat component mount
onMount(async () => {
  if ($user) {
    const { data: userProfile } = await supabase
      .from('admin_role')
      .select('branch_id, branches(name)')
      .eq('user_id', $user.id)
      .single();
    
    userBranch = userProfile.branches.name;
    branchId = userProfile.branch_id;
    
    await loadTopPackages();
  }
});
```

### **2. Data Filtering:**
```javascript
// Filter berdasarkan branch_id
.eq('branch_id', branchId)

// Apply filter berdasarkan jenis package
if (filter === 'Umrah') {
  query = query.not('umrah_category_id', 'is', null);
} else if (filter === 'Pelancongan') {
  query = query.is('umrah_category_id', null);
}
```

### **3. Package Statistics:**
```javascript
// Group dan hitung total peserta per package
const packageStats = {};

data.forEach(booking => {
  let packageName;
  let packageId;
  
  if (booking.umrah_category_id && booking.umrah_categories) {
    // Umrah package
    packageName = booking.umrah_categories.name;
    packageId = booking.umrah_category_id;
  } else if (booking.category_id && booking.categories) {
    // Pelancongan package
    packageName = booking.categories.name;
    packageId = booking.category_id;
  }

  // Hitung total peserta (1 booking + bilangan)
  const totalPax = 1 + (booking.bilangan || 0);
  packageStats[packageId].totalSales += totalPax;
});
```

## 📋 Status Komponen Dashboard Branch

### **✅ Sudah Terfilter:**
1. **SummaryCardsBranch** - ✅ Data spesifik branch
2. **LeadTableBranch** - ✅ Data spesifik branch  
3. **CustomerTableBranch** - ✅ Data spesifik branch
4. **SalesInquiryOverviewBranch** - ✅ Data spesifik branch
5. **PackageTopSalesBranch** - ✅ Data spesifik branch

### **✅ Sudah Terfilter (via fetchDashboardStats):**
6. **TopSales** - ✅ Filter berdasarkan branch
7. **TopInquiry** - ✅ Filter berdasarkan branch

### **❌ Belum Terfilter:**
8. **PackageTopSales** - ❌ Masih menampilkan semua data (digunakan di dashboard utama)

## 🎯 Keuntungan untuk Admin Branch

### **1. Package Performance:**
- Melihat package terpopuler di branch mereka
- Tracking performa package per kategori
- Analisis trend package yang diminati

### **2. Data Spesifik:**
- Hanya data dari branch yang login
- Tidak ada data dari branch lain
- Fokus pada performa branch sendiri

### **3. Real-time Updates:**
- Data update otomatis
- Tidak perlu refresh manual
- Konsisten dengan data table lainnya

## 📝 File yang Dimodifikasi

### **File Baru:**
- `src/lib/components/PackageTopSalesBranch.svelte`

### **File yang Diupdate:**
- `src/routes/DashboardBranch/+page.svelte`

### **File yang Tidak Diubah:**
- `src/lib/components/PackageTopSales.svelte` (untuk dashboard utama)
- `src/lib/dashboard-data-helpers.js` (untuk dashboard utama)

## ✅ Testing

### **Test Cases:**
1. **Login sebagai admin branch** → PackageTopSales menampilkan data spesifik branch
2. **Login sebagai super admin** → Dashboard utama tetap menampilkan semua data
3. **Data konsisten** → PackageTopSales sama dengan data di tabel lainnya
4. **Performance** → Loading cepat dan tidak ada error

### **Indikator Sukses:**
- ✅ Data di PackageTopSales sesuai dengan branch yang login
- ✅ Tidak ada data dari branch lain yang tercampur
- ✅ Ranking package akurat untuk branch
- ✅ Dashboard utama tidak terpengaruh

Sekarang Package Top Sales di dashboard branch sudah terfilter dengan benar dan admin branch bisa melihat package terpopuler di branch mereka secara spesifik!

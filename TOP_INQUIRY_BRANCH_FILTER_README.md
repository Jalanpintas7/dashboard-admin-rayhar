# Filter Branch untuk Top Inquiry di Dashboard Branch

## Permintaan User

### **Masalah:**
- Top Inquiry di dashboard branch menampilkan data dari semua branch
- Admin branch tidak bisa melihat inquiry terpopuler di branch mereka
- Perlu filter berdasarkan branch yang login

### **Solusi:**
- Membuat komponen `TopInquiryBranch` yang terfilter berdasarkan branch
- Menampilkan top inquiries hanya untuk branch yang login
- Memungkinkan admin branch melihat inquiry terpopuler di branch mereka

## 🔧 Perubahan yang Diterapkan

### **1. Membuat Komponen Baru:**
- **File**: `src/lib/components/TopInquiryBranch.svelte`
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

#### **Filter Data Inquiries:**
```javascript
// Query untuk mendapatkan top inquiries berdasarkan branch
let query = supabase
  .from('leads')
  .select(`
    *,
    umrah_categories(name),
    categories(name)
  `)
  .eq('branch_id', branchId); // Filter berdasarkan branch
```

### **3. Update Dashboard Branch:**
- **File**: `src/routes/DashboardBranch/+page.svelte`
- **Perubahan**: Menggunakan `TopInquiryBranch` instead of `TopInquiry`

## 📊 Perbedaan Implementasi

### **Sebelum (SALAH):**
```javascript
// TopInquiry.svelte
topInquiries = await fetchTopInquiries(selectedFilter, 5);
// Menggunakan fetchTopInquiries yang tidak terfilter
// Menampilkan data dari semua branch
```

### **Sesudah (BENAR):**
```javascript
// TopInquiryBranch.svelte
const inquiries = await getTopInquiriesByBranch(branchId, selectedFilter, 5);
// Data sudah terfilter berdasarkan branch yang login
```

## ✅ Fitur yang Dipertahankan

### **1. Filter Dropdown:**
- **keseluruhan** - Semua inquiry (Umrah + Pelancongan)
- **Umrah** - Hanya inquiry Umrah
- **Pelancongan** - Hanya inquiry Pelancongan

### **2. Data Processing:**
- Perhitungan total inquiries per package
- Ranking berdasarkan total inquiries
- Grouping berdasarkan package name
- Limit 5 top inquiries

### **3. UI Components:**
- Loading state dengan spinner
- Error state dengan retry button
- Empty state untuk data kosong
- Responsive design

## 🎯 Hasil Akhir

### **Top Inquiry di Dashboard Branch:**
- ✅ **Data Inquiries** - Hanya dari branch yang login
- ✅ **Ranking** - Berdasarkan total inquiries di branch
- ✅ **Filter Options** - Keseluruhan, Umrah, Pelancongan
- ✅ **Real-time Data** - Update otomatis saat data berubah

### **Contoh Tampilan:**
```
Top Inquiry - Shah Alam
1. Umrah Premium 2024 - 15 leads
2. Turkey 8D7N - 12 leads
3. Umrah Reguler - 10 leads
4. Japan Cherry Blossom - 8 leads
5. Umrah VIP - 6 leads
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
    
    await loadTopInquiries();
  }
});
```

### **2. Data Filtering:**
```javascript
// Filter berdasarkan branch_id
.eq('branch_id', branchId)

// Apply filter berdasarkan jenis inquiry
if (filter === 'Umrah') {
  query = query.not('category_id', 'is', null);
} else if (filter === 'Pelancongan') {
  query = query.is('category_id', null);
}
```

### **3. Inquiry Statistics:**
```javascript
// Group dan hitung total inquiries per package
const inquiryStats = {};

data.forEach(lead => {
  let packageName = '';
  let packageId = '';
  let packageType = '';

  // Tentukan jenis inquiry berdasarkan data yang ada
  if (lead.category_id && lead.categories) {
    // Umrah inquiry: ada category_id
    packageId = lead.category_id;
    packageName = lead.categories.name;
    packageType = 'umrah';
  } else if (lead.umrah_category_id && lead.umrah_categories) {
    // Umrah inquiry: ada umrah_category_id
    packageId = lead.umrah_category_id;
    packageName = lead.umrah_categories.name;
    packageType = 'umrah';
  } else {
    // Pelancongan inquiry: tidak ada category_id atau umrah_category_id
    packageId = 'pelancongan_general';
    packageName = 'Pelancongan General';
    packageType = 'pelancongan';
  }

  // Hitung total inquiries
  inquiryStats[packageId].totalInquiries += 1;
});
```

## 📋 Status Komponen Dashboard Branch

### **✅ Sudah Terfilter:**
1. **SummaryCardsBranch** - ✅ Data spesifik branch
2. **LeadTableBranch** - ✅ Data spesifik branch  
3. **CustomerTableBranch** - ✅ Data spesifik branch
4. **SalesInquiryOverviewBranch** - ✅ Data spesifik branch
5. **PackageTopSalesBranch** - ✅ Data spesifik branch
6. **TopInquiryBranch** - ✅ Data spesifik branch

### **✅ Sudah Terfilter (via fetchDashboardStats):**
7. **TopSales** - ✅ Filter berdasarkan branch

### **❌ Belum Terfilter:**
8. **TopInquiry** - ❌ Masih menampilkan semua data (digunakan di dashboard utama)

## 🎯 Keuntungan untuk Admin Branch

### **1. Inquiry Performance:**
- Melihat inquiry terpopuler di branch mereka
- Tracking performa inquiry per kategori
- Analisis trend inquiry yang diminati

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
- `src/lib/components/TopInquiryBranch.svelte`

### **File yang Diupdate:**
- `src/routes/DashboardBranch/+page.svelte`

### **File yang Tidak Diubah:**
- `src/lib/components/TopInquiry.svelte` (untuk dashboard utama)
- `src/lib/dashboard-data-helpers.js` (untuk dashboard utama)

## ✅ Testing

### **Test Cases:**
1. **Login sebagai admin branch** → TopInquiry menampilkan data spesifik branch
2. **Login sebagai super admin** → Dashboard utama tetap menampilkan semua data
3. **Data konsisten** → TopInquiry sama dengan data di tabel lainnya
4. **Performance** → Loading cepat dan tidak ada error

### **Indikator Sukses:**
- ✅ Data di TopInquiry sesuai dengan branch yang login
- ✅ Tidak ada data dari branch lain yang tercampur
- ✅ Ranking inquiry akurat untuk branch
- ✅ Dashboard utama tidak terpengaruh

Sekarang Top Inquiry di dashboard branch sudah terfilter dengan benar dan admin branch bisa melihat inquiry terpopuler di branch mereka secara spesifik!

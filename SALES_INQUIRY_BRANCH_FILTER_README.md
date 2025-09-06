# Filter Branch untuk Sales & Inquiry Overview di Dashboard Branch

## Permintaan User

### **Masalah:**
- Sales & Inquiry Overview di dashboard branch menampilkan data dari semua branch
- Admin branch tidak bisa memantau penghasilan branch mereka sendiri
- Perlu filter berdasarkan branch yang login

### **Solusi:**
- Membuat komponen `SalesInquiryOverviewBranch` yang terfilter berdasarkan branch
- Menampilkan data sales dan inquiry hanya untuk branch yang login
- Memungkinkan admin branch memantau penghasilan branch mereka

## 🔧 Perubahan yang Diterapkan

### **1. Membuat Komponen Baru:**
- **File**: `src/lib/components/SalesInquiryOverviewBranch.svelte`
- **Pendekatan**: Sama dengan komponen branch lainnya (LeadTableBranch, CustomerTableBranch)
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

#### **Filter Data Sales:**
```javascript
// Query untuk data bookings dengan filter branch
const result = await supabase
  .from('bookings')
  .select('created_at, umrah_category_id, total_price, bilangan, branches(name)')
  .eq('branch_id', branchId)  // Filter berdasarkan branch
  .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
```

#### **Filter Data Inquiry:**
```javascript
// Query untuk data leads dengan filter branch
const result = await supabase
  .from('leads')
  .select('created_at, category_id, branches(name)')
  .eq('branch_id', branchId)  // Filter berdasarkan branch
  .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
```

### **3. Update Dashboard Branch:**
- **File**: `src/routes/DashboardBranch/+page.svelte`
- **Perubahan**: Menggunakan `SalesInquiryOverviewBranch` instead of `SalesInquiryOverview`

## 📊 Perbedaan Implementasi

### **Sebelum (SALAH):**
```javascript
// SalesInquiryOverview.svelte
const dailyStats = await fetchSalesInquiryData(selectedFilter);
// Menggunakan fetchSalesInquiryData yang tidak terfilter
// Menampilkan data dari semua branch
```

### **Sesudah (BENAR):**
```javascript
// SalesInquiryOverviewBranch.svelte
const result = await supabase
  .from('bookings')
  .select('...')
  .eq('branch_id', branchId)  // Filter berdasarkan branch
  .gte('created_at', ...);
// Data sudah terfilter berdasarkan branch yang login
```

## ✅ Fitur yang Dipertahankan

### **1. Filter Dropdown:**
- **Total Sales** - Menampilkan data bookings dengan revenue
- **Total Inquiry** - Menampilkan data leads tanpa revenue

### **2. Chart Visualization:**
- Diagram batang untuk 3 hari terakhir
- Persentase Pelancongan vs Umrah
- Revenue display untuk Total Sales
- Jumlah pax untuk setiap kategori

### **3. Data Processing:**
- Perhitungan total peserta (booking + bilangan)
- Perhitungan revenue per kategori
- Persentase berdasarkan total count
- Format currency Malaysia (RM)

## 🎯 Hasil Akhir

### **Sales & Inquiry Overview di Dashboard Branch:**
- ✅ **Data Sales** - Hanya dari branch yang login
- ✅ **Data Inquiry** - Hanya dari branch yang login
- ✅ **Revenue Tracking** - Penghasilan spesifik branch
- ✅ **Real-time Data** - Update otomatis saat data berubah

### **Contoh Tampilan:**
```
Sales & Inquiry Overview - Shah Alam
Total Sales: RM 15,000 (3 hari terakhir)
- Pelancongan: 60% (12 pax)
- Umrah: 40% (8 pax)
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
    
    await fetchData();
  }
});
```

### **2. Data Filtering:**
```javascript
// Filter berdasarkan branch_id
.eq('branch_id', branchId)
```

### **3. Revenue Calculation:**
```javascript
// Hitung total revenue untuk branch
totalRevenue = data.reduce((sum, item) => {
  return sum + (item.total_price || 0);
}, 0);
```

## 📋 Status Komponen Dashboard Branch

### **✅ Sudah Terfilter:**
1. **SummaryCardsBranch** - ✅ Data spesifik branch
2. **LeadTableBranch** - ✅ Data spesifik branch  
3. **CustomerTableBranch** - ✅ Data spesifik branch
4. **SalesInquiryOverviewBranch** - ✅ Data spesifik branch

### **✅ Sudah Terfilter (via fetchDashboardStats):**
5. **TopSales** - ✅ Filter berdasarkan branch
6. **PackageTopSales** - ✅ Filter berdasarkan branch
7. **TopInquiry** - ✅ Filter berdasarkan branch

### **❌ Belum Terfilter:**
8. **SalesInquiryOverview** - ❌ Masih menampilkan semua data (digunakan di dashboard utama)

## 🎯 Keuntungan untuk Admin Branch

### **1. Monitoring Penghasilan:**
- Melihat revenue harian dari branch mereka
- Tracking performa sales vs inquiry
- Analisis trend 3 hari terakhir

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
- `src/lib/components/SalesInquiryOverviewBranch.svelte`

### **File yang Diupdate:**
- `src/routes/DashboardBranch/+page.svelte`

### **File yang Tidak Diubah:**
- `src/lib/components/SalesInquiryOverview.svelte` (untuk dashboard utama)
- `src/lib/dashboard-data-helpers.js` (untuk dashboard utama)

## ✅ Testing

### **Test Cases:**
1. **Login sebagai admin branch** → SalesInquiryOverview menampilkan data spesifik branch
2. **Login sebagai super admin** → Dashboard utama tetap menampilkan semua data
3. **Data konsisten** → SalesInquiryOverview sama dengan data di tabel lainnya
4. **Performance** → Loading cepat dan tidak ada error

### **Indikator Sukses:**
- ✅ Data di SalesInquiryOverview sesuai dengan branch yang login
- ✅ Tidak ada data dari branch lain yang tercampur
- ✅ Revenue tracking akurat untuk branch
- ✅ Dashboard utama tidak terpengaruh

Sekarang Sales & Inquiry Overview di dashboard branch sudah terfilter dengan benar dan admin branch bisa memantau penghasilan branch mereka secara spesifik!

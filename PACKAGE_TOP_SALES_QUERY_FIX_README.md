# Perbaikan Query Package Top Sales Branch

## Masalah yang Ditemukan

### **Error: "Tidak ada data package peserta untuk ditampilkan"**
- Query tidak mengambil data dengan benar dari Supabase
- Struktur join table tidak sesuai dengan database
- Filter tidak bekerja dengan benar

### **Root Cause:**
1. **Query Structure** - Menggunakan join yang salah (`umrah_categories`, `categories`)
2. **Field Mapping** - Tidak sesuai dengan struktur database yang sebenarnya
3. **Filter Logic** - Filter tidak menggunakan field yang benar

## 🔧 Perbaikan yang Diterapkan

### **1. Perbaikan Query Structure:**

#### **Sebelum (SALAH):**
```javascript
let query = supabase
  .from('bookings')
  .select(`
    umrah_category_id,
    category_id,
    bilangan,
    umrah_categories(name),
    categories(name)
  `)
  .eq('branch_id', branchId);
```

#### **Sesudah (BENAR):**
```javascript
let query = supabase
  .from('bookings')
  .select(`
    *,
    umrah_seasons(name),
    destinations(name),
    umrah_categories(name)
  `)
  .eq('branch_id', branchId);
```

### **2. Perbaikan Filter Logic:**

#### **Sebelum (SALAH):**
```javascript
if (filter === 'Umrah') {
  query = query.not('umrah_category_id', 'is', null);
} else if (filter === 'Pelancongan') {
  query = query.is('umrah_category_id', null);
}
```

#### **Sesudah (BENAR):**
```javascript
if (filter === 'Umrah') {
  query = query.or('umrah_season_id.not.is.null,umrah_category_id.not.is.null');
} else if (filter === 'Pelancongan') {
  query = query.or('destination_id.not.is.null,outbound_date_id.not.is.null');
}
```

### **3. Perbaikan Data Processing:**

#### **Sebelum (SALAH):**
```javascript
if (booking.umrah_category_id && booking.umrah_categories) {
  // Umrah package
  packageName = booking.umrah_categories.name;
  packageId = booking.umrah_category_id;
} else if (booking.category_id && booking.categories) {
  // Pelancongan package
  packageName = booking.categories.name;
  packageId = booking.category_id;
}
```

#### **Sesudah (BENAR):**
```javascript
if (booking.umrah_season_id || booking.umrah_category_id) {
  // Umrah: ada umrah_season_id atau umrah_category_id
  packageId = booking.umrah_season_id || booking.umrah_category_id;
  packageName = booking.umrah_seasons?.name || booking.umrah_categories?.name || 'Umrah Package';
  packageType = 'umrah';
} else if (booking.destination_id || booking.outbound_date_id) {
  // Outbound: ada destination_id atau outbound_date_id
  packageId = booking.destination_id || booking.outbound_date_id;
  packageName = booking.destinations?.name || 'Tour Package';
  packageType = 'outbound';
}
```

## 🔍 Debugging yang Ditambahkan

### **Console Logging:**
```javascript
console.log(`🔍 Fetching packages for branch ${branchId} with filter: ${filter}`);
console.log(`📊 Raw data from Supabase:`, data);
console.log(`📈 Package stats:`, packageStats);
console.log(`🏆 Final sorted packages:`, sortedPackages);
```

### **Error Handling:**
```javascript
if (error) {
  console.error('Supabase query error:', error);
  throw error;
}
```

## 📊 Struktur Database yang Benar

### **Tabel Bookings:**
- `umrah_season_id` - ID untuk umrah seasons
- `umrah_category_id` - ID untuk umrah categories
- `destination_id` - ID untuk destinations
- `outbound_date_id` - ID untuk outbound dates
- `bilangan` - Jumlah peserta tambahan
- `branch_id` - ID branch

### **Join Tables:**
- `umrah_seasons(name)` - Nama umrah season
- `umrah_categories(name)` - Nama umrah category
- `destinations(name)` - Nama destination

## ✅ Hasil Akhir

### **Query yang Benar:**
1. **Mengambil semua field** dari tabel bookings
2. **Join dengan tabel yang benar** (umrah_seasons, destinations, umrah_categories)
3. **Filter berdasarkan branch_id** yang benar
4. **Filter berdasarkan jenis package** yang sesuai

### **Data Processing yang Benar:**
1. **Deteksi jenis package** berdasarkan field yang ada
2. **Grouping berdasarkan package ID** yang benar
3. **Perhitungan total peserta** (1 booking + bilangan)
4. **Sorting berdasarkan total sales**

### **Debugging yang Lengkap:**
1. **Console logs** untuk setiap step
2. **Error handling** yang proper
3. **Data validation** sebelum processing

## 🎯 Testing

### **Test Cases:**
1. **Branch dengan data Umrah** → Menampilkan package Umrah
2. **Branch dengan data Pelancongan** → Menampilkan package Pelancongan
3. **Branch dengan data campuran** → Menampilkan semua package
4. **Branch tanpa data** → Menampilkan "Tidak ada data"

### **Indikator Sukses:**
- ✅ Data berhasil diambil dari Supabase
- ✅ Package ter-group dengan benar
- ✅ Total peserta dihitung dengan benar
- ✅ Ranking berfungsi dengan baik
- ✅ Filter bekerja sesuai jenis package

Sekarang Package Top Sales Branch sudah bisa mengambil data dengan benar dari Supabase!

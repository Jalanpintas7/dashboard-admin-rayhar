# Perbaikan Query Top Inquiry Branch

## Masalah yang Ditemukan

### **Error: "Tidak ada data inquiry untuk ditampilkan"**
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
  .from('leads')
  .select(`
    *,
    umrah_categories(name),
    categories(name)
  `)
  .eq('branch_id', branchId);
```

#### **Sesudah (BENAR):**
```javascript
let query = supabase
  .from('leads')
  .select(`
    *,
    umrah_seasons(name),
    destinations(name)
  `)
  .eq('branch_id', branchId);
```

### **2. Perbaikan Filter Logic:**

#### **Sebelum (SALAH):**
```javascript
if (filter === 'Umrah') {
  query = query.not('category_id', 'is', null);
} else if (filter === 'Pelancongan') {
  query = query.is('category_id', null);
}
```

#### **Sesudah (BENAR):**
```javascript
if (filter === 'Umrah') {
  query = query.not('season_id', 'is', null);
} else if (filter === 'Pelancongan') {
  query = query.not('destination_id', 'is', null).not('outbound_date_id', 'is', null);
}
```

### **3. Perbaikan Data Processing:**

#### **Sebelum (SALAH):**
```javascript
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
```

#### **Sesudah (BENAR):**
```javascript
if (lead.season_id) {
  // Umrah: ada season_id - grouping berdasarkan season_id saja
  packageId = `season_${lead.season_id}`;
  packageName = lead.umrah_seasons?.name || 'Umrah Package';
  packageType = 'umrah';
} else if (lead.destination_id && lead.outbound_date_id) {
  // Pelancongan: ada destination_id dan outbound_date_id - grouping berdasarkan kombinasi keduanya
  packageId = `${lead.destination_id}_${lead.outbound_date_id}`;
  packageName = lead.destinations?.name || 'Tour Package';
  packageType = 'outbound';
}
```

## 🔍 Debugging yang Ditambahkan

### **Console Logging:**
```javascript
console.log(`🔍 Fetching inquiries for branch ${branchId} with filter: ${filter}`);
console.log(`📊 Raw inquiry data from Supabase:`, data);
console.log(`📈 Inquiry stats:`, inquiryStats);
console.log(`🏆 Final sorted inquiries:`, sortedInquiries);
```

### **Error Handling:**
```javascript
if (error) {
  console.error('Supabase query error:', error);
  throw error;
}
```

## 📊 Struktur Database yang Benar

### **Tabel Leads:**
- `season_id` - ID untuk umrah seasons
- `destination_id` - ID untuk destinations
- `outbound_date_id` - ID untuk outbound dates
- `branch_id` - ID branch

### **Join Tables:**
- `umrah_seasons(name)` - Nama umrah season
- `destinations(name)` - Nama destination

## ✅ Hasil Akhir

### **Query yang Benar:**
1. **Mengambil semua field** dari tabel leads
2. **Join dengan tabel yang benar** (umrah_seasons, destinations)
3. **Filter berdasarkan branch_id** yang benar
4. **Filter berdasarkan jenis inquiry** yang sesuai

### **Data Processing yang Benar:**
1. **Deteksi jenis inquiry** berdasarkan field yang ada
2. **Grouping berdasarkan package ID** yang benar
3. **Perhitungan total inquiries** per package
4. **Sorting berdasarkan total inquiries**

### **Debugging yang Lengkap:**
1. **Console logs** untuk setiap step
2. **Error handling** yang proper
3. **Data validation** sebelum processing

## 🎯 Testing

### **Test Cases:**
1. **Branch dengan data Umrah** → Menampilkan inquiry Umrah
2. **Branch dengan data Pelancongan** → Menampilkan inquiry Pelancongan
3. **Branch dengan data campuran** → Menampilkan semua inquiry
4. **Branch tanpa data** → Menampilkan "Tidak ada data"

### **Indikator Sukses:**
- ✅ Data berhasil diambil dari Supabase
- ✅ Inquiry ter-group dengan benar
- ✅ Total inquiries dihitung dengan benar
- ✅ Ranking berfungsi dengan baik
- ✅ Filter bekerja sesuai jenis inquiry

Sekarang Top Inquiry Branch sudah bisa mengambil data dengan benar dari Supabase!

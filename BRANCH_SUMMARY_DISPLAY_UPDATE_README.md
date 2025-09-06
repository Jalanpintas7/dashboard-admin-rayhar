# Update Tampilan Summary di Data Table Pelanggan Branch

## Permintaan User

### **Format Lama:**
```
Total Bookings Shah Alam
12
```

### **Format Baru:**
```
Total Booking Shah Alam
12 Pendaftar Total 24 Pax
```

## 🔧 Perubahan yang Diterapkan

### **1. Menambahkan Perhitungan Total Pax:**

#### **Computed Value untuk Total Pax:**
```javascript
// Computed value untuk total pax
$: totalPax = branchData.reduce((total, customer) => {
  if (customer.price && customer.price !== '-') {
    const paxCount = parseInt(customer.price.split(' ')[0]) || 0;
    return total + paxCount;
  }
  return total;
}, 0);
```

#### **Cara Kerja:**
- Mengiterasi semua data pelanggan di branch
- Mengekstrak jumlah pax dari field `price` (format: "X pax")
- Menjumlahkan semua pax untuk mendapatkan total

### **2. Update Tampilan Summary:**

#### **Sebelum:**
```html
<div>
  <h5 class="text-sm font-medium text-[rgb(148,35,146)]">Total Bookings {branchName}</h5>
  <p class="text-2xl font-bold text-[rgb(148,35,146)]">{branchData.length}</p>
</div>
```

#### **Sesudah:**
```html
<div>
  <h5 class="text-sm font-medium text-[rgb(148,35,146)]">Total Booking {branchName}</h5>
  <p class="text-2xl font-bold text-[rgb(148,35,146)]">
    {branchData.length} Pendaftar Total {totalPax} Pax
  </p>
</div>
```

## 📊 Hasil Akhir

### **Tampilan Summary:**
- **Judul**: "Total Booking {branchName}" (menggunakan singular "Booking")
- **Info**: "{jumlah_pendaftar} Pendaftar Total {total_pax} Pax"
- **Warna**: Tetap menggunakan warna ungu khas aplikasi

### **Contoh Tampilan:**
```
Total Booking Shah Alam
12 Pendaftar Total 24 Pax
```

## 🔍 Detail Implementasi

### **1. Perhitungan Total Pax:**
```javascript
$: totalPax = branchData.reduce((total, customer) => {
  if (customer.price && customer.price !== '-') {
    // Ekstrak angka dari string "X pax"
    const paxCount = parseInt(customer.price.split(' ')[0]) || 0;
    return total + paxCount;
  }
  return total;
}, 0);
```

### **2. Validasi Data:**
- Memeriksa apakah `customer.price` ada dan bukan '-'
- Menggunakan `parseInt()` untuk mengekstrak angka
- Fallback ke 0 jika parsing gagal
- Menggunakan `|| 0` untuk menangani NaN

### **3. Format Display:**
- Menggabungkan jumlah pendaftar dan total pax dalam satu baris
- Menggunakan template literal untuk formatting
- Mempertahankan styling yang konsisten

## ✅ Keuntungan Perubahan

### **1. Informasi Lebih Lengkap:**
- Menampilkan jumlah pendaftar (bookings)
- Menampilkan total pax (peserta)
- Memberikan gambaran yang lebih komprehensif

### **2. Konsistensi dengan Data:**
- Menggunakan data yang sama dengan tabel
- Perhitungan real-time berdasarkan data aktual
- Tidak ada hardcoded values

### **3. User Experience:**
- Informasi yang lebih jelas dan informatif
- Format yang mudah dibaca
- Konsisten dengan desain aplikasi

## 📋 File yang Dimodifikasi

### **File:**
- `src/lib/components/DynamicBranchDataDisplay.svelte`

### **Perubahan:**
1. **Menambahkan computed value `totalPax`** untuk menghitung total pax
2. **Mengupdate tampilan summary** dengan format baru
3. **Mengubah "Bookings" menjadi "Booking"** (singular)

## 🎯 Testing

### **Test Cases:**
1. **Data Normal** → Menampilkan jumlah pendaftar dan total pax yang benar
2. **Data Kosong** → Menampilkan "0 Pendaftar Total 0 Pax"
3. **Data dengan Price '-'** → Mengabaikan data yang tidak valid
4. **Data dengan Price Invalid** → Fallback ke 0 untuk parsing yang gagal

### **Indikator Sukses:**
- ✅ Tampilan summary sesuai dengan format yang diminta
- ✅ Perhitungan total pax akurat
- ✅ Tidak ada error atau bug
- ✅ Styling konsisten dengan desain aplikasi

## 📝 Contoh Output

### **Branch Shah Alam dengan 12 pendaftar:**
```
Total Booking Shah Alam
12 Pendaftar Total 24 Pax
```

### **Branch Kuala Lumpur dengan 8 pendaftar:**
```
Total Booking Kuala Lumpur
8 Pendaftar Total 16 Pax
```

### **Branch tanpa data:**
```
Total Booking Johor Bahru
0 Pendaftar Total 0 Pax
```

Sekarang tampilan summary di data table pelanggan branch sudah menampilkan informasi yang lebih lengkap dan sesuai dengan format yang diminta!

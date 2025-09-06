# Perbaikan Perhitungan Jumlah Pax di Dashboard Branch

## Masalah yang Ditemukan

### **Perhitungan Pax yang Salah:**
- **Sebelum**: Menampilkan `bilangan` langsung dari database
- **Sesudah**: Menampilkan `bilangan + 1` (pemesan utama + tambahan)

### **Penjelasan:**
- Field `bilangan` di tabel `bookings` menyimpan **jumlah tambahan** peserta
- **Pemesan utama** tidak dihitung dalam field `bilangan`
- **Total pax** = 1 (pemesan) + bilangan (tambahan)

## 🔧 Perbaikan yang Diterapkan

### **File yang Dimodifikasi:**
- `src/lib/components/DynamicBranchDataDisplay.svelte`

### **Perubahan Kode:**
```javascript
// SEBELUM (SALAH):
price: booking.bilangan ? `${booking.bilangan} pax` : '-',

// SESUDAH (BENAR):
price: booking.bilangan ? `${(booking.bilangan || 0) + 1} pax` : '1 pax',
```

## 📊 Contoh Perhitungan

### **Data di Database:**
```sql
-- Tabel bookings
id | nama           | bilangan | total_price
1  | Ahmad bin Ali  | 2        | 15000
2  | Siti Aminah    | 0        | 5000
3  | Mohd Zulkifli  | 3        | 20000
```

### **Tampilan Sebelum (SALAH):**
```
Ahmad bin Ali  : 2 pax  (RM 15,000) → RM 7,500/pax
Siti Aminah    : -      (RM 5,000)  → Error
Mohd Zulkifli  : 3 pax  (RM 20,000) → RM 6,667/pax
```

### **Tampilan Sesudah (BENAR):**
```
Ahmad bin Ali  : 3 pax  (RM 15,000) → RM 5,000/pax
Siti Aminah    : 1 pax  (RM 5,000)  → RM 5,000/pax
Mohd Zulkifli  : 4 pax  (RM 20,000) → RM 5,000/pax
```

## ✅ Konsistensi dengan Sistem Lain

### **Formula yang Digunakan di Seluruh Aplikasi:**
```javascript
// Di supabase-helpers.js
const totalParticipants = (totalBookingRecords || 0) + 
  bookings.reduce((sum, booking) => sum + (booking.bilangan || 0), 0)

// Di SalesInquiryOverview.svelte
pelanconganCount = pelanconganData.length + 
  pelanconganData.reduce((sum, item) => sum + (item.bilangan || 0), 0)
```

### **Penjelasan Formula:**
- `totalBookingRecords` = jumlah booking (setiap booking = 1 pemesan)
- `sum(bilangan)` = jumlah tambahan peserta
- **Total = Pemesan + Tambahan**

## 🎯 Dampak Perbaikan

### **1. Akurasi Data:**
- ✅ Jumlah pax yang ditampilkan sesuai dengan kenyataan
- ✅ Perhitungan harga per pax menjadi benar
- ✅ Konsisten dengan perhitungan di dashboard lain

### **2. User Experience:**
- ✅ Admin branch melihat informasi yang akurat
- ✅ Tidak ada kebingungan tentang jumlah peserta
- ✅ Perhitungan harga yang masuk akal

### **3. Business Logic:**
- ✅ Sesuai dengan logika bisnis yang benar
- ✅ Konsisten dengan sistem booking yang ada
- ✅ Memudahkan analisis data

## 📋 Testing

### **Test Cases:**
1. **Booking dengan 0 tambahan** → Tampil "1 pax"
2. **Booking dengan 2 tambahan** → Tampil "3 pax" 
3. **Booking dengan 5 tambahan** → Tampil "6 pax"
4. **Harga per pax** → Dihitung dengan benar berdasarkan total pax

### **Data yang Diharapkan:**
```
Bilangan = 0  → Tampil "1 pax"
Bilangan = 1  → Tampil "2 pax"  
Bilangan = 2  → Tampil "3 pax"
Bilangan = 3  → Tampil "4 pax"
```

## 🔍 Verifikasi

### **Cara Memverifikasi:**
1. Buka dashboard branch
2. Lihat data customer/booking
3. Klik untuk melihat detail
4. Periksa jumlah pax di modal detail
5. Pastikan perhitungan harga per pax benar

### **Indikator Sukses:**
- ✅ Jumlah pax = bilangan + 1
- ✅ Harga per pax = total_price / jumlah_pax
- ✅ Konsisten dengan data di database
- ✅ Tidak ada error dalam perhitungan

## 📝 Catatan Penting

### **Field Database:**
- `bookings.bilangan` = Jumlah tambahan peserta (bukan total)
- `bookings.total_price` = Total harga untuk semua peserta
- **Total pax** = 1 + bilangan

### **UI Display:**
- Tabel: Menampilkan total pax yang benar
- Modal: Menampilkan total pax + harga per pax
- Konsisten di seluruh aplikasi

Perbaikan ini memastikan bahwa perhitungan jumlah pax di dashboard branch sesuai dengan logika bisnis yang benar dan konsisten dengan sistem lainnya.

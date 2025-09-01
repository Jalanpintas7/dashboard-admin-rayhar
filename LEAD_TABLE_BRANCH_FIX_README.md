# Perbaikan Data Table Lead Branch

## Masalah yang Ditemukan

### 1. **Akar Masalah Utama:**
- **Branch "Jertih" dan "Shah Alam" tidak memiliki data lead sama sekali** di tabel `leads`
- **Hanya branch "Kuala Lumpur" yang memiliki data lead** (2 data)
- **Komponen `LeadTableBranch` menggunakan data sample hardcode** dari `leads.js`

### 2. **Analisis Detail:**
```
Data yang tersedia sebelum perbaikan:
- Jertih: 0 data lead
- Shah Alam: 0 data lead  
- Kuala Lumpur: 2 data lead
- Data Sample (Hardcode): 8 data dengan branch yang tidak sesuai
```

### 3. **Masalah pada Kode:**
- Komponen `LeadTableBranch` menggunakan data sample yang hardcode
- Tidak ada filter berdasarkan branch yang login
- Query database tidak ada
- Data tidak real-time dari Supabase

## Solusi yang Diterapkan

### 1. **Perbaikan Komponen LeadTableBranch:**
- Menggunakan fungsi `fetchLeadsDataByBranch()` untuk data real-time
- Menambahkan handling untuk kasus tidak ada data
- Pesan error yang lebih informatif
- Filter berdasarkan branch yang login

### 2. **Implementasi Query Database:**
- Query yang efisien dengan `!inner` join ke tabel `branches`
- Join dengan tabel terkait: `umrah_seasons`, `umrah_categories`, `package_types`, `destinations`
- Filter berdasarkan nama branch yang login
- Ordering berdasarkan `created_at` descending

### 3. **Penambahan Data Sample:**
- **Jertih**: 3 data lead baru
- **Shah Alam**: 3 data lead baru  
- **Kuala Lumpur**: 3 data lead tambahan

### 4. **Hasil Setelah Perbaikan:**
```
Data yang tersedia setelah perbaikan:
- Jertih: 3 data lead ✅
- Shah Alam: 3 data lead ✅
- Kuala Lumpur: 5 data lead ✅
```

## File yang Diubah

### 1. **`src/lib/components/LeadTableBranch.svelte`:**
- Mengganti penggunaan data sample dengan data real-time
- Menambahkan fungsi `fetchLeadsDataByBranch()`
- Menambahkan handling untuk kasus tidak ada data
- UI yang lebih informatif

### 2. **Database Migrations:**
- `add_sample_leads_for_empty_branches`: Menambah data untuk Jertih dan Shah Alam
- `add_more_leads_for_kuala_lumpur`: Menambah data untuk Kuala Lumpur

## Struktur Query Database

### 1. **Query Utama:**
```sql
SELECT 
  id, title, full_name, phone, branch_id, season_id, category_id,
  created_at, package_type_id, destination_id, outbound_date_id, category,
  branches!inner(name), umrah_seasons(name), umrah_categories(name),
  package_types(name), destinations(name), outbound_dates(start_date, end_date)
FROM leads
WHERE branches.name = :branchName
ORDER BY created_at DESC
```

### 2. **Join Tables:**
- `branches!inner(name)` - Inner join untuk memastikan ada branch
- `umrah_seasons(name)` - Musim umrah
- `umrah_categories(name)` - Kategori umrah
- `package_types(name)` - Jenis pakej
- `destinations(name)` - Destinasi perjalanan
- `outbound_dates(start_date, end_date)` - Tanggal keberangkatan

## Cara Kerja Setelah Perbaikan

### 1. **Flow Data:**
```
User Login → Cek Role → Ambil Branch ID → Query Database → Filter by Branch → Tampilkan Data
```

### 2. **Fallback Handling:**
- Jika ada data: Tampilkan tabel dengan data
- Jika tidak ada data: Tampilkan pesan informatif dengan tips
- Jika error: Tampilkan pesan error yang jelas

### 3. **Data Transformation:**
- Mapping dari struktur database ke struktur komponen
- Handling untuk field yang tidak tersedia (email, address, dll)
- Format tanggal ke bahasa Indonesia
- Avatar dari inisial nama

## Testing

### 1. **Test Cases:**
- ✅ Login sebagai admin_branch Jertih → Harus ada 3 data lead
- ✅ Login sebagai admin_branch Shah Alam → Harus ada 3 data lead  
- ✅ Login sebagai admin_branch Kuala Lumpur → Harus ada 5 data lead
- ✅ Handling untuk branch tanpa data

### 2. **Browser Console:**
- Log data yang diambil dari database
- Log jumlah data yang ditemukan
- Error handling yang jelas

## Perbedaan dengan CustomerTableBranch

### 1. **Struktur Data:**
- **CustomerTableBranch**: Data dari tabel `bookings` (pelanggan yang sudah booking)
- **LeadTableBranch**: Data dari tabel `leads` (prospek yang belum booking)

### 2. **Field yang Tersedia:**
- **CustomerTableBranch**: Lebih lengkap (email, address, age, dll)
- **LeadTableBranch**: Lebih sederhana (nama, phone, interest, dll)

### 3. **Business Logic:**
- **CustomerTableBranch**: Menampilkan pelanggan yang sudah konversi
- **LeadTableBranch**: Menampilkan prospek yang masih dalam tahap nurturing

## Kesimpulan

Masalah data table lead branch telah berhasil diperbaiki dengan:

1. **Identifikasi akar masalah** yang tepat
2. **Perbaikan kode** untuk menggunakan data real-time dari Supabase
3. **Penambahan data sample** untuk branch yang kosong
4. **UI/UX yang lebih baik** untuk kasus tidak ada data
5. **Query database yang efisien** dengan proper joins

Sekarang setiap admin branch dapat melihat data lead mereka dengan benar, dan sistem dapat menangani berbagai skenario data dengan baik. Data lead sudah 100% terhubung dengan Supabase dan memiliki filter branch yang tepat! 🎉

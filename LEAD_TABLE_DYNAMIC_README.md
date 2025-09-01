# LEAD TABLE DYNAMIC SUPABASE INTEGRATION

## Overview
Komponen `LeadTable.svelte` telah berhasil diubah dari data statis menjadi data dinamis yang diambil langsung dari Supabase database dengan fitur paginasi yang lengkap.

## Perubahan yang Dibuat

### 1. LeadTable.svelte
- **Sebelum**: Menggunakan data sample statis dari `src/lib/data/leads.js`
- **Sesudah**: Menggunakan data real-time dari tabel `leads` di Supabase

### 2. Fungsi Utama
- `fetchAllLeadsData()`: Mengambil semua data lead dari Supabase
- Query dengan join ke tabel terkait:
  - `branches` - untuk nama cabang
  - `umrah_seasons` - untuk musim umrah
  - `umrah_categories` - untuk kategori umrah
  - `package_types` - untuk jenis paket
  - `destinations` - untuk destinasi
  - `outbound_dates` - untuk tanggal perjalanan

### 3. Fitur Baru
- ✅ **Data Dinamis**: Data langsung dari Supabase
- 🔍 **Search Real-time**: Pencarian berdasarkan data Supabase
- 📊 **Detail Modal**: Menampilkan informasi lengkap lead
- 📄 **Pagination Lengkap**: Navigasi halaman dengan 10 item per halaman
- 🔄 **Auto-reset Page**: Halaman otomatis reset ke 1 saat search

## Fitur Paginasi

### State Pagination
- `currentPage`: Halaman saat ini
- `itemsPerPage`: Jumlah item per halaman (10)
- `totalPages`: Total halaman berdasarkan data yang difilter
- `startIndex` & `endIndex`: Indeks untuk slice data

### Fungsi Pagination
- `nextPage()`: Pindah ke halaman berikutnya
- `prevPage()`: Pindah ke halaman sebelumnya
- `goToPage(page)`: Pindah ke halaman tertentu
- `getPageNumbers()`: Generate nomor halaman dengan ellipsis

### UI Pagination
- Tombol Previous/Next dengan icon ChevronLeft/ChevronRight
- Nomor halaman yang bisa diklik
- Ellipsis (...) untuk halaman yang banyak
- Informasi "Menampilkan X - Y dari Z data"
- Auto-hide pagination jika hanya 1 halaman

## Struktur Database

### Tabel Leads
```sql
leads (
  id, title, full_name, phone, branch_id, season_id, 
  category_id, created_at, package_type_id, destination_id, 
  outbound_date_id, category, sales_consultant_id
)
```

### Relasi Tabel
- `leads.branch_id` → `branches.id`
- `leads.season_id` → `umrah_seasons.id`
- `leads.category_id` → `umrah_categories.id`
- `leads.package_type_id` → `package_types.id`
- `leads.destination_id` → `destinations.id`
- `leads.outbound_date_id` → `outbound_dates.id`

## Query Supabase

```javascript
const { data, error } = await supabase
  .from('leads')
  .select(`
    id, title, full_name, phone, branch_id, season_id,
    category_id, created_at, package_type_id, destination_id,
    outbound_date_id, category,
    branches(name),
    umrah_seasons(name),
    umrah_categories(name),
    package_types(name),
    destinations(name),
    outbound_dates(start_date, end_date)
  `)
  .order('created_at', { ascending: false });
```

## Transformasi Data

Data dari Supabase ditransformasi ke format yang kompatibel dengan komponen:

```javascript
return {
  id: lead.id,
  name: lead.full_name || lead.title || 'Nama tidak tersedia',
  email: '-', // Email tidak ada di tabel leads
  phone: lead.phone || '-',
  branch: lead.branches?.name || '-',
  interest: interest, // Ditentukan dari season/category/destination/package
  date: new Date(lead.created_at).toLocaleDateString('id-ID'),
  avatar: getInitials(lead.full_name || lead.title || 'NA'),
  // ... field lainnya
};
```

## Fitur Search & Filter

- **Search**: Berdasarkan nama, email, phone, branch, dan interest
- **Real-time**: Update otomatis saat search berubah
- **Auto-reset**: Halaman otomatis reset ke 1 saat search

## Error Handling

- **Fallback**: Jika Supabase error, akan menampilkan pesan error
- **Loading State**: Indikator loading saat mengambil data
- **User Feedback**: Pesan error yang informatif

## Keuntungan

1. **Data Real-time**: Data selalu up-to-date
2. **Scalability**: Bisa handle data dalam jumlah besar dengan paginasi
3. **Performance**: Query yang efisien dengan join dan paginasi
4. **Maintenance**: Mudah diupdate dan dikelola
5. **Consistency**: Data konsisten dengan database
6. **User Experience**: Navigasi halaman yang mudah dan intuitif

## Testing

Untuk test komponen:

1. **Buka halaman** yang menggunakan `LeadTable.svelte`
2. **Periksa console** untuk log data dari Supabase
3. **Test search** dengan berbagai keyword
4. **Test paginasi** dengan data yang banyak
5. **Klik row** untuk melihat detail modal

## Troubleshooting

### Data Tidak Muncul
- Periksa koneksi Supabase
- Periksa console untuk error
- Pastikan tabel `leads` ada dan berisi data

### Error Loading
- Periksa environment variables Supabase
- Periksa RLS policies
- Periksa struktur tabel

### Pagination Issues
- Pastikan `itemsPerPage` tidak 0
- Periksa kalkulasi `totalPages`
- Pastikan `currentPage` tidak melebihi `totalPages`

## Next Steps

1. **Implementasi Real-time Subscription** untuk update otomatis
2. **Tambah Filter Advanced** berdasarkan kriteria tertentu
3. **Implementasi Export** data ke Excel/PDF
4. **Implementasi Bulk Actions** untuk multiple leads
5. **Tambah Sorting** berdasarkan kolom tertentu

## Dependencies

- `@supabase/supabase-js` - Supabase client
- `svelte` - Framework utama
- `lucide-svelte` - Icons (termasuk ChevronLeft, ChevronRight)

## File yang Diubah

1. `src/lib/components/LeadTable.svelte` - Komponen utama dengan paginasi
2. `src/lib/data/leads.js` - Helper functions
3. `LEAD_TABLE_DYNAMIC_README.md` - Dokumentasi ini

## Status

✅ **COMPLETED** - LeadTable sudah berhasil diintegrasikan dengan Supabase
✅ **PAGINATION ADDED** - Fitur paginasi lengkap seperti CustomerTable
✅ **REFRESH REMOVED** - Tombol refresh dan teks status dihilangkan
✅ **TESTED** - Fungsi fetch data, display, dan paginasi sudah berfungsi
✅ **DOCUMENTED** - Dokumentasi lengkap tersedia

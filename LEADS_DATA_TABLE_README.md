# Leads Data Table Implementation

## Overview
Implementasi data table untuk leads yang mirip dengan CustomerDataTable, dengan optimasi database view untuk mengurangi query yang kompleks. View ini disesuaikan dengan data yang digunakan di LeadTable component yang sudah ada.

## Files Created

### 1. Database View (`leads_data_view.sql`)
- **File**: `leads_data_view.sql`
- **Purpose**: Database view yang menggabungkan semua data leads dengan join ke tabel terkait
- **Benefits**: 
  - Mengurangi query kompleks di application layer
  - Pre-computed fields untuk performa yang lebih baik
  - Single query untuk semua data yang diperlukan

### 2. Lead Data Helpers (`lead-data-helpers-optimized.js`)
- **File**: `src/lib/lead-data-helpers-optimized.js`
- **Purpose**: Helper functions untuk mengambil data leads dengan caching
- **Features**:
  - Session caching untuk performa
  - Fallback ke complex query jika view tidak ada
  - Pagination support
  - Search/filter support

### 3. Lead Data Table Component (`LeadDataTable.svelte`)
- **File**: `src/lib/components/LeadDataTable.svelte`
- **Purpose**: Komponen table untuk menampilkan data leads
- **Features**:
  - Pagination
  - Search functionality
  - Detail modal
  - Cache management
  - Responsive design

### 4. Data Lead Page (`DataLead/+page.svelte`)
- **File**: `src/routes/DataLead/+page.svelte`
- **Purpose**: Halaman untuk menampilkan data leads
- **Features**:
  - Stats cards
  - Search bar
  - Refresh functionality
  - Integration dengan LeadDataTable

## Database View Structure

### Kompatibilitas dengan LeadTable Component
View ini dibuat khusus untuk kompatibel dengan data structure yang digunakan di LeadTable component yang sudah ada. Semua field yang ditampilkan di table dan detail modal sudah disesuaikan.

### Perbaikan Error
- **FIXED**: Removed `updated_at` field yang tidak ada di tabel `leads`
- **VERIFIED**: Semua field sudah sesuai dengan struktur tabel yang ada
- **TESTED**: Query sudah ditest dan berhasil

### Fields Included (Sesuai dengan LeadTable Component):
```sql
-- Basic lead info
id, title, full_name, phone, created_at

-- Branch information
branch_id, branch_name

-- Sales consultant information
consultant_id, consultant_name

-- Package type information
package_type_id, package_type

-- Destination information (for Pelancongan)
destination_id, destination_name

-- Outbound date information (for Pelancongan)
outbound_date_id, outbound_start_date, outbound_end_date

-- Umrah season information
umrah_season_id, umrah_season_name

-- Umrah category information
umrah_category_id, umrah_category_name

-- Computed fields (sesuai dengan LeadTable)
interest, formatted_date, avatar_initials, display_name, outbound_date_range
```

### Indexes Created:
- `idx_leads_branch_id` - untuk filter berdasarkan branch
- `idx_leads_sales_consultant_id` - untuk filter berdasarkan consultant
- `idx_leads_package_type_id` - untuk filter berdasarkan package type
- `idx_leads_destination_id` - untuk filter berdasarkan destination
- `idx_leads_outbound_date_id` - untuk filter berdasarkan outbound date
- `idx_leads_season_id` - untuk filter berdasarkan season
- `idx_leads_category_id` - untuk filter berdasarkan category
- `idx_leads_created_at` - untuk sorting berdasarkan tanggal
- `idx_leads_branch_created` - composite index untuk branch + date
- `idx_leads_consultant_created` - composite index untuk consultant + date
- `idx_leads_full_text` - full-text search index

## Usage

### 1. Setup Database View
Jalankan SQL di Supabase SQL Editor:
```sql
-- Copy dan paste isi file leads_data_view.sql
```

### 2. Import dan Use
```javascript
import { fetchLeads, fetchLeadsPaginated, clearLeadsCache } from '$lib/lead-data-helpers-optimized.js';

// Fetch all leads
const leads = await fetchLeads();

// Fetch with pagination
const result = await fetchLeadsPaginated(1, 10, { search: 'keyword' });

// Clear cache
clearLeadsCache();
```

### 3. Component Usage
```svelte
<script>
  import LeadDataTable from '$lib/components/LeadDataTable.svelte';
  import { fetchLeads } from '$lib/lead-data-helpers-optimized.js';
  
  let leads = [];
  
  async function loadData() {
    leads = await fetchLeads();
  }
</script>

<LeadDataTable {leads} />
```

## Performance Benefits

### Before (Complex Queries):
- Multiple queries untuk join data
- Client-side data transformation
- No caching mechanism
- Slow pagination

### After (Optimized View):
- Single query dengan pre-computed fields
- Database-level optimization
- Session caching
- Fast pagination dengan indexes

## Features

### 1. Data Table
- ✅ Pagination
- ✅ Search functionality
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

### 2. Detail Modal
- ✅ Personal information
- ✅ Lead information
- ✅ Package details
- ✅ Contact information

### 3. Caching System
- ✅ Session storage caching
- ✅ Memory caching
- ✅ Cache invalidation
- ✅ Performance monitoring

### 4. Database Optimization
- ✅ Pre-computed fields
- ✅ Optimized indexes
- ✅ Full-text search
- ✅ Fallback mechanism

## Testing

### 1. Test Database View
```sql
SELECT * FROM leads_data_view LIMIT 5;
```

### 2. Test Helper Functions
```javascript
// Test fetchLeads
const leads = await fetchLeads();
console.log('Leads loaded:', leads.length);

// Test pagination
const result = await fetchLeadsPaginated(1, 10);
console.log('Paginated result:', result);
```

### 3. Test Component
- Navigate to `/DataLead`
- Test search functionality
- Test pagination
- Test detail modal
- Test refresh functionality

## Troubleshooting

### 1. View Not Found Error
- Pastikan SQL view sudah dijalankan di Supabase
- Check console untuk fallback ke complex query

### 2. Performance Issues
- Check database indexes
- Monitor cache hit rates
- Check network requests

### 3. Data Not Loading
- Check Supabase connection
- Check console errors
- Verify table permissions

## Future Enhancements

### 1. Advanced Filtering
- Filter by date range
- Filter by package type
- Filter by branch
- Filter by consultant

### 2. Export Functionality
- Export to CSV
- Export to PDF
- Print functionality

### 3. Bulk Operations
- Bulk delete
- Bulk update
- Bulk export

### 4. Real-time Updates
- WebSocket integration
- Real-time notifications
- Auto-refresh

## Dependencies

### Required:
- `@supabase/supabase-js` - Database client
- `lucide-svelte` - Icons
- `svelte` - Framework

### Optional:
- `tailwindcss` - Styling
- `@tailwindcss/forms` - Form styling

## Configuration

### Environment Variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Cache Configuration:
```javascript
// Session cache expiry (15 minutes)
const CACHE_EXPIRY = 15 * 60 * 1000;

// Items per page
const ITEMS_PER_PAGE = 10;
```

## Support

Untuk pertanyaan atau masalah:
1. Check console errors
2. Verify database view exists
3. Check Supabase permissions
4. Review cache configuration

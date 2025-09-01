# Developer Documentation - Rayhar Admin Dashboard

## Komponen CustomerTable

### Deskripsi
`CustomerTable` adalah komponen tabel yang menampilkan data pelanggan dengan fitur filter, pencarian, dan pagination yang lengkap.

### Lokasi File
```
src/lib/components/CustomerTable.svelte
src/lib/data/customers.js
```

### Props
Tidak ada props yang diperlukan - komponen menggunakan data dari file `customers.js`.

### State Internal
```javascript
// Pagination
let currentPage = 1;
let itemsPerPage = 5;

// Filter
let searchTerm = '';
let statusFilter = '';
let packageFilter = '';
let branchFilter = '';

// Computed values
$: filteredCustomers = // ... filtered data
$: totalPages = // ... calculated pages
$: paginatedCustomers = // ... current page data
```

### Fitur Utama

#### 1. Filter Data
- **Search**: Pencarian berdasarkan nama, email, atau nomor telepon
- **Status Filter**: Filter berdasarkan status pemesanan
- **Package Filter**: Filter berdasarkan jenis pakej
- **Branch Filter**: Filter berdasarkan cabang kantor

#### 2. Pagination
- Navigasi halaman dengan nomor halaman
- Tombol Previous/Next
- Informasi jumlah data yang ditampilkan
- Auto-reset ke halaman 1 ketika filter berubah

#### 3. Responsive Design
- Grid layout yang adaptif
- Filter bar yang responsif
- Tabel yang scrollable di mobile

### Struktur Data

#### Customer Object
```javascript
{
  id: number,
  name: string,
  email: string,
  phone: string,
  branch: string,
  package: 'Umrah' | 'Pelancongan',
  category: string,
  status: 'Confirmed' | 'Pending' | 'Cancelled',
  price: string,
  date: string,
  avatar: string
}
```

#### Filter Object
```javascript
{
  search: string,
  status: string,
  package: string,
  branch: string
}
```

### Fungsi Helper

#### getInitials(name: string): string
Mengembalikan inisial dari nama (2 karakter pertama).

#### getStatusColor(status: string): string
Mengembalikan class CSS untuk warna status.

#### getPackageColor(packageType: string): string
Mengembalikan class CSS untuk warna pakej.

#### filterCustomers(customers: Customer[], filters: Filter): Customer[]
Filter data pelanggan berdasarkan kriteria yang diberikan.

### Styling

#### CSS Classes yang Digunakan
- **Tailwind CSS**: Untuk styling utama
- **Custom Classes**: `shadow-soft`, `bg-section`, dll
- **Responsive Classes**: `lg:`, `md:`, `xl:` prefixes

#### Color Scheme
- **Primary**: Purple (#942392)
- **Success**: Green (Confirmed status)
- **Warning**: Yellow (Pending status)
- **Danger**: Red (Cancelled status)

### Event Handling

#### Click Events
- **Row Click**: Hover effect pada baris tabel
- **Filter Change**: Auto-update data dan reset pagination
- **Pagination**: Navigasi antar halaman

#### Reactive Statements
```javascript
// Auto-filter data
$: filteredCustomers = customersData.filter(/* ... */);

// Auto-calculate pagination
$: totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

// Auto-reset page when filter changes
$: if (searchTerm || statusFilter || packageFilter || branchFilter) {
  currentPage = 1;
}
```

### Performance Considerations

#### Optimization
- **Reactive Statements**: Hanya dijalankan ketika dependencies berubah
- **Computed Values**: Pagination dan filter dihitung secara lazy
- **Event Delegation**: Minimal event listeners

#### Memory Management
- **Data Immutability**: Data tidak dimodifikasi langsung
- **Efficient Filtering**: Filter chain yang optimal
- **Pagination**: Hanya render data yang diperlukan

### Testing

#### Unit Tests
```javascript
// Test filter functionality
test('should filter by status', () => {
  const result = filterCustomers(customers, { status: 'Confirmed' });
  expect(result.every(c => c.status === 'Confirmed')).toBe(true);
});

// Test pagination
test('should return correct page data', () => {
  const result = paginatedCustomers;
  expect(result.length).toBeLessThanOrEqual(itemsPerPage);
});
```

#### Integration Tests
- Test komponen dengan data real
- Test responsive behavior
- Test accessibility features

### Accessibility

#### ARIA Labels
- Proper table headers
- Screen reader support
- Keyboard navigation

#### Semantic HTML
- `<table>`, `<thead>`, `<tbody>`
- Proper `<th>` elements
- Meaningful button labels

### Browser Support

#### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### Polyfills
- Tidak diperlukan untuk fitur yang digunakan
- SvelteKit handles most compatibility

### Future Enhancements

#### Planned Features
- Export data (CSV, Excel)
- Bulk actions (delete, update status)
- Advanced sorting
- Real-time updates
- Dark mode support

#### Technical Improvements
- Virtual scrolling untuk data besar
- WebSocket integration
- Service Worker caching
- Progressive Web App features

### Troubleshooting

#### Common Issues

1. **Filter tidak berfungsi**
   - Pastikan data format sesuai
   - Check console untuk errors
   - Verify reactive statements

2. **Pagination error**
   - Check totalPages calculation
   - Verify currentPage bounds
   - Ensure data consistency

3. **Styling issues**
   - Verify Tailwind CSS import
   - Check custom CSS variables
   - Ensure responsive classes

#### Debug Tips
- Gunakan Svelte DevTools
- Check browser console
- Verify data structure
- Test responsive breakpoints

### Contributing

#### Code Style
- Gunakan Prettier untuk formatting
- Follow Svelte best practices
- Maintain consistent naming
- Add proper comments

#### Pull Request Process
1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit PR

---

Untuk pertanyaan lebih lanjut, hubungi tim development atau buat issue di repository.

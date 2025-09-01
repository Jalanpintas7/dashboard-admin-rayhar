<script>
  import CustomerTable from './CustomerTable.svelte';
</script>

<div class="max-w-7xl mx-auto p-6">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Demo Tabel Pelanggan</h1>
    <p class="text-gray-600">
      Komponen tabel pelanggan dengan fitur filter, pencarian, dan pagination yang responsif.
    </p>
  </div>
  
  <CustomerTable />
  
  <div class="mt-8 p-6 bg-gray-50 rounded-lg">
    <h2 class="text-xl font-semibold text-gray-900 mb-4">Fitur yang Tersedia:</h2>
    <ul class="space-y-2 text-gray-700">
      <li>✅ <strong>Filter Status:</strong> Confirmed, Pending, Cancelled</li>
              <li>✅ <strong>Filter Pakej:</strong> Umrah, Pelancongan</li>
      <li>✅ <strong>Filter Cabang:</strong> Berbagai lokasi kantor</li>
      <li>✅ <strong>Pencarian:</strong> Berdasarkan nama, email, atau telepon</li>
      <li>✅ <strong>Pagination:</strong> Navigasi halaman yang mudah</li>
      <li>✅ <strong>Responsif:</strong> Bekerja di semua ukuran layar</li>
      <li>✅ <strong>Data Lengkap:</strong> Informasi pelanggan yang detail</li>
    </ul>
  </div>
</div>

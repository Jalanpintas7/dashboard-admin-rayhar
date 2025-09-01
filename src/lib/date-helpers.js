// Helper functions untuk format tanggal dalam bahasa Malaysia
export function formatDateMalaysia(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const monthNames = [
    'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
  ];
  
  return `${day} ${monthNames[month]} ${year}`;
}

// Fungsi untuk format tanggal dengan opsi yang lebih fleksibel
export function formatDateMalaysiaCustom(dateString, options = {}) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  const monthNames = [
    'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
  ];
  
  const monthNamesLong = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];
  
  if (options.longMonth) {
    return `${day} ${monthNamesLong[month]} ${year}`;
  }
  
  return `${day} ${monthNames[month]} ${year}`;
}

// Fungsi untuk format tanggal singkat (DD/MM/YYYY)
export function formatDateShort(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// Fungsi untuk mendapatkan label tanggal untuk chart (3 hari terakhir)
export function getDateLabelsForChart() {
  const today = new Date();
  const dates = [];
  
  // Hari ini
  dates.push(formatDateMalaysia(today));
  
  // 1 hari yang lalu
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  dates.push(formatDateMalaysia(yesterday));
  
  // 2 hari yang lalu
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  dates.push(formatDateMalaysia(twoDaysAgo));
  
  return dates;
}

// Fungsi untuk format tanggal dengan format yang berbeda
export function formatDateWithFormat(dateString, format = 'malaysia') {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  switch (format) {
    case 'malaysia':
      return formatDateMalaysia(dateString);
    case 'short':
      return formatDateShort(dateString);
    case 'long':
      return formatDateMalaysiaCustom(dateString, { longMonth: true });
    default:
      return formatDateMalaysia(dateString);
  }
}

// Fungsi untuk format range tanggal (start - end)
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '-';
  
  const start = formatDateMalaysia(startDate);
  const end = formatDateMalaysia(endDate);
  
  return `${start} - ${end}`;
}

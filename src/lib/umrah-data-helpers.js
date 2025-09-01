import { supabase } from './supabase.js';

// Fungsi untuk mengambil data musim umrah
export async function fetchUmrahSeasons() {
  try {
    const { data, error } = await supabase
      .from('umrah_seasons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching umrah seasons:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching umrah seasons:', error);
    return [];
  }
}

// Fungsi untuk mengambil data kategori umrah
export async function fetchUmrahCategories() {
  try {
    const { data, error } = await supabase
      .from('umrah_categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching umrah categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching umrah categories:', error);
    return [];
  }
}

// Fungsi untuk mengambil data pakej umrah (umrah_dates)
export async function fetchUmrahPackages() {
  try {
    const { data, error } = await supabase
      .from('umrah_dates')
      .select(`
        *,
        umrah_seasons(name),
        umrah_categories(name),
        airlines(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching umrah packages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching umrah packages:', error);
    return [];
  }
}

// Fungsi untuk menghitung jumlah pakej per musim
export async function getPackageCountBySeason() {
  try {
    const { data, error } = await supabase
      .from('umrah_dates')
      .select('umrah_season_id');

    if (error) {
      console.error('Error counting packages by season:', error);
      return {};
    }

    const countMap = {};
    data.forEach(item => {
      if (item.umrah_season_id) {
        countMap[item.umrah_season_id] = (countMap[item.umrah_season_id] || 0) + 1;
      }
    });

    return countMap;
  } catch (error) {
    console.error('Error counting packages by season:', error);
    return {};
  }
}

// Fungsi untuk menghitung jumlah pakej per kategori
export async function getPackageCountByCategory() {
  try {
    const { data, error } = await supabase
      .from('umrah_dates')
      .select('umrah_category_id');

    if (error) {
      console.error('Error counting packages by category:', error);
      return {};
    }

    const countMap = {};
    data.forEach(item => {
      if (item.umrah_category_id) {
        countMap[item.umrah_category_id] = (countMap[item.umrah_category_id] || 0) + 1;
      }
    });

    return countMap;
  } catch (error) {
    console.error('Error counting packages by category:', error);
    return {};
  }
}

// Fungsi untuk format currency
export function formatCurrency(amount) {
  if (!amount) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Fungsi untuk format tanggal
export function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

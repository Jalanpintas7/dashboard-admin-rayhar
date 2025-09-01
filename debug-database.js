import { supabase } from './src/lib/supabase.js';

async function debugDatabase() {
  console.log('=== DEBUG DATABASE CONNECTION ===');
  
  try {
    // Test koneksi dasar
    console.log('\n1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('branches')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Connection failed:', testError);
      return;
    }
    console.log('✅ Connection successful');
    
    // Cek data branches
    console.log('\n2. Checking branches data...');
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*');
    
    if (branchError) {
      console.error('Error fetching branches:', branchError);
    } else {
      console.log('Branches found:', branches?.length || 0);
      branches?.forEach(branch => {
        console.log(`  - ID: ${branch.id}, Name: ${branch.name}`);
      });
    }
    
    // Cek data bookings
    console.log('\n3. Checking bookings data...');
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, nama, branch_id')
      .limit(10);
    
    if (bookingError) {
      console.error('Error fetching bookings:', bookingError);
    } else {
      console.log('Bookings found:', bookings?.length || 0);
      bookings?.forEach(booking => {
        console.log(`  - ID: ${booking.id}, Name: ${booking.nama}, Branch ID: ${booking.branch_id}`);
      });
    }
    
    // Cek data bookings per branch
    console.log('\n4. Checking bookings per branch...');
    if (branches && branches.length > 0) {
      for (const branch of branches) {
        const { data: branchBookings, error: branchBookingError } = await supabase
          .from('bookings')
          .select('id, nama')
          .eq('branch_id', branch.id);
        
        if (branchBookingError) {
          console.error(`Error fetching bookings for ${branch.name}:`, branchBookingError);
        } else {
          console.log(`  - ${branch.name}: ${branchBookings?.length || 0} bookings`);
        }
      }
    }
    
    // Cek admin_role data
    console.log('\n5. Checking admin_role data...');
    const { data: adminRoles, error: adminError } = await supabase
      .from('admin_role')
      .select('user_id, branch_id, branches(name)');
    
    if (adminError) {
      console.error('Error fetching admin roles:', adminError);
    } else {
      console.log('Admin roles found:', adminRoles?.length || 0);
      adminRoles?.forEach(role => {
        console.log(`  - User ID: ${role.user_id}, Branch: ${role.branches?.name || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Jalankan debug
debugDatabase();
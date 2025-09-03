import { writable, derived } from 'svelte/store';
import { supabase } from '../supabase.js';

// Auth stores
export const user = writable(null);
export const userRole = writable(null);
export const redirectPath = writable(null);
export const loading = writable(true);
export const error = writable(null);

// Derived store untuk auth state
export const isAuthenticated = derived(user, ($user) => !!$user);
export const isSuperAdmin = derived(userRole, ($userRole) => $userRole === 'super_admin');
export const isAdminBranch = derived(userRole, ($userRole) => $userRole === 'admin_branch');

let _authInitialized = false;
let _authUnsubscribe = null;

// Initialize auth state
export const initializeAuth = async () => {
  if (_authInitialized) {
    // Sudah terinisialisasi, jangan pasang listener lagi
    return;
  }
  _authInitialized = true;
  loading.set(true);
  
  try {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    user.set(session?.user || null);
    
    // Jika ada user, ambil role-nya
    if (session?.user) {
      await getUserRole(session.user.id);
    } else {
      userRole.set(null);
      redirectPath.set(null);
    }

    // Penting: pastikan loading dimatikan setelah pengecekan sesi awal
    loading.set(false);
    
    // Listen for auth changes (token refresh, sign in/out)
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      user.set(session?.user || null);
      
      if (session?.user) {
        await getUserRole(session.user.id);
      } else {
        userRole.set(null);
        redirectPath.set(null);
      }
      
      // Jangan biarkan loading menggantung pada perubahan event
      loading.set(false);
    });

    // Simpan unsubscribe untuk nanti jika dibutuhkan
    _authUnsubscribe = listener?.subscription?.unsubscribe || null;
    
  } catch (err) {
    error.set(err.message);
    loading.set(false);
  }
};

// Get user role from database
export const getUserRole = async (userId) => {
  try {
    const { data, error: roleError } = await supabase
      .from('admin_role')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (roleError) {
      console.error('Error fetching user role:', roleError);
      userRole.set(null);
      redirectPath.set(null);
      return null;
    }
    
    userRole.set(data?.role || null);
    
    // Set redirect path berdasarkan role
    if (data?.role === 'super_admin') {
      redirectPath.set('/');
    } else if (data?.role === 'admin_branch') {
      redirectPath.set('/DashboardBranch');
    } else {
      redirectPath.set(null);
    }
    
    return data?.role;
  } catch (err) {
    console.error('Error in getUserRole:', err);
    userRole.set(null);
    redirectPath.set(null);
    return null;
  }
};

// Sign in function
export const signIn = async (email, password) => {
  loading.set(true);
  error.set(null);
  
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) throw authError;
    
    user.set(data.user);
    
    // Ambil role user setelah login berhasil
    if (data.user) {
      await getUserRole(data.user.id);
    }
    
    return data;
    
  } catch (err) {
    error.set(err.message);
    throw err;
  } finally {
    loading.set(false);
  }
};

// Sign out function
export const signOut = async () => {
  loading.set(true);
  error.set(null);
  
  try {
    const { error: authError } = await supabase.auth.signOut();
    
    if (authError) throw authError;
    
    // Reset stores terlebih dahulu
    user.set(null);
    userRole.set(null);
    redirectPath.set(null);
    
    // Redirect ke login setelah reset stores menggunakan window.location.href
    // Ini memastikan redirect yang bersih di Netlify
    window.location.href = '/login';
    
  } catch (err) {
    error.set(err.message);
    throw err;
  } finally {
    loading.set(false);
  }
};

// Reset stores
export const resetAuth = () => {
  user.set(null);
  userRole.set(null);
  redirectPath.set(null);
  error.set(null);
};

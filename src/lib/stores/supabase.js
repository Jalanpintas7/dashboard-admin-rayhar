import { writable } from 'svelte/store'
import { supabase } from '../supabase.js'

// Store untuk user
export const user = writable(null)

// Store untuk user role
export const userRole = writable(null)

// Store untuk redirect path
export const redirectPath = writable(null)

// Store untuk loading state
export const loading = writable(true)

// Store untuk error
export const error = writable(null)

// Initialize auth state
export const initializeAuth = async () => {
  loading.set(true)
  
  try {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession()
    user.set(session?.user || null)
    
    // Jika ada user, ambil role-nya
    if (session?.user) {
      await getUserRole(session.user.id)
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      user.set(session?.user || null)
      
      if (session?.user) {
        await getUserRole(session.user.id)
      } else {
        userRole.set(null)
        redirectPath.set(null)
      }
      
      loading.set(false)
    })
    
  } catch (err) {
    error.set(err.message)
    loading.set(false)
  }
}

// Sign in function
export const signIn = async (email, password) => {
  loading.set(true)
  error.set(null)
  
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) throw authError
    
    user.set(data.user)
    
    // Ambil role user setelah login berhasil
    if (data.user) {
      await getUserRole(data.user.id)
    }
    
    return data
    
  } catch (err) {
    error.set(err.message)
    throw err
  } finally {
    loading.set(false)
  }
}

// Sign out function
export const signOut = async () => {
  loading.set(true)
  error.set(null)
  
  try {
    const { error: authError } = await supabase.auth.signOut()
    
    if (authError) throw authError
    
    user.set(null)
    userRole.set(null)
    redirectPath.set(null)
    
  } catch (err) {
    error.set(err.message)
    throw err
  } finally {
    loading.set(false)
  }
}

// Sign up function
export const signUp = async (email, password) => {
  loading.set(true)
  error.set(null)
  
  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (authError) throw authError
    
    return data
    
  } catch (err) {
    error.set(err.message)
    throw err
  } finally {
    loading.set(false)
  }
}

// Reset password function
export const resetPassword = async (email) => {
  loading.set(true)
  error.set(null)
  
  try {
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email)
    
    if (authError) throw authError
    
  } catch (err) {
    error.set(err.message)
    throw err
  } finally {
    loading.set(false)
  }
}

// Update password function
export const updatePassword = async (password) => {
  loading.set(true)
  error.set(null)
  
  try {
    const { error: authError } = await supabase.auth.updateUser({
      password
    })
    
    if (authError) throw authError
    
  } catch (err) {
    error.set(err.message)
    throw err
  } finally {
    loading.set(false)
  }
}

// Function untuk mendapatkan role user dari database
export const getUserRole = async (userId) => {
  try {
    const { data, error: roleError } = await supabase
      .from('admin_role')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle to handle 0 rows
    
    if (roleError) {
      console.log('Admin role table not found or accessible, using default role')
      userRole.set('super_admin') // Default fallback
      redirectPath.set(null)
      return 'super_admin'
    }
    
    userRole.set(data?.role || null)
    
    // Set redirect path berdasarkan role
    if (data?.role === 'super_admin') {
      redirectPath.set('/')
    } else if (data?.role === 'admin_branch') {
      redirectPath.set('/DashboardBranch')
    } else {
      redirectPath.set(null)
    }
    
    return data?.role
  } catch (err) {
    console.error('Error in getUserRole:', err)
    userRole.set(null)
    redirectPath.set(null)
    return null
  }
}

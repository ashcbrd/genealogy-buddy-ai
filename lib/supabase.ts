import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client for client-side operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'genealogy-ai@1.0.0'
    }
  }
})

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Type definitions for Supabase integration
export type SupabaseClient = typeof supabase
export type SupabaseAdminClient = typeof supabaseAdmin

// Helper function to get user from session
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }
  return user
}

// Helper function for file upload
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    upsert?: boolean
    contentType?: string
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: options?.upsert || false,
      contentType: options?.contentType
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return data
}

// Helper function to get public URL for uploaded files
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

// Helper function to create signed URL for private files
export async function createSignedUrl(
  bucket: string, 
  path: string, 
  expiresIn = 3600
) {
  // Use admin client for signed URL creation to bypass RLS
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    // Handle specific Supabase storage errors more gracefully
    if (error.message?.includes('Object not found') || 
        error.message?.includes('not found')) {
      console.warn(`File not found in storage: ${bucket}/${path}`);
      return null; // Return null instead of throwing for missing files
    }
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

// Helper function to delete files
export async function deleteFile(bucket: string, paths: string | string[]) {
  const pathArray = Array.isArray(paths) ? paths : [paths]
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(pathArray)

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }

  return data
}

// Real-time subscription helper
export function subscribeToChanges(
  table: string,
  filter?: string,
  callback?: (payload: Record<string, unknown>) => void
) {
  const channel = supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table,
        filter 
      }, 
      callback || ((payload) => {
        console.log('Change received!', payload)
      })
    )
    .subscribe()

  return channel
}

// Supabase health check
export async function checkSupabaseHealth() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    return {
      status: error ? 'unhealthy' : 'healthy',
      error: error?.message
    }
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

// Export for easier imports
export { createClient }
export default supabase
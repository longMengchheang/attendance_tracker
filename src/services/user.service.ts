import { supabase, Users } from '@/lib/supabase';

/**
 * Find user profile by ID
 */
export async function findUserById(id: string): Promise<Users | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Find user profile by email (via auth.users)
 */
export async function findUserByEmail(email: string): Promise<(Users & { email: string }) | null> {
  // This requires a custom RPC or join - for now we search users
  // In production, you might want to create a view or RPC for this
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUser = authData?.users?.find(u => u.email === email);
  
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!profile) return null;
  return { ...profile, email };
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<Users[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Update profile
 */
export async function updateProfile(id: string, updates: Partial<Users>): Promise<Users | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return data;
}

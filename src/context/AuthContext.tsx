'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '../types';
import { supabase, Users } from '@/lib/supabase';

interface AuthContextType {
  user: Users | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'attendance_current_user';
const SESSION_KEY = 'attendance_session';


function getCurrentUser(): Users | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user: Users | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function setSession(session: any | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Users | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user on mount and listen for auth changes
  useEffect(() => {
    // Check local storage first
    const storedUser = getCurrentUser();
    const storedSession = typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
    
    setUser(storedUser);

    // Attempt to recover email if missing from stored user
    if (storedUser && !storedUser.email && storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.user?.email) {
          const updatedUser = { ...storedUser, email: parsedSession.user.email };
          console.log('Recovering missing email from session:', updatedUser);
          setUser(updatedUser);
          setCurrentUser(updatedUser);
        }
      } catch (e) {
        console.error('Error parsing stored session for email recovery:', e);
      }
    }
    
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      // Skip processing for password recovery events — the reset page handles its own flow.
      // Processing these events would race with the reset page's updateUser → signOut sequence.
      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        console.log(`Skipping AuthContext processing for event: ${event}`);
        setIsLoading(false);
        return;
      }

      try {
        if (session) {
          // Fetch user profile from public table to get the correct role
          let profile = null;
          try {
             const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

             if (error) {
               if (error.message.includes('AbortError') || error.message.includes('signal is aborted')) {
                 console.warn('Profile fetch aborted (likely safe to ignore):', error.message);
               } else {
                 console.error('Error fetching user profile:', error.message, error.details, error.hint);
               }
             }
             profile = data;
          } catch (profileError) {
             console.error('Exception fetching profile:', profileError);
             // Ignore profile fetch errors to allow session to proceed
          }

          const role = (profile?.role as 'student' | 'teacher') || (session.user.user_metadata?.role as 'student' | 'teacher') || 'student';
          const name = profile?.name || session.user.user_metadata?.name || 'User';

          const loggedInUser: Users = {
            id: session.user.id,
            email: session.user.email,
            name: name,
            role: role,
            created_at: new Date().toISOString(),
          };
          setUser(loggedInUser);
          setCurrentUser(loggedInUser);
          setSession(session);
        } else {
          // Only clear if explicitly signed out or session expired
          if (event === 'SIGNED_OUT') {
             setUser(null);
             setCurrentUser(null);
             setSession(null);
          }
        }
      } catch (error: any) {
        console.error('Unexpected error in auth state change:', error);
        
        // Handle invalid refresh token by clearing session
        if (error?.message?.includes('Refresh Token Not Found') || 
            error?.message?.includes('Invalid Refresh Token')) {
          console.log('Clearing invalid session...');
          setUser(null);
          setCurrentUser(null);
          setSession(null);
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Signup - with password
  const signup = async (name: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    // ... existing signup code ...
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Login - with password
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.session) {
        // The onAuthStateChange might pick this up too, but setting it here gives immediate feedback
        const profile = data.profile;
        const role = (profile?.role as 'student' | 'teacher') || (data.user.user_metadata?.role as 'student' | 'teacher') || 'student';
        const name = profile?.name || data.user.user_metadata?.name || 'User';

        const loggedInUser: Users = {
            id: data.user.id,
            email: data.user.email,
            name: name,
            role: role,
            created_at: new Date().toISOString(),
        };
        setUser(loggedInUser);
        setCurrentUser(loggedInUser);
        setSession(data.session);
        
        // Also set supabase session client-side to ensure consistency
        // We do NOT await this, as it can block the UI redirect if it takes too long.
        supabase.auth.setSession(data.session);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    // Fire and forget logout
    supabase.auth.signOut();
    setUser(null);
    setCurrentUser(null);
    setSession(null);
    router.push('/login');
  };

  // Reset Password - sends Email Redirect (Magic Link) for password recovery
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Update Password - sets new password for authenticated user
  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Attempting to update password...');

      // Note: We skip explicit session check here to avoid timeouts and race conditions. 
      // supabase.auth.updateUser will fail internaly if there is no active session.
      
      const { error } = await supabase.auth.updateUser({
          password: password
      });

      if (error) {
        console.error('Error updating password:', error);
        return { success: false, error: error.message };
      }

      console.log('Password updated successfully');
      return { success: true };
    } catch (error: unknown) {
      console.error('Unexpected error updating password:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error. Please try again.'
      };
    }
  };

  // Resend OTP / Verification Email
  const resendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
       return { success: false, error: 'Network error. Please try again.' };
    }
  };



  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, resetPassword, updatePassword, resendOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

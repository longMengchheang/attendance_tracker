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
  verifyOtp: (email: string, code: string, type: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
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
    
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      try {
        if (session) {
          // Fetch user profile from public table to get the correct role
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching user profile:', error);
          }

          const role = (profile?.role as 'student' | 'teacher') || (session.user.user_metadata?.role as 'student' | 'teacher') || 'student';
          const name = profile?.name || session.user.user_metadata?.name || 'User';

          const loggedInUser: Users = {
            id: session.user.id,
            name: name,
            role: role,
            created_at: new Date().toISOString(),
          };
          setUser(loggedInUser);
          setCurrentUser(loggedInUser);
          setSession(session);
        } else {
          // Only clear if explicitly signed out or session expired
          // But we want to keep local state if just refreshing page and listener hasn't fired yet?
          // Actually, if session is null, we should probably clear.
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

  // Reset Password - sends reset email
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send reset email' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Update Password - sets new password for authenticated user
  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Verify OTP
  const verifyOtp = async (email: string, code: string, type: string): Promise<{ success: boolean; error?: string }> => {
    try {
      let otpType: any = type;
      if (type === 'email') {
        otpType = 'signup';
      }

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code, type: otpType }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      if (data.session && data.user) {
         const loggedInUser: Users = {
            id: data.user.id,
            name: data.user.name || 'User',
            role: (data.user.role as 'student' | 'teacher') || 'student',
            created_at: new Date().toISOString(),
         };
         setUser(loggedInUser);
         setCurrentUser(loggedInUser);
         setSession(data.session);
         
         // Also set supabase session client-side to ensure consistency
         // Note: we might need to be careful here if access_token format matches what setSession expects
         // The API returns session matching Supabase session shape usually.
         await supabase.auth.setSession({
            access_token: data.session.accessToken,
            refresh_token: data.session.refreshToken,
         });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Resend OTP
  const resendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
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
    <AuthContext.Provider value={{ user, isLoading, login, signup, verifyOtp, resendOtp, logout, resetPassword, updatePassword }}>
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

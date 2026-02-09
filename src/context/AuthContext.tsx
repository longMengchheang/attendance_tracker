'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Load user on mount and listen for auth changes
  useEffect(() => {
    // Check local storage first
    const storedUser = getCurrentUser();
    const storedSession = typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
    
    setUser(storedUser);
    
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      if (session) {
        const loggedInUser: Users = {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          role: (session.user.user_metadata?.role as 'student' | 'teacher') || 'student',
          created_at: new Date().toISOString(), // Mocked for auth state change
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
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Signup - with password
  const signup = async (name: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    // ... existing signup code ...
    // Note: To keep context clean, I'm just pasting the existing function references here if possible, 
    // but replace_file_content needs the FULL content of the block I'm replacing.
    // Since I'm replacing the useEffect, I need to keep the other functions intact or just include them in the block if they are in range.
    // The previous tool call covered up to line 146. 
    // I will rewrite the whole provider body to be safe and clean.
    
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
        const loggedInUser: Users = {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'User',
            role: (data.user.user_metadata?.role as 'student' | 'teacher') || 'student',
            created_at: new Date().toISOString(),
        };
        setUser(loggedInUser);
        setCurrentUser(loggedInUser);
        setSession(data.session);
        
        // Also set supabase session client-side to ensure consistency
        await supabase.auth.setSession(data.session);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentUser(null);
    setSession(null);
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
      // Get current session token
      const sessionString = localStorage.getItem(SESSION_KEY);
      const session = sessionString ? JSON.parse(sessionString) : null;
      const accessToken = session?.access_token;

      if (!accessToken) {
         return { success: false, error: 'Not authenticated. Please try clicking the reset link again.' };
      }

      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, accessToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update password' };
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

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: otpType,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
         const loggedInUser: Users = {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'User',
            role: (data.user.user_metadata?.role as 'student' | 'teacher') || 'student',
            created_at: new Date().toISOString(),
         };
         setUser(loggedInUser);
         setCurrentUser(loggedInUser);
         setSession(data.session);
         
         // Also set supabase session client-side to ensure consistency
         await supabase.auth.setSession(data.session);
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

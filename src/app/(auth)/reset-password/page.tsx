'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from "@/components/AuthLayout";
import { supabase } from '@/lib/supabase';

function ResetPasswordContent() {
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Minimal state: just check if we have a valid session to show the form
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use onAuthStateChange instead of getSession() — it's resilient to
    // React Strict Mode's double-mount which aborts one-shot fetch calls.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Reset page auth event:', event, !!session);

      // INITIAL_SESSION fires once when the listener first connects.
      // SIGNED_IN fires if the session was just established (e.g. from callback redirect).
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          setHasSession(true);
        } else {
          setHasSession(false);
        }
        setIsLoading(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        // PASSWORD_RECOVERY means we arrived here via a recovery link — session is valid
        setHasSession(true);
        setIsLoading(false);
      }
    });

    // Safety timeout: if no auth event fires within 6s, stop loading
    const timeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn('Reset page: auth event timeout, showing invalid link');
          setHasSession(false);
          return false;
        }
        return prev;
      });
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
        setIsSubmitting(false);
        return;
      }

      // STRICT FLOW: Immediate sign out after update to prevent session rotation issues
      await supabase.auth.signOut();
      
      // Redirect immediately
      router.replace('/login');
      
    } catch (err: any) {
       setError(err.message || 'An unexpected error occurred');
       setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return (
          <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-[#F43F5E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying security...</p>
          </div>
      );
  }

  if (!hasSession) {
    return (
      <div className="w-full max-w-sm mx-auto md:mx-0 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invalid Link</h1>
          <p className="text-gray-500 mt-2 text-sm">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="block w-full text-center bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#F43F5E]/30 transition-all duration-200"
          >
            Request New Link
          </Link>
          <Link
            href="/login"
            className="block w-full text-center border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-all duration-200"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="w-full max-w-sm mx-auto md:mx-0">
        
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set New Password</h1>
            <p className="text-gray-500 mt-2 text-sm">Create a new secure password for your account</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">New Password</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F43F5E] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F43F5E] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium animate-pulse">
              <AlertCircle size={14}/> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#F43F5E]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout title="">
            <Suspense fallback={
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-[#F43F5E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </AuthLayout>
    );
}

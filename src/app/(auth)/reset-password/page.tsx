'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const result = await updatePassword(password);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      setError(result.error || 'Failed to update password');
    }
    
    setIsSubmitting(false);
  };

  return (
    <AuthLayout title="">
      <div className="w-full max-w-sm mx-auto md:mx-0">
        
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set New Password</h1>
            <p className="text-gray-500 mt-2 text-sm">Create a new secure password for your account</p>
        </div>

        {success ? (
          <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h3>
            <p className="text-gray-500 text-sm">Redirecting you to dashboard...</p>
          </div>
        ) : (
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
        )}
      </div>
    </AuthLayout>
  );
}

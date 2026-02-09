'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Mail } from 'lucide-react';
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsSubmitting(false);
  };

  return (
    <AuthLayout title="">
      <div className="w-full max-w-sm mx-auto md:mx-0">
        
        <div className="text-center md:text-left mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F43F5E]/20 to-[#F43F5E]/5 rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-4">
            <Mail className="w-8 h-8 text-[#F43F5E]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2 text-sm">Enter your credentials to sign in</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F43F5E] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
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
            <div className="flex justify-end mt-1">
              <Link href="/forgot-password" className="text-xs font-bold text-[#F43F5E] hover:underline">
                Forgot password?
              </Link>
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
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#F43F5E] font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

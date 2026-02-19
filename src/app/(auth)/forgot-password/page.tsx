'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    const result = await resetPassword(email);
    
    if (result.success) {
      setIsEmailSent(true);
    } else {
      setError(result.error || 'Failed to send reset link');
    }
    
    setIsSubmitting(false);
  };





  if (isEmailSent) {
    return (
      <AuthLayout title="">
        <div className="w-full max-w-md mx-auto md:mx-0">
          <div className="text-center md:text-left mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#F43F5E]/20 to-[#F43F5E]/5 rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-6">
              <Mail className="w-8 h-8 text-[#F43F5E]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Check Your Email</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              We’ve sent a password reset link to <br/>
              <span className="font-bold text-gray-900 block mt-1">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Click the link in the email to reset your password.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <div className="space-y-4">
              <button
                onClick={() => {
                  setError('');
                  resetPassword(email);
                }}
                className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#F43F5E]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] shadow-md"
              >
                Resend Email
              </button>
              
              <p className="text-center text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6 text-center">
                <p className="text-gray-500">
                    Wrong email?{' '}
                    <button 
                        onClick={() => setIsEmailSent(false)} 
                        className="text-[#F43F5E] font-bold hover:underline transition-colors hover:text-[#E11D48]"
                    >
                        Try again
                    </button>
                </p>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="">
      <div className="w-full max-w-sm mx-auto md:mx-0">
        
        <div className="mb-6">
          <Link href="/login" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-medium transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
             Reset Password
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
             Enter your email to receive a password reset link
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
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
                {isSubmitting ? 'Sending...' : 'Send Link'}
              </button>
            </form>

      </div>
    </AuthLayout>
  );
}

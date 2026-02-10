'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const result = await resetPassword(email);
    
    if (result.success) {
      setSuccess('Recovery code sent! check your terminal.');
      setShowOtpInput(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
    
    setIsSubmitting(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter the recovery code.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // type='recovery' for password reset
    const result = await verifyOtp(email, code, 'recovery');

    if (result.success) {
      setSuccess('Verified! Redirecting to reset password...');
      setTimeout(() => {
        router.push('/reset-password');
      }, 1500);
    } else {
      setError(result.error || 'Invalid code');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="">
      <div className="w-full max-w-sm mx-auto md:mx-0">
        
        <div className="mb-6">
          <Link href="/login" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-medium transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Login
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reset Password</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {showOtpInput 
              ? 'Enter the recovery code sent to your email' 
              : 'Enter your email to receive recovery instructions'}
          </p>
        </div>

        {success && !showOtpInput && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm mb-6 border border-green-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <p className="font-bold mb-1">Email Sent!</p>
            <p>{success}</p>
          </div>
        )}

        {showOtpInput ? (
          <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">Recovery Code</label>
              <div className="relative group">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900 text-center tracking-widest font-mono text-lg"
                  placeholder="Enter Code"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1 font-medium animate-pulse">
                <AlertCircle size={14}/> {error}
              </p>
            )}

            {success && (
               <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                  <CheckCircle size={14}/> {success}
               </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#F43F5E]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>
             <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Use a different email
                </button>
            </div>
          </form>
        ) : (
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
              {isSubmitting ? 'Sending...' : 'Send Recovery Code'}
            </button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

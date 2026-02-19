'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';

function VerifyEmailContent() {
  const router = useRouter();
  // const searchParams = useSearchParams(); // Removed to avoid AbortError
  const { resendOtp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Parse URL params manually to avoid useSearchParams re-render issues in Next.js 16
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailFromUrl = params.get('email');
      if (emailFromUrl) {
        setEmail(emailFromUrl);
      }
    }
  }, []);

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsResending(true);
    setError('');

    const result = await resendOtp(email);

    if (result.success) {
      setSuccess('New confirmation link sent! Check your email.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to resend email');
    }

    setIsResending(false);
  };

  return (
    <div className="w-full max-w-md mx-auto md:mx-0">
      
      <div className="text-center md:text-left mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#F43F5E]/20 to-[#F43F5E]/5 rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-6">
          <Mail className="w-8 h-8 text-[#F43F5E]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Check Your Email</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          We’ve sent a verification link to <br/>
          <span className="font-bold text-gray-900 block mt-1">{email || 'your email'}</span>
        </p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Click the link in the email to verify your account.
        </p>
      </div>

      <div className="space-y-6">
        {!email && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
              placeholder="name@example.com"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-2 font-medium animate-pulse bg-red-50 p-3 rounded-lg border border-red-100">
            <AlertCircle size={16}/> {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-600 flex items-center gap-2 font-medium bg-green-50 p-3 rounded-lg border border-green-100">
            <CheckCircle size={16}/> {success}
          </p>
        )}
      </div>

      <div className="mt-10 space-y-6">
        <div className="space-y-4">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#F43F5E]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
          >
            {isResending ? 'Sending...' : 'Resend Email'}
          </button>
          
          <p className="text-center text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-gray-500">
                Wrong email?{' '}
                <Link href="/login" className="text-[#F43F5E] font-bold hover:underline transition-colors hover:text-[#E11D48]">
                    Go back
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="">
      <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}

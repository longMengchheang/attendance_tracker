'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, resendOtp, login } = useAuth();
  
  const emailFromUrl = searchParams.get('email') || '';
  const typeFromUrl = searchParams.get('type') || 'email';
  
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !code) {
      setError('Please enter your email and verification code.');
      return;
    }

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await verifyOtp(email, code, typeFromUrl);

    if (result.success) {
      setSuccess('Verification successful! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      setError(result.error || 'Verification failed');
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsResending(true);
    setError('');

    const result = await resendOtp(email);

    if (result.success) {
      setSuccess('New code sent! Check your email.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Failed to resend code');
    }

    setIsResending(false);
  };

  return (
    <AuthLayout title="">
      <div className="w-full max-w-sm mx-auto md:mx-0">
        
        <div className="text-center md:text-left mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F43F5E]/20 to-[#F43F5E]/5 rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-4">
            <Mail className="w-8 h-8 text-[#F43F5E]" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Check Your Email</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            We sent a 6-digit code to <span className="font-semibold text-gray-700">{email || 'your email'}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {!emailFromUrl && (
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

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900 text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
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
            className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#F43F5E]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[#F43F5E] font-bold hover:underline disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Wrong email?{' '}
          <Link href="/login" className="text-[#F43F5E] font-bold hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

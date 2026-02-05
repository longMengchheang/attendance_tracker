'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, Lock, ChevronLeft, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // STEP 1: Send Code
  const handleSendCode = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!email.includes('@')) {
          setError('Please enter a valid email address.');
          return;
      }
      setIsLoading(true);
      // Simulate API
      setTimeout(() => {
          setIsLoading(false);
          setStep(2);
      }, 1000);
  };

  // STEP 2: Verify OTP
  const handleOtpChange = (index: number, value: string) => {
      if (isNaN(Number(value))) return;
      
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next
      if (value && index < 5) {
          otpRefs.current[index + 1]?.focus();
      }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
          otpRefs.current[index - 1]?.focus();
      }
  };

  const handleVerifyOtp = () => {
      if (otp.some(digit => !digit)) {
          setError('Please enter the full 6-digit code.');
          return;
      }
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setStep(3);
      }, 1000);
  };

  // STEP 3: Reset Password
  const handleResetPassword = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (newPassword.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
      }
      if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          return;
      }
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          setStep(4);
      }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
      
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[#F43F5E] to-[#FDA4AF] opacity-80 z-20"></div>
        
        {/* Back Link (Only for Step 1) */}
        {step === 1 && (
            <Link href="/login" className="absolute top-8 left-8 text-gray-400 hover:text-gray-700 transition-colors z-30">
                <ChevronLeft size={24} />
            </Link>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-6 animate-fade-in pt-6 relative z-10">
                <div className="text-center">
                    <div className="w-16 h-16 bg-[#FFF0F3] rounded-full flex items-center justify-center mx-auto mb-4 text-[#F43F5E]">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Forgot Password?</h1>
                    <p className="text-gray-500 mt-2 text-sm">Enter your email address to verify your identity.</p>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <div className="relative group">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F43F5E] transition-colors">
                            <Mail size={18} />
                         </div>
                        <input 
                            type="email" 
                            placeholder="name@example.com"
                            className={`w-full bg-gray-50 border rounded-xl p-3 pl-10 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 outline-none transition-all shadow-inner text-gray-900 ${error ? 'border-red-300 ring-red-100' : 'border-gray-200 focus:border-[#F43F5E]'}`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                        />
                    </div>
                     {error && <p className="text-xs text-red-500 flex items-center gap-1 font-medium animate-pulse"><AlertCircle size={12}/> {error}</p>}
                </div>

                <button 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] hover:shadow-lg hover:shadow-[#F43F5E]/30 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? 'Sending...' : <>Send Verification Code <ArrowRight size={18} /></>}
                </button>
            </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
            <div className="space-y-8 animate-fade-in pt-6 relative z-10">
                 <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Enter Code</h1>
                    <p className="text-gray-500 mt-2 text-sm">We sent a 6-digit code to <span className="font-bold text-gray-800">{email}</span></p>
                </div>

                <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { otpRefs.current[i] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className="w-12 h-14 border border-gray-200 rounded-xl text-center text-xl font-bold bg-gray-50 focus:bg-white focus:border-[#F43F5E] focus:ring-2 focus:ring-[#F43F5E]/20 outline-none transition-all shadow-inner text-gray-900"
                        />
                    ))}
                </div>
                {error && <p className="text-center text-xs text-red-500 font-medium animate-pulse">{error}</p>}

                <button 
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] hover:shadow-lg hover:shadow-[#F43F5E]/30 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>

                <p className="text-center text-sm text-gray-500">
                    Didn't receive code? <button className="text-[#F43F5E] font-bold hover:underline transition-colors">Resend</button>
                </p>
            </div>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-fade-in pt-6 relative z-10">
                 <div className="text-center">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reset Password</h1>
                    <p className="text-gray-500 mt-2 text-sm">Choose a strong password for your account.</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">New Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                        />
                    </div>
                     {error && <p className="text-xs text-red-500 flex items-center gap-1 font-medium animate-pulse"><AlertCircle size={12}/> {error}</p>}
                </div>

                 <button 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] hover:shadow-lg hover:shadow-[#F43F5E]/30 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                    {isLoading ? 'Updating...' : 'Set New Password'}
                </button>
            </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
             <div className="text-center space-y-6 animate-fade-in pt-6 relative z-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-2">
                    <CheckCircle2 size={48} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Success!</h1>
                    <p className="text-gray-500 mt-2">Your password has been updated successfully.</p>
                </div>

                <Link href="/login" className="block w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    Back to Login
                </Link>
             </div>
        )}

      </div>
    </div>
  );
}

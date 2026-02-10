'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!agreed) {
      setError('You must agree to the Terms and Conditions.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await signup(formData.name, formData.email, formData.password, role);
    
    if (result.success) {
      // Redirect to verify email page
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&type=email`);
    } else {
      setError(result.error || 'Registration failed');
    }
    
    setIsSubmitting(false);
  };

  return (
    <AuthLayout title="">
      <div className="w-full max-w-sm mx-auto md:mx-0">
        
        <div className="text-center md:text-left mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">Join us to manage or track your classes</p>
        </div>

        {/* Role Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl flex mb-6 shadow-inner">
          <button 
            onClick={() => setRole('student')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${role === 'student' ? 'bg-white text-[#F43F5E] shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            Student
          </button>
          <button 
            onClick={() => setRole('teacher')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${role === 'teacher' ? 'bg-white text-[#F43F5E] shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            Teacher
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
           
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F43F5E] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
                placeholder="e.g. John Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F43F5E] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none transition-all shadow-inner text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>
           
          {error && <p className="text-xs text-red-500 flex items-center gap-1 font-medium animate-pulse"><AlertCircle size={14}/> {error}</p>}

          <div className="flex items-center gap-2 pt-2 ml-1">
            <input 
              type="checkbox" 
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-[#F43F5E] border-gray-300 rounded focus:ring-[#F43F5E] cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-gray-500 select-none cursor-pointer hover:text-gray-700 transition-colors">
              I agree to the <span className="font-bold text-gray-700">Terms and Conditions</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-[#F43F5E]/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#F43F5E] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

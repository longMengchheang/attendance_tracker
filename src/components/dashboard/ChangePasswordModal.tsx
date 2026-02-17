'use client';

import { useState, useEffect } from 'react';
import { X, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@supabase/supabase-js';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { user, logout } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
        setSuccess(false);
        setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Role-based colors
  const isStudent = user?.role === 'student';
  const primaryColor = isStudent ? '#3B82F6' : '#F43F5E';
  const primaryHover = isStudent ? '#2563EB' : '#E11D48';
  const focusRing = isStudent ? 'focus:ring-blue-200' : 'focus:ring-[#EE7F8F]';
  const linkColor = isStudent ? 'text-blue-600' : 'text-[#F43F5E]'; // unused for now if we remove forgot password link or keep it

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
    }

    if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        setIsLoading(false);
        return;
    }

    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
    }

    if (currentPassword === newPassword) {
        setError('New password cannot be the same as the current password');
        setIsLoading(false);
        return;
    }

    try {
        console.log('Starting verification...');
        // 1. Verify current password by verifying credentials directly
        if (!user?.email) {
            throw new Error('User email not found');
        }

        // Create a temporary client to verify password without affecting global session
        // This prevents the AuthContext from detecting a session change and interrupting the flow
        const tempSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
            { auth: { persistSession: false } }
        );

        console.log('Verifying credentials for:', user.email);
        const { error: signInError } = await tempSupabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            console.log('Verification failed:', signInError);
            setError('Incorrect current password');
            setIsLoading(false);
            return;
        }

        console.log('Verification successful. Updating password...');
        // 2. Update to new password using the SAME temp client which is now definitely authenticated
        const { error: updateError } = await tempSupabase.auth.updateUser({
            password: newPassword
        });
        
        console.log('Update result error:', updateError);
        
        if (updateError) {
            setError(updateError.message || 'Failed to update password');
            setIsLoading(false);
            return;
        }

        // 3. Handle success
        setSuccess(true);
        setIsLoading(false);

        // 4. Always logout after password change
        console.log('Logging out...');
        setTimeout(() => {
            logout();
        }, 1500);

    } catch (err: any) {
        console.error('Error in change password flow:', err);
        setError(err.message || 'An unexpected error occurred');
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lock size={20} style={{ color: primaryColor }} />
                Change Password
            </h2>
            <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
                type="button"
            >
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
             
             {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                    {error}
                </div>
             )}

             {success && (
                <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100">
                    Password updated successfully! Logging out...
                </div>
             )}

             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full bg-white border border-gray-200 rounded-lg p-3 focus:ring-2 ${focusRing} outline-none text-gray-900`}
                    placeholder="Enter current password"
                    disabled={isLoading || success}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full bg-white border border-gray-200 rounded-lg p-3 focus:ring-2 ${focusRing} outline-none text-gray-900`}
                    placeholder="Enter new password"
                    disabled={isLoading || success}
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-white border border-gray-200 rounded-lg p-3 focus:ring-2 ${focusRing} outline-none text-gray-900`}
                    placeholder="Confirm new password"
                    disabled={isLoading || success}
                />
            </div>
        
            {/* Footer */}
            <div className="pt-4 flex justify-end gap-3">
                <button 
                    type="button"
                    onClick={onClose}
                    disabled={isLoading || success}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    disabled={isLoading || success}
                    className="px-4 py-2 text-white font-bold rounded-lg transition-all shadow-sm disabled:opacity-70 flex items-center justify-center min-w-[100px]"
                    style={{ backgroundColor: primaryColor }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = primaryHover}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                >
                    {isLoading ? 'Updating...' : 'Update Password'}
                </button>
            </div>
        </form>

      </div>
    </div>
  );
}


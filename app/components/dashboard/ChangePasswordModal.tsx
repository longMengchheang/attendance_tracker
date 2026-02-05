'use client';

import { X, Lock } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lock size={20} className="text-[#F43F5E]" />
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
        <div className="p-6 space-y-4">
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input 
                    type="password" 
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#EE7F8F] outline-none text-gray-900"
                    placeholder="Enter current password"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input 
                    type="password" 
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#EE7F8F] outline-none text-gray-900"
                    placeholder="Enter new password"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input 
                    type="password" 
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#EE7F8F] outline-none text-gray-900"
                    placeholder="Confirm new password"
                />
            </div>

            <div className="flex justify-end pt-2">
                <a href="#" className="text-sm text-[#F43F5E] hover:underline">Forgot password?</a>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
             <button 
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                type="button"
             >
                Cancel
             </button>
             <button 
                onClick={onClose}
                className="px-4 py-2 bg-[#F43F5E] text-white font-bold rounded-lg hover:bg-[#E11D48] transition-all shadow-sm"
                type="button"
             >
                Update Password
             </button>
        </div>

      </div>
    </div>
  );
}

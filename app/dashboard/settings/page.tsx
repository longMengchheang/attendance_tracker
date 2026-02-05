'use client';

import { useState } from 'react';
import { UserCircle, Lock, Camera, CheckCircle2, Shield } from 'lucide-react';
import ChangePasswordModal from '@/app/components/dashboard/ChangePasswordModal';

export default function SettingsPage() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate API call
      setTimeout(() => {
          setShowSuccess(true);
          setHasChanges(false);
          setTimeout(() => setShowSuccess(false), 3000);
      }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

       {/* Page Header */}
       <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your profile and security preferences</p>
       </div>

       <div className="grid grid-cols-1 gap-8">
            
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">Profile Information</h2>
                    {showSuccess && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium animate-fade-in">
                            <CheckCircle2 size={16} />
                            Saved successfully
                        </div>
                    )}
                </div>
                
                <div className="p-8">
                    <div className="flex items-start gap-6 mb-8">
                        <div className="relative group cursor-pointer">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-2 border-white shadow-md overflow-hidden">
                                <UserCircle size={80} className="text-gray-300" />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Mengchheang</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF0F3] text-[#F43F5E] border border-[#F43F5E]/20">
                                    Teacher
                                </span>
                                <span className="text-gray-500 text-sm">meng@school.edu</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6 max-w-lg">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                            <input 
                                type="text" 
                                defaultValue="Mengchheang"
                                onChange={() => setHasChanges(true)}
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#F43F5E]/20 focus:border-[#F43F5E] outline-none text-gray-900 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    defaultValue="meng@school.edu"
                                    readOnly
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-gray-500 outline-none cursor-not-allowed select-none"
                                />
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400">Contact admin to change email address.</p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="block text-sm font-semibold text-gray-700">Password</label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-400 font-mono tracking-widest text-sm flex items-center">
                                    ••••••••••••
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="px-4 py-3 border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm whitespace-nowrap"
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-50">
                            <button 
                                type="submit" 
                                disabled={!hasChanges}
                                className={`px-6 py-3 font-bold rounded-lg transition-all shadow-sm ${
                                    hasChanges 
                                    ? 'bg-[#F43F5E] text-white hover:bg-[#E11D48] hover:shadow-md' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Security Note (Optional) */}
            <div className="bg-[#FFF0F3] rounded-lg p-4 border border-[#F43F5E]/20 flex gap-4 items-start">
                <Shield className="text-[#F43F5E] shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-[#9F1239] text-sm">Account Security</h4>
                    <p className="text-[#BE123C] text-sm mt-1">Two-factor authentication is currently disabled. Enable it to add an extra layer of security to your account.</p>
                </div>
            </div>

       </div>

       <ChangePasswordModal 
         isOpen={isPasswordModalOpen} 
         onClose={() => setIsPasswordModalOpen(false)} 
       />

    </div>
  );
}

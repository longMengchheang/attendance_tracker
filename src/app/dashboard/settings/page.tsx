'use client';

import { useState } from 'react';
import { User, Shield, ChevronRight, Lock } from 'lucide-react';
import ChangePasswordModal from '@/components/dashboard/ChangePasswordModal';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Determine theme based on role
  const isTeacher = user?.role === 'teacher';
  
  // Theme-specific classes
  const styles = {
    badge: isTeacher 
      ? 'bg-red-50 text-red-600 border-red-100' 
      : 'bg-blue-50 text-blue-600 border-blue-100',
    accentBorder: isTeacher ? 'border-t-red-500' : 'border-t-blue-500',
    iconBg: isTeacher ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500',
    textAccent: isTeacher ? 'text-red-500' : 'text-blue-500',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile information and security preferences.</p>
      </div>

      {/* Profile Information Card */}
      <div className={`bg-white border border-gray-200 rounded-xl p-8 ${styles.accentBorder} border-t-2 shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Avatar Section - Better Alignment */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4 pt-1">
            <div className={`w-20 h-20 rounded-full ${styles.iconBg} flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-gray-100`}>
              <User size={36} strokeWidth={2} />
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${styles.badge}`}>
              {user?.role || 'User'}
            </span>
          </div>

            {/* Form Section */}
          <div className="flex-1 w-full space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
            </div>

            <div className="grid gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative group">
                    <input
                      type="text"
                      value={user?.name || ''}
                      readOnly
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed select-none focus:outline-none"
                    />
                    <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Name cannot be changed. Contact administrator for assistance.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-500 cursor-not-allowed select-none focus:outline-none"
                  />
                  <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Email address cannot be changed. Contact administrator for assistance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
            <Shield size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Security</h2>
        </div>

        {/* Interactive Password Row */}
        <div 
          onClick={() => setIsPasswordModalOpen(true)}
          className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 transition-colors">
                <Lock size={18} />
             </div>
             <div>
                <div className="font-semibold text-gray-900">Password</div>
             </div>
          </div>
          
          <div className={`flex items-center gap-2 text-sm font-medium ${styles.textAccent} opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300`}>
            Change Password
            <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* Models */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

    </div>
  );
}


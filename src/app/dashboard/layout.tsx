'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import StudentSidebar from '@/components/StudentSidebar';
import { useAuth } from '@/context/AuthContext';

// NOTE: Dashboard is role-based.
// Do not create separate routes per role.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#F43F5E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Role-based sidebar rendering
  // Teacher sidebar (existing) vs Student sidebar (new)
  const SidebarComponent = user.role === 'student' ? StudentSidebar : Sidebar;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <SidebarComponent />
      <div className="flex-1 ml-60 flex flex-col">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}




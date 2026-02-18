'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, Users, Settings, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ongoing Class', href: '/dashboard/ongoing-class', icon: Clock },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },

];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 bg-[#F43F5E] text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto font-sans">
      {/* User Profile Section */}
      <div className="p-6 flex items-center space-x-3 border-b border-white/10">
        <div className="bg-white/20 p-2 rounded-full">
            <UserCircle size={32} />
        </div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">{user?.name || 'Teacher'}</h2>
          <p className="text-xs text-white/70 uppercase tracking-wider font-medium">Teacher</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white text-[#F43F5E] shadow-sm font-bold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? "stroke-[2.5px]" : ""} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-left text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
            <LogOut size={20} />
            <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}


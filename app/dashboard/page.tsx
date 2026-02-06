'use client';

import { useState } from 'react';
import StatCard from '@/app/components/dashboard/StatCard';
import CreateClassModal from '@/app/components/dashboard/CreateClassModal';
import ClassDetailsModal from '@/app/components/dashboard/ClassDetailsModal';
import DeleteClassModal from '@/app/components/dashboard/DeleteClassModal';
import StudentDashboardPage from '@/app/components/dashboard/StudentDashboardPage';
import { MapPin, Users, MoreVertical, FileText, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

// Mock Data
const classes = [
  {
    id: 1,
    name: 'Machine Learning',
    code: 'ZS-AKD',
    location: 'KIT Phnom Penh Campus',
    radius: '100m',
    students: 20
  },
  {
    id: 2,
    name: 'Web Development',
    code: 'WD-2024',
    location: 'Building A, Room 302',
    radius: '50m',
    students: 35
  },
  {
    id: 3,
    name: 'Data Structures',
    code: 'DS-ALGO',
    location: 'Online / Remote',
    radius: 'N/A',
    students: 42
  },
  {
    id: 4,
    name: 'Mobile App Dev',
    code: 'MAD-24',
    location: 'Lab 2, KIT Campus',
    radius: '100m',
    students: 18
  },
  {
    id: 5,
    name: 'Cloud Computing',
    code: 'CC-AWS',
    location: 'Main Hall',
    radius: '150m',
    students: 25
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<typeof classes[0] | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleMenuClick = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleAction = (e: React.MouseEvent, action: 'view' | 'edit' | 'delete', cls: typeof classes[0]) => {
      e.stopPropagation();
      setActiveMenuId(null);
      setSelectedClass(cls);
      if (action === 'view') setIsDetailsOpen(true);
      if (action === 'edit') setIsEditOpen(true);
      if (action === 'delete') setIsDeleteOpen(true);
  };

  // Role-based rendering: Students see StudentDashboardPage
  // Teachers see the existing dashboard below (unchanged)
  if (user?.role === 'student') {
    return <StudentDashboardPage />;
  }

  // Teacher dashboard (existing code - unchanged)
  return (
    <div className="space-y-12" onClick={() => setActiveMenuId(null)}>
      {/* Greeting Section */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Good afternoon, Mengchheang 👋</h1>
        <p className="text-gray-500 mt-2">Here's what's happening with your classes today</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <CreateClassModal />
        <StatCard 
            icon="calendar" 
            label="Total Classes" 
            value="5" 
        />
        <StatCard 
            icon="users" 
            label="Total Students" 
            value="122" 
        />
      </div>

      {/* Your Classes Section */}
      <div>
        <div className="mb-6">
             <h2 className="text-xl font-bold text-gray-800">Your Classes ({classes.length})</h2>
             <p className="text-sm text-gray-500 mt-1">Manage and monitor your courses</p>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {classes.map((cls) => (
            <div 
                key={cls.id} 
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all duration-300"
            >
                {/* Header: Name and Menu */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 truncate pr-8">{cls.name}</h3>
                    
                    <div className="relative">
                        <button 
                            onClick={(e) => handleMenuClick(e, cls.id)}
                            className="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-50"
                        >
                            <MoreVertical size={20} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeMenuId === cls.id && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden animate-fade-in origin-top-right">
                                <button 
                                    onClick={(e) => handleAction(e, 'view', cls)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Eye size={16} className="text-gray-400" /> View Details
                                </button>
                                <button 
                                    onClick={(e) => handleAction(e, 'edit', cls)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit size={16} className="text-gray-400" /> Edit Class
                                </button>
                                <button 
                                    onClick={(e) => handleAction(e, 'delete', cls)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                >
                                    <Trash2 size={16} /> Delete Class
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Code Badge */}
                <div className="inline-block bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-xs font-mono font-bold border border-gray-100 mb-6">
                    [{cls.code}]
                </div>

                {/* Footer Info */}
                <div className="space-y-2 text-gray-500 text-sm">
                    <div className="flex items-center gap-2.5 truncate">
                        <MapPin size={16} className="text-[#F43F5E] shrink-0" />
                        <span className="truncate">{cls.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Users size={16} className="text-[#F43F5E] shrink-0" />
                        <span>{cls.students} students</span>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>
      
      {/* Modals */}
      <ClassDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        classData={selectedClass} 
      />

      {isEditOpen && selectedClass && (
        <CreateClassModal 
            isOpenControlled={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            initialData={{
                name: selectedClass.name,
                code: selectedClass.code,
                location: selectedClass.location,
                radius: selectedClass.radius === 'N/A' ? '0' : selectedClass.radius.replace('m', ''),
            }}
        />
      )}

      <DeleteClassModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        className={selectedClass?.name || 'Class'}
      />

    </div>
  );
}



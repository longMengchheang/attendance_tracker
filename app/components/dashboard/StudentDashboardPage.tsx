'use client';

import { useState } from 'react';
import StatCard from '@/app/components/dashboard/StatCard';
import JoinClassModal from '@/app/components/dashboard/JoinClassModal';
import ClassDetailsModal from '@/app/components/dashboard/ClassDetailsModal';
import { MapPin, Users, BookOpen, Eye } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

// Mock Data - Classes the student is enrolled in
const enrolledClasses = [
  {
    id: 1,
    name: 'Machine Learning',
    code: 'ZS-AKD',
    location: 'KIT Phnom Penh Campus',
    radius: '100m',
    teacher: 'Dr. Mengchheang',
    students: 20
  },
  {
    id: 2,
    name: 'Web Development',
    code: 'WD-2024',
    location: 'Building A, Room 302',
    radius: '50m',
    teacher: 'Prof. Smith',
    students: 35
  },
  {
    id: 3,
    name: 'Data Structures',
    code: 'DS-ALGO',
    location: 'Online / Remote',
    radius: 'N/A',
    teacher: 'Dr. Johnson',
    students: 42
  },
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<typeof enrolledClasses[0] | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleViewDetails = (cls: typeof enrolledClasses[0]) => {
    setSelectedClass(cls);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-12">
      {/* Greeting Section */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Welcome back, {user?.name || 'Student'} 👋</h1>
        <p className="text-gray-500 mt-2">Here's an overview of your enrolled classes</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <JoinClassModal />
        <StatCard 
            icon="calendar" 
            label="Enrolled Classes" 
            value={String(enrolledClasses.length)} 
        />
        <StatCard 
            icon="users" 
            label="Attendance Rate" 
            value="92%" 
        />
      </div>

      {/* Your Classes Section */}
      <div>
        <div className="mb-6">
             <h2 className="text-xl font-bold text-gray-800">Your Classes ({enrolledClasses.length})</h2>
             <p className="text-sm text-gray-500 mt-1">Classes you are enrolled in</p>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {enrolledClasses.map((cls) => (
            <div 
                key={cls.id} 
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all duration-300"
            >
                {/* Header: Name and View Button */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 truncate pr-8">{cls.name}</h3>
                    <button 
                        onClick={() => handleViewDetails(cls)}
                        className="text-gray-300 hover:text-[#3B82F6] transition-colors p-1 rounded-full hover:bg-blue-50"
                        title="View Details"
                    >
                        <Eye size={20} />
                    </button>
                </div>

                {/* Code Badge */}
                <div className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-mono font-bold border border-blue-100 mb-6">
                    [{cls.code}]
                </div>

                {/* Footer Info */}
                <div className="space-y-2 text-gray-500 text-sm">
                    <div className="flex items-center gap-2.5 truncate">
                        <MapPin size={16} className="text-[#3B82F6] shrink-0" />
                        <span className="truncate">{cls.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <BookOpen size={16} className="text-gray-400 shrink-0" />
                        <span className="text-gray-400 text-xs">{cls.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Users size={16} className="text-[#3B82F6] shrink-0" />
                        <span>{cls.students} students</span>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* Class Details Modal */}
      <ClassDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        classData={selectedClass} 
      />
    </div>
  );
}


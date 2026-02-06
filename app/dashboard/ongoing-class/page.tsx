'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import StudentOngoingClassPage from '@/app/components/dashboard/StudentOngoingClassPage';

// Mock Data for Teacher view
const students = [
  { id: 1, name: 'Sokheng Vong', time: '08:30 AM', status: 'Present', avatar: 'S' },
  { id: 2, name: 'Sovannarith Keo', time: '08:32 AM', status: 'Present', avatar: 'S' },
  { id: 3, name: 'Reachny Sorn', time: '09:15 AM', status: 'Late', avatar: 'R' },
  { id: 4, name: 'Kimlong Chhun', time: '--:--', status: 'Absent', avatar: 'K' },
  { id: 5, name: 'Sophea Oun', time: '08:28 AM', status: 'Present', avatar: 'S' },
  { id: 6, name: 'Dara Chan', time: '--:--', status: 'Absent', avatar: 'D' },
  { id: 7, name: 'Vicheka Ly', time: '09:45 AM', status: 'Late', avatar: 'V' },
  { id: 8, name: 'Ashley', time: '08:30 AM', status: 'Present', avatar: 'A' },
  { id: 9, name: 'Ashley', time: '--:--', status: 'Absent', avatar: 'A' },
  { id: 10, name: 'Ashley', time: '09:30 AM', status: 'Late', avatar: 'A' },
];

export default function OngoingClassPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');

  // Role-based rendering: Students see check-in view, Teachers see attendance list
  if (user?.role === 'student') {
    return <StudentOngoingClassPage />;
  }

  const filteredStudents = students.filter(s => {
      if (filter === 'All') return true;
      if (filter === 'Not Checked In') return s.status === 'Absent';
      if (filter === 'Checked In') return s.status === 'Present' || s.status === 'Late';
      return true;
  });

  const stats = {
      present: students.filter(s => s.status === 'Present').length,
      absent: students.filter(s => s.status === 'Absent').length,
      late: students.filter(s => s.status === 'Late').length,
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Present': return 'bg-emerald-500';
          case 'Late': return 'bg-orange-400';
          case 'Absent': return 'bg-gray-300';
          default: return 'bg-gray-300';
      }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Present': return 'bg-emerald-100 text-emerald-700';
          case 'Late': return 'bg-orange-100 text-orange-700';
          case 'Absent': return 'bg-rose-100 text-rose-700';
          default: return 'bg-gray-100 text-gray-500';
      }
  };

  return (
    <div className="animate-fade-in pb-12">           
    
            {/* Title */}
            <h2 className="text-3xl text-center font-bold text-[#F43F5E] mb-10">Machine Learning</h2>

            Filter Tabs
            <div className="flex justify-center mb-10">
                <div className="flex bg-gray-100 p-1 rounded-xl w-full max-w-xl shadow-inner">
                    {['All', 'Not Checked In', 'Checked In'].map((tab) => {
                        const count = tab === 'All' ? students.length : 
                                      tab === 'Not Checked In' ? stats.absent : 
                                      stats.present + stats.late;
                        const isActive = filter === tab;

                        return (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                                    isActive 
                                    ? 'bg-white text-[#F43F5E] shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
                                }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Student List */}
            <div className="space-y-3 max-w-4xl mx-auto">
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-medium">No students found.</p>
                    </div>
                ) : filteredStudents.map((student) => (
                    <div 
                        key={student.id} 
                        className="group bg-white border border-gray-100 rounded-xl flex items-center p-3 hover:shadow-md hover:border-[#F43F5E]/20 transition-all duration-200 cursor-pointer"
                    >
                        {/* Status Dot */}
                        <div className="pl-2 pr-4">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(student.status)}`}></div>
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                            {student.avatar}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col ml-4 flex-1">
                            <span className="font-bold text-gray-900 group-hover:text-[#F43F5E] transition-colors">{student.name}</span>
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                {student.status !== 'Absent' ? `Checked in: ${student.time}` : 'Not checked in'}
                            </span>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(student.status)}`}>
                            {student.status}
                        </div>
                    </div>
                ))}
            </div>

    </div>
  );
}

'use client';

import { useState } from 'react';
import { UserCircle, Search, Filter, ChevronDown } from 'lucide-react';
import StudentSummaryModal from '@/app/components/dashboard/StudentSummaryModal';

// Mock Data
const students = Array.from({ length: 12 }, (_, i) => ({
    id: `ST-2024-${String(i + 1).padStart(3, '0')}`,
    name: ['Ashley Cooper', 'Brad Pitt', 'Charlie Puth', 'Diana Ross', 'Ethan Hunt', 'Fiona Gallagher'][i % 6],
    email: `student${i + 1}@school.edu`,
    batch: '2024',
    status: 'Enrolled',
    enrolledClasses: ['Machine Learning', 'Web Development'],
    attendance: { present: 15 + i, absent: 2, late: 1 }
}));

export default function StudentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState('All Students');
  const [selectedStudent, setSelectedStudent] = useState<typeof students[0] | null>(null);

  // Filter Logic (Mock)
  const filteredStudents = students.filter(student => {
      // Search matches
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter matches
      const matchesFilter = filterBatch === 'All Students' || student.batch === filterBatch.replace('Batch ', '');

      return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500 text-sm mt-1">View enrolled students and attendance summary</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
             {/* Simple Dropdown Filter */}
             <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Filter size={16} />
                </div>
                <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]/20 hover:border-gray-300 transition-colors appearance-none cursor-pointer min-w-[160px]"
                >
                    <option>All Students</option>
                    <option>Batch 2024</option>
                    <option>Batch 2023</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={14} />
                </div>
             </div>

             {/* Search */}
             <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by name, ID, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F43F5E]/20 focus:bg-white transition-all placeholder:text-gray-500"
                />
             </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4 pl-2">Student</div>
            <div className="col-span-7 sm:col-span-8">Contact Information</div>
        </div>

        <div className="divide-y divide-gray-50">
            {filteredStudents.map((student) => (
                <div 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)}
                    className="grid grid-cols-12 gap-4 p-4 hover:shadow-md hover:-translate-y-[2px] hover:bg-white hover:z-10 relative transition-all duration-200 cursor-pointer group items-center bg-white border-b border-transparent hover:border-gray-100"
                >
                    {/* Name Column */}
                    <div className="col-span-5 sm:col-span-4 flex items-center gap-4 pl-2">
                         <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 border border-gray-100 group-hover:bg-[#FFF0F3] group-hover:text-[#F43F5E] group-hover:border-[#F43F5E]/20 transition-colors">
                            <UserCircle size={28} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#F43F5E] transition-colors">{student.name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{student.id}</p>
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="col-span-7 sm:col-span-8 flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500 pr-2">
                        <span className="font-medium text-gray-600">{student.email}</span>
                        <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 bg-gray-50 text-gray-500 group-hover:bg-white group-hover:border-gray-300 transition-colors">
                            Batch {student.batch}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Modal */}
      <StudentSummaryModal 
        isOpen={!!selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
        student={selectedStudent} 
      />

    </div>
  );
}

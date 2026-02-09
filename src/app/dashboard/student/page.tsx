'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCircle, Search, Loader2, Users } from 'lucide-react';
import StudentSummaryModal from '@/components/dashboard/StudentSummaryModal';
import { useAuth } from '@/context/AuthContext';
import { fetchAllTeacherStudents, Student } from '@/lib/api';

// Extended student type for UI display
interface StudentWithUI extends Student {
  status?: string;
  enrolledClasses?: string[];
  attendance?: { present: number; absent: number; late: number };
}

export default function StudentPage() {
  const { user } = useAuth();
  
  // State for students
  const [students, setStudents] = useState<StudentWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUI | null>(null);

  // Fetch students from API
  const loadStudents = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchAllTeacherStudents(user.id);
      // Add UI-specific fields
      const studentsWithUI: StudentWithUI[] = data.map((s) => ({
        ...s,
        status: 'Enrolled',
      }));
      setStudents(studentsWithUI);
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load students on mount
  useEffect(() => {
    if (user?.id) {
      loadStudents();
    }
  }, [user?.id, loadStudents]);

  // Filter Logic - search only
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F43F5E] mx-auto mb-4" />
          <p className="text-gray-500">Loading students...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={loadStudents}
            className="px-4 py-2 bg-[#F43F5E] text-white rounded-lg hover:bg-[#E11D48] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500 text-sm mt-1">View enrolled students and attendance summary</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
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

        {/* Empty state */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {students.length === 0 ? 'No students yet' : 'No matching students'}
            </h3>
            <p className="text-gray-500">
              {students.length === 0 
                ? 'Students will appear here once they join your classes'
                : 'Try adjusting your search criteria'
              }
            </p>
          </div>
        ) : (
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
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{student.id.slice(0, 8).toUpperCase()}</p>
                          </div>
                      </div>

                      {/* Info Column */}
                      <div className="col-span-7 sm:col-span-8 flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500 pr-2">
                          <span className="font-medium text-gray-600">{student.email}</span>
                      </div>
                  </div>
              ))}
          </div>
        )}
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

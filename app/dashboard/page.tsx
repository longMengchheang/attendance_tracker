'use client';

import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/app/components/dashboard/StatCard';
import CreateClassModal from '@/app/components/dashboard/CreateClassModal';
import ClassDetailsModal from '@/app/components/dashboard/ClassDetailsModal';
import DeleteClassModal from '@/app/components/dashboard/DeleteClassModal';
import StudentDashboardPage from '@/app/components/dashboard/StudentDashboardPage';
import { MapPin, Users, MoreVertical, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { fetchTeacherClasses, fetchClassStudents, Class } from '@/lib/api';

// Extended class type for UI display
interface ClassWithUI extends Class {
  students?: number;
  studentIds?: string[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  // State for classes
  const [classes, setClasses] = useState<ClassWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithUI | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch classes from API
  const loadClasses = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchTeacherClasses(user.id);
      
      // Fetch student counts for each class
      const classesWithStudents = await Promise.all(
        data.map(async (cls) => {
          try {
            const students = await fetchClassStudents(cls.id, user.id!);
            return { 
              ...cls, 
              students: students.length,
              studentIds: students.map(s => s.id)
            };
          } catch {
            return { ...cls, students: 0, studentIds: [] };
          }
        })
      );
      
      setClasses(classesWithStudents);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load classes on mount
  useEffect(() => {
    if (user?.role === 'teacher' && user?.id) {
      loadClasses();
    }
  }, [user?.id, user?.role, loadClasses]);

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleAction = (e: React.MouseEvent, action: 'view' | 'edit' | 'delete', cls: ClassWithUI) => {
      e.stopPropagation();
      setActiveMenuId(null);
      setSelectedClass(cls);
      if (action === 'view') setIsDetailsOpen(true);
      if (action === 'edit') setIsEditOpen(true);
      if (action === 'delete') setIsDeleteOpen(true);
  };

  // Role-based rendering: Students see StudentDashboardPage
  if (user?.role === 'student') {
    return <StudentDashboardPage />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F43F5E] mx-auto mb-4" />
          <p className="text-gray-500">Loading your classes...</p>
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
            onClick={loadClasses}
            className="px-4 py-2 bg-[#F43F5E] text-white rounded-lg hover:bg-[#E11D48] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Teacher dashboard
  return (
    <div className="space-y-12" onClick={() => setActiveMenuId(null)}>
      {/* Greeting Section */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Good afternoon, {user?.name || 'Teacher'} 👋</h1>
        <p className="text-gray-500 mt-2">Here's what's happening with your classes today</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <CreateClassModal onSuccess={loadClasses} />
        <StatCard 
            icon="calendar" 
            label="Total Classes" 
            value={String(classes.length)} 
        />
        <StatCard 
            icon="users" 
            label="Total Students" 
            value={String(new Set(classes.flatMap(cls => cls.studentIds || [])).size)} 
        />
      </div>

      {/* Your Classes Section */}
      <div>
        <div className="mb-6">
             <h2 className="text-xl font-bold text-gray-800">Your Classes ({classes.length})</h2>
             <p className="text-sm text-gray-500 mt-1">Manage and monitor your courses</p>
        </div>
       
        {/* Empty state */}
        {classes.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No classes yet</h3>
            <p className="text-gray-500 mb-4">Create your first class to get started</p>
          </div>
        ) : (
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
                          <span className="truncate">{cls.location || 'Location not set'}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                          <Users size={16} className="text-[#F43F5E] shrink-0" />
                          <span>{cls.students ?? 0} students</span>
                      </div>
                  </div>
              </div>
              ))}
          </div>
        )}
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
                location: '',
                radius: 100,
            }}
            classId={selectedClass.id}
            onSuccess={loadClasses}
        />
      )}

      <DeleteClassModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        className={selectedClass?.name || 'Class'}
        classId={selectedClass?.id}
        onSuccess={loadClasses}
      />

    </div>
  );
}

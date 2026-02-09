'use client';

import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import JoinClassModal from '@/components/dashboard/JoinClassModal';
import ClassDetailsModal from '@/components/dashboard/ClassDetailsModal';
import { MapPin, Users, BookOpen, Eye, Loader2, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentEnrollments, Enrollment } from '@/lib/api';

// Extended enrollment type for UI display
interface EnrollmentWithUI extends Enrollment {
  // All data now comes from the Enrollment interface directly
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  
  // State for enrollments
  const [enrollments, setEnrollments] = useState<EnrollmentWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [selectedClass, setSelectedClass] = useState<EnrollmentWithUI | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch enrollments from API
  const loadEnrollments = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchStudentEnrollments(user.id);
      setEnrollments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load enrollments on mount
  useEffect(() => {
    if (user?.id) {
      loadEnrollments();
    }
  }, [user?.id, loadEnrollments]);

  const handleViewDetails = (enrollment: EnrollmentWithUI) => {
    setSelectedClass(enrollment);
    setIsDetailsOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto mb-4" />
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
            onClick={loadEnrollments}
            className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Greeting Section */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Welcome back, {user?.name || 'Student'} 👋</h1>
        <p className="text-gray-500 mt-2">Here's an overview of your enrolled classes</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <JoinClassModal onSuccess={loadEnrollments} />
        <StatCard 
            icon="calendar" 
            label="Enrolled Classes" 
            value={String(enrollments.length)} 
        />
        <StatCard 
            icon="users" 
            label="Attendance Rate" 
            value="--%" 
        />
      </div>

      {/* Your Classes Section */}
      <div>
        <div className="mb-6">
             <h2 className="text-xl font-bold text-gray-800">Your Classes ({enrollments.length})</h2>
             <p className="text-sm text-gray-500 mt-1">Classes you are enrolled in</p>
        </div>
       
        {/* Empty state */}
        {enrollments.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No classes yet</h3>
            <p className="text-gray-500 mb-4">Join your first class using a code from your teacher</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
              <div 
                  key={enrollment.enrollmentId} 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all duration-300"
              >
                  {/* Header: Name and View Button */}
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800 truncate pr-8">{enrollment.className}</h3>
                      <button 
                          onClick={() => handleViewDetails(enrollment)}
                          className="text-gray-300 hover:text-[#3B82F6] transition-colors p-1 rounded-full hover:bg-blue-50"
                          title="View Details"
                      >
                          <Eye size={20} />
                      </button>
                  </div>

                  {/* Code Badge - Only visible to teachers */}
                  {user?.role === 'teacher' && (
                    <div className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-mono font-bold border border-blue-100 mb-6">
                        [{enrollment.classCode}]
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="space-y-2 text-gray-500 text-sm">
                      <div className="flex items-center gap-2.5 truncate">
                          <MapPin size={16} className="text-[#3B82F6] shrink-0" />
                          <span className="truncate">{enrollment.location || 'Location not set'}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                          <UserCircle size={16} className="text-[#3B82F6] shrink-0" />
                          <span>Teacher {enrollment.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                          <Users size={16} className="text-[#3B82F6] shrink-0" />
                          <span>{enrollment.studentCount} students</span>
                      </div>
                  </div>
              </div>
              ))}
          </div>
        )}
      </div>

      {/* Class Details Modal */}
      <ClassDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        classData={selectedClass ? {
          id: selectedClass.classId,
          name: selectedClass.className,
          code: selectedClass.classCode,
          description: selectedClass.classDescription,
          location: selectedClass.location,
          latitude: selectedClass.latitude,
          longitude: selectedClass.longitude,
          radius: selectedClass.radius,
          students: selectedClass.studentCount,
        } : null} 
      />
    </div>
  );
}

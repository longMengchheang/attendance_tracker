'use client';

import { X, UserCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt?: string;
  status?: string;
  enrolledClasses?: string[];
  attendance?: {
    present: number;
    absent: number;
    late: number;
  };
}

interface StudentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export default function StudentSummaryModal({ isOpen, onClose, student }: StudentSummaryModalProps) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 border border-gray-100 shadow-sm">
                <UserCircle size={48} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{student.name}</h2>
                <p className="text-sm text-gray-500 font-mono mt-1">ID: {student.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
            
            {/* Section 1: Info (Read-Only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                     <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Email</p>
                     <p className="text-gray-900 font-medium truncate" title={student.email}>{student.email}</p>
                </div>
                 <div>
                     <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Status</p>
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {student.status || 'Enrolled'}
                     </span>
                </div>
            </div>

            <div className="border-t border-gray-50"></div>

            {/* Section 2: Enrolled Classes */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    Enrolled Classes
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{student.enrolledClasses?.length ?? 0}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                    {(student.enrolledClasses?.length ?? 0) > 0 ? (
                        student.enrolledClasses?.map((cls, idx) => (
                            <span 
                                key={idx} 
                                className="px-3 py-1.5 rounded-lg border border-[#F43F5E]/20 bg-[#F43F5E]/5 text-[#F43F5E] text-xs font-medium"
                            >
                                {cls}
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm italic">No classes assigned yet.</p>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-50"></div>

            {/* Section 3: Attendance Summary */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Attendance Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-center">
                        <CheckCircle2 size={20} className="text-green-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-green-700">{student.attendance?.present ?? '--'}</p>
                        <p className="text-xs text-green-600 font-medium">Present</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100 text-center">
                        <XCircle size={20} className="text-red-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-red-600">{student.attendance?.absent ?? '--'}</p>
                        <p className="text-xs text-red-500 font-medium">Absent</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-center">
                        <Clock size={20} className="text-orange-500 mx-auto mb-1" />
                        <p className="text-xl font-bold text-orange-600">{student.attendance?.late ?? '--'}</p>
                        <p className="text-xs text-orange-500 font-medium">Late</p>
                    </div>
                </div>
            </div>

        </div>



      </div>
    </div>
  );
}

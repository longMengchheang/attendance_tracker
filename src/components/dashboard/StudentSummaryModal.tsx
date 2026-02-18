'use client';

import { useState } from 'react';
import { X, UserCircle, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';

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
    score?: number;
    attendancePercentage?: number;
  };
}

interface StudentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onRemove?: (studentId: string) => void;
}

export default function StudentSummaryModal({ isOpen, onClose, student, onRemove }: StudentSummaryModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen || !student) return null;


    
  // Default values if missing
  const score = student.attendance?.score ?? 0;
  const rate = student.attendance?.attendancePercentage ?? 0;

  // Determine rate color
  const rateColor = rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-orange-500' : 'text-red-400';
  const progressBarColor = rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-orange-500' : 'bg-red-400';

  const handleRemoveClick = () => {
    setIsConfirming(true);
  };

  const handleConfirmRemove = () => {
    if (onRemove) {
        onRemove(student.id);
    }
    setIsConfirming(false);
    onClose();
  };

  const handleCancelRemove = () => {
    setIsConfirming(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all relative">
        
        {/* Overlay for Confirmation */}
        {isConfirming && (
            <div className="absolute inset-0 bg-white/98 z-20 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-5 shadow-sm">
                    <Trash2 size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Student?</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-[260px] mx-auto">
                    Are you sure you want to remove <span className="font-semibold text-gray-800">{student.name}</span> from this class? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                    <button 
                        onClick={handleCancelRemove}
                        className="flex-1 py-3 bg-gray-50 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmRemove}
                        className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                    >
                        Remove
                    </button>
                </div>
            </div>
        )}

        {/* Header Section - Clean & Stacked */}
        <div className="p-6 pb-2 relative">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 text-gray-300 hover:text-gray-600 bg-transparent hover:bg-gray-50 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm shrink-0">
                <UserCircle size={48} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight truncate">{student.name}</h2>
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-gray-400 font-mono tracking-wide">ID: {student.id.substring(0, 12)}</p>
                </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="px-6 pt-2 pb-6 space-y-6">
            
            {/* Class Info & Attendance Rate - Two Column Layout */}
            <div className="space-y-3 py-1">
                <div className="flex justify-between items-center px-1">
                    {/* Left: Class Name */}
                    <div className="flex flex-col">
                        <h3 className="text-base font-medium text-gray-700">{(student.enrolledClasses?.[0] || 'Business Class')}</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-0.5">Class</p>
                    </div>
                    
                    {/* Right: Attendance % */}
                    <div className="flex flex-col items-end">
                        <span className={`text-xl font-bold ${rateColor} tracking-tight`}>{rate}%</span>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-0.5">Attendance</p>
                    </div>
                </div>

                {/* Thin Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full ${progressBarColor}`} style={{ width: `${rate}%` }}></div>
                </div>
            </div>

            {/* Attendance Summary Cards - Soft & Modern */}
            <div className="grid grid-cols-4 gap-3">
                {/* Present */}
                <div className="bg-green-50/50 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200">
                    <div className="text-green-600 font-bold text-lg mb-1">{student.attendance?.present ?? 0}</div>
                    <p className="text-[10px] text-green-700/70 font-semibold uppercase tracking-wide">Present</p>
                </div>
                
                {/* Late */}
                <div className="bg-orange-50/50 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200">
                    <div className="text-orange-500 font-bold text-lg mb-1">{student.attendance?.late ?? 0}</div>
                    <p className="text-[10px] text-orange-700/70 font-semibold uppercase tracking-wide">Late</p>
                </div>

                {/* Absent */}
                <div className="bg-red-50/50 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200">
                    <div className="text-red-500 font-bold text-lg mb-1">{student.attendance?.absent ?? 0}</div>
                    <p className="text-[10px] text-red-700/70 font-semibold uppercase tracking-wide">Absent</p>
                </div>

                 {/* Score */}
                 <div className="bg-gray-50/80 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200">
                    <div className="text-gray-800 font-bold text-lg mb-1">{score}</div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Pts</p>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
                <button 
                    onClick={handleRemoveClick}
                    className="w-full py-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors focus:ring-2 focus:ring-red-100 outline-none flex items-center justify-center gap-2 group"
                >
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                    Remove from Class
                </button>
            </div>

        </div>

      </div>
    </div>
  );
}

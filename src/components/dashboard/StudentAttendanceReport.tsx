'use client';

import { useState, useEffect } from 'react';
import { fetchStudentAttendanceReport } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, Loader2, Award, Clock, AlertCircle } from 'lucide-react';

export default function StudentAttendanceReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  
  // Date state
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    async function loadReport() {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const data = await fetchStudentAttendanceReport(user.id, selectedMonth, selectedYear);
        setReport(data);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [user?.id, selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'late') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };
  
  const getTooltipText = (status: string) => {
    if (status === 'present') return "Present: Clock in within 15% of class time (1.0 point)";
    if (status === 'late') return "Late: Clock in between 15% and 40% of class time (0.5 point)";
    return "Absent: No clock in or more than 40% late (0 points)";
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Award className="text-blue-500" />
          Monthly Attendance
        </h2>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-gray-700 w-32 text-center">
            {monthNames[selectedMonth]} {selectedYear}
          </span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-800">{report?.summary.attendancePercentage}%</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-emerald-600 mb-1">Present</p>
              <p className="text-2xl font-bold text-gray-800">{report?.summary.present}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-orange-600 mb-1">Late</p>
              <p className="text-2xl font-bold text-gray-800">{report?.summary.late}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-red-600 mb-1">Absent</p>
              <p className="text-2xl font-bold text-gray-800">{report?.summary.absent}</p>
            </div>
          </div>

          {/* Details List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-700">Detailed Report</h3>
            </div>
            
            {report?.details.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No classes attended this month.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {report?.details.map((session: any) => (
                  <div key={`${session.classId}-${session.date}`} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group relative">
                    
                    {/* Left: Info */}
                    <div>
                      <h4 className="font-medium text-gray-900">{session.className}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        {session.checkInTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(session.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Badge with Tooltip */}
                    <div className="relative group/tooltip">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(session.status)} cursor-help`}>
                        {session.status}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all pointer-events-none z-10">
                        {getTooltipText(session.status)}
                        <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

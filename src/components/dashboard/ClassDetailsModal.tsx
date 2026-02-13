// ... (imports remain)
import { useState, useEffect } from 'react';
import { X, MapPin, Clock, Users, Calendar, Filter, ChevronDown, CheckCircle2, XCircle, AlertCircle, Search, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentAttendanceReport, fetchClassStudents, Student } from '@/lib/api';

// ... (ClassData interface and formatTime helper remain)
interface ClassData {
  id: string | number;
  name: string;
  code: string;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  radius?: string | number | null;
  students?: number;
  description?: string | null;
  check_in_start?: string | null;
  check_in_end?: string | null;
}

const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
        const timeValue = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
        return new Date(timeValue).toLocaleTimeString([], { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    } catch (e) {
        return '--:--';
    }
};

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
}

export default function ClassDetailsModal({ isOpen, onClose, classData }: ClassDetailsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Students' | 'Attendance'>('Overview');
  
  // Date state for report
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Data state
  const [attendanceReport, setAttendanceReport] = useState<any>(null);
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Colors
  const isStudent = user?.role === 'student';
  const primaryColor = isStudent ? '#3B82F6' : '#F43F5E';
  const primaryBg = isStudent ? 'bg-blue-50' : 'bg-[#FFF0F3]';
  const primaryText = isStudent ? 'text-blue-600' : 'text-[#F43F5E]';
  const tabActiveBorder = isStudent ? 'border-[#3B82F6]' : 'border-[#F43F5E]';
  const tabActiveText = isStudent ? 'text-[#3B82F6]' : 'text-[#F43F5E]';
  const focusRing = isStudent ? 'focus:ring-blue-300' : 'focus:ring-[#F43F5E]';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch Attendance Report
  useEffect(() => {
    if (isOpen && activeTab === 'Attendance' && classData && user) {
      const loadReport = async () => {
        setLoading(true);
        try {
          const data = await fetchStudentAttendanceReport(user.id, selectedMonth, selectedYear, String(classData.id));
          setAttendanceReport(data);
        } catch (e) {
          console.error("Failed to load report", e);
        } finally {
          setLoading(false);
        }
      };
      loadReport();
    }
  }, [isOpen, activeTab, classData, user, selectedMonth, selectedYear]);

  // Fetch Students (Classmates)
  useEffect(() => {
    if (isOpen && activeTab === 'Students' && classData && user) {
      const loadStudents = async () => {
        setLoading(true);
        try {
          // Fetch students using the new API support (requesterId + role)
          const data = await fetchClassStudents(String(classData.id), user.id, user.role as 'student' | 'teacher');
          setClassmates(data);
        } catch (e) {
          console.error("Failed to load students", e);
        } finally {
          setLoading(false);
        }
      };
      loadStudents();
    }
  }, [isOpen, activeTab, classData, user]);


  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{classData.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-mono font-bold">{classData.code}</span>
                    <span className="text-gray-400 text-sm">|</span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Users size={14} />
                        {classData.students ?? '--'} Students Enrolled
                    </span>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 flex gap-6 shrink-0">
            {['Overview', 'Students', 'Attendance'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                        activeTab === tab 
                        ? `${tabActiveBorder} ${tabActiveText}` 
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    {tab} {tab === 'Attendance' && <span className={`${primaryBg} ${primaryText} px-1.5 py-0.5 rounded text-[10px] ml-1`}>Report</span>}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'Overview' && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                        {/* Description Section */}
                        {classData.description && (
                            <>
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 ${primaryBg} rounded-lg flex items-center justify-center ${primaryText} shrink-0`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Description</h3>
                                        <p className="text-gray-600 mt-1 text-sm leading-relaxed">{classData.description}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-50 w-full"></div>
                            </>
                        )}
                        
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 ${primaryBg} rounded-lg flex items-center justify-center ${primaryText} shrink-0`}>
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Location Details</h3>
                                <p className="text-gray-600 mt-1 text-sm leading-relaxed">{classData.location || 'Location not set'}</p>
                                {classData.latitude && classData.longitude && (
                                    <p className="text-gray-400 text-xs mt-1">
                                        Coordinates: {classData.latitude}, {classData.longitude}
                                    </p>
                                )}
                                <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">
                                    <span className="font-bold">Radius:</span> {classData.radius || '100'}m
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-px bg-gray-50 w-full"></div>

                        <div className="flex items-start gap-4">
                             <div className={`w-10 h-10 ${primaryBg} rounded-lg flex items-center justify-center ${primaryText} shrink-0`}>
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Schedule</h3>
                                {classData.check_in_start && classData.check_in_end ? (
                                    <p className="text-gray-600 mt-1 text-sm">
                                        {formatTime(classData.check_in_start)} – {formatTime(classData.check_in_end)}
                                    </p>
                                ) : (
                                    <p className="text-gray-500 mt-1 text-sm italic">No schedule set</p>
                                )}
                                <p className="text-gray-400 text-xs mt-1">Check-in allowed during this window</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STUDENTS TAB */}
            {activeTab === 'Students' && (
                 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-4 shrink-0">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                className={`w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 ${focusRing} text-gray-900`}
                            />
                        </div>
                    </div>
                    {/* SCROLLBAR FIX: Removed max-h and allow usage of parent scroll or expand */}
                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-8 text-center flex justify-center">
                                <Loader2 className={`animate-spin ${primaryText}`} size={24} />
                            </div>
                        ) : classmates.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No students found enrolled in this class.
                            </div>
                        ) : (
                            classmates.map((student) => (
                                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                            <UserCircle size={20} />
                                        </div>
                                        <span className="font-medium text-gray-700">{student.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">ID: {student.id.substring(0, 8)}...</span>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'Attendance' && (
                <div className="space-y-6">
                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                         <h3 className="text-lg font-bold text-gray-800">Monthly Report</h3>
                         <div className="flex gap-3">
                            <div className="relative">
                                <select 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F43F5E] cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                                >
                                    {monthNames.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F43F5E] cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                                >
                                    <option value={2024}>2024</option>
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                         </div>
                    </div>

                    {loading ? (
                         <div className="flex justify-center p-12">
                             <Loader2 className={`animate-spin ${primaryText}`} size={32} />
                         </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="text-green-600 font-bold text-2xl mb-1 flex items-center gap-2">
                                        <CheckCircle2 size={24} />
                                        {attendanceReport?.summary.present ?? 0}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Present</p>
                                 </div>
                                 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="text-orange-500 font-bold text-2xl mb-1 flex items-center gap-2">
                                        <AlertCircle size={24} />
                                        {attendanceReport?.summary.late ?? 0}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Late</p>
                                 </div>
                                 <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                    <div className="text-red-500 font-bold text-2xl mb-1 flex items-center gap-2">
                                        <XCircle size={24} />
                                        {attendanceReport?.summary.absent ?? 0}
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Absent</p>
                                 </div>
                            </div>

                            {/* Report Table - Showing Sessions for Student */}
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-center">Scores</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {attendanceReport?.details.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                    No attendance records for this month.
                                                </td>
                                            </tr>
                                        ) : (
                                            attendanceReport?.details.map((session: any) => (
                                                <tr key={session.classId + session.date} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-700">
                                                        {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            {session.checkInTime ? new Date(session.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No check-in'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                                                            session.status === 'present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                            session.status === 'late' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                            'bg-red-100 text-red-700 border-red-200'
                                                        }`}>
                                                            {session.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-gray-500">
                                                        {session.score} pts
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

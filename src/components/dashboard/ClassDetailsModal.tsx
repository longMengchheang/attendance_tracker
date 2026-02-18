// ... (imports remain)
import { useState, useEffect } from 'react';
import { X, MapPin, Clock, Users, Calendar, Filter, ChevronDown, CheckCircle2, XCircle, AlertCircle, Search, UserCircle, Loader2, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import { fetchStudentAttendanceReport, fetchClassStudents, fetchClassAttendanceSummary, fetchDailyClassAttendance, removeStudentFromClass, fetchClassSessionsHistory, Student } from '@/lib/api';
import StudentSummaryModal from './StudentSummaryModal';
import { toast } from 'sonner';


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
  days?: string[] | null;
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

  // Generate years list starting from 2026 up to current year
  const startYear = 2026;
  const currentYear = today.getFullYear();
  const years = Array.from({ length: Math.max(1, currentYear - startYear + 1) }, (_, i) => startYear + i);

  // Data state
  const [attendanceReport, setAttendanceReport] = useState<any>(null);
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null); // For summary modal
  
  // Daily View State
  const [viewMode, setViewMode] = useState<'monthly' | 'history' | 'daily'>('history'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyAttendanceReport, setDailyAttendanceReport] = useState<any>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);

  const handleRemoveStudent = async (studentId: string) => {
      if (!classData) return;
      
      const previousClassmates = [...classmates];
      try {
          // Optimistic update
          setClassmates(prev => prev.filter(s => s.id !== studentId));
          
          await removeStudentFromClass(studentId, String(classData.id));
          
          toast.success("Student removed from class");
          setSelectedStudent(null);
      } catch (error) {
          console.error("Failed to remove student:", error);
          toast.error("Failed to remove student");
          // Revert optimistic update
          setClassmates(previousClassmates);
      }
  };

  const [loading, setLoading] = useState(false);

  // Colors
  const isStudent = user?.role === 'student';

  const handleStudentClick = async (student: Student) => {
      // Open summary modal
      if (!classData) return;
      try {
          // Fetch student stats for current month/year to show in modal
          const report = await fetchStudentAttendanceReport(student.id, selectedMonth, selectedYear, String(classData.id));
          
          setSelectedStudent({
              ...student,
              attendance: {
                  present: report.summary.present,
                  late: report.summary.late,
                  absent: report.summary.absent,
                  score: report.summary.totalScore,
                  attendancePercentage: report.summary.attendancePercentage
              },
              enrolledClasses: [classData.name], // Just show current class for context
              enrolledAt: student.enrolledAt
          });
      } catch (e) {
          console.error("Failed to fetch student details", e);
          // Fallback if fetch fails
          setSelectedStudent({
              ...student,
              attendance: { present: 0, late: 0, absent: 0 },
              enrolledClasses: [classData.name]
          });
      }
  };


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
        console.log(`[Frontend] Loading report for Month: ${selectedMonth}, Year: ${selectedYear}`);
        setLoading(true);
        setAttendanceReport(null); // Clear to show loading
        try {
          if (user.role === 'teacher') {
             const data = await fetchClassAttendanceSummary(String(classData.id), selectedMonth, selectedYear);
             setAttendanceReport(data);
          } else {
             // Student viewing own report
             const data = await fetchStudentAttendanceReport(user.id, selectedMonth, selectedYear, String(classData.id));
             setAttendanceReport(data);
          }
        } catch (e) {
          console.error("Failed to load report", e);
        } finally {
          setLoading(false);
        }
      };
      loadReport();
    }
  }, [isOpen, activeTab, classData, user, selectedMonth, selectedYear]);



  // Fetch Class History
  useEffect(() => {
    if (isOpen && activeTab === 'Attendance' && classData && user?.role === 'teacher' && viewMode === 'history') {
      const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await fetchClassSessionsHistory(String(classData.id), selectedMonth, selectedYear);
            setHistorySessions(data);
        } catch (e) {
          console.error("Failed to load class history", e);
        } finally {
          setLoading(false);
        }
      };
      loadHistory();
    }
  }, [isOpen, activeTab, classData, user, viewMode, selectedMonth, selectedYear]);

  // Fetch Daily Attendance
  useEffect(() => {
    if (isOpen && activeTab === 'Attendance' && classData && user?.role === 'teacher' && viewMode === 'daily') {
      const loadDailyReport = async () => {
        setLoading(true);
        try {
            const data = await fetchDailyClassAttendance(String(classData.id), selectedDate, user.id);
            setDailyAttendanceReport(data);
        } catch (e) {
          console.error("Failed to load daily report", e);
        } finally {
          setLoading(false);
        }
      };
      loadDailyReport();
    }
  }, [isOpen, activeTab, classData, user, viewMode, selectedDate]);

  // Fetch Students (Classmates)
  useEffect(() => {
    if (isOpen && activeTab === 'Students' && classData && user) {
      const loadStudents = async () => {
        setLoading(true);
        try {
          // Fetch students using the new API support (requesterId + role)
          const roleArg = user.role === 'student' ? 'student' : 'teacher';
          const data = await fetchClassStudents(String(classData.id), user.id, roleArg);
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
                    {user?.role === 'teacher' && (
                        <>
                            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-mono font-bold">{classData.code}</span>
                            <span className="text-gray-400 text-sm">|</span>
                        </>
                    )}
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
            {['Overview', 'Students', 'Attendance']
                .filter(tab => !(tab === 'Students' && isStudent))
                .map((tab) => (
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
                                {classData.days && classData.days.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap mt-1 mb-2">
                                        {[...classData.days]
                                            .sort((a, b) => {
                                                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                                return days.indexOf(a) - days.indexOf(b);
                                            })
                                            .map((day) => (
                                            <span key={day} className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                )}
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
                                <div 
                                    key={student.id} 
                                    onClick={() => handleStudentClick(student)}
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-[#F43F5E] group-hover:shadow-sm transition-all">
                                            <UserCircle size={20} />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700 group-hover:text-[#F43F5E] transition-colors">{student.name}</span>
                                            {student.email && (
                                                <p className="text-xs text-gray-400">{student.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono group-hover:text-gray-600 transition-colors">ID: {student.id.substring(0, 8)}...</span>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
            )}



            {/* ATTENDANCE TAB */}
            <StudentSummaryModal 
                isOpen={!!selectedStudent} 
                onClose={() => setSelectedStudent(null)} 
                student={selectedStudent} 
                onRemove={handleRemoveStudent}
            />
            {activeTab === 'Attendance' && (
                <div className="space-y-6">
                    {/* Controls - Month/Year selectors */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {isStudent ? (
                            <h3 className="text-lg font-bold text-gray-900">My Attendance</h3>
                        ) : (
                            <h3 className="text-lg font-bold text-gray-900">Student Attendance</h3>
                        )}
                        
                        <div className="flex items-center gap-4">
                            {!isStudent && (
                                <>
                                    {/* View Mode Toggle */}
                                    {viewMode !== 'daily' && (
                                        <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium mr-2">
                                            <button
                                                onClick={() => setViewMode('history')}
                                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                History
                                            </button>
                                            <button
                                                onClick={() => setViewMode('monthly')}
                                                className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                Monthly
                                            </button>
                                        </div>
                                    )}

                                    {viewMode === 'daily' ? (
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setViewMode('history')}
                                                className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                                            >
                                                <ChevronDown className="rotate-90" size={16} />
                                                Back
                                            </button>
                                            <span className="text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                                {(() => {
                                                    const d = new Date(selectedDate);
                                                    return `${d.toLocaleDateString('en-US', {weekday: 'short'})} ${d.getDate()} ${d.toLocaleDateString('en-US', {month: 'short'})} ${d.getFullYear()}`;
                                                })()}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
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

                                                    {years.map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </>
                                    )}
                                    

                                </>
                            )}
                            {isStudent && (
                                <>
                                    <div className="relative">
                                        <select 
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
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
                                            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                                        >

                                                    {years.map(year => (
                                                        <option key={year} value={year}>{year}</option>
                                                    ))}
                                                </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {loading ? (
                         <div className="flex justify-center p-12">
                             <Loader2 className={`animate-spin ${primaryText}`} size={32} />
                         </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            {/* Display summary from appropriate report source */}
                            {((isStudent && attendanceReport) || (!isStudent && viewMode === 'daily' && dailyAttendanceReport)) && (() => {
                                const report = isStudent ? attendanceReport : dailyAttendanceReport;
                                
                                return (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                            <div className="text-green-600 font-bold text-2xl mb-1 flex items-center gap-2">
                                                <CheckCircle2 size={24} />
                                                {report?.summary?.present ?? 0}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Present</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                            <div className="text-orange-500 font-bold text-2xl mb-1 flex items-center gap-2">
                                                <AlertCircle size={24} />
                                                {report?.summary?.late ?? 0}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Late</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                            <div className="text-red-500 font-bold text-2xl mb-1 flex items-center gap-2">
                                                <XCircle size={24} />
                                                {report?.summary?.absent ?? 0}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Absent</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* TEACHER HISTORY VIEW */}
                            {!isStudent && viewMode === 'history' && (
                                <div className="space-y-3 animate-fade-in">
                                    {historySessions.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                                            <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                                            <p className="text-gray-500 text-sm">No class sessions recorded for this month.</p>
                                        </div>
                                    ) : (
                                        historySessions.map((session) => (
                                            <div 
                                                key={session.date}
                                                onClick={() => {
                                                    setSelectedDate(session.date);
                                                    setViewMode('daily');
                                                }}
                                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#FFF0F3] group-hover:text-[#F43F5E] transition-colors shrink-0">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-base leading-tight">
                                                            {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' })}, {new Date(session.date).getDate()}
                                                        </h4>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-4 mr-2">
                                                        <div className="flex flex-col items-center min-w-[3rem]">
                                                            <span className="text-lg font-bold text-emerald-600 leading-none">{session.present}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Present</span>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-center min-w-[3rem]">
                                                            <span className="text-lg font-bold text-orange-500 leading-none">{session.late}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Late</span>
                                                        </div>

                                                        <div className="flex flex-col items-center min-w-[3rem]">
                                                            <span className="text-lg font-bold text-red-500 leading-none">{session.absent}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Absent</span>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className="-rotate-90 text-gray-300 group-hover:text-[#F43F5E] transition-colors" size={18} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* DAILY VIEW TABLE */}
                            {!isStudent && viewMode === 'daily' && (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">

                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-center">Clock In</th>
                                                <th className="px-6 py-4 text-center">Clock Out</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {dailyAttendanceReport?.students?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                        No data for this date.
                                                    </td>
                                                </tr>
                                            ) : (
                                                dailyAttendanceReport?.students?.map((student: any) => (
                                                    <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-700">
                                                            {student.name}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                                                                    student.status === 'present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                                    student.status === 'late' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                    'bg-red-100 text-red-700 border-red-200'
                                                                }`}>
                                                                    {student.status}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-mono text-gray-500 text-xs">
                                                            {formatTime(student.checkInTime)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-mono text-gray-500 text-xs">
                                                            {student.leftEarly ? (
                                                                <span className="text-red-500 font-bold">Left Early</span>
                                                            ) : (
                                                                formatTime(student.checkOutTime)
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TEACHER TABLE: Student List (monthly view) */}
                            {!isStudent && viewMode === 'monthly' && (
                                attendanceReport?.summary?.totalClasses === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed animate-fade-in">
                                        <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                                        <p className="text-gray-900 font-medium text-lg">No sessions yet</p>
                                        <p className="text-gray-500 text-sm mt-1">No class sessions recorded for this month.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4 text-center">Present</th>
                                                <th className="px-6 py-4 text-center">Late</th>
                                                <th className="px-6 py-4 text-center">Absent</th>

                                                <th className="px-6 py-4 text-center">Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {attendanceReport?.students?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                        No enrollment data found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                attendanceReport?.students?.map((student: any) => (
                                                    <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-700">
                                                            {student.name}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-green-600 font-medium">{student.present}</td>
                                                        <td className="px-6 py-4 text-center text-orange-500 font-medium">{student.late}</td>
                                                        <td className="px-6 py-4 text-center text-red-500 font-medium">{student.absent}</td>
                                                        <td className="px-6 py-4 text-center font-mono font-bold text-gray-800">{student.attendanceRate}%</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                )
                            )}

                            {/* HISTORY TABLE: Shown for student only */}
                            {isStudent && (
                                attendanceReport && attendanceReport.summary?.totalSessions === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed animate-fade-in">
                                        <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                                        <p className="text-gray-900 font-medium text-lg">No sessions yet</p>
                                        <p className="text-gray-500 text-sm mt-1">No class sessions recorded for this month.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">

                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                    <th className="px-6 py-4 text-center">Clock In</th>
                                                    <th className="px-6 py-4 text-center">Clock Out</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {attendanceReport?.details?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                            No attendance records for this month.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    attendanceReport?.details?.map((session: any) => (
                                                        <tr key={session.classId + session.date} className="hover:bg-gray-50/80 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-700">
                                                                {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
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
                                                            <td className="px-6 py-4 text-center font-mono text-gray-500 text-xs">
                                                                {formatTime(session.checkInTime)}
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-mono text-gray-500 text-xs">
                                                                {session.leftEarly ? (
                                                                     <span className="text-red-500 font-bold">Left Early</span>
                                                                ) : (
                                                                    formatTime(session.checkOutTime)
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

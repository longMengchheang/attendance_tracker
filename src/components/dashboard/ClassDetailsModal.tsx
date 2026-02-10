'use client';

import { useState } from 'react';
import { X, MapPin, Clock, Users, Calendar, Filter, ChevronDown, CheckCircle2, XCircle, AlertCircle, Search, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

// Helper to format ISO time to HH:MM AM/PM
const formatTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
        // Append Z if missing to ensure UTC parsing
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

// Mock Attendance Data
const attendanceData = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    student: ['Ashley Cooper', 'Brad Pitt', 'Charlie Puth', 'Diana Ross', 'Ethan Hunt', 'Fiona Gallagher'][i % 6],
    present: 18 + (i % 3),
    absent: i % 2,
    late: i % 2,
    rate: 85 + (i % 15)
}));

export default function ClassDetailsModal({ isOpen, onClose, classData }: ClassDetailsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Students' | 'Attendance'>('Overview');
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [selectedYear, setSelectedYear] = useState('2025');

  if (!isOpen || !classData) return null;

  // Role-based colors - students see blue, teachers see red
  const isStudent = user?.role === 'student';
  const primaryColor = isStudent ? '#3B82F6' : '#F43F5E';
  const primaryBg = isStudent ? 'bg-blue-50' : 'bg-[#FFF0F3]';
  const primaryText = isStudent ? 'text-blue-600' : 'text-[#F43F5E]';
  const tabActiveBorder = isStudent ? 'border-[#3B82F6]' : 'border-[#F43F5E]';
  const tabActiveText = isStudent ? 'text-[#3B82F6]' : 'text-[#F43F5E]';
  const focusRing = isStudent ? 'focus:ring-blue-300' : 'focus:ring-[#F43F5E]';

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
                 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                className={`w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 ${focusRing} text-gray-900`}
                            />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {attendanceData.map((s, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                        <UserCircle size={20} />
                                    </div>
                                    <span className="font-medium text-gray-700">{s.student}</span>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">ID: {2024000 + i}</span>
                            </div>
                        ))}
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
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F43F5E] cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                                >
                                    <option>January</option>
                                    <option>February</option>
                                    <option>March</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#F43F5E] cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                                >
                                    <option>2024</option>
                                    <option>2025</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                         </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="text-green-600 font-bold text-2xl mb-1 flex items-center gap-2">
                                <CheckCircle2 size={24} />
                                420
                            </div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Present</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="text-red-500 font-bold text-2xl mb-1 flex items-center gap-2">
                                <XCircle size={24} />
                                38
                            </div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Absent</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="text-orange-500 font-bold text-2xl mb-1 flex items-center gap-2">
                                <AlertCircle size={24} />
                                12
                            </div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Late</p>
                         </div>
                    </div>

                    {/* Report Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4 text-center">Present</th>
                                    <th className="px-6 py-4 text-center">Absent</th>
                                    <th className="px-6 py-4 text-center">Late</th>
                                    <th className="px-6 py-4 text-center">Attendance %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attendanceData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-700">{row.student}</td>
                                        <td className="px-6 py-4 text-center text-green-600 font-semibold">{row.present}</td>
                                        <td className="px-6 py-4 text-center text-red-500">{row.absent}</td>
                                        <td className="px-6 py-4 text-center text-orange-500">{row.late}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                                row.rate >= 90 ? 'bg-green-100 text-green-700' :
                                                row.rate >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {row.rate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, Users, Loader2, RefreshCw } from 'lucide-react';
import { Class, OngoingStudent, fetchOngoingAttendance } from '@/lib/api';

/**
 * Supabase returns 'timestamp without timezone' as a string without Z suffix.
 * JS new Date() would treat it as local time, but it's actually UTC.
 * Add Z suffix to force UTC interpretation so toLocaleTimeString() shows correct local time.
 */
function parseUTCTimestamp(ts: string): Date {
  if (/[Z]$/i.test(ts) || /[+-]\d{2}:\d{2}$/.test(ts)) return new Date(ts);
  return new Date(ts + 'Z');
}

interface Props {
  classData: Class;
}

export default function TeacherOngoingClassPage({ classData }: Props) {
  const [students, setStudents] = useState<OngoingStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadAttendance = useCallback(async () => {
    try {
      const data = await fetchOngoingAttendance(classData.id);
      setStudents(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setIsLoading(false);
    }
  }, [classData.id]);

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    loadAttendance();
    const interval = setInterval(loadAttendance, 30000);
    return () => clearInterval(interval);
  }, [loadAttendance]);

  const stats = {
    present: students.filter(s => s.status === 'present').length,
    late: students.filter(s => s.status === 'late').length,
    absent: students.filter(s => !s.checkInTime).length,
    clockedIn: students.filter(s => s.checkInTime).length,
    clockedOut: students.filter(s => s.checkOutTime).length,
    total: students.length,
  };

  const filteredStudents = students.filter(s => {
    if (filter === 'All') return true;
    if (filter === 'Clock In') return !!s.checkInTime;
    if (filter === 'Clock Out') return !!s.checkOutTime;
    if (filter === 'Absent') return !s.checkInTime;
    return true;
  });

  const getStatusColor = (student: OngoingStudent) => {
    if (student.checkOutTime) return 'bg-blue-500';
    if (student.checkInTime) return 'bg-emerald-500';
    return 'bg-gray-300';
  };

  const getStatusBadge = (student: OngoingStudent) => {
    if (student.checkOutTime) return 'bg-blue-100 text-blue-700';
    if (student.checkInTime) return 'bg-emerald-100 text-emerald-700';
    return 'bg-rose-100 text-rose-700';
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return parseUTCTimestamp(timeStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!classData.check_in_end) return null;
    const end = parseUTCTimestamp(classData.check_in_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Class ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F43F5E] mx-auto mb-4" />
          <p className="text-gray-500">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#F43F5E] mb-2">{classData.name}</h2>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {getTimeRemaining()}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            {stats.total} students
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Present</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-orange-500">{stats.late}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Late</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-rose-500">{stats.absent}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Absent</p>
        </div>
      </div>

      {/* Refresh indicator */}
      <div className="flex justify-center mb-6">
        <button
          onClick={loadAttendance}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw size={12} />
          Last updated: {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full max-w-xl shadow-inner">
          {['All', 'Clock In', 'Clock Out', 'Absent'].map((tab) => {
            let count = 0;
            if (tab === 'All') count = students.length;
            else if (tab === 'Clock In') count = stats.clockedIn;
            else if (tab === 'Clock Out') count = stats.clockedOut;
            else if (tab === 'Absent') count = stats.absent;

            const isActive = filter === tab;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-white text-[#F43F5E] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
                }`}
              >
                {tab}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#FFF0F3] text-[#F43F5E]' : 'bg-gray-200 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-3 max-w-4xl mx-auto">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-medium">No students found.</p>
          </div>
        ) : filteredStudents.map((student) => (
          <div
            key={student.studentId}
            className="group bg-white border border-gray-100 rounded-xl flex items-center p-3 hover:shadow-md hover:border-[#F43F5E]/20 transition-all duration-200"
          >
            {/* Status Dot */}
            <div className="pl-2 pr-4">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(student)}`}></div>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
              {student.studentName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex flex-col ml-4 flex-1">
              <span className="font-bold text-gray-900 group-hover:text-[#F43F5E] transition-colors">{student.studentName}</span>
              <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                {!student.checkInTime ? (
                  'Not checked in'
                ) : (
                  <>
                    In at {formatTime(student.checkInTime)}
                    {student.checkOutTime && (
                       <> • Out at {formatTime(student.checkOutTime)}</>
                    )}
                  </>
                )}
              </span>
            </div>

            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadge(student)}`}>
              {student.checkOutTime ? 'Clocked Out' : (student.checkInTime ? 'Clocked In' : 'Absent')}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { MapPin, Radio, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentEnrollments, checkIn, checkOut, Enrollment, AttendanceRecord } from '@/lib/api';

export default function StudentOngoingClassPage() {
  const { user } = useAuth();
  
  // State
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Location simulation (for demo)
  const [isInRange, setIsInRange] = useState(false);
  const [distanceFromArea] = useState('~25m');
  
  // Attendance state
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load student's enrolled classes
  useEffect(() => {
    async function loadEnrollments() {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const data = await fetchStudentEnrollments(user.id);
        setEnrollments(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].classId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load classes');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadEnrollments();
  }, [user?.id]);

  const selectedClass = enrollments.find(e => e.classId === selectedClassId);

  const handleCheckIn = async () => {
    if (!isInRange || !user?.id || !selectedClassId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await checkIn(user.id, selectedClassId);
      
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      setCheckInTime(time);
      setIsCheckedIn(true);
      setAttendanceId(result.record.id);
      
      if (result.alreadyCheckedIn) {
        // Already checked in today, restore the check-in time
        const checkInDate = new Date(result.record.checkInTime);
        setCheckInTime(checkInDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await checkOut(attendanceId);
      setIsCheckedIn(false);
      setCheckInTime(null);
      setAttendanceId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to check out');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto mb-4" />
          <p className="text-gray-500">Loading your classes...</p>
        </div>
      </div>
    );
  }

  // No classes enrolled
  if (enrollments.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F8FAFC] -m-8 p-8">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Classes</h3>
          <p className="text-gray-500">Join a class first to check in for attendance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#F8FAFC] -m-8 p-8">
      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-300/40 w-full max-w-md overflow-hidden border border-gray-200/60">
        
        {/* Class Selector */}
        {enrollments.length > 1 && (
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <select
              value={selectedClassId || ''}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setIsCheckedIn(false);
                setCheckInTime(null);
                setAttendanceId(null);
              }}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium"
            >
              {enrollments.map((e) => (
                <option key={e.classId} value={e.classId}>
                  {e.className}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-br from-[#3B82F6] via-[#60A5FA] to-[#93C5FD] p-7">
          <h2 className="text-2xl font-bold text-white text-center">
            {selectedClass?.className || 'Select a Class'}
          </h2>
          <p className="text-blue-100/90 text-sm text-center mt-1.5 font-medium">Ongoing Session</p>
        </div>

        {/* Status Banner */}
        {!isCheckedIn && (
          <div className={`px-5 py-4 flex items-center gap-4 ${
            isInRange 
              ? 'bg-emerald-50/70 border-b border-emerald-100/80' 
              : 'bg-amber-50/60 border-b border-amber-100/70'
          }`}>
            {isInRange ? (
              <>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-emerald-700 font-semibold">You're in range</p>
                  <p className="text-emerald-600/80 text-sm">Ready to check in</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-amber-100/80 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-700 font-semibold">Out of range</p>
                  <p className="text-amber-600/80 text-sm">Move closer to check in ({distanceFromArea} away)</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Checked-in Success Banner */}
        {isCheckedIn && (
          <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-100/80 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-emerald-700 font-semibold">Checked in successfully</p>
              <p className="text-emerald-600/80 text-sm">at {checkInTime}</p>
            </div>
          </div>
        )}

        {/* Class Details */}
        <div className="p-6 space-y-5">
          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Location</p>
              <p className="text-gray-800 font-semibold">Location not set</p>
            </div>
          </div>

          {/* Radius */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Radio size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Check-in Radius</p>
              <p className="text-gray-800 font-semibold">100 meters</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Current Time</p>
              <p className="text-gray-800 font-semibold">
                {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 pt-3 border-t border-gray-100 bg-gray-50/30">
          {/* Check In Button */}
          <div className="mb-3">
            <button
              onClick={handleCheckIn}
              disabled={!isInRange || isCheckedIn || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                isInRange && !isCheckedIn && !isSubmitting
                  ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-blue-400/30 hover:shadow-xl hover:shadow-blue-400/40 hover:-translate-y-0.5 active:translate-y-0 text-base'
                  : isCheckedIn
                    ? 'bg-emerald-100 text-emerald-700 cursor-default text-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed text-sm'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Checking in...
                </>
              ) : isCheckedIn ? (
                '✓ Checked In'
              ) : (
                'Check In'
              )}
            </button>
            {/* Explanation text for disabled state */}
            {!isInRange && !isCheckedIn && (
              <p className="text-xs text-gray-400 text-center mt-2.5">
                Move within the allowed range to enable check-in
              </p>
            )}
          </div>

          {/* Check Out Button */}
          {isCheckedIn && (
            <button
              onClick={handleCheckOut}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border-2 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 bg-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Checking out...
                </>
              ) : (
                'Check Out'
              )}
            </button>
          )}
        </div>

        {/* Demo Toggle */}
        <div className="px-6 pb-5 bg-gray-50/30">
          <button
            onClick={() => setIsInRange(!isInRange)}
            className="text-xs text-blue-500/80 hover:text-blue-600 w-full text-center"
          >
            [Demo: Toggle to "{isInRange ? 'Out of Range' : 'In Range'}"]
          </button>
        </div>
      </div>
    </div>
  );
}

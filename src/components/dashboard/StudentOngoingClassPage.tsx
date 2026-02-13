'use client';

import { useState, useEffect } from 'react';
import { MapPin, Radio, Clock, AlertTriangle, CheckCircle2, Loader2, Navigation } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { checkIn, checkOut, Class, fetchAttendanceRecords } from '@/lib/api';
import { haversineDistance } from '@/lib/geo';

/**
 * Supabase returns 'timestamp without timezone' as a string without Z suffix.
 * JS new Date() would treat it as local time, but it's actually UTC.
 * Add Z suffix to force UTC interpretation so toLocaleTimeString() shows correct local time.
 */
function parseUTCTimestamp(ts: string): Date {
  // If it already ends with Z or has an offset, leave it alone
  if (/[Z]$/i.test(ts) || /[+-]\d{2}:\d{2}$/.test(ts)) return new Date(ts);
  return new Date(ts + 'Z');
}

interface Props {
  classData: Class;
}

export default function StudentOngoingClassPage({ classData }: Props) {
  const { user } = useAuth();

  // Check if location is required for this class
  const isLocationRequired = !!classData.latitude && !!classData.longitude;

  // Location state
  const [studentLat, setStudentLat] = useState<number | null>(null);
  const [studentLng, setStudentLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  // Only start locating if required
  const [isLocating, setIsLocating] = useState(isLocationRequired);

  // Computed distance
  const [distance, setDistance] = useState<number | null>(null);
  const [isInRange, setIsInRange] = useState(false);

  // Attendance state
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time state for periodic updates
  const [now, setNow] = useState(new Date());

  // Get location on mount if required
  useEffect(() => {
    if (isLocationRequired) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStudentLat(position.coords.latitude);
          setStudentLng(position.coords.longitude);
          setIsLocating(false);
        },
        () => {
          setLocationError('Unable to get your location.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [isLocationRequired]);

  // Check for existing check-in on mount
  useEffect(() => {
    const checkExistingAttendance = async () => {
      if (!user?.id || !classData.id) return;

      try {
        // Get today's date in local time YYYY-MM-DD
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const records = await fetchAttendanceRecords({
          classId: classData.id,
          studentId: user.id,
          date: dateStr
        });

        if (records && records.length > 0) {
          const rec = records[0] as any; // Cast to any to handle potential snake_case
          // Restore state from existing record
          const timeStr = rec.checkInTime || rec.check_in_time;
          if (timeStr) {
            const checkInDate = parseUTCTimestamp(timeStr);
            setCheckInTime(checkInDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
            setIsCheckedIn(!rec.checkOutTime && !rec.check_out_time); // Handle snake_case for checkout too
            setAttendanceId(rec.id);
            setAttendanceStatus(rec.status);
          }
        }
      } catch (error) {
        console.error('Failed to check existing attendance:', error);
      }
    };

    checkExistingAttendance();
  }, [user?.id, classData.id]);

  // Update time every 10 seconds to keep UI fresh

  // Update time every 10 seconds to keep UI fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Check-out time restriction
  const [canCheckOut, setCanCheckOut] = useState(false);
  const [checkOutMessage, setCheckOutMessage] = useState<string | null>(null);

  // Computed Lateness & Status for UI
  const [latenessStatus, setLatenessStatus] = useState<'present' | 'late' | 'absent'>('present');
  const [latenessPercent, setLatenessPercent] = useState(0);

  // Update logic based on time
  useEffect(() => {
    if (!classData.check_in_start || !classData.check_in_end) return;

    const start = parseUTCTimestamp(classData.check_in_start);
    const end = parseUTCTimestamp(classData.check_in_end);
    
    // 1. Calculate Lateness
    const duration = end.getTime() - start.getTime();
    if (duration > 0) {
      const elapsed = now.getTime() - start.getTime();
      const pct = elapsed / duration;
      setLatenessPercent(pct);

      if (pct <= 0.15) setLatenessStatus('present');
      else if (pct <= 0.40) setLatenessStatus('late');
      else setLatenessStatus('absent');
    }

    // 2. Check-out Window
    // Can check out if:
    // a) Class has ended (now >= end)
    // b) Window hasn't expired (now <= end + 15m)
    const fifteenMinutesAfter = new Date(end.getTime() + 15 * 60 * 1000);
    const hasEnded = now >= end;
    const isWindowOpen = now <= fifteenMinutesAfter;

    if (!hasEnded) {
      setCanCheckOut(false);
      setCheckOutMessage('Clock-out available after class ends');
    } else if (!isWindowOpen) {
      setCanCheckOut(false);
      setCheckOutMessage('Clock-out window expired (15m limit)');
    } else {
      setCanCheckOut(true);
      setCheckOutMessage(null);
    }

  }, [now, classData.check_in_start, classData.check_in_end]);

  const handleCheckIn = async () => {
    // If location is required, check range and coords. If not, just check user ID.
    
    if (!user?.id) return;
    if (isLocationRequired && (!isInRange || studentLat === null || studentLng === null)) return;

    // Use actual coords or valid dummy coords if not required
    const effLat = studentLat ?? 0;
    const effLng = studentLng ?? 0;

    // Prevent check-in if absent threshold reached
    if (latenessStatus === 'absent') {
      setError('Cannot clock in: Class is more than 40% complete (Absent).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await checkIn(user.id, classData.id, effLat, effLng);

      if (result.alreadyCheckedIn && result.record) {
        const rec = result.record as any;
        // Parse as UTC so it converts to local time correctly
        const checkInDate = parseUTCTimestamp(rec.checkInTime || rec.check_in_time);
        setCheckInTime(checkInDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
        setIsCheckedIn(true);
        setAttendanceId(rec.id);
        setAttendanceStatus(rec.status);
      } else if (result.record) {
        const rec = result.record as any;
        const now = new Date();
        setCheckInTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
        setIsCheckedIn(true);
        setAttendanceId(rec.id);
        setAttendanceStatus(rec.status);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendanceId) return;

    if (!canCheckOut) {
      // Re-trigger visual feedback
      if (checkOutMessage) {
         setError(checkOutMessage);
         setTimeout(() => setError(null), 3000);
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await checkOut(attendanceId);
      setIsCheckedIn(false);
      setCheckInTime(null);
      // Do NOT clear attendanceId or status, so we know they finished the session
      // setAttendanceId(null); 
      // setAttendanceStatus(null);
    } catch (err: any) {
      setError(err.message || 'Failed to check out');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh location
  const handleRefreshLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStudentLat(position.coords.latitude);
        setStudentLng(position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setLocationError('Unable to get your location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getStatusBadgeStyle = () => {
    if (attendanceStatus === 'present') return 'bg-emerald-100 text-emerald-700';
    if (attendanceStatus === 'late') return 'bg-orange-100 text-orange-700';
    if (attendanceStatus === 'absent') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  };

  const getClockInButtonInfo = () => {
    if (latenessStatus === 'present') return { text: 'Clock In', sub: '(Present)', disabled: false };
    if (latenessStatus === 'late') return { text: 'Clock In', sub: '(Late)', disabled: false };
    return { text: 'Absent', sub: '(Too Late)', disabled: true };
  };

  const clockInInfo = getClockInButtonInfo();

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#F8FAFC] -m-8 p-8">
      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-300/40 w-full max-w-md overflow-hidden border border-gray-200/60">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#3B82F6] via-[#60A5FA] to-[#93C5FD] p-7">
          <h2 className="text-2xl font-bold text-white text-center">
            {classData.name}
          </h2>
          <p className="text-blue-100/90 text-sm text-center mt-1.5 font-medium">Ongoing Session</p>
        </div>

        {/* Location Loading */}
        {isLocating && (
          <div className="px-5 py-4 bg-blue-50/60 border-b border-blue-100/70 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100/80 rounded-full flex items-center justify-center">
              <Loader2 size={20} className="text-blue-600 animate-spin" />
            </div>
            <div>
              <p className="text-blue-700 font-semibold">Getting your location...</p>
              <p className="text-blue-600/80 text-sm">Please allow location access</p>
            </div>
          </div>
        )}

        {/* Location Error */}
        {locationError && (
          <div className="px-5 py-4 bg-red-50/60 border-b border-red-100/70 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100/80 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-red-700 font-semibold">Location unavailable</p>
              <p className="text-red-600/80 text-sm">{locationError}</p>
            </div>
            <button onClick={handleRefreshLocation} className="text-red-600 hover:text-red-700">
              <Navigation size={16} />
            </button>
          </div>
        )}

        {/* Status Banner - Ready to Clock In */}
        {!isLocating && !locationError && !isCheckedIn && !attendanceId && (
          <div className={`px-5 py-4 flex items-center gap-4 ${
            !isLocationRequired
              ? 'bg-blue-50/70 border-b border-blue-100/80' // No location required
              : isInRange
                ? 'bg-emerald-50/70 border-b border-emerald-100/80'
                : 'bg-amber-50/60 border-b border-amber-100/70'
          }`}>
            {!isLocationRequired ? (
               <>
                <div className="w-10 h-10 bg-blue-100/80 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-700 font-semibold">Ready to clock in</p>
                  <p className="text-blue-600/80 text-sm">Location check not required for this class</p>
                </div>
              </>
            ) : isInRange ? (
              <>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-emerald-700 font-semibold">You're in range</p>
                  <p className="text-emerald-600/80 text-sm">Ready to clock in ({distance ? `${Math.round(distance)}m away` : ''})</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-amber-100/80 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-amber-700 font-semibold">Out of range</p>
                  <p className="text-amber-600/80 text-sm">Move closer to clock in ({distance ? `~${Math.round(distance)}m` : '?'} away)</p>
                </div>
                <button onClick={handleRefreshLocation} className="text-amber-600 hover:text-amber-700 p-1">
                  <Navigation size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Status Banner - Clocked Out / Completed */}
        {!isCheckedIn && attendanceId && (
          <div className="px-5 py-4 bg-gray-50/70 border-b border-gray-100/80 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200/80 rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle2 size={20} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 font-semibold">Class Completed</p>
              <p className="text-gray-500 text-sm">Attendance recorded. You have clocked out.</p>
            </div>
          </div>
        )}

        {/* Checked-in Success Banner */}
        {isCheckedIn && (
          <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-100/80 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-700 font-semibold">Clocked in at {checkInTime}</p>
              {attendanceStatus && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusBadgeStyle()}`}>
                  {attendanceStatus}
                </span>
              )}
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
              <p className="text-gray-800 font-semibold">{classData.location || 'Location not set'}</p>
            </div>
          </div>

          {/* Radius */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Radio size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Clock-in Radius</p>
              <p className="text-gray-800 font-semibold">{classData.radius || 100} meters</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Class Time</p>
              <p className="text-gray-800 font-semibold">
                {classData.check_in_start
                  ? parseUTCTimestamp(classData.check_in_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  : '?'
                }
                {' — '}
                {classData.check_in_end
                  ? parseUTCTimestamp(classData.check_in_end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                  : '?'
                }
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
          {!isCheckedIn && !attendanceId && (
            <div className="mb-3">
              <button
                onClick={handleCheckIn}
                disabled={
                  // Disabled if:
                  // 1. Submitting
                  isSubmitting ||
                  // 2. Location IS required AND we don't have it or are out of range
                  ((!!classData.latitude && !!classData.longitude) && (!isInRange || isLocating || !!locationError)) ||
                  // 3. Status is absent (too late)
                  clockInInfo.disabled
                }
                className={`w-full py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  (!isSubmitting && !clockInInfo.disabled && ((!classData.latitude || !classData.longitude) || isInRange))
                    ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-blue-400/30 hover:shadow-xl hover:shadow-blue-400/40 hover:-translate-y-0.5 active:translate-y-0 text-base'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed text-sm'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Clocking in...
                  </>
                ) : (
                  <>
                    {clockInInfo.text} <span className="text-xs font-normal opacity-75">{clockInInfo.sub}</span>
                  </>
                )}
              </button>
              {/* Explanation text for disabled state - Only show if location IS required and we are out of range */}
              {!!classData.latitude && !!classData.longitude && !isInRange && !isLocating && !locationError && !clockInInfo.disabled && (
                <p className="text-xs text-gray-400 text-center mt-2.5">
                  Move within {classData.radius || 100}m of the class location to enable clock-in
                </p>
              )}
            </div>
          )}

          {/* Session Completed (Checked Out) */}
          {!isCheckedIn && attendanceId && (
             <div className="w-full py-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-gray-500 font-semibold mb-1">Session Completed</p>
             </div>
          )}

          {/* Check Out Button */}
          {isCheckedIn && (
            <button
              onClick={handleCheckOut}
              disabled={isSubmitting || !canCheckOut}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                canCheckOut
                  ? 'border-2 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 bg-white disabled:opacity-50'
                  : 'border-2 border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Clocking out...
                </>
              ) : canCheckOut ? (
                'Clock Out'
              ) : (
                'Clock-out available after class ends'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

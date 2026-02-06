'use client';

import { useState } from 'react';
import { MapPin, Radio, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Mock data for the student's current active class
const activeClass = {
  name: 'Machine Learning',
  location: 'KIT Phnom Penh Campus',
  radius: '100 meters',
  currentTime: '8:32 AM',
};

export default function StudentOngoingClassPage() {
  const [isInRange, setIsInRange] = useState(false);
  const [distanceFromArea, setDistanceFromArea] = useState('~25m');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const handleCheckIn = () => {
    if (isInRange) {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setCheckInTime(time);
      setIsCheckedIn(true);
    }
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#F8FAFC] -m-8 p-8">
      {/* Main Card - Stronger shadow for depth */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-300/40 w-full max-w-md overflow-hidden border border-gray-200/60">
        
        {/* Header - Softer gradient, calmer feel */}
        <div className="bg-gradient-to-br from-[#3B82F6] via-[#60A5FA] to-[#93C5FD] p-7">
          <h2 className="text-2xl font-bold text-white text-center">
            {activeClass.name}
          </h2>
          <p className="text-blue-100/90 text-sm text-center mt-1.5 font-medium">Ongoing Session</p>
        </div>

        {/* Status Banner - More elegant with padding */}
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

        {/* Class Details - Better label/value hierarchy */}
        <div className="p-6 space-y-5">
          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Location</p>
              <p className="text-gray-800 font-semibold">{activeClass.location}</p>
            </div>
          </div>

          {/* Radius */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Radio size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Check-in Radius</p>
              <p className="text-gray-800 font-semibold">{activeClass.radius}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={20} className="text-blue-500" />
            </div>
            <div className="pt-0.5">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Current Time</p>
              <p className="text-gray-800 font-semibold">{activeClass.currentTime}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Clear hierarchy */}
        <div className="p-6 pt-3 border-t border-gray-100 bg-gray-50/30">
          {/* Check In Button - Always visible */}
          <div className="mb-3">
            <button
              onClick={handleCheckIn}
              disabled={!isInRange || isCheckedIn}
              className={`w-full py-4 rounded-xl font-bold transition-all duration-200 ${
                isInRange && !isCheckedIn
                  ? 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-blue-400/30 hover:shadow-xl hover:shadow-blue-400/40 hover:-translate-y-0.5 active:translate-y-0 text-base'
                  : isCheckedIn
                    ? 'bg-emerald-100 text-emerald-700 cursor-default text-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed text-sm'
              }`}
            >
              {isCheckedIn ? '✓ Checked In' : 'Check In'}
            </button>
            {/* Explanation text for disabled state */}
            {!isInRange && !isCheckedIn && (
              <p className="text-xs text-gray-400 text-center mt-2.5">
                Move within the allowed range to enable check-in
              </p>
            )}
          </div>

          {/* Check Out Button - Only visible when checked in */}
          {isCheckedIn && (
            <button
              onClick={handleCheckOut}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border-2 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 bg-white"
            >
              Check Out
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

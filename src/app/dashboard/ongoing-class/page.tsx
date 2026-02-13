'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchOngoingClass, Class } from '@/lib/api';
import StudentOngoingClassPage from '@/components/dashboard/StudentOngoingClassPage';
import TeacherOngoingClassPage from '@/components/dashboard/TeacherOngoingClassPage';
import Link from 'next/link';

/* ───────────────────────────────────────────
   Inline SVG illustrations (no external assets)
   ─────────────────────────────────────────── */

function TeacherIllustration() {
  return (
    <svg width="220" height="210" viewBox="0 0 220 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gray background circle */}
      <circle cx="110" cy="105" r="85" fill="#F0EDED" />
      
      {/* ─── Empty Classroom (Red Theme) ─── */}
      
      {/* Floor Line */}
      <path d="M45 155 L175 155" stroke="#C75050" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Whiteboard / Chalkboard on wall */}
      <rect x="55" y="65" width="110" height="70" rx="6" fill="white" stroke="#E8E0E0" strokeWidth="2" />
      <rect x="60" y="70" width="100" height="60" rx="4" fill="#FFF5F5" />


      
      {/* Simple wall clock */}
      <circle cx="110" cy="50" r="12" fill="white" stroke="#EF4444" strokeWidth="1.5" />
      <path d="M110 50 L110 44" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M110 50 L114 54" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />

      {/* Teacher's Desk - Table with legs */}
      {/* Table Top */}
      <rect x="70" y="135" width="80" height="12" rx="3" fill="#EF4444" />
      <rect x="70" y="144" width="80" height="3" fill="#C75050" opacity="0.2" />
      
      {/* Left drawer unit */}
      <rect x="75" y="147" width="25" height="28" rx="2" fill="#EF4444" opacity="0.9" />
      {/* Drawer lines */}
      <rect x="78" y="154" width="19" height="1" fill="white" opacity="0.4" />
      <rect x="78" y="163" width="19" height="1" fill="white" opacity="0.4" />
      
      {/* Right Leg */}
      <rect x="135" y="147" width="10" height="28" rx="2" fill="#EF4444" opacity="0.9" />
      

      


      
      {/* ─── Chair (Color-adjusted) ─── */}
      {/* Back legs (Gray) */}
      <rect x="106" y="148" width="5" height="22" rx="2.5" fill="#9CA3AF" />
      <rect x="126" y="146" width="5" height="22" rx="2.5" fill="#9CA3AF" />
      {/* Backrest */}
      <rect x="102" y="122" width="32" height="22" rx="5" fill="#DC2626" />
      {/* Seat */}
      <rect x="94" y="144" width="38" height="11" rx="4" fill="#DC2626" />
      {/* Front legs */}
      <rect x="98" y="152" width="6" height="24" rx="3" fill="#DC2626" />
      <rect x="122" y="152" width="6" height="24" rx="3" fill="#DC2626" />

      {/* Floating Zzz (Quiet/Empty mood) */}
      <text x="145" y="75" fill="#EF4444" fontSize="12" fontWeight="bold" opacity="0.4">z</text>
      <text x="152" y="68" fill="#EF4444" fontSize="10" fontWeight="bold" opacity="0.3">z</text>
    </svg>
  );
}

function StudentIllustration() {
  return (
    <svg width="220" height="210" viewBox="0 0 220 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gray background circle */}
      <circle cx="110" cy="105" r="85" fill="#F0EDED" />

      {/* ─── Empty Classroom (Blue Theme) ─── */}
      
      {/* Floor Line */}
      <path d="M45 155 L175 155" stroke="#4878C8" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Whiteboard / Chalkboard on wall */}
      <rect x="55" y="65" width="110" height="70" rx="6" fill="white" stroke="#E0E4E8" strokeWidth="2" />
      <rect x="60" y="70" width="100" height="60" rx="4" fill="#F0F7FF" />


      
      {/* Simple wall clock */}
      <circle cx="110" cy="50" r="12" fill="white" stroke="#3B82F6" strokeWidth="1.5" />
      <path d="M110 50 L110 44" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M110 50 L114 54" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />

      {/* Student Desk - Table with legs */}
      {/* Table Top */}
      <rect x="70" y="135" width="80" height="12" rx="3" fill="#3B82F6" />
      
      {/* Left Leg */}
      <rect x="75" y="147" width="10" height="28" rx="2" fill="#4B5563" opacity="0.1" /> {/* Shadowy feel */}
      <rect x="75" y="147" width="10" height="28" rx="2" fill="#3B82F6" opacity="0.8" />
      
      {/* Right Leg */}
      <rect x="135" y="147" width="10" height="28" rx="2" fill="#3B82F6" opacity="0.8" />
      





      


      
      {/* ─── Chair (Color-adjusted) ─── */}
      {/* Back legs (Gray) */}
      <rect x="106" y="148" width="5" height="22" rx="2.5" fill="#9CA3AF" />
      <rect x="126" y="146" width="5" height="22" rx="2.5" fill="#9CA3AF" />
      {/* Backrest */}
      <rect x="102" y="122" width="32" height="22" rx="5" fill="#2563EB" />
      {/* Seat */}
      <rect x="94" y="144" width="38" height="11" rx="4" fill="#2563EB" />
      {/* Front legs */}
      <rect x="98" y="152" width="6" height="24" rx="3" fill="#2563EB" />
      <rect x="122" y="152" width="6" height="24" rx="3" fill="#2563EB" />

      {/* Floating Zzz (Quiet/Empty mood) */}
      <text x="145" y="75" fill="#3B82F6" fontSize="12" fontWeight="bold" opacity="0.4">z</text>
      <text x="152" y="68" fill="#3B82F6" fontSize="10" fontWeight="bold" opacity="0.3">z</text>
    </svg>
  );
}

/* ───────────────────────────────────────────
   Main page component
   ─────────────────────────────────────────── */

export default function OngoingClassPage() {
  const { user } = useAuth();
  const [classData, setClassData] = useState<Class | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOngoingClass() {
      if (!user?.id || !user?.role) return;

      try {
        const data = await fetchOngoingClass(user.id, user.role);
        setClassData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to check for ongoing class');
        setClassData(null);
      }
    }

    loadOngoingClass();
  }, [user?.id, user?.role]);

  const isTeacher = user?.role === 'teacher';

  // Loading state
  if (classData === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-4"
            style={{ color: isTeacher ? '#EF4444' : '#3B82F6' }}
          />
          <p className="text-gray-500">Checking for ongoing class...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  // No ongoing class — role-specific empty state
  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-sm w-full">
          {/* Illustration */}
          <div className="flex justify-center mb-6">
            {isTeacher ? <TeacherIllustration /> : <StudentIllustration />}
          </div>

          {/* Text */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isTeacher ? 'No ongoing class right now' : 'No class in session'}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {isTeacher
              ? 'Your class will appear here when it starts.'
              : "You'll be able to check in when your class begins."}
          </p>
        </div>
      </div>
    );
  }

  // Role-based rendering
  if (user?.role === 'student') {
    return <StudentOngoingClassPage classData={classData} />;
  }

  return <TeacherOngoingClassPage classData={classData} />;
}



export type AttendanceStatus = 'present' | 'late' | 'absent';

export function calculateAttendanceStatus(
  classStart: Date,
  classEnd: Date,
  checkInTime: Date
): AttendanceStatus {
  const duration = classEnd.getTime() - classStart.getTime();
  if (duration <= 0) {
    throw new Error('Invalid class duration');
  }

  const elapsed = checkInTime.getTime() - classStart.getTime();
  const percentage = elapsed / duration;

  // Rule 1: Present if check-in <= 15% of duration
  if (percentage <= 0.15) {
    return 'present';
  }
  // Rule 2: Late if 15% < check-in <= 40% of duration
  else if (percentage <= 0.40) {
    return 'late';
  }
  // Rule 3: Absent if > 40%
  else {
    // In the service we throw error, here we return absent or throw?
    // The requirement says "Absent: clock-in after 40%".
    // But also "Clock-in disabled".
    // Let's return 'absent' here, and let service decide to throw.
    return 'absent';
  }
}

export function calculateAttendanceScore(status: AttendanceStatus): number {
  switch (status) {
    case 'present': return 1.0;
    case 'late': return 0.5;
    case 'absent': return 0;
    default: return 0;
  }
}

export interface AttendanceSession {
  status: AttendanceStatus;
  checkInTime: Date;
  checkOutTime?: Date | null;
  classEndTime: Date;
}

export function calculateLeftEarly(
  checkInTime: Date,
  checkOutTime: Date | null | undefined,
  classEndTime: Date,
  now: Date = new Date()
): boolean {
    // If check-in exists but no check-out
    // AND it has been more than 15 mins since class ended
    const fifteenMinsAfter = new Date(classEndTime.getTime() + 15 * 60 * 1000);
    
    if (checkInTime && !checkOutTime && now > fifteenMinsAfter) {
        return true;
    }
    return false;
}

export function calculateAttendanceRate(
    sessions: { status: AttendanceStatus }[]
): number {
    let totalScore = 0;
    sessions.forEach(session => {
        totalScore += calculateAttendanceScore(session.status);
    });
    
    const totalSessions = sessions.length;
    if (totalSessions === 0) return 0;
    
    return (totalScore / totalSessions) * 100;
}

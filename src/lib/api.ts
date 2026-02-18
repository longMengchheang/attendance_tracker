// ============================================================
// API Helper Functions
// ============================================================
// Centralized API calls with error handling for the attendance tracker

// Types for API responses
export interface Class {
  id: string;
  name: string;
  description: string | null;
  code: string;
  teacher_id: string;
  created_at: string;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  radius?: number | null;
  check_in_start?: string | null;
  check_in_end?: string | null;
  days?: string[] | null;
}

export interface Enrollment {
  enrollmentId: string;
  enrolledAt: string;
  classId: string;
  className: string;
  classDescription: string | null;
  classCode: string;
  teacherId: string;
  teacherName: string;
  location: string | null;
  latitude: string | null;
  longitude: string | null;
  radius: number | null;
  checkInStart: string | null;
  checkInEnd: string | null;
  days: string[] | null;
  studentCount: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: 'present' | 'late' | 'absent';
  date: string;
  studentName?: string;
  className?: string;
}

export interface OngoingStudent {
  studentId: string;
  studentName: string;
  status: 'present' | 'late' | 'absent';
  checkInTime: string | null;
  checkOutTime: string | null;
  attendanceId: string | null;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
}

// ============================================================
// Teacher API Functions
// ============================================================

export async function fetchTeacherClasses(teacherId: string): Promise<Class[]> {
  const res = await fetch(`/api/classes?teacherId=${teacherId}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch classes');
  }
  
  return data.classes;
}

export async function createClass(
  teacherId: string, 
  name: string, 
  options?: {
    description?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    radius?: number;
    checkInStart?: string;
    checkInEnd?: string;
    days?: string[];
  }
): Promise<Class> {
  const res = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      teacherId, 
      name, 
      description: options?.description,
      location: options?.location,
      latitude: options?.latitude,
      longitude: options?.longitude,
      radius: options?.radius,
      checkInStart: options?.checkInStart,
      checkInEnd: options?.checkInEnd,
      days: options?.days,
    }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create class');
  }
  
  return data.class;
}

export async function updateClass(
  classId: string,
  teacherId: string,
  updates: { 
    name?: string; 
    description?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    radius?: number;
    checkInStart?: string;
    checkInEnd?: string;
    days?: string[];
  }
): Promise<Class> {
  const res = await fetch(`/api/classes/${classId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacherId, ...updates }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update class');
  }
  
  return data.class;
}

export async function deleteClass(classId: string, teacherId: string): Promise<void> {
  const res = await fetch(`/api/classes/${classId}?teacherId=${teacherId}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete class');
  }
}

export async function fetchClassStudents(
  classId: string, 
  requesterId: string,
  role: 'teacher' | 'student' = 'teacher'
): Promise<Student[]> {
  const param = role === 'teacher' ? 'teacherId' : 'studentId';
  const res = await fetch(`/api/classes/${classId}/students?${param}=${requesterId}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(`${data.error || 'Failed to fetch students'} (Class: ${classId}, Requester: ${requesterId}, Role: ${role})`);
  }
  
  return data.students;
}



// ============================================================
// Student API Functions
// ============================================================

export async function removeStudentFromClass(studentId: string, classId: string): Promise<boolean> {
  const res = await fetch(`/api/enrollments?studentId=${studentId}&classId=${classId}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to remove student');
  }
  
  return true;
}

export async function fetchStudentEnrollments(studentId: string): Promise<Enrollment[]> {
  const res = await fetch(`/api/enrollments?studentId=${studentId}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch enrollments');
  }
  
  return data.enrollments;
}

export async function joinClass(
  studentId: string, 
  code: string
): Promise<{ enrollment: any; class: Class }> {
  const res = await fetch('/api/enrollments/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, code }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to join class');
  }
  
  return data;
}

// ============================================================
// Attendance API Functions
// ============================================================

export async function checkIn(
  studentId: string, 
  classId: string,
  studentLat: number,
  studentLng: number
): Promise<{ record: AttendanceRecord; alreadyCheckedIn: boolean }> {
  const res = await fetch('/api/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, classId, studentLat, studentLng }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to check in');
  }
  
  return data;
}

export async function checkOut(attendanceId: string): Promise<AttendanceRecord> {
  const res = await fetch('/api/attendance/check-out', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attendanceId }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to check out');
  }
  
  return data.record;
}

export async function fetchOngoingClass(userId: string, role: string): Promise<Class | null> {
  const res = await fetch(`/api/classes/ongoing?userId=${userId}&role=${role}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch ongoing class');
  }
  
  return data.class;
}

export async function fetchOngoingAttendance(classId: string): Promise<OngoingStudent[]> {
  const res = await fetch(`/api/attendance/ongoing?classId=${classId}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch attendance');
  }
  
  return data.students;
}

export async function fetchAttendanceRecords(filters: {
  classId?: string;
  studentId?: string;
  date?: string;
}): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  if (filters.classId) params.append('classId', filters.classId);
  if (filters.studentId) params.append('studentId', filters.studentId);
  if (filters.date) params.append('date', filters.date);
  
  const res = await fetch(`/api/attendance?${params.toString()}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch attendance records');
  }
  
  return data.records;
}

export async function fetchStudentAttendanceReport(
  studentId: string,
  month: number,
  year: number,
  classId?: string
): Promise<{
  details: any[];
  summary: {
    totalSessions: number;
    present: number;
    late: number;
    absent: number;
    totalScore: number;
    attendancePercentage: number;
  };
}> {
  let url = `/api/attendance/report?studentId=${studentId}&month=${month}&year=${year}`;
  if (classId) {
    url += `&classId=${classId}`;
  }
  
  const res = await fetch(url, {
    cache: 'no-store'
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch attendance report');
  }

  return data.report;
}

export async function fetchStudentStats(studentId: string): Promise<{
    attendancePercentage: number;
    totalClasses: number;
    present: number;
    late: number;
    absent: number;
}> {
    const res = await fetch(`/api/attendance/stats?studentId=${studentId}`);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch student stats');
    }

    return data.stats;
}

export async function fetchClassAttendanceSummary(
  classId: string,
  month: number, // 0-11
  year: number
): Promise<{
  summary: {
    present: number;
    late: number;
    absent: number;
    totalClasses: number;
  };
  students: {
    studentId: string;
    name: string;
    present: number;
    late: number;
    absent: number;
    score: number;
    attendanceRate: number;
  }[];
}> {
  const res = await fetch(`/api/attendance/class-summary?classId=${classId}&month=${month}&year=${year}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch class attendance summary');
  }
  return res.json();
}

export async function fetchDailyClassAttendance(
  classId: string,
  date: string,
  teacherId?: string
): Promise<{
  summary: {
    present: number;
    late: number;
    absent: number;
  };
  students: {
    studentId: string;
    name: string;
    status: 'present' | 'late' | 'absent';
    checkInTime: string | null;
    checkOutTime: string | null;
    leftEarly: boolean;
  }[];
}> {
  const query = new URLSearchParams({ date });
  if (teacherId) query.append('teacherId', teacherId);
  
  const res = await fetch(`/api/classes/${classId}/attendance/daily?${query.toString()}`);
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to fetch daily attendance');
  }
  return res.json();
}

export async function fetchClassSessionsHistory(
  classId: string,
  month: number,
  year: number
): Promise<{
  date: string;
  present: number;
  late: number;
  absent: number;
}[]> {
  const res = await fetch(`/api/attendance/history?classId=${classId}&month=${month}&year=${year}`, {
    cache: 'no-store'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch class history');
  return data;
}

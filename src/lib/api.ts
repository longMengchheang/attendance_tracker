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
  studentCount: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  checkInTime: string;
  checkOutTime: string | null;
  date: string;
  studentName?: string;
  className?: string;
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
  teacherId: string
): Promise<Student[]> {
  const res = await fetch(`/api/classes/${classId}/students?teacherId=${teacherId}`);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch students');
  }
  
  return data.students;
}

// Fetch all students enrolled in any of teacher's classes
export async function fetchAllTeacherStudents(teacherId: string): Promise<Student[]> {
  // First get all teacher's classes
  const classes = await fetchTeacherClasses(teacherId);
  
  // Then fetch students for each class
  const studentPromises = classes.map(cls => 
    fetchClassStudents(cls.id, teacherId).catch(() => [])
  );
  
  const studentsArrays = await Promise.all(studentPromises);
  
  // Flatten and deduplicate by student ID
  const allStudents = studentsArrays.flat();
  const uniqueStudents = allStudents.reduce((acc, student) => {
    if (!acc.find(s => s.id === student.id)) {
      acc.push(student);
    }
    return acc;
  }, [] as Student[]);
  
  return uniqueStudents;
}

// ============================================================
// Student API Functions
// ============================================================

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
  classId: string
): Promise<{ record: AttendanceRecord; alreadyCheckedIn: boolean }> {
  const res = await fetch('/api/attendance/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, classId }),
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

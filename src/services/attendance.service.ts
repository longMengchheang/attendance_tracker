import { supabase, Attendance } from '@/lib/supabase';

/**
 * Check in a student
 */
export async function checkIn(studentId: string, classId: string): Promise<{ record: Attendance | null; alreadyCheckedIn: boolean }> {
  const today = new Date().toISOString().split('T')[0];

  // Check if already checked in today
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('date', today)
    .single();

  if (existing) {
    return { record: existing, alreadyCheckedIn: true };
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      student_id: studentId,
      class_id: classId,
      date: today,
    })
    .select()
    .single();

  if (error) {
    console.error('Check in error:', error);
    return { record: null, alreadyCheckedIn: false };
  }
  return { record: data, alreadyCheckedIn: false };
}

/**
 * Check out a student
 */
export async function checkOut(attendanceId: string): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out_time: new Date().toISOString(),
    })
    .eq('id', attendanceId)
    .select()
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Get attendance by student
 */
export async function getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      classes:class_id (
        id,
        name
      )
    `)
    .eq('student_id', studentId)
    .order('date', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Get attendance by class
 */
export async function getAttendanceByClass(classId: string, date?: string): Promise<any[]> {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      student:student_id (
        id,
        name
      )
    `)
    .eq('class_id', classId);

  if (date) {
    query = query.eq('date', date);
  }

  const { data, error } = await query.order('check_in_time', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Get today's attendance for a class
 */
export async function getTodayAttendance(classId: string): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];
  return getAttendanceByClass(classId, today);
}

/**
 * Check if student has checked in today
 */
export async function hasCheckedInToday(studentId: string, classId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .eq('date', today)
    .single();

  return !!data;
}

/**
 * Get attendance records with filters
 */
export async function getAttendanceRecords(filters: {
  studentId?: string;
  classId?: string;
  date?: string;
}): Promise<Attendance[]> {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      student:student_id (id, name),
      classes:class_id (id, name)
    `);

  if (filters.studentId) {
    query = query.eq('student_id', filters.studentId);
  }
  if (filters.classId) {
    query = query.eq('class_id', filters.classId);
  }
  if (filters.date) {
    query = query.eq('date', filters.date);
  }

  const { data, error } = await query.order('date', { ascending: false });

  if (error || !data) return [];
  return data;
}

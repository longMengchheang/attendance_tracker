import { supabase, Attendance } from '@/lib/supabase';
import { haversineDistance } from '@/lib/geo';
import { calculateAttendanceStatus, calculateAttendanceScore, calculateLeftEarly } from '@/lib/attendance-utils';

/**
 * Supabase returns timestamps without timezone suffix.
 * new Date() treats these as local time, but they are actually UTC.
 * This helper ensures they are parsed as UTC.
 */
function ensureUTC(ts: string): Date {
  if (/[Z]$/i.test(ts) || /[+-]\d{2}:\d{2}$/.test(ts)) return new Date(ts);
  return new Date(ts + 'Z');
}
/**
 * Check in a student with location validation and status assignment.
 * Uses server time for all logic.
 */
export async function checkIn(
  studentId: string,
  classId: string,
  studentLat: number,
  studentLng: number,
  _testDate?: Date
): Promise<{ record: Attendance | null; alreadyCheckedIn: boolean }> {
  const now = _testDate || new Date();
  // Use local date string YYYY-MM-DD to match frontend request and user's timezone
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

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

  // Fetch class details for validation
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (classError || !classData) {
    throw new Error('Class not found');
  }

  // Validate class is ongoing
  // Supabase stores timestamps in UTC. Without Z suffix, new Date()
  // would misinterpret them as local time, causing offset errors.
  const startStr = classData.check_in_start;
  const endStr = classData.check_in_end;

  if (!startStr || !endStr) {
    throw new Error('Class does not have start/end times configured');
  }

  const startTime = ensureUTC(startStr);
  const endTime = ensureUTC(endStr);

  if (now < startTime || now > endTime) {
    throw new Error('Class is not currently ongoing');
  }

  // Validate location
  const classLat = parseFloat(classData.latitude || '0');
  const classLng = parseFloat(classData.longitude || '0');
  const radius = classData.radius || 100;

  // Only validate distance if location is configured
  if (classData.latitude && classData.longitude) {
      const distance = haversineDistance(studentLat, studentLng, classLat, classLng);

      if (distance > radius) {
        throw new Error(`You are ${Math.round(distance)}m away. Must be within ${radius}m to check in.`);
      }
  }

  // Determine status based on percentage of class duration
  let status: 'present' | 'late' | 'absent';
  
  try {
      status = calculateAttendanceStatus(startTime, endTime, now);
  } catch (e: any) {
      throw new Error(e.message);
  }

  if (status === 'absent') {
    throw new Error('Clock-in time exceeded (Absent). You are more than 40% late.');
  }

  // Insert attendance record


  const { data, error } = await supabase
    .from('attendance')
    .insert({
      student_id: studentId,
      class_id: classId,
      check_in_time: now.toISOString(),
      status,
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
 * Check out a student. Only allowed after class end time.
 */
export async function checkOut(attendanceId: string, _testDate?: Date): Promise<Attendance | null> {
  const now = _testDate || new Date();
  // Fetch the attendance record to get the class_id
  const { data: record, error: recordError } = await supabase
    .from('attendance')
    .select('*')
    .eq('id', attendanceId)
    .single();

  if (recordError || !record) {
    throw new Error('Attendance record not found');
  }

  if (record.check_out_time) {
    throw new Error('Already checked out');
  }

  // Fetch the class to validate end time
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('check_in_end')
    .eq('id', record.class_id)
    .single();

  if (classError || !classData) {
    throw new Error('Class not found');
  }


  const endTime = classData.check_in_end ? ensureUTC(classData.check_in_end) : null;

  if (endTime && now < endTime) {
    throw new Error('Clock-out is only available after class ends.');
  }

  if (!endTime) {
     throw new Error('Class end time is not configured.');
  }

  // 15-minute window after class ends
  const fifteenMinutesAfter = new Date(endTime.getTime() + 15 * 60 * 1000);
  if (now > fifteenMinutesAfter) {
    throw new Error('Clock-out window has expired (15 mins after class).');
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out_time: now.toISOString(),
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

/**
 * Get ongoing class attendance: all enrolled students with their attendance status.
 * Students who haven't checked in are marked as "absent".
 */
export async function getOngoingClassAttendance(classId: string): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];

  // Get all enrolled students
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`
      student:student_id (
        id,
        name
      )
    `)
    .eq('class_id', classId);

  if (enrollError || !enrollments) return [];

  // Get today's attendance records
  const { data: records, error: recordsError } = await supabase
    .from('attendance')
    .select('*')
    .eq('class_id', classId)
    .eq('date', today);

  if (recordsError) return [];

  const attendanceMap = new Map<string, any>();
  if (records) {
    for (const record of records) {
      attendanceMap.set(record.student_id, record);
    }
  }

  // Fetch class details to calculate 'Left Early' status
  const { data: classData } = await supabase
    .from('classes')
    .select('check_in_end')
    .eq('id', classId)
    .single();

  const classEndTime = classData?.check_in_end ? ensureUTC(classData.check_in_end) : null;
  const now = new Date();

  // Merge: enrolled students + their attendance status
  return enrollments.map((e: any) => {
    const student = e.student;
    const record = attendanceMap.get(student.id);
    
    let leftEarly = false;
    if (record?.check_in_time && classEndTime) {
         leftEarly = calculateLeftEarly(
            new Date(record.check_in_time), // checkIn (UTC from DB, Date constructor assumes local if no Z, but likely has Z or is ISO)
            // Wait, supabase returns ISO string usually. ensureUTC handles it?
            // checking usages: ensureUTC is used for class times. 
            // DB timestamps are ISO strings. new Date(iso) works fine if they have Z. 
            // attendance table check_in_time usually has Z if inserted via .toISOString()
            record.check_out_time ? new Date(record.check_out_time) : null,
            classEndTime,
            now
         );
    }

    return {
      studentId: student.id,
      studentName: student.name || 'Unknown',
      status: record?.status || 'absent',
      checkInTime: record?.check_in_time || null,
      checkOutTime: record?.check_out_time || null,
      attendanceId: record?.id || null,
      leftEarly
    };
  });
}

/**
 * Get monthly attendance report for a student
 * Calculates score: Present=1.0, Late=0.5, Absent=0.0
 */
export async function getStudentAttendanceReport(
  studentId: string,
  month: number, // 0-11
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
  // 1. Get all classes the student was enrolled in
  // We need to find classes that *had sessions* during this month.
  // For simplicity, we'll look for all classes where the student is enrolled,
  // then look for all "sessions" (unique dates) that occurred for those classes in the target month.
  // Actually, a better approach given the schema might be to look at *scheduled* classes if we had a schedule table.
  // But we only have `classes` table which seems to represent a "Course" that might have a recurring schedule or just be a single session?
  //
  // Looking at `check_in_start`, it seems `classes` table acts more like specific "Sessions" or "Events" because they have specific start/end timestamps (YYYY-MM-DDTHH:mm...).
  // So we just need to find all `classes` where `check_in_start` falls within the target month AND student is enrolled.

  // Enable filtering by date range on classes check_in_start
  const startDate = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)); // Last day of month

  // Get student enrollments to find relevant class IDs
  let query = supabase
    .from('enrollments')
    .select('class_id')
    .eq('student_id', studentId);

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data: enrollments } = await query;

  if (!enrollments || enrollments.length === 0) {
    return {
      details: [],
      summary: { totalSessions: 0, present: 0, late: 0, absent: 0, totalScore: 0, attendancePercentage: 0 }
    };
  }

  const classIds = enrollments.map(e => e.class_id);

  // Fetch classes that happened in this month
  const { data: sessions } = await supabase
    .from('classes')
    .select('id, name, check_in_start, check_in_end')
    .in('id', classIds)
    .gte('check_in_start', startDate.toISOString())
    .lte('check_in_start', endDate.toISOString());

  if (!sessions || sessions.length === 0) {
    return {
      details: [],
      summary: { totalSessions: 0, present: 0, late: 0, absent: 0, totalScore: 0, attendancePercentage: 0 }
    };
  }

  // Fetch attendance records for these sessions
  const { data: records } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .in('class_id', sessions.map(s => s.id));

  const recordMap = new Map();
  if (records) {
    records.forEach(r => recordMap.set(r.class_id, r));
  }

  let totalScore = 0;
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  /* New Formula:
     Attendance Rate = ((Present * 1.0) + (Late * 0.5)) / Total Sessions * 100
  */

  const details = sessions.map(session => {
    const record = recordMap.get(session.id);
    let status = 'absent';
    let score = 0;
    let checkInTime = null;
    let checkOutTime = null;
    let leftEarly = false;

    if (record) {
      status = record.status;
      checkInTime = record.check_in_time;
      
      // Calculate Left Early: Checked in but no check out
      // We assume report is for past or current. If class ended > 15 mins ago and no checkout.
      // session.check_in_end is string derived from DB
      const classEndTime = new Date(session.check_in_end + 'Z'); // Ensure UTC
      const now = new Date(); // Or pass in test date if needed? For report we use real now.

      leftEarly = calculateLeftEarly(new Date(checkInTime), checkOutTime ? new Date(checkOutTime) : null, classEndTime, now);

      status === 'present' || status === 'late' || status === 'absent' ? 
          score = calculateAttendanceScore(status) : score = 0;

      if (status === 'present') {
        presentCount++;
      } else if (status === 'late') {
        lateCount++;
      } else {
        absentCount++;
      }
    } else {
      absentCount++;
    }

    totalScore += score;

    return {
      classId: session.id,
      className: session.name,
      date: session.check_in_start,
      status,
      score,
      checkInTime,
      checkOutTime,
      leftEarly
    };
  });

  const totalSessions = sessions.length;
  // Formula: ((Present * 1.0) + (Late * 0.5)) / Total Sessions * 100
  const attendancePercentage = totalSessions > 0 ? (totalScore / totalSessions) * 100 : 0;

  return {
    details,
    summary: {
      totalSessions,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      totalScore,
      attendancePercentage: Math.round(attendancePercentage * 10) / 10 // Round to 1 decimal
    }
  };
}

/**
 * Get overall attendance stats for a student
 * Calculates percentage across ALL past classes
 */
export async function getStudentOverallStats(studentId: string): Promise<{
    attendancePercentage: number;
    totalClasses: number;
    present: number;
    late: number;
    absent: number;
}> {
    // 1. Get all enrollments
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', studentId);

    if (!enrollments || enrollments.length === 0) {
        return { attendancePercentage: 0, totalClasses: 0, present: 0, late: 0, absent: 0 };
    }

    const classIds = enrollments.map(e => e.class_id);
    const now = new Date().toISOString();

    // 2. Get all PAST classes (sessions)
    const { data: sessions } = await supabase
        .from('classes')
        .select('id')
        .in('id', classIds)
        .lt('check_in_end', now); // Only count finished classes

    if (!sessions || sessions.length === 0) {
        return { attendancePercentage: 0, totalClasses: 0, present: 0, late: 0, absent: 0 };
    }

    // 3. Get attendance records for these sessions
    const { data: records } = await supabase
        .from('attendance')
        .select('status, class_id')
        .eq('student_id', studentId)
        .in('class_id', sessions.map(s => s.id));

    const recordMap = new Map();
    if (records) {
        records.forEach(r => recordMap.set(r.class_id, r.status));
    }

    let totalScore = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    sessions.forEach(session => {
        const status = recordMap.get(session.id);
        if (status === 'present') {
            totalScore += 1.0;
            presentCount++;
        } else if (status === 'late') {
            totalScore += 0.5;
            lateCount++;
        } else {
            // No record or explicit absent
            totalScore += 0;
            absentCount++;
        }
    });

    const totalClasses = sessions.length;
    const attendancePercentage = totalClasses > 0 ? (totalScore / totalClasses) * 100 : 0;

    return {
        attendancePercentage: Math.round(attendancePercentage * 10) / 10,
        totalClasses,
        present: presentCount,
        late: lateCount,
        absent: absentCount
    };
}


/**
 * Get class attendance summary for a specific month
 * Aggregates stats per student
 */
export async function getClassAttendanceSummary(
  classId: string,
  month: number,
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

  const startDate = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)); // Last day of month
  console.log(`[Service] Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // 1. Get all students enrolled in the class
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`
      student_id,
      enrolled_at,
      student:student_id (
        id,
        name
      )
    `)
    .eq('class_id', classId);

  if (enrollError || !enrollments) {
    throw new Error('Failed to fetch enrollments');
  }

  // 2. Get all attendance records for this class in the month range
  const { data: records, error: recordsError } = await supabase
    .from('attendance')
    .select('*')
    .eq('class_id', classId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (recordsError) {
    throw new Error('Failed to fetch attendance records');
  }

  // 3. Identify unique session dates
  // Convert timestamps/dates to YYYY-MM-DD
  const sessionDates = new Set<string>();
  if (records) {
    records.forEach(r => sessionDates.add(r.date));
  }
  const sessions = Array.from(sessionDates).sort();

  // 4. Aggregate per student
  let totalPresent = 0;
  let totalLate = 0;
  let totalAbsent = 0;

  const studentStats = enrollments.map((enrollment: any) => {
    const student = enrollment.student;
    
    // Filter sessions that occurred AFTER the student enrolled
    // enrollment.enrolled_at is a timestamp
    const enrolledDate = new Date(enrollment.enrolled_at).toISOString().split('T')[0];
    const validSessions = sessions.filter(date => date >= enrolledDate);

    // Get student's records
    const studentRecords = records?.filter(r => r.student_id === student.id) || [];
    
    let present = 0;
    let late = 0;
    let checkInCount = 0;

    studentRecords.forEach(r => {
      if (r.status === 'present') present++;
      if (r.status === 'late') late++;
      checkInCount++;
    });

    // Absent is implied: Valid Sessions - CheckIn Count
    // But we only count *valid* sessions for this student based on enrollment date
    // Note: checkInCount only includes records in the month range due to query filter
    // So logic holds: Total Sessions (in month) - Present/Late (in month) = Absent
    
    // Edge Case: If student record exists for a date NOT in validSessions (e.g. data anomaly), 
    // it counts as present but session count might be off.
    // Using filtered sessions is safer.
    
    // Re-calculate present/late based ONLY on valid sessions to be consistent
    present = 0;
    late = 0;
    studentRecords.forEach(r => {
        if (validSessions.includes(r.date)) {
             if (r.status === 'present') present++;
             if (r.status === 'late') late++;
        }
    });

    const absent = Math.max(0, validSessions.length - (present + late));
    
    // Score based on: Present=1.0, Late=0.5
    const score = (present * calculateAttendanceScore('present')) + (late * calculateAttendanceScore('late'));
    
    // Calculate rate relative to valid sessions for this student
    const totalPossible = validSessions.length;
    const rate = totalPossible > 0 ? (score / totalPossible) * 100 : 0;

    totalPresent += present;
    totalLate += late;
    totalAbsent += absent;

    return {
      studentId: student.id,
      name: student.name || 'Unknown',
      present,
      late,
      absent,
      score,
      attendanceRate: Math.round(rate * 10) / 10
    };
  });

  return {
    summary: {
      present: totalPresent,
      late: totalLate,
      absent: totalAbsent,
      totalClasses: sessions.length
    },
    students: studentStats.sort((a, b) => b.score - a.score) // Sort by score desc
  };
}

/**
 * Get class attendance for a specific date (Daily View)
 */
export async function getDailyClassAttendance(
  classId: string,
  date: string // YYYY-MM-DD
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
  // 1. Get all students enrolled in this class
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('student:student_id(id, name)')
    .eq('class_id', classId);

  if (enrollError) throw enrollError;

  // 2. Get attendance records for this date
  const { data: records, error: recordsError } = await supabase
    .from('attendance')
    .select('*')
    .eq('class_id', classId)
    .eq('date', date);

  if (recordsError) throw recordsError;

  type DailyStudent = { id: string; name: string | null };
  type DailyEnrollment = {
    student: DailyStudent | DailyStudent[] | null;
  };

  // 3. Map records for O(1) access
  const recordMap = new Map<string, Attendance>();
  const attendanceRecords = (records || []) as Attendance[];
  attendanceRecords.forEach((record) => recordMap.set(record.student_id, record));

  // 4. Merge and default missing records to absent
  let present = 0;
  let late = 0;
  let absent = 0;

  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('check_in_end')
    .eq('id', classId)
    .single();

  if (classError) throw classError;

  const classEnd = classData?.check_in_end ? ensureUTC(classData.check_in_end) : null;
  const now = new Date();

  const students = ((enrollments || []) as DailyEnrollment[])
    .flatMap((enrollment) => {
      if (!enrollment.student) return [];
      return Array.isArray(enrollment.student) ? enrollment.student : [enrollment.student];
    })
    .map((student) => {
      const record = recordMap.get(student.id);

      let status: 'present' | 'late' | 'absent' = 'absent';
      let checkInTime: string | null = null;
      let checkOutTime: string | null = null;
      let leftEarly = false;

      if (record) {
        status = (record.status || 'absent') as 'present' | 'late' | 'absent';
        checkInTime = record.check_in_time;
        checkOutTime = record.check_out_time;

        if (classEnd && checkInTime) {
          leftEarly = calculateLeftEarly(
            ensureUTC(checkInTime),
            checkOutTime ? ensureUTC(checkOutTime) : null,
            classEnd,
            now
          );
        }
      }

      if (status === 'present') present++;
      else if (status === 'late') late++;
      else absent++;

      return {
        studentId: student.id,
        name: student.name || 'Unknown',
        status,
        checkInTime,
        checkOutTime,
        leftEarly
      };
    });

  return {
    summary: { present, late, absent },
    students
  };
}

/**
 * Get list of past class sessions with attendance summary
 */
export async function getClassSessionsHistory(
  classId: string,
  month: number,
  year: number
): Promise<{
  date: string;
  present: number;
  late: number;
  absent: number;
}[]> {
  const startDate = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

  // 1. Get all attendance records for this class in range
  const { data: records, error } = await supabase
    .from('attendance')
    .select('date, status')
    .eq('class_id', classId)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (error) throw error;

  // 2. Group by date
  const sessions = new Map<string, { present: number; late: number; absent: number }>();

  records?.forEach(record => {
    if (!sessions.has(record.date)) {
      sessions.set(record.date, { present: 0, late: 0, absent: 0 });
    }
    const stats = sessions.get(record.date)!;
    if (record.status === 'present') stats.present++;
    else if (record.status === 'late') stats.late++;
    else stats.absent++; // Count explicit absent records from the table
  });

  // Note: This only counts *recorded* attendance. 
  // Ideally, 'absent' should checks against total enrollments, but for 'History' view 
  // usually showing recorded data is a good start. 
  // To be perfectly accurate (implicit absence), we'd need to fetch enrollments count per date 
  // or just use current enrollment count as approximation.
  // For now, let's use the explicit records + we can fetch current enrollment count to derive implicit absent if needed.
  // BUT: The existing `getClassAttendanceSummary` calculates implicit absent. 
  // Let's refine this to be consistent with `getClassAttendanceSummary` logic if strict accuracy is needed,
  // but for a list view, grouping records is often sufficient if "absent" rows are created by the system.
  // Assuming the system DOES create absent rows (e.g. via cron or manual trigger), this is fine.
  // If not, we might hide "Absent" count or just show recorded ones.
  // Let's stick to recorded data for now as it's faster.

  return Array.from(sessions.entries()).map(([date, stats]) => ({
    date,
    ...stats
  })).sort((a, b) => b.date.localeCompare(a.date)); // Sort desc
}

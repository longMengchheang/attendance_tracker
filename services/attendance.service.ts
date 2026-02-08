import { db } from '@/lib/db';
import { attendance, classes, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Check in to a class
export async function checkIn(studentId: string, classId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if already checked in today for this class
  const [existingRecord] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.classId, classId),
        eq(attendance.date, today)
      )
    )
    .limit(1);

  if (existingRecord) {
    // If already checked in but not checked out, return existing record
    if (!existingRecord.checkOutTime) {
      return { record: existingRecord, alreadyCheckedIn: true };
    }
    // If already checked out, don't allow another check-in for the same day
    throw new Error('Already checked in and out for this class today');
  }

  // Create new attendance record
  const [newRecord] = await db
    .insert(attendance)
    .values({
      studentId,
      classId,
      date: today,
    })
    .returning();

  return { record: newRecord, alreadyCheckedIn: false };
}

// Check out from a class
export async function checkOut(attendanceId: string) {
  const [record] = await db
    .select()
    .from(attendance)
    .where(eq(attendance.id, attendanceId))
    .limit(1);

  if (!record) {
    throw new Error('Attendance record not found');
  }

  if (record.checkOutTime) {
    throw new Error('Already checked out');
  }

  const [updatedRecord] = await db
    .update(attendance)
    .set({ checkOutTime: new Date() })
    .where(eq(attendance.id, attendanceId))
    .returning();

  return updatedRecord;
}

// Get attendance records with optional filters
export async function getAttendanceRecords(filters: {
  studentId?: string;
  classId?: string;
  date?: string;
}) {
  let query = db
    .select({
      id: attendance.id,
      studentId: attendance.studentId,
      classId: attendance.classId,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      date: attendance.date,
      studentName: users.name,
      studentEmail: users.email,
      className: classes.name,
    })
    .from(attendance)
    .innerJoin(users, eq(attendance.studentId, users.id))
    .innerJoin(classes, eq(attendance.classId, classes.id))
    .orderBy(desc(attendance.date), desc(attendance.checkInTime));

  // Apply filters using $dynamic
  const conditions = [];
  if (filters.studentId) {
    conditions.push(eq(attendance.studentId, filters.studentId));
  }
  if (filters.classId) {
    conditions.push(eq(attendance.classId, filters.classId));
  }
  if (filters.date) {
    conditions.push(eq(attendance.date, filters.date));
  }

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

// Get active attendance (checked in but not checked out) for a student
export async function getActiveAttendance(studentId: string, classId: string) {
  const today = new Date().toISOString().split('T')[0];

  const [record] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.classId, classId),
        eq(attendance.date, today)
      )
    )
    .limit(1);

  return record || null;
}

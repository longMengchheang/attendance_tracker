import { db } from '@/lib/db';
import { enrollments, classes, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Join a class using class code
export async function joinClass(studentId: string, classCode: string) {
  // Find the class by code
  const [classData] = await db
    .select()
    .from(classes)
    .where(eq(classes.code, classCode.toUpperCase()))
    .limit(1);

  if (!classData) {
    throw new Error('Class not found');
  }

  // Check if already enrolled
  const [existingEnrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.classId, classData.id)
      )
    )
    .limit(1);

  if (existingEnrollment) {
    throw new Error('Already enrolled in this class');
  }

  // Create enrollment
  const [newEnrollment] = await db
    .insert(enrollments)
    .values({
      studentId,
      classId: classData.id,
    })
    .returning();

  return { enrollment: newEnrollment, class: classData };
}

// Get all enrollments for a student with class details
export async function getStudentEnrollments(studentId: string) {
  // First, get the enrollments with class and teacher info
  const result = await db
    .select({
      enrollmentId: enrollments.id,
      enrolledAt: enrollments.enrolledAt,
      classId: classes.id,
      className: classes.name,
      classDescription: classes.description,
      classCode: classes.code,
      teacherId: classes.teacherId,
      teacherName: users.name,
      location: classes.location,
      latitude: classes.latitude,
      longitude: classes.longitude,
      radius: classes.radius,
      checkInStart: classes.checkInStart,
      checkInEnd: classes.checkInEnd,
    })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .innerJoin(users, eq(classes.teacherId, users.id))
    .where(eq(enrollments.studentId, studentId));

  // Get student counts for each class
  const enrolledClasses = result.map(r => r.classId);
  
  // For each class, count the students
  const enrichedResult = await Promise.all(
    result.map(async (enrollment) => {
      const studentCount = await db
        .select({ count: enrollments.id })
        .from(enrollments)
        .where(eq(enrollments.classId, enrollment.classId));
      
      return {
        ...enrollment,
        studentCount: studentCount.length,
      };
    })
  );

  return enrichedResult;
}

// Check if student is enrolled in a class
export async function isEnrolled(studentId: string, classId: string) {
  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.classId, classId)
      )
    )
    .limit(1);

  return !!enrollment;
}

// Remove enrollment
export async function leaveClass(studentId: string, classId: string) {
  const [deleted] = await db
    .delete(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.classId, classId)
      )
    )
    .returning();

  return deleted;
}

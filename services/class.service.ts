import { db } from '@/lib/db';
import { classes, enrollments, users, NewClass } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Generate a random 6-character alphanumeric code
function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new class
export async function createClass(data: {
  teacherId: string;
  name: string;
  description?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  radius?: number;
  checkInStart?: string;
  checkInEnd?: string;
}) {
  const code = generateClassCode();

  const [newClass] = await db
    .insert(classes)
    .values({
      name: data.name,
      description: data.description,
      code,
      teacherId: data.teacherId,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius || 100,
      checkInStart: data.checkInStart,
      checkInEnd: data.checkInEnd,
    })
    .returning();

  return newClass;
}

// Update a class
export async function updateClass(
  classId: string,
  data: { 
    name?: string; 
    description?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    radius?: number;
    checkInStart?: string;
    checkInEnd?: string;
  }
) {
  const [updatedClass] = await db
    .update(classes)
    .set(data)
    .where(eq(classes.id, classId))
    .returning();

  return updatedClass;
}

// Delete a class
export async function deleteClass(classId: string) {
  const [deletedClass] = await db
    .delete(classes)
    .where(eq(classes.id, classId))
    .returning();

  return deletedClass;
}

// Get all classes for a teacher
export async function getTeacherClasses(teacherId: string) {
  return db
    .select()
    .from(classes)
    .where(eq(classes.teacherId, teacherId))
    .orderBy(classes.createdAt);
}

// Get class by ID
export async function getClassById(classId: string) {
  const [classData] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  return classData || null;
}

// Get class by code
export async function findClassByCode(code: string) {
  const [classData] = await db
    .select()
    .from(classes)
    .where(eq(classes.code, code.toUpperCase()))
    .limit(1);

  return classData || null;
}

// Get all students in a class
export async function getClassStudents(classId: string) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      enrolledAt: enrollments.enrolledAt,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .where(eq(enrollments.classId, classId));

  return result;
}

// Check if user is the teacher of a class
export async function isClassTeacher(classId: string, teacherId: string) {
  const [classData] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, teacherId)))
    .limit(1);

  return !!classData;
}

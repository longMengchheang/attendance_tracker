import { supabase, Enrollment } from '@/lib/supabase';

/**
 * Create enrollment (student joins a class)
 */
export async function createEnrollment(studentId: string, classId: string): Promise<Enrollment | null> {
  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .single();

  if (existing) {
    return existing; // Already enrolled
  }

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      class_id: classId,
    })
    .select()
    .single();

  if (error) {
    console.error('Enrollment error:', error);
    return null;
  }
  return data;
}

/**
 * Get enrollments by student ID
 */
export async function getEnrollmentsByStudent(studentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      classes:class_id (
        *,
        teacher:teacher_id (
          id,
          name
        )
      )
    `)
    .eq('student_id', studentId);

  if (error || !data) return [];
  return data;
}

/**
 * Get enrollments by class ID
 */
export async function getEnrollmentsByClass(classId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:student_id (
        id,
        name
      )
    `)
    .eq('class_id', classId);

  if (error || !data) return [];
  return data;
}

/**
 * Delete enrollment
 */
export async function deleteEnrollment(studentId: string, classId: string): Promise<boolean> {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', studentId)
    .eq('class_id', classId);

  return !error;
}

/**
 * Count students in a class
 */
export async function countStudentsInClass(classId: string): Promise<number> {
  const { count, error } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId);

  if (error) return 0;
  return count || 0;
}

/**
 * Get enrollments by student (alias for API compatibility)
 */
export const getStudentEnrollments = getEnrollmentsByStudent;

/**
 * Join a class by code
 */
export async function joinClass(studentId: string, code: string): Promise<{ enrollment: any; class: any }> {
  // Find class by code
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (classError || !classData) {
    throw new Error('Class not found');
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId)
    .eq('class_id', classData.id)
    .single();

  if (existing) {
    throw new Error('Already enrolled in this class');
  }

  // Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      class_id: classData.id,
    })
    .select()
    .single();

  if (enrollError) {
    console.error('Enrollment error:', enrollError);
    throw new Error('Failed to enroll');
  }

  return { enrollment, class: classData };
}

/**
 * Check if a student is enrolled in a class
 */
export async function isEnrolled(studentId: string, classId: string): Promise<boolean> {
  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .single();

  return !!data;
}

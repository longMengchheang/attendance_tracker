import { supabase, Class } from '@/lib/supabase';

/**
 * Generate a random 6-character class code
 */
function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new class
 */
export async function createClass(data: {
  name: string;
  description?: string;
  teacherId: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  radius?: number;
  checkInStart?: string;
  checkInEnd?: string;
}): Promise<{ data: Class | null; error: any }> {
  const code = generateClassCode();

  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({
      name: data.name,
      description: data.description || null,
      code,
      teacher_id: data.teacherId,
      location: data.location || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      radius: data.radius || 100,
      check_in_start: data.checkInStart || null,
      check_in_end: data.checkInEnd || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Create class error:', error);
    return { data: null, error };
  }
  return { data: newClass, error: null };
}

/**
 * Get class by ID
 */
export async function getClassById(id: string): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Get class by code
 */
export async function getClassByCode(code: string): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Get all classes by teacher ID
 */
export async function getClassesByTeacher(teacherId: string): Promise<Class[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Update a class
 */
export async function updateClass(id: string, updates: Partial<Class>): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Delete a class
 */
export async function deleteClass(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id);

  return !error;
}

/**
 * Get all classes
 */
export async function getAllClasses(): Promise<Class[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Get all classes by teacher ID (alias for getClassesByTeacher)
 */
export const getTeacherClasses = getClassesByTeacher;

/**
 * Check if a user is the teacher of a class
 */
export async function isClassTeacher(classId: string, teacherId: string): Promise<boolean> {
  const { data } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacherId)
    .single();

  return !!data;
}

/**
 * Get all students in a class
 */
export async function getClassStudents(classId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      student:student_id (
        id,
        name
      )
    `)
    .eq('class_id', classId);

  if (error || !data) return [];
  return data.map((e: any) => e.student);
}

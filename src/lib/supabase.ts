import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// ============ TYPES ============

export interface Users {
  id: string;
  name: string | null;
  email?: string | null;
  role: 'student' | 'teacher';
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  description: string | null;
  code: string;
  teacher_id: string;
  location: string | null;
  latitude: string | null;
  longitude: string | null;
  radius: number;
  check_in_start: string | null;
  check_in_end: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  check_in_time: string;
  check_out_time: string | null;
  date: string;
}

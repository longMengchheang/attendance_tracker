
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isClassTeacher } from '@/services/class.service';

export async function GET() {
  try {
    const { data: teacher } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .limit(1)
      .single();

    if (!teacher) return NextResponse.json({ error: 'No teacher found' });

    const { data: cls } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacher.id)
      .limit(1)
      .single();

    if (!cls) return NextResponse.json({ error: 'No class found' });

    const isOwner = await isClassTeacher(cls.id, teacher.id);

    return NextResponse.json({
      teacherId: teacher.id,
      classId: cls.id,
      isOwner,
      message: isOwner ? 'Success' : 'Failed'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}

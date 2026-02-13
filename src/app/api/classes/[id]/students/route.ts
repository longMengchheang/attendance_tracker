import { NextResponse } from 'next/server';
import { getClassStudents, isClassTeacher } from '@/services/class.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/classes/[id]/students - Get all students in a class
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');

    if (!teacherId && !studentId) {
      return NextResponse.json(
        { error: 'Teacher ID or Student ID is required' },
        { status: 400 }
      );
    }

    // If teacherId provided, verify ownership
    if (teacherId) {
      const isOwner = await isClassTeacher(id, teacherId);
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } 
    // If studentId provided, verify enrollment
    else if (studentId) {
      // Import directly here to avoid circular dependencies if any, or use existing service
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('class_id', id)
        .eq('student_id', studentId)
        .single();
      
      if (!data) {
        return NextResponse.json(
          { error: 'Unauthorized: Not enrolled in this class' },
          { status: 403 }
        );
      }
    }

    const students = await getClassStudents(id);

    return NextResponse.json({ students });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

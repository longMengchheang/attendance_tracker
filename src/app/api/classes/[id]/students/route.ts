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

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Verify the teacher owns this class
    const isOwner = await isClassTeacher(id, teacherId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
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

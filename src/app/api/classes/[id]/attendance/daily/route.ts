import { NextResponse } from 'next/server';
import { getDailyClassAttendance } from '@/services/attendance.service';
import { isClassTeacher } from '@/services/class.service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const teacherId = searchParams.get('teacherId');
    const classId = params.id;

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      );
    }

    // Verify authorization if teacherId is provided (optional for now as we might want to allow students to see their own daily view? No, this is for teacher view)
    if (teacherId) {
        const isTeacher = await isClassTeacher(classId, teacherId);
        if (!isTeacher) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
    }

    const data = await getDailyClassAttendance(classId, date);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching daily attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch daily attendance' },
      { status: 500 }
    );
  }
}

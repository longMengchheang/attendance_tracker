import { NextResponse } from 'next/server';
import { getOngoingClassAttendance } from '@/services/attendance.service';

// GET /api/attendance/ongoing - Get real-time attendance for an ongoing class
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { error: 'classId is required' },
        { status: 400 }
      );
    }

    const students = await getOngoingClassAttendance(classId);
    return NextResponse.json({ students });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error fetching ongoing attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getStudentAttendanceReport } from '@/services/attendance.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const classId = searchParams.get('classId') || undefined;

    if (!studentId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required parameters: studentId, month, year' },
        { status: 400 }
      );
    }

    const report = await getStudentAttendanceReport(
      studentId,
      parseInt(month),
      parseInt(year),
      classId
    );

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Error fetching attendance report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance report' },
      { status: 500 }
    );
  }
}

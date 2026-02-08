import { NextResponse } from 'next/server';
import { getAttendanceRecords } from '@/services/attendance.service';

// GET /api/attendance - Get attendance records with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const date = searchParams.get('date') || undefined;

    const records = await getAttendanceRecords({ studentId, classId, date });
    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

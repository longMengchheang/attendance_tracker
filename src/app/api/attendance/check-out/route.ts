import { NextResponse } from 'next/server';
import { checkOut } from '@/services/attendance.service';

// POST /api/attendance/check-out - Check out from a class
export async function POST(request: Request) {
  try {
    const { attendanceId } = await request.json();

    if (!attendanceId) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    const record = await checkOut(attendanceId);

    return NextResponse.json({
      message: 'Check-out successful',
      record,
    });
  } catch (error: any) {
    console.error('Error checking out:', error);

    if (error.message === 'Attendance record not found') {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Already checked out') {
      return NextResponse.json(
        { error: 'Already checked out' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

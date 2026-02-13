import { NextResponse } from 'next/server';
import { checkOut } from '@/services/attendance.service';

// POST /api/attendance/check-out - Check out from a class (only after class ends)
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
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
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

    if (error.message === 'Check-out is only available after class ends.') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { checkIn } from '@/services/attendance.service';
import { isEnrolled } from '@/services/enrollment.service';

// POST /api/attendance/check-in - Check in to a class
export async function POST(request: Request) {
  try {
    const { studentId, classId } = await request.json();

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student ID and class ID are required' },
        { status: 400 }
      );
    }

    // Verify student is enrolled in the class
    const enrolled = await isEnrolled(studentId, classId);
    if (!enrolled) {
      return NextResponse.json(
        { error: 'Not enrolled in this class' },
        { status: 403 }
      );
    }

    const result = await checkIn(studentId, classId);

    if (result.alreadyCheckedIn) {
      return NextResponse.json({
        message: 'Already checked in',
        record: result.record,
        alreadyCheckedIn: true,
      });
    }

    return NextResponse.json({
      message: 'Check-in successful',
      record: result.record,
      alreadyCheckedIn: false,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error checking in:', error);

    if (error.message === 'Already checked in and out for this class today') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

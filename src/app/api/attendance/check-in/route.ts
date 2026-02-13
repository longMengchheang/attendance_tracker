import { NextResponse } from 'next/server';
import { checkIn } from '@/services/attendance.service';
import { isEnrolled } from '@/services/enrollment.service';

// POST /api/attendance/check-in - Check in to a class with location validation
export async function POST(request: Request) {
  try {
    const { studentId, classId, studentLat, studentLng } = await request.json();

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student ID and class ID are required' },
        { status: 400 }
      );
    }

    if (studentLat === undefined || studentLng === undefined) {
      return NextResponse.json(
        { error: 'Student location (latitude and longitude) is required' },
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

    const result = await checkIn(studentId, classId, parseFloat(studentLat), parseFloat(studentLng));

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

    // Return specific error messages from the service
    const knownErrors = [
      'Class not found',
      'Class is not currently ongoing',
      'Class does not have start/end times configured',
      'Class location is not configured',
      'Already checked in and out for this class today',
    ];

    if (knownErrors.some(e => error.message?.includes(e)) || error.message?.includes('away')) {
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

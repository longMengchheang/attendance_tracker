import { NextResponse } from 'next/server';
import { getStudentEnrollments } from '@/services/enrollment.service';

// GET /api/enrollments - Get all enrolled classes for a student
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const enrollmentsData = await getStudentEnrollments(studentId);
    return NextResponse.json({ enrollments: enrollmentsData });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getStudentEnrollments, countStudentsInClass } from '@/services/enrollment.service';

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
    
    // Transform data to match Enrollment interface
    const formattedEnrollments = await Promise.all(enrollmentsData.map(async (item: any) => {
      const count = await countStudentsInClass(item.classes.id);
      return {
        enrollmentId: item.id,
        enrolledAt: item.enrolled_at,
        classId: item.classes.id,
        className: item.classes.name,
        classDescription: item.classes.description,
        classCode: item.classes.code,
        teacherId: item.classes.teacher_id,
        teacherName: item.classes.teacher?.name || 'Unknown',
        location: item.classes.location,
        latitude: item.classes.latitude,
        longitude: item.classes.longitude,
        radius: item.classes.radius,
        checkInStart: item.classes.check_in_start,
        checkInEnd: item.classes.check_in_end,
        days: item.classes.days,
        studentCount: count
      };
    }));

    return NextResponse.json({ enrollments: formattedEnrollments });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/enrollments - Delete an enrollment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student ID and Class ID are required' },
        { status: 400 }
      );
    }

    // Import dynamically to avoid circular dependencies if any
    const { deleteEnrollment } = await import('@/services/enrollment.service');
    
    const success = await deleteEnrollment(studentId, classId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

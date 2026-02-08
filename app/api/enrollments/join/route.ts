import { NextResponse } from 'next/server';
import { joinClass } from '@/services/enrollment.service';

// POST /api/enrollments/join - Join a class using class code
export async function POST(request: Request) {
  try {
    const { studentId, code } = await request.json();

    if (!studentId || !code) {
      return NextResponse.json(
        { error: 'Student ID and class code are required' },
        { status: 400 }
      );
    }

    const result = await joinClass(studentId, code);

    return NextResponse.json({
      message: 'Successfully joined class',
      enrollment: result.enrollment,
      class: result.class,
    });
  } catch (error: any) {
    console.error('Error joining class:', error);

    if (error.message === 'Class not found') {
      return NextResponse.json(
        { error: 'Invalid class code' },
        { status: 404 }
      );
    }

    if (error.message === 'Already enrolled in this class') {
      return NextResponse.json(
        { error: 'Already enrolled in this class' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

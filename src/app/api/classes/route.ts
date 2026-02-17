import { NextResponse } from 'next/server';
import { createClass, getTeacherClasses } from '@/services/class.service';

// Helper to validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET /api/classes - Get all classes for a teacher
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    if (!isValidUUID(teacherId)) {
      return NextResponse.json(
        { error: 'Invalid teacher ID format' },
        { status: 400 }
      );
    }

    const classesData = await getTeacherClasses(teacherId);
    return NextResponse.json({ classes: classesData });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create a new class
export async function POST(request: Request) {
  try {
    const { 
      teacherId, 
      name, 
      description,
      location,
      latitude,
      longitude,
      radius,
      checkInStart,
      checkInEnd,
      days
    } = await request.json();

    if (!teacherId || !name) {
      return NextResponse.json(
        { error: 'Teacher ID and class name are required' },
        { status: 400 }
      );
    }

    const { data: newClass, error } = await createClass({ 
      teacherId, 
      name, 
      description,
      location,
      latitude,
      longitude,
      radius,
      checkInStart,
      checkInEnd,
      days
    });

    if (error || !newClass) {
      console.error('Error creating class:', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to create class' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Class created successfully', class: newClass },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

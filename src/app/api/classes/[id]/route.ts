import { NextResponse } from 'next/server';
import { updateClass, deleteClass, getClassById, isClassTeacher } from '@/services/class.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/classes/[id] - Get class details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const classData = await getClassById(id);

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classData });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Update a class
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { 
      teacherId, 
      name, 
      description,
      location,
      latitude,
      longitude,
      radius,
      checkInStart,
      checkInEnd
    } = await request.json();

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Verify the teacher owns this class
    const isOwner = await isClassTeacher(id, teacherId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // specific updates with converting camelCase to snake_case
    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (radius !== undefined) updates.radius = radius;
    if (checkInStart !== undefined) updates.check_in_start = checkInStart;
    if (checkInEnd !== undefined) updates.check_in_end = checkInEnd;

    const updatedClass = await updateClass(id, updates);

    if (!updatedClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Class updated successfully',
      class: updatedClass,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete a class
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Verify the teacher owns this class
    const isOwner = await isClassTeacher(id, teacherId);
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const deletedClass = await deleteClass(id);

    if (!deletedClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Class deleted successfully',
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

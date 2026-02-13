import { NextResponse } from 'next/server';
import { getOngoingClass } from '@/services/class.service';

// GET /api/classes/ongoing - Get the currently ongoing class for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    const classData = await getOngoingClass(userId, role);
    return NextResponse.json({ class: classData });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error fetching ongoing class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

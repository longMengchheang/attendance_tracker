import { NextResponse } from 'next/server';
import { getStudentOverallStats } from '@/services/attendance.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: studentId' },
        { status: 400 }
      );
    }

    const stats = await getStudentOverallStats(studentId);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance stats' },
      { status: 500 }
    );
  }
}

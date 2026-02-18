import { NextResponse } from 'next/server';
import { getClassSessionsHistory } from '@/services/attendance.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!classId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required parameters: classId, month, year' },
        { status: 400 }
      );
    }

    const data = await getClassSessionsHistory(
      classId,
      parseInt(month),
      parseInt(year)
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching class history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch class history' },
      { status: 500 }
    );
  }
}

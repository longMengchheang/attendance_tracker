import { NextResponse } from 'next/server';
import { getClassAttendanceSummary } from '@/services/attendance.service';
import { isClassTeacher } from '@/services/class.service';

// Force dynamic to prevent caching issues with searchParams
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const classId = params.id;

    if (!month || !year || !teacherId) {
      return NextResponse.json(
        { error: 'Missing required parameters: month, year, teacherId' },
        { status: 400 }
      );
    }

    // Verify teacher owner
    const isTeacher = await isClassTeacher(classId, teacherId);
    if (!isTeacher) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await getClassAttendanceSummary(
      classId,
      parseInt(month),
      parseInt(year)
    );

    // Generate CSV
    // Columns: Student,Present,Late,Absent,Attendance Rate
    const headers = ['Student', 'Present', 'Late', 'Absent', 'Attendance Rate'];
    const rows = data.students.map(student => {
       return [
            `"${student.name}"`, // Quote name to handle commas
            student.present,
            student.late,
            student.absent,
            `${student.attendanceRate}%` 
       ].join(',');
    });

    const csvContent = [
        headers.join(','),
        ...rows
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-export-${month}-${year}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating CSV export:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate CSV export' },
      { status: 500 }
    );
  }
}

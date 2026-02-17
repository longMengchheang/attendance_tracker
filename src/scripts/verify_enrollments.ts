
import { supabase } from '../lib/supabase';

async function checkEnrollments() {
  console.log('--- Checking Enrollments ---');

  // 1. Get all enrollments with student data
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      class_id,
      student_id,
      student:student_id (
        id,
        name
      ),
      class:class_id (
        id,
        name
      )
    `);

  if (error) {
    console.error('Error fetching enrollments:', error);
    return;
  }

  if (!enrollments || enrollments.length === 0) {
    console.log('No enrollments found.');
    return;
  }

  console.log(`Found ${enrollments.length} enrollments.`);

  // Group by Class
  const byClass: Record<string, any[]> = {};
  enrollments.forEach(e => {
    // Cast to expected type to avoid type errors
    const classData = e.class as any;
    const studentData = e.student as any;

    const className = classData?.name || 'Unknown Class (' + e.class_id + ')';
    if (!byClass[className]) byClass[className] = [];
    
    byClass[className].push({
      enrollmentId: e.id,
      studentName: studentData?.name || 'Unknown Student',
      studentId: e.student_id
    });
  });

  // Print Summary
  Object.keys(byClass).forEach(className => {
    console.log(`\nClass: ${className}`);
    byClass[className].forEach(student => {
      console.log(`  - ${student.studentName} [ID: ${student.studentId}]`);
    });
  });
}

checkEnrollments().catch(console.error);

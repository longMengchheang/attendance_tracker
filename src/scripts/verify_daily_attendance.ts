
import 'dotenv/config';
import { getDailyClassAttendance } from '@/services/attendance.service';
import { supabase } from '@/lib/supabase';

async function testDailyAttendance() {
  console.log('Testing getDailyClassAttendance...');

  // 1. Get a class ID
  const { data: classes } = await supabase.from('classes').select('id, name').limit(1);
  if (!classes || classes.length === 0) {
    console.log('No classes found');
    return;
  }
  const classId = classes[0].id;
  console.log(`Testing with class: ${classes[0].name} (${classId})`);

  // 2. Test for today
  const today = new Date().toISOString().split('T')[0];
  console.log(`Fetching for date: ${today}`);

  try {
    const data = await getDailyClassAttendance(classId, today);
    console.log('Daily Attendance Summary:', data.summary);
    console.log('Student Count:', data.students.length);
    if (data.students.length > 0) {
        console.log('First student sample:', data.students[0]);
    }
  } catch (error) {
    console.error('Error fetching daily attendance:', error);
  }
}

testDailyAttendance();

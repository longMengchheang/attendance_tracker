import { pgTable, text, uuid, pgEnum, timestamp, date, integer } from 'drizzle-orm/pg-core';

// ============ ENUMS ============
export const roleEnum = pgEnum('role', ['student', 'teacher']);

// ============ USERS TABLE ============
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============ CLASSES TABLE ============
export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  code: text('code').notNull().unique(), // 6-character join code
  teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Location fields
  location: text('location'), // Human-readable address
  latitude: text('latitude'), // GPS coordinate
  longitude: text('longitude'), // GPS coordinate
  radius: integer('radius').default(100), // Check-in radius in meters
  // Check-in window
  checkInStart: text('check_in_start'), // Start time "HH:MM"
  checkInEnd: text('check_in_end'), // End time "HH:MM"
});

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

// ============ ENROLLMENTS TABLE ============
export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

// ============ ATTENDANCE TABLE ============
export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  classId: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  checkInTime: timestamp('check_in_time').defaultNow().notNull(),
  checkOutTime: timestamp('check_out_time'),
  date: date('date').defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

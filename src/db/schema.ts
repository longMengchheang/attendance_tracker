import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['student', 'teacher']);

// Note: 'users' table in Supabase public schema.
// Ensure this doesn't conflict with auth.users triggers if any.
// The user explicitly asked for this change.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // References auth.users(id) - handled by Supabase usually
  name: text('name'), // Changed to nullable based on interface
  role: roleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  code: text('code').notNull().unique(),
  teacher_id: uuid('teacher_id').references(() => users.id).notNull(),
  location: text('location'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  radius: integer('radius').notNull(),
  check_in_start: timestamp('check_in_start'),
  check_in_end: timestamp('check_in_end'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  student_id: uuid('student_id').references(() => users.id).notNull(),
  class_id: uuid('class_id').references(() => classes.id).notNull(),
  enrolled_at: timestamp('enrolled_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  student_id: uuid('student_id').references(() => users.id).notNull(),
  class_id: uuid('class_id').references(() => classes.id).notNull(),
  check_in_time: timestamp('check_in_time').notNull(),
  check_out_time: timestamp('check_out_time'),
  date: text('date').notNull(),
});

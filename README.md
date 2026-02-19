# 📋 Attendance Tracker

A modern, role-based attendance tracking system built with **Next.js 16**, **Supabase**, and **Drizzle ORM**. Teachers can create classes, manage students, and track attendance with GPS-based check-ins. Students can join classes, clock in/out, and view their attendance history.

---

## ✨ Features

### Teacher

- Create and manage classes with schedule, location, and geofence radius
- View enrolled students and remove them
- Track attendance in real time (daily, monthly, history views)
- Export attendance reports

### Student

- Join classes via invite code
- GPS-based check-in and check-out
- View personal attendance history and statistics

### Authentication

- Email/password sign up and login
- Email verification
- Password reset via email link (PKCE flow)
- Role-based dashboards (teacher / student)

---

## 🛠 Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth      | Supabase Auth (`@supabase/ssr`)    |
| Database  | PostgreSQL (Supabase)              |
| ORM       | Drizzle ORM                        |
| Styling   | Tailwind CSS v4                    |
| Maps      | Leaflet / React-Leaflet            |
| UI        | Lucide React icons, Sonner toasts  |
| Language  | TypeScript                         |

---

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── (auth)/             # Auth pages (login, signup, forgot/reset password)
│   │   ├── api/                # REST API routes
│   │   │   ├── attendance/     # Check-in, check-out, reports, stats
│   │   │   ├── auth/           # Login, register
│   │   │   ├── classes/        # CRUD, students, attendance, export
│   │   │   └── enrollments/    # Join class
│   │   ├── auth/callback/      # Supabase PKCE callback
│   │   └── dashboard/          # Teacher & student dashboards
│   ├── components/             # Reusable UI components
│   │   ├── dashboard/          # Modals, cards, class details
│   │   └── ui/                 # Base UI (buttons, inputs, pickers)
│   ├── context/                # AuthContext (global auth state)
│   ├── db/                     # Drizzle schema & database connection
│   ├── lib/                    # API client, utilities, Supabase client
│   ├── services/               # Business logic (attendance, class, enrollment)
│   └── types/                  # TypeScript type definitions
├── supabase/migrations/        # Drizzle-generated SQL migrations
├── public/                     # Static assets
├── middleware.ts                # Supabase session cookie sync
└── drizzle.config.ts           # Drizzle ORM configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- A **Supabase** project ([supabase.com](https://supabase.com))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd my-app
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[YOUR-ANON-KEY]
```

### 3. Set Up Database

Go to your **Supabase Dashboard → SQL Editor** and run the following SQL to create all required tables:

```sql
-- ============================================
-- Attendance Tracker — Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create custom enum types
CREATE TYPE "public"."role" AS ENUM ('student', 'teacher');
CREATE TYPE "public"."attendance_status" AS ENUM ('present', 'late', 'absent');

-- 2. Create users table
CREATE TABLE "public"."users" (
    "id" uuid PRIMARY KEY NOT NULL,
    "name" text,
    "role" "public"."role" NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- 3. Create classes table
CREATE TABLE "public"."classes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "code" text NOT NULL,
    "teacher_id" uuid NOT NULL,
    "location" text,
    "latitude" text,
    "longitude" text,
    "radius" integer NOT NULL,
    "check_in_start" timestamp,
    "check_in_end" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "classes_code_unique" UNIQUE ("code")
);

-- 4. Create enrollments table
CREATE TABLE "public"."enrollments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "student_id" uuid NOT NULL,
    "class_id" uuid NOT NULL,
    "enrolled_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Create attendance table
CREATE TABLE "public"."attendance" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "student_id" uuid NOT NULL,
    "class_id" uuid NOT NULL,
    "check_in_time" timestamp NOT NULL,
    "check_out_time" timestamp,
    "status" text DEFAULT 'absent' NOT NULL,
    "date" text NOT NULL
);

-- 6. Add foreign key constraints
ALTER TABLE "public"."classes"
    ADD CONSTRAINT "classes_teacher_id_users_id_fk"
    FOREIGN KEY ("teacher_id") REFERENCES "public"."users" ("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_users_id_fk"
    FOREIGN KEY ("student_id") REFERENCES "public"."users" ("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "public"."enrollments"
    ADD CONSTRAINT "enrollments_class_id_classes_id_fk"
    FOREIGN KEY ("class_id") REFERENCES "public"."classes" ("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "public"."attendance"
    ADD CONSTRAINT "attendance_student_id_users_id_fk"
    FOREIGN KEY ("student_id") REFERENCES "public"."users" ("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "public"."attendance"
    ADD CONSTRAINT "attendance_class_id_classes_id_fk"
    FOREIGN KEY ("class_id") REFERENCES "public"."classes" ("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;

-- 7. Enable Row Level Security (optional but recommended)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (allow all for authenticated users — customize as needed)
CREATE POLICY "Allow all for authenticated users" ON "public"."users"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON "public"."classes"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON "public"."enrollments"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON "public"."attendance"
    FOR ALL USING (auth.role() = 'authenticated');
```

> **Note:** The `users.id` should match `auth.users.id` from Supabase Auth. When a user signs up, a row is inserted into `public.users` via the registration API.

### 4. Configure Supabase Auth

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Drizzle ORM Commands

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

---

## 🗂 Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users      │     │   classes     │     │  attendance   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │◄────│ teacher_id   │     │ id (PK)      │
│ name         │     │ id (PK)      │◄────│ class_id     │
│ role         │     │ name         │     │ student_id   │──► users.id
│ created_at   │     │ description  │     │ check_in_time│
└──────────────┘     │ code (unique)│     │ check_out_time│
       ▲             │ location     │     │ status       │
       │             │ lat/lng      │     │ date         │
       │             │ radius       │     └──────────────┘
       │             │ check_in_*   │
       │             │ created_at   │
       │             └──────────────┘
       │                    ▲
       │                    │
       │             ┌──────────────┐
       └─────────────│ enrollments  │
                     ├──────────────┤
                     │ id (PK)      │
                     │ student_id   │
                     │ class_id     │
                     │ enrolled_at  │
                     └──────────────┘
```

---

## 📝 License

This project is for educational purposes.

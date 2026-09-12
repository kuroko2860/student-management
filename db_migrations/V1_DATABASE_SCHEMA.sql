-- ============================================================
-- SUPABASE DATABASE SCHEMA FOR ATTENDANCE APP
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Classes table: stores all classes per user
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee BIGINT DEFAULT 0,  -- fee in VND
  "order" INTEGER NOT NULL,  -- display order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Students table: students per class
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  note TEXT DEFAULT '',  -- notes about student
  "order" INTEGER NOT NULL,  -- display order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, class_id, name)
);

-- Attendance sheets: monthly records for each class
CREATE TABLE attendance_sheets (
  id TEXT PRIMARY KEY,  -- format: "{classId}__{month}" e.g. "abc123__2024-01"
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- format: "YYYY-MM"
  absences JSONB DEFAULT '{}',  -- {studentId: reason}
  paid JSONB DEFAULT '{}',  -- {studentId: amountPaid}
  extra_sessions JSONB[] DEFAULT ARRAY[]::JSONB[],  -- additional sessions
  removed_sessions TEXT[] DEFAULT ARRAY[]::TEXT[],  -- cancelled sessions
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, id)
);

-- User settings: stores schedule and payment configuration
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_type TEXT NOT NULL,  -- 'schedule' or 'payment'
  schedule_slots JSONB DEFAULT '{}',  -- {dayOfWeek: {startTime, endTime}}
  bank_account TEXT,  -- for payment info
  bank_name TEXT,
  qr_code TEXT,  -- VietQR code for payments
  message_template TEXT,  -- message to send to parents
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, setting_type)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_attendance_sheets_user_id ON attendance_sheets(user_id);
CREATE INDEX idx_attendance_sheets_composite ON attendance_sheets(user_id, class_id);
CREATE INDEX idx_attendance_sheets_month ON attendance_sheets(month);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - ENABLE AFTER TESTING
-- ============================================================

-- Classes RLS Policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own classes"
  ON classes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classes"
  ON classes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes"
  ON classes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes"
  ON classes FOR DELETE
  USING (auth.uid() = user_id);

-- Students RLS Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own students"
  ON students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
  ON students FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
  ON students FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students"
  ON students FOR DELETE
  USING (auth.uid() = user_id);

-- Attendance Sheets RLS Policies
ALTER TABLE attendance_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sheets"
  ON attendance_sheets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sheets"
  ON attendance_sheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sheets"
  ON attendance_sheets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Settings RLS Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ENABLE REALTIME (Required for app to work)
-- ============================================================
-- After running this SQL, go to:
-- Supabase Dashboard → Database → Replication
-- Enable realtime for: classes, students, attendance_sheets, user_settings
-- This allows the app to receive real-time updates

-- ============================================================
-- EXAMPLE QUERIES (Test these)
-- ============================================================

-- Get all classes for current user
-- SELECT * FROM classes WHERE user_id = auth.uid() ORDER BY "order";

-- Get all students in a class
-- SELECT * FROM students WHERE class_id = '...' AND user_id = auth.uid() ORDER BY "order";

-- Get attendance sheet for a specific month
-- SELECT * FROM attendance_sheets WHERE id = 'classId__2024-01' AND user_id = auth.uid();

-- Update attendance record
-- UPDATE attendance_sheets SET absences = jsonb_set(absences, '{studentId}', '"sick"') WHERE id = '...';

-- ============================================================
-- BACKUP & RESTORE
-- ============================================================

-- Backup all data (run in psql)
-- pg_dump --data-only supabase_db > backup.sql

-- Restore data
-- psql supabase_db < backup.sql

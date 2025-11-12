-- =========================================================
--  Academic Analytics & Monitoring System – Supabase Schema
-- =========================================================

-- Drop existing tables if re-running the script (optional)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS performance CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- =========================================
--  USERS TABLE
-- =========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('FA', 'AA', 'HOD', 'ADMIN')) NOT NULL,
    section_id INT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
--  SECTIONS TABLE
-- =========================================
CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    year INT NOT NULL,
    department TEXT NOT NULL,
    advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
--  STUDENTS TABLE
-- =========================================
CREATE TABLE students (
    registration_number TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    section_id INT REFERENCES sections(id) ON DELETE CASCADE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    residence_type TEXT CHECK (residence_type IN ('Hostler', 'Day Scholar')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
--  SUBJECTS TABLE
-- =========================================
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    year INT,
    department TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
--  PERFORMANCE TABLE
-- =========================================
CREATE TABLE performance (
    id SERIAL PRIMARY KEY,
    student_reg_no TEXT REFERENCES students(registration_number) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    marks INT CHECK (marks >= 0 AND marks <= 100),
    grade TEXT CHECK (grade IN ('O', 'A+', 'A', 'B+', 'B', 'C', 'F')),
    arrear_status BOOLEAN GENERATED ALWAYS AS (grade = 'F') STORED,
    semester INT CHECK (semester >= 1 AND semester <= 8),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (student_reg_no, subject_id, semester)
);

-- =========================================
--  ATTENDANCE TABLE
-- =========================================
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_reg_no TEXT REFERENCES students(registration_number) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (student_reg_no, subject_id)
);

-- =========================================
--  AUDIT LOGS TABLE (for admin view)
-- =========================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- =========================================
--  INDEXES FOR FASTER ANALYTICS
-- =========================================
CREATE INDEX idx_students_section ON students(section_id);
CREATE INDEX idx_performance_subject ON performance(subject_id);
CREATE INDEX idx_performance_student ON performance(student_reg_no);
CREATE INDEX idx_attendance_student ON attendance(student_reg_no);
CREATE INDEX idx_attendance_subject ON attendance(subject_id);

-- =========================================
--  SAMPLE UPSERT HELPERS (for backend logic)
-- =========================================
-- Use these views to simplify UPSERT queries from backend.

-- Ensure that FA uploads (via CSV) always update existing rows
-- rather than duplicating.

CREATE OR REPLACE FUNCTION upsert_student(
    reg_no TEXT,
    name TEXT,
    section INT,
    gender TEXT,
    residence TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO students (registration_number, name, section_id, gender, residence_type)
    VALUES (reg_no, name, section, gender, residence)
    ON CONFLICT (registration_number)
    DO UPDATE SET
        name = EXCLUDED.name,
        section_id = EXCLUDED.section_id,
        gender = EXCLUDED.gender,
        residence_type = EXCLUDED.residence_type;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_performance(
    reg_no TEXT,
    subj_id INT,
    mark INT,
    grd TEXT,
    sem INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO performance (student_reg_no, subject_id, marks, grade, semester)
    VALUES (reg_no, subj_id, mark, grd, sem)
    ON CONFLICT (student_reg_no, subject_id, semester)
    DO UPDATE SET
        marks = EXCLUDED.marks,
        grade = EXCLUDED.grade,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upsert_attendance(
    reg_no TEXT,
    subj_id INT,
    perc NUMERIC
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO attendance (student_reg_no, subject_id, percentage)
    VALUES (reg_no, subj_id, perc)
    ON CONFLICT (student_reg_no, subject_id)
    DO UPDATE SET
        percentage = EXCLUDED.percentage,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =========================================
--  ROLE PERMISSIONS (Optional, for Supabase policies)
-- =========================================
-- You can enable RLS and define policies per role if needed.
-- Example: only allow FAs to edit their section data.

-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "FA edit only own section"
-- ON students FOR UPDATE USING (
--     EXISTS (
--         SELECT 1 FROM users
--         WHERE users.id = auth.uid()
--         AND users.section_id = students.section_id
--     )
-- );

-- =========================================================
--  END OF SCHEMA
-- =========================================================

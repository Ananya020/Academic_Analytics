# Excel File Upload Guide

## Overview

The Academic Analytics system now supports uploading Excel files (`.xlsx` or `.xls`) directly. The system automatically detects and processes multiple sheets containing Students, Performance, and Attendance data.

## Excel File Format Requirements

### Sheet Structure

Your Excel file should contain **three separate sheets** (or at least one of them):

1. **Students Sheet** - Student information
2. **Performance Sheet** - Student marks and grades
3. **Attendance Sheet** - Student attendance percentages

### Column Requirements

#### Students Sheet
Required columns (column names can vary):
- `registration_number` (or `reg_no`, `reg_number`, `registration_no`)
- `name` (or `student_name`, `full_name`)
- `gender` (or `sex`) - Values: `Male`, `Female`, `Other` (case-insensitive, can be `M`, `F`, `O`)
- `residence_type` (or `residence`, `hostel`) - Values: `Hostler` or `Day Scholar` (case-insensitive, variations like "Hostel" are accepted)

**Example:**
```
registration_number | name          | gender | residence_type
--------------------|---------------|--------|----------------
12345              | John Doe      | Male   | Hostler
12346              | Jane Smith    | Female | Day Scholar
```

#### Performance Sheet
Required columns:
- `student_reg_no` (or `registration_number`, `reg_no`, `reg_number`)
- `subject_id` (or `subject`, `sub_id`) - Must be an integer
- `marks` (or `mark`, `score`) - Integer between 0-100
- `semester` (or `sem`) - Integer between 1-8

**Note:** The `grade` column is **automatically calculated** from marks:
- 90-100: O
- 80-89: A+
- 70-79: A
- 60-69: B+
- 50-59: B
- 40-49: C
- 0-39: F

The `arrear_status` is automatically set based on grade (F = failed).

**Example:**
```
student_reg_no | subject_id | marks | semester
---------------|------------|-------|----------
12345         | 1          | 85    | 1
12345         | 2          | 92    | 1
12346         | 1          | 78    | 1
```

#### Attendance Sheet
Required columns:
- `student_reg_no` (or `registration_number`, `reg_no`, `reg_number`)
- `subject_id` (or `subject`, `sub_id`) - Must be an integer
- `percentage` (or `attendance`, `attendance_percentage`) - Decimal between 0-100

**Example:**
```
student_reg_no | subject_id | percentage
---------------|------------|------------
12345         | 1          | 95.5
12345         | 2          | 98.2
12346         | 1          | 87.3
```

## Database Schema Requirements

### ✅ No Schema Changes Needed!

The existing database schema supports Excel uploads without any modifications. The system automatically:

1. **Calculates grades** from marks (no need to include grade column in Excel)
2. **Normalizes data** to match schema constraints:
   - Gender: Converts variations to `Male`, `Female`, or `Other`
   - Residence Type: Converts variations to `Hostler` or `Day Scholar`
3. **Handles column name variations** automatically

### Current Schema Constraints

The following constraints are enforced by the database:

#### Students Table
- `gender` must be: `Male`, `Female`, or `Other`
- `residence_type` must be: `Hostler` or `Day Scholar`
- `registration_number` is the primary key

#### Performance Table
- `marks` must be between 0-100
- `semester` must be between 1-8
- `grade` is automatically calculated (O, A+, A, B+, B, C, F)
- `arrear_status` is automatically generated from grade (F = true)
- Unique constraint on: `(student_reg_no, subject_id, semester)`

#### Attendance Table
- `percentage` must be between 0-100
- Unique constraint on: `(student_reg_no, subject_id)`

## Supabase Dashboard Setup

### ✅ No Changes Required in Supabase Dashboard

The existing schema already supports all required functionality. However, you should verify:

1. **Tables exist**: Ensure all tables are created (run `backend/supabase/schema.sql` if not already done)
2. **Foreign Key Relationships**: 
   - `students.section_id` → `sections.id`
   - `performance.student_reg_no` → `students.registration_number`
   - `performance.subject_id` → `subjects.id`
   - `attendance.student_reg_no` → `students.registration_number`
   - `attendance.subject_id` → `subjects.id`
3. **Subjects Table**: Make sure you have subjects in the `subjects` table with IDs that match your Excel file's `subject_id` values

### Important: Subject IDs

⚠️ **Before uploading performance or attendance data**, ensure that:
- All `subject_id` values in your Excel file exist in the `subjects` table
- Subject IDs are integers (SERIAL in database)

You can check/add subjects in Supabase:
```sql
-- Check existing subjects
SELECT * FROM subjects;

-- Add a subject if needed
INSERT INTO subjects (name, code, year, department)
VALUES ('Mathematics', 'MATH101', 1, 'Engineering');
```

## How to Upload

1. **Log in** as a Faculty Advisor (FA)
2. Navigate to **FA Dashboard** → **Uploads** tab (or go to `/fa/uploads`)
3. Click on the **Excel Upload Card** (prominently displayed at the top)
4. Select your `dataforinhouse.xlsx` file
5. Click **Upload Excel File**
6. Wait for processing (you'll see a summary of uploaded records)
7. View analytics on the **Analytics** tab

## Troubleshooting

### "Sheet could not be identified"
- Ensure your sheet has the required columns (see column requirements above)
- Column names can vary, but must contain the key words (e.g., "registration", "name", "gender" for students)

### "Missing required columns"
- Check that all required columns are present in the sheet
- Column names are case-insensitive and can have variations

### "Foreign key constraint violation"
- **For Performance/Attendance**: Ensure `subject_id` values exist in the `subjects` table
- **For Students**: Ensure your FA user has a valid `section_id` assigned

### "Check constraint violation"
- **Gender**: Must be `Male`, `Female`, or `Other` (system normalizes common variations)
- **Residence Type**: Must be `Hostler` or `Day Scholar` (system normalizes "Hostel" to "Hostler")
- **Marks**: Must be between 0-100
- **Semester**: Must be between 1-8
- **Percentage**: Must be between 0-100

### "No students found for this section"
- Ensure your FA user has a `section_id` assigned in the `users` table
- Ensure uploaded students have the correct `section_id`

## Tips

1. **Column Headers**: Use clear column headers in the first row of each sheet
2. **Data Types**: 
   - `subject_id`, `marks`, `semester` should be numbers
   - `percentage` can be decimal (e.g., 95.5)
   - `gender` and `residence_type` can be text (system normalizes them)
3. **Empty Rows**: Empty rows are automatically skipped
4. **Multiple Sheets**: You can have all three sheets in one file, or just the ones you need
5. **Sheet Names**: Sheet names don't matter - the system detects sheet type by column names

## Example Excel File Structure

```
📁 dataforinhouse.xlsx
├── 📄 Sheet1 (Students)
│   └── registration_number | name | gender | residence_type
├── 📄 Sheet2 (Performance)  
│   └── student_reg_no | subject_id | marks | semester
└── 📄 Sheet3 (Attendance)
    └── student_reg_no | subject_id | percentage
```

---

**Need Help?** Check the console logs in your browser's developer tools for detailed error messages.


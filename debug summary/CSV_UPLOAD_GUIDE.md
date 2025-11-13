# Course Code CSV Upload Guide

## Overview

The system now supports uploading CSV files in the **Course Code format** (like `dataforinhouseCSV.csv`). This format contains student performance data with course codes instead of subject IDs.

## CSV File Format

### Required Columns

Your CSV file must contain these columns (column names are case-insensitive):

1. **Register No** (or `Register No`, `registration_number`, `reg_no`)
2. **Student Name** (or `Student Name`, `student_name`, `name`)
3. **Course Code** (or `Course Code`, `course_code`, `code`)
4. **Grade** (exact column name: `Grade`)

### Optional Columns

- **Course Title** (or `Course Title`, `course_title`, `title`) - Used as subject name if provided
- **Credits** - Not used but can be present

### Example CSV Format

```csv
S.No,Register No,Student Name,Course Code,Course Title,Credits,Grade
1,RA2411003010001,YASHVARDHAN CHAUDHRI,21MAB101T,CALCULUS AND LINEAR ALGEBRA,4,B
2,RA2411003010001,YASHVARDHAN CHAUDHRI,21GNH101J,PHILOSOPHY OF ENGINEERING,2,B+
3,RA2411003010002,P DAKSHATAA,21LEH105T,JAPANESE,3,A+
```

## What the System Does

### 1. **Extracts Unique Students**
- Creates student records from unique registration numbers
- Sets default values for missing data:
  - `gender`: `Other` (default)
  - `residence_type`: `Day Scholar` (default)

### 2. **Creates/Updates Subjects**
- Automatically creates subjects from course codes if they don't exist
- Uses Course Title as subject name (or Course Code if title not available)
- Maps course codes to subject IDs automatically

### 3. **Creates Performance Records**
- Converts grades to approximate marks:
  - `O` → 95 marks
  - `A+` → 87 marks
  - `A` → 75 marks
  - `B+` → 65 marks
  - `B` → 55 marks
  - `C` → 45 marks
  - `F` → 30 marks
- Sets semester to `1` by default (can be updated later)
- Creates performance records linking students to subjects

## How to Upload

1. **Log in** as a Faculty Advisor (FA)
2. Navigate to **FA Dashboard** → **Uploads** tab (or go to `/fa/uploads`)
3. Find the **"Upload Course Code CSV"** card
4. Click to select your `dataforinhouseCSV.csv` file
5. Click **Upload File**
6. Wait for processing (you'll see a summary)
7. View analytics on the **Analytics** tab

## Upload Summary

After upload, you'll see:
- **Students**: Number of unique students uploaded
- **Subjects**: Number of new subjects created
- **Performance Records**: Number of performance records uploaded

## Important Notes

### ⚠️ Default Values

Since the CSV doesn't contain gender and residence type:
- All students will have `gender = 'Other'` (can be updated later)
- All students will have `residence_type = 'Day Scholar'` (can be updated later)

### ⚠️ Semester Information

- All performance records default to `semester = 1`
- If you need different semesters, you'll need to update them manually or use a different upload format

### ⚠️ Marks Calculation

- Marks are **estimated** from grades (not exact)
- The system uses approximate values to satisfy database requirements
- Actual marks are not available in this CSV format

### ⚠️ Subject Creation

- Subjects are created automatically with:
  - `code`: Course Code from CSV
  - `name`: Course Title (or Course Code if title not available)
  - `year`: NULL (can be updated later)
  - `department`: 'Engineering' (default, can be updated later)

## Troubleshooting

### "CSV file must contain: Register No, Student Name, Course Code, and Grade columns"
- Ensure your CSV has these columns (case-insensitive)
- Check that column names contain the key words (e.g., "register" and "no" for registration number)

### "No valid data found in CSV file"
- Check that your CSV has data rows (not just headers)
- Ensure required columns have values

### "Foreign key constraint violation"
- Ensure your FA user has a `section_id` assigned
- Check that students can be created (section exists)

### "Subject creation error"
- Check that course codes are valid
- Ensure database connection is working

## Database Requirements

### ✅ No Schema Changes Needed!

The existing schema supports this format. However:

1. **FA User Must Have Section**: Your FA user must have a `section_id` assigned
2. **Subjects Table**: Will be automatically populated with course codes from your CSV
3. **Students Table**: Will be populated with unique students from registration numbers

## Example Workflow

1. Upload `dataforinhouseCSV.csv`
2. System processes:
   - Extracts ~100 unique students (example)
   - Creates ~20 unique subjects from course codes
   - Creates ~2000 performance records
3. Analytics automatically update
4. View dashboard with all data

## Updating Data Later

If you need to update:
- **Gender/Residence Type**: Update students table manually or via admin panel
- **Semester**: Update performance records manually
- **Subject Details**: Update subjects table with year, department, etc.

---

**Ready to upload?** Just make sure your FA user has a section assigned, then upload your CSV file!


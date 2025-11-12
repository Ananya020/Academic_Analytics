# Creating Sections in A1-Z1, A2-Z2 Format

## Quick Setup

To create sections in the format A1, B1...Z1, A2, B2...Z2, you have two options:

### Option 1: Use the API Endpoint (Recommended)

```bash
curl -X POST http://localhost:5000/api/admin/sections/create-default \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "department": "Computer Science"
  }'
```

This will create 104 sections:
- A1, B1, C1...Z1 (26 sections for year 1)
- A2, B2, C2...Z2 (26 sections for year 2)
- A3, B3, C3...Z3 (26 sections for year 3)
- A4, B4, C4...Z4 (26 sections for year 4)

### Option 2: SQL Script

Run this in your Supabase SQL Editor:

```sql
-- Create sections in A1-Z1, A2-Z2 format
DO $$
DECLARE
    letter CHAR;
    year_num INT;
    section_name TEXT;
    base_year INT := 2024;
    dept TEXT := 'Computer Science';
BEGIN
    FOR year_num IN 1..4 LOOP
        FOR letter IN 'A'..'Z' LOOP
            section_name := letter || year_num;
            INSERT INTO sections (name, year, department)
            VALUES (section_name, base_year + year_num - 1, dept)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
```

## Section Format

Sections are named as:
- **A1, B1, C1...Z1** - First year sections
- **A2, B2, C2...Z2** - Second year sections
- **A3, B3, C3...Z3** - Third year sections
- **A4, B4, C4...Z4** - Fourth year sections

Total: 104 sections (26 letters × 4 years)

## Verification

After creating sections, verify they exist:

```sql
SELECT * FROM sections ORDER BY name;
```

You should see sections from A1 to Z4.


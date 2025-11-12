# Quick Setup Guide - Academic Analytics & Monitoring System

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project created
- Database schema applied (from `backend/supabase/schema.sql`)

---

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
npm install
```

### 1.2 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Where to find these values:**
- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy the **Project URL** (SUPABASE_URL)
- Copy the **anon public** key (SUPABASE_ANON_KEY)
- Copy the **service_role** key (SUPABASE_SERVICE_ROLE_KEY)
- Navigate to **Authentication** → **Settings** → **JWT Settings** for JWT_SECRET

### 1.3 Verify Supabase Connection

```bash
cd backend
node verify-connectivity.js
```

Expected output: All checks should pass ✅

### 1.4 Start Backend Server

```bash
npm run dev
```

Expected output: `Server is running on port 5000`

---

## Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

### 2.2 Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** For local development, `NEXT_PUBLIC_API_URL` must be `http://localhost:5000/api`

### 2.3 Start Frontend Server

```bash
npm run dev
```

Expected output: Frontend running on `http://localhost:3000`

---

## Step 3: Database Setup

### 3.1 Apply Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `backend/supabase/schema.sql`
4. Copy the entire SQL script
5. Paste into SQL Editor and run

### 3.2 Create Test Users

You can create users via Supabase Auth dashboard or use SQL:

```sql
-- Example: Create a Faculty Advisor user
-- First, create auth user via Supabase Auth dashboard
-- Then insert into users table:

INSERT INTO users (id, email, name, role, section_id)
VALUES (
  'auth-user-id-from-supabase',
  'fa@example.com',
  'Faculty Advisor',
  'FA',
  1  -- section_id must exist in sections table
);
```

**Required Roles:**
- `FA` - Faculty Advisor
- `AA` - Academic Advisor
- `HOD` - Head of Department
- `admin` - Admin

---

## Step 4: Test the Application

### 4.1 Test Backend Health

Open a new terminal:

```bash
curl http://localhost:5000
```

Expected: `Academic Analytics Backend is running!`

### 4.2 Test Login Endpoint

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fa@example.com","password":"your-password"}'
```

Expected: JSON response with `token` and `user` object

### 4.3 Test Frontend

1. Open browser: `http://localhost:3000`
2. You should see the login page
3. Log in with valid credentials
4. Should redirect to role-based dashboard

---

## Step 5: Upload Sample Data

### 5.1 Convert Excel to CSV

1. Open `dataforinhouse.xlsx`
2. Export each sheet as CSV:
   - **Students sheet** → `students.csv`
   - **Performance/Marks sheet** → `performance.csv`
   - **Attendance sheet** → `attendance.csv`

### 5.2 Prepare CSV Files

**students.csv format:**
```csv
registration_number,name,gender,residence_type
12345,John Doe,Male,Hostel
12346,Jane Smith,Female,Day Scholar
```

**performance.csv format:**
```csv
student_reg_no,subject_id,marks,arrear_status,semester
12345,1,85,false,1
12346,1,92,false,1
```

**attendance.csv format:**
```csv
student_reg_no,subject_id,percentage
12345,1,95.5
12346,1,98.2
```

### 5.3 Upload via Dashboard

1. Log in as FA user
2. Navigate to **FA Dashboard** → **Uploads** tab
3. Upload each CSV file
4. Verify success messages
5. Check **Analytics** tab for updated data

---

## Troubleshooting

### Backend won't start

- ✅ Check `.env` file exists and has all variables
- ✅ Verify Supabase credentials are correct
- ✅ Ensure port 5000 is not in use

### Frontend can't connect to backend

- ✅ Verify backend is running on port 5000
- ✅ Check `NEXT_PUBLIC_API_URL` in `.env.local`
- ✅ Look for CORS errors in browser console
- ✅ Verify backend CORS allows `http://localhost:3000`

### Login fails

- ✅ Verify user exists in Supabase Auth
- ✅ Check user exists in `users` table with correct role
- ✅ Ensure password is correct
- ✅ Check backend console for error messages

### Analytics shows no data

- ✅ Verify students are uploaded for FA's section
- ✅ Check FA user has `section_id` set in `users` table
- ✅ Ensure performance data is uploaded
- ✅ Verify data relationships are correct

### File upload fails

- ✅ Check CSV column names match exactly (case-sensitive)
- ✅ Verify FA user is assigned to a section
- ✅ Check backend console for error messages
- ✅ Ensure file is valid CSV format

---

## Next Steps

1. ✅ Run `backend/verify-connectivity.js` to test Supabase connection
2. ✅ Run `backend/test-endpoints.js <email> <password>` to test API endpoints
3. ✅ Test all user roles (FA, AA, HOD, Admin)
4. ✅ Upload sample data and verify analytics
5. ✅ Review `CONNECTIVITY_VERIFICATION_REPORT.md` for detailed information

---

## Production Deployment

### Backend (Render/Railway)

1. Set all environment variables in deployment platform
2. Update `FRONTEND_URL` to production frontend URL
3. Deploy with `npm start`

### Frontend (Vercel)

1. Set `NEXT_PUBLIC_API_URL` to production backend URL
2. Deploy with `npm run build`

---

**Need Help?** Check `CONNECTIVITY_VERIFICATION_REPORT.md` for detailed troubleshooting.


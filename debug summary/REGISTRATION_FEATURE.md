# Registration Feature Documentation

## Overview

A complete user registration system has been added to the Academic Analytics & Monitoring System, allowing users to create accounts using Supabase Auth.

## Features

✅ **User Registration Page** (`/register`)
- Clean, modern UI matching the login page design
- Form validation (password length, password match, required fields)
- Role selection (FA, AA, HOD, ADMIN)
- Link to login page for existing users

✅ **Backend Registration Endpoint** (`POST /api/auth/register`)
- Creates user in Supabase Auth
- Creates user profile in `users` table
- Automatic sign-in after registration
- Proper error handling and rollback

✅ **Frontend Integration**
- Registration function in `auth.ts`
- Automatic redirect to role-based dashboard after registration
- Error handling and user feedback

## Files Created/Modified

### Frontend
- ✅ `frontend/app/register/page.tsx` - New registration page
- ✅ `frontend/lib/auth.ts` - Added `register()` function
- ✅ `frontend/app/login/page.tsx` - Added link to register page

### Backend
- ✅ `backend/controllers/authController.js` - Added `registerUser()` function
- ✅ `backend/routes/authRoutes.js` - Added `/register` route

## Registration Flow

1. **User fills out registration form:**
   - Name
   - Email
   - Password (min 6 characters)
   - Confirm Password
   - Role selection

2. **Frontend validation:**
   - Password length check
   - Password match check
   - Required fields check

3. **Backend processing:**
   - Validates input
   - Creates user in Supabase Auth
   - Creates user profile in `users` table
   - Signs in user automatically
   - Returns JWT token and user data

4. **Frontend response:**
   - Stores token in localStorage
   - Stores user data in localStorage
   - Redirects to role-based dashboard

## API Endpoint

### POST `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "fa"
}
```

**Response (Success - 201):**
```json
{
  "message": "Registration successful",
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "fa",
    "name": "John Doe"
  }
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Error message here"
}
```

## Role Mapping

- **Database:** Stores roles in UPPERCASE (`FA`, `AA`, `HOD`, `ADMIN`)
- **Frontend:** Uses lowercase (`fa`, `aa`, `hod`, `admin`)
- **Backend:** Converts to lowercase in API responses for frontend compatibility
- **Middleware:** Uses uppercase for role checking (matches database)

## Important Notes

### Email Confirmation

If your Supabase project has email confirmation enabled:
- User will receive a confirmation email
- They must confirm their email before they can sign in
- The registration endpoint will still succeed, but sign-in may fail
- User will see: "Registration successful. Please sign in." message

### Section Assignment

- New users are created with `section_id: null`
- Admin users can assign sections to users later
- FA users need a section_id to upload/view data

### Role Selection

Users can select their role during registration:
- **FA** - Faculty Advisor (most common)
- **AA** - Academic Advisor
- **HOD** - Head of Department
- **ADMIN** - Administrator

**Note:** In production, you may want to restrict role selection to admin-only or use a different flow.

## Testing

### Manual Testing

1. Navigate to `http://localhost:3000/register`
2. Fill out the registration form
3. Submit and verify:
   - User is created in Supabase Auth
   - User profile is created in `users` table
   - User is redirected to appropriate dashboard
   - Token is stored in localStorage

### API Testing

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "FA"
  }'
```

## Error Handling

The registration endpoint handles:
- ✅ Missing required fields
- ✅ Invalid role values
- ✅ Duplicate email addresses
- ✅ Supabase Auth errors
- ✅ Database insertion errors (with rollback)
- ✅ Sign-in failures (graceful degradation)

## Security Considerations

1. **Password Requirements:**
   - Minimum 6 characters (enforced on frontend)
   - Consider adding more requirements (uppercase, numbers, etc.)

2. **Email Validation:**
   - Supabase handles email format validation
   - Consider adding email domain restrictions if needed

3. **Role Validation:**
   - Only allows predefined roles
   - Consider restricting role selection in production

4. **Error Messages:**
   - Generic error messages to prevent information leakage
   - Detailed errors logged server-side

## Future Enhancements

- [ ] Email confirmation flow
- [ ] Password strength indicator
- [ ] Admin approval workflow
- [ ] Role-based registration restrictions
- [ ] Profile picture upload
- [ ] Two-factor authentication

## Troubleshooting

### Registration fails with "User already exists"
- User with that email already exists in Supabase Auth
- Solution: Use a different email or sign in instead

### Registration succeeds but sign-in fails
- Email confirmation may be required
- Check Supabase Auth settings
- User should check their email for confirmation link

### User created but profile not in database
- Check backend logs for database errors
- Verify `users` table exists and has correct schema
- Check Supabase service role key permissions

### Role mismatch errors
- Ensure role is sent in correct format (backend converts to uppercase)
- Check database has role in uppercase format
- Verify role is one of: FA, AA, HOD, ADMIN

---

**Status:** ✅ Complete and Ready for Use
**Last Updated:** $(date)


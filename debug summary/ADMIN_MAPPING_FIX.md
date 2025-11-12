# Admin Dashboard Mapping Fix

## Issues Found and Fixed

### 1. ❌ Missing Endpoints
**Problem:** Frontend was calling endpoints that didn't exist:
- `/admin/sections` - Missing
- `/admin/mappings` - Missing

**Fix:** Added both endpoints in `adminController.js` and `adminRoutes.js`

### 2. ❌ Frontend/Backend Format Mismatch
**Problem:** 
- Frontend sends `{ userId, sections: [] }` but backend expected `{ userId, sectionId, type }`
- Frontend expected sections to have `code` field but schema has `name`

**Fix:** 
- Updated `mapUserToSection` to handle both old and new formats
- Updated frontend to use `name` instead of `code`
- Added proper section display with year and department

### 3. ❌ User Role Filtering
**Problem:** Frontend tried to get users with `role=fa,aa` but backend only handled single role

**Fix:** Enhanced `getUsers` to support comma-separated roles

### 4. ❌ Missing Error Handling
**Problem:** No user feedback on success/failure

**Fix:** Added alert messages for success and error cases

## Changes Made

### Backend (`backend/controllers/adminController.js`)

#### Added `getSections()` function:
- Fetches all sections from database
- Returns id, name, year, department, advisor_id
- Ordered by name

#### Added `getMappings()` function:
- Fetches all FA and AA users
- Builds mapping structure showing:
  - FA users with their assigned section (via `section_id`)
  - AA users with their assigned sections (via `advisor_id` in sections table)
- Returns formatted mapping data

#### Updated `mapUserToSection()` function:
- Now handles both formats:
  - New: `{ userId, sections: [1, 2, 3] }`
  - Old: `{ userId, sectionId, type }`
- Automatically detects user role
- FA: Updates `users.section_id` and `sections.advisor_id`
- AA: Updates `sections.advisor_id` for each section
- Better error handling

#### Updated `getUsers()` function:
- Now supports comma-separated roles: `?role=fa,aa`
- Converts to uppercase automatically
- Uses `.in()` for multiple roles

### Backend (`backend/routes/adminRoutes.js`)
- ✅ Added `GET /admin/sections` route
- ✅ Added `GET /admin/mappings` route

### Frontend (`frontend/components/admin/department-mapping.tsx`)
- ✅ Fixed section display to use `name` instead of `code`
- ✅ Added year and department to section display
- ✅ Fixed section ID conversion (string to number)
- ✅ Added success/error alerts
- ✅ Added empty state for mappings
- ✅ Added user role display in mappings list
- ✅ Better error handling

## API Endpoints

### GET `/admin/sections`
Returns all sections:
```json
[
  {
    "id": 1,
    "name": "Section A",
    "year": 2024,
    "department": "Computer Science",
    "advisor_id": "uuid-or-null"
  }
]
```

### GET `/admin/mappings`
Returns current user-section mappings:
```json
[
  {
    "userId": "uuid",
    "userName": "John Doe",
    "userRole": "FA",
    "sections": ["Section A"]
  },
  {
    "userId": "uuid",
    "userName": "Jane Smith",
    "userRole": "AA",
    "sections": ["Section A", "Section B"]
  }
]
```

### POST `/admin/map`
Maps user to section(s):
```json
{
  "userId": "uuid",
  "sections": [1, 2]  // Array of section IDs
}
```

**Response:**
```json
{
  "message": "Mapping successful."
}
```

## How It Works

### For FA Users:
1. Admin selects FA user and a section
2. Backend updates `users.section_id` = selected section ID
3. Backend updates `sections.advisor_id` = FA user ID
4. FA can now upload data for that section

### For AA Users:
1. Admin selects AA user and section(s)
2. Backend updates `sections.advisor_id` = AA user ID for each section
3. AA can now view analytics for those sections

## Testing

1. **Test Sections Endpoint:**
   ```bash
   curl -X GET http://localhost:5000/api/admin/sections \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **Test Mappings Endpoint:**
   ```bash
   curl -X GET http://localhost:5000/api/admin/mappings \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

3. **Test Mapping:**
   ```bash
   curl -X POST http://localhost:5000/api/admin/map \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId": "fa-user-id", "sections": [1]}'
   ```

## Common Issues

### Issue 1: "No sections found"
**Solution:** 
- Create sections in database:
  ```sql
  INSERT INTO sections (name, year, department) 
  VALUES ('Section A', 2024, 'Computer Science');
  ```

### Issue 2: "User not found"
**Solution:** 
- Ensure user exists in `users` table
- Check user ID is correct

### Issue 3: Mapping doesn't appear
**Solution:**
- Refresh the mappings list after adding
- Check browser console for errors
- Verify backend console for database errors

### Issue 4: FA still can't upload
**Solution:**
- Verify `section_id` was set in `users` table
- Check `advisor_id` was set in `sections` table
- FA user may need to log out and log back in

---

**Status:** ✅ Fixed
**Date:** $(date)


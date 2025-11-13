# Troubleshooting Network Errors with Supabase

## Error: "TypeError: fetch failed"

This error indicates that your backend cannot connect to Supabase. Here's how to fix it:

## Quick Checks

### 1. Verify Supabase Credentials

Check your `backend/.env` file has the correct values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these:**
- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy the **Project URL** (SUPABASE_URL)
- Copy the **anon public** key (SUPABASE_ANON_KEY)
- Copy the **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### 2. Test Supabase Connection

Run the connectivity test:

```bash
cd backend
node verify-connectivity.js
```

This will test:
- Environment variables
- Supabase connection
- Database tables
- Authentication

### 3. Check Internet Connection

- Ensure your internet connection is working
- Check if you can access `https://app.supabase.com` in your browser
- Verify no firewall is blocking the connection

### 4. Verify Supabase Project Status

- Log into your Supabase dashboard
- Check if your project is active (not paused)
- Verify the project URL matches your `.env` file

### 5. Check for Proxy/VPN Issues

If you're behind a corporate proxy or VPN:
- Configure proxy settings for Node.js
- Or temporarily disable VPN to test

### 6. Restart Backend Server

Sometimes a simple restart helps:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

## Common Issues

### Issue: Wrong Supabase URL

**Symptom:** `fetch failed` or `ENOTFOUND` errors

**Fix:** 
- Ensure URL format is: `https://xxxxx.supabase.co` (no trailing slash)
- Don't include `/rest/v1` in the URL

### Issue: Invalid API Keys

**Symptom:** Authentication errors or connection failures

**Fix:**
- Regenerate keys in Supabase dashboard if needed
- Ensure you're using the correct keys (anon vs service role)

### Issue: Project Paused

**Symptom:** Connection timeouts

**Fix:**
- Check Supabase dashboard for project status
- Unpause the project if needed

### Issue: Network Timeout

**Symptom:** Requests hang and eventually fail

**Fix:**
- Check your internet connection speed
- Verify Supabase service status: https://status.supabase.com
- Try again after a few minutes

## Testing Connection Manually

You can test the connection with a simple script:

```javascript
// test-connection.js
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✅ Connection successful!');
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

test();
```

Run it:
```bash
cd backend
node test-connection.js
```

## What the Fixed Code Does

The updated analytics endpoint now:
1. **Catches network errors gracefully** - Won't crash the server
2. **Returns empty data** instead of crashing when network fails
3. **Provides better error messages** - Tells you it's a connectivity issue
4. **Tries fallback queries** - Attempts simpler queries if complex ones fail

## Still Having Issues?

1. **Check backend console logs** - Look for specific error messages
2. **Verify .env file** - Make sure it's in the `backend/` directory
3. **Test with curl**:
   ```bash
   curl https://your-project.supabase.co/rest/v1/
   ```
4. **Contact Supabase support** - If your project seems inaccessible

## Prevention

To avoid this in the future:
- Keep your Supabase credentials secure and up-to-date
- Monitor Supabase status page for outages
- Set up connection retry logic (future enhancement)
- Use connection pooling (already handled by Supabase client)

---

**After fixing the connection, restart your backend server and try again!**


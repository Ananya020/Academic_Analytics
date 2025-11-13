/**
 * Backend API Endpoint Testing Script
 * Tests all major endpoints with proper authentication
 * Uses native fetch (no external dependencies)
 */

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';
let authToken = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n🔍 Testing Health Check...', 'blue');
  try {
    const response = await fetch(API_BASE.replace('/api', ''));
    const data = await response.text();
    log(`✅ Health check passed: ${data}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testLogin(email, password) {
  log('\n🔍 Testing Login Endpoint...', 'blue');
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.token) {
      authToken = data.token;
      log(`✅ Login successful for ${email}`, 'green');
      log(`   Role: ${data.user.role}`, 'green');
      log(`   Token: ${authToken.substring(0, 20)}...`, 'green');
      return true;
    } else {
      log(`❌ Login failed: No token received`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    return false;
  }
}

async function testProtectedEndpoint(method, endpoint, description) {
  log(`\n🔍 Testing ${description}...`, 'blue');
  
  if (!authToken) {
    log(`⚠️  Skipping: No auth token available`, 'yellow');
    return false;
  }
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (method === 'POST') {
      options.body = JSON.stringify({});
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ ${description} successful`, 'green');
      if (data && typeof data === 'object') {
        log(`   Response keys: ${Object.keys(data).join(', ')}`, 'green');
      }
      return true;
    } else {
      const status = response.status;
      const message = data.error || data.message || 'Unknown error';
      
      if (status === 401) {
        log(`❌ ${description} failed: Unauthorized (invalid token)`, 'red');
      } else if (status === 403) {
        log(`❌ ${description} failed: Forbidden (insufficient permissions)`, 'red');
      } else if (status === 400) {
        log(`⚠️  ${description} returned: ${message}`, 'yellow');
      } else {
        log(`❌ ${description} failed: ${message}`, 'red');
      }
      return false;
    }
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════', 'blue');
  log('  Backend API Endpoint Testing', 'blue');
  log('═══════════════════════════════════════════════════\n', 'blue');
  
  // Test health check
  await testHealthCheck();
  
  // Test login (you'll need to provide valid credentials)
  const email = process.argv[2] || 'aa6196@srmist.edu.in';
  const password = process.argv[3] || 'aa6196';
  
  log(`\n📝 Using credentials: ${email}`, 'yellow');
  log('   (Provide credentials as: node test-endpoints.js <email> <password>)', 'yellow');
  
  const loginSuccess = await testLogin(email, password);
  
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication', 'red');
    process.exit(1);
  }
  
  // Test protected endpoints based on role
  // These will fail if user doesn't have the right role, which is expected
  await testProtectedEndpoint('GET', '/fa/analytics', 'FA Analytics Endpoint');
  await testProtectedEndpoint('GET', '/aa/analytics', 'AA Analytics Endpoint');
  await testProtectedEndpoint('GET', '/hod/analytics', 'HOD Analytics Endpoint');
  await testProtectedEndpoint('GET', '/admin/users', 'Admin Users Endpoint');
  
  log('\n═══════════════════════════════════════════════════', 'blue');
  log('  Testing Complete', 'blue');
  log('═══════════════════════════════════════════════════\n', 'blue');
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});


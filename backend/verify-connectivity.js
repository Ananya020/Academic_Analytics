/**
 * Connectivity Verification Script
 * Tests Supabase connection and basic backend functionality
 */

import { supabase, supabaseAdmin } from './config/supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

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

async function testSupabaseConnection() {
  log('\n🔍 Testing Supabase Connection...', 'blue');
  
  try {
    // Test basic connection with anon key
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      log(`❌ Supabase connection failed: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Supabase connection successful (anon key)', 'green');
    
    // Test admin connection
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    if (adminError) {
      log(`⚠️  Admin connection warning: ${adminError.message}`, 'yellow');
    } else {
      log('✅ Supabase admin connection successful (service role key)', 'green');
    }
    
    return true;
  } catch (err) {
    log(`❌ Supabase connection error: ${err.message}`, 'red');
    return false;
  }
}

async function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Variables...', 'blue');
  
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const optional = ['JWT_SECRET', 'PORT'];
  
  let allPresent = true;
  
  for (const key of required) {
    if (!process.env[key]) {
      log(`❌ Missing required variable: ${key}`, 'red');
      allPresent = false;
    } else {
      log(`✅ ${key} is set`, 'green');
    }
  }
  
  for (const key of optional) {
    if (!process.env[key]) {
      log(`⚠️  Optional variable not set: ${key}`, 'yellow');
    } else {
      log(`✅ ${key} is set`, 'green');
    }
  }
  
  return allPresent;
}

async function testDatabaseTables() {
  log('\n🔍 Testing Database Tables...', 'blue');
  
  const tables = ['users', 'students', 'performance', 'attendance', 'sections', 'subjects'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        log(`❌ Table '${table}' not accessible: ${error.message}`, 'red');
        results[table] = false;
      } else {
        log(`✅ Table '${table}' is accessible`, 'green');
        results[table] = true;
      }
    } catch (err) {
      log(`❌ Error checking table '${table}': ${err.message}`, 'red');
      results[table] = false;
    }
  }
  
  return results;
}

async function main() {
  log('\n═══════════════════════════════════════════════════', 'blue');
  log('  Academic Analytics - Connectivity Verification', 'blue');
  log('═══════════════════════════════════════════════════\n', 'blue');
  
  // Check environment variables
  const envOk = await checkEnvironmentVariables();
  
  if (!envOk) {
    log('\n❌ Please set all required environment variables in .env file', 'red');
    process.exit(1);
  }
  
  // Test Supabase connection
  const connectionOk = await testSupabaseConnection();
  
  if (!connectionOk) {
    log('\n❌ Supabase connection failed. Please check your credentials.', 'red');
    process.exit(1);
  }
  
  // Test database tables
  const tablesOk = await testDatabaseTables();
  
  const allTablesOk = Object.values(tablesOk).every(v => v === true);
  
  log('\n═══════════════════════════════════════════════════', 'blue');
  if (allTablesOk && connectionOk) {
    log('✅ All connectivity tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Please review the output above.', 'yellow');
  }
  log('═══════════════════════════════════════════════════\n', 'blue');
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  process.exit(1);
});


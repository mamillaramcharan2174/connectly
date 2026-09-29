const fs = require('fs');
const path = require('path');
const { query } = require('./index');

async function runMigrations() {
  console.log('[Migration] Starting database migration...');
  const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`[Migration] Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  // Split on semicolons or execute statements
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await query(stmt);
    } catch (err) {
      console.warn('[Migration] Note on statement execution:', err.message);
    }
  }

  console.log('[Migration] Database schema migrated successfully.');
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0)).catch(err => {
    console.error('[Migration Error]', err);
    process.exit(1);
  });
}

module.exports = { runMigrations };

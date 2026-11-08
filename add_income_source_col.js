const postgres = require('postgres');
const fs = require('fs');

// Read directly from .env for DIRECT_URL if it exists, otherwise fall back to SUPABASE_URL/KEY logic if needed.
// Wait, looking at migrate.js, they read from .env.local. Let me check if .env or .env.local has it.
// The user has .env open, not .env.local. I'll read .env.

const envFile = fs.existsSync('.env.local') ? '.env.local' : '.env';
const directUrlLine = fs.readFileSync(envFile, 'utf-8').split('\n').find(line => line.startsWith('DIRECT_URL='));
const directUrl = directUrlLine ? directUrlLine.split('=')[1].replace(/"/g, '').trim() : null;

if (!directUrl) {
    console.error("No DIRECT_URL found in env file.");
    process.exit(1);
}

const sql = postgres(directUrl, { ssl: 'require' });

async function run() {
  try {
    console.log("Adding income_source column to payday_logs...");
    await sql`ALTER TABLE public.payday_logs ADD COLUMN IF NOT EXISTS income_source TEXT DEFAULT 'Primary Income';`;
    console.log("Successfully added income_source!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();

const postgres = require('postgres');
const fs = require('fs');

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
    console.log("Adding company_name column to payday_logs...");
    await sql`ALTER TABLE public.payday_logs ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'Personal';`;
    console.log("Successfully added company_name!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();

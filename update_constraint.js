const postgres = require('postgres');
const fs = require('fs');
const directUrlLine = fs.readFileSync('.env', 'utf-8').split('\n').find(line => line.startsWith('DIRECT_URL='));
const directUrl = directUrlLine ? directUrlLine.split('=')[1].replace(/"/g, '').trim() : null;
const sql = postgres(directUrl, { ssl: 'require' });

async function run() {
  try {
    console.log("Updating payday_logs constraint...");
    
    // Find the constraint name for cutoff_type
    const result = await sql`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.payday_logs'::regclass
      AND pg_get_constraintdef(oid) LIKE '%cutoff_type%';
    `;
    
    if (result.length > 0) {
      for (const row of result) {
        const constraintName = row.conname;
        console.log("Found constraint:", constraintName);
        await sql.unsafe(`ALTER TABLE public.payday_logs DROP CONSTRAINT ${constraintName};`);
        console.log(`Dropped constraint: ${constraintName}`);
      }
    }
    
    // Add the new constraint
    await sql`
      ALTER TABLE public.payday_logs 
      ADD CONSTRAINT payday_logs_cutoff_type_check 
      CHECK (cutoff_type IN ('15th', '30th', 'Monthly'));
    `;
    
    console.log("Added new constraint successfully allowing 'Monthly'!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();

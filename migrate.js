const postgres = require('postgres');
const fs = require('fs');
const directUrlLine = fs.readFileSync('.env.local', 'utf-8').split('\n').find(line => line.startsWith('DIRECT_URL='));
const directUrl = directUrlLine ? directUrlLine.split('=')[1].replace(/"/g, '').trim() : null;
const sql = postgres(directUrl, { ssl: 'require' });

async function run() {
  try {
    console.log("Setting up payday_logs table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.payday_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          cutoff_type TEXT NOT NULL CHECK (cutoff_type IN ('15th', '30th')),
          income NUMERIC NOT NULL,
          daily_expenses NUMERIC NOT NULL,
          family_support NUMERIC NOT NULL,
          ipon_goal NUMERIC NOT NULL,
          custom_allocations JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    // Try adding the column just in case the table already existed without it
    try {
      await sql`ALTER TABLE public.payday_logs ADD COLUMN IF NOT EXISTS custom_allocations JSONB DEFAULT '{}'::jsonb;`;
    } catch (e) {
      console.log("Column already exists or error adding it:", e.message);
    }

    console.log("Enabling RLS...");
    await sql`ALTER TABLE public.payday_logs ENABLE ROW LEVEL SECURITY;`;
    
    // Drop policy if exists to recreate
    await sql`DROP POLICY IF EXISTS "Users can manage their own payday logs" ON public.payday_logs;`;

    await sql`
      CREATE POLICY "Users can manage their own payday logs" ON public.payday_logs
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `;

    console.log("Successfully set up payday_logs and custom_allocations!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();

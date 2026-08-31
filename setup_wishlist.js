const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const directUrlLine = envFile.split('\n').find(line => line.startsWith('DIRECT_URL='));
const directUrl = directUrlLine ? directUrlLine.split('=')[1].replace(/"/g, '').trim() : null;

if (!directUrl) {
  console.error("DIRECT_URL not found in .env.local");
  process.exit(1);
}

const sql = postgres(directUrl, { ssl: 'require' });

async function setupDatabase() {
  try {
    console.log("Creating wishlist table...");
    await sql`
      CREATE TABLE IF NOT EXISTS public.wishlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        item_name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log("Enabling RLS on wishlist...");
    await sql`ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;`;

    console.log("Creating policies for wishlist...");
    
    await sql`DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist;`;
    await sql`DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlist;`;
    await sql`DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist;`;

    await sql`
      CREATE POLICY "Users can view own wishlist" 
      ON public.wishlist FOR SELECT 
      USING (auth.uid() = user_id);
    `;

    await sql`
      CREATE POLICY "Users can insert own wishlist" 
      ON public.wishlist FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    `;

    await sql`
      CREATE POLICY "Users can delete own wishlist" 
      ON public.wishlist FOR DELETE 
      USING (auth.uid() = user_id);
    `;

    console.log("Successfully created wishlist table and policies!");
    process.exit(0);
  } catch (err) {
    console.error("Error setting up database:", err);
    process.exit(1);
  }
}

setupDatabase();

const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DIRECT_URL);

async function checkUser() {
  try {
    const authUsers = await sql`SELECT id, email, confirmed_at, created_at FROM auth.users`;
    console.log("Users in auth.users:");
    console.table(authUsers);

    try {
      const publicUsers = await sql`SELECT * FROM public.users`;
      console.log("\nUsers in public.users:");
      console.table(publicUsers);
    } catch(e) {
      console.log("Table public.users does not exist or cannot be accessed.");
    }
    
  } catch (error) {
    console.error("Error querying users:", error);
  } finally {
    await sql.end();
  }
}

checkUser();

const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DIRECT_URL);

async function checkUser() {
  try {
    const authUsers = await sql`SELECT id, email, confirmed_at, created_at FROM auth.users`;
    console.log("Users in auth.users:");
    console.table(authUsers);

    try {
      const logs = await sql`SELECT id, income, daily_expenses, family_support, custom_allocations, ipon_goal FROM public.payday_logs WHERE id = 'cdd36337-2b25-434c-b46a-abefa7b7a8ad'`;
      console.log("\nSpecific log:", JSON.stringify(logs, null, 2));
    } catch(e) {
      console.log("Error querying logs:", e);
    }
    
  } catch (error) {
    console.error("Error querying users:", error);
  } finally {
    await sql.end();
  }
}

checkUser();

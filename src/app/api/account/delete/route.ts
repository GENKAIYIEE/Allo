import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "../../../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { confirmText?: string };

    if (body.confirmText !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm account deletion." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again to delete your account." },
        { status: 401 }
      );
    }

    // Delete user financial logs and wishlist items first
    const { error: logsDeleteError } = await supabase
      .from("payday_logs")
      .delete()
      .eq("user_id", user.id);

    if (logsDeleteError) {
      return NextResponse.json(
        { error: "Failed to delete your financial records. Please try again." },
        { status: 500 }
      );
    }

    // Best-effort cleanup of wishlist table if present
    await supabase.from("wishlist").delete().eq("user_id", user.id);

    // Permanently delete the auth user when service role key is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id);
      if (deleteUserError) {
        return NextResponse.json(
          { error: "Failed to remove user account record. Please try again." },
          { status: 500 }
        );
      }
    }

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting your account." },
      { status: 500 }
    );
  }
}


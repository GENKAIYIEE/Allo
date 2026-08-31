import { createClient } from "../../../../../lib/supabase/server";
import Link from "next/link";
import EntryDetailClient from "./EntryDetailClient";

export const dynamic = 'force-dynamic';

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-on-background">
        <span className="material-symbols-outlined text-6xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>lock</span>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary mb-4">Not Signed In</h1>
        <p className="text-on-surface-variant font-body-lg mb-8">You need to sign in to view this entry.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-primary text-on-primary rounded-full font-label-caps text-label-caps uppercase hover:bg-primary-container transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const { data: log, error } = await supabase
    .from("payday_logs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !log) {
    if (error) console.error("Error fetching log:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-background text-on-background">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h1 className="font-headline-lg text-headline-lg font-bold text-error mb-4">Entry Not Found</h1>
        <p className="text-on-surface-variant font-body-lg mb-8">We couldn&apos;t find this payday log or you don&apos;t have permission to view it.</p>
        <Link href="/history" className="px-6 py-3 bg-surface-variant text-on-surface-variant rounded-full font-label-caps text-label-caps uppercase hover:bg-outline-variant/30 transition-colors">
          Return to History
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/history" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant transition-colors text-on-surface active:scale-95">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </Link>
          <h1 className="font-headline-lg text-headline-md font-bold text-on-surface">Entry Details</h1>
        </div>
      </header>

      <main className="p-6">
        <EntryDetailClient initialLog={log} />
      </main>
    </div>
  );
}

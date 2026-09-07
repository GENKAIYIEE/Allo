import BottomNav from "../../components/BottomNav";
import { OfflineSyncManager } from "../../components/OfflineSyncManager";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <OfflineSyncManager />
      {children}
      <BottomNav />
    </>
  );
}

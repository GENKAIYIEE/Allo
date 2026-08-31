export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-outline-variant/30 rounded-md ${className}`} />
  );
}

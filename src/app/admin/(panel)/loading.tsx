export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-72 rounded-2xl border border-border bg-card" />
    </div>
  );
}

export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-5 py-16 sm:px-8">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="mt-6 h-12 w-3/4 rounded-lg bg-muted sm:w-1/2" />
      <div className="mt-4 h-4 w-full max-w-xl rounded bg-muted" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-[16/10] bg-muted" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

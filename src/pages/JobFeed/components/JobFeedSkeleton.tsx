export function JobFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex h-64 animate-pulse flex-col justify-between rounded-2xl border border-border bg-surface p-5"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-24 rounded-md bg-muted" />
                <div className="h-2.5 w-16 rounded-md bg-muted" />
              </div>
            </div>
            <div className="h-5 w-3/4 rounded-md bg-muted" />
            <div className="flex gap-2">
              <div className="h-4 w-20 rounded-md bg-muted" />
              <div className="h-4 w-16 rounded-md bg-muted" />
            </div>
          </div>
          <div className="flex justify-between border-t border-border pt-4">
            <div className="h-3 w-12 rounded-md bg-muted" />
            <div className="h-6 w-24 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

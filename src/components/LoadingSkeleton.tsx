import { Skeleton } from '@/components/ui/skeleton'

export function LoadingSkeleton() {
  return (
    <div
      className="bg-card grid h-full min-h-0 overflow-hidden rounded-xl border shadow-sm"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="bg-muted flex gap-2 border-b p-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
      <div className="grid gap-2 p-3">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="flex gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

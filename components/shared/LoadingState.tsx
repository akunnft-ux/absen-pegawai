import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingStateProps {
  variant?: "spinner" | "skeleton"
  rows?: number
  className?: string
}

function Spinner({ className }: { className?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        className={cn(
          "h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary",
          className
        )}
      />
    </div>
  )
}

function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 py-8">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadingState({
  variant = "spinner",
  rows = 5,
  className,
}: LoadingStateProps) {
  if (variant === "spinner") {
    return <Spinner className={className} />
  }

  return <SkeletonList rows={rows} />
}

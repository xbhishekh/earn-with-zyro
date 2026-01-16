import { Skeleton } from "@/components/ui/skeleton";

export function CampaignCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Title */}
      <div className="px-4 pb-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Budget */}
      <div className="px-4 pb-3">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Stats */}
      <div className="px-4 pb-4 flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Button */}
      <div className="p-4 border-t border-border">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full" />

      {/* Content */}
      <div className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-3" />

        {/* Seller */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Rating & Members */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-4 h-4 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function FeaturedProductSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl overflow-hidden border-2 border-primary/20 animate-pulse">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full" />

      {/* Content */}
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-3" />

        {/* Seller */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-4 h-4 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

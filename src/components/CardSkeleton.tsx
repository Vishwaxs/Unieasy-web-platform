import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton card grid shown while listing pages load data.
 * Each variant mirrors the real card layout for that page.
 */

function ImageBlock({ height = "h-48" }: { height?: string }) {
  return (
    <div className={`relative ${height}`}>
      <Skeleton className="w-full h-full rounded-none" />
      <Skeleton className="absolute top-3 left-3 w-16 h-6 rounded-full" />
      <Skeleton className="absolute top-3 right-3 w-12 h-6 rounded-full" />
    </div>
  );
}

export function FoodCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
      <ImageBlock />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ExploreCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
      <ImageBlock />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-2/5 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function AccommodationCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
      <ImageBlock />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-2/5 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function StudyCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
      <ImageBlock />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-2/5 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function EssentialsCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
      <ImageBlock height="h-40" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-1/3 rounded" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function CampusCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
      <ImageBlock height="h-44" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-2/5 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="container mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  gridClassName: string;
  children: React.ReactNode;
}

export function SkeletonGrid({ count = 8, gridClassName, children }: SkeletonGridProps) {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
          {children}
        </div>
      ))}
    </div>
  );
}

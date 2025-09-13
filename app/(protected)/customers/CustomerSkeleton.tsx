import { Skeleton } from "@/components/ui/skeleton";

export function CustomerSkeleton() {
  return (
    <div className="p-4 space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}



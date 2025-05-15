'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  contentHeight?: number;
  withFooter?: boolean;
  className?: string;
}

export function CardSkeleton({
  contentHeight = 200,
  withFooter = false,
  className = ""
}: CardSkeletonProps) {
  return (
    <Card className={`w-full h-full ${className}`}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className={`h-${contentHeight} w-full`} />
      </CardContent>
      {withFooter && (
        <CardFooter className="justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      )}
    </Card>
  );
}

export function CardGridSkeleton({
  count = 3, 
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

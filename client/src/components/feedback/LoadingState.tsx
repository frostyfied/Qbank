import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export interface LoadingStateProps {
  type?: 'card' | 'list' | 'table';
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ type = 'card', count = 3 }) => {
  if (type === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 rounded-lg bg-white border border-slate-200">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl bg-white border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="pt-2 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'list' | 'metrics';
}

export default function LoadingSkeleton({ className = '', variant = 'card' }: LoadingSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-32 bg-slate-800 rounded animate-shimmer" />
                <div className="h-2 w-20 bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="h-6 w-12 bg-slate-800 rounded-md animate-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'metrics') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-2.5 w-24 bg-slate-800 rounded animate-shimmer" />
              <div className="h-4 w-4 bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
              <div className="h-2 w-full bg-slate-800/40 rounded overflow-hidden">
                <div className="h-full bg-slate-800 w-1/3 animate-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div className={`p-6 rounded-2xl glass-card space-y-5 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-800 animate-pulse flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 bg-slate-800 rounded animate-shimmer" />
          <div className="h-3 w-1/2 bg-slate-800/60 rounded animate-shimmer" />
        </div>
      </div>
      <div className="space-y-2.5 py-2">
        <div className="h-2 w-full bg-slate-800/40 rounded" />
        <div className="h-2 w-11/12 bg-slate-800/40 rounded" />
        <div className="h-2 w-9/12 bg-slate-800/40 rounded" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-7 w-20 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-3 w-28 bg-slate-800/50 rounded" />
      </div>
    </div>
  );
}

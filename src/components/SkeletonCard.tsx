import React from "react";

export function SkeletonProductCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-4 flex flex-col h-full animate-pulse shadow-sm">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-[1.5rem] mb-4"></div>
      
      {/* Title skeleton */}
      <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3"></div>
      
      {/* Description skeleton */}
      <div className="space-y-2 flex-grow">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
      </div>
      
      {/* Price and button skeleton */}
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800/50">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
      </div>
    </div>
  );
}

export function SkeletonBlogCard() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 flex flex-col h-full animate-pulse">
      <div className="w-full h-56 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-6"></div>
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-4/5 mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-6 flex-grow"></div>
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center mt-auto">
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    </div>
  );
}

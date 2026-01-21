import React from 'react';

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded w-1/2 mb-2"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-lg"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          <div className="h-32 bg-gray-200 dark:bg-dark-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 card animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-dark-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-dark-700 rounded w-1/4"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-full"></div>
    </div>
  );
};

export default SkeletonLoader;

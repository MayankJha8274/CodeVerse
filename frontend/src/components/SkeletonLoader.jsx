import React from 'react';

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 animate-pulse transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-50 dark:bg-[#1a1a2e] rounded w-1/3 mb-3 transition-colors"></div>
            <div className="h-8 bg-gray-50 dark:bg-[#1a1a2e] rounded w-1/2 mb-2 transition-colors"></div>
          </div>
          <div className="w-12 h-12 bg-gray-50 dark:bg-[#1a1a2e] rounded-lg transition-colors"></div>
        </div>
        <div className="h-4 bg-gray-50 dark:bg-[#1a1a2e] rounded w-2/3 transition-colors"></div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white dark:bg-[#16161f] rounded-xl p-6 animate-pulse transition-colors">
        <div className="h-6 bg-gray-50 dark:bg-[#1a1a2e] rounded w-1/3 mb-6 transition-colors"></div>
        <div className="space-y-3">
          <div className="h-32 bg-gray-50 dark:bg-[#1a1a2e] rounded transition-colors"></div>
          <div className="h-32 bg-gray-50 dark:bg-[#1a1a2e] rounded transition-colors"></div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-[#16161f] rounded-xl animate-pulse transition-colors">
            <div className="w-10 h-10 bg-gray-50 dark:bg-[#1a1a2e] rounded-full transition-colors"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-50 dark:bg-[#1a1a2e] rounded w-1/3 mb-2 transition-colors"></div>
              <div className="h-3 bg-gray-50 dark:bg-[#1a1a2e] rounded w-1/4 transition-colors"></div>
            </div>
            <div className="h-4 bg-gray-50 dark:bg-[#1a1a2e] rounded w-16 transition-colors"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-50 dark:bg-[#1a1a2e] rounded w-full transition-colors"></div>
    </div>
  );
};

export default SkeletonLoader;

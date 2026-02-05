import React from 'react';

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="bg-[#16161f] rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-4 bg-[#1a1a2e] rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-[#1a1a2e] rounded w-1/2 mb-2"></div>
          </div>
          <div className="w-12 h-12 bg-[#1a1a2e] rounded-lg"></div>
        </div>
        <div className="h-4 bg-[#1a1a2e] rounded w-2/3"></div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-[#16161f] rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-[#1a1a2e] rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          <div className="h-32 bg-[#1a1a2e] rounded"></div>
          <div className="h-32 bg-[#1a1a2e] rounded"></div>
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-[#16161f] rounded-xl animate-pulse">
            <div className="w-10 h-10 bg-[#1a1a2e] rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-[#1a1a2e] rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-[#1a1a2e] rounded w-1/4"></div>
            </div>
            <div className="h-4 bg-[#1a1a2e] rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-[#1a1a2e] rounded w-full"></div>
    </div>
  );
};

export default SkeletonLoader;

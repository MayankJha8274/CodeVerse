import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d0d14]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-gray-900 dark:text-white text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
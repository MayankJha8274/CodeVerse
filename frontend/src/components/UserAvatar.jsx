import React from 'react';

const UserAvatar = ({ user, size = 'md', showName = false, showUsername = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  return (
    <div className="flex items-center gap-3">
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-gray-200 dark:ring-dark-700`}
      />
      {(showName || showUsername) && (
        <div className="flex flex-col">
          {showName && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.name}
            </span>
          )}
          {showUsername && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{user.username}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;

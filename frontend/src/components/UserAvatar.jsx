import React from 'react';

const UserAvatar = ({ user, size = 'md', showName = false, showUsername = false, responsiveName = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  const getInitial = () => {
    if (!user) return '?';
    return (user.fullName?.[0] || user.name?.[0] || user.username?.[0] || '?').toUpperCase();
  };

  const displayName = user?.fullName || user?.name || user?.username || 'User';

  return (
    <div className="flex items-center gap-3">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={displayName}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-amber-500/30`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold`}>
          {getInitial()}
        </div>
      )}
      {(showName || showUsername) && (
        <div className={`flex-col ${responsiveName ? 'hidden sm:flex' : 'flex'}`}>
          {showName && (
            <span className="text-sm font-semibold text-white">
              {displayName}
            </span>
          )}
          {showUsername && user?.username && (
            <span className="text-xs text-gray-400">
              @{user.username}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;

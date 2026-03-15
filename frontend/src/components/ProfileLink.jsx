import React from 'react';
import { Link } from 'react-router-dom';

const ProfileLink = ({ user, userId, children, className = '', stopPropagation = true, title = 'View profile' }) => {
  const resolvedUserId = userId || user?._id || user?.id || user?.user?._id || user?.user?.id || null;

  const handleClick = (event) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
  };

  if (!resolvedUserId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      to={`/dashboard/profile/${resolvedUserId}`}
      onClick={handleClick}
      className={className}
      title={title}
    >
      {children}
    </Link>
  );
};

export default ProfileLink;
import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { useTheme } from '../hooks/useCustomHooks';

const Navbar = ({ user, onMenuClick, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-[#16161f] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 transition-colors">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a.75.75 0 01.743.648L10.75 2.75V4a.75.75 0 01-1.493.102L9.25 4V2.75A.75.75 0 0110 2zM10 16a.75.75 0 01.743.648L10.75 16.75V18a.75.75 0 01-1.493.102L9.25 18v-1.25A.75.75 0 0110 16zM4.222 4.222a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zM14.834 14.834a.75.75 0 011.06 0l.884.884a.75.75 0 11-1.06 1.06l-.884-.884a.75.75 0 010-1.06zM2 10a.75.75 0 01.648-.743L2.75 9.25H4a.75.75 0 01.102 1.493L4 10.75H2.75A.75.75 0 012 10zM16 10a.75.75 0 01.648-.743L16.75 9.25H18a.75.75 0 01.102 1.493L18 10.75h-1.25A.75.75 0 0116 10zM4.222 15.778a.75.75 0 010 1.06l-.884.884a.75.75 0 11-1.06-1.06l.884-.884a.75.75 0 011.06 0zM15.778 5.166a.75.75 0 010 1.06l-.884.884a.75.75 0 11-1.06-1.06l.884-.884a.75.75 0 011.06 0z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707 8 8 0 1017.293 13.293z"/></svg>
            )}
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700">
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2"
              >
                <UserAvatar user={user} size="md" showName responsiveName />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#16161f] text-left flex items-center gap-3"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#16161f] text-left flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">Settings</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#16161f] text-left flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { Menu, Bell, Sun, Moon, Search, LogOut } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import { useTheme } from '../hooks/useCustomHooks';

const Navbar = ({ user, onMenuClick, onLogout }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-[#16161f] border-b border-gray-800 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-2 bg-[#1a1a2e] rounded-lg px-4 py-2 w-80 border border-gray-700">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search problems, users..."
              className="bg-transparent border-none outline-none flex-1 text-sm text-white placeholder-gray-500"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#1a1a2e] text-gray-400 hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-[#1a1a2e] text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-700">
            <UserAvatar user={user} size="md" showName />
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-[#1a1a2e] text-gray-400 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Code2, 
  Users, 
  GitCompare, 
  Settings, 
  Trophy,
  BookOpen,
  X,
  Zap,
  Calendar,
  PlusCircle
} from 'lucide-react';
import api from '../services/api';

const Sidebar = ({ isOpen, onClose }) => {
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    const fetchUserRank = async () => {
      try {
        const data = await api.getUserRank();
        setUserRank(data);
      } catch (error) {
        console.error('Failed to fetch user rank:', error);
      }
    };
    fetchUserRank();
  }, []);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/platforms', icon: Code2, label: 'Platforms' },
    { to: '/sheets', icon: BookOpen, label: 'DSA Sheets' },
    { to: '/daily-challenge', icon: Zap, label: 'Daily Challenge' },
    { to: '/contests', icon: Calendar, label: 'Contests' },
    { to: '/contests/admin', icon: PlusCircle, label: 'Host Contest' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/rooms', icon: Users, label: 'Societies' },
    { to: '/compare', icon: GitCompare, label: 'Compare' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#16161f] border-r border-gray-800
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Code2 className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">
                CodeVerse
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 custom-scrollbar overflow-y-auto">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                  ${isActive 
                    ? 'bg-amber-500/20 text-amber-500' 
                    : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <NavLink
              to="/leaderboard"
              className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:from-amber-500/20 hover:to-orange-500/20 transition-colors"
            >
              <Trophy className="w-5 h-5 text-amber-500" />
              <div className="flex-1">
                <div className="text-xs text-gray-400">Your Rank</div>
                <div className="text-sm font-bold text-white">
                  {userRank ? `#${userRank.rank.toLocaleString()}` : 'Loading...'}
                </div>
              </div>
              {userRank && (
                <div className="text-right">
                  <div className="text-xs text-gray-400">C-Score</div>
                  <div className="text-sm font-bold text-amber-500">{userRank.cScore}</div>
                </div>
              )}
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

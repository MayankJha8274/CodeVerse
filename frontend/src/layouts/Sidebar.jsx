import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  PlusCircle,
  FileCode2,
  UserPen,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Swords,
  Menu
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, onToggle }) => {
  const [userRank, setUserRank] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    profileTracker: true,
    questionTracker: true,
    eventTracker: true,
    community: true
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sections = [
    {
      id: 'profileTracker',
      label: 'PROFILE TRACKER',
      items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/platforms', icon: Code2, label: 'Platforms' },
      ]
    },
    {
      id: 'community',
      label: 'COMMUNITY',
      items: [
        { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
        { to: '/rooms', icon: Users, label: 'Societies' },
      ]
    },
    {
      id: 'questionTracker',
      label: 'QUESTION TRACKER',
      items: [
        { to: '/sheets', icon: BookOpen, label: 'DSA Sheets' },
        { to: '/daily-challenge', icon: Zap, label: 'Daily Challenge' },
        { to: '/problem-set', icon: FileCode2, label: 'Problem Set' },
      ]
    },
    {
      id: 'eventTracker',
      label: 'EVENT TRACKER',
      items: [
        { to: '/contests', icon: Swords, label: 'Contests' },
        { to: '/contests/admin', icon: PlusCircle, label: 'Host Contest' },
      ]
    }
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      onClick={() => window.innerWidth < 1024 && onClose()}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'bg-amber-500/15 text-amber-500' 
          : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-gray-200'
        }
      `}
    >
      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );

  const SectionHeader = ({ section }) => (
    <button
      onClick={() => toggleSection(section.id)}
      className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold tracking-widest text-gray-500 uppercase hover:text-gray-400 transition-colors"
    >
      <span>{section.label}</span>
      {expandedSections[section.id] ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-[#111118] border-r border-gray-800/50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-60' : 'w-0 lg:w-0'}
          lg:relative
        `}
        style={{ overflow: 'hidden' }}
      >
        <div className="flex flex-col h-full w-60">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800/50">
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code2 className="w-4 h-4 text-black" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
                CodeVerse
              </span>
            </NavLink>
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-[#1a1a2e]"
              title="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto custom-scrollbar">
            {sections.map((section) => (
              <div key={section.id} className="mb-1">
                <SectionHeader section={section} />
                {expandedSections[section.id] && (
                  <div className="space-y-0.5 ml-1">
                    {section.items.map(item => (
                      <NavItem key={item.to} item={item} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-gray-800/50 p-3 space-y-2">
            {/* Rank Card */}
            <NavLink
              to="/leaderboard"
              className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Rank</div>
                <div className="text-sm font-bold text-white truncate">
                  {userRank ? `#${userRank.rank.toLocaleString()}` : '—'}
                </div>
              </div>
              {userRank && (
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-gray-500">Score</div>
                  <div className="text-sm font-bold text-amber-500">{userRank.cScore}</div>
                </div>
              )}
            </NavLink>

            {/* Edit Profile & Logout */}
            <div className="flex gap-2">
              <NavLink
                to="/settings"
                onClick={() => window.innerWidth < 1024 && onClose()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1a1a2e] transition-all"
              >
                <UserPen className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

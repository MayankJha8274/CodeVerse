import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0d0d14]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          user={user} 
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0d0d14] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

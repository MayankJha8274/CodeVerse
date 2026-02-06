import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0d0d14]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          user={user} 
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0d0d14]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

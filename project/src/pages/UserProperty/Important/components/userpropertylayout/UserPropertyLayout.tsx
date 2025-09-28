import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UserPropertySidebar from './UserPropertySidebar';
import UserPropertyTopBar from './UserPropertyTopBar';

const UserPropertyLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  
  // Set page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/user-property/dashboard')) return 'Dashboard';
    if (path.includes('/user-property/users')) return 'User Management';
    if (path.includes('/user-property/properties')) return 'Property Management';
    if (path.includes('/user-property/tasks')) return 'Task Management';
    if (path.includes('/user-property/daily-reports')) return 'Daily Reports';
    if (path.includes('/user-property/monthly-task-management')) return 'Monthly Tasks';
    if (path.includes('/user-property/52-week-work-calendar')) return '52 Week Calendar';
    if (path.includes('/user-property/52-week-training-calendar')) return '52 Week Training';
    if (path.includes('/user-property/incident-report')) return 'Incident Report';
    if (path.includes('/user-property/site-security-patrolling')) return 'Site Security Patrolling';
    if (path.includes('/user-property/technical-team-patrolling')) return 'Technical Team Patrolling';
    if (path.includes('/user-property/night-incident-patrolling')) return 'Night Incident Patrolling';
    if (path.includes('/user-property/audit-reports')) return 'Audit Reports';
    if (path.includes('/user-property/site-pre-transition')) return 'Site Pre-Transition';
    if (path.includes('/user-property/post-transition')) return 'Post-Transition';
    if (path.includes('/user-property/activity')) return 'Activity Log';
    if (path.includes('/user-property/reports')) return 'Reports';
    if (path.includes('/user-property/notifications')) return 'Notifications';
    if (path.includes('/user-property/settings')) return 'Settings';
    
    return 'Property User Dashboard';
  };
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <UserPropertySidebar 
        isMobile={isMobile} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <UserPropertyTopBar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getPageTitle()} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserPropertyLayout;
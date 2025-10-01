import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Building2, 
  CheckSquare, 
  ClipboardList, 
  Bell, 
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  to, 
  icon, 
  label, 
  active, 
  hasSubmenu = false,
  isOpen = false,
  onClick 
}) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-200 ${
        active 
          ? 'bg-gradient-to-r from-[#E06002] to-[#FB7E03] text-white' 
          : 'text-[#000435] hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span className="flex-1">{label}</span>
      {hasSubmenu && (
        <span className="ml-auto">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      )}
    </Link>
  );
};

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onClose }) => {
  const location = useLocation();
  const [tasksOpen, setTasksOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { path: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/users', icon: <Users size={20} />, label: 'Users' },
    { path: '/properties', icon: <Building2 size={20} />, label: 'Properties' },
    { 
      path: '/tasks', 
      icon: <CheckSquare size={20} />, 
      label: 'Tasks',
      hasSubmenu: true,
      submenuItems: [
        { path: '/tasks/categories', label: 'Categories' },
        { path: '/tasks/all', label: 'All Tasks' },
        { path: '/tasks/assigned', label: 'Assigned to Me' },
      ]
    },
    { path: '/activity', icon: <Activity size={20} />, label: 'Activity Log' },
    { path: '/reports', icon: <ClipboardList size={20} />, label: 'Reports' },
    { path: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (tasksOpen) setTasksOpen(false);
  };
  
  return (
    <div 
      className={`
        ${isMobile 
          ? 'fixed inset-y-0 left-0 z-50 w-72 shadow-xl transition-transform duration-300 ease-in-out transform'
          : 'sticky top-0 h-screen flex-shrink-0 transition-all duration-300 ease-in-out'
        }
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        ${!isMobile && (isCollapsed ? 'w-20' : 'w-64')}
        bg-white flex flex-col border-r border-gray-200
      `}
    >
      {/* Logo and company name */}
      <div className={`px-6 py-6 mb-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center text-xl font-bold">
            <span className="text-[#000435]">Track</span>
            <span className="text-[#E06002]">Bot</span>
          </Link>
        )}
        {isCollapsed && (
          <Link to="/dashboard" className="flex items-center text-xl font-bold">
            <span className="text-[#E06002]">T</span>
          </Link>
        )}
        <div className="flex items-center">
          {isMobile ? (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          ) : (
            <button 
              onClick={toggleCollapse}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              {isCollapsed ? <ChevronRightIcon size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation items */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.path} className="mb-1">
            <NavItem
              to={item.hasSubmenu ? '#' : item.path}
              icon={item.icon}
              label={!isCollapsed ? item.label : ''}
              active={location.pathname === item.path}
              hasSubmenu={item.hasSubmenu && !isCollapsed}
              isOpen={item.hasSubmenu && tasksOpen}
              onClick={() => {
                if (item.hasSubmenu && !isCollapsed) {
                  setTasksOpen(!tasksOpen);
                } else if (isMobile) {
                  onClose();
                }
              }}
            />
            
            {/* Submenu items */}
            {item.hasSubmenu && tasksOpen && !isCollapsed && (
              <div className="ml-9 mt-1 space-y-1">
                {item.submenuItems!.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                      location.pathname === subItem.path
                        ? 'bg-orange-100 text-[#E06002]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={isMobile ? onClose : undefined}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Logout button */}
      <div className={`px-3 py-4 border-t border-gray-200 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'w-full'} px-4 py-3 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200`}
        >
          <LogOut size={20} className={isCollapsed ? '' : 'mr-3'} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

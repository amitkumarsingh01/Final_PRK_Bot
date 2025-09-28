import React, { useState, useEffect } from 'react';
import { 
  Home, 
  User,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  FileText,
  Calendar,
  AlertTriangle,
  Building
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  hasSubmenu?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
}

interface SubMenuItem {
  path: string;
  label: string;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
}

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
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

interface UserPropertySidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone_no: string;
  user_role: string;
  user_type: string;
  property_id: string;
  status: string;
}

const UserPropertySidebar: React.FC<UserPropertySidebarProps> = ({ isMobile, isOpen, onClose }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [propertyLogo, setPropertyLogo] = useState<string | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.userId) {
        try {
          const response = await fetch(`https://server.prktechindia.in/profile/${user.userId}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (response.ok) {
            const currentUserProfile = await response.json();
            setUserProfile(currentUserProfile);
            
            // Fetch property logo for property users
            if (currentUserProfile.user_type === 'property_user' && currentUserProfile.property_id) {
              try {
                const propRes = await fetch(`https://server.prktechindia.in/properties/${currentUserProfile.property_id}`);
                if (propRes.ok) {
                  const propData = await propRes.json();
                  if (propData.logo_base64) {
                    setPropertyLogo(propData.logo_base64);
                  } else {
                    setPropertyLogo(null);
                  }
                } else {
                  setPropertyLogo(null);
                }
              } catch (error) {
                setPropertyLogo(null);
              }
            } else {
              setPropertyLogo(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setPropertyLogo(null);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Helper function to check if any submenu item matches the current path
  const isSubmenuActive = (submenuItems: SubMenuItem[], currentPath: string): boolean => {
    return submenuItems.some(item => {
      if (item.path === currentPath) return true;
      if (item.hasSubmenu && item.submenuItems) {
        return isSubmenuActive(item.submenuItems, currentPath);
      }
      return false;
    });
  };

  const getUserPropertyNavItems = (): NavItem[] => {
    return [
      { path: '/user-property/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
      { path: '/user-property/profile', icon: <User size={20} />, label: 'Profile' },
      { path: '/user-property/daily-reports', icon: <FileText size={20} />, label: 'Daily Complete work Details' },
      { path: '/user-property/monthly-task-management', icon: <Calendar size={20} />, label: 'Monthly Checklist' },
      { path: '/user-property/52-week-work-calendar', icon: <Calendar size={20} />, label: '52 Week Work Calendar' },
      { path: '/user-property/52-week-training-calendar', icon: <Calendar size={20} />, label: '52 week training calendar format' },
      { path: '/user-property/incident-report', icon: <AlertTriangle size={20} />, label: 'Incident Report' },
      { path: '/user-property/site-security-patrolling', icon: <Building size={20} />, label: 'Site Security Patrolling Report' },
      { path: '/user-property/technical-team-patrolling', icon: <Building size={20} />, label: 'Facility or Technical team Patrolling Report' },
      { path: '/user-property/night-incident-patrolling', icon: <Building size={20} />, label: 'Back-end team Patrolling Report' },
      { path: '/user-property/audit-reports', icon: <FileText size={20} />, label: 'Audit Reports' },
      { path: '/user-property/site-pre-transition', icon: <Building size={20} />, label: 'Site Pre-Transition' },
      { path: '/user-property/post-transition', icon: <Building size={20} />, label: 'Post-Transition' },
    ];
  };

  const navItems = getUserPropertyNavItems();
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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
          <Link to="/user-property/dashboard" className="flex items-center text-xl font-bold">
            {propertyLogo ? (
              <img src={propertyLogo} alt="Property Logo" className="h-10 w-10 mr-2 rounded-full object-cover border" />
            ) : (
              <span className="h-10 w-10 mr-2 flex items-center justify-center bg-gray-200 rounded-full"><Building size={24} /></span>
            )}
          </Link>
        )}
        {isCollapsed && (
          <Link to="/user-property/dashboard" className="flex items-center text-xl font-bold">
            {propertyLogo ? (
              <img src={propertyLogo} alt="Property Logo" className="h-10 w-10 rounded-full object-cover border" />
            ) : (
              <span className="h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full"><Building size={24} /></span>
            )}
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
        {navItems.map((item, index) => (
          <div key={`nav-${item.label}-${index}`} className="mb-1">
            <NavItem
              to={item.hasSubmenu ? '#' : item.path}
              icon={item.icon}
              label={!isCollapsed ? item.label : ''}
              active={location.pathname === item.path || (!!item.hasSubmenu && (location.pathname.startsWith(item.path + '/') || (!!item.submenuItems && isSubmenuActive(item.submenuItems, location.pathname))))}
              hasSubmenu={item.hasSubmenu && !isCollapsed}
              isOpen={item.hasSubmenu && openKeys.includes(`nav-${item.label}-${index}`)}
              onClick={() => {
                if (item.hasSubmenu && !isCollapsed) {
                  const key = `nav-${item.label}-${index}`;
                  if (openKeys.includes(key)) {
                    setOpenKeys(openKeys.filter((k) => k !== key));
                  } else {
                    setOpenKeys([...openKeys, key]);
                  }
                } else if (isMobile) {
                  onClose();
                }
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Logout button */}
      <div className={`px-3 py-4 border-t border-gray-200 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={logout}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'w-full'} px-4 py-3 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200`}
        >
          <LogOut size={20} className={isCollapsed ? '' : 'mr-3'} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default UserPropertySidebar;
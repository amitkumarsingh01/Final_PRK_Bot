import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Building2, 
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  User,
  Search,
  Calendar,
  FileText,
  Shield,
  Camera,
  Flame,
  ShoppingCart,
  Handshake,
  Target,
  MessageSquare,
  Database,
  FolderOpen,
  FileCheck,
  BarChart3,
  AlertTriangle,
  HardHat,
  Package,
  RefreshCw,
  Award,
  Building,
  Key,
  UserPlus
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../../assets/logo.png';

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

interface SidebarProps {
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

const Sidebar: React.FC<SidebarProps> = ({ isMobile, isOpen, onClose }) => {
  const location = useLocation();
  const [tasksOpen, setTasksOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [propertyLogo, setPropertyLogo] = useState<string | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.userId) {
        console.log('🔍 SIDEBAR - Fetching user profile...');
        console.log('👤 Current user ID:', user.userId);
        console.log('🎫 User token:', user.token ? 'Present' : 'Missing');
        console.log('👥 User type from context:', user.userType);
        try {
          console.log('🌐 Making profile request to server...');
          const response = await fetch(`https://server.prktechindia.in/profile/${user.userId}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          console.log('📡 Profile response status:', response.status);
          console.log('📡 Profile response ok:', response.ok);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const currentUserProfile = await response.json();
          console.log('📦 Full profile API response:', currentUserProfile);
          
          if (currentUserProfile) {
            console.log('✅ Profile found! Setting user profile...');
            console.log('👥 Profile user_type:', currentUserProfile.user_type);
            console.log('🏢 Profile property_id:', currentUserProfile.property_id);
            setUserProfile(currentUserProfile);
            
            // Fetch property logo for cadmin/user
            if (currentUserProfile.user_type !== 'admin' && currentUserProfile.property_id) {
              console.log('🏢 Fetching property logo for non-admin user...');
              try {
                const propRes = await fetch(`https://server.prktechindia.in/properties/${currentUserProfile.property_id}`);
                if (propRes.ok) {
                  const propData = await propRes.json();
                  if (propData.logo_base64) {
                    console.log('🖼️ Property logo found and set');
                    setPropertyLogo(propData.logo_base64);
                  } else {
                    console.log('❌ No property logo in response');
                    setPropertyLogo(null);
                  }
                } else {
                  console.log('❌ Failed to fetch property data');
                  setPropertyLogo(null);
                }
              } catch (error) {
                console.log('💥 Error fetching property:', error);
                setPropertyLogo(null);
              }
            } else {
              console.log('👑 Admin user - no property logo needed');
              setPropertyLogo(null);
            }
          } else {
            console.log('❌ No profile found for user ID:', user.userId);
            setUserProfile(null);
            setPropertyLogo(null);
          }
        } catch (error) {
          console.error('💥 SIDEBAR - Error fetching user profile:', error);
          setUserProfile(null);
          setPropertyLogo(null);
        }
      } else {
        console.log('❌ SIDEBAR - No user ID available');
        setUserProfile(null);
        setPropertyLogo(null);
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

  // Role-based access control mapping
  const getRoleBasedNavItems = (userRole: string): NavItem[] => {

    // Define access permissions for each role
    const rolePermissions: Record<string, string[]> = {
      // Administrative roles
      'admin': ['All Pages'],
      'cadmin': ['All Pages'],
      'helpdesk': [
        'Daily Task Management of all department', 'Daily Management Report', 'Daily Complete work Details', 'Monthly Management Report',
        '52 Week Work Calendar', '52 week training calendar format', 'Incident Report',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Tickets Management', 'Ticket Assignment', 'Notice Management',
        'Parking Sticker Management', 'Communication & Announcements',
        'Move-In Coordination', 'Move-Out Coordination', 'Interior Work Approvals',
        'Work Permit Tracking', 'Inventory Management', 'Asset Management',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Work Permits'
      ],
      
      // Management roles
      'general_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'assistant_general_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'operations_head': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'operations_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'training_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'area_manager': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      'field_officer': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Audit Reports', 'Site Pre-Transition', 'Post-Transition',
        'Site Visit Reports', 'Training Reports', 'Night Patrolling Reports',
        'Minutes of Meetings', 'Escalation Matrix', 'Back-end team Patrolling Report'
      ],
      
      // Security roles
      'security_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Site Security Patrolling Report', 'Gate Management', 'Work Permits'
      ],
      'security_officer': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Site Security Patrolling Report', 'Gate Management', 'Work Permits',
        'Inventory Management', 'Asset Management', 'CCTV Department'
      ],
      
      // Technical roles
      'electrical_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Generator', 'Diesel Generator', 'Facility or Technical team Patrolling Report',
        'Inventory Management', 'Asset Management'
      ],
      'electrical_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Generator', 'Diesel Generator', 'Facility or Technical team Patrolling Report'
      ],
      'plumber': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Fresh Water', 'Facility or Technical team Patrolling Report'
      ],
      'plumbing_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Inventory Management', 'Asset Management'
      ],
      'stp_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'STP', 'Facility or Technical team Patrolling Report', 'Inventory Management', 'Asset Management'
      ],
      'stp_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'STP', 'Facility or Technical team Patrolling Report'
      ],
      'wtp_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'WTP', 'Facility or Technical team Patrolling Report', 'Inventory Management', 'Asset Management'
      ],
      'wtp_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'WTP', 'Facility or Technical team Patrolling Report'
      ],
      'swimming_pool_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Swimming Pool', 'Facility or Technical team Patrolling Report'
      ],
      'swimming_pool_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Swimming Pool', 'Facility or Technical team Patrolling Report'
      ],
      'lift_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'gym_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'gas_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'multi_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      
      // Other roles
      'housekeeping_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Inventory Management', 'Asset Management'
      ],
      'pest_control_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report', 'Inventory Management', 'Asset Management'
      ],
      'pest_control_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'fire_officer': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report', 'Fire and Safety', 'Work Permits'
      ],
      'garden_supervisor': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'Facility or Technical team Patrolling Report'
      ],
      'cctv_technician': [
        'Daily Task Management of all department', 'Monthly Checklist',
        'CCTV Department'
      ]
    };

    const userPermissions = rolePermissions[userRole] || [];
    
    // If user has access to all pages (admin/cadmin)
    if (userPermissions.includes('All Pages')) {
      return getFullNavItems();
    }

    // Filter navigation items based on user permissions
    return getFilteredNavItems(userPermissions);
  };

  const getDailyAllDeptPath = (): string => {
    return userProfile?.user_type === 'cadmin' ? '/cadmin/daily-task-management-all-department' : '/daily-task-management-all-department';
  };

  const getFullNavItems = (): NavItem[] => {
    // For admin/cadmin (full access), avoid duplicating the Daily Task link since it's already inside the
    // "Daily Task Management" group below. Keep only Dashboard and Profile at the top level.
    const baseItems: NavItem[] = [
      { path: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
      { path: '/profile', icon: <User size={20} />, label: 'Profile' },
    ];

    // If user is admin, show all admin items
    if (userProfile?.user_type === 'admin') {
      return [...baseItems, ...getAdminNavItems()];
    }

    // If user is cadmin, show all cadmin items
    if (userProfile?.user_type === 'cadmin') {
      return [...baseItems, ...getCadminNavItems()];
    }

    return baseItems;
  };

  const getFilteredNavItems = (permissions: string[]): NavItem[] => {
    // For property users, show all role-based navigation items with user paths
    if (userProfile?.user_type === 'property_user') {
      const baseItems: NavItem[] = [
        { path: '/user/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
        { path: '/user/profile', icon: <User size={20} />, label: 'Profile' },
      ];

      const filteredItems: NavItem[] = [];

      // Get all navigation items and filter based on permissions
      const allNavItems = getCadminNavItems(); // Use cadmin structure for property users
      
      for (const item of allNavItems) {
        if (hasAccessToItem(item, permissions)) {
          // Convert paths to user-property paths
          const convertedItem = convertToUserPropertyPath(item);
          filteredItems.push(convertedItem);
        }
      }

      console.log('🔒 Filtered navigation items for property user role:', userProfile?.user_role, 'Items:', filteredItems.length);
      return [...baseItems, ...filteredItems];
    }

    // For non-admin roles, surface the direct Daily Task link at the top level
    const baseItems: NavItem[] = [
      { path: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
      { path: '/profile', icon: <User size={20} />, label: 'Profile' },
      { path: getDailyAllDeptPath(), icon: <Calendar size={20} />, label: 'Daily Task Management of all department' },
    ];

    const filteredItems: NavItem[] = [];

    // Check each navigation item against user permissions
    // Helpdesk users should use admin navigation items, not cadmin
    const allNavItems = (userProfile?.user_type === 'admin' || userProfile?.user_role === 'helpdesk') ? getAdminNavItems() : getCadminNavItems();
    
    for (const item of allNavItems) {
      if (hasAccessToItem(item, permissions)) {
        filteredItems.push(item);
      }
    }

    console.log('🔒 Filtered navigation items for role:', userProfile?.user_role, 'Items:', filteredItems.length);
    return [...baseItems, ...filteredItems];
  };

  const hasAccessToItem = (item: NavItem, permissions: string[]): boolean => {
    // Check if user has access to this specific item
    const itemLabel = item.label;
    
    // Direct permission check
    if (permissions.includes(itemLabel)) {
      return true;
    }

    // Check submenu items
    if (item.hasSubmenu && item.submenuItems) {
      const accessibleSubmenus = item.submenuItems.filter(subItem => 
        hasAccessToSubItem(subItem, permissions)
      );
      
      if (accessibleSubmenus.length > 0) {
        // Return item with filtered submenus
        item.submenuItems = accessibleSubmenus;
        return true;
      }
    }

    return false;
  };

  const hasAccessToSubItem = (subItem: SubMenuItem, permissions: string[]): boolean => {
    if (permissions.includes(subItem.label)) {
      return true;
    }

    // Check nested submenus
    if (subItem.hasSubmenu && subItem.submenuItems) {
      const accessibleNestedSubmenus = subItem.submenuItems.filter(nestedItem => 
        hasAccessToSubItem(nestedItem, permissions)
      );
      
      if (accessibleNestedSubmenus.length > 0) {
        subItem.submenuItems = accessibleNestedSubmenus;
        return true;
      }
    }

    return false;
  };

  const convertToUserPropertyPath = (item: NavItem): NavItem => {
    const convertPath = (path: string): string => {
      if (path === '#') return '#';
      if (path.startsWith('/cadmin/')) {
        return path.replace('/cadmin/', '/user/');
      }
      return `/user${path}`;
    };

    const convertSubMenuItem = (subItem: SubMenuItem): SubMenuItem => {
      return {
        ...subItem,
        path: convertPath(subItem.path),
        submenuItems: subItem.submenuItems?.map(convertSubMenuItem)
      };
    };

    return {
      ...item,
      path: convertPath(item.path),
      submenuItems: item.submenuItems?.map(convertSubMenuItem)
    };
  };

  const getNavItems = (): NavItem[] => {
    console.log('🧭 SIDEBAR - Generating navigation items...');
    console.log('👥 User profile user_type:', userProfile?.user_type);
    console.log('👤 User context userType:', user?.userType);
    console.log('🎭 User role:', userProfile?.user_role);
    
    // Use role-based navigation
    return getRoleBasedNavItems(userProfile?.user_role || '');
  };

  const getAdminNavItems = (): NavItem[] => {
    console.log('👑 Generating ADMIN navigation items');
    const adminItems: NavItem[] = [
      { path: '/users', icon: <Users size={20} />, label: 'Users' },
      { path: '/properties', icon: <Building2 size={20} />, label: 'Properties' },
      { path: '/user-role-management', icon: <UserPlus size={20} />, label: 'User Role Management' },
      { path: '/tasks', icon: <Search size={20} />, label: 'Tasks' },
      {
        path: '#',
        icon: <Calendar size={20} />,
        label: 'Daily Task Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/daily-task-management-all-department', label: 'Daily Task Management of all department' },
          { 
            path: '#', 
            label: 'Daily logs of all department',
            hasSubmenu: true,
            submenuItems: [
              { path: '/daily-logs/fresh-water', label: 'Fresh Water' },
              { path: '/daily-logs/generator', label: 'Generator' },
              { path: '/daily-logs/stp', label: 'STP' },
              { path: '/daily-logs/wtp', label: 'WTP' },
              { path: '/daily-logs/swimming-pool', label: 'Swimming Pool' },
              // { path: '/daily-logs/diesel-generator', label: 'Diesel Generator' },
            ]
          },
          { path: '/daily-management-report', label: 'Daily Management Report' },
          { path: '/daily-reports', label: 'Daily Complete work Details ' },
        ]
      },
      {
        path: '#',
        icon: <Calendar size={20} />,
        label: 'Monthly Task Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/monthly-task-management', label: 'Monthly Checklist' },
          { path: '/monthly-management-report', label: 'Monthly Management Report' },
        ]
      },
      {
        path: '#',
        icon: <Calendar size={20} />,
        label: '52 Week',
        hasSubmenu: true,
        submenuItems: [
          { path: '/52-week-work-calendar', label: '52 Week Work Calendar' },
          { path: '/52-week-training-calendar', label: '52 week training calendar format' },
        ]
      },
      { path: '/incident-report', icon: <AlertTriangle size={20} />, label: 'Incident Report' },
      {
        path: '#',
        icon: <Shield size={20} />,
        label: 'Patrolling Report',
        hasSubmenu: true,
        submenuItems: [
          { path: '/site-security-patrolling-report', label: 'Site Security Patrolling Report' },
          { path: '/technical-team-patrolling-report', label: 'Facility or Technical team Patrolling Report' },
          { path: '/night-patrolling-report', label: 'Back-end team Patrolling Report' },
        ]
      },
      {
        path: '#',
        icon: <FileCheck size={20} />,
        label: 'Reports and Audit',
        hasSubmenu: true,
        submenuItems: [
          { path: '/audit-reports', label: 'Audit Reports' },
        ]
      },
        // Transition Management
      {
        path: '#',
        icon: <RefreshCw size={20} />,
        label: 'Transition Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/transition-checklists', label: 'Site Pre-Transition' },
          { path: '/post-transition-checklist', label: 'Post-Transition' },
        ]
      },
        // Gate Management
      {
        path: '#',
        icon: <Key size={20} />,
        label: 'Gate Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/inward-non-returnable', label: 'Inward – Non-Returnable' },
          { path: '/inward-returnable', label: 'Inward – Returnable' },
          { path: '/outward-non-returnable', label: 'Outward – Non-Returnable' },
          { path: '/outward-returnable', label: 'Outward – Returnable' },
          { path: '/move-in', label: 'Move-In' },
          { path: '/move-out', label: 'Move-Out' },
          { path: '/interior-work-tracking', label: 'Interior Work Tracking' },
          { path: '/work-permit-issuance', label: 'Work Permit Issuance' },
          { path: '/gate-pass-management', label: 'Gate Pass Management' },
          { path: '/blocklist-management', label: 'Blocklist Management' },
          { path: '/daily-entry-details', label: 'Daily Entry Details' },
          { path: '/water-tanker-management', label: 'Water Tanker Management' },
          { path: '/vendor-entry-management', label: 'Vendor Entry Management' },
          { path: '/sta-entry-management', label: 'Staff Entry Management' },
          { path: '/emergency-contact-details', label: 'Emergency Contact Details' },
        ]
      },
        // Helpdesk and Front Desk
      {
        path: '#',
        icon: <MessageSquare size={20} />,
        label: 'Helpdesk and Front Desk',
        hasSubmenu: true,
        submenuItems: [
          { path: '/tickets-management', label: 'Tickets Management' },
          { path: '/ticket-assignment', label: 'Ticket Assignment' },
          { path: '/notice-management', label: 'Notice Management' },
          { path: '/parking-sticker-management', label: 'Parking Sticker Management' },
          { path: '/communication-announcements', label: 'Communication & Announcements' },
          { path: '/move-in-coordination', label: 'Move-In Coordination' },
          { path: '/move-out-coordination', label: 'Move-Out Coordination' },
          { path: '/interior-work-approvals', label: 'Interior Work Approvals' },
          { path: '/work-permit-tracking', label: 'Work Permit Tracking' },
        ]
      },
        // Inventory Management
      {
        path: '#',
        icon: <Package size={20} />,
        label: 'Inventory Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/inventory-tracking', label: 'Inventory Tracking' },
          { path: '/stock-entry-issue', label: 'Stock Entry & Issue' },
          { path: '/min-max-level-monitoring', label: 'Minimum & Maximum Level Monitoring' },
          { path: '/consumption-reports', label: 'Consumption Reports' },
          { path: '/expiry-damage-log', label: 'Expiry & Damage Log' },
        ]
      },
        // Asset Management
      {
        path: '#',
        icon: <Database size={20} />,
        label: 'Asset Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/asset-tagging-management', label: 'Asset Tagging & Management' },
          { path: '/asset-movement-log', label: 'Asset Movement Log' },
          { path: '/amc-warranty-tracker', label: 'AMC & Warranty Tracker' },
          { path: '/maintenance-schedule', label: 'Maintenance Schedule' },
          { path: '/asset-audit', label: 'Asset Audit' },
          { path: '/depreciation-replacement', label: 'Depreciation & Replacement' },
        ]
      },
        // Project Management
      {
        path: '#',
        icon: <FolderOpen size={20} />,
        label: 'Project Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/project-management', label: 'All Project Management Dashboard' },
          { path: '/project-initiation', label: 'Project Initiation' },
          { path: '/project-planning', label: 'Project Planning' },
          { path: '/team-resource-allocation', label: 'Team Resource Allocation' },
          { path: '/execution-and-implementation', label: 'Execution and Implementation' },
          { path: '/monitoring-and-control', label: 'Monitoring and Control' },
          // { path: '/documentation-and-reporting', label: 'Documentation and Reporting' },
          { path: '/project-closure', label: 'Project Closure' },
        ]
      },
        // Quality and Process Management
      {
        path: '#',
        icon: <Award size={20} />,
        label: 'Quality and Process Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/quality-planning', label: 'Quality Planning' },
          { path: '/process-management-setup', label: 'Process Management Setup' },
          { path: '/quality-assurance', label: 'Quality Assurance' },
          { path: '/quality-control', label: 'Quality Control' },
          { path: '/performance-monitoring', label: 'Performance Monitoring' },
          { path: '/documentation-and-reporting', label: 'Documentation and Reporting' },
        ]
      },
        // CCTV Department
      {
        path: '#',
        icon: <Camera size={20} />,
        label: 'CCTV Department',
        hasSubmenu: true,
        submenuItems: [
          { path: '/site-assessment', label: 'Site Assessment' },
          { path: '/system-design-and-planning', label: 'System Design & Planning' },
          { path: '/installation-checklist', label: 'Installation Checklist' },
            { path: '/configuration-and-testing', label: 'Configuration and Testing' },
          { path: '/daily-operations-and-monitoring', label: 'Daily Operations & Monitoring' },
          { path: '/maintenance-schedule', label: 'Maintenance Schedule' },
          { path: '/documentation', label: 'Documentation' },
          { path: '/amc-and-compliance', label: 'AMC and Compliance' },
        ]
      },
        // Fire and Safety
      {
        path: '#',
        icon: <Flame size={20} />,
        label: 'Fire and Safety',
        hasSubmenu: true,
        submenuItems: [
          { path: '/site-assessment-and-planning', label: 'Site Assessment and Planning' },
          { path: '/installation-and-equipment-setup', label: 'Installation and Equipment Setup' },
          { path: '/fire-safety-documents', label: 'Fire Safety Documents' },
          { path: '/compliance-reports', label: 'Compliance Reports' },
          { path: '/fire-and-safety-training', label: 'Fire and Safety Training' },
          { path: '/daily-checklist', label: 'Daily Checklist' },
          { path: '/weekly-checklist', label: 'Weekly Checklist' },
          { path: '/monthly-checklist', label: 'Monthly Checklist' },
          { path: '/quarterly-checklist', label: 'Quarterly Checklist' },
          { path: '/emergency-preparedness-plan', label: 'Emergency Preparedness Plan' },
          { path: '/record-keeping', label: 'Record Keeping' },
        ]
      },
        // Procurement Management
      {
        path: '#',
        icon: <ShoppingCart size={20} />,
        label: 'Procurement Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/procurement-planning', label: 'Procurement Planning' },
          { path: '/vendor-management', label: 'Vendor Management' },
          { path: '/purchase-requisition-to-order', label: 'Purchase Requisition to Order' },
          { path: '/goods-receipt-and-inspection', label: 'Goods Receipt and Inspection' },
          { path: '/inventory-and-stock-management', label: 'Inventory and Stock Management' },
          { path: '/payment-tracking', label: 'Payment Tracking' },
          { path: '/procurement-documentation', label: 'Procurement Documentation' },
          { path: '/compliance-and-policy', label: 'Compliance and Policy' },
          { path: '/reporting-and-analysis', label: 'Reporting and Analysis' },
          { path: '/procurement-categories', label: 'Procurement Categories' },
        ]
      },
        // Vendor Management
      {
        path: '#',
        icon: <Handshake size={20} />,
        label: 'Vendor Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/vendor-master-management', label: 'Vendor Master Management' },
            { path: '/vendor-classification', label: 'Vendor Classification' },
          { path: '/vendor-evaluation', label: 'Vendor Evaluation' },
          { path: '/integration-with-purchase-process', label: 'Integration with Purchase Process' },
          { path: '/payment-tracking', label: 'Payment Tracking' },
          { path: '/vendor-relationship-management', label: 'Vendor Relationship Management' },
          { path: '/compliance-and-legal-check', label: 'Compliance and Legal Check' },
          { path: '/vendor-documentation', label: 'Vendor Documentation' },
          { path: '/reporting-and-analysis', label: 'Reporting and Analysis' },
        ]
      },
        // Service Level Agreement (SLA)
      {
        path: '#',
        icon: <FileText size={20} />,
        label: 'Service Level Agreement (SLA)',
        hasSubmenu: true,
        submenuItems: [
            { path: '/sla-planning-and-definition', label: 'SLA Planning and Definition' },
          { path: '/key-sla-components', label: 'Key SLA Components' },
          { path: '/sla-implementation', label: 'SLA Implementation' },
          { path: '/sla-monitoring', label: 'SLA Monitoring' },
          { path: '/sla-evaluation', label: 'SLA Evaluation' },
          { path: '/sla-renewal-and-exit-process', label: 'SLA Renewal and Exit Process' },
        ]
      },  
        // Key Performance Indicators (KPI)
      {
        path: '#',
        icon: <Target size={20} />,
        label: 'Key Performance Indicators (KPI)',
        hasSubmenu: true,
        submenuItems: [
          { path: '/kpi', label: 'KPI' },
        ]
      },
        // Raise Complaints and Solutions
      {
        path: '#',
        icon: <MessageSquare size={20} />,
        label: 'Raise Complaints and Solutions',
        hasSubmenu: true,
        submenuItems: [
          { path: '/complaint-management', label: 'Complaint' },
        ]
      },
        // Back-End Office Management
      {
        path: '#',
        icon: <Building size={20} />,
        label: 'Back-End Office Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/site-visit-reports', label: 'Site Visit Reports' },
          { path: '/training-reports', label: 'Training Reports' },
          { path: '/night-patrolling-reports', label: 'Night Patrolling Reports' },
          { path: '/minutes-of-meetings', label: 'Minutes of Meetings' },
          { path: '/escalation-matrix', label: 'Escalation Matrix' },
        ]
      },
        // Work Permit
      {
        path: '#',
        icon: <HardHat size={20} />,
        label: 'Work Permit',
        hasSubmenu: true,
        submenuItems: [
          { path: '/hot-work-permit', label: 'Hot Work Permit' },
          { path: '/cold-work-permit', label: 'Cold Work Permit' },
          { path: '/electrical-work-permit', label: 'Electrical Work Permit' },
          { path: '/height-work-permit', label: 'Height Work Permit' },
          { path: '/confined-space-work-permit', label: 'Confined Space Work Permit' },
          { path: '/excavation-permit', label: 'Excavation Permit' },
          { path: '/lockout-tagout-permit', label: 'Lockout Tagout Permit' },
          { path: '/chemical-work-permit', label: 'Chemical Work Permit' },
          { path: '/lift-work-permit', label: 'Lift Work Permit' },
          { path: '/demolition-work-permit', label: 'Demolition Work Permit' },
            { path: '/general-maintenance-work-permit', label: 'General Maintenance Work Permit' },
          { path: '/temporary-structure-work-permit', label: 'Temporary Structure Work Permit' },
          { path: '/vehicle-work-permit', label: 'Vehicle Work Permit' },
          { path: '/interior-work-permit', label: 'Interior Work Permit' },
          { path: '/working-alone-work-permit', label: 'Working Alone Work Permit' },
        ]
      },
        // All Reports
      {
        path: '#',
        icon: <BarChart3 size={20} />,
        label: 'All Reports',
        hasSubmenu: true,
        submenuItems: [
          { path: '#', label: 'All Department-Wise Reports' },
          { path: '#', label: 'Daily/Weekly/Monthly Summary Reports' },
          { path: '#', label: 'Audit & Checklist Reports' },
          { path: '#', label: 'Attendance & KPI Reports' },
          { path: '#', label: 'Custom Report Generator' },
          { path: '#', label: 'Exportable Reports (PDF/Excel)' },
        ]
      }
    ];

    return adminItems;
  };

  const getCadminNavItems = (): NavItem[] => {
    console.log('🏢 Generating CADMIN navigation items');
    const cadminItems: NavItem[] = [
      { path: '/cadmin/users', icon: <Users size={20} />, label: 'Users' },
      { path: '/cadmin/user-role-management', icon: <UserPlus size={20} />, label: 'User Role Management' },
      { path: '/cadmin/tasks', icon: <Search size={20} />, label: 'Tasks' },
      {
        path: '#',
        icon: <Calendar size={20} />,
        label: 'Daily Task Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '/cadmin/daily-task-management-all-department', label: 'Daily Task Management of all department' },
            { 
              path: '#', 
              label: 'Daily logs of all department',
              hasSubmenu: true,
              submenuItems: [
          { path: '/cadmin/daily-logs/fresh-water', label: 'Fresh Water' },
          { path: '/cadmin/daily-logs/generator', label: 'Generator' },
          { path: '/cadmin/daily-logs/stp', label: 'STP' },
          { path: '/cadmin/daily-logs/wtp', label: 'WTP' },
          { path: '/cadmin/daily-logs/swimming-pool', label: 'Swimming Pool' },
          // { path: '/cadmin/daily-logs/diesel-generator', label: 'Diesel Generator' },
        ]
      },
          { path: '/cadmin/daily-management-report', label: 'Daily Management Report' },
          { path: '/cadmin/daily-reports', label: 'Daily Complete work Details ' },
          ]
        },
        {
          path: '#',
          icon: <Calendar size={20} />,
          label: 'Monthly Task Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/monthly-task-management', label: 'Monthly Checklist' },
          { path: '/cadmin/monthly-management-report', label: 'Monthly Management Report' },
          ]
        },
        {
          path: '#',
          icon: <Calendar size={20} />,
          label: '52 Week',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/52-week-work-calendar', label: '52 Week Work Calendar' },
          { path: '/cadmin/52-week-training-calendar', label: '52 week training calendar format' },
          ]
        },
      { path: '/cadmin/incident-report', icon: <AlertTriangle size={20} />, label: 'Incident Report' },
        {
          path: '#',
          icon: <Shield size={20} />,
          label: 'Patrolling Report',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/site-security-patrolling-report', label: 'Site Security Patrolling Report' },
          { path: '/cadmin/technical-team-patrolling-report', label: 'Facility or Technical team Patrolling Report' },
          { path: '/cadmin/night-patrolling-report', label: 'Back-end team Patrolling Report' },
          ]
        },
        {
          path: '#',
          icon: <FileCheck size={20} />,
          label: 'Reports and Audit',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/audit-reports', label: 'Audit Reports' },
          ]
        },
        // Transition Management
        {
          path: '#',
          icon: <RefreshCw size={20} />,
          label: 'Transition Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/transition-checklists', label: 'Site Pre-Transition' },
          { path: '/cadmin/post-transition-checklist', label: 'Post-Transition' },
          ]
        },
        // Gate Management
        {
          path: '#',
          icon: <Key size={20} />,
          label: 'Gate Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/inward-non-returnable', label: 'Inward – Non-Returnable' },
          { path: '/cadmin/inward-returnable', label: 'Inward – Returnable' },
          { path: '/cadmin/outward-non-returnable', label: 'Outward – Non-Returnable' },
          { path: '/cadmin/outward-returnable', label: 'Outward – Returnable' },
          { path: '/cadmin/move-in', label: 'Move-In' },
          { path: '/cadmin/move-out', label: 'Move-Out' },
          { path: '/cadmin/interior-work-tracking', label: 'Interior Work Tracking' },
          { path: '/cadmin/work-permit-issuance', label: 'Work Permit Issuance' },
          { path: '/cadmin/gate-pass-management', label: 'Gate Pass Management' },
          { path: '/cadmin/blocklist-management', label: 'Blocklist Management' },
          { path: '/cadmin/daily-entry-details', label: 'Daily Entry Details' },
          { path: '/cadmin/water-tanker-management', label: 'Water Tanker Management' },
          { path: '/cadmin/vendor-entry-management', label: 'Vendor Entry Management' },
          { path: '/cadmin/sta-entry-management', label: 'Staff Entry Management' },
          { path: '/cadmin/emergency-contact-details', label: 'Emergency Contact Details' },
          ]
        },
        // Helpdesk and Front Desk
        {
          path: '#',
          icon: <MessageSquare size={20} />,
          label: 'Helpdesk and Front Desk',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/tickets-management', label: 'Tickets Management' },
          { path: '/cadmin/ticket-assignment', label: 'Ticket Assignment' },
          { path: '/cadmin/notice-management', label: 'Notice Management' },
          { path: '/cadmin/parking-sticker-management', label: 'Parking Sticker Management' },
          { path: '/cadmin/communication-announcements', label: 'Communication & Announcements' },
          { path: '/cadmin/move-in-coordination', label: 'Move-In Coordination' },
          { path: '/cadmin/move-out-coordination', label: 'Move-Out Coordination' },
          { path: '/cadmin/interior-work-approvals', label: 'Interior Work Approvals' },
          { path: '/cadmin/work-permit-tracking', label: 'Work Permit Tracking' },
          ]
        },
        // Inventory Management
        {
          path: '#',
          icon: <Package size={20} />,
          label: 'Inventory Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/inventory-tracking', label: 'Inventory Tracking' },
          { path: '/cadmin/stock-entry-issue', label: 'Stock Entry & Issue' },
          { path: '/cadmin/min-max-level-monitoring', label: 'Minimum & Maximum Level Monitoring' },
          { path: '/cadmin/consumption-reports', label: 'Consumption Reports' },
          { path: '/cadmin/expiry-damage-log', label: 'Expiry & Damage Log' },
          ]
        },
        // Asset Management
        {
          path: '#',
          icon: <Database size={20} />,
          label: 'Asset Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/asset-tagging-management', label: 'Asset Tagging & Management' },
          { path: '/cadmin/asset-movement-log', label: 'Asset Movement Log' },
          { path: '/cadmin/amc-warranty-tracker', label: 'AMC & Warranty Tracker' },
          { path: '/cadmin/maintenance-schedule', label: 'Maintenance Schedule' },
          { path: '/cadmin/asset-audit', label: 'Asset Audit' },
          { path: '/cadmin/depreciation-replacement', label: 'Depreciation & Replacement' },
          ]
        },
        // Project Management
        {
          path: '#',
          icon: <FolderOpen size={20} />,
          label: 'Project Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/project-management', label: 'All Project Management Dashboard' },
          { path: '/cadmin/project-initiation', label: 'Project Initiation' },
          { path: '/cadmin/project-planning', label: 'Project Planning' },
          { path: '/cadmin/team-resource-allocation', label: 'Team Resource Allocation' },
          { path: '/cadmin/execution-and-implementation', label: 'Execution and Implementation' },
          { path: '/cadmin/monitoring-and-control', label: 'Monitoring and Control' },
          // { path: '/cadmin/documentation-and-reporting', label: 'Documentation and Reporting' },
          { path: '/cadmin/project-closure', label: 'Project Closure' },
          ]
        },
        // Quality and Process Management
        {
          path: '#',
          icon: <Award size={20} />,
          label: 'Quality and Process Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/quality-planning', label: 'Quality Planning' },
          { path: '/cadmin/process-management-setup', label: 'Process Management Setup' },
          { path: '/cadmin/quality-assurance', label: 'Quality Assurance' },
          { path: '/cadmin/quality-control', label: 'Quality Control' },
          { path: '/cadmin/performance-monitoring', label: 'Performance Monitoring' },
          { path: '/cadmin/documentation-and-reporting', label: 'Documentation and Reporting' },
          ]
        },
        // CCTV Department
        {
          path: '#',
          icon: <Camera size={20} />,
          label: 'CCTV Department',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/site-assessment', label: 'Site Assessment' },
          { path: '/cadmin/system-design-and-planning', label: 'System Design & Planning' },
          { path: '/cadmin/installation-checklist', label: 'Installation Checklist' },
          { path: '/cadmin/configuration-and-testing', label: 'Configuration and Testing' },
          { path: '/cadmin/daily-operations-and-monitoring', label: 'Daily Operations & Monitoring' },
          { path: '/cadmin/maintenance-schedule', label: 'Maintenance Schedule' },
          { path: '/cadmin/documentation', label: 'Documentation' },
          { path: '/cadmin/amc-and-compliance', label: 'AMC and Compliance' },
          ]
        },
        // Fire and Safety
        {
          path: '#',
          icon: <Flame size={20} />,
          label: 'Fire and Safety',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/site-assessment-and-planning', label: 'Site Assessment and Planning' },
          { path: '/cadmin/installation-and-equipment-setup', label: 'Installation and Equipment Setup' },
          { path: '/cadmin/fire-safety-documents', label: 'Fire Safety Documents' },
          { path: '/cadmin/compliance-reports', label: 'Compliance Reports' },
          { path: '/cadmin/fire-and-safety-training', label: 'Fire and Safety Training' },
          { path: '/cadmin/daily-checklist', label: 'Daily Checklist' },
          { path: '/cadmin/weekly-checklist', label: 'Weekly Checklist' },
          { path: '/cadmin/monthly-checklist', label: 'Monthly Checklist' },
          { path: '/cadmin/quarterly-checklist', label: 'Quarterly Checklist' },
          { path: '/cadmin/emergency-preparedness-plan', label: 'Emergency Preparedness Plan' },
          { path: '/cadmin/record-keeping', label: 'Record Keeping' },
          ]
        },
        // Procurement Management
        {
          path: '#',
          icon: <ShoppingCart size={20} />,
          label: 'Procurement Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/procurement-planning', label: 'Procurement Planning' },
          { path: '/cadmin/vendor-management', label: 'Vendor Management' },
          { path: '/cadmin/purchase-requisition-to-order', label: 'Purchase Requisition to Order' },
          { path: '/cadmin/goods-receipt-and-inspection', label: 'Goods Receipt and Inspection' },
          { path: '/cadmin/inventory-and-stock-management', label: 'Inventory and Stock Management' },
          { path: '/cadmin/payment-tracking', label: 'Payment Tracking' },
          { path: '/cadmin/procurement-documentation', label: 'Procurement Documentation' },
          { path: '/cadmin/compliance-and-policy', label: 'Compliance and Policy' },
          { path: '/cadmin/reporting-and-analysis', label: 'Reporting and Analysis' },
          { path: '/cadmin/procurement-categories', label: 'Procurement Categories' },
          ]
        },
        // Vendor Management
        {
          path: '#',
          icon: <Handshake size={20} />,
          label: 'Vendor Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/vendor-master-management', label: 'Vendor Master Management' },
          { path: '/cadmin/vendor-classification', label: 'Vendor Classification' },
          { path: '/cadmin/vendor-evaluation', label: 'Vendor Evaluation' },
          { path: '/cadmin/integration-with-purchase-process', label: 'Integration with Purchase Process' },
          { path: '/cadmin/payment-tracking', label: 'Payment Tracking' },
          { path: '/cadmin/vendor-relationship-management', label: 'Vendor Relationship Management' },
          { path: '/cadmin/compliance-and-legal-check', label: 'Compliance and Legal Check' },
          { path: '/cadmin/vendor-documentation', label: 'Vendor Documentation' },
          { path: '/cadmin/reporting-and-analysis', label: 'Reporting and Analysis' },
          ]
        },
        // Service Level Agreement (SLA)
        {
          path: '#',
          icon: <FileText size={20} />,
          label: 'Service Level Agreement (SLA)',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/sla-planning-and-definition', label: 'SLA Planning and Definition' },
          { path: '/cadmin/key-sla-components', label: 'Key SLA Components' },
          { path: '/cadmin/sla-implementation', label: 'SLA Implementation' },
          { path: '/cadmin/sla-monitoring', label: 'SLA Monitoring' },
          { path: '/cadmin/sla-evaluation', label: 'SLA Evaluation' },
          { path: '/cadmin/sla-renewal-and-exit-process', label: 'SLA Renewal and Exit Process' },
          ]
        },  
        // Key Performance Indicators (KPI)
        {
          path: '#',
          icon: <Target size={20} />,
          label: 'Key Performance Indicators (KPI)',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/kpi', label: 'KPI' },
          ]
        },
        // Raise Complaints and Solutions
        {
          path: '#',
          icon: <MessageSquare size={20} />,
          label: 'Raise Complaints and Solutions',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/complaint-management', label: 'Complaint' },
          ]
        },
        // Back-End Office Management
        {
          path: '#',
          icon: <Building size={20} />,
          label: 'Back-End Office Management',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/site-visit-reports', label: 'Site Visit Reports' },
          { path: '/cadmin/training-reports', label: 'Training Reports' },
          { path: '/cadmin/night-patrolling-reports', label: 'Night Patrolling Reports' },
          { path: '/cadmin/minutes-of-meetings', label: 'Minutes of Meetings' },
          { path: '/cadmin/escalation-matrix', label: 'Escalation Matrix' },
          ]
        },
        // Work Permit
        {
          path: '#',
          icon: <HardHat size={20} />,
          label: 'Work Permit',
          hasSubmenu: true,
          submenuItems: [
          { path: '/cadmin/hot-work-permit', label: 'Hot Work Permit' },
          { path: '/cadmin/cold-work-permit', label: 'Cold Work Permit' },
          { path: '/cadmin/electrical-work-permit', label: 'Electrical Work Permit' },
          { path: '/cadmin/height-work-permit', label: 'Height Work Permit' },
          { path: '/cadmin/confined-space-work-permit', label: 'Confined Space Work Permit' },
          { path: '/cadmin/excavation-permit', label: 'Excavation Permit' },
          { path: '/cadmin/lockout-tagout-permit', label: 'Lockout Tagout Permit' },
          { path: '/cadmin/chemical-work-permit', label: 'Chemical Work Permit' },
          { path: '/cadmin/lift-work-permit', label: 'Lift Work Permit' },
          { path: '/cadmin/demolition-work-permit', label: 'Demolition Work Permit' },
          { path: '/cadmin/general-maintenance-work-permit', label: 'General Maintenance Work Permit' },
          { path: '/cadmin/temporary-structure-work-permit', label: 'Temporary Structure Work Permit' },
          { path: '/cadmin/vehicle-work-permit', label: 'Vehicle Work Permit' },
          { path: '/cadmin/interior-work-permit', label: 'Interior Work Permit' },
          { path: '/cadmin/working-alone-work-permit', label: 'Working Alone Work Permit' },
          ]
        },
        // All Reports
        {
          path: '#',
          icon: <BarChart3 size={20} />,
          label: 'All Reports',
          hasSubmenu: true,
          submenuItems: [
            { path: '#', label: 'All Department-Wise Reports' },
            { path: '#', label: 'Daily/Weekly/Monthly Summary Reports' },
            { path: '#', label: 'Audit & Checklist Reports' },
            { path: '#', label: 'Attendance & KPI Reports' },
            { path: '#', label: 'Custom Report Generator' },
            { path: '#', label: 'Exportable Reports (PDF/Excel)' },
          ]
        }
      ];

    return cadminItems;
  };

  const navItems = getNavItems();
  
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
            {userProfile?.user_type === 'admin' ? (
              <img src={logo} alt="Logo" className="h-30 w-30 mr-2" />
            ) : propertyLogo ? (
              <img src={propertyLogo} alt="Property Logo" className="h-10 w-10 mr-2 rounded-full object-cover border" />
            ) : (
              <span className="h-10 w-10 mr-2 flex items-center justify-center bg-gray-200 rounded-full"><User size={24} /></span>
            )}
            {/* <span className="text-[#000435]">PRK</span>
            <span className="text-[#E06002]">TECH</span> */}
          </Link>
        )}
        {isCollapsed && (
          <Link to="/dashboard" className="flex items-center text-xl font-bold">
            {userProfile?.user_type === 'admin' ? (
              <img src={logo} alt="Logo" className="h-10 w-10" />
            ) : propertyLogo ? (
              <img src={propertyLogo} alt="Property Logo" className="h-10 w-10 rounded-full object-cover border" />
            ) : (
              <span className="h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full"><User size={24} /></span>
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
            {/* Recursive Submenu rendering */}
            {item.hasSubmenu && openKeys.includes(`nav-${item.label}-${index}`) && item.submenuItems && !isCollapsed && (
              <SidebarSubMenu
                items={item.submenuItems}
                openKeys={openKeys}
                setOpenKeys={setOpenKeys}
                parentPath={`nav-${item.label}-${index}`}
                isCollapsed={isCollapsed}
                onClose={onClose}
                isMobile={isMobile}
                location={location}
              />
            )}
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

const SidebarSubMenu: React.FC<{
  items: SubMenuItem[];
  openKeys: string[];
  setOpenKeys: (keys: string[]) => void;
  parentPath?: string;
  isCollapsed: boolean;
  onClose: () => void;
  isMobile: boolean;
  location: any;
}> = ({ items, openKeys, setOpenKeys, parentPath = '', isCollapsed, onClose, isMobile, location }) => {
  const handleToggle = (path: string) => {
    if (openKeys.includes(path)) {
      setOpenKeys(openKeys.filter((k) => k !== path));
    } else {
      setOpenKeys([...openKeys, path]);
    }
  };

  return (
    <div className="ml-4">
      {items.map((item, index) => (
        <div key={`${parentPath}-${item.label}-${index}`} className="mb-1">
          <Link
            to={item.hasSubmenu ? '#' : item.path}
            className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
              location.pathname === item.path
                ? 'bg-orange-100 text-[#E06002]'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => {
              if (item.hasSubmenu) {
                handleToggle(`${parentPath}-${item.label}-${index}`);
              } else if (isMobile) {
                onClose();
              }
            }}
          >
            <span className="flex-1">{item.label}</span>
            {item.hasSubmenu && (
              <span className="ml-auto">
                {openKeys.includes(`${parentPath}-${item.label}-${index}`) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            )}
          </Link>
          {item.hasSubmenu && openKeys.includes(`${parentPath}-${item.label}-${index}`) && item.submenuItems && !isCollapsed && (
            <SidebarSubMenu
              items={item.submenuItems}
              openKeys={openKeys}
              setOpenKeys={setOpenKeys}
              parentPath={`${parentPath}-${item.label}-${index}`}
              isCollapsed={isCollapsed}
              onClose={onClose}
              isMobile={isMobile}
              location={location}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
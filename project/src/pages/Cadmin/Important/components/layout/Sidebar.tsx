import React, { useState, useEffect } from 'react';
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
  ChevronRight as ChevronRightIcon,
  User,
  Heart,
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
import { useAuth } from '../../../../../context/AuthContext';
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
        console.log('Current user ID:', user.userId);
        try {
          const response = await fetch(`https://server.prktechindia.in/profile/${user.userId}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const currentUserProfile = await response.json();
          console.log('API response data:', currentUserProfile);
          
          if (currentUserProfile) {
            setUserProfile(currentUserProfile);
                        if (currentUserProfile.user_type !== 'admin' && currentUserProfile.property_id) {
              try {
                const propRes = await fetch(`https:                if (propRes.ok) {
                  const propData = await propRes.json();
                  if (propData.logo_base64) {
                    setPropertyLogo(propData.logo_base64);
                  } else {
                    setPropertyLogo(null);
                  }
                } else {
                  setPropertyLogo(null);
                }
              } catch {
                setPropertyLogo(null);
              }
            } else {
              setPropertyLogo(null);
            }
          } else {
            console.log('No profile found for user ID:', user.userId);
            setUserProfile(null);
            setPropertyLogo(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setPropertyLogo(null);
        }
      } else {
        console.log('No user ID available');
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

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { path: '/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
      { path: '/profile', icon: <User size={20} />, label: 'Profile' },
    ];

    // If user is admin, show all admin items
    if (userProfile?.user_type === 'admin') {
    const adminItems: NavItem[] = [
      { path: '/users', icon: <Users size={20} />, label: 'Users' },
      { path: '/properties', icon: <Building2 size={20} />, label: 'Properties' },
        { path: '/property-user-management', icon: <UserPlus size={20} />, label: 'Property User Management' },
      { path: '/staff-categories', icon: <Users size={20} />, label: 'Staff Categories' },
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
              { path: '/daily-logs/diesel-generator', label: 'Diesel Generator' },
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
          { path: '#', label: 'Monthly Management Report' },
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
          { path: '/cadmin/project-management', label: 'All Project Management Dashboard' },
          { path: '/cadmin/project-initiation', label: 'Project Initiation' },
          { path: '/cadmin/project-planning', label: 'Project Planning' },
          { path: '/cadmin/team-resource-allocation', label: 'Team Resource Allocation' },
          { path: '/cadmin/execution-and-implementation', label: 'Execution and Implementation' },
          { path: '/cadmin/monitoring-and-control', label: 'Monitoring and Control' },
          { path: '/cadmin/documentation-and-reporting', label: 'Documentation and Reporting' },
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

      return [...baseItems, ...adminItems];
    }

    // If user is cadmin, show cadmin items
    if (userProfile?.user_type === 'cadmin') {
    const cadminItems: NavItem[] = [
      { path: '/cadmin/users', icon: <Users size={20} />, label: 'Users' },
      { 
        path: '/cadmin/daily-logs', 
        icon: <CheckSquare size={20} />, 
        label: 'Daily Logs',
        hasSubmenu: true,
        submenuItems: [ 
          { path: '/cadmin/daily-logs/fresh-water', label: 'Fresh Water' },
          { path: '/cadmin/daily-logs/generator', label: 'Generator' },
          { path: '/cadmin/daily-logs/stp', label: 'STP' },
          { path: '/cadmin/daily-logs/wtp', label: 'WTP' },
          { path: '/cadmin/daily-logs/swimming-pool', label: 'Swimming Pool' },
          { path: '/cadmin/daily-logs/diesel-generator', label: 'Diesel Generator' },
        ]
      },
      { path: '/cadmin/staff-categories', icon: <Users size={20} />, label: 'Staff Categories' },
      { path: '/cadmin/assets-management', icon: <Database size={20} />, label: 'Assets Management' },
      { path: '/cadmin/inventory-management', icon: <Package size={20} />, label: 'Inventory Management' },
      {
        path: '#',
        icon: <Calendar size={20} />,
        label: 'Daily Task Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '#', label: 'Daily Task Management of all department' },
          { path: '/tasks', label: 'Daily logs of all department' },
          { path: '#', label: 'Daily Management Report' },
          { path: '#', label: 'Daily Complete work Details ' },
        ]
      },
      {
        path: '#',
        icon: <Calendar size={20} />,
        label: 'Monthly Task Management',
        hasSubmenu: true,
        submenuItems: [
          { path: '#', label: 'Monthly Checklist' },
          { path: '#', label: 'Monthly Management Report' },
        ]
      },
      {
        path: '#',
        icon: <Calendar size={20} />,
        label: '52 Week',
        hasSubmenu: true,
        submenuItems: [
          { path: '#', label: '52 Week Work Calendar' },
          { path: '#', label: '52 week training calendar format' },
        ]
      },
      { path: '/incident-report', icon: <AlertTriangle size={20} />, label: 'Incident Report' },
      {
        path: '#',
        icon: <Shield size={20} />,
        label: 'Patrolling Report',
        hasSubmenu: true,
        submenuItems: [
          { path: '#', label: 'Site Security Patrolling Report' },
          { path: '#', label: 'Facility or Technical team Patrolling Report' },
          { path: '#', label: 'Back-end team Patrolling Report' },
        ]
      },
      {
        path: '#',
        icon: <FileCheck size={20} />,
        label: 'Reports and Audit',
        hasSubmenu: true,
        submenuItems: [
          {
            path: '#',
            label: 'Departmental Reporting and Audit',
            hasSubmenu: true,
            submenuItems: [
              {
                path: '#',
                label: 'FMS Department',
                hasSubmenu: true,
                submenuItems: [
                  {
                    path: '#',
                    label: 'Housekeeping and Waste Management',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Chute Room Audit' },
                      { path: '#', label: 'OWC Audit' },
                    ]
                  },
                  {
                    path: '#',
                    label: 'Landscaping and Gardening Maintenance',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Landscaping and Garden Audit' },
                    ]
                  },
                  {
                    path: '#',
                    label: 'Pest Control',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Pest Control Audit' },
                    ]
                  },
                  {
                    path: '#',
                    label: 'Carpet and Upholstery',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Carpet and Upholstery Audit' },
                    ]
                  },
                  {
                    path: '#',
                    label: 'Common Area Management',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Common Area Housekeeping Audit' },
                    ]
                  },
                  {
                    path: '#',
                    label: 'Restroom Hygiene Management',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Restroom Hygiene Management Audit' },
                    ]
                  },
                  {
                    path: '#',
                    label: 'Pantry Service',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Pantry Service Audit' },
                    ]
                  },
                  {
                    path: '#',
                    label: 'Civil Maintenance',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Civil Audit Format' },
                    ]
                  },
                ]
              },
              {
                path: '#',
                label: 'Technical Department',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'BMS (Building Management Software)' },
                  { path: '#', label: 'Booster Pump Audit' },
                  { path: '#', label: 'CCTV System' },
                  { path: '#', label: 'Electrical Department' },
                  { path: '#', label: 'Fire Protection System' },
                  { path: '#', label: 'Intercom System Audit Report' },
                  { path: '#', label: 'Plumbing Department' },
                  { path: '#', label: 'Storm Water System Audit' },
                  { path: '#', label: 'STP Audit Format' },
                  { path: '#', label: 'Swimming Pool Plant Audit Format' },
                  { path: '#', label: 'WTP Audit Format' },
                ]
              },
              {
                path: '#',
                label: 'Administration Department',
                hasSubmenu: true,
                submenuItems: [
                  {
                    path: '#',
                    label: 'Front Office and Reception',
                    hasSubmenu: true,
                    submenuItems: [
                      { path: '#', label: 'Attendance and Leave Management' },
                      { path: '#', label: 'HR Coordination and Payroll Support' },
                      { path: '#', label: 'Procurement and Inventory' },
                      { path: '#', label: 'Record Keeping and Documents' },
                      { path: '#', label: 'Client Coordinator' },
                      { path: '#', label: 'Vendor Management' },
                      { path: '#', label: 'Office Supply Management' },
                      { path: '#', label: 'Transport & Courier Services' },
                      { path: '#', label: 'Staff Verification' },
                    ]
                  },
                ]
              },
              {
                path: '#',
                label: 'Security Department',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Guarding Manpower' },
                  { path: '#', label: 'Patrol Team (Day and Night)' },
                  { path: '#', label: 'Control Room Monitoring' },
                  { path: '#', label: 'Access Control Operations' },
                  { path: '#', label: 'Risk Management' },
                  { path: '#', label: 'Visitor Management' },
                  { path: '#', label: 'Fire and Emergency Response Team' },
                  { path: '#', label: 'CCTV Monitoring' },
                  { path: '#', label: 'Escort and Protocol Security' },
                  { path: '#', label: 'Training and Drill Coordinator' },
                  { path: '#', label: 'Security New Site Survey' },
                  { path: '#', label: 'Residents Vehicle Parking Verification' },
                ]
              },
              {
                path: '#',
                label: 'Common Snag Audit',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Basement Audit' },
                  { path: '#', label: 'Common Snag Audit Format' },
                  { path: '#', label: 'EHS Audit' },
                  { path: '#', label: 'Helipad Audit' },
                  { path: '#', label: 'Multi-Level Parking' },
                  { path: '#', label: 'Safety Audit' },
                  { path: '#', label: 'Tower Snag Audit' },
                ]
              },
            ]
          },
          {
            path: '#',
            label: 'Internal Audit',
            hasSubmenu: true,
            submenuItems: [
              {
                path: '#',
                label: 'Security Department',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Security Deployment Internal Audit' },
                  { path: '#', label: 'Access Control Internal Audit' },
                  { path: '#', label: 'Patrol Logs' },
                  { path: '#', label: 'CCTV Monitoring' },
                  { path: '#', label: 'Incident Management' },
                  { path: '#', label: 'Escort and Protocol' },
                  { path: '#', label: 'Control Room' },
                ]
              },
              {
                path: '#',
                label: 'Facility and Soft Services',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Carpet and Upholstery Internal Audit' },
                  { path: '#', label: 'Cleaning Checklist Internal Audit' },
                  { path: '#', label: 'Common Area Internal Audit' },
                  { path: '#', label: 'Pantry Services Internal Audit' },
                  { path: '#', label: 'Pest Control Internal Audit' },
                  { path: '#', label: 'Restroom Hygiene Audit' },
                  { path: '#', label: 'Waste Management Internal Audit' },
                ]
              },
              {
                path: '#',
                label: 'Fire and Safety',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Fire Extinguisher Internal Audit' },
                  { path: '#', label: 'Fire Alarm Panel Internal Audit' },
                  { path: '#', label: 'Emergency Exit Audit Format' },
                  { path: '#', label: 'Fire Drill Audit' },
                  { path: '#', label: 'First Aid Kit Internal Audit' },
                ]
              },
              {
                path: '#',
                label: 'Technical and Maintenance',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Electrical Systems – Internal Audit Format' },
                  { path: '#', label: 'STP/WTP – Internal Audit Format' },
                  { path: '#', label: 'DG Set – Internal Audit Format' },
                  { path: '#', label: 'Lift/HVAC – Internal Audit Format' },
                  { path: '#', label: 'Tools & Equipment – Internal Audit Format' },
                  { path: '#', label: 'Plumbing Systems – Internal Audit Format' },
                ]
              },
              {
                path: '#',
                label: 'Back-End Office',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Attendance & Leave Audit Format' },
                  { path: '#', label: 'ID Cards Verification Audit Format' },
                  { path: '#', label: 'Payroll Processing Audit Format' },
                  { path: '#', label: 'Staff Record Verification Audit Format' },
                  { path: '#', label: 'Office Supplies Audit Format' },
                  { path: '#', label: 'Stationery & Inventory Stock Audit Format' },
                ]
              },
              {
                path: '#',
                label: 'Finance and Procurement',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'Invoice Processing Audit – PO vs GRN vs Invoice Matching' },
                  { path: '#', label: 'Petty Cash Audit Format' },
                  { path: '#', label: 'Vendor Payment Compliance Audit Format' },
                  { path: '#', label: 'Contract AMC Management Audit Format' },
                  { path: '#', label: 'Inventory Audit Format – Inward vs Outward vs Physical Stock' },
                  { path: '#', label: 'Budget Control & Site-Wise Expense Audit Format' },
                ]
              },
              {
                path: '#',
                label: 'IT and Digital Tools',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'FMS Software Internal Audit Format' },
                  { path: '#', label: 'Biometric CCTV Internal Audit Format' },
                  { path: '#', label: 'Visitor App QR Tools Internal Audit Format' },
                  { path: '#', label: 'Data Security Audit Format' },
                ]
              },
              {
                path: '#',
                label: 'Compliance and Documents',
                hasSubmenu: true,
                submenuItems: [
                  { path: '#', label: 'ISO Legal Documents Audit Format' },
                  { path: '#', label: 'Site Agreement Audit Format' },
                  { path: '#', label: 'Training Logs Audit Format' },
                  { path: '#', label: 'Escalation Record Audit Format' },
                  { path: '#', label: 'Client Feedback Audit Format' },
                ]
              },
            ]
          },
          {
            path: '#',
            label: 'Compliance Audit',
            hasSubmenu: true,
            submenuItems: [
              { path: '#', label: 'Statutory and Compliance Details' },
              { path: '#', label: 'HR & Manpower Compliance' },
              { path: '#', label: 'Finance & Tax Compliance Audit Format' },
              { path: '#', label: 'Site Operations & Safety Compliance' },
            ]
          },
          {
            path: '#',
            label: 'New Site Proposal Audit',
            hasSubmenu: true,
            submenuItems: [
              { path: '#', label: 'Security New Site Proposal' },
              { path: '#', label: 'Facility New Site Proposal' },
            ]
          },
        ]
        }
      ];

      return [...baseItems, ...cadminItems];
    }

        if (userProfile?.user_type === 'property_user' && userProfile?.property_id) {
      const propertyUserItems: NavItem[] = [
        { path: '/users', icon: <Users size={20} />, label: 'Users' },
        { path: '/properties', icon: <Building2 size={20} />, label: 'Properties' },
        { path: '/staff-categories', icon: <Users size={20} />, label: 'Staff Categories' },
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
                { path: '/daily-logs/diesel-generator', label: 'Diesel Generator' },
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
            { path: '#', label: 'Monthly Management Report' },
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
            { path: '/documentation-and-reporting', label: 'Documentation and Reporting' },
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

      return [...baseItems, ...propertyUserItems];
    }

    // Default case: return base items
    return baseItems;
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